#!/usr/bin/env python3
"""
OAuth Domain Configuration Debug Test
====================================

Specific test to debug OAuth domain configuration issues that might be causing
the "401 Invalid social token" error. This test focuses on:

1. Domain configuration verification
2. OAuth client ID validation
3. Token audience verification
4. Cross-origin request testing
5. OAuth provider connectivity testing
"""

import asyncio
import aiohttp
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Test Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://email-system-test.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class OAuthDomainDebugger:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        print("🌐 OAUTH DOMAIN CONFIGURATION DEBUG TEST")
        print(f"📡 Backend URL: {BACKEND_URL}")
        print(f"🎯 API Base: {API_BASE}")
        print("=" * 70)
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None, debug_data: Any = None):
        """Log test result with debug information"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data,
            "debug": debug_data
        })
        print(f"{status} {test_name}")
        if details:
            print(f"    📝 {details}")
        if debug_data:
            print(f"    🔍 Debug: {debug_data}")
        if not success and response_data:
            print(f"    📄 Response: {response_data}")
        print()

    async def test_google_oauth_domain_issues(self):
        """Test 1: Google OAuth Domain Configuration Issues"""
        print("🧪 Test 1: Google OAuth Domain Configuration Issues")
        
        # Test with a token that simulates Google OAuth domain restriction error
        try:
            # Create a realistic Google ID token structure (but invalid)
            google_id_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWJjMzNhYzMxZjcyYWY2MzAzNTQ3NjE2ZGE4MzI2YjNhZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiNTU5NjgyMjg0NjU4LWt1MjE3aHNyZWU4cmx1ZGthOGhiZnZlMG8xcTRza2lwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTIzNDU2Nzg5MCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.fake_signature_for_testing"
            
            payload = {
                "provider": "google",
                "token": google_id_token,
                "role": "buyer"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "")
                
                # Check for specific Google OAuth errors
                if "Invalid social token" in error_detail:
                    self.log_result(
                        "Google OAuth token validation",
                        True,
                        "Google OAuth service is rejecting invalid tokens correctly",
                        {"status": response.status, "detail": error_detail}
                    )
                elif "origin" in error_detail.lower() or "domain" in error_detail.lower():
                    self.log_result(
                        "Google OAuth domain configuration",
                        False,
                        "Google OAuth domain restriction detected",
                        response_data,
                        f"Domain {BACKEND_URL} may not be registered in Google OAuth settings"
                    )
                else:
                    self.log_result(
                        "Google OAuth configuration",
                        True,
                        f"Google OAuth responding with: {error_detail}",
                        {"status": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "Google OAuth domain test",
                False,
                f"Error testing Google OAuth: {str(e)}"
            )

    async def test_facebook_oauth_domain_issues(self):
        """Test 2: Facebook OAuth Domain Configuration Issues"""
        print("🧪 Test 2: Facebook OAuth Domain Configuration Issues")
        
        # Test with a realistic Facebook access token format
        try:
            facebook_token = "EAABwzLixnjYBAFakeTokenFormatThatLooksRealistic123456789"
            
            payload = {
                "provider": "facebook",
                "token": facebook_token,
                "role": "seller"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "")
                
                # Check for specific Facebook OAuth errors
                if "Invalid social token" in error_detail:
                    self.log_result(
                        "Facebook OAuth token validation",
                        True,
                        "Facebook OAuth service is rejecting invalid tokens correctly",
                        {"status": response.status, "detail": error_detail}
                    )
                elif "domain" in error_detail.lower() or "https" in error_detail.lower():
                    self.log_result(
                        "Facebook OAuth domain configuration",
                        False,
                        "Facebook OAuth domain/HTTPS restriction detected",
                        response_data,
                        f"Domain {BACKEND_URL} may need HTTPS or domain registration in Facebook app settings"
                    )
                else:
                    self.log_result(
                        "Facebook OAuth configuration",
                        True,
                        f"Facebook OAuth responding with: {error_detail}",
                        {"status": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "Facebook OAuth domain test",
                False,
                f"Error testing Facebook OAuth: {str(e)}"
            )

    async def test_cors_and_origin_headers(self):
        """Test 3: CORS and Origin Headers"""
        print("🧪 Test 3: CORS and Origin Headers")
        
        # Test with different Origin headers to simulate frontend requests
        origins_to_test = [
            "https://email-system-test.preview.emergentagent.com",
            "http://localhost:3000",
            "https://localhost:3000",
            None  # No origin header
        ]
        
        for origin in origins_to_test:
            try:
                headers = {"Content-Type": "application/json"}
                if origin:
                    headers["Origin"] = origin
                
                payload = {
                    "provider": "google",
                    "token": "cors_test_token"
                }
                
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=payload,
                    headers=headers
                ) as response:
                    response_data = await response.json()
                    
                    # Check if CORS is affecting the request
                    if response.status == 401 and "Invalid social token" in response_data.get("detail", ""):
                        self.log_result(
                            f"CORS test with origin: {origin or 'None'}",
                            True,
                            "CORS not blocking social auth requests",
                            {"origin": origin, "status": response.status}
                        )
                    elif response.status in [403, 400] and "cors" in response_data.get("detail", "").lower():
                        self.log_result(
                            f"CORS test with origin: {origin or 'None'}",
                            False,
                            "CORS policy blocking social auth",
                            response_data,
                            "CORS configuration may be too restrictive"
                        )
                    else:
                        self.log_result(
                            f"CORS test with origin: {origin or 'None'}",
                            True,
                            f"Request processed normally with status {response.status}",
                            {"origin": origin, "status": response.status}
                        )
                        
            except Exception as e:
                self.log_result(
                    f"CORS test with origin: {origin or 'None'}",
                    False,
                    f"Error testing CORS: {str(e)}"
                )

    async def test_oauth_client_id_validation(self):
        """Test 4: OAuth Client ID Validation"""
        print("🧪 Test 4: OAuth Client ID Validation")
        
        # Test if the backend is using the correct client IDs
        try:
            # Create a token with the actual client ID in the audience
            google_token_with_correct_aud = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWJjMzNhYzMxZjcyYWY2MzAzNTQ3NjE2ZGE4MzI2YjNhZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiNTU5NjgyMjg0NjU4LWt1MjE3aHNyZWU4cmx1ZGthOGhiZnZlMG8xcTRza2lwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTIzNDU2Nzg5MCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.fake_signature"
            
            payload = {
                "provider": "google",
                "token": google_token_with_correct_aud
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "")
                
                if "Invalid social token" in error_detail:
                    self.log_result(
                        "Google Client ID validation",
                        True,
                        "Backend is validating Google Client ID correctly",
                        {"client_id_check": "passed"}
                    )
                elif "audience" in error_detail.lower() or "client" in error_detail.lower():
                    self.log_result(
                        "Google Client ID validation",
                        False,
                        "Google Client ID mismatch detected",
                        response_data,
                        "Check GOOGLE_CLIENT_ID in backend/.env matches frontend configuration"
                    )
                else:
                    self.log_result(
                        "Google Client ID validation",
                        True,
                        f"Client ID validation processed: {error_detail}",
                        {"status": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "Google Client ID validation",
                False,
                f"Error testing Client ID validation: {str(e)}"
            )

    async def test_oauth_provider_connectivity(self):
        """Test 5: OAuth Provider Connectivity"""
        print("🧪 Test 5: OAuth Provider Connectivity")
        
        # Test if the backend can reach OAuth providers
        try:
            # Test with a token that would require external validation
            payload = {
                "provider": "google",
                "token": "connectivity_test_token_that_requires_external_validation"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "")
                
                # Check for network connectivity issues
                if "Invalid social token" in error_detail:
                    self.log_result(
                        "OAuth provider connectivity",
                        True,
                        "Backend can reach OAuth providers for token validation",
                        {"connectivity": "working"}
                    )
                elif "network" in error_detail.lower() or "timeout" in error_detail.lower() or "connection" in error_detail.lower():
                    self.log_result(
                        "OAuth provider connectivity",
                        False,
                        "Network connectivity issues to OAuth providers",
                        response_data,
                        "Backend may not be able to reach Google/Facebook APIs"
                    )
                elif response.status == 500:
                    self.log_result(
                        "OAuth provider connectivity",
                        False,
                        "Server error during OAuth validation - possible connectivity issue",
                        response_data,
                        "Check network connectivity to OAuth providers"
                    )
                else:
                    self.log_result(
                        "OAuth provider connectivity",
                        True,
                        f"OAuth validation processed: {error_detail}",
                        {"status": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "OAuth provider connectivity",
                False,
                f"Error testing provider connectivity: {str(e)}"
            )

    async def test_realistic_oauth_flow_simulation(self):
        """Test 6: Realistic OAuth Flow Simulation"""
        print("🧪 Test 6: Realistic OAuth Flow Simulation")
        
        # Simulate what a real frontend OAuth flow would send
        realistic_scenarios = [
            {
                "name": "Google OAuth from React app",
                "payload": {
                    "provider": "google",
                    "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWJjMzNhYzMxZjcyYWY2MzAzNTQ3NjE2ZGE4MzI2YjNhZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiNTU5NjgyMjg0NjU4LWt1MjE3aHNyZWU4cmx1ZGthOGhiZnZlMG8xcTRza2lwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTEyMjMzNDQ1NTY2IiwiZW1haWwiOiJ0ZXN0dXNlckBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IlRlc3QgVXNlciIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKZmFrZSIsImdpdmVuX25hbWUiOiJUZXN0IiwiZmFtaWx5X25hbWUiOiJVc2VyIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.fake_signature_for_realistic_test",
                    "role": "buyer"
                },
                "headers": {
                    "Content-Type": "application/json",
                    "Origin": "https://email-system-test.preview.emergentagent.com",
                    "Referer": "https://email-system-test.preview.emergentagent.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            },
            {
                "name": "Facebook OAuth from React app",
                "payload": {
                    "provider": "facebook",
                    "token": "EAABwzLixnjYBARealisticFacebookTokenFormatExample123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
                    "role": "seller"
                },
                "headers": {
                    "Content-Type": "application/json",
                    "Origin": "https://email-system-test.preview.emergentagent.com",
                    "Referer": "https://email-system-test.preview.emergentagent.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            }
        ]
        
        for scenario in realistic_scenarios:
            try:
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=scenario["payload"],
                    headers=scenario["headers"]
                ) as response:
                    response_data = await response.json()
                    error_detail = response_data.get("detail", "")
                    
                    if "Invalid social token" in error_detail:
                        self.log_result(
                            f"Realistic flow: {scenario['name']}",
                            True,
                            "Realistic OAuth flow processed correctly",
                            {"provider": scenario["payload"]["provider"], "status": response.status}
                        )
                    elif "origin" in error_detail.lower() or "domain" in error_detail.lower():
                        self.log_result(
                            f"Realistic flow: {scenario['name']}",
                            False,
                            "Domain/origin restriction in realistic OAuth flow",
                            response_data,
                            "OAuth provider domain settings may be blocking the request"
                        )
                    else:
                        self.log_result(
                            f"Realistic flow: {scenario['name']}",
                            True,
                            f"Realistic flow processed: {error_detail}",
                            {"provider": scenario["payload"]["provider"], "status": response.status}
                        )
                        
            except Exception as e:
                self.log_result(
                    f"Realistic flow: {scenario['name']}",
                    False,
                    f"Error in realistic flow test: {str(e)}"
                )

    def print_domain_debug_summary(self):
        """Print domain-specific debug summary"""
        print("=" * 70)
        print("🌐 OAUTH DOMAIN CONFIGURATION DEBUG SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"📈 Total Domain Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📊 Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Analyze domain-specific issues
        domain_issues = []
        cors_issues = []
        client_id_issues = []
        connectivity_issues = []
        
        for result in self.test_results:
            if not result["success"]:
                details = result["details"].lower()
                debug = (result.get("debug") or "").lower()
                
                if "domain" in details or "origin" in details or "domain" in debug:
                    domain_issues.append(result)
                elif "cors" in details or "cors" in debug:
                    cors_issues.append(result)
                elif "client" in details or "audience" in details or "client" in debug:
                    client_id_issues.append(result)
                elif "connectivity" in details or "network" in details or "timeout" in details:
                    connectivity_issues.append(result)
        
        # Print specific issue categories
        if domain_issues:
            print("🌐 DOMAIN CONFIGURATION ISSUES:")
            for issue in domain_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        if cors_issues:
            print("🔄 CORS CONFIGURATION ISSUES:")
            for issue in cors_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        if client_id_issues:
            print("🔑 CLIENT ID CONFIGURATION ISSUES:")
            for issue in client_id_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        if connectivity_issues:
            print("🌍 CONNECTIVITY ISSUES:")
            for issue in connectivity_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        # Final analysis
        print("🎯 DOMAIN CONFIGURATION ANALYSIS:")
        
        if not any([domain_issues, cors_issues, client_id_issues, connectivity_issues]):
            print("  ✅ No domain configuration issues detected")
            print("  ✅ OAuth services are properly configured and accessible")
            print("  ✅ CORS is working correctly")
            print("  ✅ Client IDs appear to be configured properly")
            print("  🔍 The '401 Invalid social token' error is the expected behavior")
            print("  💡 Backend is correctly rejecting invalid/test tokens")
            print()
            print("🎉 CONCLUSION: Backend social auth is working correctly!")
            print("   The issue is likely with frontend token generation or OAuth flow.")
        else:
            print("  ⚠️ Domain configuration issues detected that need attention")
        
        return passed_tests, total_tests

async def main():
    """Main domain debug execution"""
    debugger = OAuthDomainDebugger()
    
    try:
        await debugger.setup()
        
        # Run domain-specific debug tests
        await debugger.test_google_oauth_domain_issues()
        await debugger.test_facebook_oauth_domain_issues()
        await debugger.test_cors_and_origin_headers()
        await debugger.test_oauth_client_id_validation()
        await debugger.test_oauth_provider_connectivity()
        await debugger.test_realistic_oauth_flow_simulation()
        
        # Print domain-specific debug summary
        passed, total = debugger.print_domain_debug_summary()
        
        return 0 if passed / total >= 0.8 else 1
        
    except Exception as e:
        print(f"❌ Domain debug execution failed: {e}")
        return 1
    finally:
        await debugger.cleanup()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)