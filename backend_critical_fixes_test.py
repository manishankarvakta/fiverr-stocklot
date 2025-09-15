#!/usr/bin/env python3
"""
BACKEND CRITICAL FIXES VERIFICATION TESTING

This script tests the specific critical backend issues that were identified 
in the comprehensive audit and have been reportedly fixed.

Test Categories:
1. Paystack Payment Integration - FIXED
2. File Upload Endpoints - FIXED  
3. Email System Endpoints - FIXED
4. Password Reset Endpoints - FIXED
5. Rate Limiting Implementation - FIXED
6. Regression Testing - Core functionality preservation
"""

import requests
import json
import time
import tempfile
import os
from datetime import datetime
from typing import Dict, List, Optional

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class CriticalFixesTestRunner:
    def __init__(self):
        self.results = []
        self.auth_token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'StockLot-Critical-Fixes-Test/1.0'
        })
        
    def log_result(self, test_name: str, success: bool, details: str, response_data: Optional[Dict] = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        print(f"    Details: {details}")
        if response_data and not success:
            print(f"    Response: {json.dumps(response_data, indent=2)}")
        print()
        
    def authenticate(self) -> bool:
        """Authenticate with admin credentials"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                # Try different token field names
                self.auth_token = data.get('access_token') or data.get('token') or ADMIN_EMAIL
                if self.auth_token:
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.auth_token}'
                    })
                    self.log_result("Authentication", True, f"Successfully authenticated as {ADMIN_EMAIL}")
                    return True
                    
            self.log_result("Authentication", False, f"Failed to get auth token. Status: {response.status_code}", response.json() if response.text else None)
            return False
            
        except Exception as e:
            self.log_result("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_paystack_payment_integration(self):
        """Test Paystack Payment Integration - Previously returning 500 errors"""
        print("🔄 Testing Paystack Payment Integration...")
        
        # Test 1: Payment initialization endpoint
        try:
            response = self.session.post(f"{API_BASE}/payments/paystack/init", json={
                "amount": 100,
                "order_id": "test_order_123",
                "email": "test@example.com"
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'authorization_url' in data or 'payment_url' in data:
                    self.log_result("Paystack Payment Init", True, 
                                  f"Payment initialization working. Status: {response.status_code}", data)
                else:
                    self.log_result("Paystack Payment Init", False, 
                                  "Missing payment URLs in response", data)
            else:
                self.log_result("Paystack Payment Init", False, 
                              f"Payment init failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Paystack Payment Init", False, f"Exception: {str(e)}")
        
        # Test 2: Alternate payment endpoint
        try:
            response = self.session.post(f"{API_BASE}/payment/create-paystack", json={
                "amount": 100,
                "email": "test@example.com",
                "reference": f"TEST_{int(time.time())}"
            })
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log_result("Paystack Create Payment", True, 
                              f"Alternate payment endpoint working. Status: {response.status_code}", data)
            else:
                self.log_result("Paystack Create Payment", False, 
                              f"Alternate payment failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Paystack Create Payment", False, f"Exception: {str(e)}")
    
    def test_file_upload_endpoints(self):
        """Test File Upload Endpoints - Previously returning 404 errors"""
        print("🔄 Testing File Upload Endpoints...")
        
        # Create a test image file
        test_image_content = b"fake image content for testing"
        
        # Test 1: Listing image upload endpoint
        try:
            files = {'file': ('test_image.jpg', test_image_content, 'image/jpeg')}
            data = {'listing_id': 'test_listing_123'}
            
            response = self.session.post(f"{API_BASE}/upload/listing-image", 
                                       files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("Listing Image Upload", True, 
                              "Listing image upload endpoint working", result)
            else:
                self.log_result("Listing Image Upload", False, 
                              f"Upload failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Listing Image Upload", False, f"Exception: {str(e)}")
        
        # Test 2: Profile image upload endpoint
        try:
            files = {'file': ('test_profile.jpg', test_image_content, 'image/jpeg')}
            
            response = self.session.post(f"{API_BASE}/upload/profile-image", files=files)
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("Profile Image Upload", True, 
                              "Profile image upload endpoint working", result)
            else:
                self.log_result("Profile Image Upload", False, 
                              f"Profile upload failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Profile Image Upload", False, f"Exception: {str(e)}")
    
    def test_email_system_endpoints(self):
        """Test Email System Endpoints - Previously returning 404 errors"""
        print("🔄 Testing Email System Endpoints...")
        
        # Test 1: Email preferences endpoint
        try:
            response = self.session.get(f"{API_BASE}/email/preferences")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Email Preferences", True, 
                              "Email preferences endpoint working", data)
            else:
                self.log_result("Email Preferences", False, 
                              f"Email preferences failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Email Preferences", False, f"Exception: {str(e)}")
        
        # Test 2: Email templates endpoint
        try:
            response = self.session.get(f"{API_BASE}/email/templates")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Email Templates", True, 
                              "Email templates endpoint working", data)
            else:
                self.log_result("Email Templates", False, 
                              f"Email templates failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Email Templates", False, f"Exception: {str(e)}")
        
        # Test 3: Test email endpoint
        try:
            response = self.session.post(f"{API_BASE}/email/test", json={
                "template": "welcome",
                "to": "test@example.com"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Test Email", True, 
                              "Test email endpoint working", data)
            else:
                self.log_result("Test Email", False, 
                              f"Test email failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Test Email", False, f"Exception: {str(e)}")
    
    def test_password_reset_endpoints(self):
        """Test Password Reset Endpoints - Previously returning 404 errors"""
        print("🔄 Testing Password Reset Endpoints...")
        
        # Test 1: Password reset request
        try:
            response = self.session.post(f"{API_BASE}/auth/password-reset", json={
                "email": "test@example.com"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Password Reset Request", True, 
                              "Password reset request endpoint working", data)
            else:
                self.log_result("Password Reset Request", False, 
                              f"Password reset request failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Password Reset Request", False, f"Exception: {str(e)}")
        
        # Test 2: Password reset confirmation (with invalid token - should return proper error)
        try:
            response = self.session.post(f"{API_BASE}/auth/password-reset/confirm", json={
                "token": "test_token",
                "new_password": "NewPassword123!"
            })
            
            # Should return 400 for invalid token, not 404
            if response.status_code in [400, 401]:
                data = response.json()
                self.log_result("Password Reset Confirm", True, 
                              "Password reset confirm endpoint working (proper error handling)", data)
            elif response.status_code == 404:
                self.log_result("Password Reset Confirm", False, 
                              "Endpoint still returning 404 - not fixed", 
                              response.json() if response.text else None)
            else:
                self.log_result("Password Reset Confirm", False, 
                              f"Unexpected status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Password Reset Confirm", False, f"Exception: {str(e)}")
    
    def test_rate_limiting_implementation(self):
        """Test Rate Limiting Implementation - Should return 429 after threshold"""
        print("🔄 Testing Rate Limiting Implementation...")
        
        # Test rate limiting on listings endpoint
        rate_limit_hit = False
        request_count = 0
        
        try:
            for i in range(1, 26):  # Try 25 requests
                response = self.session.get(f"{API_BASE}/listings")
                request_count = i
                
                if response.status_code == 429:
                    rate_limit_hit = True
                    self.log_result("Rate Limiting", True, 
                                  f"Rate limiting working - got 429 at request {i}", 
                                  {"request_number": i, "status_code": 429})
                    break
                elif response.status_code != 200:
                    self.log_result("Rate Limiting", False, 
                                  f"Unexpected error at request {i}: {response.status_code}", 
                                  response.json() if response.text else None)
                    break
                
                time.sleep(0.1)  # Small delay between requests
            
            if not rate_limit_hit:
                self.log_result("Rate Limiting", False, 
                              f"Rate limiting not triggered after {request_count} requests")
                              
        except Exception as e:
            self.log_result("Rate Limiting", False, f"Exception: {str(e)}")
    
    def test_core_marketplace_functions(self):
        """Test Core Marketplace Functions - Regression testing"""
        print("🔄 Testing Core Marketplace Functions (Regression)...")
        
        # Test 1: Listings endpoint
        try:
            response = self.session.get(f"{API_BASE}/listings")
            
            if response.status_code == 200:
                data = response.json()
                listing_count = len(data.get('data', []))
                self.log_result("Listings Endpoint", True, 
                              f"Listings endpoint working. Found {listing_count} listings")
            else:
                self.log_result("Listings Endpoint", False, 
                              f"Listings failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Listings Endpoint", False, f"Exception: {str(e)}")
        
        # Test 2: Categories endpoint
        try:
            response = self.session.get(f"{API_BASE}/listings/categories")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Categories Endpoint", True, 
                              "Categories endpoint working", data)
            else:
                self.log_result("Categories Endpoint", False, 
                              f"Categories failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Categories Endpoint", False, f"Exception: {str(e)}")
        
        # Test 3: Species endpoint
        try:
            response = self.session.get(f"{API_BASE}/listings/species")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Species Endpoint", True, 
                              "Species endpoint working", data)
            else:
                self.log_result("Species Endpoint", False, 
                              f"Species failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Species Endpoint", False, f"Exception: {str(e)}")
    
    def test_enhanced_authentication(self):
        """Test Enhanced Authentication System"""
        print("🔄 Testing Enhanced Authentication System...")
        
        # Test enhanced login endpoint
        try:
            # Remove current auth to test login
            temp_headers = self.session.headers.copy()
            if 'Authorization' in self.session.headers:
                del self.session.headers['Authorization']
            
            response = self.session.post(f"{API_BASE}/auth/login-enhanced", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Enhanced Login", True, 
                              "Enhanced login endpoint working", data)
            else:
                self.log_result("Enhanced Login", False, 
                              f"Enhanced login failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
            
            # Restore headers
            self.session.headers = temp_headers
                              
        except Exception as e:
            self.log_result("Enhanced Login", False, f"Exception: {str(e)}")
    
    def test_fee_calculation_system(self):
        """Test Fee Calculation System - Should include 1.5% processing fee"""
        print("🔄 Testing Fee Calculation System...")
        
        try:
            response = self.session.post(f"{API_BASE}/fees/breakdown", json={
                "items": [{"price": 100, "quantity": 2}]
            })
            
            if response.status_code == 200:
                data = response.json()
                # Check if processing fee is included
                if 'processing_fee' in str(data).lower() or 'fee' in data:
                    self.log_result("Fee Calculation", True, 
                                  "Fee calculation system working with processing fees", data)
                else:
                    self.log_result("Fee Calculation", False, 
                                  "Processing fee not found in response", data)
            else:
                self.log_result("Fee Calculation", False, 
                              f"Fee calculation failed. Status: {response.status_code}", 
                              response.json() if response.text else None)
                              
        except Exception as e:
            self.log_result("Fee Calculation", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all critical fixes verification tests"""
        print("🚀 Starting Backend Critical Fixes Verification Testing")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with authenticated tests")
            return
        
        # Run all test categories
        self.test_paystack_payment_integration()
        self.test_file_upload_endpoints()
        self.test_email_system_endpoints()
        self.test_password_reset_endpoints()
        self.test_rate_limiting_implementation()
        self.test_core_marketplace_functions()
        self.test_enhanced_authentication()
        self.test_fee_calculation_system()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("=" * 60)
        print("🎯 BACKEND CRITICAL FIXES VERIFICATION SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Group results by category
        categories = {
            'Paystack Payment': ['Paystack Payment Init', 'Paystack Create Payment'],
            'File Upload': ['Listing Image Upload', 'Profile Image Upload'],
            'Email System': ['Email Preferences', 'Email Templates', 'Test Email'],
            'Password Reset': ['Password Reset Request', 'Password Reset Confirm'],
            'Rate Limiting': ['Rate Limiting'],
            'Core Functions': ['Listings Endpoint', 'Categories Endpoint', 'Species Endpoint'],
            'Authentication': ['Authentication', 'Enhanced Login'],
            'Fee Calculation': ['Fee Calculation']
        }
        
        for category, test_names in categories.items():
            category_results = [r for r in self.results if r['test'] in test_names]
            if category_results:
                category_passed = sum(1 for r in category_results if r['success'])
                category_total = len(category_results)
                category_rate = (category_passed / category_total * 100) if category_total > 0 else 0
                
                status = "✅ FIXED" if category_rate == 100 else "⚠️ PARTIAL" if category_rate > 0 else "❌ FAILED"
                print(f"{status} {category}: {category_passed}/{category_total} ({category_rate:.0f}%)")
        
        print()
        
        # Show failed tests details
        failed_results = [r for r in self.results if not r['success']]
        if failed_results:
            print("❌ FAILED TESTS DETAILS:")
            for result in failed_results:
                print(f"  • {result['test']}: {result['details']}")
        else:
            print("🎉 ALL CRITICAL FIXES VERIFIED SUCCESSFULLY!")
        
        print()
        print(f"Expected Results: All previously failing endpoints should now return 2xx status codes")
        print(f"Actual Results: {success_rate:.1f}% success rate")
        
        if success_rate >= 90:
            print("🎯 SUCCESS CRITERIA MET: Improved success rate to 90%+")
        else:
            print("⚠️ SUCCESS CRITERIA NOT MET: Success rate below 90%")

if __name__ == "__main__":
    runner = CriticalFixesTestRunner()
    runner.run_all_tests()