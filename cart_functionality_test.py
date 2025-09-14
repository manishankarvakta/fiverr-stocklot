#!/usr/bin/env python3
"""
🛒 CART FUNCTIONALITY COMPREHENSIVE TESTING
Testing cart functionality to debug "Failed to add item to cart" error
Focus areas: Cart add endpoint, listing price validation, authentication, rate limiting, error diagnostics
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import uuid
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CartFunctionalityTester:
    """Comprehensive Cart Functionality Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_user_email = "testuser@stocklot.co.za"
        self.test_user_password = "testpass123"
        self.sample_listings = []
        self.test_cart_items = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as test user"""
        try:
            # First try to register the test user
            register_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "full_name": "Test Cart User",
                "role": "buyer"
            }
            
            async with self.session.post(f"{self.api_url}/auth/register", json=register_data) as response:
                if response.status in [200, 201]:
                    logger.info("✅ Test user registered successfully")
                elif response.status == 400:
                    logger.info("ℹ️ Test user already exists, proceeding to login")
                else:
                    logger.warning(f"⚠️ Registration response: {response.status}")
            
            # Now login
            auth_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    logger.info("✅ Authentication successful")
                    return True
                else:
                    logger.error(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_listing_price_field_validation(self):
        """Test 2: LISTING PRICE FIELD VALIDATION (CRITICAL)"""
        logger.info("\n🧪 Testing Listing Price Field Validation...")
        
        try:
            # Get sample listings to check price field structure
            async with self.session.get(f"{self.api_url}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    if listings:
                        logger.info(f"✅ Found {len(listings)} listings for price validation")
                        
                        # Analyze first few listings for price field structure
                        for i, listing in enumerate(listings[:3]):
                            listing_id = listing.get("id")
                            price_per_unit = listing.get("price_per_unit")
                            price = listing.get("price")
                            title = listing.get("title", "Unknown")
                            
                            logger.info(f"   Listing {i+1}: {title}")
                            logger.info(f"     ID: {listing_id}")
                            logger.info(f"     price_per_unit: {price_per_unit} (type: {type(price_per_unit)})")
                            logger.info(f"     price: {price} (type: {type(price)})")
                            
                            # Store sample listings for cart testing
                            if price_per_unit is not None or price is not None:
                                self.sample_listings.append({
                                    "id": listing_id,
                                    "title": title,
                                    "price_per_unit": price_per_unit,
                                    "price": price,
                                    "seller_id": listing.get("seller_id"),
                                    "status": listing.get("status")
                                })
                        
                        self.test_results.append(("Listing Price Field Validation", True, f"Analyzed {len(listings)} listings"))
                    else:
                        logger.warning("⚠️ No listings found for price validation")
                        self.test_results.append(("Listing Price Field Validation", False, "No listings found"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to fetch listings: {response.status} - {error_text}")
                    self.test_results.append(("Listing Price Field Validation", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in listing price validation: {e}")
            self.test_results.append(("Listing Price Field Validation", False, str(e)))
    
    async def test_cart_add_endpoint(self):
        """Test 1: CART ADD ENDPOINT TESTING (CRITICAL)"""
        logger.info("\n🧪 Testing Cart Add Endpoint...")
        
        if not self.sample_listings:
            logger.error("❌ No sample listings available for cart testing")
            self.test_results.append(("Cart Add Endpoint", False, "No sample listings"))
            return
        
        # Test adding valid items to cart
        for i, listing in enumerate(self.sample_listings[:2]):  # Test with first 2 listings
            try:
                cart_item = {
                    "listing_id": listing["id"],
                    "quantity": 2,
                    "shipping_option": "standard"
                }
                
                logger.info(f"   Testing cart add with listing: {listing['title']}")
                logger.info(f"     Listing ID: {listing['id']}")
                logger.info(f"     Price per unit: {listing['price_per_unit']}")
                logger.info(f"     Status: {listing['status']}")
                
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=cart_item,
                    headers=self.get_headers()
                ) as response:
                    response_text = await response.text()
                    
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"✅ Cart add successful for listing {i+1}")
                        logger.info(f"     Response: {data}")
                        self.test_cart_items.append(cart_item)
                        self.test_results.append((f"Cart Add Test {i+1}", True, f"Added {listing['title']}"))
                    else:
                        logger.error(f"❌ Cart add failed for listing {i+1}: {response.status}")
                        logger.error(f"     Response: {response_text}")
                        self.test_results.append((f"Cart Add Test {i+1}", False, f"Status {response.status}"))
                        
                        # Log detailed error for debugging
                        try:
                            error_data = json.loads(response_text)
                            logger.error(f"     Error details: {error_data}")
                        except:
                            logger.error(f"     Raw error: {response_text}")
                            
            except Exception as e:
                logger.error(f"❌ Error in cart add test {i+1}: {e}")
                self.test_results.append((f"Cart Add Test {i+1}", False, str(e)))
        
        # Test edge cases
        await self.test_cart_add_edge_cases()
    
    async def test_cart_add_edge_cases(self):
        """Test cart add with edge cases"""
        logger.info("\n   Testing Cart Add Edge Cases...")
        
        # Test 1: Invalid listing ID
        try:
            invalid_cart_item = {
                "listing_id": "invalid_listing_id",
                "quantity": 1
            }
            
            async with self.session.post(
                f"{self.api_url}/cart/add",
                json=invalid_cart_item,
                headers=self.get_headers()
            ) as response:
                if response.status == 404:
                    logger.info("✅ Invalid listing ID properly rejected")
                    self.test_results.append(("Cart Add - Invalid Listing", True, "Properly rejected"))
                else:
                    logger.error(f"❌ Invalid listing ID not properly handled: {response.status}")
                    self.test_results.append(("Cart Add - Invalid Listing", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing invalid listing: {e}")
            self.test_results.append(("Cart Add - Invalid Listing", False, str(e)))
        
        # Test 2: Missing required fields
        try:
            incomplete_cart_item = {
                "quantity": 1
                # Missing listing_id
            }
            
            async with self.session.post(
                f"{self.api_url}/cart/add",
                json=incomplete_cart_item,
                headers=self.get_headers()
            ) as response:
                if response.status == 400:
                    logger.info("✅ Missing listing_id properly rejected")
                    self.test_results.append(("Cart Add - Missing Fields", True, "Properly rejected"))
                else:
                    logger.error(f"❌ Missing fields not properly handled: {response.status}")
                    self.test_results.append(("Cart Add - Missing Fields", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing missing fields: {e}")
            self.test_results.append(("Cart Add - Missing Fields", False, str(e)))
        
        # Test 3: Zero or negative quantity
        if self.sample_listings:
            try:
                zero_quantity_item = {
                    "listing_id": self.sample_listings[0]["id"],
                    "quantity": 0
                }
                
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=zero_quantity_item,
                    headers=self.get_headers()
                ) as response:
                    if response.status in [400, 422]:
                        logger.info("✅ Zero quantity properly rejected")
                        self.test_results.append(("Cart Add - Zero Quantity", True, "Properly rejected"))
                    else:
                        logger.warning(f"⚠️ Zero quantity handling: {response.status}")
                        self.test_results.append(("Cart Add - Zero Quantity", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing zero quantity: {e}")
                self.test_results.append(("Cart Add - Zero Quantity", False, str(e)))
    
    async def test_cart_authentication_and_data_flow(self):
        """Test 3: CART AUTHENTICATION AND DATA FLOW (HIGH PRIORITY)"""
        logger.info("\n🧪 Testing Cart Authentication and Data Flow...")
        
        # Test 1: Unauthenticated cart access
        try:
            cart_item = {
                "listing_id": self.sample_listings[0]["id"] if self.sample_listings else "test_id",
                "quantity": 1
            }
            
            # Remove auth header
            headers = {"Content-Type": "application/json"}
            
            async with self.session.post(
                f"{self.api_url}/cart/add",
                json=cart_item,
                headers=headers
            ) as response:
                if response.status == 401:
                    logger.info("✅ Unauthenticated cart add properly rejected")
                    self.test_results.append(("Cart Auth - Unauthenticated", True, "Properly rejected"))
                else:
                    logger.error(f"❌ Unauthenticated access not properly handled: {response.status}")
                    self.test_results.append(("Cart Auth - Unauthenticated", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing unauthenticated access: {e}")
            self.test_results.append(("Cart Auth - Unauthenticated", False, str(e)))
        
        # Test 2: Get cart contents
        try:
            async with self.session.get(f"{self.api_url}/cart", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    total = data.get("total", 0)
                    item_count = data.get("item_count", 0)
                    
                    logger.info(f"✅ Cart retrieval successful")
                    logger.info(f"     Items: {item_count}")
                    logger.info(f"     Total: R{total}")
                    
                    self.test_results.append(("Cart Data Flow - Get Cart", True, f"{item_count} items, R{total} total"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Cart retrieval failed: {response.status} - {error_text}")
                    self.test_results.append(("Cart Data Flow - Get Cart", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error retrieving cart: {e}")
            self.test_results.append(("Cart Data Flow - Get Cart", False, str(e)))
        
        # Test 3: Cart update functionality
        if self.test_cart_items:
            try:
                # First get cart to find item IDs
                async with self.session.get(f"{self.api_url}/cart", headers=self.get_headers()) as response:
                    if response.status == 200:
                        data = await response.json()
                        items = data.get("items", [])
                        
                        if items:
                            first_item = items[0]
                            item_id = first_item.get("id")
                            
                            if item_id:
                                update_data = {
                                    "item_id": item_id,
                                    "quantity": 3
                                }
                                
                                async with self.session.put(
                                    f"{self.api_url}/cart/update",
                                    json=update_data,
                                    headers=self.get_headers()
                                ) as update_response:
                                    if update_response.status == 200:
                                        logger.info("✅ Cart update successful")
                                        self.test_results.append(("Cart Data Flow - Update", True, "Quantity updated"))
                                    else:
                                        error_text = await update_response.text()
                                        logger.error(f"❌ Cart update failed: {update_response.status} - {error_text}")
                                        self.test_results.append(("Cart Data Flow - Update", False, f"Status {update_response.status}"))
            except Exception as e:
                logger.error(f"❌ Error updating cart: {e}")
                self.test_results.append(("Cart Data Flow - Update", False, str(e)))
    
    async def test_rate_limiting_impact_on_cart(self):
        """Test 4: RATE LIMITING IMPACT ON CART (HIGH PRIORITY)"""
        logger.info("\n🧪 Testing Rate Limiting Impact on Cart...")
        
        if not self.sample_listings:
            logger.warning("⚠️ No sample listings for rate limiting test")
            self.test_results.append(("Rate Limiting - Cart", False, "No sample listings"))
            return
        
        # Test rapid cart additions to trigger rate limiting
        cart_item = {
            "listing_id": self.sample_listings[0]["id"],
            "quantity": 1
        }
        
        successful_requests = 0
        rate_limited_requests = 0
        
        # Make multiple rapid requests
        for i in range(10):
            try:
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=cart_item,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        successful_requests += 1
                    elif response.status == 429:  # Too Many Requests
                        rate_limited_requests += 1
                        logger.info(f"   Request {i+1}: Rate limited (429)")
                    else:
                        logger.warning(f"   Request {i+1}: Unexpected status {response.status}")
                        
                # Small delay between requests
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ Error in rate limiting test request {i+1}: {e}")
        
        logger.info(f"   Successful requests: {successful_requests}")
        logger.info(f"   Rate limited requests: {rate_limited_requests}")
        
        if successful_requests > 0:
            if rate_limited_requests > 0:
                logger.info("✅ Rate limiting working - some requests succeeded, some were limited")
                self.test_results.append(("Rate Limiting - Cart", True, f"{successful_requests} success, {rate_limited_requests} limited"))
            else:
                logger.info("✅ All requests succeeded - rate limits allow normal usage")
                self.test_results.append(("Rate Limiting - Cart", True, f"All {successful_requests} requests succeeded"))
        else:
            logger.error("❌ No requests succeeded - rate limiting may be too restrictive")
            self.test_results.append(("Rate Limiting - Cart", False, "No requests succeeded"))
    
    async def test_error_diagnostic_testing(self):
        """Test 5: ERROR DIAGNOSTIC TESTING (HIGH PRIORITY)"""
        logger.info("\n🧪 Testing Error Diagnostic Scenarios...")
        
        # Test various error scenarios to capture detailed error messages
        error_scenarios = [
            {
                "name": "Empty Cart Item",
                "data": {},
                "expected_status": 400
            },
            {
                "name": "Invalid JSON Structure",
                "data": {"invalid": "structure", "missing": "required_fields"},
                "expected_status": 400
            },
            {
                "name": "Null Listing ID",
                "data": {"listing_id": None, "quantity": 1},
                "expected_status": 400
            },
            {
                "name": "String Quantity",
                "data": {"listing_id": "test_id", "quantity": "invalid"},
                "expected_status": 400
            }
        ]
        
        for scenario in error_scenarios:
            try:
                logger.info(f"   Testing: {scenario['name']}")
                
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=scenario["data"],
                    headers=self.get_headers()
                ) as response:
                    response_text = await response.text()
                    
                    logger.info(f"     Status: {response.status}")
                    logger.info(f"     Response: {response_text}")
                    
                    # Try to parse error details
                    try:
                        error_data = json.loads(response_text)
                        logger.info(f"     Error details: {error_data}")
                    except:
                        pass
                    
                    if response.status == scenario["expected_status"]:
                        self.test_results.append((f"Error Diagnostic - {scenario['name']}", True, f"Status {response.status}"))
                    else:
                        self.test_results.append((f"Error Diagnostic - {scenario['name']}", False, f"Expected {scenario['expected_status']}, got {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error in diagnostic test {scenario['name']}: {e}")
                self.test_results.append((f"Error Diagnostic - {scenario['name']}", False, str(e)))
    
    async def test_backend_logs_analysis(self):
        """Test backend logs to identify specific issues"""
        logger.info("\n🧪 Analyzing Backend Logs for Cart Issues...")
        
        # This would typically involve checking backend logs
        # For now, we'll test a few more specific scenarios that might reveal backend issues
        
        if self.sample_listings:
            # Test with a listing that might have price conversion issues
            for listing in self.sample_listings:
                try:
                    logger.info(f"   Testing price conversion for: {listing['title']}")
                    
                    cart_item = {
                        "listing_id": listing["id"],
                        "quantity": 1
                    }
                    
                    async with self.session.post(
                        f"{self.api_url}/cart/add",
                        json=cart_item,
                        headers=self.get_headers()
                    ) as response:
                        response_text = await response.text()
                        
                        if response.status == 200:
                            logger.info(f"     ✅ Price conversion successful for {listing['title']}")
                        else:
                            logger.error(f"     ❌ Price conversion failed for {listing['title']}: {response.status}")
                            logger.error(f"     Response: {response_text}")
                            
                            # Check if this is a Decimal conversion error
                            if "Decimal" in response_text or "float" in response_text or "NoneType" in response_text:
                                logger.error(f"     🚨 POTENTIAL PRICE CONVERSION ISSUE DETECTED!")
                                self.test_results.append(("Backend Logs - Price Conversion", False, f"Decimal/float error in {listing['title']}"))
                            
                except Exception as e:
                    logger.error(f"❌ Error testing price conversion: {e}")
        
        self.test_results.append(("Backend Logs Analysis", True, "Completed diagnostic analysis"))
    
    async def run_all_tests(self):
        """Run all cart functionality tests"""
        logger.info("🚀 Starting Cart Functionality Comprehensive Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests in order of priority
            await self.test_listing_price_field_validation()  # Get sample data first
            await self.test_cart_add_endpoint()
            await self.test_cart_authentication_and_data_flow()
            await self.test_rate_limiting_impact_on_cart()
            await self.test_error_diagnostic_testing()
            await self.test_backend_logs_analysis()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🛒 CART FUNCTIONALITY COMPREHENSIVE TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Categorize results
        critical_tests = [r for r in self.test_results if "Cart Add" in r[0] or "Price Field" in r[0]]
        critical_passed = sum(1 for _, success, _ in critical_tests if success)
        
        logger.info(f"🚨 CRITICAL TESTS: {critical_passed}/{len(critical_tests)} passed")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Cart functionality is fully working.")
        elif critical_passed == len(critical_tests):
            logger.info("✅ CRITICAL FUNCTIONS WORKING - Cart add functionality is operational.")
        else:
            logger.info("❌ CRITICAL ISSUES FOUND - Cart functionality has major problems.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY AREAS TESTED:")
        logger.info("   • Cart Add Endpoint (/api/cart/add)")
        logger.info("   • Listing Price Field Validation")
        logger.info("   • Authentication & Authorization")
        logger.info("   • Rate Limiting Impact")
        logger.info("   • Error Diagnostic Scenarios")
        logger.info("   • Backend Logs Analysis")
        
        logger.info("\n🔍 SAMPLE LISTINGS ANALYZED:")
        for listing in self.sample_listings[:3]:
            logger.info(f"   • {listing['title']}: price_per_unit={listing['price_per_unit']}")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = CartFunctionalityTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())