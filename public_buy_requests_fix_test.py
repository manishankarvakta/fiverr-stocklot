#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PublicBuyRequestsFixTester:
    def __init__(self, base_url="https://farmstock-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.seller_token = None
        self.test_buy_request_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None:
            print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def test_api_endpoint(self, method, endpoint, expected_status=200, data=None, description="", headers=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        if self.token:
            request_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            request_headers.update(headers)

        test_name = f"{method} {endpoint}" + (f" ({description})" if description else "")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=10)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500], "status_code": response.status_code}

            if success:
                self.log_result(test_name, True, f"Status: {response.status_code}", response_data)
                return True, response_data
            else:
                self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", response_data)
                return False, response_data

        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
            return False, {}

    def setup_test_data(self):
        """Setup test data - create buyer and seller users, and a buy request"""
        print("\n🔧 Setting up test data...")
        
        # Create buyer user
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        buyer_email = f"buyer_{timestamp}@example.com"
        
        buyer_data = {
            "email": buyer_email,
            "password": "TestPass123!",
            "full_name": "Test Buyer",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        success, data = self.test_api_endpoint('POST', '/auth/register', 200, buyer_data, "Register buyer")
        if not success:
            return False
        
        # Login buyer
        login_data = {
            "email": buyer_email,
            "password": "TestPass123!"
        }
        
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Login buyer")
        if success and 'access_token' in login_response:
            self.token = login_response['access_token']
            print(f"   ✅ Buyer authenticated: {login_response.get('user', {}).get('full_name', 'Unknown')}")
        else:
            return False
        
        # Create seller user
        seller_email = f"seller_{timestamp}@example.com"
        
        seller_data = {
            "email": seller_email,
            "password": "TestPass123!",
            "full_name": "Test Seller",
            "phone": "+27123456788",
            "role": "seller"
        }
        
        success, data = self.test_api_endpoint('POST', '/auth/register', 200, seller_data, "Register seller")
        if not success:
            return False
        
        # Login seller
        seller_login_data = {
            "email": seller_email,
            "password": "TestPass123!"
        }
        
        success, seller_login_response = self.test_api_endpoint('POST', '/auth/login', 200, seller_login_data, "Login seller")
        if success and 'access_token' in seller_login_response:
            self.seller_token = seller_login_response['access_token']
            print(f"   ✅ Seller authenticated: {seller_login_response.get('user', {}).get('full_name', 'Unknown')}")
        else:
            return False
        
        # Get species and product types for buy request creation
        success, species_data = self.test_api_endpoint('GET', '/species', 200, description="Get species for buy request")
        if not success or not species_data:
            return False
        
        success, product_types_data = self.test_api_endpoint('GET', '/product-types', 200, description="Get product types for buy request")
        if not success or not product_types_data:
            return False
        
        # Find cattle species and market-ready product type
        cattle_species = next((s for s in species_data if 'cattle' in s.get('name', '').lower()), None)
        market_ready_pt = next((pt for pt in product_types_data if pt.get('code') == 'MARKET_READY'), None)
        
        if not cattle_species or not market_ready_pt:
            print("   ❌ Cannot find cattle species or market-ready product type")
            return False
        
        # Create a buy request with proper timezone using correct data structure
        buy_request_data = {
            "species": cattle_species['name'],  # Use name, not ID
            "product_type": market_ready_pt['code'],  # Use code, not ID
            "qty": 50,
            "unit": "head",
            "target_price": 15000.00,
            "breed": "Angus",
            "province": "Gauteng",
            "country": "ZA",
            "expires_at": "2025-12-31T23:59:59Z",
            "notes": "Looking to purchase quality cattle for farming operations. Health certificates required."
        }
        
        success, buy_request_response = self.test_api_endpoint('POST', '/buy-requests', 200, buy_request_data, "Create test buy request")
        if success and 'id' in buy_request_response:
            self.test_buy_request_id = buy_request_response['id']
            print(f"   ✅ Created test buy request with ID: {self.test_buy_request_id}")
            return True
        
        return False

    def test_public_buy_requests_list(self):
        """Test GET /api/public/buy-requests - Verify still working"""
        print("\n🔍 Testing Public Buy Requests List Endpoint...")
        
        # Test basic list without authentication
        old_token = self.token
        self.token = None  # Test as guest
        
        try:
            # Test basic list
            success, data = self.test_api_endpoint('GET', '/public/buy-requests', 200, description="Get public buy requests (guest)")
            
            if success:
                requests_list = data if isinstance(data, list) else []
                print(f"   ✅ Found {len(requests_list)} public buy requests")
                
                # Test with filters
                success, filtered_data = self.test_api_endpoint('GET', '/public/buy-requests?species=cattle', 200, description="Filter by species=cattle")
                if success:
                    filtered_list = filtered_data if isinstance(filtered_data, list) else []
                    print(f"   ✅ Cattle filter returned {len(filtered_list)} requests")
                
                # Test with province filter
                success, province_data = self.test_api_endpoint('GET', '/public/buy-requests?province=Gauteng', 200, description="Filter by province=Gauteng")
                if success:
                    province_list = province_data if isinstance(province_data, list) else []
                    print(f"   ✅ Gauteng filter returned {len(province_list)} requests")
                
                # Test sorting
                success, sorted_data = self.test_api_endpoint('GET', '/public/buy-requests?sort=newest', 200, description="Sort by newest")
                if success:
                    print(f"   ✅ Newest sort working")
                
                return True
            
        finally:
            self.token = old_token  # Restore token
        
        return False

    def test_public_buy_request_detail_timezone_fix(self):
        """Test GET /api/public/buy-requests/{request_id} - CRITICAL TIMEZONE BUG FIX"""
        print("\n🎯 Testing Public Buy Request Detail - TIMEZONE BUG FIX...")
        
        if not self.test_buy_request_id:
            print("   ❌ No test buy request ID available")
            return False
        
        # Test as guest (no authentication)
        old_token = self.token
        self.token = None
        
        try:
            # This endpoint was returning 500 due to timezone comparison bug
            success, data = self.test_api_endpoint('GET', f'/public/buy-requests/{self.test_buy_request_id}', 200, 
                                                 description="Get buy request details (TIMEZONE FIX TEST)")
            
            if success:
                print("   ✅ TIMEZONE BUG FIXED! - No more 500 errors")
                print(f"   ✅ Request details loaded: {data.get('title', 'Unknown')}")
                
                # Verify the response contains expected fields
                expected_fields = ['id', 'title', 'description', 'quantity', 'target_price', 'location']
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    print("   ✅ All expected fields present in response")
                else:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                
                return True
            else:
                print("   ❌ TIMEZONE BUG NOT FIXED - Still getting errors")
                return False
                
        finally:
            self.token = old_token
        
        return False

    def test_offer_creation_field_fix(self):
        """Test POST /api/buy-requests/{request_id}/offers - CRITICAL FIELD NAME FIX"""
        print("\n🎯 Testing Offer Creation - FIELD NAME FIX...")
        
        if not self.test_buy_request_id or not self.seller_token:
            print("   ❌ Missing test buy request ID or seller token")
            return False
        
        # Switch to seller token
        old_token = self.token
        self.token = self.seller_token
        
        try:
            # Test with the correct field names (after fix)
            offer_data = {
                "offer_price": 16000.00,  # This should be the correct field name after fix
                "qty": 25,  # Use qty, not quantity
                "message": "High quality Angus cattle available. Health certificates included.",
                "listing_id": None  # Optional field
            }
            
            success, response = self.test_api_endpoint('POST', f'/buy-requests/{self.test_buy_request_id}/offers', 200, 
                                                    offer_data, "Create offer with correct field names (FIELD FIX TEST)")
            
            if success:
                print("   ✅ FIELD NAME BUG FIXED! - Offer created successfully")
                print(f"   ✅ Offer ID: {response.get('id', 'Unknown')}")
                
                # Verify the offer was created with correct data
                if 'offer_price' in str(response) or response.get('price') == offer_data['offer_price']:
                    print("   ✅ Offer price correctly processed")
                
                return True
            else:
                print("   ❌ FIELD NAME BUG NOT FIXED - Still having field validation issues")
                
                # Try with alternative field name to see if it's still expecting the old name
                alt_offer_data = {
                    "unit_price_minor": 16000.00,  # Old field name
                    "qty": 25,
                    "message": "Testing with old field name"
                }
                
                success_alt, response_alt = self.test_api_endpoint('POST', f'/buy-requests/{self.test_buy_request_id}/offers', 200, 
                                                                alt_offer_data, "Try with old field name (unit_price_minor)")
                
                if success_alt:
                    print("   ⚠️  Old field name still works - fix may not be complete")
                else:
                    print("   ❌ Neither field name works - endpoint has issues")
                
                return False
                
        finally:
            self.token = old_token
        
        return False

    def test_guest_authentication_security(self):
        """Test that guest users are properly blocked from sending offers"""
        print("\n🔒 Testing Guest Authentication Security...")
        
        if not self.test_buy_request_id:
            print("   ❌ No test buy request ID available")
            return False
        
        # Test as guest (no authentication)
        old_token = self.token
        self.token = None
        
        try:
            offer_data = {
                "offer_price": 16000.00,
                "qty": 25,
                "message": "Guest attempt to create offer"
            }
            
            # This should return 401 (Unauthorized)
            success, response = self.test_api_endpoint('POST', f'/buy-requests/{self.test_buy_request_id}/offers', 401, 
                                                    offer_data, "Guest user blocked from creating offers (401 expected)")
            
            if success:
                print("   ✅ Security working - Guest users properly blocked (401)")
                return True
            else:
                print("   ❌ Security issue - Guest users not properly blocked")
                return False
                
        finally:
            self.token = old_token
        
        return False

    def test_invalid_request_handling(self):
        """Test handling of invalid request IDs"""
        print("\n🔍 Testing Invalid Request ID Handling...")
        
        # Test with non-existent request ID
        fake_id = "non-existent-request-id-12345"
        
        old_token = self.token
        self.token = None  # Test as guest
        
        try:
            # Should return 404 for non-existent request
            success, response = self.test_api_endpoint('GET', f'/public/buy-requests/{fake_id}', 404, 
                                                     description="Non-existent request ID (404 expected)")
            
            if success:
                print("   ✅ Invalid request handling working - Returns 404 for non-existent requests")
                return True
            else:
                print("   ❌ Invalid request handling issue - Not returning proper 404")
                return False
                
        finally:
            self.token = old_token
        
        return False

    def run_focused_fix_test(self):
        """Run focused test for the 2 critical bug fixes"""
        print("🎯 FOCUSED PUBLIC BUY REQUESTS API FIX VALIDATION")
        print("=" * 60)
        print("Testing the 2 critical fixes:")
        print("1. GET /api/public/buy-requests/{id} - Timezone bug fix")
        print("2. POST /api/buy-requests/{id}/offers - Field name fix")
        print("=" * 60)
        
        # Setup test data
        setup_success = self.setup_test_data()
        if not setup_success:
            print("❌ Failed to setup test data - cannot proceed with fix validation")
            return False
        
        # Test 1: Public buy requests list (verify still working)
        list_success = self.test_public_buy_requests_list()
        
        # Test 2: CRITICAL - Timezone bug fix
        timezone_fix_success = self.test_public_buy_request_detail_timezone_fix()
        
        # Test 3: CRITICAL - Field name fix
        field_fix_success = self.test_offer_creation_field_fix()
        
        # Test 4: Security verification
        security_success = self.test_guest_authentication_security()
        
        # Test 5: Invalid request handling
        invalid_handling_success = self.test_invalid_request_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 FIX VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Critical fixes analysis
        print(f"\n🎯 CRITICAL FIXES VALIDATION:")
        
        if timezone_fix_success:
            print("   ✅ TIMEZONE BUG FIXED - GET /api/public/buy-requests/{id} no longer returns 500")
        else:
            print("   ❌ TIMEZONE BUG NOT FIXED - Still getting 500 errors")
        
        if field_fix_success:
            print("   ✅ FIELD NAME BUG FIXED - POST offers endpoint accepts correct field names")
        else:
            print("   ❌ FIELD NAME BUG NOT FIXED - Still having field validation issues")
        
        if list_success:
            print("   ✅ PUBLIC LIST ENDPOINT - Still working correctly with filters")
        else:
            print("   ❌ PUBLIC LIST ENDPOINT - Having issues")
        
        # Overall assessment
        critical_fixes_working = timezone_fix_success and field_fix_success
        
        print(f"\n🏆 OVERALL ASSESSMENT:")
        if critical_fixes_working:
            print("   ✅ BOTH CRITICAL FIXES WORKING - Public API ready for frontend integration")
        else:
            print("   ❌ CRITICAL FIXES INCOMPLETE - Public API not ready for production")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return critical_fixes_working

def main():
    """Main test function"""
    tester = PublicBuyRequestsFixTester()
    success = tester.run_focused_fix_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())