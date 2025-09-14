#!/usr/bin/env python3
"""
FOCUSED STOCKLOT BACKEND TESTING
================================

Focused testing of specific endpoints that were failing in the comprehensive test.
"""

import requests
import json
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"

def test_auth_endpoints():
    """Test authentication endpoints with proper data structures"""
    print("🔐 TESTING AUTHENTICATION ENDPOINTS")
    
    # Test login endpoint
    login_data = {
        "email": "testbuyer@stocklot.co.za",
        "password": "TestPassword123!"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
        print(f"Login response status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Login endpoint working")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Login failed: {response.text}")
    except Exception as e:
        print(f"❌ Login request failed: {e}")
    
    # Test /auth/me endpoint (without proper session)
    try:
        response = requests.get(f"{BACKEND_URL}/auth/me", timeout=30)
        print(f"Auth/me response status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Auth/me correctly requires authentication")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Auth/me request failed: {e}")

def test_guest_checkout_endpoints():
    """Test guest checkout endpoints with proper data structures"""
    print("\n👤 TESTING GUEST CHECKOUT ENDPOINTS")
    
    # First get a valid listing ID
    try:
        response = requests.get(f"{BACKEND_URL}/listings", timeout=30)
        if response.status_code == 200:
            listings = response.json()
            if isinstance(listings, list) and len(listings) > 0:
                listing_id = listings[0].get("id")
                print(f"Using listing ID: {listing_id}")
                
                # Test guest quote with correct structure
                quote_data = {
                    "items": [{"listing_id": listing_id, "qty": 1}],
                    "ship_to": {
                        "province": "Western Cape",
                        "country": "South Africa",
                        "lat": -33.9249,
                        "lng": 18.4241
                    }
                }
                
                try:
                    response = requests.post(f"{BACKEND_URL}/checkout/guest/quote", json=quote_data, timeout=30)
                    print(f"Guest quote response status: {response.status_code}")
                    if response.status_code == 200:
                        print("✅ Guest quote endpoint working")
                        quote_result = response.json()
                        print(f"Quote result: {quote_result}")
                        
                        # Test guest order creation
                        order_data = {
                            "contact": {
                                "email": f"guest_{uuid.uuid4().hex[:8]}@example.com",
                                "phone": "+27123456789",
                                "full_name": "Guest User"
                            },
                            "ship_to": {
                                "province": "Western Cape",
                                "country": "South Africa",
                                "lat": -33.9249,
                                "lng": 18.4241
                            },
                            "items": [{"listing_id": listing_id, "qty": 1}],
                            "quote": quote_result
                        }
                        
                        try:
                            response = requests.post(f"{BACKEND_URL}/checkout/guest/create", json=order_data, timeout=30)
                            print(f"Guest order response status: {response.status_code}")
                            if response.status_code == 200:
                                print("✅ Guest order creation working")
                                print(f"Order result: {response.json()}")
                            else:
                                print(f"❌ Guest order failed: {response.text}")
                        except Exception as e:
                            print(f"❌ Guest order request failed: {e}")
                            
                    else:
                        print(f"❌ Guest quote failed: {response.text}")
                except Exception as e:
                    print(f"❌ Guest quote request failed: {e}")
            else:
                print("❌ No listings available for testing")
        else:
            print(f"❌ Failed to get listings: {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to get listings: {e}")

def test_checkout_preview():
    """Test checkout preview endpoint"""
    print("\n💰 TESTING CHECKOUT PREVIEW")
    
    # Test with proper CartItem structure
    preview_data = {
        "cart": [
            {
                "seller_id": "test-seller-id",
                "merch_subtotal_minor": 10000  # R100.00 in cents
            }
        ],
        "currency": "ZAR"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/checkout/preview", json=preview_data, timeout=30)
        print(f"Checkout preview response status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Checkout preview working")
            print(f"Preview result: {response.json()}")
        else:
            print(f"❌ Checkout preview failed: {response.text}")
    except Exception as e:
        print(f"❌ Checkout preview request failed: {e}")

def test_search_endpoint():
    """Test search endpoint"""
    print("\n🔍 TESTING SEARCH ENDPOINT")
    
    # Try different search endpoint patterns
    search_endpoints = [
        "/listings/search",
        "/search/listings",
        "/search"
    ]
    
    for endpoint in search_endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", params={"q": "cattle"}, timeout=30)
            print(f"Search endpoint {endpoint} response status: {response.status_code}")
            if response.status_code == 200:
                print(f"✅ Search endpoint {endpoint} working")
                results = response.json()
                print(f"Search results: {len(results) if isinstance(results, list) else 'dict response'}")
                break
            else:
                print(f"❌ Search endpoint {endpoint} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Search endpoint {endpoint} request failed: {e}")

def test_pdp_seller_info():
    """Test PDP seller information retrieval"""
    print("\n📄 TESTING PDP SELLER INFORMATION")
    
    test_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"
    
    try:
        response = requests.get(f"{BACKEND_URL}/listings/{test_listing_id}", timeout=30)
        print(f"PDP response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ PDP endpoint working")
            
            # Check seller information
            seller_info = data.get("seller")
            if seller_info:
                print(f"✅ Seller information found: {seller_info}")
            else:
                print("❌ No seller information in PDP response")
                print(f"Available keys: {list(data.keys())}")
                
            # Check for seller_id field
            seller_id = data.get("seller_id")
            if seller_id:
                print(f"✅ Seller ID found: {seller_id}")
            else:
                print("❌ No seller_id in PDP response")
                
        else:
            print(f"❌ PDP failed: {response.text}")
    except Exception as e:
        print(f"❌ PDP request failed: {e}")

if __name__ == "__main__":
    print("🎯 FOCUSED BACKEND TESTING")
    print("=" * 50)
    
    test_auth_endpoints()
    test_guest_checkout_endpoints()
    test_checkout_preview()
    test_search_endpoint()
    test_pdp_seller_info()
    
    print("\n✅ Focused testing completed!")