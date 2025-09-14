#!/usr/bin/env python3
"""
Test direct Paystack integration
"""

import asyncio
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_paystack_direct():
    """Test direct Paystack endpoint"""
    
    # Test data for Paystack
    paystack_data = {
        "email": "test@example.com",
        "amount": 8575,  # R85.75 in cents
        "currency": "ZAR",
        "callback_url": "https://farmstock-hub-1.preview.emergentagent.com/payment/callback",
        "metadata": {
            "order_group_id": "test-order-123",
            "customer_name": "Test User"
        }
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                "https://farmstock-hub-1.preview.emergentagent.com/api/payments/paystack/init",
                json=paystack_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_text = await response.text()
                logger.info(f"Status: {response.status}")
                logger.info(f"Response: {response_text}")
                
                if response.status == 200:
                    data = json.loads(response_text)
                    logger.info("✅ PAYSTACK DIRECT SUCCESS!")
                    logger.info(f"Authorization URL: {data.get('authorization_url')}")
                    logger.info(f"Reference: {data.get('reference')}")
                    
                    # Check if it's a real Paystack URL
                    auth_url = data.get('authorization_url', '')
                    if 'paystack.com' in auth_url:
                        logger.info("✅ Real Paystack URL detected")
                    else:
                        logger.warning("⚠️ Not a real Paystack URL - might be demo mode")
                else:
                    logger.error(f"❌ PAYSTACK FAILED: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_paystack_direct())