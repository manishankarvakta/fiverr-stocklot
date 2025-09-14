#!/usr/bin/env python3
"""
🧹 CLEANUP TEST DATA FOR PRODUCTION
Remove all test data from the StockLot database and prepare for real users
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import bcrypt
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cleanup_test_data():
    """Clean up all test data from the database"""
    try:
        # Connect to MongoDB
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db = client.stocklot
        
        logger.info("🧹 Starting cleanup of test data...")
        
        # Collections to clean up
        cleanup_operations = [
            # Remove test users (keep admin for now)
            ("users", {"email": {"$regex": "test|demo|@example\\.com"}}),
            
            # Remove all test listings
            ("listings", {"title": {"$regex": "test|demo|sample", "$options": "i"}}),
            
            # Remove all orders and transactions
            ("orders", {}),
            ("transactions", {}),
            ("escrow_transactions", {}),
            
            # Remove all cart data
            ("carts", {}),
            ("cart_snapshots", {}),
            
            # Remove analytics and tracking data
            ("analytics_events", {}),
            ("lifecycle_events", {}),
            ("sessions", {}),
            
            # Remove marketing and campaign data
            ("marketing_subscriptions", {}),
            ("campaign_sends", {}),
            
            # Remove notifications
            ("notifications", {}),
            
            # Remove test conversations and messages
            ("conversations", {}),
            ("messages", {}),
            
            # Remove buy requests and offers
            ("buy_requests", {}),
            ("offers", {}),
            
            # Remove reviews and ratings
            ("reviews", {}),
            ("ratings", {}),
            
            # Remove reports and disputes
            ("reports", {}),
            ("disputes", {}),
            
            # Reset system counters
            ("counters", {}),
            
            # Remove referral data
            ("referrals", {}),
            
            # Remove A/B testing data
            ("ab_experiments", {}),
            ("ab_participations", {}),
            
            # Remove AI/ML data
            ("ml_training_data", {}),
            ("user_preferences", {}),
            
            # Remove webhook logs
            ("webhook_logs", {}),
            
            # Remove audit logs
            ("audit_logs", {}),
        ]
        
        total_deleted = 0
        
        for collection_name, filter_query in cleanup_operations:
            try:
                collection = db[collection_name]
                
                # Count documents before deletion
                count_before = await collection.count_documents(filter_query)
                
                if count_before > 0:
                    # Delete documents
                    result = await collection.delete_many(filter_query)
                    deleted_count = result.deleted_count
                    total_deleted += deleted_count
                    
                    logger.info(f"  📦 {collection_name}: Deleted {deleted_count} documents")
                else:
                    logger.info(f"  📦 {collection_name}: No documents to delete")
                    
            except Exception as e:
                logger.warning(f"  ⚠️ {collection_name}: Error during cleanup - {e}")
        
        # Create a production admin user if needed
        admin_exists = await db.users.find_one({"email": "admin@stocklot.co.za"})
        if not admin_exists:
            admin_user = {
                "id": "admin-001",
                "email": "admin@stocklot.co.za",
                "full_name": "StockLot Administrator",
                "phone": "+27123456789",
                "password_hash": bcrypt.hashpw("SecureAdmin2024!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                "roles": ["admin", "seller", "buyer"],
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "profile_completion_score": 100.0
            }
            
            await db.users.insert_one(admin_user)
            logger.info("  👤 Created production admin user")
        
        # Initialize lifecycle email system tables
        logger.info("🔧 Initializing lifecycle email system...")
        
        # Create indexes for performance
        await db.marketing_subscriptions.create_index("email", unique=True)
        await db.sessions.create_index("id", unique=True)
        await db.cart_snapshots.create_index([("session_id", 1), ("made_at", -1)])
        await db.lifecycle_events.create_index([("event_type", 1), ("occurred_at", -1)])
        await db.campaign_sends.create_index([("email", 1), ("campaign_code", 1), ("sent_at", -1)])
        
        logger.info("  📊 Created database indexes for lifecycle emails")
        
        # Create sample platform settings for production
        settings_exists = await db.platform_settings.find_one({})
        if not settings_exists:
            platform_settings = {
                "platform_name": "StockLot",
                "platform_description": "South Africa's Premier Livestock Marketplace",
                "support_email": "support@stocklot.co.za",
                "processing_fee": 1.5,
                "escrow_fee": 25.0,
                "min_listing_price": 100,
                "max_listing_price": 1000000,
                "enable_exotic_animals": True,
                "enable_auctions": True,
                "maintenance_mode": False,
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.platform_settings.insert_one(platform_settings)
            logger.info("  ⚙️ Created production platform settings")
        
        client.close()
        
        logger.info(f"✅ Cleanup completed! Deleted {total_deleted} test documents")
        logger.info("🚀 Database is now ready for production users!")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error during cleanup: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(cleanup_test_data())