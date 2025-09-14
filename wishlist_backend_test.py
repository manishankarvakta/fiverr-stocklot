#!/usr/bin/env python3
"""
COMPREHENSIVE WISHLIST SYSTEM BACKEND TESTING
Testing all 6 wishlist API endpoints with real data scenarios
"""

import asyncio
import aiohttp
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class WishlistTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = []
        self.test_data = {
            "listings": [],
            "buy_requests": [],
            "wishlist_items": []
        }
    
    async def setup(self):
        """Setup test session and authenticate admin user"""
        self.session = aiohttp.ClientSession()
        
        # Authenticate admin user
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
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
    
    def get_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
    
    async def get_test_data(self):
        """Get existing listings and buy requests for testing"""
        try:
            # Get listings
            async with self.session.get(f"{BACKEND_URL}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    self.test_data["listings"] = data.get("listings", [])[:3]  # Use first 3 listings
                    print(f"✅ Found {len(self.test_data['listings'])} listings for testing")
                
            # Get buy requests  
            async with self.session.get(f"{BACKEND_URL}/buy-requests", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    self.test_data["buy_requests"] = data.get("buy_requests", [])[:2]  # Use first 2 buy requests
                    print(f"✅ Found {len(self.test_data['buy_requests'])} buy requests for testing")
                    
        except Exception as e:
            print(f"⚠️ Error getting test data: {e}")
    
    async def test_wishlist_add_api(self):
        """Test POST /api/wishlist/add - Add listings and buy requests to wishlist"""
        print("\n🧪 TESTING WISHLIST ADD API (POST /api/wishlist/add)")
        
        test_cases = []
        
        # Test Case 1: Add listing to wishlist (favorites)
        if self.test_data["listings"]:
            listing = self.test_data["listings"][0]
            test_cases.append({
                "name": "Add listing to favorites",
                "data": {
                    "item_id": listing["id"],
                    "item_type": "listing",
                    "category": "favorites",
                    "notes": "Premium broiler stock for my farm",
                    "price_alert_enabled": True,
                    "target_price": float(listing.get("price_per_unit", 0)) * 0.9  # 10% discount alert
                }
            })
        
        # Test Case 2: Add buy request to wishlist (watching)
        if self.test_data["buy_requests"]:
            buy_request = self.test_data["buy_requests"][0]
            test_cases.append({
                "name": "Add buy request to watching",
                "data": {
                    "item_id": buy_request["id"],
                    "item_type": "buy_request",
                    "category": "watching",
                    "notes": "Monitoring this buy request for potential supply",
                    "price_alert_enabled": False
                }
            })
        
        # Test Case 3: Add another listing (potential category)
        if len(self.test_data["listings"]) > 1:
            listing = self.test_data["listings"][1]
            test_cases.append({
                "name": "Add listing to potential",
                "data": {
                    "item_id": listing["id"],
                    "item_type": "listing",
                    "category": "potential",
                    "notes": "Considering for future purchase",
                    "price_alert_enabled": True,
                    "target_price": float(listing.get("price_per_unit", 0)) * 0.85  # 15% discount alert
                }
            })
        
        # Test Case 4: Add listing for comparison
        if len(self.test_data["listings"]) > 2:
            listing = self.test_data["listings"][2]
            test_cases.append({
                "name": "Add listing to compare",
                "data": {
                    "item_id": listing["id"],
                    "item_type": "listing",
                    "category": "compare",
                    "notes": "Comparing with other suppliers",
                    "price_alert_enabled": False
                }
            })
        
        # Execute test cases
        for test_case in test_cases:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/wishlist/add",
                    json=test_case["data"],
                    headers=self.get_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        wishlist_id = data.get("wishlist_id")
                        message = data.get("message")
                        
                        # Store for later tests
                        self.test_data["wishlist_items"].append({
                            "wishlist_id": wishlist_id,
                            "item_id": test_case["data"]["item_id"],
                            "item_type": test_case["data"]["item_type"],
                            "category": test_case["data"]["category"]
                        })
                        
                        self.test_results.append({
                            "test": f"Add to wishlist - {test_case['name']}",
                            "status": "✅ PASS",
                            "details": f"Wishlist ID: {wishlist_id}, Message: {message}"
                        })
                        print(f"  ✅ {test_case['name']}: {message}")
                    else:
                        error_text = await response.text()
                        self.test_results.append({
                            "test": f"Add to wishlist - {test_case['name']}",
                            "status": "❌ FAIL",
                            "details": f"Status: {response.status}, Error: {error_text}"
                        })
                        print(f"  ❌ {test_case['name']}: Status {response.status}")
                        
            except Exception as e:
                self.test_results.append({
                    "test": f"Add to wishlist - {test_case['name']}",
                    "status": "❌ ERROR",
                    "details": str(e)
                })
                print(f"  ❌ {test_case['name']}: Exception {e}")
        
        # Test Case 5: Authentication validation
        try:
            async with self.session.post(
                f"{BACKEND_URL}/wishlist/add",
                json={"item_id": "test", "item_type": "listing"},
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                
                if response.status == 401:
                    self.test_results.append({
                        "test": "Add to wishlist - Authentication validation",
                        "status": "✅ PASS",
                        "details": "Properly requires authentication (401)"
                    })
                    print(f"  ✅ Authentication validation: Properly requires auth")
                else:
                    self.test_results.append({
                        "test": "Add to wishlist - Authentication validation",
                        "status": "❌ FAIL",
                        "details": f"Expected 401, got {response.status}"
                    })
                    print(f"  ❌ Authentication validation: Expected 401, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Authentication validation: Exception {e}")
        
        # Test Case 6: Duplicate prevention
        if test_cases:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/wishlist/add",
                    json=test_cases[0]["data"],  # Try to add same item again
                    headers=self.get_headers()
                ) as response:
                    
                    if response.status == 400:
                        self.test_results.append({
                            "test": "Add to wishlist - Duplicate prevention",
                            "status": "✅ PASS",
                            "details": "Properly prevents duplicates (400)"
                        })
                        print(f"  ✅ Duplicate prevention: Properly prevents duplicates")
                    else:
                        error_text = await response.text()
                        self.test_results.append({
                            "test": "Add to wishlist - Duplicate prevention",
                            "status": "❌ FAIL",
                            "details": f"Expected 400, got {response.status}: {error_text}"
                        })
                        print(f"  ❌ Duplicate prevention: Expected 400, got {response.status}")
                        
            except Exception as e:
                print(f"  ❌ Duplicate prevention: Exception {e}")
        
        # Test Case 7: Non-existent item validation
        try:
            async with self.session.post(
                f"{BACKEND_URL}/wishlist/add",
                json={
                    "item_id": "non-existent-item-id",
                    "item_type": "listing",
                    "category": "favorites"
                },
                headers=self.get_headers()
            ) as response:
                
                if response.status == 400:
                    self.test_results.append({
                        "test": "Add to wishlist - Non-existent item validation",
                        "status": "✅ PASS",
                        "details": "Properly rejects non-existent items (400)"
                    })
                    print(f"  ✅ Non-existent item validation: Properly rejects invalid items")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Add to wishlist - Non-existent item validation",
                        "status": "❌ FAIL",
                        "details": f"Expected 400, got {response.status}: {error_text}"
                    })
                    print(f"  ❌ Non-existent item validation: Expected 400, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Non-existent item validation: Exception {e}")
    
    async def test_wishlist_get_api(self):
        """Test GET /api/wishlist - Retrieve user's wishlist with filtering"""
        print("\n🧪 TESTING WISHLIST GET API (GET /api/wishlist)")
        
        # Test Case 1: Get all wishlist items
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    summary = data.get("summary", {})
                    
                    self.test_results.append({
                        "test": "Get wishlist - All items",
                        "status": "✅ PASS",
                        "details": f"Retrieved {len(items)} items, Summary: {summary}"
                    })
                    print(f"  ✅ Get all items: {len(items)} items retrieved")
                    print(f"    📊 Summary: {summary}")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Get wishlist - All items",
                        "status": "❌ FAIL",
                        "details": f"Status: {response.status}, Error: {error_text}"
                    })
                    print(f"  ❌ Get all items: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Get all items: Exception {e}")
        
        # Test Case 2: Filter by category (favorites)
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist?category=favorites",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    
                    # Verify all items are favorites
                    all_favorites = all(item.get("category") == "favorites" for item in items)
                    
                    if all_favorites:
                        self.test_results.append({
                            "test": "Get wishlist - Filter by favorites",
                            "status": "✅ PASS",
                            "details": f"Retrieved {len(items)} favorites items"
                        })
                        print(f"  ✅ Filter by favorites: {len(items)} items")
                    else:
                        self.test_results.append({
                            "test": "Get wishlist - Filter by favorites",
                            "status": "❌ FAIL",
                            "details": "Some items are not favorites"
                        })
                        print(f"  ❌ Filter by favorites: Filtering not working correctly")
                else:
                    error_text = await response.text()
                    print(f"  ❌ Filter by favorites: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Filter by favorites: Exception {e}")
        
        # Test Case 3: Filter by item type (listing)
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist?item_type=listing",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    
                    # Verify all items are listings
                    all_listings = all(item.get("item_type") == "listing" for item in items)
                    
                    if all_listings:
                        self.test_results.append({
                            "test": "Get wishlist - Filter by listing type",
                            "status": "✅ PASS",
                            "details": f"Retrieved {len(items)} listing items"
                        })
                        print(f"  ✅ Filter by listing type: {len(items)} items")
                    else:
                        self.test_results.append({
                            "test": "Get wishlist - Filter by listing type",
                            "status": "❌ FAIL",
                            "details": "Some items are not listings"
                        })
                        print(f"  ❌ Filter by listing type: Filtering not working correctly")
                else:
                    error_text = await response.text()
                    print(f"  ❌ Filter by listing type: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Filter by listing type: Exception {e}")
        
        # Test Case 4: Filter by item type (buy_request)
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist?item_type=buy_request",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    
                    # Verify all items are buy requests
                    all_buy_requests = all(item.get("item_type") == "buy_request" for item in items)
                    
                    if all_buy_requests:
                        self.test_results.append({
                            "test": "Get wishlist - Filter by buy_request type",
                            "status": "✅ PASS",
                            "details": f"Retrieved {len(items)} buy_request items"
                        })
                        print(f"  ✅ Filter by buy_request type: {len(items)} items")
                    else:
                        self.test_results.append({
                            "test": "Get wishlist - Filter by buy_request type",
                            "status": "❌ FAIL",
                            "details": "Some items are not buy_requests"
                        })
                        print(f"  ❌ Filter by buy_request type: Filtering not working correctly")
                else:
                    error_text = await response.text()
                    print(f"  ❌ Filter by buy_request type: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Filter by buy_request type: Exception {e}")
        
        # Test Case 5: Authentication validation
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist",
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                
                if response.status == 401:
                    self.test_results.append({
                        "test": "Get wishlist - Authentication validation",
                        "status": "✅ PASS",
                        "details": "Properly requires authentication (401)"
                    })
                    print(f"  ✅ Authentication validation: Properly requires auth")
                else:
                    self.test_results.append({
                        "test": "Get wishlist - Authentication validation",
                        "status": "❌ FAIL",
                        "details": f"Expected 401, got {response.status}"
                    })
                    print(f"  ❌ Authentication validation: Expected 401, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Authentication validation: Exception {e}")
    
    async def test_wishlist_check_api(self):
        """Test GET /api/wishlist/check/{item_id} - Check if items are wishlisted"""
        print("\n🧪 TESTING WISHLIST CHECK API (GET /api/wishlist/check/{item_id})")
        
        # Test Case 1: Check wishlisted item
        if self.test_data["wishlist_items"]:
            wishlist_item = self.test_data["wishlist_items"][0]
            try:
                async with self.session.get(
                    f"{BACKEND_URL}/wishlist/check/{wishlist_item['item_id']}?item_type={wishlist_item['item_type']}",
                    headers=self.get_headers()
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        is_wishlisted = data.get("is_wishlisted", False)
                        
                        if is_wishlisted:
                            self.test_results.append({
                                "test": "Check wishlist - Wishlisted item",
                                "status": "✅ PASS",
                                "details": "Correctly identifies wishlisted item"
                            })
                            print(f"  ✅ Check wishlisted item: Correctly identified as wishlisted")
                        else:
                            self.test_results.append({
                                "test": "Check wishlist - Wishlisted item",
                                "status": "❌ FAIL",
                                "details": "Failed to identify wishlisted item"
                            })
                            print(f"  ❌ Check wishlisted item: Not identified as wishlisted")
                    else:
                        error_text = await response.text()
                        self.test_results.append({
                            "test": "Check wishlist - Wishlisted item",
                            "status": "❌ FAIL",
                            "details": f"Status: {response.status}, Error: {error_text}"
                        })
                        print(f"  ❌ Check wishlisted item: Status {response.status}")
                        
            except Exception as e:
                print(f"  ❌ Check wishlisted item: Exception {e}")
        
        # Test Case 2: Check non-wishlisted item
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist/check/non-existent-item-id?item_type=listing",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    is_wishlisted = data.get("is_wishlisted", True)  # Default to True to test
                    
                    if not is_wishlisted:
                        self.test_results.append({
                            "test": "Check wishlist - Non-wishlisted item",
                            "status": "✅ PASS",
                            "details": "Correctly identifies non-wishlisted item"
                        })
                        print(f"  ✅ Check non-wishlisted item: Correctly identified as not wishlisted")
                    else:
                        self.test_results.append({
                            "test": "Check wishlist - Non-wishlisted item",
                            "status": "❌ FAIL",
                            "details": "Incorrectly identifies non-wishlisted item as wishlisted"
                        })
                        print(f"  ❌ Check non-wishlisted item: Incorrectly identified as wishlisted")
                else:
                    error_text = await response.text()
                    print(f"  ❌ Check non-wishlisted item: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Check non-wishlisted item: Exception {e}")
        
        # Test Case 3: Non-authenticated user handling
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist/check/test-item?item_type=listing",
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    is_wishlisted = data.get("is_wishlisted", True)  # Should be False for non-auth
                    
                    if not is_wishlisted:
                        self.test_results.append({
                            "test": "Check wishlist - Non-authenticated user",
                            "status": "✅ PASS",
                            "details": "Returns false for non-authenticated users"
                        })
                        print(f"  ✅ Non-authenticated user: Returns false correctly")
                    else:
                        self.test_results.append({
                            "test": "Check wishlist - Non-authenticated user",
                            "status": "❌ FAIL",
                            "details": "Should return false for non-authenticated users"
                        })
                        print(f"  ❌ Non-authenticated user: Should return false")
                else:
                    error_text = await response.text()
                    print(f"  ❌ Non-authenticated user: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Non-authenticated user: Exception {e}")
    
    async def test_wishlist_update_api(self):
        """Test PUT /api/wishlist/{wishlist_id} - Update wishlist items"""
        print("\n🧪 TESTING WISHLIST UPDATE API (PUT /api/wishlist/{wishlist_id})")
        
        if not self.test_data["wishlist_items"]:
            print("  ⚠️ No wishlist items available for update testing")
            return
        
        wishlist_item = self.test_data["wishlist_items"][0]
        wishlist_id = wishlist_item["wishlist_id"]
        
        # Test Case 1: Update category and notes
        try:
            update_data = {
                "category": "compare",
                "notes": "Updated notes - comparing with other options",
                "price_alert_enabled": True,
                "target_price": 50.0
            }
            
            async with self.session.put(
                f"{BACKEND_URL}/wishlist/{wishlist_id}",
                json=update_data,
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    message = data.get("message", "")
                    
                    self.test_results.append({
                        "test": "Update wishlist - Category and notes",
                        "status": "✅ PASS",
                        "details": f"Message: {message}"
                    })
                    print(f"  ✅ Update category and notes: {message}")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Update wishlist - Category and notes",
                        "status": "❌ FAIL",
                        "details": f"Status: {response.status}, Error: {error_text}"
                    })
                    print(f"  ❌ Update category and notes: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Update category and notes: Exception {e}")
        
        # Test Case 2: Partial update (only price alert)
        try:
            update_data = {
                "price_alert_enabled": False
            }
            
            async with self.session.put(
                f"{BACKEND_URL}/wishlist/{wishlist_id}",
                json=update_data,
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    message = data.get("message", "")
                    
                    self.test_results.append({
                        "test": "Update wishlist - Partial update",
                        "status": "✅ PASS",
                        "details": f"Message: {message}"
                    })
                    print(f"  ✅ Partial update: {message}")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Update wishlist - Partial update",
                        "status": "❌ FAIL",
                        "details": f"Status: {response.status}, Error: {error_text}"
                    })
                    print(f"  ❌ Partial update: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Partial update: Exception {e}")
        
        # Test Case 3: User authorization (try to update non-existent item)
        try:
            update_data = {
                "category": "favorites"
            }
            
            async with self.session.put(
                f"{BACKEND_URL}/wishlist/non-existent-wishlist-id",
                json=update_data,
                headers=self.get_headers()
            ) as response:
                
                if response.status == 400:
                    self.test_results.append({
                        "test": "Update wishlist - Non-existent item",
                        "status": "✅ PASS",
                        "details": "Properly handles non-existent wishlist items"
                    })
                    print(f"  ✅ Non-existent item: Properly handled")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Update wishlist - Non-existent item",
                        "status": "❌ FAIL",
                        "details": f"Expected 400, got {response.status}: {error_text}"
                    })
                    print(f"  ❌ Non-existent item: Expected 400, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Non-existent item: Exception {e}")
        
        # Test Case 4: Authentication validation
        try:
            async with self.session.put(
                f"{BACKEND_URL}/wishlist/{wishlist_id}",
                json={"category": "favorites"},
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                
                if response.status == 401:
                    self.test_results.append({
                        "test": "Update wishlist - Authentication validation",
                        "status": "✅ PASS",
                        "details": "Properly requires authentication (401)"
                    })
                    print(f"  ✅ Authentication validation: Properly requires auth")
                else:
                    self.test_results.append({
                        "test": "Update wishlist - Authentication validation",
                        "status": "❌ FAIL",
                        "details": f"Expected 401, got {response.status}"
                    })
                    print(f"  ❌ Authentication validation: Expected 401, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Authentication validation: Exception {e}")
    
    async def test_wishlist_stats_api(self):
        """Test GET /api/wishlist/stats - Get wishlist statistics"""
        print("\n🧪 TESTING WISHLIST STATS API (GET /api/wishlist/stats)")
        
        # Test Case 1: Get wishlist statistics
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist/stats",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify expected fields
                    expected_fields = ["total_items", "category_breakdown", "type_breakdown", "price_alerts_active"]
                    has_all_fields = all(field in data for field in expected_fields)
                    
                    if has_all_fields:
                        self.test_results.append({
                            "test": "Wishlist stats - Get statistics",
                            "status": "✅ PASS",
                            "details": f"Stats: {data}"
                        })
                        print(f"  ✅ Get statistics: All fields present")
                        print(f"    📊 Total items: {data.get('total_items', 0)}")
                        print(f"    📊 Category breakdown: {data.get('category_breakdown', {})}")
                        print(f"    📊 Type breakdown: {data.get('type_breakdown', {})}")
                        print(f"    📊 Price alerts: {data.get('price_alerts_active', 0)}")
                    else:
                        missing_fields = [field for field in expected_fields if field not in data]
                        self.test_results.append({
                            "test": "Wishlist stats - Get statistics",
                            "status": "❌ FAIL",
                            "details": f"Missing fields: {missing_fields}"
                        })
                        print(f"  ❌ Get statistics: Missing fields {missing_fields}")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Wishlist stats - Get statistics",
                        "status": "❌ FAIL",
                        "details": f"Status: {response.status}, Error: {error_text}"
                    })
                    print(f"  ❌ Get statistics: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Get statistics: Exception {e}")
        
        # Test Case 2: Authentication validation
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist/stats",
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                
                if response.status == 401:
                    self.test_results.append({
                        "test": "Wishlist stats - Authentication validation",
                        "status": "✅ PASS",
                        "details": "Properly requires authentication (401)"
                    })
                    print(f"  ✅ Authentication validation: Properly requires auth")
                else:
                    self.test_results.append({
                        "test": "Wishlist stats - Authentication validation",
                        "status": "❌ FAIL",
                        "details": f"Expected 401, got {response.status}"
                    })
                    print(f"  ❌ Authentication validation: Expected 401, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Authentication validation: Exception {e}")
    
    async def test_wishlist_remove_api(self):
        """Test DELETE /api/wishlist/remove/{item_id} - Remove items from wishlist"""
        print("\n🧪 TESTING WISHLIST REMOVE API (DELETE /api/wishlist/remove/{item_id})")
        
        if not self.test_data["wishlist_items"]:
            print("  ⚠️ No wishlist items available for removal testing")
            return
        
        # Test Case 1: Remove existing wishlist item
        wishlist_item = self.test_data["wishlist_items"][0]
        try:
            async with self.session.delete(
                f"{BACKEND_URL}/wishlist/remove/{wishlist_item['item_id']}?item_type={wishlist_item['item_type']}",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    message = data.get("message", "")
                    
                    self.test_results.append({
                        "test": "Remove wishlist - Existing item",
                        "status": "✅ PASS",
                        "details": f"Message: {message}"
                    })
                    print(f"  ✅ Remove existing item: {message}")
                    
                    # Remove from test data
                    self.test_data["wishlist_items"].remove(wishlist_item)
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Remove wishlist - Existing item",
                        "status": "❌ FAIL",
                        "details": f"Status: {response.status}, Error: {error_text}"
                    })
                    print(f"  ❌ Remove existing item: Status {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Remove existing item: Exception {e}")
        
        # Test Case 2: Remove non-existent item
        try:
            async with self.session.delete(
                f"{BACKEND_URL}/wishlist/remove/non-existent-item-id?item_type=listing",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 400:
                    self.test_results.append({
                        "test": "Remove wishlist - Non-existent item",
                        "status": "✅ PASS",
                        "details": "Properly handles non-existent items"
                    })
                    print(f"  ✅ Remove non-existent item: Properly handled")
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Remove wishlist - Non-existent item",
                        "status": "❌ FAIL",
                        "details": f"Expected 400, got {response.status}: {error_text}"
                    })
                    print(f"  ❌ Remove non-existent item: Expected 400, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Remove non-existent item: Exception {e}")
        
        # Test Case 3: Authentication validation
        try:
            async with self.session.delete(
                f"{BACKEND_URL}/wishlist/remove/test-item?item_type=listing",
                headers={"Content-Type": "application/json"}  # No auth header
            ) as response:
                
                if response.status == 401:
                    self.test_results.append({
                        "test": "Remove wishlist - Authentication validation",
                        "status": "✅ PASS",
                        "details": "Properly requires authentication (401)"
                    })
                    print(f"  ✅ Authentication validation: Properly requires auth")
                else:
                    self.test_results.append({
                        "test": "Remove wishlist - Authentication validation",
                        "status": "❌ FAIL",
                        "details": f"Expected 401, got {response.status}"
                    })
                    print(f"  ❌ Authentication validation: Expected 401, got {response.status}")
                    
        except Exception as e:
            print(f"  ❌ Authentication validation: Exception {e}")
    
    async def test_database_integration(self):
        """Test database integration and data persistence"""
        print("\n🧪 TESTING DATABASE INTEGRATION")
        
        # Test Case 1: Verify wishlist_items collection exists and has data
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    
                    if items:
                        # Check data structure
                        first_item = items[0]
                        required_fields = ["id", "item_id", "item_type", "category", "added_at"]
                        has_required_fields = all(field in first_item for field in required_fields)
                        
                        if has_required_fields:
                            self.test_results.append({
                                "test": "Database integration - Data structure",
                                "status": "✅ PASS",
                                "details": "Wishlist items have proper structure"
                            })
                            print(f"  ✅ Data structure: Proper wishlist item structure")
                        else:
                            missing_fields = [field for field in required_fields if field not in first_item]
                            self.test_results.append({
                                "test": "Database integration - Data structure",
                                "status": "❌ FAIL",
                                "details": f"Missing fields: {missing_fields}"
                            })
                            print(f"  ❌ Data structure: Missing fields {missing_fields}")
                    else:
                        self.test_results.append({
                            "test": "Database integration - Data persistence",
                            "status": "⚠️ WARNING",
                            "details": "No wishlist items found (may be expected)"
                        })
                        print(f"  ⚠️ Data persistence: No items found")
                        
        except Exception as e:
            print(f"  ❌ Database integration: Exception {e}")
        
        # Test Case 2: Cross-collection data fetching (verify item data is included)
        try:
            async with self.session.get(
                f"{BACKEND_URL}/wishlist",
                headers=self.get_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    
                    if items:
                        # Check if items have current_data (cross-collection fetch)
                        items_with_current_data = [item for item in items if item.get("current_data")]
                        
                        if items_with_current_data:
                            self.test_results.append({
                                "test": "Database integration - Cross-collection fetch",
                                "status": "✅ PASS",
                                "details": f"{len(items_with_current_data)} items have current data"
                            })
                            print(f"  ✅ Cross-collection fetch: {len(items_with_current_data)} items with current data")
                        else:
                            self.test_results.append({
                                "test": "Database integration - Cross-collection fetch",
                                "status": "❌ FAIL",
                                "details": "No items have current data from cross-collection fetch"
                            })
                            print(f"  ❌ Cross-collection fetch: No current data found")
                            
        except Exception as e:
            print(f"  ❌ Cross-collection fetch: Exception {e}")
    
    async def run_all_tests(self):
        """Run all wishlist API tests"""
        print("🚀 STARTING COMPREHENSIVE WISHLIST SYSTEM TESTING")
        print("=" * 60)
        
        # Setup
        if not await self.setup():
            print("❌ Setup failed, aborting tests")
            return
        
        # Get test data
        await self.get_test_data()
        
        # Run all tests in order
        await self.test_wishlist_add_api()
        await self.test_wishlist_get_api()
        await self.test_wishlist_check_api()
        await self.test_wishlist_update_api()
        await self.test_wishlist_stats_api()
        await self.test_wishlist_remove_api()  # Remove last to clean up
        await self.test_database_integration()
        
        # Print summary
        self.print_test_summary()
        
        # Cleanup
        await self.cleanup()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE WISHLIST SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if "✅ PASS" in r["status"]])
        failed_tests = len([r for r in self.test_results if "❌ FAIL" in r["status"]])
        error_tests = len([r for r in self.test_results if "❌ ERROR" in r["status"]])
        warning_tests = len([r for r in self.test_results if "⚠️ WARNING" in r["status"]])
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   ❌ Errors: {error_tests}")
        print(f"   ⚠️ Warnings: {warning_tests}")
        print(f"   🎯 Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 DETAILED RESULTS:")
        
        # Group by API endpoint
        endpoints = {
            "ADD API": [r for r in self.test_results if "Add to wishlist" in r["test"]],
            "GET API": [r for r in self.test_results if "Get wishlist" in r["test"]],
            "CHECK API": [r for r in self.test_results if "Check wishlist" in r["test"]],
            "UPDATE API": [r for r in self.test_results if "Update wishlist" in r["test"]],
            "STATS API": [r for r in self.test_results if "Wishlist stats" in r["test"]],
            "REMOVE API": [r for r in self.test_results if "Remove wishlist" in r["test"]],
            "DATABASE": [r for r in self.test_results if "Database integration" in r["test"]]
        }
        
        for endpoint, results in endpoints.items():
            if results:
                endpoint_passed = len([r for r in results if "✅ PASS" in r["status"]])
                endpoint_total = len(results)
                endpoint_rate = (endpoint_passed / endpoint_total * 100) if endpoint_total > 0 else 0
                
                print(f"\n   🔸 {endpoint} ({endpoint_passed}/{endpoint_total} - {endpoint_rate:.1f}%):")
                for result in results:
                    print(f"      {result['status']}: {result['test']}")
                    if "❌" in result['status'] or "⚠️" in result['status']:
                        print(f"         Details: {result['details']}")
        
        print(f"\n🎉 WISHLIST SYSTEM TESTING COMPLETED!")
        
        if success_rate >= 90:
            print("🌟 EXCELLENT: Wishlist system is production-ready!")
        elif success_rate >= 75:
            print("✅ GOOD: Wishlist system is mostly functional with minor issues")
        elif success_rate >= 50:
            print("⚠️ NEEDS WORK: Wishlist system has significant issues")
        else:
            print("❌ CRITICAL: Wishlist system has major problems")

async def main():
    """Main test execution"""
    tester = WishlistTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())