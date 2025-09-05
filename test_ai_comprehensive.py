#!/usr/bin/env python3
"""
Comprehensive test of fixed AI Enhanced Service endpoints
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

def get_admin_token():
    """Get admin authentication token"""
    login_data = {
        "email": "admin@stocklot.co.za",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
    except:
        pass
    return None

def test_ai_endpoints():
    """Comprehensive test of AI endpoints"""
    print("🔐 Getting admin token...")
    token = get_admin_token()
    
    if not token:
        print("❌ Failed to get admin token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Got admin token\n")
    
    # Test 1: Price Suggestions
    print("🧪 Testing Price Suggestions Endpoint")
    print("-" * 40)
    try:
        params = {
            "species": "cattle",
            "product_type": "commercial",
            "breed": "Angus", 
            "province": "Gauteng",
            "quantity": 10,
            "unit": "head"
        }
        response = requests.get(f"{BACKEND_URL}/api/buy-requests/price-suggestions", 
                              headers=headers, params=params)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            result = response.json()
            print(f"Response keys: {list(result.keys())}")
            if "suggestions" in result:
                suggestions = result["suggestions"]
                print(f"Suggestions keys: {list(suggestions.keys()) if isinstance(suggestions, dict) else 'Not a dict'}")
        else:
            print(f"❌ FAILED: {response.text[:300]}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Test 2: Auto Description
    print("\n🧪 Testing Auto Description Endpoint")
    print("-" * 40)
    try:
        data = {
            "species": "cattle",
            "product_type": "commercial",
            "breed": "Angus",
            "quantity": 10,
            "unit": "head", 
            "province": "Gauteng",
            "target_price": 15000,
            "notes": "Looking for healthy cattle for breeding purposes"
        }
        response = requests.post(f"{BACKEND_URL}/api/buy-requests/auto-description",
                               headers=headers, json=data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            result = response.json()
            print(f"Response keys: {list(result.keys())}")
            if "description" in result:
                print(f"Generated description: {result['description'][:150]}...")
            if "title" in result:
                print(f"Generated title: {result['title']}")
        else:
            print(f"❌ FAILED: {response.text[:300]}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Test 3: Market Analytics (if it exists)
    print("\n🧪 Testing Market Analytics Endpoint")
    print("-" * 40)
    try:
        params = {"species": "cattle", "province": "Gauteng", "days_back": 30}
        response = requests.get(f"{BACKEND_URL}/api/analytics/market",
                              headers=headers, params=params)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
            result = response.json()
            print(f"Response keys: {list(result.keys())}")
        else:
            print(f"❌ FAILED: {response.text[:300]}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("🔍 COMPREHENSIVE AI ENHANCED SERVICE TEST")
    print("=" * 50)
    test_ai_endpoints()