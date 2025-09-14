#!/usr/bin/env python3
"""
Test Multiple Mailgun Domains
Tests the API key with different potential domains
"""

import os
import asyncio
import aiohttp
from datetime import datetime

MAILGUN_API_KEY = "c6bcf50f6059adff4bfbd10a2e98f9d2-1ae02a08-912e425d"
POTENTIAL_DOMAINS = [
    "stocklot.farm",
    "mg.stocklot.farm", 
    "mail.stocklot.farm",
    "sandbox-123.mailgun.org",  # Default sandbox
]

async def test_mailgun_domains():
    """Test the API key with different domains"""
    
    print(f"🔍 TESTING MAILGUN API KEY WITH MULTIPLE DOMAINS")
    print(f"🔑 API Key: {MAILGUN_API_KEY[:20]}...")
    print(f"⏰ Started at: {datetime.now()}")
    print("=" * 70)
    
    for domain in POTENTIAL_DOMAINS:
        print(f"\n🧪 Testing domain: {domain}")
        
        try:
            # Simple validation request to check domain access
            mailgun_url = f"https://api.mailgun.net/v3/{domain}/stats/total"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    mailgun_url,
                    auth=aiohttp.BasicAuth('api', MAILGUN_API_KEY)
                ) as response:
                    
                    if response.status == 200:
                        print(f"✅ {domain}: Valid domain and API key!")
                        data = await response.json()
                        print(f"   Stats available: {list(data.keys())}")
                        
                        # Try sending a test email
                        await send_test_email(domain, "stocklot65@gmail.com")
                        return domain
                        
                    elif response.status == 401:
                        print(f"❌ {domain}: Invalid API key or unauthorized")
                        
                    elif response.status == 404:
                        print(f"❌ {domain}: Domain not found")
                        
                    else:
                        error_text = await response.text()
                        print(f"❌ {domain}: HTTP {response.status} - {error_text}")
        
        except Exception as e:
            print(f"❌ {domain}: Exception - {str(e)}")
    
    print(f"\n❌ No valid domain found for the provided API key")
    return None

async def send_test_email(domain, recipient):
    """Send a test email using the validated domain"""
    
    print(f"\n📧 Sending test email via {domain}...")
    
    try:
        data = {
            'from': f'StockLot Test <noreply@{domain}>',
            'to': recipient,
            'subject': '[TEST SUCCESS] Mailgun Integration Working!',
            'text': f'Great news! The Mailgun integration is working with domain: {domain}',
            'html': f'''
            <h2>🎉 Mailgun Integration Success!</h2>
            <p>The email system is now working correctly with domain: <strong>{domain}</strong></p>
            <p>This confirms that all 65 email templates can now be sent to users.</p>
            <p>Best regards,<br>StockLot Email System</p>
            ''',
            'o:tag': ['test', 'integration-success'],
            'o:testmode': 'no'
        }
        
        mailgun_url = f"https://api.mailgun.net/v3/{domain}/messages"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                mailgun_url,
                auth=aiohttp.BasicAuth('api', MAILGUN_API_KEY),
                data=data
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Test email sent successfully!")
                    print(f"   Message ID: {result.get('id', 'N/A')}")
                    print(f"   Check {recipient} for the test email!")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to send test email: {response.status} - {error_text}")
                    return False
    
    except Exception as e:
        print(f"❌ Error sending test email: {str(e)}")
        return False

if __name__ == "__main__":
    valid_domain = asyncio.run(test_mailgun_domains())
    if valid_domain:
        print(f"\n🎉 SUCCESS! Use domain: {valid_domain}")
        print(f"💡 Update your .env file with MAILGUN_DOMAIN={valid_domain}")
    else:
        print(f"\n❌ FAILED! Check your Mailgun API key and domain configuration")
    
    exit(0 if valid_domain else 1)