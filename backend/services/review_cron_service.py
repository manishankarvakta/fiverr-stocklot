# ⏰ REVIEW CRON SERVICE
# Background jobs for review system maintenance

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.review_service import ReviewService

logger = logging.getLogger(__name__)

class ReviewCronService:
    """Background job service for review system maintenance"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.review_service = ReviewService(db)
        self.running = False
    
    async def start_background_jobs(self):
        """Start all background jobs"""
        if self.running:
            return
        
        self.running = True
        logger.info("Starting review system background jobs")
        
        # Start concurrent jobs
        tasks = [
            self._unblind_reviews_job(),
            self._aggregate_recomputation_job(),
            self._cleanup_job()
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def stop_background_jobs(self):
        """Stop all background jobs"""
        self.running = False
        logger.info("Stopping review system background jobs")
    
    async def _unblind_reviews_job(self):
        """Hourly job to unblind expired reviews"""
        while self.running:
            try:
                await self.review_service.unblind_expired_reviews()
                
                # Sleep for 1 hour
                await asyncio.sleep(3600)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Unblind reviews job error: {e}")
                # Sleep for 5 minutes before retrying
                await asyncio.sleep(300)
    
    async def _aggregate_recomputation_job(self):
        """Daily job to recompute all rating aggregates"""
        while self.running:
            try:
                # Calculate time until next midnight
                now = datetime.now(timezone.utc)
                next_midnight = (now + timedelta(days=1)).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                seconds_until_midnight = (next_midnight - now).total_seconds()
                
                # Sleep until midnight
                await asyncio.sleep(seconds_until_midnight)
                
                if self.running:
                    logger.info("Starting daily aggregate recomputation")
                    await self.review_service.recompute_all_rating_aggregates()
                    logger.info("Completed daily aggregate recomputation")
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Aggregate recomputation job error: {e}")
                # Sleep for 1 hour before retrying
                await asyncio.sleep(3600)
    
    async def _cleanup_job(self):
        """Weekly cleanup of old review data"""
        while self.running:
            try:
                # Calculate time until next Sunday midnight
                now = datetime.now(timezone.utc)
                days_until_sunday = (6 - now.weekday()) % 7
                if days_until_sunday == 0:
                    days_until_sunday = 7  # Next Sunday if today is Sunday
                
                next_sunday = now + timedelta(days=days_until_sunday)
                next_sunday = next_sunday.replace(hour=0, minute=0, second=0, microsecond=0)
                seconds_until_sunday = (next_sunday - now).total_seconds()
                
                # Sleep until next Sunday
                await asyncio.sleep(seconds_until_sunday)
                
                if self.running:
                    await self._perform_cleanup()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup job error: {e}")
                # Sleep for 1 day before retrying
                await asyncio.sleep(86400)
    
    async def _perform_cleanup(self):
        """Perform weekly cleanup tasks"""
        try:
            logger.info("Starting weekly review system cleanup")
            
            # Clean up old moderation logs (older than 1 year)
            one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
            
            # Remove old rejected reviews (keep for 90 days for audit)
            ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
            
            deleted_rejected = await self.db.user_reviews.delete_many({
                "moderation_status": "REJECTED",
                "updated_at": {"$lt": ninety_days_ago}
            })
            
            # Clean up old system settings cache
            await self.db.system_settings.delete_many({
                "key": {"$regex": "^marketplace_mean_"},
                "updated_at": {"$lt": one_year_ago}
            })
            
            logger.info(f"Cleanup completed: deleted {deleted_rejected.deleted_count} old rejected reviews")
            
        except Exception as e:
            logger.error(f"Cleanup operation failed: {e}")
    
    # MANUAL TRIGGER METHODS
    async def trigger_unblind_reviews(self):
        """Manually trigger unblind reviews job"""
        try:
            await self.review_service.unblind_expired_reviews()
            return {"success": True, "message": "Unblind job completed"}
        except Exception as e:
            logger.error(f"Manual unblind trigger failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def trigger_aggregate_recomputation(self):
        """Manually trigger aggregate recomputation"""
        try:
            await self.review_service.recompute_all_rating_aggregates()
            return {"success": True, "message": "Aggregate recomputation completed"}
        except Exception as e:
            logger.error(f"Manual aggregate trigger failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def trigger_cleanup(self):
        """Manually trigger cleanup job"""
        try:
            await self._perform_cleanup()
            return {"success": True, "message": "Cleanup completed"}
        except Exception as e:
            logger.error(f"Manual cleanup trigger failed: {e}")
            return {"success": False, "error": str(e)}

# Global instance
_review_cron_service = None

def get_review_cron_service(db: AsyncIOMotorDatabase) -> ReviewCronService:
    """Get singleton review cron service instance"""
    global _review_cron_service
    if _review_cron_service is None:
        _review_cron_service = ReviewCronService(db)
    return _review_cron_service