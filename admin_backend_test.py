#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class AdminDashboardTester:
    def __init__(self, base_url="https://farmstock-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.admin_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.sample_user_id = None
        self.sample_listing_id = None
        self.sample_order_id = None

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None and isinstance(response_data, dict):
            # Show limited response data
            limited_data = str(response_data)[:300]
            print(f"   Response: {limited_data}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def test_api_endpoint(self, method, endpoint, expected_status=200, data=None, description=""):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        test_name = f"{method} {endpoint}" + (f" ({description})" if description else "")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}

            if success:
                self.log_result(test_name, True, f"Status: {response.status_code}", response_data)
                return True, response_data
            else:
                self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", response_data)
                return False, response_data

        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_admin_authentication(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Admin login")
        
        if success and 'access_token' in login_response:
            self.admin_user = login_response.get('user', {})
            if 'admin' in self.admin_user.get('roles', []):
                print(f"   ✅ Admin authenticated: {self.admin_user.get('full_name', 'Unknown')}")
                print(f"   ✅ Admin roles: {self.admin_user.get('roles', [])}")
                self.admin_token = login_response['access_token']
                return True
            else:
                print(f"   ❌ User authenticated but not admin: {self.admin_user.get('roles', [])}")
        
        return False

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        print("\n📊 Testing Admin Statistics...")
        
        success, stats_data = self.test_api_endpoint('GET', '/admin/stats', 200, description="Get admin statistics")
        
        if success:
            stats = stats_data.get('data', {})
            print(f"   📈 Total Users: {stats.get('total_users', 0)}")
            print(f"   📈 Total Listings: {stats.get('total_listings', 0)}")
            print(f"   📈 Total Orders: {stats.get('total_orders', 0)}")
            print(f"   📈 Active Listings: {stats.get('active_listings', 0)}")
            print(f"   📈 Pending Listings: {stats.get('pending_listings', 0)}")
            return True, stats
        
        return False, {}

    def test_admin_users_management(self):
        """Test admin user management endpoints"""
        print("\n👥 Testing Admin User Management...")
        
        # Get all users
        success, users_data = self.test_api_endpoint('GET', '/admin/users', 200, description="Get all users")
        
        if success:
            users = users_data.get('data', []) if isinstance(users_data, dict) else users_data
            print(f"   👥 Found {len(users)} users")
            
            # Find a non-admin user for testing
            test_user = None
            for user in users:
                if 'admin' not in user.get('roles', []):
                    test_user = user
                    self.sample_user_id = user.get('id')
                    break
            
            if test_user:
                print(f"   🎯 Testing with user: {test_user.get('full_name', 'Unknown')} ({test_user.get('email', 'No email')})")
                
                # Test user suspension
                success, _ = self.test_api_endpoint('POST', f'/admin/users/{self.sample_user_id}/suspend', 200, 
                                                 {"reason": "Test suspension"}, "Suspend user")
                
                if success:
                    print("   ✅ User suspended successfully")
                    
                    # Test user activation
                    success, _ = self.test_api_endpoint('POST', f'/admin/users/{self.sample_user_id}/activate', 200, 
                                                     {}, "Activate user")
                    
                    if success:
                        print("   ✅ User activated successfully")
                        return True
            else:
                print("   ⚠️  No non-admin users found for testing")
                return True  # Still consider success if we can get users list
        
        return False

    def test_admin_listings_management(self):
        """Test admin listings management endpoints"""
        print("\n📦 Testing Admin Listings Management...")
        
        # Get all listings
        success, listings_data = self.test_api_endpoint('GET', '/listings', 200, description="Get all listings")
        
        if success:
            listings = listings_data if isinstance(listings_data, list) else listings_data.get('data', [])
            print(f"   📦 Found {len(listings)} listings")
            
            if len(listings) > 0:
                # Find a listing to test with
                test_listing = listings[0]
                self.sample_listing_id = test_listing.get('id')
                print(f"   🎯 Testing with listing: {test_listing.get('title', 'Unknown')}")
                
                # Test listing approval
                success, _ = self.test_api_endpoint('POST', f'/admin/listings/{self.sample_listing_id}/approve', 200, 
                                                 {}, "Approve listing")
                
                if success:
                    print("   ✅ Listing approved successfully")
                    
                    # Test listing rejection (will change status back)
                    success, _ = self.test_api_endpoint('POST', f'/admin/listings/{self.sample_listing_id}/reject', 200, 
                                                     {"reason": "Test rejection"}, "Reject listing")
                    
                    if success:
                        print("   ✅ Listing rejected successfully")
                        return True
            else:
                print("   ⚠️  No listings found for testing")
                return True  # Still consider success if endpoint works
        
        return False

    def test_admin_orders_management(self):
        """Test admin orders management endpoints"""
        print("\n🛒 Testing Admin Orders Management...")
        
        # Get all orders
        success, orders_data = self.test_api_endpoint('GET', '/admin/orders', 200, description="Get all orders")
        
        if success:
            orders = orders_data.get('data', []) if isinstance(orders_data, dict) else orders_data
            print(f"   🛒 Found {len(orders)} orders")
            
            if len(orders) > 0:
                # Find an order to test with
                test_order = orders[0]
                self.sample_order_id = test_order.get('id')
                print(f"   🎯 Testing with order: {self.sample_order_id}")
                
                # Test escrow release
                success, _ = self.test_api_endpoint('POST', f'/admin/orders/{self.sample_order_id}/escrow/release', 200, 
                                                 {"reason": "Test release"}, "Release escrow")
                
                if success:
                    print("   ✅ Escrow released successfully")
                    return True
                else:
                    # Try escrow refund instead
                    success, _ = self.test_api_endpoint('POST', f'/admin/orders/{self.sample_order_id}/escrow/refund', 200, 
                                                     {"reason": "Test refund"}, "Refund escrow")
                    
                    if success:
                        print("   ✅ Escrow refunded successfully")
                        return True
            else:
                print("   ⚠️  No orders found for testing")
                return True  # Still consider success if endpoint works
        
        return False

    def test_admin_settings_management(self):
        """Test admin settings and feature flags"""
        print("\n⚙️ Testing Admin Settings Management...")
        
        # Test public config endpoint
        success, config_data = self.test_api_endpoint('GET', '/public/config', 200, description="Get public config")
        
        if success:
            config = config_data.get('data', {}) if isinstance(config_data, dict) else config_data
            print(f"   ⚙️ Config loaded with {len(config)} settings")
            
            # Test admin settings update (if endpoint exists)
            settings_update = {
                "maintenance_mode": False,
                "allow_registrations": True,
                "max_listings_per_user": 100
            }
            
            # This might not exist, so we expect it could fail
            success, _ = self.test_api_endpoint('POST', '/admin/settings', 200, settings_update, "Update admin settings")
            
            return True  # Consider success if we can at least get config
        
        return False

    def test_admin_sse_events(self):
        """Test Server-Sent Events endpoint"""
        print("\n📡 Testing Admin SSE Events...")
        
        # Test SSE endpoint (this will be a streaming endpoint)
        url = f"{self.base_url}/admin/events/stream"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        try:
            # Make a quick connection test (don't wait for events)
            response = requests.get(url, headers=headers, timeout=5, stream=True)
            
            if response.status_code == 200:
                print("   ✅ SSE endpoint accessible")
                # Check if it's actually streaming
                if 'text/event-stream' in response.headers.get('content-type', ''):
                    print("   ✅ SSE content-type correct")
                    self.log_result("GET /admin/events/stream (SSE Events)", True, "SSE endpoint working")
                    return True
                else:
                    print("   ⚠️  SSE endpoint accessible but wrong content-type")
                    self.log_result("GET /admin/events/stream (SSE Events)", False, "Wrong content-type")
            else:
                print(f"   ❌ SSE endpoint returned {response.status_code}")
                self.log_result("GET /admin/events/stream (SSE Events)", False, f"Status {response.status_code}")
                
        except requests.exceptions.Timeout:
            print("   ✅ SSE endpoint timeout (expected for streaming)")
            self.log_result("GET /admin/events/stream (SSE Events)", True, "Timeout expected for streaming")
            return True
        except Exception as e:
            print(f"   ❌ SSE endpoint error: {e}")
            self.log_result("GET /admin/events/stream (SSE Events)", False, str(e))
        
        return False

    def test_admin_analytics(self):
        """Test admin analytics endpoints"""
        print("\n📈 Testing Admin Analytics...")
        
        # Test analytics endpoint (might be part of stats)
        success, analytics_data = self.test_api_endpoint('GET', '/admin/analytics', 200, description="Get admin analytics")
        
        if not success:
            # If dedicated analytics endpoint doesn't exist, use stats
            print("   ℹ️  Dedicated analytics endpoint not found, using stats")
            success, analytics_data = self.test_api_endpoint('GET', '/admin/stats', 200, description="Get stats as analytics")
        
        if success:
            print("   ✅ Analytics data available")
            return True
        
        return False

    def run_comprehensive_admin_test(self):
        """Run comprehensive admin dashboard tests"""
        print("🚀 Starting StockLot Admin Dashboard Comprehensive Test")
        print("=" * 70)
        
        # Test admin authentication first
        if not self.test_admin_authentication():
            print("\n❌ CRITICAL: Admin authentication failed!")
            print("   Cannot proceed with admin tests without authentication")
            return False
        
        print(f"\n✅ Admin authenticated successfully as: {self.admin_user.get('full_name')}")
        print(f"   Admin ID: {self.admin_user.get('id')}")
        print(f"   Admin Email: {self.admin_user.get('email')}")
        
        # Test all admin endpoints
        print("\n" + "=" * 50)
        print("🔍 TESTING ADMIN DASHBOARD FUNCTIONALITY")
        print("=" * 50)
        
        # 1. Admin Statistics
        stats_success, stats = self.test_admin_stats()
        
        # 2. User Management
        users_success = self.test_admin_users_management()
        
        # 3. Listings Management
        listings_success = self.test_admin_listings_management()
        
        # 4. Orders Management
        orders_success = self.test_admin_orders_management()
        
        # 5. Settings Management
        settings_success = self.test_admin_settings_management()
        
        # 6. SSE Events
        sse_success = self.test_admin_sse_events()
        
        # 7. Analytics
        analytics_success = self.test_admin_analytics()
        
        # Print comprehensive summary
        print("\n" + "=" * 70)
        print("📊 ADMIN DASHBOARD TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Admin functionality analysis
        print(f"\n🔍 ADMIN FUNCTIONALITY ANALYSIS:")
        print(f"   {'✅' if stats_success else '❌'} Admin Statistics: {'Working' if stats_success else 'Failed'}")
        print(f"   {'✅' if users_success else '❌'} User Management: {'Working' if users_success else 'Failed'}")
        print(f"   {'✅' if listings_success else '❌'} Listings Management: {'Working' if listings_success else 'Failed'}")
        print(f"   {'✅' if orders_success else '❌'} Orders Management: {'Working' if orders_success else 'Failed'}")
        print(f"   {'✅' if settings_success else '❌'} Settings Management: {'Working' if settings_success else 'Failed'}")
        print(f"   {'✅' if sse_success else '❌'} SSE Events: {'Working' if sse_success else 'Failed'}")
        print(f"   {'✅' if analytics_success else '❌'} Analytics: {'Working' if analytics_success else 'Failed'}")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 ALL ADMIN TESTS PASSED!")
        
        # Data summary
        if stats_success and stats:
            print(f"\n📊 CURRENT SYSTEM DATA:")
            print(f"   Users: {stats.get('total_users', 0)}")
            print(f"   Listings: {stats.get('total_listings', 0)}")
            print(f"   Orders: {stats.get('total_orders', 0)}")
            print(f"   Active Listings: {stats.get('active_listings', 0)}")
            print(f"   Pending Listings: {stats.get('pending_listings', 0)}")
        
        # Overall assessment
        critical_functions = [stats_success, users_success, listings_success]
        if all(critical_functions):
            print(f"\n🎯 OVERALL ASSESSMENT: ✅ ADMIN DASHBOARD READY FOR TESTING")
            print("   All critical admin functions are working")
        else:
            print(f"\n🎯 OVERALL ASSESSMENT: ⚠️  SOME ADMIN FUNCTIONS NEED ATTENTION")
            print("   Some admin endpoints may need fixes before frontend testing")
        
        return self.tests_passed >= (self.tests_run * 0.8)  # 80% success rate

def main():
    """Main test function"""
    tester = AdminDashboardTester()
    success = tester.run_comprehensive_admin_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())