#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SpecificUserTester:
    def __init__(self, base_url="https://farmstock-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.test_results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        if success:
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None:
            print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def test_specific_user_login(self):
        """Test login with test@example.com / testpass123"""
        print("\n🔍 Testing Specific User Login (test@example.com)...")
        
        login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user', {})
                self.user_token = data.get('access_token')
                
                self.log_result("Login test@example.com", True, f"User: {user.get('full_name')}", data)
                print(f"   User ID: {user.get('id')}")
                print(f"   Roles: {user.get('roles', [])}")
                return True, self.user_token, user
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"error": response.text}
                self.log_result("Login test@example.com", False, f"Status: {response.status_code}", error_data)
                return False, None, None
                
        except Exception as e:
            self.log_result("Login test@example.com", False, f"Request failed: {str(e)}")
            return False, None, None

    def test_admin_login(self):
        """Test admin login with admin@stocklot.co.za / admin123"""
        print("\n🔍 Testing Admin Login (admin@stocklot.co.za)...")
        
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user', {})
                admin_token = data.get('access_token')
                
                self.log_result("Login admin@stocklot.co.za", True, f"Admin: {user.get('full_name')}", data)
                print(f"   Admin ID: {user.get('id')}")
                print(f"   Roles: {user.get('roles', [])}")
                return True, admin_token, user
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"error": response.text}
                self.log_result("Login admin@stocklot.co.za", False, f"Status: {response.status_code}", error_data)
                return False, None, None
                
        except Exception as e:
            self.log_result("Login admin@stocklot.co.za", False, f"Request failed: {str(e)}")
            return False, None, None

    def test_cart_functionality(self, token):
        """Test shopping cart functionality"""
        print("\n🔍 Testing Shopping Cart Functionality...")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Get current cart
        try:
            response = requests.get(f"{self.base_url}/cart", headers=headers, timeout=10)
            
            if response.status_code == 200:
                cart_data = response.json()
                items = cart_data.get('items', [])
                total = cart_data.get('total', 0)
                item_count = cart_data.get('item_count', 0)
                
                self.log_result("Get Cart", True, f"Items: {item_count}, Total: R{total}", cart_data)
                
                print(f"   Cart Summary:")
                print(f"   - Item Count: {item_count}")
                print(f"   - Total: R{total}")
                
                if items:
                    print(f"   Cart Items:")
                    for i, item in enumerate(items, 1):
                        listing = item.get('listing', {})
                        print(f"   {i}. {listing.get('title', 'Unknown')} - Qty: {item.get('quantity', 0)} - R{item.get('item_total', 0)}")
                
                return True, cart_data
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"error": response.text}
                self.log_result("Get Cart", False, f"Status: {response.status_code}", error_data)
                return False, {}
                
        except Exception as e:
            self.log_result("Get Cart", False, f"Request failed: {str(e)}")
            return False, {}

    def test_checkout_functionality(self, token):
        """Test checkout functionality"""
        print("\n🔍 Testing Checkout Functionality...")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Create checkout session
        checkout_data = {
            "shipping_address": {
                "line1": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001",
                "country": "ZA"
            },
            "payment_method": "card"
        }
        
        try:
            response = requests.post(f"{self.base_url}/checkout/create", json=checkout_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                checkout_response = response.json()
                session_id = checkout_response.get('checkout_session_id')
                total_amount = checkout_response.get('total_amount')
                
                self.log_result("Create Checkout Session", True, f"Session ID: {session_id}, Total: R{total_amount}", checkout_response)
                
                return True, session_id, total_amount
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"error": response.text}
                self.log_result("Create Checkout Session", False, f"Status: {response.status_code}", error_data)
                return False, None, None
                
        except Exception as e:
            self.log_result("Create Checkout Session", False, f"Request failed: {str(e)}")
            return False, None, None

    def test_ai_chatbot(self):
        """Test AI chatbot functionality"""
        print("\n🔍 Testing AI Chatbot...")
        
        chat_data = {
            "question": "What types of chickens do you have available?"
        }
        
        try:
            response = requests.post(f"{self.base_url}/faq/chat", json=chat_data, timeout=15)
            
            if response.status_code == 200:
                chat_response = response.json()
                ai_response = chat_response.get('response', '')
                source = chat_response.get('source', 'unknown')
                
                self.log_result("AI Chatbot", True, f"Source: {source}, Response length: {len(ai_response)} chars", chat_response)
                
                print(f"   AI Response Preview: {ai_response[:200]}...")
                return True, chat_response
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"error": response.text}
                self.log_result("AI Chatbot", False, f"Status: {response.status_code}", error_data)
                return False, {}
                
        except Exception as e:
            self.log_result("AI Chatbot", False, f"Request failed: {str(e)}")
            return False, {}

    def test_admin_stats(self, admin_token):
        """Test admin stats endpoint"""
        print("\n🔍 Testing Admin Stats...")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {admin_token}'
        }
        
        try:
            response = requests.get(f"{self.base_url}/admin/stats", headers=headers, timeout=10)
            
            if response.status_code == 200:
                stats_data = response.json()
                
                self.log_result("Admin Stats", True, "Stats retrieved successfully", stats_data)
                
                data = stats_data.get('data', {})
                print(f"   Admin Stats:")
                print(f"   - Total Users: {data.get('total_users', 0)}")
                print(f"   - Total Listings: {data.get('total_listings', 0)}")
                print(f"   - Total Orders: {data.get('total_orders', 0)}")
                
                return True, stats_data
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"error": response.text}
                self.log_result("Admin Stats", False, f"Status: {response.status_code}", error_data)
                return False, {}
                
        except Exception as e:
            self.log_result("Admin Stats", False, f"Request failed: {str(e)}")
            return False, {}

    def run_specific_tests(self):
        """Run tests for specific user scenarios"""
        print("🚀 Testing Specific User Scenarios from Review Request")
        print("=" * 60)
        
        # Test specific user login
        user_success, user_token, user_data = self.test_specific_user_login()
        
        # Test admin login
        admin_success, admin_token, admin_data = self.test_admin_login()
        
        # Test AI chatbot (public endpoint)
        self.test_ai_chatbot()
        
        if user_success and user_token:
            # Test cart functionality
            cart_success, cart_data = self.test_cart_functionality(user_token)
            
            # Test checkout functionality if cart has items
            if cart_success and cart_data.get('item_count', 0) > 0:
                self.test_checkout_functionality(user_token)
            else:
                print("   ⚠️  Skipping checkout test - cart is empty")
        
        if admin_success and admin_token:
            # Test admin stats
            self.test_admin_stats(admin_token)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 SPECIFIC USER TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = [r for r in self.test_results if r['success']]
        failed_tests = [r for r in self.test_results if not r['success']]
        
        print(f"Tests run: {len(self.test_results)}")
        print(f"Tests passed: {len(passed_tests)}")
        print(f"Success rate: {(len(passed_tests)/len(self.test_results)*100):.1f}%")
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # Key findings
        print(f"\n🔍 KEY FINDINGS:")
        
        if user_success:
            print("   ✅ test@example.com login working")
        else:
            print("   ❌ test@example.com login failed - user may not exist")
        
        if admin_success:
            print("   ✅ admin@stocklot.co.za login working")
        else:
            print("   ❌ admin@stocklot.co.za login failed")
        
        # Check for cart with expected items
        cart_test = next((r for r in self.test_results if 'Cart' in r['test']), None)
        if cart_test and cart_test['success']:
            cart_data = cart_test.get('response_data', {})
            item_count = cart_data.get('item_count', 0)
            total = cart_data.get('total', 0)
            
            if item_count == 2 and total == 7725:
                print("   ✅ Cart matches expected: 2 items totaling R7,725")
            else:
                print(f"   ⚠️  Cart doesn't match expected: {item_count} items totaling R{total} (expected: 2 items, R7,725)")
        
        return len(failed_tests) == 0

def main():
    """Main test function"""
    tester = SpecificUserTester()
    success = tester.run_specific_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())