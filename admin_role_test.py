#!/usr/bin/env python3
"""
🧪 ADMIN USER ROLE TESTING
Testing admin user role assignment for seller dashboard access
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AdminUserRoleTester:
    """Admin User Role Testing for Seller Dashboard Access"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.admin_user_id = None
        
        # MongoDB connection
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[os.environ.get('DB_NAME', 'stocklot')]
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
        if self.client:
            self.client.close()
    
    async def authenticate(self):
        """Authenticate as admin user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    logger.info("✅ Authentication successful")
                    return True
                else:
                    logger.error(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_get_current_admin_user(self):
        """Test 1: Get current admin user details"""
        logger.info("\n🧪 Testing Get Current Admin User...")
        
        try:
            # First check via API
            async with self.session.get(f"{self.api_url}/users", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    users = data.get("users", [])
                    
                    admin_user = None
                    for user in users:
                        if user.get("email") == "admin@stocklot.co.za":
                            admin_user = user
                            self.admin_user_id = user.get("id")
                            break
                    
                    if admin_user:
                        current_roles = admin_user.get("roles", [])
                        logger.info(f"✅ Found admin user via API")
                        logger.info(f"   User ID: {admin_user.get('id')}")
                        logger.info(f"   Email: {admin_user.get('email')}")
                        logger.info(f"   Current roles: {current_roles}")
                        
                        has_seller_role = "seller" in current_roles
                        self.test_results.append(("Get Admin User (API)", True, f"Roles: {current_roles}, Has seller: {has_seller_role}"))
                        
                        return admin_user, has_seller_role
                    else:
                        logger.error("❌ Admin user not found via API")
                        self.test_results.append(("Get Admin User (API)", False, "Admin user not found"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to get users via API: {response.status} - {error_text}")
                    self.test_results.append(("Get Admin User (API)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error getting admin user via API: {e}")
            self.test_results.append(("Get Admin User (API)", False, str(e)))
        
        # Also check directly in database
        try:
            admin_user_doc = await self.db.users.find_one({"email": "admin@stocklot.co.za"})
            if admin_user_doc:
                current_roles = admin_user_doc.get("roles", [])
                self.admin_user_id = admin_user_doc.get("id")
                
                logger.info(f"✅ Found admin user in database")
                logger.info(f"   User ID: {admin_user_doc.get('id')}")
                logger.info(f"   Email: {admin_user_doc.get('email')}")
                logger.info(f"   Current roles: {current_roles}")
                
                has_seller_role = "seller" in current_roles
                self.test_results.append(("Get Admin User (Database)", True, f"Roles: {current_roles}, Has seller: {has_seller_role}"))
                
                return admin_user_doc, has_seller_role
            else:
                logger.error("❌ Admin user not found in database")
                self.test_results.append(("Get Admin User (Database)", False, "Admin user not found"))
                return None, False
        except Exception as e:
            logger.error(f"❌ Error getting admin user from database: {e}")
            self.test_results.append(("Get Admin User (Database)", False, str(e)))
            return None, False
    
    async def test_add_seller_role_to_admin(self):
        """Test 2: Add seller role to admin user"""
        logger.info("\n🧪 Testing Add Seller Role to Admin User...")
        
        if not self.admin_user_id:
            logger.error("❌ No admin user ID available")
            self.test_results.append(("Add Seller Role", False, "No admin user ID"))
            return False
        
        try:
            # Update user document in MongoDB to add "seller" role
            result = await self.db.users.update_one(
                {"email": "admin@stocklot.co.za"},
                {"$addToSet": {"roles": "seller"}}  # $addToSet prevents duplicates
            )
            
            if result.modified_count > 0:
                logger.info("✅ Successfully added seller role to admin user")
                self.test_results.append(("Add Seller Role", True, "Role added successfully"))
                return True
            elif result.matched_count > 0:
                logger.info("✅ Admin user already has seller role")
                self.test_results.append(("Add Seller Role", True, "Role already exists"))
                return True
            else:
                logger.error("❌ Failed to find admin user for role update")
                self.test_results.append(("Add Seller Role", False, "User not found"))
                return False
                
        except Exception as e:
            logger.error(f"❌ Error adding seller role: {e}")
            self.test_results.append(("Add Seller Role", False, str(e)))
            return False
    
    async def test_verify_role_update(self):
        """Test 3: Verify the role update worked"""
        logger.info("\n🧪 Testing Verify Role Update...")
        
        try:
            # Check database directly
            admin_user_doc = await self.db.users.find_one({"email": "admin@stocklot.co.za"})
            if admin_user_doc:
                updated_roles = admin_user_doc.get("roles", [])
                has_admin_role = "admin" in updated_roles
                has_seller_role = "seller" in updated_roles
                
                logger.info(f"✅ Verified roles in database")
                logger.info(f"   Updated roles: {updated_roles}")
                logger.info(f"   Has admin role: {has_admin_role}")
                logger.info(f"   Has seller role: {has_seller_role}")
                
                if has_admin_role and has_seller_role:
                    self.test_results.append(("Verify Role Update (Database)", True, f"Roles: {updated_roles}"))
                    success_db = True
                else:
                    self.test_results.append(("Verify Role Update (Database)", False, f"Missing roles: {updated_roles}"))
                    success_db = False
            else:
                logger.error("❌ Admin user not found in database")
                self.test_results.append(("Verify Role Update (Database)", False, "User not found"))
                success_db = False
        except Exception as e:
            logger.error(f"❌ Error verifying role update in database: {e}")
            self.test_results.append(("Verify Role Update (Database)", False, str(e)))
            success_db = False
        
        # Also verify via API
        try:
            async with self.session.get(f"{self.api_url}/users", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    users = data.get("users", [])
                    
                    admin_user = None
                    for user in users:
                        if user.get("email") == "admin@stocklot.co.za":
                            admin_user = user
                            break
                    
                    if admin_user:
                        updated_roles = admin_user.get("roles", [])
                        has_admin_role = "admin" in updated_roles
                        has_seller_role = "seller" in updated_roles
                        
                        logger.info(f"✅ Verified roles via API")
                        logger.info(f"   Updated roles: {updated_roles}")
                        logger.info(f"   Has admin role: {has_admin_role}")
                        logger.info(f"   Has seller role: {has_seller_role}")
                        
                        if has_admin_role and has_seller_role:
                            self.test_results.append(("Verify Role Update (API)", True, f"Roles: {updated_roles}"))
                            success_api = True
                        else:
                            self.test_results.append(("Verify Role Update (API)", False, f"Missing roles: {updated_roles}"))
                            success_api = False
                    else:
                        logger.error("❌ Admin user not found via API")
                        self.test_results.append(("Verify Role Update (API)", False, "User not found"))
                        success_api = False
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to verify roles via API: {response.status} - {error_text}")
                    self.test_results.append(("Verify Role Update (API)", False, f"Status {response.status}"))
                    success_api = False
        except Exception as e:
            logger.error(f"❌ Error verifying role update via API: {e}")
            self.test_results.append(("Verify Role Update (API)", False, str(e)))
            success_api = False
        
        return success_db and success_api
    
    async def test_seller_dashboard_access(self):
        """Test 4: Test seller dashboard access"""
        logger.info("\n🧪 Testing Seller Dashboard Access...")
        
        success_count = 0
        total_tests = 3
        
        # Test 1: General dashboard stats (should work for sellers)
        try:
            async with self.session.get(f"{self.api_url}/dashboard/stats", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ General dashboard stats accessible")
                    logger.info(f"   Dashboard stats: {data}")
                    self.test_results.append(("Dashboard Stats Access", True, f"Stats: {data}"))
                    success_count += 1
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Dashboard stats access failed: {response.status} - {error_text}")
                    self.test_results.append(("Dashboard Stats Access", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing dashboard stats access: {e}")
            self.test_results.append(("Dashboard Stats Access", False, str(e)))
        
        # Test 2: Seller inbox (seller-specific endpoint)
        try:
            async with self.session.get(f"{self.api_url}/buy-requests/seller-inbox", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ Seller inbox accessible")
                    logger.info(f"   Seller inbox data keys: {list(data.keys()) if isinstance(data, dict) else 'List response'}")
                    self.test_results.append(("Seller Inbox Access", True, "Seller inbox accessible"))
                    success_count += 1
                elif response.status == 403:
                    error_text = await response.text()
                    logger.error(f"❌ Seller inbox access denied: {error_text}")
                    self.test_results.append(("Seller Inbox Access", False, "Access denied (403)"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Seller inbox access failed: {response.status} - {error_text}")
                    self.test_results.append(("Seller Inbox Access", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing seller inbox access: {e}")
            self.test_results.append(("Seller Inbox Access", False, str(e)))
        
        # Test 3: Seller buy requests in range
        try:
            async with self.session.get(f"{self.api_url}/seller/buy-requests/in-range", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ Seller buy requests in-range accessible")
                    logger.info(f"   In-range requests: {len(data) if isinstance(data, list) else 'Dict response'}")
                    self.test_results.append(("Seller In-Range Requests", True, "In-range requests accessible"))
                    success_count += 1
                elif response.status == 403:
                    error_text = await response.text()
                    logger.error(f"❌ Seller in-range requests access denied: {error_text}")
                    self.test_results.append(("Seller In-Range Requests", False, "Access denied (403)"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Seller in-range requests access failed: {response.status} - {error_text}")
                    self.test_results.append(("Seller In-Range Requests", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing seller in-range requests access: {e}")
            self.test_results.append(("Seller In-Range Requests", False, str(e)))
        
        return success_count >= 2  # At least 2 out of 3 should work
    
    async def test_delivery_rate_endpoints(self):
        """Test 5: Test delivery rate endpoints (seller-specific)"""
        logger.info("\n🧪 Testing Delivery Rate Endpoints...")
        
        # Test GET delivery rate
        try:
            async with self.session.get(f"{self.api_url}/seller/delivery-rate", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ GET delivery rate successful")
                    logger.info(f"   Delivery rate data: {data}")
                    self.test_results.append(("GET Delivery Rate", True, "Endpoint accessible"))
                    get_success = True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET delivery rate failed: {response.status} - {error_text}")
                    self.test_results.append(("GET Delivery Rate", False, f"Status {response.status}"))
                    get_success = False
        except Exception as e:
            logger.error(f"❌ Error testing GET delivery rate: {e}")
            self.test_results.append(("GET Delivery Rate", False, str(e)))
            get_success = False
        
        # Test POST delivery rate (create/update)
        try:
            delivery_rate_data = {
                "base_fee_cents": 2000,  # R20.00
                "per_km_cents": 120,     # R1.20/km
                "min_km": 10,
                "max_km": 200,
                "province_whitelist": None
            }
            
            async with self.session.post(
                f"{self.api_url}/seller/delivery-rate", 
                json=delivery_rate_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ POST delivery rate successful")
                    logger.info(f"   Created/updated delivery rate: {data}")
                    self.test_results.append(("POST Delivery Rate", True, "Rate created/updated"))
                    post_success = True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ POST delivery rate failed: {response.status} - {error_text}")
                    self.test_results.append(("POST Delivery Rate", False, f"Status {response.status}"))
                    post_success = False
        except Exception as e:
            logger.error(f"❌ Error testing POST delivery rate: {e}")
            self.test_results.append(("POST Delivery Rate", False, str(e)))
            post_success = False
        
        return get_success and post_success
    
    async def run_all_tests(self):
        """Run all admin user role tests"""
        logger.info("🚀 Starting Admin User Role Testing for Seller Dashboard Access...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Step 1: Check current admin user
            admin_user, has_seller_role = await self.test_get_current_admin_user()
            
            # Step 2: Add seller role if needed
            if not has_seller_role:
                logger.info("🔧 Admin user does not have seller role - adding it...")
                await self.test_add_seller_role_to_admin()
            else:
                logger.info("✅ Admin user already has seller role")
                self.test_results.append(("Add Seller Role", True, "Role already exists"))
            
            # Step 3: Verify the update
            await self.test_verify_role_update()
            
            # Step 4: Test seller dashboard access
            await self.test_seller_dashboard_access()
            
            # Step 5: Test delivery rate endpoints
            await self.test_delivery_rate_endpoints()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 ADMIN USER ROLE TESTING SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Admin user can access seller dashboard.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - Admin user role assignment largely functional.")
        else:
            logger.info("❌ ISSUES FOUND - Admin user role assignment needs attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 TESTS PERFORMED:")
        logger.info("   • Check current admin user roles")
        logger.info("   • Add seller role to admin user")
        logger.info("   • Verify role update in database and API")
        logger.info("   • Test seller dashboard access")
        logger.info("   • Test delivery rate endpoints")
        
        logger.info("\n👤 ADMIN USER CREDENTIALS:")
        logger.info("   • Email: admin@stocklot.co.za")
        logger.info("   • Password: admin123")
        logger.info("   • Required roles: ['admin', 'seller']")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AdminUserRoleTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())