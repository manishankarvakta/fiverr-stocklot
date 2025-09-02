#!/usr/bin/env python3

import asyncio
import os
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def fix_database():
    """Fix the missing database data"""
    print("🔧 Fixing FarmStock Database - Adding Missing Data")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # 1. Add missing goat breeds
        print("1. Checking goat breeds...")
        goat_species = await db.species.find_one({"name": "Goats"})
        if goat_species:
            existing_goat_breeds = await db.breeds.count_documents({"species_id": goat_species["id"]})
            print(f"   Existing goat breeds: {existing_goat_breeds}")
            
            if existing_goat_breeds == 0:
                goat_breeds_data = [
                    {"id": str(uuid.uuid4()), "species_id": goat_species["id"], "name": "Boer", "purpose_hint": "meat"},
                    {"id": str(uuid.uuid4()), "species_id": goat_species["id"], "name": "Kalahari Red", "purpose_hint": "meat"},
                    {"id": str(uuid.uuid4()), "species_id": goat_species["id"], "name": "Saanen", "purpose_hint": "dairy"},
                    {"id": str(uuid.uuid4()), "species_id": goat_species["id"], "name": "Angora", "purpose_hint": "fiber"}
                ]
                await db.breeds.insert_many(goat_breeds_data)
                print(f"   ✅ Added {len(goat_breeds_data)} goat breeds")
            else:
                print("   ✅ Goat breeds already exist")
        
        # 2. Create sample seller user
        print("\n2. Checking sample seller user...")
        sample_seller = await db.users.find_one({"email": "seller@farmstock.co.za"})
        if not sample_seller:
            sample_seller_data = {
                "id": str(uuid.uuid4()),
                "email": "seller@farmstock.co.za",
                "full_name": "John van der Merwe",
                "phone": "+27 82 555 1234",
                "roles": ["seller"],
                "is_verified": True,
                "password": hash_password("password123"),
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(sample_seller_data)
            sample_seller = sample_seller_data
            print("   ✅ Created sample seller user")
        else:
            print("   ✅ Sample seller user already exists")
        
        # 3. Create sample listings
        print("\n3. Checking sample listings...")
        listings_count = await db.listings.count_documents({})
        print(f"   Current listings count: {listings_count}")
        
        if listings_count == 0:
            # Get required data
            chicken_species = await db.species.find_one({"name": "Chickens"})
            goat_species = await db.species.find_one({"name": "Goats"})
            
            day_old_pt = await db.product_types.find_one({"code": "DAY_OLD"})
            grower_pt = await db.product_types.find_one({"code": "GROWER"})
            breeding_pt = await db.product_types.find_one({"code": "BREEDING_STOCK"})
            
            ross_breed = await db.breeds.find_one({"name": "Ross 308"})
            boer_breed = await db.breeds.find_one({"name": "Boer"})
            isa_breed = await db.breeds.find_one({"name": "ISA Brown"})
            
            print(f"   Data availability:")
            print(f"     - Chicken species: {'✅' if chicken_species else '❌'}")
            print(f"     - Goat species: {'✅' if goat_species else '❌'}")
            print(f"     - Day-old product type: {'✅' if day_old_pt else '❌'}")
            print(f"     - Grower product type: {'✅' if grower_pt else '❌'}")
            print(f"     - Breeding product type: {'✅' if breeding_pt else '❌'}")
            print(f"     - Ross 308 breed: {'✅' if ross_breed else '❌'}")
            print(f"     - Boer breed: {'✅' if boer_breed else '❌'}")
            print(f"     - ISA Brown breed: {'✅' if isa_breed else '❌'}")
            
            # Create sample listings
            sample_listings = []
            
            # Ross 308 Day-Old Chicks
            if ross_breed and day_old_pt and chicken_species:
                sample_listings.append({
                    "id": str(uuid.uuid4()),
                    "seller_id": sample_seller["id"],
                    "species_id": chicken_species["id"],
                    "breed_id": ross_breed["id"],
                    "product_type_id": day_old_pt["id"],
                    "title": "Ross 308 Day-Old Chicks - Premium Broiler Stock",
                    "description": "High-quality Ross 308 day-old chicks from certified breeding stock. Fast-growing broiler breed perfect for meat production. Vaccinated and health-checked.",
                    "quantity": 100,
                    "unit": "head",
                    "price_per_unit": 15.50,
                    "fulfillment": "both",
                    "delivery_available": True,
                    "has_vet_certificate": True,
                    "health_notes": "Vaccinated against Marek's disease and Newcastle",
                    "country": "South Africa",
                    "region": "Gauteng",
                    "city": "Pretoria",
                    "images": [],
                    "status": "active",
                    "expires_at": datetime.now(timezone.utc) + timedelta(days=14),
                    "created_at": datetime.now(timezone.utc)
                })
            
            # Boer Goat Kids
            if boer_breed and grower_pt and goat_species:
                sample_listings.append({
                    "id": str(uuid.uuid4()),
                    "seller_id": sample_seller["id"],
                    "species_id": goat_species["id"],
                    "breed_id": boer_breed["id"],
                    "product_type_id": grower_pt["id"],
                    "title": "Boer Goat Kids - 3 Month Old Growers",
                    "description": "Healthy Boer goat kids, 3 months old and weaned. Excellent for meat production or breeding program. Well-socialized and handled daily.",
                    "quantity": 12,
                    "unit": "head",
                    "price_per_unit": 850.00,
                    "fulfillment": "pickup_only",
                    "delivery_available": False,
                    "has_vet_certificate": True,
                    "health_notes": "Dewormed and vaccinated. Health certificates available.",
                    "country": "South Africa",
                    "region": "Limpopo",
                    "city": "Polokwane",
                    "images": [],
                    "status": "active",
                    "expires_at": datetime.now(timezone.utc) + timedelta(days=14),
                    "created_at": datetime.now(timezone.utc)
                })
            
            # ISA Brown Pullets
            if isa_breed and breeding_pt and chicken_species:
                sample_listings.append({
                    "id": str(uuid.uuid4()),
                    "seller_id": sample_seller["id"],
                    "species_id": chicken_species["id"],
                    "breed_id": isa_breed["id"],
                    "product_type_id": breeding_pt["id"],
                    "title": "ISA Brown Point-of-Lay Pullets - Ready to Lay",
                    "description": "16-week-old ISA Brown pullets ready to start laying. Excellent egg producers with high feed conversion efficiency. Perfect for small farms or backyard flocks.",
                    "quantity": 25,
                    "unit": "head",
                    "price_per_unit": 95.00,
                    "fulfillment": "seller_delivery",
                    "delivery_available": True,
                    "has_vet_certificate": False,
                    "health_notes": "Healthy birds, no recent illnesses. Raised on organic feed.",
                    "country": "South Africa",
                    "region": "Western Cape",
                    "city": "Stellenbosch",
                    "images": [],
                    "status": "active",
                    "expires_at": datetime.now(timezone.utc) + timedelta(days=14),
                    "created_at": datetime.now(timezone.utc)
                })
            
            if sample_listings:
                result = await db.listings.insert_many(sample_listings)
                print(f"   ✅ Created {len(result.inserted_ids)} sample listings")
                
                # Show created listings
                for listing in sample_listings:
                    print(f"     - {listing['title']} - R{listing['price_per_unit']}")
            else:
                print("   ❌ Could not create listings - missing required data")
        else:
            print("   ✅ Listings already exist")
        
        print(f"\n🎉 Database fix completed!")
        
        # Final verification
        print(f"\n📊 Final counts:")
        print(f"   Species: {await db.species.count_documents({})}")
        print(f"   Product types: {await db.product_types.count_documents({})}")
        print(f"   Breeds: {await db.breeds.count_documents({})}")
        print(f"   Users: {await db.users.count_documents({})}")
        print(f"   Listings: {await db.listings.count_documents({})}")
    
    except Exception as e:
        print(f"❌ Error fixing database: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_database())