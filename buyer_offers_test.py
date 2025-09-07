#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import time

class BuyerOffersWorkflowTester:
    def __init__(self, base_url="https://easy-signin-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.buyer_token = None
        self.seller_token = None
        self.buyer_user = None
        self.seller_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_request_id = None
        self.created_offer_id = None

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None and isinstance(response_data, dict):
            # Only show relevant parts of response
            if 'items' in response_data:
                print(f"   Response: {len(response_data['items'])} items found")
            elif 'message' in response_data:
                print(f"   Message: {response_data['message']}")
            elif 'success' in response_data:
                print(f"   Success: {response_data['success']}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}

            success = response.status_code == expected_status
            return success, response_data, response.status_code

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def setup_test_users(self):
        """Create buyer and seller test users"""
        print("\n🔍 Setting up test users...")
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create buyer user
        buyer_data = {
            "email": f"buyer_{timestamp}@example.com",
            "password": "TestPass123!",
            "full_name": "Test Buyer",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        success, response, status = self.make_request('POST', '/auth/register', buyer_data, expected_status=200)
        if not success:
            self.log_result("Create buyer user", False, f"Status: {status}")
            return False
        
        # Login buyer
        login_data = {"email": buyer_data["email"], "password": buyer_data["password"]}
        success, response, status = self.make_request('POST', '/auth/login', login_data, expected_status=200)
        if success and 'access_token' in response:
            self.buyer_token = response['access_token']
            self.buyer_user = response.get('user', {})
            self.log_result("Buyer authentication", True, f"Buyer ID: {self.buyer_user.get('id')}")
        else:
            self.log_result("Buyer authentication", False, f"Status: {status}")
            return False
        
        # Create seller user
        seller_data = {
            "email": f"seller_{timestamp}@example.com",
            "password": "TestPass123!",
            "full_name": "Test Seller",
            "phone": "+27123456790",
            "role": "seller"
        }
        
        success, response, status = self.make_request('POST', '/auth/register', seller_data, expected_status=200)
        if not success:
            self.log_result("Create seller user", False, f"Status: {status}")
            return False
        
        # Login seller
        login_data = {"email": seller_data["email"], "password": seller_data["password"]}
        success, response, status = self.make_request('POST', '/auth/login', login_data, expected_status=200)
        if success and 'access_token' in response:
            self.seller_token = response['access_token']
            self.seller_user = response.get('user', {})
            self.log_result("Seller authentication", True, f"Seller ID: {self.seller_user.get('id')}")
        else:
            self.log_result("Seller authentication", False, f"Status: {status}")
            return False
        
        return True

    def test_create_buy_request(self):
        """Test creating a buy request as buyer"""
        print("\n🔍 Testing buy request creation...")
        
        if not self.buyer_token:
            self.log_result("Create buy request", False, "No buyer token")
            return False
        
        # Create a realistic buy request
        request_data = {
            "species": "Cattle",
            "product_type": "Calves/Kids/Lambs", 
            "qty": 10,
            "unit": "head",
            "target_price": 5000.0,
            "breed": "Angus",
            "province": "Gauteng",
            "country": "ZA",
            "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
            "notes": "Looking for healthy young calves for breeding program",
            "weight_range": {"min": 150, "max": 200, "unit": "kg"},
            "age_requirements": {"min": 6, "max": 12, "unit": "months"},
            "vaccination_requirements": ["FMD", "Anthrax"],
            "delivery_preferences": "both",
            "inspection_allowed": True,
            "additional_requirements": "Must have health certificates"
        }
        
        success, response, status = self.make_request('POST', '/buy-requests', request_data, self.buyer_token, expected_status=200)
        
        if success and 'id' in response:
            self.created_request_id = response['id']
            self.log_result("Create buy request", True, f"Request ID: {self.created_request_id}")
            return True
        else:
            self.log_result("Create buy request", False, f"Status: {status}, Response: {response}")
            return False

    def test_create_offer(self):
        """Test creating an offer as seller"""
        print("\n🔍 Testing offer creation...")
        
        if not self.seller_token or not self.created_request_id:
            self.log_result("Create offer", False, "Missing seller token or request ID")
            return False
        
        # Create an offer on the buy request
        offer_data = {
            "offer_price": 4800.0,
            "qty": 10,
            "message": "High quality Angus calves available. All vaccinated and health certified."
        }
        
        success, response, status = self.make_request(
            'POST', 
            f'/buy-requests/{self.created_request_id}/offers', 
            offer_data, 
            self.seller_token, 
            expected_status=200
        )
        
        if success and 'offer_id' in response:
            self.created_offer_id = response['offer_id']
            self.log_result("Create offer", True, f"Offer ID: {self.created_offer_id}")
            return True
        else:
            self.log_result("Create offer", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_buyer_offers_endpoint(self):
        """Test GET /api/buyers/offers endpoint"""
        print("\n🔍 Testing GET /api/buyers/offers endpoint...")
        
        if not self.buyer_token:
            self.log_result("Get buyer offers", False, "No buyer token")
            return False
        
        # Test basic endpoint
        success, response, status = self.make_request('GET', '/buyers/offers', token=self.buyer_token, expected_status=200)
        
        if success:
            items = response.get('items', [])
            total = response.get('total', 0)
            self.log_result("Get buyer offers - basic", True, f"Found {len(items)} offers, total: {total}")
            
            # Verify offer structure if we have offers
            if items:
                offer = items[0]
                required_fields = ['id', 'request_id', 'seller_id', 'offer_price', 'qty', 'status']
                missing_fields = [field for field in required_fields if field not in offer]
                if missing_fields:
                    self.log_result("Offer structure validation", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Offer structure validation", True, "All required fields present")
        else:
            self.log_result("Get buyer offers - basic", False, f"Status: {status}, Response: {response}")
            return False
        
        # Test with status filter - pending
        success, response, status = self.make_request('GET', '/buyers/offers?status=pending', token=self.buyer_token, expected_status=200)
        if success:
            pending_items = response.get('items', [])
            self.log_result("Get buyer offers - pending filter", True, f"Found {len(pending_items)} pending offers")
        else:
            self.log_result("Get buyer offers - pending filter", False, f"Status: {status}")
        
        # Test with status filter - accepted
        success, response, status = self.make_request('GET', '/buyers/offers?status=accepted', token=self.buyer_token, expected_status=200)
        if success:
            accepted_items = response.get('items', [])
            self.log_result("Get buyer offers - accepted filter", True, f"Found {len(accepted_items)} accepted offers")
        else:
            self.log_result("Get buyer offers - accepted filter", False, f"Status: {status}")
        
        # Test with status filter - declined
        success, response, status = self.make_request('GET', '/buyers/offers?status=declined', token=self.buyer_token, expected_status=200)
        if success:
            declined_items = response.get('items', [])
            self.log_result("Get buyer offers - declined filter", True, f"Found {len(declined_items)} declined offers")
        else:
            self.log_result("Get buyer offers - declined filter", False, f"Status: {status}")
        
        return True

    def test_accept_offer_endpoint(self):
        """Test POST /api/buy-requests/{request_id}/offers/{offer_id}/accept"""
        print("\n🔍 Testing accept offer endpoint...")
        
        if not self.buyer_token or not self.created_request_id or not self.created_offer_id:
            self.log_result("Accept offer", False, "Missing required IDs or token")
            return False
        
        # Test accepting the offer
        success, response, status = self.make_request(
            'POST',
            f'/buy-requests/{self.created_request_id}/offers/{self.created_offer_id}/accept',
            {},
            self.buyer_token,
            expected_status=200
        )
        
        if success:
            success_flag = response.get('success', False)
            message = response.get('message', '')
            next_step = response.get('next_step', '')
            
            if success_flag:
                self.log_result("Accept offer", True, f"Message: {message}, Next step: {next_step}")
                
                # Verify offer status changed to accepted
                time.sleep(1)  # Brief delay for database update
                success, offers_response, _ = self.make_request('GET', '/buyers/offers?status=accepted', token=self.buyer_token)
                if success:
                    accepted_offers = offers_response.get('items', [])
                    accepted_offer = next((o for o in accepted_offers if o['id'] == self.created_offer_id), None)
                    if accepted_offer:
                        self.log_result("Verify offer status update", True, "Offer status updated to accepted")
                    else:
                        self.log_result("Verify offer status update", False, "Offer not found in accepted list")
                
                return True
            else:
                self.log_result("Accept offer", False, f"Success flag false: {message}")
                return False
        else:
            self.log_result("Accept offer", False, f"Status: {status}, Response: {response}")
            return False

    def test_decline_offer_endpoint(self):
        """Test POST /api/buy-requests/{request_id}/offers/{offer_id}/decline"""
        print("\n🔍 Testing decline offer endpoint...")
        
        if not self.buyer_token or not self.created_request_id:
            self.log_result("Decline offer setup", False, "Missing required data")
            return False
        
        # Create another offer to decline
        if not self.seller_token:
            self.log_result("Decline offer setup", False, "No seller token for creating test offer")
            return False
        
        offer_data = {
            "offer_price": 5200.0,
            "qty": 8,
            "message": "Premium quality calves with extended warranty"
        }
        
        success, response, status = self.make_request(
            'POST',
            f'/buy-requests/{self.created_request_id}/offers',
            offer_data,
            self.seller_token,
            expected_status=200
        )
        
        if not success or 'offer_id' not in response:
            self.log_result("Create offer for decline test", False, f"Status: {status}")
            return False
        
        decline_offer_id = response['offer_id']
        self.log_result("Create offer for decline test", True, f"Offer ID: {decline_offer_id}")
        
        # Now test declining the offer
        success, response, status = self.make_request(
            'POST',
            f'/buy-requests/{self.created_request_id}/offers/{decline_offer_id}/decline',
            {},
            self.buyer_token,
            expected_status=200
        )
        
        if success:
            success_flag = response.get('success', False)
            message = response.get('message', '')
            
            if success_flag:
                self.log_result("Decline offer", True, f"Message: {message}")
                
                # Verify offer status changed to declined
                time.sleep(1)  # Brief delay for database update
                success, offers_response, _ = self.make_request('GET', '/buyers/offers?status=declined', token=self.buyer_token)
                if success:
                    declined_offers = offers_response.get('items', [])
                    declined_offer = next((o for o in declined_offers if o['id'] == decline_offer_id), None)
                    if declined_offer:
                        self.log_result("Verify decline status update", True, "Offer status updated to declined")
                    else:
                        self.log_result("Verify decline status update", False, "Offer not found in declined list")
                
                return True
            else:
                self.log_result("Decline offer", False, f"Success flag false: {message}")
                return False
        else:
            self.log_result("Decline offer", False, f"Status: {status}, Response: {response}")
            return False

    def test_error_cases(self):
        """Test error cases for buyer offers workflow"""
        print("\n🔍 Testing error cases...")
        
        # Test unauthorized access
        success, response, status = self.make_request('GET', '/buyers/offers', expected_status=401)
        if status == 401:
            self.log_result("Unauthorized access to buyer offers", True, "Correctly returns 401")
        else:
            self.log_result("Unauthorized access to buyer offers", False, f"Expected 401, got {status}")
        
        if self.buyer_token and self.created_request_id:
            # Test accept non-existent offer
            success, response, status = self.make_request(
                'POST',
                f'/buy-requests/{self.created_request_id}/offers/non-existent-offer-id/accept',
                {},
                self.buyer_token,
                expected_status=404
            )
            if status == 404:
                self.log_result("Accept non-existent offer", True, "Correctly returns 404")
            else:
                self.log_result("Accept non-existent offer", False, f"Expected 404, got {status}")
            
            # Test decline non-existent offer
            success, response, status = self.make_request(
                'POST',
                f'/buy-requests/{self.created_request_id}/offers/non-existent-offer-id/decline',
                {},
                self.buyer_token,
                expected_status=404
            )
            if status == 404:
                self.log_result("Decline non-existent offer", True, "Correctly returns 404")
            else:
                self.log_result("Decline non-existent offer", False, f"Expected 404, got {status}")
            
            # Test accept offer on non-existent request
            if self.created_offer_id:
                success, response, status = self.make_request(
                    'POST',
                    f'/buy-requests/non-existent-request-id/offers/{self.created_offer_id}/accept',
                    {},
                    self.buyer_token,
                    expected_status=404
                )
                if status == 404:
                    self.log_result("Accept offer on non-existent request", True, "Correctly returns 404")
                else:
                    self.log_result("Accept offer on non-existent request", False, f"Expected 404, got {status}")

    def test_data_flow_validation(self):
        """Test that seller info and request details are included in buyer offers"""
        print("\n🔍 Testing data flow validation...")
        
        if not self.buyer_token:
            self.log_result("Data flow validation", False, "No buyer token")
            return False
        
        success, response, status = self.make_request('GET', '/buyers/offers', token=self.buyer_token, expected_status=200)
        
        if success:
            items = response.get('items', [])
            if items:
                offer = items[0]
                
                # Check for seller info
                seller_fields = ['seller_id']
                seller_info_present = all(field in offer for field in seller_fields)
                
                # Check for request details
                request_fields = ['request_id']
                request_info_present = all(field in offer for field in request_fields)
                
                if seller_info_present and request_info_present:
                    self.log_result("Data flow validation", True, "Seller info and request details included")
                    
                    # Additional validation - check if we can get detailed info
                    if 'seller_id' in offer and offer['seller_id']:
                        self.log_result("Seller ID validation", True, f"Seller ID: {offer['seller_id']}")
                    else:
                        self.log_result("Seller ID validation", False, "Seller ID missing or empty")
                    
                    if 'request_id' in offer and offer['request_id']:
                        self.log_result("Request ID validation", True, f"Request ID: {offer['request_id']}")
                    else:
                        self.log_result("Request ID validation", False, "Request ID missing or empty")
                    
                    return True
                else:
                    missing_seller = [f for f in seller_fields if f not in offer]
                    missing_request = [f for f in request_fields if f not in offer]
                    self.log_result("Data flow validation", False, f"Missing seller fields: {missing_seller}, request fields: {missing_request}")
                    return False
            else:
                self.log_result("Data flow validation", False, "No offers found to validate")
                return False
        else:
            self.log_result("Data flow validation", False, f"Status: {status}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive buyer offers workflow test"""
        print("🚀 Starting Buyer Offers Workflow Comprehensive Test")
        print("=" * 60)
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Failed to setup test users - aborting tests")
            return False
        
        # Test complete workflow
        print("\n📋 Testing Complete Buyer Offers Workflow:")
        
        # 1. Create buy request (buyer)
        if not self.test_create_buy_request():
            print("❌ Failed to create buy request - aborting workflow tests")
            return False
        
        # 2. Create offer (seller)
        if not self.test_create_offer():
            print("❌ Failed to create offer - aborting workflow tests")
            return False
        
        # 3. Test buyer offers endpoint
        self.test_get_buyer_offers_endpoint()
        
        # 4. Test accept offer
        self.test_accept_offer_endpoint()
        
        # 5. Test decline offer (with new offer)
        self.test_decline_offer_endpoint()
        
        # 6. Test data flow validation
        self.test_data_flow_validation()
        
        # 7. Test error cases
        self.test_error_cases()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 BUYER OFFERS WORKFLOW TEST SUMMARY")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # Workflow analysis
        print(f"\n🎯 BUYER OFFERS WORKFLOW ANALYSIS:")
        
        # Check core workflow components
        workflow_tests = {
            'buyer_auth': any('Buyer authentication' in r['test'] and r['success'] for r in self.test_results),
            'seller_auth': any('Seller authentication' in r['test'] and r['success'] for r in self.test_results),
            'create_request': any('Create buy request' in r['test'] and r['success'] for r in self.test_results),
            'create_offer': any('Create offer' in r['test'] and r['success'] for r in self.test_results),
            'get_offers': any('Get buyer offers - basic' in r['test'] and r['success'] for r in self.test_results),
            'accept_offer': any('Accept offer' in r['test'] and r['success'] for r in self.test_results),
            'decline_offer': any('Decline offer' in r['test'] and r['success'] for r in self.test_results)
        }
        
        for component, working in workflow_tests.items():
            status = "✅ Working" if working else "❌ Failed"
            print(f"   {component.replace('_', ' ').title()}: {status}")
        
        # Overall workflow assessment
        core_components = ['buyer_auth', 'create_request', 'create_offer', 'get_offers']
        core_working = all(workflow_tests[comp] for comp in core_components)
        
        if core_working:
            print(f"\n✅ CORE BUYER OFFERS WORKFLOW: FUNCTIONAL")
            print("   - Buyers can create requests")
            print("   - Sellers can create offers")
            print("   - Buyers can view their offers")
            if workflow_tests['accept_offer']:
                print("   - Buyers can accept offers")
            if workflow_tests['decline_offer']:
                print("   - Buyers can decline offers")
        else:
            print(f"\n❌ CORE BUYER OFFERS WORKFLOW: NOT FUNCTIONAL")
            failed_core = [comp for comp in core_components if not workflow_tests[comp]]
            print(f"   - Failed components: {', '.join(failed_core)}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test function"""
    tester = BuyerOffersWorkflowTester()
    success = tester.run_comprehensive_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())