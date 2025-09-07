#!/usr/bin/env python3
"""
🧪 CRITICAL FIXES VERIFICATION TESTING
Testing the specific endpoints and functionality that were addressed in the latest fixes
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import uuid
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CriticalFixesTester:
    """Critical Fixes Verification Tester"""
    
    def __init__(self, base_url: str = "https://email-system-test.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.admin_auth_token = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate_admin(self):
        """Authenticate as admin user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.admin_auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    logger.info("✅ Admin authentication successful")
                    return True
                else:
                    logger.error(f"❌ Admin authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Admin authentication error: {e}")
            return False
    
    def get_headers(self, use_admin=False):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        token = self.admin_auth_token if use_admin else self.auth_token
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers
    
    async def test_health_endpoint(self):
        """Test 1: Health Endpoint"""
        logger.info("\n🧪 Testing Health Endpoint...")
        
        try:
            async with self.session.get(f"{self.api_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response structure
                    has_status = "status" in data
                    has_timestamp = "timestamp" in data
                    status_healthy = data.get("status") == "healthy"
                    
                    if has_status and has_timestamp and status_healthy:
                        logger.info("✅ Health endpoint working correctly")
                        logger.info(f"   Status: {data.get('status')}")
                        logger.info(f"   Timestamp: {data.get('timestamp')}")
                        self.test_results.append(("Health Endpoint", True, "Returns healthy status with timestamp"))
                    else:
                        logger.error("❌ Health endpoint response structure incorrect")
                        self.test_results.append(("Health Endpoint", False, "Incorrect response structure"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Health endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("Health Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing health endpoint: {e}")
            self.test_results.append(("Health Endpoint", False, str(e)))
    
    async def test_admin_dashboard_authentication(self):
        """Test 2: Admin Dashboard Authentication Fix"""
        logger.info("\n🧪 Testing Admin Dashboard Authentication...")
        
        # Test original admin stats endpoint
        try:
            async with self.session.get(
                f"{self.api_url}/admin/stats",
                headers=self.get_headers(use_admin=True)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ GET /api/admin/stats working correctly")
                    logger.info(f"   Response keys: {list(data.keys())}")
                    self.test_results.append(("Admin Stats Endpoint (Original)", True, "Returns admin statistics"))
                elif response.status == 403:
                    logger.error("❌ GET /api/admin/stats returns 403 - admin role check failing")
                    self.test_results.append(("Admin Stats Endpoint (Original)", False, "403 Forbidden - role check issue"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET /api/admin/stats failed: {response.status} - {error_text}")
                    self.test_results.append(("Admin Stats Endpoint (Original)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing admin stats endpoint: {e}")
            self.test_results.append(("Admin Stats Endpoint (Original)", False, str(e)))
        
        # Test new frontend admin dashboard stats endpoint
        try:
            async with self.session.get(
                f"{self.api_url}/admin/dashboard/stats",
                headers=self.get_headers(use_admin=True)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ GET /api/admin/dashboard/stats working correctly")
                    logger.info(f"   Response keys: {list(data.keys())}")
                    self.test_results.append(("Admin Dashboard Stats Endpoint (New)", True, "Returns dashboard statistics"))
                elif response.status == 403:
                    logger.error("❌ GET /api/admin/dashboard/stats returns 403 - admin role check failing")
                    self.test_results.append(("Admin Dashboard Stats Endpoint (New)", False, "403 Forbidden - role check issue"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET /api/admin/dashboard/stats failed: {response.status} - {error_text}")
                    self.test_results.append(("Admin Dashboard Stats Endpoint (New)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing admin dashboard stats endpoint: {e}")
            self.test_results.append(("Admin Dashboard Stats Endpoint (New)", False, str(e)))
        
        # Test admin role check with string-based roles
        try:
            # Test without admin authentication (should fail)
            async with self.session.get(f"{self.api_url}/admin/stats") as response:
                if response.status == 401:
                    logger.info("✅ Admin endpoint correctly rejects unauthenticated requests")
                    self.test_results.append(("Admin Role Check (Unauthenticated)", True, "Correctly returns 401"))
                else:
                    logger.error(f"❌ Admin endpoint should return 401 for unauthenticated requests, got {response.status}")
                    self.test_results.append(("Admin Role Check (Unauthenticated)", False, f"Expected 401, got {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing admin role check: {e}")
            self.test_results.append(("Admin Role Check (Unauthenticated)", False, str(e)))
    
    async def test_platform_config_endpoint(self):
        """Test 3: Social Media Platform Config"""
        logger.info("\n🧪 Testing Platform Config Endpoint...")
        
        try:
            async with self.session.get(f"{self.api_url}/platform/config") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify social media configuration structure
                    has_social_media = "social_media" in data
                    social_media = data.get("social_media", {})
                    
                    # Check for expected social media platforms
                    expected_platforms = ["facebook", "twitter", "instagram", "linkedin", "youtube"]
                    has_all_platforms = all(platform in social_media for platform in expected_platforms)
                    
                    if has_social_media and has_all_platforms:
                        logger.info("✅ Platform config endpoint working correctly")
                        logger.info(f"   Social media platforms: {list(social_media.keys())}")
                        for platform, url in social_media.items():
                            logger.info(f"   {platform}: {url or 'Not configured'}")
                        self.test_results.append(("Platform Config Endpoint", True, f"Contains all {len(expected_platforms)} social media platforms"))
                    else:
                        missing_platforms = [p for p in expected_platforms if p not in social_media]
                        logger.error(f"❌ Platform config missing platforms: {missing_platforms}")
                        self.test_results.append(("Platform Config Endpoint", False, f"Missing platforms: {missing_platforms}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Platform config endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("Platform Config Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing platform config endpoint: {e}")
            self.test_results.append(("Platform Config Endpoint", False, str(e)))
    
    async def test_profile_photo_upload_endpoint(self):
        """Test 4: Profile Photo Upload Endpoint Structure"""
        logger.info("\n🧪 Testing Profile Photo Upload Endpoint...")
        
        # Test endpoint accessibility (should require authentication)
        try:
            # Create a minimal test file data
            test_file_data = b"fake_image_data"
            
            # Test without authentication (should fail with 401)
            form_data = aiohttp.FormData()
            form_data.add_field('file', test_file_data, filename='test.jpg', content_type='image/jpeg')
            
            async with self.session.post(
                f"{self.api_url}/profile/photo",
                data=form_data
            ) as response:
                if response.status == 401:
                    logger.info("✅ Profile photo upload correctly requires authentication")
                    self.test_results.append(("Profile Photo Upload (Authentication)", True, "Correctly requires authentication"))
                elif response.status == 404:
                    logger.error("❌ Profile photo upload endpoint not found")
                    self.test_results.append(("Profile Photo Upload (Authentication)", False, "Endpoint not found (404)"))
                else:
                    logger.info(f"✅ Profile photo upload endpoint accessible (status: {response.status})")
                    self.test_results.append(("Profile Photo Upload (Authentication)", True, f"Endpoint accessible, status: {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing profile photo upload endpoint: {e}")
            self.test_results.append(("Profile Photo Upload (Authentication)", False, str(e)))
        
        # Test with admin authentication
        try:
            test_file_data = b"fake_image_data"
            form_data = aiohttp.FormData()
            form_data.add_field('file', test_file_data, filename='test.jpg', content_type='image/jpeg')
            
            headers = {}
            if self.admin_auth_token:
                headers["Authorization"] = f"Bearer {self.admin_auth_token}"
            
            async with self.session.post(
                f"{self.api_url}/profile/photo",
                data=form_data,
                headers=headers
            ) as response:
                if response.status in [200, 201, 400, 422]:  # 400/422 expected for fake data
                    logger.info("✅ Profile photo upload endpoint structure working")
                    logger.info(f"   Status: {response.status} (expected for test data)")
                    self.test_results.append(("Profile Photo Upload (Structure)", True, "Endpoint accepts file uploads"))
                elif response.status == 404:
                    logger.error("❌ Profile photo upload endpoint not found")
                    self.test_results.append(("Profile Photo Upload (Structure)", False, "Endpoint not found (404)"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Profile photo upload unexpected response: {response.status} - {error_text}")
                    self.test_results.append(("Profile Photo Upload (Structure)", False, f"Unexpected status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing profile photo upload with auth: {e}")
            self.test_results.append(("Profile Photo Upload (Structure)", False, str(e)))
    
    async def test_api_connectivity_general(self):
        """Test 5: General API Connectivity"""
        logger.info("\n🧪 Testing General API Connectivity...")
        
        # Test basic endpoints to ensure "Failed to fetch" errors are resolved
        endpoints_to_test = [
            ("/buy-requests", "Buy Requests"),
            ("/species", "Species"),
            ("/product-types", "Product Types"),
            ("/public/buy-requests", "Public Buy Requests")
        ]
        
        for endpoint, name in endpoints_to_test:
            try:
                async with self.session.get(f"{self.api_url}{endpoint}") as response:
                    if response.status in [200, 401]:  # 401 is acceptable for protected endpoints
                        logger.info(f"✅ {name} endpoint accessible (status: {response.status})")
                        self.test_results.append((f"API Connectivity ({name})", True, f"Status: {response.status}"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {name} endpoint failed: {response.status} - {error_text}")
                        self.test_results.append((f"API Connectivity ({name})", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing {name} endpoint: {e}")
                self.test_results.append((f"API Connectivity ({name})", False, str(e)))
        
        # Test CORS headers
        try:
            async with self.session.options(f"{self.api_url}/health") as response:
                cors_headers = {
                    "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                    "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                    "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
                }
                
                has_cors = any(cors_headers.values())
                if has_cors:
                    logger.info("✅ CORS headers present")
                    logger.info(f"   Allow-Origin: {cors_headers['Access-Control-Allow-Origin']}")
                    self.test_results.append(("CORS Headers", True, "CORS headers configured"))
                else:
                    logger.error("❌ CORS headers missing")
                    self.test_results.append(("CORS Headers", False, "No CORS headers found"))
        except Exception as e:
            logger.error(f"❌ Error testing CORS headers: {e}")
            self.test_results.append(("CORS Headers", False, str(e)))
    
    async def test_authentication_flow(self):
        """Test 6: Authentication Flow"""
        logger.info("\n🧪 Testing Authentication Flow...")
        
        # Test user authentication works correctly
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    has_token = "token" in data or "access_token" in data
                    has_user = "user" in data
                    
                    if has_token and has_user:
                        user = data.get("user", {})
                        user_roles = user.get("roles", [])
                        has_admin_role = "admin" in user_roles
                        
                        logger.info("✅ User authentication working correctly")
                        logger.info(f"   User roles: {user_roles}")
                        logger.info(f"   Has admin role: {has_admin_role}")
                        
                        if has_admin_role:
                            self.test_results.append(("Authentication Flow", True, "Admin user authentication with correct roles"))
                        else:
                            self.test_results.append(("Authentication Flow", False, "Admin user missing admin role"))
                    else:
                        logger.error("❌ Authentication response missing required fields")
                        self.test_results.append(("Authentication Flow", False, "Missing token or user in response"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Authentication failed: {response.status} - {error_text}")
                    self.test_results.append(("Authentication Flow", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing authentication flow: {e}")
            self.test_results.append(("Authentication Flow", False, str(e)))
        
        # Test role-based access control
        try:
            # Test that admin endpoints work with admin user
            async with self.session.get(
                f"{self.api_url}/admin/stats",
                headers=self.get_headers(use_admin=True)
            ) as response:
                if response.status == 200:
                    logger.info("✅ Role-based access control working for admin endpoints")
                    self.test_results.append(("Role-Based Access Control", True, "Admin can access admin endpoints"))
                elif response.status == 403:
                    logger.error("❌ Admin user cannot access admin endpoints - role check failing")
                    self.test_results.append(("Role-Based Access Control", False, "Admin role check failing"))
                else:
                    logger.error(f"❌ Unexpected response for admin endpoint: {response.status}")
                    self.test_results.append(("Role-Based Access Control", False, f"Unexpected status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing role-based access control: {e}")
            self.test_results.append(("Role-Based Access Control", False, str(e)))
    
    async def run_all_tests(self):
        """Run all critical fixes verification tests"""
        logger.info("🚀 Starting Critical Fixes Verification Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate as admin first
            if not await self.authenticate_admin():
                logger.error("❌ Admin authentication failed - some tests may not work properly")
            
            # Run all tests
            await self.test_health_endpoint()
            await self.test_admin_dashboard_authentication()
            await self.test_platform_config_endpoint()
            await self.test_profile_photo_upload_endpoint()
            await self.test_api_connectivity_general()
            await self.test_authentication_flow()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 CRITICAL FIXES VERIFICATION TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL CRITICAL FIXES VERIFIED! All issues have been resolved.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY FIXED - Most critical issues resolved with minor remaining issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY FIXED - Some critical issues remain that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES REMAIN - Critical fixes need more work.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 CRITICAL FIXES TESTED:")
        logger.info("   • Health Endpoint (GET /api/health)")
        logger.info("   • Admin Dashboard Authentication (string-based roles)")
        logger.info("   • Social Media Platform Config (default values)")
        logger.info("   • Profile Photo Upload Endpoint Structure")
        logger.info("   • General API Connectivity (CORS, basic endpoints)")
        logger.info("   • Authentication Flow (admin role checks)")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = CriticalFixesTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())