#!/usr/bin/env python3
"""
🧪 ML ENGINE & PHOTO INTELLIGENCE BACKEND TESTING
Comprehensive testing of ML Engine Service endpoints and Photo Intelligence endpoints
focusing on user context issues as reported in test_result.md
"""

import asyncio
import aiohttp
import json
import logging
import base64
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

class MLEnginePhotoIntelligenceTester:
    """Comprehensive ML Engine & Photo Intelligence Backend Tester"""
    
    def __init__(self, base_url: str = "https://farm-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_user_id = None
        self.test_buy_request_id = None
        
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
                    self.auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
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
    
    async def test_ml_engine_smart_pricing(self):
        """Test 1: ML Engine Smart Pricing Analysis"""
        logger.info("\n🧪 Testing ML Engine Smart Pricing Analysis...")
        
        # Test with realistic livestock data
        pricing_data = {
            "listing_data": {
                "species": "cattle",
                "breed": "angus",
                "quantity": 50,
                "location": "Gauteng",
                "age_months": 18,
                "weight_kg": 450,
                "quality_grade": "A"
            },
            "market_context": {
                "season": "winter",
                "demand_level": "high"
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/ml/engine/smart-pricing",
                json=pricing_data,
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    data = await response.json()
                    analysis = data.get("analysis", {})
                    
                    logger.info("✅ Smart pricing analysis successful")
                    logger.info(f"   Suggested price: R{analysis.get('suggested_price_per_unit', 0):.2f}")
                    logger.info(f"   Confidence: {analysis.get('confidence_score', 0):.2f}")
                    logger.info(f"   Market trend: {analysis.get('market_trend', 'N/A')}")
                    
                    self.test_results.append(("ML Engine Smart Pricing", True, "Analysis completed successfully"))
                elif status == 404:
                    logger.error(f"❌ Smart pricing endpoint not found: {status}")
                    self.test_results.append(("ML Engine Smart Pricing", False, f"Endpoint not found (404)"))
                elif "NoneType" in response_text and "id" in response_text:
                    logger.error(f"❌ Smart pricing user context issue: {response_text}")
                    self.test_results.append(("ML Engine Smart Pricing", False, "User context issue - current_user is None"))
                else:
                    logger.error(f"❌ Smart pricing failed: {status} - {response_text}")
                    self.test_results.append(("ML Engine Smart Pricing", False, f"Status {status}: {response_text[:100]}"))
        except Exception as e:
            logger.error(f"❌ Error in smart pricing test: {e}")
            self.test_results.append(("ML Engine Smart Pricing", False, str(e)))
    
    async def test_ml_engine_demand_forecasting(self):
        """Test 2: ML Engine Demand Forecasting"""
        logger.info("\n🧪 Testing ML Engine Demand Forecasting...")
        
        # Test with realistic forecasting parameters
        forecast_data = {
            "species": "chickens",
            "region": "Western Cape",
            "time_horizon_days": 30,
            "historical_data": {
                "past_sales": [100, 120, 95, 110, 130],
                "seasonal_factors": ["summer", "high_demand"]
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/ml/engine/demand-forecast",
                json=forecast_data,
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    data = await response.json()
                    forecast = data.get("forecast", {})
                    
                    logger.info("✅ Demand forecasting successful")
                    logger.info(f"   Predicted demand: {forecast.get('predicted_demand', 0)} units")
                    logger.info(f"   Confidence interval: {forecast.get('confidence_interval', {})}")
                    logger.info(f"   Trend: {forecast.get('trend_direction', 'N/A')}")
                    
                    self.test_results.append(("ML Engine Demand Forecasting", True, "Forecast generated successfully"))
                elif status == 404:
                    logger.error(f"❌ Demand forecasting endpoint not found: {status}")
                    self.test_results.append(("ML Engine Demand Forecasting", False, f"Endpoint not found (404)"))
                elif "NoneType" in response_text and ("id" in response_text or "province" in response_text):
                    logger.error(f"❌ Demand forecasting user context issue: {response_text}")
                    self.test_results.append(("ML Engine Demand Forecasting", False, "User context issue - current_user is None"))
                else:
                    logger.error(f"❌ Demand forecasting failed: {status} - {response_text}")
                    self.test_results.append(("ML Engine Demand Forecasting", False, f"Status {status}: {response_text[:100]}"))
        except Exception as e:
            logger.error(f"❌ Error in demand forecasting test: {e}")
            self.test_results.append(("ML Engine Demand Forecasting", False, str(e)))
    
    async def test_ml_engine_market_intelligence(self):
        """Test 3: ML Engine Market Intelligence Analysis"""
        logger.info("\n🧪 Testing ML Engine Market Intelligence Analysis...")
        
        # Test with market analysis parameters
        market_data = {
            "species": "goats",
            "analysis_type": "competitive_landscape",
            "geographic_scope": "national",
            "time_period": "last_quarter"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/ml/engine/market-intelligence",
                json=market_data,
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    data = await response.json()
                    intelligence = data.get("intelligence", {})
                    
                    logger.info("✅ Market intelligence analysis successful")
                    logger.info(f"   Market size: {intelligence.get('market_size_estimate', 'N/A')}")
                    logger.info(f"   Competition level: {intelligence.get('competition_level', 'N/A')}")
                    logger.info(f"   Growth rate: {intelligence.get('growth_rate', 'N/A')}")
                    
                    self.test_results.append(("ML Engine Market Intelligence", True, "Analysis completed successfully"))
                elif status == 404:
                    logger.error(f"❌ Market intelligence endpoint not found: {status}")
                    self.test_results.append(("ML Engine Market Intelligence", False, f"Endpoint not found (404)"))
                elif "NoneType" in response_text and "id" in response_text:
                    logger.error(f"❌ Market intelligence user context issue: {response_text}")
                    self.test_results.append(("ML Engine Market Intelligence", False, "User context issue - current_user is None"))
                else:
                    logger.error(f"❌ Market intelligence failed: {status} - {response_text}")
                    self.test_results.append(("ML Engine Market Intelligence", False, f"Status {status}: {response_text[:100]}"))
        except Exception as e:
            logger.error(f"❌ Error in market intelligence test: {e}")
            self.test_results.append(("ML Engine Market Intelligence", False, str(e)))
    
    async def test_ml_engine_content_optimization(self):
        """Test 4: ML Engine Content Optimization Analysis"""
        logger.info("\n🧪 Testing ML Engine Content Optimization Analysis...")
        
        # Test with content optimization data
        content_data = {
            "listing_data": {
                "title": "Premium Angus Cattle for Sale",
                "description": "High quality Angus cattle, well-fed and healthy",
                "species": "cattle",
                "breed": "angus",
                "quantity": 25
            },
            "optimization_goals": ["engagement", "conversion", "seo"]
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/ml/engine/content-optimization",
                json=content_data,
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    data = await response.json()
                    optimization = data.get("optimization", {})
                    
                    logger.info("✅ Content optimization analysis successful")
                    logger.info(f"   Optimized title: {optimization.get('optimized_title', 'N/A')[:50]}...")
                    logger.info(f"   SEO score: {optimization.get('seo_score', 0)}")
                    logger.info(f"   Engagement prediction: {optimization.get('engagement_score', 0)}")
                    
                    self.test_results.append(("ML Engine Content Optimization", True, "Optimization completed successfully"))
                elif status == 404:
                    logger.error(f"❌ Content optimization endpoint not found: {status}")
                    self.test_results.append(("ML Engine Content Optimization", False, f"Endpoint not found (404)"))
                elif "NoneType" in response_text and "id" in response_text:
                    logger.error(f"❌ Content optimization user context issue: {response_text}")
                    self.test_results.append(("ML Engine Content Optimization", False, "User context issue - current_user is None"))
                else:
                    logger.error(f"❌ Content optimization failed: {status} - {response_text}")
                    self.test_results.append(("ML Engine Content Optimization", False, f"Status {status}: {response_text[:100]}"))
        except Exception as e:
            logger.error(f"❌ Error in content optimization test: {e}")
            self.test_results.append(("ML Engine Content Optimization", False, str(e)))
    
    async def test_photo_intelligence_single_analysis(self):
        """Test 5: Photo Intelligence Single Photo Analysis"""
        logger.info("\n🧪 Testing Photo Intelligence Single Photo Analysis...")
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="
        
        photo_data = {
            "image_data": test_image_base64,
            "listing_context": {
                "analysis_type": "livestock_assessment",
                "species_hint": "cattle"
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/ml/photo/analyze",
                json=photo_data,
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    data = await response.json()
                    analysis = data.get("analysis", {})
                    
                    logger.info("✅ Single photo analysis successful")
                    logger.info(f"   Species detected: {analysis.get('species_detected', 'N/A')}")
                    logger.info(f"   Health assessment: {analysis.get('health_score', 0)}")
                    logger.info(f"   Quality grade: {analysis.get('quality_grade', 'N/A')}")
                    
                    self.test_results.append(("Photo Intelligence Single Analysis", True, "Analysis completed successfully"))
                elif status == 404:
                    logger.error(f"❌ Photo analysis endpoint not found: {status}")
                    self.test_results.append(("Photo Intelligence Single Analysis", False, f"Endpoint not found (404)"))
                elif "NoneType" in response_text and "id" in response_text:
                    logger.error(f"❌ Photo analysis user context issue: {response_text}")
                    self.test_results.append(("Photo Intelligence Single Analysis", False, "User context issue - current_user is None"))
                else:
                    logger.error(f"❌ Photo analysis failed: {status} - {response_text}")
                    self.test_results.append(("Photo Intelligence Single Analysis", False, f"Status {status}: {response_text[:100]}"))
        except Exception as e:
            logger.error(f"❌ Error in photo analysis test: {e}")
            self.test_results.append(("Photo Intelligence Single Analysis", False, str(e)))
    
    async def test_photo_intelligence_bulk_analysis(self):
        """Test 6: Photo Intelligence Bulk Photo Analysis"""
        logger.info("\n🧪 Testing Photo Intelligence Bulk Photo Analysis...")
        
        # Create multiple test images
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="
        
        bulk_data = {
            "photos": [
                {
                    "image_data": test_image_base64, 
                    "listing_context": {"id": "img1", "species_hint": "sheep"}
                },
                {
                    "image_data": test_image_base64, 
                    "listing_context": {"id": "img2", "species_hint": "sheep"}
                },
                {
                    "image_data": test_image_base64, 
                    "listing_context": {"id": "img3", "species_hint": "sheep"}
                }
            ]
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/ml/photo/bulk-analyze",
                json=bulk_data,
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    data = await response.json()
                    analyses = data.get("analyses", [])
                    
                    logger.info("✅ Bulk photo analysis successful")
                    logger.info(f"   Processed {len(analyses)} images")
                    logger.info(f"   Average quality score: {data.get('summary', {}).get('avg_quality', 0)}")
                    
                    self.test_results.append(("Photo Intelligence Bulk Analysis", True, f"Processed {len(analyses)} images"))
                elif status == 404:
                    logger.error(f"❌ Bulk photo analysis endpoint not found: {status}")
                    self.test_results.append(("Photo Intelligence Bulk Analysis", False, f"Endpoint not found (404)"))
                elif "NoneType" in response_text and "id" in response_text:
                    logger.error(f"❌ Bulk photo analysis user context issue: {response_text}")
                    self.test_results.append(("Photo Intelligence Bulk Analysis", False, "User context issue - current_user is None"))
                else:
                    logger.error(f"❌ Bulk photo analysis failed: {status} - {response_text}")
                    self.test_results.append(("Photo Intelligence Bulk Analysis", False, f"Status {status}: {response_text[:100]}"))
        except Exception as e:
            logger.error(f"❌ Error in bulk photo analysis test: {e}")
            self.test_results.append(("Photo Intelligence Bulk Analysis", False, str(e)))
    
    async def test_authentication_context_passing(self):
        """Test 7: Authentication Context Passing"""
        logger.info("\n🧪 Testing Authentication Context Passing...")
        
        # Test without authentication first
        try:
            async with self.session.post(
                f"{self.api_url}/ml/engine/smart-pricing",
                json={"listing_data": {"species": "cattle", "quantity": 10}},
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 401:
                    logger.info("✅ Unauthenticated request properly rejected (401)")
                    self.test_results.append(("Authentication Context - Unauthenticated", True, "Properly rejected with 401"))
                elif status == 200:
                    logger.warning("⚠️ Unauthenticated request allowed (security concern)")
                    self.test_results.append(("Authentication Context - Unauthenticated", False, "Request allowed without auth"))
                else:
                    logger.info(f"ℹ️ Unauthenticated request returned {status}")
                    self.test_results.append(("Authentication Context - Unauthenticated", True, f"Returned {status}"))
        except Exception as e:
            logger.error(f"❌ Error testing unauthenticated request: {e}")
            self.test_results.append(("Authentication Context - Unauthenticated", False, str(e)))
        
        # Test with authentication
        try:
            async with self.session.post(
                f"{self.api_url}/ml/engine/smart-pricing",
                json={"listing_data": {"species": "cattle", "quantity": 10}},
                headers=self.get_headers()
            ) as response:
                status = response.status
                response_text = await response.text()
                
                if status == 200:
                    logger.info("✅ Authenticated request processed successfully")
                    self.test_results.append(("Authentication Context - Authenticated", True, "Request processed with auth"))
                elif "NoneType" in response_text:
                    logger.error("❌ Authenticated request has user context issues")
                    self.test_results.append(("Authentication Context - Authenticated", False, "User context not passed properly"))
                else:
                    logger.info(f"ℹ️ Authenticated request returned {status}")
                    self.test_results.append(("Authentication Context - Authenticated", True, f"Returned {status}"))
        except Exception as e:
            logger.error(f"❌ Error testing authenticated request: {e}")
            self.test_results.append(("Authentication Context - Authenticated", False, str(e)))
    
    async def test_endpoint_accessibility(self):
        """Test 8: Endpoint Accessibility"""
        logger.info("\n🧪 Testing ML Engine & Photo Intelligence Endpoint Accessibility...")
        
        endpoints_to_test = [
            ("/ml/engine/smart-pricing", "ML Pricing Endpoint"),
            ("/ml/engine/demand-forecast", "ML Demand Endpoint"),
            ("/ml/engine/market-intelligence", "ML Market Endpoint"),
            ("/ml/engine/content-optimization", "ML Content Endpoint"),
            ("/ml/photo/analyze", "Photo Single Analysis Endpoint"),
            ("/ml/photo/bulk-analyze", "Photo Bulk Analysis Endpoint")
        ]
        
        for endpoint, name in endpoints_to_test:
            try:
                async with self.session.options(
                    f"{self.api_url}{endpoint}",
                    headers=self.get_headers()
                ) as response:
                    status = response.status
                    
                    if status in [200, 204, 405]:  # 405 is OK for OPTIONS if POST is supported
                        logger.info(f"✅ {name} is accessible")
                        self.test_results.append((f"Endpoint Accessibility - {name}", True, f"Accessible (status {status})"))
                    elif status == 404:
                        logger.error(f"❌ {name} not found (404)")
                        self.test_results.append((f"Endpoint Accessibility - {name}", False, "Endpoint not found (404)"))
                    else:
                        logger.warning(f"⚠️ {name} returned status {status}")
                        self.test_results.append((f"Endpoint Accessibility - {name}", True, f"Status {status}"))
            except Exception as e:
                logger.error(f"❌ Error testing {name}: {e}")
                self.test_results.append((f"Endpoint Accessibility - {name}", False, str(e)))
    
    async def run_all_tests(self):
        """Run all ML Engine & Photo Intelligence tests"""
        logger.info("🚀 Starting ML Engine & Photo Intelligence Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_endpoint_accessibility()
            await self.test_authentication_context_passing()
            await self.test_ml_engine_smart_pricing()
            await self.test_ml_engine_demand_forecasting()
            await self.test_ml_engine_market_intelligence()
            await self.test_ml_engine_content_optimization()
            await self.test_photo_intelligence_single_analysis()
            await self.test_photo_intelligence_bulk_analysis()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 ML ENGINE & PHOTO INTELLIGENCE BACKEND TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Categorize results
        user_context_issues = []
        endpoint_not_found = []
        working_endpoints = []
        other_issues = []
        
        for test_name, success, details in self.test_results:
            if not success:
                if "User context issue" in details or "current_user is None" in details:
                    user_context_issues.append(test_name)
                elif "Endpoint not found" in details or "404" in details:
                    endpoint_not_found.append(test_name)
                else:
                    other_issues.append((test_name, details))
            else:
                working_endpoints.append(test_name)
        
        # Print categorized results
        if user_context_issues:
            logger.info(f"\n❌ USER CONTEXT ISSUES ({len(user_context_issues)} endpoints):")
            for endpoint in user_context_issues:
                logger.info(f"   • {endpoint}")
            logger.info("   → Root cause: current_user is None in ML service calls")
            logger.info("   → Fix needed: User authentication context not being passed properly")
        
        if endpoint_not_found:
            logger.info(f"\n❌ ENDPOINTS NOT FOUND ({len(endpoint_not_found)} endpoints):")
            for endpoint in endpoint_not_found:
                logger.info(f"   • {endpoint}")
            logger.info("   → Root cause: Endpoints not properly registered or routing issues")
        
        if working_endpoints:
            logger.info(f"\n✅ WORKING ENDPOINTS ({len(working_endpoints)} endpoints):")
            for endpoint in working_endpoints:
                logger.info(f"   • {endpoint}")
        
        if other_issues:
            logger.info(f"\n⚠️ OTHER ISSUES ({len(other_issues)} endpoints):")
            for endpoint, details in other_issues:
                logger.info(f"   • {endpoint}: {details}")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FINDINGS:")
        if user_context_issues:
            logger.info("   • CRITICAL: User authentication context not being passed to ML services")
            logger.info("   • This causes 'NoneType' object has no attribute 'id' errors")
            logger.info("   • Affects ML Engine pricing, forecasting, market analysis, and content optimization")
            logger.info("   • Also affects Photo Intelligence single and bulk analysis")
        
        if endpoint_not_found:
            logger.info("   • Some ML Engine/Photo Intelligence endpoints are not accessible (404)")
            logger.info("   • May indicate routing issues or incomplete service registration")
        
        if working_endpoints:
            logger.info(f"   • {len(working_endpoints)} endpoints are accessible and working")
        
        logger.info("\n💡 RECOMMENDATIONS:")
        if user_context_issues:
            logger.info("   1. Fix user context passing in ML Engine and Photo Intelligence services")
            logger.info("   2. Ensure current_user is properly injected into service method calls")
            logger.info("   3. Add proper error handling for None user contexts")
        
        if endpoint_not_found:
            logger.info("   4. Verify ML Engine and Photo Intelligence endpoint registration in server.py")
            logger.info("   5. Check FastAPI route ordering to prevent route interception")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = MLEnginePhotoIntelligenceTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())