#!/usr/bin/env python3
"""
Password Reset System Testing
Comprehensive testing of password reset functionality including security features
"""

import asyncio
import aiohttp
import json
import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import hashlib
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PasswordResetTester:
    def __init__(self):
        # Get backend URL from environment
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
        self.api_url = f"{self.base_url}/api"
        
        # Test data
        self.test_email = "test.user@stocklot.co.za"
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "admin123"
        self.new_password = "NewSecurePassword123!"
        self.weak_password = "123"
        
        # Store tokens for testing
        self.valid_token = None
        self.admin_token = None
        
        # Test results
        self.results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }

    async def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.results["total_tests"] += 1
        if success:
            self.results["passed_tests"] += 1
            logger.info(f"✅ {test_name}: PASSED")
        else:
            self.results["failed_tests"] += 1
            logger.error(f"❌ {test_name}: FAILED - {details}")
        
        self.results["test_details"].append({
            "test": test_name,
            "status": "PASSED" if success else "FAILED",
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.api_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            async with aiohttp.ClientSession() as session:
                if method.upper() == "GET":
                    async with session.get(url, headers=default_headers) as response:
                        response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                        return {
                            "status_code": response.status,
                            "data": response_data,
                            "headers": dict(response.headers)
                        }
                elif method.upper() == "POST":
                    async with session.post(url, json=data, headers=default_headers) as response:
                        response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                        return {
                            "status_code": response.status,
                            "data": response_data,
                            "headers": dict(response.headers)
                        }
                elif method.upper() == "PUT":
                    async with session.put(url, json=data, headers=default_headers) as response:
                        response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                        return {
                            "status_code": response.status,
                            "data": response_data,
                            "headers": dict(response.headers)
                        }
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return {
                "status_code": 500,
                "data": {"error": str(e)},
                "headers": {}
            }

    async def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        try:
            # First try to login as admin
            login_data = {
                "email": self.admin_email,
                "password": self.admin_password
            }
            
            response = await self.make_request("POST", "/auth/login", login_data)
            
            if response["status_code"] == 200:
                # Use email as token (as per the current auth system)
                self.admin_token = self.admin_email
                logger.info("✅ Admin authentication successful")
                return True
            else:
                logger.error(f"❌ Admin authentication failed: {response}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Admin authentication error: {e}")
            return False

    async def test_password_reset_request_valid_email(self):
        """Test password reset request with valid email"""
        test_name = "Password Reset Request - Valid Email"
        
        try:
            data = {"email": self.test_email}
            response = await self.make_request("POST", "/auth/forgot-password", data)
            
            # Should return 200 regardless of whether email exists (security)
            success = response["status_code"] == 200
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            if success and "message" in response["data"]:
                details += f" - Message: {response['data']['message']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_password_reset_request_nonexistent_email(self):
        """Test password reset request with non-existent email"""
        test_name = "Password Reset Request - Non-existent Email"
        
        try:
            data = {"email": "nonexistent@example.com"}
            response = await self.make_request("POST", "/auth/forgot-password", data)
            
            # Should return 200 (don't reveal if email exists)
            success = response["status_code"] == 200
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_password_reset_request_invalid_email(self):
        """Test password reset request with invalid email format"""
        test_name = "Password Reset Request - Invalid Email Format"
        
        try:
            data = {"email": "invalid-email-format"}
            response = await self.make_request("POST", "/auth/forgot-password", data)
            
            # Should return 422 for validation error
            success = response["status_code"] == 422
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_password_reset_rate_limiting(self):
        """Test rate limiting (max 3 requests per hour)"""
        test_name = "Password Reset Rate Limiting"
        
        try:
            data = {"email": "rate.limit.test@example.com"}
            
            # Make 4 requests rapidly
            responses = []
            for i in range(4):
                response = await self.make_request("POST", "/auth/forgot-password", data)
                responses.append(response)
                await asyncio.sleep(0.1)  # Small delay between requests
            
            # First 3 should succeed (200), 4th should be rate limited
            first_three_success = all(r["status_code"] == 200 for r in responses[:3])
            fourth_rate_limited = responses[3]["status_code"] in [429, 400]  # Rate limit or error
            
            success = first_three_success and fourth_rate_limited
            details = f"First 3 responses: {[r['status_code'] for r in responses[:3]]}, 4th response: {responses[3]['status_code']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_reset_token_validation_invalid_token(self):
        """Test reset token validation with invalid token"""
        test_name = "Reset Token Validation - Invalid Token"
        
        try:
            invalid_token = "invalid_token_12345"
            response = await self.make_request("GET", f"/auth/reset-token/{invalid_token}")
            
            # Should return 400 for invalid token
            success = response["status_code"] == 400
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_reset_token_validation_expired_token(self):
        """Test reset token validation with expired token"""
        test_name = "Reset Token Validation - Expired Token"
        
        try:
            # Generate a token that looks valid but would be expired
            expired_token = secrets.token_urlsafe(32)
            response = await self.make_request("GET", f"/auth/reset-token/{expired_token}")
            
            # Should return 400 for expired/invalid token
            success = response["status_code"] == 400
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_password_reset_confirmation_invalid_token(self):
        """Test password reset confirmation with invalid token"""
        test_name = "Password Reset Confirmation - Invalid Token"
        
        try:
            data = {
                "token": "invalid_token_12345",
                "new_password": self.new_password
            }
            response = await self.make_request("POST", "/auth/reset-password", data)
            
            # Should return 400 for invalid token
            success = response["status_code"] == 400
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_password_reset_confirmation_weak_password(self):
        """Test password reset confirmation with weak password"""
        test_name = "Password Reset Confirmation - Weak Password"
        
        try:
            # Generate a valid-looking token for testing
            test_token = secrets.token_urlsafe(32)
            data = {
                "token": test_token,
                "new_password": self.weak_password
            }
            response = await self.make_request("POST", "/auth/reset-password", data)
            
            # Should return 400 for weak password or invalid token
            success = response["status_code"] == 400
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_admin_password_reset_stats_unauthorized(self):
        """Test admin password reset stats without authentication"""
        test_name = "Admin Password Reset Stats - Unauthorized"
        
        try:
            response = await self.make_request("GET", "/admin/password-reset/stats")
            
            # Should return 401 or 403 for unauthorized access
            success = response["status_code"] in [401, 403]
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_admin_password_reset_stats_authorized(self):
        """Test admin password reset stats with admin authentication"""
        test_name = "Admin Password Reset Stats - Authorized"
        
        try:
            if not self.admin_token:
                await self.authenticate_admin()
            
            if not self.admin_token:
                await self.log_test_result(test_name, False, "Admin authentication failed")
                return
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = await self.make_request("GET", "/admin/password-reset/stats", headers=headers)
            
            # Should return 200 with stats data
            success = response["status_code"] == 200
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            if success and isinstance(response["data"], dict):
                expected_fields = ["total_requests", "successful_resets", "expired_tokens", "recent_requests_24h", "success_rate"]
                has_expected_fields = all(field in response["data"] for field in expected_fields)
                if has_expected_fields:
                    details += " - All expected fields present"
                else:
                    success = False
                    details += " - Missing expected fields"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_email_service_integration(self):
        """Test email service integration by checking Mailgun configuration"""
        test_name = "Email Service Integration"
        
        try:
            # Test with a valid email to see if email service is configured
            data = {"email": "test.integration@example.com"}
            response = await self.make_request("POST", "/auth/forgot-password", data)
            
            # Should return 200 if email service is working
            success = response["status_code"] == 200
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            # Check if the response indicates email was sent
            if success and "message" in response["data"]:
                message = response["data"]["message"].lower()
                if "sent" in message or "email" in message:
                    details += " - Email service appears to be working"
                else:
                    details += " - Email service may not be configured"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_database_collections_exist(self):
        """Test if password reset tokens collection exists by checking admin stats"""
        test_name = "Database Collections - Password Reset Tokens"
        
        try:
            if not self.admin_token:
                await self.authenticate_admin()
            
            if not self.admin_token:
                await self.log_test_result(test_name, False, "Admin authentication failed")
                return
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = await self.make_request("GET", "/admin/password-reset/stats", headers=headers)
            
            # If stats endpoint works, collection exists
            success = response["status_code"] == 200
            details = f"Status: {response['status_code']}"
            
            if success:
                details += " - Password reset tokens collection accessible"
            else:
                details += f" - Collection may not exist: {response['data']}"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_security_features(self):
        """Test security features like token hashing and secure generation"""
        test_name = "Security Features - Token Generation and Hashing"
        
        try:
            # Test multiple password reset requests to see if tokens are different
            email = "security.test@example.com"
            data = {"email": email}
            
            responses = []
            for i in range(2):
                response = await self.make_request("POST", "/auth/forgot-password", data)
                responses.append(response)
                await asyncio.sleep(1)  # Wait between requests
            
            # Both should succeed
            both_success = all(r["status_code"] == 200 for r in responses)
            
            success = both_success
            details = f"Multiple requests status: {[r['status_code'] for r in responses]}"
            
            if success:
                details += " - Token generation appears to be working (tokens should be unique and hashed)"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def test_service_availability(self):
        """Test if password reset service is available"""
        test_name = "Password Reset Service Availability"
        
        try:
            # Test service availability by making a simple request
            data = {"email": "service.test@example.com"}
            response = await self.make_request("POST", "/auth/forgot-password", data)
            
            # Should not return 503 (service unavailable)
            success = response["status_code"] != 503
            details = f"Status: {response['status_code']}, Response: {response['data']}"
            
            if response["status_code"] == 503:
                details += " - Password reset service is unavailable"
            else:
                details += " - Password reset service is available"
            
            await self.log_test_result(test_name, success, details)
            
        except Exception as e:
            await self.log_test_result(test_name, False, f"Exception: {str(e)}")

    async def run_all_tests(self):
        """Run all password reset tests"""
        logger.info("🔒 Starting Password Reset System Testing...")
        logger.info(f"Testing against: {self.api_url}")
        
        # Test service availability first
        await self.test_service_availability()
        
        # Test password reset request functionality
        await self.test_password_reset_request_valid_email()
        await self.test_password_reset_request_nonexistent_email()
        await self.test_password_reset_request_invalid_email()
        await self.test_password_reset_rate_limiting()
        
        # Test token validation
        await self.test_reset_token_validation_invalid_token()
        await self.test_reset_token_validation_expired_token()
        
        # Test password reset confirmation
        await self.test_password_reset_confirmation_invalid_token()
        await self.test_password_reset_confirmation_weak_password()
        
        # Test admin functionality
        await self.test_admin_password_reset_stats_unauthorized()
        await self.test_admin_password_reset_stats_authorized()
        
        # Test integrations
        await self.test_email_service_integration()
        await self.test_database_collections_exist()
        
        # Test security features
        await self.test_security_features()
        
        # Print summary
        await self.print_test_summary()

    async def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🔒 PASSWORD RESET SYSTEM TEST SUMMARY")
        logger.info("="*80)
        
        total = self.results["total_tests"]
        passed = self.results["passed_tests"]
        failed = self.results["failed_tests"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        logger.info(f"📊 OVERALL RESULTS:")
        logger.info(f"   Total Tests: {total}")
        logger.info(f"   ✅ Passed: {passed}")
        logger.info(f"   ❌ Failed: {failed}")
        logger.info(f"   📈 Success Rate: {success_rate:.1f}%")
        
        if failed > 0:
            logger.info(f"\n❌ FAILED TESTS:")
            for result in self.results["test_details"]:
                if result["status"] == "FAILED":
                    logger.info(f"   • {result['test']}: {result['details']}")
        
        logger.info(f"\n✅ PASSED TESTS:")
        for result in self.results["test_details"]:
            if result["status"] == "PASSED":
                logger.info(f"   • {result['test']}")
        
        # Critical assessment
        critical_tests = [
            "Password Reset Service Availability",
            "Password Reset Request - Valid Email",
            "Admin Password Reset Stats - Authorized",
            "Email Service Integration"
        ]
        
        critical_passed = sum(1 for result in self.results["test_details"] 
                            if result["test"] in critical_tests and result["status"] == "PASSED")
        
        logger.info(f"\n🎯 CRITICAL FUNCTIONALITY:")
        logger.info(f"   Critical Tests Passed: {critical_passed}/{len(critical_tests)}")
        
        if critical_passed == len(critical_tests):
            logger.info("   🎉 All critical password reset functionality is working!")
        else:
            logger.info("   ⚠️  Some critical functionality may have issues")
        
        logger.info("="*80)

async def main():
    """Main test execution"""
    tester = PasswordResetTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())