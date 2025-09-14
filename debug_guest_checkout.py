#!/usr/bin/env python3
"""
Debug script for guest checkout endpoint
"""

import asyncio
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_guest_checkout():
    """Test guest checkout with minimal data"""
    
    # Simplified test data
    guest_checkout_data = {
        "contact": {
            "email": "debug@example.com",
            "phone": "+27123456789",
            "full_name": "Debug User"
        },
        "ship_to": {
            "street_address": "123 Debug Street",
            "city": "Cape Town",
            "province": "Western Cape",
            "postal_code": "8000"
        },
        "items": [
            {
                "listing_id": "debug-listing-1",
                "qty": 1,
                "species": "chickens",
                "product_type": "commercial",
                "line_total": 50.00
            }
        ],
        "quote": {
            "sellers": [
                {
                    "seller_id": "debug-seller",
                    "subtotal": 50.00,
                    "delivery": 10.00,
                    "items": [
                        {
                            "listing_id": "debug-listing-1",
                            "title": "Debug Chickens",
                            "qty": 1,
                            "price": 50.00,
                            "line_total": 50.00,
                            "species": "chickens",
                            "product_type": "commercial",
                            "unit": "head"
                        }
                    ]
                }
            ],
            "summary": {
                "subtotal": 50.00,
                "delivery_total": 10.00,
                "buyer_processing_fee": 0.75,
                "escrow_service_fee": 25.00,
                "grand_total": 85.75,
                "currency": "ZAR"
            }
        }
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                "https://farmstock-hub-1.preview.emergentagent.com/api/checkout/guest/create",
                json=guest_checkout_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_text = await response.text()
                logger.info(f"Status: {response.status}")
                logger.info(f"Response: {response_text}")
                
                if response.status == 200:
                    data = json.loads(response_text)
                    logger.info("✅ SUCCESS!")
                    logger.info(f"Order Group ID: {data.get('order_group_id')}")
                    logger.info(f"Order Count: {data.get('order_count')}")
                    logger.info(f"Authorization URL: {data.get('paystack', {}).get('authorization_url')}")
                else:
                    logger.error(f"❌ FAILED: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_guest_checkout())