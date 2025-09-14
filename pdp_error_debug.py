#!/usr/bin/env python3
"""
🔍 PDP ERROR DEBUGGING
Debug the specific listing causing 500 errors
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

class PDPErrorDebugger:
    """Debug specific PDP errors"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        
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
    
    async def debug_specific_listing(self, listing_id: str):
        """Debug a specific listing that's causing errors"""
        logger.info(f"\n🔍 DEBUGGING LISTING: {listing_id}")
        logger.info("="*60)
        
        # First, check if the listing exists in the basic listings endpoint
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{listing_id}",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    listing_data = await response.json()
                    logger.info("✅ Listing exists in basic endpoint")
                    logger.info(f"   Title: {listing_data.get('title')}")
                    logger.info(f"   Seller ID: {listing_data.get('seller_id')}")
                    logger.info(f"   Status: {listing_data.get('status')}")
                    logger.info(f"   Species: {listing_data.get('species')}")
                    logger.info(f"   Breed: {listing_data.get('breed')}")
                    logger.info(f"   Images: {listing_data.get('images')}")
                    
                    # Check for problematic fields
                    problematic_fields = []
                    
                    # Check species field
                    species = listing_data.get('species')
                    if isinstance(species, str):
                        logger.info(f"   ⚠️ Species is string: '{species}' (should be object?)")
                        problematic_fields.append(f"species: {species}")
                    
                    # Check breed field
                    breed = listing_data.get('breed')
                    if isinstance(breed, str):
                        logger.info(f"   ⚠️ Breed is string: '{breed}' (should be object?)")
                        problematic_fields.append(f"breed: {breed}")
                    
                    # Check images field
                    images = listing_data.get('images')
                    if images:
                        logger.info(f"   Images type: {type(images)}")
                        if isinstance(images, list) and images:
                            first_image = images[0]
                            logger.info(f"   First image type: {type(first_image)}")
                            logger.info(f"   First image: {first_image}")
                            if isinstance(first_image, str):
                                logger.info("   ⚠️ Image is string (should be object with url field?)")
                                problematic_fields.append(f"images[0]: {first_image}")
                    
                    if problematic_fields:
                        logger.warning(f"   🚨 POTENTIAL ISSUES FOUND:")
                        for issue in problematic_fields:
                            logger.warning(f"      - {issue}")
                    
                    return listing_data
                    
                elif response.status == 404:
                    logger.error("❌ Listing not found in basic endpoint")
                    return None
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Basic listing query failed: {response.status} - {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error getting basic listing: {e}")
            return None
    
    async def test_pdp_with_debug(self, listing_id: str):
        """Test PDP endpoint with detailed debugging"""
        logger.info(f"\n🔍 TESTING PDP ENDPOINT: {listing_id}")
        logger.info("="*60)
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{listing_id}/pdp",
                headers=self.get_headers()
            ) as response:
                logger.info(f"   Response Status: {response.status}")
                
                if response.status == 200:
                    try:
                        pdp_data = await response.json()
                        logger.info("✅ PDP endpoint successful")
                        logger.info(f"   Title: {pdp_data.get('title')}")
                        logger.info(f"   Price: R{pdp_data.get('price')}")
                        logger.info(f"   Seller: {pdp_data.get('seller', {}).get('name')}")
                        return True
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ JSON decode error: {e}")
                        response_text = await response.text()
                        logger.error(f"   Raw response: {response_text[:500]}")
                        return False
                
                elif response.status == 500:
                    error_text = await response.text()
                    logger.error(f"❌ 500 Internal Server Error")
                    logger.error(f"   Error response: {error_text}")
                    
                    # This is the problematic listing - let's analyze what might be wrong
                    logger.info("\n🔍 ANALYZING 500 ERROR...")
                    logger.info("   Based on backend logs: 'str' object has no attribute 'get'")
                    logger.info("   This suggests the PDP endpoint is trying to call .get() on a string")
                    logger.info("   Common causes:")
                    logger.info("   1. Species field is string instead of object")
                    logger.info("   2. Breed field is string instead of object") 
                    logger.info("   3. Images field contains strings instead of objects")
                    logger.info("   4. Seller data is malformed")
                    
                    return False
                
                else:
                    error_text = await response.text()
                    logger.error(f"❌ PDP endpoint error: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Exception testing PDP: {e}")
            return False
    
    async def run_debug_session(self):
        """Run debugging session"""
        logger.info("🚀 Starting PDP Error Debugging Session...")
        logger.info("="*80)
        
        await self.setup_session()
        
        try:
            # Authenticate
            if not await self.authenticate():
                logger.error("❌ Authentication failed")
                return
            
            # The problematic listing ID from the test results
            problematic_listing_id = "21859c3c-a366-4a0d-bd66-9f3c272863be"
            
            # Debug the specific listing
            listing_data = await self.debug_specific_listing(problematic_listing_id)
            
            if listing_data:
                # Test PDP endpoint
                await self.test_pdp_with_debug(problematic_listing_id)
            
            # Also test a working listing for comparison
            logger.info("\n" + "="*60)
            logger.info("🔍 COMPARISON: Testing a working listing")
            working_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"
            
            working_data = await self.debug_specific_listing(working_listing_id)
            if working_data:
                await self.test_pdp_with_debug(working_listing_id)
            
        finally:
            await self.cleanup_session()
        
        logger.info("\n" + "="*80)
        logger.info("🎯 DEBUGGING SUMMARY")
        logger.info("="*80)
        logger.info("The PDP endpoint has a data structure issue with specific listings.")
        logger.info("The error 'str' object has no attribute 'get' suggests that the")
        logger.info("backend code is expecting an object but receiving a string.")
        logger.info("This is likely in the species/breed lookup or image processing.")
        logger.info("="*80)

async def main():
    """Main debug runner"""
    debugger = PDPErrorDebugger()
    await debugger.run_debug_session()

if __name__ == "__main__":
    asyncio.run(main())