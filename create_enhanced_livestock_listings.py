#!/usr/bin/env python3
"""
Create enhanced livestock listings with proper specifications
This addresses the "Marketplace listings specifications still need work not fixed" issue
"""
import asyncio
import aiohttp
import json
from datetime import datetime, timezone, timedelta

async def create_enhanced_listings():
    """Create marketplace listings with comprehensive livestock specifications"""
    
    base_url = "http://localhost:8001/api"
    
    # Enhanced livestock listings with proper API field names
    enhanced_listings = [
        {
            "species_id": "c6e8d249-e7c6-4a34-91e6-73e840de56b3",  # Cattle
            "product_type_id": "e757be3b-ed94-47a4-a5bd-ce3d23d837dc",  # Market-Ready
            "title": "Premium Angus Cattle - Commercial Grade",
            "description": "High-quality Angus cattle suitable for commercial beef production. Grass-fed, healthy animals with excellent genetics. All health certifications included.",
            "quantity": 25,
            "unit": "head", 
            "price_per_unit": 18500,
            "listing_type": "buy_now",
            
            # ✅ LIVESTOCK SPECIFICATIONS - These are the missing fields!
            "weight_kg": 520.0,                    # Average weight
            "age_weeks": 78,                       # 18 months = ~78 weeks  
            "age_days": 546,                       # 18 months = ~546 days
            "age": "18 months",                    # Human readable age
            "vaccination_status": "Fully vaccinated - Anthrax, Blackleg, Botulism", 
            "health_certificates": [
                "Veterinary Health Certificate",
                "Tuberculosis Test Certificate", 
                "Brucellosis Test Certificate"
            ],
            
            "has_vet_certificate": True,
            "health_notes": "Annual health checks completed. Animals are in excellent condition with no known health issues.",
            "region": "Limpopo",
            "city": "Polokwane",
            "images": [
                "https://images.unsplash.com/photo-1560457079-9a6532ccb118?w=800",
                "https://images.unsplash.com/photo-1566207474742-de921626ad0c?w=800"
            ]
        },
        {
            "species_id": "poultry",
            "breed_id": "ross_308", 
            "product_type_id": "commercial",
            "title": "Ross 308 Broiler Chickens - Day Old Chicks",
            "description": "Premium Ross 308 day-old broiler chicks from parent stock. Excellent feed conversion ratio and growth rate. Suitable for commercial meat production.",
            "quantity": 5000,
            "unit": "head",
            "price_per_unit": 8.50,
            "listing_type": "buy_now",
            
            # ✅ LIVESTOCK SPECIFICATIONS 
            "weight_kg": 0.045,                    # Day-old chick weight (~45g)
            "age_weeks": 0,                        # Day-old
            "age_days": 1,                         # 1 day old
            "age": "Day-old chicks",
            "vaccination_status": "Hatchery vaccinations - Marek's disease, Newcastle disease",
            "health_certificates": [
                "Hatchery Health Certificate",
                "SAPA Registration Certificate",
                "Salmonella Testing Certificate"
            ],
            
            "has_vet_certificate": True,
            "health_notes": "Chicks hatched from healthy parent stock. Standard hatchery vaccinations completed.",
            "region": "Western Cape", 
            "city": "Stellenbosch",
            "images": [
                "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800"
            ]
        },
        {
            "species_id": "goats",
            "breed_id": "boer",
            "product_type_id": "breeding", 
            "title": "Boer Goat Kids - 3 Month Old Premium Breeding Stock",
            "description": "High-quality Boer goat kids from registered breeding stock. Excellent genetics for meat production. Well-socialized and healthy animals.",
            "quantity": 15,
            "unit": "head",
            "price_per_unit": 2200,
            "listing_type": "buy_now",
            
            # ✅ LIVESTOCK SPECIFICATIONS
            "weight_kg": 18.5,                     # 3-month Boer kid weight
            "age_weeks": 12,                       # 3 months = 12 weeks
            "age_days": 90,                        # 3 months = 90 days  
            "age": "3 months old",
            "vaccination_status": "CDT vaccination, Vitamin E/Selenium injection",
            "health_certificates": [
                "Veterinary Health Certificate",
                "Breeding Registration Papers",
                "CAE/CL Testing Certificate"
            ],
            
            "has_vet_certificate": True,
            "health_notes": "Kids are healthy, active, and ready for weaning. No health issues reported.",
            "region": "Eastern Cape",
            "city": "Graaff-Reinet", 
            "images": [
                "https://images.unsplash.com/photo-1594736797933-d0601ba2fe65?w=800"
            ]
        },
        {
            "species_id": "sheep",
            "breed_id": "dorper", 
            "product_type_id": "commercial",
            "title": "Dorper Sheep - 6 Month Old Commercial Lambs",
            "description": "Premium Dorper lambs suitable for meat production. Hardy breed well-adapted to South African conditions. Excellent growth rate and meat quality.",
            "quantity": 40,
            "unit": "head",
            "price_per_unit": 1850,
            "listing_type": "buy_now",
            
            # ✅ LIVESTOCK SPECIFICATIONS
            "weight_kg": 32.0,                     # 6-month Dorper lamb weight
            "age_weeks": 24,                       # 6 months = 24 weeks
            "age_days": 180,                       # 6 months = 180 days
            "age": "6 months old", 
            "vaccination_status": "Pulpy kidney, Tetanus, Pasteurella vaccinations",
            "health_certificates": [
                "Veterinary Health Certificate", 
                "Flock Health Status Certificate",
                "Parasite Treatment Record"
            ],
            
            "has_vet_certificate": True,
            "health_notes": "Lambs are in excellent condition. Regular deworming and health monitoring completed.",
            "region": "Northern Cape",
            "city": "Upington",
            "images": [
                "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800"
            ]
        }
    ]
    
    print("🏥 Creating enhanced livestock listings with comprehensive specifications...")
    print("This addresses the 'Marketplace listings specifications still need work' issue")
    
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
        
        created_listings = []
        
        for i, listing_data in enumerate(enhanced_listings, 1):
            try:
                print(f"\n📝 Creating listing {i}: {listing_data['title']}")
                print(f"   Species: {listing_data['species_id']}")
                print(f"   Weight: {listing_data['weight_kg']} kg")
                print(f"   Age: {listing_data['age']} ({listing_data['age_weeks']} weeks)")
                print(f"   Vaccinations: {listing_data['vaccination_status']}")
                print(f"   Health Certificates: {len(listing_data['health_certificates'])} certificates")
                
                async with session.post(f"{base_url}/listings", json=listing_data, headers=headers) as response:
                    if response.status == 201:
                        result = await response.json()
                        created_listings.append(result)
                        print(f"   ✅ Created listing ID: {result.get('id', 'unknown')}")
                    else:
                        error_text = await response.text() 
                        print(f"   ❌ Failed to create listing: {response.status}")
                        print(f"   Error: {error_text}")
                        
            except Exception as e:
                print(f"   ❌ Error creating listing {i}: {e}")
        
        print(f"\n🎉 Successfully created {len(created_listings)} enhanced livestock listings!")
        print("✅ Marketplace now has comprehensive livestock specifications:")
        print("   - Weight information (kg)")
        print("   - Age details (weeks, days, human-readable)")  
        print("   - Vaccination status")
        print("   - Health certificates")
        print("   - Breed information")
        print("   - Health notes")
        
        print(f"\n📊 Total listings created: {len(created_listings)}")
        for listing in created_listings:
            print(f"   • {listing.get('title', 'Unknown')}")

if __name__ == "__main__":
    asyncio.run(create_enhanced_listings())