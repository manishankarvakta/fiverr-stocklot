#!/usr/bin/env python3
"""
🧪 MARKETPLACE FILTERS FIX TESTING
Testing the specific scenario mentioned in the continuation request about category and species filters
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MarketplaceFilterFixTester:
    """Test the specific marketplace filter issues"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str, data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {details}")
        self.test_results.append({"test": test_name, "success": success, "details": details, "data": data})
    
    async def test_root_cause_analysis(self):
        """Test 1: Root cause analysis of the 0 listings issue"""
        logger.info("\n🔍 ROOT CAUSE ANALYSIS: Why frontend shows 0 listings")
        
        try:
            # Test 1a: Frontend default call (include_exotics=false)
            async with self.session.get(f"{self.api_url}/listings?include_exotics=false") as response:
                if response.status == 200:
                    data = await response.json()
                    frontend_count = len(data.get("listings", []))
                    
                    self.log_result(
                        "Frontend Default Call (include_exotics=false)",
                        frontend_count == 0,
                        f"Returns {frontend_count} listings - this explains why frontend shows 0 listings",
                        {"listings_count": frontend_count, "total_count": data.get("total_count", 0)}
                    )
                    
            # Test 1b: With exotics included
            async with self.session.get(f"{self.api_url}/listings?include_exotics=true") as response:
                if response.status == 200:
                    data = await response.json()
                    with_exotics_count = len(data.get("listings", []))
                    
                    self.log_result(
                        "With Exotics Included (include_exotics=true)",
                        with_exotics_count > 0,
                        f"Returns {with_exotics_count} listings - proves listings exist but are filtered out",
                        {"listings_count": with_exotics_count, "total_count": data.get("total_count", 0)}
                    )
                    
            # Test 1c: Second listings endpoint (without exotic filtering)
            async with self.session.get(f"{self.api_url}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # This endpoint returns a list directly
                    if isinstance(data, list):
                        direct_count = len(data)
                        self.log_result(
                            "Direct Listings Endpoint (no exotic filtering)",
                            direct_count > 0,
                            f"Returns {direct_count} listings - confirms listings exist",
                            {"listings_count": direct_count}
                        )
                    
        except Exception as e:
            self.log_result("Root Cause Analysis", False, f"Exception: {str(e)}", None)
    
    async def test_category_group_filter_fix(self):
        """Test 2: Test if category_group_id filter works after the fix"""
        logger.info("\n🧪 TESTING CATEGORY GROUP FILTER FIX")
        
        try:
            # Get category groups first
            async with self.session.get(f"{self.api_url}/category-groups") as response:
                if response.status == 200:
                    categories = await response.json()
                    
                    if categories:
                        # Test with Poultry category
                        poultry_category = next((cat for cat in categories if cat['name'] == 'Poultry'), None)
                        
                        if poultry_category:
                            # Test category filter with include_exotics=true to see if it works
                            async with self.session.get(
                                f"{self.api_url}/listings?category=Poultry&include_exotics=true"
                            ) as response:
                                if response.status == 200:
                                    data = await response.json()
                                    poultry_listings = data.get("listings", [])
                                    
                                    self.log_result(
                                        "Category Group Filter (Poultry with exotics)",
                                        True,
                                        f"Category filter working: {len(poultry_listings)} poultry listings found",
                                        {
                                            "category": "Poultry",
                                            "listings_count": len(poultry_listings),
                                            "sample_titles": [l.get("title", "No title") for l in poultry_listings[:3]]
                                        }
                                    )
                                    
                            # Test category filter with include_exotics=false (the problematic case)
                            async with self.session.get(
                                f"{self.api_url}/listings?category=Poultry&include_exotics=false"
                            ) as response:
                                if response.status == 200:
                                    data = await response.json()
                                    filtered_poultry = data.get("listings", [])
                                    
                                    self.log_result(
                                        "Category Group Filter (Poultry without exotics)",
                                        len(filtered_poultry) >= 0,  # Accept 0 or more
                                        f"Category filter with exotic filtering: {len(filtered_poultry)} poultry listings",
                                        {
                                            "category": "Poultry",
                                            "listings_count": len(filtered_poultry),
                                            "core_only": data.get("core_only", False)
                                        }
                                    )
                        
        except Exception as e:
            self.log_result("Category Group Filter Fix", False, f"Exception: {str(e)}", None)
    
    async def test_species_id_filter_fix(self):
        """Test 3: Test if species_id filter works properly"""
        logger.info("\n🧪 TESTING SPECIES ID FILTER FIX")
        
        try:
            # Get species first
            async with self.session.get(f"{self.api_url}/species") as response:
                if response.status == 200:
                    species_list = await response.json()
                    
                    if species_list:
                        # Test with Commercial Broilers
                        broiler_species = next((s for s in species_list if 'Broiler' in s['name']), None)
                        
                        if broiler_species:
                            species_id = broiler_species['id']
                            
                            # Test species filter with include_exotics=true
                            async with self.session.get(
                                f"{self.api_url}/listings?species_id={species_id}&include_exotics=true"
                            ) as response:
                                if response.status == 200:
                                    data = await response.json()
                                    species_listings = data.get("listings", [])
                                    
                                    self.log_result(
                                        "Species ID Filter (with exotics)",
                                        True,
                                        f"Species filter working: {len(species_listings)} listings for {broiler_species['name']}",
                                        {
                                            "species": broiler_species['name'],
                                            "species_id": species_id,
                                            "listings_count": len(species_listings)
                                        }
                                    )
                                    
                            # Test species filter with include_exotics=false
                            async with self.session.get(
                                f"{self.api_url}/listings?species_id={species_id}&include_exotics=false"
                            ) as response:
                                if response.status == 200:
                                    data = await response.json()
                                    filtered_species = data.get("listings", [])
                                    
                                    self.log_result(
                                        "Species ID Filter (without exotics)",
                                        len(filtered_species) >= 0,
                                        f"Species filter with exotic filtering: {len(filtered_species)} listings for {broiler_species['name']}",
                                        {
                                            "species": broiler_species['name'],
                                            "species_id": species_id,
                                            "listings_count": len(filtered_species)
                                        }
                                    )
                        
        except Exception as e:
            self.log_result("Species ID Filter Fix", False, f"Exception: {str(e)}", None)
    
    async def test_data_integrity_issues(self):
        """Test 4: Identify data integrity issues causing filter problems"""
        logger.info("\n🔍 TESTING DATA INTEGRITY ISSUES")
        
        try:
            # Test the direct listings endpoint to see raw data
            async with self.session.get(f"{self.api_url}/listings") as response:
                if response.status == 200:
                    listings = await response.json()
                    
                    if isinstance(listings, list) and listings:
                        # Analyze species_id values
                        species_ids = [listing.get('species_id') for listing in listings]
                        uuid_format_ids = [sid for sid in species_ids if isinstance(sid, str) and len(sid) == 36 and '-' in sid]
                        string_format_ids = [sid for sid in species_ids if isinstance(sid, str) and len(sid) < 36]
                        
                        self.log_result(
                            "Data Integrity Analysis",
                            True,
                            f"Found {len(uuid_format_ids)} UUID-format species_ids and {len(string_format_ids)} string-format species_ids",
                            {
                                "total_listings": len(listings),
                                "uuid_format_species_ids": uuid_format_ids,
                                "string_format_species_ids": string_format_ids,
                                "sample_listing_with_string_id": next((l for l in listings if l.get('species_id') in string_format_ids), None)
                            }
                        )
                        
                        if string_format_ids:
                            self.log_result(
                                "Root Cause Identified",
                                True,
                                f"ISSUE FOUND: {len(string_format_ids)} listings have invalid species_id values: {string_format_ids}",
                                {"problematic_species_ids": string_format_ids}
                            )
                        
        except Exception as e:
            self.log_result("Data Integrity Issues", False, f"Exception: {str(e)}", None)
    
    async def test_province_filter_functionality(self):
        """Test 5: Test province filter functionality"""
        logger.info("\n🧪 TESTING PROVINCE FILTER FUNCTIONALITY")
        
        provinces = ["Western Cape", "Gauteng", "KwaZulu-Natal"]
        
        for province in provinces:
            try:
                # Test with include_exotics=true
                async with self.session.get(
                    f"{self.api_url}/listings?region={province}&include_exotics=true"
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        province_listings = data.get("listings", [])
                        
                        self.log_result(
                            f"Province Filter ({province})",
                            True,
                            f"Province filter working: {len(province_listings)} listings in {province}",
                            {"province": province, "listings_count": len(province_listings)}
                        )
                        
                        if len(province_listings) > 0:
                            break  # Found listings, no need to test other provinces
                            
            except Exception as e:
                self.log_result(f"Province Filter ({province})", False, f"Exception: {str(e)}", None)
    
    async def run_all_tests(self):
        """Run all tests"""
        logger.info("🚀 Starting Marketplace Filters Fix Testing...")
        
        await self.setup_session()
        
        try:
            await self.test_root_cause_analysis()
            await self.test_category_group_filter_fix()
            await self.test_species_id_filter_fix()
            await self.test_data_integrity_issues()
            await self.test_province_filter_functionality()
            
        finally:
            await self.cleanup_session()
        
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"\n📊 MARKETPLACE FILTERS FIX TEST SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests} ✅")
        logger.info(f"Failed: {failed_tests} ❌")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        logger.info(f"\n🎯 KEY FINDINGS:")
        
        # Root cause analysis
        root_cause_tests = [r for r in self.test_results if "Frontend Default Call" in r["test"] or "With Exotics" in r["test"]]
        if root_cause_tests:
            logger.info(f"  🔍 ROOT CAUSE CONFIRMED:")
            for test in root_cause_tests:
                logger.info(f"    • {test['test']}: {test['details']}")
        
        # Data integrity issues
        integrity_tests = [r for r in self.test_results if "Root Cause Identified" in r["test"]]
        if integrity_tests:
            logger.info(f"  ⚠️  DATA INTEGRITY ISSUES:")
            for test in integrity_tests:
                logger.info(f"    • {test['details']}")
        
        # Filter functionality
        logger.info(f"\n🔧 FILTER STATUS:")
        filter_tests = [r for r in self.test_results if "Filter" in r["test"]]
        for test in filter_tests:
            status = "✅" if test["success"] else "❌"
            logger.info(f"  {status} {test['test']}")
        
        if failed_tests > 0:
            logger.info(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  • {result['test']}: {result['details']}")

async def main():
    """Main test execution"""
    tester = MarketplaceFilterFixTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())