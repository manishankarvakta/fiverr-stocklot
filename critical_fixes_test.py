#!/usr/bin/env python3
"""
Critical Fixes Validation Test for StockLot Marketplace
Testing PHASE 1, 2 & 3 fixes as requested by main agent E1
"""

import requests
import sys
import json
from datetime import datetime

class CriticalFixesValidator:
    def __init__(self, base_url="https://trustscores.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []
        
        print(f"🔧 StockLot Critical Fixes Validator")
        print(f"🌐 Testing against: {base_url}")
        print("=" * 60)

    def log_test(self, test_name, success, details="", critical=False):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        
        if success:
            self.tests_passed += 1
            print(f"{status} {test_name}")
            if details:
                print(f"    ℹ️  {details}")
        else:
            print(f"{status} {test_name}")
            if details:
                print(f"    ⚠️  {details}")
            if critical:
                self.critical_failures.append(f"{test_name}: {details}")
        print()

    def test_admin_login(self):
        """Test admin login to get authentication token"""
        print("🔐 TESTING ADMIN AUTHENTICATION")
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                json={"email": "admin@stocklot.co.za", "password": "admin123"})
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('access_token')
                self.log_test("Admin Login", True, f"Token obtained: {self.admin_token[:20]}...")
                return True
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}", critical=True)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}", critical=True)
            return False

    def test_user_login(self):
        """Test regular user login"""
        print("👤 TESTING USER AUTHENTICATION")
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                json={"email": "test@example.com", "password": "testpass123"})
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get('access_token')
                self.log_test("User Login", True, f"Token obtained: {self.user_token[:20]}...")
                return True
            else:
                self.log_test("User Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False

    def test_orders_api_critical(self):
        """CRITICAL: Test Orders API - MUST WORK NOW"""
        print("🛒 CRITICAL ORDERS API TESTING")
        
        if not self.user_token:
            self.log_test("Orders API (No Auth)", False, "No user token available", critical=True)
            return False

        headers = {'Authorization': f'Bearer {self.user_token}'}
        
        # Test GET /api/orders
        try:
            response = requests.get(f"{self.api_url}/orders", headers=headers)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_test("GET /api/orders", True, f"Status: 200, Data type: {type(data)}")
                except json.JSONDecodeError:
                    self.log_test("GET /api/orders", False, "Invalid JSON response", critical=True)
                    return False
            else:
                self.log_test("GET /api/orders", False, f"Status: {response.status_code}, Response: {response.text}", critical=True)
                return False
        except Exception as e:
            self.log_test("GET /api/orders", False, f"Exception: {str(e)}", critical=True)
            return False

        # Test GET /api/orders/user
        try:
            response = requests.get(f"{self.api_url}/orders/user", headers=headers)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    # Check for MongoDB ObjectId serialization errors
                    json_str = json.dumps(data)  # This will fail if ObjectId present
                    
                    # Check structure
                    if isinstance(data, dict):
                        buyer_orders = data.get('buyer_orders', [])
                        seller_orders = data.get('seller_orders', [])
                        self.log_test("GET /api/orders/user", True, 
                            f"Buyer orders: {len(buyer_orders)}, Seller orders: {len(seller_orders)}")
                        
                        # Check for order #b3427829 mentioned in requirements
                        found_test_order = False
                        for order in buyer_orders:
                            if order.get('id', '').endswith('b3427829'):
                                found_test_order = True
                                self.log_test("Test Order #b3427829 Found", True, "Order details available")
                                break
                        
                        if not found_test_order:
                            self.log_test("Test Order #b3427829", False, "Expected test order not found")
                        
                        return True
                    else:
                        self.log_test("GET /api/orders/user", False, f"Unexpected data structure: {type(data)}", critical=True)
                        return False
                        
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("GET /api/orders/user", False, f"MongoDB ObjectId serialization error: {str(e)}", critical=True)
                    return False
            else:
                self.log_test("GET /api/orders/user", False, f"Status: {response.status_code}, Response: {response.text}", critical=True)
                return False
        except Exception as e:
            self.log_test("GET /api/orders/user", False, f"Exception: {str(e)}", critical=True)
            return False

    def test_breeds_api(self):
        """Test Breeds API - SHOULD WORK"""
        print("🐄 TESTING BREEDS API")
        
        try:
            response = requests.get(f"{self.api_url}/breeds")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        self.log_test("GET /api/breeds", True, f"Found {len(data)} breeds")
                        
                        # Check breed structure
                        sample_breed = data[0]
                        required_fields = ['id', 'name', 'species_id']
                        missing_fields = [field for field in required_fields if field not in sample_breed]
                        
                        if not missing_fields:
                            self.log_test("Breeds Data Structure", True, "All required fields present")
                        else:
                            self.log_test("Breeds Data Structure", False, f"Missing fields: {missing_fields}")
                        
                        return True
                    else:
                        self.log_test("GET /api/breeds", False, f"Empty or invalid breeds data: {type(data)}")
                        return False
                except json.JSONDecodeError:
                    self.log_test("GET /api/breeds", False, "Invalid JSON response")
                    return False
            elif response.status_code == 404:
                self.log_test("GET /api/breeds", False, "404 Not Found - Breeds endpoint missing", critical=True)
                return False
            else:
                self.log_test("GET /api/breeds", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("GET /api/breeds", False, f"Exception: {str(e)}")
            return False

    def test_admin_settings_api(self):
        """Test Admin Settings System - NEW FEATURE"""
        print("⚙️ TESTING ADMIN SETTINGS SYSTEM")
        
        if not self.admin_token:
            self.log_test("Admin Settings (No Auth)", False, "No admin token available", critical=True)
            return False

        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test GET /api/admin/settings
        try:
            response = requests.get(f"{self.api_url}/admin/settings", headers=headers)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_test("GET /api/admin/settings", True, f"Settings retrieved: {len(data)} sections")
                    
                    # Check for expected settings sections
                    expected_sections = ['general', 'social_media', 'app_downloads', 'payment_config', 'feature_controls']
                    found_sections = []
                    
                    if isinstance(data, dict):
                        for section in expected_sections:
                            if section in data:
                                found_sections.append(section)
                    
                    if len(found_sections) >= 3:  # At least 3 sections should be present
                        self.log_test("Admin Settings Structure", True, f"Found sections: {found_sections}")
                    else:
                        self.log_test("Admin Settings Structure", False, f"Missing sections. Found: {found_sections}")
                    
                except json.JSONDecodeError:
                    self.log_test("GET /api/admin/settings", False, "Invalid JSON response")
                    return False
            else:
                self.log_test("GET /api/admin/settings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("GET /api/admin/settings", False, f"Exception: {str(e)}")
            return False

        # Test PUT /api/admin/settings (update settings)
        try:
            test_settings = {
                "general": {
                    "site_name": "StockLot Test",
                    "contact_email": "test@stocklot.co.za"
                },
                "social_media": {
                    "facebook": "https://facebook.com/stocklot",
                    "twitter": "https://twitter.com/stocklot"
                }
            }
            
            response = requests.put(f"{self.api_url}/admin/settings", 
                                  headers=headers, json=test_settings)
            
            if response.status_code in [200, 201]:
                self.log_test("PUT /api/admin/settings", True, "Settings update successful")
            else:
                self.log_test("PUT /api/admin/settings", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("PUT /api/admin/settings", False, f"Exception: {str(e)}")

        return True

    def test_public_settings_api(self):
        """Test Public Settings API"""
        print("🌐 TESTING PUBLIC SETTINGS API")
        
        try:
            response = requests.get(f"{self.api_url}/public/settings")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_test("GET /api/public/settings", True, f"Public settings available: {len(data)} items")
                    return True
                except json.JSONDecodeError:
                    self.log_test("GET /api/public/settings", False, "Invalid JSON response")
                    return False
            else:
                self.log_test("GET /api/public/settings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("GET /api/public/settings", False, f"Exception: {str(e)}")
            return False

    def test_suggestions_system(self):
        """Test Suggestions System Confirmation"""
        print("💡 TESTING SUGGESTIONS SYSTEM")
        
        # Test suggestions endpoint
        try:
            response = requests.get(f"{self.api_url}/suggestions")
            
            if response.status_code == 200:
                self.log_test("GET /api/suggestions", True, "Suggestions endpoint accessible")
            else:
                self.log_test("GET /api/suggestions", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GET /api/suggestions", False, f"Exception: {str(e)}")

        # Test creating a suggestion (if user token available)
        if self.user_token:
            headers = {'Authorization': f'Bearer {self.user_token}'}
            try:
                suggestion_data = {
                    "title": "Test Suggestion",
                    "description": "This is a test suggestion for validation",
                    "category": "feature"
                }
                
                response = requests.post(f"{self.api_url}/suggestions", 
                                       headers=headers, json=suggestion_data)
                
                if response.status_code in [200, 201]:
                    self.log_test("POST /api/suggestions", True, "Suggestion creation successful")
                else:
                    self.log_test("POST /api/suggestions", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("POST /api/suggestions", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all critical tests"""
        print("🚀 STARTING CRITICAL FIXES VALIDATION")
        print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Authentication tests
        admin_auth_success = self.test_admin_login()
        user_auth_success = self.test_user_login()
        
        # Critical API tests
        self.test_orders_api_critical()
        self.test_breeds_api()
        
        # New features tests
        if admin_auth_success:
            self.test_admin_settings_api()
        
        self.test_public_settings_api()
        self.test_suggestions_system()
        
        # Final report
        self.print_final_report()

    def print_final_report(self):
        """Print comprehensive test results"""
        print("=" * 60)
        print("📊 CRITICAL FIXES VALIDATION REPORT")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run} ({success_rate:.1f}%)")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for i, failure in enumerate(self.critical_failures, 1):
                print(f"  {i}. {failure}")
        else:
            print("\n🎉 NO CRITICAL FAILURES DETECTED!")
        
        print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Success criteria check
        print("\n🎯 SUCCESS CRITERIA CHECK:")
        criteria_met = len(self.critical_failures) == 0 and success_rate >= 80
        
        if criteria_met:
            print("✅ ALL SUCCESS CRITERIA MET - PHASE 1-3 FIXES VALIDATED!")
            return 0
        else:
            print("❌ SUCCESS CRITERIA NOT MET - IMMEDIATE ATTENTION NEEDED!")
            return 1

def main():
    """Main execution function"""
    validator = CriticalFixesValidator()
    return validator.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())