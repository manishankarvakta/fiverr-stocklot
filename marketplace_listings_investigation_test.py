#!/usr/bin/env python3
"""
🔍 MARKETPLACE LISTINGS DISPLAY INVESTIGATION
Critical investigation of the marketplace listings display issue where backend shows 6 listings 
but frontend displays "0 listings" in all categories.

This test specifically addresses the user's urgent issue blocking the entire purchase flow.
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

class MarketplaceListingsInvestigator:
    """Comprehensive Marketplace Listings Display Issue Investigator"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.listings_data = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate_optional(self):
        """Try to authenticate but continue if it fails (for public endpoints)"""
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
                    logger.warning(f"⚠️ Authentication failed: {response.status} - continuing with public access")
                    return False
        except Exception as e:
            logger.warning(f"⚠️ Authentication error: {e} - continuing with public access")
            return False
    
    def get_headers(self):
        """Get headers with optional authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_backend_stats_verification(self):
        """Test 1: Verify backend stats showing 6 listings"""
        logger.info("\n🔍 Test 1: Backend Stats Verification...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/stats",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    total_listings = data.get("total_listings", 0)
                    buy_now_listings = data.get("buy_now_listings", 0)
                    
                    logger.info(f"✅ Backend stats accessible")
                    logger.info(f"   Total listings: {total_listings}")
                    logger.info(f"   Buy now listings: {buy_now_listings}")
                    
                    if total_listings >= 6:
                        logger.info("✅ CONFIRMED: Backend shows 6+ listings available")
                        self.test_results.append(("Backend Stats - Listings Count", True, f"{total_listings} listings found"))
                    else:
                        logger.warning(f"⚠️ Backend shows only {total_listings} listings (expected 6+)")
                        self.test_results.append(("Backend Stats - Listings Count", False, f"Only {total_listings} listings found"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Backend stats failed: {response.status} - {error_text}")
                    self.test_results.append(("Backend Stats - Listings Count", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error accessing backend stats: {e}")
            self.test_results.append(("Backend Stats - Listings Count", False, str(e)))
    
    async def test_main_listings_endpoint(self):
        """Test 2: Test the main /api/listings endpoint that frontend calls"""
        logger.info("\n🔍 Test 2: Main Listings Endpoint (/api/listings)...")
        
        # Test without any parameters (default call)
        try:
            async with self.session.get(
                f"{self.api_url}/listings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    total = data.get("total", 0)
                    
                    logger.info(f"✅ Main listings endpoint accessible")
                    logger.info(f"   Returned listings count: {len(listings)}")
                    logger.info(f"   Total count: {total}")
                    
                    if len(listings) > 0:
                        logger.info("✅ LISTINGS FOUND: Main endpoint returns listings")
                        self.listings_data = listings
                        self.test_results.append(("Main Listings Endpoint - Default", True, f"{len(listings)} listings returned"))
                        
                        # Log first listing details for debugging
                        if listings:
                            first_listing = listings[0]
                            logger.info(f"   Sample listing: {first_listing.get('title', 'No title')} - R{first_listing.get('price_per_unit', 0)}")
                    else:
                        logger.error("❌ CRITICAL ISSUE: Main endpoint returns 0 listings!")
                        self.test_results.append(("Main Listings Endpoint - Default", False, "0 listings returned"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Main listings endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("Main Listings Endpoint - Default", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error accessing main listings endpoint: {e}")
            self.test_results.append(("Main Listings Endpoint - Default", False, str(e)))
    
    async def test_listings_with_frontend_parameters(self):
        """Test 3: Test listings endpoint with typical frontend parameters"""
        logger.info("\n🔍 Test 3: Listings with Frontend Parameters...")
        
        # Common frontend parameter combinations
        test_cases = [
            {"name": "No filters", "params": {}},
            {"name": "Include exotics true", "params": {"include_exotics": "true"}},
            {"name": "Include exotics false", "params": {"include_exotics": "false"}},
            {"name": "Active status only", "params": {"status": "active"}},
            {"name": "With pagination", "params": {"page": "1", "limit": "20"}},
            {"name": "Sort by price", "params": {"sort": "price", "order": "asc"}},
            {"name": "Sort by date", "params": {"sort": "created_at", "order": "desc"}},
        ]
        
        for test_case in test_cases:
            try:
                async with self.session.get(
                    f"{self.api_url}/listings",
                    params=test_case["params"],
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", [])
                        total = data.get("total", 0)
                        
                        logger.info(f"✅ {test_case['name']}: {len(listings)} listings")
                        
                        if len(listings) > 0:
                            self.test_results.append((f"Frontend Params - {test_case['name']}", True, f"{len(listings)} listings"))
                        else:
                            logger.warning(f"⚠️ {test_case['name']}: 0 listings returned")
                            self.test_results.append((f"Frontend Params - {test_case['name']}", False, "0 listings"))
                            
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {test_case['name']} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Frontend Params - {test_case['name']}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing {test_case['name']}: {e}")
                self.test_results.append((f"Frontend Params - {test_case['name']}", False, str(e)))
    
    async def test_category_filtering(self):
        """Test 4: Test category-based filtering"""
        logger.info("\n🔍 Test 4: Category-Based Filtering...")
        
        # First get available category groups
        try:
            async with self.session.get(
                f"{self.api_url}/category-groups",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    category_groups = data.get("category_groups", [])
                    
                    logger.info(f"✅ Found {len(category_groups)} category groups")
                    
                    # Test filtering by each category group
                    for category in category_groups:
                        category_id = category.get("id")
                        category_name = category.get("name")
                        
                        try:
                            async with self.session.get(
                                f"{self.api_url}/listings",
                                params={"category_group_id": category_id},
                                headers=self.get_headers()
                            ) as cat_response:
                                if cat_response.status == 200:
                                    cat_data = await cat_response.json()
                                    cat_listings = cat_data.get("listings", [])
                                    
                                    logger.info(f"   {category_name}: {len(cat_listings)} listings")
                                    
                                    if len(cat_listings) > 0:
                                        self.test_results.append((f"Category Filter - {category_name}", True, f"{len(cat_listings)} listings"))
                                    else:
                                        self.test_results.append((f"Category Filter - {category_name}", False, "0 listings"))
                                        
                        except Exception as e:
                            logger.error(f"❌ Error testing category {category_name}: {e}")
                            self.test_results.append((f"Category Filter - {category_name}", False, str(e)))
                            
                else:
                    logger.error(f"❌ Failed to get category groups: {response.status}")
                    self.test_results.append(("Category Groups Retrieval", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error getting category groups: {e}")
            self.test_results.append(("Category Groups Retrieval", False, str(e)))
    
    async def test_response_format_analysis(self):
        """Test 5: Analyze response format for frontend compatibility"""
        logger.info("\n🔍 Test 5: Response Format Analysis...")
        
        if not self.listings_data:
            logger.warning("⚠️ No listings data available for format analysis")
            self.test_results.append(("Response Format Analysis", False, "No listings data"))
            return
        
        try:
            sample_listing = self.listings_data[0]
            
            # Check for required fields that frontend expects
            required_fields = [
                "id", "title", "price_per_unit", "quantity", "unit",
                "species_id", "product_type_id", "images", "status",
                "seller_id", "created_at"
            ]
            
            missing_fields = []
            present_fields = []
            
            for field in required_fields:
                if field in sample_listing:
                    present_fields.append(field)
                else:
                    missing_fields.append(field)
            
            logger.info(f"✅ Response format analysis:")
            logger.info(f"   Present fields ({len(present_fields)}): {', '.join(present_fields)}")
            
            if missing_fields:
                logger.warning(f"   Missing fields ({len(missing_fields)}): {', '.join(missing_fields)}")
                self.test_results.append(("Response Format Analysis", False, f"Missing fields: {', '.join(missing_fields)}"))
            else:
                logger.info("   ✅ All required fields present")
                self.test_results.append(("Response Format Analysis", True, "All required fields present"))
            
            # Check data types
            logger.info(f"   Sample data types:")
            for field in ["id", "title", "price_per_unit", "quantity", "images"]:
                if field in sample_listing:
                    value = sample_listing[field]
                    logger.info(f"     {field}: {type(value).__name__} = {value}")
            
        except Exception as e:
            logger.error(f"❌ Error analyzing response format: {e}")
            self.test_results.append(("Response Format Analysis", False, str(e)))
    
    async def test_specific_listing_endpoints(self):
        """Test 6: Test specific listing-related endpoints"""
        logger.info("\n🔍 Test 6: Specific Listing Endpoints...")
        
        endpoints_to_test = [
            {"name": "Species", "endpoint": "/species"},
            {"name": "Category Groups", "endpoint": "/category-groups"},
            {"name": "Product Types", "endpoint": "/product-types"},
            {"name": "Breeds", "endpoint": "/breeds"},
        ]
        
        for endpoint_info in endpoints_to_test:
            try:
                async with self.session.get(
                    f"{self.api_url}{endpoint_info['endpoint']}",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Different endpoints have different response structures
                        items = []
                        if "species" in data:
                            items = data["species"]
                        elif "category_groups" in data:
                            items = data["category_groups"]
                        elif "product_types" in data:
                            items = data["product_types"]
                        elif "breeds" in data:
                            items = data["breeds"]
                        elif isinstance(data, list):
                            items = data
                        
                        logger.info(f"✅ {endpoint_info['name']}: {len(items)} items")
                        self.test_results.append((f"Endpoint - {endpoint_info['name']}", True, f"{len(items)} items"))
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {endpoint_info['name']} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Endpoint - {endpoint_info['name']}", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error testing {endpoint_info['name']}: {e}")
                self.test_results.append((f"Endpoint - {endpoint_info['name']}", False, str(e)))
    
    async def test_individual_listing_access(self):
        """Test 7: Test individual listing access (PDP functionality)"""
        logger.info("\n🔍 Test 7: Individual Listing Access...")
        
        if not self.listings_data:
            logger.warning("⚠️ No listings data available for individual access test")
            self.test_results.append(("Individual Listing Access", False, "No listings data"))
            return
        
        # Test first few listings
        for i, listing in enumerate(self.listings_data[:3]):
            listing_id = listing.get("id")
            listing_title = listing.get("title", "Unknown")
            
            if not listing_id:
                continue
                
            try:
                # Test PDP endpoint
                async with self.session.get(
                    f"{self.api_url}/listings/{listing_id}/pdp",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"✅ PDP access {i+1}: {listing_title}")
                        self.test_results.append((f"PDP Access - Listing {i+1}", True, f"Accessible: {listing_title}"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ PDP access {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"PDP Access - Listing {i+1}", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error accessing PDP for listing {i+1}: {e}")
                self.test_results.append((f"PDP Access - Listing {i+1}", False, str(e)))
    
    async def test_exotic_filtering_issue(self):
        """Test 8: Investigate the exotic filtering issue specifically"""
        logger.info("\n🔍 Test 8: Exotic Filtering Issue Investigation...")
        
        # Test the specific exotic filtering combinations
        exotic_test_cases = [
            {"name": "Default (no exotic param)", "params": {}},
            {"name": "include_exotics=true", "params": {"include_exotics": "true"}},
            {"name": "include_exotics=false", "params": {"include_exotics": "false"}},
            {"name": "include_exotics=1", "params": {"include_exotics": "1"}},
            {"name": "include_exotics=0", "params": {"include_exotics": "0"}},
        ]
        
        for test_case in exotic_test_cases:
            try:
                async with self.session.get(
                    f"{self.api_url}/listings",
                    params=test_case["params"],
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", [])
                        
                        logger.info(f"   {test_case['name']}: {len(listings)} listings")
                        
                        if len(listings) > 0:
                            self.test_results.append((f"Exotic Filter - {test_case['name']}", True, f"{len(listings)} listings"))
                        else:
                            logger.warning(f"⚠️ EXOTIC FILTER ISSUE: {test_case['name']} returns 0 listings")
                            self.test_results.append((f"Exotic Filter - {test_case['name']}", False, "0 listings - potential filter bug"))
                            
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {test_case['name']} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Exotic Filter - {test_case['name']}", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error testing {test_case['name']}: {e}")
                self.test_results.append((f"Exotic Filter - {test_case['name']}", False, str(e)))
    
    async def run_comprehensive_investigation(self):
        """Run all investigation tests"""
        logger.info("🔍 Starting Comprehensive Marketplace Listings Display Investigation...")
        logger.info("🚨 INVESTIGATING: Backend shows 6 listings but frontend shows 0 listings")
        
        await self.setup_session()
        
        try:
            # Try to authenticate but continue without it
            await self.authenticate_optional()
            
            # Run all investigation tests
            await self.test_backend_stats_verification()
            await self.test_main_listings_endpoint()
            await self.test_listings_with_frontend_parameters()
            await self.test_category_filtering()
            await self.test_response_format_analysis()
            await self.test_specific_listing_endpoints()
            await self.test_individual_listing_access()
            await self.test_exotic_filtering_issue()
            
        finally:
            await self.cleanup_session()
        
        # Print comprehensive analysis
        self.print_investigation_results()
    
    def print_investigation_results(self):
        """Print comprehensive investigation results"""
        logger.info("\n" + "="*80)
        logger.info("🔍 MARKETPLACE LISTINGS DISPLAY INVESTIGATION RESULTS")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 INVESTIGATION RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Categorize results
        critical_failures = []
        warnings = []
        successes = []
        
        for test_name, success, details in self.test_results:
            if not success:
                if "0 listings" in details or "Status 500" in details:
                    critical_failures.append((test_name, details))
                else:
                    warnings.append((test_name, details))
            else:
                successes.append((test_name, details))
        
        # Print critical failures first
        if critical_failures:
            logger.info("\n🚨 CRITICAL ISSUES FOUND:")
            for test_name, details in critical_failures:
                logger.info(f"   ❌ {test_name}: {details}")
        
        # Print warnings
        if warnings:
            logger.info("\n⚠️ WARNINGS:")
            for test_name, details in warnings:
                logger.info(f"   ⚠️ {test_name}: {details}")
        
        # Print successes
        if successes:
            logger.info("\n✅ WORKING COMPONENTS:")
            for test_name, details in successes:
                logger.info(f"   ✅ {test_name}: {details}")
        
        # Analysis and recommendations
        logger.info("\n🔍 ROOT CAUSE ANALYSIS:")
        
        # Check if main endpoint returns listings
        main_endpoint_working = any("Main Listings Endpoint" in test_name and success for test_name, success, _ in self.test_results)
        exotic_filter_issue = any("exotic" in details.lower() and "0 listings" in details for _, success, details in self.test_results if not success)
        
        if not main_endpoint_working:
            logger.info("   🎯 PRIMARY ISSUE: Main /api/listings endpoint not returning listings")
            logger.info("   💡 RECOMMENDATION: Check backend listing query logic and database data")
        elif exotic_filter_issue:
            logger.info("   🎯 PRIMARY ISSUE: Exotic filtering logic filtering out all listings")
            logger.info("   💡 RECOMMENDATION: Fix exotic filtering default behavior")
        else:
            logger.info("   🎯 ISSUE: Frontend-backend integration problem")
            logger.info("   💡 RECOMMENDATION: Check frontend API call parameters and response handling")
        
        logger.info("\n🛠️ IMMEDIATE ACTION ITEMS:")
        logger.info("   1. Verify database has listing records with status='active'")
        logger.info("   2. Check exotic filtering logic in backend")
        logger.info("   3. Verify frontend API call parameters match backend expectations")
        logger.info("   4. Test with exact frontend request parameters")
        logger.info("   5. Check for any caching issues")
        
        logger.info("="*80)

async def main():
    """Main investigation runner"""
    investigator = MarketplaceListingsInvestigator()
    await investigator.run_comprehensive_investigation()

if __name__ == "__main__":
    asyncio.run(main())