#!/usr/bin/env python3
"""
Check actual PDP response structure
"""

import asyncio
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_pdp_response():
    """Check actual PDP response"""
    
    base_url = "https://farmstock-hub-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    async with aiohttp.ClientSession() as session:
        # Authenticate
        auth_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        async with session.post(f"{api_url}/auth/login", json=auth_data) as response:
            if response.status == 200:
                data = await response.json()
                auth_token = data.get("token") or auth_data["email"]
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {auth_token}"
                }
                
                # Get a real listing ID
                async with session.get(f"{api_url}/listings", headers=headers) as response:
                    if response.status == 200:
                        listings_data = await response.json()
                        listings = listings_data.get("listings", [])
                        if listings:
                            test_id = listings[0]["id"]
                            logger.info(f"Testing PDP with listing ID: {test_id}")
                            
                            # Test PDP endpoint
                            async with session.get(f"{api_url}/listings/{test_id}/pdp", headers=headers) as response:
                                if response.status == 200:
                                    pdp_data = await response.json()
                                    logger.info("PDP Response structure:")
                                    logger.info(f"Top-level keys: {list(pdp_data.keys())}")
                                    
                                    # Print first few fields for inspection
                                    for key, value in list(pdp_data.items())[:10]:
                                        if isinstance(value, dict):
                                            logger.info(f"  {key}: dict with keys {list(value.keys())}")
                                        elif isinstance(value, list):
                                            logger.info(f"  {key}: list with {len(value)} items")
                                        else:
                                            logger.info(f"  {key}: {type(value).__name__} = {value}")
                                    
                                    # Check if it has the expected structure
                                    if "id" in pdp_data and "title" in pdp_data:
                                        logger.info("✅ PDP response has listing data at top level")
                                    else:
                                        logger.error("❌ PDP response missing basic listing fields")
                                        
                                else:
                                    error_text = await response.text()
                                    logger.error(f"PDP request failed: {response.status} - {error_text}")
                        else:
                            logger.error("No listings found")
                    else:
                        logger.error("Failed to get listings")
            else:
                logger.error("Authentication failed")

if __name__ == "__main__":
    asyncio.run(check_pdp_response())