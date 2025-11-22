#!/usr/bin/env python3
"""
🔧 ENSURE USERS EXIST AND PASSWORDS WORK
This script ensures all test users exist with working passwords
Mimics the exact login endpoint logic
"""

import os
import sys
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid

# MongoDB connection - MUST match server.py
# NOTE: server.py hardcodes db_name = 'stocklotDB', so we must use that
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL') or 'mongodb://posDBUser:posDBPassword@103.239.43.246:27017/?authSource=admin'
db_name = 'stocklotDB'  # Hardcoded to match server.py line 136

def hash_password(password: str) -> str:
    """EXACT copy from server.py line 844-846"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """EXACT copy from server.py line 848-850"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def ensure_users_exist():
    """Ensure all users exist with working passwords"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔧 ENSURING USERS EXIST WITH WORKING PASSWORDS")
    print("=" * 60)
    print(f"Database: {db_name}\n")
    
    # Define all users with their credentials
    users_to_ensure = [
        {
            "id": "admin-001",
            "email": "admin@stocklot.co.za",
            "password": "Admin123!",
            "full_name": "StockLot Administrator",
            "phone": "+27123456789",
            "roles": ["admin"],
            "status": "active"
        },
        {
            "id": "admin-002",
            "email": "moderator@stocklot.co.za",
            "password": "Moderator123!",
            "full_name": "Content Moderator",
            "phone": "+27123456790",
            "roles": ["admin"],
            "status": "active"
        },
        {
            "id": "seller-001",
            "email": "farmer.john@example.com",
            "password": "Seller123!",
            "full_name": "John Farmer",
            "phone": "+27111234567",
            "roles": ["seller"],
            "status": "active"
        },
        {
            "id": "seller-002",
            "email": "poultry.expert@example.com",
            "password": "Seller123!",
            "full_name": "Sarah Poultry",
            "phone": "+27111234568",
            "roles": ["seller"],
            "status": "active"
        },
        {
            "id": "buyer-001",
            "email": "buyer.alice@example.com",
            "password": "Buyer123!",
            "full_name": "Alice Buyer",
            "phone": "+27111234571",
            "roles": ["buyer"],
            "status": "active"
        },
        {
            "id": "buyer-002",
            "email": "buyer.bob@example.com",
            "password": "Buyer123!",
            "full_name": "Bob Purchaser",
            "phone": "+27111234572",
            "roles": ["buyer"],
            "status": "active"
        }
    ]
    
    created = 0
    fixed = 0
    verified = 0
    
    for user_data in users_to_ensure:
        email = user_data["email"]
        password = user_data["password"]
        
        print(f"\n📧 {email}")
        
        # Step 1: Check if user exists (matching login endpoint logic)
        user_doc = await db.users.find_one({"email": email})
        
        if not user_doc:
            print(f"   ⚠️  User not found - creating...")
            # Create user
            hashed_pwd = hash_password(password)
            if not verify_password(password, hashed_pwd):
                print(f"   ❌ Password hash verification failed - skipping")
                continue
            
            new_user = {
                "id": user_data["id"],
                "email": email,
                "password": hashed_pwd,
                "full_name": user_data["full_name"],
                "phone": user_data.get("phone"),
                "roles": user_data["roles"],
                "status": user_data["status"],
                "is_verified": True,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.users.insert_one(new_user)
            print(f"   ✅ User created")
            created += 1
            
            # Verify it was created correctly
            verify_user = await db.users.find_one({"email": email})
            if verify_user and verify_password(password, verify_user.get("password", "")):
                print(f"   ✅ Password verified - LOGIN WILL WORK")
                verified += 1
            else:
                print(f"   ❌ Password verification failed after creation")
        else:
            print(f"   ✅ User exists: {user_doc.get('full_name', 'N/A')}")
            
            # Step 2: Check password (matching login endpoint logic)
            stored_password = user_doc.get("password")
            
            if not stored_password:
                print(f"   ⚠️  No password field - adding...")
                hashed_pwd = hash_password(password)
                await db.users.update_one({"email": email}, {"$set": {"password": hashed_pwd}})
                fixed += 1
            else:
                # Test if password works (matching login endpoint logic)
                if verify_password(password, stored_password):
                    print(f"   ✅ Password works - no fix needed")
                    verified += 1
                else:
                    print(f"   ⚠️  Password doesn't work - fixing...")
                    hashed_pwd = hash_password(password)
                    if verify_password(password, hashed_pwd):
                        await db.users.update_one({"email": email}, {"$set": {"password": hashed_pwd}})
                        # Verify fix
                        updated = await db.users.find_one({"email": email})
                        if updated and verify_password(password, updated.get("password", "")):
                            print(f"   ✅ Password fixed and verified")
                            fixed += 1
                            verified += 1
                        else:
                            print(f"   ❌ Password fix failed")
                    else:
                        print(f"   ❌ New hash doesn't work")
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"   ✅ Created: {created}")
    print(f"   🔧 Fixed: {fixed}")
    print(f"   ✅ Verified: {verified}")
    print(f"   📝 Total: {len(users_to_ensure)}")
    
    # Final test - simulate login endpoint
    print("\n" + "=" * 60)
    print("🧪 SIMULATING LOGIN ENDPOINT")
    print("=" * 60)
    
    test_email = "admin@stocklot.co.za"
    test_password = "Admin123!"
    
    print(f"\nTesting login for: {test_email}")
    print(f"Password: {test_password}\n")
    
    # Step 1: Find user (exact login endpoint logic)
    user_doc = await db.users.find_one({"email": test_email})
    if not user_doc:
        print(f"   ❌ STEP 1 FAILED: User not found")
    else:
        print(f"   ✅ STEP 1 PASSED: User found")
        
        # Step 2: Verify password (exact login endpoint logic)
        stored_pwd = user_doc.get("password")
        if not stored_pwd:
            print(f"   ❌ STEP 2 FAILED: No password field")
        elif not verify_password(test_password, stored_pwd):
            print(f"   ❌ STEP 2 FAILED: Password verification failed")
        else:
            print(f"   ✅ STEP 2 PASSED: Password verified")
            print(f"\n   🎉 LOGIN WILL WORK!")
            print(f"   You can now log in with:")
            print(f"   Email: {test_email}")
            print(f"   Password: {test_password}")
    
    client.close()
    print("\n🎉 Complete!")

if __name__ == "__main__":
    asyncio.run(ensure_users_exist())

