#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class DebugMLTester:
    def __init__(self):
        self.base_url = "https://procurement-hub-10.preview.emergentagent.com/api"
        self.token = None

    def authenticate(self):
        """Authenticate as admin"""
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        response = requests.post(f"{self.base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            print(f"✅ Authenticated as admin")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False

    def test_ml_engine_smart_pricing(self):
        """Test ML Engine Smart Pricing with debug info"""
        print("\n🧠 Testing ML Engine Smart Pricing...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Test with minimal data first
        test_data = {
            "listing_data": {
                "species": "Commercial Broilers",
                "breed": "Ross 308",
                "quantity": 100,
                "unit": "head"
            }
        }
        
        response = requests.post(f"{self.base_url}/ml/engine/smart-pricing", json=test_data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error Detail: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Raw Error: {response.text}")

    def test_enhanced_buy_request(self):
        """Test Enhanced Buy Request creation with debug info"""
        print("\n🛒 Testing Enhanced Buy Request Creation...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Get species first
        species_response = requests.get(f"{self.base_url}/species", headers=headers)
        if species_response.status_code == 200:
            species_data = species_response.json()
            if species_data:
                species_id = species_data[0]['id']
                species_name = species_data[0]['name']
                print(f"Using species: {species_name} (ID: {species_id})")
            else:
                print("❌ No species found")
                return
        else:
            print(f"❌ Failed to get species: {species_response.status_code}")
            return
        
        # Get product types
        product_response = requests.get(f"{self.base_url}/product-types", headers=headers)
        if product_response.status_code == 200:
            product_data = product_response.json()
            if product_data:
                product_code = product_data[0]['code']
                product_label = product_data[0]['label']
                print(f"Using product type: {product_label} (Code: {product_code})")
            else:
                print("❌ No product types found")
                return
        else:
            print(f"❌ Failed to get product types: {product_response.status_code}")
            return
        
        # Test enhanced buy request creation
        test_data = {
            "species": species_name,  # Use species name, not ID
            "product_type": product_code,
            "qty": 50,
            "unit": "head",
            "target_price": 1500.0,
            "province": "Gauteng",
            "country": "ZA",
            "notes": "Looking for high-quality livestock",
            "enable_ai_enhancements": True,
            "auto_generate_description": False
        }
        
        print(f"Request data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(f"{self.base_url}/buy-requests/enhanced", json=test_data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}...")
        
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error Detail: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Raw Error: {response.text}")

    def test_photo_intelligence(self):
        """Test Photo Intelligence with debug info"""
        print("\n📸 Testing Photo Intelligence...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Simple 1x1 pixel PNG in base64
        test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGbKdMDgAAAABJRU5ErkJggg=="
        
        test_data = {
            "image_data": test_image,
            "listing_context": {
                "species": "cattle",
                "purpose": "assessment"
            }
        }
        
        response = requests.post(f"{self.base_url}/ml/photo/analyze", json=test_data, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code == 200:
            print("✅ Photo Intelligence working")
        else:
            try:
                error_data = response.json()
                print(f"Error Detail: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Raw Error: {response.text}")

    def run_debug_tests(self):
        """Run all debug tests"""
        print("🔍 ML Engine & Enhanced Buy Request Debug Testing")
        print("=" * 60)
        
        if not self.authenticate():
            return
        
        self.test_ml_engine_smart_pricing()
        self.test_enhanced_buy_request()
        self.test_photo_intelligence()
        
        print("\n" + "=" * 60)
        print("Debug testing completed")

if __name__ == "__main__":
    tester = DebugMLTester()
    tester.run_debug_tests()