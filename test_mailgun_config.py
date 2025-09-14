#!/usr/bin/env python3
"""
Test Mailgun configuration and implement fixes
"""

import os
import requests
import json
from typing import Dict, Any, List

class MailgunConfigTester:
    def __init__(self):
        self.api_key = os.getenv('MAILGUN_API_KEY', 'c6bcf50f6059adff4bfbd10a2e98f9d2-1ae02a08-912e425d')
        self.domains_to_test = [
            'e.stocklot.farm',
            'stocklot.farm', 
            'mg.stocklot.farm',
            'mail.stocklot.farm',
            'sandbox123.mailgun.org'  # Generic sandbox for testing
        ]
        
    def test_domain_authentication(self, domain: str) -> Dict[str, Any]:
        """Test if API key works with specific domain"""
        url = f"https://api.mailgun.net/v3/{domain}/messages"
        
        print(f"\n🔍 Testing domain: {domain}")
        print(f"📡 API Key: {self.api_key[:20]}...")
        
        # Test with a dry-run email
        data = {
            'from': f'test@{domain}',
            'to': 'test@example.com',
            'subject': 'Test Email - Stocklot Platform',
            'text': 'This is a test email from Stocklot marketplace.',
            'o:testmode': 'yes'  # Test mode - no actual sending
        }
        
        try:
            response = requests.post(
                url,
                auth=('api', self.api_key),
                data=data,
                timeout=10
            )
            
            result = {
                'domain': domain,
                'status_code': response.status_code,
                'success': response.status_code == 200,
                'response': response.text,
                'headers': dict(response.headers)
            }
            
            if response.status_code == 200:
                print(f"✅ SUCCESS: Domain {domain} authenticated successfully!")
                print(f"📨 Test message ID: {response.json().get('id', 'N/A')}")
            elif response.status_code == 401:
                print(f"❌ AUTHENTICATION FAILED: Invalid API key for domain {domain}")
            elif response.status_code == 404:
                print(f"❌ DOMAIN NOT FOUND: Domain {domain} not configured")
            else:
                print(f"⚠️ ERROR {response.status_code}: {response.text}")
                
            return result
            
        except Exception as e:
            print(f"💥 EXCEPTION: {str(e)}")
            return {
                'domain': domain,
                'success': False,
                'error': str(e)
            }
    
    def get_domain_info(self, domain: str) -> Dict[str, Any]:
        """Get detailed domain configuration"""
        url = f"https://api.mailgun.net/v3/domains/{domain}"
        
        try:
            response = requests.get(
                url,
                auth=('api', self.api_key),
                timeout=10
            )
            
            if response.status_code == 200:
                domain_info = response.json()
                print(f"\n📋 Domain Info for {domain}:")
                print(f"   State: {domain_info.get('domain', {}).get('state', 'Unknown')}")
                print(f"   Created: {domain_info.get('domain', {}).get('created_at', 'Unknown')}")
                print(f"   Type: {domain_info.get('domain', {}).get('type', 'Unknown')}")
                return domain_info
            else:
                print(f"❌ Failed to get domain info: {response.status_code}")
                return {}
                
        except Exception as e:
            print(f"💥 Exception getting domain info: {str(e)}")
            return {}
    
    def comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive Mailgun configuration test"""
        print("🚀 STARTING COMPREHENSIVE MAILGUN CONFIGURATION TEST")
        print("=" * 60)
        
        results = {
            'working_domains': [],
            'failed_domains': [],
            'api_key_valid': False,
            'recommended_action': ''
        }
        
        for domain in self.domains_to_test:
            test_result = self.test_domain_authentication(domain)
            
            if test_result.get('success', False):
                results['working_domains'].append(domain)
                results['api_key_valid'] = True
                
                # Get additional domain info
                self.get_domain_info(domain)
            else:
                results['failed_domains'].append({
                    'domain': domain,
                    'error': test_result.get('response', 'Unknown error')
                })
        
        # Analysis and recommendations
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("=" * 60)
        
        if results['working_domains']:
            print(f"✅ WORKING DOMAINS ({len(results['working_domains'])}):")
            for domain in results['working_domains']:
                print(f"   • {domain}")
                
            results['recommended_action'] = f"Use domain: {results['working_domains'][0]}"
            print(f"\n🎯 RECOMMENDATION: Use {results['working_domains'][0]} for email sending")
            
        else:
            print("❌ NO WORKING DOMAINS FOUND")
            print("\n🔧 POSSIBLE SOLUTIONS:")
            print("   1. Check if API key is correct")
            print("   2. Verify domain ownership in Mailgun")
            print("   3. Check account status and billing")
            print("   4. Try different domains")
            print("   5. Consider alternative email providers (SendGrid, AWS SES)")
            
            results['recommended_action'] = "Fix API key or domain configuration"
        
        print(f"\n❌ FAILED DOMAINS ({len(results['failed_domains'])}):")
        for failed in results['failed_domains']:
            print(f"   • {failed['domain']}: {failed['error'][:100]}...")
        
        return results

def main():
    """Main function to test Mailgun configuration"""
    tester = MailgunConfigTester()
    results = tester.comprehensive_test()
    
    # Save results for further analysis
    with open('/app/mailgun_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: /app/mailgun_test_results.json")
    
    return results

if __name__ == "__main__":
    main()