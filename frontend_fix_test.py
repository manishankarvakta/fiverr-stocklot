#!/usr/bin/env python3
"""
FRONTEND FIX VERIFICATION TEST
Testing the fix for the frontend vs backend API discrepancy
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print("🔧 FRONTEND FIX VERIFICATION TEST")
print("=" * 60)
print(f"Backend URL: {BACKEND_URL}")
print(f"API Base: {API_BASE}")
print("=" * 60)

def test_response_parsing():
    """Test different ways of parsing the response"""
    try:
        url = f"{API_BASE}/listings?include_exotics=false"
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ API Response received successfully")
            print(f"Response type: {type(data)}")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            # Test current frontend logic
            print(f"\n🔍 TESTING CURRENT FRONTEND LOGIC:")
            current_logic = data if isinstance(data, list) else (data.get('data', []) if isinstance(data, dict) else [])
            print(f"Current frontend logic result: {len(current_logic)} items")
            print(f"Result type: {type(current_logic)}")
            
            # Test correct logic
            print(f"\n✅ TESTING CORRECT LOGIC:")
            if isinstance(data, list):
                correct_logic = data
            elif isinstance(data, dict):
                if 'listings' in data:
                    correct_logic = data['listings']
                elif 'data' in data:
                    correct_logic = data['data']
                else:
                    correct_logic = []
            else:
                correct_logic = []
            
            print(f"Correct logic result: {len(correct_logic)} items")
            print(f"Result type: {type(correct_logic)}")
            
            if len(correct_logic) > 0:
                print(f"✅ SUCCESS: Found {len(correct_logic)} listings!")
                print(f"First listing title: {correct_logic[0].get('title', 'No title')}")
                print(f"First listing price: R{correct_logic[0].get('price_per_unit', 'No price')}")
            else:
                print(f"❌ FAILED: No listings found")
            
            return len(correct_logic) > 0
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("\n🎯 TESTING RESPONSE PARSING LOGIC")
    print("-" * 50)
    
    success = test_response_parsing()
    
    print(f"\n📊 SUMMARY")
    print("=" * 60)
    
    if success:
        print(f"✅ ISSUE IDENTIFIED AND SOLUTION CONFIRMED")
        print(f"")
        print(f"🔍 PROBLEM:")
        print(f"   Frontend expects: response.data or direct array")
        print(f"   Backend returns:  response.listings")
        print(f"")
        print(f"🔧 SOLUTION:")
        print(f"   Change frontend line 2584 from:")
        print(f"   const listingsArray = Array.isArray(response) ? response : (response.data || []);")
        print(f"   ")
        print(f"   To:")
        print(f"   const listingsArray = Array.isArray(response) ? response : (response.listings || response.data || []);")
        print(f"")
        print(f"✅ This will fix the '0 listings' issue in the frontend!")
    else:
        print(f"❌ UNABLE TO CONFIRM SOLUTION")

if __name__ == "__main__":
    main()