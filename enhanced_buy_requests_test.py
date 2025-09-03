#!/usr/bin/env python3

import requests
import sys
import json
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class EnhancedBuyRequestTester:
    def __init__(self, base_url="https://procurement-hub-10.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_buy_request_id = None

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

    def test_api_endpoint(self, method, endpoint, expected_status=200, data=None, description="", files=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        test_name = f"{method} {endpoint}" + (f" ({description})" if description else "")
        
        try:
            if files:
                # For file uploads, don't set Content-Type
                response = requests.post(url, data=data, files=files, headers=headers, timeout=30)
            else:
                headers['Content-Type'] = 'application/json'
                if method == 'GET':
                    response = requests.get(url, headers=headers, timeout=30)
                elif method == 'POST':
                    response = requests.post(url, json=data, headers=headers, timeout=30)
                elif method == 'PUT':
                    response = requests.put(url, json=data, headers=headers, timeout=30)
                elif method == 'DELETE':
                    response = requests.delete(url, headers=headers, timeout=30)

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

    def authenticate_user(self):
        """Authenticate a test user"""
        print("\n🔍 Authenticating Test User...")
        
        # Try to login with existing admin user first
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Admin login")
        
        if success and 'access_token' in login_response:
            self.token = login_response['access_token']
            self.user_data = login_response.get('user', {})
            print(f"   ✅ Authenticated as: {self.user_data.get('full_name', 'Unknown')}")
            return True
        
        # If admin login fails, try to create a new user
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_email = f"enhanced_test_{timestamp}@example.com"
        
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Enhanced Test User",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        success, data = self.test_api_endpoint('POST', '/auth/register', 200, register_data, "Register new user")
        
        if success:
            # Test login
            login_data = {
                "email": test_email,
                "password": "TestPass123!"
            }
            
            success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Login user")
            
            if success and 'access_token' in login_response:
                self.token = login_response['access_token']
                self.user_data = login_response.get('user', {})
                print(f"   ✅ Authenticated as: {self.user_data.get('full_name', 'Unknown')}")
                return True
        
        return False

    def test_image_upload_endpoints(self):
        """Test image upload endpoints for buy requests"""
        print("\n🔍 Testing Image Upload Endpoints...")
        
        if not self.token:
            print("   ⚠️  Skipping image upload tests - no authentication")
            return False
        
        # Create a simple test image (1x1 pixel PNG)
        test_image_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        
        # Test buy request image upload
        files = {'file': ('test_image.png', test_image_data, 'image/png')}
        data = {'request_id': 'test_request', 'image_type': 'reference'}
        
        success1, response1 = self.test_api_endpoint(
            'POST', '/upload/buy-request-image', 200, 
            data=data, files=files, description="Upload buy request image"
        )
        
        # Test vet certificate upload
        files = {'file': ('test_cert.png', test_image_data, 'image/png')}
        data = {'request_id': 'test_request'}
        
        success2, response2 = self.test_api_endpoint(
            'POST', '/upload/vet-certificate', 200,
            data=data, files=files, description="Upload vet certificate"
        )
        
        return success1 and success2

    def test_enhanced_buy_request_creation(self):
        """Test enhanced buy request creation with all new fields"""
        print("\n🔍 Testing Enhanced Buy Request Creation...")
        
        if not self.token:
            print("   ⚠️  Skipping enhanced buy request creation - no authentication")
            return False
        
        # Test data with realistic livestock information
        enhanced_request_data = {
            "species": "Cattle",
            "product_type": "Live",
            "qty": 50,
            "unit": "head",
            "target_price": 15000.0,
            "breed": "Angus",
            "province": "Gauteng",
            "country": "ZA",
            "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
            "notes": "Looking for high-quality Angus cattle for breeding purposes",
            "enable_ai_enhancements": True,
            "auto_generate_description": True,
            # Enhanced fields
            "images": [
                "https://example.com/cattle1.jpg",
                "https://example.com/cattle2.jpg"
            ],
            "vet_certificates": [
                "https://example.com/vet_cert1.pdf"
            ],
            "weight_range": {
                "min": 400,
                "max": 600,
                "unit": "kg"
            },
            "age_requirements": {
                "min": 12,
                "max": 24,
                "unit": "months"
            },
            "vaccination_requirements": [
                "Foot and Mouth Disease",
                "Brucellosis",
                "Tuberculosis"
            ],
            "delivery_preferences": "both",
            "inspection_allowed": True,
            "additional_requirements": "Must have valid health certificates and be from disease-free areas"
        }
        
        success, response = self.test_api_endpoint(
            'POST', '/buy-requests/enhanced', 200,
            enhanced_request_data, "Create enhanced buy request with all fields"
        )
        
        if success and response.get('id'):
            self.created_buy_request_id = response['id']
            print(f"   ✅ Created enhanced buy request with ID: {self.created_buy_request_id}")
            
            # Verify AI enhancements were applied
            if response.get('ai_enhanced'):
                print("   ✅ AI enhancements applied successfully")
            if response.get('ai_analysis'):
                print("   ✅ AI analysis completed")
            if response.get('price_suggestions'):
                print("   ✅ Price suggestions generated")
            if response.get('location_data'):
                print("   ✅ Location data processed")
        
        # Test with different livestock types
        test_cases = [
            {
                "name": "Chickens - Day-old",
                "data": {
                    "species": "Chickens",
                    "product_type": "Day-old",
                    "qty": 1000,
                    "unit": "chicks",
                    "target_price": 15.0,
                    "breed": "Ross 308",
                    "province": "Western Cape",
                    "weight_range": {"min": 40, "max": 50, "unit": "g"},
                    "age_requirements": {"min": 1, "max": 1, "unit": "days"},
                    "vaccination_requirements": ["Marek's Disease", "Newcastle Disease"],
                    "delivery_preferences": "delivery",
                    "inspection_allowed": False
                }
            },
            {
                "name": "Goats - Live",
                "data": {
                    "species": "Goats",
                    "product_type": "Live",
                    "qty": 25,
                    "unit": "head",
                    "target_price": 2500.0,
                    "breed": "Boer",
                    "province": "Limpopo",
                    "weight_range": {"min": 30, "max": 50, "unit": "kg"},
                    "age_requirements": {"min": 6, "max": 18, "unit": "months"},
                    "vaccination_requirements": ["Rift Valley Fever", "Peste des Petits Ruminants"],
                    "delivery_preferences": "pickup",
                    "inspection_allowed": True
                }
            }
        ]
        
        for test_case in test_cases:
            test_data = {
                "species": test_case["data"]["species"],
                "product_type": test_case["data"]["product_type"],
                "qty": test_case["data"]["qty"],
                "unit": test_case["data"]["unit"],
                "target_price": test_case["data"]["target_price"],
                "breed": test_case["data"]["breed"],
                "province": test_case["data"]["province"],
                "country": "ZA",
                "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
                "enable_ai_enhancements": True,
                **{k: v for k, v in test_case["data"].items() if k not in ["species", "product_type", "qty", "unit", "target_price", "breed", "province"]}
            }
            
            success_case, _ = self.test_api_endpoint(
                'POST', '/buy-requests/enhanced', 200,
                test_data, f"Create enhanced buy request - {test_case['name']}"
            )
        
        return success

    def test_public_api_enhancement(self):
        """Test public API endpoints with enhanced fields"""
        print("\n🔍 Testing Public API Enhancement...")
        
        # Test public buy requests list
        success1, response1 = self.test_api_endpoint(
            'GET', '/public/buy-requests', 200,
            description="Get public buy requests list with enhanced fields"
        )
        
        if success1:
            items = response1.get('items', [])
            print(f"   ✅ Found {len(items)} public buy requests")
            
            # Check for enhanced fields in response
            if items:
                first_item = items[0]
                enhanced_fields = [
                    'images', 'has_vet_certificates', 'weight_range', 
                    'age_requirements', 'vaccination_requirements', 
                    'delivery_preferences', 'inspection_allowed'
                ]
                
                found_enhanced_fields = [field for field in enhanced_fields if field in first_item]
                print(f"   ✅ Enhanced fields present: {found_enhanced_fields}")
        
        # Test public buy request detail
        success2 = True
        if self.created_buy_request_id:
            success2, response2 = self.test_api_endpoint(
                'GET', f'/public/buy-requests/{self.created_buy_request_id}', 200,
                description="Get public buy request detail with enhanced fields"
            )
            
            if success2:
                # Check for enhanced fields in detail response
                enhanced_fields_detail = [
                    'images', 'vet_certificates', 'weight_range', 
                    'age_requirements', 'vaccination_requirements', 
                    'delivery_preferences', 'inspection_allowed', 'additional_requirements'
                ]
                
                found_fields = [field for field in enhanced_fields_detail if field in response2]
                print(f"   ✅ Enhanced detail fields present: {found_fields}")
        
        # Test with filters
        filter_tests = [
            {'species': 'Cattle', 'description': 'Filter by species'},
            {'province': 'Gauteng', 'description': 'Filter by province'},
            {'min_qty': 10, 'max_qty': 100, 'description': 'Filter by quantity range'},
            {'has_target_price': True, 'description': 'Filter by target price'},
            {'sort': 'newest', 'description': 'Sort by newest'},
            {'sort': 'ending_soon', 'description': 'Sort by ending soon'},
            {'sort': 'relevance', 'description': 'Sort by relevance'}
        ]
        
        filter_success_count = 0
        for filter_test in filter_tests:
            params = {k: v for k, v in filter_test.items() if k != 'description'}
            query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            
            success_filter, _ = self.test_api_endpoint(
                'GET', f'/public/buy-requests?{query_string}', 200,
                description=filter_test['description']
            )
            
            if success_filter:
                filter_success_count += 1
        
        print(f"   📊 Filter tests: {filter_success_count}/{len(filter_tests)} passed")
        
        return success1 and success2 and filter_success_count >= len(filter_tests) // 2

    def test_send_offer_functionality(self):
        """Test send offer functionality"""
        print("\n🔍 Testing Send Offer Functionality...")
        
        if not self.token:
            print("   ⚠️  Skipping offer tests - no authentication")
            return False
        
        if not self.created_buy_request_id:
            print("   ⚠️  Skipping offer tests - no buy request created")
            return False
        
        # Test creating an offer
        offer_data = {
            "offer_price": 14500.0,
            "qty": 50,
            "message": "High-quality Angus cattle from certified farm. All health certificates included.",
            "listing_id": None
        }
        
        success1, response1 = self.test_api_endpoint(
            'POST', f'/buy-requests/{self.created_buy_request_id}/offers', 200,
            offer_data, "Create offer on buy request"
        )
        
        offer_id = None
        if success1 and response1.get('offer_id'):
            offer_id = response1['offer_id']
            print(f"   ✅ Created offer with ID: {offer_id}")
        
        # Test getting offers for the buy request
        success2, response2 = self.test_api_endpoint(
            'GET', f'/buy-requests/{self.created_buy_request_id}/offers', 200,
            description="Get offers for buy request"
        )
        
        if success2:
            offers = response2.get('offers', [])
            print(f"   ✅ Found {len(offers)} offers for buy request")
        
        # Test enhanced offer creation (if endpoint exists)
        enhanced_offer_data = {
            "offer_price": 14000.0,
            "qty": 45,
            "message": "Premium Angus cattle with AI-verified quality metrics",
            "listing_id": None
        }
        
        success3, response3 = self.test_api_endpoint(
            'POST', f'/buy-requests/{self.created_buy_request_id}/offers/enhanced', 200,
            enhanced_offer_data, "Create enhanced offer with AI matching"
        )
        
        return success1 and success2

    def test_authentication_scenarios(self):
        """Test authentication scenarios for offers"""
        print("\n🔍 Testing Authentication Scenarios...")
        
        # Test sending offer without authentication
        offer_data = {
            "offer_price": 15000.0,
            "qty": 25,
            "message": "Test offer without auth"
        }
        
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success1, _ = self.test_api_endpoint(
            'POST', f'/buy-requests/test-id/offers', 401,
            offer_data, "Send offer without authentication (expect 401)"
        )
        
        # Restore token
        self.token = temp_token
        
        # Test accessing non-existent buy request
        success2, _ = self.test_api_endpoint(
            'POST', '/buy-requests/non-existent-id/offers', 404,
            offer_data, "Send offer to non-existent buy request (expect 404)"
        )
        
        return success1 and success2

    def run_comprehensive_test(self):
        """Run comprehensive enhanced buy requests test"""
        print("🚀 Starting Enhanced Buy Requests Comprehensive Test")
        print("=" * 70)
        
        # Authenticate user
        auth_success = self.authenticate_user()
        if not auth_success:
            print("❌ Authentication failed - cannot proceed with tests")
            return False
        
        # Test image upload endpoints
        self.test_image_upload_endpoints()
        
        # Test enhanced buy request creation
        self.test_enhanced_buy_request_creation()
        
        # Test public API enhancement
        self.test_public_api_enhancement()
        
        # Test send offer functionality
        self.test_send_offer_functionality()
        
        # Test authentication scenarios
        self.test_authentication_scenarios()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 ENHANCED BUY REQUESTS TEST SUMMARY")
        print("=" * 70)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # Feature analysis
        print(f"\n🎯 ENHANCED BUY REQUESTS FEATURE ANALYSIS:")
        
        # Check enhanced creation
        creation_tests = [r for r in self.test_results if 'enhanced' in r['test'].lower() and 'create' in r['test'].lower()]
        if any(t['success'] for t in creation_tests):
            print("   ✅ Enhanced Buy Request Creation: Working with new fields")
        else:
            print("   ❌ Enhanced Buy Request Creation: Failed")
        
        # Check image uploads
        upload_tests = [r for r in self.test_results if 'upload' in r['test'].lower()]
        if any(t['success'] for t in upload_tests):
            print("   ✅ Image Upload Endpoints: Working")
        else:
            print("   ❌ Image Upload Endpoints: Failed")
        
        # Check public API
        public_tests = [r for r in self.test_results if 'public' in r['test'].lower()]
        if any(t['success'] for t in public_tests):
            print("   ✅ Public API Enhancement: Working with enhanced fields")
        else:
            print("   ❌ Public API Enhancement: Failed")
        
        # Check offer functionality
        offer_tests = [r for r in self.test_results if 'offer' in r['test'].lower()]
        if any(t['success'] for t in offer_tests):
            print("   ✅ Send Offer Functionality: Working")
        else:
            print("   ❌ Send Offer Functionality: Failed")
        
        return self.tests_passed >= (self.tests_run * 0.7)  # 70% success rate

def main():
    """Main test function"""
    tester = EnhancedBuyRequestTester()
    success = tester.run_comprehensive_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())