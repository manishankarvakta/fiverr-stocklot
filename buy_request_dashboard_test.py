#!/usr/bin/env python3
"""
🧪 BUY REQUEST DASHBOARD API ENDPOINTS TESTING
Testing the 3 critical dashboard endpoints that are currently failing with 404 errors
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import uuid
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BuyRequestDashboardTester:
    """Comprehensive Buy Request Dashboard Backend Tester"""
    
    def __init__(self, base_url: str = "https://buy-request-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.buyer_auth_token = None
        self.seller_auth_token = None
        self.test_results = []
        
        # Test data
        self.test_buy_request_id = None
        self.test_offer_id = None
        self.buyer_user_id = None
        self.seller_user_id = None
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate_buyer(self):
        """Authenticate as buyer user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.buyer_auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    self.buyer_user_id = data.get("user", {}).get("id") or "admin_user_id"
                    logger.info("✅ Buyer authentication successful")
                    return True
                else:
                    logger.error(f"❌ Buyer authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Buyer authentication error: {e}")
            return False
    
    async def authenticate_seller(self):
        """Authenticate as seller user (using same admin for simplicity)"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za", 
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.seller_auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    self.seller_user_id = data.get("user", {}).get("id") or "admin_user_id"
                    logger.info("✅ Seller authentication successful")
                    return True
                else:
                    logger.error(f"❌ Seller authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Seller authentication error: {e}")
            return False
    
    def get_buyer_headers(self):
        """Get headers with buyer authentication"""
        headers = {"Content-Type": "application/json"}
        if self.buyer_auth_token:
            headers["Authorization"] = f"Bearer {self.buyer_auth_token}"
        return headers
    
    def get_seller_headers(self):
        """Get headers with seller authentication"""
        headers = {"Content-Type": "application/json"}
        if self.seller_auth_token:
            headers["Authorization"] = f"Bearer {self.seller_auth_token}"
        return headers
    
    async def create_test_buy_request(self):
        """Create a test buy request to ensure data exists"""
        logger.info("\n🧪 Creating test buy request...")
        
        # Get species and product types first
        try:
            async with self.session.get(f"{self.api_url}/species") as response:
                if response.status == 200:
                    species_data = await response.json()
                    species_list = species_data.get("species", [])
                    if not species_list:
                        logger.error("❌ No species found")
                        return False
                    cattle_species = next((s for s in species_list if "cattle" in s.get("name", "").lower()), species_list[0])
                else:
                    logger.error(f"❌ Failed to get species: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Error getting species: {e}")
            return False
        
        try:
            async with self.session.get(f"{self.api_url}/product-types") as response:
                if response.status == 200:
                    product_data = await response.json()
                    product_types = product_data.get("product_types", [])
                    if not product_types:
                        logger.error("❌ No product types found")
                        return False
                    market_ready = next((p for p in product_types if "market" in p.get("label", "").lower()), product_types[0])
                else:
                    logger.error(f"❌ Failed to get product types: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Error getting product types: {e}")
            return False
        
        # Create enhanced buy request
        buy_request_data = {
            "title": "Test Angus Cattle Request for Dashboard Testing",
            "description": "High-quality Angus cattle needed for testing dashboard functionality",
            "species_id": cattle_species["id"],
            "product_type_id": market_ready["id"],
            "quantity": 25,
            "unit": "head",
            "target_price_per_unit": 15000.00,
            "budget_flexibility": "firm",
            "province": "Gauteng",
            "city": "Johannesburg",
            "delivery_location": "Johannesburg, Gauteng",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "weight_range": {"min": 400, "max": 600},
            "age_requirements": "18-24 months",
            "vaccination_requirements": ["FMD", "Anthrax"],
            "delivery_preferences": "Farm pickup preferred",
            "inspection_allowed": True,
            "additional_requirements": "Must have health certificates"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/buy-requests/enhanced",
                json=buy_request_data,
                headers=self.get_buyer_headers()
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    self.test_buy_request_id = data.get("buy_request", {}).get("id")
                    logger.info(f"✅ Test buy request created successfully: {self.test_buy_request_id}")
                    self.test_results.append(("Test Buy Request Creation", True, f"ID: {self.test_buy_request_id}"))
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create test buy request: {response.status} - {error_text}")
                    self.test_results.append(("Test Buy Request Creation", False, f"Status {response.status}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error creating test buy request: {e}")
            self.test_results.append(("Test Buy Request Creation", False, str(e)))
            return False
    
    async def create_test_offer(self):
        """Create a test offer for the buy request"""
        if not self.test_buy_request_id:
            logger.warning("⚠️ No test buy request ID available for creating offer")
            return False
        
        logger.info("\n🧪 Creating test offer...")
        
        offer_data = {
            "unit_price": 14500.00,
            "quantity_available": 30,
            "delivery_time_days": 7,
            "notes": "Premium Angus cattle, grass-fed, excellent condition"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/buy-requests/{self.test_buy_request_id}/offers",
                json=offer_data,
                headers=self.get_seller_headers()
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    self.test_offer_id = data.get("offer", {}).get("id")
                    logger.info(f"✅ Test offer created successfully: {self.test_offer_id}")
                    self.test_results.append(("Test Offer Creation", True, f"ID: {self.test_offer_id}"))
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create test offer: {response.status} - {error_text}")
                    self.test_results.append(("Test Offer Creation", False, f"Status {response.status}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error creating test offer: {e}")
            self.test_results.append(("Test Offer Creation", False, str(e)))
            return False
    
    async def test_my_requests_endpoint(self):
        """Test GET /api/buy-requests/my-requests"""
        logger.info("\n🧪 Testing GET /api/buy-requests/my-requests...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/buy-requests/my-requests",
                headers=self.get_buyer_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    requests = data.get("requests", [])
                    pagination = data.get("pagination", {})
                    
                    logger.info(f"✅ My requests endpoint successful - Found {len(requests)} requests")
                    logger.info(f"   Pagination: page {pagination.get('page', 1)}, total {pagination.get('total', 0)}")
                    
                    # Check if our test request is in the results
                    test_request_found = False
                    if self.test_buy_request_id:
                        test_request_found = any(req.get("id") == self.test_buy_request_id for req in requests)
                        if test_request_found:
                            logger.info(f"   ✅ Test buy request {self.test_buy_request_id} found in results")
                        else:
                            logger.warning(f"   ⚠️ Test buy request {self.test_buy_request_id} not found in results")
                    
                    self.test_results.append(("GET /buy-requests/my-requests", True, f"Found {len(requests)} requests, test request found: {test_request_found}"))
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ My requests endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("GET /buy-requests/my-requests", False, f"Status {response.status}: {error_text}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error testing my requests endpoint: {e}")
            self.test_results.append(("GET /buy-requests/my-requests", False, str(e)))
            return False
    
    async def test_seller_inbox_endpoint(self):
        """Test GET /api/buy-requests/seller-inbox"""
        logger.info("\n🧪 Testing GET /api/buy-requests/seller-inbox...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/buy-requests/seller-inbox",
                headers=self.get_seller_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    requests = data.get("requests", [])
                    pagination = data.get("pagination", {})
                    
                    logger.info(f"✅ Seller inbox endpoint successful - Found {len(requests)} requests")
                    logger.info(f"   Pagination: page {pagination.get('page', 1)}, total {pagination.get('total', 0)}")
                    
                    # Check if our test request is in the results
                    test_request_found = False
                    if self.test_buy_request_id:
                        test_request_found = any(req.get("id") == self.test_buy_request_id for req in requests)
                        if test_request_found:
                            logger.info(f"   ✅ Test buy request {self.test_buy_request_id} found in seller inbox")
                        else:
                            logger.warning(f"   ⚠️ Test buy request {self.test_buy_request_id} not found in seller inbox")
                    
                    self.test_results.append(("GET /buy-requests/seller-inbox", True, f"Found {len(requests)} requests, test request found: {test_request_found}"))
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Seller inbox endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("GET /buy-requests/seller-inbox", False, f"Status {response.status}: {error_text}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error testing seller inbox endpoint: {e}")
            self.test_results.append(("GET /buy-requests/seller-inbox", False, str(e)))
            return False
    
    async def test_my_offers_endpoint(self):
        """Test GET /api/buy-requests/my-offers"""
        logger.info("\n🧪 Testing GET /api/buy-requests/my-offers...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/buy-requests/my-offers",
                headers=self.get_seller_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    offers = data.get("offers", [])
                    pagination = data.get("pagination", {})
                    
                    logger.info(f"✅ My offers endpoint successful - Found {len(offers)} offers")
                    logger.info(f"   Pagination: page {pagination.get('page', 1)}, total {pagination.get('total', 0)}")
                    
                    # Check if our test offer is in the results
                    test_offer_found = False
                    if self.test_offer_id:
                        test_offer_found = any(offer.get("id") == self.test_offer_id for offer in offers)
                        if test_offer_found:
                            logger.info(f"   ✅ Test offer {self.test_offer_id} found in results")
                        else:
                            logger.warning(f"   ⚠️ Test offer {self.test_offer_id} not found in results")
                    
                    self.test_results.append(("GET /buy-requests/my-offers", True, f"Found {len(offers)} offers, test offer found: {test_offer_found}"))
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ My offers endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("GET /buy-requests/my-offers", False, f"Status {response.status}: {error_text}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error testing my offers endpoint: {e}")
            self.test_results.append(("GET /buy-requests/my-offers", False, str(e)))
            return False
    
    async def test_database_direct_queries(self):
        """Test direct database queries to understand data structure"""
        logger.info("\n🧪 Testing database queries to understand data structure...")
        
        # Test if buy requests exist in database
        try:
            async with self.session.get(f"{self.api_url}/public/buy-requests") as response:
                if response.status == 200:
                    data = await response.json()
                    requests = data.get("requests", [])
                    logger.info(f"✅ Public buy requests found: {len(requests)} total")
                    
                    if requests:
                        sample_request = requests[0]
                        logger.info(f"   Sample request structure: {list(sample_request.keys())}")
                        logger.info(f"   Sample request ID: {sample_request.get('id')}")
                        logger.info(f"   Sample buyer_id: {sample_request.get('buyer_id')}")
                        logger.info(f"   Sample status: {sample_request.get('status')}")
                    
                    self.test_results.append(("Database Query - Public Requests", True, f"Found {len(requests)} requests"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Public requests query failed: {response.status} - {error_text}")
                    self.test_results.append(("Database Query - Public Requests", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error querying public requests: {e}")
            self.test_results.append(("Database Query - Public Requests", False, str(e)))
    
    async def test_authentication_context(self):
        """Test if authentication context is working properly"""
        logger.info("\n🧪 Testing authentication context...")
        
        # Test with buyer auth
        try:
            async with self.session.get(
                f"{self.api_url}/auth/me",
                headers=self.get_buyer_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    user = data.get("user", {})
                    logger.info(f"✅ Buyer auth context working - User ID: {user.get('id')}, Roles: {user.get('roles')}")
                    self.test_results.append(("Authentication Context - Buyer", True, f"User ID: {user.get('id')}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Buyer auth context failed: {response.status} - {error_text}")
                    self.test_results.append(("Authentication Context - Buyer", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing buyer auth context: {e}")
            self.test_results.append(("Authentication Context - Buyer", False, str(e)))
        
        # Test with seller auth
        try:
            async with self.session.get(
                f"{self.api_url}/auth/me",
                headers=self.get_seller_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    user = data.get("user", {})
                    logger.info(f"✅ Seller auth context working - User ID: {user.get('id')}, Roles: {user.get('roles')}")
                    self.test_results.append(("Authentication Context - Seller", True, f"User ID: {user.get('id')}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Seller auth context failed: {response.status} - {error_text}")
                    self.test_results.append(("Authentication Context - Seller", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing seller auth context: {e}")
            self.test_results.append(("Authentication Context - Seller", False, str(e)))
    
    async def run_all_tests(self):
        """Run all buy request dashboard tests"""
        logger.info("🚀 Starting Buy Request Dashboard API Endpoints Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate_buyer():
                logger.error("❌ Buyer authentication failed - cannot proceed with tests")
                return
            
            if not await self.authenticate_seller():
                logger.error("❌ Seller authentication failed - cannot proceed with tests")
                return
            
            # Test authentication context
            await self.test_authentication_context()
            
            # Test database queries to understand data structure
            await self.test_database_direct_queries()
            
            # Create test data
            await self.create_test_buy_request()
            await self.create_test_offer()
            
            # Test the 3 critical dashboard endpoints
            await self.test_my_requests_endpoint()
            await self.test_seller_inbox_endpoint()
            await self.test_my_offers_endpoint()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 BUY REQUEST DASHBOARD API ENDPOINTS TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Focus on the 3 critical endpoints
        critical_endpoints = [
            "GET /buy-requests/my-requests",
            "GET /buy-requests/seller-inbox", 
            "GET /buy-requests/my-offers"
        ]
        
        critical_passed = 0
        critical_total = 0
        
        for test_name, success, details in self.test_results:
            if any(endpoint in test_name for endpoint in critical_endpoints):
                critical_total += 1
                if success:
                    critical_passed += 1
        
        logger.info(f"🎯 CRITICAL ENDPOINTS: {critical_passed}/{critical_total} working ({critical_passed/critical_total*100:.1f}% if critical_total > 0 else 0)")
        
        if critical_passed == critical_total and critical_total > 0:
            logger.info("🎉 ALL CRITICAL DASHBOARD ENDPOINTS WORKING!")
        elif critical_passed > 0:
            logger.info("⚠️ SOME DASHBOARD ENDPOINTS WORKING - Partial success")
        else:
            logger.info("❌ ALL DASHBOARD ENDPOINTS FAILING - Critical issue")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 CRITICAL ENDPOINTS TESTED:")
        logger.info("   • GET /api/buy-requests/my-requests - Buyer's own buy requests")
        logger.info("   • GET /api/buy-requests/seller-inbox - Buy requests in seller's delivery range")
        logger.info("   • GET /api/buy-requests/my-offers - Seller's own offers")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = BuyRequestDashboardTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())