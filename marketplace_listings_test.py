#!/usr/bin/env python3
"""
🧪 MARKETPLACE LISTINGS SPECIFICATIONS INVESTIGATION
Testing critical API fixes and investigating livestock specifications issue
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MarketplaceListingsTester:
    """Marketplace Listings Specifications Investigation Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data storage
        self.sample_listing = None
        self.sample_buy_request = None
        
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
    
    async def test_critical_api_fixes(self):
        """Test 1: Critical API Fixes Verification"""
        logger.info("\n🧪 Testing Critical API Fixes...")
        
        # Test 1.1: GET /api/health (backend connectivity)
        try:
            async with self.session.get(f"{self.api_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    if "status" in data and data["status"] == "healthy":
                        logger.info("✅ Health endpoint working correctly - returns JSON")
                        self.test_results.append(("Health Endpoint", True, f"Status: {data['status']}"))
                    else:
                        logger.error(f"❌ Health endpoint returns invalid JSON: {data}")
                        self.test_results.append(("Health Endpoint", False, "Invalid JSON structure"))
                else:
                    logger.error(f"❌ Health endpoint failed: {response.status}")
                    self.test_results.append(("Health Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Health endpoint error: {e}")
            self.test_results.append(("Health Endpoint", False, str(e)))
        
        # Test 1.2: GET /api/platform/config (was missing /api prefix)
        try:
            async with self.session.get(f"{self.api_url}/platform/config") as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ Platform config endpoint accessible with /api prefix")
                    logger.info(f"   Config keys: {list(data.keys())}")
                    self.test_results.append(("Platform Config Endpoint", True, f"Keys: {list(data.keys())}"))
                else:
                    logger.error(f"❌ Platform config endpoint failed: {response.status}")
                    self.test_results.append(("Platform Config Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Platform config endpoint error: {e}")
            self.test_results.append(("Platform Config Endpoint", False, str(e)))
        
        # Test 1.3: GET /api/public/buy-requests (was returning HTML, should now return JSON)
        try:
            async with self.session.get(f"{self.api_url}/public/buy-requests") as response:
                if response.status == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        data = await response.json()
                        if isinstance(data, dict) and "items" in data:
                            buy_requests = data["items"]
                            logger.info(f"✅ Public buy requests endpoint returns JSON with {len(buy_requests)} requests")
                            
                            # Store sample for comparison
                            if buy_requests:
                                self.sample_buy_request = buy_requests[0]
                                logger.info(f"   Sample buy request fields: {list(self.sample_buy_request.keys())}")
                            
                            self.test_results.append(("Public Buy Requests Endpoint", True, f"JSON with {len(buy_requests)} requests"))
                        else:
                            logger.error(f"❌ Public buy requests returns invalid JSON structure: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                            self.test_results.append(("Public Buy Requests Endpoint", False, "Invalid JSON structure"))
                    else:
                        response_text = await response.text()
                        if '<html' in response_text.lower():
                            logger.error("❌ Public buy requests still returns HTML instead of JSON")
                            self.test_results.append(("Public Buy Requests Endpoint", False, "Returns HTML not JSON"))
                        else:
                            logger.error(f"❌ Public buy requests returns unexpected content type: {content_type}")
                            self.test_results.append(("Public Buy Requests Endpoint", False, f"Content-Type: {content_type}"))
                else:
                    logger.error(f"❌ Public buy requests endpoint failed: {response.status}")
                    self.test_results.append(("Public Buy Requests Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Public buy requests endpoint error: {e}")
            self.test_results.append(("Public Buy Requests Endpoint", False, str(e)))
    
    async def test_marketplace_listings_api(self):
        """Test 2: Marketplace Listings API Structure"""
        logger.info("\n🧪 Testing Marketplace Listings API Structure...")
        
        # Test GET /api/listings endpoint
        try:
            async with self.session.get(f"{self.api_url}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        listings = data
                        logger.info(f"✅ Marketplace listings endpoint returns JSON with {len(listings)} listings")
                        
                        if listings:
                            self.sample_listing = listings[0]
                            listing_fields = list(self.sample_listing.keys())
                            logger.info(f"   Sample listing fields: {listing_fields}")
                            
                            # Check for livestock specification fields
                            livestock_fields = [
                                'weight_kg', 'age_weeks', 'age_days', 'age', 'breed', 
                                'vaccination_status', 'health_certificates'
                            ]
                            
                            present_fields = [field for field in livestock_fields if field in self.sample_listing and self.sample_listing[field] is not None]
                            missing_fields = [field for field in livestock_fields if field not in self.sample_listing or self.sample_listing[field] is None]
                            
                            logger.info(f"   Livestock fields present: {present_fields}")
                            logger.info(f"   Livestock fields missing: {missing_fields}")
                            
                            # Check if breed_id is resolved to breed name
                            breed_info = "No breed info"
                            if 'breed_id' in self.sample_listing and self.sample_listing['breed_id']:
                                breed_info = f"breed_id: {self.sample_listing['breed_id']}"
                            if 'breed' in self.sample_listing and self.sample_listing['breed']:
                                breed_info += f", breed name: {self.sample_listing['breed']}"
                            
                            logger.info(f"   Breed information: {breed_info}")
                            
                            self.test_results.append(("Marketplace Listings API", True, f"{len(listings)} listings, {len(present_fields)}/{len(livestock_fields)} livestock fields"))
                        else:
                            logger.warning("⚠️ No listings found in marketplace")
                            self.test_results.append(("Marketplace Listings API", True, "No listings available"))
                    else:
                        logger.error(f"❌ Marketplace listings returns invalid JSON structure: {type(data)}")
                        self.test_results.append(("Marketplace Listings API", False, "Invalid JSON structure"))
                else:
                    logger.error(f"❌ Marketplace listings endpoint failed: {response.status}")
                    self.test_results.append(("Marketplace Listings API", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Marketplace listings endpoint error: {e}")
            self.test_results.append(("Marketplace Listings API", False, str(e)))
    
    async def test_livestock_specifications_comparison(self):
        """Test 3: Compare Buy Requests vs Marketplace Listings Data Structure"""
        logger.info("\n🧪 Comparing Buy Requests vs Marketplace Listings Data Structure...")
        
        # Create a buy request for comparison if none exists
        if not self.sample_buy_request:
            logger.info("   Creating test buy request for comparison...")
            try:
                buy_request_data = {
                    "species": "Commercial Broilers",
                    "product_type": "DAY_OLD",
                    "qty": 100,
                    "unit": "head",
                    "target_price_per_unit": 15.0,
                    "location": "Gauteng, South Africa",
                    "deadline": "2025-10-07T15:00:00Z",
                    "description": "Looking for Ross 308 day-old chicks for broiler production",
                    "weight_range": {"min": 40, "max": 60, "unit": "g"},
                    "age_requirements": {"min_age": 0, "max_age": 1, "unit": "days"},
                    "vaccination_requirements": ["Marek's disease", "Newcastle disease"]
                }
                
                async with self.session.post(
                    f"{self.api_url}/buy-requests/enhanced",
                    json=buy_request_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        buy_request_id = data.get("id")
                        
                        # Get the created buy request
                        async with self.session.get(
                            f"{self.api_url}/buy-requests/{buy_request_id}",
                            headers=self.get_headers()
                        ) as get_response:
                            if get_response.status == 200:
                                get_data = await get_response.json()
                                self.sample_buy_request = get_data.get("item", {})
                                logger.info("   ✅ Test buy request created successfully")
                            else:
                                logger.error(f"   ❌ Failed to retrieve created buy request: {get_response.status}")
                    else:
                        logger.error(f"   ❌ Failed to create test buy request: {response.status}")
            except Exception as e:
                logger.error(f"   ❌ Error creating test buy request: {e}")
        
        if not self.sample_buy_request or not self.sample_listing:
            logger.warning("⚠️ Cannot compare - missing sample data")
            self.test_results.append(("Data Structure Comparison", False, "Missing sample data"))
            return
        
        # Define expected livestock specification fields
        livestock_spec_fields = [
            'weight_kg', 'age_weeks', 'age_days', 'age', 'breed', 
            'vaccination_status', 'health_certificates', 'weight_range',
            'age_requirements', 'vaccination_requirements'
        ]
        
        # Analyze buy request fields
        buy_request_fields = set(self.sample_buy_request.keys())
        buy_request_livestock = [field for field in livestock_spec_fields if field in buy_request_fields]
        
        # Analyze listing fields  
        listing_fields = set(self.sample_listing.keys())
        listing_livestock = [field for field in livestock_spec_fields if field in listing_fields and self.sample_listing[field] is not None]
        
        # Find missing fields in listings
        missing_in_listings = [field for field in buy_request_livestock if field not in listing_fields or self.sample_listing.get(field) is None]
        
        logger.info("📊 DATA STRUCTURE COMPARISON:")
        logger.info(f"   Buy Request total fields: {len(buy_request_fields)}")
        logger.info(f"   Buy Request livestock fields: {buy_request_livestock}")
        logger.info(f"   Listing total fields: {len(listing_fields)}")
        logger.info(f"   Listing livestock fields: {listing_livestock}")
        logger.info(f"   Missing in listings: {missing_in_listings}")
        
        # Check specific field values
        logger.info("\n🔍 FIELD VALUE ANALYSIS:")
        
        # Check breed information
        buy_request_breed = self.sample_buy_request.get('breed') or self.sample_buy_request.get('species')
        listing_breed = self.sample_listing.get('breed') or self.sample_listing.get('breed_id')
        logger.info(f"   Buy Request breed/species: {buy_request_breed}")
        logger.info(f"   Listing breed: {listing_breed}")
        
        # Check weight information
        buy_request_weight = self.sample_buy_request.get('weight_kg') or self.sample_buy_request.get('weight_range')
        listing_weight = self.sample_listing.get('weight_kg')
        logger.info(f"   Buy Request weight: {buy_request_weight}")
        logger.info(f"   Listing weight: {listing_weight}")
        
        # Check age information
        buy_request_age = self.sample_buy_request.get('age_weeks') or self.sample_buy_request.get('age_days') or self.sample_buy_request.get('age_requirements')
        listing_age = self.sample_listing.get('age_weeks') or self.sample_listing.get('age_days') or self.sample_listing.get('age')
        logger.info(f"   Buy Request age: {buy_request_age}")
        logger.info(f"   Listing age: {listing_age}")
        
        # Check vaccination information
        buy_request_vaccination = self.sample_buy_request.get('vaccination_status') or self.sample_buy_request.get('vaccination_requirements')
        listing_vaccination = self.sample_listing.get('vaccination_status')
        logger.info(f"   Buy Request vaccination: {buy_request_vaccination}")
        logger.info(f"   Listing vaccination: {listing_vaccination}")
        
        # Check health certificates
        buy_request_health = self.sample_buy_request.get('health_certificates') or self.sample_buy_request.get('vet_certificates')
        listing_health = self.sample_listing.get('health_certificates') or self.sample_listing.get('has_vet_certificate')
        logger.info(f"   Buy Request health certs: {buy_request_health}")
        logger.info(f"   Listing health certs: {listing_health}")
        
        # Determine if there's a significant gap
        coverage_percentage = len(listing_livestock) / len(livestock_spec_fields) * 100 if livestock_spec_fields else 0
        
        logger.info(f"\n📈 LIVESTOCK SPECIFICATION COVERAGE:")
        logger.info(f"   Buy Request coverage: {len(buy_request_livestock)}/{len(livestock_spec_fields)} ({len(buy_request_livestock)/len(livestock_spec_fields)*100:.1f}%)")
        logger.info(f"   Listing coverage: {len(listing_livestock)}/{len(livestock_spec_fields)} ({coverage_percentage:.1f}%)")
        logger.info(f"   Gap: {len(missing_in_listings)} fields missing in listings")
        
        if coverage_percentage >= 80:
            logger.info(f"✅ Good livestock specification coverage: {coverage_percentage:.1f}%")
            self.test_results.append(("Data Structure Comparison", True, f"{coverage_percentage:.1f}% coverage"))
        elif coverage_percentage >= 50:
            logger.warning(f"⚠️ Moderate livestock specification coverage: {coverage_percentage:.1f}%")
            self.test_results.append(("Data Structure Comparison", False, f"Only {coverage_percentage:.1f}% coverage"))
        else:
            logger.error(f"❌ Poor livestock specification coverage: {coverage_percentage:.1f}%")
            self.test_results.append(("Data Structure Comparison", False, f"Poor {coverage_percentage:.1f}% coverage"))
    
    async def test_create_listing_with_livestock_fields(self):
        """Test 4: Attempt to Create Listing with Livestock Specification Fields"""
        logger.info("\n🧪 Testing Listing Creation with Livestock Fields...")
        
        # First get species and product types for valid IDs
        species_id = None
        product_type_id = None
        
        try:
            # Get species
            async with self.session.get(f"{self.api_url}/species") as response:
                if response.status == 200:
                    species_list = await response.json()
                    if isinstance(species_list, list) and species_list:
                        species_id = species_list[0]["id"]
                        logger.info(f"   Using species ID: {species_id}")
        except Exception as e:
            logger.error(f"❌ Error getting species: {e}")
        
        try:
            # Get product types
            async with self.session.get(f"{self.api_url}/product-types") as response:
                if response.status == 200:
                    product_types = await response.json()
                    if isinstance(product_types, list) and product_types:
                        product_type_id = product_types[0]["id"]
                        logger.info(f"   Using product type ID: {product_type_id}")
        except Exception as e:
            logger.error(f"❌ Error getting product types: {e}")
        
        if not species_id or not product_type_id:
            logger.error("❌ Cannot create test listing - missing species or product type IDs")
            self.test_results.append(("Create Listing with Livestock Fields", False, "Missing required IDs"))
            return
        
        # Create listing with livestock specification fields
        test_listing = {
            "species_id": species_id,
            "product_type_id": product_type_id,
            "title": "Test Livestock with Specifications",
            "description": "Test listing to verify livestock specification fields",
            "quantity": 10,
            "unit": "head",
            "price_per_unit": 1500.00,
            "delivery_available": True,
            "has_vet_certificate": True,
            "health_notes": "Healthy animals with full vaccination",
            
            # Livestock specification fields to test
            "weight_kg": 45.5,
            "age_weeks": 12,
            "age_days": 84,
            "age": "3 months old",
            "vaccination_status": "Fully vaccinated - Newcastle, Marek's disease",
            "health_certificates": ["Vet Certificate", "Vaccination Record"],
            
            "region": "Gauteng",
            "city": "Johannesburg"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/listings",
                json=test_listing,
                headers=self.get_headers()
            ) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    created_listing = data.get("listing", {})
                    
                    logger.info("✅ Test listing created successfully")
                    
                    # Check which livestock fields were actually stored
                    livestock_fields_sent = ['weight_kg', 'age_weeks', 'age_days', 'age', 'vaccination_status', 'health_certificates']
                    stored_fields = []
                    ignored_fields = []
                    
                    for field in livestock_fields_sent:
                        if field in created_listing and created_listing[field] is not None:
                            stored_fields.append(field)
                            logger.info(f"   ✅ {field}: {created_listing[field]}")
                        else:
                            ignored_fields.append(field)
                            logger.info(f"   ❌ {field}: Not stored or None")
                    
                    storage_rate = len(stored_fields) / len(livestock_fields_sent) * 100
                    
                    if storage_rate >= 80:
                        logger.info(f"✅ Good livestock field storage: {storage_rate:.1f}%")
                        self.test_results.append(("Create Listing with Livestock Fields", True, f"{storage_rate:.1f}% fields stored"))
                    else:
                        logger.warning(f"⚠️ Poor livestock field storage: {storage_rate:.1f}%")
                        logger.warning(f"   Ignored fields: {ignored_fields}")
                        self.test_results.append(("Create Listing with Livestock Fields", False, f"Only {storage_rate:.1f}% fields stored"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create test listing: {response.status} - {error_text}")
                    self.test_results.append(("Create Listing with Livestock Fields", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error creating test listing: {e}")
            self.test_results.append(("Create Listing with Livestock Fields", False, str(e)))
    
    async def test_breed_resolution(self):
        """Test 5: Breed ID Resolution to Breed Names"""
        logger.info("\n🧪 Testing Breed ID Resolution...")
        
        # Get breeds data
        try:
            async with self.session.get(f"{self.api_url}/breeds") as response:
                if response.status == 200:
                    breeds = await response.json()
                    if isinstance(breeds, list):
                        logger.info(f"✅ Breeds endpoint accessible - {len(breeds)} breeds available")
                        
                        if breeds:
                            sample_breed = breeds[0]
                            logger.info(f"   Sample breed: {sample_breed.get('name')} (ID: {sample_breed.get('id')})")
                        
                        self.test_results.append(("Breed Resolution - Breeds Available", True, f"{len(breeds)} breeds"))
                    else:
                        logger.error(f"❌ Breeds endpoint returns invalid structure: {type(breeds)}")
                        self.test_results.append(("Breed Resolution - Breeds Available", False, "Invalid structure"))
                else:
                    logger.error(f"❌ Breeds endpoint failed: {response.status}")
                    self.test_results.append(("Breed Resolution - Breeds Available", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Breeds endpoint error: {e}")
            self.test_results.append(("Breed Resolution - Breeds Available", False, str(e)))
        
        # Check if listings include resolved breed names
        if self.sample_listing:
            breed_id = self.sample_listing.get('breed_id')
            breed_name = self.sample_listing.get('breed')
            
            if breed_id and breed_name:
                logger.info(f"✅ Listing includes both breed_id ({breed_id}) and breed name ({breed_name})")
                self.test_results.append(("Breed Resolution - In Listings", True, f"Both ID and name present"))
            elif breed_id and not breed_name:
                logger.warning(f"⚠️ Listing has breed_id ({breed_id}) but no resolved breed name")
                self.test_results.append(("Breed Resolution - In Listings", False, "ID present but name not resolved"))
            elif not breed_id and not breed_name:
                logger.warning("⚠️ Listing has no breed information")
                self.test_results.append(("Breed Resolution - In Listings", False, "No breed information"))
            else:
                logger.info(f"✅ Listing has breed name ({breed_name}) without ID")
                self.test_results.append(("Breed Resolution - In Listings", True, "Name present"))
    
    async def run_all_tests(self):
        """Run all marketplace listings tests"""
        logger.info("🚀 Starting Marketplace Listings Specifications Investigation...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_critical_api_fixes()
            await self.test_marketplace_listings_api()
            await self.test_livestock_specifications_comparison()
            await self.test_create_listing_with_livestock_fields()
            await self.test_breed_resolution()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 MARKETPLACE LISTINGS SPECIFICATIONS INVESTIGATION SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FINDINGS:")
        
        # Critical API fixes
        health_working = any("Health Endpoint" in name and success for name, success, _ in self.test_results)
        config_working = any("Platform Config" in name and success for name, success, _ in self.test_results)
        buy_requests_working = any("Public Buy Requests" in name and success for name, success, _ in self.test_results)
        
        logger.info("   CRITICAL API FIXES:")
        logger.info(f"   • Health endpoint (/api/health): {'✅ WORKING' if health_working else '❌ FAILING'}")
        logger.info(f"   • Platform config (/api/platform/config): {'✅ WORKING' if config_working else '❌ FAILING'}")
        logger.info(f"   • Public buy requests (/api/public/buy-requests): {'✅ WORKING' if buy_requests_working else '❌ FAILING'}")
        
        # Livestock specifications
        comparison_working = any("Data Structure Comparison" in name and success for name, success, _ in self.test_results)
        listing_creation_working = any("Create Listing with Livestock Fields" in name and success for name, success, _ in self.test_results)
        
        logger.info("\n   LIVESTOCK SPECIFICATIONS:")
        logger.info(f"   • Data structure parity: {'✅ GOOD' if comparison_working else '❌ POOR'}")
        logger.info(f"   • Livestock field storage: {'✅ WORKING' if listing_creation_working else '❌ FAILING'}")
        
        # Sample data analysis
        if self.sample_listing and self.sample_buy_request:
            logger.info("\n   SAMPLE DATA ANALYSIS:")
            
            # Livestock fields in listings
            livestock_fields = ['weight_kg', 'age_weeks', 'age_days', 'age', 'breed', 'vaccination_status', 'health_certificates']
            listing_has = [field for field in livestock_fields if field in self.sample_listing and self.sample_listing[field] is not None]
            buy_request_has = [field for field in livestock_fields if field in self.sample_buy_request and self.sample_buy_request[field] is not None]
            
            logger.info(f"   • Listing livestock fields: {len(listing_has)}/{len(livestock_fields)} ({len(listing_has)/len(livestock_fields)*100:.1f}%)")
            logger.info(f"   • Buy request livestock fields: {len(buy_request_has)}/{len(livestock_fields)} ({len(buy_request_has)/len(livestock_fields)*100:.1f}%)")
            logger.info(f"   • Missing in listings: {[field for field in livestock_fields if field not in listing_has]}")
        
        logger.info("\n💡 RECOMMENDATIONS:")
        if not comparison_working:
            logger.info("   • URGENT: Enhance Listing model to include livestock specification fields")
            logger.info("   • Add fields: weight_kg, age_weeks, age_days, vaccination_status, health_certificates")
            logger.info("   • Resolve breed_id to breed names in API responses")
        
        if not listing_creation_working:
            logger.info("   • Fix listing creation to accept and store livestock specification fields")
            logger.info("   • Update database schema if necessary")
        
        if not (health_working and config_working and buy_requests_working):
            logger.info("   • Fix remaining critical API endpoint issues")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = MarketplaceListingsTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())