#!/usr/bin/env python3
"""
Test AI Enhanced Service endpoints with authentication
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

def get_auth_token():
    """Get authentication token for testing"""
    # Try to login with existing user
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
    except:
        pass
    
    # If login fails, try to register
    register_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User",
        "phone": "+27123456789",
        "country": "South Africa",
        "province": "Gauteng"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/register", json=register_data)
        if response.status_code == 201:
            # Try login again
            response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
            if response.status_code == 200:
                return response.json().get("access_token")
    except:
        pass
    
    return None

def test_ai_endpoints():
    """Test AI endpoints with authentication"""
    print("🔐 Getting authentication token...")
    token = get_auth_token()
    
    if not token:
        print("❌ Failed to get authentication token")
        return
    
    print("✅ Got authentication token")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🧪 Testing AI Enhanced Endpoints")
    print("=" * 50)
    
    # Test price suggestions
    print("\n1. Testing Price Suggestions...")
    try:
        params = {
            "species": "cattle",
            "product_type": "commercial",
            "province": "Gauteng"
        }
        response = requests.get(f"{BACKEND_URL}/api/buy-requests/price-suggestions", 
                              headers=headers, params=params)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ SUCCESS")
        else:
            print(f"   ❌ FAILED: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test auto description
    print("\n2. Testing Auto Description...")
    try:
        data = {
            "species": "cattle",
            "product_type": "commercial",
            "breed": "Angus",
            "quantity": 10,
            "unit": "head",  
            "province": "Gauteng"
        }
        response = requests.post(f"{BACKEND_URL}/api/buy-requests/auto-description",
                               headers=headers, json=data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ SUCCESS")
            result = response.json()
            if "description" in result:
                print(f"   Generated: {result['description'][:100]}...")
        else:
            print(f"   ❌ FAILED: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test FAQ
    print("\n3. Testing ML FAQ...")
    try:
        data = {"question": "How do I buy cattle?"}
        response = requests.post(f"{BACKEND_URL}/api/ml/faq/ask",
                               headers=headers, json=data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ SUCCESS")
        else:
            print(f"   ❌ FAILED: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

if __name__ == "__main__":
    test_ai_endpoints()