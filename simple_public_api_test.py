#!/usr/bin/env python3
"""
Simple Public Buy Requests API Test
Tests the public API endpoints after manually setting up proper test data
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

# Get backend URL from frontend env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

async def setup_test_data():
    """Setup test buy requests directly in database with correct status"""
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Clear existing test data
    await db.buy_requests.delete_many({"notes": {"$regex": "TEST_PUBLIC_API"}})
    
    # Create test buy requests with active status and proper expiry
    test_requests = [
        {
            "id": str(uuid.uuid4()),
            "buyer_id": "test-buyer-id",
            "species": "cattle",
            "product_type": "MARKET_READY",
            "qty": 50,
            "unit": "head",
            "province": "Gauteng",
            "target_price": 15000,
            "status": "active",  # This is the key difference
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
            "notes": "TEST_PUBLIC_API - Quality Nguni cattle needed",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "buyer_id": "test-buyer-id",
            "species": "sheep",
            "product_type": "BREEDING_STOCK",
            "qty": 25,
            "unit": "head",
            "province": "Western Cape",
            "target_price": 8000,
            "status": "active",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=15),
            "notes": "TEST_PUBLIC_API - Dorper sheep for breeding",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "buyer_id": "test-buyer-id",
            "species": "Commercial Broilers",
            "product_type": "DAY_OLD",
            "qty": 1000,
            "unit": "chicks",
            "province": "KwaZulu-Natal",
            "status": "active",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "notes": "TEST_PUBLIC_API - Ross 308 broiler chicks",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "buyer_id": "test-buyer-id",
            "species": "goats",
            "product_type": "JUVENILES",
            "qty": 15,
            "unit": "head",
            "province": "Limpopo",
            "target_price": 3500,
            "status": "active",
            "expires_at": datetime.now(timezone.utc) + timedelta(days=20),
            "notes": "TEST_PUBLIC_API - Boer goat kids",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.buy_requests.insert_many(test_requests)
    print(f"✅ Created {len(test_requests)} test buy requests with active status")
    
    return test_requests

async def test_public_list_api():
    """Test the public list API with various filters"""
    print("\n🔍 Testing Public Buy Requests List API")
    
    async with aiohttp.ClientSession() as session:
        test_cases = [
            {"name": "Basic list", "params": {}},
            {"name": "Filter by species (cattle)", "params": {"species": "cattle"}},
            {"name": "Filter by province (Gauteng)", "params": {"province": "Gauteng"}},
            {"name": "Sort by newest", "params": {"sort": "newest"}},
            {"name": "Sort by ending soon", "params": {"sort": "ending_soon"}},
            {"name": "Sort by relevance", "params": {"sort": "relevance"}},
            {"name": "Quantity filter", "params": {"min_qty": 10, "max_qty": 100}},
            {"name": "Has target price", "params": {"has_target_price": "true"}},
            {"name": "No target price", "params": {"has_target_price": "false"}},
            {"name": "Pagination", "params": {"limit": 2}},
        ]
        
        results = []
        for test_case in test_cases:
            print(f"\n  Testing: {test_case['name']}")
            
            async with session.get(f"{API_BASE}/public/buy-requests", params=test_case['params']) as resp:
                status = resp.status
                try:
                    data = await resp.json()
                except:
                    data = await resp.text()
                
                if status == 200:
                    items_count = len(data.get('items', []))
                    total = data.get('total', 0)
                    has_more = data.get('hasMore', False)
                    print(f"    ✅ Success: {items_count} items, total: {total}, hasMore: {has_more}")
                    
                    # Show sample item if available
                    if data.get('items'):
                        item = data['items'][0]
                        print(f"    📋 Sample: {item.get('species')} - {item.get('qty')} {item.get('unit')} in {item.get('province')}")
                else:
                    print(f"    ❌ Failed: {status} - {data}")
                
                results.append({
                    "test": test_case['name'],
                    "status": status,
                    "success": status == 200,
                    "items_count": len(data.get('items', [])) if status == 200 else 0
                })
        
        return results

async def test_public_detail_api(test_requests):
    """Test the public detail API"""
    print("\n🔍 Testing Public Buy Request Detail API")
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        if test_requests:
            request_id = test_requests[0]['id']
            
            # Test as guest user
            print(f"\n  Testing: Get details as guest user")
            async with session.get(f"{API_BASE}/public/buy-requests/{request_id}") as resp:
                status = resp.status
                try:
                    data = await resp.json()
                except:
                    data = await resp.text()
                
                if status == 200:
                    print(f"    ✅ Success: Got details for {data.get('species')} request")
                    print(f"    📋 Details: {data.get('qty')} {data.get('unit')} in {data.get('province')}")
                    print(f"    🔒 Can send offer: {data.get('can_send_offer', False)}")
                else:
                    print(f"    ❌ Failed: {status} - {data}")
                
                results.append({
                    "test": "Get details as guest",
                    "status": status,
                    "success": status == 200
                })
        
        # Test with invalid ID
        print(f"\n  Testing: Invalid request ID")
        async with session.get(f"{API_BASE}/public/buy-requests/invalid-id") as resp:
            status = resp.status
            success = status == 404
            print(f"    {'✅' if success else '❌'} Status: {status} (expected 404)")
            
            results.append({
                "test": "Invalid request ID",
                "status": status,
                "success": success
            })
        
        return results

async def test_send_offer_api(test_requests):
    """Test the send offer API"""
    print("\n🔍 Testing Send Offer API")
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        if test_requests:
            request_id = test_requests[0]['id']
            
            # Test as guest (should fail)
            print(f"\n  Testing: Send offer as guest (should fail)")
            offer_data = {
                "qty": 10,
                "unit_price_minor": 1500000,
                "delivery_mode": "SELLER"
            }
            
            async with session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data) as resp:
                status = resp.status
                success = status in [401, 403]
                print(f"    {'✅' if success else '❌'} Status: {status} (expected 401/403)")
                
                results.append({
                    "test": "Send offer as guest (should fail)",
                    "status": status,
                    "success": success
                })
            
            # Test with authenticated user (create seller first)
            print(f"\n  Testing: Send offer as authenticated seller")
            
            # Register/login as seller
            seller_data = {
                "email": "test.seller@example.com",
                "password": "TestPass123!"
            }
            
            async with session.post(f"{API_BASE}/auth/login", json=seller_data) as login_resp:
                if login_resp.status == 200:
                    headers = {"Authorization": "Bearer test.seller@example.com"}
                    
                    async with session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data, headers=headers) as resp:
                        status = resp.status
                        try:
                            data = await resp.json()
                        except:
                            data = await resp.text()
                        
                        if status == 201:
                            print(f"    ✅ Success: Offer sent successfully")
                        else:
                            print(f"    ❌ Failed: {status} - {data}")
                        
                        results.append({
                            "test": "Send offer as seller",
                            "status": status,
                            "success": status == 201
                        })
                else:
                    print(f"    ⚠️  Could not login as seller: {login_resp.status}")
        
        return results

async def test_performance():
    """Test API performance"""
    print("\n⚡ Testing API Performance")
    
    async with aiohttp.ClientSession() as session:
        import time
        
        # Test response time
        start_time = time.time()
        async with session.get(f"{API_BASE}/public/buy-requests") as resp:
            end_time = time.time()
            response_time = end_time - start_time
            
            success = resp.status == 200 and response_time < 2.0
            print(f"  {'✅' if success else '❌'} Response time: {response_time:.2f}s (target: < 2s)")
            
            return {
                "test": "Response time",
                "response_time": response_time,
                "success": success
            }

async def cleanup_test_data():
    """Clean up test data"""
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    result = await db.buy_requests.delete_many({"notes": {"$regex": "TEST_PUBLIC_API"}})
    print(f"\n🧹 Cleaned up {result.deleted_count} test buy requests")

async def main():
    """Main test runner"""
    print("🚀 Starting Public Buy Requests API Testing")
    print("=" * 60)
    
    try:
        # Setup test data
        print("\n📋 Setting up test data...")
        test_requests = await setup_test_data()
        
        # Run tests
        list_results = await test_public_list_api()
        detail_results = await test_public_detail_api(test_requests)
        offer_results = await test_send_offer_api(test_requests)
        performance_result = await test_performance()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        all_results = list_results + detail_results + offer_results + [performance_result]
        
        total_tests = len(all_results)
        passed_tests = sum(1 for r in all_results if r['success'])
        
        print(f"\n🎯 OVERALL: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in all_results:
            status_icon = "✅" if result['success'] else "❌"
            status = result.get('status', 'N/A')
            print(f"  {status_icon} {result['test']} (Status: {status})")
        
        # Check for critical failures
        critical_failures = [r for r in all_results if not r['success'] and r['test'] not in [
            "Send offer as guest (should fail)", "Invalid request ID"
        ]]
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FAILURES:")
            for failure in critical_failures:
                print(f"  ❌ {failure['test']}")
        else:
            print(f"\n🎉 All critical functionality working!")
        
        return all_results
        
    finally:
        await cleanup_test_data()

if __name__ == "__main__":
    asyncio.run(main())