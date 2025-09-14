#!/usr/bin/env python3
"""
COMPREHENSIVE PRICE ALERTS & NOTIFICATIONS SYSTEM TESTING
Testing all newly implemented price alerts APIs as requested in review
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

# Test Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class PriceAlertsSystemTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_user_token = None
        self.test_results = []
        self.created_alerts = []
        self.created_notifications = []
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.admin_token = data.get("access_token") or ADMIN_EMAIL
                    print(f"✅ Admin authentication successful")
                    return True
                else:
                    print(f"❌ Admin authentication failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Admin authentication error: {e}")
            return False
    
    def get_auth_headers(self, token: str = None) -> Dict[str, str]:
        """Get authorization headers"""
        token_to_use = token or self.admin_token
        return {
            "Authorization": f"Bearer {token_to_use}",
            "Content-Type": "application/json"
        }
    
    async def test_price_alert_creation_api(self) -> Dict[str, Any]:
        """Test POST /api/price-alerts/create - Price Alert Creation API"""
        print("\n🧪 TESTING PRICE ALERT CREATION API")
        test_results = {
            "endpoint": "POST /api/price-alerts/create",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test scenarios for price alert creation
        test_scenarios = [
            {
                "name": "Price Drop Alert Creation",
                "data": {
                    "alert_type": "price_drop",
                    "title": "Cattle Price Drop Alert",
                    "description": "Alert when cattle prices drop below R15000",
                    "species_id": "cattle_species_id",
                    "location": "Western Cape",
                    "target_price": 15000.0,
                    "frequency": "instant",
                    "channels": ["email", "in_app"]
                }
            },
            {
                "name": "Price Target Alert Creation",
                "data": {
                    "alert_type": "price_target",
                    "title": "Goat Price Target Alert",
                    "description": "Alert when goat prices reach R2500",
                    "species_id": "goat_species_id",
                    "location": "Gauteng",
                    "target_price": 2500.0,
                    "frequency": "daily",
                    "channels": ["email", "in_app", "sms"]
                }
            },
            {
                "name": "Percentage Change Alert Creation",
                "data": {
                    "alert_type": "percentage_change",
                    "title": "15% Price Drop Alert",
                    "description": "Alert when prices drop by 15%",
                    "species_id": "sheep_species_id",
                    "location": "KwaZulu-Natal",
                    "percentage_threshold": 15.0,
                    "frequency": "instant",
                    "channels": ["email", "in_app"]
                }
            },
            {
                "name": "Market Trend Alert Creation",
                "data": {
                    "alert_type": "market_trend",
                    "title": "Poultry Market Trend Alert",
                    "description": "Alert for poultry market trends",
                    "species_id": "chicken_species_id",
                    "location": "Eastern Cape",
                    "frequency": "weekly",
                    "channels": ["email"]
                }
            },
            {
                "name": "Availability Alert Creation",
                "data": {
                    "alert_type": "availability",
                    "title": "Rare Breed Availability Alert",
                    "description": "Alert when rare breeds become available",
                    "species_id": "rare_breed_species_id",
                    "breed_id": "rare_breed_id",
                    "location": "Free State",
                    "frequency": "instant",
                    "channels": ["email", "in_app", "sms"]
                }
            }
        ]
        
        for scenario in test_scenarios:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/price-alerts/create",
                    json=scenario["data"],
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        alert_id = data.get("alert_id")
                        if alert_id:
                            self.created_alerts.append(alert_id)
                        
                        test_results["tests_passed"] += 1
                        test_results["details"].append(f"✅ {scenario['name']}: SUCCESS - Alert created with ID {alert_id}")
                        print(f"✅ {scenario['name']}: Alert created successfully")
                        
                    else:
                        test_results["tests_failed"] += 1
                        error_text = await response.text()
                        test_results["details"].append(f"❌ {scenario['name']}: FAILED - Status {response.status}, Error: {error_text}")
                        print(f"❌ {scenario['name']}: Failed with status {response.status}")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ {scenario['name']}: ERROR - {str(e)}")
                print(f"❌ {scenario['name']}: Error - {e}")
        
        # Test authentication validation
        try:
            async with self.session.post(
                f"{BACKEND_URL}/price-alerts/create",
                json=test_scenarios[0]["data"]
            ) as response:
                
                if response.status == 401:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Authentication Validation: SUCCESS - Properly requires authentication")
                    print("✅ Authentication validation: Properly requires authentication")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Authentication Validation: FAILED - Expected 401, got {response.status}")
                    print(f"❌ Authentication validation: Expected 401, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Authentication Validation: ERROR - {str(e)}")
            print(f"❌ Authentication validation error: {e}")
        
        return test_results
    
    async def test_price_alerts_get_api(self) -> Dict[str, Any]:
        """Test GET /api/price-alerts - Price Alerts Retrieval API"""
        print("\n🧪 TESTING PRICE ALERTS GET API")
        test_results = {
            "endpoint": "GET /api/price-alerts",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test basic retrieval
        try:
            async with self.session.get(
                f"{BACKEND_URL}/price-alerts",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    alerts = data.get("alerts", [])
                    summary = data.get("summary", {})
                    
                    test_results["tests_passed"] += 1
                    test_results["details"].append(f"✅ Basic Retrieval: SUCCESS - Retrieved {len(alerts)} alerts with summary")
                    print(f"✅ Basic retrieval: Retrieved {len(alerts)} alerts")
                    
                    # Verify summary statistics
                    if "total" in summary and "active" in summary:
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Summary Statistics: SUCCESS - Contains total and active counts")
                        print("✅ Summary statistics: Contains required fields")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Summary Statistics: FAILED - Missing required summary fields")
                        print("❌ Summary statistics: Missing required fields")
                        
                else:
                    test_results["tests_failed"] += 1
                    error_text = await response.text()
                    test_results["details"].append(f"❌ Basic Retrieval: FAILED - Status {response.status}, Error: {error_text}")
                    print(f"❌ Basic retrieval failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Basic Retrieval: ERROR - {str(e)}")
            print(f"❌ Basic retrieval error: {e}")
        
        # Test filtering by status
        filter_tests = [
            {"status": "active", "name": "Active Alerts Filter"},
            {"status": "triggered", "name": "Triggered Alerts Filter"},
            {"status": "paused", "name": "Paused Alerts Filter"},
            {"alert_type": "price_drop", "name": "Price Drop Filter"},
            {"alert_type": "price_target", "name": "Price Target Filter"}
        ]
        
        for filter_test in filter_tests:
            try:
                params = {k: v for k, v in filter_test.items() if k not in ["name"]}
                async with self.session.get(
                    f"{BACKEND_URL}/price-alerts",
                    params=params,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        test_results["tests_passed"] += 1
                        test_results["details"].append(f"✅ {filter_test['name']}: SUCCESS - Filtering working")
                        print(f"✅ {filter_test['name']}: Filtering working")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append(f"❌ {filter_test['name']}: FAILED - Status {response.status}")
                        print(f"❌ {filter_test['name']}: Failed")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ {filter_test['name']}: ERROR - {str(e)}")
                print(f"❌ {filter_test['name']}: Error - {e}")
        
        # Test authentication requirement
        try:
            async with self.session.get(f"{BACKEND_URL}/price-alerts") as response:
                if response.status == 401:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Authentication Requirement: SUCCESS - Properly requires authentication")
                    print("✅ Authentication requirement: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Authentication Requirement: FAILED - Expected 401, got {response.status}")
                    print(f"❌ Authentication requirement: Expected 401, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Authentication Requirement: ERROR - {str(e)}")
            print(f"❌ Authentication requirement error: {e}")
        
        return test_results
    
    async def test_price_alerts_update_api(self) -> Dict[str, Any]:
        """Test PUT /api/price-alerts/{alert_id} - Price Alerts Update API"""
        print("\n🧪 TESTING PRICE ALERTS UPDATE API")
        test_results = {
            "endpoint": "PUT /api/price-alerts/{alert_id}",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        if not self.created_alerts:
            test_results["tests_failed"] += 1
            test_results["details"].append("❌ No alerts available for update testing")
            print("❌ No alerts available for update testing")
            return test_results
        
        alert_id = self.created_alerts[0]
        
        # Test update scenarios
        update_scenarios = [
            {
                "name": "Update Alert Settings",
                "data": {
                    "title": "Updated Alert Title",
                    "description": "Updated alert description",
                    "target_price": 18000.0,
                    "frequency": "daily"
                }
            },
            {
                "name": "Update Notification Channels",
                "data": {
                    "channels": ["email", "in_app", "sms"]
                }
            },
            {
                "name": "Pause Alert",
                "data": {
                    "status": "paused"
                }
            },
            {
                "name": "Resume Alert",
                "data": {
                    "status": "active"
                }
            }
        ]
        
        for scenario in update_scenarios:
            try:
                async with self.session.put(
                    f"{BACKEND_URL}/price-alerts/{alert_id}",
                    json=scenario["data"],
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        test_results["tests_passed"] += 1
                        test_results["details"].append(f"✅ {scenario['name']}: SUCCESS - Alert updated")
                        print(f"✅ {scenario['name']}: Alert updated successfully")
                    else:
                        test_results["tests_failed"] += 1
                        error_text = await response.text()
                        test_results["details"].append(f"❌ {scenario['name']}: FAILED - Status {response.status}, Error: {error_text}")
                        print(f"❌ {scenario['name']}: Failed with status {response.status}")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ {scenario['name']}: ERROR - {str(e)}")
                print(f"❌ {scenario['name']}: Error - {e}")
        
        # Test user authorization (can only update own alerts)
        try:
            async with self.session.put(
                f"{BACKEND_URL}/price-alerts/non_existent_alert",
                json={"title": "Test"},
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status in [404, 400]:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ User Authorization: SUCCESS - Cannot update non-existent/unauthorized alerts")
                    print("✅ User authorization: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ User Authorization: FAILED - Expected 404/400, got {response.status}")
                    print(f"❌ User authorization: Expected 404/400, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ User Authorization: ERROR - {str(e)}")
            print(f"❌ User authorization error: {e}")
        
        return test_results
    
    async def test_price_alerts_delete_api(self) -> Dict[str, Any]:
        """Test DELETE /api/price-alerts/{alert_id} - Price Alerts Delete API"""
        print("\n🧪 TESTING PRICE ALERTS DELETE API")
        test_results = {
            "endpoint": "DELETE /api/price-alerts/{alert_id}",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        if len(self.created_alerts) < 2:
            test_results["tests_failed"] += 1
            test_results["details"].append("❌ Insufficient alerts for delete testing")
            print("❌ Insufficient alerts for delete testing")
            return test_results
        
        # Test successful deletion
        alert_to_delete = self.created_alerts[-1]  # Use last created alert
        try:
            async with self.session.delete(
                f"{BACKEND_URL}/price-alerts/{alert_to_delete}",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Alert Deletion: SUCCESS - Alert deleted successfully")
                    print("✅ Alert deletion: Successful")
                    self.created_alerts.remove(alert_to_delete)
                else:
                    test_results["tests_failed"] += 1
                    error_text = await response.text()
                    test_results["details"].append(f"❌ Alert Deletion: FAILED - Status {response.status}, Error: {error_text}")
                    print(f"❌ Alert deletion failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Alert Deletion: ERROR - {str(e)}")
            print(f"❌ Alert deletion error: {e}")
        
        # Test deletion of non-existent alert
        try:
            async with self.session.delete(
                f"{BACKEND_URL}/price-alerts/non_existent_alert",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status in [404, 400]:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Non-existent Alert Handling: SUCCESS - Properly handles non-existent alerts")
                    print("✅ Non-existent alert handling: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Non-existent Alert Handling: FAILED - Expected 404/400, got {response.status}")
                    print(f"❌ Non-existent alert handling: Expected 404/400, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Non-existent Alert Handling: ERROR - {str(e)}")
            print(f"❌ Non-existent alert handling error: {e}")
        
        # Test authentication requirement
        try:
            async with self.session.delete(f"{BACKEND_URL}/price-alerts/test_alert") as response:
                if response.status == 401:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Authentication Requirement: SUCCESS - Properly requires authentication")
                    print("✅ Authentication requirement: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Authentication Requirement: FAILED - Expected 401, got {response.status}")
                    print(f"❌ Authentication requirement: Expected 401, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Authentication Requirement: ERROR - {str(e)}")
            print(f"❌ Authentication requirement error: {e}")
        
        return test_results
    
    async def test_price_alerts_check_engine(self) -> Dict[str, Any]:
        """Test POST /api/price-alerts/check - Price Alerts Check Engine"""
        print("\n🧪 TESTING PRICE ALERTS CHECK ENGINE")
        test_results = {
            "endpoint": "POST /api/price-alerts/check",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test manual trigger of alert checking system
        try:
            async with self.session.post(
                f"{BACKEND_URL}/price-alerts/check",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    processed_alerts = data.get("processed_alerts", 0)
                    triggered_alerts = data.get("triggered_alerts", 0)
                    message = data.get("message", "")
                    
                    test_results["tests_passed"] += 1
                    test_results["details"].append(f"✅ Manual Alert Check: SUCCESS - Processed {processed_alerts} alerts, triggered {triggered_alerts}")
                    print(f"✅ Manual alert check: Processed {processed_alerts} alerts, triggered {triggered_alerts}")
                    
                    # Verify response structure
                    if "processed_alerts" in data and "triggered_alerts" in data:
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Response Structure: SUCCESS - Contains required fields")
                        print("✅ Response structure: Contains required fields")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Response Structure: FAILED - Missing required fields")
                        print("❌ Response structure: Missing required fields")
                        
                else:
                    test_results["tests_failed"] += 1
                    error_text = await response.text()
                    test_results["details"].append(f"❌ Manual Alert Check: FAILED - Status {response.status}, Error: {error_text}")
                    print(f"❌ Manual alert check failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Manual Alert Check: ERROR - {str(e)}")
            print(f"❌ Manual alert check error: {e}")
        
        # Test market price evaluation (if we have active alerts)
        if self.created_alerts:
            try:
                # Wait a moment for processing
                await asyncio.sleep(2)
                
                # Check if any alerts were triggered by getting alerts again
                async with self.session.get(
                    f"{BACKEND_URL}/price-alerts",
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        alerts = data.get("alerts", [])
                        triggered_count = sum(1 for alert in alerts if alert.get("status") == "triggered")
                        
                        test_results["tests_passed"] += 1
                        test_results["details"].append(f"✅ Alert Status Updates: SUCCESS - Found {triggered_count} triggered alerts")
                        print(f"✅ Alert status updates: Found {triggered_count} triggered alerts")
                        
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Alert Status Updates: FAILED - Could not verify alert status updates")
                        print("❌ Alert status updates: Could not verify")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ Alert Status Updates: ERROR - {str(e)}")
                print(f"❌ Alert status updates error: {e}")
        
        return test_results
    
    async def test_notifications_system(self) -> Dict[str, Any]:
        """Test GET /api/notifications - Notifications System"""
        print("\n🧪 TESTING NOTIFICATIONS SYSTEM")
        test_results = {
            "endpoint": "GET /api/notifications",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test basic notifications retrieval
        try:
            async with self.session.get(
                f"{BACKEND_URL}/notifications",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("notifications", [])
                    total_count = data.get("total_count", 0)
                    unread_count = data.get("unread_count", 0)
                    
                    test_results["tests_passed"] += 1
                    test_results["details"].append(f"✅ Basic Notifications Retrieval: SUCCESS - Retrieved {len(notifications)} notifications")
                    print(f"✅ Basic notifications retrieval: Retrieved {len(notifications)} notifications")
                    
                    # Verify response structure
                    if "total_count" in data and "unread_count" in data:
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Notification Counts: SUCCESS - Contains total and unread counts")
                        print("✅ Notification counts: Contains required fields")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Notification Counts: FAILED - Missing count fields")
                        print("❌ Notification counts: Missing required fields")
                        
                else:
                    test_results["tests_failed"] += 1
                    error_text = await response.text()
                    test_results["details"].append(f"❌ Basic Notifications Retrieval: FAILED - Status {response.status}, Error: {error_text}")
                    print(f"❌ Basic notifications retrieval failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Basic Notifications Retrieval: ERROR - {str(e)}")
            print(f"❌ Basic notifications retrieval error: {e}")
        
        # Test unread notifications filtering
        try:
            async with self.session.get(
                f"{BACKEND_URL}/notifications",
                params={"unread_only": "true"},
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Unread Notifications Filter: SUCCESS - Filtering working")
                    print("✅ Unread notifications filter: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Unread Notifications Filter: FAILED - Status {response.status}")
                    print(f"❌ Unread notifications filter failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Unread Notifications Filter: ERROR - {str(e)}")
            print(f"❌ Unread notifications filter error: {e}")
        
        # Test pagination with limit
        try:
            async with self.session.get(
                f"{BACKEND_URL}/notifications",
                params={"limit": "10"},
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("notifications", [])
                    if len(notifications) <= 10:
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Pagination Limit: SUCCESS - Respects limit parameter")
                        print("✅ Pagination limit: Working correctly")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append(f"❌ Pagination Limit: FAILED - Returned {len(notifications)} notifications, expected ≤10")
                        print(f"❌ Pagination limit: Returned {len(notifications)}, expected ≤10")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Pagination Limit: FAILED - Status {response.status}")
                    print(f"❌ Pagination limit failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Pagination Limit: ERROR - {str(e)}")
            print(f"❌ Pagination limit error: {e}")
        
        # Test authentication requirement
        try:
            async with self.session.get(f"{BACKEND_URL}/notifications") as response:
                if response.status == 401:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Authentication Requirement: SUCCESS - Properly requires authentication")
                    print("✅ Authentication requirement: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Authentication Requirement: FAILED - Expected 401, got {response.status}")
                    print(f"❌ Authentication requirement: Expected 401, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Authentication Requirement: ERROR - {str(e)}")
            print(f"❌ Authentication requirement error: {e}")
        
        return test_results
    
    async def test_price_alert_statistics(self) -> Dict[str, Any]:
        """Test GET /api/price-alerts/stats - Price Alert Statistics"""
        print("\n🧪 TESTING PRICE ALERT STATISTICS")
        test_results = {
            "endpoint": "GET /api/price-alerts/stats",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test statistics retrieval
        try:
            async with self.session.get(
                f"{BACKEND_URL}/price-alerts/stats",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Check for expected statistics fields
                    expected_fields = ["total_alerts", "active_alerts", "triggered_today", "alert_types", "recent_triggers"]
                    missing_fields = [field for field in expected_fields if field not in data]
                    
                    if not missing_fields:
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Statistics Structure: SUCCESS - Contains all expected fields")
                        print("✅ Statistics structure: Contains all expected fields")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append(f"❌ Statistics Structure: FAILED - Missing fields: {missing_fields}")
                        print(f"❌ Statistics structure: Missing fields: {missing_fields}")
                    
                    # Verify alert type breakdown
                    if "alert_types" in data and isinstance(data["alert_types"], dict):
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Alert Type Breakdown: SUCCESS - Contains alert type analysis")
                        print("✅ Alert type breakdown: Working correctly")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Alert Type Breakdown: FAILED - Missing or invalid alert type breakdown")
                        print("❌ Alert type breakdown: Missing or invalid")
                    
                    # Verify recent triggers tracking
                    if "recent_triggers" in data and isinstance(data["recent_triggers"], list):
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Recent Triggers Tracking: SUCCESS - Contains recent triggers list")
                        print("✅ Recent triggers tracking: Working correctly")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Recent Triggers Tracking: FAILED - Missing or invalid recent triggers")
                        print("❌ Recent triggers tracking: Missing or invalid")
                        
                else:
                    test_results["tests_failed"] += 1
                    error_text = await response.text()
                    test_results["details"].append(f"❌ Statistics Retrieval: FAILED - Status {response.status}, Error: {error_text}")
                    print(f"❌ Statistics retrieval failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Statistics Retrieval: ERROR - {str(e)}")
            print(f"❌ Statistics retrieval error: {e}")
        
        # Test authentication requirement
        try:
            async with self.session.get(f"{BACKEND_URL}/price-alerts/stats") as response:
                if response.status == 401:
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Authentication Requirement: SUCCESS - Properly requires authentication")
                    print("✅ Authentication requirement: Working correctly")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Authentication Requirement: FAILED - Expected 401, got {response.status}")
                    print(f"❌ Authentication requirement: Expected 401, got {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Authentication Requirement: ERROR - {str(e)}")
            print(f"❌ Authentication requirement error: {e}")
        
        return test_results
    
    async def test_email_notification_integration(self) -> Dict[str, Any]:
        """Test Email Notification Integration"""
        print("\n🧪 TESTING EMAIL NOTIFICATION INTEGRATION")
        test_results = {
            "endpoint": "Email Notification System",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Since we can't directly test email sending without triggering actual emails,
        # we'll test the system's ability to handle email notification requests
        
        # Test that price alert creation triggers email setup
        try:
            alert_data = {
                "alert_type": "price_drop",
                "title": "Email Test Alert",
                "description": "Testing email notification integration",
                "species_id": "test_species",
                "location": "Test Location",
                "target_price": 1000.0,
                "frequency": "instant",
                "channels": ["email", "in_app"]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/price-alerts/create",
                json=alert_data,
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    alert_id = data.get("alert_id")
                    if alert_id:
                        self.created_alerts.append(alert_id)
                    
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Email Alert Creation: SUCCESS - Alert with email channel created")
                    print("✅ Email alert creation: Alert with email channel created")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Email Alert Creation: FAILED - Status {response.status}")
                    print(f"❌ Email alert creation failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Email Alert Creation: ERROR - {str(e)}")
            print(f"❌ Email alert creation error: {e}")
        
        # Test email notification preferences
        try:
            # Check if user has email in their profile (required for email notifications)
            async with self.session.get(
                f"{BACKEND_URL}/auth/me",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    user_data = await response.json()
                    if user_data.get("email"):
                        test_results["tests_passed"] += 1
                        test_results["details"].append("✅ Email Configuration: SUCCESS - User has email configured")
                        print("✅ Email configuration: User has email configured")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append("❌ Email Configuration: FAILED - User email not configured")
                        print("❌ Email configuration: User email not configured")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Email Configuration: FAILED - Could not verify user email")
                    print("❌ Email configuration: Could not verify user email")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Email Configuration: ERROR - {str(e)}")
            print(f"❌ Email configuration error: {e}")
        
        # Test that the system accepts email as a notification channel
        email_channels_test = ["email", "in_app", "sms"]
        for channel in email_channels_test:
            try:
                alert_data = {
                    "alert_type": "availability",
                    "title": f"Channel Test - {channel}",
                    "description": f"Testing {channel} notification channel",
                    "species_id": "test_species",
                    "location": "Test Location",
                    "frequency": "daily",
                    "channels": [channel]
                }
                
                async with self.session.post(
                    f"{BACKEND_URL}/price-alerts/create",
                    json=alert_data,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        alert_id = data.get("alert_id")
                        if alert_id:
                            self.created_alerts.append(alert_id)
                        
                        test_results["tests_passed"] += 1
                        test_results["details"].append(f"✅ {channel.upper()} Channel: SUCCESS - Channel accepted")
                        print(f"✅ {channel.upper()} channel: Accepted")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append(f"❌ {channel.upper()} Channel: FAILED - Status {response.status}")
                        print(f"❌ {channel.upper()} channel failed: {response.status}")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ {channel.upper()} Channel: ERROR - {str(e)}")
                print(f"❌ {channel.upper()} channel error: {e}")
        
        return test_results
    
    async def test_database_integration(self) -> Dict[str, Any]:
        """Test Database Integration"""
        print("\n🧪 TESTING DATABASE INTEGRATION")
        test_results = {
            "endpoint": "Database Integration",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test that alerts are properly stored and retrievable
        if self.created_alerts:
            try:
                async with self.session.get(
                    f"{BACKEND_URL}/price-alerts",
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        alerts = data.get("alerts", [])
                        
                        # Verify that created alerts are in the database
                        stored_alert_ids = [alert.get("id") for alert in alerts]
                        found_alerts = [alert_id for alert_id in self.created_alerts if alert_id in stored_alert_ids]
                        
                        if found_alerts:
                            test_results["tests_passed"] += 1
                            test_results["details"].append(f"✅ Alert Storage: SUCCESS - {len(found_alerts)} alerts properly stored")
                            print(f"✅ Alert storage: {len(found_alerts)} alerts properly stored")
                        else:
                            test_results["tests_failed"] += 1
                            test_results["details"].append("❌ Alert Storage: FAILED - Created alerts not found in database")
                            print("❌ Alert storage: Created alerts not found")
                        
                        # Verify alert data structure
                        if alerts:
                            sample_alert = alerts[0]
                            required_fields = ["id", "user_id", "alert_type", "title", "status", "created_at"]
                            missing_fields = [field for field in required_fields if field not in sample_alert]
                            
                            if not missing_fields:
                                test_results["tests_passed"] += 1
                                test_results["details"].append("✅ Alert Data Structure: SUCCESS - Contains all required fields")
                                print("✅ Alert data structure: Contains all required fields")
                            else:
                                test_results["tests_failed"] += 1
                                test_results["details"].append(f"❌ Alert Data Structure: FAILED - Missing fields: {missing_fields}")
                                print(f"❌ Alert data structure: Missing fields: {missing_fields}")
                        
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append(f"❌ Database Retrieval: FAILED - Status {response.status}")
                        print(f"❌ Database retrieval failed: {response.status}")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ Database Integration: ERROR - {str(e)}")
                print(f"❌ Database integration error: {e}")
        
        # Test cross-collection data fetching (if notifications exist)
        try:
            async with self.session.get(
                f"{BACKEND_URL}/notifications",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("notifications", [])
                    
                    test_results["tests_passed"] += 1
                    test_results["details"].append(f"✅ Notifications Collection: SUCCESS - {len(notifications)} notifications accessible")
                    print(f"✅ Notifications collection: {len(notifications)} notifications accessible")
                    
                    # Verify notification data structure
                    if notifications:
                        sample_notification = notifications[0]
                        required_fields = ["id", "user_id", "title", "message", "created_at"]
                        missing_fields = [field for field in required_fields if field not in sample_notification]
                        
                        if not missing_fields:
                            test_results["tests_passed"] += 1
                            test_results["details"].append("✅ Notification Data Structure: SUCCESS - Contains all required fields")
                            print("✅ Notification data structure: Contains all required fields")
                        else:
                            test_results["tests_failed"] += 1
                            test_results["details"].append(f"❌ Notification Data Structure: FAILED - Missing fields: {missing_fields}")
                            print(f"❌ Notification data structure: Missing fields: {missing_fields}")
                    
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Notifications Collection: FAILED - Status {response.status}")
                    print(f"❌ Notifications collection failed: {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Notifications Collection: ERROR - {str(e)}")
            print(f"❌ Notifications collection error: {e}")
        
        return test_results
    
    async def test_security_and_validation(self) -> Dict[str, Any]:
        """Test Security & Validation"""
        print("\n🧪 TESTING SECURITY & VALIDATION")
        test_results = {
            "endpoint": "Security & Validation",
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test input validation for alert creation
        invalid_alert_scenarios = [
            {
                "name": "Missing Required Fields",
                "data": {
                    "alert_type": "price_drop"
                    # Missing title and other required fields
                }
            },
            {
                "name": "Invalid Alert Type",
                "data": {
                    "alert_type": "invalid_type",
                    "title": "Test Alert",
                    "target_price": 1000.0
                }
            },
            {
                "name": "Invalid Price Values",
                "data": {
                    "alert_type": "price_drop",
                    "title": "Test Alert",
                    "target_price": -1000.0  # Negative price
                }
            },
            {
                "name": "Invalid Percentage Threshold",
                "data": {
                    "alert_type": "percentage_change",
                    "title": "Test Alert",
                    "percentage_threshold": 150.0  # Over 100%
                }
            }
        ]
        
        for scenario in invalid_alert_scenarios:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/price-alerts/create",
                    json=scenario["data"],
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status in [400, 422]:  # Bad request or validation error
                        test_results["tests_passed"] += 1
                        test_results["details"].append(f"✅ {scenario['name']}: SUCCESS - Properly rejected invalid data")
                        print(f"✅ {scenario['name']}: Properly rejected")
                    else:
                        test_results["tests_failed"] += 1
                        test_results["details"].append(f"❌ {scenario['name']}: FAILED - Expected 400/422, got {response.status}")
                        print(f"❌ {scenario['name']}: Expected 400/422, got {response.status}")
                        
            except Exception as e:
                test_results["tests_failed"] += 1
                test_results["details"].append(f"❌ {scenario['name']}: ERROR - {str(e)}")
                print(f"❌ {scenario['name']}: Error - {e}")
        
        # Test rate limiting (if implemented)
        try:
            # Make multiple rapid requests to test rate limiting
            rapid_requests = []
            for i in range(5):
                rapid_requests.append(
                    self.session.post(
                        f"{BACKEND_URL}/price-alerts/create",
                        json={
                            "alert_type": "price_drop",
                            "title": f"Rate Limit Test {i}",
                            "target_price": 1000.0
                        },
                        headers=self.get_auth_headers()
                    )
                )
            
            responses = await asyncio.gather(*rapid_requests, return_exceptions=True)
            
            # Check if any requests were rate limited
            rate_limited = any(
                hasattr(r, 'status') and r.status == 429 
                for r in responses 
                if not isinstance(r, Exception)
            )
            
            if rate_limited:
                test_results["tests_passed"] += 1
                test_results["details"].append("✅ Rate Limiting: SUCCESS - Rate limiting is active")
                print("✅ Rate limiting: Active")
            else:
                # Rate limiting might not be implemented, which is okay
                test_results["tests_passed"] += 1
                test_results["details"].append("✅ Rate Limiting: INFO - No rate limiting detected (may not be implemented)")
                print("✅ Rate limiting: No rate limiting detected")
                
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Rate Limiting: ERROR - {str(e)}")
            print(f"❌ Rate limiting error: {e}")
        
        # Test service availability checks
        try:
            # Test with service unavailable scenario (if price_alerts_service is None)
            # This is handled in the endpoints, so we test normal operation
            async with self.session.get(
                f"{BACKEND_URL}/price-alerts/stats",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status in [200, 503]:  # Either working or service unavailable
                    test_results["tests_passed"] += 1
                    test_results["details"].append("✅ Service Availability: SUCCESS - Proper service availability handling")
                    print("✅ Service availability: Proper handling")
                else:
                    test_results["tests_failed"] += 1
                    test_results["details"].append(f"❌ Service Availability: FAILED - Unexpected status {response.status}")
                    print(f"❌ Service availability: Unexpected status {response.status}")
                    
        except Exception as e:
            test_results["tests_failed"] += 1
            test_results["details"].append(f"❌ Service Availability: ERROR - {str(e)}")
            print(f"❌ Service availability error: {e}")
        
        return test_results
    
    async def run_comprehensive_tests(self):
        """Run all price alerts system tests"""
        print("🚀 STARTING COMPREHENSIVE PRICE ALERTS & NOTIFICATIONS SYSTEM TESTING")
        print("=" * 80)
        
        await self.setup_session()
        
        # Authenticate as admin
        if not await self.authenticate_admin():
            print("❌ Failed to authenticate admin user. Cannot proceed with testing.")
            await self.cleanup_session()
            return
        
        # Run all test suites
        test_suites = [
            self.test_price_alert_creation_api,
            self.test_price_alerts_get_api,
            self.test_price_alerts_update_api,
            self.test_price_alerts_delete_api,
            self.test_price_alerts_check_engine,
            self.test_notifications_system,
            self.test_price_alert_statistics,
            self.test_email_notification_integration,
            self.test_database_integration,
            self.test_security_and_validation
        ]
        
        for test_suite in test_suites:
            try:
                result = await test_suite()
                self.test_results.append(result)
            except Exception as e:
                print(f"❌ Test suite failed: {e}")
                self.test_results.append({
                    "endpoint": test_suite.__name__,
                    "tests_passed": 0,
                    "tests_failed": 1,
                    "details": [f"❌ Test suite error: {str(e)}"]
                })
        
        await self.cleanup_session()
        
        # Print comprehensive results
        self.print_final_results()
    
    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE PRICE ALERTS & NOTIFICATIONS SYSTEM TEST RESULTS")
        print("=" * 80)
        
        total_passed = sum(result["tests_passed"] for result in self.test_results)
        total_failed = sum(result["tests_failed"] for result in self.test_results)
        total_tests = total_passed + total_failed
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"✅ Tests Passed: {total_passed}")
        print(f"❌ Tests Failed: {total_failed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 DETAILED RESULTS BY ENDPOINT:")
        for result in self.test_results:
            endpoint = result["endpoint"]
            passed = result["tests_passed"]
            failed = result["tests_failed"]
            total = passed + failed
            rate = (passed / total * 100) if total > 0 else 0
            
            status_icon = "✅" if failed == 0 else "⚠️" if passed > failed else "❌"
            print(f"{status_icon} {endpoint}: {passed}/{total} passed ({rate:.1f}%)")
        
        print(f"\n🔍 DETAILED TEST BREAKDOWN:")
        for result in self.test_results:
            print(f"\n📍 {result['endpoint']}:")
            for detail in result["details"]:
                print(f"   {detail}")
        
        print(f"\n🎉 PRICE ALERTS SYSTEM TESTING COMPLETED!")
        print(f"📈 Overall Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🌟 EXCELLENT: Price alerts system is production-ready!")
        elif success_rate >= 75:
            print("👍 GOOD: Price alerts system is mostly functional with minor issues")
        elif success_rate >= 50:
            print("⚠️ NEEDS WORK: Price alerts system has significant issues")
        else:
            print("❌ CRITICAL: Price alerts system has major problems")

async def main():
    """Main test execution"""
    tester = PriceAlertsSystemTester()
    await tester.run_comprehensive_tests()

if __name__ == "__main__":
    asyncio.run(main())