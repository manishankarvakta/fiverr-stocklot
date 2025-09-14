#!/usr/bin/env python3
"""
DETAILED RESPONSE INVESTIGATION
Examining the actual response content from the listings API
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print("🔍 DETAILED RESPONSE INVESTIGATION")
print("=" * 60)
print(f"Backend URL: {BACKEND_URL}")
print(f"API Base: {API_BASE}")
print("=" * 60)

def examine_response(endpoint, params=None, description=""):
    """Examine the detailed response from an API call"""
    try:
        url = f"{API_BASE}{endpoint}"
        if params:
            query_params = []
            for key, value in params.items():
                if value is not None and value != '':
                    query_params.append(f"{key}={value}")
            if query_params:
                url += "?" + "&".join(query_params)
        
        print(f"\n📡 EXAMINING: {description}")
        print(f"URL: {url}")
        
        response = requests.get(url, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Length: {response.headers.get('Content-Length', 'Unknown')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response Type: {type(data)}")
                
                if isinstance(data, dict):
                    print(f"Dict Keys: {list(data.keys())}")
                    
                    # Check for common patterns
                    if 'data' in data:
                        print(f"'data' field type: {type(data['data'])}")
                        if isinstance(data['data'], list):
                            print(f"'data' array length: {len(data['data'])}")
                            if len(data['data']) > 0:
                                print(f"First item keys: {list(data['data'][0].keys()) if isinstance(data['data'][0], dict) else 'Not a dict'}")
                        else:
                            print(f"'data' content: {data['data']}")
                    
                    if 'listings' in data:
                        print(f"'listings' field type: {type(data['listings'])}")
                        if isinstance(data['listings'], list):
                            print(f"'listings' array length: {len(data['listings'])}")
                    
                    if 'results' in data:
                        print(f"'results' field type: {type(data['results'])}")
                        if isinstance(data['results'], list):
                            print(f"'results' array length: {len(data['results'])}")
                    
                    # Show first few keys and values
                    print(f"Sample data (first 3 keys):")
                    for i, (key, value) in enumerate(data.items()):
                        if i >= 3:
                            break
                        if isinstance(value, (list, dict)):
                            print(f"  {key}: {type(value)} (length: {len(value) if hasattr(value, '__len__') else 'N/A'})")
                        else:
                            print(f"  {key}: {value}")
                
                elif isinstance(data, list):
                    print(f"Array length: {len(data)}")
                    if len(data) > 0:
                        print(f"First item type: {type(data[0])}")
                        if isinstance(data[0], dict):
                            print(f"First item keys: {list(data[0].keys())}")
                
                # Show raw response (truncated)
                raw_text = response.text
                if len(raw_text) > 500:
                    print(f"Raw response (first 500 chars): {raw_text[:500]}...")
                else:
                    print(f"Raw response: {raw_text}")
                    
            except json.JSONDecodeError as e:
                print(f"❌ JSON DECODE ERROR: {str(e)}")
                print(f"Raw response: {response.text[:200]}")
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {str(e)}")

def main():
    print("\n🎯 EXAMINING LISTINGS API RESPONSES")
    print("-" * 50)
    
    # Test 1: Default listings call
    examine_response(
        "/listings",
        params={"include_exotics": "false"},
        description="Default Listings Call (include_exotics=false)"
    )
    
    # Test 2: All listings
    examine_response(
        "/listings",
        params={},
        description="All Listings (no parameters)"
    )
    
    # Test 3: With exotics
    examine_response(
        "/listings",
        params={"include_exotics": "true"},
        description="With Exotics (include_exotics=true)"
    )
    
    print("\n🎯 EXAMINING TAXONOMY API RESPONSES")
    print("-" * 50)
    
    # Test 4: Category groups
    examine_response(
        "/taxonomy/categories",
        params={"mode": "core"},
        description="Core Category Groups"
    )
    
    print("\n🎯 EXAMINING OTHER ENDPOINTS")
    print("-" * 50)
    
    # Test 5: Health check
    examine_response(
        "/health",
        description="Health Check"
    )

if __name__ == "__main__":
    main()