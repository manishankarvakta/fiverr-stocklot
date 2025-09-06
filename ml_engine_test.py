#!/usr/bin/env python3

import requests
import sys
import json
import base64
from datetime import datetime
from typing import Dict, Any, List, Tuple

class MLEngineAPITester:
    def __init__(self, base_url="https://farm-admin.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.buyer_token = None
        self.seller_token = None
        self.buyer_data = None
        self.seller_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.buy_request_id = None
        self.offer_id = None

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
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

    def test_api_endpoint(self, method: str, endpoint: str, expected_status: int = 200, 
                         data: Dict = None, description: str = "", token: str = None) -> Tuple[bool, Dict]:
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use provided token or default to buyer token
        auth_token = token or self.buyer_token
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

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

    def setup_test_users(self) -> bool:
        """Create and authenticate test users (buyer and seller)"""
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
        
        success, response = self.test_api_endpoint('POST', '/auth/register', 200, buyer_data, "Register buyer")
        if not success:
            return False
            
        # Login buyer
        login_data = {"email": buyer_data["email"], "password": buyer_data["password"]}
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Login buyer")
        
        if success and 'access_token' in login_response:
            self.buyer_token = login_response['access_token']
            self.buyer_data = login_response.get('user', {})
            print(f"   ✅ Buyer authenticated: {self.buyer_data.get('full_name')}")
        else:
            return False
        
        # Create seller user
        seller_data = {
            "email": f"seller_{timestamp}@example.com",
            "password": "TestPass123!",
            "full_name": "Test Seller",
            "phone": "+27123456790",
            "role": "seller"
        }
        
        success, response = self.test_api_endpoint('POST', '/auth/register', 200, seller_data, "Register seller")
        if not success:
            return False
            
        # Login seller
        login_data = {"email": seller_data["email"], "password": seller_data["password"]}
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Login seller")
        
        if success and 'access_token' in login_response:
            self.seller_token = login_response['access_token']
            self.seller_data = login_response.get('user', {})
            print(f"   ✅ Seller authenticated: {self.seller_data.get('full_name')}")
            return True
        
        return False

    def test_enhanced_buy_requests(self) -> bool:
        """Test enhanced buy request system endpoints"""
        print("\n🔍 Testing Enhanced Buy Request System...")
        
        if not self.buyer_token:
            print("   ⚠️  No buyer token - skipping enhanced buy request tests")
            return False
        
        # Test POST /api/buy-requests/enhanced (create enhanced buy request)
        enhanced_request_data = {
            "title": "Premium Angus Cattle for Breeding",
            "description": "Looking for high-quality Angus cattle for breeding program",
            "species": "Cattle",
            "breed": "Angus",
            "quantity": 10,
            "unit": "head",
            "budget_min": 15000,
            "budget_max": 25000,
            "location": {
                "province": "Gauteng",
                "city": "Johannesburg",
                "coordinates": {"lat": -26.2041, "lng": 28.0473}
            },
            "requirements": {
                "age_min": 12,
                "age_max": 36,
                "health_certificates": True,
                "breeding_records": True
            },
            "ai_features": {
                "enable_smart_matching": True,
                "enable_price_suggestions": True,
                "enable_auto_description": True,
                "enable_market_analytics": True
            }
        }
        
        success, response = self.test_api_endpoint('POST', '/buy-requests/enhanced', 200, 
                                                 enhanced_request_data, "Create enhanced buy request", self.buyer_token)
        
        if success and 'id' in response:
            self.buy_request_id = response['id']
            print(f"   ✅ Created enhanced buy request: {self.buy_request_id}")
        
        # Test GET /api/buy-requests/price-suggestions (AI price suggestions)
        price_suggestion_params = {
            "species": "Cattle",
            "breed": "Angus", 
            "quantity": 10,
            "location": "Gauteng"
        }
        
        success, _ = self.test_api_endpoint('GET', '/buy-requests/price-suggestions', 200, 
                                         price_suggestion_params, "Get AI price suggestions", self.buyer_token)
        
        # Test POST /api/buy-requests/auto-description (auto-generate descriptions)
        auto_desc_data = {
            "species": "Cattle",
            "breed": "Angus",
            "purpose": "breeding",
            "quantity": 10,
            "requirements": ["health_certificates", "breeding_records"]
        }
        
        success, _ = self.test_api_endpoint('POST', '/buy-requests/auto-description', 200, 
                                         auto_desc_data, "Generate auto-description", self.buyer_token)
        
        # Test GET /api/buy-requests/market-analytics (market analytics)
        success, _ = self.test_api_endpoint('GET', '/buy-requests/market-analytics', 200, 
                                         description="Get market analytics", token=self.buyer_token)
        
        return True

    def test_enhanced_offers(self) -> bool:
        """Test enhanced offers system"""
        print("\n🔍 Testing Enhanced Offers System...")
        
        if not self.seller_token or not self.buy_request_id:
            print("   ⚠️  No seller token or buy request ID - skipping enhanced offers tests")
            return False
        
        # Test POST /api/buy-requests/{request_id}/enhanced-offers (create enhanced offer)
        enhanced_offer_data = {
            "price_per_unit": 20000,
            "quantity_available": 12,
            "delivery_options": {
                "delivery_available": True,
                "delivery_cost": 500,
                "delivery_timeframe": "2-3 weeks"
            },
            "animal_details": {
                "age_months": 24,
                "weight_kg": 450,
                "health_status": "Excellent",
                "breeding_history": "First-time breeders"
            },
            "certifications": {
                "health_certificate": True,
                "breeding_records": True,
                "vaccination_records": True
            },
            "ai_enhancements": {
                "compatibility_score": True,
                "market_comparison": True,
                "risk_assessment": True
            }
        }
        
        success, response = self.test_api_endpoint('POST', f'/buy-requests/{self.buy_request_id}/enhanced-offers', 200, 
                                                 enhanced_offer_data, "Create enhanced offer", self.seller_token)
        
        if success and 'id' in response:
            self.offer_id = response['id']
            print(f"   ✅ Created enhanced offer: {self.offer_id}")
        
        # Test GET /api/buy-requests/intelligent-matches (seller intelligent matching)
        success, _ = self.test_api_endpoint('GET', '/buy-requests/intelligent-matches', 200, 
                                         description="Get intelligent matches for seller", token=self.seller_token)
        
        return True

    def test_ml_engine_endpoints(self) -> bool:
        """Test NEW ML Engine API endpoints"""
        print("\n🔍 Testing NEW ML Engine Endpoints...")
        
        if not self.buyer_token:
            print("   ⚠️  No buyer token - skipping ML engine tests")
            return False
        
        # Test POST /api/ml/engine/smart-pricing (smart pricing analysis)
        smart_pricing_data = {
            "listing_data": {
                "species": "Cattle",
                "breed": "Angus",
                "age_months": 24,
                "weight_kg": 450,
                "location": "Gauteng",
                "quality_grade": "Premium"
            },
            "market_context": {
                "season": "Spring",
                "demand_level": "High",
                "supply_level": "Medium"
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/engine/smart-pricing', 200, 
                                         smart_pricing_data, "Smart pricing analysis", self.buyer_token)
        
        # Test POST /api/ml/engine/demand-forecast (demand forecasting)
        demand_forecast_data = {
            "species": "Cattle",
            "region": "Gauteng",
            "timeframe": "3_months",
            "factors": {
                "seasonal": True,
                "economic": True,
                "weather": True
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/engine/demand-forecast', 200, 
                                         demand_forecast_data, "Demand forecasting", self.buyer_token)
        
        # Test POST /api/ml/engine/market-intelligence (market intelligence analysis)
        market_intel_data = {
            "analysis_type": "comprehensive",
            "species": "Cattle",
            "region": "Gauteng",
            "timeframe": "6_months",
            "include_competitors": True,
            "include_trends": True
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/engine/market-intelligence', 200, 
                                         market_intel_data, "Market intelligence analysis", self.buyer_token)
        
        # Test POST /api/ml/engine/content-optimization (content optimization analysis)
        content_opt_data = {
            "content_type": "listing_description",
            "current_content": "High-quality Angus cattle for sale. Good breeding stock.",
            "target_audience": "commercial_breeders",
            "optimization_goals": ["engagement", "conversion", "seo"]
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/engine/content-optimization', 200, 
                                         content_opt_data, "Content optimization analysis", self.buyer_token)
        
        return True

    def test_photo_intelligence_endpoints(self) -> bool:
        """Test NEW Photo Intelligence API endpoints"""
        print("\n🔍 Testing NEW Photo Intelligence Endpoints...")
        
        if not self.buyer_token:
            print("   ⚠️  No buyer token - skipping photo intelligence tests")
            return False
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="
        
        # Test POST /api/ml/photo/analyze (single photo analysis)
        photo_analysis_data = {
            "image_data": test_image_base64,
            "image_format": "png",
            "analysis_type": "livestock_assessment",
            "species_hint": "cattle",
            "analysis_options": {
                "health_assessment": True,
                "breed_identification": True,
                "age_estimation": True,
                "weight_estimation": True,
                "quality_scoring": True
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/photo/analyze', 200, 
                                         photo_analysis_data, "Single photo analysis", self.buyer_token)
        
        # Test POST /api/ml/photo/bulk-analyze (bulk photo analysis)
        bulk_analysis_data = {
            "images": [
                {
                    "id": "img_1",
                    "image_data": test_image_base64,
                    "image_format": "png",
                    "species_hint": "cattle"
                },
                {
                    "id": "img_2", 
                    "image_data": test_image_base64,
                    "image_format": "png",
                    "species_hint": "cattle"
                }
            ],
            "analysis_options": {
                "health_assessment": True,
                "breed_identification": True,
                "comparative_analysis": True
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/photo/bulk-analyze', 200, 
                                         bulk_analysis_data, "Bulk photo analysis", self.buyer_token)
        
        return True

    def test_order_management_endpoints(self) -> bool:
        """Test order management and accept offer flow"""
        print("\n🔍 Testing Order Management Endpoints...")
        
        if not self.buyer_token or not self.offer_id:
            print("   ⚠️  No buyer token or offer ID - skipping order management tests")
            return False
        
        # Test POST /api/orders/accept-offer (accept offer flow)
        accept_offer_data = {
            "offer_id": self.offer_id,
            "quantity": 10,
            "delivery_address": {
                "street": "123 Farm Road",
                "city": "Johannesburg",
                "province": "Gauteng",
                "postal_code": "2000",
                "country": "South Africa"
            },
            "delivery_instructions": "Please call before delivery",
            "payment_method": "bank_transfer"
        }
        
        success, response = self.test_api_endpoint('POST', '/orders/accept-offer', 200, 
                                                 accept_offer_data, "Accept offer flow", self.buyer_token)
        
        order_group_id = None
        if success and 'order_group_id' in response:
            order_group_id = response['order_group_id']
            print(f"   ✅ Created order group: {order_group_id}")
        
        # Test POST /api/orders/refresh-price-lock (refresh price lock)
        if order_group_id:
            success, _ = self.test_api_endpoint('POST', '/orders/refresh-price-lock', 200, 
                                             {"order_group_id": order_group_id}, "Refresh price lock", self.buyer_token)
            
            # Test GET /api/orders/group/{group_id} (get order group)
            success, _ = self.test_api_endpoint('GET', f'/orders/group/{order_group_id}', 200, 
                                             description="Get order group", token=self.buyer_token)
        
        return True

    def test_dashboard_apis(self) -> bool:
        """Test buy request dashboard APIs"""
        print("\n🔍 Testing Dashboard APIs...")
        
        # Test buyer dashboard - GET /api/buy-requests/my-requests
        if self.buyer_token:
            success, _ = self.test_api_endpoint('GET', '/buy-requests/my-requests', 200, 
                                             description="Buyer dashboard - my requests", token=self.buyer_token)
        
        # Test seller dashboard - GET /api/buy-requests/seller-inbox
        if self.seller_token:
            success, _ = self.test_api_endpoint('GET', '/buy-requests/seller-inbox', 200, 
                                             description="Seller dashboard - inbox", token=self.seller_token)
            
            # Test GET /api/buy-requests/my-offers (seller offers)
            success, _ = self.test_api_endpoint('GET', '/buy-requests/my-offers', 200, 
                                             description="Seller dashboard - my offers", token=self.seller_token)
        
        return True

    def test_ml_services_endpoints(self) -> bool:
        """Test ML FAQ and ML matching service endpoints"""
        print("\n🔍 Testing ML Services Endpoints...")
        
        if not self.buyer_token:
            print("   ⚠️  No buyer token - skipping ML services tests")
            return False
        
        # Test ML FAQ endpoints
        faq_question_data = {
            "question": "What are the requirements for selling cattle?",
            "category": "selling",
            "user_context": {
                "user_type": "seller",
                "experience_level": "beginner"
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/faq/ask', 200, 
                                         faq_question_data, "ML FAQ question", self.buyer_token)
        
        # Test ML matching service
        matching_request_data = {
            "user_profile": {
                "location": "Gauteng",
                "preferences": ["cattle", "sheep"],
                "budget_range": [10000, 50000]
            },
            "request_criteria": {
                "species": "cattle",
                "quantity": 10,
                "urgency": "medium"
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/ml/matching/find-matches', 200, 
                                         matching_request_data, "ML matching service", self.buyer_token)
        
        return True

    def test_error_handling(self) -> bool:
        """Test error handling with invalid data"""
        print("\n🔍 Testing Error Handling...")
        
        # Test with invalid data
        invalid_data = {"invalid": "data"}
        
        # Test ML Engine with invalid data (should return 400)
        success, _ = self.test_api_endpoint('POST', '/ml/engine/smart-pricing', 400, 
                                         invalid_data, "Invalid smart pricing data", self.buyer_token)
        
        # Test Photo Intelligence with invalid data (should return 400)
        success, _ = self.test_api_endpoint('POST', '/ml/photo/analyze', 400, 
                                         invalid_data, "Invalid photo analysis data", self.buyer_token)
        
        # Test unauthorized access (should return 401)
        success, _ = self.test_api_endpoint('GET', '/buy-requests/my-requests', 401, 
                                         description="Unauthorized access test", token=None)
        
        return True

    def run_comprehensive_ml_test(self) -> bool:
        """Run comprehensive ML Engine and Photo Intelligence tests"""
        print("🚀 Starting ML Engine & Photo Intelligence Comprehensive Test")
        print("=" * 70)
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Failed to setup test users - aborting tests")
            return False
        
        # Run all ML Engine and Photo Intelligence tests
        print("\n🎯 TESTING ML ENGINE & PHOTO INTELLIGENCE FEATURES")
        print("-" * 50)
        
        # Test Enhanced Buy Request System
        self.test_enhanced_buy_requests()
        
        # Test Enhanced Offers
        self.test_enhanced_offers()
        
        # Test NEW ML Engine Endpoints
        self.test_ml_engine_endpoints()
        
        # Test NEW Photo Intelligence Endpoints  
        self.test_photo_intelligence_endpoints()
        
        # Test Order Management
        self.test_order_management_endpoints()
        
        # Test Dashboard APIs
        self.test_dashboard_apis()
        
        # Test ML Services
        self.test_ml_services_endpoints()
        
        # Test Error Handling
        self.test_error_handling()
        
        # Print comprehensive summary
        self.print_test_summary()
        
        return self.tests_passed == self.tests_run

    def print_test_summary(self):
        """Print detailed test summary"""
        print("\n" + "=" * 70)
        print("📊 ML ENGINE & PHOTO INTELLIGENCE TEST SUMMARY")
        print("=" * 70)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Categorize results
        categories = {
            'Enhanced Buy Requests': ['enhanced', 'buy-request'],
            'ML Engine': ['ml/engine'],
            'Photo Intelligence': ['ml/photo'],
            'Order Management': ['orders/', 'accept-offer'],
            'Dashboard APIs': ['dashboard', 'my-requests', 'seller-inbox'],
            'ML Services': ['ml/faq', 'ml/matching'],
            'Error Handling': ['invalid', 'unauthorized']
        }
        
        print(f"\n🎯 FEATURE CATEGORY ANALYSIS:")
        for category, keywords in categories.items():
            category_tests = [r for r in self.test_results 
                            if any(keyword in r['test'].lower() for keyword in keywords)]
            if category_tests:
                passed = sum(1 for t in category_tests if t['success'])
                total = len(category_tests)
                status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
                print(f"   {status} {category}: {passed}/{total} tests passed")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 ALL TESTS PASSED! ML Engine and Photo Intelligence systems are working correctly.")

def main():
    """Main test function"""
    tester = MLEngineAPITester()
    success = tester.run_comprehensive_ml_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())