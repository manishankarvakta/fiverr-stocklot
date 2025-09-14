#!/usr/bin/env python3
"""
🧪 MARKETPLACE FILTERS BACKEND TESTING
Comprehensive testing of marketplace filter endpoints for category-groups, species, product-types, and breeds
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

class MarketplaceFiltersTester:
    """Comprehensive Marketplace Filters Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.test_results = []
        
        # Store test data for cascading tests
        self.category_groups = []
        self.species_list = []
        self.product_types = []
        self.breeds_list = []
        
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
    
    async def test_category_groups_endpoint(self):
        """Test 1: Category Groups Endpoint - GET /api/category-groups"""
        logger.info("\n🧪 Testing Category Groups Endpoint...")
        
        try:
            async with self.session.get(f"{self.api_url}/category-groups") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list) and len(data) > 0:
                        self.category_groups = data
                        
                        # Validate data structure
                        first_group = data[0]
                        required_fields = ['id', 'name']
                        missing_fields = [field for field in required_fields if field not in first_group]
                        
                        if not missing_fields:
                            # Check for expected category groups
                            group_names = [group['name'] for group in data]
                            expected_groups = ['Poultry', 'Ruminants', 'Rabbits', 'Aquaculture']
                            found_groups = [name for name in expected_groups if name in group_names]
                            
                            self.log_test_result(
                                "Category Groups Endpoint",
                                True,
                                f"Retrieved {len(data)} category groups. Found expected groups: {found_groups}",
                                {"count": len(data), "groups": group_names[:5]}  # First 5 for brevity
                            )
                        else:
                            self.log_test_result(
                                "Category Groups Endpoint",
                                False,
                                f"Missing required fields in response: {missing_fields}",
                                data[:2] if len(data) > 2 else data
                            )
                    else:
                        self.log_test_result(
                            "Category Groups Endpoint",
                            False,
                            f"Expected non-empty list, got: {type(data)} with length {len(data) if isinstance(data, list) else 'N/A'}",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Category Groups Endpoint",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        None
                    )
        except Exception as e:
            self.log_test_result(
                "Category Groups Endpoint",
                False,
                f"Exception: {str(e)}",
                None
            )
    
    async def test_species_endpoint(self):
        """Test 2: Species Endpoint - GET /api/species (with and without category_group_id)"""
        logger.info("\n🧪 Testing Species Endpoint...")
        
        # Test 2a: Get all species
        try:
            async with self.session.get(f"{self.api_url}/species") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list) and len(data) > 0:
                        self.species_list = data
                        
                        # Validate data structure
                        first_species = data[0]
                        required_fields = ['id', 'name', 'category_group_id']
                        missing_fields = [field for field in required_fields if field not in first_species]
                        
                        if not missing_fields:
                            species_names = [species['name'] for species in data]
                            expected_species = ['Commercial Broilers', 'Commercial Layers', 'Cattle', 'Goats', 'Sheep']
                            found_species = [name for name in expected_species if name in species_names]
                            
                            self.log_test_result(
                                "Species Endpoint (All)",
                                True,
                                f"Retrieved {len(data)} species. Found expected species: {found_species}",
                                {"count": len(data), "species": species_names[:5]}
                            )
                        else:
                            self.log_test_result(
                                "Species Endpoint (All)",
                                False,
                                f"Missing required fields in response: {missing_fields}",
                                data[:2] if len(data) > 2 else data
                            )
                    else:
                        self.log_test_result(
                            "Species Endpoint (All)",
                            False,
                            f"Expected non-empty list, got: {type(data)} with length {len(data) if isinstance(data, list) else 'N/A'}",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Species Endpoint (All)",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        None
                    )
        except Exception as e:
            self.log_test_result(
                "Species Endpoint (All)",
                False,
                f"Exception: {str(e)}",
                None
            )
        
        # Test 2b: Get species filtered by category_group_id
        if self.category_groups:
            poultry_group = next((group for group in self.category_groups if group['name'] == 'Poultry'), None)
            if poultry_group:
                try:
                    async with self.session.get(f"{self.api_url}/species?category_group_id={poultry_group['id']}") as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            if isinstance(data, list):
                                # Verify all returned species belong to Poultry category
                                all_poultry = all(species.get('category_group_id') == poultry_group['id'] for species in data)
                                
                                if all_poultry:
                                    species_names = [species['name'] for species in data]
                                    self.log_test_result(
                                        "Species Endpoint (Filtered by Category)",
                                        True,
                                        f"Retrieved {len(data)} poultry species: {species_names}",
                                        {"category": "Poultry", "count": len(data), "species": species_names}
                                    )
                                else:
                                    self.log_test_result(
                                        "Species Endpoint (Filtered by Category)",
                                        False,
                                        "Some species don't belong to the requested category group",
                                        data
                                    )
                            else:
                                self.log_test_result(
                                    "Species Endpoint (Filtered by Category)",
                                    False,
                                    f"Expected list, got: {type(data)}",
                                    data
                                )
                        else:
                            error_text = await response.text()
                            self.log_test_result(
                                "Species Endpoint (Filtered by Category)",
                                False,
                                f"HTTP {response.status}: {error_text}",
                                None
                            )
                except Exception as e:
                    self.log_test_result(
                        "Species Endpoint (Filtered by Category)",
                        False,
                        f"Exception: {str(e)}",
                        None
                    )
    
    async def test_product_types_endpoint(self):
        """Test 3: Product Types Endpoint - GET /api/product-types"""
        logger.info("\n🧪 Testing Product Types Endpoint...")
        
        try:
            async with self.session.get(f"{self.api_url}/product-types") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list) and len(data) > 0:
                        self.product_types = data
                        
                        # Validate data structure
                        first_type = data[0]
                        required_fields = ['id', 'code', 'label']
                        missing_fields = [field for field in required_fields if field not in first_type]
                        
                        if not missing_fields:
                            type_codes = [ptype['code'] for ptype in data]
                            expected_types = ['FRESH_EGGS', 'DAY_OLD', 'LAYERS', 'MARKET_READY', 'BREEDING_STOCK']
                            found_types = [code for code in expected_types if code in type_codes]
                            
                            self.log_test_result(
                                "Product Types Endpoint",
                                True,
                                f"Retrieved {len(data)} product types. Found expected types: {found_types}",
                                {"count": len(data), "types": type_codes[:5]}
                            )
                        else:
                            self.log_test_result(
                                "Product Types Endpoint",
                                False,
                                f"Missing required fields in response: {missing_fields}",
                                data[:2] if len(data) > 2 else data
                            )
                    else:
                        self.log_test_result(
                            "Product Types Endpoint",
                            False,
                            f"Expected non-empty list, got: {type(data)} with length {len(data) if isinstance(data, list) else 'N/A'}",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Product Types Endpoint",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        None
                    )
        except Exception as e:
            self.log_test_result(
                "Product Types Endpoint",
                False,
                f"Exception: {str(e)}",
                None
            )
    
    async def test_breeds_endpoints(self):
        """Test 4: Breeds Endpoints - GET /api/breeds and GET /api/species/{species_id}/breeds"""
        logger.info("\n🧪 Testing Breeds Endpoints...")
        
        # Test 4a: Get all breeds
        try:
            async with self.session.get(f"{self.api_url}/breeds") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list) and len(data) > 0:
                        self.breeds_list = data
                        
                        # Validate data structure
                        first_breed = data[0]
                        required_fields = ['id', 'name', 'species_id']
                        missing_fields = [field for field in required_fields if field not in first_breed]
                        
                        if not missing_fields:
                            breed_names = [breed['name'] for breed in data]
                            expected_breeds = ['Ross 308', 'ISA Brown', 'Angus', 'Boer', 'Dorper']
                            found_breeds = [name for name in expected_breeds if name in breed_names]
                            
                            self.log_test_result(
                                "Breeds Endpoint (All)",
                                True,
                                f"Retrieved {len(data)} breeds. Found expected breeds: {found_breeds}",
                                {"count": len(data), "breeds": breed_names[:5]}
                            )
                        else:
                            self.log_test_result(
                                "Breeds Endpoint (All)",
                                False,
                                f"Missing required fields in response: {missing_fields}",
                                data[:2] if len(data) > 2 else data
                            )
                    else:
                        self.log_test_result(
                            "Breeds Endpoint (All)",
                            False,
                            f"Expected non-empty list, got: {type(data)} with length {len(data) if isinstance(data, list) else 'N/A'}",
                            data
                        )
                else:
                    error_text = await response.text()
                    self.log_test_result(
                        "Breeds Endpoint (All)",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        None
                    )
        except Exception as e:
            self.log_test_result(
                "Breeds Endpoint (All)",
                False,
                f"Exception: {str(e)}",
                None
            )
        
        # Test 4b: Get breeds by species_id
        if self.species_list:
            # Find a species with breeds (try Commercial Broilers first)
            broiler_species = next((species for species in self.species_list if 'Broiler' in species['name']), None)
            if not broiler_species and self.species_list:
                broiler_species = self.species_list[0]  # Fallback to first species
            
            if broiler_species:
                try:
                    async with self.session.get(f"{self.api_url}/species/{broiler_species['id']}/breeds") as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            if isinstance(data, list):
                                # Verify all returned breeds belong to the specified species
                                all_correct_species = all(breed.get('species_id') == broiler_species['id'] for breed in data)
                                
                                if all_correct_species:
                                    breed_names = [breed['name'] for breed in data]
                                    self.log_test_result(
                                        "Breeds Endpoint (By Species)",
                                        True,
                                        f"Retrieved {len(data)} breeds for {broiler_species['name']}: {breed_names}",
                                        {"species": broiler_species['name'], "count": len(data), "breeds": breed_names}
                                    )
                                else:
                                    self.log_test_result(
                                        "Breeds Endpoint (By Species)",
                                        False,
                                        "Some breeds don't belong to the requested species",
                                        data
                                    )
                            else:
                                self.log_test_result(
                                    "Breeds Endpoint (By Species)",
                                    False,
                                    f"Expected list, got: {type(data)}",
                                    data
                                )
                        else:
                            error_text = await response.text()
                            self.log_test_result(
                                "Breeds Endpoint (By Species)",
                                False,
                                f"HTTP {response.status}: {error_text}",
                                None
                            )
                except Exception as e:
                    self.log_test_result(
                        "Breeds Endpoint (By Species)",
                        False,
                        f"Exception: {str(e)}",
                        None
                    )
    
    async def test_data_structure_validation(self):
        """Test 5: Validate data structures for frontend consumption"""
        logger.info("\n🧪 Testing Data Structure Validation...")
        
        # Test cascading filter relationships
        if self.category_groups and self.species_list and self.product_types and self.breeds_list:
            # Check if species reference valid category groups
            category_group_ids = {group['id'] for group in self.category_groups}
            species_with_valid_categories = [
                species for species in self.species_list 
                if species.get('category_group_id') in category_group_ids
            ]
            
            category_validation_rate = len(species_with_valid_categories) / len(self.species_list) * 100
            
            # Check if breeds reference valid species
            species_ids = {species['id'] for species in self.species_list}
            breeds_with_valid_species = [
                breed for breed in self.breeds_list 
                if breed.get('species_id') in species_ids
            ]
            
            breed_validation_rate = len(breeds_with_valid_species) / len(self.breeds_list) * 100
            
            # Check product type applicability
            product_types_with_groups = [
                ptype for ptype in self.product_types 
                if ptype.get('applicable_to_groups') and len(ptype['applicable_to_groups']) > 0
            ]
            
            product_type_coverage = len(product_types_with_groups) / len(self.product_types) * 100
            
            if category_validation_rate >= 95 and breed_validation_rate >= 95:
                self.log_test_result(
                    "Data Structure Validation",
                    True,
                    f"Excellent data integrity: {category_validation_rate:.1f}% species have valid categories, {breed_validation_rate:.1f}% breeds have valid species, {product_type_coverage:.1f}% product types have group applicability",
                    {
                        "category_validation_rate": category_validation_rate,
                        "breed_validation_rate": breed_validation_rate,
                        "product_type_coverage": product_type_coverage
                    }
                )
            else:
                self.log_test_result(
                    "Data Structure Validation",
                    False,
                    f"Data integrity issues: {category_validation_rate:.1f}% species have valid categories, {breed_validation_rate:.1f}% breeds have valid species",
                    {
                        "category_validation_rate": category_validation_rate,
                        "breed_validation_rate": breed_validation_rate,
                        "invalid_species": len(self.species_list) - len(species_with_valid_categories),
                        "invalid_breeds": len(self.breeds_list) - len(breeds_with_valid_species)
                    }
                )
        else:
            self.log_test_result(
                "Data Structure Validation",
                False,
                "Cannot validate data structure - missing data from previous tests",
                {
                    "has_categories": bool(self.category_groups),
                    "has_species": bool(self.species_list),
                    "has_product_types": bool(self.product_types),
                    "has_breeds": bool(self.breeds_list)
                }
            )
    
    async def test_frontend_filter_simulation(self):
        """Test 6: Simulate frontend filter workflow"""
        logger.info("\n🧪 Testing Frontend Filter Workflow Simulation...")
        
        if not (self.category_groups and self.species_list and self.product_types):
            self.log_test_result(
                "Frontend Filter Simulation",
                False,
                "Cannot simulate frontend workflow - missing required data",
                None
            )
            return
        
        # Simulate: User selects "Poultry" category
        poultry_group = next((group for group in self.category_groups if group['name'] == 'Poultry'), None)
        if not poultry_group:
            self.log_test_result(
                "Frontend Filter Simulation",
                False,
                "Cannot find Poultry category group for simulation",
                None
            )
            return
        
        try:
            # Step 1: Get species for Poultry
            async with self.session.get(f"{self.api_url}/species?category_group_id={poultry_group['id']}") as response:
                if response.status != 200:
                    raise Exception(f"Species fetch failed: {response.status}")
                poultry_species = await response.json()
            
            # Step 2: Get product types applicable to Poultry
            async with self.session.get(f"{self.api_url}/product-types?category_group=Poultry") as response:
                if response.status != 200:
                    raise Exception(f"Product types fetch failed: {response.status}")
                poultry_product_types = await response.json()
            
            # Step 3: Get breeds for first poultry species
            if poultry_species:
                first_species = poultry_species[0]
                async with self.session.get(f"{self.api_url}/species/{first_species['id']}/breeds") as response:
                    if response.status != 200:
                        raise Exception(f"Breeds fetch failed: {response.status}")
                    species_breeds = await response.json()
            else:
                species_breeds = []
            
            # Validate the workflow
            workflow_success = (
                len(poultry_species) > 0 and
                len(poultry_product_types) > 0 and
                len(species_breeds) >= 0  # Breeds might be empty for some species
            )
            
            if workflow_success:
                self.log_test_result(
                    "Frontend Filter Simulation",
                    True,
                    f"Successful filter workflow: {len(poultry_species)} species, {len(poultry_product_types)} product types, {len(species_breeds)} breeds for {first_species['name'] if poultry_species else 'N/A'}",
                    {
                        "category": "Poultry",
                        "species_count": len(poultry_species),
                        "product_types_count": len(poultry_product_types),
                        "breeds_count": len(species_breeds),
                        "sample_species": poultry_species[0]['name'] if poultry_species else None
                    }
                )
            else:
                self.log_test_result(
                    "Frontend Filter Simulation",
                    False,
                    f"Incomplete filter workflow: {len(poultry_species)} species, {len(poultry_product_types)} product types",
                    {
                        "poultry_species": len(poultry_species),
                        "poultry_product_types": len(poultry_product_types)
                    }
                )
        
        except Exception as e:
            self.log_test_result(
                "Frontend Filter Simulation",
                False,
                f"Workflow simulation failed: {str(e)}",
                None
            )
    
    async def run_all_tests(self):
        """Run all marketplace filter tests"""
        logger.info("🚀 Starting Marketplace Filters Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Run tests in sequence (some depend on data from previous tests)
            await self.test_category_groups_endpoint()
            await self.test_species_endpoint()
            await self.test_product_types_endpoint()
            await self.test_breeds_endpoints()
            await self.test_data_structure_validation()
            await self.test_frontend_filter_simulation()
            
        finally:
            await self.cleanup_session()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        logger.info(f"\n📊 MARKETPLACE FILTERS TEST SUMMARY")
        logger.info(f"{'='*50}")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed_tests} ✅")
        logger.info(f"Failed: {failed_tests} ❌")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            logger.info(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  • {result['test']}: {result['details']}")
        
        logger.info(f"\n🎯 MARKETPLACE FILTER ENDPOINTS STATUS:")
        endpoint_status = {
            "Category Groups": any(r["success"] for r in self.test_results if "Category Groups" in r["test"]),
            "Species (All)": any(r["success"] for r in self.test_results if "Species Endpoint (All)" in r["test"]),
            "Species (Filtered)": any(r["success"] for r in self.test_results if "Species Endpoint (Filtered" in r["test"]),
            "Product Types": any(r["success"] for r in self.test_results if "Product Types" in r["test"]),
            "Breeds (All)": any(r["success"] for r in self.test_results if "Breeds Endpoint (All)" in r["test"]),
            "Breeds (By Species)": any(r["success"] for r in self.test_results if "Breeds Endpoint (By Species)" in r["test"])
        }
        
        for endpoint, status in endpoint_status.items():
            status_icon = "✅" if status else "❌"
            logger.info(f"  {status_icon} {endpoint}")
        
        # Data summary
        if self.category_groups or self.species_list or self.product_types or self.breeds_list:
            logger.info(f"\n📈 DATA SUMMARY:")
            logger.info(f"  • Category Groups: {len(self.category_groups)}")
            logger.info(f"  • Species: {len(self.species_list)}")
            logger.info(f"  • Product Types: {len(self.product_types)}")
            logger.info(f"  • Breeds: {len(self.breeds_list)}")

async def main():
    """Main test execution"""
    tester = MarketplaceFiltersTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())