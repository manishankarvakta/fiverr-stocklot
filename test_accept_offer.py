#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta

def test_accept_offer_issue():
    """Test the specific accept offer issue"""
    base_url = "https://pdp-cart-bug.preview.emergentagent.com/api"
    
    print("🔍 Testing Accept Offer Issue...")
    
    # Create test users
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Create and login buyer
    buyer_data = {
        "email": f"buyer_accept_{timestamp}@example.com",
        "password": "TestPass123!",
        "full_name": "Accept Test Buyer",
        "phone": "+27123456789",
        "role": "buyer"
    }
    
    requests.post(f"{base_url}/auth/register", json=buyer_data)
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": buyer_data["email"], 
        "password": buyer_data["password"]
    })
    buyer_token = login_response.json()['access_token']
    
    # Create and login seller
    seller_data = {
        "email": f"seller_accept_{timestamp}@example.com",
        "password": "TestPass123!",
        "full_name": "Accept Test Seller",
        "phone": "+27123456790",
        "role": "seller"
    }
    
    requests.post(f"{base_url}/auth/register", json=seller_data)
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": seller_data["email"], 
        "password": seller_data["password"]
    })
    seller_token = login_response.json()['access_token']
    
    # Create buy request
    request_data = {
        "species": "Cattle",
        "product_type": "Calves/Kids/Lambs", 
        "qty": 3,
        "unit": "head",
        "target_price": 4000.0,
        "breed": "Brahman",
        "province": "Limpopo",
        "country": "ZA",
        "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
        "notes": "Accept offer test request"
    }
    
    headers = {'Authorization': f'Bearer {buyer_token}', 'Content-Type': 'application/json'}
    response = requests.post(f"{base_url}/buy-requests", json=request_data, headers=headers)
    request_id = response.json()['id']
    print(f"✅ Buy request created: {request_id}")
    
    # Create offer
    offer_data = {
        "offer_price": 3800.0,
        "qty": 3,
        "message": "Premium Brahman calves for accept test"
    }
    
    headers = {'Authorization': f'Bearer {seller_token}', 'Content-Type': 'application/json'}
    response = requests.post(f"{base_url}/buy-requests/{request_id}/offers", json=offer_data, headers=headers)
    offer_id = response.json()['offer_id']
    print(f"✅ Offer created: {offer_id}")
    
    # Test accept offer - this is where the issue occurs
    headers = {'Authorization': f'Bearer {buyer_token}', 'Content-Type': 'application/json'}
    response = requests.post(f"{base_url}/buy-requests/{request_id}/offers/{offer_id}/accept", 
                           json={}, headers=headers)
    
    print(f"\n🔍 Accept Offer Response:")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.status_code == 500:
        print("❌ Accept offer returns 500 Internal Server Error")
        print("This confirms the ObjectId serialization issue in the backend")
        
        # Check if the offer was actually accepted in the database
        headers = {'Authorization': f'Bearer {buyer_token}'}
        response = requests.get(f"{base_url}/buyers/offers?status=accepted", headers=headers)
        if response.status_code == 200:
            accepted_offers = response.json().get('items', [])
            accepted_offer = next((o for o in accepted_offers if o['id'] == offer_id), None)
            if accepted_offer:
                print("✅ Despite 500 error, offer was actually accepted in database")
                print("   Issue: Backend logic works but response serialization fails")
            else:
                print("❌ Offer was not accepted in database")
                print("   Issue: Backend logic also has problems")
        
        # Check if request status changed
        headers = {'Authorization': f'Bearer {buyer_token}'}
        response = requests.get(f"{base_url}/buy-requests", headers=headers)
        if response.status_code == 200:
            requests_data = response.json().get('items', [])
            test_request = next((r for r in requests_data if r['id'] == request_id), None)
            if test_request:
                print(f"   Request status: {test_request.get('status', 'unknown')}")
                if test_request.get('status') == 'fulfilled':
                    print("✅ Request status correctly updated to fulfilled")
                else:
                    print("❌ Request status not updated correctly")
    
    elif response.status_code == 200:
        print("✅ Accept offer works correctly")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
    
    else:
        print(f"❌ Unexpected status code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_accept_offer_issue()