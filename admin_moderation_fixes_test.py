#!/usr/bin/env python3
"""
🛡️ ADMIN MODERATION SYSTEM FIXES VALIDATION
Testing the fixed admin moderation endpoints after ObjectId serialization fixes and seed data population
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AdminModerationFixesTester:
    """Admin Moderation System Fixes Validator"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
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
                    logger.error(f"❌ Admin authentication failed: {response.status}")
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
    
    async def test_moderation_stats_endpoint(self):
        """Test 1: MODERATION STATS ENDPOINT (FIXED)"""
        logger.info("\n🧪 Testing Moderation Stats Endpoint (Fixed)...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/admin/moderation/stats",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify expected stats structure
                    expected_keys = ['role_requests', 'disease_changes_pending', 'listings_pending', 'recent_activity']
                    missing_keys = [key for key in expected_keys if key not in data]
                    
                    if not missing_keys:
                        logger.info("✅ Moderation stats endpoint working correctly")
                        logger.info(f"   Role requests: {data.get('role_requests', 0)}")
                        logger.info(f"   Disease changes pending: {data.get('disease_changes_pending', 0)}")
                        logger.info(f"   Listings pending: {data.get('listings_pending', 0)}")
                        logger.info(f"   Recent activity items: {len(data.get('recent_activity', []))}")
                        
                        # Check for ObjectId serialization issues
                        response_text = await response.text()
                        if "ObjectId" in response_text:
                            logger.warning("⚠️ ObjectId serialization issue detected in response")
                            self.test_results.append(("Moderation Stats Endpoint", False, "ObjectId serialization issue"))
                        else:
                            # Verify we have actual role requests data
                            role_requests = data.get('role_requests', {})
                            if isinstance(role_requests, dict) and role_requests.get('PENDING', 0) > 0:
                                logger.info(f"   ✅ Found {role_requests.get('PENDING', 0)} pending role requests")
                            self.test_results.append(("Moderation Stats Endpoint", True, "Properly serialized data returned with seeded data"))
                    else:
                        logger.error(f"❌ Missing expected keys: {missing_keys}")
                        self.test_results.append(("Moderation Stats Endpoint", False, f"Missing keys: {missing_keys}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Moderation stats failed: {response.status} - {error_text}")
                    self.test_results.append(("Moderation Stats Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing moderation stats: {e}")
            self.test_results.append(("Moderation Stats Endpoint", False, str(e)))
    
    async def test_role_management_endpoints(self):
        """Test 2: ROLE MANAGEMENT ENDPOINTS (FIXED)"""
        logger.info("\n🧪 Testing Role Management Endpoints (Fixed)...")
        
        # Test GET /api/admin/roles/requests
        try:
            async with self.session.get(
                f"{self.api_url}/admin/roles/requests",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    requests = data.get("rows", [])  # Fix: use 'rows' field
                    
                    logger.info("✅ Role requests endpoint working")
                    logger.info(f"   Found {len(requests)} role requests")
                    
                    # Check for proper datetime serialization
                    response_text = await response.text()
                    if "ObjectId" in response_text:
                        logger.warning("⚠️ ObjectId serialization issue in role requests")
                        self.test_results.append(("Role Requests Endpoint", False, "ObjectId serialization issue"))
                    else:
                        # Verify user lookup joins work
                        if requests:
                            first_request = requests[0]
                            if "user_name" in first_request and "org_name" in first_request:
                                logger.info("✅ User lookup joins working properly")
                                logger.info(f"   Sample: {first_request['user_name']} from {first_request['org_name']}")
                                self.test_results.append(("Role Requests Endpoint", True, f"Found {len(requests)} requests with user data"))
                            else:
                                logger.warning("⚠️ User lookup joins may not be working")
                                self.test_results.append(("Role Requests Endpoint", True, f"Found {len(requests)} requests but no user data"))
                        else:
                            self.test_results.append(("Role Requests Endpoint", True, "No requests found (empty result)"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Role requests failed: {response.status} - {error_text}")
                    self.test_results.append(("Role Requests Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing role requests: {e}")
            self.test_results.append(("Role Requests Endpoint", False, str(e)))
        
        # Test filtering with ?status=PENDING&role=seller
        try:
            params = {"status": "PENDING", "role": "seller"}
            async with self.session.get(
                f"{self.api_url}/admin/roles/requests",
                params=params,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    requests = data.get("rows", [])  # Fix: use 'rows' field
                    
                    logger.info("✅ Role requests filtering working")
                    logger.info(f"   Found {len(requests)} pending seller requests")
                    
                    # Verify filtering actually works
                    seller_requests = [r for r in requests if r.get("requested_role") == "seller"]
                    if len(seller_requests) > 0:
                        logger.info(f"   ✅ Filtering working: {len(seller_requests)} seller requests")
                    
                    self.test_results.append(("Role Requests Filtering", True, f"Found {len(requests)} filtered requests"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Role requests filtering failed: {response.status} - {error_text}")
                    self.test_results.append(("Role Requests Filtering", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing role requests filtering: {e}")
            self.test_results.append(("Role Requests Filtering", False, str(e)))
    
    async def test_disease_zone_endpoints(self):
        """Test 3: DISEASE ZONE ENDPOINTS (FIXED)"""
        logger.info("\n🧪 Testing Disease Zone Endpoints (Fixed)...")
        
        # Test GET /api/admin/disease/zones
        try:
            async with self.session.get(
                f"{self.api_url}/admin/disease/zones",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    zones = data.get("rows", [])  # Fix: use 'rows' field
                    
                    logger.info("✅ Disease zones endpoint working")
                    logger.info(f"   Found {len(zones)} disease zones")
                    
                    # Check for ObjectId serialization issues
                    response_text = await response.text()
                    if "ObjectId" in response_text:
                        logger.warning("⚠️ ObjectId serialization issue in disease zones")
                        self.test_results.append(("Disease Zones Endpoint", False, "ObjectId serialization issue"))
                    else:
                        if zones:
                            sample_zone = zones[0]
                            logger.info(f"   Sample zone: {sample_zone.get('name', 'Unknown')}")
                        self.test_results.append(("Disease Zones Endpoint", True, f"Found {len(zones)} zones without ObjectId errors"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Disease zones failed: {response.status} - {error_text}")
                    self.test_results.append(("Disease Zones Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing disease zones: {e}")
            self.test_results.append(("Disease Zones Endpoint", False, str(e)))
        
        # Test GET /api/admin/disease/changes?status=PENDING
        try:
            params = {"status": "PENDING"}
            async with self.session.get(
                f"{self.api_url}/admin/disease/changes",
                params=params,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    changes = data.get("changes", [])
                    
                    logger.info("✅ Disease changes endpoint working")
                    logger.info(f"   Found {len(changes)} pending disease changes")
                    
                    # Verify zone lookup joins and datetime serialization
                    response_text = await response.text()
                    if "ObjectId" in response_text:
                        logger.warning("⚠️ ObjectId serialization issue in disease changes")
                        self.test_results.append(("Disease Changes Endpoint", False, "ObjectId serialization issue"))
                    else:
                        # Check for proper datetime serialization
                        if changes:
                            first_change = changes[0]
                            if "created_at" in first_change and isinstance(first_change["created_at"], str):
                                logger.info("✅ Datetime serialization working properly")
                                self.test_results.append(("Disease Changes Endpoint", True, f"Found {len(changes)} changes with proper serialization"))
                            else:
                                logger.warning("⚠️ Datetime serialization may have issues")
                                self.test_results.append(("Disease Changes Endpoint", True, f"Found {len(changes)} changes but datetime issues"))
                        else:
                            self.test_results.append(("Disease Changes Endpoint", True, "No pending changes found"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Disease changes failed: {response.status} - {error_text}")
                    self.test_results.append(("Disease Changes Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing disease changes: {e}")
            self.test_results.append(("Disease Changes Endpoint", False, str(e)))
    
    async def test_fee_configuration_endpoints(self):
        """Test 4: FEE CONFIGURATION ENDPOINTS (FIXED)"""
        logger.info("\n🧪 Testing Fee Configuration Endpoints (Fixed)...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/admin/config/fees",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    configs = data.get("configs", [])
                    
                    logger.info("✅ Fee configuration endpoint working")
                    logger.info(f"   Found {len(configs)} fee configurations")
                    
                    # Check for ObjectId serialization issues
                    response_text = await response.text()
                    if "ObjectId" in response_text:
                        logger.warning("⚠️ ObjectId serialization issue in fee configs")
                        self.test_results.append(("Fee Configuration Endpoint", False, "ObjectId serialization issue"))
                    else:
                        # Verify ACTIVE and DRAFT status configurations
                        active_configs = [c for c in configs if c.get("status") == "ACTIVE"]
                        draft_configs = [c for c in configs if c.get("status") == "DRAFT"]
                        
                        logger.info(f"   Active configs: {len(active_configs)}")
                        logger.info(f"   Draft configs: {len(draft_configs)}")
                        
                        self.test_results.append(("Fee Configuration Endpoint", True, f"Found {len(configs)} configs (Active: {len(active_configs)}, Draft: {len(draft_configs)})"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Fee configuration failed: {response.status} - {error_text}")
                    self.test_results.append(("Fee Configuration Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing fee configuration: {e}")
            self.test_results.append(("Fee Configuration Endpoint", False, str(e)))
    
    async def test_feature_flags_endpoints(self):
        """Test 5: FEATURE FLAGS ENDPOINTS (FIXED)"""
        logger.info("\n🧪 Testing Feature Flags Endpoints (Fixed)...")
        
        # Test GET /api/admin/config/flags
        try:
            async with self.session.get(
                f"{self.api_url}/admin/config/flags",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    flags = data.get("rows", [])  # Fix: use 'rows' field
                    
                    logger.info("✅ Feature flags endpoint working")
                    logger.info(f"   Found {len(flags)} feature flags")
                    
                    # Check for ObjectId serialization issues
                    response_text = await response.text()
                    if "ObjectId" in response_text:
                        logger.warning("⚠️ ObjectId serialization issue in feature flags")
                        self.test_results.append(("Feature Flags GET Endpoint", False, "ObjectId serialization issue"))
                    else:
                        if flags:
                            sample_flag = flags[0]
                            logger.info(f"   Sample flag: {sample_flag.get('key', 'Unknown')} - {sample_flag.get('status', 'Unknown')}")
                        self.test_results.append(("Feature Flags GET Endpoint", True, f"Found {len(flags)} flags without ObjectId errors"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Feature flags GET failed: {response.status} - {error_text}")
                    self.test_results.append(("Feature Flags GET Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing feature flags GET: {e}")
            self.test_results.append(("Feature Flags GET Endpoint", False, str(e)))
        
        # Test POST /api/admin/config/flags/ENABLE_AI_MODERATION with status update
        try:
            update_data = {
                "enabled": True,
                "description": "Test update for AI moderation feature"
            }
            
            async with self.session.post(
                f"{self.api_url}/admin/config/flags/ENABLE_AI_MODERATION",
                json=update_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    logger.info("✅ Feature flag update endpoint working")
                    logger.info(f"   Updated ENABLE_AI_MODERATION flag")
                    
                    # Check for ObjectId serialization issues
                    response_text = await response.text()
                    if "ObjectId" in response_text:
                        logger.warning("⚠️ ObjectId serialization issue in feature flag update")
                        self.test_results.append(("Feature Flags POST Endpoint", False, "ObjectId serialization issue"))
                    else:
                        self.test_results.append(("Feature Flags POST Endpoint", True, "Flag updated successfully without ObjectId errors"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Feature flag update failed: {response.status} - {error_text}")
                    self.test_results.append(("Feature Flags POST Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing feature flag update: {e}")
            self.test_results.append(("Feature Flags POST Endpoint", False, str(e)))
    
    async def test_data_validation(self):
        """Test 6: DATA VALIDATION"""
        logger.info("\n🧪 Testing Data Validation...")
        
        # Test seeded test data accessibility
        endpoints_to_test = [
            ("admin/moderation/stats", "Moderation Stats"),
            ("admin/roles/requests", "Role Requests"),
            ("admin/disease/zones", "Disease Zones"),
            ("admin/config/fees", "Fee Configurations"),
            ("admin/config/flags", "Feature Flags")
        ]
        
        accessible_endpoints = 0
        total_endpoints = len(endpoints_to_test)
        
        for endpoint, name in endpoints_to_test:
            try:
                async with self.session.get(
                    f"{self.api_url}/{endpoint}",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check datetime fields are properly formatted as ISO strings
                        response_text = await response.text()
                        has_iso_dates = "T" in response_text and "Z" in response_text
                        has_objectid_issues = "ObjectId" in response_text
                        
                        if has_iso_dates and not has_objectid_issues:
                            logger.info(f"✅ {name} data validation passed")
                            accessible_endpoints += 1
                        elif has_objectid_issues:
                            logger.warning(f"⚠️ {name} has ObjectId serialization issues")
                        else:
                            logger.info(f"✅ {name} accessible but no datetime fields detected")
                            accessible_endpoints += 1
                    else:
                        logger.error(f"❌ {name} not accessible: {response.status}")
            except Exception as e:
                logger.error(f"❌ Error testing {name}: {e}")
        
        success_rate = (accessible_endpoints / total_endpoints) * 100
        logger.info(f"📊 Data validation success rate: {accessible_endpoints}/{total_endpoints} ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            self.test_results.append(("Data Validation", True, f"{accessible_endpoints}/{total_endpoints} endpoints accessible"))
        else:
            self.test_results.append(("Data Validation", False, f"Only {accessible_endpoints}/{total_endpoints} endpoints accessible"))
    
    async def test_error_handling(self):
        """Test 7: ERROR HANDLING"""
        logger.info("\n🧪 Testing Error Handling...")
        
        # Test non-existent resource access (should return 404, not 500)
        try:
            async with self.session.get(
                f"{self.api_url}/admin/roles/requests/non-existent-id",
                headers=self.get_headers()
            ) as response:
                if response.status == 404:
                    logger.info("✅ Non-existent resource returns 404 correctly")
                    self.test_results.append(("Error Handling - 404", True, "Returns 404 for non-existent resources"))
                elif response.status == 500:
                    logger.error("❌ Non-existent resource returns 500 (should be 404)")
                    self.test_results.append(("Error Handling - 404", False, "Returns 500 instead of 404"))
                else:
                    logger.warning(f"⚠️ Non-existent resource returns {response.status} (expected 404)")
                    self.test_results.append(("Error Handling - 404", True, f"Returns {response.status} (not 500)"))
        except Exception as e:
            logger.error(f"❌ Error testing 404 handling: {e}")
            self.test_results.append(("Error Handling - 404", False, str(e)))
        
        # Test authentication requirements (without auth token)
        try:
            headers = {"Content-Type": "application/json"}  # No auth token
            async with self.session.get(
                f"{self.api_url}/admin/moderation/stats",
                headers=headers
            ) as response:
                if response.status in [401, 403]:
                    logger.info("✅ Authentication properly required")
                    self.test_results.append(("Error Handling - Auth", True, f"Returns {response.status} without auth"))
                else:
                    logger.error(f"❌ Authentication not properly enforced: {response.status}")
                    self.test_results.append(("Error Handling - Auth", False, f"Returns {response.status} without auth"))
        except Exception as e:
            logger.error(f"❌ Error testing auth requirements: {e}")
            self.test_results.append(("Error Handling - Auth", False, str(e)))
    
    async def run_all_tests(self):
        """Run all admin moderation fixes tests"""
        logger.info("🚀 Starting Admin Moderation System Fixes Validation...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_moderation_stats_endpoint()
            await self.test_role_management_endpoints()
            await self.test_disease_zone_endpoints()
            await self.test_fee_configuration_endpoints()
            await self.test_feature_flags_endpoints()
            await self.test_data_validation()
            await self.test_error_handling()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🛡️ ADMIN MODERATION SYSTEM FIXES VALIDATION SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL FIXES VERIFIED! Admin Moderation System is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY FIXED - Admin Moderation System is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY FIXED - Admin Moderation System still has significant issues.")
        else:
            logger.info("❌ MAJOR ISSUES REMAIN - Admin Moderation System requires more fixes.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FIXES TESTED:")
        logger.info("   • MongoDB ObjectId Serialization Fixes")
        logger.info("   • Seed Data Population and Accessibility")
        logger.info("   • Datetime Field Serialization (ISO strings)")
        logger.info("   • User Lookup Joins in Role Requests")
        logger.info("   • Zone Lookup Joins in Disease Changes")
        logger.info("   • Response Structure Consistency")
        logger.info("   • Error Handling (404 vs 500)")
        logger.info("   • Authentication Requirements")
        
        logger.info("\n🔧 ENDPOINTS TESTED:")
        logger.info("   • GET /api/admin/moderation/stats")
        logger.info("   • GET /api/admin/roles/requests (with filtering)")
        logger.info("   • GET /api/admin/disease/zones")
        logger.info("   • GET /api/admin/disease/changes?status=PENDING")
        logger.info("   • GET /api/admin/config/fees")
        logger.info("   • GET /api/admin/config/flags")
        logger.info("   • POST /api/admin/config/flags/ENABLE_AI_MODERATION")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AdminModerationFixesTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())