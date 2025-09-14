#!/usr/bin/env python3
"""
🔍 PDP NAVIGATION ISSUE TESTING
Focused testing of the PDP (Product Detail Page) navigation issue
Testing the /api/listings/{id}/pdp endpoint specifically with real listing data
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PDPNavigationTester:
    """PDP Navigation Issue Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.real_listing_ids = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as regular user"""
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
    
    async def get_real_listings(self):
        """Get real listing IDs from the marketplace"""
        logger.info("\n🔍 Fetching real listings from marketplace...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    if listings:
                        self.real_listing_ids = [listing.get("id") for listing in listings if listing.get("id")]
                        logger.info(f"✅ Found {len(self.real_listing_ids)} real listings")
                        
                        # Log first few listing details for reference
                        for i, listing in enumerate(listings[:3]):
                            logger.info(f"   Listing {i+1}: ID={listing.get('id')}, Title='{listing.get('title', 'N/A')}'")
                        
                        self.test_results.append(("Get Real Listings", True, f"Found {len(self.real_listing_ids)} listings"))
                        return True
                    else:
                        logger.warning("⚠️ No listings found in marketplace")
                        self.test_results.append(("Get Real Listings", False, "No listings found"))
                        return False
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to fetch listings: {response.status} - {error_text}")
                    self.test_results.append(("Get Real Listings", False, f"Status {response.status}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error fetching listings: {e}")
            self.test_results.append(("Get Real Listings", False, str(e)))
            return False
    
    async def test_pdp_endpoint_with_real_ids(self):
        """Test PDP endpoint with real listing IDs"""
        logger.info("\n🧪 Testing PDP endpoint with real listing IDs...")
        
        if not self.real_listing_ids:
            logger.error("❌ No real listing IDs available for testing")
            self.test_results.append(("PDP Endpoint Test", False, "No real listing IDs available"))
            return
        
        # Test with first 3 real listing IDs
        test_ids = self.real_listing_ids[:3]
        
        for i, listing_id in enumerate(test_ids):
            logger.info(f"\n🔍 Testing PDP endpoint with listing ID: {listing_id}")
            
            try:
                async with self.session.get(
                    f"{self.api_url}/listings/{listing_id}/pdp",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check if response has expected PDP data structure
                        # The API returns a flat structure with listing data at top level
                        required_fields = ["id", "title", "seller", "similar"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            # Extract data from flat structure
                            listing_title = data.get("title", "N/A")
                            seller_data = data.get("seller", {})
                            similar_listings = data.get("similar", [])
                            price = data.get("price", 0)
                            status = "active"  # PDP only shows active listings
                            
                            logger.info(f"✅ PDP endpoint working for listing {i+1}")
                            logger.info(f"   Listing title: {listing_title}")
                            logger.info(f"   Seller info: {seller_data.get('name', 'N/A')}")
                            logger.info(f"   Similar listings: {len(similar_listings)}")
                            logger.info(f"   Price: R{price}")
                            logger.info(f"   Species: {data.get('species', 'N/A')}")
                            logger.info(f"   Breed: {data.get('breed', 'N/A')}")
                            
                            self.test_results.append((f"PDP Endpoint Test {i+1}", True, f"ID: {listing_id}"))
                        else:
                            logger.error(f"❌ PDP response missing required fields: {missing_fields}")
                            self.test_results.append((f"PDP Endpoint Test {i+1}", False, f"Missing fields: {missing_fields}"))
                    
                    elif response.status == 404:
                        logger.error(f"❌ Listing not found: {listing_id}")
                        self.test_results.append((f"PDP Endpoint Test {i+1}", False, "Listing not found (404)"))
                    
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ PDP endpoint failed: {response.status} - {error_text}")
                        self.test_results.append((f"PDP Endpoint Test {i+1}", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error testing PDP endpoint: {e}")
                self.test_results.append((f"PDP Endpoint Test {i+1}", False, str(e)))
    
    async def test_pdp_endpoint_structure(self):
        """Test if PDP endpoint exists and returns proper structure"""
        logger.info("\n🧪 Testing PDP endpoint structure...")
        
        if not self.real_listing_ids:
            logger.error("❌ No real listing IDs available for structure testing")
            return
        
        test_id = self.real_listing_ids[0]
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{test_id}/pdp",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Detailed structure analysis
                    logger.info("✅ PDP endpoint accessible")
                    logger.info("📋 Response structure analysis:")
                    
                    # Check main sections - updated for actual API structure
                    sections = {
                        "id": "Listing ID",
                        "title": "Listing title", 
                        "seller": "Seller information",
                        "similar": "Similar/related listings",
                        "media": "Listing images",
                        "attributes": "Animal specifications",
                        "price": "Listing price",
                        "description": "Listing description"
                    }
                    
                    for section, description in sections.items():
                        if section in data:
                            section_data = data[section]
                            if isinstance(section_data, list):
                                logger.info(f"   ✅ {section}: {len(section_data)} items - {description}")
                            elif isinstance(section_data, dict):
                                logger.info(f"   ✅ {section}: Object with {len(section_data)} fields - {description}")
                            else:
                                logger.info(f"   ✅ {section}: {type(section_data).__name__} - {description}")
                        else:
                            logger.info(f"   ❌ {section}: Missing - {description}")
                    
                    # Check if listing data has essential fields - updated for flat structure
                    essential_fields = ["id", "title", "price", "seller"]
                    missing_essential = [field for field in essential_fields if field not in data]
                    
                    if not missing_essential:
                        logger.info("   ✅ All essential listing fields present")
                        self.test_results.append(("PDP Structure Test", True, "Complete structure"))
                    else:
                        logger.error(f"   ❌ Missing essential fields: {missing_essential}")
                        self.test_results.append(("PDP Structure Test", False, f"Missing: {missing_essential}"))
                
                elif response.status == 404:
                    logger.error("❌ PDP endpoint returns 404 - endpoint may not exist")
                    self.test_results.append(("PDP Structure Test", False, "Endpoint not found (404)"))
                
                else:
                    error_text = await response.text()
                    logger.error(f"❌ PDP endpoint error: {response.status} - {error_text}")
                    self.test_results.append(("PDP Structure Test", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing PDP structure: {e}")
            self.test_results.append(("PDP Structure Test", False, str(e)))
    
    async def test_pdp_with_invalid_ids(self):
        """Test PDP endpoint with invalid listing IDs"""
        logger.info("\n🧪 Testing PDP endpoint with invalid IDs...")
        
        invalid_ids = [
            "nonexistent-id",
            "12345",
            "invalid-uuid",
            ""
        ]
        
        for i, invalid_id in enumerate(invalid_ids):
            if not invalid_id:  # Skip empty string test for URL safety
                continue
                
            try:
                async with self.session.get(
                    f"{self.api_url}/listings/{invalid_id}/pdp",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 404:
                        logger.info(f"✅ Invalid ID test {i+1}: Correctly returns 404 for '{invalid_id}'")
                        self.test_results.append((f"Invalid ID Test {i+1}", True, f"404 for '{invalid_id}'"))
                    else:
                        logger.error(f"❌ Invalid ID test {i+1}: Expected 404, got {response.status} for '{invalid_id}'")
                        self.test_results.append((f"Invalid ID Test {i+1}", False, f"Expected 404, got {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error testing invalid ID '{invalid_id}': {e}")
                self.test_results.append((f"Invalid ID Test {i+1}", False, str(e)))
    
    async def test_pdp_authentication_requirements(self):
        """Test if PDP endpoint requires authentication"""
        logger.info("\n🧪 Testing PDP authentication requirements...")
        
        if not self.real_listing_ids:
            logger.error("❌ No real listing IDs available for auth testing")
            return
        
        test_id = self.real_listing_ids[0]
        
        # Test without authentication
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{test_id}/pdp"
                # No headers - no authentication
            ) as response:
                if response.status == 200:
                    logger.info("✅ PDP endpoint accessible without authentication (public access)")
                    self.test_results.append(("PDP Auth Test", True, "Public access allowed"))
                elif response.status == 401:
                    logger.info("✅ PDP endpoint requires authentication (returns 401)")
                    self.test_results.append(("PDP Auth Test", True, "Authentication required"))
                else:
                    logger.error(f"❌ Unexpected response without auth: {response.status}")
                    self.test_results.append(("PDP Auth Test", False, f"Unexpected status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing PDP authentication: {e}")
            self.test_results.append(("PDP Auth Test", False, str(e)))
    
    async def check_backend_logs_for_pdp_errors(self):
        """Check if there are any backend errors related to PDP"""
        logger.info("\n🔍 Checking for PDP-related backend errors...")
        
        # This is a placeholder - in a real scenario, we'd check server logs
        # For now, we'll test the endpoint and see if it throws any errors
        
        if not self.real_listing_ids:
            logger.warning("⚠️ Cannot check PDP errors - no real listing IDs")
            return
        
        test_id = self.real_listing_ids[0]
        
        try:
            # Make a request and capture any error details
            async with self.session.get(
                f"{self.api_url}/listings/{test_id}/pdp",
                headers=self.get_headers()
            ) as response:
                response_text = await response.text()
                
                if response.status == 500:
                    logger.error("❌ PDP endpoint returns 500 - Internal Server Error")
                    logger.error(f"   Error details: {response_text}")
                    self.test_results.append(("Backend Error Check", False, "500 Internal Server Error"))
                elif response.status == 200:
                    logger.info("✅ No 500 errors detected in PDP endpoint")
                    self.test_results.append(("Backend Error Check", True, "No server errors"))
                else:
                    logger.info(f"ℹ️ PDP endpoint returns {response.status} (not a server error)")
                    self.test_results.append(("Backend Error Check", True, f"Status {response.status} (not 500)"))
                    
        except Exception as e:
            logger.error(f"❌ Error checking backend errors: {e}")
            self.test_results.append(("Backend Error Check", False, str(e)))
    
    async def run_all_tests(self):
        """Run all PDP navigation tests"""
        logger.info("🚀 Starting PDP Navigation Issue Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Get real listings first
            if not await self.get_real_listings():
                logger.error("❌ Cannot get real listings - testing with mock data may be limited")
            
            # Run all PDP tests
            await self.test_pdp_endpoint_with_real_ids()
            await self.test_pdp_endpoint_structure()
            await self.test_pdp_with_invalid_ids()
            await self.test_pdp_authentication_requirements()
            await self.check_backend_logs_for_pdp_errors()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🔍 PDP NAVIGATION ISSUE TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! PDP endpoint is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - PDP endpoint is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - PDP endpoint has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - PDP endpoint requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY AREAS TESTED:")
        logger.info("   • Real listing ID retrieval from marketplace")
        logger.info("   • PDP endpoint functionality with real data")
        logger.info("   • PDP response structure and required fields")
        logger.info("   • Error handling for invalid listing IDs")
        logger.info("   • Authentication requirements")
        logger.info("   • Backend error detection")
        
        logger.info("\n🔍 DIAGNOSIS:")
        if any("PDP Endpoint Test" in result[0] and not result[1] for result in self.test_results):
            logger.info("   ❌ PDP endpoint is not working correctly with real listing IDs")
            logger.info("   🔧 This explains why 'View Details' leads to blank pages")
        elif any("Get Real Listings" in result[0] and not result[1] for result in self.test_results):
            logger.info("   ❌ Cannot retrieve real listings from marketplace")
            logger.info("   🔧 This might indicate a broader marketplace API issue")
        else:
            logger.info("   ✅ PDP endpoint appears to be working correctly")
            logger.info("   🔧 The blank page issue might be frontend-related")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = PDPNavigationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())