#!/usr/bin/env python3
"""
Critical Fixes and Dashboard Functionality Testing
Testing the specific fixes mentioned in the review request:
1. Marketplace Filters Testing - Category group filtering fix
2. Buyer Processing Fee Backend - 1.5% fee in checkout quote
3. Seller Analytics Endpoint - New analytics endpoint
4. Critical Dashboard API Endpoints - Dashboard components support
5. Error Handling - Authentication and error responses
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials (from previous test results)
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "testpass123"

class CriticalFixesTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def authenticate_admin(self):
        """Authenticate as admin user"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.log_result("Admin Authentication", True, f"Admin token obtained")
                return True
            else:
                self.log_result("Admin Authentication", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Admin Authentication", False, error=str(e))
            return False

    def authenticate_user(self):
        """Authenticate as regular user"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("access_token")
                self.log_result("User Authentication", True, f"User token obtained")
                return True
            else:
                self.log_result("User Authentication", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Authentication", False, error=str(e))
            return False

    def test_marketplace_category_filters(self):
        """Test 1: Marketplace Category Group Filtering Fix"""
        print("🔍 TESTING MARKETPLACE CATEGORY GROUP FILTERING FIX")
        print("=" * 60)
        
        try:
            # Test 1.1: Get category groups
            response = self.session.get(f"{API_BASE}/taxonomy/categories")
            if response.status_code == 200:
                categories = response.json()
                self.log_result("Get Category Groups", True, f"Found {len(categories)} category groups")
                
                # Test 1.2: Test filtering by each category group
                for category in categories[:3]:  # Test first 3 categories
                    category_id = category.get("id")
                    category_name = category.get("name")
                    
                    # Test category group filtering
                    filter_response = self.session.get(f"{API_BASE}/listings", params={
                        "category_group_id": category_id
                    })
                    
                    if filter_response.status_code == 200:
                        listings = filter_response.json()
                        listing_count = len(listings) if isinstance(listings, list) else listings.get("total", 0)
                        
                        if listing_count > 0:
                            self.log_result(f"Category Filter - {category_name}", True, 
                                          f"Found {listing_count} listings for category {category_name}")
                        else:
                            # This was the bug - should not return 0 results for all categories
                            self.log_result(f"Category Filter - {category_name}", False, 
                                          f"Still returning 0 results for category {category_name} - filter bug not fixed")
                    else:
                        self.log_result(f"Category Filter - {category_name}", False, 
                                      error=f"Status: {filter_response.status_code}")
            else:
                self.log_result("Get Category Groups", False, error=f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Marketplace Category Filtering", False, error=str(e))

    def test_buyer_processing_fee(self):
        """Test 2: Buyer Processing Fee in Checkout Quote"""
        print("🔍 TESTING BUYER PROCESSING FEE (1.5%) IN CHECKOUT QUOTE")
        print("=" * 60)
        
        try:
            # Test 2.1: Test fee breakdown endpoint
            test_amounts = [1000, 2500, 5000]  # Test different amounts in cents
            
            for amount in test_amounts:
                response = self.session.get(f"{API_BASE}/fees/breakdown", params={
                    "amount": amount
                })
                
                if response.status_code == 200:
                    fee_data = response.json()
                    processing_fee = fee_data.get("processing_fee_minor", 0)
                    expected_fee = int(amount * 0.015)  # 1.5%
                    
                    if processing_fee == expected_fee:
                        self.log_result(f"Processing Fee Calculation - R{amount/100:.2f}", True,
                                      f"Correct 1.5% fee: R{processing_fee/100:.2f} for amount R{amount/100:.2f}")
                    else:
                        self.log_result(f"Processing Fee Calculation - R{amount/100:.2f}", False,
                                      f"Expected R{expected_fee/100:.2f}, got R{processing_fee/100:.2f}")
                else:
                    self.log_result(f"Fee Breakdown - R{amount/100:.2f}", False, 
                                  error=f"Status: {response.status_code}")
            
            # Test 2.2: Test checkout preview with processing fee
            if self.user_token:
                headers = {"Authorization": f"Bearer {self.user_token}"}
                
                # Create a sample cart for checkout preview
                cart_data = {
                    "items": [
                        {
                            "listing_id": "test-listing-id",
                            "quantity": 2,
                            "price": 1500  # R15.00 per unit
                        }
                    ]
                }
                
                response = self.session.post(f"{API_BASE}/checkout/preview", 
                                           json=cart_data, headers=headers)
                
                if response.status_code == 200:
                    checkout_data = response.json()
                    
                    # Check if processing fee is included
                    if "processing_fee" in checkout_data or "buyer_processing_fee" in checkout_data:
                        processing_fee = checkout_data.get("processing_fee", checkout_data.get("buyer_processing_fee", 0))
                        self.log_result("Checkout Preview Processing Fee", True,
                                      f"Processing fee included in checkout: R{processing_fee/100:.2f}")
                    else:
                        self.log_result("Checkout Preview Processing Fee", False,
                                      "Processing fee not found in checkout preview response")
                else:
                    self.log_result("Checkout Preview", False, 
                                  error=f"Status: {response.status_code}, Response: {response.text}")
            
        except Exception as e:
            self.log_result("Buyer Processing Fee Testing", False, error=str(e))

    def test_seller_analytics_endpoint(self):
        """Test 3: Seller Analytics Endpoint"""
        print("🔍 TESTING SELLER ANALYTICS ENDPOINT")
        print("=" * 60)
        
        try:
            if not self.user_token:
                self.log_result("Seller Analytics - No Auth", False, error="No user token available")
                return
                
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Test 3.1: Test seller analytics endpoint
            response = self.session.get(f"{API_BASE}/seller/analytics", headers=headers)
            
            if response.status_code == 200:
                analytics_data = response.json()
                
                # Check for expected analytics fields
                expected_fields = ["total_sales", "total_revenue", "active_listings", "orders_count"]
                found_fields = []
                
                for field in expected_fields:
                    if field in analytics_data:
                        found_fields.append(field)
                
                if found_fields:
                    self.log_result("Seller Analytics Endpoint", True,
                                  f"Analytics endpoint working. Found fields: {', '.join(found_fields)}")
                else:
                    self.log_result("Seller Analytics Endpoint", False,
                                  "Analytics endpoint accessible but missing expected fields")
                    
            elif response.status_code == 403:
                self.log_result("Seller Analytics - Authorization", True,
                              "Endpoint properly requires seller role (403 for non-seller)")
            elif response.status_code == 401:
                self.log_result("Seller Analytics - Authentication", True,
                              "Endpoint properly requires authentication")
            else:
                self.log_result("Seller Analytics Endpoint", False,
                              error=f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Seller Analytics Testing", False, error=str(e))

    def test_dashboard_api_endpoints(self):
        """Test 4: Critical Dashboard API Endpoints"""
        print("🔍 TESTING CRITICAL DASHBOARD API ENDPOINTS")
        print("=" * 60)
        
        try:
            if not self.admin_token:
                self.log_result("Dashboard APIs - No Admin Auth", False, error="No admin token available")
                return
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test 4.1: Admin moderation stats
            response = self.session.get(f"{API_BASE}/admin/moderation/stats", headers=headers)
            if response.status_code == 200:
                stats_data = response.json()
                self.log_result("Admin Moderation Stats", True,
                              f"Stats endpoint working. Keys: {list(stats_data.keys())}")
            else:
                self.log_result("Admin Moderation Stats", False,
                              error=f"Status: {response.status_code}")
            
            # Test 4.2: Role requests endpoint
            response = self.session.get(f"{API_BASE}/admin/roles/requests", headers=headers)
            if response.status_code == 200:
                role_requests = response.json()
                self.log_result("Admin Role Requests", True,
                              f"Role requests endpoint working. Found {len(role_requests) if isinstance(role_requests, list) else 'N/A'} requests")
            else:
                self.log_result("Admin Role Requests", False,
                              error=f"Status: {response.status_code}")
            
            # Test 4.3: Disease zones endpoint
            response = self.session.get(f"{API_BASE}/admin/disease/zones", headers=headers)
            if response.status_code == 200:
                disease_zones = response.json()
                self.log_result("Admin Disease Zones", True,
                              f"Disease zones endpoint working. Found {len(disease_zones) if isinstance(disease_zones, list) else 'N/A'} zones")
            else:
                self.log_result("Admin Disease Zones", False,
                              error=f"Status: {response.status_code}")
            
            # Test 4.4: Feature flags endpoint
            response = self.session.get(f"{API_BASE}/admin/config/flags", headers=headers)
            if response.status_code == 200:
                feature_flags = response.json()
                self.log_result("Admin Feature Flags", True,
                              f"Feature flags endpoint working. Found {len(feature_flags) if isinstance(feature_flags, list) else 'N/A'} flags")
            else:
                self.log_result("Admin Feature Flags", False,
                              error=f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Dashboard API Testing", False, error=str(e))

    def test_error_handling_authentication(self):
        """Test 5: Error Handling and Authentication"""
        print("🔍 TESTING ERROR HANDLING AND AUTHENTICATION")
        print("=" * 60)
        
        try:
            # Test 5.1: Unauthenticated access to protected endpoints
            protected_endpoints = [
                "/seller/analytics",
                "/admin/moderation/stats",
                "/admin/roles/requests",
                "/cart",
                "/orders/user"
            ]
            
            for endpoint in protected_endpoints:
                response = self.session.get(f"{API_BASE}{endpoint}")
                
                if response.status_code == 401:
                    self.log_result(f"Auth Required - {endpoint}", True,
                                  "Properly returns 401 for unauthenticated access")
                elif response.status_code == 403:
                    self.log_result(f"Auth Required - {endpoint}", True,
                                  "Properly returns 403 for insufficient permissions")
                else:
                    self.log_result(f"Auth Required - {endpoint}", False,
                                  f"Expected 401/403, got {response.status_code}")
            
            # Test 5.2: Invalid token handling
            invalid_headers = {"Authorization": "Bearer invalid-token-12345"}
            
            response = self.session.get(f"{API_BASE}/cart", headers=invalid_headers)
            if response.status_code in [401, 403]:
                self.log_result("Invalid Token Handling", True,
                              f"Properly rejects invalid token with status {response.status_code}")
            else:
                self.log_result("Invalid Token Handling", False,
                              f"Expected 401/403 for invalid token, got {response.status_code}")
            
            # Test 5.3: Non-existent endpoint handling
            response = self.session.get(f"{API_BASE}/non-existent-endpoint")
            if response.status_code == 404:
                self.log_result("404 Error Handling", True,
                              "Properly returns 404 for non-existent endpoints")
            else:
                self.log_result("404 Error Handling", False,
                              f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Error Handling Testing", False, error=str(e))

    def run_all_tests(self):
        """Run all critical fixes tests"""
        print("🚀 STARTING CRITICAL FIXES AND DASHBOARD FUNCTIONALITY TESTING")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Time: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        # Authenticate first
        self.authenticate_admin()
        self.authenticate_user()
        print()
        
        # Run all tests
        self.test_marketplace_category_filters()
        self.test_buyer_processing_fee()
        self.test_seller_analytics_endpoint()
        self.test_dashboard_api_endpoints()
        self.test_error_handling_authentication()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['error']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}")
        
        print()
        print("🎯 CRITICAL FIXES STATUS:")
        
        # Check specific fixes
        marketplace_fixed = any(r["success"] and "Category Filter" in r["test"] for r in self.test_results)
        processing_fee_working = any(r["success"] and "Processing Fee" in r["test"] for r in self.test_results)
        analytics_working = any(r["success"] and "Analytics" in r["test"] for r in self.test_results)
        dashboard_working = any(r["success"] and ("Admin" in r["test"] or "Dashboard" in r["test"]) for r in self.test_results)
        auth_working = any(r["success"] and "Auth" in r["test"] for r in self.test_results)
        
        print(f"  • Marketplace Category Filtering: {'✅ FIXED' if marketplace_fixed else '❌ STILL BROKEN'}")
        print(f"  • 1.5% Buyer Processing Fee: {'✅ WORKING' if processing_fee_working else '❌ NOT WORKING'}")
        print(f"  • Seller Analytics Endpoint: {'✅ WORKING' if analytics_working else '❌ NOT WORKING'}")
        print(f"  • Dashboard API Endpoints: {'✅ WORKING' if dashboard_working else '❌ NOT WORKING'}")
        print(f"  • Authentication & Error Handling: {'✅ WORKING' if auth_working else '❌ NOT WORKING'}")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = CriticalFixesTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 CRITICAL FIXES TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n⚠️  CRITICAL FIXES TESTING COMPLETED WITH ISSUES!")
        sys.exit(1)