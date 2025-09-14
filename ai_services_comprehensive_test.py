#!/usr/bin/env python3
"""
🤖 COMPREHENSIVE AI SERVICES TEST
Testing all AI-related endpoints to verify OpenAI API key impact
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AIServicesTester:
    """Comprehensive AI Services Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as admin user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]
                    logger.info("✅ Authentication successful")
                    return True
                else:
                    logger.error(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_ai_enhanced_endpoints(self):
        """Test AI Enhanced Service endpoints"""
        logger.info("\n🧪 Testing AI Enhanced Service Endpoints...")
        
        # Test endpoints that might use OpenAI
        ai_endpoints = [
            {
                "method": "POST",
                "endpoint": "/buy-requests/enhanced",
                "data": {
                    "title": "Test Cattle Request",
                    "species_id": "test-species",
                    "product_type": "MARKET_READY",
                    "quantity": 10,
                    "target_price": 15000,
                    "location": "Gauteng",
                    "description": "Looking for quality cattle"
                },
                "description": "Enhanced Buy Request Creation (with AI)"
            }
        ]
        
        for endpoint_info in ai_endpoints:
            try:
                if endpoint_info["method"] == "POST":
                    async with self.session.post(
                        f"{self.api_url}{endpoint_info['endpoint']}",
                        json=endpoint_info["data"],
                        headers=self.get_headers()
                    ) as response:
                        status = response.status
                        if status in [200, 201]:
                            data = await response.json()
                            logger.info(f"✅ {endpoint_info['description']}: Working")
                            self.test_results.append((endpoint_info['description'], True, f"Status {status}"))
                        else:
                            error_text = await response.text()
                            logger.error(f"❌ {endpoint_info['description']}: Failed - {status}")
                            logger.error(f"   Error: {error_text[:200]}...")
                            self.test_results.append((endpoint_info['description'], False, f"Status {status}"))
                            
            except Exception as e:
                logger.error(f"❌ Error testing {endpoint_info['description']}: {e}")
                self.test_results.append((endpoint_info['description'], False, str(e)))
    
    async def test_smart_search_endpoint(self):
        """Test Smart Search endpoint"""
        logger.info("\n🧪 Testing Smart Search Endpoint...")
        
        try:
            search_data = {
                "query": "cattle for sale",
                "type": "listings"
            }
            
            async with self.session.post(
                f"{self.api_url}/search/smart",
                json=search_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    suggestions = data.get("suggestions", [])
                    results = data.get("results", [])
                    
                    logger.info("✅ Smart Search endpoint working")
                    logger.info(f"   Suggestions: {len(suggestions)}")
                    logger.info(f"   Results: {len(results)}")
                    
                    self.test_results.append(("Smart Search", True, f"{len(suggestions)} suggestions, {len(results)} results"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Smart Search failed: {response.status} - {error_text}")
                    self.test_results.append(("Smart Search", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing Smart Search: {e}")
            self.test_results.append(("Smart Search", False, str(e)))
    
    async def test_ml_knowledge_endpoints(self):
        """Test ML Knowledge endpoints"""
        logger.info("\n🧪 Testing ML Knowledge Endpoints...")
        
        ml_endpoints = [
            {
                "method": "POST",
                "endpoint": "/ml/knowledge/scrape",
                "data": {"source": "test"},
                "description": "ML Knowledge Scraping"
            },
            {
                "method": "POST", 
                "endpoint": "/ml/knowledge/learn-from-interactions",
                "data": {"session_id": "test"},
                "description": "ML Learning from Interactions"
            },
            {
                "method": "GET",
                "endpoint": "/ml/knowledge/insights",
                "data": None,
                "description": "ML Knowledge Insights"
            }
        ]
        
        for endpoint_info in ml_endpoints:
            try:
                if endpoint_info["method"] == "POST":
                    async with self.session.post(
                        f"{self.api_url}{endpoint_info['endpoint']}",
                        json=endpoint_info["data"],
                        headers=self.get_headers()
                    ) as response:
                        status = response.status
                        if status in [200, 201]:
                            logger.info(f"✅ {endpoint_info['description']}: Working")
                            self.test_results.append((endpoint_info['description'], True, f"Status {status}"))
                        else:
                            error_text = await response.text()
                            logger.warning(f"⚠️ {endpoint_info['description']}: {status}")
                            self.test_results.append((endpoint_info['description'], False, f"Status {status}"))
                else:
                    async with self.session.get(
                        f"{self.api_url}{endpoint_info['endpoint']}",
                        headers=self.get_headers()
                    ) as response:
                        status = response.status
                        if status in [200, 201]:
                            logger.info(f"✅ {endpoint_info['description']}: Working")
                            self.test_results.append((endpoint_info['description'], True, f"Status {status}"))
                        else:
                            error_text = await response.text()
                            logger.warning(f"⚠️ {endpoint_info['description']}: {status}")
                            self.test_results.append((endpoint_info['description'], False, f"Status {status}"))
                            
            except Exception as e:
                logger.error(f"❌ Error testing {endpoint_info['description']}: {e}")
                self.test_results.append((endpoint_info['description'], False, str(e)))
    
    async def run_comprehensive_test(self):
        """Run comprehensive AI services test"""
        logger.info("🤖 Starting Comprehensive AI Services Test...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_ai_enhanced_endpoints()
            await self.test_smart_search_endpoint()
            await self.test_ml_knowledge_endpoints()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print test summary"""
        logger.info("\n" + "="*80)
        logger.info("🤖 COMPREHENSIVE AI SERVICES TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      {details}")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AIServicesTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())