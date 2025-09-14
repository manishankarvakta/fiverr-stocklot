#!/usr/bin/env python3
"""
CRITICAL FRONTEND vs BACKEND API DISCREPANCY INVESTIGATION
Testing the exact API calls the frontend makes vs backend testing results
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print("🔍 CRITICAL FRONTEND vs BACKEND API DISCREPANCY INVESTIGATION")
print("=" * 80)
print(f"Backend URL: {BACKEND_URL}")
print(f"API Base: {API_BASE}")
print("=" * 80)

def test_api_call(endpoint, params=None, headers=None, description=""):
    """Test an API call and return detailed results"""
    try:
        url = f"{API_BASE}{endpoint}"
        if params:
            # Convert params to query string
            query_params = []
            for key, value in params.items():
                if value is not None and value != '':
                    query_params.append(f"{key}={value}")
            if query_params:
                url += "?" + "&".join(query_params)
        
        print(f"\n📡 TESTING: {description}")
        print(f"URL: {url}")
        if headers:
            print(f"Headers: {headers}")
        
        response = requests.get(url, headers=headers or {}, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ SUCCESS: Returned {len(data)} items")
                    return {"success": True, "count": len(data), "data": data, "status": response.status_code}
                elif isinstance(data, dict):
                    if 'data' in data and isinstance(data['data'], list):
                        print(f"✅ SUCCESS: Returned {len(data['data'])} items in data field")
                        return {"success": True, "count": len(data['data']), "data": data['data'], "status": response.status_code}
                    else:
                        print(f"✅ SUCCESS: Returned dict response")
                        return {"success": True, "count": 1, "data": data, "status": response.status_code}
                else:
                    print(f"✅ SUCCESS: Returned {type(data)} response")
                    return {"success": True, "count": 0, "data": data, "status": response.status_code}
            except json.JSONDecodeError:
                print(f"❌ INVALID JSON: {response.text[:200]}")
                return {"success": False, "error": "Invalid JSON", "status": response.status_code}
        else:
            print(f"❌ ERROR: {response.status_code} - {response.text[:200]}")
            return {"success": False, "error": response.text, "status": response.status_code}
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {str(e)}")
        return {"success": False, "error": str(e), "status": 0}

def main():
    print("\n🎯 PHASE 1: TESTING EXACT FRONTEND API CALLS")
    print("-" * 50)
    
    # Test 1: Default marketplace call (what frontend does on load)
    result1 = test_api_call(
        "/listings",
        params={"include_exotics": "false"},
        description="Default Marketplace Load (include_exotics=false)"
    )
    
    # Test 2: All listings without exotic filter
    result2 = test_api_call(
        "/listings",
        params={},
        description="All Listings (no parameters)"
    )
    
    # Test 3: Explicit exotic inclusion
    result3 = test_api_call(
        "/listings",
        params={"include_exotics": "true"},
        description="With Exotics Included (include_exotics=true)"
    )
    
    # Test 4: Category group filtering (what frontend does when filtering)
    result4 = test_api_call(
        "/taxonomy/categories",
        params={"mode": "core"},
        description="Core Category Groups (frontend taxonomy call)"
    )
    
    # Test 5: All category groups
    result5 = test_api_call(
        "/taxonomy/categories",
        params={"mode": "all"},
        description="All Category Groups (including exotic)"
    )
    
    print("\n🔍 PHASE 2: TESTING DIFFERENT PARAMETER COMBINATIONS")
    print("-" * 50)
    
    # Test 6: With category group filter
    result6 = test_api_call(
        "/listings",
        params={
            "category_group_id": "some-id",
            "include_exotics": "false"
        },
        description="With Category Group Filter"
    )
    
    # Test 7: Test the exact URL pattern frontend uses
    frontend_params = {
        "include_exotics": "false",
        "listing_type": "",
        "category_group_id": "",
        "species_id": "",
        "breed_id": "",
        "product_type_id": "",
        "region": "",
        "price_min": "",
        "price_max": ""
    }
    result7 = test_api_call(
        "/listings",
        params=frontend_params,
        description="Exact Frontend Parameter Pattern"
    )
    
    print("\n🌐 PHASE 3: TESTING NETWORK AND CORS ISSUES")
    print("-" * 50)
    
    # Test 8: With CORS headers
    cors_headers = {
        "Origin": "https://farmstock-hub-1.preview.emergentagent.com",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    result8 = test_api_call(
        "/listings",
        params={"include_exotics": "false"},
        headers=cors_headers,
        description="With CORS Headers (simulating frontend)"
    )
    
    # Test 9: Test authentication (if needed)
    auth_headers = {
        "Authorization": "Bearer test-token",
        "Accept": "application/json"
    }
    result9 = test_api_call(
        "/listings",
        params={"include_exotics": "false"},
        headers=auth_headers,
        description="With Authentication Header"
    )
    
    print("\n🔧 PHASE 4: TESTING ALTERNATIVE ENDPOINTS")
    print("-" * 50)
    
    # Test 10: Health check
    result10 = test_api_call(
        "/health",
        description="API Health Check"
    )
    
    # Test 11: Test if there's a different listings endpoint
    result11 = test_api_call(
        "/marketplace/listings",
        params={"include_exotics": "false"},
        description="Alternative Marketplace Listings Endpoint"
    )
    
    print("\n📊 SUMMARY OF RESULTS")
    print("=" * 80)
    
    results = [
        ("Default Marketplace Load", result1),
        ("All Listings (no params)", result2),
        ("With Exotics Included", result3),
        ("Core Category Groups", result4),
        ("All Category Groups", result5),
        ("With Category Group Filter", result6),
        ("Exact Frontend Pattern", result7),
        ("With CORS Headers", result8),
        ("With Authentication", result9),
        ("Health Check", result10),
        ("Alternative Endpoint", result11)
    ]
    
    successful_tests = 0
    failed_tests = 0
    
    for name, result in results:
        if result["success"]:
            count = result.get("count", 0)
            print(f"✅ {name}: SUCCESS ({count} items)")
            successful_tests += 1
        else:
            print(f"❌ {name}: FAILED - {result.get('error', 'Unknown error')}")
            failed_tests += 1
    
    print(f"\n📈 OVERALL RESULTS:")
    print(f"✅ Successful tests: {successful_tests}")
    print(f"❌ Failed tests: {failed_tests}")
    print(f"📊 Success rate: {(successful_tests / len(results)) * 100:.1f}%")
    
    # Detailed analysis
    print(f"\n🔍 DETAILED ANALYSIS:")
    
    # Check if any test returned listings
    listings_found = False
    max_listings = 0
    best_endpoint = None
    
    for name, result in results:
        if result["success"] and result.get("count", 0) > 0:
            listings_found = True
            if result["count"] > max_listings:
                max_listings = result["count"]
                best_endpoint = name
    
    if listings_found:
        print(f"✅ LISTINGS FOUND: Yes")
        print(f"📊 Maximum listings returned: {max_listings}")
        print(f"🎯 Best performing endpoint: {best_endpoint}")
    else:
        print(f"❌ LISTINGS FOUND: No listings returned from any endpoint")
        print(f"🚨 CRITICAL ISSUE: This confirms the frontend '0 listings' problem!")
    
    # Check for specific issues
    print(f"\n🔧 POTENTIAL ISSUES IDENTIFIED:")
    
    # Check if health endpoint works
    if result10["success"]:
        print(f"✅ Backend is responding (health check passed)")
    else:
        print(f"❌ Backend may be down (health check failed)")
    
    # Check for CORS issues
    if result8["success"] != result1["success"]:
        print(f"⚠️  CORS headers may be affecting results")
    
    # Check for authentication issues
    if result9["success"] != result1["success"]:
        print(f"⚠️  Authentication may be affecting results")
    
    # Check for parameter issues
    if result2["success"] and result2.get("count", 0) > result1.get("count", 0):
        print(f"⚠️  include_exotics parameter may be filtering out all results")
    
    print(f"\n🎯 RECOMMENDATIONS:")
    if not listings_found:
        print(f"1. Check if listings exist in the database")
        print(f"2. Verify the include_exotics filtering logic")
        print(f"3. Check if frontend is calling the correct endpoint")
        print(f"4. Verify CORS configuration")
        print(f"5. Check for JavaScript errors in frontend console")
    else:
        print(f"1. Frontend may be using wrong parameters")
        print(f"2. Check frontend response parsing logic")
        print(f"3. Verify frontend error handling")

if __name__ == "__main__":
    main()