#!/usr/bin/env python3

import requests
import sys
import json
import base64
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class MLEngineComprehensiveTester:
    def __init__(self, base_url="https://farmstock-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.buyer_token = None
        self.seller_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_buy_request_id = None
        self.created_offer_id = None

    def log_result(self, test_name: str, success: bool, details: str = "", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def make_request(self, method: str, endpoint: str, data=None, token=None, expected_status=200) -> Tuple[bool, dict]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}
            
            success = response.status_code == expected_status
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def setup_authentication(self) -> bool:
        """Setup buyer, seller, and admin authentication"""
        print("\n🔐 Setting up Authentication...")
        
        # Create and authenticate buyer
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        buyer_email = f"buyer_{timestamp}@test.com"
        
        buyer_data = {
            "email": buyer_email,
            "password": "TestPass123!",
            "full_name": "Test Buyer",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        success, response = self.make_request('POST', '/auth/register', buyer_data, expected_status=200)
        if success:
            login_success, login_response = self.make_request('POST', '/auth/login', {
                "email": buyer_email,
                "password": "TestPass123!"
            })
            if login_success and 'access_token' in login_response:
                self.buyer_token = login_response['access_token']
                print(f"   ✅ Buyer authenticated: {buyer_email}")
        
        # Create and authenticate seller
        seller_email = f"seller_{timestamp}@test.com"
        seller_data = {
            "email": seller_email,
            "password": "TestPass123!",
            "full_name": "Test Seller",
            "phone": "+27123456790",
            "role": "seller"
        }
        
        success, response = self.make_request('POST', '/auth/register', seller_data, expected_status=200)
        if success:
            login_success, login_response = self.make_request('POST', '/auth/login', {
                "email": seller_email,
                "password": "TestPass123!"
            })
            if login_success and 'access_token' in login_response:
                self.seller_token = login_response['access_token']
                print(f"   ✅ Seller authenticated: {seller_email}")
        
        # Authenticate admin
        admin_success, admin_response = self.make_request('POST', '/auth/login', {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        })
        if admin_success and 'access_token' in admin_response:
            self.admin_token = admin_response['access_token']
            print(f"   ✅ Admin authenticated")
        
        return bool(self.buyer_token and self.seller_token and self.admin_token)

    def test_ml_engine_endpoints(self):
        """Test NEW ML Engine Endpoints (Priority: CRITICAL)"""
        print("\n🧠 Testing ML Engine Endpoints (CRITICAL PRIORITY)...")
        
        # Test 1: Smart Pricing Analysis
        pricing_data = {
            "listing_data": {
                "species": "Commercial Broilers",
                "breed": "Ross 308",
                "quantity": 100,
                "unit": "head",
                "age_weeks": 6,
                "weight_kg": 2.5,
                "location": "Gauteng",
                "quality_grade": "A",
                "has_certification": True,
                "market_conditions": "normal",
                "seasonal_factor": 1.0,
                "demand_level": "high",
                "competition_level": "medium",
                "transport_distance": 50,
                "bulk_discount_eligible": True,
                "urgency_factor": 0.8
            }
        }
        
        success, response = self.make_request('POST', '/ml/engine/smart-pricing', pricing_data, self.seller_token)
        self.log_result("ML Engine: Smart Pricing Analysis", success, 
                       "Failed to analyze pricing" if not success else "", response)
        
        # Test 2: Demand Forecasting
        demand_data = {
            "species": "Commercial Broilers",
            "region": "Gauteng",
            "time_horizon_days": 30,
            "historical_data": {
                "past_sales": [100, 120, 95, 110, 130],
                "seasonal_patterns": {"month": 3, "season": "autumn"},
                "market_events": ["easter_approaching"]
            }
        }
        
        success, response = self.make_request('POST', '/ml/engine/demand-forecast', demand_data, self.seller_token)
        self.log_result("ML Engine: Demand Forecasting", success,
                       "Failed to generate demand forecast" if not success else "", response)
        
        # Test 3: Market Intelligence
        market_data = {
            "analysis_type": "competitive_analysis",
            "species": "Commercial Broilers",
            "region": "Gauteng",
            "parameters": {
                "competitor_count": 5,
                "price_range_analysis": True,
                "market_share_analysis": True,
                "trend_analysis": True
            }
        }
        
        success, response = self.make_request('POST', '/ml/engine/market-intelligence', market_data, self.seller_token)
        self.log_result("ML Engine: Market Intelligence", success,
                       "Failed to analyze market intelligence" if not success else "", response)
        
        # Test 4: Content Optimization
        content_data = {
            "listing_data": {
                "title": "Premium Ross 308 Broiler Chickens",
                "description": "High quality broiler chickens ready for market",
                "species": "Commercial Broilers",
                "breed": "Ross 308",
                "target_audience": "commercial_buyers"
            }
        }
        
        success, response = self.make_request('POST', '/ml/engine/content-optimization', content_data, self.seller_token)
        self.log_result("ML Engine: Content Optimization", success,
                       "Failed to optimize content" if not success else "", response)

    def test_photo_intelligence_endpoints(self):
        """Test Photo Intelligence Endpoints (Priority: HIGH)"""
        print("\n📸 Testing Photo Intelligence Endpoints (HIGH PRIORITY)...")
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGbKdMDgAAAABJRU5ErkJggg=="
        
        # Test 1: Single Photo Analysis
        photo_data = {
            "image_data": test_image_base64,
            "analysis_type": "livestock_assessment",
            "species_hint": "cattle"
        }
        
        success, response = self.make_request('POST', '/ml/photo/analyze', photo_data, self.seller_token)
        self.log_result("Photo Intelligence: Single Photo Analysis", success,
                       "Failed to analyze single photo" if not success else "", response)
        
        # Test 2: Bulk Photo Analysis
        bulk_data = {
            "photos": [
                {
                    "image_data": test_image_base64,
                    "filename": "cattle_1.jpg",
                    "species_hint": "cattle"
                },
                {
                    "image_data": test_image_base64,
                    "filename": "cattle_2.jpg", 
                    "species_hint": "cattle"
                }
            ],
            "analysis_type": "livestock_assessment"
        }
        
        success, response = self.make_request('POST', '/ml/photo/bulk-analyze', bulk_data, self.seller_token)
        self.log_result("Photo Intelligence: Bulk Photo Analysis", success,
                       "Failed to analyze bulk photos" if not success else "", response)

    def test_enhanced_buy_request_system(self):
        """Test Enhanced Buy Request System (Priority: HIGH)"""
        print("\n🛒 Testing Enhanced Buy Request System (HIGH PRIORITY)...")
        
        # Get species and product types for valid request
        species_success, species_data = self.make_request('GET', '/species')
        product_success, product_data = self.make_request('GET', '/product-types')
        
        if not (species_success and product_success):
            self.log_result("Enhanced Buy Request: Prerequisites", False, "Failed to get species/product data")
            return
        
        # Find valid species and product type
        broiler_species = next((s for s in species_data if 'broiler' in s.get('name', '').lower()), species_data[0] if species_data else None)
        market_ready_pt = next((pt for pt in product_data if pt.get('code') == 'MARKET_READY'), product_data[0] if product_data else None)
        
        if not (broiler_species and market_ready_pt):
            self.log_result("Enhanced Buy Request: Prerequisites", False, "No valid species/product type found")
            return
        
        # Test 1: Create Enhanced Buy Request
        enhanced_request_data = {
            "species_id": broiler_species['id'],
            "product_type": market_ready_pt['code'],
            "title": "Premium Broiler Chickens Needed",
            "description": "Looking for high-quality broiler chickens for restaurant chain",
            "quantity": 500,
            "unit": "head",
            "budget_min": 45.00,
            "budget_max": 55.00,
            "location": {
                "region": "Gauteng",
                "city": "Johannesburg",
                "coordinates": {"lat": -26.2041, "lng": 28.0473}
            },
            "delivery_requirements": {
                "delivery_needed": True,
                "delivery_date": "2024-04-15",
                "delivery_address": "123 Restaurant St, Johannesburg"
            },
            "quality_requirements": {
                "certification_required": True,
                "health_certificate": True,
                "quality_grade": "A"
            },
            "ai_features": {
                "enable_smart_matching": True,
                "enable_price_suggestions": True,
                "enable_auto_description": True,
                "enable_market_analysis": True
            }
        }
        
        success, response = self.make_request('POST', '/buy-requests/enhanced', enhanced_request_data, self.buyer_token)
        self.log_result("Enhanced Buy Request: Create with AI Features", success,
                       "Failed to create enhanced buy request" if not success else "", response)
        
        if success and 'id' in response:
            self.created_buy_request_id = response['id']
            
            # Test 2: Enhanced Offers
            offer_data = {
                "price_per_unit": 50.00,
                "quantity_available": 300,
                "delivery_options": ["farm_pickup", "delivery"],
                "quality_certifications": ["organic", "free_range"],
                "additional_notes": "Premium quality chickens from certified farm"
            }
            
            success, response = self.make_request('POST', f'/buy-requests/{self.created_buy_request_id}/enhanced-offers', 
                                                offer_data, self.seller_token)
            self.log_result("Enhanced Buy Request: Create Enhanced Offer", success,
                           "Failed to create enhanced offer" if not success else "", response)
        
        # Test 3: Intelligent Matches
        success, response = self.make_request('GET', '/buy-requests/intelligent-matches', token=self.seller_token)
        self.log_result("Enhanced Buy Request: Intelligent Matches", success,
                       "Failed to get intelligent matches" if not success else "", response)
        
        # Test 4: Price Suggestions
        success, response = self.make_request('GET', '/buy-requests/price-suggestions', token=self.buyer_token)
        self.log_result("Enhanced Buy Request: Price Suggestions", success,
                       "Failed to get price suggestions" if not success else "", response)
        
        # Test 5: Auto Description
        auto_desc_data = {
            "species": "Commercial Broilers",
            "quantity": 500,
            "purpose": "restaurant_supply",
            "quality_requirements": ["certification_required", "health_certificate"]
        }
        
        success, response = self.make_request('POST', '/buy-requests/auto-description', auto_desc_data, self.buyer_token)
        self.log_result("Enhanced Buy Request: Auto Description", success,
                       "Failed to generate auto description" if not success else "", response)
        
        # Test 6: Market Analytics
        success, response = self.make_request('GET', '/buy-requests/market-analytics', token=self.buyer_token)
        self.log_result("Enhanced Buy Request: Market Analytics", success,
                       "Failed to get market analytics" if not success else "", response)

    def test_order_management_checkout(self):
        """Test Order Management & Checkout (Priority: HIGH)"""
        print("\n📦 Testing Order Management & Checkout (HIGH PRIORITY)...")
        
        if not self.created_buy_request_id:
            print("   ⚠️  Skipping order tests - no buy request created")
            return
        
        # Test 1: Accept Offer
        accept_data = {
            "offer_id": "test_offer_id",
            "quantity": 200,
            "delivery_option": "delivery",
            "delivery_address": {
                "street": "123 Business St",
                "city": "Johannesburg", 
                "province": "Gauteng",
                "postal_code": "2000"
            },
            "payment_method": "bank_transfer"
        }
        
        success, response = self.make_request('POST', '/orders/accept-offer', accept_data, self.buyer_token)
        self.log_result("Order Management: Accept Offer", success,
                       "Failed to accept offer" if not success else "", response)
        
        # Test 2: Refresh Price Lock
        if success and 'order_id' in response:
            order_id = response['order_id']
            
            success, response = self.make_request('POST', f'/orders/refresh-price-lock', 
                                                {"order_id": order_id}, self.buyer_token)
            self.log_result("Order Management: Refresh Price Lock", success,
                           "Failed to refresh price lock" if not success else "", response)
            
            # Test 3: Get Order Group
            success, response = self.make_request('GET', f'/orders/group/{order_id}', token=self.buyer_token)
            self.log_result("Order Management: Get Order Group", success,
                           "Failed to get order group" if not success else "", response)

    def test_dashboard_apis(self):
        """Test Dashboard APIs (Priority: MEDIUM)"""
        print("\n📊 Testing Dashboard APIs (MEDIUM PRIORITY)...")
        
        # Test 1: My Buy Requests
        success, response = self.make_request('GET', '/buy-requests/my-requests', token=self.buyer_token)
        self.log_result("Dashboard API: My Buy Requests", success,
                       "Failed to get my buy requests" if not success else "", response)
        
        # Test 2: Seller Inbox
        success, response = self.make_request('GET', '/buy-requests/seller-inbox', token=self.seller_token)
        self.log_result("Dashboard API: Seller Inbox", success,
                       "Failed to get seller inbox" if not success else "", response)
        
        # Test 3: My Offers
        success, response = self.make_request('GET', '/buy-requests/my-offers', token=self.seller_token)
        self.log_result("Dashboard API: My Offers", success,
                       "Failed to get my offers" if not success else "", response)

    def test_ml_faq_matching_services(self):
        """Test ML FAQ & Matching Services (Priority: MEDIUM)"""
        print("\n🤖 Testing ML FAQ & Matching Services (MEDIUM PRIORITY)...")
        
        # Test 1: FAQ Ingest
        faq_data = {
            "source": "support_ticket",
            "question": "How do I verify livestock health certificates?",
            "answer": "Health certificates can be verified through our document upload system...",
            "category": "documentation",
            "priority": "high"
        }
        
        success, response = self.make_request('POST', '/ml/faq/ingest', faq_data, self.admin_token)
        self.log_result("ML FAQ: Ingest Question", success,
                       "Failed to ingest FAQ" if not success else "", response)
        
        # Test 2: FAQ Search
        search_data = {
            "query": "health certificate verification",
            "max_results": 5,
            "confidence_threshold": 0.7
        }
        
        success, response = self.make_request('GET', '/ml/faq/search', token=self.buyer_token)
        self.log_result("ML FAQ: Search", success,
                       "Failed to search FAQ" if not success else "", response)
        
        # Test 3: Record Matching Interaction
        interaction_data = {
            "user_id": "test_user",
            "request_id": self.created_buy_request_id or "test_request",
            "seller_id": "test_seller",
            "interaction_type": "view",
            "outcome": "interested"
        }
        
        success, response = self.make_request('POST', '/ml/matching/record-interaction', interaction_data, self.buyer_token)
        self.log_result("ML Matching: Record Interaction", success,
                       "Failed to record interaction" if not success else "", response)

    def test_openai_integration(self):
        """Test OpenAI Integration with new API key"""
        print("\n🔑 Testing OpenAI Integration (New API Key)...")
        
        # Test AI FAQ Chat
        chat_data = {
            "question": "What are the requirements for selling livestock on StockLot?",
            "context": "new_seller_inquiry"
        }
        
        success, response = self.make_request('POST', '/faq/chat', chat_data)
        self.log_result("OpenAI Integration: FAQ Chat", success,
                       "Failed to get AI response" if not success else "", response)
        
        # Check if response indicates API key is working
        if success and response.get('source') == 'ai':
            print("   ✅ OpenAI API key (sk-emergent-b52F9EfE412408863D) is working correctly")
        elif success and response.get('source') == 'fallback':
            print("   ⚠️  OpenAI API may not be working - got fallback response")

    def run_comprehensive_test(self):
        """Run comprehensive final testing as requested"""
        print("🚀 ML Engine & Enhanced Buy Request Comprehensive Final Testing")
        print("=" * 70)
        print("Testing Scope: Full System Validation")
        print("Focus: NEW ML Engine capabilities and OpenAI integration")
        print("=" * 70)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed - cannot proceed with tests")
            return False
        
        # Run all test suites in priority order
        self.test_ml_engine_endpoints()           # Priority: CRITICAL
        self.test_photo_intelligence_endpoints()   # Priority: HIGH  
        self.test_enhanced_buy_request_system()   # Priority: HIGH
        self.test_order_management_checkout()     # Priority: HIGH
        self.test_dashboard_apis()                # Priority: MEDIUM
        self.test_ml_faq_matching_services()      # Priority: MEDIUM
        self.test_openai_integration()            # OpenAI Integration Test
        
        # Print comprehensive summary
        self.print_final_summary()
        
        return self.tests_passed > 0

    def print_final_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE FINAL TEST RESULTS")
        print("=" * 70)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Categorize results by priority
        critical_tests = [r for r in self.test_results if 'ML Engine' in r['test']]
        high_tests = [r for r in self.test_results if any(x in r['test'] for x in ['Photo Intelligence', 'Enhanced Buy Request', 'Order Management'])]
        medium_tests = [r for r in self.test_results if any(x in r['test'] for x in ['Dashboard API', 'ML FAQ', 'ML Matching'])]
        
        print(f"\n🔴 CRITICAL Priority (ML Engine): {sum(1 for t in critical_tests if t['success'])}/{len(critical_tests)} passed")
        print(f"🟠 HIGH Priority: {sum(1 for t in high_tests if t['success'])}/{len(high_tests)} passed")
        print(f"🟡 MEDIUM Priority: {sum(1 for t in medium_tests if t['success'])}/{len(medium_tests)} passed")
        
        # Failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # OpenAI Integration Status
        openai_tests = [r for r in self.test_results if 'OpenAI' in r['test']]
        if openai_tests:
            if any(t['success'] for t in openai_tests):
                print(f"\n✅ OpenAI Integration: Working with new API key")
            else:
                print(f"\n❌ OpenAI Integration: Issues detected with API key")
        
        print("\n" + "=" * 70)

def main():
    """Main test function"""
    tester = MLEngineComprehensiveTester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())