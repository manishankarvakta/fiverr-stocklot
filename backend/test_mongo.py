#!/usr/bin/env python3
"""Test MongoDB connection"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    try:
        # Try without database first (authSource=admin)
        client = AsyncIOMotorClient('mongodb://admin:adminpassword@localhost:27017/?authSource=admin')
        await client.admin.command('ping')
        print('✅ MongoDB connection successful')
        
        # Test database access
        db = client['stocklot']
        collections = await db.list_collection_names()
        print(f'✅ Database access OK - Collections: {len(collections)}')
        
        client.close()
        return True
    except Exception as e:
        print(f'❌ MongoDB connection failed: {e}')
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())

