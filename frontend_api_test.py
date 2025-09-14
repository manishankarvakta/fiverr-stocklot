#!/usr/bin/env python3
"""
🔍 FRONTEND API CALL SIMULATION
Test the exact API call that the frontend is making to understand the response structure
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FrontendAPITester:
    """Test the exact API calls that frontend makes"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def test_frontend_api_calls(self):
        """Test the exact API calls that frontend makes"""
        logger.info("🔍 Testing Frontend API Calls...")
        
        # Test 1: Basic listings call (no parameters)
        logger.info("\n1. Testing basic /api/listings call (no parameters):")
        try:
            async with self.session.get(f"{self.api_url}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"   Status: {response.status}")
                    logger.info(f"   Response type: {type(data)}")
                    logger.info(f"   Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                    
                    if isinstance(data, dict):
                        if 'listings' in data:
                            listings = data['listings']
                            logger.info(f"   Listings count: {len(listings)}")
                            logger.info(f"   Listings type: {type(listings)}")
                        else:
                            logger.info(f"   No 'listings' key found")
                    elif isinstance(data, list):
                        logger.info(f"   Direct array with {len(data)} items")
                    
                    # Show first item structure
                    if isinstance(data, dict) and 'listings' in data and data['listings']:
                        first_item = data['listings'][0]
                        logger.info(f"   First listing keys: {list(first_item.keys())}")
                    elif isinstance(data, list) and data:
                        first_item = data[0]
                        logger.info(f"   First item keys: {list(first_item.keys())}")
                        
                else:
                    logger.error(f"   Failed: {response.status}")
        except Exception as e:
            logger.error(f"   Error: {e}")
        
        # Test 2: With include_exotics=false (frontend default)
        logger.info("\n2. Testing /api/listings?include_exotics=false:")
        try:
            async with self.session.get(f"{self.api_url}/listings?include_exotics=false") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"   Status: {response.status}")
                    
                    if isinstance(data, dict) and 'listings' in data:
                        listings_count = len(data['listings'])
                    elif isinstance(data, list):
                        listings_count = len(data)
                    else:
                        listings_count = 0
                        
                    logger.info(f"   Listings count: {listings_count}")
                    
                    if listings_count == 0:
                        logger.error("   🚨 CRITICAL: include_exotics=false returns 0 listings!")
                    else:
                        logger.info("   ✅ include_exotics=false returns listings")
                        
                else:
                    logger.error(f"   Failed: {response.status}")
        except Exception as e:
            logger.error(f"   Error: {e}")
        
        # Test 3: With include_exotics=true
        logger.info("\n3. Testing /api/listings?include_exotics=true:")
        try:
            async with self.session.get(f"{self.api_url}/listings?include_exotics=true") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, dict) and 'listings' in data:
                        listings_count = len(data['listings'])
                    elif isinstance(data, list):
                        listings_count = len(data)
                    else:
                        listings_count = 0
                        
                    logger.info(f"   Listings count: {listings_count}")
                    
                else:
                    logger.error(f"   Failed: {response.status}")
        except Exception as e:
            logger.error(f"   Error: {e}")
        
        # Test 4: Simulate exact frontend call with all default parameters
        logger.info("\n4. Testing exact frontend call simulation:")
        try:
            # This simulates the exact call the frontend makes
            params = "include_exotics=false"  # Frontend default
            
            async with self.session.get(f"{self.api_url}/listings?{params}") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"   Status: {response.status}")
                    logger.info(f"   Full response structure:")
                    logger.info(f"   {json.dumps(data, indent=2, default=str)[:500]}...")
                    
                    # Check what frontend parsing would do
                    if isinstance(data, list):
                        listingsArray = data
                    elif isinstance(data, dict):
                        listingsArray = data.get('listings') or data.get('data') or []
                    else:
                        listingsArray = []
                    
                    logger.info(f"   Frontend would parse: {len(listingsArray)} listings")
                    
                    if len(listingsArray) == 0:
                        logger.error("   🚨 FRONTEND PARSING ISSUE: Would result in 0 listings!")
                    else:
                        logger.info("   ✅ Frontend parsing would work correctly")
                        
                else:
                    logger.error(f"   Failed: {response.status}")
        except Exception as e:
            logger.error(f"   Error: {e}")
        
        # Test 5: Check taxonomy endpoints that frontend uses
        logger.info("\n5. Testing taxonomy endpoints:")
        
        taxonomy_endpoints = [
            "/api/taxonomy/categories?mode=core",
            "/api/category-groups",
            "/api/species",
            "/api/product-types"
        ]
        
        for endpoint in taxonomy_endpoints:
            try:
                async with self.session.get(f"{self.base_url}{endpoint}") as response:
                    if response.status == 200:
                        data = await response.json()
                        if isinstance(data, list):
                            count = len(data)
                        elif isinstance(data, dict):
                            # Try to find the main data array
                            for key in ['category_groups', 'species', 'product_types', 'categories']:
                                if key in data:
                                    count = len(data[key])
                                    break
                            else:
                                count = len(data)
                        else:
                            count = 0
                        logger.info(f"   {endpoint}: {count} items")
                    else:
                        logger.error(f"   {endpoint}: Failed {response.status}")
            except Exception as e:
                logger.error(f"   {endpoint}: Error {e}")
    
    async def run_test(self):
        """Run the frontend API test"""
        logger.info("🔍 Starting Frontend API Call Investigation...")
        
        await self.setup_session()
        
        try:
            await self.test_frontend_api_calls()
        finally:
            await self.cleanup_session()
        
        logger.info("\n" + "="*60)
        logger.info("🔍 FRONTEND API INVESTIGATION COMPLETE")
        logger.info("="*60)

async def main():
    """Main test runner"""
    tester = FrontendAPITester()
    await tester.run_test()

if __name__ == "__main__":
    asyncio.run(main())