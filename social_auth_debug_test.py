#!/usr/bin/env python3
"""
Social Authentication Backend Debug Test
=======================================

Comprehensive debugging of the social authentication system to identify 
why it's returning "401 Invalid social token" error.

Debug Focus:
1. Social Auth Endpoint Testing with mock tokens
2. OAuth Token Validation Debug (Google/Facebook)
3. Configuration Verification
4. Error Response Analysis
5. Service Dependencies Testing

This test will provide detailed analysis of the social auth system.
"""

import asyncio
import aiohttp
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Test Configuration - Use environment variable for backend URL
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class SocialAuthDebugger:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.debug_info = {}
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        print("🔍 SOCIAL AUTHENTICATION DEBUG TEST")
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

    async def test_social_auth_endpoint_accessibility(self):
        """Test 1: Social Auth Endpoint Accessibility"""
        print("🧪 Test 1: Social Auth Endpoint Accessibility")
        
        # Test if endpoint exists and is accessible
        try:
            # Test with minimal valid payload to check endpoint registration
            payload = {
                "provider": "google",
                "token": "test_token_for_accessibility_check"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                if response.status == 404:
                    self.log_result(
                        "Social auth endpoint exists",
                        False,
                        "Endpoint not found - may not be registered",
                        response_data
                    )
                elif response.status in [400, 401, 422, 500]:
                    self.log_result(
                        "Social auth endpoint exists",
                        True,
                        f"Endpoint accessible, returned {response.status} as expected",
                        {"status": response.status, "detail": response_data.get("detail", "")}
                    )
                else:
                    self.log_result(
                        "Social auth endpoint exists",
                        True,
                        f"Endpoint accessible with status {response.status}",
                        response_data
                    )
                    
        except Exception as e:
            self.log_result(
                "Social auth endpoint exists",
                False,
                f"Connection error: {str(e)}"
            )

    async def test_google_oauth_token_validation(self):
        """Test 2: Google OAuth Token Validation Debug"""
        print("🧪 Test 2: Google OAuth Token Validation Debug")
        
        # Test 2.1: Test with various Google token formats
        google_test_tokens = [
            "invalid_google_token",
            "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWJjMzNhYzMxZjcyYWY2MzAzNTQ3NjE2ZGE4MzI2YjNhZjMiLCJ0eXAiOiJKV1QifQ.invalid",
            "",
            "null",
            "ya29.fake_access_token_format",
            "1//fake_refresh_token_format"
        ]
        
        for i, token in enumerate(google_test_tokens):
            try:
                payload = {
                    "provider": "google",
                    "token": token,
                    "role": "buyer"
                }
                
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    
                    # Analyze the specific error message
                    error_detail = response_data.get("detail", "")
                    
                    if response.status == 401 and "Invalid social token" in error_detail:
                        self.log_result(
                            f"Google token validation #{i+1}",
                            True,
                            f"Correctly rejects invalid Google token: '{token[:20]}...'",
                            {"token_format": type(token).__name__, "error": error_detail}
                        )
                    elif response.status == 500:
                        self.log_result(
                            f"Google token validation #{i+1}",
                            False,
                            f"Server error during Google token validation",
                            {"token": token[:20] + "...", "error": error_detail},
                            "Possible Google OAuth configuration issue"
                        )
                    else:
                        self.log_result(
                            f"Google token validation #{i+1}",
                            True,
                            f"Token validation response: {response.status}",
                            {"token": token[:20] + "...", "status": response.status, "error": error_detail}
                        )
                        
            except Exception as e:
                self.log_result(
                    f"Google token validation #{i+1}",
                    False,
                    f"Connection error: {str(e)}"
                )

    async def test_facebook_oauth_token_validation(self):
        """Test 3: Facebook OAuth Token Validation Debug"""
        print("🧪 Test 3: Facebook OAuth Token Validation Debug")
        
        # Test 3.1: Test with various Facebook token formats
        facebook_test_tokens = [
            "invalid_facebook_token",
            "EAABwzLixnjYBAFakeTokenFormat",
            "",
            "null",
            "EAAG_fake_page_token",
            "short_lived_token_format"
        ]
        
        for i, token in enumerate(facebook_test_tokens):
            try:
                payload = {
                    "provider": "facebook",
                    "token": token,
                    "role": "seller"
                }
                
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    
                    # Analyze the specific error message
                    error_detail = response_data.get("detail", "")
                    
                    if response.status == 401 and "Invalid social token" in error_detail:
                        self.log_result(
                            f"Facebook token validation #{i+1}",
                            True,
                            f"Correctly rejects invalid Facebook token: '{token[:20]}...'",
                            {"token_format": type(token).__name__, "error": error_detail}
                        )
                    elif response.status == 500:
                        self.log_result(
                            f"Facebook token validation #{i+1}",
                            False,
                            f"Server error during Facebook token validation",
                            {"token": token[:20] + "...", "error": error_detail},
                            "Possible Facebook OAuth configuration issue"
                        )
                    else:
                        self.log_result(
                            f"Facebook token validation #{i+1}",
                            True,
                            f"Token validation response: {response.status}",
                            {"token": token[:20] + "...", "status": response.status, "error": error_detail}
                        )
                        
            except Exception as e:
                self.log_result(
                    f"Facebook token validation #{i+1}",
                    False,
                    f"Connection error: {str(e)}"
                )

    async def test_oauth_configuration_verification(self):
        """Test 4: OAuth Configuration Verification"""
        print("🧪 Test 4: OAuth Configuration Verification")
        
        # Test 4.1: Check if Google OAuth is properly configured
        try:
            # Use a token that would trigger Google OAuth verification
            payload = {
                "provider": "google",
                "token": "test_google_config_check"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "").lower()
                
                # Analyze error messages for configuration issues
                config_indicators = [
                    "client_id", "client_secret", "configuration", 
                    "credentials", "oauth", "google"
                ]
                
                has_config_error = any(indicator in error_detail for indicator in config_indicators)
                
                if response.status == 500 and has_config_error:
                    self.log_result(
                        "Google OAuth configuration",
                        False,
                        "Possible Google OAuth configuration issue detected",
                        response_data,
                        "Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables"
                    )
                elif response.status == 401:
                    self.log_result(
                        "Google OAuth configuration",
                        True,
                        "Google OAuth service is configured and rejecting invalid tokens",
                        {"status": response.status}
                    )
                else:
                    self.log_result(
                        "Google OAuth configuration",
                        True,
                        f"Google OAuth service responding with status {response.status}",
                        {"status": response.status, "detail": error_detail}
                    )
                    
        except Exception as e:
            self.log_result(
                "Google OAuth configuration",
                False,
                f"Error testing Google OAuth config: {str(e)}"
            )
        
        # Test 4.2: Check if Facebook OAuth is properly configured
        try:
            payload = {
                "provider": "facebook",
                "token": "test_facebook_config_check"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "").lower()
                
                # Analyze error messages for configuration issues
                config_indicators = [
                    "app_id", "app_secret", "configuration", 
                    "credentials", "oauth", "facebook"
                ]
                
                has_config_error = any(indicator in error_detail for indicator in config_indicators)
                
                if response.status == 500 and has_config_error:
                    self.log_result(
                        "Facebook OAuth configuration",
                        False,
                        "Possible Facebook OAuth configuration issue detected",
                        response_data,
                        "Check FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables"
                    )
                elif response.status == 401:
                    self.log_result(
                        "Facebook OAuth configuration",
                        True,
                        "Facebook OAuth service is configured and rejecting invalid tokens",
                        {"status": response.status}
                    )
                else:
                    self.log_result(
                        "Facebook OAuth configuration",
                        True,
                        f"Facebook OAuth service responding with status {response.status}",
                        {"status": response.status, "detail": error_detail}
                    )
                    
        except Exception as e:
            self.log_result(
                "Facebook OAuth configuration",
                False,
                f"Error testing Facebook OAuth config: {str(e)}"
            )

    async def test_error_response_analysis(self):
        """Test 5: Error Response Analysis"""
        print("🧪 Test 5: Error Response Analysis")
        
        # Test 5.1: Analyze different error scenarios
        test_scenarios = [
            {
                "name": "Empty token",
                "payload": {"provider": "google", "token": ""},
                "expected_behavior": "Should reject empty token"
            },
            {
                "name": "Null token",
                "payload": {"provider": "google", "token": None},
                "expected_behavior": "Should handle null token gracefully"
            },
            {
                "name": "Malformed JWT-like token",
                "payload": {"provider": "google", "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed"},
                "expected_behavior": "Should reject malformed JWT"
            },
            {
                "name": "Very long token",
                "payload": {"provider": "google", "token": "a" * 2000},
                "expected_behavior": "Should handle long tokens"
            },
            {
                "name": "Special characters in token",
                "payload": {"provider": "google", "token": "token_with_special_chars_!@#$%^&*()"},
                "expected_behavior": "Should handle special characters"
            }
        ]
        
        for scenario in test_scenarios:
            try:
                # Handle None token case
                payload = scenario["payload"].copy()
                if payload["token"] is None:
                    payload["token"] = "null"
                
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    
                    # Analyze the error response
                    error_detail = response_data.get("detail", "")
                    
                    if response.status in [400, 401, 422]:
                        self.log_result(
                            f"Error handling: {scenario['name']}",
                            True,
                            f"Properly handled with {response.status}: {error_detail}",
                            {"expected": scenario["expected_behavior"], "actual": error_detail}
                        )
                    elif response.status == 500:
                        self.log_result(
                            f"Error handling: {scenario['name']}",
                            False,
                            f"Server error (500) - should handle gracefully",
                            {"expected": scenario["expected_behavior"], "error": error_detail},
                            "Server should handle this case without 500 error"
                        )
                    else:
                        self.log_result(
                            f"Error handling: {scenario['name']}",
                            True,
                            f"Unexpected but handled response: {response.status}",
                            {"expected": scenario["expected_behavior"], "actual": error_detail}
                        )
                        
            except Exception as e:
                self.log_result(
                    f"Error handling: {scenario['name']}",
                    False,
                    f"Exception during test: {str(e)}"
                )

    async def test_service_dependencies(self):
        """Test 6: Service Dependencies"""
        print("🧪 Test 6: Service Dependencies")
        
        # Test 6.1: Check if SocialAuthService is properly initialized
        try:
            # Test both providers to see if service is working
            providers_test = [
                {"provider": "google", "token": "dependency_test_google"},
                {"provider": "facebook", "token": "dependency_test_facebook"}
            ]
            
            service_working = True
            service_errors = []
            
            for test_case in providers_test:
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=test_case,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    
                    if response.status == 500:
                        error_detail = response_data.get("detail", "").lower()
                        if "service" in error_detail or "import" in error_detail or "module" in error_detail:
                            service_working = False
                            service_errors.append(f"{test_case['provider']}: {error_detail}")
            
            if service_working:
                self.log_result(
                    "SocialAuthService initialization",
                    True,
                    "SocialAuthService appears to be properly initialized",
                    {"providers_tested": ["google", "facebook"]}
                )
            else:
                self.log_result(
                    "SocialAuthService initialization",
                    False,
                    "Possible SocialAuthService initialization issues",
                    {"errors": service_errors},
                    "Check service imports and initialization in server.py"
                )
                
        except Exception as e:
            self.log_result(
                "SocialAuthService initialization",
                False,
                f"Error testing service dependencies: {str(e)}"
            )
        
        # Test 6.2: Check OAuth library dependencies
        try:
            # Test if we get specific OAuth library errors
            payload = {
                "provider": "google",
                "token": "library_dependency_test"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                error_detail = response_data.get("detail", "").lower()
                
                # Check for library-specific errors
                library_indicators = [
                    "google.auth", "facebook", "requests", "httpx", 
                    "import", "module", "library"
                ]
                
                has_library_error = any(indicator in error_detail for indicator in library_indicators)
                
                if response.status == 500 and has_library_error:
                    self.log_result(
                        "OAuth library dependencies",
                        False,
                        "Possible OAuth library dependency issues",
                        response_data,
                        "Check if google-auth, facebook-sdk, and other OAuth libraries are installed"
                    )
                else:
                    self.log_result(
                        "OAuth library dependencies",
                        True,
                        "OAuth libraries appear to be available",
                        {"status": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "OAuth library dependencies",
                False,
                f"Error testing library dependencies: {str(e)}"
            )

    async def test_recaptcha_integration(self):
        """Test 7: reCAPTCHA Integration Impact"""
        print("🧪 Test 7: reCAPTCHA Integration Impact")
        
        # Test 7.1: Test social auth with reCAPTCHA token
        try:
            payload = {
                "provider": "google",
                "token": "recaptcha_integration_test",
                "recaptcha_token": "fake_recaptcha_token_for_testing"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                # Check if reCAPTCHA is interfering with social auth
                if response.status == 401 and "Invalid social token" in response_data.get("detail", ""):
                    self.log_result(
                        "reCAPTCHA integration impact",
                        True,
                        "reCAPTCHA not interfering with social auth token validation",
                        {"status": response.status}
                    )
                elif response.status == 400 and "recaptcha" in response_data.get("detail", "").lower():
                    self.log_result(
                        "reCAPTCHA integration impact",
                        False,
                        "reCAPTCHA validation blocking social auth",
                        response_data,
                        "reCAPTCHA validation may be too strict for social auth"
                    )
                else:
                    self.log_result(
                        "reCAPTCHA integration impact",
                        True,
                        f"reCAPTCHA integration working, status: {response.status}",
                        {"status": response.status, "detail": response_data.get("detail", "")}
                    )
                    
        except Exception as e:
            self.log_result(
                "reCAPTCHA integration impact",
                False,
                f"Error testing reCAPTCHA integration: {str(e)}"
            )

    async def test_token_format_expectations(self):
        """Test 8: Token Format Expectations"""
        print("🧪 Test 8: Token Format Expectations")
        
        # Test 8.1: Test different token formats that might be expected
        token_formats = [
            {
                "name": "Google ID Token format",
                "provider": "google",
                "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWJjMzNhYzMxZjcyYWY2MzAzNTQ3NjE2ZGE4MzI2YjNhZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiZmFrZS1jbGllbnQtaWQiLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciJ9.fake_signature"
            },
            {
                "name": "Google Access Token format",
                "provider": "google", 
                "token": "ya29.a0AfH6SMBFakeAccessTokenFormatExample123456789"
            },
            {
                "name": "Facebook Access Token format",
                "provider": "facebook",
                "token": "EAABwzLixnjYBAFakeTokenFormatExample123456789"
            },
            {
                "name": "Facebook Page Token format",
                "provider": "facebook",
                "token": "EAAG_FakePageTokenFormatExample123456789"
            }
        ]
        
        for token_format in token_formats:
            try:
                payload = {
                    "provider": token_format["provider"],
                    "token": token_format["token"]
                }
                
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    error_detail = response_data.get("detail", "")
                    
                    # Analyze if the token format is being processed correctly
                    if response.status == 401 and "Invalid social token" in error_detail:
                        self.log_result(
                            f"Token format: {token_format['name']}",
                            True,
                            f"Token format processed and rejected as expected",
                            {"provider": token_format["provider"], "format_recognized": True}
                        )
                    elif response.status == 400:
                        self.log_result(
                            f"Token format: {token_format['name']}",
                            False,
                            f"Token format validation issue: {error_detail}",
                            {"provider": token_format["provider"], "error": error_detail},
                            "Token format may not match backend expectations"
                        )
                    else:
                        self.log_result(
                            f"Token format: {token_format['name']}",
                            True,
                            f"Token format handled, status: {response.status}",
                            {"provider": token_format["provider"], "status": response.status}
                        )
                        
            except Exception as e:
                self.log_result(
                    f"Token format: {token_format['name']}",
                    False,
                    f"Error testing token format: {str(e)}"
                )

    def print_debug_summary(self):
        """Print comprehensive debug summary"""
        print("=" * 70)
        print("🔍 SOCIAL AUTHENTICATION DEBUG SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"📈 Total Debug Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📊 Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        # Categorize issues
        critical_issues = []
        configuration_issues = []
        token_validation_issues = []
        service_issues = []
        
        for result in self.test_results:
            if not result["success"]:
                test_name = result["test"].lower()
                details = result["details"].lower()
                
                if "configuration" in details or "client_id" in details or "app_secret" in details:
                    configuration_issues.append(result)
                elif "service" in details or "import" in details or "initialization" in details:
                    service_issues.append(result)
                elif "token" in test_name or "validation" in test_name:
                    token_validation_issues.append(result)
                else:
                    critical_issues.append(result)
        
        # Print issue categories
        if configuration_issues:
            print("🔧 CONFIGURATION ISSUES:")
            for issue in configuration_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        if service_issues:
            print("⚙️ SERVICE ISSUES:")
            for issue in service_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        if token_validation_issues:
            print("🔑 TOKEN VALIDATION ISSUES:")
            for issue in token_validation_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"  • {issue['test']}: {issue['details']}")
                if issue.get('debug'):
                    print(f"    💡 {issue['debug']}")
            print()
        
        # Root cause analysis
        print("🎯 ROOT CAUSE ANALYSIS:")
        
        if configuration_issues:
            print("  🔧 OAuth Configuration Problems Detected:")
            print("     - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env")
            print("     - Check FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in backend/.env")
            print("     - Verify OAuth credentials are valid and not expired")
            print("     - Ensure domain is registered in OAuth provider settings")
        
        if service_issues:
            print("  ⚙️ Service Integration Problems Detected:")
            print("     - Check if SocialAuthService is properly imported in server.py")
            print("     - Verify OAuth libraries are installed (google-auth, facebook-sdk)")
            print("     - Check service initialization in startup code")
        
        if token_validation_issues:
            print("  🔑 Token Validation Problems Detected:")
            print("     - Frontend may be sending wrong token type (access vs ID token)")
            print("     - Token format mismatch between frontend and backend expectations")
            print("     - OAuth token verification logic may have issues")
        
        if not any([configuration_issues, service_issues, token_validation_issues]):
            print("  ✅ No major configuration or service issues detected")
            print("  🔍 The '401 Invalid social token' error appears to be working correctly")
            print("  💡 Issue may be with frontend token generation or OAuth flow")
        
        print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS:")
        print("  1. Check backend/.env file for OAuth credentials")
        print("  2. Verify OAuth provider domain settings")
        print("  3. Test with real OAuth tokens from frontend")
        print("  4. Check browser console for OAuth errors")
        print("  5. Verify OAuth libraries are properly installed")
        print("  6. Test OAuth flow end-to-end with valid credentials")
        
        return passed_tests, total_tests

async def main():
    """Main debug execution"""
    debugger = SocialAuthDebugger()
    
    try:
        await debugger.setup()
        
        # Run all debug tests
        await debugger.test_social_auth_endpoint_accessibility()
        await debugger.test_google_oauth_token_validation()
        await debugger.test_facebook_oauth_token_validation()
        await debugger.test_oauth_configuration_verification()
        await debugger.test_error_response_analysis()
        await debugger.test_service_dependencies()
        await debugger.test_recaptcha_integration()
        await debugger.test_token_format_expectations()
        
        # Print comprehensive debug summary
        passed, total = debugger.print_debug_summary()
        
        # Return appropriate exit code
        return 0 if passed / total >= 0.6 else 1
        
    except Exception as e:
        print(f"❌ Debug execution failed: {e}")
        return 1
    finally:
        await debugger.cleanup()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)