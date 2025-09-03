#!/usr/bin/env python3
"""
Debug Public API Issues
Focused test to identify and fix specific issues with public API endpoints
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

async def setup_test_request():
    """Setup a single test request with proper timezone handling"""
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Clear existing test data
    await db.buy_requests.delete_many({"notes": {"$regex": "DEBUG_TEST"}})
    
    # Create test request with timezone-aware datetime
    request_id = str(uuid.uuid4())
    test_request = {
        "id": request_id,
        "buyer_id": "test-buyer-id",
        "species": "cattle",
        "product_type": "MARKET_READY",
        "qty": 50,
        "unit": "head",
        "province": "Gauteng",
        "target_price": 15000,
        "status": "active",
        "expires_at": datetime.now(timezone.utc) + timedelta(days=30),  # Timezone-aware
        "notes": "DEBUG_TEST - Quality cattle needed",
        "created_at": datetime.now(timezone.utc),  # Timezone-aware
        "updated_at": datetime.now(timezone.utc)   # Timezone-aware
    }
    
    await db.buy_requests.insert_one(test_request)
    print(f"✅ Created test request: {request_id}")
    
    return request_id

async def debug_detail_endpoint(request_id):
    """Debug the detail endpoint issue"""
    print(f"\n🔍 Debugging Detail Endpoint")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE}/public/buy-requests/{request_id}") as resp:
            status = resp.status
            print(f"Status: {status}")
            
            if status == 200:
                data = await resp.json()
                print(f"✅ Success: {data.get('species')} - {data.get('qty')} {data.get('unit')}")
                print(f"Can send offer: {data.get('can_send_offer')}")
                return True
            else:
                try:
                    error_data = await resp.json()
                    print(f"❌ Error: {error_data}")
                except:
                    error_text = await resp.text()
                    print(f"❌ Error: {error_text}")
                return False

async def debug_send_offer_endpoint(request_id):
    """Debug the send offer endpoint"""
    print(f"\n🔍 Debugging Send Offer Endpoint")
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Send offer without authentication (should get 401/403)
        print("Test 1: No authentication")
        offer_data = {
            "qty": 10,
            "unit_price_minor": 1500000,
            "delivery_mode": "SELLER"
        }
        
        async with session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data) as resp:
            status = resp.status
            print(f"Status: {status}")
            
            try:
                error_data = await resp.json()
                print(f"Response: {error_data}")
            except:
                error_text = await resp.text()
                print(f"Response: {error_text}")
        
        # Test 2: Create and authenticate a seller
        print("\nTest 2: Create seller user")
        
        # Register seller
        seller_data = {
            "email": "debug.seller@example.com",
            "password": "TestPass123!",
            "full_name": "Debug Seller",
            "role": "seller"
        }
        
        async with session.post(f"{API_BASE}/auth/register", json=seller_data) as resp:
            if resp.status == 201:
                print("✅ Seller registered")
            else:
                print(f"Registration status: {resp.status}")
                # Try login instead
                login_data = {"email": seller_data["email"], "password": seller_data["password"]}
                async with session.post(f"{API_BASE}/auth/login", json=login_data) as login_resp:
                    print(f"Login status: {login_resp.status}")
                    if login_resp.status == 200:
                        print("✅ Seller logged in")
        
        # Test 3: Send offer with authentication
        print("\nTest 3: Send offer with authentication")
        headers = {"Authorization": f"Bearer debug.seller@example.com"}
        
        async with session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data, headers=headers) as resp:
            status = resp.status
            print(f"Status: {status}")
            
            try:
                response_data = await resp.json()
                print(f"Response: {response_data}")
                
                if status == 201:
                    print("✅ Offer sent successfully!")
                    return True
                else:
                    print(f"❌ Failed to send offer")
                    return False
            except:
                error_text = await resp.text()
                print(f"Response: {error_text}")
                return False

async def test_offer_validation():
    """Test different offer validation scenarios"""
    print(f"\n🔍 Testing Offer Validation")
    
    # First create a test request
    request_id = await setup_test_request()
    
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer debug.seller@example.com"}
        
        test_cases = [
            {
                "name": "Missing qty",
                "data": {"unit_price_minor": 1500000, "delivery_mode": "SELLER"}
            },
            {
                "name": "Missing unit_price_minor", 
                "data": {"qty": 10, "delivery_mode": "SELLER"}
            },
            {
                "name": "Missing delivery_mode",
                "data": {"qty": 10, "unit_price_minor": 1500000}
            },
            {
                "name": "Invalid qty (negative)",
                "data": {"qty": -5, "unit_price_minor": 1500000, "delivery_mode": "SELLER"}
            },
            {
                "name": "Invalid qty (too high)",
                "data": {"qty": 1000, "unit_price_minor": 1500000, "delivery_mode": "SELLER"}
            },
            {
                "name": "Invalid price (zero)",
                "data": {"qty": 10, "unit_price_minor": 0, "delivery_mode": "SELLER"}
            },
            {
                "name": "Invalid delivery_mode",
                "data": {"qty": 10, "unit_price_minor": 1500000, "delivery_mode": "INVALID"}
            },
            {
                "name": "Valid offer",
                "data": {"qty": 10, "unit_price_minor": 1500000, "delivery_mode": "SELLER"}
            }
        ]
        
        for test_case in test_cases:
            print(f"\n  Testing: {test_case['name']}")
            
            async with session.post(f"{API_BASE}/buy-requests/{request_id}/offers", 
                                  json=test_case['data'], headers=headers) as resp:
                status = resp.status
                try:
                    response_data = await resp.json()
                except:
                    response_data = await resp.text()
                
                print(f"    Status: {status}")
                print(f"    Response: {response_data}")

async def cleanup():
    """Clean up test data"""
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    result = await db.buy_requests.delete_many({"notes": {"$regex": "DEBUG_TEST"}})
    print(f"\n🧹 Cleaned up {result.deleted_count} test requests")

async def main():
    """Main debug runner"""
    print("🔧 Debugging Public Buy Requests API Issues")
    print("=" * 50)
    
    try:
        # Setup test data
        request_id = await setup_test_request()
        
        # Debug detail endpoint
        detail_success = await debug_detail_endpoint(request_id)
        
        # Debug send offer endpoint
        offer_success = await debug_send_offer_endpoint(request_id)
        
        # Test offer validation
        await test_offer_validation()
        
        print("\n" + "=" * 50)
        print("🎯 DEBUG SUMMARY")
        print("=" * 50)
        print(f"Detail endpoint: {'✅ Working' if detail_success else '❌ Failed'}")
        print(f"Send offer endpoint: {'✅ Working' if offer_success else '❌ Failed'}")
        
    finally:
        await cleanup()

if __name__ == "__main__":
    asyncio.run(main())