#!/usr/bin/env python3
"""
Test AI Enhanced Service endpoints with existing admin user
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

def get_admin_token():
    """Get admin authentication token"""
    # Use the admin user that exists in DB
    login_data = {
        "email": "admin@stocklot.co.za",
        "password": "admin123"  # Common admin password
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        print(f"Login response: {response.status_code} - {response.text[:200]}")
        if response.status_code == 200:
            return response.json().get("access_token")
    except Exception as e:
        print(f"Login error: {e}")
    
    return None

def test_endpoints_without_auth():
    """Test if endpoints are accessible (even if auth fails)"""
    print("🧪 Testing endpoints accessibility (expecting 401 for auth-required)")
    
    # Test 1: Price suggestions
    try:
        params = {"species": "cattle", "product_type": "commercial", "province": "Gauteng"}
        response = requests.get(f"{BACKEND_URL}/api/buy-requests/price-suggestions", params=params)
        print(f"Price suggestions: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"Price suggestions error: {e}")
    
    # Test 2: Auto description
    try:
        data = {"species": "cattle", "product_type": "commercial"}
        response = requests.post(f"{BACKEND_URL}/api/buy-requests/auto-description", json=data)
        print(f"Auto description: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"Auto description error: {e}")

def test_ml_endpoints():
    """Test ML FAQ endpoints which might not require auth"""
    print("\n🤖 Testing ML endpoints")
    
    # Test ML FAQ
    try:
        data = {"question": "How do I buy cattle?"}
        response = requests.post(f"{BACKEND_URL}/api/ml/faq/ask", json=data)
        print(f"ML FAQ: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"ML FAQ error: {e}")
    
    # Test ML matching
    try:
        params = {"request_id": "test-123"}
        response = requests.get(f"{BACKEND_URL}/api/ml/matching/find-matches", params=params)
        print(f"ML Matching: {response.status_code} - {response.text[:100]}")
    except Exception as e:
        print(f"ML Matching error: {e}")

def main():
    print("🔍 Testing AI Enhanced Service Fix")
    print("=" * 50)
    
    # Test basic endpoint accessibility
    test_endpoints_without_auth()
    
    # Test ML endpoints
    test_ml_endpoints()
    
    # Try with admin token
    print("\n🔐 Trying with admin credentials...")
    token = get_admin_token()
    
    if token:
        print("✅ Got admin token, testing authenticated endpoints...")
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            params = {"species": "cattle", "product_type": "commercial", "province": "Gauteng"}
            response = requests.get(f"{BACKEND_URL}/api/buy-requests/price-suggestions", 
                                  headers=headers, params=params)
            print(f"✅ Price suggestions with auth: {response.status_code}")
            if response.status_code == 500:
                print(f"   Server error details: {response.text[:300]}")
            elif response.status_code == 200:
                print("   🎉 SUCCESS! AI Enhanced Service is working!")
        except Exception as e:
            print(f"   Error: {e}")
    else:
        print("❌ Could not get admin token")

if __name__ == "__main__":
    main()