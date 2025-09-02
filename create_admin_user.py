#!/usr/bin/env python3
import asyncio
import os
import uuid
import bcrypt
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_admin_user():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if admin exists
    existing_admin = await db.users.find_one({"email": "admin@stocklot.co.za"})
    if existing_admin:
        print("✅ Admin user already exists")
        client.close()
        return
    
    # Create admin user
    admin_user_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@stocklot.co.za",
        "full_name": "System Administrator",
        "phone": "+27 123 456 789",
        "roles": ["admin", "seller", "buyer"],
        "is_verified": True,
        "password": hash_password("admin123"),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(admin_user_data)
    print("✅ Created admin user: admin@stocklot.co.za / admin123")
    
    # Create a test buyer user too
    buyer_check = await db.users.find_one({"email": "buyer@test.com"})
    if not buyer_check:
        buyer_user_data = {
            "id": str(uuid.uuid4()),
            "email": "buyer@test.com",
            "full_name": "Test Buyer",
            "phone": "+27 111 222 333",
            "roles": ["buyer"],
            "is_verified": True,
            "password": hash_password("buyer123"),
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(buyer_user_data)
        print("✅ Created test buyer: buyer@test.com / buyer123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())