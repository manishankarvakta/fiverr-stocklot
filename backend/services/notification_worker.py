import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from services.notification_service import NotificationService
from services.email_service import EmailService
from services.sse_service import SSEService

logger = logging.getLogger(__name__)

class NotificationWorker:
    def __init__(self, db, email_service: EmailService = None, sse_service: SSEService = None):
        self.db = db
        self.notification_service = NotificationService(db)
        self.email_service = email_service
        self.sse_service = sse_service
    
    async def run_outbox_once(self, limit: int = 500):
        """Process notifications in outbox once"""
        try:
            # Get pending notifications scheduled for now or earlier
            jobs = await self.db.notifications_outbox.find({
                "status": "PENDING",
                "scheduled_at": {"$lte": datetime.utcnow()}
            }).sort("_id", 1).limit(limit).to_list(length=None)
            
            logger.info(f"Processing {len(jobs)} notifications from outbox")
            
            processed = 0
            errors = 0
            
            for job in jobs:
                try:
                    # Check for duplicate (skip if already sent)
                    if job.get("dedupe_key"):
                        existing = await self.db.notifications_outbox.find_one({
                            "dedupe_key": job["dedupe_key"],
                            "status": "SENT"
                        })
                        if existing:
                            await self.mark_skipped(job["_id"])
                            processed += 1
                            continue
                    
                    # Render template
                    template_data = self.notification_service.render_template(
                        job["template_key"], 
                        job["payload"]
                    )
                    
                    # Send notification based on channel
                    success = False
                    if job["channel"] == "EMAIL":
                        success = await self.send_email(
                            job["user_id"],
                            template_data["subject"],
                            template_data["html"],
                            template_data["text"]
                        )
                    elif job["channel"] == "INAPP":
                        success = await self.send_inapp(
                            job["user_id"],
                            {
                                "type": job["template_key"],
                                "title": template_data["subject"],
                                "message": template_data["text"],
                                **job["payload"]
                            }
                        )
                    elif job["channel"] == "PUSH":
                        success = await self.send_push(
                            job["user_id"],
                            template_data["subject"],
                            template_data["text"],
                            job["payload"].get("url")
                        )
                    
                    if success:
                        await self.mark_sent(job["_id"])
                        await self.notification_service.increment_counter(job["user_id"])
                        processed += 1
                    else:
                        await self.mark_failed(job["_id"])
                        errors += 1
                
                except Exception as e:
                    logger.error(f"Error processing notification {job.get('_id')}: {e}")
                    await self.mark_failed(job["_id"])
                    errors += 1
            
            logger.info(f"Notification worker completed: {processed} sent, {errors} failed")
            return {"processed": processed, "errors": errors}
            
        except Exception as e:
            logger.error(f"Notification worker error: {e}")
            return {"processed": 0, "errors": 1}
    
    async def send_email(self, user_id: str, subject: str, html: str, text: str) -> bool:
        """Send email notification"""
        try:
            if not self.email_service:
                logger.warning("Email service not configured")
                return False
            
            # Get user email
            user = await self.db.users.find_one({"id": user_id}, {"email": 1})
            if not user:
                logger.error(f"User not found: {user_id}")
                return False
            
            await self.email_service.send_email(
                to_email=user["email"],
                subject=subject,
                html_content=html,
                text_content=text
            )
            
            logger.debug(f"Email sent to {user['email']}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email to user {user_id}: {e}")
            return False
    
    async def send_inapp(self, user_id: str, data: Dict) -> bool:
        """Send in-app notification via SSE"""
        try:
            if not self.sse_service:
                logger.warning("SSE service not configured")
                return False
            
            # Send via SSE to user's active connections
            await self.sse_service.send_to_user(user_id, {
                "event": "notification.new",
                "data": data
            })
            
            logger.debug(f"In-app notification sent to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending in-app notification to user {user_id}: {e}")
            return False
    
    async def send_push(self, user_id: str, title: str, body: str, url: Optional[str] = None) -> bool:
        """Send push notification"""
        try:
            # Push notifications would integrate with web push service
            # For now, we'll just log and return success
            logger.info(f"Push notification would be sent to user {user_id}: {title}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending push notification to user {user_id}: {e}")
            return False
    
    async def mark_sent(self, notification_id):
        """Mark notification as sent"""
        await self.db.notifications_outbox.update_one(
            {"_id": notification_id},
            {"$set": {"status": "SENT"}}
        )
    
    async def mark_failed(self, notification_id):
        """Mark notification as failed or retry"""
        notification = await self.db.notifications_outbox.find_one({"_id": notification_id})
        if notification:
            attempts = notification.get("attempts", 0) + 1
            max_attempts = notification.get("max_attempts", 5)
            
            status = "FAILED" if attempts >= max_attempts else "PENDING"
            
            await self.db.notifications_outbox.update_one(
                {"_id": notification_id},
                {"$set": {"attempts": attempts, "status": status}}
            )
    
    async def mark_skipped(self, notification_id):
        """Mark notification as skipped (duplicate)"""
        await self.db.notifications_outbox.update_one(
            {"_id": notification_id},
            {"$set": {"status": "SKIPPED"}}
        )
    
    async def cleanup_old_notifications(self, days: int = 30):
        """Clean up old processed notifications"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.notifications_outbox.delete_many({
            "status": {"$in": ["SENT", "FAILED", "SKIPPED"]},
            "created_at": {"$lt": cutoff_date}
        })
        
        logger.info(f"Cleaned up {result.deleted_count} old notifications")
        return result.deleted_count