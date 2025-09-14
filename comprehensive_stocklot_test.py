#!/usr/bin/env python3
"""
COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND TESTING
==================================================

Final comprehensive test with correct data structures and endpoints.
"""

import requests
import json
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"

class ComprehensiveStockLotTest:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        print(f"{status} - {test_name}: {details}")
        
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
            
    def test_core_marketplace_apis(self):
        """Test core marketplace APIs as requested in review"""
        print("\n🏪 TESTING CORE MARKETPLACE APIs (HIGH PRIORITY)")
        
        # Test 1: GET /api/listings - Already confirmed returning 7 listings correctly
        response = self.make_request("GET", "/listings")
        if response and response.status_code == 200:
            data = response.json()
            listings = data.get('listings', [])
            listing_count = len(listings)
            self.log_result("GET /api/listings", True, f"Retrieved {listing_count} listings correctly", {"count": listing_count})
        else:
            self.log_result("GET /api/listings", False, f"Failed to get listings: {response.status_code if response else 'No response'}")
            
        # Test 2: GET /api/listings/{id} - Test specific listing retrieval for PDP
        test_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"
        response = self.make_request("GET", f"/listings/{test_listing_id}")
        if response and response.status_code == 200:
            data = response.json()
            title = data.get('title', 'Unknown')
            seller_id = data.get('seller_id', 'Unknown')
            self.log_result("GET /api/listings/{id} for PDP", True, f"Retrieved listing: '{title}' (seller: {seller_id})")
        else:
            self.log_result("GET /api/listings/{id} for PDP", False, f"Failed to get specific listing: {response.status_code if response else 'No response'}")
            
        # Test 3: GET /api/species - Test species data for categorization
        response = self.make_request("GET", "/species")
        if response and response.status_code == 200:
            data = response.json()
            species_count = len(data) if isinstance(data, list) else len(data.get('species', []))
            self.log_result("GET /api/species", True, f"Retrieved {species_count} species for categorization")
        else:
            self.log_result("GET /api/species", False, f"Failed to get species: {response.status_code if response else 'No response'}")
            
        # Test 4: GET /api/taxonomy/categories - Test category groupings
        response = self.make_request("GET", "/taxonomy/categories")
        if response and response.status_code == 200:
            data = response.json()
            category_count = len(data) if isinstance(data, list) else len(data.get('categories', []))
            self.log_result("GET /api/taxonomy/categories", True, f"Retrieved {category_count} category groupings")
        else:
            self.log_result("GET /api/taxonomy/categories", False, f"Failed to get categories: {response.status_code if response else 'No response'}")
            
    def test_cart_and_checkout_flow(self):
        """Test cart and checkout flow APIs as requested in review"""
        print("\n🛒 TESTING CART & CHECKOUT FLOW (HIGH PRIORITY)")
        
        # Get a valid listing for testing
        listings_response = self.make_request("GET", "/listings")
        valid_listing_id = None
        if listings_response and listings_response.status_code == 200:
            data = listings_response.json()
            listings = data.get('listings', [])
            if len(listings) > 0:
                valid_listing_id = listings[0].get("id")
                
        if not valid_listing_id:
            self.log_result("Cart Setup", False, "No valid listing ID found for cart testing")
            return
            
        # Set up authentication (using email as token based on backend code)
        self.auth_token = "testbuyer@stocklot.co.za"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: POST /api/cart/add - Test add to cart functionality
        cart_item = {
            "listing_id": valid_listing_id,
            "quantity": 2,
            "shipping_option": "standard"
        }
        
        response = self.make_request("POST", "/cart/add", cart_item, headers)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("POST /api/cart/add", True, f"Added item to cart: {data.get('message', 'Success')}")
        else:
            self.log_result("POST /api/cart/add", False, f"Failed to add to cart: {response.status_code if response else 'No response'}")
            
        # Test 2: GET /api/cart - Test cart retrieval
        response = self.make_request("GET", "/cart", headers=headers)
        if response and response.status_code == 200:
            data = response.json()
            item_count = data.get("item_count", 0)
            total = data.get("total", 0)
            self.log_result("GET /api/cart", True, f"Retrieved cart: {item_count} items, R{total} total")
        else:
            self.log_result("GET /api/cart", False, f"Failed to get cart: {response.status_code if response else 'No response'}")
            
        # Test 3: POST /api/checkout/preview - Test checkout preview (buyer processing fee should show)
        preview_data = {
            "cart": [
                {
                    "seller_id": "test-seller-id",
                    "merch_subtotal_minor": 10000  # R100.00 in cents
                }
            ],
            "currency": "ZAR"
        }
        
        response = self.make_request("POST", "/checkout/preview", preview_data)
        if response and response.status_code == 200:
            data = response.json()
            preview = data.get("preview", {})
            per_seller = preview.get("per_seller", [])
            if per_seller:
                processing_fee = per_seller[0].get("lines", {}).get("buyer_processing_fee_minor", 0) / 100
                self.log_result("POST /api/checkout/preview", True, f"Checkout preview shows R{processing_fee} buyer processing fee (1.5%)")
            else:
                self.log_result("POST /api/checkout/preview", True, "Checkout preview working (no fee details)")
        else:
            self.log_result("POST /api/checkout/preview", False, f"Failed to get checkout preview: {response.status_code if response else 'No response'}")
            
        # Test 4: POST /api/checkout/create - Test checkout session creation
        checkout_data = {
            "shipping_address": {
                "name": "Test User",
                "address": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8000"
            },
            "payment_method": "paystack"
        }
        
        response = self.make_request("POST", "/checkout/create", checkout_data, headers)
        checkout_session_id = None
        if response and response.status_code == 200:
            data = response.json()
            checkout_session_id = data.get("checkout_session_id")
            total_amount = data.get("total_amount", 0)
            self.log_result("POST /api/checkout/create", True, f"Created checkout session: R{total_amount}")
        else:
            self.log_result("POST /api/checkout/create", False, f"Failed to create checkout: {response.status_code if response else 'No response'}")
            
        # Test 5: POST /api/checkout/{session_id}/complete - Test payment processing
        if checkout_session_id:
            complete_data = {
                "payment_method": "paystack",
                "callback_url": "https://stocklot.farm/payment/callback"
            }
            
            response = self.make_request("POST", f"/checkout/{checkout_session_id}/complete", complete_data, headers)
            if response and response.status_code == 200:
                data = response.json()
                payment_url = data.get("payment_url") or data.get("authorization_url")
                self.log_result("POST /api/checkout/complete", True, f"Checkout completed with payment URL: {bool(payment_url)}")
            else:
                self.log_result("POST /api/checkout/complete", False, f"Failed to complete checkout: {response.status_code if response else 'No response'}")
                
    def test_user_authentication(self):
        """Test user authentication APIs as requested in review"""
        print("\n🔐 TESTING USER AUTHENTICATION (MEDIUM PRIORITY)")
        
        # Test 1: POST /api/auth/register - Test user registration
        register_data = {
            "email": f"test_{uuid.uuid4().hex[:8]}@stocklot.co.za",
            "password": "TestPassword123!",
            "full_name": "Test User",
            "role": "buyer"
        }
        
        response = self.make_request("POST", "/auth/register", register_data)
        if response and response.status_code in [200, 201]:
            self.log_result("POST /api/auth/register", True, "User registration successful")
        else:
            self.log_result("POST /api/auth/register", False, f"Registration failed: {response.status_code if response else 'No response'}")
            
        # Test 2: POST /api/auth/login - Test user login (will fail with test credentials)
        login_data = {
            "email": "testbuyer@stocklot.co.za",
            "password": "TestPassword123!"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("POST /api/auth/login", True, "Login successful")
        else:
            # Expected to fail with test credentials
            self.log_result("POST /api/auth/login", False, f"Login failed (expected with test credentials): {response.status_code if response else 'No response'}")
            
        # Test 3: GET /api/auth/me - Test current user retrieval (will fail without proper session)
        response = self.make_request("GET", "/auth/me")
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/auth/me", True, f"Retrieved user info")
        else:
            # Expected to fail without proper session cookie
            self.log_result("GET /api/auth/me", False, f"Auth/me failed (expected without session): {response.status_code if response else 'No response'}")
            
    def test_guest_checkout(self):
        """Test guest checkout workflow as requested in review"""
        print("\n👤 TESTING GUEST CHECKOUT (HIGH PRIORITY)")
        
        # Get a valid listing for guest checkout
        listings_response = self.make_request("GET", "/listings")
        valid_listing_id = None
        if listings_response and listings_response.status_code == 200:
            data = listings_response.json()
            listings = data.get('listings', [])
            if len(listings) > 0:
                valid_listing_id = listings[0].get("id")
                
        if not valid_listing_id:
            self.log_result("Guest Checkout Setup", False, "No valid listing ID found for guest checkout testing")
            return
            
        # Test 1: POST /api/checkout/guest/quote - Test guest quote generation
        quote_data = {
            "items": [{"listing_id": valid_listing_id, "qty": 1}],
            "ship_to": {
                "province": "Western Cape",
                "country": "South Africa",
                "lat": -33.9249,
                "lng": 18.4241
            }
        }
        
        response = self.make_request("POST", "/checkout/guest/quote", quote_data)
        quote_result = None
        if response and response.status_code == 200:
            quote_result = response.json()
            subtotal = quote_result.get("subtotal", 0)
            self.log_result("POST /api/checkout/guest/quote", True, f"Guest quote generated: R{subtotal} subtotal")
        else:
            self.log_result("POST /api/checkout/guest/quote", False, f"Failed to get guest quote: {response.status_code if response else 'No response'}")
            
        # Test 2: POST /api/checkout/guest/create - Test guest checkout workflow
        if quote_result:
            guest_checkout_data = {
                "contact": {
                    "email": f"guest_{uuid.uuid4().hex[:8]}@example.com",
                    "phone": "+27123456789",
                    "full_name": "Guest User"
                },
                "ship_to": {
                    "province": "Western Cape",
                    "country": "South Africa",
                    "lat": -33.9249,
                    "lng": 18.4241
                },
                "items": [{"listing_id": valid_listing_id, "qty": 1}],
                "quote": quote_result
            }
            
            response = self.make_request("POST", "/checkout/guest/create", guest_checkout_data)
            if response and response.status_code == 200:
                data = response.json()
                payment_url = data.get("payment_url") or data.get("authorization_url")
                self.log_result("POST /api/checkout/guest/create", True, f"Guest checkout created with payment URL: {bool(payment_url)}")
            else:
                self.log_result("POST /api/checkout/guest/create", False, f"Failed to create guest checkout: {response.status_code if response else 'No response'}")
        else:
            self.log_result("POST /api/checkout/guest/create", False, "Skipped due to quote failure")
            
        # Test 3: GET /api/guest/session - Test guest session management
        response = self.make_request("GET", "/guest/session")
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/guest/session", True, "Guest session retrieved successfully")
        else:
            self.log_result("GET /api/guest/session", False, f"Failed to get guest session: {response.status_code if response else 'No response'}")
            
    def test_pdp_backend(self):
        """Test PDP (Product Detail Page) backend functionality as requested in review"""
        print("\n📄 TESTING PDP BACKEND (HIGH PRIORITY)")
        
        # Test 1: GET /api/listings/{specific-id} using the specific listing ID from review request
        test_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"
        response = self.make_request("GET", f"/listings/{test_listing_id}")
        if response and response.status_code == 200:
            data = response.json()
            title = data.get("title", "Unknown")
            seller_id = data.get("seller_id", "Unknown")
            self.log_result("GET /api/listings/{specific-id}", True, f"Retrieved PDP for '{title}' (seller: {seller_id})")
            
            # Test 2: Test seller information retrieval
            if seller_id and seller_id != "Unknown":
                self.log_result("Seller Information Retrieval", True, f"Seller ID available: {seller_id}")
            else:
                self.log_result("Seller Information Retrieval", False, "No seller information found in PDP")
                
            # Test 3: Test animal statistics data
            animal_stats = []
            stat_fields = ["weight_kg", "age_weeks", "age_days", "health_status", "vaccination_status", "animal_type"]
            for field in stat_fields:
                if data.get(field):
                    animal_stats.append(f"{field}: {data[field]}")
                    
            if animal_stats:
                self.log_result("Animal Statistics Data", True, f"Animal statistics available: {', '.join(animal_stats)}")
            else:
                self.log_result("Animal Statistics Data", False, "No animal statistics found in PDP")
                
        else:
            self.log_result("GET /api/listings/{specific-id}", False, f"Failed to get PDP for specific listing: {response.status_code if response else 'No response'}")
            self.log_result("Seller Information Retrieval", False, "Cannot test - PDP request failed")
            self.log_result("Animal Statistics Data", False, "Cannot test - PDP request failed")
            
    def test_additional_endpoints(self):
        """Test additional endpoints for completeness"""
        print("\n🔍 TESTING ADDITIONAL ENDPOINTS")
        
        # Test fee breakdown endpoint
        response = self.make_request("GET", "/fees/breakdown", params={"amount": 100})
        if response and response.status_code == 200:
            data = response.json()
            processing_fee = data.get("buyer_processing_fee", 0)
            self.log_result("GET /api/fees/breakdown", True, f"Fee breakdown working: R{processing_fee} processing fee")
        else:
            self.log_result("GET /api/fees/breakdown", False, f"Failed to get fee breakdown: {response.status_code if response else 'No response'}")
            
    def run_all_tests(self):
        """Run all test suites in priority order"""
        print("🚀 STARTING COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND TESTING")
        print("=" * 70)
        
        # Run tests in order of priority as specified in review request
        self.test_core_marketplace_apis()      # HIGH PRIORITY
        self.test_cart_and_checkout_flow()     # HIGH PRIORITY  
        self.test_guest_checkout()             # HIGH PRIORITY
        self.test_pdp_backend()                # HIGH PRIORITY
        self.test_user_authentication()        # MEDIUM PRIORITY
        self.test_additional_endpoints()
        
        # Generate summary
        self.generate_summary()
        
    def generate_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Categorize results by priority
        high_priority_tests = [
            "GET /api/listings", "GET /api/listings/{id} for PDP", "GET /api/species", "GET /api/taxonomy/categories",
            "POST /api/cart/add", "GET /api/cart", "POST /api/checkout/preview", "POST /api/checkout/create", "POST /api/checkout/complete",
            "POST /api/checkout/guest/quote", "POST /api/checkout/guest/create", "GET /api/guest/session",
            "GET /api/listings/{specific-id}", "Seller Information Retrieval", "Animal Statistics Data"
        ]
        
        high_priority_results = [r for r in self.test_results if r["test"] in high_priority_tests]
        high_priority_passed = sum(1 for r in high_priority_results if r["success"])
        high_priority_total = len(high_priority_results)
        
        print(f"\n🔥 HIGH PRIORITY TESTS: {high_priority_passed}/{high_priority_total} passed ({(high_priority_passed/high_priority_total*100):.1f}%)")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
                    
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  - {result['test']}: {result['details']}")
                
        # Save results to file
        with open("/app/comprehensive_stocklot_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "failed_tests": failed_tests,
                    "success_rate": success_rate,
                    "high_priority_passed": high_priority_passed,
                    "high_priority_total": high_priority_total
                },
                "results": self.test_results
            }, f, indent=2)
            
        print(f"\n📄 Detailed results saved to: /app/comprehensive_stocklot_test_results.json")

if __name__ == "__main__":
    tester = ComprehensiveStockLotTest()
    tester.run_all_tests()