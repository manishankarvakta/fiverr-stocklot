import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from pymongo.collection import Collection

# Import models directly from the models directory
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from notification_models import (
    NotificationOutbox, NotificationEvent, UserNotificationPrefs,
    NotificationChannel, NotificationStatus, NotificationCounter,
    AdminNotificationSettings, NotificationTemplate
)

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db):
        self.db = db
        self.notification_prefs: Collection = db.user_notification_prefs
        self.outbox: Collection = db.notifications_outbox
        self.counters: Collection = db.notif_counters
        self.admin_settings: Collection = db.admin_settings_notifications
        self.templates: Collection = db.notification_templates
        self._indexes_created = False
    
    async def create_indexes(self):
        """Create necessary database indexes"""
        if self._indexes_created:
            return
        try:
            await self.outbox.create_index([("status", 1), ("scheduled_at", 1)])
            await self.outbox.create_index([("dedupe_key", 1)])
            await self.counters.create_index([("user_id", 1), ("yyyymmdd", 1)], unique=True)
            await self.notification_prefs.create_index([("user_id", 1)], unique=True)
            await self.templates.create_index([("key", 1)], unique=True)
            self._indexes_created = True
            logger.info("Notification service indexes created")
        except Exception as e:
            logger.error(f"Error creating notification indexes: {e}")
    
    async def ensure_indexes(self):
        """Ensure indexes are created before operations"""
        if not self._indexes_created:
            await self.create_indexes()
    
    async def get_admin_settings(self) -> AdminNotificationSettings:
        """Get admin notification settings"""
        settings = await self.admin_settings.find_one({"id": 1})
        if not settings:
            # Return defaults
            settings = AdminNotificationSettings().dict()
            await self.admin_settings.insert_one(settings)
        return AdminNotificationSettings(**settings)
    
    async def update_admin_settings(self, settings: AdminNotificationSettings):
        """Update admin notification settings"""
        settings.updated_at = datetime.utcnow()
        await self.admin_settings.update_one(
            {"id": 1},
            {"$set": settings.dict()},
            upsert=True
        )
    
    async def get_user_preferences(self, user_id: str) -> UserNotificationPrefs:
        """Get user notification preferences"""
        prefs = await self.notification_prefs.find_one({"user_id": user_id})
        if not prefs:
            # Create default preferences based on admin settings
            admin_settings = await self.get_admin_settings()
            prefs = UserNotificationPrefs(
                user_id=user_id,
                digest_frequency=admin_settings.default_digest_frequency,
                max_per_day=admin_settings.default_max_per_day,
                email_global=admin_settings.default_email_opt_in,
                inapp_global=admin_settings.default_inapp_opt_in,
                push_global=admin_settings.default_push_opt_in
            )
            await self.notification_prefs.insert_one(prefs.dict())
        return UserNotificationPrefs(**prefs)
    
    async def update_user_preferences(self, user_id: str, prefs: UserNotificationPrefs):
        """Update user notification preferences"""
        prefs.updated_at = datetime.utcnow()
        await self.notification_prefs.update_one(
            {"user_id": user_id},
            {"$set": prefs.dict()},
            upsert=True
        )
    
    async def on_buy_request_created(self, event: NotificationEvent):
        """Handle buy request created event"""
        admin_settings = await self.get_admin_settings()
        if not admin_settings.enable_broadcast_buy_requests:
            return
        
        targets = await self.match_audience(
            event_type="buy_request",
            species=event.species,
            province=event.province
        )
        
        await self.enqueue_notifications(
            targets=targets,
            template_key="buy_request.posted",
            payload=event.dict(),
            dedupe_key=f"buyreq:{event.request_id}"
        )
    
    async def on_listing_created(self, event: NotificationEvent):
        """Handle listing created event"""
        admin_settings = await self.get_admin_settings()
        if not admin_settings.enable_broadcast_listings:
            return
        
        targets = await self.match_audience(
            event_type="listing",
            species=event.species,
            province=event.province
        )
        
        await self.enqueue_notifications(
            targets=targets,
            template_key="listing.posted",
            payload=event.dict(),
            dedupe_key=f"listing:{event.listing_id}"
        )
    
    async def match_audience(self, event_type: str, species: str, province: Optional[str] = None) -> List[Dict]:
        """Match users based on species, province, and preferences"""
        # Build query to find relevant users
        query = {
            "email_global": True,
            "$or": [
                {"species_interest": None},
                {"species_interest": {"$in": [species]}}
            ]
        }
        
        if province:
            query["$or"].extend([
                {"provinces_interest": None},
                {"provinces_interest": {"$in": [province]}}
            ])
        
        # Filter by notification type preference
        if event_type == "listing":
            query["email_new_listing"] = True
        else:
            query["email_buy_request"] = True
        
        # Get users with active status
        pipeline = [
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "id",
                "as": "user"
            }},
            {"$unwind": "$user"},
            {"$match": {
                "user.status": "active",
                **query
            }},
            {"$project": {
                "user_id": 1,
                "max_per_day": 1,
                "digest_frequency": 1,
                "email_global": 1,
                "inapp_global": 1,
                "push_global": 1
            }}
        ]
        
        targets = await self.notification_prefs.aggregate(pipeline).to_list(length=None)
        return targets
    
    async def enqueue_notifications(self, targets: List[Dict], template_key: str, payload: Dict, dedupe_key: str):
        """Enqueue notifications for multiple users"""
        notifications = []
        
        for target in targets:
            # Check daily limit
            if not await self.check_daily_limit(target["user_id"], target.get("max_per_day", 5)):
                continue
            
            # Calculate delay based on digest frequency
            delay_seconds = 0
            if target.get("digest_frequency") == "daily":
                delay_seconds = 60 * 60 * 24  # 24 hours
            elif target.get("digest_frequency") == "weekly":
                delay_seconds = 60 * 60 * 24 * 7  # 7 days
            
            scheduled_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
            
            # Create notifications for enabled channels
            channels = []
            if target.get("email_global", True):
                channels.append(NotificationChannel.EMAIL)
            if target.get("inapp_global", True):
                channels.append(NotificationChannel.INAPP)
            if target.get("push_global", False):
                channels.append(NotificationChannel.PUSH)
            
            for channel in channels:
                notification = NotificationOutbox(
                    channel=channel,
                    template_key=template_key,
                    user_id=target["user_id"],
                    payload=payload,
                    dedupe_key=dedupe_key,
                    scheduled_at=scheduled_at
                )
                notifications.append(notification.dict())
        
        if notifications:
            await self.outbox.insert_many(notifications)
            logger.info(f"Enqueued {len(notifications)} notifications for template {template_key}")
    
    async def check_daily_limit(self, user_id: str, max_per_day: int) -> bool:
        """Check if user has reached daily notification limit"""
        today = int(datetime.utcnow().strftime("%Y%m%d"))
        counter = await self.counters.find_one({"user_id": user_id, "yyyymmdd": today})
        
        if counter and counter.get("count", 0) >= max_per_day:
            return False
        return True
    
    async def increment_counter(self, user_id: str):
        """Increment daily notification counter for user"""
        today = int(datetime.utcnow().strftime("%Y%m%d"))
        await self.counters.update_one(
            {"user_id": user_id, "yyyymmdd": today},
            {"$inc": {"count": 1}},
            upsert=True
        )
    
    async def get_outbox_items(self, status: Optional[NotificationStatus] = None, limit: int = 500) -> List[Dict]:
        """Get items from notification outbox"""
        query = {}
        if status:
            query["status"] = status.value
        
        items = await self.outbox.find(query).sort("id", -1).limit(limit).to_list(length=None)
        return items
    
    async def retry_notification(self, notification_id: str):
        """Retry a failed notification"""
        await self.outbox.update_one(
            {"_id": notification_id},
            {"$set": {"status": NotificationStatus.PENDING.value, "attempts": 0}}
        )
    
    async def mark_notification_sent(self, notification_id: str):
        """Mark notification as sent"""
        await self.outbox.update_one(
            {"_id": notification_id},
            {"$set": {"status": NotificationStatus.SENT.value}}
        )
    
    async def mark_notification_failed(self, notification_id: str):
        """Mark notification as failed or pending retry"""
        notification = await self.outbox.find_one({"_id": notification_id})
        if notification:
            attempts = notification.get("attempts", 0) + 1
            max_attempts = notification.get("max_attempts", 5)
            
            status = NotificationStatus.FAILED if attempts >= max_attempts else NotificationStatus.PENDING
            
            await self.outbox.update_one(
                {"_id": notification_id},
                {"$set": {"attempts": attempts, "status": status.value}}
            )
    
    async def get_templates(self) -> List[NotificationTemplate]:
        """Get all notification templates"""
        templates = await self.templates.find({}).to_list(length=None)
        return [NotificationTemplate(**t) for t in templates]
    
    async def get_template(self, key: str) -> Optional[NotificationTemplate]:
        """Get specific notification template"""
        template = await self.templates.find_one({"key": key})
        if template:
            return NotificationTemplate(**template)
        return None
    
    async def update_template(self, template: NotificationTemplate):
        """Update notification template"""
        template.updated_at = datetime.utcnow()
        await self.templates.update_one(
            {"key": template.key},
            {"$set": template.dict()},
            upsert=True
        )
    
    def render_template(self, template_key: str, payload: Dict[str, Any]) -> Dict[str, str]:
        """Render notification template with payload data"""
        # Simple template rendering - replace {{variable}} with values
        if template_key == "buy_request.posted":
            subject = f"New Buy Request • {payload.get('species', 'Livestock')} ({payload.get('province', 'Any')})"
            text = f"A buyer posted a {payload.get('species', 'livestock')} request: {payload.get('title', '')}\nOpen: {payload.get('url', '')}"
            html = f"<p>A buyer posted a <b>{payload.get('species', 'livestock')}</b> request: {payload.get('title', '')}</p><p><a href=\"{payload.get('url', '')}\">View request</a></p>"
        elif template_key == "listing.posted":
            subject = f"New Listing • {payload.get('species', 'Livestock')} in {payload.get('province', 'your area')}"
            text = f"A new {payload.get('species', 'livestock')} listing is live: {payload.get('title', '')}\nOpen: {payload.get('url', '')}"
            html = f"<p>New <b>{payload.get('species', 'livestock')}</b> listing: {payload.get('title', '')}</p><p><a href=\"{payload.get('url', '')}\">View listing</a></p>"
        else:
            subject = "StockLot update"
            text = ""
            html = ""
        
        return {"subject": subject, "text": text, "html": html}
    
    async def test_broadcast(self, test_data: Dict[str, Any], limit: int = 50):
        """Send test broadcast to limited number of users"""
        template_key = "buy_request.posted" if test_data.get("type") == "buy_request" else "listing.posted"
        
        # Get active users (limited)
        active_users = await self.db.users.find(
            {"status": "active"},
            {"id": 1}
        ).limit(limit).to_list(length=None)
        
        notifications = []
        for user in active_users:
            notification = NotificationOutbox(
                channel=NotificationChannel.EMAIL,
                template_key=template_key,
                user_id=user["id"],
                payload=test_data,
                dedupe_key=f"{test_data.get('type', 'test')}:TEST"
            )
            notifications.append(notification.dict())
        
        if notifications:
            await self.outbox.insert_many(notifications)
            logger.info(f"Enqueued {len(notifications)} test notifications")
        
        return len(notifications)