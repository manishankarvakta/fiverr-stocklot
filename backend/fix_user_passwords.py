#!/usr/bin/env python3
"""
🔧 Fix user passwords in database
This script will re-hash all user passwords to ensure they work with login
"""

import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL') or 'mongodb://posDBUser:posDBPassword@103.239.43.246:27017/?authSource=admin'
db_name = os.environ.get('DB_NAME') or os.environ.get('MONGO_DBNAME', 'stocklotDB')

def hash_password(password: str) -> str:
    """Hash password using bcrypt - matches server.py exactly"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def fix_user_passwords():
    """Fix all user passwords"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔧 Fixing user passwords...")
    print(f"📊 Database: {db_name}\n")
    
    # User credentials mapping
    user_credentials = {
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
    
    fixed_count = 0
    not_found_count = 0
    
    for email, password in user_credentials.items():
        user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"❌ {email} - User not found")
            not_found_count += 1
            continue
        
        # Create new password hash
        new_hash = hash_password(password)
        
        # Verify the new hash works
        if not verify_password(password, new_hash):
            print(f"❌ {email} - New hash verification failed!")
            continue
        
        # Update the password
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"password": new_hash}}
        )
        
        if result.modified_count > 0:
            # Verify it was saved correctly
            updated_user = await db.users.find_one({"email": email})
            if updated_user and verify_password(password, updated_user.get("password", "")):
                print(f"✅ {email} - Password fixed and verified")
                fixed_count += 1
            else:
                print(f"⚠️  {email} - Updated but verification failed")
        else:
            print(f"⚠️  {email} - No update needed or user not found")
    
    print(f"\n📊 Summary:")
    print(f"   Fixed: {fixed_count}")
    print(f"   Not found: {not_found_count}")
    print(f"   Total: {len(user_credentials)}")
    
    # Test login for one user
    print(f"\n🧪 Testing login for admin@stocklot.co.za...")
    admin_user = await db.users.find_one({"email": "admin@stocklot.co.za"})
    if admin_user:
        if verify_password("Admin123!", admin_user.get("password", "")):
            print(f"   ✅ Login test PASSED")
        else:
            print(f"   ❌ Login test FAILED")
    else:
        print(f"   ❌ Admin user not found")
    
    client.close()
    print("\n🎉 Password fix complete!")

if __name__ == "__main__":
    asyncio.run(fix_user_passwords())

