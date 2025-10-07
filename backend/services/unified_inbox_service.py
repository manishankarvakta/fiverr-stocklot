"""
Unified Inbox Service
Comprehensive messaging system for all user roles
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from inbox_models.inbox_models import (
    Conversation, Message, ConversationType, MessageVisibility,
    SystemMessageType, Participant, PerUser, ReadMark, Attachment,
    ConversationListItem, InboxSummary, LinkedObject
)
from services.pii_service import PIIService
from services.sse_service import sse_service, InboxEvents
import uuid

logger = logging.getLogger(__name__)

class UnifiedInboxService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.pii_service = PIIService()
    
    async def ensure_conversation(self, 
                                type: ConversationType,
                                subject: str,
                                participants: List[Dict[str, Any]],
                                order_group_id: Optional[str] = None,
                                buy_request_id: Optional[str] = None,
                                offer_id: Optional[str] = None,
                                consignment_id: Optional[str] = None) -> str:
        """
        Create or get existing conversation by linkage
        Returns conversation ID
        """
        try:
            # Build query to find existing conversation by linkage
            query = {"type": type.value}
            if order_group_id:
                query["order_group_id"] = order_group_id
            if buy_request_id:
                query["buy_request_id"] = buy_request_id
            if offer_id:
                query["offer_id"] = offer_id
            if consignment_id:
                query["consignment_id"] = consignment_id
            
            # Try to find existing conversation
            existing = await self.db.conversations.find_one(query)
            if existing:
                return existing["id"]
            
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            
            # Build participants list
            participants_list = []
            per_user_list = []
            
            for p in participants:
                participant = {
                    "user_id": p["user_id"],
                    "org_id": p.get("org_id"),
                    "role": p["role"],
                    "joined_at": datetime.now(timezone.utc)
                }
                participants_list.append(participant)
                
                # Initialize per-user state
                per_user_list.append({
                    "user_id": p["user_id"],
                    "unread_count": 0,
                    "muted": False,
                    "archived": False,
                    "deleted": False
                })
            
            conversation = {
                "id": conversation_id,
                "type": type.value,
                "order_group_id": order_group_id,
                "buy_request_id": buy_request_id,
                "offer_id": offer_id,
                "consignment_id": consignment_id,
                "subject": subject,
                "participants": participants_list,
                "per_user": per_user_list,
                "last_message_at": None,
                "last_message_preview": None,
                "last_sender_id": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.db.conversations.insert_one(conversation)
            
            # Notify participants about new conversation
            participant_ids = [p["user_id"] for p in participants]
            sse_service.push_to_multiple_users(
                participant_ids,
                InboxEvents.CONVERSATION_CREATED,
                {"conversation_id": conversation_id, "subject": subject}
            )
            
            logger.info(f"Created conversation {conversation_id} of type {type.value}")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Error ensuring conversation: {e}")
            raise
    
    async def get_inbox(self, 
                       user_id: str, 
                       bucket: str = "ALL", 
                       page: int = 1, 
                       page_size: int = 20) -> List[ConversationListItem]:
        """
        Get paginated inbox for user with bucket filtering
        """
        try:
            # Build query
            query = {
                "per_user.user_id": user_id,
                "per_user.deleted": {"$ne": True}
            }
            
            # Apply bucket filter
            if bucket == "ORDERS":
                query["type"] = ConversationType.ORDER.value
            elif bucket == "OFFERS":
                query["type"] = ConversationType.OFFER.value
            elif bucket == "REQUESTS":
                query["type"] = ConversationType.BUY_REQUEST.value
            elif bucket == "LOGISTICS":
                query["type"] = ConversationType.CONSIGNMENT.value
            elif bucket == "SYSTEM":
                query["type"] = ConversationType.SYSTEM.value
            
            # Get conversations with pagination
            conversations = await self.db.conversations.find(query)\
                .sort("last_message_at", -1)\
                .skip((page - 1) * page_size)\
                .limit(page_size)\
                .to_list(length=None)
            
            # Convert to API response format
            result = []
            for conv in conversations:
                # Get user-specific state
                user_state = next((pu for pu in conv.get("per_user", []) if pu["user_id"] == user_id), {})
                
                # Build linked object info
                linked = None
                if conv.get("order_group_id"):
                    linked = LinkedObject(kind="ORDER", id=conv["order_group_id"])
                elif conv.get("buy_request_id"):
                    linked = LinkedObject(kind="BUY_REQUEST", id=conv["buy_request_id"])
                elif conv.get("offer_id"):
                    linked = LinkedObject(kind="OFFER", id=conv["offer_id"])
                elif conv.get("consignment_id"):
                    linked = LinkedObject(kind="CONSIGNMENT", id=conv["consignment_id"])
                
                # Simplify participants for API response
                participants = []
                for p in conv.get("participants", []):
                    # TODO: Fetch user names and avatars
                    participants.append({
                        "id": p["user_id"],
                        "name": "User",  # TODO: Fetch actual name
                        "role": p["role"],
                        "avatar": None
                    })
                
                item = ConversationListItem(
                    id=conv["id"],
                    subject=conv["subject"],
                    type=ConversationType(conv["type"]),
                    linked=linked,
                    participants=participants,
                    last_message_preview=conv.get("last_message_preview"),
                    last_message_at=conv.get("last_message_at"),
                    unread_count=user_state.get("unread_count", 0),
                    muted=user_state.get("muted", False),
                    archived=user_state.get("archived", False)
                )
                result.append(item)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting inbox for user {user_id}: {e}")
            raise
    
    async def get_conversation(self, conversation_id: str, user_id: str) -> Dict[str, Any]:
        """Get conversation details for user"""
        try:
            conversation = await self.db.conversations.find_one({"id": conversation_id})
            if not conversation:
                raise ValueError("Conversation not found")
            
            # Check if user is participant
            user_state = next((pu for pu in conversation.get("per_user", []) if pu["user_id"] == user_id and not pu.get("deleted")), None)
            if not user_state:
                raise ValueError("Access denied")
            
            # Remove MongoDB ObjectId to avoid serialization issues
            if "_id" in conversation:
                del conversation["_id"]
            
            # Convert datetime objects to ISO strings for JSON serialization
            for field in ["created_at", "updated_at", "last_message_at"]:
                if field in conversation and hasattr(conversation[field], 'isoformat'):
                    conversation[field] = conversation[field].isoformat()
            
            # Convert datetime in participants
            for participant in conversation.get("participants", []):
                for field in ["joined_at", "left_at"]:
                    if field in participant and hasattr(participant[field], 'isoformat'):
                        participant[field] = participant[field].isoformat()
            
            return conversation
            
        except Exception as e:
            logger.error(f"Error getting conversation {conversation_id}: {e}")
            raise
    
    async def get_messages(self, 
                          conversation_id: str, 
                          user_id: str, 
                          page: int = 1, 
                          page_size: int = 50) -> List[Dict[str, Any]]:
        """Get paginated messages for conversation"""
        try:
            # Verify access
            await self.get_conversation(conversation_id, user_id)
            
            # Get messages
            messages = await self.db.messages.find({
                "conversation_id": conversation_id,
                "visibility": {"$ne": MessageVisibility.HIDDEN.value}
            }).sort("created_at", 1)\
              .skip((page - 1) * page_size)\
              .limit(page_size)\
              .to_list(length=None)
            
            # Add sender info and check if message is from current user
            for msg in messages:
                # Remove MongoDB ObjectId to avoid serialization issues
                if "_id" in msg:
                    del msg["_id"]
                
                msg["isMine"] = msg["sender_id"] == user_id
                
                # Convert datetime objects to ISO strings for JSON serialization
                for field in ["created_at", "updated_at"]:
                    if field in msg and hasattr(msg[field], 'isoformat'):
                        msg[field] = msg[field].isoformat()
                
                # Convert datetime in read_by and delivered_to
                for read_mark in msg.get("read_by", []):
                    if "at" in read_mark and hasattr(read_mark["at"], 'isoformat'):
                        read_mark["at"] = read_mark["at"].isoformat()
                
                for delivery_mark in msg.get("delivered_to", []):
                    if "at" in delivery_mark and hasattr(delivery_mark["at"], 'isoformat'):
                        delivery_mark["at"] = delivery_mark["at"].isoformat()
                
                # TODO: Add sender name/avatar lookup
            
            return messages
            
        except Exception as e:
            logger.error(f"Error getting messages for conversation {conversation_id}: {e}")
            raise
    
    async def send_message(self, 
                          conversation_id: str, 
                          sender_id: str, 
                          body: str = "", 
                          attachments: Optional[List[Attachment]] = None,
                          system_type: Optional[SystemMessageType] = None,
                          meta: Optional[Dict[str, Any]] = None) -> str:
        """Send a message to conversation"""
        try:
            # Get conversation and verify access
            conversation = await self.get_conversation(conversation_id, sender_id)
            
            # For non-system messages, apply PII filtering
            visibility = MessageVisibility.VISIBLE
            redaction_reason = None
            
            if not system_type:
                # Check if PII should be blocked (pre-escrow)
                pre_escrow_blocked = self.pii_service.is_pre_escrow_blocked(
                    conversation.get("order_group_id")
                )
                
                if pre_escrow_blocked:
                    pii_result = self.pii_service.scrub_pii(body)
                    if pii_result["redacted"]:
                        body = pii_result["body"]
                        visibility = MessageVisibility.REDACTED
                        redaction_reason = "PII_PRE_ESCROW"
                
                # Check attachments
                if attachments:
                    attachment_check = self.pii_service.scan_attachments([att.dict() for att in attachments])
                    if not attachment_check["allowed"]:
                        raise ValueError(f"Attachment blocked: {attachment_check['reason']}")
            
            # Create message
            message_id = str(uuid.uuid4())
            message = {
                "id": message_id,
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "body": body,
                "attachments": [att.dict() for att in (attachments or [])],
                "system_type": system_type.value if system_type else None,
                "meta": meta,
                "visibility": visibility.value,
                "redaction_reason": redaction_reason,
                "read_by": [],
                "delivered_to": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await self.db.messages.insert_one(message)
            
            # Update conversation
            preview = body[:100] + "..." if len(body) > 100 else body
            if not preview and attachments:
                preview = f"[{len(attachments)} attachment(s)]"
            
            # Update unread counts for other participants
            update_operations = []
            participant_ids = []
            
            for pu in conversation["per_user"]:
                if pu["user_id"] != sender_id:
                    pu["unread_count"] = pu.get("unread_count", 0) + 1
                    participant_ids.append(pu["user_id"])
            
            await self.db.conversations.update_one(
                {"id": conversation_id},
                {
                    "$set": {
                        "last_message_at": message["created_at"],
                        "last_message_preview": preview,
                        "last_sender_id": sender_id,
                        "per_user": conversation["per_user"],
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Send real-time notifications
            sse_service.push_to_multiple_users(
                participant_ids,
                InboxEvents.MESSAGE_NEW,
                {
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                    "sender_id": sender_id,
                    "preview": preview
                }
            )
            
            logger.info(f"Sent message {message_id} to conversation {conversation_id}")
            return message_id
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise
    
    async def mark_conversation_read(self, conversation_id: str, user_id: str) -> None:
        """Mark conversation as read for user"""
        try:
            # Update conversation unread count
            await self.db.conversations.update_one(
                {"id": conversation_id, "per_user.user_id": user_id},
                {"$set": {"per_user.$.unread_count": 0}}
            )
            
            # Mark all messages as read
            await self.db.messages.update_many(
                {
                    "conversation_id": conversation_id,
                    "read_by.user_id": {"$ne": user_id}
                },
                {
                    "$push": {
                        "read_by": {
                            "user_id": user_id,
                            "at": datetime.now(timezone.utc)
                        }
                    }
                }
            )
            
            # Send real-time update
            sse_service.push_to_user(
                user_id,
                InboxEvents.MESSAGE_READ,
                {"conversation_id": conversation_id}
            )
            
        except Exception as e:
            logger.error(f"Error marking conversation read: {e}")
            raise
    
    async def update_conversation(self, 
                                 conversation_id: str, 
                                 user_id: str,
                                 muted: Optional[bool] = None,
                                 archived: Optional[bool] = None) -> None:
        """Update conversation settings for user"""
        try:
            updates = {}
            if muted is not None:
                updates["per_user.$.muted"] = muted
            if archived is not None:
                updates["per_user.$.archived"] = archived
            
            if updates:
                await self.db.conversations.update_one(
                    {"id": conversation_id, "per_user.user_id": user_id},
                    {"$set": updates}
                )
            
        except Exception as e:
            logger.error(f"Error updating conversation: {e}")
            raise
    
    async def get_inbox_summary(self, user_id: str) -> InboxSummary:
        """Get unread counts by bucket"""
        try:
            # Aggregate unread counts by conversation type
            pipeline = [
                {
                    "$match": {
                        "per_user.user_id": user_id,
                        "per_user.deleted": {"$ne": True}
                    }
                },
                {
                    "$unwind": "$per_user"
                },
                {
                    "$match": {
                        "per_user.user_id": user_id,
                        "per_user.unread_count": {"$gt": 0}
                    }
                },
                {
                    "$group": {
                        "_id": "$type",
                        "unread_count": {"$sum": "$per_user.unread_count"}
                    }
                }
            ]
            
            results = await self.db.conversations.aggregate(pipeline).to_list(length=None)
            
            summary = InboxSummary()
            for result in results:
                count = result["unread_count"]
                summary.total_unread += count
                
                if result["_id"] == ConversationType.ORDER.value:
                    summary.orders_unread = count
                elif result["_id"] == ConversationType.OFFER.value:
                    summary.offers_unread = count
                elif result["_id"] == ConversationType.BUY_REQUEST.value:
                    summary.requests_unread = count
                elif result["_id"] == ConversationType.CONSIGNMENT.value:
                    summary.logistics_unread = count
                elif result["_id"] == ConversationType.SYSTEM.value:
                    summary.system_unread = count
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting inbox summary: {e}")
            raise
    
    # System message helpers
    async def send_system_message(self, 
                                 conversation_id: str,
                                 system_type: SystemMessageType,
                                 message: str,
                                 meta: Optional[Dict[str, Any]] = None) -> str:
        """Send a system message to conversation"""
        return await self.send_message(
            conversation_id=conversation_id,
            sender_id="system",  # Special system sender
            body=message,
            system_type=system_type,
            meta=meta
        )
    
    # Conversation creation helpers for business events
    async def create_order_conversation(self, order_group_id: str, buyer_id: str, seller_id: str, order_title: str) -> str:
        """Create conversation for order"""
        return await self.ensure_conversation(
            type=ConversationType.ORDER,
            subject=f"Order: {order_title}",
            participants=[
                {"user_id": buyer_id, "role": "BUYER"},
                {"user_id": seller_id, "role": "SELLER"}
            ],
            order_group_id=order_group_id
        )
    
    async def create_offer_conversation(self, offer_id: str, buyer_id: str, seller_id: str, request_title: str) -> str:
        """Create conversation for offer"""
        return await self.ensure_conversation(
            type=ConversationType.OFFER,
            subject=f"Offer: {request_title}",
            participants=[
                {"user_id": buyer_id, "role": "BUYER"},
                {"user_id": seller_id, "role": "SELLER"}
            ],
            offer_id=offer_id
        )
    
    async def create_buy_request_conversation(self, buy_request_id: str, buyer_id: str, seller_id: str, request_title: str) -> str:
        """Create conversation for buy request"""
        return await self.ensure_conversation(
            type=ConversationType.BUY_REQUEST,
            subject=f"Buy Request: {request_title}",
            participants=[
                {"user_id": buyer_id, "role": "BUYER"},
                {"user_id": seller_id, "role": "SELLER"}
            ],
            buy_request_id=buy_request_id
        )
    
    async def create_consignment_conversation(self, consignment_id: str, buyer_id: str, seller_id: str, transporter_id: str, consignment_title: str) -> str:
        """Create conversation for consignment/delivery"""
        return await self.ensure_conversation(
            type=ConversationType.CONSIGNMENT,
            subject=f"Delivery: {consignment_title}",
            participants=[
                {"user_id": buyer_id, "role": "BUYER"},
                {"user_id": seller_id, "role": "SELLER"},
                {"user_id": transporter_id, "role": "TRANSPORTER"}
            ],
            consignment_id=consignment_id
        )