#!/usr/bin/env python3
"""
Test the existing FAQ endpoint
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

def test_faq_endpoint():
    """Test the existing FAQ endpoint"""
    print("🧪 Testing Existing FAQ Endpoint")
    print("=" * 40)
    
    # Test without authentication (should work for public FAQ)
    print("1. Testing without authentication...")
    try:
        data = {"question": "How do I buy cattle on StockLot?"}
        response = requests.post(f"{BACKEND_URL}/api/faq/chat", json=data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ SUCCESS!")
            result = response.json()
            print(f"   Response: {result.get('response', '')[:100]}...")
            print(f"   Source: {result.get('source', 'unknown')}")
        else:
            print(f"   ❌ FAILED: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test with admin token
    print("\n2. Testing with admin authentication...")
    try:
        # Get admin token
        login_data = {"email": "admin@stocklot.co.za", "password": "admin123"}
        login_response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            data = {"question": "What are the seller fees on StockLot?"}
            response = requests.post(f"{BACKEND_URL}/api/faq/chat", json=data, headers=headers)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ SUCCESS!")
                result = response.json()
                print(f"   Response: {result.get('response', '')[:150]}...")
                print(f"   Source: {result.get('source', 'unknown')}")
            else:
                print(f"   ❌ FAILED: {response.text[:200]}")
        else:
            print("   ❌ Could not get admin token")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

if __name__ == "__main__":
    test_faq_endpoint()