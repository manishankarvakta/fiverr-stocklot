#!/usr/bin/env python3
"""
Mailgun Webhook Service for StockLot
Handles delivery events, bounces, complaints, and unsubscribes
"""

import os
import hmac
import hashlib
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from enum import Enum
import json

logger = logging.getLogger(__name__)

class MailgunEventType(str, Enum):
    """Mailgun webhook event types"""
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"
    COMPLAINED = "complained"
    UNSUBSCRIBED = "unsubscribed"
    CLICKED = "clicked"
    OPENED = "opened"

class MailgunWebhookService:
    """Service for handling Mailgun webhook events"""
    
    def __init__(self, db, email_preferences_service):
        self.db = db
        self.email_preferences_service = email_preferences_service
        self.webhook_signing_key = os.environ.get('MAILGUN_WEBHOOK_SIGNING_KEY')
        self.email_events_collection = db.email_events
        self.email_analytics_collection = db.email_analytics
    
    def verify_webhook_signature(self, token: str, timestamp: str, signature: str) -> bool:
        """Verify Mailgun webhook signature for security"""
        if not self.webhook_signing_key:
            logger.warning("MAILGUN_WEBHOOK_SIGNING_KEY not configured, skipping verification")
            return True  # Allow in development
        
        try:
            # Create the signature string
            signature_data = f"{timestamp}{token}"
            expected_signature = hmac.new(
                self.webhook_signing_key.encode(),
                signature_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(signature, expected_signature)
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False
    
    async def handle_webhook_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming Mailgun webhook event"""
        try:
            event_type = event_data.get("event")
            if not event_type:
                return {"error": "Missing event type"}
            
            # Verify signature if present
            signature_data = event_data.get("signature", {})
            if signature_data:
                token = signature_data.get("token")
                timestamp = signature_data.get("timestamp")
                signature = signature_data.get("signature")
                
                if not self.verify_webhook_signature(token, timestamp, signature):
                    logger.warning("Invalid webhook signature")
                    return {"error": "Invalid signature"}
            
            # Extract event details
            event_details = event_data.get("event-data", {})
            recipient_email = event_details.get("recipient", "").lower()
            message_id = event_details.get("id")
            timestamp = event_details.get("timestamp")
            
            # Store raw event
            await self.store_email_event(event_type, event_details)
            
            # Handle specific event types
            result = await self.process_event_by_type(event_type, event_details)
            
            # Update analytics
            await self.update_email_analytics(event_type, event_details)
            
            logger.info(f"Processed {event_type} event for {recipient_email}")
            return {"status": "processed", "event": event_type, "result": result}
            
        except Exception as e:
            logger.error(f"Error handling webhook event: {e}")
            return {"error": str(e)}
    
    async def store_email_event(self, event_type: str, event_data: Dict[str, Any]):
        """Store email event for audit and analytics"""
        try:
            event_doc = {
                "event_type": event_type,
                "recipient": event_data.get("recipient", "").lower(),
                "message_id": event_data.get("id"),
                "timestamp": datetime.fromtimestamp(event_data.get("timestamp", 0), tz=timezone.utc),
                "created_at": datetime.now(timezone.utc),
                "event_data": event_data,
                "processed": True
            }
            
            # Add event-specific fields
            if event_type == MailgunEventType.FAILED:
                event_doc["failure_reason"] = event_data.get("reason")
                event_doc["failure_code"] = event_data.get("code")
            elif event_type == MailgunEventType.BOUNCED:
                event_doc["bounce_reason"] = event_data.get("reason")
                event_doc["bounce_error"] = event_data.get("error")
            elif event_type == MailgunEventType.COMPLAINED:
                event_doc["complaint_source"] = event_data.get("source", "unknown")
            elif event_type == MailgunEventType.CLICKED:
                event_doc["clicked_url"] = event_data.get("url")
            
            await self.email_events_collection.insert_one(event_doc)
            
        except Exception as e:
            logger.error(f"Error storing email event: {e}")
    
    async def process_event_by_type(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process event based on its type"""
        recipient_email = event_data.get("recipient", "").lower()
        
        try:
            if event_type == MailgunEventType.BOUNCED:
                return await self.handle_bounce(recipient_email, event_data)
            elif event_type == MailgunEventType.COMPLAINED:
                return await self.handle_complaint(recipient_email, event_data)
            elif event_type == MailgunEventType.UNSUBSCRIBED:
                return await self.handle_unsubscribe(recipient_email, event_data)
            elif event_type == MailgunEventType.FAILED:
                return await self.handle_failure(recipient_email, event_data)
            elif event_type in [MailgunEventType.DELIVERED, MailgunEventType.OPENED, MailgunEventType.CLICKED]:
                return await self.handle_engagement(event_type, recipient_email, event_data)
            else:
                return {"status": "ignored", "reason": f"Unhandled event type: {event_type}"}
                
        except Exception as e:
            logger.error(f"Error processing {event_type} event: {e}")
            return {"error": str(e)}
    
    async def handle_bounce(self, email: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle bounced email"""
        try:
            bounce_reason = event_data.get("reason", "unknown")
            bounce_code = event_data.get("code")
            
            # Determine if permanent or temporary bounce
            permanent_codes = ["550", "551", "553", "554"]
            is_permanent = any(code in str(bounce_code) for code in permanent_codes) if bounce_code else False
            
            if is_permanent:
                # Add to suppression list for permanent bounces
                await self.email_preferences_service.suppress_email(
                    email=email,
                    reason=f"permanent_bounce: {bounce_reason}"
                )
                logger.warning(f"Added {email} to suppression list due to permanent bounce")
                return {"action": "suppressed", "reason": "permanent_bounce"}
            else:
                # Log temporary bounce but don't suppress
                logger.info(f"Temporary bounce for {email}: {bounce_reason}")
                return {"action": "logged", "reason": "temporary_bounce"}
                
        except Exception as e:
            logger.error(f"Error handling bounce for {email}: {e}")
            return {"error": str(e)}
    
    async def handle_complaint(self, email: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle spam complaint"""
        try:
            # Always suppress on spam complaints
            await self.email_preferences_service.suppress_email(
                email=email,
                reason="spam_complaint"
            )
            
            # Also unsubscribe from all marketing emails
            user_doc = await self.db.users.find_one({"email": email})
            if user_doc:
                await self.email_preferences_service.unsubscribe_user(user_doc["id"])
            
            logger.warning(f"Suppressed {email} due to spam complaint")
            return {"action": "suppressed_and_unsubscribed", "reason": "spam_complaint"}
            
        except Exception as e:
            logger.error(f"Error handling complaint for {email}: {e}")
            return {"error": str(e)}
    
    async def handle_unsubscribe(self, email: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle unsubscribe event"""
        try:
            # Find user and update preferences
            user_doc = await self.db.users.find_one({"email": email})
            if user_doc:
                await self.email_preferences_service.unsubscribe_user(
                    user_doc["id"],
                    categories=["marketing", "engagement", "lifecycle"]
                )
                logger.info(f"Unsubscribed user {user_doc['id']} ({email}) from marketing emails")
                return {"action": "unsubscribed", "user_id": user_doc["id"]}
            else:
                # Add to suppression list even if user not found
                await self.email_preferences_service.suppress_email(
                    email=email,
                    reason="unsubscribed"
                )
                logger.info(f"Added unknown email {email} to suppression list")
                return {"action": "suppressed", "reason": "user_not_found"}
                
        except Exception as e:
            logger.error(f"Error handling unsubscribe for {email}: {e}")
            return {"error": str(e)}
    
    async def handle_failure(self, email: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle delivery failure"""
        try:
            failure_reason = event_data.get("reason", "unknown")
            failure_code = event_data.get("code")
            
            # Check if it's a permanent failure
            permanent_failures = ["rejected", "suppressed", "blacklisted"]
            is_permanent = any(failure in failure_reason.lower() for failure in permanent_failures)
            
            if is_permanent:
                await self.email_preferences_service.suppress_email(
                    email=email,
                    reason=f"permanent_failure: {failure_reason}"
                )
                logger.warning(f"Suppressed {email} due to permanent failure: {failure_reason}")
                return {"action": "suppressed", "reason": "permanent_failure"}
            else:
                logger.info(f"Temporary failure for {email}: {failure_reason}")
                return {"action": "logged", "reason": "temporary_failure"}
                
        except Exception as e:
            logger.error(f"Error handling failure for {email}: {e}")
            return {"error": str(e)}
    
    async def handle_engagement(self, event_type: str, email: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle positive engagement events (delivered, opened, clicked)"""
        try:
            # Extract useful engagement data
            engagement_data = {
                "email": email,
                "event_type": event_type,
                "timestamp": datetime.fromtimestamp(event_data.get("timestamp", 0), tz=timezone.utc),
                "message_id": event_data.get("id"),
                "tags": event_data.get("tags", [])
            }
            
            if event_type == MailgunEventType.CLICKED:
                engagement_data["clicked_url"] = event_data.get("url")
            
            # Store engagement for analytics
            await self.db.email_engagement.insert_one(engagement_data)
            
            return {"action": "engagement_tracked", "event": event_type}
            
        except Exception as e:
            logger.error(f"Error handling engagement for {email}: {e}")
            return {"error": str(e)}
    
    async def update_email_analytics(self, event_type: str, event_data: Dict[str, Any]):
        """Update email analytics counters"""
        try:
            today = datetime.now(timezone.utc).date()
            tags = event_data.get("tags", [])
            
            # Update daily analytics
            for tag in tags:
                await self.email_analytics_collection.update_one(
                    {"date": today, "tag": tag},
                    {
                        "$inc": {f"events.{event_type}": 1},
                        "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
                    },
                    upsert=True
                )
            
            # Update overall analytics
            await self.email_analytics_collection.update_one(
                {"date": today, "tag": "overall"},
                {
                    "$inc": {f"events.{event_type}": 1},
                    "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
                },
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating analytics: {e}")
    
    async def get_email_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get email analytics for the last N days"""
        try:
            from datetime import timedelta
            
            end_date = datetime.now(timezone.utc).date()
            start_date = end_date - timedelta(days=days)
            
            pipeline = [
                {"$match": {"date": {"$gte": start_date, "$lte": end_date}}},
                {
                    "$group": {
                        "_id": "$tag",
                        "total_sent": {"$sum": "$events.accepted"},
                        "delivered": {"$sum": "$events.delivered"},
                        "opened": {"$sum": "$events.opened"},
                        "clicked": {"$sum": "$events.clicked"},
                        "bounced": {"$sum": "$events.bounced"},
                        "complained": {"$sum": "$events.complained"},
                        "unsubscribed": {"$sum": "$events.unsubscribed"},
                        "failed": {"$sum": "$events.failed"}
                    }
                }
            ]
            
            results = await self.email_analytics_collection.aggregate(pipeline).to_list(None)
            
            # Calculate rates
            analytics = {}
            for result in results:
                tag = result["_id"]
                sent = result["total_sent"]
                
                analytics[tag] = {
                    "sent": sent,
                    "delivered": result["delivered"],
                    "opened": result["opened"],
                    "clicked": result["clicked"],
                    "bounced": result["bounced"],
                    "complained": result["complained"],
                    "unsubscribed": result["unsubscribed"],
                    "failed": result["failed"],
                    "delivery_rate": (result["delivered"] / sent * 100) if sent > 0 else 0,
                    "open_rate": (result["opened"] / result["delivered"] * 100) if result["delivered"] > 0 else 0,
                    "click_rate": (result["clicked"] / result["delivered"] * 100) if result["delivered"] > 0 else 0,
                    "bounce_rate": (result["bounced"] / sent * 100) if sent > 0 else 0,
                    "complaint_rate": (result["complained"] / sent * 100) if sent > 0 else 0
                }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting email analytics: {e}")
            return {}
    
    async def get_suppressed_emails(self) -> List[Dict[str, Any]]:
        """Get list of suppressed emails for admin review"""
        try:
            suppressed = await self.email_preferences_service.suppression_collection.find(
                {"active": True}
            ).sort("suppressed_at", -1).limit(100).to_list(100)
            
            return [
                {
                    "email": doc["email"],
                    "reason": doc["reason"],
                    "suppressed_at": doc["suppressed_at"].isoformat(),
                    "can_reactivate": "permanent" not in doc["reason"]
                }
                for doc in suppressed
            ]
            
        except Exception as e:
            logger.error(f"Error getting suppressed emails: {e}")
            return []

# Usage example:
if __name__ == "__main__":
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    from email_preferences_service import EmailPreferencesService
    
    async def test_webhook():
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client.stocklot_test
        
        prefs_service = EmailPreferencesService(db)
        webhook_service = MailgunWebhookService(db, prefs_service)
        
        # Test bounce event
        bounce_event = {
            "event": "bounced",
            "event-data": {
                "recipient": "test@example.com",
                "id": "test-message-id",
                "timestamp": 1640995200,
                "reason": "mailbox_full",
                "code": 550
            }
        }
        
        result = await webhook_service.handle_webhook_event(bounce_event)
        print(f"Bounce event result: {result}")
        
        client.close()
    
    asyncio.run(test_webhook())