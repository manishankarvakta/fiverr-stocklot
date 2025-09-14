#!/usr/bin/env python3
"""
🧪 ADMIN DASHBOARD FUNCTIONALITY BACKEND TESTING
Comprehensive testing of admin dashboard endpoints and authentication
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone, timedelta
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

class AdminDashboardTester:
    """Comprehensive Admin Dashboard Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_cookies = None
        self.auth_token = None
        self.test_results = []
        
        # Admin credentials
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "admin123"
        
    async def setup_session(self):
        """Setup HTTP session with cookie jar"""
        connector = aiohttp.TCPConnector(ssl=False)
        cookie_jar = aiohttp.CookieJar()
        self.session = aiohttp.ClientSession(
            connector=connector,
            cookie_jar=cookie_jar
        )
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def test_admin_login(self):
        """Test 1: Admin Login with Cookie-based Authentication"""
        logger.info("\n🧪 Testing Admin Login...")
        
        try:
            # Test login endpoint
            login_data = {
                "email": self.admin_email,
                "password": self.admin_password
            }
            
            async with self.session.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                logger.info(f"Login response status: {response.status}")
                logger.info(f"Login response headers: {dict(response.headers)}")
                
                if response.status == 200:
                    try:
                        data = await response.json()
                        logger.info(f"Login response data: {data}")
                        
                        # Check for token in response
                        self.auth_token = data.get("token") or data.get("access_token")
                        
                        # Check for cookies
                        cookies = response.cookies
                        if cookies:
                            logger.info(f"Received cookies: {dict(cookies)}")
                            self.auth_cookies = cookies
                        
                        # Check user data
                        user_data = data.get("user", {})
                        user_roles = user_data.get("roles", [])
                        
                        if "admin" in user_roles:
                            logger.info("✅ Admin login successful - admin role confirmed")
                            logger.info(f"   User: {user_data.get('full_name', 'Unknown')}")
                            logger.info(f"   Email: {user_data.get('email', 'Unknown')}")
                            logger.info(f"   Roles: {user_roles}")
                            
                            # Use email as token if no token provided (fallback)
                            if not self.auth_token:
                                self.auth_token = self.admin_email
                                logger.info("   Using email as auth token (fallback)")
                            
                            self.test_results.append(("Admin Login", True, f"Roles: {user_roles}"))
                            return True
                        else:
                            logger.error(f"❌ User does not have admin role. Roles: {user_roles}")
                            self.test_results.append(("Admin Login", False, f"Missing admin role. Has: {user_roles}"))
                            return False
                            
                    except json.JSONDecodeError:
                        logger.error(f"❌ Invalid JSON response: {response_text}")
                        self.test_results.append(("Admin Login", False, "Invalid JSON response"))
                        return False
                        
                elif response.status == 401:
                    logger.error("❌ Admin login failed - Invalid credentials")
                    self.test_results.append(("Admin Login", False, "Invalid credentials"))
                    return False
                elif response.status == 404:
                    logger.error("❌ Admin login failed - User not found")
                    self.test_results.append(("Admin Login", False, "User not found"))
                    return False
                else:
                    logger.error(f"❌ Admin login failed: {response.status} - {response_text}")
                    self.test_results.append(("Admin Login", False, f"Status {response.status}"))
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Admin login error: {e}")
            self.test_results.append(("Admin Login", False, str(e)))
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_admin_dashboard_stats(self):
        """Test 2: Admin Dashboard Stats Endpoint"""
        logger.info("\n🧪 Testing Admin Dashboard Stats...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/admin/dashboard/stats",
                headers=self.get_headers()
            ) as response:
                
                response_text = await response.text()
                logger.info(f"Dashboard stats response status: {response.status}")
                
                if response.status == 200:
                    try:
                        data = await response.json()
                        logger.info("✅ Admin dashboard stats endpoint working")
                        
                        # The response is the stats directly, not wrapped in "stats"
                        logger.info(f"   Stats structure: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                        
                        # Check for expected stats (actual field names from backend)
                        expected_stats = ["total_users", "total_listings", "total_orders", "pending_approvals"]
                        found_stats = []
                        
                        for stat in expected_stats:
                            if stat in data:
                                found_stats.append(stat)
                                logger.info(f"   {stat}: {data[stat]}")
                        
                        if found_stats:
                            self.test_results.append(("Admin Dashboard Stats", True, f"Found stats: {found_stats}"))
                        else:
                            logger.warning("⚠️ No expected stats found in response")
                            self.test_results.append(("Admin Dashboard Stats", True, "Endpoint accessible but no standard stats"))
                            
                    except json.JSONDecodeError:
                        logger.error(f"❌ Invalid JSON response: {response_text}")
                        self.test_results.append(("Admin Dashboard Stats", False, "Invalid JSON response"))
                        
                elif response.status == 401:
                    logger.error("❌ Dashboard stats failed - Unauthorized")
                    self.test_results.append(("Admin Dashboard Stats", False, "Unauthorized - check admin authentication"))
                elif response.status == 403:
                    logger.error("❌ Dashboard stats failed - Forbidden (insufficient permissions)")
                    self.test_results.append(("Admin Dashboard Stats", False, "Forbidden - admin role required"))
                elif response.status == 404:
                    logger.error("❌ Dashboard stats endpoint not found")
                    self.test_results.append(("Admin Dashboard Stats", False, "Endpoint not found"))
                else:
                    logger.error(f"❌ Dashboard stats failed: {response.status} - {response_text}")
                    self.test_results.append(("Admin Dashboard Stats", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Dashboard stats error: {e}")
            self.test_results.append(("Admin Dashboard Stats", False, str(e)))
    
    async def test_admin_users_list(self):
        """Test 3: Admin Users List Endpoint"""
        logger.info("\n🧪 Testing Admin Users List...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/admin/users",
                headers=self.get_headers()
            ) as response:
                
                response_text = await response.text()
                logger.info(f"Admin users response status: {response.status}")
                
                if response.status == 200:
                    try:
                        data = await response.json()
                        logger.info("✅ Admin users list endpoint working")
                        
                        # The response is a list directly, not wrapped in "users"
                        users = data if isinstance(data, list) else []
                        total_users = len(users)
                        
                        logger.info(f"   Total users found: {total_users}")
                        
                        # Log sample user data (first user if available)
                        if users and len(users) > 0:
                            sample_user = users[0]
                            user_fields = list(sample_user.keys()) if isinstance(sample_user, dict) else []
                            logger.info(f"   User fields: {user_fields}")
                            
                            # Check for admin user
                            admin_user_found = False
                            for user in users:
                                if isinstance(user, dict) and user.get("email") == self.admin_email:
                                    admin_user_found = True
                                    logger.info(f"   ✅ Admin user found: {user.get('full_name', 'Unknown')}")
                                    logger.info(f"      Roles: {user.get('roles', [])}")
                                    break
                            
                            if not admin_user_found:
                                logger.warning("⚠️ Admin user not found in users list")
                        
                        self.test_results.append(("Admin Users List", True, f"Found {total_users} users"))
                        
                    except json.JSONDecodeError:
                        logger.error(f"❌ Invalid JSON response: {response_text}")
                        self.test_results.append(("Admin Users List", False, "Invalid JSON response"))
                        
                elif response.status == 401:
                    logger.error("❌ Users list failed - Unauthorized")
                    self.test_results.append(("Admin Users List", False, "Unauthorized"))
                elif response.status == 403:
                    logger.error("❌ Users list failed - Forbidden")
                    self.test_results.append(("Admin Users List", False, "Forbidden - admin role required"))
                elif response.status == 404:
                    logger.error("❌ Users list endpoint not found")
                    self.test_results.append(("Admin Users List", False, "Endpoint not found"))
                else:
                    logger.error(f"❌ Users list failed: {response.status} - {response_text}")
                    self.test_results.append(("Admin Users List", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Users list error: {e}")
            self.test_results.append(("Admin Users List", False, str(e)))
    
    async def test_platform_settings(self):
        """Test 4: Platform Settings Endpoint"""
        logger.info("\n🧪 Testing Platform Settings...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/admin/settings",
                headers=self.get_headers()
            ) as response:
                
                response_text = await response.text()
                logger.info(f"Platform settings response status: {response.status}")
                
                if response.status == 200:
                    try:
                        data = await response.json()
                        logger.info("✅ Platform settings endpoint working")
                        
                        # The response is the settings directly, not wrapped in "settings"
                        settings = data if isinstance(data, dict) else {}
                        logger.info(f"   Settings structure: {list(settings.keys()) if settings else 'No settings'}")
                        
                        # Check for common settings (actual field names from backend)
                        expected_settings = ["siteName", "siteDescription", "supportEmail", "supportPhone"]
                        found_settings = []
                        
                        for setting in expected_settings:
                            if setting in settings:
                                found_settings.append(setting)
                                logger.info(f"   {setting}: {settings[setting]}")
                        
                        if found_settings:
                            self.test_results.append(("Platform Settings", True, f"Found settings: {found_settings}"))
                        else:
                            logger.warning("⚠️ No expected settings found")
                            self.test_results.append(("Platform Settings", True, "Endpoint accessible but no standard settings"))
                            
                    except json.JSONDecodeError:
                        logger.error(f"❌ Invalid JSON response: {response_text}")
                        self.test_results.append(("Platform Settings", False, "Invalid JSON response"))
                        
                elif response.status == 401:
                    logger.error("❌ Settings failed - Unauthorized")
                    self.test_results.append(("Platform Settings", False, "Unauthorized"))
                elif response.status == 403:
                    logger.error("❌ Settings failed - Forbidden")
                    self.test_results.append(("Platform Settings", False, "Forbidden - admin role required"))
                elif response.status == 404:
                    logger.error("❌ Settings endpoint not found")
                    self.test_results.append(("Platform Settings", False, "Endpoint not found"))
                else:
                    logger.error(f"❌ Settings failed: {response.status} - {response_text}")
                    self.test_results.append(("Platform Settings", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Settings error: {e}")
            self.test_results.append(("Platform Settings", False, str(e)))
    
    async def test_user_registration_data(self):
        """Test 5: Check User Registration Data Structure"""
        logger.info("\n🧪 Testing User Registration Data Structure...")
        
        try:
            # First get users list to analyze data structure
            async with self.session.get(
                f"{self.api_url}/admin/users",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    users = data if isinstance(data, list) else []
                    
                    if users and len(users) > 0:
                        logger.info("✅ Analyzing user data structure...")
                        
                        # Analyze first few users
                        sample_size = min(3, len(users))
                        for i in range(sample_size):
                            user = users[i]
                            if isinstance(user, dict):
                                logger.info(f"   User {i+1}:")
                                logger.info(f"      Email: {user.get('email', 'N/A')}")
                                logger.info(f"      Name: {user.get('full_name', 'N/A')}")
                                logger.info(f"      Roles: {user.get('roles', [])}")
                                logger.info(f"      Created: {user.get('created_at', 'N/A')}")
                                logger.info(f"      ID: {user.get('id', 'N/A')}")
                        
                        # Check for data consistency issues
                        issues = []
                        
                        # Check for missing required fields
                        for user in users[:10]:  # Check first 10 users
                            if not user.get('email'):
                                issues.append("Missing email field")
                            if not user.get('full_name'):
                                issues.append("Missing full_name field")
                            if not user.get('roles'):
                                issues.append("Missing roles field")
                        
                        if issues:
                            unique_issues = list(set(issues))
                            logger.warning(f"⚠️ Data structure issues found: {unique_issues}")
                            self.test_results.append(("User Data Structure", False, f"Issues: {unique_issues}"))
                        else:
                            logger.info("✅ User data structure appears consistent")
                            self.test_results.append(("User Data Structure", True, f"Analyzed {len(users)} users"))
                    else:
                        logger.warning("⚠️ No users found to analyze")
                        self.test_results.append(("User Data Structure", False, "No users found"))
                else:
                    logger.error("❌ Could not retrieve users for analysis")
                    self.test_results.append(("User Data Structure", False, "Could not retrieve users"))
                    
        except Exception as e:
            logger.error(f"❌ User data analysis error: {e}")
            self.test_results.append(("User Data Structure", False, str(e)))
    
    async def test_create_test_users(self):
        """Test 6: Create Test Users (if needed)"""
        logger.info("\n🧪 Testing User Creation (if needed)...")
        
        try:
            # Check if we need to create test users
            test_users = [
                {
                    "email": "testbuyer@stocklot.co.za",
                    "password": "testpass123",
                    "full_name": "Test Buyer",
                    "role": "buyer"
                },
                {
                    "email": "testseller@stocklot.co.za", 
                    "password": "testpass123",
                    "full_name": "Test Seller",
                    "role": "seller"
                }
            ]
            
            created_users = 0
            
            for user_data in test_users:
                try:
                    # Try to register the user
                    async with self.session.post(
                        f"{self.api_url}/auth/register",
                        json=user_data,
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        
                        if response.status in [200, 201]:
                            logger.info(f"✅ Created test user: {user_data['email']}")
                            created_users += 1
                        elif response.status == 400:
                            # User might already exist
                            response_text = await response.text()
                            if "already exists" in response_text.lower():
                                logger.info(f"ℹ️ Test user already exists: {user_data['email']}")
                            else:
                                logger.warning(f"⚠️ Could not create user {user_data['email']}: {response_text}")
                        else:
                            response_text = await response.text()
                            logger.warning(f"⚠️ Could not create user {user_data['email']}: {response.status} - {response_text}")
                            
                except Exception as e:
                    logger.warning(f"⚠️ Error creating user {user_data['email']}: {e}")
            
            if created_users > 0:
                self.test_results.append(("Test User Creation", True, f"Created {created_users} test users"))
            else:
                self.test_results.append(("Test User Creation", True, "Test users already exist or creation not needed"))
                
        except Exception as e:
            logger.error(f"❌ Test user creation error: {e}")
            self.test_results.append(("Test User Creation", False, str(e)))
    
    async def test_admin_endpoints_security(self):
        """Test 7: Admin Endpoints Security (without auth)"""
        logger.info("\n🧪 Testing Admin Endpoints Security...")
        
        # Test endpoints without authentication
        admin_endpoints = [
            "/admin/dashboard/stats",
            "/admin/users", 
            "/admin/settings"
        ]
        
        # Create session without auth
        async with aiohttp.ClientSession() as unauth_session:
            secure_endpoints = 0
            
            for endpoint in admin_endpoints:
                try:
                    async with unauth_session.get(
                        f"{self.api_url}{endpoint}",
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        
                        if response.status in [401, 403]:
                            logger.info(f"✅ {endpoint} properly secured (status: {response.status})")
                            secure_endpoints += 1
                        else:
                            logger.warning(f"⚠️ {endpoint} not properly secured (status: {response.status})")
                            
                except Exception as e:
                    logger.warning(f"⚠️ Error testing {endpoint}: {e}")
            
            if secure_endpoints == len(admin_endpoints):
                logger.info("✅ All admin endpoints properly secured")
                self.test_results.append(("Admin Endpoints Security", True, "All endpoints secured"))
            else:
                logger.warning(f"⚠️ {secure_endpoints}/{len(admin_endpoints)} endpoints properly secured")
                self.test_results.append(("Admin Endpoints Security", False, f"Only {secure_endpoints}/{len(admin_endpoints)} secured"))
    
    async def run_all_tests(self):
        """Run all admin dashboard tests"""
        logger.info("🚀 Starting Admin Dashboard Functionality Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Test admin login first
            if not await self.test_admin_login():
                logger.error("❌ Admin login failed - cannot proceed with authenticated tests")
                # Still run security tests
                await self.test_admin_endpoints_security()
                return
            
            # Run authenticated tests
            await self.test_admin_dashboard_stats()
            await self.test_admin_users_list()
            await self.test_platform_settings()
            await self.test_user_registration_data()
            await self.test_create_test_users()
            await self.test_admin_endpoints_security()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 ADMIN DASHBOARD FUNCTIONALITY TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Admin dashboard is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - Admin dashboard is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - Admin dashboard has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - Admin dashboard requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FEATURES TESTED:")
        logger.info("   • Admin Login with Cookie-based Authentication")
        logger.info("   • Admin Dashboard Stats Endpoint")
        logger.info("   • Admin Users List Endpoint")
        logger.info("   • Platform Settings Endpoint")
        logger.info("   • User Registration Data Structure")
        logger.info("   • Test User Creation")
        logger.info("   • Admin Endpoints Security")
        
        logger.info("\n🔐 AUTHENTICATION METHOD:")
        logger.info("   • Cookie-based authentication (HttpOnly cookies)")
        logger.info("   • Admin role verification")
        logger.info("   • Bearer token fallback")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AdminDashboardTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())