#!/usr/bin/env python3
"""
Comprehensive StockLot Marketplace Backend API Testing
Tests all critical functionality including authentication, marketplace, cart, and admin features.
"""

import requests
import sys
import json
from datetime import datetime
import time

class StockLotAPITester:
    def __init__(self, base_url="https://farm-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   📋 {details}")
        else:
            print(f"❌ {name}")
            if error:
                print(f"   🚨 Error: {error}")
            if details:
                print(f"   📋 {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "error": error
        })

    def make_request(self, method, endpoint, data=None, token=None, timeout=10):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            
            return response
        except requests.exceptions.RequestException as e:
            return None

    def test_backend_health(self):
        """Test if backend is accessible"""
        print("\n🔍 Testing Backend Health...")
        
        try:
            response = requests.get(f"{self.base_url}/docs", timeout=5)
            if response.status_code == 200:
                self.log_test("Backend Health Check", True, "FastAPI docs accessible")
                return True
            else:
                self.log_test("Backend Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", False, error=str(e))
            return False

    def test_user_authentication(self):
        """Test user login with test credentials"""
        print("\n🔍 Testing User Authentication...")
        
        # Test user login
        login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'access_token' in data:
                    self.test_token = data['access_token']
                    user_info = data.get('user', {})
                    self.log_test("User Login", True, f"User: {user_info.get('full_name', 'Unknown')}")
                    return True
                else:
                    self.log_test("User Login", False, "No access token in response")
                    return False
            except json.JSONDecodeError:
                self.log_test("User Login", False, "Invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('detail', 'Unknown error')
                except:
                    error_msg = response.text
            self.log_test("User Login", False, f"Status: {status}", error_msg)
            return False

    def test_admin_authentication(self):
        """Test admin login"""
        print("\n🔍 Testing Admin Authentication...")
        
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'access_token' in data:
                    self.admin_token = data['access_token']
                    user_info = data.get('user', {})
                    roles = user_info.get('roles', [])
                    is_admin = 'admin' in roles
                    self.log_test("Admin Login", True, f"Admin roles: {roles}, Is Admin: {is_admin}")
                    return True
                else:
                    self.log_test("Admin Login", False, "No access token in response")
                    return False
            except json.JSONDecodeError:
                self.log_test("Admin Login", False, "Invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Admin Login", False, f"Status: {status}")
            return False

    def test_marketplace_listings(self):
        """Test marketplace listings endpoint"""
        print("\n🔍 Testing Marketplace Listings...")
        
        response = self.make_request('GET', '/listings')
        if response and response.status_code == 200:
            try:
                data = response.json()
                listings = data if isinstance(data, list) else data.get('data', [])
                count = len(listings)
                
                if count >= 3:
                    # Check first few listings for required fields
                    sample_listing = listings[0] if listings else {}
                    required_fields = ['id', 'title', 'price_per_unit', 'quantity']
                    has_required = all(field in sample_listing for field in required_fields)
                    
                    self.log_test("Marketplace Listings", True, f"Found {count} listings, Required fields: {has_required}")
                    
                    # Log sample listings
                    for i, listing in enumerate(listings[:3]):
                        title = listing.get('title', 'Unknown')
                        price = listing.get('price_per_unit', 'N/A')
                        qty = listing.get('quantity', 'N/A')
                        print(f"   📦 Listing {i+1}: {title} - R{price} (Qty: {qty})")
                    
                    return True
                else:
                    self.log_test("Marketplace Listings", False, f"Only {count} listings found, expected at least 3")
                    return False
                    
            except json.JSONDecodeError:
                self.log_test("Marketplace Listings", False, "Invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Marketplace Listings", False, f"Status: {status}")
            return False

    def test_shopping_cart_apis(self):
        """Test shopping cart functionality"""
        print("\n🔍 Testing Shopping Cart APIs...")
        
        if not self.test_token:
            self.log_test("Shopping Cart APIs", False, "No user token available")
            return False
        
        # Test get cart (should be empty initially)
        response = self.make_request('GET', '/cart', token=self.test_token)
        if response and response.status_code == 200:
            try:
                cart_data = response.json()
                initial_count = cart_data.get('item_count', 0)
                self.log_test("Get Cart", True, f"Initial cart items: {initial_count}")
            except:
                self.log_test("Get Cart", False, "Invalid cart response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get Cart", False, f"Status: {status}")
            return False
        
        # Get a listing to add to cart
        listings_response = self.make_request('GET', '/listings')
        if listings_response and listings_response.status_code == 200:
            try:
                listings_data = listings_response.json()
                listings = listings_data if isinstance(listings_data, list) else listings_data.get('data', [])
                
                if listings:
                    test_listing = listings[0]
                    listing_id = test_listing.get('id')
                    
                    # Test add to cart
                    cart_item = {
                        "listing_id": listing_id,
                        "quantity": 2,
                        "shipping_option": "standard"
                    }
                    
                    add_response = self.make_request('POST', '/cart/add', cart_item, token=self.test_token)
                    if add_response and add_response.status_code == 200:
                        try:
                            add_data = add_response.json()
                            success = add_data.get('success', False)
                            cart_count = add_data.get('cart_item_count', 0)
                            self.log_test("Add to Cart", success, f"Cart now has {cart_count} items")
                            return success
                        except:
                            self.log_test("Add to Cart", False, "Invalid add to cart response")
                            return False
                    else:
                        status = add_response.status_code if add_response else "No response"
                        error_msg = ""
                        if add_response:
                            try:
                                error_data = add_response.json()
                                error_msg = error_data.get('detail', 'Unknown error')
                            except:
                                error_msg = add_response.text
                        self.log_test("Add to Cart", False, f"Status: {status}", error_msg)
                        return False
                else:
                    self.log_test("Add to Cart", False, "No listings available to add")
                    return False
            except:
                self.log_test("Add to Cart", False, "Failed to get listings for cart test")
                return False
        else:
            self.log_test("Add to Cart", False, "Could not fetch listings")
            return False

    def test_ai_faq_chatbot(self):
        """Test AI-powered FAQ chatbot"""
        print("\n🔍 Testing AI FAQ Chatbot...")
        
        chat_data = {
            "question": "How do I buy livestock on StockLot?"
        }
        
        response = self.make_request('POST', '/faq/chat', chat_data, timeout=15)
        if response and response.status_code == 200:
            try:
                data = response.json()
                ai_response = data.get('response', '')
                source = data.get('source', 'unknown')
                
                if ai_response and len(ai_response) > 10:
                    self.log_test("AI FAQ Chatbot", True, f"Source: {source}, Response length: {len(ai_response)} chars")
                    print(f"   🤖 AI Response: {ai_response[:100]}...")
                    return True
                else:
                    self.log_test("AI FAQ Chatbot", False, "Empty or too short response")
                    return False
            except json.JSONDecodeError:
                self.log_test("AI FAQ Chatbot", False, "Invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("AI FAQ Chatbot", False, f"Status: {status}")
            return False

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        print("\n🔍 Testing Admin Statistics...")
        
        if not self.admin_token:
            self.log_test("Admin Stats", False, "No admin token available")
            return False
        
        response = self.make_request('GET', '/admin/stats', token=self.admin_token)
        if response and response.status_code == 200:
            try:
                data = response.json()
                stats = data.get('data', {}) if 'data' in data else data
                
                total_listings = stats.get('total_listings', 0)
                total_users = stats.get('total_users', 0)
                total_orders = stats.get('total_orders', 0)
                
                self.log_test("Admin Stats", True, f"Listings: {total_listings}, Users: {total_users}, Orders: {total_orders}")
                return True
            except json.JSONDecodeError:
                self.log_test("Admin Stats", False, "Invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Admin Stats", False, f"Status: {status}")
            return False

    def test_checkout_flow(self):
        """Test checkout creation (without completing payment)"""
        print("\n🔍 Testing Checkout Flow...")
        
        if not self.test_token:
            self.log_test("Checkout Flow", False, "No user token available")
            return False
        
        # First ensure we have items in cart
        cart_response = self.make_request('GET', '/cart', token=self.test_token)
        if cart_response and cart_response.status_code == 200:
            try:
                cart_data = cart_response.json()
                item_count = cart_data.get('item_count', 0)
                
                if item_count > 0:
                    # Test checkout creation
                    checkout_data = {
                        "shipping_address": {
                            "line1": "123 Test Street",
                            "city": "Cape Town",
                            "province": "Western Cape",
                            "postal_code": "8001"
                        },
                        "payment_method": "card"
                    }
                    
                    checkout_response = self.make_request('POST', '/checkout/create', checkout_data, token=self.test_token)
                    if checkout_response and checkout_response.status_code == 200:
                        try:
                            checkout_result = checkout_response.json()
                            session_id = checkout_result.get('checkout_session_id')
                            total_amount = checkout_result.get('total_amount', 0)
                            
                            if session_id:
                                self.log_test("Checkout Flow", True, f"Session created: {session_id}, Total: R{total_amount}")
                                return True
                            else:
                                self.log_test("Checkout Flow", False, "No session ID returned")
                                return False
                        except:
                            self.log_test("Checkout Flow", False, "Invalid checkout response")
                            return False
                    else:
                        status = checkout_response.status_code if checkout_response else "No response"
                        self.log_test("Checkout Flow", False, f"Status: {status}")
                        return False
                else:
                    self.log_test("Checkout Flow", False, "No items in cart to checkout")
                    return False
            except:
                self.log_test("Checkout Flow", False, "Failed to get cart data")
                return False
        else:
            self.log_test("Checkout Flow", False, "Could not access cart")
            return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Comprehensive StockLot Backend API Testing")
        print("=" * 60)
        
        start_time = datetime.now()
        
        # Core functionality tests
        backend_healthy = self.test_backend_health()
        if not backend_healthy:
            print("\n❌ Backend not accessible, stopping tests")
            return False
        
        user_auth = self.test_user_authentication()
        admin_auth = self.test_admin_authentication()
        marketplace = self.test_marketplace_listings()
        cart_apis = self.test_shopping_cart_apis()
        ai_chatbot = self.test_ai_faq_chatbot()
        
        if admin_auth:
            admin_stats = self.test_admin_stats()
        
        if user_auth and cart_apis:
            checkout = self.test_checkout_flow()
        
        # Print summary
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"⏱️  Duration: {duration:.2f} seconds")
        print(f"📈 Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"📊 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['name']}")
            if result['details']:
                print(f"   📋 {result['details']}")
            if result['error']:
                print(f"   🚨 {result['error']}")
        
        # Critical issues
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n🚨 CRITICAL ISSUES ({len(failed_tests)} failures):")
            for test in failed_tests:
                print(f"❌ {test['name']}: {test['error'] or 'Failed'}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = StockLotAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())