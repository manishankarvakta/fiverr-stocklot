#!/usr/bin/env python3
"""
🔧 COMPREHENSIVE PASSWORD FIX SCRIPT
Fixes all user passwords to ensure login works
"""

import os
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# MongoDB connection - MUST match server.py
# NOTE: server.py hardcodes db_name = 'stocklotDB', so we must use that
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL') or 'mongodb://posDBUser:posDBPassword@103.239.43.246:27017/?authSource=admin'
db_name = 'stocklotDB'  # Hardcoded to match server.py line 136

def hash_password(password: str) -> str:
    """Hash password - EXACT copy from server.py line 844-846"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password - EXACT copy from server.py line 848-850"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"   Error: {e}")
        return False

async def fix_all_passwords():
    """Fix all user passwords"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔧 FIXING ALL USER PASSWORDS")
    print("=" * 50)
    print(f"Database: {db_name}")
    print(f"MongoDB URL: {mongo_url.split('@')[0]}@***")
    print("=" * 50 + "\n")
    
    # User credentials - MUST match seed script
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
    
    fixed = 0
    not_found = 0
    failed = 0
    
    for email, password in user_credentials.items():
        print(f"\n📧 Processing: {email}")
        
        # Find user (case-insensitive search)
        user = await db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        
        if not user:
            # Try exact match
            user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"   ❌ User not found in database")
            not_found += 1
            continue
        
        print(f"   ✅ User found: {user.get('full_name', 'N/A')}")
        print(f"      ID: {user.get('id', 'N/A')}")
        print(f"      Roles: {user.get('roles', [])}")
        
        # Check current password
        current_hash = user.get("password")
        if current_hash:
            print(f"      Current password exists (length: {len(current_hash)})")
            # Test if current password works
            if verify_password(password, current_hash):
                print(f"   ✅ Current password already works - no fix needed")
                continue
            else:
                print(f"   ⚠️  Current password doesn't work - will fix")
        else:
            print(f"   ⚠️  No password field - will add")
        
        # Create new hash
        print(f"   🔄 Creating new password hash...")
        new_hash = hash_password(password)
        
        # Verify new hash works
        if not verify_password(password, new_hash):
            print(f"   ❌ New hash verification failed - skipping")
            failed += 1
            continue
        
        print(f"   ✅ New hash verified successfully")
        
        # Update password
        print(f"   💾 Updating password in database...")
        result = await db.users.update_one(
            {"email": user.get("email")},  # Use email from database (case might differ)
            {"$set": {"password": new_hash}}
        )
        
        if result.modified_count == 0:
            # Try with user ID
            result = await db.users.update_one(
                {"id": user.get("id")},
                {"$set": {"password": new_hash}}
            )
        
        if result.modified_count > 0:
            print(f"   ✅ Password updated (modified_count: {result.modified_count})")
        else:
            print(f"   ⚠️  Update returned modified_count=0 (may already be correct)")
        
        # Verify it was saved correctly
        updated_user = await db.users.find_one({"email": user.get("email")})
        if updated_user:
            saved_hash = updated_user.get("password", "")
            if saved_hash and verify_password(password, saved_hash):
                print(f"   ✅ Password saved and verified - LOGIN WILL WORK")
                fixed += 1
            else:
                print(f"   ❌ Password saved but verification failed")
                failed += 1
        else:
            print(f"   ❌ Could not retrieve updated user")
            failed += 1
    
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    print(f"   ✅ Fixed: {fixed}")
    print(f"   ❌ Not found: {not_found}")
    print(f"   ⚠️  Failed: {failed}")
    print(f"   📝 Total: {len(user_credentials)}")
    
    # Final verification - test login for admin
    print("\n" + "=" * 50)
    print("🧪 FINAL LOGIN TEST")
    print("=" * 50)
    
    admin_email = "admin@stocklot.co.za"
    admin_password = "Admin123!"
    
    admin_user = await db.users.find_one({"email": admin_email})
    if admin_user:
        admin_hash = admin_user.get("password", "")
        if admin_hash and verify_password(admin_password, admin_hash):
            print(f"   ✅ {admin_email} - LOGIN TEST PASSED")
            print(f"      You can now log in with:")
            print(f"      Email: {admin_email}")
            print(f"      Password: {admin_password}")
        else:
            print(f"   ❌ {admin_email} - LOGIN TEST FAILED")
            print(f"      Password hash exists: {bool(admin_hash)}")
            if admin_hash:
                print(f"      Hash length: {len(admin_hash)}")
    else:
        print(f"   ❌ {admin_email} - User not found")
    
    client.close()
    print("\n🎉 Password fix complete!")

if __name__ == "__main__":
    asyncio.run(fix_all_passwords())

