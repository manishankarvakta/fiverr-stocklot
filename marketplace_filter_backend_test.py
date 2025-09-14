#!/usr/bin/env python3
"""
Marketplace Filter Functionality Testing
Testing all marketplace filtering APIs as requested in review
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"

def test_category_groups_api():
    """Test Category Groups API endpoints"""
    print("\n🔍 TESTING CATEGORY GROUPS API")
    print("=" * 50)
    
    results = []
    
    # Test 1: GET /api/taxonomy/categories?mode=core
    try:
        print("1. Testing GET /api/taxonomy/categories?mode=core")
        response = requests.get(f"{BACKEND_URL}/taxonomy/categories?mode=core", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} core category groups")
            for group in data[:3]:  # Show first 3
                print(f"      - {group.get('name', 'Unknown')} (ID: {group.get('id', 'N/A')})")
            results.append({"test": "core_categories", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "core_categories", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "core_categories", "status": "ERROR", "error": str(e)})
    
    # Test 2: GET /api/taxonomy/categories?mode=all
    try:
        print("\n2. Testing GET /api/taxonomy/categories?mode=all")
        response = requests.get(f"{BACKEND_URL}/taxonomy/categories?mode=all", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} total category groups")
            for group in data[:3]:  # Show first 3
                print(f"      - {group.get('name', 'Unknown')} (ID: {group.get('id', 'N/A')})")
            results.append({"test": "all_categories", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "all_categories", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "all_categories", "status": "ERROR", "error": str(e)})
    
    return results

def test_species_api():
    """Test Species API with category group filtering"""
    print("\n🐄 TESTING SPECIES API")
    print("=" * 50)
    
    results = []
    
    # First get category groups to test with
    try:
        categories_response = requests.get(f"{BACKEND_URL}/taxonomy/categories?mode=all", timeout=10)
        if categories_response.status_code != 200:
            print("   ❌ Cannot get category groups for species testing")
            return [{"test": "species_api", "status": "SKIP", "error": "No category groups available"}]
        
        categories = categories_response.json()
        if not categories:
            print("   ❌ No category groups found for species testing")
            return [{"test": "species_api", "status": "SKIP", "error": "No category groups found"}]
        
        # Test species API with first few category groups
        for i, category in enumerate(categories[:3]):  # Test first 3 categories
            category_id = category.get('id')
            category_name = category.get('name', 'Unknown')
            
            print(f"\n{i+1}. Testing GET /api/species?category_group_id={category_id}")
            print(f"   Category: {category_name}")
            
            try:
                response = requests.get(f"{BACKEND_URL}/species?category_group_id={category_id}", timeout=10)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ SUCCESS: Found {len(data)} species for {category_name}")
                    for species in data[:2]:  # Show first 2 species
                        print(f"      - {species.get('name', 'Unknown')} (ID: {species.get('id', 'N/A')})")
                    results.append({
                        "test": f"species_for_{category_name.lower().replace(' ', '_')}", 
                        "status": "PASS", 
                        "count": len(data),
                        "category_id": category_id
                    })
                else:
                    print(f"   ❌ FAILED: {response.text}")
                    results.append({
                        "test": f"species_for_{category_name.lower().replace(' ', '_')}", 
                        "status": "FAIL", 
                        "error": response.text
                    })
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
                results.append({
                    "test": f"species_for_{category_name.lower().replace(' ', '_')}", 
                    "status": "ERROR", 
                    "error": str(e)
                })
                
    except Exception as e:
        print(f"   ❌ ERROR getting categories: {str(e)}")
        results.append({"test": "species_api", "status": "ERROR", "error": str(e)})
    
    return results

def test_breeds_api():
    """Test Breeds API with species filtering"""
    print("\n🐑 TESTING BREEDS API")
    print("=" * 50)
    
    results = []
    
    # First get species to test with
    try:
        # Get categories first
        categories_response = requests.get(f"{BACKEND_URL}/taxonomy/categories?mode=all", timeout=10)
        if categories_response.status_code != 200:
            print("   ❌ Cannot get categories for breeds testing")
            return [{"test": "breeds_api", "status": "SKIP", "error": "No categories available"}]
        
        categories = categories_response.json()
        if not categories:
            print("   ❌ No categories found")
            return [{"test": "breeds_api", "status": "SKIP", "error": "No categories found"}]
        
        # Get species from first category
        first_category = categories[0]
        species_response = requests.get(f"{BACKEND_URL}/species?category_group_id={first_category['id']}", timeout=10)
        
        if species_response.status_code != 200:
            print("   ❌ Cannot get species for breeds testing")
            return [{"test": "breeds_api", "status": "SKIP", "error": "No species available"}]
        
        species_list = species_response.json()
        if not species_list:
            print("   ❌ No species found for breeds testing")
            return [{"test": "breeds_api", "status": "SKIP", "error": "No species found"}]
        
        # Test breeds API with first few species
        for i, species in enumerate(species_list[:3]):  # Test first 3 species
            species_id = species.get('id')
            species_name = species.get('name', 'Unknown')
            
            print(f"\n{i+1}. Testing GET /api/species/{species_id}/breeds")
            print(f"   Species: {species_name}")
            
            try:
                response = requests.get(f"{BACKEND_URL}/species/{species_id}/breeds", timeout=10)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✅ SUCCESS: Found {len(data)} breeds for {species_name}")
                    for breed in data[:2]:  # Show first 2 breeds
                        print(f"      - {breed.get('name', 'Unknown')} (ID: {breed.get('id', 'N/A')})")
                    results.append({
                        "test": f"breeds_for_{species_name.lower().replace(' ', '_')}", 
                        "status": "PASS", 
                        "count": len(data),
                        "species_id": species_id
                    })
                else:
                    print(f"   ❌ FAILED: {response.text}")
                    results.append({
                        "test": f"breeds_for_{species_name.lower().replace(' ', '_')}", 
                        "status": "FAIL", 
                        "error": response.text
                    })
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
                results.append({
                    "test": f"breeds_for_{species_name.lower().replace(' ', '_')}", 
                    "status": "ERROR", 
                    "error": str(e)
                })
                
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "breeds_api", "status": "ERROR", "error": str(e)})
    
    return results

def test_product_types_api():
    """Test Product Types API"""
    print("\n📦 TESTING PRODUCT TYPES API")
    print("=" * 50)
    
    results = []
    
    try:
        print("1. Testing GET /api/product-types")
        response = requests.get(f"{BACKEND_URL}/product-types", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} product types")
            for product_type in data[:3]:  # Show first 3
                print(f"      - {product_type.get('label', 'Unknown')} (Code: {product_type.get('code', 'N/A')})")
            results.append({"test": "product_types", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "product_types", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "product_types", "status": "ERROR", "error": str(e)})
    
    return results

def test_filtered_listings():
    """Test Filtered Listings with various filter combinations"""
    print("\n🏪 TESTING FILTERED LISTINGS")
    print("=" * 50)
    
    results = []
    
    # Get reference data for filtering
    try:
        # Get categories
        categories_response = requests.get(f"{BACKEND_URL}/taxonomy/categories?mode=all", timeout=10)
        categories = categories_response.json() if categories_response.status_code == 200 else []
        
        # Get species
        species_list = []
        if categories:
            species_response = requests.get(f"{BACKEND_URL}/species?category_group_id={categories[0]['id']}", timeout=10)
            species_list = species_response.json() if species_response.status_code == 200 else []
        
        # Get breeds
        breeds_list = []
        if species_list:
            breeds_response = requests.get(f"{BACKEND_URL}/species/{species_list[0]['id']}/breeds", timeout=10)
            breeds_list = breeds_response.json() if breeds_response.status_code == 200 else []
        
    except Exception as e:
        print(f"   ⚠️  Warning: Could not get reference data: {str(e)}")
        categories, species_list, breeds_list = [], [], []
    
    # Test 1: Basic listings (no filters)
    try:
        print("1. Testing GET /api/listings (no filters)")
        response = requests.get(f"{BACKEND_URL}/listings", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} total listings")
            results.append({"test": "listings_no_filter", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "listings_no_filter", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "listings_no_filter", "status": "ERROR", "error": str(e)})
    
    # Test 2: Filter by category_group_id
    if categories:
        try:
            category_id = categories[0]['id']
            category_name = categories[0]['name']
            print(f"\n2. Testing GET /api/listings?category_group_id={category_id}")
            print(f"   Category: {category_name}")
            
            response = requests.get(f"{BACKEND_URL}/listings?category_group_id={category_id}", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Found {len(data)} listings for {category_name}")
                results.append({"test": "listings_by_category", "status": "PASS", "count": len(data)})
            else:
                print(f"   ❌ FAILED: {response.text}")
                results.append({"test": "listings_by_category", "status": "FAIL", "error": response.text})
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results.append({"test": "listings_by_category", "status": "ERROR", "error": str(e)})
    
    # Test 3: Filter by species_id
    if species_list:
        try:
            species_id = species_list[0]['id']
            species_name = species_list[0]['name']
            print(f"\n3. Testing GET /api/listings?species_id={species_id}")
            print(f"   Species: {species_name}")
            
            response = requests.get(f"{BACKEND_URL}/listings?species_id={species_id}", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Found {len(data)} listings for {species_name}")
                results.append({"test": "listings_by_species", "status": "PASS", "count": len(data)})
            else:
                print(f"   ❌ FAILED: {response.text}")
                results.append({"test": "listings_by_species", "status": "FAIL", "error": response.text})
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results.append({"test": "listings_by_species", "status": "ERROR", "error": str(e)})
    
    # Test 4: Filter by breed_id
    if breeds_list:
        try:
            breed_id = breeds_list[0]['id']
            breed_name = breeds_list[0]['name']
            print(f"\n4. Testing GET /api/listings?breed_id={breed_id}")
            print(f"   Breed: {breed_name}")
            
            response = requests.get(f"{BACKEND_URL}/listings?breed_id={breed_id}", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Found {len(data)} listings for {breed_name}")
                results.append({"test": "listings_by_breed", "status": "PASS", "count": len(data)})
            else:
                print(f"   ❌ FAILED: {response.text}")
                results.append({"test": "listings_by_breed", "status": "FAIL", "error": response.text})
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results.append({"test": "listings_by_breed", "status": "ERROR", "error": str(e)})
    
    # Test 5: Filter by region/province
    try:
        print(f"\n5. Testing GET /api/listings?region=Western Cape")
        response = requests.get(f"{BACKEND_URL}/listings?region=Western Cape", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} listings in Western Cape")
            results.append({"test": "listings_by_region", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "listings_by_region", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "listings_by_region", "status": "ERROR", "error": str(e)})
    
    # Test 6: Filter by price range
    try:
        print(f"\n6. Testing GET /api/listings?price_min=100&price_max=1000")
        response = requests.get(f"{BACKEND_URL}/listings?price_min=100&price_max=1000", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} listings in R100-R1000 range")
            results.append({"test": "listings_by_price_range", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "listings_by_price_range", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "listings_by_price_range", "status": "ERROR", "error": str(e)})
    
    # Test 7: Filter with include_exotics parameter
    try:
        print(f"\n7. Testing GET /api/listings?include_exotics=true")
        response = requests.get(f"{BACKEND_URL}/listings?include_exotics=true", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} listings including exotics")
            results.append({"test": "listings_include_exotics_true", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "listings_include_exotics_true", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "listings_include_exotics_true", "status": "ERROR", "error": str(e)})
    
    # Test 8: Filter with include_exotics=false
    try:
        print(f"\n8. Testing GET /api/listings?include_exotics=false")
        response = requests.get(f"{BACKEND_URL}/listings?include_exotics=false", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SUCCESS: Found {len(data)} listings excluding exotics")
            results.append({"test": "listings_include_exotics_false", "status": "PASS", "count": len(data)})
        else:
            print(f"   ❌ FAILED: {response.text}")
            results.append({"test": "listings_include_exotics_false", "status": "FAIL", "error": response.text})
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        results.append({"test": "listings_include_exotics_false", "status": "ERROR", "error": str(e)})
    
    # Test 9: Combined filters
    if categories and species_list:
        try:
            category_id = categories[0]['id']
            species_id = species_list[0]['id']
            print(f"\n9. Testing GET /api/listings?category_group_id={category_id}&species_id={species_id}&price_min=50")
            
            response = requests.get(f"{BACKEND_URL}/listings?category_group_id={category_id}&species_id={species_id}&price_min=50", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS: Found {len(data)} listings with combined filters")
                results.append({"test": "listings_combined_filters", "status": "PASS", "count": len(data)})
            else:
                print(f"   ❌ FAILED: {response.text}")
                results.append({"test": "listings_combined_filters", "status": "FAIL", "error": response.text})
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results.append({"test": "listings_combined_filters", "status": "ERROR", "error": str(e)})
    
    return results

def main():
    """Run all marketplace filter tests"""
    print("🧪 MARKETPLACE FILTER FUNCTIONALITY TESTING")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    all_results = []
    
    # Run all tests
    all_results.extend(test_category_groups_api())
    all_results.extend(test_species_api())
    all_results.extend(test_breeds_api())
    all_results.extend(test_product_types_api())
    all_results.extend(test_filtered_listings())
    
    # Summary
    print("\n📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = len([r for r in all_results if r["status"] == "PASS"])
    failed = len([r for r in all_results if r["status"] == "FAIL"])
    errors = len([r for r in all_results if r["status"] == "ERROR"])
    skipped = len([r for r in all_results if r["status"] == "SKIP"])
    total = len(all_results)
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"🚨 Errors: {errors}")
    print(f"⏭️  Skipped: {skipped}")
    
    if total > 0:
        success_rate = (passed / total) * 100
        print(f"Success Rate: {success_rate:.1f}%")
    
    # Detailed results
    if failed > 0 or errors > 0:
        print("\n🔍 FAILED/ERROR TESTS:")
        for result in all_results:
            if result["status"] in ["FAIL", "ERROR"]:
                print(f"   ❌ {result['test']}: {result.get('error', 'Unknown error')}")
    
    # Filter effectiveness analysis
    print("\n🎯 FILTER EFFECTIVENESS ANALYSIS:")
    listing_tests = [r for r in all_results if r["test"].startswith("listings_")]
    if listing_tests:
        base_count = None
        for test in listing_tests:
            if test["test"] == "listings_no_filter" and test["status"] == "PASS":
                base_count = test["count"]
                break
        
        if base_count is not None:
            print(f"   Base listings (no filter): {base_count}")
            for test in listing_tests:
                if test["status"] == "PASS" and test["test"] != "listings_no_filter":
                    count = test["count"]
                    filter_name = test["test"].replace("listings_", "").replace("_", " ").title()
                    if count < base_count:
                        print(f"   ✅ {filter_name}: {count} listings (filtering working)")
                    elif count == base_count:
                        print(f"   ⚠️  {filter_name}: {count} listings (no filtering effect)")
                    else:
                        print(f"   ❓ {filter_name}: {count} listings (unexpected result)")
        else:
            print("   ⚠️  Cannot analyze filter effectiveness - base count unavailable")
    
    print("\n" + "=" * 60)
    print("🏁 MARKETPLACE FILTER TESTING COMPLETE")
    
    return all_results

if __name__ == "__main__":
    results = main()
    
    # Exit with appropriate code
    failed_count = len([r for r in results if r["status"] in ["FAIL", "ERROR"]])
    sys.exit(1 if failed_count > 0 else 0)