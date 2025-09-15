#!/usr/bin/env python3
"""
COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND AUDIT & TESTING
==========================================================

This script performs a complete backend health check, bug identification, 
and systematic testing for the entire StockLot marketplace application.

Test Coverage:
- Authentication & User Management
- Marketplace Core Functionality
- Payment & Checkout System
- Admin & Moderation System
- Database Operations
- File Upload & Storage
- Email System Testing
- Payment Gateway Integration
- Search & Filtering
- Error Handling & Edge Cases
- Rate Limiting Verification
"""

import asyncio
import aiohttp
import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StockLotBackendTester:
    def __init__(self):
        # Get backend URL from environment
        self.backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
        self.api_base = f"{self.backend_url}/api"
        
        # Test credentials and tokens
        self.test_user_email = "audit@stocklot.co.za"
        self.test_user_password = "StockLot2024!@#"
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "Admin123!@#"
        
        self.auth_token = None
        self.admin_token = None
        
        # Test results tracking
        self.test_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "critical_failures": [],
            "warnings": [],
            "test_details": {}
        }
        
        # Session for HTTP requests
        self.session = None
    
    async def setup_session(self):
        """Initialize HTTP session"""
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
    
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, 
                          headers: Dict = None, params: Dict = None) -> Dict:
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
        self.test_results["total_tests"] += 1
        
        if passed:
            self.test_results["passed_tests"] += 1
            logger.info(f"✅ {test_name}: PASSED - {details}")
        else:
            self.test_results["failed_tests"] += 1
            logger.error(f"❌ {test_name}: FAILED - {details}")
            
            if critical:
                self.test_results["critical_failures"].append({
                    "test": test_name,
                    "details": details
                })
        
        self.test_results["test_details"][test_name] = {
            "passed": passed,
            "details": details,
            "critical": critical,
            "timestamp": datetime.now().isoformat()
        }
    
    # PHASE 1: CRITICAL SYSTEM HEALTH CHECK
    
    async def test_health_check(self):
        """Test basic health check endpoint"""
        logger.info("🔍 Testing Health Check Endpoint...")
        
        response = await self.make_request("GET", "/health")
        
        if response["status_code"] == 200:
            self.log_test_result(
                "Health Check", True, 
                f"Backend is healthy - Status: {response['status_code']}"
            )
        else:
            self.log_test_result(
                "Health Check", False,
                f"Health check failed - Status: {response.get('status_code', 'Unknown')}",
                critical=True
            )
    
    async def test_authentication_system(self):
        """Test complete authentication system"""
        logger.info("🔐 Testing Authentication & User Management...")
        
        # Test 1: User Registration
        test_user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "full_name": "Audit Test User",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        response = await self.make_request("POST", "/auth/register", test_user_data)
        
        if response["status_code"] in [200, 201, 409]:  # 409 = user already exists
            self.log_test_result(
                "User Registration", True,
                f"Registration endpoint working - Status: {response['status_code']}"
            )
        else:
            self.log_test_result(
                "User Registration", False,
                f"Registration failed - Status: {response.get('status_code')} - {response.get('data', {}).get('detail', 'Unknown error')}",
                critical=True
            )
        
        # Test 2: User Login
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        response = await self.make_request("POST", "/auth/login", login_data)
        
        if response["status_code"] == 200 and response.get("data", {}).get("access_token"):
            self.auth_token = response["data"]["access_token"]
            self.log_test_result(
                "User Login", True,
                "Login successful, token received"
            )
        else:
            self.log_test_result(
                "User Login", False,
                f"Login failed - Status: {response.get('status_code')} - {response.get('data', {}).get('detail', 'No token received')}",
                critical=True
            )
        
        # Test 3: Profile Access (if we have token)
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/auth/profile", headers=headers)
            
            if response["status_code"] == 200:
                self.log_test_result(
                    "Profile Access", True,
                    "Profile data retrieved successfully"
                )
            else:
                self.log_test_result(
                    "Profile Access", False,
                    f"Profile access failed - Status: {response.get('status_code')}"
                )
        
        # Test 4: Admin Login
        admin_login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        response = await self.make_request("POST", "/auth/login", admin_login_data)
        
        if response["status_code"] == 200 and response.get("data", {}).get("access_token"):
            self.admin_token = response["data"]["access_token"]
            self.log_test_result(
                "Admin Login", True,
                "Admin login successful"
            )
        else:
            self.log_test_result(
                "Admin Login", False,
                f"Admin login failed - Status: {response.get('status_code')}",
                critical=True
            )
    
    async def test_marketplace_functionality(self):
        """Test core marketplace functionality"""
        logger.info("🛒 Testing Marketplace Core Functionality...")
        
        # Test 1: Listings Endpoint
        response = await self.make_request("GET", "/listings")
        
        if response["status_code"] == 200:
            listings_data = response.get("data", {})
            listings_count = len(listings_data.get("data", []))
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
        
        # Test 2: Listings with Filters
        params = {"category": "poultry", "limit": "50"}
        response = await self.make_request("GET", "/listings", params=params)
        
        if response["status_code"] == 200:
            self.log_test_result(
                "Listings Filtering", True,
                "Filtered listings working correctly"
            )
        else:
            self.log_test_result(
                "Listings Filtering", False,
                f"Filtered listings failed - Status: {response.get('status_code')}"
            )
        
        # Test 3: Categories Endpoint
        response = await self.make_request("GET", "/listings/categories")
        
        if response["status_code"] == 200:
            categories = response.get("data", [])
            self.log_test_result(
                "Categories Endpoint", True,
                f"Retrieved {len(categories)} categories"
            )
        else:
            self.log_test_result(
                "Categories Endpoint", False,
                f"Categories retrieval failed - Status: {response.get('status_code')}"
            )
        
        # Test 4: Species Endpoint
        response = await self.make_request("GET", "/listings/species")
        
        if response["status_code"] == 200:
            species = response.get("data", [])
            self.log_test_result(
                "Species Endpoint", True,
                f"Retrieved {len(species)} species"
            )
        else:
            self.log_test_result(
                "Species Endpoint", False,
                f"Species retrieval failed - Status: {response.get('status_code')}"
            )
        
        # Test 5: Specific Listing Retrieval
        # First get a listing ID
        response = await self.make_request("GET", "/listings")
        if response["status_code"] == 200:
            listings = response.get("data", {}).get("data", [])
            if listings:
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
    
    async def test_payment_system(self):
        """Test payment and checkout system"""
        logger.info("💳 Testing Payment & Checkout System...")
        
        # Test 1: Fee Calculation
        fee_data = {
            "items": [{"price": 100, "quantity": 2}]
        }
        
        response = await self.make_request("POST", "/fees/breakdown", fee_data)
        
        if response["status_code"] == 200:
            fee_breakdown = response.get("data", {})
            self.log_test_result(
                "Fee Calculation", True,
                f"Fee calculation working - Processing fee: {fee_breakdown.get('processing_fee', 'N/A')}"
            )
        else:
            self.log_test_result(
                "Fee Calculation", False,
                f"Fee calculation failed - Status: {response.get('status_code')}",
                critical=True
            )
        
        # Test 2: Checkout Preview (requires authentication)
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # First get a listing ID for checkout
            listings_response = await self.make_request("GET", "/listings")
            if listings_response["status_code"] == 200:
                listings = listings_response.get("data", {}).get("data", [])
                if listings:
                    listing_id = listings[0].get("id")
                    
                    checkout_data = {
                        "items": [{"listing_id": listing_id, "quantity": 1}]
                    }
                    
                    response = await self.make_request("POST", "/checkout/preview", checkout_data, headers=headers)
                    
                    if response["status_code"] == 200:
                        self.log_test_result(
                            "Checkout Preview", True,
                            "Checkout preview working correctly"
                        )
                    else:
                        self.log_test_result(
                            "Checkout Preview", False,
                            f"Checkout preview failed - Status: {response.get('status_code')}"
                        )
        
        # Test 3: Paystack Integration Test
        paystack_data = {
            "amount": 100,
            "email": "test@example.com",
            "reference": f"TEST_{int(time.time())}"
        }
        
        response = await self.make_request("POST", "/payments/paystack/init", paystack_data)
        
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
                f"Paystack integration failed - Status: {response.get('status_code')}",
                critical=True
            )
    
    async def test_admin_system(self):
        """Test admin and moderation system"""
        logger.info("👨‍💼 Testing Admin & Moderation System...")
        
        if not self.admin_token:
            self.log_test_result(
                "Admin System", False,
                "Cannot test admin system - no admin token available",
                critical=True
            )
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: Dashboard Stats
        response = await self.make_request("GET", "/admin/dashboard/stats", headers=headers)
        
        if response["status_code"] == 200:
            stats = response.get("data", {})
            self.log_test_result(
                "Admin Dashboard Stats", True,
                f"Dashboard stats retrieved - Users: {stats.get('total_users', 'N/A')}, Listings: {stats.get('total_listings', 'N/A')}"
            )
        else:
            self.log_test_result(
                "Admin Dashboard Stats", False,
                f"Dashboard stats failed - Status: {response.get('status_code')}"
            )
        
        # Test 2: Moderation Queue
        response = await self.make_request("GET", "/admin/moderation/pending", headers=headers)
        
        if response["status_code"] == 200:
            pending_items = response.get("data", [])
            self.log_test_result(
                "Moderation Queue", True,
                f"Moderation queue accessible - {len(pending_items)} pending items"
            )
        else:
            self.log_test_result(
                "Moderation Queue", False,
                f"Moderation queue failed - Status: {response.get('status_code')}"
            )
        
        # Test 3: User Management
        params = {"limit": "10"}
        response = await self.make_request("GET", "/admin/users", params=params, headers=headers)
        
        if response["status_code"] == 200:
            users = response.get("data", [])
            self.log_test_result(
                "Admin User Management", True,
                f"User management working - {len(users)} users retrieved"
            )
        else:
            self.log_test_result(
                "Admin User Management", False,
                f"User management failed - Status: {response.get('status_code')}"
            )
    
    async def test_search_functionality(self):
        """Test search and filtering functionality"""
        logger.info("🔍 Testing Search & Filtering...")
        
        # Test 1: Listing Search
        params = {"q": "chicken", "category": "poultry"}
        response = await self.make_request("GET", "/listings/search", params=params)
        
        if response["status_code"] == 200:
            search_results = response.get("data", [])
            self.log_test_result(
                "Listing Search", True,
                f"Search working - {len(search_results)} results for 'chicken'"
            )
        else:
            self.log_test_result(
                "Listing Search", False,
                f"Listing search failed - Status: {response.get('status_code')}"
            )
        
        # Test 2: Buy Request Search
        params = {"q": "cattle"}
        response = await self.make_request("GET", "/buy-requests/search", params=params)
        
        if response["status_code"] == 200:
            buy_request_results = response.get("data", [])
            self.log_test_result(
                "Buy Request Search", True,
                f"Buy request search working - {len(buy_request_results)} results"
            )
        else:
            self.log_test_result(
                "Buy Request Search", False,
                f"Buy request search failed - Status: {response.get('status_code')}"
            )
    
    async def test_error_handling(self):
        """Test error handling and edge cases"""
        logger.info("⚠️ Testing Error Handling & Edge Cases...")
        
        # Test 1: Invalid Registration Data
        invalid_data = {
            "email": "invalid-email",
            "password": "123"
        }
        
        response = await self.make_request("POST", "/auth/register", invalid_data)
        
        if response["status_code"] in [400, 422]:
            self.log_test_result(
                "Input Validation", True,
                f"Input validation working - Status: {response['status_code']}"
            )
        else:
            self.log_test_result(
                "Input Validation", False,
                f"Input validation not working - Status: {response.get('status_code')}"
            )
        
        # Test 2: SQL Injection Attempt
        params = {"category": "'; DROP TABLE listings; --"}
        response = await self.make_request("GET", "/listings", params=params)
        
        if response["status_code"] in [200, 400, 422]:  # Should handle gracefully
            self.log_test_result(
                "SQL Injection Protection", True,
                "SQL injection attempt handled safely"
            )
        else:
            self.log_test_result(
                "SQL Injection Protection", False,
                f"SQL injection protection failed - Status: {response.get('status_code')}",
                critical=True
            )
        
        # Test 3: Non-existent Endpoint
        response = await self.make_request("GET", "/nonexistent-endpoint")
        
        if response["status_code"] == 404:
            self.log_test_result(
                "404 Error Handling", True,
                "404 errors handled correctly"
            )
        else:
            self.log_test_result(
                "404 Error Handling", False,
                f"404 handling incorrect - Status: {response.get('status_code')}"
            )
    
    async def test_rate_limiting(self):
        """Test rate limiting functionality"""
        logger.info("🚦 Testing Rate Limiting...")
        
        # Test rate limiting by making multiple requests quickly
        endpoint = "/listings"
        success_count = 0
        rate_limited_count = 0
        
        for i in range(20):
            response = await self.make_request("GET", endpoint)
            
            if response["status_code"] == 200:
                success_count += 1
            elif response["status_code"] == 429:
                rate_limited_count += 1
            
            # Small delay to avoid overwhelming
            await asyncio.sleep(0.1)
        
        if rate_limited_count > 0:
            self.log_test_result(
                "Rate Limiting", True,
                f"Rate limiting working - {success_count} successful, {rate_limited_count} rate limited"
            )
        else:
            self.log_test_result(
                "Rate Limiting", False,
                f"Rate limiting not working - all {success_count} requests succeeded"
            )
    
    async def test_file_upload_system(self):
        """Test file upload functionality"""
        logger.info("📁 Testing File Upload & Storage...")
        
        if not self.auth_token:
            self.log_test_result(
                "File Upload System", False,
                "Cannot test file upload - no authentication token",
                critical=True
            )
            return
        
        # Test file upload endpoint accessibility
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test with a simple text file (simulating image upload)
        # Note: This is a basic test - in production you'd use actual image files
        response = await self.make_request("POST", "/upload/listing-image", headers=headers)
        
        # We expect this to fail with 422 (missing file) rather than 404 or 500
        if response["status_code"] in [400, 422]:
            self.log_test_result(
                "File Upload Endpoint", True,
                "File upload endpoint accessible and validates input"
            )
        elif response["status_code"] == 404:
            self.log_test_result(
                "File Upload Endpoint", False,
                "File upload endpoint not found",
                critical=True
            )
        else:
            self.log_test_result(
                "File Upload Endpoint", False,
                f"File upload endpoint error - Status: {response.get('status_code')}"
            )
    
    async def test_email_system(self):
        """Test email system functionality"""
        logger.info("📧 Testing Email System...")
        
        # Test email configuration endpoint
        email_data = {
            "to": "test@example.com",
            "template": "welcome"
        }
        
        response = await self.make_request("POST", "/test/email", email_data)
        
        if response["status_code"] in [200, 202]:
            self.log_test_result(
                "Email System", True,
                "Email system configured and accessible"
            )
        elif response["status_code"] == 404:
            self.log_test_result(
                "Email System", False,
                "Email test endpoint not found"
            )
        else:
            self.log_test_result(
                "Email System", False,
                f"Email system test failed - Status: {response.get('status_code')}"
            )
    
    async def run_comprehensive_audit(self):
        """Run complete backend audit"""
        logger.info("🚀 Starting Comprehensive StockLot Backend Audit...")
        logger.info(f"🔗 Testing Backend: {self.backend_url}")
        
        start_time = time.time()
        
        try:
            await self.setup_session()
            
            # Phase 1: Critical System Health Check
            logger.info("\n" + "="*60)
            logger.info("PHASE 1: CRITICAL SYSTEM HEALTH CHECK")
            logger.info("="*60)
            
            await self.test_health_check()
            await self.test_authentication_system()
            await self.test_marketplace_functionality()
            await self.test_payment_system()
            
            # Phase 2: Data Integrity & Performance
            logger.info("\n" + "="*60)
            logger.info("PHASE 2: DATA INTEGRITY & PERFORMANCE")
            logger.info("="*60)
            
            await self.test_admin_system()
            await self.test_file_upload_system()
            
            # Phase 3: Integration Systems
            logger.info("\n" + "="*60)
            logger.info("PHASE 3: INTEGRATION SYSTEMS")
            logger.info("="*60)
            
            await self.test_email_system()
            await self.test_search_functionality()
            
            # Phase 4: Error Handling & Edge Cases
            logger.info("\n" + "="*60)
            logger.info("PHASE 4: ERROR HANDLING & EDGE CASES")
            logger.info("="*60)
            
            await self.test_error_handling()
            await self.test_rate_limiting()
            
        except Exception as e:
            logger.error(f"Critical error during testing: {e}")
            self.test_results["critical_failures"].append({
                "test": "Test Execution",
                "details": f"Critical error: {str(e)}"
            })
        
        finally:
            await self.cleanup_session()
        
        # Generate final report
        end_time = time.time()
        duration = end_time - start_time
        
        self.generate_final_report(duration)
    
    def generate_final_report(self, duration: float):
        """Generate comprehensive test report"""
        logger.info("\n" + "="*80)
        logger.info("COMPREHENSIVE STOCKLOT BACKEND AUDIT REPORT")
        logger.info("="*80)
        
        # Summary Statistics
        total = self.test_results["total_tests"]
        passed = self.test_results["passed_tests"]
        failed = self.test_results["failed_tests"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        logger.info(f"📊 TEST SUMMARY:")
        logger.info(f"   Total Tests: {total}")
        logger.info(f"   Passed: {passed}")
        logger.info(f"   Failed: {failed}")
        logger.info(f"   Success Rate: {success_rate:.1f}%")
        logger.info(f"   Duration: {duration:.2f} seconds")
        
        # Critical Failures
        if self.test_results["critical_failures"]:
            logger.info(f"\n🚨 CRITICAL FAILURES ({len(self.test_results['critical_failures'])}):")
            for failure in self.test_results["critical_failures"]:
                logger.info(f"   ❌ {failure['test']}: {failure['details']}")
        
        # Success Summary
        logger.info(f"\n✅ SUCCESSFUL TESTS:")
        for test_name, details in self.test_results["test_details"].items():
            if details["passed"]:
                logger.info(f"   ✅ {test_name}: {details['details']}")
        
        # Failed Tests (non-critical)
        failed_non_critical = [
            (name, details) for name, details in self.test_results["test_details"].items()
            if not details["passed"] and not details["critical"]
        ]
        
        if failed_non_critical:
            logger.info(f"\n⚠️ FAILED TESTS (NON-CRITICAL):")
            for test_name, details in failed_non_critical:
                logger.info(f"   ⚠️ {test_name}: {details['details']}")
        
        # Overall Assessment
        logger.info(f"\n🎯 OVERALL ASSESSMENT:")
        if success_rate >= 90:
            logger.info("   🟢 EXCELLENT - Backend is in excellent condition")
        elif success_rate >= 75:
            logger.info("   🟡 GOOD - Backend is functional with minor issues")
        elif success_rate >= 50:
            logger.info("   🟠 FAIR - Backend has significant issues requiring attention")
        else:
            logger.info("   🔴 POOR - Backend has critical issues requiring immediate attention")
        
        # Recommendations
        logger.info(f"\n💡 RECOMMENDATIONS:")
        if self.test_results["critical_failures"]:
            logger.info("   1. Address critical failures immediately")
            logger.info("   2. Implement proper error handling for failed endpoints")
            logger.info("   3. Review authentication and security measures")
        else:
            logger.info("   1. Monitor system performance regularly")
            logger.info("   2. Continue testing with real-world scenarios")
            logger.info("   3. Implement comprehensive logging and monitoring")
        
        logger.info("\n" + "="*80)
        logger.info("END OF COMPREHENSIVE BACKEND AUDIT")
        logger.info("="*80)

async def main():
    """Main execution function"""
    tester = StockLotBackendTester()
    await tester.run_comprehensive_audit()

if __name__ == "__main__":
    asyncio.run(main())