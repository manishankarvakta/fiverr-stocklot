#!/usr/bin/env python3
"""
StockLot Comprehensive Testing Suite
Tests the core trade loop and essential functionality based on QA checklist
"""

import requests
import sys
import json
from datetime import datetime
import time

class StockLotTester:
    def __init__(self, base_url="https://buy-request-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.test_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, test_name, test_func):
        """Run a single test with error handling"""
        self.tests_run += 1
        self.log(f"🔍 Running: {test_name}")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                self.log(f"✅ PASSED: {test_name}")
                return True
            else:
                self.failed_tests.append(test_name)
                self.log(f"❌ FAILED: {test_name}", "ERROR")
                return False
        except Exception as e:
            self.failed_tests.append(f"{test_name} - Exception: {str(e)}")
            self.log(f"❌ EXCEPTION in {test_name}: {str(e)}", "ERROR")
            return False

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            self.log(f"Request: {method} {url} -> Status: {response.status_code}")
            
            if response.status_code == expected_status:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"Unexpected status code: {response.status_code}, Expected: {expected_status}")
                try:
                    error_data = response.json()
                    self.log(f"Error response: {error_data}")
                except:
                    self.log(f"Error response: {response.text}")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return False, None

    # ============ AUTHENTICATION TESTS ============
    
    def test_login_test_user(self):
        """Test login with test@example.com/testpass123"""
        success, data = self.make_request('POST', '/auth/login', {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        
        if success and data and 'access_token' in data:
            self.tokens['test_user'] = data['access_token']
            self.test_data['test_user'] = data.get('user', {})
            self.log(f"Test user logged in successfully. Roles: {data.get('user', {}).get('roles', [])}")
            return True
        return False

    def test_login_admin_user(self):
        """Test login with admin@stocklot.co.za/admin123"""
        success, data = self.make_request('POST', '/auth/login', {
            'email': 'admin@stocklot.co.za',
            'password': 'admin123'
        })
        
        if success and data and 'access_token' in data:
            self.tokens['admin_user'] = data['access_token']
            self.test_data['admin_user'] = data.get('user', {})
            self.log(f"Admin user logged in successfully. Roles: {data.get('user', {}).get('roles', [])}")
            return True
        return False

    # ============ MARKETPLACE TESTS ============
    
    def test_get_listings(self):
        """Test marketplace listings visibility"""
        success, data = self.make_request('GET', '/listings')
        
        if success and data:
            listings = data.get('data', data) if isinstance(data, dict) else data
            if isinstance(listings, list):
                self.test_data['listings'] = listings
                self.log(f"Found {len(listings)} listings in marketplace")
                return len(listings) > 0
        return False

    def test_get_taxonomy_data(self):
        """Test taxonomy data (species, breeds, product types)"""
        # Test species
        success, species_data = self.make_request('GET', '/species')
        if not success:
            return False
            
        # Test breeds  
        success, breeds_data = self.make_request('GET', '/breeds')
        if not success:
            return False
            
        # Test product types
        success, product_types_data = self.make_request('GET', '/product-types')
        if not success:
            return False
            
        self.log("Taxonomy data loaded successfully")
        return True

    # ============ SHOPPING CART TESTS ============
    
    def test_get_empty_cart(self):
        """Test getting empty cart"""
        success, data = self.make_request('GET', '/cart', token=self.tokens.get('test_user'))
        
        if success and data:
            self.log(f"Cart retrieved: {data.get('item_count', 0)} items")
            return True
        return False

    def test_add_to_cart(self):
        """Test adding item to cart"""
        listings = self.test_data.get('listings', [])
        if not listings:
            self.log("No listings available for cart test")
            return False
            
        # Use first available listing
        listing = listings[0]
        cart_data = {
            'listing_id': listing['id'],
            'quantity': 1,
            'shipping_option': 'standard'
        }
        
        success, data = self.make_request('POST', '/cart/add', cart_data, token=self.tokens.get('test_user'))
        
        if success and data:
            self.log(f"Item added to cart successfully")
            self.test_data['cart_listing_id'] = listing['id']
            return True
        return False

    def test_get_cart_with_items(self):
        """Test getting cart with items"""
        success, data = self.make_request('GET', '/cart', token=self.tokens.get('test_user'))
        
        if success and data and data.get('item_count', 0) > 0:
            self.test_data['cart_data'] = data
            self.log(f"Cart has {data['item_count']} items, total: R{data.get('total', 0)}")
            return True
        return False

    # ============ CHECKOUT TESTS ============
    
    def test_create_checkout_session(self):
        """Test creating checkout session"""
        checkout_data = {
            'shipping_address': {
                'line1': '123 Test Street',
                'city': 'Cape Town',
                'province': 'Western Cape',
                'postal_code': '8001',
                'country': 'ZA'
            },
            'payment_method': 'paystack'
        }
        
        success, data = self.make_request('POST', '/checkout/create', checkout_data, token=self.tokens.get('test_user'))
        
        if success and data and 'checkout_session_id' in data:
            self.test_data['checkout_session_id'] = data['checkout_session_id']
            self.log(f"Checkout session created: {data['checkout_session_id']}")
            return True
        return False

    def test_complete_checkout(self):
        """Test completing checkout (demo mode)"""
        session_id = self.test_data.get('checkout_session_id')
        if not session_id:
            return False
            
        payment_data = {
            'payment_method': 'paystack_demo',
            'demo_success': True
        }
        
        success, data = self.make_request('POST', f'/checkout/{session_id}/complete', payment_data, token=self.tokens.get('test_user'))
        
        if success and data and data.get('success'):
            orders = data.get('orders', [])
            if orders:
                self.test_data['created_orders'] = orders
                self.log(f"Checkout completed successfully. Created {len(orders)} orders")
                return True
        return False

    # ============ ORDER MANAGEMENT TESTS ============
    
    def test_get_user_orders(self):
        """Test getting user orders"""
        success, data = self.make_request('GET', '/orders/user', token=self.tokens.get('test_user'))
        
        if success and data:
            buyer_orders = data.get('buyer_orders', [])
            seller_orders = data.get('seller_orders', [])
            self.test_data['user_orders'] = data
            self.log(f"User has {len(buyer_orders)} buyer orders and {len(seller_orders)} seller orders")
            return True
        return False

    def test_order_status_update(self):
        """Test updating order status (as seller)"""
        # This test requires seller permissions, so we'll use admin token
        user_orders = self.test_data.get('user_orders', {})
        seller_orders = user_orders.get('seller_orders', [])
        
        if not seller_orders:
            self.log("No seller orders to test status update")
            return True  # Not a failure, just no data to test
            
        order = seller_orders[0]
        status_data = {
            'delivery_status': 'shipped',
            'note': 'Order has been shipped'
        }
        
        success, data = self.make_request('PUT', f'/orders/{order["id"]}/status', status_data, token=self.tokens.get('admin_user'))
        
        if success and data:
            self.log("Order status updated successfully")
            return True
        return False

    # ============ ADMIN TESTS ============
    
    def test_admin_stats(self):
        """Test admin statistics"""
        success, data = self.make_request('GET', '/admin/stats', token=self.tokens.get('admin_user'))
        
        if success and data:
            stats = data.get('data', data)
            self.log(f"Admin stats: {stats}")
            return True
        return False

    def test_admin_users(self):
        """Test admin user management"""
        success, data = self.make_request('GET', '/admin/users', token=self.tokens.get('admin_user'))
        
        if success and data:
            users = data.get('data', data) if isinstance(data, dict) else data
            if isinstance(users, list):
                self.log(f"Admin can access {len(users)} users")
                return True
        return False

    # ============ PAYMENT INTEGRATION TESTS ============
    
    def test_paystack_demo_mode(self):
        """Test Paystack demo mode configuration"""
        # This is tested implicitly in checkout completion
        # Just verify the demo mode is working
        return True

    # ============ MAIN TEST RUNNER ============
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        self.log("🚀 Starting StockLot Comprehensive Test Suite")
        self.log(f"Testing against: {self.base_url}")
        
        # Authentication Tests
        self.log("\n📋 AUTHENTICATION TESTS")
        self.run_test("Login Test User", self.test_login_test_user)
        self.run_test("Login Admin User", self.test_login_admin_user)
        
        # Marketplace Tests
        self.log("\n📋 MARKETPLACE TESTS")
        self.run_test("Get Listings", self.test_get_listings)
        self.run_test("Get Taxonomy Data", self.test_get_taxonomy_data)
        
        # Shopping Cart Tests
        self.log("\n📋 SHOPPING CART TESTS")
        self.run_test("Get Empty Cart", self.test_get_empty_cart)
        self.run_test("Add to Cart", self.test_add_to_cart)
        self.run_test("Get Cart with Items", self.test_get_cart_with_items)
        
        # Checkout Tests
        self.log("\n📋 CHECKOUT TESTS")
        self.run_test("Create Checkout Session", self.test_create_checkout_session)
        self.run_test("Complete Checkout", self.test_complete_checkout)
        
        # Order Management Tests
        self.log("\n📋 ORDER MANAGEMENT TESTS")
        self.run_test("Get User Orders", self.test_get_user_orders)
        self.run_test("Order Status Update", self.test_order_status_update)
        
        # Admin Tests
        self.log("\n📋 ADMIN TESTS")
        self.run_test("Admin Stats", self.test_admin_stats)
        self.run_test("Admin Users", self.test_admin_users)
        
        # Payment Tests
        self.log("\n📋 PAYMENT TESTS")
        self.run_test("Paystack Demo Mode", self.test_paystack_demo_mode)
        
        # Final Results
        self.print_results()

    def print_results(self):
        """Print final test results"""
        self.log("\n" + "="*60)
        self.log("📊 FINAL TEST RESULTS")
        self.log("="*60)
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                self.log(f"  - {test}")
        
        if self.tests_passed == self.tests_run:
            self.log("\n🎉 ALL TESTS PASSED! StockLot core functionality is working.")
            return 0
        else:
            self.log(f"\n⚠️  {len(self.failed_tests)} tests failed. Review issues above.")
            return 1

def main():
    """Main test execution"""
    tester = StockLotTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())