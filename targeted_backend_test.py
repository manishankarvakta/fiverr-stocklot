#!/usr/bin/env python3
"""
TARGETED STOCKLOT BACKEND TESTING
=================================

This script performs targeted testing of the StockLot backend based on the 
comprehensive audit findings, focusing on the actual API structure.
"""

import asyncio
import aiohttp
import json
import os
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TargetedBackendTester:
    def __init__(self):
        self.backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
        self.api_base = f"{self.backend_url}/api"
        
        # Test credentials
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "admin123"
        
        self.auth_token = None
        self.session = None
        
        # Test results
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "critical_failures": [],
            "test_details": {}
        }
    
    async def setup_session(self):
        """Initialize HTTP session"""
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
    
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, data: dict = None, 
                          headers: dict = None, params: dict = None) -> dict:
        """Make HTTP request with error handling"""
        url = f"{self.api_base}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=default_headers,
                params=params
            ) as response:
                
                response_data = {
                    "status_code": response.status,
                    "headers": dict(response.headers),
                    "url": str(response.url)
                }
                
                try:
                    response_data["data"] = await response.json()
                except:
                    response_data["text"] = await response.text()
                
                return response_data
                
        except Exception as e:
            return {
                "status_code": 0,
                "error": str(e),
                "url": url
            }
    
    def log_test_result(self, test_name: str, passed: bool, details: str, critical: bool = False):
        """Log test result"""
        self.results["total_tests"] += 1
        
        if passed:
            self.results["passed"] += 1
            logger.info(f"✅ {test_name}: PASSED - {details}")
        else:
            self.results["failed"] += 1
            logger.error(f"❌ {test_name}: FAILED - {details}")
            
            if critical:
                self.results["critical_failures"].append({
                    "test": test_name,
                    "details": details
                })
        
        self.results["test_details"][test_name] = {
            "passed": passed,
            "details": details,
            "critical": critical
        }
    
    async def test_authentication_system(self):
        """Test authentication system with correct endpoints"""
        logger.info("🔐 Testing Authentication System...")
        
        # Test 1: Enhanced Login (returns access_token)
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        response = await self.make_request("POST", "/auth/login-enhanced", login_data)
        
        if response["status_code"] == 200 and response.get("data", {}).get("access_token"):
            self.auth_token = response["data"]["access_token"]
            user_data = response["data"].get("user", {})
            self.log_test_result(
                "Enhanced Login", True,
                f"Login successful - User: {user_data.get('full_name', 'Unknown')}, Roles: {user_data.get('roles', [])}"
            )
        else:
            self.log_test_result(
                "Enhanced Login", False,
                f"Enhanced login failed - Status: {response.get('status_code')} - {response.get('data', {}).get('detail', 'No token received')}",
                critical=True
            )
        
        # Test 2: Profile Access with Bearer Token
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/auth/profile", headers=headers)
            
            if response["status_code"] == 200:
                profile_data = response.get("data", {})
                self.log_test_result(
                    "Profile Access", True,
                    f"Profile retrieved - Email: {profile_data.get('email', 'N/A')}"
                )
            else:
                self.log_test_result(
                    "Profile Access", False,
                    f"Profile access failed - Status: {response.get('status_code')}"
                )
    
    async def test_marketplace_core(self):
        """Test marketplace core functionality"""
        logger.info("🛒 Testing Marketplace Core...")
        
        # Test 1: Listings Endpoint
        response = await self.make_request("GET", "/listings")
        
        if response["status_code"] == 200:
            listings_data = response.get("data", {})
            if isinstance(listings_data, dict):
                listings_count = len(listings_data.get("data", []))
            else:
                listings_count = len(listings_data) if isinstance(listings_data, list) else 0
            
            self.log_test_result(
                "Listings Endpoint", True,
                f"Retrieved {listings_count} listings successfully"
            )
        else:
            self.log_test_result(
                "Listings Endpoint", False,
                f"Listings retrieval failed - Status: {response.get('status_code')}",
                critical=True
            )
        
        # Test 2: Check if we have any listings for further testing
        if response["status_code"] == 200:
            listings_data = response.get("data", {})
            if isinstance(listings_data, dict):
                listings = listings_data.get("data", [])
            else:
                listings = listings_data if isinstance(listings_data, list) else []
            
            if listings:
                # Test specific listing retrieval
                listing_id = listings[0].get("id")
                if listing_id:
                    response = await self.make_request("GET", f"/listings/{listing_id}")
                    
                    if response["status_code"] == 200:
                        self.log_test_result(
                            "Specific Listing Retrieval", True,
                            f"Retrieved listing {listing_id} successfully"
                        )
                    else:
                        self.log_test_result(
                            "Specific Listing Retrieval", False,
                            f"Specific listing retrieval failed - Status: {response.get('status_code')}"
                        )
                
                # Test PDP endpoint
                if listing_id:
                    response = await self.make_request("GET", f"/listings/{listing_id}/pdp")
                    
                    if response["status_code"] == 200:
                        self.log_test_result(
                            "PDP Endpoint", True,
                            f"PDP data retrieved for listing {listing_id}"
                        )
                    else:
                        self.log_test_result(
                            "PDP Endpoint", False,
                            f"PDP endpoint failed - Status: {response.get('status_code')}"
                        )
    
    async def test_payment_system(self):
        """Test payment system with correct endpoints"""
        logger.info("💳 Testing Payment System...")
        
        # Test 1: Fee Breakdown (correct method)
        fee_data = {
            "items": [{"price": 100, "quantity": 2}]
        }
        
        response = await self.make_request("POST", "/fees/breakdown", fee_data)
        
        if response["status_code"] == 200:
            fee_breakdown = response.get("data", {})
            self.log_test_result(
                "Fee Calculation", True,
                f"Fee calculation working - Response: {fee_breakdown}"
            )
        else:
            # Try GET method if POST doesn't work
            response = await self.make_request("GET", "/fees/breakdown", params={"amount": "200"})
            
            if response["status_code"] == 200:
                self.log_test_result(
                    "Fee Calculation", True,
                    "Fee calculation working with GET method"
                )
            else:
                self.log_test_result(
                    "Fee Calculation", False,
                    f"Fee calculation failed - Status: {response.get('status_code')}",
                    critical=True
                )
        
        # Test 2: Paystack Integration (with authentication)
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            paystack_data = {
                "amount": 100,
                "email": self.admin_email,
                "reference": f"TEST_{int(time.time())}"
            }
            
            response = await self.make_request("POST", "/payments/paystack/init", paystack_data, headers=headers)
            
            if response["status_code"] == 200:
                payment_data = response.get("data", {})
                if payment_data.get("authorization_url"):
                    self.log_test_result(
                        "Paystack Integration", True,
                        "Paystack payment initialization working"
                    )
                else:
                    self.log_test_result(
                        "Paystack Integration", False,
                        "Paystack response missing authorization_url"
                    )
            else:
                self.log_test_result(
                    "Paystack Integration", False,
                    f"Paystack integration failed - Status: {response.get('status_code')}"
                )
    
    async def test_admin_system(self):
        """Test admin system with authentication"""
        logger.info("👨‍💼 Testing Admin System...")
        
        if not self.auth_token:
            self.log_test_result(
                "Admin System", False,
                "Cannot test admin system - no auth token",
                critical=True
            )
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: KYC Admin Stats
        response = await self.make_request("GET", "/admin/kyc/stats", headers=headers)
        
        if response["status_code"] == 200:
            stats = response.get("data", {})
            self.log_test_result(
                "KYC Admin Stats", True,
                f"KYC stats retrieved - Total verifications: {stats.get('total_verifications', 'N/A')}"
            )
        else:
            self.log_test_result(
                "KYC Admin Stats", False,
                f"KYC stats failed - Status: {response.get('status_code')}"
            )
        
        # Test 2: Admin Moderation Stats
        response = await self.make_request("GET", "/admin/moderation/stats", headers=headers)
        
        if response["status_code"] == 200:
            stats = response.get("data", {})
            self.log_test_result(
                "Admin Moderation Stats", True,
                f"Moderation stats retrieved - Pending items: {stats.get('pending_role_requests', 'N/A')}"
            )
        else:
            self.log_test_result(
                "Admin Moderation Stats", False,
                f"Moderation stats failed - Status: {response.get('status_code')}"
            )
        
        # Test 3: Role Requests
        response = await self.make_request("GET", "/admin/roles/requests", headers=headers)
        
        if response["status_code"] == 200:
            requests = response.get("data", [])
            self.log_test_result(
                "Role Requests", True,
                f"Role requests retrieved - Count: {len(requests)}"
            )
        else:
            self.log_test_result(
                "Role Requests", False,
                f"Role requests failed - Status: {response.get('status_code')}"
            )
    
    async def test_cart_system(self):
        """Test cart functionality"""
        logger.info("🛒 Testing Cart System...")
        
        if not self.auth_token:
            self.log_test_result(
                "Cart System", False,
                "Cannot test cart - no auth token",
                critical=True
            )
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Get Cart
        response = await self.make_request("GET", "/cart", headers=headers)
        
        if response["status_code"] == 200:
            cart_data = response.get("data", {})
            self.log_test_result(
                "Get Cart", True,
                f"Cart retrieved - Items: {cart_data.get('item_count', 0)}, Total: {cart_data.get('total', 0)}"
            )
        else:
            self.log_test_result(
                "Get Cart", False,
                f"Get cart failed - Status: {response.get('status_code')}"
            )
        
        # Test 2: Add to Cart (if we have listings)
        listings_response = await self.make_request("GET", "/listings")
        if listings_response["status_code"] == 200:
            listings_data = listings_response.get("data", {})
            if isinstance(listings_data, dict):
                listings = listings_data.get("data", [])
            else:
                listings = listings_data if isinstance(listings_data, list) else []
            
            if listings:
                listing_id = listings[0].get("id")
                cart_item = {
                    "listing_id": listing_id,
                    "quantity": 1
                }
                
                response = await self.make_request("POST", "/cart/add", cart_item, headers=headers)
                
                if response["status_code"] == 200:
                    self.log_test_result(
                        "Add to Cart", True,
                        f"Item added to cart successfully"
                    )
                else:
                    self.log_test_result(
                        "Add to Cart", False,
                        f"Add to cart failed - Status: {response.get('status_code')}"
                    )
    
    async def test_checkout_system(self):
        """Test checkout system"""
        logger.info("💰 Testing Checkout System...")
        
        if not self.auth_token:
            self.log_test_result(
                "Checkout System", False,
                "Cannot test checkout - no auth token",
                critical=True
            )
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Guest Checkout Quote
        listings_response = await self.make_request("GET", "/listings")
        if listings_response["status_code"] == 200:
            listings_data = listings_response.get("data", {})
            if isinstance(listings_data, dict):
                listings = listings_data.get("data", [])
            else:
                listings = listings_data if isinstance(listings_data, list) else []
            
            if listings:
                listing_id = listings[0].get("id")
                quote_data = {
                    "items": [{"listing_id": listing_id, "quantity": 1}],
                    "email": "test@example.com",
                    "phone": "+27123456789"
                }
                
                response = await self.make_request("POST", "/checkout/guest/quote", quote_data)
                
                if response["status_code"] == 200:
                    quote = response.get("data", {})
                    self.log_test_result(
                        "Guest Checkout Quote", True,
                        f"Quote generated - Total: {quote.get('grand_total', 'N/A')}"
                    )
                else:
                    self.log_test_result(
                        "Guest Checkout Quote", False,
                        f"Guest checkout quote failed - Status: {response.get('status_code')}"
                    )
    
    async def run_targeted_tests(self):
        """Run targeted backend tests"""
        logger.info("🎯 Starting Targeted StockLot Backend Testing...")
        logger.info(f"🔗 Testing Backend: {self.backend_url}")
        
        start_time = time.time()
        
        try:
            await self.setup_session()
            
            # Core System Tests
            await self.test_authentication_system()
            await self.test_marketplace_core()
            await self.test_payment_system()
            await self.test_admin_system()
            await self.test_cart_system()
            await self.test_checkout_system()
            
        except Exception as e:
            logger.error(f"Critical error during testing: {e}")
            self.results["critical_failures"].append({
                "test": "Test Execution",
                "details": f"Critical error: {str(e)}"
            })
        
        finally:
            await self.cleanup_session()
        
        # Generate report
        end_time = time.time()
        duration = end_time - start_time
        
        self.generate_report(duration)
    
    def generate_report(self, duration: float):
        """Generate test report"""
        logger.info("\n" + "="*60)
        logger.info("TARGETED BACKEND TEST REPORT")
        logger.info("="*60)
        
        total = self.results["total_tests"]
        passed = self.results["passed"]
        failed = self.results["failed"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        logger.info(f"📊 SUMMARY:")
        logger.info(f"   Total Tests: {total}")
        logger.info(f"   Passed: {passed}")
        logger.info(f"   Failed: {failed}")
        logger.info(f"   Success Rate: {success_rate:.1f}%")
        logger.info(f"   Duration: {duration:.2f} seconds")
        
        if self.results["critical_failures"]:
            logger.info(f"\n🚨 CRITICAL FAILURES:")
            for failure in self.results["critical_failures"]:
                logger.info(f"   ❌ {failure['test']}: {failure['details']}")
        
        logger.info(f"\n✅ SUCCESSFUL TESTS:")
        for test_name, details in self.results["test_details"].items():
            if details["passed"]:
                logger.info(f"   ✅ {test_name}: {details['details']}")
        
        failed_tests = [
            (name, details) for name, details in self.results["test_details"].items()
            if not details["passed"] and not details["critical"]
        ]
        
        if failed_tests:
            logger.info(f"\n⚠️ FAILED TESTS:")
            for test_name, details in failed_tests:
                logger.info(f"   ⚠️ {test_name}: {details['details']}")
        
        logger.info("\n" + "="*60)

async def main():
    """Main execution function"""
    tester = TargetedBackendTester()
    await tester.run_targeted_tests()

if __name__ == "__main__":
    asyncio.run(main())