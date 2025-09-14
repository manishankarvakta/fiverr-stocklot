#!/usr/bin/env python3
"""
🛡️ ADMIN PANEL FUNCTIONALITY BACKEND TESTING
Comprehensive testing of the admin panel fixes that were just implemented
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AdminPanelTester:
    """Comprehensive Admin Panel Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_user_id = None
        self.test_role_id = None
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
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
                    logger.info("✅ Admin authentication successful")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Admin authentication failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            logger.error(f"❌ Admin authentication error: {e}")
            return False
    
    def get_headers(self):
        """Get headers with Bearer token authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_platform_settings_retrieval(self):
        """Test 1: Platform Settings Retrieval (GET /api/admin/settings)"""
        logger.info("\n🧪 Testing Platform Settings Retrieval...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/admin/settings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    settings = await response.json()  # Direct response, not nested in "settings"
                    
                    logger.info("✅ Platform settings retrieval successful")
                    logger.info(f"   Platform Commission: {settings.get('platformCommissionPercent', 'N/A')}%")
                    logger.info(f"   Buyer Processing Fee: {settings.get('buyerProcessingFeePercent', 'N/A')}%")
                    logger.info(f"   Escrow Service Fee: R{settings.get('escrowServiceFee', 'N/A')}")
                    logger.info(f"   Site Name: {settings.get('siteName', 'N/A')}")
                    logger.info(f"   Support Email: {settings.get('supportEmail', 'N/A')}")
                    
                    # Verify essential settings are present
                    required_fields = ['platformCommissionPercent', 'buyerProcessingFeePercent', 'escrowServiceFee']
                    missing_fields = [field for field in required_fields if field not in settings]
                    
                    if not missing_fields:
                        self.test_results.append(("Platform Settings Retrieval", True, "All required settings present"))
                    else:
                        self.test_results.append(("Platform Settings Retrieval", False, f"Missing fields: {missing_fields}"))
                        
                elif response.status == 403:
                    logger.error("❌ Platform settings retrieval failed: Access denied (403)")
                    self.test_results.append(("Platform Settings Retrieval", False, "Access denied - authentication issue"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Platform settings retrieval failed: {response.status} - {error_text}")
                    self.test_results.append(("Platform Settings Retrieval", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in platform settings retrieval: {e}")
            self.test_results.append(("Platform Settings Retrieval", False, str(e)))
    
    async def test_platform_settings_save(self):
        """Test 2: Platform Settings Save (PUT /api/admin/settings)"""
        logger.info("\n🧪 Testing Platform Settings Save...")
        
        # Test settings data with commission rates and social media links
        test_settings = {
            "siteName": "StockLot Test",
            "siteDescription": "South Africa's Premier Livestock Marketplace - Test Mode",
            "supportEmail": "support-test@stocklot.co.za",
            "commissionRate": 12.5,
            "buyerProcessingFee": 2.0,
            "escrowFee": 30.0,
            "socialMedia": {
                "facebook": "https://facebook.com/stocklot-test",
                "twitter": "https://twitter.com/stocklot_test",
                "instagram": "https://instagram.com/stocklot_test"
            },
            "businessSettings": {
                "currency": "ZAR",
                "timezone": "Africa/Johannesburg",
                "language": "en"
            }
        }
        
        try:
            async with self.session.put(
                f"{self.api_url}/admin/settings",
                json=test_settings,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    logger.info("✅ Platform settings save successful")
                    logger.info(f"   Updated settings count: {len(test_settings)}")
                    logger.info(f"   Commission rate updated to: {test_settings['commissionRate']}%")
                    logger.info(f"   Social media links configured: {len(test_settings['socialMedia'])}")
                    
                    self.test_results.append(("Platform Settings Save", True, "Settings saved successfully"))
                    
                elif response.status == 403:
                    logger.error("❌ Platform settings save failed: Access denied (403)")
                    self.test_results.append(("Platform Settings Save", False, "Access denied - authentication headers issue"))
                elif response.status == 401:
                    logger.error("❌ Platform settings save failed: Unauthorized (401)")
                    self.test_results.append(("Platform Settings Save", False, "Unauthorized - Bearer token issue"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Platform settings save failed: {response.status} - {error_text}")
                    self.test_results.append(("Platform Settings Save", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in platform settings save: {e}")
            self.test_results.append(("Platform Settings Save", False, str(e)))
    
    async def test_admin_role_creation(self):
        """Test 3: Admin Role Creation (POST /api/admin/roles)"""
        logger.info("\n🧪 Testing Admin Role Creation...")
        
        # First create a test user
        test_user_data = {
            "email": f"testuser_{uuid.uuid4().hex[:8]}@stocklot.co.za",
            "password": "testpass123",
            "full_name": "Test User for Admin Role",
            "role": "buyer"
        }
        
        try:
            # Create the user first
            async with self.session.post(
                f"{self.api_url}/auth/register",
                json=test_user_data
            ) as response:
                if response.status in [200, 201]:
                    user_data = await response.json()
                    self.test_user_id = user_data.get("user_id")
                    logger.info(f"✅ Test user created with ID: {self.test_user_id}")
                else:
                    logger.error(f"❌ Failed to create test user: {response.status}")
                    self.test_results.append(("Admin Role Creation", False, "Failed to create test user"))
                    return
        except Exception as e:
            logger.error(f"❌ Error creating test user: {e}")
            self.test_results.append(("Admin Role Creation", False, f"User creation error: {e}"))
            return
        
        # Test role creation data with correct structure (using AdminRole enum values)
        role_creation_data = {
            "user_id": self.test_user_id,
            "role": "MODERATOR",  # Valid AdminRole enum value
            "permissions": [
                "moderate_listings",
                "manage_users",
                "view_reports",
                "handle_disputes"
            ]
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/admin/roles",
                json=role_creation_data,
                headers=self.get_headers()
            ) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    
                    logger.info("✅ Admin role creation successful")
                    logger.info(f"   Admin Role ID: {data.get('admin_role_id', 'N/A')}")
                    logger.info(f"   User ID: {role_creation_data['user_id']}")
                    logger.info(f"   Role Type: {role_creation_data['role']}")
                    logger.info(f"   Permissions: {len(role_creation_data['permissions'])}")
                    
                    self.test_role_id = data.get("admin_role_id")
                    self.test_results.append(("Admin Role Creation", True, f"Admin role created for user {self.test_user_id}"))
                    
                elif response.status == 403:
                    logger.error("❌ Admin role creation failed: Access denied (403)")
                    self.test_results.append(("Admin Role Creation", False, "Access denied - authentication issue"))
                elif response.status == 422:
                    error_text = await response.text()
                    logger.error(f"❌ Admin role creation failed: Validation error (422) - {error_text}")
                    self.test_results.append(("Admin Role Creation", False, "Data structure validation error"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Admin role creation failed: {response.status} - {error_text}")
                    self.test_results.append(("Admin Role Creation", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in admin role creation: {e}")
            self.test_results.append(("Admin Role Creation", False, str(e)))
    
    async def test_bearer_token_authentication(self):
        """Test 4: Bearer Token Authentication Verification"""
        logger.info("\n🧪 Testing Bearer Token Authentication...")
        
        # Test with valid Bearer token
        try:
            async with self.session.get(
                f"{self.api_url}/admin/moderation/stats",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    stats = data.get("stats", {})
                    
                    logger.info("✅ Bearer token authentication working")
                    logger.info(f"   Pending role requests: {stats.get('pending_role_requests', 0)}")
                    logger.info(f"   Recent activities: {stats.get('recent_activity_count', 0)}")
                    
                    self.test_results.append(("Bearer Token Authentication (Valid)", True, "Authentication successful"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Bearer token authentication failed: {response.status} - {error_text}")
                    self.test_results.append(("Bearer Token Authentication (Valid)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in Bearer token authentication test: {e}")
            self.test_results.append(("Bearer Token Authentication (Valid)", False, str(e)))
        
        # Test with invalid Bearer token
        try:
            invalid_headers = {"Content-Type": "application/json", "Authorization": "Bearer invalid_token"}
            async with self.session.get(
                f"{self.api_url}/admin/moderation/stats",
                headers=invalid_headers
            ) as response:
                if response.status == 401 or response.status == 403:
                    logger.info("✅ Invalid Bearer token properly rejected")
                    self.test_results.append(("Bearer Token Authentication (Invalid)", True, "Invalid token properly rejected"))
                else:
                    logger.error(f"❌ Invalid Bearer token not properly rejected: {response.status}")
                    self.test_results.append(("Bearer Token Authentication (Invalid)", False, f"Should reject but got {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in invalid Bearer token test: {e}")
            self.test_results.append(("Bearer Token Authentication (Invalid)", False, str(e)))
        
        # Test without Bearer token
        try:
            no_auth_headers = {"Content-Type": "application/json"}
            async with self.session.get(
                f"{self.api_url}/admin/moderation/stats",
                headers=no_auth_headers
            ) as response:
                if response.status == 401 or response.status == 403:
                    logger.info("✅ Missing Bearer token properly rejected")
                    self.test_results.append(("Bearer Token Authentication (Missing)", True, "Missing token properly rejected"))
                else:
                    logger.error(f"❌ Missing Bearer token not properly rejected: {response.status}")
                    self.test_results.append(("Bearer Token Authentication (Missing)", False, f"Should reject but got {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in missing Bearer token test: {e}")
            self.test_results.append(("Bearer Token Authentication (Missing)", False, str(e)))
    
    async def test_error_handling_validation(self):
        """Test 5: Error Handling with Invalid Data"""
        logger.info("\n🧪 Testing Error Handling with Invalid Data...")
        
        # Test 1: Invalid settings data
        try:
            invalid_settings = {
                "commissionRate": "invalid_number",  # Should be number
                "supportEmail": "not_an_email",      # Invalid email format
                "siteName": "",                      # Empty required field
            }
            
            async with self.session.put(
                f"{self.api_url}/admin/settings",
                json=invalid_settings,
                headers=self.get_headers()
            ) as response:
                if response.status == 422:
                    logger.info("✅ Invalid settings data properly rejected with 422")
                    self.test_results.append(("Error Handling (Invalid Settings)", True, "Validation errors properly returned"))
                elif response.status == 400:
                    logger.info("✅ Invalid settings data properly rejected with 400")
                    self.test_results.append(("Error Handling (Invalid Settings)", True, "Bad request properly returned"))
                else:
                    logger.error(f"❌ Invalid settings data not properly rejected: {response.status}")
                    self.test_results.append(("Error Handling (Invalid Settings)", False, f"Should reject but got {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in invalid settings test: {e}")
            self.test_results.append(("Error Handling (Invalid Settings)", False, str(e)))
        
        # Test 2: Invalid role creation data
        try:
            invalid_role_data = {
                "user_id": "",                    # Empty required field
                "role": "INVALID_ROLE_TYPE",      # Invalid AdminRole enum value
                "permissions": "not_an_array",    # Should be array
            }
            
            async with self.session.post(
                f"{self.api_url}/admin/roles",
                json=invalid_role_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 422:
                    logger.info("✅ Invalid role data properly rejected with 422")
                    self.test_results.append(("Error Handling (Invalid Role Data)", True, "Validation errors properly returned"))
                elif response.status == 400:
                    logger.info("✅ Invalid role data properly rejected with 400")
                    self.test_results.append(("Error Handling (Invalid Role Data)", True, "Bad request properly returned"))
                else:
                    logger.error(f"❌ Invalid role data not properly rejected: {response.status}")
                    self.test_results.append(("Error Handling (Invalid Role Data)", False, f"Should reject but got {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in invalid role data test: {e}")
            self.test_results.append(("Error Handling (Invalid Role Data)", False, str(e)))
        
        # Test 3: Malformed JSON
        try:
            async with self.session.put(
                f"{self.api_url}/admin/settings",
                data="{ invalid json }",  # Malformed JSON
                headers=self.get_headers()
            ) as response:
                if response.status == 400:
                    logger.info("✅ Malformed JSON properly rejected with 400")
                    self.test_results.append(("Error Handling (Malformed JSON)", True, "Bad request properly returned"))
                elif response.status == 422:
                    logger.info("✅ Malformed JSON properly rejected with 422")
                    self.test_results.append(("Error Handling (Malformed JSON)", True, "Validation error properly returned"))
                else:
                    logger.error(f"❌ Malformed JSON not properly rejected: {response.status}")
                    self.test_results.append(("Error Handling (Malformed JSON)", False, f"Should reject but got {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in malformed JSON test: {e}")
            self.test_results.append(("Error Handling (Malformed JSON)", False, str(e)))
    
    async def test_admin_role_management_endpoints(self):
        """Test 6: Additional Admin Role Management Endpoints"""
        logger.info("\n🧪 Testing Additional Admin Role Management Endpoints...")
        
        # Test role requests listing
        try:
            async with self.session.get(
                f"{self.api_url}/admin/roles/requests",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    requests = data.get("requests", [])
                    
                    logger.info("✅ Role requests listing successful")
                    logger.info(f"   Found {len(requests)} role requests")
                    
                    self.test_results.append(("Admin Role Requests Listing", True, f"Found {len(requests)} requests"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Role requests listing failed: {response.status} - {error_text}")
                    self.test_results.append(("Admin Role Requests Listing", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in role requests listing: {e}")
            self.test_results.append(("Admin Role Requests Listing", False, str(e)))
        
        # Test role approval (if we have a test role)
        if self.test_role_id:
            try:
                approval_data = {
                    "approved": True,
                    "notes": "Test approval for admin panel functionality testing"
                }
                
                async with self.session.post(
                    f"{self.api_url}/admin/roles/{self.test_role_id}/approve",
                    json=approval_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        logger.info("✅ Role approval successful")
                        self.test_results.append(("Admin Role Approval", True, f"Role {self.test_role_id} approved"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Role approval failed: {response.status} - {error_text}")
                        self.test_results.append(("Admin Role Approval", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in role approval: {e}")
                self.test_results.append(("Admin Role Approval", False, str(e)))
        else:
            logger.warning("⚠️ Skipping role approval test - no test role ID available")
            self.test_results.append(("Admin Role Approval", False, "No test role ID available"))
    
    async def run_all_tests(self):
        """Run all admin panel tests"""
        logger.info("🚀 Starting Admin Panel Functionality Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests in order
            await self.test_platform_settings_retrieval()
            await self.test_platform_settings_save()
            await self.test_admin_role_creation()
            await self.test_bearer_token_authentication()
            await self.test_error_handling_validation()
            await self.test_admin_role_management_endpoints()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🛡️ ADMIN PANEL FUNCTIONALITY BACKEND TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Admin panel fixes are fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - Admin panel is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - Admin panel has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - Admin panel requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FIXES TESTED:")
        logger.info("   • Platform Settings Save (PUT /api/admin/settings)")
        logger.info("   • Admin Role Creation (POST /api/admin/roles)")
        logger.info("   • Settings Retrieval (GET /api/admin/settings)")
        logger.info("   • Bearer Token Authentication")
        logger.info("   • Error Handling with Invalid Data")
        logger.info("   • Role Management Endpoints")
        
        logger.info("\n🔧 SPECIFIC ISSUES ADDRESSED:")
        logger.info("   • Role creation API data structure mismatch")
        logger.info("   • Platform settings save authentication headers")
        logger.info("   • Bearer token authentication consistency")
        logger.info("   • Proper error responses for invalid data")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AdminPanelTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())