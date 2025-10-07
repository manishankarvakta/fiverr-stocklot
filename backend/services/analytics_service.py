"""
Analytics Service for StockLot Platform
Tracks PDP views, user interactions, and conversion metrics
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import uuid
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self, db):
        self.db = db
        
    async def track_pdp_view(self, listing_id: str, user_id: Optional[str] = None, 
                           ip_address: str = None, user_agent: str = None,
                           referrer: str = None, session_id: str = None):
        """Track a PDP view event"""
        try:
            view_event = {
                "id": str(uuid.uuid4()),
                "event_type": "pdp_view",
                "listing_id": listing_id,
                "user_id": user_id,
                "session_id": session_id or str(uuid.uuid4()),
                "ip_address": ip_address,
                "user_agent": user_agent,
                "referrer": referrer,
                "timestamp": datetime.now(timezone.utc),
                "metadata": {
                    "source": "web",
                    "platform": "stocklot"
                }
            }
            
            await self.db.analytics_events.insert_one(view_event)
            
            # Update listing view count
            await self.db.listings.update_one(
                {"id": listing_id},
                {
                    "$inc": {"view_count": 1},
                    "$set": {"last_viewed_at": datetime.now(timezone.utc)}
                }
            )
            
            logger.info(f"Tracked PDP view for listing {listing_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking PDP view: {e}")
            return False
    
    async def track_seller_profile_view(self, seller_id: str, user_id: Optional[str] = None,
                                      session_id: str = None):
        """Track seller profile view"""
        try:
            view_event = {
                "id": str(uuid.uuid4()),
                "event_type": "seller_profile_view",
                "seller_id": seller_id,
                "user_id": user_id,
                "session_id": session_id or str(uuid.uuid4()),
                "timestamp": datetime.now(timezone.utc)
            }
            
            await self.db.analytics_events.insert_one(view_event)
            
            # Update seller profile view count
            await self.db.users.update_one(
                {"id": seller_id},
                {
                    "$inc": {"profile_view_count": 1},
                    "$set": {"last_profile_viewed_at": datetime.now(timezone.utc)}
                }
            )
            
            return True
        except Exception as e:
            logger.error(f"Error tracking seller profile view: {e}")
            return False
    
    async def track_interaction(self, event_type: str, listing_id: str = None,
                              user_id: str = None, metadata: Dict = None):
        """Track user interactions (add to cart, contact seller, etc.)"""
        try:
            interaction_event = {
                "id": str(uuid.uuid4()),
                "event_type": event_type,
                "listing_id": listing_id,
                "user_id": user_id,
                "timestamp": datetime.now(timezone.utc),
                "metadata": metadata or {}
            }
            
            await self.db.analytics_events.insert_one(interaction_event)
            return True
        except Exception as e:
            logger.error(f"Error tracking interaction: {e}")
            return False
    
    async def get_pdp_analytics(self, days: int = 30) -> Dict:
        """Get PDP analytics for admin dashboard"""
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # PDP Views by listing
            views_pipeline = [
                {"$match": {
                    "event_type": "pdp_view",
                    "timestamp": {"$gte": start_date}
                }},
                {"$group": {
                    "_id": "$listing_id",
                    "views": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                    "last_viewed": {"$max": "$timestamp"}
                }},
                {"$project": {
                    "listing_id": "$_id",
                    "views": 1,
                    "unique_viewers": {"$size": "$unique_users"},
                    "last_viewed": 1
                }},
                {"$sort": {"views": -1}},
                {"$limit": 20}
            ]
            
            top_listings = await self.db.analytics_events.aggregate(views_pipeline).to_list(length=20)
            
            # Get listing details for top viewed listings
            for listing in top_listings:
                listing_doc = await self.db.listings.find_one({"id": listing["listing_id"]})
                if listing_doc:
                    listing["title"] = listing_doc.get("title", "Unknown")
                    listing["price"] = float(listing_doc.get("price_per_unit", 0))
                    listing["seller_id"] = listing_doc.get("seller_id")
            
            # Overall metrics
            total_views = await self.db.analytics_events.count_documents({
                "event_type": "pdp_view",
                "timestamp": {"$gte": start_date}
            })
            
            unique_viewers = await self.db.analytics_events.aggregate([
                {"$match": {
                    "event_type": "pdp_view",
                    "timestamp": {"$gte": start_date}
                }},
                {"$group": {"_id": "$user_id"}},
                {"$count": "unique_users"}
            ]).to_list(length=1)
            
            # Conversion metrics (views to cart adds)
            cart_adds = await self.db.analytics_events.count_documents({
                "event_type": "add_to_cart",
                "timestamp": {"$gte": start_date}
            })
            
            conversion_rate = (cart_adds / total_views * 100) if total_views > 0 else 0
            
            return {
                "period_days": days,
                "total_views": total_views,
                "unique_viewers": unique_viewers[0]["unique_users"] if unique_viewers else 0,
                "cart_adds": cart_adds,
                "conversion_rate": round(conversion_rate, 2),
                "top_listings": top_listings,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting PDP analytics: {e}")
            return {
                "error": "Failed to fetch analytics",
                "total_views": 0,
                "unique_viewers": 0,
                "top_listings": []
            }
    
    async def get_seller_analytics(self, seller_id: str, days: int = 30) -> Dict:
        """Get analytics for a specific seller"""
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Seller's listing views
            listing_views = await self.db.analytics_events.aggregate([
                {"$match": {
                    "event_type": "pdp_view",
                    "timestamp": {"$gte": start_date}
                }},
                {"$lookup": {
                    "from": "listings",
                    "localField": "listing_id",
                    "foreignField": "id",
                    "as": "listing"
                }},
                {"$unwind": "$listing"},
                {"$match": {"listing.seller_id": seller_id}},
                {"$group": {
                    "_id": "$listing_id",
                    "views": {"$sum": 1},
                    "title": {"$first": "$listing.title"}
                }},
                {"$sort": {"views": -1}}
            ]).to_list(length=50)
            
            # Profile views
            profile_views = await self.db.analytics_events.count_documents({
                "event_type": "seller_profile_view",
                "seller_id": seller_id,
                "timestamp": {"$gte": start_date}
            })
            
            return {
                "seller_id": seller_id,
                "period_days": days,
                "profile_views": profile_views,
                "listing_views": listing_views,
                "total_listing_views": sum(item["views"] for item in listing_views)
            }
            
        except Exception as e:
            logger.error(f"Error getting seller analytics: {e}")
            return {"error": "Failed to fetch seller analytics"}
    
    async def get_daily_metrics(self, days: int = 7) -> List[Dict]:
        """Get daily metrics for charts"""
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            daily_pipeline = [
                {"$match": {
                    "timestamp": {"$gte": start_date}
                }},
                {"$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                        "event_type": "$event_type"
                    },
                    "count": {"$sum": 1}
                }},
                {"$group": {
                    "_id": "$_id.date",
                    "events": {
                        "$push": {
                            "type": "$_id.event_type",
                            "count": "$count"
                        }
                    }
                }},
                {"$sort": {"_id": 1}}
            ]
            
            daily_data = await self.db.analytics_events.aggregate(daily_pipeline).to_list(length=days)
            
            # Format data for charts
            formatted_data = []
            for day in daily_data:
                day_data = {"date": day["_id"]}
                for event in day["events"]:
                    day_data[event["type"]] = event["count"]
                formatted_data.append(day_data)
            
            return formatted_data
            
        except Exception as e:
            logger.error(f"Error getting daily metrics: {e}")
            return []