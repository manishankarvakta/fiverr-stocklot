#!/usr/bin/env python3
"""
Public Buy Requests API Testing Suite
Tests the new public buy requests endpoints for guest and authenticated users
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class PublicBuyRequestsAPITester:
    def __init__(self):
        self.session = None
        self.test_users = {}
        self.test_buy_requests = []
        self.test_offers = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    async def create_test_user(self, email: str, role: str = "buyer") -> Dict:
        """Create a test user and return auth token"""
        user_data = {
            "email": email,
            "password": "TestPass123!",
            "full_name": f"Test {role.title()}",
            "phone": "+27123456789",
            "role": role
        }
        
        # Register user
        async with self.session.post(f"{API_BASE}/auth/register", json=user_data) as resp:
            if resp.status == 201:
                result = await resp.json()
                print(f"✅ Created test user: {email}")
            else:
                # User might already exist, try login
                login_data = {"email": email, "password": "TestPass123!"}
                async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as login_resp:
                    if login_resp.status == 200:
                        result = await login_resp.json()
                        print(f"✅ Logged in existing user: {email}")
                    else:
                        print(f"❌ Failed to create/login user {email}: {await login_resp.text()}")
                        return None
        
        # Store user info
        self.test_users[role] = {
            "email": email,
            "token": email,  # Using email as token for simplicity
            "data": result
        }
        
        return self.test_users[role]
        
    async def create_test_buy_requests(self) -> List[Dict]:
        """Create test buy requests with different characteristics"""
        
        # Ensure we have a buyer
        if "buyer" not in self.test_users:
            buyer_result = await self.create_test_user("test.buyer@example.com", "buyer")
            if not buyer_result:
                print("❌ Failed to create buyer user")
                return []
            
        buyer_token = self.test_users["buyer"]["token"]
        headers = {"Authorization": f"Bearer {buyer_token}"}
        
        # Test buy requests with different species, provinces, quantities
        test_requests = [
            {
                "species": "cattle",
                "product_type": "MARKET_READY", 
                "qty": 50,
                "unit": "head",
                "province": "Gauteng",
                "target_price": 15000,
                "notes": "Looking for quality Nguni cattle for commercial farming",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            },
            {
                "species": "sheep",
                "product_type": "BREEDING_STOCK",
                "qty": 25, 
                "unit": "head",
                "province": "Western Cape",
                "target_price": 8000,
                "notes": "Need Dorper sheep for breeding program",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat()
            },
            {
                "species": "Commercial Broilers",
                "product_type": "DAY_OLD",
                "qty": 1000,
                "unit": "chicks", 
                "province": "KwaZulu-Natal",
                "notes": "Day-old Ross 308 broiler chicks needed",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
            },
            {
                "species": "goats",
                "product_type": "JUVENILES",
                "qty": 15,
                "unit": "head",
                "province": "Limpopo", 
                "target_price": 3500,
                "notes": "Boer goat kids for meat production",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat()
            },
            {
                "species": "Commercial Layers",
                "product_type": "POINT_OF_LAY",
                "qty": 500,
                "unit": "pullets",
                "province": "Mpumalanga",
                "target_price": 120,
                "notes": "Point of lay ISA Brown pullets",
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
            }
        ]
        
        created_requests = []
        for req_data in test_requests:
            async with self.session.post(f"{API_BASE}/buy-requests", json=req_data, headers=headers) as resp:
                if resp.status == 201:
                    result = await resp.json()
                    # Extract the ID from the response
                    request_id = result.get('id')
                    if request_id:
                        created_requests.append({'id': request_id, **req_data})
                        print(f"✅ Created buy request: {req_data['species']} in {req_data['province']} (ID: {request_id})")
                    else:
                        print(f"⚠️  Buy request created but no ID returned: {result}")
                else:
                    error_text = await resp.text()
                    print(f"❌ Failed to create buy request: {resp.status} - {error_text}")
                    
        self.test_buy_requests = created_requests
        return created_requests
        
    async def test_public_list_endpoint(self):
        """Test GET /api/public/buy-requests with various filters"""
        print("\n🔍 Testing Public Buy Requests List Endpoint")
        
        test_cases = [
            {
                "name": "Basic list (no filters)",
                "params": {}
            },
            {
                "name": "Filter by species (cattle)",
                "params": {"species": "cattle"}
            },
            {
                "name": "Filter by province (Gauteng)",
                "params": {"province": "Gauteng"}
            },
            {
                "name": "Sort by newest",
                "params": {"sort": "newest"}
            },
            {
                "name": "Sort by ending soon",
                "params": {"sort": "ending_soon"}
            },
            {
                "name": "Sort by relevance",
                "params": {"sort": "relevance"}
            },
            {
                "name": "Quantity filter (min_qty=10, max_qty=100)",
                "params": {"min_qty": 10, "max_qty": 100}
            },
            {
                "name": "Has target price filter",
                "params": {"has_target_price": "true"}
            },
            {
                "name": "No target price filter", 
                "params": {"has_target_price": "false"}
            },
            {
                "name": "Pagination (limit=2)",
                "params": {"limit": 2}
            },
            {
                "name": "Combined filters (species + province + qty)",
                "params": {"species": "cattle", "province": "Gauteng", "min_qty": 10}
            }
        ]
        
        results = []
        for test_case in test_cases:
            print(f"\n  Testing: {test_case['name']}")
            
            async with self.session.get(f"{API_BASE}/public/buy-requests", params=test_case['params']) as resp:
                status = resp.status
                try:
                    data = await resp.json()
                except:
                    data = await resp.text()
                
                result = {
                    "test": test_case['name'],
                    "status": status,
                    "success": status == 200,
                    "data": data if status == 200 else None,
                    "error": data if status != 200 else None
                }
                
                if status == 200:
                    items_count = len(data.get('items', []))
                    total = data.get('total', 0)
                    has_more = data.get('hasMore', False)
                    print(f"    ✅ Success: {items_count} items, total: {total}, hasMore: {has_more}")
                    
                    # Validate response structure
                    expected_fields = ['items', 'nextCursor', 'hasMore', 'total', 'filters_applied', 'sort']
                    missing_fields = [f for f in expected_fields if f not in data]
                    if missing_fields:
                        print(f"    ⚠️  Missing fields: {missing_fields}")
                        
                    # Validate item structure
                    if data.get('items'):
                        item = data['items'][0]
                        expected_item_fields = ['id', 'species', 'product_type', 'qty', 'unit', 'province', 'deadline_at', 'has_target_price', 'offers_count', 'created_at']
                        missing_item_fields = [f for f in expected_item_fields if f not in item]
                        if missing_item_fields:
                            print(f"    ⚠️  Missing item fields: {missing_item_fields}")
                else:
                    print(f"    ❌ Failed: {status} - {data}")
                    
                results.append(result)
                
        return results
        
    async def test_public_detail_endpoint(self):
        """Test GET /api/public/buy-requests/{request_id}"""
        print("\n🔍 Testing Public Buy Request Detail Endpoint")
        
        if not self.test_buy_requests:
            print("❌ No test buy requests available")
            return []
            
        results = []
        
        # Test with valid request ID (guest user)
        request_id = self.test_buy_requests[0]['id']
        print(f"\n  Testing: Valid request ID as guest user")
        
        async with self.session.get(f"{API_BASE}/public/buy-requests/{request_id}") as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Valid request ID (guest)",
                "status": status,
                "success": status == 200,
                "data": data if status == 200 else None,
                "error": data if status != 200 else None
            }
            
            if status == 200:
                print(f"    ✅ Success: Got details for {data.get('species')} request")
                
                # Validate response structure
                expected_fields = ['id', 'species', 'product_type', 'qty', 'unit', 'province', 'deadline_at', 'offers_count', 'can_send_offer', 'in_range', 'created_at']
                missing_fields = [f for f in expected_fields if f not in data]
                if missing_fields:
                    print(f"    ⚠️  Missing fields: {missing_fields}")
                    
                # Check guest user restrictions
                if data.get('can_send_offer', True):
                    print(f"    ⚠️  Guest user should not be able to send offers")
            else:
                print(f"    ❌ Failed: {status} - {data}")
                
            results.append(result)
            
        # Test with authenticated seller
        if "seller" not in self.test_users:
            await self.create_test_user("test.seller@example.com", "seller")
            
        seller_token = self.test_users["seller"]["token"]
        headers = {"Authorization": f"Bearer {seller_token}"}
        
        print(f"\n  Testing: Valid request ID as authenticated seller")
        
        async with self.session.get(f"{API_BASE}/public/buy-requests/{request_id}", headers=headers) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Valid request ID (seller)",
                "status": status,
                "success": status == 200,
                "data": data if status == 200 else None,
                "error": data if status != 200 else None
            }
            
            if status == 200:
                print(f"    ✅ Success: Seller can view details")
                can_send_offer = data.get('can_send_offer', False)
                print(f"    📝 Can send offer: {can_send_offer}")
            else:
                print(f"    ❌ Failed: {status} - {data}")
                
            results.append(result)
            
        # Test with invalid request ID
        print(f"\n  Testing: Invalid request ID")
        
        async with self.session.get(f"{API_BASE}/public/buy-requests/invalid-id") as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Invalid request ID",
                "status": status,
                "success": status == 404,
                "data": data if status == 404 else None,
                "error": data if status != 404 else None
            }
            
            if status == 404:
                print(f"    ✅ Success: Correctly returns 404 for invalid ID")
            else:
                print(f"    ❌ Failed: Expected 404, got {status} - {data}")
                
            results.append(result)
            
        return results
        
    async def test_send_offer_endpoint(self):
        """Test POST /api/buy-requests/{request_id}/offers"""
        print("\n🔍 Testing Send Offer Endpoint")
        
        if not self.test_buy_requests:
            print("❌ No test buy requests available")
            return []
            
        results = []
        request_id = self.test_buy_requests[0]['id']
        
        # Test as guest user (should fail)
        print(f"\n  Testing: Send offer as guest user (should fail)")
        
        offer_data = {
            "qty": 10,
            "unit_price_minor": 1500000,  # R15,000 in cents
            "delivery_mode": "SELLER",
            "validity_expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }
        
        async with self.session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Send offer as guest (should fail)",
                "status": status,
                "success": status in [401, 403],
                "data": data if status in [401, 403] else None,
                "error": data if status not in [401, 403] else None
            }
            
            if status in [401, 403]:
                print(f"    ✅ Success: Correctly rejects guest user ({status})")
            else:
                print(f"    ❌ Failed: Expected 401/403, got {status} - {data}")
                
            results.append(result)
            
        # Test as authenticated seller
        if "seller" not in self.test_users:
            await self.create_test_user("test.seller@example.com", "seller")
            
        seller_token = self.test_users["seller"]["token"]
        headers = {"Authorization": f"Bearer {seller_token}"}
        
        print(f"\n  Testing: Send valid offer as authenticated seller")
        
        async with self.session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data, headers=headers) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Send valid offer (seller)",
                "status": status,
                "success": status == 201,
                "data": data if status == 201 else None,
                "error": data if status != 201 else None
            }
            
            if status == 201:
                print(f"    ✅ Success: Offer sent successfully")
                self.test_offers.append(data)
            else:
                print(f"    ❌ Failed: {status} - {data}")
                
            results.append(result)
            
        # Test duplicate offer (should fail)
        print(f"\n  Testing: Send duplicate offer (should fail)")
        
        async with self.session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=offer_data, headers=headers) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Send duplicate offer (should fail)",
                "status": status,
                "success": status == 409,
                "data": data if status == 409 else None,
                "error": data if status != 409 else None
            }
            
            if status == 409:
                print(f"    ✅ Success: Correctly prevents duplicate offers")
            else:
                print(f"    ❌ Failed: Expected 409, got {status} - {data}")
                
            results.append(result)
            
        # Test invalid offer data
        print(f"\n  Testing: Send offer with invalid data")
        
        # Create another seller for this test
        await self.create_test_user("test.seller2@example.com", "seller")
        seller2_token = self.test_users["seller"]["token"]  # This will be overwritten, but we'll use a new email
        headers2 = {"Authorization": f"Bearer test.seller2@example.com"}
        
        invalid_offer_data = {
            "qty": -5,  # Invalid quantity
            "unit_price_minor": 0,  # Invalid price
            "delivery_mode": "INVALID"  # Invalid delivery mode
        }
        
        async with self.session.post(f"{API_BASE}/buy-requests/{request_id}/offers", json=invalid_offer_data, headers=headers2) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Send invalid offer data",
                "status": status,
                "success": status == 400,
                "data": data if status == 400 else None,
                "error": data if status != 400 else None
            }
            
            if status == 400:
                print(f"    ✅ Success: Correctly validates offer data")
            else:
                print(f"    ❌ Failed: Expected 400, got {status} - {data}")
                
            results.append(result)
            
        # Test offer to non-existent request
        print(f"\n  Testing: Send offer to non-existent request")
        
        async with self.session.post(f"{API_BASE}/buy-requests/invalid-id/offers", json=offer_data, headers=headers) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Send offer to non-existent request",
                "status": status,
                "success": status == 404,
                "data": data if status == 404 else None,
                "error": data if status != 404 else None
            }
            
            if status == 404:
                print(f"    ✅ Success: Correctly returns 404 for invalid request")
            else:
                print(f"    ❌ Failed: Expected 404, got {status} - {data}")
                
            results.append(result)
            
        return results
        
    async def test_performance_and_pagination(self):
        """Test performance and pagination functionality"""
        print("\n⚡ Testing Performance and Pagination")
        
        results = []
        
        # Test response time
        print(f"\n  Testing: Response time for public list")
        
        import time
        start_time = time.time()
        
        async with self.session.get(f"{API_BASE}/public/buy-requests") as resp:
            end_time = time.time()
            response_time = end_time - start_time
            
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Response time",
                "status": status,
                "success": status == 200 and response_time < 2.0,
                "response_time": response_time,
                "data": data if status == 200 else None,
                "error": data if status != 200 else None
            }
            
            if status == 200 and response_time < 2.0:
                print(f"    ✅ Success: Response time {response_time:.2f}s (< 2s)")
            elif status == 200:
                print(f"    ⚠️  Slow response: {response_time:.2f}s (> 2s)")
            else:
                print(f"    ❌ Failed: {status} - {data}")
                
            results.append(result)
            
        # Test pagination
        print(f"\n  Testing: Pagination functionality")
        
        async with self.session.get(f"{API_BASE}/public/buy-requests", params={"limit": 2}) as resp:
            status = resp.status
            try:
                data = await resp.json()
            except:
                data = await resp.text()
                
            result = {
                "test": "Pagination",
                "status": status,
                "success": status == 200,
                "data": data if status == 200 else None,
                "error": data if status != 200 else None
            }
            
            if status == 200:
                items_count = len(data.get('items', []))
                has_more = data.get('hasMore', False)
                next_cursor = data.get('nextCursor')
                
                print(f"    ✅ Success: Got {items_count} items, hasMore: {has_more}")
                
                if has_more and next_cursor:
                    print(f"    📄 Testing next page with cursor")
                    
                    # Test next page
                    async with self.session.get(f"{API_BASE}/public/buy-requests", params={"limit": 2, "after": next_cursor}) as next_resp:
                        if next_resp.status == 200:
                            next_data = await next_resp.json()
                            next_items = len(next_data.get('items', []))
                            print(f"    ✅ Next page: Got {next_items} items")
                        else:
                            print(f"    ❌ Next page failed: {next_resp.status}")
            else:
                print(f"    ❌ Failed: {status} - {data}")
                
            results.append(result)
            
        return results
        
    async def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Public Buy Requests API Testing")
        print("=" * 60)
        
        try:
            await self.setup_session()
            
            # Setup test data
            print("\n📋 Setting up test data...")
            await self.create_test_buy_requests()
            
            # Run test suites
            list_results = await self.test_public_list_endpoint()
            detail_results = await self.test_public_detail_endpoint()
            offer_results = await self.test_send_offer_endpoint()
            performance_results = await self.test_performance_and_pagination()
            
            # Compile results
            all_results = {
                "public_list": list_results,
                "public_detail": detail_results,
                "send_offer": offer_results,
                "performance": performance_results
            }
            
            # Summary
            print("\n" + "=" * 60)
            print("📊 TEST SUMMARY")
            print("=" * 60)
            
            total_tests = 0
            passed_tests = 0
            
            for suite_name, suite_results in all_results.items():
                suite_total = len(suite_results)
                suite_passed = sum(1 for r in suite_results if r['success'])
                total_tests += suite_total
                passed_tests += suite_passed
                
                print(f"\n{suite_name.upper()}: {suite_passed}/{suite_total} passed")
                
                for result in suite_results:
                    status_icon = "✅" if result['success'] else "❌"
                    print(f"  {status_icon} {result['test']}")
                    
            print(f"\n🎯 OVERALL: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
            
            # Critical issues
            critical_failures = []
            for suite_results in all_results.values():
                for result in suite_results:
                    if not result['success'] and result['test'] not in [
                        "Send offer as guest (should fail)",
                        "Send duplicate offer (should fail)", 
                        "Send invalid offer data",
                        "Send offer to non-existent request",
                        "Invalid request ID"
                    ]:
                        critical_failures.append(result)
                        
            if critical_failures:
                print(f"\n🚨 CRITICAL FAILURES ({len(critical_failures)}):")
                for failure in critical_failures:
                    print(f"  ❌ {failure['test']}: {failure.get('error', 'Unknown error')}")
            else:
                print(f"\n🎉 All critical functionality working!")
                
            return all_results
            
        finally:
            await self.cleanup_session()

async def main():
    """Main test runner"""
    tester = PublicBuyRequestsAPITester()
    results = await tester.run_all_tests()
    return results

if __name__ == "__main__":
    asyncio.run(main())