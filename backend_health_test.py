#!/usr/bin/env python3
"""
🧪 BACKEND HEALTH CHECK
Quick health check of core backend functionality
"""

import asyncio
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BackendHealthTester:
    """Backend Health Check Tester"""
    
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
    
    async def test_basic_endpoints(self):
        """Test basic public endpoints"""
        try:
            logger.info("🔍 Testing basic public endpoints...")
            
            endpoints_to_test = [
                ("/species", "Species API"),
                ("/product-types", "Product Types API"),
                ("/public/buy-requests", "Public Buy Requests API"),
                ("/platform/config", "Platform Config API")
            ]
            
            for endpoint, name in endpoints_to_test:
                async with self.session.get(f"{self.api_url}{endpoint}") as response:
                    status = response.status
                    
                    if status == 200:
                        self.test_results.append({
                            "test": name,
                            "status": "✅ PASS",
                            "details": f"Endpoint accessible",
                            "response_code": status
                        })
                    else:
                        self.test_results.append({
                            "test": name,
                            "status": "❌ FAIL",
                            "details": f"Endpoint failed with status {status}",
                            "response_code": status
                        })
                        
        except Exception as e:
            self.test_results.append({
                "test": "Basic Endpoints",
                "status": "❌ ERROR",
                "details": f"Exception during basic endpoints test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ Basic endpoints error: {e}")
    
    async def test_admin_login(self):
        """Test admin login"""
        try:
            logger.info("🔐 Testing admin login...")
            
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
                        self.auth_token = response_data.get("token") or response_data.get("access_token")
                        
                        self.test_results.append({
                            "test": "Admin Login",
                            "status": "✅ PASS",
                            "details": f"Admin login successful",
                            "response_code": status
                        })
                        return True
                    else:
                        self.test_results.append({
                            "test": "Admin Login",
                            "status": "❌ FAIL",
                            "details": f"Login successful but no token in response",
                            "response_code": status
                        })
                        return False
                else:
                    self.test_results.append({
                        "test": "Admin Login",
                        "status": "❌ FAIL",
                        "details": f"Login failed with status {status}",
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
    
    async def test_authenticated_endpoints(self):
        """Test authenticated endpoints"""
        if not self.auth_token:
            logger.warning("⚠️ No auth token available for authenticated tests")
            return
            
        try:
            logger.info("🔒 Testing authenticated endpoints...")
            
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            auth_endpoints_to_test = [
                ("/admin/settings", "Admin Settings"),
                ("/admin/users", "Admin Users"),
                ("/admin/listings", "Admin Listings")
            ]
            
            for endpoint, name in auth_endpoints_to_test:
                async with self.session.get(f"{self.api_url}{endpoint}", headers=headers) as response:
                    status = response.status
                    
                    if status == 200:
                        self.test_results.append({
                            "test": name,
                            "status": "✅ PASS",
                            "details": f"Authenticated endpoint accessible",
                            "response_code": status
                        })
                    else:
                        self.test_results.append({
                            "test": name,
                            "status": "❌ FAIL",
                            "details": f"Authenticated endpoint failed with status {status}",
                            "response_code": status
                        })
                        
        except Exception as e:
            self.test_results.append({
                "test": "Authenticated Endpoints",
                "status": "❌ ERROR",
                "details": f"Exception during authenticated endpoints test: {str(e)}",
                "response_code": None
            })
            logger.error(f"❌ Authenticated endpoints error: {e}")
    
    async def run_health_check(self):
        """Run health check"""
        logger.info("🚀 Starting Backend Health Check...")
        
        await self.setup_session()
        
        try:
            # Test basic endpoints
            await self.test_basic_endpoints()
            
            # Test admin login
            admin_login_success = await self.test_admin_login()
            
            # Test authenticated endpoints
            if admin_login_success:
                await self.test_authenticated_endpoints()
            
        finally:
            await self.cleanup_session()
        
        # Print results
        self.print_test_results()
        
        return self.test_results
    
    def print_test_results(self):
        """Print health check results"""
        logger.info("\n" + "="*80)
        logger.info("🧪 BACKEND HEALTH CHECK RESULTS")
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
            if result.get('response_code'):
                logger.info(f"  Response Code: {result['response_code']}")
        
        logger.info("="*80)
        logger.info(f"📊 HEALTH CHECK: {passed} PASSED | {failed} FAILED | {errors} ERRORS")
        logger.info("="*80)
        
        # Determine overall health
        if failed == 0 and errors == 0:
            logger.info("💚 BACKEND IS HEALTHY!")
        elif failed > 0:
            logger.info(f"⚠️ {failed} ISSUES FOUND")
        if errors > 0:
            logger.info(f"❌ {errors} ERRORS ENCOUNTERED")

async def main():
    """Main health check execution"""
    tester = BackendHealthTester()
    await tester.run_health_check()

if __name__ == "__main__":
    asyncio.run(main())