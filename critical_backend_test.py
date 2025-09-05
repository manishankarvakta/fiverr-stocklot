#!/usr/bin/env python3
"""
Critical Backend Testing for StockLot - Focus on Review Request Issues
Testing the specific functionality mentioned in the review request.
"""

import requests
import sys
import json
import time
from datetime import datetime

class CriticalAPITester:
    def __init__(self, base_url="https://stocklot-repair.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials
        self.test_user_email = f"testuser_{int(time.time())}@test.com"
        self.admin_email = "admin@stocklot.co.za"
        self.admin_password = "admin123"

    def log_test(self, test_name: str, success: bool, details: str = "", error: str = ""):
        """Log test results with clear formatting"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} - {test_name}")
        
        if details:
            print(f"   📋 {details}")
        
        if not success:
            self.failed_tests.append({
                "test": test_name,
                "error": error,
                "details": details
            })
            if error:
                print(f"   🚨 {error}")
        else:
            self.tests_passed += 1

    def make_request(self, method: str, endpoint: str, data: dict = None, use_admin: bool = False) -> tuple:
        """Make API request with proper error handling"""
        url = f"{self.api_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        # Add auth token
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=15)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=15)
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return response.status_code, response_data
            
        except requests.exceptions.Timeout:
            return 408, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return 503, {"error": "Connection error"}
        except Exception as e:
            return 500, {"error": str(e)}

    def test_1_authentication_flow(self):
        """Test 1: Authentication & Admin Issues"""
        print("\n" + "="*50)
        print("🔐 TEST 1: AUTHENTICATION & ADMIN ISSUES")
        print("="*50)
        
        # Test user registration
        user_data = {
            "email": self.test_user_email,
            "password": "TestPass123!",
            "full_name": "Test User",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        status, response = self.make_request("POST", "/auth/register", user_data)
        self.log_test(
            "User Registration",
            status == 200,
            f"Registered: {self.test_user_email}" if status == 200 else "",
            f"Status {status}: {response.get('detail', 'Registration failed')}" if status != 200 else ""
        )
        
        # Test user login
        login_data = {"email": self.test_user_email, "password": "TestPass123!"}
        status, response = self.make_request("POST", "/auth/login", login_data)
        
        if status == 200 and "access_token" in response:
            self.token = response["access_token"]
        
        self.log_test(
            "User Login",
            status == 200 and self.token is not None,
            f"Token received: {bool(self.token)}" if status == 200 else "",
            f"Status {status}: {response.get('detail', 'Login failed')}" if status != 200 else ""
        )
        
        # Test admin login
        admin_login = {"email": self.admin_email, "password": self.admin_password}
        status, response = self.make_request("POST", "/auth/login", admin_login)
        
        if status == 200 and "access_token" in response:
            self.admin_token = response["access_token"]
        
        self.log_test(
            "Admin Login",
            status == 200 and self.admin_token is not None,
            f"Admin token received: {bool(self.admin_token)}" if status == 200 else "",
            f"Status {status}: {response.get('detail', 'Admin login failed')}" if status != 200 else ""
        )

    def test_2_ecommerce_flow(self):
        """Test 2: E-commerce Flow Testing"""
        print("\n" + "="*50)
        print("🛒 TEST 2: E-COMMERCE FLOW TESTING")
        print("="*50)
        
        if not self.token:
            self.log_test("E-commerce Flow", False, "", "No user token - skipping e-commerce tests")
            return
        
        # Test Get Cart
        status, response = self.make_request("GET", "/cart")
        self.log_test(
            "Get Shopping Cart",
            status == 200 and "items" in response,
            f"Cart items: {len(response.get('items', []))}" if status == 200 else "",
            f"Status {status}: {response.get('detail', 'Cart fetch failed')}" if status != 200 else ""
        )
        
        # Get a listing to add to cart
        status, listings_response = self.make_request("GET", "/listings")
        if status != 200 or not listings_response.get("data"):
            self.log_test("Add to Cart", False, "", "No listings available")
            return
        
        listing = listings_response["data"][0]
        
        # Test Add to Cart
        cart_item = {
            "listing_id": listing["id"],
            "quantity": 1,
            "shipping_option": "standard"
        }
        
        status, response = self.make_request("POST", "/cart/add", cart_item)
        self.log_test(
            "Add to Cart",
            status == 200,
            f"Added listing to cart" if status == 200 else "",
            f"Status {status}: {response.get('detail', 'Add to cart failed')}" if status != 200 else ""
        )
        
        # Test Checkout Create
        checkout_data = {
            "shipping_address": {
                "line1": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8000"
            },
            "payment_method": "card"
        }
        
        status, response = self.make_request("POST", "/checkout/create", checkout_data)
        checkout_session_id = response.get("checkout_session_id") if status == 200 else None
        
        self.log_test(
            "Create Checkout Session",
            status == 200 and checkout_session_id is not None,
            f"Session ID: {checkout_session_id[:8]}..." if checkout_session_id else "",
            f"Status {status}: {response.get('detail', 'Checkout creation failed')}" if status != 200 else ""
        )
        
        # Test Checkout Complete (if session created)
        if checkout_session_id:
            payment_data = {"payment_method": "card", "payment_reference": f"test_{int(time.time())}"}
            status, response = self.make_request("POST", f"/checkout/{checkout_session_id}/complete", payment_data)
            
            self.log_test(
                "Complete Checkout",
                status == 200,
                f"Orders created: {len(response.get('orders', []))}" if status == 200 else "",
                f"Status {status}: {response.get('detail', 'Checkout completion failed')}" if status != 200 else ""
            )

    def test_3_api_endpoints(self):
        """Test 3: API Endpoint Functionality"""
        print("\n" + "="*50)
        print("🔌 TEST 3: API ENDPOINT FUNCTIONALITY")
        print("="*50)
        
        # Test critical API endpoints
        endpoints = [
            ("GET", "/listings", "Marketplace Listings"),
            ("GET", "/category-groups", "Category Groups"),
            ("GET", "/species", "Species Data"),
            ("GET", "/product-types", "Product Types"),
        ]
        
        for method, endpoint, name in endpoints:
            status, response = self.make_request(method, endpoint)
            has_data = status == 200 and (
                isinstance(response.get("data"), list) or 
                isinstance(response.get("items"), list) or
                "total" in response
            )
            
            self.log_test(
                f"{name} API",
                has_data,
                f"Data available: {len(response.get('data', response.get('items', [])))}" if has_data else "",
                f"Status {status}: {response.get('detail', f'{name} API failed')}" if not has_data else ""
            )
        
        # Test user-specific endpoints (if logged in)
        if self.token:
            user_endpoints = [
                ("GET", "/orders/user", "User Orders"),
            ]
            
            for method, endpoint, name in user_endpoints:
                status, response = self.make_request(method, endpoint)
                self.log_test(
                    f"{name} API",
                    status == 200,
                    f"Response received" if status == 200 else "",
                    f"Status {status}: {response.get('detail', f'{name} API failed')}" if status != 200 else ""
                )

    def test_4_faq_chatbot(self):
        """Test 4: FAQ Chatbot Testing"""
        print("\n" + "="*50)
        print("🤖 TEST 4: FAQ CHATBOT TESTING")
        print("="*50)
        
        # Test FAQ chatbot
        chat_data = {"question": "How do I buy livestock on StockLot?"}
        status, response = self.make_request("POST", "/faq/chat", chat_data)
        
        has_response = status == 200 and "response" in response and response["response"]
        
        self.log_test(
            "FAQ Chatbot Response",
            has_response,
            f"Response source: {response.get('source', 'unknown')}, Length: {len(response.get('response', ''))}" if has_response else "",
            f"Status {status}: {response.get('detail', 'Chatbot failed')}" if not has_response else ""
        )
        
        # Test AI integration status
        if has_response:
            source = response.get("source", "unknown")
            if source == "ai":
                self.log_test("OpenAI Integration", True, "AI responding properly")
            elif source == "fallback":
                self.log_test("OpenAI Integration", False, "", "Using fallback responses - AI may be down")
            elif source == "error":
                self.log_test("OpenAI Integration", False, "", "AI service error")

    def test_5_admin_dashboard(self):
        """Test 5: Admin Dashboard Components"""
        print("\n" + "="*50)
        print("👑 TEST 5: ADMIN DASHBOARD COMPONENTS")
        print("="*50)
        
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "", "No admin token - cannot test admin functionality")
            return
        
        # Test admin endpoints
        admin_endpoints = [
            ("GET", "/admin/stats", "Admin Statistics"),
            ("GET", "/admin/users", "User Management"),
            ("GET", "/admin/orders", "Order Management"),
        ]
        
        for method, endpoint, name in admin_endpoints:
            status, response = self.make_request(method, endpoint, use_admin=True)
            self.log_test(
                f"{name}",
                status == 200,
                f"Data available" if status == 200 else "",
                f"Status {status}: {response.get('detail', f'{name} failed')}" if status != 200 else ""
            )

    def test_6_image_upload(self):
        """Test 6: Image Upload & Media"""
        print("\n" + "="*50)
        print("📸 TEST 6: IMAGE UPLOAD & MEDIA")
        print("="*50)
        
        if not self.token:
            self.log_test("Image Upload", False, "", "No user token - cannot test image upload")
            return
        
        # Test image upload endpoint (without actual file)
        status, response = self.make_request("POST", "/upload/livestock-image?listing_id=test&image_type=primary")
        
        # We expect this to fail due to missing file, but endpoint should exist
        endpoint_exists = status != 404
        
        self.log_test(
            "Image Upload Endpoint",
            endpoint_exists,
            f"Endpoint accessible (expected file error)" if endpoint_exists else "",
            f"Status {status}: Endpoint not found" if not endpoint_exists else ""
        )

    def run_all_tests(self):
        """Run all critical tests"""
        print("🚀 STARTING CRITICAL STOCKLOT BACKEND TESTING")
        print(f"📍 Testing: {self.base_url}")
        print("🎯 Focus: Review Request Critical Issues")
        
        # Run all test suites
        self.test_1_authentication_flow()
        self.test_2_ecommerce_flow()
        self.test_3_api_endpoints()
        self.test_4_faq_chatbot()
        self.test_5_admin_dashboard()
        self.test_6_image_upload()
        
        # Generate final report
        self.generate_final_report()

    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "="*60)
        print("📊 CRITICAL BACKEND TEST REPORT")
        print("="*60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run} ({success_rate:.1f}%)")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {failure['test']}")
                if failure['error']:
                    print(f"   🚨 {failure['error']}")
                if failure['details']:
                    print(f"   📋 {failure['details']}")
        
        # Critical assessment
        print(f"\n🎯 CRITICAL ASSESSMENT:")
        
        critical_issues = []
        for failure in self.failed_tests:
            if any(keyword in failure['test'].lower() for keyword in 
                   ['login', 'cart', 'checkout', 'admin', 'chatbot']):
                critical_issues.append(failure['test'])
        
        if critical_issues:
            print(f"   🔴 CRITICAL ISSUES ({len(critical_issues)}):")
            for issue in critical_issues:
                print(f"      • {issue}")
        
        if success_rate >= 80:
            print("   🟢 OVERALL: Most core functionality working")
        elif success_rate >= 60:
            print("   🟡 OVERALL: Some important features broken")
        else:
            print("   🔴 OVERALL: Major functionality issues")
        
        return success_rate >= 70

def main():
    """Main execution"""
    tester = CriticalAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted")
        return 1
    except Exception as e:
        print(f"\n\n💥 Test error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())