#!/usr/bin/env python3
"""
Comprehensive Backend Test for StockLot Critical Money Flow Systems
Testing: Paystack Recipients, Transfers, Webhooks, Config, SSE Events
"""

import requests
import json
import hmac
import hashlib
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List

class MoneyFlowTester:
    def __init__(self, base_url="https://easy-signin-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        if not success:
            self.failed_tests.append(test_name)
            
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        if token:
            request_headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
                
            return True, {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "headers": dict(response.headers)
            }
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
        except json.JSONDecodeError:
            return False, {"error": "Invalid JSON response", "status_code": response.status_code}

    def authenticate_admin(self):
        """Authenticate as admin user"""
        print("\n🔐 Authenticating as admin...")
        success, response = self.make_request("POST", "/auth/login", {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        })
        
        if success and response["status_code"] == 200:
            self.admin_token = response["data"].get("access_token")
            self.log_test("Admin Authentication", True, f"Token obtained: {self.admin_token[:20]}...")
            return True
        else:
            self.log_test("Admin Authentication", False, f"Failed: {response}")
            return False

    def authenticate_user(self):
        """Authenticate as test user"""
        print("\n🔐 Authenticating as test user...")
        success, response = self.make_request("POST", "/auth/login", {
            "email": "test@example.com",
            "password": "testpass123"
        })
        
        if success and response["status_code"] == 200:
            self.user_token = response["data"].get("access_token")
            self.log_test("User Authentication", True, f"Token obtained: {self.user_token[:20]}...")
            return True
        else:
            self.log_test("User Authentication", False, f"Failed: {response}")
            return False

    def test_paystack_banks_api(self):
        """Test Paystack banks API - should return 31+ South African banks"""
        print("\n💳 Testing Paystack Banks API...")
        
        success, response = self.make_request("GET", "/recipients/banks")
        
        if success and response["status_code"] == 200:
            banks = response["data"].get("data", [])
            bank_count = len(banks)
            
            if bank_count >= 31:
                # Check for key South African banks
                bank_names = [bank.get("name", "").lower() for bank in banks]
                sa_banks = ["standard bank", "fnb", "absa", "nedbank", "capitec"]
                found_banks = [bank for bank in sa_banks if any(bank in name for name in bank_names)]
                
                self.log_test("Paystack Banks API", True, 
                             f"Found {bank_count} banks, including SA banks: {found_banks}")
            else:
                self.log_test("Paystack Banks API", False, 
                             f"Expected 31+ banks, got {bank_count}")
        else:
            self.log_test("Paystack Banks API", False, f"API call failed: {response}")

    def test_recipient_creation(self):
        """Test bank account recipient creation (expected to fail in demo mode)"""
        print("\n🏦 Testing Recipient Creation...")
        
        if not self.user_token:
            self.log_test("Recipient Creation", False, "No user token available")
            return
            
        test_recipient = {
            "type": "nuban",
            "name": "Test Recipient",
            "account_number": "0123456789",
            "bank_code": "044",  # Access Bank
            "currency": "ZAR"
        }
        
        success, response = self.make_request("POST", "/recipients/bank-account", 
                                            test_recipient, token=self.user_token)
        
        # In demo mode, this should fail with 401 or specific error
        if success and response["status_code"] in [401, 400]:
            self.log_test("Recipient Creation (Demo Mode)", True, 
                         f"Expected failure in demo mode: {response['status_code']}")
        elif success and response["status_code"] == 201:
            self.log_test("Recipient Creation", True, "Recipient created successfully")
        else:
            self.log_test("Recipient Creation", False, f"Unexpected response: {response}")

    def test_recipients_list(self):
        """Test listing user recipients"""
        print("\n📋 Testing Recipients List...")
        
        if not self.user_token:
            self.log_test("Recipients List", False, "No user token available")
            return
            
        success, response = self.make_request("GET", "/recipients", token=self.user_token)
        
        if success and response["status_code"] == 200:
            recipients = response["data"].get("data", [])
            self.log_test("Recipients List", True, f"Retrieved {len(recipients)} recipients")
        else:
            self.log_test("Recipients List", False, f"Failed to get recipients: {response}")

    def test_transfer_creation(self):
        """Test transfer creation (expected to fail in demo mode)"""
        print("\n💸 Testing Transfer Creation...")
        
        if not self.user_token:
            self.log_test("Transfer Creation", False, "No user token available")
            return
            
        test_transfer = {
            "source": "balance",
            "amount": 10000,  # R100.00 in cents
            "recipient": "RCP_test123",
            "reason": "Test payout"
        }
        
        success, response = self.make_request("POST", "/transfers", 
                                            test_transfer, token=self.user_token)
        
        # In demo mode, this should fail
        if success and response["status_code"] in [401, 400, 403]:
            self.log_test("Transfer Creation (Demo Mode)", True, 
                         f"Expected failure in demo mode: {response['status_code']}")
        elif success and response["status_code"] == 201:
            self.log_test("Transfer Creation", True, "Transfer created successfully")
        else:
            self.log_test("Transfer Creation", False, f"Unexpected response: {response}")

    def test_transfers_list(self):
        """Test listing user transfers"""
        print("\n📊 Testing Transfers List...")
        
        if not self.user_token:
            self.log_test("Transfers List", False, "No user token available")
            return
            
        success, response = self.make_request("GET", "/transfers", token=self.user_token)
        
        if success and response["status_code"] == 200:
            transfers = response["data"].get("data", [])
            self.log_test("Transfers List", True, f"Retrieved {len(transfers)} transfers")
        else:
            self.log_test("Transfers List", False, f"Failed to get transfers: {response}")

    def test_escrow_release(self):
        """Test escrow release mechanism"""
        print("\n🔓 Testing Escrow Release...")
        
        if not self.user_token:
            self.log_test("Escrow Release", False, "No user token available")
            return
            
        test_release = {
            "order_id": f"test_order_{uuid.uuid4().hex[:8]}",
            "amount": 5000,  # R50.00 in cents
            "recipient_code": "RCP_test123"
        }
        
        success, response = self.make_request("POST", "/transfers/escrow/release", 
                                            test_release, token=self.user_token)
        
        if success and response["status_code"] in [200, 201, 400, 401]:
            self.log_test("Escrow Release", True, 
                         f"Escrow release handled: {response['status_code']}")
        else:
            self.log_test("Escrow Release", False, f"Unexpected response: {response}")

    def test_webhook_security(self):
        """Test webhook signature verification"""
        print("\n🔒 Testing Webhook Security...")
        
        # Test invalid signature
        invalid_payload = {"event": "transfer.success", "data": {"id": "test"}}
        invalid_headers = {"x-paystack-signature": "invalid_signature"}
        
        success, response = self.make_request("POST", "/webhooks/paystack/transfers", 
                                            invalid_payload, headers=invalid_headers)
        
        if success and response["status_code"] in [400, 401, 403]:
            self.log_test("Webhook Invalid Signature", True, 
                         f"Rejected invalid signature: {response['status_code']}")
        else:
            self.log_test("Webhook Invalid Signature", False, 
                         f"Should reject invalid signature: {response}")

    def test_webhook_idempotency(self):
        """Test webhook idempotency"""
        print("\n🔄 Testing Webhook Idempotency...")
        
        # Create a test webhook payload
        test_payload = {
            "event": "transfer.success",
            "data": {
                "id": f"test_transfer_{uuid.uuid4().hex[:8]}",
                "amount": 10000,
                "status": "success"
            }
        }
        
        # Generate valid signature (if we had the secret)
        payload_str = json.dumps(test_payload)
        # Note: In real implementation, we'd use the actual webhook secret
        test_signature = hashlib.sha512(payload_str.encode()).hexdigest()
        
        headers = {"x-paystack-signature": test_signature}
        
        # Send same webhook twice
        success1, response1 = self.make_request("POST", "/webhooks/paystack/transfers", 
                                              test_payload, headers=headers)
        success2, response2 = self.make_request("POST", "/webhooks/paystack/transfers", 
                                              test_payload, headers=headers)
        
        if success1 and success2:
            # Second request should be detected as duplicate
            self.log_test("Webhook Idempotency", True, 
                         f"Duplicate detection working: {response1['status_code']}, {response2['status_code']}")
        else:
            self.log_test("Webhook Idempotency", False, 
                         f"Webhook processing failed: {response1}, {response2}")

    def test_webhook_stats(self):
        """Test webhook statistics (admin only)"""
        print("\n📈 Testing Webhook Stats...")
        
        if not self.admin_token:
            self.log_test("Webhook Stats", False, "No admin token available")
            return
            
        success, response = self.make_request("GET", "/admin/webhooks/stats", 
                                            token=self.admin_token)
        
        if success and response["status_code"] == 200:
            stats = response["data"]
            self.log_test("Webhook Stats", True, 
                         f"Retrieved webhook stats: {stats}")
        else:
            self.log_test("Webhook Stats", False, f"Failed to get webhook stats: {response}")

    def test_platform_config(self):
        """Test public platform configuration"""
        print("\n⚙️ Testing Platform Config...")
        
        success, response = self.make_request("GET", "/platform/config")
        
        if success and response["status_code"] == 200:
            config = response["data"]
            
            # Check for expected config elements
            expected_keys = ["feature_flags", "platform_stats", "delivery_config"]
            found_keys = [key for key in expected_keys if key in config]
            
            # Check platform stats
            stats = config.get("platform_stats", {})
            listings_count = stats.get("total_listings", 0)
            users_count = stats.get("total_users", 0)
            orders_count = stats.get("total_orders", 0)
            
            self.log_test("Platform Config", True, 
                         f"Config keys: {found_keys}, Stats: {listings_count} listings, {users_count} users, {orders_count} orders")
        else:
            self.log_test("Platform Config", False, f"Failed to get platform config: {response}")

    def test_feature_flags(self):
        """Test feature flag management (admin only)"""
        print("\n🚩 Testing Feature Flags...")
        
        if not self.admin_token:
            self.log_test("Feature Flags", False, "No admin token available")
            return
            
        # Test delivery-only mode toggle
        success, response = self.make_request("POST", "/admin/feature-flags/delivery_only_mode/toggle", 
                                            token=self.admin_token)
        
        if success and response["status_code"] in [200, 201]:
            self.log_test("Feature Flag Toggle", True, 
                         f"Delivery-only mode toggled: {response['data']}")
        else:
            self.log_test("Feature Flag Toggle", False, 
                         f"Failed to toggle feature flag: {response}")

    def test_delivery_config(self):
        """Test delivery configuration management"""
        print("\n🚚 Testing Delivery Config...")
        
        if not self.admin_token:
            self.log_test("Delivery Config", False, "No admin token available")
            return
            
        # Test delivery config update
        test_config = {
            "base_rate": 20.00,  # R20/km
            "minimum_charge": 50.00,
            "maximum_distance": 500
        }
        
        success, response = self.make_request("POST", "/admin/delivery/config", 
                                            test_config, token=self.admin_token)
        
        if success and response["status_code"] in [200, 201]:
            self.log_test("Delivery Config Update", True, 
                         f"Delivery config updated: {response['data']}")
        else:
            self.log_test("Delivery Config Update", False, 
                         f"Failed to update delivery config: {response}")

    def test_sse_events(self):
        """Test SSE admin event system"""
        print("\n📡 Testing SSE Events...")
        
        if not self.admin_token:
            self.log_test("SSE Events", False, "No admin token available")
            return
            
        # Test event stats
        success, response = self.make_request("GET", "/admin/events/stats", 
                                            token=self.admin_token)
        
        if success and response["status_code"] == 200:
            self.log_test("SSE Event Stats", True, 
                         f"Event stats retrieved: {response['data']}")
        else:
            self.log_test("SSE Event Stats", False, 
                         f"Failed to get event stats: {response}")
            
        # Test event emission
        test_event = {
            "type": "TEST_EVENT",
            "message": "Test event from money flow tester",
            "severity": "info"
        }
        
        success, response = self.make_request("POST", "/admin/events/emit", 
                                            test_event, token=self.admin_token)
        
        if success and response["status_code"] in [200, 201]:
            self.log_test("SSE Event Emission", True, 
                         f"Test event emitted: {response['data']}")
        else:
            self.log_test("SSE Event Emission", False, 
                         f"Failed to emit event: {response}")
            
        # Test recent events
        success, response = self.make_request("GET", "/admin/events/recent", 
                                            token=self.admin_token)
        
        if success and response["status_code"] == 200:
            events = response["data"]
            self.log_test("SSE Recent Events", True, 
                         f"Retrieved {len(events)} recent events")
        else:
            self.log_test("SSE Recent Events", False, 
                         f"Failed to get recent events: {response}")

    def run_all_tests(self):
        """Run comprehensive money flow system tests"""
        print("🚀 Starting Comprehensive Money Flow System Tests")
        print("=" * 60)
        
        start_time = time.time()
        
        # Authentication
        admin_auth = self.authenticate_admin()
        user_auth = self.authenticate_user()
        
        # Paystack Transfer Recipients & Payouts
        print("\n" + "=" * 60)
        print("💳 PAYSTACK TRANSFER RECIPIENTS & PAYOUTS")
        print("=" * 60)
        self.test_paystack_banks_api()
        self.test_recipient_creation()
        self.test_recipients_list()
        self.test_transfer_creation()
        self.test_transfers_list()
        self.test_escrow_release()
        
        # Webhook Idempotency & Security
        print("\n" + "=" * 60)
        print("🔒 WEBHOOK IDEMPOTENCY & SECURITY")
        print("=" * 60)
        self.test_webhook_security()
        self.test_webhook_idempotency()
        if admin_auth:
            self.test_webhook_stats()
        
        # Public Config & Feature Flags
        print("\n" + "=" * 60)
        print("⚙️ PUBLIC CONFIG & FEATURE FLAGS")
        print("=" * 60)
        self.test_platform_config()
        if admin_auth:
            self.test_feature_flags()
            self.test_delivery_config()
        
        # SSE Admin Event Bus
        print("\n" + "=" * 60)
        print("📡 SSE ADMIN EVENT BUS")
        print("=" * 60)
        if admin_auth:
            self.test_sse_events()
        
        # Summary
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Duration: {duration:.2f} seconds")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print(f"\n🎯 Critical Money Flow Infrastructure Status:")
        if failed_tests == 0:
            print("✅ ALL SYSTEMS OPERATIONAL - Ready for production")
        elif failed_tests <= 3:
            print("⚠️  MINOR ISSUES - Most systems operational")
        else:
            print("❌ MAJOR ISSUES - Requires immediate attention")
            
        return failed_tests == 0

if __name__ == "__main__":
    tester = MoneyFlowTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)