#!/usr/bin/env python3
"""
Simple Enhancement Features Test
"""

import requests
import json

BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"

def test_endpoint(method, endpoint, data=None):
    """Test a single endpoint"""
    try:
        url = f"{BACKEND_URL}{endpoint}"
        print(f"Testing {method} {url}")
        
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)[:200]}...")
        else:
            print(f"Error: {response.text[:200]}")
        print("-" * 50)
        
    except Exception as e:
        print(f"Exception: {e}")
        print("-" * 50)

# Test key enhancement endpoints
print("🚀 TESTING ENHANCEMENT ENDPOINTS")
print("=" * 50)

# Advanced Search Features
test_endpoint("POST", "/search/semantic", {"query": "cattle", "filters": {}})
test_endpoint("GET", "/search/autocomplete?q=cattle&limit=5")
test_endpoint("POST", "/search/intelligent-filters", {"user_preferences": {"location": "Western Cape"}})
test_endpoint("GET", "/search/predictive?user_id=test&context=browsing")

# Messaging Features  
test_endpoint("GET", "/messaging/templates?category=inquiry")

# Analytics Features
test_endpoint("GET", "/analytics/market-intelligence?category=cattle")

# Performance Features
test_endpoint("GET", "/performance/health-check")

print("✅ Test completed!")