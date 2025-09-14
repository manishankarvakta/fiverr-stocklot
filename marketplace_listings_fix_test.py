#!/usr/bin/env python3
"""
🧪 MARKETPLACE LISTINGS API FIX TESTING
Testing the marketplace listings API fix for exotic filtering and category_group_id filter
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

class MarketplaceListingsFixTester:
    """Marketplace Listings API Fix Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.test_results = []
        
        # Store test data
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
    
    async def investigate_database_content(self):
        """Test 1: Investigate database content - listings, species, and category groups"""
        logger.info("\n🔍 Investigating Database Content...")
        
        # Get category groups
        try:
            async with self.session.get(f"{self.api_url}/category-groups") as response:
                if response.status == 200:
                    self.category_groups = await response.json()
                    logger.info(f"Found {len(self.category_groups)} category groups")
                    for group in self.category_groups:
                        logger.info(f"  - {group['name']} (ID: {group['id']})")
                else:
                    logger.error(f"Failed to get category groups: {response.status}")
        except Exception as e:
            logger.error(f"Error getting category groups: {e}")
        
        # Get species
        try:
            async with self.session.get(f"{self.api_url}/species") as response:
                if response.status == 200:
                    self.species_list = await response.json()
                    logger.info(f"Found {len(self.species_list)} species")
                    for species in self.species_list[:5]:  # Show first 5
                        logger.info(f"  - {species['name']} (ID: {species['id']}, Category: {species.get('category_group_id', 'N/A')})")
                else:
                    logger.error(f"Failed to get species: {response.status}")
        except Exception as e:
            logger.error(f"Error getting species: {e}")
        
        # Get all listings with include_exotics=true to see what exists
        try:
            async with self.session.get(f"{self.api_url}/listings?include_exotics=true&limit=50") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", []) if isinstance(data, dict) else data
                    self.listings_data = listings
                    
                    logger.info(f"Found {len(listings)} total listings in database")
                    
                    # Analyze species_id values in listings
                    species_ids_in_listings = set()
                    invalid_species_ids = []
                    
                    for listing in listings:
                        species_id = listing.get("species_id")
                        if species_id:
                            species_ids_in_listings.add(species_id)
                            # Check if this species_id exists in species collection
                            species_exists = any(s["id"] == species_id for s in self.species_list)
                            if not species_exists:
                                invalid_species_ids.append({
                                    "listing_id": listing.get("id"),
                                    "title": listing.get("title"),
                                    "species_id": species_id
                                })
                    
                    logger.info(f"Unique species_ids in listings: {len(species_ids_in_listings)}")
                    logger.info(f"Invalid species_ids found: {len(invalid_species_ids)}")
                    
                    if invalid_species_ids:
                        logger.warning("❌ CRITICAL ISSUE: Listings with invalid species_id values:")
                        for invalid in invalid_species_ids:
                            logger.warning(f"  - Listing '{invalid['title']}' has species_id '{invalid['species_id']}' (not in species collection)")
                    
                    self.log_test_result(
                        "Database Content Investigation",
                        len(invalid_species_ids) == 0,
                        f"Found {len(listings)} listings, {len(species_ids_in_listings)} unique species_ids, {len(invalid_species_ids)} invalid species_id references",
                        {
                            "total_listings": len(listings),
                            "unique_species_ids": len(species_ids_in_listings),
                            "invalid_species_ids": len(invalid_species_ids),
                            "invalid_references": invalid_species_ids
                        }
                    )
                else:
                    logger.error(f"Failed to get listings: {response.status}")
                    self.log_test_result(
                        "Database Content Investigation",
                        False,
                        f"Failed to retrieve listings: HTTP {response.status}",
                        None
                    )
        except Exception as e:
            logger.error(f"Error getting listings: {e}")
            self.log_test_result(
                "Database Content Investigation",
                False,
                f"Exception while investigating database: {str(e)}",
                None
            )
    
    async def test_exotic_filtering_fix(self):
        """Test 2: Test the exotic filtering fix - include_exotics=true vs include_exotics=false"""
        logger.info("\n🧪 Testing Exotic Filtering Fix...")
        
        # Test with include_exotics=true
        try:
            async with self.session.get(f"{self.api_url}/listings?include_exotics=true&limit=50") as response:
                if response.status == 200:
                    data = await response.json()
                    listings_with_exotics = data.get("listings", []) if isinstance(data, dict) else data
                    total_with_exotics = data.get("total_count", len(listings_with_exotics)) if isinstance(data, dict) else len(listings_with_exotics)
                    
                    logger.info(f"With include_exotics=true: {len(listings_with_exotics)} listings returned, total_count: {total_with_exotics}")
                else:
                    logger.error(f"Failed to get listings with include_exotics=true: {response.status}")
                    listings_with_exotics = []
                    total_with_exotics = 0
        except Exception as e:
            logger.error(f"Error testing include_exotics=true: {e}")
            listings_with_exotics = []
            total_with_exotics = 0
        
        # Test with include_exotics=false (default behavior)
        try:
            async with self.session.get(f"{self.api_url}/listings?include_exotics=false&limit=50") as response:
                if response.status == 200:
                    data = await response.json()
                    listings_without_exotics = data.get("listings", []) if isinstance(data, dict) else data
                    total_without_exotics = data.get("total_count", len(listings_without_exotics)) if isinstance(data, dict) else len(listings_without_exotics)
                    
                    logger.info(f"With include_exotics=false: {len(listings_without_exotics)} listings returned, total_count: {total_without_exotics}")
                else:
                    logger.error(f"Failed to get listings with include_exotics=false: {response.status}")
                    listings_without_exotics = []
                    total_without_exotics = 0
        except Exception as e:
            logger.error(f"Error testing include_exotics=false: {e}")
            listings_without_exotics = []
            total_without_exotics = 0
        
        # Test default behavior (no include_exotics parameter)
        try:
            async with self.session.get(f"{self.api_url}/listings?limit=50") as response:
                if response.status == 200:
                    data = await response.json()
                    listings_default = data.get("listings", []) if isinstance(data, dict) else data
                    total_default = data.get("total_count", len(listings_default)) if isinstance(data, dict) else len(listings_default)
                    
                    logger.info(f"With default (no include_exotics): {len(listings_default)} listings returned, total_count: {total_default}")
                else:
                    logger.error(f"Failed to get listings with default: {response.status}")
                    listings_default = []
                    total_default = 0
        except Exception as e:
            logger.error(f"Error testing default behavior: {e}")
            listings_default = []
            total_default = 0
        
        # Analyze results
        exotic_filter_working = (
            total_with_exotics > 0 and  # Should have listings when including exotics
            total_without_exotics >= 0 and  # Should have 0 or more when excluding exotics
            total_default >= 0  # Default should work
        )
        
        # Check if the "0 listings" issue is resolved
        zero_listings_issue_resolved = total_without_exotics > 0 or total_default > 0
        
        if zero_listings_issue_resolved:
            self.log_test_result(
                "Exotic Filtering Fix",
                True,
                f"✅ EXOTIC FILTERING FIX SUCCESSFUL! include_exotics=true: {total_with_exotics}, include_exotics=false: {total_without_exotics}, default: {total_default}",
                {
                    "with_exotics": total_with_exotics,
                    "without_exotics": total_without_exotics,
                    "default": total_default,
                    "zero_listings_issue_resolved": True
                }
            )
        else:
            self.log_test_result(
                "Exotic Filtering Fix",
                False,
                f"❌ EXOTIC FILTERING STILL BROKEN! include_exotics=true: {total_with_exotics}, include_exotics=false: {total_without_exotics}, default: {total_default}",
                {
                    "with_exotics": total_with_exotics,
                    "without_exotics": total_without_exotics,
                    "default": total_default,
                    "zero_listings_issue_resolved": False
                }
            )
    
    async def test_category_group_id_filter(self):
        """Test 3: Test category_group_id filter with real category group IDs"""
        logger.info("\n🧪 Testing Category Group ID Filter...")
        
        if not self.category_groups:
            self.log_test_result(
                "Category Group ID Filter",
                False,
                "Cannot test category_group_id filter - no category groups available",
                None
            )
            return
        
        # Test with each category group
        for category_group in self.category_groups[:3]:  # Test first 3 category groups
            category_name = category_group["name"]
            category_id = category_group["id"]
            
            try:
                # Test with include_exotics=true to see all listings for this category
                async with self.session.get(f"{self.api_url}/listings?category_group_id={category_id}&include_exotics=true&limit=50") as response:
                    if response.status == 200:
                        data = await response.json()
                        listings_with_exotics = data.get("listings", []) if isinstance(data, dict) else data
                        total_with_exotics = data.get("total_count", len(listings_with_exotics)) if isinstance(data, dict) else len(listings_with_exotics)
                        
                        # Test with include_exotics=false
                        async with self.session.get(f"{self.api_url}/listings?category_group_id={category_id}&include_exotics=false&limit=50") as response2:
                            if response2.status == 200:
                                data2 = await response2.json()
                                listings_without_exotics = data2.get("listings", []) if isinstance(data2, dict) else data2
                                total_without_exotics = data2.get("total_count", len(listings_without_exotics)) if isinstance(data2, dict) else len(listings_without_exotics)
                                
                                logger.info(f"Category '{category_name}': with_exotics={total_with_exotics}, without_exotics={total_without_exotics}")
                                
                                # Verify that returned listings actually belong to this category
                                if listings_with_exotics:
                                    # Check if listings have the correct category (through species lookup)
                                    valid_listings = 0
                                    for listing in listings_with_exotics:
                                        listing_species_id = listing.get("species_id")
                                        if listing_species_id:
                                            # Find species in our species list
                                            species = next((s for s in self.species_list if s["id"] == listing_species_id), None)
                                            if species and species.get("category_group_id") == category_id:
                                                valid_listings += 1
                                    
                                    filter_accuracy = (valid_listings / len(listings_with_exotics)) * 100 if listings_with_exotics else 100
                                    
                                    self.log_test_result(
                                        f"Category Group Filter - {category_name}",
                                        filter_accuracy >= 95,
                                        f"Filter accuracy: {filter_accuracy:.1f}% ({valid_listings}/{len(listings_with_exotics)} listings correctly filtered)",
                                        {
                                            "category": category_name,
                                            "category_id": category_id,
                                            "with_exotics": total_with_exotics,
                                            "without_exotics": total_without_exotics,
                                            "filter_accuracy": filter_accuracy,
                                            "valid_listings": valid_listings,
                                            "total_listings": len(listings_with_exotics)
                                        }
                                    )
                                else:
                                    self.log_test_result(
                                        f"Category Group Filter - {category_name}",
                                        True,
                                        f"No listings found for category (expected if no listings exist for this category)",
                                        {
                                            "category": category_name,
                                            "category_id": category_id,
                                            "with_exotics": 0,
                                            "without_exotics": 0
                                        }
                                    )
                            else:
                                logger.error(f"Failed to get listings for category {category_name} without exotics: {response2.status}")
                    else:
                        logger.error(f"Failed to get listings for category {category_name}: {response.status}")
                        self.log_test_result(
                            f"Category Group Filter - {category_name}",
                            False,
                            f"HTTP error {response.status} when testing category filter",
                            None
                        )
            except Exception as e:
                logger.error(f"Error testing category {category_name}: {e}")
                self.log_test_result(
                    f"Category Group Filter - {category_name}",
                    False,
                    f"Exception: {str(e)}",
                    None
                )
    
    async def test_species_id_filter(self):
        """Test 4: Test species_id filter with real species IDs"""
        logger.info("\n🧪 Testing Species ID Filter...")
        
        if not self.species_list:
            self.log_test_result(
                "Species ID Filter",
                False,
                "Cannot test species_id filter - no species available",
                None
            )
            return
        
        # Test with first few species that have listings
        species_with_listings = []
        
        # Find species that actually have listings
        for species in self.species_list[:10]:  # Check first 10 species
            species_id = species["id"]
            species_name = species["name"]
            
            try:
                async with self.session.get(f"{self.api_url}/listings?species_id={species_id}&include_exotics=true&limit=10") as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", []) if isinstance(data, dict) else data
                        if listings:
                            species_with_listings.append((species, len(listings)))
                            if len(species_with_listings) >= 3:  # Test with 3 species max
                                break
            except Exception as e:
                logger.warning(f"Error checking species {species_name}: {e}")
        
        if not species_with_listings:
            self.log_test_result(
                "Species ID Filter",
                False,
                "No species found with listings to test species_id filter",
                None
            )
            return
        
        # Test each species with listings
        for species, listing_count in species_with_listings:
            species_id = species["id"]
            species_name = species["name"]
            
            try:
                # Test with include_exotics=true
                async with self.session.get(f"{self.api_url}/listings?species_id={species_id}&include_exotics=true&limit=50") as response:
                    if response.status == 200:
                        data = await response.json()
                        listings_with_exotics = data.get("listings", []) if isinstance(data, dict) else data
                        total_with_exotics = data.get("total_count", len(listings_with_exotics)) if isinstance(data, dict) else len(listings_with_exotics)
                        
                        # Test with include_exotics=false
                        async with self.session.get(f"{self.api_url}/listings?species_id={species_id}&include_exotics=false&limit=50") as response2:
                            if response2.status == 200:
                                data2 = await response2.json()
                                listings_without_exotics = data2.get("listings", []) if isinstance(data2, dict) else data2
                                total_without_exotics = data2.get("total_count", len(listings_without_exotics)) if isinstance(data2, dict) else len(listings_without_exotics)
                                
                                # Verify all returned listings have the correct species_id
                                correct_species_count = sum(1 for listing in listings_with_exotics if listing.get("species_id") == species_id)
                                filter_accuracy = (correct_species_count / len(listings_with_exotics)) * 100 if listings_with_exotics else 100
                                
                                logger.info(f"Species '{species_name}': with_exotics={total_with_exotics}, without_exotics={total_without_exotics}, accuracy={filter_accuracy:.1f}%")
                                
                                self.log_test_result(
                                    f"Species ID Filter - {species_name}",
                                    filter_accuracy >= 95 and total_with_exotics > 0,
                                    f"Filter accuracy: {filter_accuracy:.1f}% ({correct_species_count}/{len(listings_with_exotics)} listings correctly filtered)",
                                    {
                                        "species": species_name,
                                        "species_id": species_id,
                                        "with_exotics": total_with_exotics,
                                        "without_exotics": total_without_exotics,
                                        "filter_accuracy": filter_accuracy,
                                        "correct_species_count": correct_species_count,
                                        "total_listings": len(listings_with_exotics)
                                    }
                                )
                            else:
                                logger.error(f"Failed to get listings for species {species_name} without exotics: {response2.status}")
                    else:
                        logger.error(f"Failed to get listings for species {species_name}: {response.status}")
                        self.log_test_result(
                            f"Species ID Filter - {species_name}",
                            False,
                            f"HTTP error {response.status} when testing species filter",
                            None
                        )
            except Exception as e:
                logger.error(f"Error testing species {species_name}: {e}")
                self.log_test_result(
                    f"Species ID Filter - {species_name}",
                    False,
                    f"Exception: {str(e)}",
                    None
                )
    
    async def test_filter_query_construction(self):
        """Test 5: Test filter query construction with combined filters"""
        logger.info("\n🧪 Testing Filter Query Construction...")
        
        if not (self.category_groups and self.species_list):
            self.log_test_result(
                "Filter Query Construction",
                False,
                "Cannot test filter query construction - missing category groups or species",
                None
            )
            return
        
        # Test combined filters
        test_cases = [
            {
                "name": "Category + Species Filter",
                "params": {
                    "category_group_id": self.category_groups[0]["id"] if self.category_groups else None,
                    "species_id": self.species_list[0]["id"] if self.species_list else None,
                    "include_exotics": "true"
                }
            },
            {
                "name": "Price Range Filter",
                "params": {
                    "price_min": "100",
                    "price_max": "1000",
                    "include_exotics": "true"
                }
            },
            {
                "name": "Region Filter",
                "params": {
                    "region": "Western Cape",
                    "include_exotics": "true"
                }
            },
            {
                "name": "Combined Complex Filter",
                "params": {
                    "category_group_id": self.category_groups[0]["id"] if self.category_groups else None,
                    "price_min": "50",
                    "price_max": "2000",
                    "region": "Cape",
                    "include_exotics": "false"
                }
            }
        ]
        
        for test_case in test_cases:
            test_name = test_case["name"]
            params = test_case["params"]
            
            # Skip if required params are None
            if any(v is None for k, v in params.items() if k in ["category_group_id", "species_id"]):
                continue
            
            try:
                # Build query string
                query_params = "&".join([f"{k}={v}" for k, v in params.items() if v is not None])
                url = f"{self.api_url}/listings?{query_params}&limit=20"
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", []) if isinstance(data, dict) else data
                        total_count = data.get("total_count", len(listings)) if isinstance(data, dict) else len(listings)
                        
                        logger.info(f"{test_name}: {total_count} listings found")
                        
                        # Validate that filters are actually applied
                        filter_validation_passed = True
                        validation_details = []
                        
                        if listings:
                            # Check category_group_id filter
                            if "category_group_id" in params:
                                expected_category_id = params["category_group_id"]
                                for listing in listings:
                                    listing_species_id = listing.get("species_id")
                                    if listing_species_id:
                                        species = next((s for s in self.species_list if s["id"] == listing_species_id), None)
                                        if not species or species.get("category_group_id") != expected_category_id:
                                            filter_validation_passed = False
                                            validation_details.append(f"Listing has wrong category (expected {expected_category_id})")
                                            break
                            
                            # Check price range filter
                            if "price_min" in params:
                                min_price = float(params["price_min"])
                                for listing in listings:
                                    listing_price = listing.get("price_per_unit", 0)
                                    if listing_price < min_price:
                                        filter_validation_passed = False
                                        validation_details.append(f"Listing price {listing_price} below minimum {min_price}")
                                        break
                            
                            if "price_max" in params:
                                max_price = float(params["price_max"])
                                for listing in listings:
                                    listing_price = listing.get("price_per_unit", 0)
                                    if listing_price > max_price:
                                        filter_validation_passed = False
                                        validation_details.append(f"Listing price {listing_price} above maximum {max_price}")
                                        break
                        
                        self.log_test_result(
                            f"Filter Query Construction - {test_name}",
                            filter_validation_passed,
                            f"Query executed successfully, {total_count} results, validation: {'PASSED' if filter_validation_passed else 'FAILED'}",
                            {
                                "test_case": test_name,
                                "params": params,
                                "total_count": total_count,
                                "validation_passed": filter_validation_passed,
                                "validation_details": validation_details
                            }
                        )
                    else:
                        logger.error(f"Failed to test {test_name}: HTTP {response.status}")
                        self.log_test_result(
                            f"Filter Query Construction - {test_name}",
                            False,
                            f"HTTP error {response.status}",
                            None
                        )
            except Exception as e:
                logger.error(f"Error testing {test_name}: {e}")
                self.log_test_result(
                    f"Filter Query Construction - {test_name}",
                    False,
                    f"Exception: {str(e)}",
                    None
                )
    
    async def run_all_tests(self):
        """Run all marketplace listings fix tests"""
        logger.info("🚀 Starting Marketplace Listings API Fix Testing...")
        
        await self.setup_session()
        
        try:
            # Run tests in sequence
            await self.investigate_database_content()
            await self.test_exotic_filtering_fix()
            await self.test_category_group_id_filter()
            await self.test_species_id_filter()
            await self.test_filter_query_construction()
            
        finally:
            await self.cleanup_session()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"\n📊 MARKETPLACE LISTINGS API FIX TEST SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests} ✅")
        logger.info(f"Failed: {failed_tests} ❌")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Key findings
        logger.info(f"\n🔍 KEY FINDINGS:")
        
        # Check if exotic filtering fix worked
        exotic_test = next((r for r in self.test_results if "Exotic Filtering Fix" in r["test"]), None)
        if exotic_test:
            if exotic_test["success"]:
                logger.info(f"  ✅ EXOTIC FILTERING FIX: SUCCESSFUL - The '0 listings' issue has been resolved!")
            else:
                logger.info(f"  ❌ EXOTIC FILTERING FIX: FAILED - The '0 listings' issue persists")
        
        # Check category group filter
        category_tests = [r for r in self.test_results if "Category Group Filter" in r["test"]]
        if category_tests:
            category_success_rate = sum(1 for t in category_tests if t["success"]) / len(category_tests) * 100
            logger.info(f"  📊 CATEGORY GROUP FILTER: {category_success_rate:.1f}% success rate")
        
        # Check species filter
        species_tests = [r for r in self.test_results if "Species ID Filter" in r["test"]]
        if species_tests:
            species_success_rate = sum(1 for t in species_tests if t["success"]) / len(species_tests) * 100
            logger.info(f"  🐄 SPECIES ID FILTER: {species_success_rate:.1f}% success rate")
        
        # Database integrity
        db_test = next((r for r in self.test_results if "Database Content Investigation" in r["test"]), None)
        if db_test and db_test.get("data"):
            invalid_count = db_test["data"].get("invalid_species_ids", 0)
            if invalid_count > 0:
                logger.info(f"  ⚠️  DATABASE INTEGRITY: {invalid_count} listings have invalid species_id references")
            else:
                logger.info(f"  ✅ DATABASE INTEGRITY: All listings have valid species_id references")
        
        if failed_tests > 0:
            logger.info(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  • {result['test']}: {result['details']}")
        
        logger.info(f"\n🎯 MARKETPLACE LISTINGS API STATUS:")
        logger.info(f"  {'✅' if passed_tests >= total_tests * 0.8 else '❌'} Overall API Health: {(passed_tests/total_tests)*100:.1f}%")

async def main():
    """Main test execution"""
    tester = MarketplaceListingsFixTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())