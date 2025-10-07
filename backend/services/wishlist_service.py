"""
Wishlist Service - Comprehensive Wishlist Management
Handles wishlist functionality for listings and buy requests with database persistence
"""

import logging
import secrets
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from enum import Enum

logger = logging.getLogger(__name__)

class WishlistItemType(str, Enum):
    LISTING = "listing"
    BUY_REQUEST = "buy_request"

class WishlistCategory(str, Enum):
    FAVORITES = "favorites"
    WATCHING = "watching"
    POTENTIAL = "potential"
    COMPARE = "compare"

class WishlistItem(BaseModel):
    id: str
    user_id: str
    item_id: str  # listing_id or buy_request_id
    item_type: WishlistItemType
    category: WishlistCategory = WishlistCategory.FAVORITES
    added_at: datetime
    notes: Optional[str] = None
    price_alert_enabled: bool = False
    target_price: Optional[float] = None

class WishlistCreateRequest(BaseModel):
    item_id: str
    item_type: WishlistItemType
    category: WishlistCategory = WishlistCategory.FAVORITES
    notes: Optional[str] = None
    price_alert_enabled: bool = False
    target_price: Optional[float] = None

class WishlistUpdateRequest(BaseModel):
    category: Optional[WishlistCategory] = None
    notes: Optional[str] = None
    price_alert_enabled: Optional[bool] = None
    target_price: Optional[float] = None

class WishlistService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.wishlist_collection = db.wishlist_items
        self.users_collection = db.users
        self.listings_collection = db.listings
        self.buy_requests_collection = db.buy_requests
        
        # Create indexes
        try:
            asyncio.create_task(self._create_indexes())
        except:
            pass
    
    async def _create_indexes(self):
        """Create database indexes for performance"""
        try:
            await self.wishlist_collection.create_index([("user_id", 1), ("item_id", 1), ("item_type", 1)], unique=True)
            await self.wishlist_collection.create_index("user_id")
            await self.wishlist_collection.create_index("added_at")
            await self.wishlist_collection.create_index("item_type")
            await self.wishlist_collection.create_index("category")
            await self.wishlist_collection.create_index("price_alert_enabled")
        except Exception as e:
            logger.warning(f"Could not create wishlist indexes: {e}")
    
    def _generate_wishlist_id(self) -> str:
        """Generate unique wishlist item ID"""
        return f"wish_{secrets.token_urlsafe(12)}"
    
    async def add_to_wishlist(self, user_id: str, request_data: WishlistCreateRequest) -> Dict[str, Any]:
        """Add item to user's wishlist"""
        try:
            # Check if user exists
            user = await self.users_collection.find_one({"id": user_id})
            if not user:
                return {
                    "success": False,
                    "message": "User not found."
                }
            
            # Verify item exists and get item data
            item_exists = False
            item_data = {}
            
            if request_data.item_type == WishlistItemType.LISTING:
                item = await self.listings_collection.find_one({"id": request_data.item_id})
                if item:
                    item_exists = True
                    item_data = {
                        "title": item.get("title", ""),
                        "price": item.get("price_per_unit", 0),
                        "species": item.get("species_id", ""),
                        "location": item.get("location", ""),
                        "seller_name": item.get("seller_name", ""),
                        "images": item.get("images", [])
                    }
            elif request_data.item_type == WishlistItemType.BUY_REQUEST:
                item = await self.buy_requests_collection.find_one({"id": request_data.item_id})
                if item:
                    item_exists = True
                    item_data = {
                        "title": item.get("title", ""),
                        "target_price": item.get("target_price"),
                        "species": item.get("species_id", ""),
                        "location": item.get("province", ""),
                        "buyer_name": item.get("buyer_name", ""),
                        "deadline": item.get("deadline")
                    }
            
            if not item_exists:
                return {
                    "success": False,
                    "message": f"{request_data.item_type.value.title()} not found."
                }
            
            # Check if already in wishlist
            existing = await self.wishlist_collection.find_one({
                "user_id": user_id,
                "item_id": request_data.item_id,
                "item_type": request_data.item_type
            })
            
            if existing:
                return {
                    "success": False,
                    "message": "Item already in wishlist."
                }
            
            # Create wishlist item
            wishlist_item = {
                "id": self._generate_wishlist_id(),
                "user_id": user_id,
                "item_id": request_data.item_id,
                "item_type": request_data.item_type,
                "category": request_data.category,
                "added_at": datetime.now(timezone.utc),
                "notes": request_data.notes,
                "price_alert_enabled": request_data.price_alert_enabled,
                "target_price": request_data.target_price,
                "item_data": item_data  # Cache item info for quick display
            }
            
            await self.wishlist_collection.insert_one(wishlist_item)
            
            logger.info(f"Item added to wishlist: {request_data.item_id} for user {user_id}")
            
            return {
                "success": True,
                "wishlist_id": wishlist_item["id"],
                "message": f"{request_data.item_type.value.title()} added to wishlist!"
            }
            
        except Exception as e:
            logger.error(f"Error adding to wishlist: {e}")
            return {
                "success": False,
                "message": "Failed to add to wishlist."
            }
    
    async def remove_from_wishlist(self, user_id: str, item_id: str, item_type: WishlistItemType) -> Dict[str, Any]:
        """Remove item from user's wishlist"""
        try:
            result = await self.wishlist_collection.delete_one({
                "user_id": user_id,
                "item_id": item_id,
                "item_type": item_type
            })
            
            if result.deleted_count > 0:
                logger.info(f"Item removed from wishlist: {item_id} for user {user_id}")
                return {
                    "success": True,
                    "message": f"{item_type.value.title()} removed from wishlist."
                }
            else:
                return {
                    "success": False,
                    "message": "Item not found in wishlist."
                }
                
        except Exception as e:
            logger.error(f"Error removing from wishlist: {e}")
            return {
                "success": False,
                "message": "Failed to remove from wishlist."
            }
    
    async def get_user_wishlist(self, user_id: str, category: Optional[WishlistCategory] = None, 
                              item_type: Optional[WishlistItemType] = None) -> Dict[str, Any]:
        """Get user's wishlist items"""
        try:
            # Build query
            query = {"user_id": user_id}
            if category:
                query["category"] = category
            if item_type:
                query["item_type"] = item_type
            
            # Get wishlist items
            wishlist_items = []
            cursor = self.wishlist_collection.find(query).sort("added_at", -1)
            
            async for item in cursor:
                # Get current item data
                current_item = await self._get_current_item_data(item["item_id"], item["item_type"])
                
                wishlist_item = {
                    "id": item["id"],
                    "item_id": item["item_id"],
                    "item_type": item["item_type"],
                    "category": item["category"],
                    "added_at": item["added_at"],
                    "notes": item.get("notes"),
                    "price_alert_enabled": item.get("price_alert_enabled", False),
                    "target_price": item.get("target_price"),
                    "current_data": current_item,
                    "is_available": current_item is not None,
                    "cached_data": item.get("item_data", {})
                }
                
                wishlist_items.append(wishlist_item)
            
            # Get summary statistics
            total_items = len(wishlist_items)
            available_items = len([item for item in wishlist_items if item["is_available"]])
            listings_count = len([item for item in wishlist_items if item["item_type"] == "listing"])
            buy_requests_count = len([item for item in wishlist_items if item["item_type"] == "buy_request"])
            price_alerts_count = len([item for item in wishlist_items if item["price_alert_enabled"]])
            
            return {
                "success": True,
                "items": wishlist_items,
                "summary": {
                    "total_items": total_items,
                    "available_items": available_items,
                    "unavailable_items": total_items - available_items,
                    "listings_count": listings_count,
                    "buy_requests_count": buy_requests_count,
                    "price_alerts_count": price_alerts_count
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting user wishlist: {e}")
            return {
                "success": False,
                "message": "Failed to get wishlist.",
                "items": [],
                "summary": {}
            }
    
    async def _get_current_item_data(self, item_id: str, item_type: str) -> Optional[Dict]:
        """Get current data for wishlist item"""
        try:
            if item_type == "listing":
                item = await self.listings_collection.find_one({"id": item_id})
                if item:
                    return {
                        "id": item["id"],
                        "title": item.get("title", ""),
                        "price": item.get("price_per_unit", 0),
                        "quantity": item.get("quantity", 0),
                        "species": item.get("species_id", ""),
                        "location": item.get("location", ""),
                        "seller_name": item.get("seller_name", ""),
                        "status": item.get("status", "active"),
                        "images": item.get("images", [])
                    }
            elif item_type == "buy_request":
                item = await self.buy_requests_collection.find_one({"id": item_id})
                if item:
                    return {
                        "id": item["id"],
                        "title": item.get("title", ""),
                        "target_price": item.get("target_price"),
                        "quantity": item.get("quantity", 0),
                        "species": item.get("species_id", ""),
                        "location": item.get("province", ""),
                        "buyer_name": item.get("buyer_name", ""),
                        "status": item.get("status", "active"),
                        "deadline": item.get("deadline")
                    }
            return None
        except Exception as e:
            logger.error(f"Error getting current item data: {e}")
            return None
    
    async def check_if_wishlisted(self, user_id: str, item_id: str, item_type: WishlistItemType) -> bool:
        """Check if item is in user's wishlist"""
        try:
            item = await self.wishlist_collection.find_one({
                "user_id": user_id,
                "item_id": item_id,
                "item_type": item_type
            })
            return item is not None
        except Exception as e:
            logger.error(f"Error checking wishlist status: {e}")
            return False
    
    async def update_wishlist_item(self, user_id: str, wishlist_id: str, 
                                 update_data: WishlistUpdateRequest) -> Dict[str, Any]:
        """Update wishlist item"""
        try:
            # Build update query
            update_fields = {}
            if update_data.category is not None:
                update_fields["category"] = update_data.category
            if update_data.notes is not None:
                update_fields["notes"] = update_data.notes
            if update_data.price_alert_enabled is not None:
                update_fields["price_alert_enabled"] = update_data.price_alert_enabled
            if update_data.target_price is not None:
                update_fields["target_price"] = update_data.target_price
            
            if not update_fields:
                return {
                    "success": False,
                    "message": "No fields to update."
                }
            
            result = await self.wishlist_collection.update_one(
                {"id": wishlist_id, "user_id": user_id},
                {"$set": update_fields}
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "message": "Wishlist item updated successfully."
                }
            else:
                return {
                    "success": False,
                    "message": "Wishlist item not found or no changes made."
                }
                
        except Exception as e:
            logger.error(f"Error updating wishlist item: {e}")
            return {
                "success": False,
                "message": "Failed to update wishlist item."
            }
    
    async def get_wishlist_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get wishlist statistics for user"""
        try:
            # Get all wishlist items for user
            total_items = await self.wishlist_collection.count_documents({"user_id": user_id})
            
            # Get category breakdown
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ]
            
            category_stats = {}
            async for result in self.wishlist_collection.aggregate(pipeline):
                category_stats[result["_id"]] = result["count"]
            
            # Get item type breakdown
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": "$item_type", "count": {"$sum": 1}}}
            ]
            
            type_stats = {}
            async for result in self.wishlist_collection.aggregate(pipeline):
                type_stats[result["_id"]] = result["count"]
            
            # Get price alerts count
            price_alerts = await self.wishlist_collection.count_documents({
                "user_id": user_id,
                "price_alert_enabled": True
            })
            
            return {
                "total_items": total_items,
                "category_breakdown": category_stats,
                "type_breakdown": type_stats,
                "price_alerts_active": price_alerts
            }
            
        except Exception as e:
            logger.error(f"Error getting wishlist statistics: {e}")
            return {}