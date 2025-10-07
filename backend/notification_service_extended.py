# 🔔 EXTENDED NOTIFICATION SERVICE
# Complete notification system for all platform events

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

class ExtendedNotificationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create_notification(self, user_id: str, topic: str, payload: dict) -> Dict[str, Any]:
        """Create a new notification"""
        try:
            notification_doc = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "topic": topic,
                "payload": payload,
                "read": False,
                "created_at": datetime.now(timezone.utc)
            }
            await self.db.notifications.insert_one(notification_doc)
            return {"ok": True, "id": notification_doc["id"]}
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise

    async def get_user_notifications(self, user_id: str, limit: int = 50, unread_only: bool = False) -> List[dict]:
        """Get user notifications"""
        try:
            query = {"user_id": user_id}
            if unread_only:
                query["read"] = False
            
            notifications = await self.db.notifications.find(query)\
                .sort("created_at", -1)\
                .limit(limit)\
                .to_list(length=None)
            
            return notifications
            
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            raise

    async def mark_notification_read(self, notification_id: str, user_id: str) -> Dict[str, Any]:
        """Mark notification as read"""
        try:
            await self.db.notifications.update_one(
                {"id": notification_id, "user_id": user_id},
                {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
            )
            return {"ok": True}
        except Exception as e:
            logger.error(f"Error marking notification read: {e}")
            raise

    async def mark_all_read(self, user_id: str) -> Dict[str, Any]:
        """Mark all notifications as read for user"""
        try:
            await self.db.notifications.update_many(
                {"user_id": user_id, "read": False},
                {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
            )
            return {"ok": True}
        except Exception as e:
            logger.error(f"Error marking all notifications read: {e}")
            raise

    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        try:
            count = await self.db.notifications.count_documents({
                "user_id": user_id,
                "read": False
            })
            return count
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0

    # SPECIFIC NOTIFICATION CREATORS
    async def notify_new_buy_request(self, buy_request_id: str, nearby_seller_ids: List[str]):
        """Notify nearby sellers of new buy request"""
        try:
            # Get buy request details
            buy_request = await self.db.buy_requests.find_one({"id": buy_request_id})
            if not buy_request:
                return
            
            for seller_id in nearby_seller_ids:
                await self.create_notification(
                    user_id=seller_id,
                    topic="BUY_REQUEST_NEARBY",
                    payload={
                        "buy_request_id": buy_request_id,
                        "title": buy_request.get("title", "New Buy Request"),
                        "species": buy_request.get("species_name", ""),
                        "quantity": buy_request.get("quantity", 0),
                        "location": buy_request.get("city", "")
                    }
                )
                
        except Exception as e:
            logger.error(f"Error notifying new buy request: {e}")

    async def notify_offer_received(self, offer_id: str, buyer_id: str):
        """Notify buyer of new offer on their buy request"""
        try:
            # Get offer details
            offer = await self.db.buy_request_offers.find_one({"id": offer_id})
            if not offer:
                return
                
            # Get seller details
            seller = await self.db.users.find_one({"id": offer["seller_id"]})
            seller_name = seller.get("full_name", "A seller") if seller else "A seller"
            
            await self.create_notification(
                user_id=buyer_id,
                topic="OFFER_RECEIVED",
                payload={
                    "offer_id": offer_id,
                    "buy_request_id": offer["buy_request_id"],
                    "seller_name": seller_name,
                    "price_per_unit": offer.get("price_per_unit", 0),
                    "quantity_available": offer.get("quantity_available", 0)
                }
            )
            
        except Exception as e:
            logger.error(f"Error notifying offer received: {e}")

    async def notify_offer_accepted(self, offer_id: str, seller_id: str):
        """Notify seller that their offer was accepted"""
        try:
            # Get offer details
            offer = await self.db.buy_request_offers.find_one({"id": offer_id})
            if not offer:
                return
                
            # Get buy request details
            buy_request = await self.db.buy_requests.find_one({"id": offer["buy_request_id"]})
            
            await self.create_notification(
                user_id=seller_id,
                topic="OFFER_ACCEPTED",
                payload={
                    "offer_id": offer_id,
                    "buy_request_id": offer["buy_request_id"],
                    "title": buy_request.get("title", "Your offer") if buy_request else "Your offer",
                    "quantity": offer.get("quantity_available", 0),
                    "total_value": offer.get("price_per_unit", 0) * offer.get("quantity_available", 0)
                }
            )
            
        except Exception as e:
            logger.error(f"Error notifying offer accepted: {e}")

    async def notify_order_paid(self, order_id: str, seller_id: str, buyer_id: str):
        """Notify both parties when order is paid"""
        try:
            # Get order details
            order = await self.db.orders.find_one({"id": order_id})
            if not order:
                return
            
            # Notify seller
            await self.create_notification(
                user_id=seller_id,
                topic="ORDER_PAID",
                payload={
                    "order_id": order_id,
                    "amount": order.get("total_amount", 0),
                    "status": "funds_held",
                    "message": "Payment received! Prepare livestock for delivery."
                }
            )
            
            # Notify buyer
            await self.create_notification(
                user_id=buyer_id,
                topic="ORDER_PAID",
                payload={
                    "order_id": order_id,
                    "amount": order.get("total_amount", 0),
                    "status": "payment_confirmed",
                    "message": "Payment confirmed! Seller will contact you for delivery."
                }
            )
            
        except Exception as e:
            logger.error(f"Error notifying order paid: {e}")

    async def notify_document_expiring(self, user_id: str, document_type: str, expires_at: datetime):
        """Notify user of expiring document"""
        try:
            days_remaining = (expires_at - datetime.now(timezone.utc)).days
            
            await self.create_notification(
                user_id=user_id,
                topic="DOC_EXPIRING",
                payload={
                    "document_type": document_type,
                    "expires_at": expires_at.isoformat(),
                    "days_remaining": days_remaining,
                    "message": f"Your {document_type} expires in {days_remaining} days. Please renew to continue selling."
                }
            )
            
        except Exception as e:
            logger.error(f"Error notifying document expiring: {e}")

    async def notify_document_rejected(self, user_id: str, document_type: str, reason: str):
        """Notify user of document rejection"""
        try:
            await self.create_notification(
                user_id=user_id,
                topic="DOC_REJECTED",
                payload={
                    "document_type": document_type,
                    "rejection_reason": reason,
                    "message": f"Your {document_type} was rejected: {reason}. Please re-submit with corrections."
                }
            )
            
        except Exception as e:
            logger.error(f"Error notifying document rejected: {e}")