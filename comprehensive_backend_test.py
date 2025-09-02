#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class StockLotAPITester:
    def __init__(self, base_url="https://farmstock-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.seller_token = None
        self.admin_token = None

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None and isinstance(response_data, dict):
            print(f"   Response preview: {json.dumps(response_data, indent=2)[:200]}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def test_api_endpoint(self, method, endpoint, expected_status=200, data=None, description="", token=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use specific token if provided, otherwise use default
        auth_token = token or self.token
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        test_name = f"{method} {endpoint}" + (f" ({description})" if description else "")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}

            if success:
                self.log_result(test_name, True, f"Status: {response.status_code}", response_data)
                return True, response_data
            else:
                self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", response_data)
                return False, response_data

        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n🔍 Testing Basic API Connectivity...")
        
        try:
            response = requests.get(self.base_url.replace('/api', ''), timeout=5)
            print(f"   Base URL connectivity: {response.status_code}")
        except Exception as e:
            print(f"   Base URL connectivity failed: {e}")

    def test_comprehensive_taxonomy(self):
        """Test comprehensive taxonomy system"""
        print("\n🔍 Testing Comprehensive Taxonomy System...")
        
        # Test category groups
        success, category_groups = self.test_api_endpoint('GET', '/category-groups', description="Get category groups")
        
        if success and isinstance(category_groups, list):
            print(f"   Found {len(category_groups)} category groups:")
            for group in category_groups:
                print(f"   - {group.get('name', 'Unknown')} (ID: {group.get('id', 'N/A')})")
        
        # Test species endpoint
        success, species_data = self.test_api_endpoint('GET', '/species', description="Get all species")
        
        if success and isinstance(species_data, list):
            print(f"   Found {len(species_data)} species:")
            free_range_species = [s for s in species_data if isinstance(s, dict) and s.get('is_free_range', False)]
            print(f"   - Free Range species: {len(free_range_species)}")
            for species in species_data[:5]:  # Show first 5
                if isinstance(species, dict):
                    print(f"   - {species.get('name', 'Unknown')} {'🌿' if species.get('is_free_range') else ''}")
        else:
            print("   ❌ Species endpoint failed - this is a critical issue!")
            species_data = []  # Set empty list for downstream tests
        # Test breeds for specific species
        if success and species_data:
            # Test breeds for Free Range Chickens
            free_range_chickens = next((s for s in species_data if 'Free Range' in s.get('name', '')), None)
            if free_range_chickens:
                success, breeds = self.test_api_endpoint('GET', f'/species/{free_range_chickens["id"]}/breeds', 
                                                       description="Get Free Range Chicken breeds")
                if success and isinstance(breeds, list):
                    print(f"   Free Range Chicken breeds: {len(breeds)}")
                    for breed in breeds[:3]:
                        print(f"   - {breed.get('name', 'Unknown')}")
        
        # Test product types
        success, product_types = self.test_api_endpoint('GET', '/product-types', description="Get product types")
        
        if success and isinstance(product_types, list):
            print(f"   Found {len(product_types)} product types:")
            for pt in product_types[:5]:  # Show first 5
                print(f"   - {pt.get('label', 'Unknown')} ({pt.get('code', 'N/A')})")
        
        # Test full taxonomy endpoint
        success, full_taxonomy = self.test_api_endpoint('GET', '/taxonomy/full', description="Get full taxonomy")
        
        if success and isinstance(full_taxonomy, list):
            print(f"   Full taxonomy structure loaded with {len(full_taxonomy)} category groups")
            for group_data in full_taxonomy[:2]:  # Show first 2 groups
                group = group_data.get('group', {})
                species = group_data.get('species', [])
                product_types = group_data.get('product_types', [])
                print(f"   - {group.get('name', 'Unknown')}: {len(species)} species, {len(product_types)} product types")
        
        return category_groups, species_data, product_types

    def test_authentication_system(self):
        """Test authentication system comprehensively"""
        print("\n🔍 Testing Authentication System...")
        
        # Test seller login
        seller_login_data = {
            "email": "seller@farmstock.co.za",
            "password": "password123"
        }
        
        success, seller_response = self.test_api_endpoint('POST', '/auth/login', 200, seller_login_data, "Seller login")
        
        if success and 'access_token' in seller_response:
            self.seller_token = seller_response['access_token']
            seller_user = seller_response.get('user', {})
            print(f"   ✅ Seller authenticated: {seller_user.get('full_name', 'Unknown')}")
            print(f"   Seller roles: {seller_user.get('roles', [])}")
        
        # Test admin login
        admin_login_data = {
            "email": "admin@stocklot.co.za",
            "password": "Admin123!"
        }
        
        success, admin_response = self.test_api_endpoint('POST', '/auth/login', 200, admin_login_data, "Admin login")
        
        if success and 'access_token' in admin_response:
            self.admin_token = admin_response['access_token']
            admin_user = admin_response.get('user', {})
            print(f"   ✅ Admin authenticated: {admin_user.get('full_name', 'Unknown')}")
            print(f"   Admin roles: {admin_user.get('roles', [])}")
        
        return self.seller_token is not None, self.admin_token is not None

    def test_listing_creation_workflow(self, species_data, product_types):
        """Test comprehensive listing creation workflow"""
        if not self.seller_token:
            print("\n⚠️  Skipping listing creation - no seller authentication")
            return False
            
        print("\n🔍 Testing Listing Creation Workflow...")
        
        # Check if species_data is valid
        if not species_data or not isinstance(species_data, list):
            print("   ⚠️  Invalid species data - cannot create listing")
            return False
        
        # Find Free Range Chickens species
        free_range_chickens = None
        for s in species_data:
            if isinstance(s, dict) and 'Free Range' in s.get('name', ''):
                free_range_chickens = s
                break
        
        if not free_range_chickens:
            print("   ⚠️  Free Range Chickens species not found")
            # Try to find any chicken species as fallback
            for s in species_data:
                if isinstance(s, dict) and 'chicken' in s.get('name', '').lower():
                    free_range_chickens = s
                    print(f"   Using fallback species: {s.get('name', 'Unknown')}")
                    break
        
        if not free_range_chickens:
            print("   ⚠️  No suitable chicken species found")
            return False
        
        # Get breeds for Free Range Chickens
        success, breeds = self.test_api_endpoint('GET', f'/species/{free_range_chickens["id"]}/breeds', 
                                               description="Get breeds for listing")
        
        if not success or not breeds:
            print("   ⚠️  No breeds found for Free Range Chickens")
            return False
        
        # Find Koekoek Free Range breed
        koekoek_breed = next((b for b in breeds if 'Koekoek' in b.get('name', '')), None)
        if not koekoek_breed:
            print("   ⚠️  Koekoek Free Range breed not found")
            return False
        
        # Find Fertilized Eggs product type
        fertilized_eggs_pt = next((pt for pt in product_types if pt.get('code') == 'FERTILIZED_EGGS'), None)
        if not fertilized_eggs_pt:
            print("   ⚠️  Fertilized Eggs product type not found")
            return False
        
        # Create comprehensive listing
        listing_data = {
            "species_id": free_range_chickens['id'],
            "breed_id": koekoek_breed['id'],
            "product_type_id": fertilized_eggs_pt['id'],
            "title": "Premium Koekoek Free Range Fertilized Eggs - API Test",
            "description": "High-quality free-range Koekoek fertilized eggs from certified organic farm. Perfect for hatching healthy, hardy chicks with excellent local adaptation.",
            "quantity": 24,
            "unit": "dozen",
            "price_per_unit": 28.50,
            "fulfillment": "delivery_only",
            "delivery_available": True,
            "has_vet_certificate": True,
            "health_notes": "Free range certified, organic feed only, health certificates available",
            "region": "Western Cape",
            "city": "Stellenbosch"
        }
        
        success, listing_response = self.test_api_endpoint('POST', '/listings', 200, listing_data, 
                                                         "Create Free Range listing", self.seller_token)
        
        if success:
            print(f"   ✅ Successfully created listing: {listing_response.get('title', 'Unknown')}")
            return True
        
        return False

    def test_marketplace_functionality(self):
        """Test marketplace functionality"""
        print("\n🔍 Testing Marketplace Functionality...")
        
        # Test basic listings
        success, listings = self.test_api_endpoint('GET', '/listings', description="Get marketplace listings")
        
        if success and isinstance(listings, list):
            print(f"   Found {len(listings)} active listings")
            
            # Test filtering by species
            if listings:
                first_listing = listings[0]
                species_id = first_listing.get('species_id')
                if species_id:
                    success, filtered_listings = self.test_api_endpoint('GET', f'/listings?species_id={species_id}', 
                                                                      description="Filter by species")
                    if success:
                        print(f"   Filtered listings by species: {len(filtered_listings)} results")
            
            # Test filtering by region
            success, region_listings = self.test_api_endpoint('GET', '/listings?region=Western Cape', 
                                                            description="Filter by region")
            if success:
                print(f"   Filtered listings by region: {len(region_listings)} results")
        
        return success

    def test_order_creation(self):
        """Test order creation functionality"""
        if not self.seller_token:
            print("\n⚠️  Skipping order creation - no authentication")
            return False
            
        print("\n🔍 Testing Order Creation...")
        
        # Get available listings
        success, listings = self.test_api_endpoint('GET', '/listings', description="Get listings for order")
        
        if success and listings:
            first_listing = listings[0]
            
            # Create order
            order_data = {
                "listing_id": first_listing['id'],
                "quantity": 1
            }
            
            success, order_response = self.test_api_endpoint('POST', '/orders', 200, order_data, 
                                                           "Create order", self.seller_token)
            
            if success:
                print(f"   ✅ Order created successfully: {order_response.get('id', 'Unknown')}")
                print(f"   Total amount: R{order_response.get('total_amount', 0)}")
                return True
        
        return False

    def test_admin_functionality(self):
        """Test admin functionality"""
        if not self.admin_token:
            print("\n⚠️  Skipping admin tests - no admin authentication")
            return False
            
        print("\n🔍 Testing Admin Functionality...")
        
        # Test admin stats
        success, stats = self.test_api_endpoint('GET', '/admin/stats', 200, None, 
                                              "Get admin stats", self.admin_token)
        
        if success:
            print(f"   Admin stats - Users: {stats.get('total_users', 0)}, "
                  f"Listings: {stats.get('total_listings', 0)}, "
                  f"Orders: {stats.get('total_orders', 0)}")
        
        # Test pending listings
        success, pending = self.test_api_endpoint('GET', '/admin/listings/pending', 200, None, 
                                                "Get pending listings", self.admin_token)
        
        if success:
            print(f"   Pending listings for approval: {len(pending) if isinstance(pending, list) else 0}")
        
        return success

    def run_comprehensive_test(self):
        """Run all comprehensive tests"""
        print("🚀 Starting StockLot Comprehensive API Test")
        print("=" * 70)
        
        # Test basic connectivity
        self.test_basic_connectivity()
        
        # Test comprehensive taxonomy
        category_groups, species_data, product_types = self.test_comprehensive_taxonomy()
        
        # Test authentication system
        seller_auth, admin_auth = self.test_authentication_system()
        
        # Test listing creation workflow
        if seller_auth and species_data and product_types:
            self.test_listing_creation_workflow(species_data, product_types)
        
        # Test marketplace functionality
        self.test_marketplace_functionality()
        
        # Test order creation
        if seller_auth:
            self.test_order_creation()
        
        # Test admin functionality
        if admin_auth:
            self.test_admin_functionality()
        
        # Print comprehensive summary
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 70)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        else:
            print("\n✅ ALL TESTS PASSED!")
        
        # Critical analysis
        print(f"\n🔍 CRITICAL ANALYSIS:")
        
        # Check taxonomy completeness
        taxonomy_issues = []
        if len(category_groups) < 5:
            taxonomy_issues.append("Incomplete category groups")
        if len(species_data) < 15:
            taxonomy_issues.append("Incomplete species data")
        if len(product_types) < 10:
            taxonomy_issues.append("Incomplete product types")
        
        if taxonomy_issues:
            print("   ❌ Taxonomy Issues:")
            for issue in taxonomy_issues:
                print(f"      - {issue}")
        else:
            print("   ✅ Comprehensive taxonomy system working correctly")
        
        # Check authentication
        if seller_auth and admin_auth:
            print("   ✅ Authentication system working for all user types")
        else:
            print("   ❌ Authentication issues detected")
        
        # Check Free Range Chickens implementation
        free_range_found = any('Free Range' in s.get('name', '') for s in species_data)
        if free_range_found:
            print("   ✅ Free Range Chickens implemented as distinct category")
        else:
            print("   ❌ Free Range Chickens not found as distinct category")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test function"""
    tester = StockLotAPITester()
    success = tester.run_comprehensive_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())