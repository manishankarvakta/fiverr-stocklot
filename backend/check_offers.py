#!/usr/bin/env python3
"""Check if offers collection exists and has data"""

import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL') or 'mongodb://admin:adminpassword@clients-stocklot-z8penj-mongodb-1:27025/'
db_name = 'stocklot'

async def check_offers():
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # List all collections
        collections = await db.list_collection_names()
        print(f"\n📋 Collections in database '{db_name}':")
        for col in sorted(collections):
            count = await db[col].count_documents({})
            print(f"   - {col}: {count} documents")
        
        # Check buy_request_offers specifically
        print(f"\n💼 Checking buy_request_offers collection...")
        offers_count = await db.buy_request_offers.count_documents({})
        print(f"   Total offers: {offers_count}")
        
        if offers_count > 0:
            # Get a sample offer
            sample = await db.buy_request_offers.find_one({})
            print(f"\n📄 Sample offer structure:")
            for key, value in sample.items():
                if key != '_id':
                    print(f"   {key}: {value}")
            
            # Check buy_requests
            buy_requests_count = await db.buy_requests.count_documents({})
            print(f"\n📋 Buy requests count: {buy_requests_count}")
            
            # Check if offers have matching buy_requests
            offers = await db.buy_request_offers.find({}).to_list(length=10)
            print(f"\n🔗 Checking offer-to-request links...")
            for offer in offers[:3]:
                request_id = offer.get('request_id') or offer.get('buy_request_id')
                if request_id:
                    request = await db.buy_requests.find_one({"id": request_id})
                    if request:
                        print(f"   ✅ Offer {offer.get('id')} → Request {request_id} (found)")
                    else:
                        print(f"   ❌ Offer {offer.get('id')} → Request {request_id} (NOT FOUND)")
        else:
            print("\n⚠️  No offers found in buy_request_offers collection")
            print("   Run: python seed_buy_requests_and_offers.py")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_offers())

