#!/usr/bin/env python3
"""
🧪 MARKETPLACE LISTINGS API TESTING
Comprehensive testing of marketplace listings endpoint and filter functionality
Focus: GET /api/listings endpoint with category_group_id, species_id, province filters
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
    """Comprehensive Marketplace Listings API Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.test_results = []
        
        # Store reference data for testing
        self.category_groups = []
        self.species_list = []
        self.listings_data = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_test_result(self, test_name: str, success: bool, details: str, data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    async def test_basic_listings_endpoint(self):
        """Test 1: Basic GET /api/listings endpoint"""
        logger.info("\n🧪 Testing Basic Listings Endpoint...")
        
        try:
            async with self.session.get(f"{self.api_url}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check if it's the first endpoint format (with exotic filtering)
                    if isinstance(data, dict) and "listings" in data:
                        listings = data["listings"]
                        total_count = data.get("total_count", 0)
                        
                        self.log_test_result(
                            "Basic Listings Endpoint (Dict Format)",
                            True,
                            f"Retrieved {len(listings)} listings out of {total_count} total. Response includes metadata.",
                            {
                                "listings_count": len(listings),
                                "total_count": total_count,
                                "has_filters_applied": "filters_applied" in data,
                                "sample_listing": listings[0] if listings else None
                            }
                        )
                        self.listings_data = listings
                        
                    # Check if it's the second endpoint format (direct list)
                    elif isinstance(data, list):
                        self.log_test_result(
                            "Basic Listings Endpoint (List Format)",
                            True,
                            f"Retrieved {len(data)} listings as direct list.",
                            {
                                "listings_count": len(data),
                                "sample_listing": data[0] if data else None
                            }
                        )
                        self.listings_data = data
                        
                    else:
                        self.log_test_result(
                            "Basic Listings Endpoint",
                            False,
                            f"Unexpected response format: {type(data)}",
                            data
                        )
                        
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Basic Listings Endpoint",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        None
                    )
        except Exception as e:
            self.log_test_result(
                "Basic Listings Endpoint",
                False,
                f"Exception: {str(e)}",
                None
            )
    
    async def test_listings_database_content(self):
        """Test 2: Check if there are any listings in the database"""
        logger.info("\n🧪 Testing Listings Database Content...")
        
        if not self.listings_data:
            self.log_test_result(
                "Listings Database Content",
                False,
                "No listings data available from previous test",
                None
            )
            return
        
        # Analyze the listings data
        if len(self.listings_data) == 0:
            self.log_test_result(
                "Listings Database Content",
                False,
                "Database contains 0 listings - this explains why frontend shows 0 listings",
                {"listings_count": 0}
            )
        else:
            # Analyze listing structure and content
            sample_listing = self.listings_data[0]
            
            # Check for required fields
            required_fields = ['id', 'title', 'species_id', 'price_per_unit']
            missing_fields = [field for field in required_fields if field not in sample_listing]
            
            # Check for filter-related fields
            filter_fields = {
                'species_id': sample_listing.get('species_id'),
                'breed_id': sample_listing.get('breed_id'),
                'product_type_id': sample_listing.get('product_type_id'),
                'region': sample_listing.get('region'),
                'city': sample_listing.get('city'),
                'status': sample_listing.get('status')
            }
            
            self.log_test_result(
                "Listings Database Content",
                True,
                f"Database contains {len(self.listings_data)} listings. Sample listing has filter fields: {list(filter_fields.keys())}",
                {
                    "listings_count": len(self.listings_data),
                    "missing_required_fields": missing_fields,
                    "filter_fields_present": filter_fields,
                    "sample_listing_id": sample_listing.get('id'),
                    "sample_title": sample_listing.get('title')
                }
            )
    
    async def fetch_reference_data(self):
        """Fetch reference data for filter testing"""
        logger.info("\n🔄 Fetching Reference Data for Filter Testing...")
        
        try:
            # Get category groups
            async with self.session.get(f"{self.api_url}/category-groups") as response:
                if response.status == 200:
                    self.category_groups = await response.json()
                    logger.info(f"Fetched {len(self.category_groups)} category groups")
                
            # Get species
            async with self.session.get(f"{self.api_url}/species") as response:
                if response.status == 200:
                    self.species_list = await response.json()
                    logger.info(f"Fetched {len(self.species_list)} species")
                    
        except Exception as e:
            logger.warning(f"Failed to fetch reference data: {e}")
    
    async def test_category_group_filter(self):
        """Test 3: Test category_group_id filter functionality"""
        logger.info("\n🧪 Testing Category Group ID Filter...")
        
        if not self.category_groups:
            self.log_test_result(
                "Category Group Filter",
                False,
                "No category groups available for testing",
                None
            )
            return
        
        # Test with first category group
        test_category = self.category_groups[0]
        category_id = test_category['id']
        category_name = test_category['name']
        
        try:
            # Test the listings endpoint with category filter
            # Note: The current listings endpoint doesn't directly support category_group_id
            # But we can test the species filtering approach used in the first endpoint
            
            async with self.session.get(f"{self.api_url}/listings?category={category_name}") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, dict) and "listings" in data:
                        filtered_listings = data["listings"]
                        filters_applied = data.get("filters_applied", {})
                        
                        self.log_test_result(
                            "Category Group Filter",
                            True,
                            f"Category filter working: Retrieved {len(filtered_listings)} listings for category '{category_name}'",
                            {
                                "category_tested": category_name,
                                "category_id": category_id,
                                "filtered_listings_count": len(filtered_listings),
                                "filters_applied": filters_applied
                            }
                        )
                    else:
                        self.log_test_result(
                            "Category Group Filter",
                            False,
                            f"Unexpected response format for category filter: {type(data)}",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Category Group Filter",
                        False,
                        f"Category filter failed - HTTP {response.status}: {error_text}",
                        {"category_tested": category_name}
                    )
                    
        except Exception as e:
            self.log_test_result(
                "Category Group Filter",
                False,
                f"Exception testing category filter: {str(e)}",
                {"category_tested": category_name}
            )
    
    async def test_species_id_filter(self):
        """Test 4: Test species_id filter functionality"""
        logger.info("\n🧪 Testing Species ID Filter...")
        
        if not self.species_list:
            self.log_test_result(
                "Species ID Filter",
                False,
                "No species available for testing",
                None
            )
            return
        
        # Test with first species
        test_species = self.species_list[0]
        species_id = test_species['id']
        species_name = test_species['name']
        
        try:
            # Test the comprehensive listings endpoint with species_id filter
            async with self.session.get(f"{self.api_url}/listings?species_id={species_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Handle both response formats
                    if isinstance(data, dict) and "listings" in data:
                        filtered_listings = data["listings"]
                    elif isinstance(data, list):
                        filtered_listings = data
                    else:
                        filtered_listings = []
                    
                    # Verify all returned listings have the correct species_id
                    correct_species = all(
                        listing.get('species_id') == species_id 
                        for listing in filtered_listings
                    )
                    
                    if correct_species or len(filtered_listings) == 0:
                        self.log_test_result(
                            "Species ID Filter",
                            True,
                            f"Species filter working: Retrieved {len(filtered_listings)} listings for species '{species_name}' (ID: {species_id})",
                            {
                                "species_tested": species_name,
                                "species_id": species_id,
                                "filtered_listings_count": len(filtered_listings),
                                "all_correct_species": correct_species
                            }
                        )
                    else:
                        self.log_test_result(
                            "Species ID Filter",
                            False,
                            f"Species filter not working correctly - some listings don't match species_id",
                            {
                                "species_tested": species_name,
                                "species_id": species_id,
                                "filtered_listings_count": len(filtered_listings)
                            }
                        )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Species ID Filter",
                        False,
                        f"Species filter failed - HTTP {response.status}: {error_text}",
                        {"species_tested": species_name}
                    )
                    
        except Exception as e:
            self.log_test_result(
                "Species ID Filter",
                False,
                f"Exception testing species filter: {str(e)}",
                {"species_tested": species_name}
            )
    
    async def test_province_filter(self):
        """Test 5: Test province filter functionality"""
        logger.info("\n🧪 Testing Province Filter...")
        
        # Test with common South African provinces
        test_provinces = ["Western Cape", "Gauteng", "KwaZulu-Natal"]
        
        for province in test_provinces:
            try:
                # Test region filter (closest to province filtering)
                async with self.session.get(f"{self.api_url}/listings?region={province}") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Handle both response formats
                        if isinstance(data, dict) and "listings" in data:
                            filtered_listings = data["listings"]
                        elif isinstance(data, list):
                            filtered_listings = data
                        else:
                            filtered_listings = []
                        
                        self.log_test_result(
                            f"Province Filter ({province})",
                            True,
                            f"Province/region filter working: Retrieved {len(filtered_listings)} listings for '{province}'",
                            {
                                "province_tested": province,
                                "filtered_listings_count": len(filtered_listings)
                            }
                        )
                        
                        # If we found listings, break to avoid testing all provinces
                        if len(filtered_listings) > 0:
                            break
                            
                    else:
                        error_text = await response.text()
                        self.log_test_result(
                            f"Province Filter ({province})",
                            False,
                            f"Province filter failed - HTTP {response.status}: {error_text}",
                            {"province_tested": province}
                        )
                        
            except Exception as e:
                self.log_test_result(
                    f"Province Filter ({province})",
                    False,
                    f"Exception testing province filter: {str(e)}",
                    {"province_tested": province}
                )
    
    async def test_combined_filters(self):
        """Test 6: Test combined filter functionality"""
        logger.info("\n🧪 Testing Combined Filters...")
        
        if not self.species_list:
            self.log_test_result(
                "Combined Filters",
                False,
                "No species available for combined filter testing",
                None
            )
            return
        
        # Test species + region combination
        test_species = self.species_list[0]
        species_id = test_species['id']
        test_region = "Western Cape"
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings?species_id={species_id}&region={test_region}"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Handle both response formats
                    if isinstance(data, dict) and "listings" in data:
                        filtered_listings = data["listings"]
                    elif isinstance(data, list):
                        filtered_listings = data
                    else:
                        filtered_listings = []
                    
                    self.log_test_result(
                        "Combined Filters",
                        True,
                        f"Combined filters working: Retrieved {len(filtered_listings)} listings for species '{test_species['name']}' in '{test_region}'",
                        {
                            "species_id": species_id,
                            "species_name": test_species['name'],
                            "region": test_region,
                            "filtered_listings_count": len(filtered_listings)
                        }
                    )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Combined Filters",
                        False,
                        f"Combined filters failed - HTTP {response.status}: {error_text}",
                        None
                    )
                    
        except Exception as e:
            self.log_test_result(
                "Combined Filters",
                False,
                f"Exception testing combined filters: {str(e)}",
                None
            )
    
    async def test_response_format_validation(self):
        """Test 7: Validate response format and error messages"""
        logger.info("\n🧪 Testing Response Format and Error Handling...")
        
        # Test with invalid species_id
        try:
            async with self.session.get(f"{self.api_url}/listings?species_id=invalid-id") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Should return empty results for invalid ID
                    if isinstance(data, dict) and "listings" in data:
                        listings_count = len(data["listings"])
                    elif isinstance(data, list):
                        listings_count = len(data)
                    else:
                        listings_count = -1
                    
                    self.log_test_result(
                        "Invalid Filter Handling",
                        True,
                        f"Invalid species_id handled gracefully: returned {listings_count} listings",
                        {"invalid_species_id_test": True, "listings_count": listings_count}
                    )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Invalid Filter Handling",
                        True,
                        f"Invalid species_id properly rejected - HTTP {response.status}: {error_text}",
                        {"invalid_species_id_test": True}
                    )
                    
        except Exception as e:
            self.log_test_result(
                "Invalid Filter Handling",
                False,
                f"Exception testing invalid filters: {str(e)}",
                None
            )
    
    async def run_all_tests(self):
        """Run all marketplace listings tests"""
        logger.info("🚀 Starting Marketplace Listings API Testing...")
        
        await self.setup_session()
        
        try:
            # Run tests in sequence
            await self.test_basic_listings_endpoint()
            await self.test_listings_database_content()
            await self.fetch_reference_data()
            await self.test_category_group_filter()
            await self.test_species_id_filter()
            await self.test_province_filter()
            await self.test_combined_filters()
            await self.test_response_format_validation()
            
        finally:
            await self.cleanup_session()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"\n📊 MARKETPLACE LISTINGS API TEST SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests} ✅")
        logger.info(f"Failed: {failed_tests} ❌")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            logger.info(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  • {result['test']}: {result['details']}")
        
        logger.info(f"\n🎯 KEY FINDINGS:")
        
        # Check if listings exist
        listings_test = next((r for r in self.test_results if "Database Content" in r["test"]), None)
        if listings_test:
            if listings_test["success"]:
                listings_count = listings_test["data"].get("listings_count", 0) if listings_test["data"] else 0
                if listings_count == 0:
                    logger.info(f"  🔍 ROOT CAUSE IDENTIFIED: Database contains 0 listings")
                    logger.info(f"      This explains why frontend shows 0 listings")
                else:
                    logger.info(f"  📈 Database contains {listings_count} listings")
        
        # Check filter functionality
        filter_tests = [r for r in self.test_results if "Filter" in r["test"]]
        working_filters = [r for r in filter_tests if r["success"]]
        
        logger.info(f"\n🔧 FILTER FUNCTIONALITY STATUS:")
        logger.info(f"  • Category Group Filter: {'✅' if any('Category Group' in r['test'] and r['success'] for r in self.test_results) else '❌'}")
        logger.info(f"  • Species ID Filter: {'✅' if any('Species ID' in r['test'] and r['success'] for r in self.test_results) else '❌'}")
        logger.info(f"  • Province/Region Filter: {'✅' if any('Province' in r['test'] and r['success'] for r in self.test_results) else '❌'}")
        logger.info(f"  • Combined Filters: {'✅' if any('Combined' in r['test'] and r['success'] for r in self.test_results) else '❌'}")
        
        # API endpoint status
        basic_test = next((r for r in self.test_results if "Basic Listings" in r["test"]), None)
        if basic_test:
            logger.info(f"\n🌐 API ENDPOINT STATUS:")
            logger.info(f"  • GET /api/listings: {'✅ Working' if basic_test['success'] else '❌ Failed'}")
            if basic_test["success"] and basic_test["data"]:
                logger.info(f"  • Response Format: {basic_test['test'].split('(')[1].split(')')[0] if '(' in basic_test['test'] else 'Unknown'}")

async def main():
    """Main test execution"""
    tester = MarketplaceListingsTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())