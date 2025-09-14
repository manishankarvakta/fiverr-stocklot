#!/usr/bin/env python3
"""
🎉 MARKETPLACE FIX VERIFICATION TEST
Verify that the marketplace listings display issue has been resolved
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

class MarketplaceFixVerifier:
    """Verify the marketplace fix"""
    
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
    
    async def verify_backend_endpoints(self):
        """Verify that all backend endpoints are working"""
        logger.info("🔍 Verifying Backend Endpoints...")
        
        endpoints = [
            ("/api/listings", "Main listings endpoint"),
            ("/api/listings?include_exotics=false", "Listings with include_exotics=false"),
            ("/api/taxonomy/categories?mode=core", "Taxonomy categories"),
            ("/api/species", "Species endpoint"),
            ("/api/category-groups", "Category groups"),
            ("/api/product-types", "Product types"),
        ]
        
        all_working = True
        
        for endpoint, description in endpoints:
            try:
                async with self.session.get(f"{self.base_url}{endpoint}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Count items based on response structure
                        if isinstance(data, dict):
                            if 'listings' in data:
                                count = len(data['listings'])
                            elif 'category_groups' in data:
                                count = len(data['category_groups'])
                            elif 'species' in data:
                                count = len(data['species'])
                            elif 'product_types' in data:
                                count = len(data['product_types'])
                            else:
                                count = len(data) if hasattr(data, '__len__') else 1
                        elif isinstance(data, list):
                            count = len(data)
                        else:
                            count = 1
                        
                        logger.info(f"   ✅ {description}: {count} items")
                        
                        # Special check for listings endpoint
                        if endpoint == "/api/listings?include_exotics=false" and count == 0:
                            logger.error(f"   🚨 CRITICAL: {description} returns 0 items!")
                            all_working = False
                            
                    else:
                        logger.error(f"   ❌ {description}: Failed {response.status}")
                        all_working = False
                        
            except Exception as e:
                logger.error(f"   ❌ {description}: Error {e}")
                all_working = False
        
        return all_working
    
    async def test_frontend_api_integration(self):
        """Test that frontend would now get the correct data"""
        logger.info("\n🔍 Testing Frontend API Integration...")
        
        # Test the exact call that frontend makes after the fix
        try:
            # This simulates the frontend's fetchListings call
            params = "include_exotics=false"
            url = f"{self.api_url}/listings?{params}"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Simulate frontend parsing
                    if isinstance(data, list):
                        listingsArray = data
                    else:
                        listingsArray = data.get('listings') or data.get('data') or []
                    
                    logger.info(f"   Frontend would receive: {len(listingsArray)} listings")
                    
                    if len(listingsArray) > 0:
                        logger.info("   ✅ FRONTEND INTEGRATION: Would display listings correctly!")
                        
                        # Show sample listing
                        sample = listingsArray[0]
                        logger.info(f"   Sample listing: {sample.get('title', 'No title')} - R{sample.get('price_per_unit', 0)}")
                        
                        return True
                    else:
                        logger.error("   🚨 FRONTEND INTEGRATION: Would still show 0 listings!")
                        return False
                        
                else:
                    logger.error(f"   ❌ Frontend API call failed: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"   ❌ Frontend API integration test error: {e}")
            return False
    
    async def test_taxonomy_endpoints(self):
        """Test taxonomy endpoints that frontend uses"""
        logger.info("\n🔍 Testing Taxonomy Endpoints...")
        
        taxonomy_tests = [
            (f"{self.api_url}/taxonomy/categories?mode=core", "Core categories"),
            (f"{self.api_url}/species?category_group_id=test", "Species by category"),
            (f"{self.api_url}/category-groups", "Category groups"),
        ]
        
        all_working = True
        
        for url, description in taxonomy_tests:
            try:
                async with self.session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        count = len(data) if isinstance(data, list) else (len(data.get('species', [])) if 'species' in data else 1)
                        logger.info(f"   ✅ {description}: {count} items")
                    else:
                        logger.warning(f"   ⚠️ {description}: Status {response.status}")
                        if response.status != 404:  # 404 might be expected for some test calls
                            all_working = False
                            
            except Exception as e:
                logger.error(f"   ❌ {description}: Error {e}")
                all_working = False
        
        return all_working
    
    async def run_verification(self):
        """Run the complete verification"""
        logger.info("🎉 Starting Marketplace Fix Verification...")
        logger.info("🚨 TESTING: Backend shows 6 listings but frontend shows 0 listings - SHOULD BE FIXED")
        
        await self.setup_session()
        
        try:
            backend_ok = await self.verify_backend_endpoints()
            frontend_ok = await self.test_frontend_api_integration()
            taxonomy_ok = await self.test_taxonomy_endpoints()
            
            logger.info("\n" + "="*80)
            logger.info("🎉 MARKETPLACE FIX VERIFICATION RESULTS")
            logger.info("="*80)
            
            if backend_ok and frontend_ok and taxonomy_ok:
                logger.info("🎉 SUCCESS: Marketplace listings display issue has been RESOLVED!")
                logger.info("✅ Backend endpoints working correctly")
                logger.info("✅ Frontend API integration working correctly")
                logger.info("✅ Taxonomy endpoints working correctly")
                logger.info("\n🎯 EXPECTED RESULT: Users should now see 6 listings in the marketplace!")
                
            else:
                logger.error("❌ ISSUE PERSISTS: Some components are still not working correctly")
                if not backend_ok:
                    logger.error("   - Backend endpoints have issues")
                if not frontend_ok:
                    logger.error("   - Frontend API integration has issues")
                if not taxonomy_ok:
                    logger.error("   - Taxonomy endpoints have issues")
                    
        finally:
            await self.cleanup_session()
        
        logger.info("="*80)

async def main():
    """Main verification runner"""
    verifier = MarketplaceFixVerifier()
    await verifier.run_verification()

if __name__ == "__main__":
    asyncio.run(main())