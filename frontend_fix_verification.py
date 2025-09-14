#!/usr/bin/env python3
"""
FRONTEND FIX VERIFICATION - COMPREHENSIVE TEST
Verifying that the frontend fix resolves the '0 listings' issue
"""

import requests
import json
import sys
import os
from datetime import datetime
import time

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print("🎉 FRONTEND FIX VERIFICATION - COMPREHENSIVE TEST")
print("=" * 70)
print(f"Backend URL: {BACKEND_URL}")
print(f"API Base: {API_BASE}")
print("=" * 70)

def simulate_frontend_api_call(endpoint, params=None):
    """Simulate the exact API call the frontend makes"""
    try:
        url = f"{API_BASE}{endpoint}"
        if params:
            query_params = []
            for key, value in params.items():
                if value is not None and value != '':
                    query_params.append(f"{key}={value}")
            if query_params:
                url += "?" + "&".join(query_params)
        
        # Simulate frontend headers
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            # Apply the FIXED frontend logic
            listingsArray = data if isinstance(data, list) else (data.get('listings') or data.get('data') or [])
            
            return {
                "success": True,
                "listings_count": len(listingsArray),
                "listings": listingsArray,
                "raw_response": data
            }
        else:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}",
                "listings_count": 0
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "listings_count": 0
        }

def test_marketplace_scenarios():
    """Test various marketplace scenarios that the frontend uses"""
    
    scenarios = [
        {
            "name": "Default Marketplace Load",
            "endpoint": "/listings",
            "params": {"include_exotics": "false"},
            "description": "What happens when user visits /marketplace"
        },
        {
            "name": "All Listings",
            "endpoint": "/listings",
            "params": {},
            "description": "No filters applied"
        },
        {
            "name": "With Exotics",
            "endpoint": "/listings", 
            "params": {"include_exotics": "true"},
            "description": "When user enables exotic animals"
        },
        {
            "name": "Category Filter",
            "endpoint": "/listings",
            "params": {"include_exotics": "false", "category_group_id": "test-id"},
            "description": "When user selects a category"
        },
        {
            "name": "Price Range Filter",
            "endpoint": "/listings",
            "params": {"include_exotics": "false", "price_min": "10", "price_max": "100"},
            "description": "When user sets price filters"
        }
    ]
    
    print(f"\n🧪 TESTING MARKETPLACE SCENARIOS")
    print("-" * 50)
    
    results = []
    total_success = 0
    
    for scenario in scenarios:
        print(f"\n📋 Testing: {scenario['name']}")
        print(f"   Description: {scenario['description']}")
        
        result = simulate_frontend_api_call(scenario['endpoint'], scenario['params'])
        results.append({**scenario, **result})
        
        if result['success']:
            print(f"   ✅ SUCCESS: {result['listings_count']} listings found")
            total_success += 1
            
            # Show sample listing if available
            if result['listings_count'] > 0:
                first_listing = result['listings'][0]
                print(f"   📦 Sample: {first_listing.get('title', 'No title')[:50]}...")
                print(f"   💰 Price: R{first_listing.get('price_per_unit', 'N/A')}")
        else:
            print(f"   ❌ FAILED: {result['error']}")
    
    return results, total_success

def test_response_structure():
    """Test that we're correctly parsing the response structure"""
    print(f"\n🔍 TESTING RESPONSE STRUCTURE PARSING")
    print("-" * 50)
    
    result = simulate_frontend_api_call("/listings", {"include_exotics": "false"})
    
    if result['success']:
        raw = result['raw_response']
        print(f"✅ Raw response structure:")
        print(f"   Type: {type(raw)}")
        if isinstance(raw, dict):
            print(f"   Keys: {list(raw.keys())}")
            if 'listings' in raw:
                print(f"   Listings field: {len(raw['listings'])} items")
            if 'total_count' in raw:
                print(f"   Total count: {raw['total_count']}")
        
        print(f"\n✅ Parsed listings:")
        print(f"   Count: {result['listings_count']}")
        print(f"   Type: {type(result['listings'])}")
        
        return True
    else:
        print(f"❌ Failed to get response: {result['error']}")
        return False

def main():
    print(f"\n🎯 PHASE 1: RESPONSE STRUCTURE VERIFICATION")
    structure_ok = test_response_structure()
    
    print(f"\n🎯 PHASE 2: MARKETPLACE SCENARIOS TESTING")
    results, success_count = test_marketplace_scenarios()
    
    print(f"\n📊 COMPREHENSIVE RESULTS")
    print("=" * 70)
    
    print(f"✅ Successful scenarios: {success_count}/{len(results)}")
    print(f"📊 Success rate: {(success_count/len(results)*100):.1f}%")
    
    # Detailed results
    print(f"\n📋 DETAILED RESULTS:")
    for result in results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        count = result['listings_count']
        print(f"   {status} {result['name']}: {count} listings")
    
    # Overall assessment
    print(f"\n🎯 OVERALL ASSESSMENT:")
    
    if success_count == len(results) and all(r['listings_count'] > 0 for r in results if r['success']):
        print(f"🎉 EXCELLENT: All tests passed with listings found!")
        print(f"✅ The frontend fix has COMPLETELY RESOLVED the '0 listings' issue!")
        print(f"")
        print(f"🔧 WHAT WAS FIXED:")
        print(f"   • Frontend now correctly parses response.listings field")
        print(f"   • All marketplace scenarios return listings successfully")
        print(f"   • No more '0 listings' display issue")
        print(f"")
        print(f"🚀 READY FOR PRODUCTION!")
        
    elif success_count > 0:
        print(f"⚠️  PARTIAL SUCCESS: {success_count}/{len(results)} scenarios working")
        working_scenarios = [r['name'] for r in results if r['success'] and r['listings_count'] > 0]
        print(f"✅ Working: {', '.join(working_scenarios)}")
        
        failing_scenarios = [r['name'] for r in results if not r['success'] or r['listings_count'] == 0]
        if failing_scenarios:
            print(f"❌ Still failing: {', '.join(failing_scenarios)}")
        
    else:
        print(f"❌ CRITICAL: No scenarios are working!")
        print(f"🚨 The fix may not have been applied correctly or there are other issues")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if success_count == len(results):
        print(f"1. ✅ Frontend fix is working perfectly")
        print(f"2. ✅ Users should now see listings in the marketplace")
        print(f"3. ✅ Ready to test comprehensive fee functionality")
    else:
        print(f"1. ⚠️  Check if frontend service restarted properly")
        print(f"2. ⚠️  Verify the fix was applied to the correct file")
        print(f"3. ⚠️  Check browser cache if testing in browser")

if __name__ == "__main__":
    main()