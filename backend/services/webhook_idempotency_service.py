"""
Webhook Idempotency Service for StockLot Livestock Marketplace
Prevents duplicate webhook processing and ensures payment integrity
"""
import logging
import hashlib
import hmac
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

class WebhookIdempotencyService:
    def __init__(self, db):
        self.db = db
    
    def _generate_event_hash(self, event_data: Dict[str, Any]) -> str:
        """Generate a hash for the webhook event to detect duplicates"""
        # Create a string representation of the event for hashing
        event_string = f"{event_data.get('event', '')}{event_data.get('data', {}).get('id', '')}{event_data.get('data', {}).get('reference', '')}"
        return hashlib.sha256(event_string.encode()).hexdigest()
    
    async def is_duplicate_event(self, event_data: Dict[str, Any]) -> bool:
        """Check if this webhook event has already been processed"""
        try:
            event_hash = self._generate_event_hash(event_data)
            
            # Check if we've seen this event before
            existing_event = await self.db.webhook_events.find_one({
                "event_hash": event_hash,
                "processed": True
            })
            
            return existing_event is not None
            
        except Exception as e:
            logger.error(f"Error checking for duplicate event: {str(e)}")
            return False
    
    async def record_webhook_event(
        self, 
        event_data: Dict[str, Any], 
        signature: str = None,
        processed: bool = False
    ) -> str:
        """Record a webhook event to prevent duplicate processing"""
        try:
            event_id = str(uuid.uuid4())
            event_hash = self._generate_event_hash(event_data)
            
            webhook_event_doc = {
                "id": event_id,
                "event_hash": event_hash,
                "event_type": event_data.get("event"),
                "event_data": event_data,
                "signature": signature,
                "processed": processed,
                "processing_attempts": 0,
                "created_at": datetime.now(timezone.utc),
                "processed_at": None
            }
            
            await self.db.webhook_events.insert_one(webhook_event_doc)
            
            logger.info(f"Recorded webhook event {event_id} with type {event_data.get('event')}")
            return event_id
            
        except Exception as e:
            logger.error(f"Error recording webhook event: {str(e)}")
            raise
    
    async def mark_event_processed(self, event_id: str, processing_result: Dict[str, Any] = None):
        """Mark a webhook event as successfully processed"""
        try:
            update_data = {
                "processed": True,
                "processed_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            if processing_result:
                update_data["processing_result"] = processing_result
            
            await self.db.webhook_events.update_one(
                {"id": event_id},
                {
                    "$set": update_data,
                    "$inc": {"processing_attempts": 1}
                }
            )
            
            logger.info(f"Marked webhook event {event_id} as processed")
            
        except Exception as e:
            logger.error(f"Error marking event as processed: {str(e)}")
            raise
    
    async def mark_event_failed(self, event_id: str, error_message: str):
        """Mark a webhook event as failed"""
        try:
            await self.db.webhook_events.update_one(
                {"id": event_id},
                {
                    "$set": {
                        "failed": True,
                        "failure_reason": error_message,
                        "failed_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$inc": {"processing_attempts": 1}
                }
            )
            
            logger.error(f"Marked webhook event {event_id} as failed: {error_message}")
            
        except Exception as e:
            logger.error(f"Error marking event as failed: {str(e)}")
            raise
    
    def verify_paystack_signature(self, payload: bytes, signature: str, webhook_secret: str) -> bool:
        """Verify Paystack webhook signature using HMAC SHA512"""
        try:
            if not signature or not webhook_secret:
                logger.warning("Missing signature or webhook secret")
                return False
            
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha512
            ).hexdigest()
            
            is_valid = hmac.compare_digest(expected_signature, signature)
            
            if not is_valid:
                logger.warning(f"Invalid webhook signature. Expected: {expected_signature[:8]}..., Got: {signature[:8]}...")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False
    
    async def get_webhook_stats(self) -> Dict[str, Any]:
        """Get webhook processing statistics"""
        try:
            total_events = await self.db.webhook_events.count_documents({})
            processed_events = await self.db.webhook_events.count_documents({"processed": True})
            failed_events = await self.db.webhook_events.count_documents({"failed": True})
            
            # Get recent events
            recent_events = await self.db.webhook_events.find({}).sort("created_at", -1).limit(10).to_list(length=None)
            
            for event in recent_events:
                event.pop("_id", None)
                event.pop("event_data", None)  # Remove large event data from stats
            
            return {
                "total_events": total_events,
                "processed_events": processed_events,
                "failed_events": failed_events,
                "success_rate": (processed_events / total_events * 100) if total_events > 0 else 0,
                "recent_events": recent_events
            }
            
        except Exception as e:
            logger.error(f"Error getting webhook stats: {str(e)}")
            return {
                "total_events": 0,
                "processed_events": 0,
                "failed_events": 0,
                "success_rate": 0,
                "recent_events": []
            }