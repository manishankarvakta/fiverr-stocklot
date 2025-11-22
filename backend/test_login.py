#!/usr/bin/env python3
"""
🧪 Test login functionality directly
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
    """Hash password using bcrypt - EXACT match to server.py"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password - EXACT match to server.py"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"   Verification error: {e}")
        return False

async def test_login():
    """Test login for a specific user"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🧪 Testing login functionality...\n")
    
    # Test credentials
    test_email = "admin@stocklot.co.za"
    test_password = "Admin123!"
    
    print(f"Testing login for: {test_email}")
    print(f"Password: {test_password}\n")
    
    # Step 1: Find user (matching login endpoint)
    print("Step 1: Finding user in database...")
    user_doc = await db.users.find_one({"email": test_email})
    
    if not user_doc:
        print(f"   ❌ User not found!")
        print(f"   Checking all users in database...")
        count = await db.users.count_documents({})
        print(f"   Total users: {count}")
        
        # List first 10 users
        print(f"\n   First 10 users:")
        async for user in db.users.find({}, {"email": 1, "full_name": 1}).limit(10):
            print(f"      - {user.get('email')} ({user.get('full_name', 'N/A')})")
        
        client.close()
        return
    
    print(f"   ✅ User found: {user_doc.get('full_name', 'N/A')}")
    print(f"   ID: {user_doc.get('id', 'N/A')}")
    print(f"   Roles: {user_doc.get('roles', [])}")
    print(f"   Status: {user_doc.get('status', 'N/A')}")
    
    # Step 2: Check password field
    print(f"\nStep 2: Checking password field...")
    stored_password = user_doc.get("password")
    
    if not stored_password:
        print(f"   ❌ No password field found!")
        print(f"   Available fields: {list(user_doc.keys())}")
        client.close()
        return
    
    print(f"   ✅ Password field exists")
    print(f"   Password type: {type(stored_password)}")
    print(f"   Password length: {len(stored_password)}")
    print(f"   Password preview: {stored_password[:50]}...")
    
    # Step 3: Verify password (matching login endpoint)
    print(f"\nStep 3: Verifying password...")
    print(f"   Using verify_password('{test_password}', stored_hash)")
    
    try:
        is_valid = verify_password(test_password, stored_password)
        if is_valid:
            print(f"   ✅ Password verification SUCCESS!")
        else:
            print(f"   ❌ Password verification FAILED!")
            
            # Try to fix it
            print(f"\n   Attempting to fix password...")
            new_hash = hash_password(test_password)
            if verify_password(test_password, new_hash):
                print(f"   ✅ New hash works, updating database...")
                result = await db.users.update_one(
                    {"email": test_email},
                    {"$set": {"password": new_hash}}
                )
                print(f"   Update result: modified_count={result.modified_count}")
                
                # Verify it was saved
                updated_user = await db.users.find_one({"email": test_email})
                if updated_user and verify_password(test_password, updated_user.get("password", "")):
                    print(f"   ✅ Password updated and verified successfully!")
                else:
                    print(f"   ❌ Password update failed verification")
            else:
                print(f"   ❌ New hash also fails!")
    except Exception as e:
        print(f"   ❌ Verification error: {e}")
        import traceback
        traceback.print_exc()
    
    # Step 4: Test with different password formats
    print(f"\nStep 4: Testing password format...")
    if isinstance(stored_password, bytes):
        print(f"   ⚠️  Password is bytes, converting to string...")
        stored_password_str = stored_password.decode('utf-8')
        if verify_password(test_password, stored_password_str):
            print(f"   ✅ Password works after bytes->string conversion!")
        else:
            print(f"   ❌ Still fails after conversion")
    elif isinstance(stored_password, str):
        print(f"   ✅ Password is already a string")
    
    client.close()
    print(f"\n🎉 Test complete!")

if __name__ == "__main__":
    asyncio.run(test_login())

