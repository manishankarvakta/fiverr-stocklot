#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AdminSettingsAPITester:
    def __init__(self, base_url="https://farm-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log(self, message, level="INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, use_admin=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        headers = {'Content-Type': 'application/json'}
        if use_admin and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "ERROR")
                except:
                    self.log(f"   Response text: {response.text[:200]}", "ERROR")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def test_admin_login(self):
        """Test admin login specifically for CardDescription testing"""
        self.log("🔐 Testing Admin Authentication for AdminSettingsControls...")
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@stocklot.co.za", "password": "admin123"},
            use_admin=False
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            admin_user = response.get('user', {})
            self.log(f"✅ Admin authenticated - User: {admin_user.get('full_name', 'Admin')}")
            self.log(f"✅ Admin roles: {admin_user.get('roles', [])}")
            return True
        else:
            self.log("❌ Admin login failed - AdminSettingsControls will not work", "ERROR")
            return False

    def test_admin_settings_endpoints(self):
        """Test all endpoints used by AdminSettingsControls component"""
        if not self.admin_token:
            self.log("⚠️  No admin token - skipping admin settings tests", "WARN")
            return False
            
        self.log("⚙️  Testing AdminSettingsControls API Endpoints...")
        
        # Test public config endpoint (used for feature flags)
        success1, config_data = self.run_test(
            "Public Config (Feature Flags)", 
            "GET", 
            "public/config", 
            200,
            use_admin=False
        )
        
        if success1:
            self.log(f"✅ Feature flags available: {list(config_data.get('flags', {}).keys())}")
        
        # Test admin settings GET endpoint
        success2, settings_data = self.run_test(
            "Admin Settings GET", 
            "GET", 
            "admin/settings", 
            200
        )
        
        if success2:
            self.log(f"✅ Platform settings retrieved successfully")
            
        # Test admin settings PUT endpoint with sample data
        test_settings = {
            "siteName": "StockLot Test",
            "platformCommissionPercent": 5.0,
            "paystackDemoMode": True,
            "supportEmail": "test@stocklot.co.za"
        }
        
        success3, update_response = self.run_test(
            "Admin Settings PUT", 
            "PUT", 
            "admin/settings", 
            200,
            data=test_settings
        )
        
        return success1 and success2 and success3

    def test_feature_flag_operations(self):
        """Test feature flag operations used by AdminSettingsControls"""
        if not self.admin_token:
            return False
            
        self.log("🚩 Testing Feature Flag Operations...")
        
        # Test updating a feature flag (if any exist)
        success, config_data = self.run_test(
            "Get Config for Flag Testing", 
            "GET", 
            "public/config", 
            200,
            use_admin=False
        )
        
        if success and config_data.get('flags'):
            # Try to update the first available flag
            flag_key = list(config_data['flags'].keys())[0]
            current_value = config_data['flags'][flag_key]
            new_value = not current_value  # Toggle the flag
            
            flag_success, _ = self.run_test(
                f"Update Feature Flag ({flag_key})",
                "POST",
                f"admin/flags/{flag_key}",
                200,
                data={"value": new_value}
            )
            
            return flag_success
        else:
            self.log("ℹ️  No feature flags found to test", "INFO")
            return True

    def run_comprehensive_test(self):
        """Run comprehensive test for AdminSettingsControls functionality"""
        self.log("🚀 Starting AdminSettingsControls API Tests...")
        self.log(f"🎯 Target: {self.base_url}")
        
        # Test admin authentication
        if not self.test_admin_login():
            self.log("❌ Cannot test AdminSettingsControls without admin access", "ERROR")
            return False
        
        # Test admin settings endpoints
        settings_success = self.test_admin_settings_endpoints()
        
        # Test feature flag operations
        flags_success = self.test_feature_flag_operations()
        
        # Print results
        self.log("📊 AdminSettingsControls API Test Results:")
        self.log(f"   Tests Run: {self.tests_run}")
        self.log(f"   Tests Passed: {self.tests_passed}")
        self.log(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        self.log(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        overall_success = settings_success and flags_success
        
        if overall_success:
            self.log("🎉 AdminSettingsControls backend APIs are working!", "SUCCESS")
            self.log("✅ CardDescription component should load without errors", "SUCCESS")
        else:
            self.log("⚠️  Some AdminSettingsControls APIs failed", "WARN")
            
        return overall_success

def main():
    """Main test execution for AdminSettingsControls"""
    tester = AdminSettingsAPITester()
    
    try:
        success = tester.run_comprehensive_test()
        return 0 if success else 1
    except KeyboardInterrupt:
        tester.log("🛑 Tests interrupted by user", "WARN")
        return 1
    except Exception as e:
        tester.log(f"💥 Unexpected error: {str(e)}", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())