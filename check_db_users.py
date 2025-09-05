#!/usr/bin/env python3
"""
Check existing users in database for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_users():
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'stocklot')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check users
    users = await db.users.find({}).limit(5).to_list(length=None)
    
    print(f"📊 Found {len(users)} users in database")
    
    for user in users:
        print(f"  - {user.get('email')} ({user.get('name')}) - Roles: {user.get('roles', [])}")
    
    # Check buy requests
    buy_requests = await db.buy_requests.count_documents({})
    print(f"📝 Found {buy_requests} buy requests in database")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())