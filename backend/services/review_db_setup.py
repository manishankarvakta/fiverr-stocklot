# 🗄️ REVIEW DATABASE SETUP
# Create indexes and initialize collections for review system

import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import IndexModel, ASCENDING, DESCENDING

logger = logging.getLogger(__name__)

class ReviewDatabaseSetup:
    """Setup database collections and indexes for review system"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def setup_review_collections(self):
        """Create all review-related collections and indexes"""
        try:
            logger.info("Setting up review system database collections and indexes")
            
            # Create indexes for user_reviews collection
            await self._setup_user_reviews_indexes()
            
            # Create indexes for seller_rating_stats collection
            await self._setup_seller_stats_indexes()
            
            # Create indexes for buyer_rating_stats collection
            await self._setup_buyer_stats_indexes()
            
            # Ensure existing collections have proper indexes
            await self._ensure_order_indexes()
            
            logger.info("Review system database setup completed successfully")
            
        except Exception as e:
            logger.error(f"Review database setup failed: {e}")
            raise
    
    async def _setup_user_reviews_indexes(self):
        """Create indexes for user_reviews collection"""
        try:
            collection = self.db.user_reviews
            
            # Create indexes for fast queries
            indexes = [
                # Unique constraint: one review per order per direction
                IndexModel(
                    [
                        ("reviewer_user_id", ASCENDING),
                        ("order_group_id", ASCENDING),
                        ("subject_user_id", ASCENDING),
                        ("direction", ASCENDING)
                    ],
                    unique=True,
                    name="unique_review_per_order_direction"
                ),
                
                # Fast seller profile queries
                IndexModel(
                    [
                        ("subject_user_id", ASCENDING),
                        ("moderation_status", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="seller_reviews_public"
                ),
                
                # Fast order group queries
                IndexModel(
                    [("order_group_id", ASCENDING)],
                    name="reviews_by_order"
                ),
                
                # Unblinding job queries
                IndexModel(
                    [
                        ("blind_until", ASCENDING),
                        ("moderation_status", ASCENDING)
                    ],
                    name="unblind_reviews_job"
                ),
                
                # Moderation queue queries
                IndexModel(
                    [
                        ("moderation_status", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="moderation_queue"
                ),
                
                # Analytics queries
                IndexModel(
                    [
                        ("direction", ASCENDING),
                        ("moderation_status", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="review_analytics"
                ),
                
                # Reviewer profile queries
                IndexModel(
                    [
                        ("reviewer_user_id", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="reviews_by_reviewer"
                ),
                
                # High toxicity auto-flagging
                IndexModel(
                    [
                        ("toxicity_score", DESCENDING),
                        ("moderation_status", ASCENDING)
                    ],
                    name="toxicity_flagging"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for user_reviews collection")
            
        except Exception as e:
            logger.error(f"Failed to create user_reviews indexes: {e}")
            raise
    
    async def _setup_seller_stats_indexes(self):
        """Create indexes for seller_rating_stats collection"""
        try:
            collection = self.db.seller_rating_stats
            
            indexes = [
                # Primary key
                IndexModel(
                    [("seller_id", ASCENDING)],
                    unique=True,
                    name="seller_id_unique"
                ),
                
                # Search and ranking by rating
                IndexModel(
                    [
                        ("avg_rating_bayes", DESCENDING),
                        ("ratings_count", DESCENDING)
                    ],
                    name="seller_ranking"
                ),
                
                # Recent activity
                IndexModel(
                    [("last_review_at", DESCENDING)],
                    name="seller_recent_activity"
                ),
                
                # High-rated sellers
                IndexModel(
                    [
                        ("avg_rating_bayes", DESCENDING),
                        ("ratings_count", ASCENDING)
                    ],
                    name="high_rated_sellers"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for seller_rating_stats collection")
            
        except Exception as e:
            logger.error(f"Failed to create seller_rating_stats indexes: {e}")
            raise
    
    async def _setup_buyer_stats_indexes(self):
        """Create indexes for buyer_rating_stats collection"""
        try:
            collection = self.db.buyer_rating_stats
            
            indexes = [
                # Primary key
                IndexModel(
                    [("buyer_id", ASCENDING)],
                    unique=True,
                    name="buyer_id_unique"
                ),
                
                # Reliability scoring for sellers
                IndexModel(
                    [
                        ("reliability_score", DESCENDING),
                        ("ratings_count", DESCENDING)
                    ],
                    name="buyer_reliability_ranking"
                ),
                
                # Recent activity
                IndexModel(
                    [("last_review_at", DESCENDING)],
                    name="buyer_recent_activity"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for buyer_rating_stats collection")
            
        except Exception as e:
            logger.error(f"Failed to create buyer_rating_stats indexes: {e}")
            raise
    
    async def _ensure_order_indexes(self):
        """Ensure order_groups collection has necessary indexes for reviews"""
        try:
            collection = self.db.order_groups
            
            # Check if indexes exist, create if missing
            existing_indexes = await collection.list_indexes().to_list(length=None)
            existing_index_names = {idx["name"] for idx in existing_indexes}
            
            new_indexes = []
            
            # Buyer orders index
            if "buyer_orders_status" not in existing_index_names:
                new_indexes.append(
                    IndexModel(
                        [
                            ("buyer_id", ASCENDING),
                            ("status", ASCENDING),
                            ("delivered_at", DESCENDING)
                        ],
                        name="buyer_orders_status"
                    )
                )
            
            # Seller orders index
            if "seller_orders_status" not in existing_index_names:
                new_indexes.append(
                    IndexModel(
                        [
                            ("seller_id", ASCENDING),
                            ("status", ASCENDING),
                            ("delivered_at", DESCENDING)
                        ],
                        name="seller_orders_status"
                    )
                )
            
            # Order ID lookup
            if "order_id_lookup" not in existing_index_names:
                new_indexes.append(
                    IndexModel(
                        [("id", ASCENDING)],
                        unique=True,
                        name="order_id_lookup"
                    )
                )
            
            if new_indexes:
                await collection.create_indexes(new_indexes)
                logger.info(f"Created {len(new_indexes)} additional indexes for order_groups collection")
            
        except Exception as e:
            logger.error(f"Failed to ensure order_groups indexes: {e}")
            # Don't raise - this is not critical for review system
    
    async def check_index_performance(self):
        """Check index performance and suggest optimizations"""
        try:
            logger.info("Checking review system index performance")
            
            # Get collection stats
            user_reviews_stats = await self.db.command("collStats", "user_reviews")
            seller_stats_stats = await self.db.command("collStats", "seller_rating_stats")
            buyer_stats_stats = await self.db.command("collStats", "buyer_rating_stats")
            
            stats = {
                "user_reviews": {
                    "count": user_reviews_stats.get("count", 0),
                    "size": user_reviews_stats.get("size", 0),
                    "avgObjSize": user_reviews_stats.get("avgObjSize", 0),
                    "indexSizes": user_reviews_stats.get("indexSizes", {}),
                },
                "seller_rating_stats": {
                    "count": seller_stats_stats.get("count", 0),
                    "size": seller_stats_stats.get("size", 0),
                    "indexSizes": seller_stats_stats.get("indexSizes", {}),
                },
                "buyer_rating_stats": {
                    "count": buyer_stats_stats.get("count", 0),
                    "size": buyer_stats_stats.get("size", 0),
                    "indexSizes": buyer_stats_stats.get("indexSizes", {}),
                }
            }
            
            logger.info(f"Review system collection stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to check index performance: {e}")
            return {}
    
    async def drop_review_collections(self):
        """Drop all review collections (use with caution!)"""
        try:
            logger.warning("Dropping all review system collections")
            
            collections_to_drop = [
                "user_reviews",
                "seller_rating_stats", 
                "buyer_rating_stats"
            ]
            
            for collection_name in collections_to_drop:
                try:
                    await self.db.drop_collection(collection_name)
                    logger.info(f"Dropped collection: {collection_name}")
                except Exception as e:
                    logger.warning(f"Failed to drop collection {collection_name}: {e}")
            
            logger.warning("Review system collections dropped")
            
        except Exception as e:
            logger.error(f"Failed to drop review collections: {e}")
            raise

# Utility function for easy setup
async def setup_review_database(db: AsyncIOMotorDatabase):
    """Convenience function to setup review database"""
    setup = ReviewDatabaseSetup(db)
    await setup.setup_review_collections()
    return setup