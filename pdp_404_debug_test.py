#!/usr/bin/env python3
"""
PDP 404 Issue Debugging - Specific Listing ID Investigation
Testing the exact URL: /api/listings/416ad972-e6ff-444b-b983-5fddb9a11334/pdp
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

# Specific listing ID to debug
TARGET_LISTING_ID = "416ad972-e6ff-444b-b983-5fddb9a11334"

# Test user credentials
TEST_USER_EMAIL = "admin@stocklot.co.za"
TEST_USER_PASSWORD = "admin123"

class PDPDebugTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": [],
            "findings": []
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
            # Try to login first
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token") or TEST_USER_EMAIL
                    print(f"✅ Authentication successful")
                    return True
                else:
                    # Try using email directly as token (fallback)
                    self.auth_token = TEST_USER_EMAIL
                    print(f"✅ Authentication fallback - using email as token")
                    return True
                    
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            # Try using email directly as token (fallback)
            self.auth_token = TEST_USER_EMAIL
            print(f"✅ Authentication fallback - using email as token")
            return True

    def get_auth_headers(self):
        """Get authentication headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}

    async def test_specific_listing_database_existence(self):
        """Test 1: Check if the specific listing ID exists in database"""
        print(f"\n🧪 TEST 1: Database Existence Check for Listing {TARGET_LISTING_ID}")
        self.results["total_tests"] += 1
        
        try:
            # Try to get the listing from marketplace API
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    # Search for our target listing
                    target_listing = None
                    for listing in listings:
                        if listing.get("id") == TARGET_LISTING_ID:
                            target_listing = listing
                            break
                    
                    if target_listing:
                        print(f"✅ PASS: Listing {TARGET_LISTING_ID} EXISTS in database")
                        print(f"   Title: {target_listing.get('title', 'N/A')}")
                        print(f"   Status: {target_listing.get('status', 'N/A')}")
                        print(f"   Seller ID: {target_listing.get('seller_id', 'N/A')}")
                        print(f"   Price: R{target_listing.get('price_per_unit', 'N/A')}")
                        self.results["passed"] += 1
                        self.results["findings"].append(f"Target listing EXISTS with status: {target_listing.get('status')}")
                        return target_listing
                    else:
                        print(f"❌ FAIL: Listing {TARGET_LISTING_ID} NOT FOUND in database")
                        print(f"   Total listings in marketplace: {len(listings)}")
                        if listings:
                            print(f"   Sample listing IDs: {[l.get('id') for l in listings[:3]]}")
                        self.results["failed"] += 1
                        self.results["findings"].append("Target listing NOT FOUND in database")
                        return None
                else:
                    print(f"❌ FAIL: Failed to fetch listings: {response.status}")
                    self.results["failed"] += 1
                    return None
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Database existence check: {e}")
            return None

    async def test_specific_pdp_endpoint(self):
        """Test 2: Test the exact PDP URL for the specific listing"""
        print(f"\n🧪 TEST 2: Direct PDP Endpoint Test for {TARGET_LISTING_ID}")
        self.results["total_tests"] += 1
        
        try:
            pdp_url = f"{API_BASE}/listings/{TARGET_LISTING_ID}/pdp"
            print(f"   Testing URL: {pdp_url}")
            
            async with self.session.get(pdp_url) as response:
                response_text = await response.text()
                
                print(f"   HTTP Status: {response.status}")
                print(f"   Response Headers: {dict(response.headers)}")
                
                if response.status == 200:
                    try:
                        data = json.loads(response_text)
                        print(f"✅ PASS: PDP endpoint returned 200 OK")
                        print(f"   Listing Title: {data.get('title', 'N/A')}")
                        print(f"   Seller Info: {data.get('seller', {}).get('name', 'N/A')}")
                        print(f"   Price: R{data.get('price', 'N/A')}")
                        self.results["passed"] += 1
                        self.results["findings"].append("PDP endpoint working correctly")
                        return True
                    except json.JSONDecodeError:
                        print(f"❌ FAIL: Invalid JSON response")
                        print(f"   Response: {response_text[:500]}")
                        self.results["failed"] += 1
                        return False
                        
                elif response.status == 404:
                    print(f"❌ FAIL: PDP endpoint returned 404 NOT FOUND")
                    print(f"   Response: {response_text}")
                    self.results["failed"] += 1
                    self.results["findings"].append("PDP endpoint returns 404 - listing not found")
                    return False
                    
                else:
                    print(f"❌ FAIL: PDP endpoint returned unexpected status {response.status}")
                    print(f"   Response: {response_text}")
                    self.results["failed"] += 1
                    self.results["findings"].append(f"PDP endpoint returns {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"PDP endpoint test: {e}")
            return False

    async def test_pdp_with_working_listings(self):
        """Test 3: Test PDP endpoint with known working listing IDs"""
        print(f"\n🧪 TEST 3: PDP Endpoint Test with Working Listings")
        self.results["total_tests"] += 1
        
        try:
            # Get available listings
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    if not listings:
                        print(f"❌ FAIL: No listings available for testing")
                        self.results["failed"] += 1
                        return False
                    
                    # Test PDP with first 3 available listings
                    working_count = 0
                    total_tested = 0
                    
                    for listing in listings[:5]:  # Test up to 5 listings
                        listing_id = listing.get("id")
                        if not listing_id:
                            continue
                            
                        total_tested += 1
                        pdp_url = f"{API_BASE}/listings/{listing_id}/pdp"
                        
                        try:
                            async with self.session.get(pdp_url) as pdp_response:
                                if pdp_response.status == 200:
                                    working_count += 1
                                    print(f"   ✅ PDP working for {listing.get('title', 'Unknown')} ({listing_id})")
                                else:
                                    print(f"   ❌ PDP failed for {listing.get('title', 'Unknown')} ({listing_id}) - Status: {pdp_response.status}")
                        except Exception as e:
                            print(f"   ❌ PDP error for {listing_id}: {e}")
                    
                    if working_count > 0:
                        print(f"✅ PASS: PDP endpoint working for {working_count}/{total_tested} listings")
                        self.results["passed"] += 1
                        self.results["findings"].append(f"PDP works for {working_count}/{total_tested} other listings")
                        return True
                    else:
                        print(f"❌ FAIL: PDP endpoint not working for any listings ({total_tested} tested)")
                        self.results["failed"] += 1
                        self.results["findings"].append("PDP endpoint broken for all listings")
                        return False
                else:
                    print(f"❌ FAIL: Failed to fetch listings for comparison")
                    self.results["failed"] += 1
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Working listings PDP test: {e}")
            return False

    async def test_url_parameter_extraction(self):
        """Test 4: Test URL parameter extraction and routing"""
        print(f"\n🧪 TEST 4: URL Parameter Extraction and Routing Test")
        self.results["total_tests"] += 1
        
        try:
            # Test with various UUID formats
            test_cases = [
                TARGET_LISTING_ID,  # Original format
                TARGET_LISTING_ID.upper(),  # Uppercase
                TARGET_LISTING_ID.replace("-", ""),  # No dashes
                "invalid-uuid-format",  # Invalid format
                "123e4567-e89b-12d3-a456-426614174000"  # Valid UUID format but non-existent
            ]
            
            results = []
            for test_id in test_cases:
                pdp_url = f"{API_BASE}/listings/{test_id}/pdp"
                
                try:
                    async with self.session.get(pdp_url) as response:
                        status = response.status
                        response_text = await response.text()
                        results.append({
                            "id": test_id,
                            "status": status,
                            "response_length": len(response_text)
                        })
                        print(f"   {test_id}: Status {status}")
                except Exception as e:
                    results.append({
                        "id": test_id,
                        "status": "ERROR",
                        "error": str(e)
                    })
                    print(f"   {test_id}: ERROR - {e}")
            
            # Analyze results
            status_codes = [r.get("status") for r in results if isinstance(r.get("status"), int)]
            if len(set(status_codes)) > 1:
                print(f"✅ PASS: URL parameter extraction shows different responses for different formats")
                self.results["passed"] += 1
                self.results["findings"].append("URL parameter extraction working - different responses for different formats")
            else:
                print(f"❌ FAIL: All URL formats return same status - possible routing issue")
                self.results["failed"] += 1
                self.results["findings"].append("Possible URL routing issue - all formats return same status")
            
            return True
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"URL parameter test: {e}")
            return False

    async def test_database_query_debugging(self):
        """Test 5: Database query debugging by checking seller information"""
        print(f"\n🧪 TEST 5: Database Query and Seller Information Debugging")
        self.results["total_tests"] += 1
        
        try:
            # First, get all listings to understand the data structure
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    if listings:
                        # Analyze the first few listings
                        print(f"   Total listings in database: {len(listings)}")
                        
                        sample_listing = listings[0]
                        print(f"   Sample listing structure:")
                        print(f"     ID: {sample_listing.get('id')}")
                        print(f"     Title: {sample_listing.get('title')}")
                        print(f"     Seller ID: {sample_listing.get('seller_id')}")
                        print(f"     Status: {sample_listing.get('status')}")
                        print(f"     Price field: {sample_listing.get('price_per_unit', 'N/A')}")
                        
                        # Check if our target listing exists
                        target_found = any(l.get("id") == TARGET_LISTING_ID for l in listings)
                        
                        if target_found:
                            print(f"   ✅ Target listing {TARGET_LISTING_ID} found in listings collection")
                            self.results["findings"].append("Target listing exists in listings collection")
                        else:
                            print(f"   ❌ Target listing {TARGET_LISTING_ID} NOT found in listings collection")
                            self.results["findings"].append("Target listing missing from listings collection")
                        
                        # Test seller information lookup for a working listing
                        test_listing = listings[0]
                        seller_id = test_listing.get("seller_id")
                        
                        if seller_id:
                            # Try to get seller information (this might be part of PDP logic)
                            print(f"   Testing seller lookup for seller_id: {seller_id}")
                            # Note: We can't directly test seller lookup without access to users collection
                            # But we can test if PDP works for this listing
                            
                            pdp_url = f"{API_BASE}/listings/{test_listing['id']}/pdp"
                            async with self.session.get(pdp_url) as pdp_response:
                                if pdp_response.status == 200:
                                    pdp_data = await pdp_response.json()
                                    seller_info = pdp_data.get("seller", {})
                                    print(f"   ✅ Seller lookup working - Seller: {seller_info.get('name', 'N/A')}")
                                    self.results["findings"].append("Seller lookup working for other listings")
                                else:
                                    print(f"   ❌ Seller lookup may be failing - PDP returns {pdp_response.status}")
                                    self.results["findings"].append("Possible seller lookup issue")
                        
                        print(f"✅ PASS: Database query analysis completed")
                        self.results["passed"] += 1
                        return True
                    else:
                        print(f"❌ FAIL: No listings found in database")
                        self.results["failed"] += 1
                        return False
                else:
                    print(f"❌ FAIL: Failed to fetch listings for analysis")
                    self.results["failed"] += 1
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Database query debugging: {e}")
            return False

    async def test_error_response_analysis(self):
        """Test 6: Detailed error response analysis"""
        print(f"\n🧪 TEST 6: Detailed Error Response Analysis")
        self.results["total_tests"] += 1
        
        try:
            pdp_url = f"{API_BASE}/listings/{TARGET_LISTING_ID}/pdp"
            
            async with self.session.get(pdp_url) as response:
                # Capture all response details
                status = response.status
                headers = dict(response.headers)
                response_text = await response.text()
                
                print(f"   Complete Response Analysis:")
                print(f"     Status Code: {status}")
                print(f"     Content-Type: {headers.get('content-type', 'N/A')}")
                print(f"     Content-Length: {headers.get('content-length', 'N/A')}")
                print(f"     Server: {headers.get('server', 'N/A')}")
                print(f"     Response Body: {response_text}")
                
                # Try to parse as JSON
                try:
                    json_data = json.loads(response_text)
                    print(f"     JSON Response: {json.dumps(json_data, indent=2)}")
                    
                    # Look for specific error messages
                    error_detail = json_data.get("detail", "")
                    if "not found" in error_detail.lower():
                        self.results["findings"].append("Error indicates listing not found in database")
                    elif "seller" in error_detail.lower():
                        self.results["findings"].append("Error may be related to seller information lookup")
                    else:
                        self.results["findings"].append(f"Error detail: {error_detail}")
                        
                except json.JSONDecodeError:
                    print(f"     Non-JSON Response - possibly HTML error page")
                    if "404" in response_text:
                        self.results["findings"].append("HTML 404 error page returned")
                    elif "500" in response_text:
                        self.results["findings"].append("HTML 500 error page returned - server error")
                
                # Determine if this is a true 404 or disguised error
                if status == 404:
                    if "application/json" in headers.get('content-type', ''):
                        print(f"   ✅ True 404 JSON response")
                        self.results["findings"].append("True 404 JSON response - proper error handling")
                    else:
                        print(f"   ⚠️  404 but non-JSON response - possible routing issue")
                        self.results["findings"].append("404 with non-JSON response - possible routing issue")
                elif status == 500:
                    print(f"   🚨 Server error (500) disguised as 404 issue")
                    self.results["findings"].append("Server error (500) - backend processing issue")
                
                print(f"✅ PASS: Error response analysis completed")
                self.results["passed"] += 1
                return True
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Error response analysis: {e}")
            return False

    async def run_all_tests(self):
        """Run all PDP debugging tests"""
        print("🔍 PDP 404 ISSUE DEBUGGING - SPECIFIC LISTING INVESTIGATION")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Target Listing ID: {TARGET_LISTING_ID}")
        print(f"Target PDP URL: {API_BASE}/listings/{TARGET_LISTING_ID}/pdp")
        print("=" * 80)
        
        # Setup
        await self.setup_session()
        
        # Authenticate (optional for PDP - should work for guests)
        await self.authenticate()
        
        # Run all tests
        tests = [
            self.test_specific_listing_database_existence,
            self.test_specific_pdp_endpoint,
            self.test_pdp_with_working_listings,
            self.test_url_parameter_extraction,
            self.test_database_query_debugging,
            self.test_error_response_analysis
        ]
        
        for test in tests:
            await test()
            await asyncio.sleep(0.5)  # Small delay between tests
        
        # Cleanup
        await self.cleanup_session()
        
        # Print results
        self.print_results()

    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("🔍 PDP 404 DEBUGGING RESULTS")
        print("=" * 80)
        
        success_rate = (self.results["passed"] / self.results["total_tests"]) * 100 if self.results["total_tests"] > 0 else 0
        
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        print(f"\n🔍 KEY FINDINGS:")
        for i, finding in enumerate(self.results["findings"], 1):
            print(f"   {i}. {finding}")
        
        if self.results["errors"]:
            print(f"\n🚨 ERRORS ENCOUNTERED:")
            for i, error in enumerate(self.results["errors"], 1):
                print(f"   {i}. {error}")
        
        print(f"\n📋 DIAGNOSIS SUMMARY:")
        
        # Analyze findings to provide diagnosis
        findings_text = " ".join(self.results["findings"]).lower()
        
        if "not found in database" in findings_text or "missing from listings collection" in findings_text:
            print(f"   🎯 ROOT CAUSE: Listing {TARGET_LISTING_ID} does not exist in the database")
            print(f"   💡 SOLUTION: Verify the listing ID is correct or check if listing was deleted")
        elif "pdp works for" in findings_text and "other listings" in findings_text:
            print(f"   🎯 ROOT CAUSE: PDP endpoint works for other listings but not this specific one")
            print(f"   💡 SOLUTION: Check listing status, seller information, or data integrity for this specific listing")
        elif "pdp endpoint broken for all listings" in findings_text:
            print(f"   🎯 ROOT CAUSE: PDP endpoint is completely broken")
            print(f"   💡 SOLUTION: Check backend PDP endpoint implementation and database connectivity")
        elif "server error" in findings_text:
            print(f"   🎯 ROOT CAUSE: Backend server error when processing PDP request")
            print(f"   💡 SOLUTION: Check backend logs for detailed error information")
        elif "routing issue" in findings_text:
            print(f"   🎯 ROOT CAUSE: URL routing or parameter extraction issue")
            print(f"   💡 SOLUTION: Check FastAPI route definition and parameter handling")
        else:
            print(f"   🤔 INCONCLUSIVE: Multiple potential issues identified")
            print(f"   💡 RECOMMENDATION: Review all findings and check backend logs")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    tester = PDPDebugTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())