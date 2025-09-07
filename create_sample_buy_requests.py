#!/usr/bin/env python3
"""
Create sample buy requests to test the buy requests page functionality
"""
import asyncio
import aiohttp
import json
from datetime import datetime, timezone, timedelta

async def create_sample_buy_requests():
    """Create sample buy requests for testing"""
    
    base_url = "http://localhost:8001/api"
    
    # Sample buy requests with proper specifications
    sample_buy_requests = [
        {
            "title": "Premium Angus Cattle - Commercial Grade",
            "description": "Looking for high-quality Angus cattle for commercial beef production. Need healthy animals with proper health certificates.",
            "species": "Cattle",
            "product_type": "Market-Ready",
            "qty": 25,
            "unit": "head",
            "target_price": 18000,
            "has_target_price": True,
            "max_price": 20000,
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
            "region": "Limpopo",
            "city": "Polokwane",
            "weight_range": {"min": 400, "max": 550, "unit": "kg"},
            "age_requirements": {"min_age": 18, "max_age": 24, "unit": "weeks"},
            "vaccination_requirements": ["Anthrax", "Blackleg", "Botulism"],
            "health_certificate_required": True,
            "inspection_allowed": True,
            "delivery_preferences": "both"
        },
        {
            "title": "Ross 308 Broiler Chicks - Day Old",
            "description": "Need premium Ross 308 day-old broiler chicks from healthy parent stock. Must have hatchery health certificates.",
            "species": "Commercial Broilers",
            "product_type": "Day-Old",
            "qty": 5000,
            "unit": "head",
            "target_price": 8.00,
            "has_target_price": True,
            "max_price": 10.00,
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "region": "Western Cape",
            "city": "Stellenbosch",
            "weight_range": {"min": 40, "max": 60, "unit": "g"},
            "age_requirements": {"min_age": 0, "max_age": 1, "unit": "days"},
            "vaccination_requirements": ["Marek's disease", "Newcastle disease"],
            "health_certificate_required": True,
            "inspection_allowed": True,
            "delivery_preferences": "pickup_only"
        },
        {
            "title": "Boer Goat Kids - 3 Month Old",
            "description": "Looking for healthy Boer goat kids for breeding purposes. Must be from registered breeding stock.",
            "species": "Goats",
            "product_type": "Calves/Kids/Lambs",
            "qty": 15,
            "unit": "head",
            "target_price": 2000,
            "has_target_price": True,
            "max_price": 2500,
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=21)).isoformat(),
            "region": "Eastern Cape",
            "city": "Graaff-Reinet",
            "weight_range": {"min": 15, "max": 25, "unit": "kg"},
            "age_requirements": {"min_age": 10, "max_age": 14, "unit": "weeks"},
            "vaccination_requirements": ["CDT vaccination", "Vitamin E/Selenium injection"],
            "health_certificate_required": True,
            "inspection_allowed": True,
            "delivery_preferences": "both"
        },
        {
            "title": "Dorper Sheep Lambs - Commercial",
            "description": "Need premium Dorper lambs for meat production. Looking for healthy animals with good growth rates.",
            "species": "Sheep",
            "product_type": "Calves/Kids/Lambs",
            "qty": 40,
            "unit": "head",
            "target_price": 1800,
            "has_target_price": True,
            "max_price": 2000,
            "deadline_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "region": "Northern Cape",
            "city": "Upington",
            "weight_range": {"min": 25, "max": 40, "unit": "kg"},
            "age_requirements": {"min_age": 20, "max_age": 28, "unit": "weeks"},
            "vaccination_requirements": ["Pulpy kidney", "Tetanus", "Pasteurella"],
            "health_certificate_required": True,
            "inspection_allowed": True,
            "delivery_preferences": "delivery_only"
        }
    ]
    
    print("🐄 Creating sample buy requests with comprehensive specifications...")
    
    async with aiohttp.ClientSession() as session:
        # First authenticate as admin
        auth_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        try:
            async with session.post(f"{base_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    token = data.get("token", "admin@stocklot.co.za")
                    print(f"✅ Authenticated as admin")
                else:
                    print(f"❌ Authentication failed: {response.status}")
                    return
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        created_requests = []
        
        for i, request_data in enumerate(sample_buy_requests, 1):
            try:
                print(f"\n📝 Creating buy request {i}: {request_data['title']}")
                print(f"   Species: {request_data['species']}")
                print(f"   Product Type: {request_data['product_type']}")
                print(f"   Quantity: {request_data['qty']} {request_data['unit']}")
                print(f"   Target Price: R{request_data['target_price']}")
                print(f"   Weight Range: {request_data['weight_range']['min']}-{request_data['weight_range']['max']} {request_data['weight_range']['unit']}")
                print(f"   Age Range: {request_data['age_requirements']['min_age']}-{request_data['age_requirements']['max_age']} {request_data['age_requirements']['unit']}")
                
                async with session.post(f"{base_url}/buy-requests", json=request_data, headers=headers) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        created_requests.append(result)
                        print(f"   ✅ Created buy request ID: {result.get('id', 'unknown')}")
                    else:
                        error_text = await response.text()
                        print(f"   ❌ Failed to create buy request: {response.status}")
                        print(f"   Error: {error_text}")
                        
            except Exception as e:
                print(f"   ❌ Error creating buy request {i}: {e}")
        
        print(f"\n🎉 Successfully created {len(created_requests)} sample buy requests!")
        print("✅ Buy Requests page now has comprehensive test data:")
        print("   - Detailed livestock specifications")
        print("   - Weight and age requirements")
        print("   - Vaccination requirements")
        print("   - Target pricing information")
        print("   - Location details")
        
        print(f"\n📊 Total buy requests created: {len(created_requests)}")
        for request in created_requests:
            print(f"   • {request.get('title', 'Unknown')}")

if __name__ == "__main__":
    asyncio.run(create_sample_buy_requests())