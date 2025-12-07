#!/usr/bin/env python3
"""Clear all buy requests from the database"""

import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection - match server.py logic exactly
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL')
if not mongo_url:
    # Use same default as server.py
    mongo_url = 'mongodb://admin:adminpassword@stocklot-mongodb:27017/'
    print("Using Docker Compose MongoDB URL (same as server.py)")
else:
    print(f"Using MongoDB URL from environment: {mongo_url}")

db_name = 'stocklot'

async def clear_buy_requests():
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # Count before clearing
        count_before = await db.buy_requests.count_documents({})
        print(f"📊 Buy requests before clearing: {count_before}")
        
        # Clear all buy requests
        result = await db.buy_requests.delete_many({})
        print(f"✅ Deleted {result.deleted_count} buy requests")
        
        # Also clear buy request offers
        offers_count = await db.buy_request_offers.count_documents({})
        if offers_count > 0:
            offers_result = await db.buy_request_offers.delete_many({})
            print(f"✅ Deleted {offers_result.deleted_count} buy request offers")
        
        # Verify
        count_after = await db.buy_requests.count_documents({})
        print(f"📊 Buy requests after clearing: {count_after}")
        
        client.close()
        print("\n✅ Buy requests cleared successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(clear_buy_requests())

