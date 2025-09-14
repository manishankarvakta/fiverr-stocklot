#!/usr/bin/env python3
"""
Marketplace Filter Validation Testing
Comprehensive validation of marketplace filtering functionality with realistic data
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"

def get_listings_data(params=""):
    """Helper to get listings data with proper structure handling"""
    try:
        url = f"{BACKEND_URL}/listings{params}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Handle both direct array and object with listings key
            if isinstance(data, dict) and 'listings' in data:
                return data['listings'], data.get('total_count', len(data['listings']))
            elif isinstance(data, list):
                return data, len(data)
            else:
                return [], 0
        return [], 0
    except Exception as e:
        print(f"   ❌ ERROR getting listings: {str(e)}")
        return [], 0

def test_marketplace_filter_validation():
    """Comprehensive marketplace filter validation"""
    print("\n🎯 MARKETPLACE FILTER VALIDATION TESTING")
    print("=" * 60)
    
    results = []
    
    # Test 1: Get baseline data
    print("1. Getting baseline data...")
    base_listings, base_count = get_listings_data()
    print(f"   📊 Total listings in system: {base_count}")
    
    if base_count == 0:
        print("   ❌ No listings found - cannot test filtering")
        return [{"test": "baseline_data", "status": "FAIL", "error": "No listings found"}]
    
    # Analyze existing listings
    species_counts = {}
    breed_counts = {}
    price_ranges = []
    regions = set()
    
    for listing in base_listings:
        species_id = listing.get('species_id')
        breed_id = listing.get('breed_id')
        price = listing.get('price_per_unit', 0)
        region = listing.get('region', '')
        
        species_counts[species_id] = species_counts.get(species_id, 0) + 1
        breed_counts[breed_id] = breed_counts.get(breed_id, 0) + 1
        price_ranges.append(price)
        if region:
            regions.add(region)
    
    print(f"   📈 Species distribution: {len(species_counts)} unique species")
    print(f"   📈 Breed distribution: {len(breed_counts)} unique breeds")
    print(f"   📈 Price range: R{min(price_ranges):.2f} - R{max(price_ranges):.2f}")
    print(f"   📈 Regions: {', '.join(list(regions)[:3])}")
    
    results.append({"test": "baseline_data", "status": "PASS", "count": base_count})
    
    # Test 2: Species filtering validation
    print("\n2. Testing species filtering...")
    species_filter_working = True
    
    for species_id, expected_count in list(species_counts.items())[:3]:  # Test top 3 species
        filtered_listings, filtered_count = get_listings_data(f"?species_id={species_id}")
        print(f"   🔍 Species {species_id[:8]}...: Expected {expected_count}, Got {filtered_count}")
        
        if filtered_count == expected_count:
            print(f"      ✅ CORRECT: Filter returned exact match")
            results.append({"test": f"species_filter_{species_id[:8]}", "status": "PASS", "expected": expected_count, "actual": filtered_count})
        else:
            print(f"      ❌ INCORRECT: Expected {expected_count}, got {filtered_count}")
            species_filter_working = False
            results.append({"test": f"species_filter_{species_id[:8]}", "status": "FAIL", "expected": expected_count, "actual": filtered_count})
    
    # Test 3: Breed filtering validation
    print("\n3. Testing breed filtering...")
    breed_filter_working = True
    
    for breed_id, expected_count in list(breed_counts.items())[:3]:  # Test top 3 breeds
        if breed_id:  # Skip None breed_id
            filtered_listings, filtered_count = get_listings_data(f"?breed_id={breed_id}")
            print(f"   🔍 Breed {breed_id[:8]}...: Expected {expected_count}, Got {filtered_count}")
            
            if filtered_count == expected_count:
                print(f"      ✅ CORRECT: Filter returned exact match")
                results.append({"test": f"breed_filter_{breed_id[:8]}", "status": "PASS", "expected": expected_count, "actual": filtered_count})
            else:
                print(f"      ❌ INCORRECT: Expected {expected_count}, got {filtered_count}")
                breed_filter_working = False
                results.append({"test": f"breed_filter_{breed_id[:8]}", "status": "FAIL", "expected": expected_count, "actual": filtered_count})
    
    # Test 4: Price range filtering validation
    print("\n4. Testing price range filtering...")
    min_price = min(price_ranges)
    max_price = max(price_ranges)
    mid_price = (min_price + max_price) / 2
    
    # Test price_min filter
    expected_above_mid = len([p for p in price_ranges if p >= mid_price])
    filtered_listings, filtered_count = get_listings_data(f"?price_min={mid_price}")
    print(f"   🔍 Price >= R{mid_price:.2f}: Expected {expected_above_mid}, Got {filtered_count}")
    
    if filtered_count == expected_above_mid:
        print(f"      ✅ CORRECT: Price minimum filter working")
        results.append({"test": "price_min_filter", "status": "PASS", "expected": expected_above_mid, "actual": filtered_count})
    else:
        print(f"      ❌ INCORRECT: Price minimum filter not working")
        results.append({"test": "price_min_filter", "status": "FAIL", "expected": expected_above_mid, "actual": filtered_count})
    
    # Test price_max filter
    expected_below_mid = len([p for p in price_ranges if p <= mid_price])
    filtered_listings, filtered_count = get_listings_data(f"?price_max={mid_price}")
    print(f"   🔍 Price <= R{mid_price:.2f}: Expected {expected_below_mid}, Got {filtered_count}")
    
    if filtered_count == expected_below_mid:
        print(f"      ✅ CORRECT: Price maximum filter working")
        results.append({"test": "price_max_filter", "status": "PASS", "expected": expected_below_mid, "actual": filtered_count})
    else:
        print(f"      ❌ INCORRECT: Price maximum filter not working")
        results.append({"test": "price_max_filter", "status": "FAIL", "expected": expected_below_mid, "actual": filtered_count})
    
    # Test 5: Region filtering validation
    print("\n5. Testing region filtering...")
    if regions:
        test_region = list(regions)[0]
        expected_region_count = len([l for l in base_listings if l.get('region') == test_region])
        filtered_listings, filtered_count = get_listings_data(f"?region={test_region}")
        print(f"   🔍 Region '{test_region}': Expected {expected_region_count}, Got {filtered_count}")
        
        if filtered_count == expected_region_count:
            print(f"      ✅ CORRECT: Region filter working")
            results.append({"test": "region_filter", "status": "PASS", "expected": expected_region_count, "actual": filtered_count})
        else:
            print(f"      ❌ INCORRECT: Region filter not working")
            results.append({"test": "region_filter", "status": "FAIL", "expected": expected_region_count, "actual": filtered_count})
    else:
        print("   ⏭️  SKIPPED: No regions found in listings")
        results.append({"test": "region_filter", "status": "SKIP", "error": "No regions found"})
    
    # Test 6: Category group filtering validation
    print("\n6. Testing category group filtering...")
    try:
        # Get category groups
        categories_response = requests.get(f"{BACKEND_URL}/taxonomy/categories?mode=all", timeout=10)
        if categories_response.status_code == 200:
            categories = categories_response.json()
            
            for category in categories[:2]:  # Test first 2 categories
                category_id = category['id']
                category_name = category['name']
                
                # Get species in this category
                species_response = requests.get(f"{BACKEND_URL}/species?category_group_id={category_id}", timeout=10)
                if species_response.status_code == 200:
                    category_species = species_response.json()
                    category_species_ids = [s['id'] for s in category_species]
                    
                    # Count expected listings in this category
                    expected_category_count = len([l for l in base_listings if l.get('species_id') in category_species_ids])
                    
                    # Test category filter
                    filtered_listings, filtered_count = get_listings_data(f"?category_group_id={category_id}")
                    print(f"   🔍 Category '{category_name}': Expected {expected_category_count}, Got {filtered_count}")
                    
                    if filtered_count == expected_category_count:
                        print(f"      ✅ CORRECT: Category filter working")
                        results.append({"test": f"category_filter_{category_name.lower().replace(' ', '_')}", "status": "PASS", "expected": expected_category_count, "actual": filtered_count})
                    else:
                        print(f"      ❌ INCORRECT: Category filter not working")
                        results.append({"test": f"category_filter_{category_name.lower().replace(' ', '_')}", "status": "FAIL", "expected": expected_category_count, "actual": filtered_count})
        else:
            print("   ❌ Could not get categories for testing")
            results.append({"test": "category_filter", "status": "ERROR", "error": "Could not get categories"})
    except Exception as e:
        print(f"   ❌ ERROR testing category filtering: {str(e)}")
        results.append({"test": "category_filter", "status": "ERROR", "error": str(e)})
    
    # Test 7: Exotic filtering validation
    print("\n7. Testing exotic filtering...")
    
    # Test include_exotics=true
    exotic_true_listings, exotic_true_count = get_listings_data("?include_exotics=true")
    print(f"   🔍 Include exotics=true: {exotic_true_count} listings")
    
    # Test include_exotics=false
    exotic_false_listings, exotic_false_count = get_listings_data("?include_exotics=false")
    print(f"   🔍 Include exotics=false: {exotic_false_count} listings")
    
    if exotic_true_count >= exotic_false_count:
        print(f"      ✅ LOGICAL: include_exotics=true ({exotic_true_count}) >= include_exotics=false ({exotic_false_count})")
        results.append({"test": "exotic_filtering_logic", "status": "PASS", "true_count": exotic_true_count, "false_count": exotic_false_count})
    else:
        print(f"      ❌ ILLOGICAL: include_exotics=true ({exotic_true_count}) < include_exotics=false ({exotic_false_count})")
        results.append({"test": "exotic_filtering_logic", "status": "FAIL", "true_count": exotic_true_count, "false_count": exotic_false_count})
    
    # Test 8: Combined filters validation
    print("\n8. Testing combined filters...")
    if species_counts and breed_counts:
        # Get a species and breed that exist
        test_species_id = list(species_counts.keys())[0]
        test_breed_id = list(breed_counts.keys())[0]
        
        if test_breed_id:  # Make sure breed_id is not None
            # Count expected results for combined filter
            expected_combined = len([l for l in base_listings 
                                   if l.get('species_id') == test_species_id 
                                   and l.get('breed_id') == test_breed_id])
            
            filtered_listings, filtered_count = get_listings_data(f"?species_id={test_species_id}&breed_id={test_breed_id}")
            print(f"   🔍 Combined species+breed filter: Expected {expected_combined}, Got {filtered_count}")
            
            if filtered_count == expected_combined:
                print(f"      ✅ CORRECT: Combined filters working")
                results.append({"test": "combined_filters", "status": "PASS", "expected": expected_combined, "actual": filtered_count})
            else:
                print(f"      ❌ INCORRECT: Combined filters not working")
                results.append({"test": "combined_filters", "status": "FAIL", "expected": expected_combined, "actual": filtered_count})
        else:
            print("   ⏭️  SKIPPED: No valid breed_id for combined testing")
            results.append({"test": "combined_filters", "status": "SKIP", "error": "No valid breed_id"})
    else:
        print("   ⏭️  SKIPPED: Insufficient data for combined testing")
        results.append({"test": "combined_filters", "status": "SKIP", "error": "Insufficient data"})
    
    return results

def main():
    """Run marketplace filter validation tests"""
    print("🧪 MARKETPLACE FILTER VALIDATION TESTING")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    results = test_marketplace_filter_validation()
    
    # Summary
    print("\n📊 VALIDATION SUMMARY")
    print("=" * 50)
    
    passed = len([r for r in results if r["status"] == "PASS"])
    failed = len([r for r in results if r["status"] == "FAIL"])
    errors = len([r for r in results if r["status"] == "ERROR"])
    skipped = len([r for r in results if r["status"] == "SKIP"])
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"🚨 Errors: {errors}")
    print(f"⏭️  Skipped: {skipped}")
    
    if total > 0:
        success_rate = (passed / total) * 100
        print(f"Success Rate: {success_rate:.1f}%")
    
    # Critical findings
    print("\n🎯 CRITICAL FINDINGS:")
    
    filter_issues = [r for r in results if r["status"] == "FAIL" and "filter" in r["test"]]
    if filter_issues:
        print("   ❌ FILTER ISSUES DETECTED:")
        for issue in filter_issues:
            print(f"      - {issue['test']}: Expected {issue.get('expected', 'N/A')}, Got {issue.get('actual', 'N/A')}")
    else:
        print("   ✅ ALL FILTERS WORKING CORRECTLY")
    
    # Detailed failures
    if failed > 0 or errors > 0:
        print("\n🔍 DETAILED ISSUES:")
        for result in results:
            if result["status"] in ["FAIL", "ERROR"]:
                print(f"   ❌ {result['test']}: {result.get('error', 'See details above')}")
    
    print("\n" + "=" * 60)
    print("🏁 MARKETPLACE FILTER VALIDATION COMPLETE")
    
    return results

if __name__ == "__main__":
    results = main()
    
    # Exit with appropriate code
    failed_count = len([r for r in results if r["status"] in ["FAIL", "ERROR"]])
    sys.exit(1 if failed_count > 0 else 0)