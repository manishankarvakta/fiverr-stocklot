"""
Admin Notification Management API Routes
Handles admin settings, templates, outbox monitoring, and test broadcasts
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
import logging
from datetime import datetime, timezone

# Use shared auth models and dependencies to avoid circular imports
from auth_models import User, UserRole
from dependencies import get_current_user
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
from notification_models import (
    AdminNotificationSettings, NotificationTemplate, NotificationStatus,
    TestBroadcastRequest, TemplatePreviewRequest, OutboxQuery
)

logger = logging.getLogger(__name__)

# Router for admin notification endpoints
admin_notifications_router = APIRouter(prefix="/admin", tags=["admin-notifications"])

# Global services - will be set in server.py
notification_service = None
notification_worker = None

def set_notification_services(service, worker):
    """Set notification services (called from server.py)"""
    global notification_service, notification_worker
    notification_service = service
    notification_worker = worker

@admin_notifications_router.get("/settings/notifications")
async def get_notification_settings(
    current_user: User = Depends(get_current_user)
):
    """Get admin notification settings"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        settings = await notification_service.get_admin_settings()
        return settings.dict()
        
    except Exception as e:
        logger.error(f"Error getting notification settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification settings")

@admin_notifications_router.put("/settings/notifications")
async def update_notification_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update admin notification settings"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Validate and create settings object
        settings = AdminNotificationSettings(**settings_data)
        await notification_service.update_admin_settings(settings)
        
        return {"ok": True, "message": "Notification settings updated"}
        
    except Exception as e:
        logger.error(f"Error updating notification settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification settings")

@admin_notifications_router.post("/notifications/test-broadcast")
async def send_test_broadcast(
    test_data: TestBroadcastRequest,
    current_user: User = Depends(get_current_user)
):
    """Send test broadcast to limited number of users"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        count = await notification_service.test_broadcast(
            test_data.dict(),
            limit=50  # Limit test broadcasts
        )
        
        return {
            "ok": True, 
            "message": f"Test broadcast enqueued for {count} users",
            "enqueued": count
        }
        
    except Exception as e:
        logger.error(f"Error sending test broadcast: {e}")
        raise HTTPException(status_code=500, detail="Failed to send test broadcast")

@admin_notifications_router.get("/templates")
async def get_notification_templates(
    current_user: User = Depends(get_current_user)
):
    """Get all notification templates"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        templates = await notification_service.get_templates()
        return [template.dict() for template in templates]
        
    except Exception as e:
        logger.error(f"Error getting templates: {e}")
        raise HTTPException(status_code=500, detail="Failed to get templates")

@admin_notifications_router.put("/templates/{template_key}")
async def update_notification_template(
    template_key: str,
    template_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update notification template"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Validate template data
        template = NotificationTemplate(
            key=template_key,
            subject=template_data.get("subject", ""),
            html=template_data.get("html", ""),
            text=template_data.get("text", "")
        )
        
        await notification_service.update_template(template)
        
        return {"ok": True, "message": "Template updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating template: {e}")
        raise HTTPException(status_code=500, detail="Failed to update template")

@admin_notifications_router.post("/templates/{template_key}/preview")
async def preview_notification_template(
    template_key: str,
    preview_data: TemplatePreviewRequest,
    current_user: User = Depends(get_current_user)
):
    """Preview notification template with test data"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # For now, return simple interpolation
        # In production, you might use a more sophisticated template engine
        rendered = notification_service.render_template(template_key, preview_data.payload)
        
        return {
            "ok": True,
            "rendered": rendered,
            "html": rendered.get("html", "")
        }
        
    except Exception as e:
        logger.error(f"Error previewing template: {e}")
        raise HTTPException(status_code=500, detail="Failed to preview template")

@admin_notifications_router.get("/outbox")
async def get_notification_outbox(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(500, le=1000, description="Limit results"),
    current_user: User = Depends(get_current_user)
):
    """Get notification outbox items"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Convert string status to enum if provided
        status_filter = None
        if status:
            try:
                status_filter = NotificationStatus(status.upper())
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
        
        items = await notification_service.get_outbox_items(status_filter, limit)
        
        return {
            "ok": True,
            "rows": items,
            "total": len(items)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting outbox: {e}")
        raise HTTPException(status_code=500, detail="Failed to get outbox")

@admin_notifications_router.post("/outbox/run-once")
async def run_notification_worker(
    current_user: User = Depends(get_current_user)
):
    """Run notification worker once"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        if not notification_worker:
            raise HTTPException(status_code=503, detail="Notification worker not available")
        
        result = await notification_worker.run_outbox_once(limit=200)
        
        return {
            "ok": True,
            "message": "Notification worker executed",
            "processed": result.get("processed", 0),
            "errors": result.get("errors", 0)
        }
        
    except Exception as e:
        logger.error(f"Error running notification worker: {e}")
        raise HTTPException(status_code=500, detail="Failed to run notification worker")

@admin_notifications_router.post("/outbox/{notification_id}/retry")
async def retry_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retry a failed notification"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        await notification_service.retry_notification(notification_id)
        
        return {"ok": True, "message": "Notification queued for retry"}
        
    except Exception as e:
        logger.error(f"Error retrying notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to retry notification")

@admin_notifications_router.get("/stats")
async def get_notification_stats(
    current_user: User = Depends(get_current_user)
):
    """Get notification system statistics"""
    if not current_user or UserRole.ADMIN not in current_user.roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get counts by status
        pending = await notification_service.get_outbox_items(NotificationStatus.PENDING, limit=10000)
        sent = await notification_service.get_outbox_items(NotificationStatus.SENT, limit=10000)
        failed = await notification_service.get_outbox_items(NotificationStatus.FAILED, limit=10000)
        
        stats = {
            "pending": len(pending),
            "sent": len(sent),
            "failed": len(failed),
            "total": len(pending) + len(sent) + len(failed)
        }
        
        return {"ok": True, "stats": stats}
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification stats")