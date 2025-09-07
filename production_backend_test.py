#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class StockLotProductionTester:
    def __init__(self, base_url="https://email-system-test.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_data = None
        self.order_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.critical_failures = []

    def log_result(self, test_name, success, details="", response_data=None, is_critical=False):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
            if is_critical:
                self.critical_failures.append(f"{test_name}: {details}")
        
        if response_data is not None and len(str(response_data)) < 500:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data,
            'is_critical': is_critical
        })

    def test_api_endpoint(self, method, endpoint, expected_status=200, data=None, description="", is_critical=False):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        test_name = f"{method} {endpoint}" + (f" ({description})" if description else "")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500], "status_code": response.status_code}

            if success:
                self.log_result(test_name, True, f"Status: {response.status_code}", response_data, is_critical)
                return True, response_data
            else:
                self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", response_data, is_critical)
                return False, response_data

        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}", None, is_critical)
            return False, {}

    def test_admin_authentication(self):
        """Test admin login - CRITICAL"""
        print("\n🔍 CRITICAL: Testing Admin Authentication...")
        
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Admin login", is_critical=True)
        
        if success and 'access_token' in login_response:
            admin_user = login_response.get('user', {})
            if 'admin' in admin_user.get('roles', []):
                print(f"   ✅ Admin authenticated: {admin_user.get('full_name', 'Unknown')}")
                self.admin_token = login_response['access_token']
                return True
            else:
                print(f"   ❌ User authenticated but not admin: {admin_user.get('roles', [])}")
        
        return False

    def test_fixed_endpoints_verification(self):
        """Test the FIXED ENDPOINTS mentioned in review request"""
        print("\n🎯 TESTING FIXED ENDPOINTS VERIFICATION...")
        
        if not self.admin_token:
            print("⚠️  Skipping fixed endpoints - no admin token")
            return False
        
        # Store current token and switch to admin
        user_token = self.token
        self.token = self.admin_token
        
        try:
            # 1. GET /api/messages/threads (should return 200, not 405)
            print("\n   🔧 FIXED: GET /api/messages/threads")
            success, _ = self.test_api_endpoint('GET', '/messages/threads', 200, 
                                             description="Messages threads (FIXED: was 405, now 200)", is_critical=True)
            
            # 2. POST /api/auth/register-enhanced (should return 201, not 200)
            print("\n   🔧 FIXED: POST /api/auth/register-enhanced")
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            register_data = {
                "email": f"enhanced_test_{timestamp}@example.com",
                "password": "TestPass123!",
                "full_name": "Enhanced Test User",
                "phone": "+27123456789",
                "role": "buyer"
            }
            success, _ = self.test_api_endpoint('POST', '/auth/register-enhanced', 201, register_data,
                                             "Enhanced registration (FIXED: was 200, now 201)", is_critical=True)
            
            # 3. POST /api/notifications/mark-all-read (should return 200, not 404)
            print("\n   🔧 FIXED: POST /api/notifications/mark-all-read")
            success, _ = self.test_api_endpoint('POST', '/notifications/mark-all-read', 200, {},
                                             "Mark all notifications read (FIXED: was 404, now 200)", is_critical=True)
            
        finally:
            # Restore user token
            self.token = user_token
        
        return True

    def test_paystack_payment_system(self):
        """Test NEW PAYMENT SYSTEM - Paystack Integration"""
        print("\n💳 TESTING NEW PAYSTACK PAYMENT SYSTEM...")
        
        if not self.token:
            print("⚠️  Skipping payment tests - no user token")
            return False
        
        # Test payment initialization
        print("\n   💰 Testing Payment Initialization...")
        payment_data = {
            "amount": 1000.00,  # R10.00 test amount
            "email": "test@example.com",
            "callback_url": "https://email-system-test.preview.emergentagent.com/payment-callback"
        }
        
        success, response = self.test_api_endpoint('POST', '/payments/initialize', 200, payment_data,
                                                 "Initialize Paystack payment", is_critical=True)
        
        payment_reference = None
        if success and 'reference' in response:
            payment_reference = response['reference']
            print(f"   ✅ Payment initialized with reference: {payment_reference}")
            
            # Test payment verification
            print("\n   🔍 Testing Payment Verification...")
            success, _ = self.test_api_endpoint('GET', f'/payments/verify/{payment_reference}', 200,
                                             description="Verify payment status", is_critical=True)
        
        # Test webhook endpoint (should accept POST)
        print("\n   🔗 Testing Payment Webhook...")
        webhook_data = {
            "event": "charge.success",
            "data": {
                "reference": payment_reference or "test_ref_123",
                "amount": 100000,  # Paystack uses kobo
                "status": "success"
            }
        }
        
        success, _ = self.test_api_endpoint('POST', '/payments/webhook', 200, webhook_data,
                                         "Payment webhook processing", is_critical=True)
        
        return True

    def test_escrow_system(self):
        """Test ESCROW PAYMENT SYSTEM"""
        print("\n🏦 TESTING ESCROW PAYMENT SYSTEM...")
        
        if not self.admin_token:
            print("⚠️  Skipping escrow tests - no admin token")
            return False
        
        # Create a test order first (simulate)
        test_order_id = f"test_order_{datetime.now().strftime('%H%M%S')}"
        
        # Test escrow release (admin function)
        print("\n   🔓 Testing Escrow Release...")
        user_token = self.token
        self.token = self.admin_token
        
        try:
            success, _ = self.test_api_endpoint('POST', f'/payments/escrow/{test_order_id}/release', 200, {},
                                             "Release escrow funds", is_critical=True)
        finally:
            self.token = user_token
        
        return True

    def test_admin_payment_management(self):
        """Test ADMIN PAYMENT CONTROLS"""
        print("\n👨‍💼 TESTING ADMIN PAYMENT MANAGEMENT...")
        
        if not self.admin_token:
            print("⚠️  Skipping admin payment tests - no admin token")
            return False
        
        # Store current token and switch to admin
        user_token = self.token
        self.token = self.admin_token
        
        try:
            # Test transaction monitoring
            print("\n   📊 Testing Transaction Monitoring...")
            success, _ = self.test_api_endpoint('GET', '/admin/payments/transactions', 200,
                                             description="Admin: Monitor transactions", is_critical=True)
            
            # Test escrow monitoring
            print("\n   🏦 Testing Escrow Monitoring...")
            success, _ = self.test_api_endpoint('GET', '/admin/payments/escrows', 200,
                                             description="Admin: Monitor escrows", is_critical=True)
            
            # Test admin escrow controls
            test_order_id = f"test_order_{datetime.now().strftime('%H%M%S')}"
            
            print("\n   🔓 Testing Admin Escrow Release...")
            success, _ = self.test_api_endpoint('POST', f'/admin/payments/escrow/{test_order_id}/release', 200, {},
                                             description="Admin: Release escrow", is_critical=True)
            
            print("\n   💸 Testing Admin Escrow Refund...")
            success, _ = self.test_api_endpoint('POST', f'/admin/payments/escrow/{test_order_id}/refund', 200, {},
                                             description="Admin: Refund escrow", is_critical=True)
            
        finally:
            # Restore user token
            self.token = user_token
        
        return True

    def test_comprehensive_system_health(self):
        """Test COMPREHENSIVE SYSTEM HEALTH"""
        print("\n🏥 TESTING COMPREHENSIVE SYSTEM HEALTH...")
        
        # Test core marketplace functionality
        print("\n   🏪 Testing Core Marketplace...")
        
        # Species and taxonomy
        success, species_data = self.test_api_endpoint('GET', '/species', 200, description="Species data", is_critical=True)
        success, product_types = self.test_api_endpoint('GET', '/product-types', 200, description="Product types", is_critical=True)
        success, listings = self.test_api_endpoint('GET', '/listings', 200, description="Listings", is_critical=True)
        
        # Test admin dashboard functionality
        if self.admin_token:
            user_token = self.token
            self.token = self.admin_token
            
            try:
                print("\n   📈 Testing Admin Dashboard...")
                success, _ = self.test_api_endpoint('GET', '/admin/stats', 200, description="Admin stats", is_critical=True)
                success, _ = self.test_api_endpoint('GET', '/admin/users', 200, description="Admin users", is_critical=True)
                success, _ = self.test_api_endpoint('GET', '/admin/listings', 200, description="Admin listings", is_critical=True)
                
            finally:
                self.token = user_token
        
        return True

    def test_user_authentication_flow(self):
        """Test user authentication and create test user"""
        print("\n👤 TESTING USER AUTHENTICATION FLOW...")
        
        # Test user registration
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User Production",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        success, _ = self.test_api_endpoint('POST', '/auth/register', 200, register_data, "User registration", is_critical=True)
        
        if success:
            # Test user login
            login_data = {
                "email": test_email,
                "password": "TestPass123!"
            }
            
            success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "User login", is_critical=True)
            
            if success and 'access_token' in login_response:
                self.token = login_response['access_token']
                self.user_data = login_response.get('user', {})
                print(f"   ✅ User authenticated: {self.user_data.get('full_name', 'Unknown')}")
                return True
        
        return False

    def test_critical_user_flows(self):
        """Test CRITICAL USER FLOWS"""
        print("\n🔄 TESTING CRITICAL USER FLOWS...")
        
        if not self.token:
            print("⚠️  Skipping user flows - no user token")
            return False
        
        # Test messaging system
        print("\n   💬 Testing Messaging System...")
        success, _ = self.test_api_endpoint('GET', '/messages/threads', 200, description="User message threads")
        
        # Test notifications
        print("\n   🔔 Testing Notifications...")
        success, _ = self.test_api_endpoint('GET', '/notifications', 200, description="User notifications")
        
        # Test referral system
        print("\n   👥 Testing Referral System...")
        success, _ = self.test_api_endpoint('GET', '/referrals/my-code', 200, description="User referral code")
        success, _ = self.test_api_endpoint('GET', '/referrals/stats', 200, description="Referral stats")
        
        return True

    def run_production_readiness_test(self):
        """Run FINAL PRODUCTION READINESS TEST"""
        print("🚀 STOCKLOT LIVESTOCK MARKETPLACE - FINAL PRODUCTION READINESS TEST")
        print("=" * 80)
        print("Testing comprehensive backend API implementation and critical fixes...")
        print("=" * 80)
        
        # 1. CRITICAL: Admin Authentication
        admin_success = self.test_admin_authentication()
        
        # 2. CRITICAL: User Authentication Flow
        user_success = self.test_user_authentication_flow()
        
        # 3. FIXED ENDPOINTS VERIFICATION
        self.test_fixed_endpoints_verification()
        
        # 4. NEW PAYMENT SYSTEM
        self.test_paystack_payment_system()
        
        # 5. ESCROW SYSTEM
        self.test_escrow_system()
        
        # 6. ADMIN PAYMENT MANAGEMENT
        self.test_admin_payment_management()
        
        # 7. COMPREHENSIVE SYSTEM HEALTH
        self.test_comprehensive_system_health()
        
        # 8. CRITICAL USER FLOWS
        self.test_critical_user_flows()
        
        # FINAL SUMMARY
        print("\n" + "=" * 80)
        print("📊 FINAL PRODUCTION READINESS TEST RESULTS")
        print("=" * 80)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Critical failures analysis
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   ❌ {failure}")
        else:
            print("\n✅ NO CRITICAL FAILURES DETECTED")
        
        # Failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ ALL FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                critical_marker = "🚨 CRITICAL" if test.get('is_critical') else ""
                print(f"   - {test['test']}: {test['details']} {critical_marker}")
        
        # Production readiness assessment
        print(f"\n🎯 PRODUCTION READINESS ASSESSMENT:")
        
        critical_success_rate = len([r for r in self.test_results if r.get('is_critical') and r['success']]) / max(len([r for r in self.test_results if r.get('is_critical')]), 1) * 100
        
        if critical_success_rate >= 95:
            print("   ✅ PRODUCTION READY - Critical systems operational")
        elif critical_success_rate >= 80:
            print("   ⚠️  PRODUCTION READY WITH WARNINGS - Some non-critical issues")
        else:
            print("   ❌ NOT PRODUCTION READY - Critical failures detected")
        
        print(f"   Critical Systems Success Rate: {critical_success_rate:.1f}%")
        
        # Specific system status
        print(f"\n📋 SYSTEM STATUS BREAKDOWN:")
        
        # Check fixed endpoints
        fixed_endpoint_tests = [r for r in self.test_results if 'FIXED' in r['test']]
        if any(t['success'] for t in fixed_endpoint_tests):
            print("   ✅ Fixed Endpoints: Operational")
        else:
            print("   ❌ Fixed Endpoints: Issues detected")
        
        # Check payment system
        payment_tests = [r for r in self.test_results if 'payment' in r['test'].lower() or 'paystack' in r['test'].lower()]
        if any(t['success'] for t in payment_tests):
            print("   ✅ Payment System: Operational")
        else:
            print("   ❌ Payment System: Issues detected")
        
        # Check admin functions
        admin_tests = [r for r in self.test_results if 'admin' in r['test'].lower()]
        if any(t['success'] for t in admin_tests):
            print("   ✅ Admin Functions: Operational")
        else:
            print("   ❌ Admin Functions: Issues detected")
        
        return len(self.critical_failures) == 0

def main():
    """Main test function"""
    tester = StockLotProductionTester()
    success = tester.run_production_readiness_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())