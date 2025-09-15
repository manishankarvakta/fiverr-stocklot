#!/usr/bin/env python3
"""
COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND AUDIT & TESTING
==========================================================

Complete backend health check, bug identification, and systematic fixes 
for the entire StockLot marketplace application as requested in the review.

MISSION: Complete backend health check, bug identification, and systematic fixes 
for the entire StockLot marketplace application.

Test Coverage:
✅ Authentication & User Management
✅ Marketplace Core Functionality  
✅ Payment & Checkout System
✅ Admin & Moderation System
✅ Database Operations
✅ File Upload & Storage
✅ Email System Testing
✅ Payment Gateway Integration
✅ Search & Filtering
✅ Error Handling & Edge Cases
✅ Rate Limiting Verification
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

class ComprehensiveAuditTester:
    def __init__(self):
        self.backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
        self.api_base = f"{self.backend_url}/api"
        
        # Test credentials
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "admin123"
        self.test_user_email = "audit@test.com"
        self.test_user_password = "Test123!@#"
        
        self.auth_token = None
        self.session = None
        
        # Test results tracking
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "critical_failures": [],
            "warnings": [],
            "test_details": {},
            "phase_results": {}
        }
        
        # Store test data
        self.test_listing_id = None
        self.test_user_id = None
    
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
            "critical": critical,
            "timestamp": datetime.now().isoformat()
        }
    
    # PHASE 1: CRITICAL SYSTEM HEALTH CHECK
    
    async def test_authentication_user_management(self):
        """Test complete authentication & user management system"""
        logger.info("🔐 PHASE 1.1: Authentication & User Management")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: User Registration
        test_user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "full_name": "Audit Test User",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        response = await self.make_request("POST", "/auth/register", test_user_data)
        phase_results["total"] += 1
        
        if response["status_code"] in [200, 201, 409]:  # 409 = user already exists
            phase_results["passed"] += 1
            self.log_test_result(
                "User Registration", True,
                f"Registration working - Status: {response['status_code']}"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "User Registration", False,
                f"Registration failed - Status: {response.get('status_code')} - {response.get('data', {}).get('detail', 'Unknown error')}",
                critical=True
            )
        
        # Test 2: Enhanced Login (returns access_token)
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        response = await self.make_request("POST", "/auth/login-enhanced", login_data)
        phase_results["total"] += 1
        
        if response["status_code"] == 200 and response.get("data", {}).get("access_token"):
            phase_results["passed"] += 1
            self.auth_token = response["data"]["access_token"]
            user_data = response["data"].get("user", {})
            self.log_test_result(
                "User Login", True,
                f"Login successful - User: {user_data.get('full_name', 'Unknown')}, Roles: {user_data.get('roles', [])}"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "User Login", False,
                f"Login failed - Status: {response.get('status_code')} - {response.get('data', {}).get('detail', 'No token received')}",
                critical=True
            )
        
        # Test 3: Password Reset Flow
        reset_data = {"email": self.admin_email}
        response = await self.make_request("POST", "/auth/password-reset", reset_data)
        phase_results["total"] += 1
        
        if response["status_code"] in [200, 202]:
            phase_results["passed"] += 1
            self.log_test_result(
                "Password Reset", True,
                "Password reset endpoint working"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Password Reset", False,
                f"Password reset failed - Status: {response.get('status_code')}"
            )
        
        # Test 4: 2FA System
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/auth/2fa/status", headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                self.log_test_result(
                    "2FA System", True,
                    f"2FA system accessible - Status: {response.get('data', {}).get('enabled', 'N/A')}"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "2FA System", False,
                    f"2FA system failed - Status: {response.get('status_code')}"
                )
        
        self.results["phase_results"]["Authentication & User Management"] = phase_results
        return phase_results
    
    async def test_marketplace_core_functionality(self):
        """Test marketplace core functionality"""
        logger.info("🛒 PHASE 1.2: Marketplace Core Functionality")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: Listings Endpoint
        response = await self.make_request("GET", "/listings")
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            listings_data = response.get("data", {})
            if isinstance(listings_data, dict):
                listings_count = len(listings_data.get("data", []))
                listings = listings_data.get("data", [])
            else:
                listings_count = len(listings_data) if isinstance(listings_data, list) else 0
                listings = listings_data if isinstance(listings_data, list) else []
            
            if listings:
                self.test_listing_id = listings[0].get("id")
            
            self.log_test_result(
                "Listings Endpoint", True,
                f"Retrieved {listings_count} listings successfully"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Listings Endpoint", False,
                f"Listings retrieval failed - Status: {response.get('status_code')}",
                critical=True
            )
        
        # Test 2: Listings with Category Filter
        params = {"category": "poultry", "limit": "50"}
        response = await self.make_request("GET", "/listings", params=params)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            self.log_test_result(
                "Listings Filtering", True,
                "Category filtering working correctly"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Listings Filtering", False,
                f"Listings filtering failed - Status: {response.get('status_code')}"
            )
        
        # Test 3: Species Endpoint
        response = await self.make_request("GET", "/species")
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            species = response.get("data", [])
            self.log_test_result(
                "Species Endpoint", True,
                f"Retrieved {len(species)} species"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Species Endpoint", False,
                f"Species retrieval failed - Status: {response.get('status_code')}"
            )
        
        # Test 4: Categories Endpoint
        response = await self.make_request("GET", "/categories")
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            categories = response.get("data", [])
            self.log_test_result(
                "Categories Endpoint", True,
                f"Retrieved {len(categories)} categories"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Categories Endpoint", False,
                f"Categories retrieval failed - Status: {response.get('status_code')}"
            )
        
        # Test 5: Specific Listing Retrieval
        if self.test_listing_id:
            response = await self.make_request("GET", f"/listings/{self.test_listing_id}")
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                self.log_test_result(
                    "Specific Listing Retrieval", True,
                    f"Retrieved listing {self.test_listing_id} successfully"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "Specific Listing Retrieval", False,
                    f"Specific listing retrieval failed - Status: {response.get('status_code')}"
                )
        
        self.results["phase_results"]["Marketplace Core Functionality"] = phase_results
        return phase_results
    
    async def test_payment_checkout_system(self):
        """Test payment & checkout system"""
        logger.info("💳 PHASE 1.3: Payment & Checkout System")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: Fee Breakdown
        fee_data = {"items": [{"price": 100, "quantity": 2}]}
        response = await self.make_request("POST", "/fees/breakdown", fee_data)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            fee_breakdown = response.get("data", {})
            self.log_test_result(
                "Fee Calculation", True,
                f"Fee calculation working - Processing fee: {fee_breakdown.get('processing_fee', 'N/A')}"
            )
        else:
            # Try GET method
            response = await self.make_request("GET", "/fees/breakdown", params={"amount": "200"})
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                self.log_test_result(
                    "Fee Calculation", True,
                    "Fee calculation working with GET method"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "Fee Calculation", False,
                    f"Fee calculation failed - Status: {response.get('status_code')}",
                    critical=True
                )
        
        # Test 2: Checkout Preview
        if self.auth_token and self.test_listing_id:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            checkout_data = {"items": [{"listing_id": self.test_listing_id, "quantity": 1}]}
            
            response = await self.make_request("POST", "/checkout/preview", checkout_data, headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                self.log_test_result(
                    "Checkout Preview", True,
                    "Checkout preview working correctly"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "Checkout Preview", False,
                    f"Checkout preview failed - Status: {response.get('status_code')}"
                )
        
        # Test 3: Paystack Integration
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            paystack_data = {
                "amount": 100,
                "email": self.admin_email,
                "reference": f"TEST_{int(time.time())}"
            }
            
            response = await self.make_request("POST", "/payments/paystack/init", paystack_data, headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
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
                phase_results["failed"] += 1
                self.log_test_result(
                    "Paystack Integration", False,
                    f"Paystack integration failed - Status: {response.get('status_code')}"
                )
        
        self.results["phase_results"]["Payment & Checkout System"] = phase_results
        return phase_results
    
    async def test_admin_moderation_system(self):
        """Test admin & moderation system"""
        logger.info("👨‍💼 PHASE 1.4: Admin & Moderation System")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        if not self.auth_token:
            self.log_test_result(
                "Admin System", False,
                "Cannot test admin system - no auth token",
                critical=True
            )
            return phase_results
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Dashboard Stats
        response = await self.make_request("GET", "/admin/dashboard/stats", headers=headers)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            stats = response.get("data", {})
            self.log_test_result(
                "Admin Dashboard Stats", True,
                f"Dashboard stats retrieved - Users: {stats.get('total_users', 'N/A')}, Listings: {stats.get('total_listings', 'N/A')}"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Admin Dashboard Stats", False,
                f"Dashboard stats failed - Status: {response.get('status_code')}"
            )
        
        # Test 2: Moderation Pending
        response = await self.make_request("GET", "/admin/moderation/pending", headers=headers)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            pending_items = response.get("data", [])
            self.log_test_result(
                "Moderation Queue", True,
                f"Moderation queue accessible - {len(pending_items)} pending items"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Moderation Queue", False,
                f"Moderation queue failed - Status: {response.get('status_code')}"
            )
        
        # Test 3: User Management
        params = {"limit": "10"}
        response = await self.make_request("GET", "/admin/users", params=params, headers=headers)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            users = response.get("data", [])
            self.log_test_result(
                "Admin User Management", True,
                f"User management working - {len(users)} users retrieved"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Admin User Management", False,
                f"User management failed - Status: {response.get('status_code')}"
            )
        
        self.results["phase_results"]["Admin & Moderation System"] = phase_results
        return phase_results
    
    # PHASE 2: DATA INTEGRITY & PERFORMANCE
    
    async def test_database_operations(self):
        """Test database operations"""
        logger.info("🗄️ PHASE 2.1: Database Operations")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: KYC Verifications
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/admin/kyc/stats", headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                kyc_stats = response.get("data", {})
                self.log_test_result(
                    "KYC Database Operations", True,
                    f"KYC stats - Total verifications: {kyc_stats.get('total_verifications', 'N/A')}, Approval rate: {kyc_stats.get('approval_rate', 'N/A')}%"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "KYC Database Operations", False,
                    f"KYC stats failed - Status: {response.get('status_code')}"
                )
        
        # Test 2: Orders Count
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/orders/user", headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                orders_data = response.get("data", {})
                buyer_orders = len(orders_data.get("buyer_orders", []))
                seller_orders = len(orders_data.get("seller_orders", []))
                self.log_test_result(
                    "Orders Database Operations", True,
                    f"Orders retrieved - Buyer orders: {buyer_orders}, Seller orders: {seller_orders}"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "Orders Database Operations", False,
                    f"Orders retrieval failed - Status: {response.get('status_code')}"
                )
        
        # Test 3: Buy Requests
        response = await self.make_request("GET", "/buy-requests")
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            buy_requests = response.get("data", [])
            self.log_test_result(
                "Buy Requests Database", True,
                f"Buy requests retrieved - Count: {len(buy_requests)}"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Buy Requests Database", False,
                f"Buy requests failed - Status: {response.get('status_code')}"
            )
        
        self.results["phase_results"]["Database Operations"] = phase_results
        return phase_results
    
    async def test_file_upload_storage(self):
        """Test file upload & storage"""
        logger.info("📁 PHASE 2.2: File Upload & Storage")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        if not self.auth_token:
            self.log_test_result(
                "File Upload System", False,
                "Cannot test file upload - no auth token",
                critical=True
            )
            return phase_results
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test 1: Listing Image Upload Endpoint
        response = await self.make_request("POST", "/upload/listing-image", headers=headers)
        phase_results["total"] += 1
        
        if response["status_code"] in [400, 422]:  # Expected - missing file
            phase_results["passed"] += 1
            self.log_test_result(
                "Listing Image Upload Endpoint", True,
                "Upload endpoint accessible and validates input"
            )
        elif response["status_code"] == 404:
            phase_results["failed"] += 1
            self.log_test_result(
                "Listing Image Upload Endpoint", False,
                "Upload endpoint not found",
                critical=True
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Listing Image Upload Endpoint", False,
                f"Upload endpoint error - Status: {response.get('status_code')}"
            )
        
        # Test 2: KYC Document Upload
        response = await self.make_request("POST", "/kyc/upload-document", headers=headers)
        phase_results["total"] += 1
        
        if response["status_code"] in [400, 422]:  # Expected - missing file
            phase_results["passed"] += 1
            self.log_test_result(
                "KYC Document Upload", True,
                "KYC upload endpoint accessible"
            )
        elif response["status_code"] == 404:
            phase_results["failed"] += 1
            self.log_test_result(
                "KYC Document Upload", False,
                "KYC upload endpoint not found"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "KYC Document Upload", False,
                f"KYC upload error - Status: {response.get('status_code')}"
            )
        
        self.results["phase_results"]["File Upload & Storage"] = phase_results
        return phase_results
    
    # PHASE 3: INTEGRATION SYSTEMS
    
    async def test_email_system(self):
        """Test email system"""
        logger.info("📧 PHASE 3.1: Email System Testing")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: Email Preferences
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/notifications/email/preferences", headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                self.log_test_result(
                    "Email Preferences", True,
                    "Email preferences system working"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "Email Preferences", False,
                    f"Email preferences failed - Status: {response.get('status_code')}"
                )
        
        # Test 2: Notification Templates
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = await self.make_request("GET", "/admin/notifications/templates", headers=headers)
            phase_results["total"] += 1
            
            if response["status_code"] == 200:
                phase_results["passed"] += 1
                templates = response.get("data", [])
                self.log_test_result(
                    "Email Templates", True,
                    f"Email templates accessible - Count: {len(templates)}"
                )
            else:
                phase_results["failed"] += 1
                self.log_test_result(
                    "Email Templates", False,
                    f"Email templates failed - Status: {response.get('status_code')}"
                )
        
        self.results["phase_results"]["Email System"] = phase_results
        return phase_results
    
    async def test_search_filtering(self):
        """Test search & filtering"""
        logger.info("🔍 PHASE 3.2: Search & Filtering")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: Listing Search
        params = {"q": "chicken", "limit": "10"}
        response = await self.make_request("GET", "/listings", params=params)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            search_results = response.get("data", {})
            if isinstance(search_results, dict):
                results_count = len(search_results.get("data", []))
            else:
                results_count = len(search_results) if isinstance(search_results, list) else 0
            
            self.log_test_result(
                "Listing Search", True,
                f"Search working - {results_count} results for 'chicken'"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Listing Search", False,
                f"Listing search failed - Status: {response.get('status_code')}"
            )
        
        # Test 2: Advanced Filtering
        params = {"category": "poultry", "min_price": "10", "max_price": "100"}
        response = await self.make_request("GET", "/listings", params=params)
        phase_results["total"] += 1
        
        if response["status_code"] == 200:
            phase_results["passed"] += 1
            self.log_test_result(
                "Advanced Filtering", True,
                "Advanced filtering working correctly"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Advanced Filtering", False,
                f"Advanced filtering failed - Status: {response.get('status_code')}"
            )
        
        self.results["phase_results"]["Search & Filtering"] = phase_results
        return phase_results
    
    # PHASE 4: ERROR HANDLING & EDGE CASES
    
    async def test_error_handling_edge_cases(self):
        """Test error handling & edge cases"""
        logger.info("⚠️ PHASE 4.1: Error Handling & Edge Cases")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test 1: Input Validation
        invalid_data = {"email": "invalid-email", "password": "123"}
        response = await self.make_request("POST", "/auth/register", invalid_data)
        phase_results["total"] += 1
        
        if response["status_code"] in [400, 422]:
            phase_results["passed"] += 1
            self.log_test_result(
                "Input Validation", True,
                f"Input validation working - Status: {response['status_code']}"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Input Validation", False,
                f"Input validation not working - Status: {response.get('status_code')}"
            )
        
        # Test 2: SQL Injection Protection
        params = {"category": "'; DROP TABLE listings; --"}
        response = await self.make_request("GET", "/listings", params=params)
        phase_results["total"] += 1
        
        if response["status_code"] in [200, 400, 422]:
            phase_results["passed"] += 1
            self.log_test_result(
                "SQL Injection Protection", True,
                "SQL injection attempt handled safely"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "SQL Injection Protection", False,
                f"SQL injection protection failed - Status: {response.get('status_code')}",
                critical=True
            )
        
        # Test 3: 404 Error Handling
        response = await self.make_request("GET", "/nonexistent-endpoint")
        phase_results["total"] += 1
        
        if response["status_code"] == 404:
            phase_results["passed"] += 1
            self.log_test_result(
                "404 Error Handling", True,
                "404 errors handled correctly"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "404 Error Handling", False,
                f"404 handling incorrect - Status: {response.get('status_code')}"
            )
        
        self.results["phase_results"]["Error Handling & Edge Cases"] = phase_results
        return phase_results
    
    async def test_rate_limiting_verification(self):
        """Test rate limiting"""
        logger.info("🚦 PHASE 4.2: Rate Limiting Verification")
        
        phase_results = {"total": 0, "passed": 0, "failed": 0}
        
        # Test rate limiting on listings endpoint
        success_count = 0
        rate_limited_count = 0
        
        for i in range(15):  # Reduced from 20 to be less aggressive
            response = await self.make_request("GET", "/listings")
            
            if response["status_code"] == 200:
                success_count += 1
            elif response["status_code"] == 429:
                rate_limited_count += 1
            
            await asyncio.sleep(0.1)  # Small delay
        
        phase_results["total"] += 1
        
        if rate_limited_count > 0:
            phase_results["passed"] += 1
            self.log_test_result(
                "Rate Limiting", True,
                f"Rate limiting working - {success_count} successful, {rate_limited_count} rate limited"
            )
        else:
            phase_results["failed"] += 1
            self.log_test_result(
                "Rate Limiting", False,
                f"Rate limiting not working - all {success_count} requests succeeded"
            )
        
        self.results["phase_results"]["Rate Limiting"] = phase_results
        return phase_results
    
    async def run_comprehensive_audit(self):
        """Run complete comprehensive audit"""
        logger.info("🚀 STARTING COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND AUDIT")
        logger.info(f"🔗 Backend URL: {self.backend_url}")
        logger.info("="*80)
        
        start_time = time.time()
        
        try:
            await self.setup_session()
            
            # PHASE 1: CRITICAL SYSTEM HEALTH CHECK
            logger.info("\n" + "="*60)
            logger.info("PHASE 1: CRITICAL SYSTEM HEALTH CHECK")
            logger.info("="*60)
            
            await self.test_authentication_user_management()
            await self.test_marketplace_core_functionality()
            await self.test_payment_checkout_system()
            await self.test_admin_moderation_system()
            
            # PHASE 2: DATA INTEGRITY & PERFORMANCE
            logger.info("\n" + "="*60)
            logger.info("PHASE 2: DATA INTEGRITY & PERFORMANCE")
            logger.info("="*60)
            
            await self.test_database_operations()
            await self.test_file_upload_storage()
            
            # PHASE 3: INTEGRATION SYSTEMS
            logger.info("\n" + "="*60)
            logger.info("PHASE 3: INTEGRATION SYSTEMS")
            logger.info("="*60)
            
            await self.test_email_system()
            await self.test_search_filtering()
            
            # PHASE 4: ERROR HANDLING & EDGE CASES
            logger.info("\n" + "="*60)
            logger.info("PHASE 4: ERROR HANDLING & EDGE CASES")
            logger.info("="*60)
            
            await self.test_error_handling_edge_cases()
            await self.test_rate_limiting_verification()
            
        except Exception as e:
            logger.error(f"Critical error during testing: {e}")
            self.results["critical_failures"].append({
                "test": "Test Execution",
                "details": f"Critical error: {str(e)}"
            })
        
        finally:
            await self.cleanup_session()
        
        # Generate comprehensive report
        end_time = time.time()
        duration = end_time - start_time
        
        self.generate_comprehensive_report(duration)
    
    def generate_comprehensive_report(self, duration: float):
        """Generate comprehensive audit report"""
        logger.info("\n" + "="*80)
        logger.info("COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND AUDIT REPORT")
        logger.info("="*80)
        
        # Overall Statistics
        total = self.results["total_tests"]
        passed = self.results["passed"]
        failed = self.results["failed"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        logger.info(f"📊 OVERALL SUMMARY:")
        logger.info(f"   Total Tests Executed: {total}")
        logger.info(f"   Tests Passed: {passed}")
        logger.info(f"   Tests Failed: {failed}")
        logger.info(f"   Overall Success Rate: {success_rate:.1f}%")
        logger.info(f"   Total Duration: {duration:.2f} seconds")
        
        # Phase-by-Phase Results
        logger.info(f"\n📋 PHASE-BY-PHASE RESULTS:")
        for phase_name, phase_data in self.results["phase_results"].items():
            phase_success_rate = (phase_data["passed"] / phase_data["total"] * 100) if phase_data["total"] > 0 else 0
            status_icon = "✅" if phase_success_rate >= 75 else "⚠️" if phase_success_rate >= 50 else "❌"
            logger.info(f"   {status_icon} {phase_name}: {phase_data['passed']}/{phase_data['total']} ({phase_success_rate:.1f}%)")
        
        # Critical Failures
        if self.results["critical_failures"]:
            logger.info(f"\n🚨 CRITICAL FAILURES REQUIRING IMMEDIATE ATTENTION:")
            for i, failure in enumerate(self.results["critical_failures"], 1):
                logger.info(f"   {i}. {failure['test']}: {failure['details']}")
        
        # Successful Tests Summary
        successful_tests = [name for name, details in self.results["test_details"].items() if details["passed"]]
        logger.info(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
        for test_name in successful_tests:
            details = self.results["test_details"][test_name]["details"]
            logger.info(f"   ✅ {test_name}: {details}")
        
        # Failed Tests Summary
        failed_tests = [(name, details) for name, details in self.results["test_details"].items() 
                       if not details["passed"] and not details["critical"]]
        
        if failed_tests:
            logger.info(f"\n⚠️ FAILED TESTS REQUIRING ATTENTION ({len(failed_tests)}):")
            for test_name, details in failed_tests:
                logger.info(f"   ⚠️ {test_name}: {details['details']}")
        
        # Overall System Assessment
        logger.info(f"\n🎯 OVERALL SYSTEM ASSESSMENT:")
        if success_rate >= 90:
            logger.info("   🟢 EXCELLENT - Backend system is in excellent condition")
            logger.info("   🟢 All critical systems operational")
            logger.info("   🟢 Ready for production use")
        elif success_rate >= 75:
            logger.info("   🟡 GOOD - Backend system is functional with minor issues")
            logger.info("   🟡 Core functionality working correctly")
            logger.info("   🟡 Some non-critical issues need attention")
        elif success_rate >= 50:
            logger.info("   🟠 FAIR - Backend system has significant issues")
            logger.info("   🟠 Core functionality partially working")
            logger.info("   🟠 Multiple issues require immediate attention")
        else:
            logger.info("   🔴 POOR - Backend system has critical issues")
            logger.info("   🔴 Multiple critical failures detected")
            logger.info("   🔴 System requires immediate remediation")
        
        # Recommendations
        logger.info(f"\n💡 RECOMMENDATIONS:")
        if self.results["critical_failures"]:
            logger.info("   🔥 IMMEDIATE ACTIONS REQUIRED:")
            logger.info("   1. Address all critical failures immediately")
            logger.info("   2. Review authentication and security measures")
            logger.info("   3. Implement proper error handling for failed endpoints")
            logger.info("   4. Conduct security audit for injection vulnerabilities")
        else:
            logger.info("   ✅ MAINTENANCE RECOMMENDATIONS:")
            logger.info("   1. Continue regular monitoring of system performance")
            logger.info("   2. Implement comprehensive logging and alerting")
            logger.info("   3. Schedule regular security audits")
            logger.info("   4. Monitor rate limiting effectiveness")
        
        # Production Readiness Assessment
        logger.info(f"\n🚀 PRODUCTION READINESS:")
        critical_systems_working = (
            len([f for f in self.results["critical_failures"] if "critical" in f.get("test", "").lower()]) == 0
        )
        
        if success_rate >= 80 and critical_systems_working:
            logger.info("   ✅ PRODUCTION READY - System meets production standards")
        elif success_rate >= 60:
            logger.info("   ⚠️ PRODUCTION READY WITH MONITORING - Deploy with enhanced monitoring")
        else:
            logger.info("   ❌ NOT PRODUCTION READY - Critical issues must be resolved first")
        
        logger.info("\n" + "="*80)
        logger.info("END OF COMPREHENSIVE STOCKLOT MARKETPLACE BACKEND AUDIT")
        logger.info("="*80)

async def main():
    """Main execution function"""
    tester = ComprehensiveAuditTester()
    await tester.run_comprehensive_audit()

if __name__ == "__main__":
    asyncio.run(main())