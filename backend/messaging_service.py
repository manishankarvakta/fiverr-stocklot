# 💬 MESSAGING SERVICE
# Complete messaging system with anti-bypass protection

import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

class MessagingService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def redact_contacts(self, text: str) -> Dict[str, Any]:
        """Redact phone numbers, emails, and URLs from text"""
        if not text:
            return {"text": "", "redacted": False}
        
        redacted = False
        patterns = [
            (r'\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b', 'email'),
            (r'\b(?:\+?\d[\s-]?){7,}\b', 'phone'),
            (r'\b(?:https?://|www\.)\S+', 'url'),
            (r'\b\d{10,11}\b', 'phone_number'),  # Raw phone numbers
            (r'whatsapp', 'contact_app'),  # WhatsApp mentions
            (r'telegram', 'contact_app'),  # Telegram mentions
        ]
        
        result = text
        for pattern, contact_type in patterns:
            if re.search(pattern, result, re.IGNORECASE):
                redacted = True
                result = re.sub(pattern, '•••', result, flags=re.IGNORECASE)
        
        return {"text": result, "redacted": redacted}

    async def create_or_get_thread(self, context_type: str, context_id: str, created_by: str, participants: Optional[List[dict]] = None) -> Dict[str, Any]:
        """Create or get existing message thread"""
        try:
            # Check if thread exists
            existing_thread = await self.db.message_threads.find_one({
                "context_type": context_type,
                "context_id": context_id
            })
            
            if existing_thread:
                return {"ok": True, "id": existing_thread["id"]}
            
            # Create new thread
            thread_id = str(uuid.uuid4())
            thread_doc = {
                "id": thread_id,
                "context_type": context_type,
                "context_id": context_id,
                "created_by": created_by,
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.db.message_threads.insert_one(thread_doc)
            
            # Add participants
            if participants:
                participant_docs = []
                for p in participants:
                    participant_docs.append({
                        "thread_id": thread_id,
                        "user_id": p.get("user_id"),
                        "role": p.get("role", "OBSERVER"),
                        "last_read_at": None
                    })
                await self.db.message_participants.insert_many(participant_docs)
            
            return {"ok": True, "id": thread_id}
            
        except Exception as e:
            logger.error(f"Error creating thread: {e}")
            raise

    async def send_message(self, thread_id: str, sender_id: str, body: Optional[str] = None, 
                         attachments: Optional[List[dict]] = None) -> Dict[str, Any]:
        """Send a message to a thread with anti-bypass protection"""
        try:
            # Verify sender is participant
            participant = await self.db.message_participants.find_one({
                "thread_id": thread_id,
                "user_id": sender_id
            })
            
            if not participant:
                raise Exception("Not a thread participant")
            
            # Validate message
            if not body and not attachments:
                raise Exception("Empty message")
            
            # Content moderation (redact contacts)
            redacted_content = self.redact_contacts(body or "")
            
            # Create message
            message_id = str(uuid.uuid4())
            message_doc = {
                "id": message_id,
                "thread_id": thread_id,
                "sender_id": sender_id,
                "body": redacted_content["text"],
                "attachments": attachments or [],
                "redacted": redacted_content["redacted"],
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.db.messages.insert_one(message_doc)
            
            # Notify other participants
            await self.notify_thread_participants(thread_id, sender_id, message_doc)
            
            return {
                "ok": True, 
                "id": message_id,
                "created_at": message_doc["created_at"],
                "redacted": redacted_content["redacted"]
            }
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise

    async def get_thread_messages(self, thread_id: str, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get paginated messages for a thread"""
        try:
            # Verify user is participant
            participant = await self.db.message_participants.find_one({
                "thread_id": thread_id,
                "user_id": user_id
            })
            
            if not participant:
                raise Exception("Not a thread participant")
            
            # Get messages
            messages = await self.db.messages.find({
                "thread_id": thread_id
            }).sort("created_at", -1).skip(offset).limit(limit).to_list(length=None)
            
            return {"messages": messages}
            
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            raise

    async def mark_thread_read(self, thread_id: str, user_id: str) -> Dict[str, Any]:
        """Mark thread as read for user"""
        try:
            await self.db.message_participants.update_one(
                {"thread_id": thread_id, "user_id": user_id},
                {"$set": {"last_read_at": datetime.now(timezone.utc)}}
            )
            return {"ok": True}
        except Exception as e:
            logger.error(f"Error marking thread read: {e}")
            raise

    async def notify_thread_participants(self, thread_id: str, sender_id: str, message_doc: dict):
        """Create notifications for other thread participants"""
        try:
            # Get sender info
            sender = await self.db.users.find_one({"id": sender_id})
            sender_name = sender.get("full_name", "Someone") if sender else "Someone"
            
            # Get other participants
            other_participants = await self.db.message_participants.find({
                "thread_id": thread_id,
                "user_id": {"$ne": sender_id}
            }).to_list(length=None)
            
            # Create notifications
            for participant in other_participants:
                notification_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": participant["user_id"],
                    "topic": "NEW_MESSAGE",
                    "payload": {
                        "thread_id": thread_id,
                        "sender_name": sender_name,
                        "preview": (message_doc["body"] or "")[:50] + "..." if len(message_doc["body"] or "") > 50 else message_doc["body"] or ""
                    },
                    "read": False,
                    "created_at": datetime.now(timezone.utc)
                }
                await self.db.notifications.insert_one(notification_doc)
                
        except Exception as e:
            logger.error(f"Error notifying participants: {e}")

    # ADMIN FUNCTIONS
    async def get_all_threads(self, context_type: Optional[str] = None, limit: int = 100) -> List[dict]:
        """Get all message threads for admin review"""
        try:
            query = {}
            if context_type:
                query["context_type"] = context_type
            
            threads = await self.db.message_threads.find(query)\
                .sort("created_at", -1)\
                .limit(limit)\
                .to_list(length=None)
            
            return threads
            
        except Exception as e:
            logger.error(f"Error getting all threads: {e}")
            raise

    async def get_flagged_messages(self, limit: int = 100) -> List[dict]:
        """Get messages that were redacted or flagged"""
        try:
            flagged_messages = await self.db.messages.find({
                "redacted": True
            }).sort("created_at", -1).limit(limit).to_list(length=None)
            
            return flagged_messages
            
        except Exception as e:
            logger.error(f"Error getting flagged messages: {e}")
            raise

    async def ban_user_messaging(self, user_id: str, reason: str, banned_by: str) -> Dict[str, Any]:
        """Ban user from messaging"""
        try:
            await self.db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "messaging_banned": True,
                    "messaging_ban_reason": reason,
                    "messaging_banned_at": datetime.now(timezone.utc),
                    "messaging_banned_by": banned_by
                }}
            )
            
            return {"ok": True}
            
        except Exception as e:
            logger.error(f"Error banning user: {e}")
            raise