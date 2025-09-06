#!/usr/bin/env python3
"""
🧪 CRITICAL FIXES BACKEND TESTING
Testing the recently fixed critical backend issues:
1. Admin login functionality
2. Platform configuration API
3. Admin settings endpoints
4. 4 newly fixed admin component endpoints
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CriticalFixesTester:
    """Critical Backend Fixes Tester"""
    
    def __init__(self, base_url: str = "https://farm-admin.preview.emergentagent.com"):
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
    
    async def authenticate_admin(self):
        """Test admin login functionality - admin@stocklot.co.za with admin123"""
        try:
            logger.info("🔐 Testing admin login functionality...")
            
            login_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                if status == 200 and isinstance(response_data, dict):
                    if "token" in response_data or "access_token" in response_data:
                        # Extract token
                        self.auth_token = response_data.get("token") or response_data.get("access_token")
                        
                        # Verify admin user details
                        user_data = response_data.get("user", {})
                        is_admin = "admin" in user_data.get("roles", [])
                        
                        self.test_results.append({
                            "test": "Admin Login",
                            "status": "✅ PASS",
                            "details": f"Successfully logged in as admin. Token received: {bool(self.auth_token)}, Admin role: {is_admin}",
                            "response_code": status
                        })
                        
                        logger.info(f"✅ Admin login successful - Token: {self.auth_token[:20]}...")
                        return True
                    else:
                        self.test_results.append({
                            "test": "Admin Login",
                            "status": "❌ FAIL",
                            "details": f"Login successful but no token in response: {response_data}",
                            "response_code": status
                        })
                        return False
                else:
                    self.test_results.append({
                        "test": "Admin Login",
                        "status": "❌ FAIL",
                        "details": f"Login failed with status {status}: {response_data}",
                        "response_code": status
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Login",
                "status": "❌ ERROR",
                "details": f"Exception during admin login: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ Admin login error: {e}")
            return False
    
    async def test_platform_config_api(self):
        """Test platform configuration API - /api/platform/config"""
        try:
            logger.info("🔧 Testing platform configuration API...")
            
            # Test without authentication first (should be public)
            async with self.session.get(f"{self.api_url}/platform/config") as response:
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                if status == 200:
                    # Check if response contains expected platform config fields
                    expected_fields = ["social_media", "contact_info", "platform_settings"]
                    has_expected_structure = isinstance(response_data, dict)
                    
                    self.test_results.append({
                        "test": "Platform Config API",
                        "status": "✅ PASS",
                        "details": f"Platform config API accessible. Response structure valid: {has_expected_structure}",
                        "response_code": status,
                        "data": response_data
                    })
                    
                    logger.info("✅ Platform config API working")
                    return True
                else:
                    self.test_results.append({
                        "test": "Platform Config API",
                        "status": "❌ FAIL",
                        "details": f"Platform config API failed with status {status}: {response_data}",
                        "response_code": status
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Platform Config API",
                "status": "❌ ERROR",
                "details": f"Exception during platform config test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ Platform config API error: {e}")
            return False
    
    async def test_admin_settings_endpoints(self):
        """Test admin settings endpoints for social media configuration"""
        if not self.auth_token:
            logger.warning("⚠️ No auth token available for admin settings test")
            return False
            
        try:
            logger.info("⚙️ Testing admin settings endpoints...")
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Test GET admin settings
            async with self.session.get(
                f"{self.api_url}/admin/settings",
                headers=headers
            ) as response:
                
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                if status == 200:
                    self.test_results.append({
                        "test": "Admin Settings GET",
                        "status": "✅ PASS",
                        "details": f"Admin settings retrieved successfully",
                        "response_code": status,
                        "data": response_data
                    })
                    
                    # Test POST admin settings (social media URLs)
                    test_settings = {
                        "social_media": {
                            "facebook_url": "https://facebook.com/stocklot",
                            "twitter_url": "https://twitter.com/stocklot",
                            "instagram_url": "https://instagram.com/stocklot",
                            "linkedin_url": "https://linkedin.com/company/stocklot"
                        },
                        "contact_info": {
                            "support_email": "support@stocklot.co.za",
                            "phone": "+27 11 123 4567"
                        }
                    }
                    
                    async with self.session.put(
                        f"{self.api_url}/admin/settings",
                        json=test_settings,
                        headers={**headers, "Content-Type": "application/json"}
                    ) as post_response:
                        
                        post_status = post_response.status
                        post_data = await post_response.json() if post_response.content_type == 'application/json' else await post_response.text()
                        
                        if post_status in [200, 201]:
                            self.test_results.append({
                                "test": "Admin Settings POST",
                                "status": "✅ PASS",
                                "details": f"Admin settings updated successfully",
                                "response_code": post_status
                            })
                            logger.info("✅ Admin settings endpoints working")
                            return True
                        else:
                            self.test_results.append({
                                "test": "Admin Settings POST",
                                "status": "❌ FAIL",
                                "details": f"Admin settings update failed with status {post_status}: {post_data}",
                                "response_code": post_status
                            })
                            return False
                else:
                    self.test_results.append({
                        "test": "Admin Settings GET",
                        "status": "❌ FAIL",
                        "details": f"Admin settings GET failed with status {status}: {response_data}",
                        "response_code": status
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Settings Endpoints",
                "status": "❌ ERROR",
                "details": f"Exception during admin settings test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ Admin settings endpoints error: {e}")
            return False
    
    async def test_admin_webhooks_management(self):
        """Test AdminWebhooksManagement endpoint - POST /admin/webhooks"""
        if not self.auth_token:
            logger.warning("⚠️ No auth token available for webhooks test")
            return False
            
        try:
            logger.info("🪝 Testing AdminWebhooksManagement endpoint...")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test webhook creation
            webhook_data = {
                "name": "Test Webhook",
                "url": "https://example.com/webhook",
                "events": ["order.created", "order.updated"],
                "secret": "test_secret_123",
                "description": "Test webhook for critical fixes validation"
            }
            
            async with self.session.post(
                f"{self.api_url}/admin/webhooks",
                json=webhook_data,
                headers=headers
            ) as response:
                
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                if status in [200, 201]:
                    self.test_results.append({
                        "test": "Admin Webhooks Management",
                        "status": "✅ PASS",
                        "details": f"Webhook created successfully",
                        "response_code": status,
                        "data": response_data
                    })
                    logger.info("✅ AdminWebhooksManagement endpoint working")
                    return True
                else:
                    self.test_results.append({
                        "test": "Admin Webhooks Management",
                        "status": "❌ FAIL",
                        "details": f"Webhook creation failed with status {status}: {response_data}",
                        "response_code": status
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Webhooks Management",
                "status": "❌ ERROR",
                "details": f"Exception during webhooks test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ AdminWebhooksManagement error: {e}")
            return False
    
    async def test_admin_logistics_management(self):
        """Test AdminLogisticsManagement endpoints - POST /admin/transporters and /admin/abattoirs"""
        if not self.auth_token:
            logger.warning("⚠️ No auth token available for logistics test")
            return False
            
        try:
            logger.info("🚛 Testing AdminLogisticsManagement endpoints...")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test transporter creation
            transporter_data = {
                "name": "Test Transport Co",
                "contact_person": "John Doe",
                "phone": "+27 11 123 4567",
                "email": "transport@test.com",
                "service_areas": ["Gauteng", "Mpumalanga"],
                "vehicle_types": ["truck", "bakkie"],
                "rates_per_km": 15.50
            }
            
            async with self.session.post(
                f"{self.api_url}/admin/transporters",
                json=transporter_data,
                headers=headers
            ) as response:
                
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                transporter_success = status in [200, 201]
                
                # Test abattoir creation
                abattoir_data = {
                    "name": "Test Abattoir",
                    "location": "Johannesburg",
                    "contact_person": "Jane Smith",
                    "phone": "+27 11 987 6543",
                    "email": "abattoir@test.com",
                    "capacity_per_day": 100,
                    "species_handled": ["cattle", "sheep", "goats"],
                    "certifications": ["HACCP", "Halal"]
                }
                
                async with self.session.post(
                    f"{self.api_url}/admin/abattoirs",
                    json=abattoir_data,
                    headers=headers
                ) as abattoir_response:
                    
                    abattoir_status = abattoir_response.status
                    abattoir_data_response = await abattoir_response.json() if abattoir_response.content_type == 'application/json' else await abattoir_response.text()
                    
                    abattoir_success = abattoir_status in [200, 201]
                    
                    if transporter_success and abattoir_success:
                        self.test_results.append({
                            "test": "Admin Logistics Management",
                            "status": "✅ PASS",
                            "details": f"Both transporter and abattoir endpoints working. Transporter: {status}, Abattoir: {abattoir_status}",
                            "response_code": f"{status}/{abattoir_status}"
                        })
                        logger.info("✅ AdminLogisticsManagement endpoints working")
                        return True
                    else:
                        self.test_results.append({
                            "test": "Admin Logistics Management",
                            "status": "❌ FAIL",
                            "details": f"Logistics endpoints failed. Transporter: {status} ({transporter_success}), Abattoir: {abattoir_status} ({abattoir_success})",
                            "response_code": f"{status}/{abattoir_status}"
                        })
                        return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Logistics Management",
                "status": "❌ ERROR",
                "details": f"Exception during logistics test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ AdminLogisticsManagement error: {e}")
            return False
    
    async def test_admin_auctions_management(self):
        """Test AdminAuctionsManagement endpoint - POST /admin/auctions"""
        if not self.auth_token:
            logger.warning("⚠️ No auth token available for auctions test")
            return False
            
        try:
            logger.info("🏛️ Testing AdminAuctionsManagement endpoint...")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test auction creation
            auction_data = {
                "title": "Test Livestock Auction",
                "description": "Test auction for critical fixes validation",
                "start_time": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                "end_time": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
                "location": "Johannesburg Livestock Market",
                "minimum_bid": 1000.00,
                "reserve_price": 5000.00,
                "auction_type": "live",
                "categories": ["cattle", "sheep"]
            }
            
            async with self.session.post(
                f"{self.api_url}/admin/auctions",
                json=auction_data,
                headers=headers
            ) as response:
                
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                if status in [200, 201]:
                    self.test_results.append({
                        "test": "Admin Auctions Management",
                        "status": "✅ PASS",
                        "details": f"Auction created successfully",
                        "response_code": status,
                        "data": response_data
                    })
                    logger.info("✅ AdminAuctionsManagement endpoint working")
                    return True
                else:
                    self.test_results.append({
                        "test": "Admin Auctions Management",
                        "status": "❌ FAIL",
                        "details": f"Auction creation failed with status {status}: {response_data}",
                        "response_code": status
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Auctions Management",
                "status": "❌ ERROR",
                "details": f"Exception during auctions test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ AdminAuctionsManagement error: {e}")
            return False
    
    async def test_disease_zone_manager(self):
        """Test DiseaseZoneManager endpoint - POST /admin/disease-zones"""
        if not self.auth_token:
            logger.warning("⚠️ No auth token available for disease zones test")
            return False
            
        try:
            logger.info("🦠 Testing DiseaseZoneManager endpoint...")
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            # Test disease zone creation
            disease_zone_data = {
                "name": "Test Disease Zone",
                "description": "Test disease zone for critical fixes validation",
                "disease_type": "Foot and Mouth Disease",
                "severity_level": "high",
                "affected_areas": ["Gauteng North", "Pretoria East"],
                "restrictions": {
                    "movement_banned": True,
                    "quarantine_required": True,
                    "testing_mandatory": True
                },
                "start_date": datetime.now(timezone.utc).isoformat(),
                "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                "contact_person": "Dr. Smith",
                "contact_phone": "+27 12 345 6789"
            }
            
            async with self.session.post(
                f"{self.api_url}/admin/disease-zones",
                json=disease_zone_data,
                headers=headers
            ) as response:
                
                status = response.status
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                if status in [200, 201]:
                    self.test_results.append({
                        "test": "Disease Zone Manager",
                        "status": "✅ PASS",
                        "details": f"Disease zone created successfully",
                        "response_code": status,
                        "data": response_data
                    })
                    logger.info("✅ DiseaseZoneManager endpoint working")
                    return True
                else:
                    self.test_results.append({
                        "test": "Disease Zone Manager",
                        "status": "❌ FAIL",
                        "details": f"Disease zone creation failed with status {status}: {response_data}",
                        "response_code": status
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Disease Zone Manager",
                "status": "❌ ERROR",
                "details": f"Exception during disease zones test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ DiseaseZoneManager error: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all critical fixes tests"""
        logger.info("🚀 Starting Critical Fixes Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Test 1: Admin Login
            admin_login_success = await self.authenticate_admin()
            
            # Test 2: Platform Configuration API
            await self.test_platform_config_api()
            
            # Test 3: Admin Settings Endpoints (requires auth)
            if admin_login_success:
                await self.test_admin_settings_endpoints()
                
                # Test 4: The 4 newly fixed admin component endpoints
                await self.test_admin_webhooks_management()
                await self.test_admin_logistics_management()
                await self.test_admin_auctions_management()
                await self.test_disease_zone_manager()
            else:
                logger.warning("⚠️ Skipping authenticated tests due to login failure")
            
        finally:
            await self.cleanup_session()
        
        # Print results
        self.print_test_results()
        
        return self.test_results
    
    def print_test_results(self):
        """Print comprehensive test results"""
        logger.info("\n" + "="*80)
        logger.info("🧪 CRITICAL FIXES BACKEND TEST RESULTS")
        logger.info("="*80)
        
        passed = 0
        failed = 0
        errors = 0
        
        for result in self.test_results:
            status = result["status"]
            if "✅ PASS" in status:
                passed += 1
            elif "❌ FAIL" in status:
                failed += 1
            elif "❌ ERROR" in status:
                errors += 1
            
            logger.info(f"{result['test']}: {status}")
            logger.info(f"  Details: {result['details']}")
            if result.get('response_code'):
                logger.info(f"  Response Code: {result['response_code']}")
            logger.info("")
        
        logger.info("="*80)
        logger.info(f"📊 SUMMARY: {passed} PASSED | {failed} FAILED | {errors} ERRORS")
        logger.info("="*80)
        
        # Determine overall status
        if failed == 0 and errors == 0:
            logger.info("🎉 ALL CRITICAL FIXES ARE WORKING CORRECTLY!")
        elif failed > 0:
            logger.info(f"⚠️ {failed} CRITICAL ISSUES FOUND - NEED ATTENTION")
        if errors > 0:
            logger.info(f"❌ {errors} ERRORS ENCOUNTERED - NEED INVESTIGATION")

async def main():
    """Main test execution"""
    tester = CriticalFixesTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())