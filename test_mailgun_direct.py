#!/usr/bin/env python3
"""
Direct Mailgun Test with API Key
Tests Mailgun integration directly to stocklot65@gmail.com
"""

import os
import asyncio
import aiohttp
from datetime import datetime

# Set Mailgun credentials directly
MAILGUN_API_KEY = "c6bcf50f6059adff4bfbd10a2e98f9d2-1ae02a08-912e425d"
MAILGUN_DOMAIN = "e.stocklot.farm"
MAILGUN_BASE_URL = f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}"

async def test_mailgun_direct():
    """Test Mailgun API directly"""
    
    test_email = "stocklot65@gmail.com"
    print(f"📧 TESTING MAILGUN DIRECT INTEGRATION")
    print(f"🎯 Target: {test_email}")
    print(f"🔑 Domain: {MAILGUN_DOMAIN}")
    print(f"⏰ Started at: {datetime.now()}")
    print("=" * 60)
    
    # Test emails data
    test_emails = [
        {
            "subject": "[TEST E01] Welcome to StockLot - Verify Your Email",
            "text": "Welcome to StockLot! Please verify your email by clicking: https://stocklot.farm/verify?token=TEST123",
            "html": """
            <h2>Welcome to StockLot!</h2>
            <p>Thank you for joining South Africa's premier livestock marketplace.</p>
            <p><a href="https://stocklot.farm/verify?token=TEST123" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">Verify Email</a></p>
            <p>Best regards,<br>The StockLot Team</p>
            """
        },
        {
            "subject": "[TEST E27] Order Created - Premium Angus Cattle",
            "text": "Your order ORD-TEST-12345 for R30,000 has been created. Complete payment: https://stocklot.farm/checkout/TEST123",
            "html": """
            <h2>Order Created Successfully</h2>
            <p><strong>Order:</strong> ORD-TEST-12345</p>
            <p><strong>Amount:</strong> R30,000.00</p>
            <p><strong>Items:</strong> 2x Premium Angus Cattle</p>
            <p><a href="https://stocklot.farm/checkout/TEST123" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none;">Complete Payment</a></p>
            """
        },
        {
            "subject": "[TEST E15] Listing Submitted for Review",
            "text": "Your listing 'Premium Angus Cattle' has been submitted and is under review. View: https://stocklot.farm/listing/TEST123",
            "html": """
            <h2>Listing Submitted</h2>
            <p>Your listing <strong>Premium Angus Cattle</strong> has been submitted for review.</p>
            <p>We'll notify you once it's approved and live on the marketplace.</p>
            <p><a href="https://stocklot.farm/listing/TEST123">View Listing</a></p>
            """
        }
    ]
    
    success_count = 0
    
    try:
        async with aiohttp.ClientSession() as session:
            for i, email_data in enumerate(test_emails, 1):
                try:
                    # Prepare Mailgun request
                    data = {
                        'from': f'StockLot Testing <testing@{MAILGUN_DOMAIN}>',
                        'to': test_email,
                        'subject': email_data['subject'],
                        'text': email_data['text'],
                        'html': email_data['html'],
                        'o:tag': ['test', f'template-test-{i}'],
                        'o:testmode': 'no'  # Set to 'yes' for testing without sending
                    }
                    
                    # Send via Mailgun API
                    async with session.post(
                        f"{MAILGUN_BASE_URL}/messages",
                        auth=aiohttp.BasicAuth('api', MAILGUN_API_KEY),
                        data=data
                    ) as response:
                        
                        if response.status == 200:
                            result = await response.json()
                            print(f"✅ Email {i}: {email_data['subject']}")
                            print(f"   Message ID: {result.get('id', 'N/A')}")
                            success_count += 1
                        else:
                            error_text = await response.text()
                            print(f"❌ Email {i}: Failed (HTTP {response.status})")
                            print(f"   Error: {error_text}")
                
                except Exception as e:
                    print(f"❌ Email {i}: Exception - {str(e)}")
                
                # Small delay between emails
                await asyncio.sleep(1)
    
    except Exception as e:
        print(f"❌ Session error: {str(e)}")
    
    print("=" * 60)
    print(f"📊 RESULTS:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ❌ Failed: {len(test_emails) - success_count}")
    print(f"   📧 Total: {len(test_emails)}")
    print(f"   🎯 Success Rate: {(success_count/len(test_emails)*100):.1f}%")
    print(f"⏰ Completed at: {datetime.now()}")
    
    if success_count > 0:
        print(f"\n📩 SUCCESS! Check {test_email} for {success_count} test emails!")
        print(f"🏷️  All emails prefixed with [TEST] for easy identification")
        print(f"📧 Look for emails from testing@{MAILGUN_DOMAIN}")
    
    return success_count > 0

if __name__ == "__main__":
    result = asyncio.run(test_mailgun_direct())
    print(f"\n🎉 Mailgun testing {'SUCCESSFUL' if result else 'FAILED'}!")
    exit(0 if result else 1)