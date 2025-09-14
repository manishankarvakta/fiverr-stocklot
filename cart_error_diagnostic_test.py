#!/usr/bin/env python3
"""
🔍 CART ERROR DIAGNOSTIC TESTING
Focused testing to identify specific cart error scenarios without triggering rate limits
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CartErrorDiagnosticTester:
    """Focused Cart Error Diagnostic Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
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
            auth_data = {
                "email": "testuser@stocklot.co.za",
                "password": "testpass123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]
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
    
    async def test_specific_error_scenarios(self):
        """Test specific error scenarios with delays to avoid rate limiting"""
        logger.info("\n🔍 Testing Specific Error Scenarios...")
        
        # Get a valid listing ID first
        valid_listing_id = None
        try:
            async with self.session.get(f"{self.api_url}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    if listings:
                        valid_listing_id = listings[0]["id"]
                        logger.info(f"✅ Found valid listing ID: {valid_listing_id}")
        except Exception as e:
            logger.error(f"❌ Error getting valid listing: {e}")
        
        # Test scenarios with delays
        error_scenarios = [
            {
                "name": "Missing listing_id",
                "data": {"quantity": 1},
                "delay": 3
            },
            {
                "name": "Null listing_id",
                "data": {"listing_id": None, "quantity": 1},
                "delay": 3
            },
            {
                "name": "Empty listing_id",
                "data": {"listing_id": "", "quantity": 1},
                "delay": 3
            },
            {
                "name": "Invalid listing_id",
                "data": {"listing_id": "invalid_id_12345", "quantity": 1},
                "delay": 3
            },
            {
                "name": "Zero quantity",
                "data": {"listing_id": valid_listing_id, "quantity": 0},
                "delay": 3
            },
            {
                "name": "Negative quantity",
                "data": {"listing_id": valid_listing_id, "quantity": -1},
                "delay": 3
            },
            {
                "name": "String quantity",
                "data": {"listing_id": valid_listing_id, "quantity": "invalid"},
                "delay": 3
            },
            {
                "name": "Float quantity",
                "data": {"listing_id": valid_listing_id, "quantity": 1.5},
                "delay": 3
            }
        ]
        
        for i, scenario in enumerate(error_scenarios):
            try:
                logger.info(f"\n   Test {i+1}: {scenario['name']}")
                logger.info(f"   Data: {scenario['data']}")
                
                # Add delay to avoid rate limiting
                if i > 0:
                    await asyncio.sleep(scenario['delay'])
                
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=scenario["data"],
                    headers=self.get_headers()
                ) as response:
                    response_text = await response.text()
                    
                    logger.info(f"   Status: {response.status}")
                    logger.info(f"   Response: {response_text}")
                    
                    # Parse error details if possible
                    try:
                        error_data = json.loads(response_text)
                        if "detail" in error_data:
                            logger.info(f"   Error Detail: {error_data['detail']}")
                    except:
                        pass
                    
                    # Determine if this is the expected behavior
                    if scenario['name'] in ["Missing listing_id", "Null listing_id", "Empty listing_id"]:
                        expected = response.status == 400
                    elif scenario['name'] == "Invalid listing_id":
                        expected = response.status == 404
                    elif scenario['name'] in ["Zero quantity", "Negative quantity", "String quantity"]:
                        expected = response.status in [400, 422]
                    elif scenario['name'] == "Float quantity":
                        expected = response.status in [200, 400, 422]  # Could be valid or invalid
                    else:
                        expected = True
                    
                    self.test_results.append((f"Error Test - {scenario['name']}", expected, f"Status {response.status}"))
                    
            except Exception as e:
                logger.error(f"❌ Error in test {scenario['name']}: {e}")
                self.test_results.append((f"Error Test - {scenario['name']}", False, str(e)))
    
    async def test_successful_cart_operations(self):
        """Test successful cart operations to confirm basic functionality"""
        logger.info("\n✅ Testing Successful Cart Operations...")
        
        try:
            # Get listings
            async with self.session.get(f"{self.api_url}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    if listings:
                        # Test adding a valid item
                        test_listing = listings[0]
                        cart_item = {
                            "listing_id": test_listing["id"],
                            "quantity": 1,
                            "shipping_option": "standard"
                        }
                        
                        await asyncio.sleep(3)  # Avoid rate limiting
                        
                        async with self.session.post(
                            f"{self.api_url}/cart/add",
                            json=cart_item,
                            headers=self.get_headers()
                        ) as add_response:
                            if add_response.status == 200:
                                add_data = await add_response.json()
                                logger.info(f"✅ Successful cart add: {add_data}")
                                self.test_results.append(("Successful Cart Add", True, "Item added successfully"))
                                
                                # Test getting cart
                                await asyncio.sleep(2)
                                async with self.session.get(f"{self.api_url}/cart", headers=self.get_headers()) as cart_response:
                                    if cart_response.status == 200:
                                        cart_data = await cart_response.json()
                                        logger.info(f"✅ Cart retrieval: {cart_data}")
                                        self.test_results.append(("Cart Retrieval", True, f"{cart_data.get('item_count', 0)} items"))
                                    else:
                                        logger.error(f"❌ Cart retrieval failed: {cart_response.status}")
                                        self.test_results.append(("Cart Retrieval", False, f"Status {cart_response.status}"))
                            else:
                                error_text = await add_response.text()
                                logger.error(f"❌ Cart add failed: {add_response.status} - {error_text}")
                                self.test_results.append(("Successful Cart Add", False, f"Status {add_response.status}"))
                    else:
                        logger.warning("⚠️ No listings available for testing")
                        self.test_results.append(("Successful Cart Add", False, "No listings available"))
                else:
                    logger.error(f"❌ Failed to get listings: {response.status}")
                    self.test_results.append(("Successful Cart Add", False, "Cannot get listings"))
                    
        except Exception as e:
            logger.error(f"❌ Error in successful operations test: {e}")
            self.test_results.append(("Successful Cart Add", False, str(e)))
    
    async def test_price_field_analysis(self):
        """Analyze price field handling in detail"""
        logger.info("\n💰 Testing Price Field Analysis...")
        
        try:
            async with self.session.get(f"{self.api_url}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    logger.info(f"📊 Analyzing {len(listings)} listings for price fields:")
                    
                    for i, listing in enumerate(listings):
                        logger.info(f"\n   Listing {i+1}: {listing.get('title', 'Unknown')}")
                        logger.info(f"     ID: {listing.get('id')}")
                        logger.info(f"     price_per_unit: {listing.get('price_per_unit')} (type: {type(listing.get('price_per_unit'))})")
                        logger.info(f"     price: {listing.get('price')} (type: {type(listing.get('price'))})")
                        logger.info(f"     status: {listing.get('status')}")
                        logger.info(f"     seller_id: {listing.get('seller_id')}")
                        
                        # Check for potential Decimal conversion issues
                        price_value = listing.get('price_per_unit') or listing.get('price')
                        if price_value is None:
                            logger.warning(f"     ⚠️ No price found for listing {listing.get('id')}")
                        elif isinstance(price_value, str):
                            logger.warning(f"     ⚠️ Price is string: '{price_value}'")
                        elif isinstance(price_value, (int, float)):
                            logger.info(f"     ✅ Price is numeric: {price_value}")
                    
                    self.test_results.append(("Price Field Analysis", True, f"Analyzed {len(listings)} listings"))
                else:
                    logger.error(f"❌ Failed to get listings for price analysis: {response.status}")
                    self.test_results.append(("Price Field Analysis", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error in price field analysis: {e}")
            self.test_results.append(("Price Field Analysis", False, str(e)))
    
    async def run_diagnostic_tests(self):
        """Run all diagnostic tests"""
        logger.info("🔍 Starting Cart Error Diagnostic Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run diagnostic tests
            await self.test_price_field_analysis()
            await self.test_successful_cart_operations()
            await self.test_specific_error_scenarios()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_diagnostic_summary()
    
    def print_diagnostic_summary(self):
        """Print diagnostic test summary"""
        logger.info("\n" + "="*80)
        logger.info("🔍 CART ERROR DIAGNOSTIC TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 DIAGNOSTIC RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = CartErrorDiagnosticTester()
    await tester.run_diagnostic_tests()

if __name__ == "__main__":
    asyncio.run(main())