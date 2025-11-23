#!/usr/bin/env python3
"""
🔍 Diagnostic script to check user data and password verification
"""

import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL') or 'mongodb://posDBUser:posDBPassword@103.239.43.246:27017/?authSource=admin'
db_name = os.environ.get('DB_NAME') or os.environ.get('MONGO_DBNAME', 'stocklotDB')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"   Error verifying: {e}")
        return False

async def check_users():
    """Check users in database"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔍 Checking users in database...")
    print(f"📊 Database: {db_name}\n")
    
    # Test emails
    test_emails = [
        "admin@stocklot.co.za",
        "farmer.john@example.com",
        "buyer.alice@example.com"
    ]
    
    for email in test_emails:
        print(f"Checking: {email}")
        user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"   ❌ User not found in database")
            continue
        
        print(f"   ✅ User found: {user.get('full_name', 'N/A')}")
        print(f"   ID: {user.get('id', 'N/A')}")
        print(f"   Roles: {user.get('roles', [])}")
        print(f"   Status: {user.get('status', 'N/A')}")
        
        password_hash = user.get("password")
        if not password_hash:
            print(f"   ❌ No password field found!")
        else:
            print(f"   ✅ Password field exists (length: {len(password_hash)})")
            print(f"   Password hash preview: {password_hash[:20]}...")
            
            # Test password verification
            test_passwords = {
                "admin@stocklot.co.za": "Admin123!",
                "moderator@stocklot.co.za": "Moderator123!",
                "farmer.john@example.com": "Seller123!",
                "poultry.expert@example.com": "Seller123!",
                "goat.specialist@example.com": "Seller123!",
                "exotic.livestock@example.com": "Seller123!",
                "buyer.alice@example.com": "Buyer123!",
                "buyer.bob@example.com": "Buyer123!",
                "buyer.charlie@example.com": "Buyer123!",
                "farmer.buyer@example.com": "User123!"
            }
            
            test_pwd = test_passwords.get(email, "Unknown")
            if verify_password(test_pwd, password_hash):
                print(f"   ✅ Password verification SUCCESS with: {test_pwd}")
            else:
                print(f"   ❌ Password verification FAILED with: {test_pwd}")
                # Try to create a new hash
                new_hash = bcrypt.hashpw(test_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                if verify_password(test_pwd, new_hash):
                    print(f"   🔄 New hash works! Updating password...")
                    await db.users.update_one(
                        {"email": email},
                        {"$set": {"password": new_hash}}
                    )
                    print(f"   ✅ Password updated successfully")
        
        print()
    
    # Count all users
    total_users = await db.users.count_documents({})
    print(f"📊 Total users in database: {total_users}")
    
    # List all user emails
    print("\n📋 All users in database:")
    async for user in db.users.find({}, {"email": 1, "full_name": 1, "roles": 1}):
        print(f"   - {user.get('email')} ({user.get('full_name', 'N/A')}) - Roles: {user.get('roles', [])}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())

