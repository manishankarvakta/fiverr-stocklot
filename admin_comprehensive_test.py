#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AdminDashboardTester:
    def __init__(self, base_url="https://pdp-cart-bug.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def test_admin_login(self):
        """Test admin login functionality"""
        print("\n🔐 Testing Admin Authentication...")
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                json={"email": "admin@stocklot.co.za", "password": "admin123"})
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    self.token = data['access_token']
                    user = data['user']
                    if 'admin' in user.get('roles', []):
                        self.log_test("Admin Login", True)
                        return True
                    else:
                        self.log_test("Admin Login", False, "User does not have admin role")
                else:
                    self.log_test("Admin Login", False, "Missing access_token or user in response")
            else:
                self.log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
        
        return False

    def make_admin_request(self, method, endpoint, data=None):
        """Make authenticated admin API request"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
        
        url = f"{self.api_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return None, f"Unsupported method: {method}"
            
            return response, None
        except Exception as e:
            return None, str(e)

    def test_admin_overview(self):
        """Test admin overview/stats endpoints"""
        print("\n📊 Testing Admin Overview...")
        
        # Test admin stats
        response, error = self.make_admin_request('GET', '/admin/stats')
        if error:
            self.log_test("Admin Stats", False, error)
        elif response.status_code == 200:
            self.log_test("Admin Stats", True)
        else:
            self.log_test("Admin Stats", False, f"Status {response.status_code}")

    def test_admin_users(self):
        """Test admin user management endpoints"""
        print("\n👥 Testing Admin User Management...")
        
        # Test get users
        response, error = self.make_admin_request('GET', '/admin/users')
        if error:
            self.log_test("Get Users", False, error)
        elif response.status_code == 200:
            self.log_test("Get Users", True)
        else:
            self.log_test("Get Users", False, f"Status {response.status_code}")

    def test_admin_listings(self):
        """Test admin listing management endpoints"""
        print("\n📦 Testing Admin Listing Management...")
        
        # Test get listings
        response, error = self.make_admin_request('GET', '/admin/listings')
        if error:
            self.log_test("Get Listings", False, error)
        elif response.status_code == 200:
            self.log_test("Get Listings", True)
        else:
            self.log_test("Get Listings", False, f"Status {response.status_code}")

    def test_admin_orders(self):
        """Test admin order management endpoints"""
        print("\n🛒 Testing Admin Order Management...")
        
        # Test get orders
        response, error = self.make_admin_request('GET', '/admin/orders')
        if error:
            self.log_test("Get Orders", False, error)
        elif response.status_code == 200:
            self.log_test("Get Orders", True)
        else:
            self.log_test("Get Orders", False, f"Status {response.status_code}")

    def test_admin_payouts(self):
        """Test NEW admin payout management endpoints"""
        print("\n💰 Testing Admin Payout Management (NEW)...")
        
        # Test get payouts
        response, error = self.make_admin_request('GET', '/admin/payouts')
        if error:
            self.log_test("Get Payouts", False, error)
        elif response.status_code == 200:
            self.log_test("Get Payouts", True)
        else:
            self.log_test("Get Payouts", False, f"Status {response.status_code}")
        
        # Test get payout requests
        response, error = self.make_admin_request('GET', '/admin/payout-requests')
        if error:
            self.log_test("Get Payout Requests", False, error)
        elif response.status_code == 200:
            self.log_test("Get Payout Requests", True)
        else:
            self.log_test("Get Payout Requests", False, f"Status {response.status_code}")

    def test_admin_payments(self):
        """Test NEW admin payment method management endpoints"""
        print("\n💳 Testing Admin Payment Management (NEW)...")
        
        # Test get payment methods
        response, error = self.make_admin_request('GET', '/admin/payment-methods')
        if error:
            self.log_test("Get Payment Methods", False, error)
        elif response.status_code == 200:
            self.log_test("Get Payment Methods", True)
        else:
            self.log_test("Get Payment Methods", False, f"Status {response.status_code}")

    def test_admin_organizations(self):
        """Test admin organization management endpoints"""
        print("\n🏢 Testing Admin Organization Management...")
        
        # Test get organizations
        response, error = self.make_admin_request('GET', '/admin/organizations')
        if error:
            self.log_test("Get Organizations", False, error)
        elif response.status_code == 200:
            self.log_test("Get Organizations", True)
        else:
            self.log_test("Get Organizations", False, f"Status {response.status_code}")

    def test_admin_compliance(self):
        """Test admin compliance management endpoints"""
        print("\n📋 Testing Admin Compliance Management...")
        
        # Test get compliance documents
        response, error = self.make_admin_request('GET', '/admin/compliance')
        if error:
            self.log_test("Get Compliance Documents", False, error)
        elif response.status_code == 200:
            self.log_test("Get Compliance Documents", True)
        else:
            self.log_test("Get Compliance Documents", False, f"Status {response.status_code}")

    def test_admin_messaging(self):
        """Test admin messaging management endpoints"""
        print("\n💬 Testing Admin Messaging Management...")
        
        # Test get messages
        response, error = self.make_admin_request('GET', '/admin/messages')
        if error:
            self.log_test("Get Messages", False, error)
        elif response.status_code == 200:
            self.log_test("Get Messages", True)
        else:
            self.log_test("Get Messages", False, f"Status {response.status_code}")

    def test_admin_referrals(self):
        """Test admin referral management endpoints"""
        print("\n🔗 Testing Admin Referral Management...")
        
        # Test get referrals
        response, error = self.make_admin_request('GET', '/admin/referrals')
        if error:
            self.log_test("Get Referrals", False, error)
        elif response.status_code == 200:
            self.log_test("Get Referrals", True)
        else:
            self.log_test("Get Referrals", False, f"Status {response.status_code}")

    def test_admin_webhooks(self):
        """Test NEW admin webhook management endpoints"""
        print("\n🔗 Testing Admin Webhook Management (NEW)...")
        
        # Test get webhooks
        response, error = self.make_admin_request('GET', '/admin/webhooks')
        if error:
            self.log_test("Get Webhooks", False, error)
        elif response.status_code == 200:
            self.log_test("Get Webhooks", True)
        else:
            self.log_test("Get Webhooks", False, f"Status {response.status_code}")
        
        # Test get webhook logs
        response, error = self.make_admin_request('GET', '/admin/webhook-logs')
        if error:
            self.log_test("Get Webhook Logs", False, error)
        elif response.status_code == 200:
            self.log_test("Get Webhook Logs", True)
        else:
            self.log_test("Get Webhook Logs", False, f"Status {response.status_code}")

    def test_admin_disease_zones(self):
        """Test NEW admin disease zone management endpoints"""
        print("\n🦠 Testing Admin Disease Zone Management (NEW)...")
        
        # Test get disease zones
        response, error = self.make_admin_request('GET', '/admin/disease-zones')
        if error:
            self.log_test("Get Disease Zones", False, error)
        elif response.status_code == 200:
            self.log_test("Get Disease Zones", True)
        else:
            self.log_test("Get Disease Zones", False, f"Status {response.status_code}")
        
        # Test get movement restrictions
        response, error = self.make_admin_request('GET', '/admin/movement-restrictions')
        if error:
            self.log_test("Get Movement Restrictions", False, error)
        elif response.status_code == 200:
            self.log_test("Get Movement Restrictions", True)
        else:
            self.log_test("Get Movement Restrictions", False, f"Status {response.status_code}")

    def test_admin_logistics(self):
        """Test NEW admin logistics management endpoints"""
        print("\n🚛 Testing Admin Logistics Management (NEW)...")
        
        # Test get transporters
        response, error = self.make_admin_request('GET', '/admin/transporters')
        if error:
            self.log_test("Get Transporters", False, error)
        elif response.status_code == 200:
            self.log_test("Get Transporters", True)
        else:
            self.log_test("Get Transporters", False, f"Status {response.status_code}")
        
        # Test get abattoirs
        response, error = self.make_admin_request('GET', '/admin/abattoirs')
        if error:
            self.log_test("Get Abattoirs", False, error)
        elif response.status_code == 200:
            self.log_test("Get Abattoirs", True)
        else:
            self.log_test("Get Abattoirs", False, f"Status {response.status_code}")

    def test_admin_auctions(self):
        """Test NEW admin auction management endpoints"""
        print("\n🔨 Testing Admin Auction Management (NEW)...")
        
        # Test get auctions
        response, error = self.make_admin_request('GET', '/admin/auctions')
        if error:
            self.log_test("Get Auctions", False, error)
        elif response.status_code == 200:
            self.log_test("Get Auctions", True)
        else:
            self.log_test("Get Auctions", False, f"Status {response.status_code}")
        
        # Test get auction bids
        response, error = self.make_admin_request('GET', '/admin/auction-bids')
        if error:
            self.log_test("Get Auction Bids", False, error)
        elif response.status_code == 200:
            self.log_test("Get Auction Bids", True)
        else:
            self.log_test("Get Auction Bids", False, f"Status {response.status_code}")

    def test_admin_cms(self):
        """Test NEW admin CMS management endpoints"""
        print("\n📝 Testing Admin CMS Management (NEW)...")
        
        # Test get CMS articles
        response, error = self.make_admin_request('GET', '/admin/cms/articles')
        if error:
            self.log_test("Get CMS Articles", False, error)
        elif response.status_code == 200:
            self.log_test("Get CMS Articles", True)
        else:
            self.log_test("Get CMS Articles", False, f"Status {response.status_code}")
        
        # Test get CMS pages
        response, error = self.make_admin_request('GET', '/admin/cms/pages')
        if error:
            self.log_test("Get CMS Pages", False, error)
        elif response.status_code == 200:
            self.log_test("Get CMS Pages", True)
        else:
            self.log_test("Get CMS Pages", False, f"Status {response.status_code}")
        
        # Test get CMS media
        response, error = self.make_admin_request('GET', '/admin/cms/media')
        if error:
            self.log_test("Get CMS Media", False, error)
        elif response.status_code == 200:
            self.log_test("Get CMS Media", True)
        else:
            self.log_test("Get CMS Media", False, f"Status {response.status_code}")

    def test_admin_settings(self):
        """Test admin settings management endpoints"""
        print("\n⚙️ Testing Admin Settings Management...")
        
        # Test get settings
        response, error = self.make_admin_request('GET', '/admin/settings')
        if error:
            self.log_test("Get Settings", False, error)
        elif response.status_code == 200:
            self.log_test("Get Settings", True)
        else:
            self.log_test("Get Settings", False, f"Status {response.status_code}")

    def test_admin_analytics(self):
        """Test admin analytics endpoints"""
        print("\n📈 Testing Admin Analytics...")
        
        # Test get analytics
        response, error = self.make_admin_request('GET', '/admin/analytics')
        if error:
            self.log_test("Get Analytics", False, error)
        elif response.status_code == 200:
            self.log_test("Get Analytics", True)
        else:
            self.log_test("Get Analytics", False, f"Status {response.status_code}")

    def run_all_tests(self):
        """Run comprehensive admin dashboard API tests"""
        print("🚀 Starting Comprehensive Admin Dashboard API Testing...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Test admin authentication
        if not self.test_admin_login():
            print("\n❌ Admin login failed - cannot proceed with other tests")
            return False
        
        # Step 2: Test all admin endpoints
        self.test_admin_overview()
        self.test_admin_users()
        self.test_admin_listings()
        self.test_admin_orders()
        
        # NEW ENDPOINTS
        self.test_admin_payouts()
        self.test_admin_payments()
        self.test_admin_webhooks()
        self.test_admin_disease_zones()
        self.test_admin_logistics()
        self.test_admin_auctions()
        self.test_admin_cms()
        
        # EXISTING ENDPOINTS
        self.test_admin_organizations()
        self.test_admin_compliance()
        self.test_admin_messaging()
        self.test_admin_referrals()
        self.test_admin_settings()
        self.test_admin_analytics()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print("\n🔍 FAILED TESTS:")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"  {i}. {failure}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Admin Dashboard API testing completed successfully!")
            return True
        else:
            print("⚠️  Admin Dashboard API has significant issues that need attention.")
            return False

def main():
    tester = AdminDashboardTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())