#!/usr/bin/env python3
"""
Email Preferences Management Service for StockLot
Handles user subscription preferences and compliance with marketing regulations
"""

import logging
from typing import Dict, List, Optional, Set
from enum import Enum
from dataclasses import dataclass, asdict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class EmailPreferenceStatus(str, Enum):
    """Email preference status"""
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBED = "unsubscribed"
    PAUSED = "paused"

@dataclass
class EmailPreferences:
    """User email preferences"""
    user_id: str
    email: str
    # Engagement emails (can unsubscribe)
    engagement: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    lifecycle: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    auctions: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    rfq: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    reviews: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    messaging: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    statements: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    
    # Marketing/promotional (can unsubscribe)
    marketing: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    newsletter: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    promotions: EmailPreferenceStatus = EmailPreferenceStatus.SUBSCRIBED
    
    # Frequency preferences
    instant_notifications: bool = True
    daily_digest: bool = False
    weekly_digest: bool = True
    
    # Metadata
    updated_at: datetime = None
    created_at: datetime = None

class EmailPreferencesService:
    """Service for managing email preferences and compliance"""
    
    def __init__(self, db):
        self.db = db
        self.preferences_collection = db.email_preferences
        self.suppression_collection = db.email_suppressions
        
        # Categories that can never be unsubscribed (transactional/security)
        self.always_send_categories = {
            "transactional.auth",
            "transactional.kyc", 
            "transactional.org",
            "transactional.listings",
            "transactional.orders",
            "transactional.payments",
            "transactional.payouts",
            "security",
            "compliance",
            "logistics",
            "admin.alerts"
        }
    
    async def get_user_preferences(self, user_id: str) -> EmailPreferences:
        """Get user's email preferences"""
        try:
            prefs_doc = await self.preferences_collection.find_one({"user_id": user_id})
            
            if prefs_doc:
                # Convert MongoDB document to EmailPreferences
                prefs_doc.pop('_id', None)
                return EmailPreferences(**prefs_doc)
            else:
                # Create default preferences for new user
                return await self.create_default_preferences(user_id)
                
        except Exception as e:
            logger.error(f"Error getting preferences for user {user_id}: {str(e)}")
            return await self.create_default_preferences(user_id)
    
    async def create_default_preferences(self, user_id: str, email: str = None) -> EmailPreferences:
        """Create default email preferences for new user"""
        try:
            now = datetime.now(timezone.utc)
            
            preferences = EmailPreferences(
                user_id=user_id,
                email=email or f"user_{user_id}@unknown.com",
                created_at=now,
                updated_at=now
            )
            
            # Save to database
            await self.preferences_collection.insert_one(asdict(preferences))
            
            logger.info(f"Created default email preferences for user {user_id}")
            return preferences
            
        except Exception as e:
            logger.error(f"Error creating default preferences for user {user_id}: {str(e)}")
            raise
    
    async def update_preferences(self, user_id: str, updates: Dict[str, any]) -> bool:
        """Update user's email preferences"""
        try:
            updates['updated_at'] = datetime.now(timezone.utc)
            
            result = await self.preferences_collection.update_one(
                {"user_id": user_id},
                {"$set": updates},
                upsert=True
            )
            
            logger.info(f"Updated email preferences for user {user_id}")
            return result.modified_count > 0 or result.upserted_id is not None
            
        except Exception as e:
            logger.error(f"Error updating preferences for user {user_id}: {str(e)}")
            return False
    
    async def can_send_email(self, user_id: str, email_category: str) -> bool:
        """Check if user can receive emails for this category"""
        try:
            # Always send transactional/security emails
            if email_category in self.always_send_categories:
                return True
            
            # Check if email is globally suppressed (bounced, complained, etc.)
            if await self.is_email_suppressed(user_id):
                return False
            
            # Get user preferences
            preferences = await self.get_user_preferences(user_id)
            
            # Map email categories to preference fields
            category_mapping = {
                "engagement": preferences.engagement,
                "lifecycle": preferences.lifecycle,
                "auctions": preferences.auctions,
                "rfq": preferences.rfq,
                "reviews": preferences.reviews,
                "messaging": preferences.messaging,
                "statements": preferences.statements,
                "marketing": preferences.marketing
            }
            
            # Check specific category preference
            for category, status in category_mapping.items():
                if email_category.startswith(category) or email_category == category:
                    return status == EmailPreferenceStatus.SUBSCRIBED
            
            # Default to allow if category not found
            return True
            
        except Exception as e:
            logger.error(f"Error checking email permission for user {user_id}, category {email_category}: {str(e)}")
            return False
    
    async def unsubscribe_user(self, user_id: str, categories: List[str] = None) -> bool:
        """Unsubscribe user from specific categories or all marketing emails"""
        try:
            if categories:
                # Unsubscribe from specific categories
                updates = {}
                for category in categories:
                    if category not in self.always_send_categories:
                        # Map category to preference field
                        if category in ["engagement", "lifecycle", "auctions", "rfq", "reviews", "messaging", "statements", "marketing"]:
                            updates[category] = EmailPreferenceStatus.UNSUBSCRIBED
                
                if updates:
                    return await self.update_preferences(user_id, updates)
            else:
                # Unsubscribe from all non-transactional emails
                updates = {
                    "engagement": EmailPreferenceStatus.UNSUBSCRIBED,
                    "lifecycle": EmailPreferenceStatus.UNSUBSCRIBED,
                    "auctions": EmailPreferenceStatus.UNSUBSCRIBED,
                    "rfq": EmailPreferenceStatus.UNSUBSCRIBED,
                    "reviews": EmailPreferenceStatus.UNSUBSCRIBED,
                    "messaging": EmailPreferenceStatus.UNSUBSCRIBED,
                    "statements": EmailPreferenceStatus.UNSUBSCRIBED,
                    "marketing": EmailPreferenceStatus.UNSUBSCRIBED
                }
                return await self.update_preferences(user_id, updates)
                
            return True
            
        except Exception as e:
            logger.error(f"Error unsubscribing user {user_id}: {str(e)}")
            return False
    
    async def suppress_email(self, email: str, reason: str) -> bool:
        """Add email to suppression list (bounces, complaints, etc.)"""
        try:
            suppression_doc = {
                "email": email.lower(),
                "reason": reason,
                "suppressed_at": datetime.now(timezone.utc),
                "active": True
            }
            
            await self.suppression_collection.update_one(
                {"email": email.lower()},
                {"$set": suppression_doc},
                upsert=True
            )
            
            logger.info(f"Suppressed email {email} for reason: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Error suppressing email {email}: {str(e)}")
            return False
    
    async def is_email_suppressed(self, user_id: str = None, email: str = None) -> bool:
        """Check if email is in suppression list"""
        try:
            query = {"active": True}
            
            if email:
                query["email"] = email.lower()
            elif user_id:
                # Get user's email first
                preferences = await self.get_user_preferences(user_id)
                query["email"] = preferences.email.lower()
            else:
                return False
            
            suppression = await self.suppression_collection.find_one(query)
            return suppression is not None
            
        except Exception as e:
            logger.error(f"Error checking email suppression: {str(e)}")
            return False
    
    async def get_unsubscribe_stats(self) -> Dict[str, int]:
        """Get unsubscribe statistics for admin dashboard"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_users": {"$sum": 1},
                        "engagement_unsubscribed": {
                            "$sum": {"$cond": [{"$eq": ["$engagement", "unsubscribed"]}, 1, 0]}
                        },
                        "marketing_unsubscribed": {
                            "$sum": {"$cond": [{"$eq": ["$marketing", "unsubscribed"]}, 1, 0]}
                        },
                        "all_unsubscribed": {
                            "$sum": {"$cond": [
                                {"$and": [
                                    {"$eq": ["$engagement", "unsubscribed"]},
                                    {"$eq": ["$marketing", "unsubscribed"]},
                                    {"$eq": ["$auctions", "unsubscribed"]},
                                    {"$eq": ["$rfq", "unsubscribed"]}
                                ]}, 1, 0
                            ]}
                        }
                    }
                }
            ]
            
            result = await self.preferences_collection.aggregate(pipeline).to_list(1)
            
            if result:
                return result[0]
            else:
                return {
                    "total_users": 0,
                    "engagement_unsubscribed": 0,
                    "marketing_unsubscribed": 0,
                    "all_unsubscribed": 0
                }
                
        except Exception as e:
            logger.error(f"Error getting unsubscribe stats: {str(e)}")
            return {}
    
    def generate_unsubscribe_url(self, user_id: str, email_category: str = None) -> str:
        """Generate unsubscribe URL for email"""
        base_url = "https://stocklot.farm/unsubscribe"
        
        if email_category:
            return f"{base_url}?user={user_id}&category={email_category}"
        else:
            return f"{base_url}?user={user_id}"
    
    def generate_preferences_url(self, user_id: str) -> str:
        """Generate email preferences management URL"""
        return f"https://stocklot.farm/email-preferences?user={user_id}"

# Usage example:
if __name__ == "__main__":
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    
    async def test_preferences():
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client.stocklot_test
        
        service = EmailPreferencesService(db)
        
        # Create preferences for test user
        prefs = await service.create_default_preferences("test_user_123", "test@example.com")
        print(f"Created preferences: {prefs}")
        
        # Check if can send engagement email
        can_send = await service.can_send_email("test_user_123", "engagement")
        print(f"Can send engagement email: {can_send}")
        
        # Unsubscribe from marketing
        await service.unsubscribe_user("test_user_123", ["marketing"])
        
        # Check again
        can_send_marketing = await service.can_send_email("test_user_123", "marketing")
        print(f"Can send marketing email after unsubscribe: {can_send_marketing}")
        
        client.close()
    
    asyncio.run(test_preferences())