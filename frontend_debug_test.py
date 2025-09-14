#!/usr/bin/env python3
"""
🔍 FRONTEND DEBUG TEST
Test the exact frontend behavior by simulating the JavaScript logic
"""

import asyncio
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FrontendDebugger:
    """Debug the frontend behavior"""
    
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
    
    async def simulate_frontend_fetchListings(self):
        """Simulate the exact frontend fetchListings function"""
        logger.info("🔍 Simulating Frontend fetchListings Function...")
        
        # Simulate the frontend filters (default state)
        filters = {
            'category_group_id': '',
            'species_id': '',
            'breed_id': '',
            'product_type_id': '',
            'province': '',
            'price_min': '',
            'price_max': '',
            'listing_type': 'all',
            'include_exotics': False  # This is the key - frontend defaults to False
        }
        
        deliverableOnly = False
        
        # Build params exactly like frontend does
        params = []
        if filters['category_group_id']:
            params.append(f"category_group_id={filters['category_group_id']}")
        if filters['species_id']:
            params.append(f"species_id={filters['species_id']}")
        if filters['breed_id']:
            params.append(f"breed_id={filters['breed_id']}")
        if filters['product_type_id']:
            params.append(f"product_type_id={filters['product_type_id']}")
        if filters['province']:
            params.append(f"region={filters['province']}")
        if filters['price_min']:
            params.append(f"price_min={filters['price_min']}")
        if filters['price_max']:
            params.append(f"price_max={filters['price_max']}")
        if filters['listing_type'] and filters['listing_type'] != 'all':
            params.append(f"listing_type={filters['listing_type']}")
        
        # CORE/EXOTIC FILTERING - This is the key change!
        params.append(f"include_exotics={str(filters['include_exotics']).lower()}")
        
        if deliverableOnly:
            params.append("deliverable_only=true")
        
        params_string = "&".join(params)
        url = f"{self.api_url}/listings?{params_string}"
        
        logger.info(f"Frontend would call: {url}")
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    response_data = await response.json()
                    
                    logger.info(f"Response status: {response.status}")
                    logger.info(f"Response type: {type(response_data)}")
                    
                    # Simulate frontend parsing logic
                    if isinstance(response_data, list):
                        listingsArray = response_data
                    else:
                        listingsArray = response_data.get('listings') or response_data.get('data') or []
                    
                    logger.info(f"Frontend parsing result: {len(listingsArray)} listings")
                    
                    if len(listingsArray) == 0:
                        logger.error("🚨 FRONTEND WOULD SHOW: 'No livestock found'")
                        logger.error("🚨 This explains why users see 0 listings!")
                    else:
                        logger.info("✅ Frontend would show listings correctly")
                        
                    # Show the actual response structure
                    logger.info("Response structure:")
                    logger.info(json.dumps(response_data, indent=2, default=str)[:1000] + "...")
                    
                    return listingsArray
                    
                else:
                    logger.error(f"API call failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error in API call: {e}")
            return []
    
    async def test_different_exotic_values(self):
        """Test different include_exotics values"""
        logger.info("\n🔍 Testing Different include_exotics Values...")
        
        test_cases = [
            ("Default (no param)", ""),
            ("include_exotics=false", "include_exotics=false"),
            ("include_exotics=true", "include_exotics=true"),
            ("include_exotics=False", "include_exotics=False"),
            ("include_exotics=True", "include_exotics=True"),
        ]
        
        for name, param in test_cases:
            url = f"{self.api_url}/listings"
            if param:
                url += f"?{param}"
                
            try:
                async with self.session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if isinstance(data, dict) and 'listings' in data:
                            count = len(data['listings'])
                        elif isinstance(data, list):
                            count = len(data)
                        else:
                            count = 0
                        
                        logger.info(f"   {name}: {count} listings")
                        
                        if count == 0:
                            logger.error(f"   🚨 {name} returns 0 listings - PROBLEM!")
                        
                    else:
                        logger.error(f"   {name}: Failed {response.status}")
                        
            except Exception as e:
                logger.error(f"   {name}: Error {e}")
    
    async def run_debug(self):
        """Run the debug test"""
        logger.info("🔍 Starting Frontend Debug Investigation...")
        
        await self.setup_session()
        
        try:
            await self.simulate_frontend_fetchListings()
            await self.test_different_exotic_values()
        finally:
            await self.cleanup_session()
        
        logger.info("\n" + "="*60)
        logger.info("🔍 FRONTEND DEBUG INVESTIGATION COMPLETE")
        logger.info("="*60)

async def main():
    """Main debug runner"""
    debugger = FrontendDebugger()
    await debugger.run_debug()

if __name__ == "__main__":
    asyncio.run(main())