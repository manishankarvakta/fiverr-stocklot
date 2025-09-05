#!/usr/bin/env python3
"""
Test ML Engine Smart Pricing fix
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

def get_admin_token():
    """Get admin authentication token"""
    login_data = {"email": "admin@stocklot.co.za", "password": "admin123"}
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
    except:
        pass
    return None

def test_ml_engine_smart_pricing():
    """Test ML Engine Smart Pricing with the fix"""
    print("🔍 Testing ML Engine Smart Pricing Fix")
    print("=" * 45)
    
    token = get_admin_token()
    if not token:
        print("❌ Could not get admin token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with data that caused the .lower() error
    pricing_data = {
        "listing_data": {
            "species": "cattle",
            "breed": "angus", 
            "quantity": 50,
            "location": "Gauteng",
            "age_months": 18,
            "weight_kg": 450,
            "quality_grade": "A"
        },
        "market_context": {
            "season": "winter",
            "demand_level": "high"
        }
    }
    
    print("1. Testing with complete data...")
    try:
        response = requests.post(f"{BACKEND_URL}/api/ml/engine/smart-pricing",
                               json=pricing_data, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ SUCCESS! Smart pricing working")
            result = response.json()
            analysis = result.get("analysis", {})
            print(f"   Suggested price: R{analysis.get('suggested_price_per_unit', 0):.2f}")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test with None/empty values that caused the error
    print("\n2. Testing with None species (edge case)...")
    pricing_data_null = {
        "listing_data": {
            "species": None,  # This caused the .lower() error
            "breed": None,
            "quantity": 10,
            "location": "Gauteng"
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/ml/engine/smart-pricing",
                               json=pricing_data_null, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ SUCCESS! Null handling working")
        elif "NoneType" in response.text and "lower" in response.text:
            print("   ❌ Still has .lower() error")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

    # Test market intelligence too
    print("\n3. Testing Market Intelligence...")
    market_data = {
        "species": "goats",
        "analysis_type": "competitive_landscape"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/ml/engine/market-intelligence",
                               json=market_data, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ SUCCESS! Market intelligence working")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

if __name__ == "__main__":
    test_ml_engine_smart_pricing()