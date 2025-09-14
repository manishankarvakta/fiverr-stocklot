#!/usr/bin/env python3
"""
Frontend-Backend Connection Verification Test Suite
Tests critical API endpoints to ensure frontend-backend connectivity is working properly
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional
import uuid

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class FrontendBackendConnectivityTest:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.auth_token = None
        self.test_user_email = "connectivity.test@stocklot.co.za"
        self.test_user_password = "TestPass123!"
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "AdminPass123!"
        self.admin_token = None
        
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
            
    def log_result(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        print(f"{status} {test_name}: {details}")
        
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, files: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{API_BASE}{endpoint}"
            request_headers = {}
            
            if headers:
                request_headers.update(headers)
                
            if self.auth_token and 'Authorization' not in request_headers:
                request_headers['Authorization'] = f'Bearer {self.auth_token}'
                
            if files:
                # For file uploads, don't set Content-Type header
                if 'Content-Type' in request_headers:
                    del request_headers['Content-Type']
                    
                form_data = aiohttp.FormData()
                for key, value in files.items():
                    if isinstance(value, tuple):
                        filename, content, content_type = value
                        form_data.add_field(key, content, filename=filename, content_type=content_type)
                    else:
                        form_data.add_field(key, value)
                        
                if data:
                    for key, value in data.items():
                        form_data.add_field(key, str(value))
                        
                async with self.session.request(method, url, data=form_data, headers=request_headers) as response:
                    response_text = await response.text()
                    try:
                        response_data = json.loads(response_text) if response_text else {}
                    except:
                        response_data = {'raw_response': response_text}
                    return response.status < 400, response_data, response.status
            else:
                # Regular JSON request
                async with self.session.request(method, url, json=data, headers=request_headers) as response:
                    response_text = await response.text()
                    try:
                        response_data = json.loads(response_text) if response_text else {}
                    except:
                        response_data = {'raw_response': response_text}
                    return response.status < 400, response_data, response.status
                    
        except Exception as e:
            return False, {'error': str(e)}, 500
            
    async def test_authentication_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 TESTING AUTHENTICATION ENDPOINTS")
        
        # Test 1: User Registration
        register_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "full_name": "Connectivity Test User",
            "role": "buyer"
        }
        
        success, response, status = await self.make_request('POST', '/auth/register', register_data)
        if success or status == 409:  # 409 = user already exists
            self.log_result("POST /api/auth/register", True, f"Registration endpoint accessible (status: {status})")
        else:
            self.log_result("POST /api/auth/register", False, f"Registration failed: {response.get('detail', 'Unknown error')}")
            
        # Test 2: User Login
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, response, status = await self.make_request('POST', '/auth/login', login_data)
        if success and 'access_token' in response:
            self.auth_token = response['access_token']
            self.log_result("POST /api/auth/login", True, "Login successful, token received")
        else:
            self.log_result("POST /api/auth/login", False, f"Login failed: {response.get('detail', 'Unknown error')}")
            
        # Test 3: Get Current User Profile
        if self.auth_token:
            success, response, status = await self.make_request('GET', '/auth/me')
            if success and 'email' in response:
                self.log_result("GET /api/auth/me", True, f"Profile retrieved for user: {response.get('email')}")
            else:
                self.log_result("GET /api/auth/me", False, f"Profile retrieval failed: {response.get('detail', 'Unknown error')}")
        else:
            self.log_result("GET /api/auth/me", False, "Skipped - no auth token available")
            
        # Test 4: User Logout
        if self.auth_token:
            success, response, status = await self.make_request('POST', '/auth/logout')
            self.log_result("POST /api/auth/logout", success, f"Logout endpoint response: {status}")
        else:
            self.log_result("POST /api/auth/logout", False, "Skipped - no auth token available")
            
    async def test_marketplace_endpoints(self):
        """Test core marketplace endpoints"""
        print("\n🏪 TESTING CORE MARKETPLACE ENDPOINTS")
        
        # Test 1: Get Marketplace Listings
        success, response, status = await self.make_request('GET', '/listings')
        if success and isinstance(response, list):
            listing_count = len(response)
            self.log_result("GET /api/listings", True, f"Retrieved {listing_count} listings")
            
            # Test 2: Get Specific Listing Details (if listings exist)
            if listing_count > 0:
                first_listing = response[0]
                listing_id = first_listing.get('id')
                if listing_id:
                    success, detail_response, status = await self.make_request('GET', f'/listings/{listing_id}')
                    if success:
                        self.log_result("GET /api/listings/{id}", True, f"Retrieved listing details for ID: {listing_id}")
                    else:
                        self.log_result("GET /api/listings/{id}", False, f"Failed to get listing details: {detail_response.get('detail', 'Unknown error')}")
                else:
                    self.log_result("GET /api/listings/{id}", False, "No listing ID found in response")
            else:
                self.log_result("GET /api/listings/{id}", False, "Skipped - no listings available")
        else:
            self.log_result("GET /api/listings", False, f"Failed to retrieve listings: {response.get('detail', 'Unknown error')}")
            
        # Test 3: Get Listings with Filters
        filter_params = "?category_group_id=test&min_price=100&max_price=1000"
        success, response, status = await self.make_request('GET', f'/listings{filter_params}')
        self.log_result("GET /api/listings (with filters)", success, f"Filtered listings endpoint accessible (status: {status})")
        
        # Test 4: Create New Listing (authenticated)
        if self.auth_token:
            # First get species and product types for valid IDs
            species_success, species_response, _ = await self.make_request('GET', '/species')
            product_types_success, product_types_response, _ = await self.make_request('GET', '/product-types')
            
            if species_success and product_types_success and species_response and product_types_response:
                species_id = species_response[0].get('id') if species_response else str(uuid.uuid4())
                product_type_id = product_types_response[0].get('id') if product_types_response else str(uuid.uuid4())
                
                listing_data = {
                    "species_id": species_id,
                    "product_type_id": product_type_id,
                    "title": "Test Connectivity Listing",
                    "description": "Test listing for connectivity verification",
                    "quantity": 10,
                    "price_per_unit": 150.00,
                    "region": "Western Cape",
                    "city": "Cape Town"
                }
                
                success, response, status = await self.make_request('POST', '/listings', listing_data)
                if success:
                    self.log_result("POST /api/listings", True, "Listing creation endpoint functional")
                    
                    # Test 5: Update Listing (if creation was successful)
                    if 'id' in response:
                        listing_id = response['id']
                        update_data = {
                            "title": "Updated Test Connectivity Listing",
                            "price_per_unit": 175.00
                        }
                        success, update_response, status = await self.make_request('PUT', f'/listings/{listing_id}', update_data)
                        self.log_result("PUT /api/listings/{id}", success, f"Listing update endpoint response: {status}")
                    else:
                        self.log_result("PUT /api/listings/{id}", False, "Skipped - no listing ID from creation")
                else:
                    self.log_result("POST /api/listings", False, f"Listing creation failed: {response.get('detail', 'Unknown error')}")
                    self.log_result("PUT /api/listings/{id}", False, "Skipped - listing creation failed")
            else:
                self.log_result("POST /api/listings", False, "Skipped - could not get species/product type data")
                self.log_result("PUT /api/listings/{id}", False, "Skipped - listing creation skipped")
        else:
            self.log_result("POST /api/listings", False, "Skipped - no authentication token")
            self.log_result("PUT /api/listings/{id}", False, "Skipped - no authentication token")
            
    async def test_cart_checkout_endpoints(self):
        """Test cart and checkout endpoints"""
        print("\n🛒 TESTING CART & CHECKOUT ENDPOINTS")
        
        # Test 1: Get User Cart (authenticated)
        if self.auth_token:
            success, response, status = await self.make_request('GET', '/cart')
            self.log_result("GET /api/cart", success, f"Cart retrieval endpoint accessible (status: {status})")
            
            # Test 2: Add Item to Cart (authenticated)
            # Get a listing ID first
            listings_success, listings_response, _ = await self.make_request('GET', '/listings')
            if listings_success and listings_response:
                listing_id = listings_response[0].get('id') if listings_response else None
                if listing_id:
                    cart_item = {
                        "listing_id": listing_id,
                        "quantity": 2
                    }
                    success, response, status = await self.make_request('POST', '/cart/add', cart_item)
                    self.log_result("POST /api/cart/add", success, f"Add to cart endpoint response: {status}")
                    
                    # Test 3: Update Cart Item (authenticated)
                    if success and 'cart_item_count' in response:
                        # Get cart to find item ID
                        cart_success, cart_response, _ = await self.make_request('GET', '/cart')
                        if cart_success and cart_response.get('items'):
                            item_id = cart_response['items'][0].get('id')
                            if item_id:
                                update_data = {
                                    "item_id": item_id,
                                    "quantity": 3
                                }
                                success, response, status = await self.make_request('PUT', '/cart/update', update_data)
                                self.log_result("PUT /api/cart/update", success, f"Cart update endpoint response: {status}")
                            else:
                                self.log_result("PUT /api/cart/update", False, "No item ID found in cart")
                        else:
                            self.log_result("PUT /api/cart/update", False, "Could not retrieve cart items")
                    else:
                        self.log_result("PUT /api/cart/update", False, "Skipped - add to cart failed")
                else:
                    self.log_result("POST /api/cart/add", False, "No listing ID available")
                    self.log_result("PUT /api/cart/update", False, "Skipped - add to cart skipped")
            else:
                self.log_result("POST /api/cart/add", False, "Could not retrieve listings")
                self.log_result("PUT /api/cart/update", False, "Skipped - add to cart skipped")
        else:
            self.log_result("GET /api/cart", False, "Skipped - no authentication token")
            self.log_result("POST /api/cart/add", False, "Skipped - no authentication token")
            self.log_result("PUT /api/cart/update", False, "Skipped - no authentication token")
            
        # Test 4: Guest Checkout Quote
        guest_quote_data = {
            "items": [
                {
                    "listing_id": "test-listing-id",
                    "quantity": 2,
                    "price": 150.00
                }
            ],
            "delivery_address": {
                "city": "Cape Town",
                "province": "Western Cape"
            }
        }
        
        success, response, status = await self.make_request('POST', '/checkout/guest/quote', guest_quote_data)
        self.log_result("POST /api/checkout/guest/quote", success, f"Guest checkout quote endpoint response: {status}")
        
        # Test 5: Guest Order Creation
        guest_order_data = {
            "items": [
                {
                    "listing_id": "test-listing-id",
                    "quantity": 1,
                    "price": 150.00
                }
            ],
            "contact": {
                "name": "Test Guest User",
                "email": "guest@test.com",
                "phone": "+27123456789"
            },
            "delivery_address": {
                "line1": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001"
            }
        }
        
        success, response, status = await self.make_request('POST', '/checkout/guest/create', guest_order_data)
        self.log_result("POST /api/checkout/guest/create", success, f"Guest order creation endpoint response: {status}")
        
    async def test_order_management_endpoints(self):
        """Test order management endpoints"""
        print("\n📦 TESTING ORDER MANAGEMENT ENDPOINTS")
        
        if self.auth_token:
            # Test 1: Get User Orders
            success, response, status = await self.make_request('GET', '/orders/user')
            if success:
                buyer_orders = response.get('buyer_orders', [])
                seller_orders = response.get('seller_orders', [])
                total_orders = len(buyer_orders) + len(seller_orders)
                self.log_result("GET /api/orders/user", True, f"Retrieved {total_orders} orders (buyer: {len(buyer_orders)}, seller: {len(seller_orders)})")
                
                # Test 2: Get Order Details (if orders exist)
                all_orders = buyer_orders + seller_orders
                if all_orders:
                    order_id = all_orders[0].get('id')
                    if order_id:
                        success, response, status = await self.make_request('GET', f'/orders/{order_id}')
                        self.log_result("GET /api/orders/{id}", success, f"Order details endpoint response: {status}")
                        
                        # Test 3: Update Order Status (if user is seller)
                        if order_id in [order.get('id') for order in seller_orders]:
                            status_update = {
                                "delivery_status": "preparing",
                                "note": "Order being prepared for shipment"
                            }
                            success, response, status = await self.make_request('PUT', f'/orders/{order_id}/status', status_update)
                            self.log_result("PUT /api/orders/{id}/status", success, f"Order status update endpoint response: {status}")
                        else:
                            self.log_result("PUT /api/orders/{id}/status", False, "Skipped - user is not seller for available orders")
                    else:
                        self.log_result("GET /api/orders/{id}", False, "No order ID found")
                        self.log_result("PUT /api/orders/{id}/status", False, "Skipped - no order ID")
                else:
                    self.log_result("GET /api/orders/{id}", False, "Skipped - no orders available")
                    self.log_result("PUT /api/orders/{id}/status", False, "Skipped - no orders available")
            else:
                self.log_result("GET /api/orders/user", False, f"Failed to retrieve orders: {response.get('detail', 'Unknown error')}")
                self.log_result("GET /api/orders/{id}", False, "Skipped - order retrieval failed")
                self.log_result("PUT /api/orders/{id}/status", False, "Skipped - order retrieval failed")
        else:
            self.log_result("GET /api/orders/user", False, "Skipped - no authentication token")
            self.log_result("GET /api/orders/{id}", False, "Skipped - no authentication token")
            self.log_result("PUT /api/orders/{id}/status", False, "Skipped - no authentication token")
            
    async def test_communication_endpoints(self):
        """Test communication endpoints"""
        print("\n💬 TESTING COMMUNICATION ENDPOINTS")
        
        if self.auth_token:
            # Test 1: Get User Notifications
            success, response, status = await self.make_request('GET', '/notifications')
            if success:
                notification_count = len(response) if isinstance(response, list) else 0
                self.log_result("GET /api/notifications", True, f"Retrieved {notification_count} notifications")
            else:
                self.log_result("GET /api/notifications", success, f"Notifications endpoint response: {status}")
                
            # Test 2: Get Message Threads
            success, response, status = await self.make_request('GET', '/inbox/threads')
            if success:
                thread_count = len(response) if isinstance(response, list) else 0
                self.log_result("GET /api/inbox/threads", True, f"Retrieved {thread_count} message threads")
                
                # Test 3: Send Message (if threads exist)
                if isinstance(response, list) and response:
                    thread_id = response[0].get('id')
                    if thread_id:
                        message_data = {
                            "content": "Test connectivity message",
                            "message_type": "text"
                        }
                        success, response, status = await self.make_request('POST', f'/inbox/threads/{thread_id}/messages', message_data)
                        self.log_result("POST /api/inbox/threads/{id}/messages", success, f"Send message endpoint response: {status}")
                    else:
                        self.log_result("POST /api/inbox/threads/{id}/messages", False, "No thread ID found")
                else:
                    self.log_result("POST /api/inbox/threads/{id}/messages", False, "Skipped - no message threads available")
            else:
                self.log_result("GET /api/inbox/threads", success, f"Message threads endpoint response: {status}")
                self.log_result("POST /api/inbox/threads/{id}/messages", False, "Skipped - thread retrieval failed")
        else:
            self.log_result("GET /api/notifications", False, "Skipped - no authentication token")
            self.log_result("GET /api/inbox/threads", False, "Skipped - no authentication token")
            self.log_result("POST /api/inbox/threads/{id}/messages", False, "Skipped - no authentication token")
            
    async def test_data_endpoints(self):
        """Test data endpoints"""
        print("\n📊 TESTING DATA ENDPOINTS")
        
        # Test 1: Get Livestock Categories
        success, response, status = await self.make_request('GET', '/taxonomy/categories')
        if success and isinstance(response, list):
            category_count = len(response)
            self.log_result("GET /api/taxonomy/categories", True, f"Retrieved {category_count} livestock categories")
        else:
            self.log_result("GET /api/taxonomy/categories", success, f"Categories endpoint response: {status}")
            
        # Test 2: Get Livestock Species
        success, response, status = await self.make_request('GET', '/species')
        if success and isinstance(response, list):
            species_count = len(response)
            self.log_result("GET /api/species", True, f"Retrieved {species_count} livestock species")
        else:
            self.log_result("GET /api/species", success, f"Species endpoint response: {status}")
            
        # Test 3: Get Product Types
        success, response, status = await self.make_request('GET', '/product-types')
        if success and isinstance(response, list):
            product_type_count = len(response)
            self.log_result("GET /api/product-types", True, f"Retrieved {product_type_count} product types")
        else:
            self.log_result("GET /api/product-types", success, f"Product types endpoint response: {status}")
            
    async def test_upload_endpoints(self):
        """Test upload endpoints"""
        print("\n📤 TESTING UPLOAD ENDPOINTS")
        
        if self.auth_token:
            # Create test image data
            test_image_content = b"fake_image_data_for_testing"
            
            # Test 1: Livestock Image Upload
            files = {
                'file': ('test_livestock.jpg', test_image_content, 'image/jpeg')
            }
            data = {
                'listing_id': 'test-listing-id',
                'image_type': 'primary'
            }
            
            success, response, status = await self.make_request('POST', '/upload/livestock-image', data=data, files=files)
            self.log_result("POST /api/upload/livestock-image", success, f"Livestock image upload endpoint response: {status}")
            
            # Test 2: Vet Certificate Upload
            test_cert_content = b"fake_certificate_data_for_testing"
            files = {
                'file': ('test_certificate.pdf', test_cert_content, 'application/pdf')
            }
            data = {
                'request_id': 'test-request-id'
            }
            
            success, response, status = await self.make_request('POST', '/upload/vet-certificate', data=data, files=files)
            self.log_result("POST /api/upload/vet-certificate", success, f"Vet certificate upload endpoint response: {status}")
        else:
            self.log_result("POST /api/upload/livestock-image", False, "Skipped - no authentication token")
            self.log_result("POST /api/upload/vet-certificate", False, "Skipped - no authentication token")
            
    async def run_all_tests(self):
        """Run all connectivity tests"""
        print("🚀 STARTING FRONTEND-BACKEND CONNECTIVITY VERIFICATION")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        
        await self.setup_session()
        
        try:
            # Run all test suites
            await self.test_authentication_endpoints()
            await self.test_marketplace_endpoints()
            await self.test_cart_checkout_endpoints()
            await self.test_order_management_endpoints()
            await self.test_communication_endpoints()
            await self.test_data_endpoints()
            await self.test_upload_endpoints()
            
            # Generate summary
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
        
        # Group results by category
        categories = {
            'Authentication': [],
            'Marketplace': [],
            'Cart & Checkout': [],
            'Order Management': [],
            'Communication': [],
            'Data': [],
            'Upload': []
        }
        
        for result in self.test_results:
            test_name = result['test']
            if 'auth' in test_name.lower():
                categories['Authentication'].append(result)
            elif 'listing' in test_name.lower():
                categories['Marketplace'].append(result)
            elif 'cart' in test_name.lower() or 'checkout' in test_name.lower():
                categories['Cart & Checkout'].append(result)
            elif 'order' in test_name.lower():
                categories['Order Management'].append(result)
            elif 'notification' in test_name.lower() or 'inbox' in test_name.lower():
                categories['Communication'].append(result)
            elif 'taxonomy' in test_name.lower() or 'species' in test_name.lower() or 'product-types' in test_name.lower():
                categories['Data'].append(result)
            elif 'upload' in test_name.lower():
                categories['Upload'].append(result)
                
        # Print category summaries
        print("\n📊 RESULTS BY CATEGORY:")
        for category, results in categories.items():
            if results:
                passed = sum(1 for r in results if r['success'])
                total = len(results)
                rate = (passed / total * 100) if total > 0 else 0
                status = "✅" if rate == 100 else "⚠️" if rate >= 50 else "❌"
                print(f"{status} {category}: {passed}/{total} ({rate:.1f}%)")
                
        # Print failed tests details
        failed_results = [r for r in self.test_results if not r['success']]
        if failed_results:
            print("\n❌ FAILED TESTS DETAILS:")
            for result in failed_results:
                print(f"  • {result['test']}: {result['details']}")
                
        # Print critical connectivity status
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
        print(f"\n💡 CONNECTIVITY RECOMMENDATIONS:")
        if failed_tests > 0:
            print("• Check CORS configuration for frontend domain")
            print("• Verify all API endpoints are properly prefixed with '/api'")
            print("• Ensure authentication headers are properly processed")
            print("• Validate request/response formats match frontend expectations")
            
        print("\n" + "="*80)

async def main():
    """Main test execution"""
    tester = FrontendBackendConnectivityTest()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())