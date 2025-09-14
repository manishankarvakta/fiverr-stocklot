#!/usr/bin/env python3
"""
Test real Paystack API directly
"""

import asyncio
import aiohttp
import json
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_paystack_real():
    """Test real Paystack API directly"""
    
    # Get the secret key from environment
    secret_key = "sk_live_789af0d78f221aac89cfd15e4c5c2a539d30df57"
    
    # Test data for Paystack
    payload = {
        "email": "test@example.com",
        "amount": 8575,  # R85.75 in cents (kobo)
        "currency": "ZAR",
        "reference": f"STOCKLOT_test_12345",
        "callback_url": "https://farmstock-hub-1.preview.emergentagent.com/payment/callback",
        "metadata": {
            "order_id": "test-order-123",
            "platform": "stocklot_livestock"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                "https://api.paystack.co/transaction/initialize",
                json=payload,
                headers=headers
            ) as response:
                response_text = await response.text()
                logger.info(f"Status: {response.status}")
                logger.info(f"Response: {response_text}")
                
                if response.status == 200:
                    data = json.loads(response_text)
                    if data.get("status"):
                        logger.info("✅ REAL PAYSTACK API SUCCESS!")
                        logger.info(f"Authorization URL: {data['data']['authorization_url']}")
                        logger.info(f"Reference: {data['data']['reference']}")
                        logger.info(f"Access Code: {data['data']['access_code']}")
                        
                        # Check if it's a real Paystack URL
                        auth_url = data['data']['authorization_url']
                        if 'paystack.com' in auth_url:
                            logger.info("✅ Real Paystack URL confirmed")
                        else:
                            logger.warning("⚠️ Unexpected URL format")
                    else:
                        logger.error(f"❌ Paystack returned error: {data.get('message')}")
                else:
                    logger.error(f"❌ HTTP ERROR: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_paystack_real())