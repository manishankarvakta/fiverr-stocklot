"""
User Notification Preferences API Routes
Handles user notification settings and unsubscribe functionality
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging

# Use shared auth models and dependencies to avoid circular imports
from auth_models import User
from dependencies import get_current_user
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
from notification_models import UserNotificationPrefs, DigestFrequency

logger = logging.getLogger(__name__)

# Router for user notification endpoints
user_notifications_router = APIRouter(tags=["user-notifications"])

# Global notification service - will be set in server.py
notification_service = None

def set_notification_service(service):
    """Set notification service (called from server.py)"""
    global notification_service
    notification_service = service

@user_notifications_router.get("/me/notifications")
async def get_user_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """Get current user's notification preferences"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        prefs = await notification_service.get_user_preferences(current_user.id)
        
        return {
            "ok": True,
            "data": prefs.dict()
        }
        
    except Exception as e:
        logger.error(f"Error getting user notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notification preferences")

@user_notifications_router.put("/me/notifications")
async def update_user_notification_preferences(
    preferences_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update current user's notification preferences"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Validate preferences
        if "digest_frequency" in preferences_data:
            try:
                DigestFrequency(preferences_data["digest_frequency"])
            except ValueError:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid digest frequency. Must be: immediate, daily, weekly, or off"
                )
        
        if "max_per_day" in preferences_data:
            max_per_day = preferences_data["max_per_day"]
            if not isinstance(max_per_day, int) or max_per_day < 0 or max_per_day > 100:
                raise HTTPException(
                    status_code=400,
                    detail="max_per_day must be an integer between 0 and 100"
                )
        
        # Get current preferences to merge with updates
        current_prefs = await notification_service.get_user_preferences(current_user.id)
        
        # Update with new values
        update_data = current_prefs.dict()
        update_data.update(preferences_data)
        update_data["user_id"] = current_user.id
        
        # Create updated preferences object
        updated_prefs = UserNotificationPrefs(**update_data)
        
        # Save to database
        await notification_service.update_user_preferences(current_user.id, updated_prefs)
        
        return {
            "ok": True,
            "message": "Notification preferences updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification preferences")

@user_notifications_router.post("/unsubscribe")
async def unsubscribe_from_notifications(
    unsubscribe_data: dict
):
    """Unsubscribe user from email notifications (public endpoint)"""
    try:
        token = unsubscribe_data.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Unsubscribe token required")
        
        # For now, we'll implement a simple approach
        # In production, you'd verify a signed JWT token containing user_id
        user_id = unsubscribe_data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid unsubscribe token")
        
        # Get current preferences
        prefs = await notification_service.get_user_preferences(user_id)
        
        # Disable email notifications
        prefs.email_global = False
        
        # Save updated preferences
        await notification_service.update_user_preferences(user_id, prefs)
        
        return {
            "ok": True,
            "message": "You have been unsubscribed from email notifications. You can still receive in-app notifications."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing user: {e}")
        raise HTTPException(status_code=500, detail="Failed to unsubscribe")

@user_notifications_router.get("/preferences/species")
async def get_available_species():
    """Get list of available species for notification preferences"""
    try:
        # This could be dynamic from your species database
        species_list = [
            "Cattle", "Sheep", "Goats", "Pigs", "Chickens", 
            "Ducks", "Rabbits", "Fish", "Ostrich", "Guinea Fowl"
        ]
        
        return {
            "ok": True,
            "species": species_list
        }
        
    except Exception as e:
        logger.error(f"Error getting species list: {e}")
        raise HTTPException(status_code=500, detail="Failed to get species list")

@user_notifications_router.get("/preferences/provinces")
async def get_available_provinces():
    """Get list of available provinces for notification preferences"""
    try:
        provinces_list = [
            "Gauteng", "Limpopo", "Mpumalanga", "North West", 
            "Free State", "KwaZulu-Natal", "Eastern Cape", 
            "Western Cape", "Northern Cape"
        ]
        
        return {
            "ok": True,
            "provinces": provinces_list
        }
        
    except Exception as e:
        logger.error(f"Error getting provinces list: {e}")
        raise HTTPException(status_code=500, detail="Failed to get provinces list")