#!/usr/bin/env python3
"""
Seller Lookup Debugging - Investigating "Seller not found" error
The listing exists but PDP returns "Seller not found" - investigating seller_id mismatch
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timezone

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Specific listing ID to debug
TARGET_LISTING_ID = "416ad972-e6ff-444b-b983-5fddb9a11334"

# Test user credentials
TEST_USER_EMAIL = "admin@stocklot.co.za"
TEST_USER_PASSWORD = "admin123"

class SellerLookupDebugger:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.target_listing = None
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
                    self.auth_token = TEST_USER_EMAIL
                    print(f"✅ Authentication fallback - using email as token")
                    return True
                    
        except Exception as e:
            self.auth_token = TEST_USER_EMAIL
            print(f"✅ Authentication fallback - using email as token")
            return True

    def get_auth_headers(self):
        """Get authentication headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}

    async def get_target_listing_details(self):
        """Get the target listing details"""
        try:
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    for listing in listings:
                        if listing.get("id") == TARGET_LISTING_ID:
                            self.target_listing = listing
                            return listing
                    
                    return None
                else:
                    return None
        except Exception as e:
            print(f"Error getting listing details: {e}")
            return None

    async def test_seller_id_analysis(self):
        """Test 1: Analyze the seller_id in the target listing"""
        print(f"\n🧪 TEST 1: Seller ID Analysis for Target Listing")
        self.results["total_tests"] += 1
        
        try:
            if not self.target_listing:
                self.target_listing = await self.get_target_listing_details()
            
            if not self.target_listing:
                print(f"❌ FAIL: Could not retrieve target listing")
                self.results["failed"] += 1
                return False
            
            seller_id = self.target_listing.get("seller_id")
            print(f"   Target Listing Details:")
            print(f"     ID: {self.target_listing.get('id')}")
            print(f"     Title: {self.target_listing.get('title')}")
            print(f"     Seller ID: {seller_id}")
            print(f"     Status: {self.target_listing.get('status')}")
            
            # Check if seller_id looks like an email vs UUID
            if seller_id:
                if "@" in seller_id:
                    print(f"   📧 Seller ID is EMAIL format: {seller_id}")
                    self.results["findings"].append(f"Target listing uses EMAIL as seller_id: {seller_id}")
                elif len(seller_id) == 36 and seller_id.count("-") == 4:
                    print(f"   🆔 Seller ID is UUID format: {seller_id}")
                    self.results["findings"].append(f"Target listing uses UUID as seller_id: {seller_id}")
                else:
                    print(f"   ❓ Seller ID is UNKNOWN format: {seller_id}")
                    self.results["findings"].append(f"Target listing has unknown seller_id format: {seller_id}")
            else:
                print(f"   ❌ Seller ID is NULL/EMPTY")
                self.results["findings"].append("Target listing has NULL/EMPTY seller_id")
            
            print(f"✅ PASS: Seller ID analysis completed")
            self.results["passed"] += 1
            return True
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Seller ID analysis: {e}")
            return False

    async def test_compare_working_listings(self):
        """Test 2: Compare seller_id format with working listings"""
        print(f"\n🧪 TEST 2: Compare Seller ID Formats with Working Listings")
        self.results["total_tests"] += 1
        
        try:
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    print(f"   Analyzing seller_id formats across all listings:")
                    
                    email_format_count = 0
                    uuid_format_count = 0
                    null_count = 0
                    other_format_count = 0
                    
                    working_pdp_listings = []
                    failing_pdp_listings = []
                    
                    for listing in listings:
                        listing_id = listing.get("id")
                        seller_id = listing.get("seller_id")
                        title = listing.get("title", "Unknown")
                        
                        # Categorize seller_id format
                        if not seller_id:
                            null_count += 1
                            format_type = "NULL"
                        elif "@" in seller_id:
                            email_format_count += 1
                            format_type = "EMAIL"
                        elif len(seller_id) == 36 and seller_id.count("-") == 4:
                            uuid_format_count += 1
                            format_type = "UUID"
                        else:
                            other_format_count += 1
                            format_type = "OTHER"
                        
                        # Test PDP for this listing
                        pdp_url = f"{API_BASE}/listings/{listing_id}/pdp"
                        try:
                            async with self.session.get(pdp_url) as pdp_response:
                                if pdp_response.status == 200:
                                    working_pdp_listings.append({
                                        "id": listing_id,
                                        "title": title,
                                        "seller_id": seller_id,
                                        "format": format_type
                                    })
                                else:
                                    failing_pdp_listings.append({
                                        "id": listing_id,
                                        "title": title,
                                        "seller_id": seller_id,
                                        "format": format_type,
                                        "status": pdp_response.status
                                    })
                        except Exception as e:
                            failing_pdp_listings.append({
                                "id": listing_id,
                                "title": title,
                                "seller_id": seller_id,
                                "format": format_type,
                                "error": str(e)
                            })
                    
                    print(f"   Seller ID Format Distribution:")
                    print(f"     EMAIL format: {email_format_count}")
                    print(f"     UUID format: {uuid_format_count}")
                    print(f"     NULL/EMPTY: {null_count}")
                    print(f"     OTHER format: {other_format_count}")
                    
                    print(f"\n   PDP Working Listings ({len(working_pdp_listings)}):")
                    for listing in working_pdp_listings[:3]:  # Show first 3
                        print(f"     ✅ {listing['title']} - {listing['format']} ({listing['seller_id']})")
                    
                    print(f"\n   PDP Failing Listings ({len(failing_pdp_listings)}):")
                    for listing in failing_pdp_listings:
                        status = listing.get('status', listing.get('error', 'Unknown'))
                        print(f"     ❌ {listing['title']} - {listing['format']} ({listing['seller_id']}) - Status: {status}")
                    
                    # Analyze patterns
                    working_formats = [l['format'] for l in working_pdp_listings]
                    failing_formats = [l['format'] for l in failing_pdp_listings]
                    
                    if 'EMAIL' in failing_formats and 'UUID' in working_formats:
                        self.results["findings"].append("EMAIL format seller_id causes PDP failures, UUID format works")
                    elif 'UUID' in failing_formats and 'EMAIL' in working_formats:
                        self.results["findings"].append("UUID format seller_id causes PDP failures, EMAIL format works")
                    else:
                        self.results["findings"].append("No clear pattern between seller_id format and PDP success")
                    
                    print(f"✅ PASS: Seller ID format comparison completed")
                    self.results["passed"] += 1
                    return True
                else:
                    print(f"❌ FAIL: Failed to fetch listings")
                    self.results["failed"] += 1
                    return False
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Seller ID comparison: {e}")
            return False

    async def test_user_lookup_verification(self):
        """Test 3: Verify if the seller exists in users collection"""
        print(f"\n🧪 TEST 3: User/Seller Existence Verification")
        self.results["total_tests"] += 1
        
        try:
            if not self.target_listing:
                self.target_listing = await self.get_target_listing_details()
            
            seller_id = self.target_listing.get("seller_id")
            
            # Try to get user profile (if endpoint exists)
            # Note: We can't directly query users collection, but we can test related endpoints
            
            print(f"   Testing seller existence for: {seller_id}")
            
            # Method 1: Try to get user profile if endpoint exists
            try:
                async with self.session.get(f"{API_BASE}/users/{seller_id}") as response:
                    if response.status == 200:
                        user_data = await response.json()
                        print(f"   ✅ Seller found via users endpoint: {user_data.get('full_name', 'N/A')}")
                        self.results["findings"].append("Seller exists in users collection")
                    elif response.status == 404:
                        print(f"   ❌ Seller NOT found via users endpoint (404)")
                        self.results["findings"].append("Seller does NOT exist in users collection")
                    else:
                        print(f"   ❓ Users endpoint returned {response.status}")
            except Exception as e:
                print(f"   ❓ Users endpoint test failed: {e}")
            
            # Method 2: Check if seller_id matches our authenticated user
            if seller_id == TEST_USER_EMAIL:
                print(f"   📧 Seller ID matches our test user email")
                self.results["findings"].append("Seller ID matches authenticated user email")
            else:
                print(f"   📧 Seller ID does NOT match our test user email")
                print(f"      Seller ID: {seller_id}")
                print(f"      Test User: {TEST_USER_EMAIL}")
                self.results["findings"].append("Seller ID does not match authenticated user")
            
            # Method 3: Compare with working listing seller IDs
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    # Find a working PDP listing and compare seller_id
                    for listing in listings:
                        if listing.get("id") != TARGET_LISTING_ID:
                            test_pdp_url = f"{API_BASE}/listings/{listing['id']}/pdp"
                            async with self.session.get(test_pdp_url) as pdp_response:
                                if pdp_response.status == 200:
                                    working_seller_id = listing.get("seller_id")
                                    print(f"   ✅ Working listing seller_id: {working_seller_id}")
                                    
                                    if working_seller_id == seller_id:
                                        print(f"   🤔 Same seller_id but different PDP results - data inconsistency?")
                                        self.results["findings"].append("Same seller_id works for other listings - possible data inconsistency")
                                    else:
                                        print(f"   📊 Different seller_id format/value")
                                    break
            
            print(f"✅ PASS: User/Seller existence verification completed")
            self.results["passed"] += 1
            return True
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"User lookup verification: {e}")
            return False

    async def test_backend_logs_analysis(self):
        """Test 4: Analyze backend behavior with detailed requests"""
        print(f"\n🧪 TEST 4: Backend Behavior Analysis")
        self.results["total_tests"] += 1
        
        try:
            # Test the exact PDP endpoint with detailed logging
            pdp_url = f"{API_BASE}/listings/{TARGET_LISTING_ID}/pdp"
            
            print(f"   Making detailed PDP request to: {pdp_url}")
            
            # Test with different headers to see if it affects behavior
            test_cases = [
                {"name": "No Auth", "headers": {}},
                {"name": "With Auth", "headers": self.get_auth_headers()},
                {"name": "With User-Agent", "headers": {"User-Agent": "PDP-Debug-Test/1.0"}},
                {"name": "With Accept JSON", "headers": {"Accept": "application/json"}},
            ]
            
            for test_case in test_cases:
                print(f"\n   Testing: {test_case['name']}")
                try:
                    async with self.session.get(pdp_url, headers=test_case['headers']) as response:
                        status = response.status
                        response_text = await response.text()
                        content_type = response.headers.get('content-type', 'N/A')
                        
                        print(f"     Status: {status}")
                        print(f"     Content-Type: {content_type}")
                        print(f"     Response: {response_text}")
                        
                        if status != 404 or "Seller not found" not in response_text:
                            print(f"     🎯 Different behavior detected!")
                            self.results["findings"].append(f"Different behavior with {test_case['name']}: {status}")
                        
                except Exception as e:
                    print(f"     Error: {e}")
            
            # Test a working PDP endpoint for comparison
            print(f"\n   Testing working PDP endpoint for comparison:")
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    
                    # Find first working listing
                    for listing in listings:
                        if listing.get("id") != TARGET_LISTING_ID:
                            working_pdp_url = f"{API_BASE}/listings/{listing['id']}/pdp"
                            async with self.session.get(working_pdp_url) as pdp_response:
                                if pdp_response.status == 200:
                                    working_data = await pdp_response.json()
                                    print(f"     ✅ Working PDP for {listing.get('title')}")
                                    print(f"     Seller: {working_data.get('seller', {}).get('name', 'N/A')}")
                                    print(f"     Seller ID in listing: {listing.get('seller_id')}")
                                    break
            
            print(f"✅ PASS: Backend behavior analysis completed")
            self.results["passed"] += 1
            return True
                    
        except Exception as e:
            print(f"❌ FAIL: Exception occurred: {e}")
            self.results["failed"] += 1
            self.results["errors"].append(f"Backend behavior analysis: {e}")
            return False

    async def run_all_tests(self):
        """Run all seller lookup debugging tests"""
        print("🔍 SELLER LOOKUP DEBUGGING - 'Seller not found' Investigation")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Target Listing ID: {TARGET_LISTING_ID}")
        print(f"Issue: Listing exists but PDP returns 'Seller not found'")
        print("=" * 80)
        
        # Setup
        await self.setup_session()
        await self.authenticate()
        
        # Get target listing details first
        self.target_listing = await self.get_target_listing_details()
        
        # Run all tests
        tests = [
            self.test_seller_id_analysis,
            self.test_compare_working_listings,
            self.test_user_lookup_verification,
            self.test_backend_logs_analysis
        ]
        
        for test in tests:
            await test()
            await asyncio.sleep(0.5)
        
        # Cleanup
        await self.cleanup_session()
        
        # Print results
        self.print_results()

    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("🔍 SELLER LOOKUP DEBUGGING RESULTS")
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
        
        print(f"\n📋 ROOT CAUSE ANALYSIS:")
        
        findings_text = " ".join(self.results["findings"]).lower()
        
        if "email as seller_id" in findings_text and "uuid format works" in findings_text:
            print(f"   🎯 ROOT CAUSE: Backend PDP endpoint expects UUID seller_id but listing has EMAIL")
            print(f"   💡 SOLUTION: Fix backend to handle EMAIL format seller_id or update listing data")
        elif "does not exist in users collection" in findings_text:
            print(f"   🎯 ROOT CAUSE: Seller record missing from users collection")
            print(f"   💡 SOLUTION: Create missing user record or fix seller_id reference")
        elif "same seller_id works for other listings" in findings_text:
            print(f"   🎯 ROOT CAUSE: Data inconsistency - same seller_id works elsewhere")
            print(f"   💡 SOLUTION: Check for listing-specific data corruption or caching issues")
        else:
            print(f"   🤔 COMPLEX ISSUE: Multiple factors may be involved")
            print(f"   💡 RECOMMENDATION: Check backend PDP implementation and user lookup logic")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    debugger = SellerLookupDebugger()
    await debugger.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())