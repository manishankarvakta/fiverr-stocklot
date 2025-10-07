# 🗄️ FEE SYSTEM DATABASE SETUP
# Create collections and indexes for fee system

import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import IndexModel, ASCENDING, DESCENDING
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class FeeSystemDatabaseSetup:
    """Setup database collections and indexes for fee system"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def setup_fee_collections(self):
        """Create all fee-related collections and indexes"""
        try:
            logger.info("Setting up fee system database collections and indexes")
            
            # Create indexes for fee_configs collection
            await self._setup_fee_configs_indexes()
            
            # Create indexes for seller_order_fees collection
            await self._setup_seller_order_fees_indexes()
            
            # Create indexes for payouts collection
            await self._setup_payouts_indexes()
            
            # Create indexes for webhook_events collection
            await self._setup_webhook_events_indexes()
            
            # Initialize default fee configuration
            await self._initialize_default_fee_config()
            
            logger.info("Fee system database setup completed successfully")
            
        except Exception as e:
            logger.error(f"Fee system database setup failed: {e}")
            raise
    
    async def _setup_fee_configs_indexes(self):
        """Create indexes for fee_configs collection"""
        try:
            collection = self.db.fee_configs
            
            indexes = [
                # Primary key
                IndexModel(
                    [("id", ASCENDING)],
                    unique=True,
                    name="fee_config_id_unique"
                ),
                
                # Active configuration lookup
                IndexModel(
                    [("is_active", ASCENDING)],
                    unique=True,
                    partialFilterExpression={"is_active": True},
                    name="active_fee_config_unique"
                ),
                
                # Effective date range queries
                IndexModel(
                    [
                        ("effective_from", ASCENDING),
                        ("effective_to", ASCENDING),
                        ("is_active", ASCENDING)
                    ],
                    name="fee_config_effective_dates"
                ),
                
                # Configuration name lookup
                IndexModel(
                    [("name", ASCENDING)],
                    unique=True,
                    name="fee_config_name_unique"
                ),
                
                # Model type filtering
                IndexModel(
                    [("model", ASCENDING), ("is_active", ASCENDING)],
                    name="fee_config_model_active"
                ),
                
                # Creation date for admin listing
                IndexModel(
                    [("created_at", DESCENDING)],
                    name="fee_config_created_desc"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for fee_configs collection")
            
        except Exception as e:
            logger.error(f"Failed to create fee_configs indexes: {e}")
            raise
    
    async def _setup_seller_order_fees_indexes(self):
        """Create indexes for seller_order_fees collection"""
        try:
            collection = self.db.seller_order_fees
            
            indexes = [
                # Primary key
                IndexModel(
                    [("id", ASCENDING)],
                    unique=True,
                    name="seller_order_fees_id_unique"
                ),
                
                # Seller order lookup (for payouts)
                IndexModel(
                    [("seller_order_id", ASCENDING)],
                    unique=True,
                    name="seller_order_id_unique"
                ),
                
                # Fee config reference
                IndexModel(
                    [("fee_config_id", ASCENDING)],
                    name="seller_order_fees_config_ref"
                ),
                
                # Analytics queries by model type
                IndexModel(
                    [
                        ("model", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="seller_order_fees_model_date"
                ),
                
                # Revenue analysis queries
                IndexModel(
                    [
                        ("created_at", DESCENDING),
                        ("model", ASCENDING)
                    ],
                    name="seller_order_fees_date_model"
                ),
                
                # Currency filtering
                IndexModel(
                    [("currency", ASCENDING), ("created_at", DESCENDING)],
                    name="seller_order_fees_currency_date"
                ),
                
                # Compound index for revenue aggregations
                IndexModel(
                    [
                        ("created_at", ASCENDING),
                        ("currency", ASCENDING),
                        ("model", ASCENDING)
                    ],
                    name="seller_order_fees_aggregation"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for seller_order_fees collection")
            
        except Exception as e:
            logger.error(f"Failed to create seller_order_fees indexes: {e}")
            raise
    
    async def _setup_payouts_indexes(self):
        """Create indexes for payouts collection"""
        try:
            collection = self.db.payouts
            
            indexes = [
                # Primary key
                IndexModel(
                    [("id", ASCENDING)],
                    unique=True,
                    name="payout_id_unique"
                ),
                
                # Seller order reference
                IndexModel(
                    [("seller_order_id", ASCENDING)],
                    unique=True,
                    name="payout_seller_order_unique"
                ),
                
                # Status-based queries
                IndexModel(
                    [
                        ("status", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="payout_status_date"
                ),
                
                # Transfer reference lookup
                IndexModel(
                    [("transfer_ref", ASCENDING)],
                    sparse=True,
                    name="payout_transfer_ref"
                ),
                
                # Currency and date for analytics
                IndexModel(
                    [
                        ("currency", ASCENDING),
                        ("created_at", DESCENDING)
                    ],
                    name="payout_currency_date"
                ),
                
                # Failed payout analysis
                IndexModel(
                    [
                        ("status", ASCENDING),
                        ("attempts", DESCENDING),
                        ("updated_at", DESCENDING)
                    ],
                    name="payout_failure_analysis"
                ),
                
                # Amount-based queries for reporting
                IndexModel(
                    [
                        ("amount_minor", DESCENDING),
                        ("status", ASCENDING)
                    ],
                    name="payout_amount_status"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for payouts collection")
            
        except Exception as e:
            logger.error(f"Failed to create payouts indexes: {e}")
            raise
    
    async def _setup_webhook_events_indexes(self):
        """Create indexes for webhook_events collection"""
        try:
            collection = self.db.webhook_events
            
            indexes = [
                # Idempotency constraint
                IndexModel(
                    [("provider", ASCENDING), ("event_id", ASCENDING)],
                    unique=True,
                    name="webhook_event_idempotency"
                ),
                
                # Provider-based queries
                IndexModel(
                    [
                        ("provider", ASCENDING),
                        ("received_at", DESCENDING)
                    ],
                    name="webhook_provider_date"
                ),
                
                # Recent events lookup
                IndexModel(
                    [("received_at", DESCENDING)],
                    name="webhook_recent_events"
                ),
                
                # Event type analysis (if payload contains event type)
                IndexModel(
                    [("payload.event", ASCENDING), ("received_at", DESCENDING)],
                    sparse=True,
                    name="webhook_event_type_date"
                )
            ]
            
            await collection.create_indexes(indexes)
            logger.info(f"Created {len(indexes)} indexes for webhook_events collection")
            
        except Exception as e:
            logger.error(f"Failed to create webhook_events indexes: {e}")
            raise
    
    async def _initialize_default_fee_config(self):
        """Initialize default fee configuration if none exists"""
        try:
            # Check if any active config exists
            existing_config = await self.db.fee_configs.find_one({"is_active": True})
            
            if not existing_config:
                logger.info("No active fee configuration found, creating default")
                
                default_config = {
                    "id": "default-za-2025",
                    "name": "Default South Africa 2025",
                    "platform_commission_pct": 10.0,
                    "seller_payout_fee_pct": 2.5,
                    "buyer_processing_fee_pct": 1.5,
                    "escrow_service_fee_minor": 2500,  # R25.00
                    "model": "SELLER_PAYS",
                    "applies_to": {},
                    "is_active": True,
                    "effective_from": datetime.now(timezone.utc),
                    "effective_to": None,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                await self.db.fee_configs.insert_one(default_config)
                logger.info("Created default fee configuration")
            else:
                logger.info("Active fee configuration already exists")
                
        except Exception as e:
            logger.error(f"Failed to initialize default fee config: {e}")
            # Don't raise - this is not critical for system operation
    
    async def check_fee_system_performance(self):
        """Check fee system performance and suggest optimizations"""
        try:
            logger.info("Checking fee system performance")
            
            # Get collection stats
            fee_configs_stats = await self.db.command("collStats", "fee_configs")
            seller_order_fees_stats = await self.db.command("collStats", "seller_order_fees")
            payouts_stats = await self.db.command("collStats", "payouts")
            webhook_events_stats = await self.db.command("collStats", "webhook_events")
            
            stats = {
                "fee_configs": {
                    "count": fee_configs_stats.get("count", 0),
                    "size": fee_configs_stats.get("size", 0),
                    "avgObjSize": fee_configs_stats.get("avgObjSize", 0),
                    "indexSizes": fee_configs_stats.get("indexSizes", {}),
                },
                "seller_order_fees": {
                    "count": seller_order_fees_stats.get("count", 0),
                    "size": seller_order_fees_stats.get("size", 0),
                    "avgObjSize": seller_order_fees_stats.get("avgObjSize", 0),
                    "indexSizes": seller_order_fees_stats.get("indexSizes", {}),
                },
                "payouts": {
                    "count": payouts_stats.get("count", 0),
                    "size": payouts_stats.get("size", 0),
                    "avgObjSize": payouts_stats.get("avgObjSize", 0),
                    "indexSizes": payouts_stats.get("indexSizes", {}),
                },
                "webhook_events": {
                    "count": webhook_events_stats.get("count", 0),
                    "size": webhook_events_stats.get("size", 0),
                    "avgObjSize": webhook_events_stats.get("avgObjSize", 0),
                    "indexSizes": webhook_events_stats.get("indexSizes", {}),
                }
            }
            
            logger.info(f"Fee system collection stats: {stats}")
            
            # Performance recommendations
            recommendations = []
            
            # Check if seller_order_fees is growing large
            if stats["seller_order_fees"]["count"] > 100000:
                recommendations.append(
                    "Consider archiving old seller_order_fees records older than 2 years"
                )
            
            # Check webhook events size
            if stats["webhook_events"]["count"] > 50000:
                recommendations.append(
                    "Consider implementing webhook events cleanup for events older than 6 months"
                )
            
            # Check index efficiency
            for collection, data in stats.items():
                if data["count"] > 1000:
                    total_index_size = sum(data["indexSizes"].values())
                    if total_index_size > data["size"] * 2:
                        recommendations.append(
                            f"Consider reviewing indexes for {collection} - index size is very large"
                        )
            
            if recommendations:
                logger.info(f"Performance recommendations: {recommendations}")
            else:
                logger.info("Fee system performance looks good")
            
            return {
                "stats": stats,
                "recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Failed to check fee system performance: {e}")
            return {}
    
    async def cleanup_old_webhook_events(self, days_to_keep: int = 180):
        """Clean up old webhook events"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timezone.timedelta(days=days_to_keep)
            
            result = await self.db.webhook_events.delete_many({
                "received_at": {"$lt": cutoff_date}
            })
            
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} old webhook events")
            
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup webhook events: {e}")
            return 0
    
    async def archive_old_fee_snapshots(self, days_to_keep: int = 730):
        """Archive old fee snapshots (keep for 2 years)"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timezone.timedelta(days=days_to_keep)
            
            # For now, just log what would be archived
            # In production, you might move to an archive collection
            count = await self.db.seller_order_fees.count_documents({
                "created_at": {"$lt": cutoff_date}
            })
            
            logger.info(f"Found {count} fee snapshots eligible for archival (older than {days_to_keep} days)")
            
            # Uncomment to actually archive:
            # result = await self.db.seller_order_fees.delete_many({
            #     "created_at": {"$lt": cutoff_date}
            # })
            # return result.deleted_count
            
            return 0
            
        except Exception as e:
            logger.error(f"Failed to archive fee snapshots: {e}")
            return 0
    
    async def drop_fee_collections(self):
        """Drop all fee system collections (use with caution!)"""
        try:
            logger.warning("Dropping all fee system collections")
            
            collections_to_drop = [
                "fee_configs",
                "seller_order_fees",
                "payouts",
                "webhook_events"
            ]
            
            for collection_name in collections_to_drop:
                try:
                    await self.db.drop_collection(collection_name)
                    logger.info(f"Dropped collection: {collection_name}")
                except Exception as e:
                    logger.warning(f"Failed to drop collection {collection_name}: {e}")
            
            logger.warning("Fee system collections dropped")
            
        except Exception as e:
            logger.error(f"Failed to drop fee collections: {e}")
            raise

# Utility function for easy setup
async def setup_fee_database(db: AsyncIOMotorDatabase):
    """Convenience function to setup fee system database"""
    setup = FeeSystemDatabaseSetup(db)
    await setup.setup_fee_collections()
    return setup