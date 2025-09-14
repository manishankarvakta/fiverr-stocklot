#!/usr/bin/env python3
"""
Cart Integration Testing - Additional Edge Cases and Integration Scenarios
Testing cart functionality with rate limiting, multiple items, and checkout integration
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timezone
import uuid

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test user credentials
TEST_USER_EMAIL = "admin@stocklot.co.za"
TEST_USER_PASSWORD = "admin123"

class CartIntegrationTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_listings = []
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()

    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()

    async def authenticate(self):
        """Authenticate test user"""
        try:
            # Use email as token (backend's simple auth mechanism)
            self.auth_token = TEST_USER_EMAIL
            print(f"✅ Authentication successful")
            return True
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False

    async def get_test_listings(self):
        """Get multiple test listings for cart operations"""
        try:
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    if listings:
                        # Get up to 3 active listings
                        active_listings = [l for l in listings if l.get("status") == "active"]
                        self.test_listings = active_listings[:3] if active_listings else listings[:3]
                        print(f"✅ Found {len(self.test_listings)} test listings")
                        for i, listing in enumerate(self.test_listings):
                            print(f"   {i+1}. {listing['title']} (ID: {listing['id']})")
                        return True
                    else:
                        print("❌ No listings found in marketplace")
                        return False
                else:
                    print(f"❌ Failed to fetch listings: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error fetching listings: {e}")
            return False

    def get_auth_headers(self):
        """Get authentication headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}

    async def test_rate_limiting_cart_operations(self):
        """Test 1: Rate limiting on cart operations"""
        print("\n🧪 TEST 1: Rate Limiting on Cart Operations")
        self.results["total_tests"] += 1
        
        try:
            # Clear cart first
            await self.clear_cart()
            
            # Try to add items rapidly to test rate limiting
            successful_requests = 0
            rate_limited_requests = 0
            
            for i in range(8):  # Try 8 requests (rate limit is 5 per 5 minutes)
                cart_data = {
                    "listing_id": self.test_listings[0]["id"],
                    "quantity": 1,
                    "shipping_option": "standard"
                }
                
                async with self.session.post(
                    f"{API_BASE}/cart/add",
                    json=cart_data,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        successful_requests += 1
                    elif response.status == 429:  # Rate limited
                        rate_limited_requests += 1
                        print(f"   Request {i+1}: Rate limited (429)")
                    else:
                        print(f"   Request {i+1}: Unexpected status {response.status}")
                
                await asyncio.sleep(0.1)  # Small delay between requests
            
            if successful_requests >= 5 and rate_limited_requests > 0:
                print(f"✅ PASS: Rate limiting working correctly")
                print(f"   Successful requests: {successful_requests}")
                print(f"   Rate limited requests: {rate_limited_requests}")
                self.results["passed"] += 1
                return True
            else:
                print(f"❌ FAIL: Rate limiting not working as expected")
                print(f"   Successful requests: {successful_requests}")
                print(f"   Rate limited requests: {rate_limited_requests}")
                self.results["failed"] += 1
                return False
                
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Rate limiting test exception: {e}")
            return False

    async def test_multiple_items_cart(self):
        """Test 2: Adding multiple different items to cart"""
        print("\n🧪 TEST 2: Multiple Items Cart Management")
        self.results["total_tests"] += 1
        
        try:
            # Clear cart first
            await self.clear_cart()
            
            # Add multiple different items
            items_added = 0
            for i, listing in enumerate(self.test_listings):
                cart_data = {
                    "listing_id": listing["id"],
                    "quantity": i + 1,  # Different quantities
                    "shipping_option": "standard" if i % 2 == 0 else "express"
                }
                
                async with self.session.post(
                    f"{API_BASE}/cart/add",
                    json=cart_data,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status == 200:
                        items_added += 1
                        print(f"   Added item {i+1}: {listing['title']} (Qty: {i+1})")
                    else:
                        text = await response.text()
                        print(f"   Failed to add item {i+1}: {response.status} - {text}")
                
                await asyncio.sleep(0.5)  # Delay to avoid rate limiting
            
            # Get cart and verify
            async with self.session.get(
                f"{API_BASE}/cart",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    total = data.get("total", 0)
                    item_count = data.get("item_count", 0)
                    
                    if item_count == items_added and item_count > 1:
                        print(f"✅ PASS: Multiple items cart management successful")
                        print(f"   Items in cart: {item_count}")
                        print(f"   Total amount: R{total}")
                        self.results["passed"] += 1
                        return True
                    else:
                        print(f"❌ FAIL: Expected {items_added} items, got {item_count}")
                        self.results["failed"] += 1
                        return False
                else:
                    text = await response.text()
                    print(f"❌ FAIL: Failed to get cart: {response.status} - {text}")
                    self.results["failed"] += 1
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Multiple items test exception: {e}")
            return False

    async def test_cart_update_operations(self):
        """Test 3: Cart update operations (quantity changes)"""
        print("\n🧪 TEST 3: Cart Update Operations")
        self.results["total_tests"] += 1
        
        try:
            # Clear cart and add an item
            await self.clear_cart()
            
            cart_data = {
                "listing_id": self.test_listings[0]["id"],
                "quantity": 2,
                "shipping_option": "standard"
            }
            
            async with self.session.post(
                f"{API_BASE}/cart/add",
                json=cart_data,
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status != 200:
                    print(f"❌ FAIL: Failed to add initial item")
                    self.results["failed"] += 1
                    return False
            
            # Get cart to find item ID
            async with self.session.get(
                f"{API_BASE}/cart",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    if items:
                        item_id = items[0].get("id")
                        original_quantity = items[0].get("quantity")
                        
                        # Update quantity
                        update_data = {
                            "item_id": item_id,
                            "quantity": 5
                        }
                        
                        async with self.session.put(
                            f"{API_BASE}/cart/update",
                            json=update_data,
                            headers=self.get_auth_headers()
                        ) as update_response:
                            
                            if update_response.status == 200:
                                update_result = await update_response.json()
                                print(f"✅ PASS: Cart update successful")
                                print(f"   Original quantity: {original_quantity}")
                                print(f"   Updated quantity: 5")
                                print(f"   Cart item count: {update_result.get('cart_item_count')}")
                                self.results["passed"] += 1
                                return True
                            else:
                                text = await update_response.text()
                                print(f"❌ FAIL: Cart update failed: {update_response.status} - {text}")
                                self.results["failed"] += 1
                                return False
                    else:
                        print(f"❌ FAIL: No items in cart to update")
                        self.results["failed"] += 1
                        return False
                else:
                    print(f"❌ FAIL: Failed to get cart for update")
                    self.results["failed"] += 1
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Cart update test exception: {e}")
            return False

    async def test_cart_item_removal(self):
        """Test 4: Cart item removal"""
        print("\n🧪 TEST 4: Cart Item Removal")
        self.results["total_tests"] += 1
        
        try:
            # Clear cart and add items
            await self.clear_cart()
            
            # Add two items
            for i in range(2):
                cart_data = {
                    "listing_id": self.test_listings[i]["id"],
                    "quantity": 1,
                    "shipping_option": "standard"
                }
                
                async with self.session.post(
                    f"{API_BASE}/cart/add",
                    json=cart_data,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status != 200:
                        print(f"❌ FAIL: Failed to add item {i+1}")
                        self.results["failed"] += 1
                        return False
                
                await asyncio.sleep(0.5)  # Avoid rate limiting
            
            # Get cart to find item IDs
            async with self.session.get(
                f"{API_BASE}/cart",
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    original_count = data.get("item_count", 0)
                    
                    if len(items) >= 1:
                        item_to_remove = items[0].get("id")
                        
                        # Remove first item
                        async with self.session.delete(
                            f"{API_BASE}/cart/item/{item_to_remove}",
                            headers=self.get_auth_headers()
                        ) as remove_response:
                            
                            if remove_response.status == 200:
                                # Verify removal
                                async with self.session.get(
                                    f"{API_BASE}/cart",
                                    headers=self.get_auth_headers()
                                ) as verify_response:
                                    
                                    if verify_response.status == 200:
                                        verify_data = await verify_response.json()
                                        new_count = verify_data.get("item_count", 0)
                                        
                                        if new_count == original_count - 1:
                                            print(f"✅ PASS: Cart item removal successful")
                                            print(f"   Original count: {original_count}")
                                            print(f"   New count: {new_count}")
                                            self.results["passed"] += 1
                                            return True
                                        else:
                                            print(f"❌ FAIL: Item count mismatch after removal")
                                            self.results["failed"] += 1
                                            return False
                                    else:
                                        print(f"❌ FAIL: Failed to verify removal")
                                        self.results["failed"] += 1
                                        return False
                            else:
                                text = await remove_response.text()
                                print(f"❌ FAIL: Item removal failed: {remove_response.status} - {text}")
                                self.results["failed"] += 1
                                return False
                    else:
                        print(f"❌ FAIL: No items in cart to remove")
                        self.results["failed"] += 1
                        return False
                else:
                    print(f"❌ FAIL: Failed to get cart for removal test")
                    self.results["failed"] += 1
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Cart removal test exception: {e}")
            return False

    async def test_checkout_integration(self):
        """Test 5: Cart to checkout integration"""
        print("\n🧪 TEST 5: Cart to Checkout Integration")
        self.results["total_tests"] += 1
        
        try:
            # Clear cart and add items
            await self.clear_cart()
            
            # Add items to cart
            for i in range(2):
                cart_data = {
                    "listing_id": self.test_listings[i]["id"],
                    "quantity": 1,
                    "shipping_option": "standard"
                }
                
                async with self.session.post(
                    f"{API_BASE}/cart/add",
                    json=cart_data,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    if response.status != 200:
                        print(f"❌ FAIL: Failed to add item {i+1} for checkout test")
                        self.results["failed"] += 1
                        return False
                
                await asyncio.sleep(0.5)  # Avoid rate limiting
            
            # Create checkout session
            checkout_data = {
                "shipping_address": {
                    "name": "Test User",
                    "address": "123 Test Street",
                    "city": "Cape Town",
                    "postal_code": "8001",
                    "country": "South Africa"
                },
                "payment_method": "paystack"
            }
            
            async with self.session.post(
                f"{API_BASE}/checkout/create",
                json=checkout_data,
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    checkout_session_id = data.get("checkout_session_id")
                    total_amount = data.get("total_amount")
                    items = data.get("items", [])
                    
                    if checkout_session_id and len(items) > 0:
                        print(f"✅ PASS: Checkout integration successful")
                        print(f"   Checkout session ID: {checkout_session_id}")
                        print(f"   Total amount: R{total_amount}")
                        print(f"   Items in checkout: {len(items)}")
                        self.results["passed"] += 1
                        return True
                    else:
                        print(f"❌ FAIL: Checkout session creation incomplete")
                        self.results["failed"] += 1
                        return False
                else:
                    text = await response.text()
                    print(f"❌ FAIL: Checkout creation failed: {response.status} - {text}")
                    self.results["failed"] += 1
                    self.results["errors"].append(f"Checkout integration test: {response.status} - {text}")
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Checkout integration test exception: {e}")
            return False

    async def clear_cart(self):
        """Helper method to clear cart"""
        try:
            # Get current cart
            async with self.session.get(
                f"{API_BASE}/cart",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    
                    # Remove each item
                    for item in items:
                        item_id = item.get("id")
                        if item_id:
                            async with self.session.delete(
                                f"{API_BASE}/cart/item/{item_id}",
                                headers=self.get_auth_headers()
                            ) as del_response:
                                pass  # Ignore response
        except:
            pass  # Ignore errors in cleanup

    async def run_all_tests(self):
        """Run all cart integration tests"""
        print("🛒 CART INTEGRATION TESTING - ADDITIONAL SCENARIOS")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Testing cart integration with rate limiting, multiple items, and checkout")
        print("=" * 80)
        
        # Setup
        await self.setup_session()
        
        # Authenticate
        if not await self.authenticate():
            print("❌ CRITICAL: Authentication failed - cannot proceed with tests")
            await self.cleanup_session()
            return
        
        # Get test listings
        if not await self.get_test_listings():
            print("❌ CRITICAL: No test listings available - cannot proceed with tests")
            await self.cleanup_session()
            return
        
        # Run all tests
        tests = [
            self.test_rate_limiting_cart_operations,
            self.test_multiple_items_cart,
            self.test_cart_update_operations,
            self.test_cart_item_removal,
            self.test_checkout_integration
        ]
        
        for test in tests:
            await test()
            await asyncio.sleep(1)  # Longer delay between tests to avoid rate limiting
        
        # Cleanup
        await self.cleanup_session()
        
        # Print results
        self.print_results()

    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("🛒 CART INTEGRATION TESTING RESULTS")
        print("=" * 80)
        
        success_rate = (self.results["passed"] / self.results["total_tests"]) * 100 if self.results["total_tests"] > 0 else 0
        
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if self.results["errors"]:
            print(f"\n🚨 ERRORS ENCOUNTERED:")
            for i, error in enumerate(self.results["errors"], 1):
                print(f"   {i}. {error}")
        
        print("\n" + "=" * 80)
        
        if success_rate >= 80:
            print("🎉 CART INTEGRATION: EXCELLENT - Most tests passed!")
        elif success_rate >= 60:
            print("⚠️  CART INTEGRATION: GOOD - Some issues need attention")
        else:
            print("🚨 CART INTEGRATION: NEEDS WORK - Multiple critical issues found")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    tester = CartIntegrationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())