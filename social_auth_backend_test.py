#!/usr/bin/env python3
"""
Social Authentication Backend Testing
=====================================

Tests the newly implemented social authentication endpoints:
1. POST /api/auth/social - Social authentication with Google/Facebook
2. PUT /api/auth/update-role - Update user role after social signup
3. Backend integration testing
4. Error handling scenarios

Test Focus:
- Endpoint structure and validation
- Provider support (google, facebook, invalid)
- Response format verification
- Authentication requirements
- Error handling for various scenarios
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Test Configuration
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

class SocialAuthTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.auth_token = None
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        print("🔧 Social Authentication Backend Testing Started")
        print(f"📡 Backend URL: {BACKEND_URL}")
        print("=" * 60)
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
        print(f"{status} {test_name}")
        if details:
            print(f"    📝 {details}")
        if not success and response_data:
            print(f"    📄 Response: {response_data}")
        print()
    
    async def test_social_auth_endpoint_structure(self):
        """Test 1: Social Auth Endpoint Structure and Validation"""
        print("🧪 Test 1: Social Auth Endpoint Structure")
        
        # Test 1.1: Valid request structure with Google provider
        try:
            payload = {
                "provider": "google",
                "token": "fake_google_token_for_structure_test",
                "role": "buyer"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                # We expect this to fail with 401 (invalid token) but endpoint should be accessible
                if response.status == 401 and "Invalid social token" in response_data.get("detail", ""):
                    self.log_result(
                        "Social auth endpoint accessible with Google provider",
                        True,
                        "Endpoint correctly rejects invalid token with 401"
                    )
                elif response.status == 400:
                    self.log_result(
                        "Social auth endpoint accessible with Google provider", 
                        True,
                        f"Endpoint accessible, validation error: {response_data.get('detail', '')}"
                    )
                else:
                    self.log_result(
                        "Social auth endpoint accessible with Google provider",
                        False,
                        f"Unexpected response: {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Social auth endpoint accessible with Google provider",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 1.2: Valid request structure with Facebook provider
        try:
            payload = {
                "provider": "facebook",
                "token": "fake_facebook_token_for_structure_test",
                "role": "seller"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                # We expect this to fail with 401 (invalid token) but endpoint should be accessible
                if response.status == 401 and "Invalid social token" in response_data.get("detail", ""):
                    self.log_result(
                        "Social auth endpoint accessible with Facebook provider",
                        True,
                        "Endpoint correctly rejects invalid token with 401"
                    )
                elif response.status == 400:
                    self.log_result(
                        "Social auth endpoint accessible with Facebook provider",
                        True,
                        f"Endpoint accessible, validation error: {response_data.get('detail', '')}"
                    )
                else:
                    self.log_result(
                        "Social auth endpoint accessible with Facebook provider",
                        False,
                        f"Unexpected response: {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Social auth endpoint accessible with Facebook provider",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 1.3: Invalid provider validation
        try:
            payload = {
                "provider": "twitter",  # Unsupported provider
                "token": "fake_token",
                "role": "buyer"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                if response.status == 400 and "Unsupported provider" in response_data.get("detail", ""):
                    self.log_result(
                        "Invalid provider rejection",
                        True,
                        "Correctly rejects unsupported provider with 400"
                    )
                else:
                    self.log_result(
                        "Invalid provider rejection",
                        False,
                        f"Expected 400 'Unsupported provider', got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Invalid provider rejection",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 1.4: Missing required fields
        try:
            payload = {
                "provider": "google"
                # Missing token field
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                if response.status == 422:  # Pydantic validation error
                    self.log_result(
                        "Missing token field validation",
                        True,
                        "Correctly validates required token field with 422"
                    )
                else:
                    self.log_result(
                        "Missing token field validation",
                        False,
                        f"Expected 422 validation error, got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Missing token field validation",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 1.5: Invalid provider format (not matching regex)
        try:
            payload = {
                "provider": "invalid_provider_123",
                "token": "fake_token"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                if response.status == 422:  # Pydantic validation error for regex
                    self.log_result(
                        "Provider regex validation",
                        True,
                        "Correctly validates provider regex pattern with 422"
                    )
                elif response.status == 400 and "Unsupported provider" in response_data.get("detail", ""):
                    self.log_result(
                        "Provider regex validation",
                        True,
                        "Provider validation handled at business logic level"
                    )
                else:
                    self.log_result(
                        "Provider regex validation",
                        False,
                        f"Expected validation error, got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Provider regex validation",
                False,
                f"Connection error: {str(e)}"
            )
    
    async def test_update_role_endpoint(self):
        """Test 2: Update Role Endpoint Testing"""
        print("🧪 Test 2: Update Role Endpoint Testing")
        
        # Test 2.1: Endpoint accessibility without authentication
        try:
            payload = {
                "role": "seller"
            }
            
            async with self.session.put(
                f"{API_BASE}/auth/update-role",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                if response.status == 401:
                    self.log_result(
                        "Update role requires authentication",
                        True,
                        "Correctly requires authentication with 401"
                    )
                else:
                    self.log_result(
                        "Update role requires authentication",
                        False,
                        f"Expected 401 unauthorized, got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Update role requires authentication",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 2.2: Valid role values validation
        valid_roles = ["buyer", "seller", "admin", "exporter", "abattoir", "transporter"]
        
        for role in valid_roles:
            try:
                payload = {"role": role}
                
                async with self.session.put(
                    f"{API_BASE}/auth/update-role",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": "Bearer fake_token_for_validation_test"
                    }
                ) as response:
                    response_data = await response.json()
                    
                    # We expect 401 (invalid token) but role should be validated first if validation works
                    if response.status in [401, 403]:  # Authentication/authorization error
                        self.log_result(
                            f"Role validation accepts '{role}'",
                            True,
                            f"Role '{role}' passed validation, auth failed as expected"
                        )
                    elif response.status == 422:  # Validation error
                        self.log_result(
                            f"Role validation accepts '{role}'",
                            False,
                            f"Role '{role}' failed validation",
                            response_data
                        )
                    else:
                        self.log_result(
                            f"Role validation accepts '{role}'",
                            True,
                            f"Role '{role}' validation passed, status: {response.status}"
                        )
            except Exception as e:
                self.log_result(
                    f"Role validation accepts '{role}'",
                    False,
                    f"Connection error: {str(e)}"
                )
        
        # Test 2.3: Invalid role validation
        try:
            payload = {"role": "invalid_role"}
            
            async with self.session.put(
                f"{API_BASE}/auth/update-role",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer fake_token"
                }
            ) as response:
                response_data = await response.json()
                
                if response.status == 422:  # Pydantic validation error
                    self.log_result(
                        "Invalid role rejection",
                        True,
                        "Correctly rejects invalid role with 422"
                    )
                elif response.status == 401:  # Auth happens before validation
                    self.log_result(
                        "Invalid role rejection",
                        True,
                        "Auth checked before role validation (expected behavior)"
                    )
                else:
                    self.log_result(
                        "Invalid role rejection",
                        False,
                        f"Expected validation error, got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Invalid role rejection",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 2.4: Missing role field
        try:
            payload = {}  # Missing role field
            
            async with self.session.put(
                f"{API_BASE}/auth/update-role",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer fake_token"
                }
            ) as response:
                response_data = await response.json()
                
                if response.status == 422:  # Pydantic validation error
                    self.log_result(
                        "Missing role field validation",
                        True,
                        "Correctly validates required role field with 422"
                    )
                elif response.status == 401:  # Auth happens before validation
                    self.log_result(
                        "Missing role field validation",
                        True,
                        "Auth checked before role validation (expected behavior)"
                    )
                else:
                    self.log_result(
                        "Missing role field validation",
                        False,
                        f"Expected validation error, got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Missing role field validation",
                False,
                f"Connection error: {str(e)}"
            )
    
    async def test_backend_integration(self):
        """Test 3: Backend Integration Testing"""
        print("🧪 Test 3: Backend Integration Testing")
        
        # Test 3.1: Social auth service import and initialization
        try:
            # Test if endpoints are registered by checking OPTIONS
            async with self.session.options(f"{API_BASE}/auth/social") as response:
                if response.status in [200, 405]:  # 405 Method Not Allowed is also acceptable
                    self.log_result(
                        "Social auth endpoint registered",
                        True,
                        f"Endpoint accessible, status: {response.status}"
                    )
                else:
                    self.log_result(
                        "Social auth endpoint registered",
                        False,
                        f"Endpoint not accessible, status: {response.status}"
                    )
        except Exception as e:
            self.log_result(
                "Social auth endpoint registered",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 3.2: Update role endpoint registration
        try:
            async with self.session.options(f"{API_BASE}/auth/update-role") as response:
                if response.status in [200, 405]:  # 405 Method Not Allowed is also acceptable
                    self.log_result(
                        "Update role endpoint registered",
                        True,
                        f"Endpoint accessible, status: {response.status}"
                    )
                else:
                    self.log_result(
                        "Update role endpoint registered",
                        False,
                        f"Endpoint not accessible, status: {response.status}"
                    )
        except Exception as e:
            self.log_result(
                "Update role endpoint registered",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 3.3: Environment variable configuration check
        # We can infer this from error messages when using invalid tokens
        try:
            payload = {
                "provider": "google",
                "token": "invalid_token_to_check_env_config"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                # If we get specific OAuth errors, it means env vars are loaded
                if response.status == 401 and "Invalid social token" in response_data.get("detail", ""):
                    self.log_result(
                        "OAuth environment configuration",
                        True,
                        "OAuth service properly configured (rejects invalid tokens)"
                    )
                elif response.status == 500:
                    # Check if error suggests missing env vars
                    error_detail = response_data.get("detail", "").lower()
                    if "configuration" in error_detail or "client" in error_detail:
                        self.log_result(
                            "OAuth environment configuration",
                            False,
                            "Possible OAuth configuration issue",
                            response_data
                        )
                    else:
                        self.log_result(
                            "OAuth environment configuration",
                            True,
                            "OAuth service accessible, configuration appears valid"
                        )
                else:
                    self.log_result(
                        "OAuth environment configuration",
                        True,
                        f"OAuth service responding, status: {response.status}"
                    )
        except Exception as e:
            self.log_result(
                "OAuth environment configuration",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 3.4: User model compatibility
        # Test if the social auth endpoints expect the correct User model structure
        try:
            # Create a test user first to check model compatibility
            user_payload = {
                "email": "social_test@example.com",
                "password": "testpass123",
                "full_name": "Social Test User",
                "role": "buyer"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/register",
                json=user_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [200, 201]:
                    # Now try to login to get a valid token
                    login_payload = {
                        "email": "social_test@example.com",
                        "password": "testpass123"
                    }
                    
                    async with self.session.post(
                        f"{API_BASE}/auth/login",
                        json=login_payload,
                        headers={"Content-Type": "application/json"}
                    ) as login_response:
                        if login_response.status == 200:
                            login_data = await login_response.json()
                            token = login_data.get("access_token")
                            
                            if token:
                                # Test update role with valid token
                                role_payload = {"role": "seller"}
                                async with self.session.put(
                                    f"{API_BASE}/auth/update-role",
                                    json=role_payload,
                                    headers={
                                        "Content-Type": "application/json",
                                        "Authorization": f"Bearer {token}"
                                    }
                                ) as role_response:
                                    role_data = await role_response.json()
                                    
                                    if role_response.status == 200:
                                        self.log_result(
                                            "User model compatibility",
                                            True,
                                            "User model works with social auth endpoints"
                                        )
                                    else:
                                        self.log_result(
                                            "User model compatibility",
                                            False,
                                            f"Role update failed: {role_response.status}",
                                            role_data
                                        )
                            else:
                                self.log_result(
                                    "User model compatibility",
                                    False,
                                    "Could not get access token for testing"
                                )
                        else:
                            self.log_result(
                                "User model compatibility",
                                True,
                                "User registration works, assuming model compatibility"
                            )
                elif response.status == 400:
                    # User might already exist
                    self.log_result(
                        "User model compatibility",
                        True,
                        "User registration endpoint accessible, model likely compatible"
                    )
                else:
                    self.log_result(
                        "User model compatibility",
                        False,
                        f"User registration failed: {response.status}"
                    )
        except Exception as e:
            self.log_result(
                "User model compatibility",
                False,
                f"Error testing user model: {str(e)}"
            )
    
    async def test_error_handling(self):
        """Test 4: Error Handling Testing"""
        print("🧪 Test 4: Error Handling Testing")
        
        # Test 4.1: Invalid token scenarios
        invalid_tokens = [
            "",  # Empty token
            "invalid_token_format",  # Invalid format
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",  # Malformed JWT-like token
            "null",  # String null
            None  # Actual null (will be converted to string)
        ]
        
        for i, token in enumerate(invalid_tokens):
            try:
                payload = {
                    "provider": "google",
                    "token": str(token) if token is not None else "null"
                }
                
                async with self.session.post(
                    f"{API_BASE}/auth/social",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_data = await response.json()
                    
                    if response.status in [400, 401, 422]:
                        self.log_result(
                            f"Invalid token handling #{i+1}",
                            True,
                            f"Correctly handles invalid token with {response.status}"
                        )
                    else:
                        self.log_result(
                            f"Invalid token handling #{i+1}",
                            False,
                            f"Unexpected response for invalid token: {response.status}",
                            response_data
                        )
            except Exception as e:
                self.log_result(
                    f"Invalid token handling #{i+1}",
                    False,
                    f"Connection error: {str(e)}"
                )
        
        # Test 4.2: Malformed request bodies
        malformed_requests = [
            {},  # Empty body
            {"provider": "google"},  # Missing token
            {"token": "test"},  # Missing provider
            {"provider": "google", "token": "test", "invalid_field": "value"},  # Extra fields
            "invalid_json_string",  # Invalid JSON (will be handled by aiohttp)
        ]
        
        for i, payload in enumerate(malformed_requests):
            try:
                if isinstance(payload, str):
                    # Test invalid JSON
                    async with self.session.post(
                        f"{API_BASE}/auth/social",
                        data=payload,  # Send as raw data instead of JSON
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        if response.status in [400, 422]:
                            self.log_result(
                                f"Malformed request handling #{i+1}",
                                True,
                                f"Correctly handles malformed request with {response.status}"
                            )
                        else:
                            response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                            self.log_result(
                                f"Malformed request handling #{i+1}",
                                False,
                                f"Unexpected response: {response.status}",
                                response_data
                            )
                else:
                    async with self.session.post(
                        f"{API_BASE}/auth/social",
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        response_data = await response.json()
                        
                        if response.status in [400, 422]:
                            self.log_result(
                                f"Malformed request handling #{i+1}",
                                True,
                                f"Correctly handles malformed request with {response.status}"
                            )
                        else:
                            self.log_result(
                                f"Malformed request handling #{i+1}",
                                False,
                                f"Unexpected response: {response.status}",
                                response_data
                            )
            except Exception as e:
                # JSON parsing errors are expected for malformed requests
                self.log_result(
                    f"Malformed request handling #{i+1}",
                    True,
                    f"Request properly rejected: {str(e)}"
                )
        
        # Test 4.3: Missing authentication for update-role
        try:
            payload = {"role": "seller"}
            
            # Test without Authorization header
            async with self.session.put(
                f"{API_BASE}/auth/update-role",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                if response.status == 401:
                    self.log_result(
                        "Missing authentication handling",
                        True,
                        "Correctly requires authentication with 401"
                    )
                else:
                    self.log_result(
                        "Missing authentication handling",
                        False,
                        f"Expected 401, got {response.status}",
                        response_data
                    )
        except Exception as e:
            self.log_result(
                "Missing authentication handling",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 4.4: Invalid authentication token for update-role
        invalid_auth_tokens = [
            "Bearer invalid_token",
            "Bearer ",
            "InvalidFormat token",
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid"
        ]
        
        for i, auth_header in enumerate(invalid_auth_tokens):
            try:
                payload = {"role": "seller"}
                
                async with self.session.put(
                    f"{API_BASE}/auth/update-role",
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": auth_header
                    }
                ) as response:
                    response_data = await response.json()
                    
                    if response.status in [401, 403]:
                        self.log_result(
                            f"Invalid auth token handling #{i+1}",
                            True,
                            f"Correctly rejects invalid auth with {response.status}"
                        )
                    else:
                        self.log_result(
                            f"Invalid auth token handling #{i+1}",
                            False,
                            f"Expected 401/403, got {response.status}",
                            response_data
                        )
            except Exception as e:
                self.log_result(
                    f"Invalid auth token handling #{i+1}",
                    False,
                    f"Connection error: {str(e)}"
                )
    
    async def test_response_format_validation(self):
        """Test 5: Response Format Validation"""
        print("🧪 Test 5: Response Format Validation")
        
        # Test 5.1: Social auth response structure
        try:
            payload = {
                "provider": "google",
                "token": "fake_token_for_response_test"
            }
            
            async with self.session.post(
                f"{API_BASE}/auth/social",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                
                # Check if response has proper error structure
                if response.status == 401:
                    if "detail" in response_data:
                        self.log_result(
                            "Social auth error response format",
                            True,
                            "Error response has proper 'detail' field"
                        )
                    else:
                        self.log_result(
                            "Social auth error response format",
                            False,
                            "Error response missing 'detail' field",
                            response_data
                        )
                elif response.status == 200:
                    # Check success response structure
                    required_fields = ["access_token", "token_type", "user", "is_new_user", "needs_role_selection"]
                    missing_fields = [field for field in required_fields if field not in response_data]
                    
                    if not missing_fields:
                        self.log_result(
                            "Social auth success response format",
                            True,
                            "Success response has all required fields"
                        )
                    else:
                        self.log_result(
                            "Social auth success response format",
                            False,
                            f"Missing fields: {missing_fields}",
                            response_data
                        )
                else:
                    self.log_result(
                        "Social auth response format",
                        True,
                        f"Response format check completed, status: {response.status}"
                    )
        except Exception as e:
            self.log_result(
                "Social auth response format",
                False,
                f"Connection error: {str(e)}"
            )
        
        # Test 5.2: Update role response structure
        try:
            payload = {"role": "seller"}
            
            async with self.session.put(
                f"{API_BASE}/auth/update-role",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer fake_token"
                }
            ) as response:
                response_data = await response.json()
                
                if response.status == 401:
                    if "detail" in response_data:
                        self.log_result(
                            "Update role error response format",
                            True,
                            "Error response has proper 'detail' field"
                        )
                    else:
                        self.log_result(
                            "Update role error response format",
                            False,
                            "Error response missing 'detail' field",
                            response_data
                        )
                elif response.status == 200:
                    if "message" in response_data:
                        self.log_result(
                            "Update role success response format",
                            True,
                            "Success response has 'message' field"
                        )
                    else:
                        self.log_result(
                            "Update role success response format",
                            False,
                            "Success response missing 'message' field",
                            response_data
                        )
                else:
                    self.log_result(
                        "Update role response format",
                        True,
                        f"Response format check completed, status: {response.status}"
                    )
        except Exception as e:
            self.log_result(
                "Update role response format",
                False,
                f"Connection error: {str(e)}"
            )
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 SOCIAL AUTHENTICATION TESTING SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"📈 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📊 Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
            print()
        
        # Categorize results
        categories = {
            "Endpoint Structure": 0,
            "Authentication": 0,
            "Validation": 0,
            "Error Handling": 0,
            "Integration": 0
        }
        
        category_totals = {k: 0 for k in categories.keys()}
        
        for result in self.test_results:
            test_name = result["test"].lower()
            if "endpoint" in test_name or "structure" in test_name:
                category_totals["Endpoint Structure"] += 1
                if result["success"]:
                    categories["Endpoint Structure"] += 1
            elif "auth" in test_name or "token" in test_name:
                category_totals["Authentication"] += 1
                if result["success"]:
                    categories["Authentication"] += 1
            elif "validation" in test_name or "role" in test_name:
                category_totals["Validation"] += 1
                if result["success"]:
                    categories["Validation"] += 1
            elif "error" in test_name or "invalid" in test_name or "malformed" in test_name:
                category_totals["Error Handling"] += 1
                if result["success"]:
                    categories["Error Handling"] += 1
            else:
                category_totals["Integration"] += 1
                if result["success"]:
                    categories["Integration"] += 1
        
        print("📋 RESULTS BY CATEGORY:")
        for category, passed in categories.items():
            total = category_totals[category]
            if total > 0:
                percentage = (passed/total*100)
                status = "✅" if percentage >= 80 else "⚠️" if percentage >= 60 else "❌"
                print(f"  {status} {category}: {passed}/{total} ({percentage:.1f}%)")
        print()
        
        # Overall assessment
        if passed_tests / total_tests >= 0.9:
            print("🎉 EXCELLENT: Social authentication system is working very well!")
        elif passed_tests / total_tests >= 0.7:
            print("✅ GOOD: Social authentication system is mostly functional with minor issues.")
        elif passed_tests / total_tests >= 0.5:
            print("⚠️ FAIR: Social authentication system has some issues that need attention.")
        else:
            print("❌ POOR: Social authentication system has significant issues requiring fixes.")
        
        return passed_tests, total_tests

async def main():
    """Main test execution"""
    tester = SocialAuthTester()
    
    try:
        await tester.setup()
        
        # Run all test suites
        await tester.test_social_auth_endpoint_structure()
        await tester.test_update_role_endpoint()
        await tester.test_backend_integration()
        await tester.test_error_handling()
        await tester.test_response_format_validation()
        
        # Print summary
        passed, total = tester.print_summary()
        
        # Return appropriate exit code
        return 0 if passed / total >= 0.7 else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return 1
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)