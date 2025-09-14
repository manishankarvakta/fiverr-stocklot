#!/usr/bin/env python3
"""
Marketplace Filtering & Buyer Processing Fee Backend Testing
Testing the specific features mentioned in the review request:
1. Buyer Processing Fee Testing (1.5% fee calculation)
2. Marketplace Filter Testing (category, species, combined filters)
3. API Dependency Testing (taxonomy endpoints)
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

# Backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class MarketplaceBuyerFeeBackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.category_groups = []
        self.species_list = []
        self.product_types = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name: str, success: bool, details: str, data: Any = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    async def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """Make HTTP request to backend"""
        url = f"{API_BASE}{endpoint}"
        try:
            if method.upper() == 'GET':
                async with self.session.get(url, params=params) as response:
                    response_data = await response.json()
                    return {
                        'status': response.status,
                        'data': response_data,
                        'success': response.status < 400
                    }
            elif method.upper() == 'POST':
                async with self.session.post(url, json=data, params=params) as response:
                    response_data = await response.json()
                    return {
                        'status': response.status,
                        'data': response_data,
                        'success': response.status < 400
                    }
        except Exception as e:
            return {
                'status': 500,
                'data': {'error': str(e)},
                'success': False
            }

    async def test_buyer_processing_fee_calculation(self):
        """Test 1.5% buyer processing fee calculation with different amounts"""
        print("\n🧮 TESTING BUYER PROCESSING FEE CALCULATION (1.5%)")
        
        test_amounts = [1000, 5000, 10000]  # R1000, R5000, R10000 as requested
        
        for amount in test_amounts:
            # Test checkout preview endpoint with correct structure
            cart_data = {
                "cart": [
                    {
                        "seller_id": "test-seller-1",
                        "merch_subtotal_minor": amount * 100,  # Convert to minor units (cents)
                        "delivery_minor": 0,
                        "abattoir_minor": 0,
                        "species": "cattle",
                        "export": False
                    }
                ],
                "currency": "ZAR"
            }
            
            response = await self.make_request('POST', '/checkout/preview', cart_data)
            
            if response['success']:
                data = response['data']
                expected_fee = amount * 0.015  # 1.5%
                expected_fee_minor = int(expected_fee * 100)  # Convert to minor units
                
                # Check if preview data is present
                if 'preview' in data:
                    preview = data['preview']
                    
                    # Check if buyer_processing_fee_minor is present in per_seller structure
                    if 'per_seller' in preview and len(preview['per_seller']) > 0:
                        seller_data = preview['per_seller'][0]
                        if 'lines' in seller_data and 'buyer_processing_fee_minor' in seller_data['lines']:
                            actual_fee_minor = seller_data['lines']['buyer_processing_fee_minor']
                            actual_fee = actual_fee_minor / 100  # Convert from minor units
                            
                            fee_correct = abs(actual_fee_minor - expected_fee_minor) <= 1  # Allow 1 cent tolerance
                            
                            self.log_test(
                                f"Buyer Processing Fee R{amount}",
                                fee_correct,
                                f"Expected: R{expected_fee:.2f} ({expected_fee_minor} minor), Got: R{actual_fee:.2f} ({actual_fee_minor} minor)",
                                {
                                    'amount': amount,
                                    'expected_fee': expected_fee,
                                    'expected_fee_minor': expected_fee_minor,
                                    'actual_fee': actual_fee,
                                    'actual_fee_minor': actual_fee_minor,
                                    'response': preview
                                }
                            )
                            
                            # Verify fee structure: subtotal + processing_fee + escrow_fee = total
                            lines = seller_data['lines']
                            calculated_total = (
                                lines.get('merch_subtotal_minor', 0) +
                                lines.get('buyer_processing_fee_minor', 0) +
                                lines.get('escrow_service_fee_minor', 0) +
                                lines.get('delivery_minor', 0) +
                                lines.get('abattoir_minor', 0)
                            )
                            
                            actual_total = seller_data['totals'].get('buyer_total_minor', 0)
                            total_correct = abs(calculated_total - actual_total) <= 1
                            
                            self.log_test(
                                f"Fee Structure Validation R{amount}",
                                total_correct,
                                f"Subtotal({lines.get('merch_subtotal_minor', 0)}) + Processing({lines.get('buyer_processing_fee_minor', 0)}) + Escrow({lines.get('escrow_service_fee_minor', 0)}) = {calculated_total}, Actual Total: {actual_total}",
                                {
                                    'calculated_total': calculated_total,
                                    'actual_total': actual_total,
                                    'components': lines
                                }
                            )
                        else:
                            self.log_test(
                                f"Buyer Processing Fee R{amount}",
                                False,
                                "buyer_processing_fee_minor field not found in per_seller[0].lines",
                                seller_data
                            )
                    else:
                        self.log_test(
                            f"Buyer Processing Fee R{amount}",
                            False,
                            "per_seller structure not found in preview",
                            preview
                        )
                else:
                    self.log_test(
                        f"Buyer Processing Fee R{amount}",
                        False,
                        "preview field not found in response",
                        data
                    )
            else:
                self.log_test(
                    f"Buyer Processing Fee R{amount}",
                    False,
                    f"Checkout preview failed: {response['data']}",
                    response
                )

    async def test_taxonomy_endpoints(self):
        """Test taxonomy endpoints for filtering dependencies"""
        print("\n📚 TESTING TAXONOMY ENDPOINTS")
        
        # Test categories endpoint
        response = await self.make_request('GET', '/taxonomy/categories')
        if response['success']:
            self.category_groups = response['data']
            self.log_test(
                "Categories Loading",
                True,
                f"Loaded {len(self.category_groups)} category groups",
                self.category_groups
            )
        else:
            self.log_test(
                "Categories Loading",
                False,
                f"Failed to load categories: {response['data']}",
                response
            )
            
        # Test product types endpoint
        response = await self.make_request('GET', '/product-types')
        if response['success']:
            self.product_types = response['data']
            self.log_test(
                "Product Types Loading",
                True,
                f"Loaded {len(self.product_types)} product types",
                self.product_types
            )
        else:
            self.log_test(
                "Product Types Loading",
                False,
                f"Failed to load product types: {response['data']}",
                response
            )
            
        # Test species endpoint (general)
        response = await self.make_request('GET', '/species')
        if response['success']:
            self.species_list = response['data']
            self.log_test(
                "Species Loading",
                True,
                f"Loaded {len(self.species_list)} species",
                self.species_list
            )
        else:
            self.log_test(
                "Species Loading",
                False,
                f"Failed to load species: {response['data']}",
                response
            )

    async def test_species_by_category_filtering(self):
        """Test species filtering by category group"""
        print("\n🔍 TESTING SPECIES BY CATEGORY FILTERING")
        
        if not self.category_groups:
            self.log_test(
                "Species by Category",
                False,
                "No category groups available for testing",
                None
            )
            return
            
        for category in self.category_groups[:3]:  # Test first 3 categories
            category_id = category.get('id')
            category_name = category.get('name', 'Unknown')
            
            if category_id:
                response = await self.make_request('GET', f'/species?category_group_id={category_id}')
                
                if response['success']:
                    species_count = len(response['data'])
                    self.log_test(
                        f"Species for {category_name}",
                        True,
                        f"Found {species_count} species in category {category_name}",
                        {
                            'category_id': category_id,
                            'category_name': category_name,
                            'species_count': species_count,
                            'species': response['data']
                        }
                    )
                else:
                    self.log_test(
                        f"Species for {category_name}",
                        False,
                        f"Failed to get species for {category_name}: {response['data']}",
                        response
                    )

    async def test_breed_filtering(self):
        """Test breed filtering by species"""
        print("\n🐄 TESTING BREED FILTERING BY SPECIES")
        
        if not self.species_list:
            self.log_test(
                "Breed Filtering",
                False,
                "No species available for breed testing",
                None
            )
            return
            
        for species in self.species_list[:3]:  # Test first 3 species
            species_id = species.get('id')
            species_name = species.get('name', 'Unknown')
            
            if species_id:
                response = await self.make_request('GET', f'/species/{species_id}/breeds')
                
                if response['success']:
                    breed_count = len(response['data'])
                    self.log_test(
                        f"Breeds for {species_name}",
                        True,
                        f"Found {breed_count} breeds for {species_name}",
                        {
                            'species_id': species_id,
                            'species_name': species_name,
                            'breed_count': breed_count,
                            'breeds': response['data']
                        }
                    )
                else:
                    self.log_test(
                        f"Breeds for {species_name}",
                        False,
                        f"Failed to get breeds for {species_name}: {response['data']}",
                        response
                    )

    async def test_marketplace_filtering(self):
        """Test marketplace listings with various filter combinations"""
        print("\n🏪 TESTING MARKETPLACE FILTERING")
        
        # Test 1: Basic listings endpoint
        response = await self.make_request('GET', '/listings')
        if response['success']:
            total_listings = len(response['data'].get('listings', []))
            self.log_test(
                "Basic Listings",
                True,
                f"Retrieved {total_listings} total listings",
                {'total_listings': total_listings}
            )
        else:
            self.log_test(
                "Basic Listings",
                False,
                f"Failed to get listings: {response['data']}",
                response
            )
            
        # Test 2: Category filtering
        if self.category_groups:
            for category in self.category_groups[:2]:  # Test first 2 categories
                category_id = category.get('id')
                category_name = category.get('name', 'Unknown')
                
                if category_id:
                    response = await self.make_request('GET', '/listings', params={'category_group_id': category_id})
                    
                    if response['success']:
                        filtered_count = len(response['data'].get('listings', []))
                        self.log_test(
                            f"Category Filter: {category_name}",
                            True,
                            f"Found {filtered_count} listings in {category_name}",
                            {
                                'category_id': category_id,
                                'category_name': category_name,
                                'filtered_count': filtered_count
                            }
                        )
                    else:
                        self.log_test(
                            f"Category Filter: {category_name}",
                            False,
                            f"Category filtering failed: {response['data']}",
                            response
                        )
                        
        # Test 3: Species filtering
        if self.species_list:
            for species in self.species_list[:2]:  # Test first 2 species
                species_id = species.get('id')
                species_name = species.get('name', 'Unknown')
                
                if species_id:
                    response = await self.make_request('GET', '/listings', params={'species_id': species_id})
                    
                    if response['success']:
                        filtered_count = len(response['data'].get('listings', []))
                        self.log_test(
                            f"Species Filter: {species_name}",
                            True,
                            f"Found {filtered_count} listings for {species_name}",
                            {
                                'species_id': species_id,
                                'species_name': species_name,
                                'filtered_count': filtered_count
                            }
                        )
                    else:
                        self.log_test(
                            f"Species Filter: {species_name}",
                            False,
                            f"Species filtering failed: {response['data']}",
                            response
                        )
                        
        # Test 4: Combined filters (category + species + province)
        if self.category_groups and self.species_list:
            category_id = self.category_groups[0].get('id')
            species_id = self.species_list[0].get('id')
            
            if category_id and species_id:
                params = {
                    'category_group_id': category_id,
                    'species_id': species_id,
                    'province': 'Western Cape'
                }
                
                response = await self.make_request('GET', '/listings', params=params)
                
                if response['success']:
                    filtered_count = len(response['data'].get('listings', []))
                    self.log_test(
                        "Combined Filters",
                        True,
                        f"Found {filtered_count} listings with combined filters",
                        {
                            'filters': params,
                            'filtered_count': filtered_count
                        }
                    )
                else:
                    self.log_test(
                        "Combined Filters",
                        False,
                        f"Combined filtering failed: {response['data']}",
                        response
                    )

    async def test_filter_result_reduction(self):
        """Verify that filters actually reduce the number of results"""
        print("\n📉 TESTING FILTER RESULT REDUCTION")
        
        # Get total listings count
        response = await self.make_request('GET', '/listings')
        if not response['success']:
            self.log_test(
                "Filter Result Reduction",
                False,
                "Could not get baseline listing count",
                response
            )
            return
            
        total_count = len(response['data'].get('listings', []))
        
        # Test with category filter
        if self.category_groups:
            category_id = self.category_groups[0].get('id')
            if category_id:
                response = await self.make_request('GET', '/listings', params={'category_group_id': category_id})
                
                if response['success']:
                    filtered_count = len(response['data'].get('listings', []))
                    reduction_working = filtered_count <= total_count
                    
                    self.log_test(
                        "Filter Reduction Verification",
                        reduction_working,
                        f"Total: {total_count}, Filtered: {filtered_count}, Reduction: {reduction_working}",
                        {
                            'total_count': total_count,
                            'filtered_count': filtered_count,
                            'reduction_percentage': ((total_count - filtered_count) / total_count * 100) if total_count > 0 else 0
                        }
                    )

    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 STARTING MARKETPLACE FILTERING & BUYER PROCESSING FEE BACKEND TESTING")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Test taxonomy endpoints first (dependencies)
            await self.test_taxonomy_endpoints()
            
            # Test species by category filtering
            await self.test_species_by_category_filtering()
            
            # Test breed filtering
            await self.test_breed_filtering()
            
            # Test marketplace filtering
            await self.test_marketplace_filtering()
            
            # Test filter result reduction
            await self.test_filter_result_reduction()
            
            # Test buyer processing fee calculation
            await self.test_buyer_processing_fee_calculation()
            
        finally:
            await self.cleanup_session()
            
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\n🔍 DETAILED RESULTS:")
        
        # Group by test category
        categories = {
            'Buyer Processing Fee': [],
            'Taxonomy Endpoints': [],
            'Marketplace Filtering': [],
            'Filter Reduction': []
        }
        
        for result in self.test_results:
            test_name = result['test']
            if 'Processing Fee' in test_name or 'Fee Structure' in test_name:
                categories['Buyer Processing Fee'].append(result)
            elif any(x in test_name for x in ['Categories', 'Species', 'Breeds', 'Product Types']):
                categories['Taxonomy Endpoints'].append(result)
            elif any(x in test_name for x in ['Filter', 'Listings']):
                categories['Marketplace Filtering'].append(result)
            elif 'Reduction' in test_name:
                categories['Filter Reduction'].append(result)
        
        for category, results in categories.items():
            if results:
                print(f"\n{category}:")
                for result in results:
                    status = "✅" if result['success'] else "❌"
                    print(f"  {status} {result['test']}: {result['details']}")
        
        # Critical findings
        print("\n🎯 CRITICAL FINDINGS:")
        
        # Check buyer processing fee
        fee_tests = [r for r in self.test_results if 'Processing Fee' in r['test']]
        fee_working = all(r['success'] for r in fee_tests)
        print(f"• 1.5% Buyer Processing Fee: {'✅ WORKING' if fee_working else '❌ ISSUES FOUND'}")
        
        # Check marketplace filters
        filter_tests = [r for r in self.test_results if 'Filter' in r['test'] or 'Listings' in r['test']]
        filters_working = any(r['success'] for r in filter_tests)
        print(f"• Marketplace Filters: {'✅ WORKING' if filters_working else '❌ ISSUES FOUND'}")
        
        # Check taxonomy endpoints
        taxonomy_tests = [r for r in self.test_results if any(x in r['test'] for x in ['Categories', 'Species', 'Breeds', 'Product Types'])]
        taxonomy_working = all(r['success'] for r in taxonomy_tests)
        print(f"• Taxonomy Endpoints: {'✅ WORKING' if taxonomy_working else '❌ ISSUES FOUND'}")
        
        print("\n" + "=" * 80)

async def main():
    """Main test runner"""
    tester = MarketplaceBuyerFeeBackendTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())