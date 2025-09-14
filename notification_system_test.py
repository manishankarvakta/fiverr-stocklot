#!/usr/bin/env python3
"""
Comprehensive Notification System Backend Testing
Tests all notification APIs, event emission, worker processing, and template rendering
"""

import asyncio
import json
import requests
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"
USER_EMAIL = "testuser@example.com"
USER_PASSWORD = "testpass123"

class NotificationSystemTester:
    def __init__(self):
        self.admin_token = None
        self.user_token = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        if response_data and not success:
            print(f"    Response: {response_data}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token") or ADMIN_EMAIL
                self.log_result("Admin Authentication", True, f"Token: {self.admin_token[:20]}...")
                return True
            else:
                self.log_result("Admin Authentication", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Authentication", False, f"Error: {str(e)}")
            return False
    
    def authenticate_user(self) -> bool:
        """Authenticate as regular user"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "email": USER_EMAIL,
                "password": USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("access_token") or USER_EMAIL
                self.log_result("User Authentication", True, f"Token: {self.user_token[:20]}...")
                return True
            else:
                # Try to create user if login fails
                create_response = requests.post(f"{BACKEND_URL}/auth/register", json={
                    "email": USER_EMAIL,
                    "password": USER_PASSWORD,
                    "full_name": "Test User",
                    "role": "buyer"
                })
                
                if create_response.status_code in [200, 201]:
                    # Try login again
                    login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                        "email": USER_EMAIL,
                        "password": USER_PASSWORD
                    })
                    
                    if login_response.status_code == 200:
                        data = login_response.json()
                        self.user_token = data.get("access_token") or USER_EMAIL
                        self.log_result("User Authentication", True, f"Created and logged in: {self.user_token[:20]}...")
                        return True
                
                self.log_result("User Authentication", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("User Authentication", False, f"Error: {str(e)}")
            return False
    
    def get_admin_headers(self) -> Dict[str, str]:
        """Get headers for admin requests"""
        return {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
    
    def get_user_headers(self) -> Dict[str, str]:
        """Get headers for user requests"""
        return {
            "Authorization": f"Bearer {self.user_token}",
            "Content-Type": "application/json"
        }
    
    def test_admin_notification_settings_get(self) -> bool:
        """Test GET /api/admin/settings/notifications"""
        try:
            response = requests.get(
                f"{BACKEND_URL}/admin/settings/notifications",
                headers=self.get_admin_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = [
                    "enable_broadcast_buy_requests", "enable_broadcast_listings",
                    "default_digest_frequency", "default_max_per_day"
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_result("Admin Settings GET", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                self.log_result("Admin Settings GET", True, f"Settings retrieved with {len(data)} fields")
                return True
            else:
                self.log_result("Admin Settings GET", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Settings GET", False, f"Error: {str(e)}")
            return False
    
    def test_admin_notification_settings_put(self) -> bool:
        """Test PUT /api/admin/settings/notifications"""
        try:
            settings_data = {
                "enable_broadcast_buy_requests": True,
                "enable_broadcast_listings": True,
                "default_digest_frequency": "immediate",
                "default_max_per_day": 10,
                "default_email_opt_in": True,
                "default_inapp_opt_in": True,
                "default_push_opt_in": False
            }
            
            response = requests.put(
                f"{BACKEND_URL}/admin/settings/notifications",
                headers=self.get_admin_headers(),
                json=settings_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "updated" in data.get("message", "").lower():
                    self.log_result("Admin Settings PUT", True, "Settings updated successfully")
                    return True
                else:
                    self.log_result("Admin Settings PUT", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Admin Settings PUT", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Settings PUT", False, f"Error: {str(e)}")
            return False
    
    def test_admin_test_broadcast(self) -> bool:
        """Test POST /api/admin/notifications/test-broadcast"""
        try:
            test_data = {
                "type": "buy_request",
                "species": "Cattle",
                "province": "Gauteng",
                "title": "Test Buy Request for Notification System",
                "url": "https://stocklot.farm/buy-requests/test-123"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/admin/notifications/test-broadcast",
                headers=self.get_admin_headers(),
                json=test_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "enqueued" in data:
                    enqueued_count = data.get("enqueued", 0)
                    self.log_result("Admin Test Broadcast", True, f"Enqueued {enqueued_count} test notifications")
                    return True
                else:
                    self.log_result("Admin Test Broadcast", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Admin Test Broadcast", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Test Broadcast", False, f"Error: {str(e)}")
            return False
    
    def test_admin_templates_get(self) -> bool:
        """Test GET /api/admin/templates"""
        try:
            response = requests.get(
                f"{BACKEND_URL}/admin/templates",
                headers=self.get_admin_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Admin Templates GET", True, f"Retrieved {len(data)} templates")
                    return True
                else:
                    self.log_result("Admin Templates GET", False, "Expected array response", data)
                    return False
            else:
                self.log_result("Admin Templates GET", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Templates GET", False, f"Error: {str(e)}")
            return False
    
    def test_admin_template_update(self) -> bool:
        """Test PUT /api/admin/templates/{key}"""
        try:
            template_key = "buy_request.posted"
            template_data = {
                "subject": "New Buy Request: {{species}} in {{province}}",
                "html": "<h2>New Buy Request</h2><p>A buyer is looking for <strong>{{species}}</strong> in {{province}}.</p><p>Title: {{title}}</p><p><a href='{{url}}'>View Request</a></p>",
                "text": "New Buy Request: {{species}} in {{province}}\n\nTitle: {{title}}\n\nView: {{url}}"
            }
            
            response = requests.put(
                f"{BACKEND_URL}/admin/templates/{template_key}",
                headers=self.get_admin_headers(),
                json=template_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "updated" in data.get("message", "").lower():
                    self.log_result("Admin Template Update", True, f"Template {template_key} updated")
                    return True
                else:
                    self.log_result("Admin Template Update", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Admin Template Update", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Template Update", False, f"Error: {str(e)}")
            return False
    
    def test_admin_template_preview(self) -> bool:
        """Test POST /api/admin/templates/{key}/preview"""
        try:
            template_key = "buy_request.posted"
            preview_data = {
                "subject": "Test Preview Subject",
                "html": "<p>Test HTML with {{species}} and {{province}}</p>",
                "text": "Test text with {{species}} and {{province}}",
                "payload": {
                    "species": "Cattle",
                    "province": "Western Cape",
                    "title": "Looking for 50 Angus cattle",
                    "url": "https://stocklot.farm/test"
                }
            }
            
            response = requests.post(
                f"{BACKEND_URL}/admin/templates/{template_key}/preview",
                headers=self.get_admin_headers(),
                json=preview_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "rendered" in data:
                    rendered = data.get("rendered", {})
                    if "html" in rendered and "subject" in rendered:
                        self.log_result("Admin Template Preview", True, "Template rendered successfully")
                        return True
                    else:
                        self.log_result("Admin Template Preview", False, "Missing rendered content", data)
                        return False
                else:
                    self.log_result("Admin Template Preview", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Admin Template Preview", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Template Preview", False, f"Error: {str(e)}")
            return False
    
    def test_admin_outbox_get(self) -> bool:
        """Test GET /api/admin/outbox"""
        try:
            response = requests.get(
                f"{BACKEND_URL}/admin/outbox?status=PENDING",
                headers=self.get_admin_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "rows" in data and "total" in data:
                    total = data.get("total", 0)
                    self.log_result("Admin Outbox GET", True, f"Retrieved {total} outbox items")
                    return True
                else:
                    self.log_result("Admin Outbox GET", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Admin Outbox GET", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Outbox GET", False, f"Error: {str(e)}")
            return False
    
    def test_admin_outbox_run_once(self) -> bool:
        """Test POST /api/admin/outbox/run-once"""
        try:
            response = requests.post(
                f"{BACKEND_URL}/admin/outbox/run-once",
                headers=self.get_admin_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "processed" in data:
                    processed = data.get("processed", 0)
                    errors = data.get("errors", 0)
                    self.log_result("Admin Outbox Run Once", True, f"Processed {processed} notifications, {errors} errors")
                    return True
                else:
                    self.log_result("Admin Outbox Run Once", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Admin Outbox Run Once", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Admin Outbox Run Once", False, f"Error: {str(e)}")
            return False
    
    def test_user_notification_preferences_get(self) -> bool:
        """Test GET /api/me/notifications"""
        try:
            response = requests.get(
                f"{BACKEND_URL}/me/notifications",
                headers=self.get_user_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "data" in data:
                    prefs = data.get("data", {})
                    required_fields = ["user_id", "email_global", "digest_frequency", "max_per_day"]
                    missing_fields = [field for field in required_fields if field not in prefs]
                    
                    if missing_fields:
                        self.log_result("User Preferences GET", False, f"Missing fields: {missing_fields}", data)
                        return False
                    
                    self.log_result("User Preferences GET", True, f"Retrieved preferences with {len(prefs)} fields")
                    return True
                else:
                    self.log_result("User Preferences GET", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("User Preferences GET", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("User Preferences GET", False, f"Error: {str(e)}")
            return False
    
    def test_user_notification_preferences_put(self) -> bool:
        """Test PUT /api/me/notifications"""
        try:
            preferences_data = {
                "email_global": True,
                "email_new_listing": True,
                "email_buy_request": True,
                "digest_frequency": "daily",
                "species_interest": ["Cattle", "Sheep"],
                "provinces_interest": ["Gauteng", "Western Cape"],
                "max_per_day": 3
            }
            
            response = requests.put(
                f"{BACKEND_URL}/me/notifications",
                headers=self.get_user_headers(),
                json=preferences_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "updated" in data.get("message", "").lower():
                    self.log_result("User Preferences PUT", True, "Preferences updated successfully")
                    return True
                else:
                    self.log_result("User Preferences PUT", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("User Preferences PUT", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("User Preferences PUT", False, f"Error: {str(e)}")
            return False
    
    def test_preferences_species_get(self) -> bool:
        """Test GET /api/preferences/species"""
        try:
            response = requests.get(f"{BACKEND_URL}/preferences/species")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "species" in data:
                    species_list = data.get("species", [])
                    if len(species_list) > 0:
                        self.log_result("Preferences Species GET", True, f"Retrieved {len(species_list)} species")
                        return True
                    else:
                        self.log_result("Preferences Species GET", False, "Empty species list", data)
                        return False
                else:
                    self.log_result("Preferences Species GET", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Preferences Species GET", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Preferences Species GET", False, f"Error: {str(e)}")
            return False
    
    def test_preferences_provinces_get(self) -> bool:
        """Test GET /api/preferences/provinces"""
        try:
            response = requests.get(f"{BACKEND_URL}/preferences/provinces")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") and "provinces" in data:
                    provinces_list = data.get("provinces", [])
                    if len(provinces_list) > 0:
                        self.log_result("Preferences Provinces GET", True, f"Retrieved {len(provinces_list)} provinces")
                        return True
                    else:
                        self.log_result("Preferences Provinces GET", False, "Empty provinces list", data)
                        return False
                else:
                    self.log_result("Preferences Provinces GET", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Preferences Provinces GET", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Preferences Provinces GET", False, f"Error: {str(e)}")
            return False
    
    def test_event_emission_buy_request(self) -> bool:
        """Test event emission by creating a buy request"""
        try:
            # Create a test buy request to trigger notification events
            buy_request_data = {
                "species": "Cattle",
                "breed": "Angus",
                "quantity": 10,
                "max_price_per_unit": 5000,
                "location": "Gauteng",
                "description": "Looking for quality Angus cattle for breeding",
                "urgency": "medium"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/buy-requests",
                headers=self.get_user_headers(),
                json=buy_request_data
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if "id" in data or data.get("success"):
                    self.log_result("Event Emission - Buy Request", True, "Buy request created, events should be emitted")
                    return True
                else:
                    self.log_result("Event Emission - Buy Request", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Event Emission - Buy Request", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Event Emission - Buy Request", False, f"Error: {str(e)}")
            return False
    
    def test_event_emission_listing(self) -> bool:
        """Test event emission by creating a listing"""
        try:
            # First get category data for listing creation
            categories_response = requests.get(f"{BACKEND_URL}/category-groups")
            if categories_response.status_code != 200:
                self.log_result("Event Emission - Listing", False, "Could not get categories for listing creation")
                return False
            
            categories = categories_response.json()
            if not categories:
                self.log_result("Event Emission - Listing", False, "No categories available")
                return False
            
            # Get species for the first category
            species_response = requests.get(f"{BACKEND_URL}/species?category_group_id={categories[0]['id']}")
            if species_response.status_code != 200:
                self.log_result("Event Emission - Listing", False, "Could not get species for listing creation")
                return False
            
            species_list = species_response.json()
            if not species_list:
                self.log_result("Event Emission - Listing", False, "No species available")
                return False
            
            # Get product types
            product_types_response = requests.get(f"{BACKEND_URL}/product-types")
            if product_types_response.status_code != 200:
                self.log_result("Event Emission - Listing", False, "Could not get product types")
                return False
            
            product_types = product_types_response.json()
            if not product_types:
                self.log_result("Event Emission - Listing", False, "No product types available")
                return False
            
            # Create a test listing
            listing_data = {
                "species_id": species_list[0]["id"],
                "product_type_id": product_types[0]["id"],
                "title": "Test Cattle Listing for Notifications",
                "description": "High quality cattle for sale - notification test",
                "quantity": 5,
                "price_per_unit": 8000,
                "region": "Gauteng",
                "city": "Johannesburg"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/listings",
                headers=self.get_user_headers(),
                json=listing_data
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if "id" in data or data.get("success"):
                    self.log_result("Event Emission - Listing", True, "Listing created, events should be emitted")
                    return True
                else:
                    self.log_result("Event Emission - Listing", False, "Unexpected response format", data)
                    return False
            else:
                self.log_result("Event Emission - Listing", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Event Emission - Listing", False, f"Error: {str(e)}")
            return False
    
    def test_notification_worker_processing(self) -> bool:
        """Test that notification worker processes outbox items"""
        try:
            # First check if there are pending notifications
            outbox_response = requests.get(
                f"{BACKEND_URL}/admin/outbox?status=PENDING",
                headers=self.get_admin_headers()
            )
            
            if outbox_response.status_code != 200:
                self.log_result("Worker Processing", False, "Could not check outbox status")
                return False
            
            outbox_data = outbox_response.json()
            pending_before = outbox_data.get("total", 0)
            
            # Run the worker
            worker_response = requests.post(
                f"{BACKEND_URL}/admin/outbox/run-once",
                headers=self.get_admin_headers()
            )
            
            if worker_response.status_code != 200:
                self.log_result("Worker Processing", False, f"Worker failed: {worker_response.status_code}")
                return False
            
            worker_data = worker_response.json()
            processed = worker_data.get("processed", 0)
            errors = worker_data.get("errors", 0)
            
            # Check outbox again
            outbox_after_response = requests.get(
                f"{BACKEND_URL}/admin/outbox?status=PENDING",
                headers=self.get_admin_headers()
            )
            
            if outbox_after_response.status_code == 200:
                outbox_after_data = outbox_after_response.json()
                pending_after = outbox_after_data.get("total", 0)
                
                self.log_result("Worker Processing", True, 
                    f"Before: {pending_before} pending, Processed: {processed}, Errors: {errors}, After: {pending_after} pending")
                return True
            else:
                self.log_result("Worker Processing", True, f"Processed: {processed}, Errors: {errors}")
                return True
                
        except Exception as e:
            self.log_result("Worker Processing", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all notification system tests"""
        print("🔔 COMPREHENSIVE NOTIFICATION SYSTEM TESTING")
        print("=" * 60)
        
        # Authentication
        if not self.authenticate_admin():
            print("❌ Admin authentication failed - cannot continue with admin tests")
            return 0, 1
        
        if not self.authenticate_user():
            print("❌ User authentication failed - cannot continue with user tests")
            return 0, 1
        
        print("\n📋 ADMIN NOTIFICATION SETTINGS API TESTS")
        print("-" * 40)
        self.test_admin_notification_settings_get()
        self.test_admin_notification_settings_put()
        self.test_admin_test_broadcast()
        
        print("\n📝 ADMIN TEMPLATES API TESTS")
        print("-" * 40)
        self.test_admin_templates_get()
        self.test_admin_template_update()
        self.test_admin_template_preview()
        
        print("\n📤 ADMIN OUTBOX API TESTS")
        print("-" * 40)
        self.test_admin_outbox_get()
        self.test_admin_outbox_run_once()
        
        print("\n👤 USER NOTIFICATION PREFERENCES API TESTS")
        print("-" * 40)
        self.test_user_notification_preferences_get()
        self.test_user_notification_preferences_put()
        self.test_preferences_species_get()
        self.test_preferences_provinces_get()
        
        print("\n🎯 EVENT EMISSION TESTING")
        print("-" * 40)
        self.test_event_emission_buy_request()
        self.test_event_emission_listing()
        
        print("\n⚙️ NOTIFICATION WORKER TESTING")
        print("-" * 40)
        self.test_notification_worker_processing()
        
        # Summary
        print("\n📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = NotificationSystemTester()
    passed, failed = tester.run_all_tests()
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! Notification system is fully functional.")
        exit(0)
    else:
        print(f"\n⚠️  {failed} tests failed. Please check the issues above.")
        exit(1)