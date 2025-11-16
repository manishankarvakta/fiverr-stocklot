#!/usr/bin/env python3
"""Test MongoDB connection from backend"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://admin:adminpassword@mongodb:27017/stocklot?authSource=admin')
    print(f"🔗 Connecting to MongoDB...")
    print(f"   URL: {mongo_url.replace('adminpassword', '***')}")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        
        # Test connection
        print("\n📡 Testing connection...")
        result = await client.admin.command('ping')
        print(f"✅ Ping successful: {result}")
        
        # Get database
        db_name = os.environ.get('DB_NAME', 'stocklot')
        db = client[db_name]
        print(f"\n📊 Accessing database: {db_name}")
        
        # List collections
        collections = await db.list_collection_names()
        print(f"📁 Collections found: {len(collections)}")
        if collections:
            print(f"   Collections: {', '.join(collections[:10])}")
            if len(collections) > 10:
                print(f"   ... and {len(collections) - 10} more")
        else:
            print("   (No collections yet - database is empty)")
        
        # Test a simple query
        print(f"\n🔍 Testing query...")
        count = await db.users.count_documents({}, limit=1)
        print(f"✅ Query successful (users collection exists)")
        
        client.close()
        print("\n✅ MongoDB connection test PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ MongoDB connection test FAILED!")
        print(f"   Error: {type(e).__name__}: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    exit(0 if success else 1)

