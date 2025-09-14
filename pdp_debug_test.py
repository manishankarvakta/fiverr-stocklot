#!/usr/bin/env python3
"""
🔍 PDP ENDPOINT DEBUGGING TEST
Comprehensive testing of PDP endpoint issues identified in review request
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PDPDebugTester:
    """PDP Endpoint Debug Tester"""
    
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
        """Authenticate as admin user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
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
    
    async def get_available_listings(self):
        """Get available listing IDs from marketplace"""
        logger.info("\n🔍 STEP 1: Getting Available Listing IDs...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    logger.info(f"✅ Found {len(listings)} listings in marketplace")
                    
                    # Extract and validate listing IDs
                    valid_listings = []
                    for listing in listings:
                        listing_id = listing.get("id")
                        title = listing.get("title", "Unknown")
                        status = listing.get("status", "unknown")
                        price = listing.get("price_per_unit", 0)
                        
                        if listing_id and status == "active":
                            valid_listings.append({
                                "id": listing_id,
                                "title": title,
                                "price": price,
                                "status": status
                            })
                            logger.info(f"   📋 Valid: {listing_id} - {title} (R{price}) - {status}")
                        else:
                            logger.warning(f"   ⚠️ Invalid: {listing_id} - {title} - {status}")
                    
                    self.test_results.append(("Get Available Listings", True, f"Found {len(valid_listings)} valid listings"))
                    return valid_listings
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to get listings: {response.status} - {error_text}")
                    self.test_results.append(("Get Available Listings", False, f"Status {response.status}"))
                    return []
        except Exception as e:
            logger.error(f"❌ Error getting listings: {e}")
            self.test_results.append(("Get Available Listings", False, str(e)))
            return []
    
    async def test_pdp_endpoint_detailed(self, listing_id: str, title: str):
        """Test PDP endpoint with detailed error analysis"""
        logger.info(f"\n🔍 STEP 2: Testing PDP Endpoint for {title}...")
        logger.info(f"   Listing ID: {listing_id}")
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{listing_id}/pdp",
                headers=self.get_headers()
            ) as response:
                logger.info(f"   Response Status: {response.status}")
                
                if response.status == 200:
                    try:
                        data = await response.json()
                        logger.info("✅ PDP endpoint returned 200 OK")
                        
                        # Analyze response structure
                        logger.info("   📊 Response Structure Analysis:")
                        
                        # Check required fields for PDP display
                        required_fields = {
                            "id": "Listing ID",
                            "title": "Listing Title", 
                            "price": "Price Information",
                            "seller": "Seller Information",
                            "description": "Description",
                            "media": "Images/Media",
                            "location": "Location Info",
                            "attributes": "Product Attributes"
                        }
                        
                        missing_fields = []
                        present_fields = []
                        
                        for field, description in required_fields.items():
                            if field in data and data[field] is not None:
                                present_fields.append(field)
                                logger.info(f"      ✅ {description}: Present")
                                
                                # Detailed analysis of complex fields
                                if field == "seller" and isinstance(data[field], dict):
                                    seller = data[field]
                                    seller_fields = ["id", "name", "rating", "contact"]
                                    for sf in seller_fields:
                                        if sf in seller:
                                            logger.info(f"         ✅ Seller {sf}: {seller[sf]}")
                                        else:
                                            logger.warning(f"         ⚠️ Seller {sf}: Missing")
                                
                                elif field == "price":
                                    logger.info(f"         💰 Price Value: R{data[field]}")
                                    logger.info(f"         💰 Price Type: {type(data[field])}")
                                
                                elif field == "media" and isinstance(data[field], list):
                                    logger.info(f"         🖼️ Media Count: {len(data[field])}")
                                    if data[field]:
                                        logger.info(f"         🖼️ First Media: {data[field][0]}")
                                
                                elif field == "location" and isinstance(data[field], dict):
                                    location = data[field]
                                    logger.info(f"         📍 City: {location.get('city', 'N/A')}")
                                    logger.info(f"         📍 Province: {location.get('province', 'N/A')}")
                                
                                elif field == "attributes" and isinstance(data[field], dict):
                                    logger.info(f"         📋 Attributes Count: {len(data[field])}")
                                    for attr_key, attr_val in list(data[field].items())[:3]:
                                        logger.info(f"         📋 {attr_key}: {attr_val}")
                            else:
                                missing_fields.append(field)
                                logger.warning(f"      ❌ {description}: Missing or null")
                        
                        # Check additional fields that might be present
                        additional_fields = ["qty_available", "certificates", "similar", "reviewSummary"]
                        for field in additional_fields:
                            if field in data:
                                logger.info(f"      ➕ {field}: Present ({type(data[field])})")
                        
                        # Overall assessment
                        if not missing_fields:
                            logger.info("🎉 PDP endpoint returns complete data structure!")
                            self.test_results.append((f"PDP Endpoint - {title[:30]}", True, "Complete data structure"))
                            return True
                        else:
                            logger.warning(f"⚠️ PDP endpoint missing fields: {missing_fields}")
                            self.test_results.append((f"PDP Endpoint - {title[:30]}", False, f"Missing: {missing_fields}"))
                            return False
                            
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ JSON decode error: {e}")
                        response_text = await response.text()
                        logger.error(f"   Raw response: {response_text[:500]}")
                        self.test_results.append((f"PDP Endpoint - {title[:30]}", False, "JSON decode error"))
                        return False
                
                elif response.status == 404:
                    logger.error("❌ PDP endpoint returned 404 - Listing not found")
                    self.test_results.append((f"PDP Endpoint - {title[:30]}", False, "404 Not Found"))
                    return False
                
                else:
                    error_text = await response.text()
                    logger.error(f"❌ PDP endpoint error: {response.status} - {error_text}")
                    self.test_results.append((f"PDP Endpoint - {title[:30]}", False, f"Status {response.status}"))
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Exception testing PDP endpoint: {e}")
            logger.error(f"   Traceback: {traceback.format_exc()}")
            self.test_results.append((f"PDP Endpoint - {title[:30]}", False, str(e)))
            return False
    
    async def test_authentication_requirements(self, listing_id: str):
        """Test PDP endpoint authentication requirements"""
        logger.info(f"\n🔍 STEP 3: Testing Authentication Requirements...")
        
        # Test without authentication (guest access)
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{listing_id}/pdp"
            ) as response:
                if response.status == 200:
                    logger.info("✅ PDP endpoint accessible to guests (no auth required)")
                    self.test_results.append(("Guest Access to PDP", True, "Accessible without auth"))
                    return True
                elif response.status == 401:
                    logger.warning("⚠️ PDP endpoint requires authentication")
                    self.test_results.append(("Guest Access to PDP", False, "Authentication required"))
                    return False
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Unexpected response: {response.status} - {error_text}")
                    self.test_results.append(("Guest Access to PDP", False, f"Status {response.status}"))
                    return False
        except Exception as e:
            logger.error(f"❌ Error testing guest access: {e}")
            self.test_results.append(("Guest Access to PDP", False, str(e)))
            return False
    
    async def test_error_handling(self):
        """Test PDP endpoint error handling"""
        logger.info(f"\n🔍 STEP 4: Testing Error Handling...")
        
        # Test with invalid listing ID
        invalid_ids = [
            "invalid-id-123",
            "00000000-0000-0000-0000-000000000000",
            "not-a-uuid"
        ]
        
        for invalid_id in invalid_ids:
            try:
                async with self.session.get(
                    f"{self.api_url}/listings/{invalid_id}/pdp",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 404:
                        logger.info(f"✅ Proper 404 response for invalid ID: {invalid_id}")
                        self.test_results.append((f"Error Handling - {invalid_id}", True, "Proper 404 response"))
                    else:
                        error_text = await response.text()
                        logger.warning(f"⚠️ Unexpected response for {invalid_id}: {response.status} - {error_text}")
                        self.test_results.append((f"Error Handling - {invalid_id}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing invalid ID {invalid_id}: {e}")
                self.test_results.append((f"Error Handling - {invalid_id}", False, str(e)))
    
    async def test_database_queries(self, listing_id: str):
        """Test if database queries are working correctly"""
        logger.info(f"\n🔍 STEP 5: Testing Database Integration...")
        
        # Test basic listing retrieval
        try:
            async with self.session.get(
                f"{self.api_url}/listings/{listing_id}",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ Basic listing retrieval working")
                    
                    # Check seller_id exists
                    seller_id = data.get("seller_id")
                    if seller_id:
                        logger.info(f"   📋 Seller ID found: {seller_id}")
                        self.test_results.append(("Database - Listing Query", True, "Seller ID present"))
                    else:
                        logger.warning("   ⚠️ No seller_id in listing data")
                        self.test_results.append(("Database - Listing Query", False, "Missing seller_id"))
                    
                    # Check required fields for PDP
                    required_db_fields = ["id", "title", "price_per_unit", "seller_id", "status"]
                    missing_db_fields = []
                    for field in required_db_fields:
                        if field not in data or data[field] is None:
                            missing_db_fields.append(field)
                    
                    if not missing_db_fields:
                        logger.info("✅ All required database fields present")
                        self.test_results.append(("Database - Required Fields", True, "All fields present"))
                    else:
                        logger.warning(f"⚠️ Missing database fields: {missing_db_fields}")
                        self.test_results.append(("Database - Required Fields", False, f"Missing: {missing_db_fields}"))
                
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Basic listing query failed: {response.status} - {error_text}")
                    self.test_results.append(("Database - Listing Query", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing database queries: {e}")
            self.test_results.append(("Database - Listing Query", False, str(e)))
    
    async def run_comprehensive_test(self):
        """Run comprehensive PDP debugging test"""
        logger.info("🚀 Starting Comprehensive PDP Debugging Test...")
        logger.info("="*80)
        
        await self.setup_session()
        
        try:
            # Authenticate
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed")
                return
            
            # Get available listings
            listings = await self.get_available_listings()
            if not listings:
                logger.error("❌ No listings available for testing")
                return
            
            # Test with first available listing
            test_listing = listings[0]
            listing_id = test_listing["id"]
            title = test_listing["title"]
            
            logger.info(f"\n🎯 TESTING WITH LISTING:")
            logger.info(f"   ID: {listing_id}")
            logger.info(f"   Title: {title}")
            logger.info(f"   Price: R{test_listing['price']}")
            
            # Run all tests
            await self.test_pdp_endpoint_detailed(listing_id, title)
            await self.test_authentication_requirements(listing_id)
            await self.test_error_handling()
            await self.test_database_queries(listing_id)
            
        finally:
            await self.cleanup_session()
        
        # Print results
        self.print_debug_summary()
    
    def print_debug_summary(self):
        """Print comprehensive debug summary"""
        logger.info("\n" + "="*80)
        logger.info("🔍 PDP ENDPOINT DEBUGGING SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! PDP endpoint is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - PDP endpoint is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - PDP endpoint has significant issues.")
        else:
            logger.info("❌ MAJOR ISSUES - PDP endpoint requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 DEBUGGING FOCUS AREAS:")
        logger.info("   • PDP Endpoint Response Structure")
        logger.info("   • Authentication Requirements (Guest vs Authenticated)")
        logger.info("   • Error Handling for Invalid Listing IDs")
        logger.info("   • Database Query Integration")
        logger.info("   • Seller Information Retrieval")
        logger.info("   • Similar Listings Recommendation")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = PDPDebugTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())