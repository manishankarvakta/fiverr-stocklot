#!/usr/bin/env python3
"""
Fixed Frontend-Backend Connection Verification Test Suite
Tests critical API endpoints with correct response format handling
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import uuid

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class FixedConnectivityTest:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.auth_token = None
        self.test_user_email = "connectivity.test@stocklot.co.za"
        self.test_user_password = "TestPass123!"
        
    async def setup_session(self):
        """Setup HTTP session with proper headers"""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        )
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_result(self, test_name: str, success: bool, details: str):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {details}")
        
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{API_BASE}{endpoint}"
            request_headers = {}
            
            if headers:
                request_headers.update(headers)
                
            if self.auth_token and 'Authorization' not in request_headers:
                request_headers['Authorization'] = f'Bearer {self.auth_token}'
                
            async with self.session.request(method, url, json=data, headers=request_headers) as response:
                response_text = await response.text()
                try:
                    response_data = json.loads(response_text) if response_text else {}
                except:
                    response_data = {'raw_response': response_text}
                return response.status < 400, response_data, response.status
                    
        except Exception as e:
            return False, {'error': str(e)}, 500
            
    async def test_critical_endpoints(self):
        """Test critical endpoints for frontend-backend connectivity"""
        print("🚀 TESTING CRITICAL FRONTEND-BACKEND CONNECTIVITY")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        
        # Test 1: Authentication - Login
        print("\n🔐 TESTING AUTHENTICATION")
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, response, status = await self.make_request('POST', '/auth/login', login_data)
        if success and response.get('success') and 'user' in response:
            # Use email as token (as per the backend implementation)
            self.auth_token = self.test_user_email
            user_email = response['user'].get('email')
            self.log_result("POST /api/auth/login", True, f"Login successful for user: {user_email}")
        else:
            self.log_result("POST /api/auth/login", False, f"Login failed: {response.get('message', 'Unknown error')}")
            
        # Test 2: Get Current User Profile
        if self.auth_token:
            success, response, status = await self.make_request('GET', '/auth/me')
            if success and 'email' in response:
                self.log_result("GET /api/auth/me", True, f"Profile retrieved for user: {response.get('email')}")
            else:
                self.log_result("GET /api/auth/me", False, f"Profile retrieval failed (status: {status})")
        else:
            self.log_result("GET /api/auth/me", False, "Skipped - no auth token available")
            
        # Test 3: Marketplace Listings
        print("\n🏪 TESTING MARKETPLACE ENDPOINTS")
        success, response, status = await self.make_request('GET', '/listings')
        if success and 'listings' in response:
            listings = response['listings']
            listing_count = len(listings)
            total_count = response.get('total_count', listing_count)
            self.log_result("GET /api/listings", True, f"Retrieved {listing_count} listings (total: {total_count})")
            
            # Test specific listing details if listings exist
            if listings:
                first_listing = listings[0]
                listing_id = first_listing.get('id')
                if listing_id:
                    success, detail_response, status = await self.make_request('GET', f'/listings/{listing_id}')
                    if success:
                        self.log_result("GET /api/listings/{id}", True, f"Retrieved listing details for: {first_listing.get('title', 'Unknown')}")
                    else:
                        self.log_result("GET /api/listings/{id}", False, f"Failed to get listing details (status: {status})")
                else:
                    self.log_result("GET /api/listings/{id}", False, "No listing ID found in response")
            else:
                self.log_result("GET /api/listings/{id}", False, "Skipped - no listings available")
        else:
            self.log_result("GET /api/listings", False, f"Failed to retrieve listings (status: {status})")
            
        # Test 4: Data Endpoints
        print("\n📊 TESTING DATA ENDPOINTS")
        
        # Test taxonomy categories
        success, response, status = await self.make_request('GET', '/taxonomy/categories')
        if success and isinstance(response, list):
            category_count = len(response)
            self.log_result("GET /api/taxonomy/categories", True, f"Retrieved {category_count} livestock categories")
        else:
            self.log_result("GET /api/taxonomy/categories", False, f"Categories endpoint failed (status: {status})")
            
        # Test species
        success, response, status = await self.make_request('GET', '/species')
        if success and isinstance(response, list):
            species_count = len(response)
            self.log_result("GET /api/species", True, f"Retrieved {species_count} livestock species")
        else:
            self.log_result("GET /api/species", False, f"Species endpoint failed (status: {status})")
            
        # Test product types
        success, response, status = await self.make_request('GET', '/product-types')
        if success and isinstance(response, list):
            product_type_count = len(response)
            self.log_result("GET /api/product-types", True, f"Retrieved {product_type_count} product types")
        else:
            self.log_result("GET /api/product-types", False, f"Product types endpoint failed (status: {status})")
            
        # Test 5: Cart Operations (if authenticated)
        print("\n🛒 TESTING CART OPERATIONS")
        if self.auth_token:
            success, response, status = await self.make_request('GET', '/cart')
            if success:
                items = response.get('items', [])
                item_count = response.get('item_count', len(items))
                self.log_result("GET /api/cart", True, f"Cart retrieved with {item_count} items")
            else:
                self.log_result("GET /api/cart", False, f"Cart retrieval failed (status: {status})")
        else:
            self.log_result("GET /api/cart", False, "Skipped - no authentication token")
            
        # Test 6: Order Management (if authenticated)
        print("\n📦 TESTING ORDER MANAGEMENT")
        if self.auth_token:
            success, response, status = await self.make_request('GET', '/orders/user')
            if success:
                buyer_orders = response.get('buyer_orders', [])
                seller_orders = response.get('seller_orders', [])
                total_orders = len(buyer_orders) + len(seller_orders)
                self.log_result("GET /api/orders/user", True, f"Retrieved {total_orders} orders (buyer: {len(buyer_orders)}, seller: {len(seller_orders)})")
            else:
                self.log_result("GET /api/orders/user", False, f"Order retrieval failed (status: {status})")
        else:
            self.log_result("GET /api/orders/user", False, "Skipped - no authentication token")
            
        # Test 7: Communication Endpoints (if authenticated)
        print("\n💬 TESTING COMMUNICATION")
        if self.auth_token:
            # Test notifications
            success, response, status = await self.make_request('GET', '/notifications')
            if success:
                notification_count = len(response) if isinstance(response, list) else 0
                self.log_result("GET /api/notifications", True, f"Retrieved {notification_count} notifications")
            else:
                self.log_result("GET /api/notifications", False, f"Notifications failed (status: {status})")
                
            # Test inbox threads
            success, response, status = await self.make_request('GET', '/inbox/threads')
            if success:
                thread_count = len(response) if isinstance(response, list) else 0
                self.log_result("GET /api/inbox/threads", True, f"Retrieved {thread_count} message threads")
            else:
                self.log_result("GET /api/inbox/threads", False, f"Inbox threads failed (status: {status})")
        else:
            self.log_result("GET /api/notifications", False, "Skipped - no authentication token")
            self.log_result("GET /api/inbox/threads", False, "Skipped - no authentication token")
            
    async def run_test(self):
        """Run the connectivity test"""
        await self.setup_session()
        
        try:
            await self.test_critical_endpoints()
            self.generate_summary()
        finally:
            await self.cleanup_session()
            
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*80)
        print("🎯 FRONTEND-BACKEND CONNECTIVITY VERIFICATION SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Print failed tests details
        failed_results = [r for r in self.test_results if not r['success']]
        if failed_results:
            print("\n❌ FAILED TESTS:")
            for result in failed_results:
                print(f"  • {result['test']}: {result['details']}")
        
        # Print passed tests
        passed_results = [r for r in self.test_results if r['success']]
        if passed_results:
            print("\n✅ PASSED TESTS:")
            for result in passed_results:
                print(f"  • {result['test']}: {result['details']}")
                
        # Critical connectivity assessment
        print("\n🔗 CRITICAL CONNECTIVITY STATUS:")
        
        # Check authentication connectivity
        auth_working = any(r['success'] for r in self.test_results if 'login' in r['test'].lower())
        print(f"{'✅' if auth_working else '❌'} Authentication System")
        
        # Check marketplace connectivity
        marketplace_working = any(r['success'] for r in self.test_results if 'listings' in r['test'].lower() and 'GET' in r['test'])
        print(f"{'✅' if marketplace_working else '❌'} Marketplace Data Access")
        
        # Check data endpoints connectivity
        data_working = any(r['success'] for r in self.test_results if any(x in r['test'].lower() for x in ['taxonomy', 'species', 'product-types']))
        print(f"{'✅' if data_working else '❌'} Taxonomy Data Access")
        
        # Overall connectivity assessment
        critical_systems = [auth_working, marketplace_working, data_working]
        critical_success_rate = (sum(critical_systems) / len(critical_systems) * 100)
        
        print(f"\n🎯 OVERALL CONNECTIVITY ASSESSMENT:")
        if critical_success_rate >= 80:
            print("✅ EXCELLENT - Frontend-backend connectivity is working well")
        elif critical_success_rate >= 60:
            print("⚠️ GOOD - Most critical systems are connected, minor issues exist")
        elif critical_success_rate >= 40:
            print("⚠️ FAIR - Some connectivity issues need attention")
        else:
            print("❌ POOR - Significant connectivity issues require immediate attention")
            
        print(f"Critical Systems Success Rate: {critical_success_rate:.1f}%")
        
        # CORS and connectivity recommendations
        if failed_tests > 0:
            print(f"\n💡 CONNECTIVITY RECOMMENDATIONS:")
            print("• Check CORS configuration for frontend domain")
            print("• Verify all API endpoints are properly prefixed with '/api'")
            print("• Ensure authentication headers are properly processed")
            print("• Validate request/response formats match frontend expectations")
            
        print("\n" + "="*80)

async def main():
    """Main test execution"""
    tester = FixedConnectivityTest()
    await tester.run_test()

if __name__ == "__main__":
    asyncio.run(main())