"""
Public Configuration Service for StockLot Livestock Marketplace
Provides dynamic feature flags and public settings with caching
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import json

logger = logging.getLogger(__name__)

class PublicConfigService:
    def __init__(self, db):
        self.db = db
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes TTL
        self._last_update = None
    
    async def get_public_config(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Get public configuration with caching"""
        try:
            now = datetime.now(timezone.utc)
            
            # Check if cache is valid
            if (not force_refresh and 
                self._cache and 
                self._last_update and 
                (now - self._last_update).total_seconds() < self._cache_ttl):
                logger.debug("Returning cached public config")
                return self._cache
            
            # Fetch fresh config from database
            config = await self._fetch_config_from_db()
            
            # Update cache
            self._cache = config
            self._last_update = now
            
            logger.info("Refreshed public config cache")
            return config
            
        except Exception as e:
            logger.error(f"Error getting public config: {str(e)}")
            return self._get_default_config()
    
    async def _fetch_config_from_db(self) -> Dict[str, Any]:
        """Fetch configuration from database"""
        try:
            # Get feature flags
            feature_flags = await self._get_feature_flags()
            
            # Get public settings
            public_settings = await self._get_public_settings()
            
            # Get platform stats (public)
            platform_stats = await self._get_platform_stats()
            
            # Get delivery configuration
            delivery_config = await self._get_delivery_config()
            
            # Combine all config
            config = {
                "feature_flags": feature_flags,
                "settings": public_settings,
                "platform": platform_stats,
                "delivery": delivery_config,
                "cache_updated_at": datetime.now(timezone.utc).isoformat(),
                "ttl_seconds": self._cache_ttl
            }
            
            return config
            
        except Exception as e:
            logger.error(f"Error fetching config from database: {str(e)}")
            return self._get_default_config()
    
    async def _get_feature_flags(self) -> Dict[str, Any]:
        """Get active feature flags"""
        try:
            flags_docs = await self.db.feature_flags.find({"active": True}).to_list(length=None)
            
            flags = {}
            for flag_doc in flags_docs:
                flag_key = flag_doc.get("key")
                if flag_key:
                    flags[flag_key] = {
                        "enabled": flag_doc.get("enabled", False),
                        "description": flag_doc.get("description"),
                        "rollout_percentage": flag_doc.get("rollout_percentage", 100),
                        "updated_at": flag_doc.get("updated_at")
                    }
            
            return flags
            
        except Exception as e:
            logger.error(f"Error getting feature flags: {str(e)}")
            return self._get_default_feature_flags()
    
    async def _get_public_settings(self) -> Dict[str, Any]:
        """Get public settings (non-sensitive)"""
        try:
            # Get general platform settings
            settings_doc = await self.db.system_settings.find_one({"type": "public"})
            
            base_settings = {}
            if settings_doc:
                settings = settings_doc.get("settings", {})
                
                # Remove sensitive fields
                sensitive_fields = ["api_keys", "secrets", "database", "internal"]
                for field in sensitive_fields:
                    settings.pop(field, None)
                
                base_settings = settings
            
            # Get social media settings from platform_config
            social_media_doc = await self.db.platform_config.find_one({"type": "social_media"})
            if social_media_doc:
                social_media_settings = social_media_doc.get("settings", {})
                base_settings["social_media"] = social_media_settings
            else:
                # Fallback to default social media URLs
                base_settings["social_media"] = {
                    "facebook": "https://facebook.com/stocklot",
                    "twitter": "https://twitter.com/stocklot", 
                    "instagram": "https://instagram.com/stocklot",
                    "linkedin": "https://linkedin.com/company/stocklot",
                    "youtube": "https://youtube.com/@stocklot"
                }
            
            return base_settings
            
        except Exception as e:
            logger.error(f"Error getting public settings: {str(e)}")
            return {
                "social_media": {
                    "facebook": "https://facebook.com/stocklot",
                    "twitter": "https://twitter.com/stocklot", 
                    "instagram": "https://instagram.com/stocklot",
                    "linkedin": "https://linkedin.com/company/stocklot",
                    "youtube": "https://youtube.com/@stocklot"
                }
            }
    
    async def _get_platform_stats(self) -> Dict[str, Any]:
        """Get public platform statistics"""
        try:
            # Count active listings
            active_listings = await self.db.listings.count_documents({"status": "active"})
            
            # Count total users (non-sensitive)
            total_users = await self.db.users.count_documents({"is_active": {"$ne": False}})
            
            # Count successful orders
            successful_orders = await self.db.orders.count_documents({"order_status": "confirmed"})
            
            return {
                "active_listings": active_listings,
                "total_users": total_users,
                "successful_orders": successful_orders
            }
            
        except Exception as e:
            logger.error(f"Error getting platform stats: {str(e)}")
            return {
                "active_listings": 0,
                "total_users": 0,
                "successful_orders": 0
            }
    
    async def _get_delivery_config(self) -> Dict[str, Any]:
        """Get delivery configuration"""
        try:
            delivery_doc = await self.db.delivery_config.find_one({"active": True})
            
            if delivery_doc:
                return {
                    "rate_per_km": delivery_doc.get("rate_per_km", 20),
                    "minimum_fee": delivery_doc.get("minimum_fee", 50),
                    "maximum_distance": delivery_doc.get("maximum_distance", 500),
                    "currency": delivery_doc.get("currency", "ZAR"),
                    "delivery_only_mode": delivery_doc.get("delivery_only_mode", False)
                }
            
            return self._get_default_delivery_config()
            
        except Exception as e:
            logger.error(f"Error getting delivery config: {str(e)}")
            return self._get_default_delivery_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration when database is unavailable"""
        return {
            "feature_flags": self._get_default_feature_flags(),
            "settings": {},
            "platform": {
                "active_listings": 0,
                "total_users": 0,
                "successful_orders": 0
            },
            "delivery": self._get_default_delivery_config(),
            "cache_updated_at": datetime.now(timezone.utc).isoformat(),
            "ttl_seconds": self._cache_ttl,
            "source": "default"
        }
    
    def _get_default_feature_flags(self) -> Dict[str, Any]:
        """Get default feature flags"""
        return {
            "delivery_only_mode": {
                "enabled": False,
                "description": "Force delivery-only mode, disable self-collection",
                "rollout_percentage": 100
            },
            "guest_checkout": {
                "enabled": True,
                "description": "Allow guest checkout without registration",
                "rollout_percentage": 100
            },
            "advanced_search": {
                "enabled": True,
                "description": "Enable advanced search filters",
                "rollout_percentage": 100
            },
            "live_chat": {
                "enabled": False,
                "description": "Enable live chat support",
                "rollout_percentage": 0
            },
            "auction_bidding": {
                "enabled": False,
                "description": "Enable auction and bidding features",
                "rollout_percentage": 0
            }
        }
    
    def _get_default_delivery_config(self) -> Dict[str, Any]:
        """Get default delivery configuration"""
        return {
            "rate_per_km": 20,
            "minimum_fee": 50,
            "maximum_distance": 500,
            "currency": "ZAR",
            "delivery_only_mode": False
        }
    
    async def update_feature_flag(self, flag_key: str, enabled: bool, rollout_percentage: int = 100) -> bool:
        """Update a feature flag"""
        try:
            await self.db.feature_flags.update_one(
                {"key": flag_key},
                {
                    "$set": {
                        "enabled": enabled,
                        "rollout_percentage": rollout_percentage,
                        "updated_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            
            # Clear cache to force refresh
            self._cache = {}
            self._last_update = None
            
            logger.info(f"Updated feature flag {flag_key}: enabled={enabled}, rollout={rollout_percentage}%")
            return True
            
        except Exception as e:
            logger.error(f"Error updating feature flag {flag_key}: {str(e)}")
            return False
    
    async def update_delivery_config(self, config: Dict[str, Any]) -> bool:
        """Update delivery configuration"""
        try:
            # Validate config
            allowed_fields = ["rate_per_km", "minimum_fee", "maximum_distance", "currency", "delivery_only_mode"]
            cleaned_config = {k: v for k, v in config.items() if k in allowed_fields}
            
            cleaned_config["updated_at"] = datetime.now(timezone.utc)
            cleaned_config["active"] = True
            
            await self.db.delivery_config.update_one(
                {"active": True},
                {"$set": cleaned_config},
                upsert=True
            )
            
            # Clear cache to force refresh
            self._cache = {}
            self._last_update = None
            
            logger.info(f"Updated delivery config: {cleaned_config}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating delivery config: {str(e)}")
            return False
    
    async def toggle_delivery_only_mode(self, enabled: bool) -> bool:
        """Toggle delivery-only mode across the platform"""
        try:
            # Update feature flag
            await self.update_feature_flag("delivery_only_mode", enabled)
            
            # Update delivery config
            await self.update_delivery_config({"delivery_only_mode": enabled})
            
            logger.info(f"Toggled delivery-only mode: {enabled}")
            return True
            
        except Exception as e:
            logger.error(f"Error toggling delivery-only mode: {str(e)}")
            return False