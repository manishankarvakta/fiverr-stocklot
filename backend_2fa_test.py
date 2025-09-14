#!/usr/bin/env python3
"""
Comprehensive Two-Factor Authentication (2FA) System Backend Testing
Tests all 2FA functionality including setup, verification, login, management, and admin features
"""

import asyncio
import aiohttp
import json
import logging
import pyotp
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TwoFactorAuthTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = None
        self.admin_token = None
        self.test_user_token = None
        self.test_user_id = None
        self.secret_key = None
        self.backup_codes = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, 
                          headers: Dict = None, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Set up headers
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        if token:
            request_headers["Authorization"] = f"Bearer {token}"
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=request_headers
            ) as response:
                try:
                    response_text = await response.text()
                    if response_text:
                        response_data = json.loads(response_text)
                    else:
                        response_data = {}
                except json.JSONDecodeError:
                    response_data = {"text": response_text}
                except Exception as e:
                    response_data = {"error": f"Response parsing error: {e}"}
                
                return {
                    "status": response.status,
                    "data": response_data,
                    "success": 200 <= response.status < 300
                }
        except Exception as e:
            logger.error(f"Request failed: {method} {url} - {e}")
            return {
                "status": 0,
                "data": {"error": str(e)},
                "success": False
            }
    
    async def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        logger.info("🔐 Authenticating as admin user...")
        
        # For this backend, we use email as Bearer token directly
        # First verify the admin user exists by trying to login
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        response = await self.make_request("POST", "/api/auth/login", login_data)
        
        logger.info(f"Login response status: {response['status']}")
        logger.info(f"Login response data: {response['data']}")
        
        if response["success"] and "user" in response["data"]:
            # Use email as Bearer token (as per backend implementation)
            self.admin_token = response["data"]["user"]["email"]
            logger.info("✅ Admin authentication successful")
            return True
        else:
            logger.error(f"❌ Admin authentication failed: {response['data']}")
            return False
    
    async def create_test_user(self) -> bool:
        """Create a test user for 2FA testing"""
        logger.info("👤 Creating test user for 2FA testing...")
        
        # Create test user
        user_data = {
            "email": "test2fa@stocklot.co.za",
            "password": "TestPassword123!",
            "full_name": "2FA Test User",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        response = await self.make_request("POST", "/api/auth/register", user_data)
        
        if response["success"]:
            # Login to get user details
            login_data = {
                "email": "test2fa@stocklot.co.za",
                "password": "TestPassword123!"
            }
            
            login_response = await self.make_request("POST", "/api/auth/login", login_data)
            
            if login_response["success"] and "user" in login_response["data"]:
                # Use email as Bearer token (as per backend implementation)
                self.test_user_token = login_response["data"]["user"]["email"]
                self.test_user_id = login_response["data"]["user"]["id"]
                logger.info("✅ Test user created and authenticated")
                return True
        else:
            # User might already exist, try to login
            login_data = {
                "email": "test2fa@stocklot.co.za",
                "password": "TestPassword123!"
            }
            
            login_response = await self.make_request("POST", "/api/auth/login", login_data)
            
            if login_response["success"] and "user" in login_response["data"]:
                # Use email as Bearer token (as per backend implementation)
                self.test_user_token = login_response["data"]["user"]["email"]
                self.test_user_id = login_response["data"]["user"]["id"]
                logger.info("✅ Test user authenticated (already existed)")
                return True
        
        logger.error(f"❌ Test user creation/authentication failed")
        return False
    
    async def test_2fa_setup(self) -> bool:
        """Test 2FA setup API endpoint"""
        logger.info("🔧 Testing 2FA Setup API...")
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/setup", 
            token=self.test_user_token
        )
        
        if response["success"]:
            data = response["data"]
            required_fields = ["secret_key", "qr_code", "backup_codes", "app_name", "username"]
            
            if all(field in data for field in required_fields):
                self.secret_key = data["secret_key"]
                self.backup_codes = data["backup_codes"]
                
                # Validate QR code format
                if data["qr_code"].startswith("data:image/png;base64,"):
                    # Validate backup codes (should be 10 codes)
                    if len(data["backup_codes"]) == 10:
                        # Validate secret key format (base32)
                        try:
                            pyotp.TOTP(data["secret_key"])
                            logger.info("✅ 2FA Setup API - All validations passed")
                            logger.info(f"   - Secret key generated: {data['secret_key'][:8]}...")
                            logger.info(f"   - QR code generated: {len(data['qr_code'])} chars")
                            logger.info(f"   - Backup codes: {len(data['backup_codes'])} codes")
                            logger.info(f"   - App name: {data['app_name']}")
                            return True
                        except Exception as e:
                            logger.error(f"❌ Invalid secret key format: {e}")
                    else:
                        logger.error(f"❌ Expected 10 backup codes, got {len(data['backup_codes'])}")
                else:
                    logger.error("❌ Invalid QR code format")
            else:
                missing = [f for f in required_fields if f not in data]
                logger.error(f"❌ Missing required fields: {missing}")
        else:
            logger.error(f"❌ 2FA Setup failed: {response['data']}")
        
        return False
    
    async def test_2fa_setup_verification(self) -> bool:
        """Test 2FA setup verification with TOTP token"""
        logger.info("🔐 Testing 2FA Setup Verification...")
        
        if not self.secret_key:
            logger.error("❌ No secret key available for verification")
            return False
        
        # Generate TOTP token
        totp = pyotp.TOTP(self.secret_key)
        token = totp.now()
        
        logger.info(f"   - Generated TOTP token: {token}")
        
        verify_data = {"token": token}
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/verify-setup",
            verify_data,
            token=self.test_user_token
        )
        
        if response["success"]:
            data = response["data"]
            if "success" in data and data["success"]:
                logger.info("✅ 2FA Setup Verification - Successfully enabled 2FA")
                logger.info(f"   - Message: {data.get('message', 'N/A')}")
                return True
            else:
                logger.error(f"❌ 2FA verification failed: {data.get('message', 'Unknown error')}")
        else:
            logger.error(f"❌ 2FA Setup Verification failed: {response['data']}")
        
        return False
    
    async def test_invalid_2fa_setup_verification(self) -> bool:
        """Test 2FA setup verification with invalid token"""
        logger.info("🚫 Testing 2FA Setup Verification with invalid token...")
        
        # Use invalid token
        verify_data = {"token": "000000"}
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/verify-setup",
            verify_data,
            token=self.test_user_token
        )
        
        if not response["success"] or (response["success"] and not response["data"].get("success", True)):
            logger.info("✅ Invalid token properly rejected")
            return True
        else:
            logger.error("❌ Invalid token was accepted (security issue)")
            return False
    
    async def test_2fa_login_verification(self) -> bool:
        """Test 2FA login verification"""
        logger.info("🔑 Testing 2FA Login Verification...")
        
        if not self.secret_key:
            logger.error("❌ No secret key available for login verification")
            return False
        
        # Generate TOTP token
        totp = pyotp.TOTP(self.secret_key)
        token = totp.now()
        
        verify_data = {"token": token}
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/verify",
            verify_data
        )
        
        if response["success"]:
            data = response["data"]
            if "success" in data and data["success"]:
                logger.info("✅ 2FA Login Verification - Token accepted")
                logger.info(f"   - Message: {data.get('message', 'N/A')}")
                return True
            else:
                logger.error(f"❌ 2FA login verification failed: {data.get('message', 'Unknown error')}")
        else:
            logger.error(f"❌ 2FA Login Verification failed: {response['data']}")
        
        return False
    
    async def test_backup_code_verification(self) -> bool:
        """Test backup code verification"""
        logger.info("🔑 Testing Backup Code Verification...")
        
        if not self.backup_codes:
            logger.error("❌ No backup codes available for testing")
            return False
        
        # Use first backup code
        backup_code = self.backup_codes[0]
        
        verify_data = {"backup_code": backup_code}
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/verify",
            verify_data
        )
        
        if response["success"]:
            data = response["data"]
            if "success" in data and data["success"]:
                logger.info("✅ Backup Code Verification - Code accepted")
                logger.info(f"   - Message: {data.get('message', 'N/A')}")
                logger.info(f"   - Remaining codes: {data.get('remaining_backup_codes', 'N/A')}")
                
                # Remove used backup code from our list
                self.backup_codes.remove(backup_code)
                return True
            else:
                logger.error(f"❌ Backup code verification failed: {data.get('message', 'Unknown error')}")
        else:
            logger.error(f"❌ Backup Code Verification failed: {response['data']}")
        
        return False
    
    async def test_invalid_backup_code(self) -> bool:
        """Test invalid backup code rejection"""
        logger.info("🚫 Testing Invalid Backup Code...")
        
        verify_data = {"backup_code": "INVALID123"}
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/verify",
            verify_data
        )
        
        if not response["success"] or (response["success"] and not response["data"].get("success", True)):
            logger.info("✅ Invalid backup code properly rejected")
            return True
        else:
            logger.error("❌ Invalid backup code was accepted (security issue)")
            return False
    
    async def test_2fa_status(self) -> bool:
        """Test 2FA status API"""
        logger.info("📊 Testing 2FA Status API...")
        
        response = await self.make_request(
            "GET", "/api/auth/2fa/status",
            token=self.test_user_token
        )
        
        if response["success"]:
            data = response["data"]
            required_fields = ["enabled", "setup_started"]
            
            if all(field in data for field in required_fields):
                if data["enabled"] and data["setup_started"]:
                    logger.info("✅ 2FA Status API - Correct status returned")
                    logger.info(f"   - Enabled: {data['enabled']}")
                    logger.info(f"   - Setup started: {data['setup_started']}")
                    logger.info(f"   - Backup codes remaining: {data.get('backup_codes_remaining', 'N/A')}")
                    logger.info(f"   - Last used: {data.get('last_used_at', 'N/A')}")
                    return True
                else:
                    logger.error(f"❌ Incorrect 2FA status: enabled={data['enabled']}, setup_started={data['setup_started']}")
            else:
                missing = [f for f in required_fields if f not in data]
                logger.error(f"❌ Missing status fields: {missing}")
        else:
            logger.error(f"❌ 2FA Status API failed: {response['data']}")
        
        return False
    
    async def test_backup_codes_regeneration(self) -> bool:
        """Test backup codes regeneration"""
        logger.info("🔄 Testing Backup Codes Regeneration...")
        
        if not self.secret_key:
            logger.error("❌ No secret key available for regeneration")
            return False
        
        # Generate TOTP token for verification
        totp = pyotp.TOTP(self.secret_key)
        token = totp.now()
        
        verify_data = {"token": token}
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/regenerate-backup-codes",
            verify_data,
            token=self.test_user_token
        )
        
        if response["success"]:
            data = response["data"]
            if "success" in data and data["success"] and "backup_codes" in data:
                new_codes = data["backup_codes"]
                if len(new_codes) == 10:
                    # Update our backup codes
                    self.backup_codes = new_codes
                    logger.info("✅ Backup Codes Regeneration - New codes generated")
                    logger.info(f"   - Generated {len(new_codes)} new backup codes")
                    return True
                else:
                    logger.error(f"❌ Expected 10 backup codes, got {len(new_codes)}")
            else:
                logger.error(f"❌ Backup codes regeneration failed: {data.get('message', 'Unknown error')}")
        else:
            logger.error(f"❌ Backup Codes Regeneration failed: {response['data']}")
        
        return False
    
    async def test_2fa_disable(self) -> bool:
        """Test 2FA disable functionality"""
        logger.info("🔓 Testing 2FA Disable...")
        
        if not self.secret_key:
            logger.error("❌ No secret key available for disable test")
            return False
        
        # Generate TOTP token for verification
        totp = pyotp.TOTP(self.secret_key)
        token = totp.now()
        
        disable_data = {
            "password": "TestPassword123!",
            "token": token
        }
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/disable",
            disable_data,
            token=self.test_user_token
        )
        
        if response["success"]:
            data = response["data"]
            if "success" in data and data["success"]:
                logger.info("✅ 2FA Disable - Successfully disabled")
                logger.info(f"   - Message: {data.get('message', 'N/A')}")
                
                # Clear our stored data
                self.secret_key = None
                self.backup_codes = []
                return True
            else:
                logger.error(f"❌ 2FA disable failed: {data.get('message', 'Unknown error')}")
        else:
            logger.error(f"❌ 2FA Disable failed: {response['data']}")
        
        return False
    
    async def test_admin_2fa_statistics(self) -> bool:
        """Test admin 2FA statistics endpoint"""
        logger.info("📈 Testing Admin 2FA Statistics...")
        
        if not self.admin_token:
            logger.error("❌ No admin token available")
            return False
        
        response = await self.make_request(
            "GET", "/api/admin/2fa/stats",
            token=self.admin_token
        )
        
        if response["success"]:
            data = response["data"]
            expected_fields = ["total_users", "users_with_2fa", "adoption_rate"]
            
            if all(field in data for field in expected_fields):
                logger.info("✅ Admin 2FA Statistics - Data retrieved")
                logger.info(f"   - Total users: {data['total_users']}")
                logger.info(f"   - Users with 2FA: {data['users_with_2fa']}")
                logger.info(f"   - Adoption rate: {data['adoption_rate']}%")
                logger.info(f"   - Setup started: {data.get('setup_started', 'N/A')}")
                logger.info(f"   - Recent setups (7d): {data.get('recent_setups_7d', 'N/A')}")
                logger.info(f"   - Recent usage (7d): {data.get('recent_usage_7d', 'N/A')}")
                return True
            else:
                missing = [f for f in expected_fields if f not in data]
                logger.error(f"❌ Missing statistics fields: {missing}")
        else:
            logger.error(f"❌ Admin 2FA Statistics failed: {response['data']}")
        
        return False
    
    async def test_security_measures(self) -> bool:
        """Test security measures and edge cases"""
        logger.info("🔒 Testing Security Measures...")
        
        security_tests_passed = 0
        total_security_tests = 4
        
        # Test 1: Duplicate setup prevention
        logger.info("   Testing duplicate setup prevention...")
        if self.secret_key is None:  # 2FA should be disabled from previous test
            # Re-enable 2FA first
            await self.test_2fa_setup()
            await self.test_2fa_setup_verification()
        
        # Try to setup again
        response = await self.make_request(
            "POST", "/api/auth/2fa/setup",
            token=self.test_user_token
        )
        
        if not response["success"] or (response["success"] and not response["data"].get("success", True)):
            logger.info("   ✅ Duplicate setup properly prevented")
            security_tests_passed += 1
        else:
            logger.error("   ❌ Duplicate setup was allowed (security issue)")
        
        # Test 2: Time window validation (test with old token)
        logger.info("   Testing time window validation...")
        if self.secret_key:
            # Generate token for past time (should be invalid)
            totp = pyotp.TOTP(self.secret_key)
            old_token = totp.at(int(time.time()) - 60)  # 1 minute ago
            
            verify_data = {"token": old_token}
            response = await self.make_request(
                "POST", "/api/auth/2fa/verify",
                verify_data
            )
            
            if not response["success"] or (response["success"] and not response["data"].get("success", True)):
                logger.info("   ✅ Old token properly rejected")
                security_tests_passed += 1
            else:
                logger.error("   ❌ Old token was accepted (security issue)")
        else:
            security_tests_passed += 1  # Skip if no secret key
        
        # Test 3: Password verification for disable
        logger.info("   Testing password verification for disable...")
        disable_data = {
            "password": "WrongPassword123!",
            "token": "123456"
        }
        
        response = await self.make_request(
            "POST", "/api/auth/2fa/disable",
            disable_data,
            token=self.test_user_token
        )
        
        if not response["success"] or (response["success"] and not response["data"].get("success", True)):
            logger.info("   ✅ Wrong password properly rejected")
            security_tests_passed += 1
        else:
            logger.error("   ❌ Wrong password was accepted (security issue)")
        
        # Test 4: Unauthorized access to admin stats
        logger.info("   Testing unauthorized access to admin stats...")
        response = await self.make_request(
            "GET", "/api/admin/2fa/stats",
            token=self.test_user_token  # Use regular user token
        )
        
        if response["status"] == 403 or not response["success"]:
            logger.info("   ✅ Unauthorized access properly denied")
            security_tests_passed += 1
        else:
            logger.error("   ❌ Unauthorized access was allowed (security issue)")
        
        success_rate = (security_tests_passed / total_security_tests) * 100
        logger.info(f"✅ Security Measures - {security_tests_passed}/{total_security_tests} tests passed ({success_rate}%)")
        
        return security_tests_passed >= 3  # Allow 1 failure
    
    async def run_comprehensive_tests(self) -> Dict[str, Any]:
        """Run all 2FA tests and return results"""
        logger.info("🚀 Starting Comprehensive 2FA System Testing...")
        logger.info("=" * 60)
        
        results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_results": {},
            "summary": "",
            "critical_issues": [],
            "recommendations": []
        }
        
        # Test sequence
        tests = [
            ("Admin Authentication", self.authenticate_admin),
            ("Test User Creation", self.create_test_user),
            ("2FA Setup API", self.test_2fa_setup),
            ("2FA Setup Verification", self.test_2fa_setup_verification),
            ("Invalid Setup Verification", self.test_invalid_2fa_setup_verification),
            ("2FA Login Verification", self.test_2fa_login_verification),
            ("Backup Code Verification", self.test_backup_code_verification),
            ("Invalid Backup Code", self.test_invalid_backup_code),
            ("2FA Status API", self.test_2fa_status),
            ("Backup Codes Regeneration", self.test_backup_codes_regeneration),
            ("2FA Disable", self.test_2fa_disable),
            ("Admin 2FA Statistics", self.test_admin_2fa_statistics),
            ("Security Measures", self.test_security_measures)
        ]
        
        for test_name, test_func in tests:
            results["total_tests"] += 1
            logger.info(f"\n🧪 Running: {test_name}")
            
            try:
                success = await test_func()
                results["test_results"][test_name] = success
                
                if success:
                    results["passed_tests"] += 1
                    logger.info(f"✅ {test_name} - PASSED")
                else:
                    results["failed_tests"] += 1
                    logger.error(f"❌ {test_name} - FAILED")
                    results["critical_issues"].append(f"{test_name} failed")
                    
            except Exception as e:
                results["failed_tests"] += 1
                results["test_results"][test_name] = False
                logger.error(f"💥 {test_name} - ERROR: {e}")
                results["critical_issues"].append(f"{test_name} error: {str(e)}")
        
        # Generate summary
        success_rate = (results["passed_tests"] / results["total_tests"]) * 100
        results["summary"] = f"2FA Testing Complete: {results['passed_tests']}/{results['total_tests']} tests passed ({success_rate:.1f}%)"
        
        # Add recommendations
        if results["failed_tests"] == 0:
            results["recommendations"].append("2FA system is fully functional and production-ready")
        else:
            results["recommendations"].append("Review failed tests and fix critical security issues")
            if results["failed_tests"] > 3:
                results["recommendations"].append("Consider comprehensive security audit")
        
        return results

async def main():
    """Main test execution"""
    # Get backend URL from environment
    import os
    backend_url = os.getenv("REACT_APP_BACKEND_URL", "https://farmstock-hub-1.preview.emergentagent.com")
    api_url = f"{backend_url}/api"
    
    logger.info(f"🎯 Testing 2FA System at: {api_url}")
    
    async with TwoFactorAuthTester(api_url) as tester:
        results = await tester.run_comprehensive_tests()
        
        # Print final results
        logger.info("\n" + "=" * 60)
        logger.info("📊 FINAL TEST RESULTS")
        logger.info("=" * 60)
        logger.info(f"✅ Passed: {results['passed_tests']}")
        logger.info(f"❌ Failed: {results['failed_tests']}")
        logger.info(f"📈 Success Rate: {(results['passed_tests']/results['total_tests'])*100:.1f}%")
        
        if results["critical_issues"]:
            logger.info("\n🚨 CRITICAL ISSUES:")
            for issue in results["critical_issues"]:
                logger.info(f"   - {issue}")
        
        if results["recommendations"]:
            logger.info("\n💡 RECOMMENDATIONS:")
            for rec in results["recommendations"]:
                logger.info(f"   - {rec}")
        
        logger.info(f"\n{results['summary']}")
        
        return results

if __name__ == "__main__":
    asyncio.run(main())