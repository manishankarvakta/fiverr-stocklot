"""
📦 COMPREHENSIVE LISTINGS SEED SCRIPT
Seeds listings for all testing scenarios:
- Core livestock (Poultry, Ruminants, Rabbits, Aquaculture)
- Exotic livestock (Ostrich, Game Animals, etc.)
- All listing types (buy_now, auction, hybrid)
- All provinces
- Different price ranges
- With and without delivery
- Different product types
"""

import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import uuid

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# MongoDB connection
# Use environment variable or default to the same connection as server.py
# If running locally (outside Docker), use localhost:27025 (exposed port)
# If running in Docker, use clients-stocklot-z8penj-mongodb-1:27025
import socket
def is_docker_available():
    """Check if we can resolve stocklot-mongodb hostname"""
    try:
        socket.gethostbyname('stocklot-mongodb')
        return True
    except socket.gaierror:
        return False

if is_docker_available():
    DEFAULT_MONGO_URL = "mongodb://admin:adminpassword@clients-stocklot-z8penj-mongodb-1:27025/"
else:
    # Running locally, use exposed port
    DEFAULT_MONGO_URL = "mongodb://admin:adminpassword@localhost:27025/"

MONGO_URL = os.getenv("MONGODB_URL", os.getenv("MONGO_URL", DEFAULT_MONGO_URL))
# Get database name from environment or use default (matching server.py)
DB_NAME = os.getenv("DB_NAME", "stocklot")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database(DB_NAME)

async def get_or_create_seller():
    """Get or create a test seller"""
    seller = await db.users.find_one({"email": "seller@test.com"})
    if not seller:
        seller_id = "seller-test-001"
        await db.users.insert_one({
            "id": seller_id,
            "email": "seller@test.com",
            "full_name": "Test Seller",
            "username": "testseller",
            "roles": ["seller"],
            "status": "active",
            "created_at": datetime.now(timezone.utc)
        })
        return seller_id
    return seller["id"]

async def get_taxonomy_ids():
    """Get all taxonomy IDs from database"""
    taxonomy = {}
    
    # Get category groups
    categories = await db.category_groups.find({}).to_list(length=None)
    taxonomy["categories"] = {cat["name"]: cat["id"] for cat in categories}
    
    # Get species
    species = await db.species.find({}).to_list(length=None)
    taxonomy["species"] = {}
    for sp in species:
        name = sp["name"]
        taxonomy["species"][name] = {
            "id": sp["id"],
            "category_group_id": sp.get("category_group_id"),
            "is_exotic": sp.get("is_exotic", False)
        }
    
    # Get breeds
    breeds = await db.breeds.find({}).to_list(length=None)
    taxonomy["breeds"] = {}
    for breed in breeds:
        species_id = breed.get("species_id")
        breed_name = breed["name"]
        if species_id not in taxonomy["breeds"]:
            taxonomy["breeds"][species_id] = {}
        taxonomy["breeds"][species_id][breed_name] = breed["id"]
    
    # Get product types
    product_types = await db.product_types.find({}).to_list(length=None)
    taxonomy["product_types"] = {pt["label"]: pt["id"] for pt in product_types}
    
    return taxonomy

async def seed_listings():
    """Seed comprehensive listings for testing"""
    print("🌱 Starting listings seed...")
    
    # Get seller ID
    seller_id = await get_or_create_seller()
    print(f"✅ Using seller ID: {seller_id}")
    
    # Get taxonomy
    taxonomy = await get_taxonomy_ids()
    print(f"✅ Loaded taxonomy: {len(taxonomy['categories'])} categories, {len(taxonomy['species'])} species")
    
    # Helper function to get IDs safely
    def get_species_id(name):
        return taxonomy["species"].get(name, {}).get("id")
    
    def get_breed_id(species_id, breed_name):
        return taxonomy["breeds"].get(species_id, {}).get(breed_name)
    
    def get_category_id(name):
        return taxonomy["categories"].get(name)
    
    def get_product_type_id(name):
        return taxonomy["product_types"].get(name)
    
    # Provinces in South Africa
    provinces = ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", 
                 "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"]
    
    # ============================================
    # CORE LIVESTOCK LISTINGS (include_exotics=False)
    # ============================================
    
    # Get product type IDs once (used across all listings)
    live_animal_pt = get_product_type_id("Live Animal") or get_product_type_id("Live animal") or get_product_type_id("Live")
    day_old_pt = get_product_type_id("Day-Old Chicks") or get_product_type_id("Day-old chicks") or get_product_type_id("Day Old Chicks")
    
    core_listings = []
    
    # POULTRY LISTINGS
    chicken_species_id = get_species_id("Chickens") or get_species_id("Commercial Broilers")
    if chicken_species_id:
        broiler_breed_id = get_breed_id(chicken_species_id, "Ross 308") or get_breed_id(chicken_species_id, "Broiler")
        
        # Day-old chicks - Buy Now
        for i, province in enumerate(provinces[:5]):
            core_listings.append({
                "id": f"listing-poultry-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Poultry"),
                "species_id": chicken_species_id,
                "breed_id": broiler_breed_id,
                "product_type_id": day_old_pt,
                "title": f"Ross 308 Day-Old Broiler Chicks - {province}",
                "description": f"Premium quality day-old Ross 308 broiler chicks. Fast-growing breed, excellent feed conversion. Available in {province}.",
                "quantity": 500 + (i * 100),
                "unit": "head",
                "price_per_unit": 8.50 + (i * 0.50),
                "listing_type": "buy_now",
                "region": province,
                "city": f"City {i+1}",
                "province": province,
                "delivery_available": i % 2 == 0,
                "has_vet_certificate": True,
                "health_status": "excellent",
                "vaccination_status": "scheduled",
                "survival_rate": 95,
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=10-i),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=10-i)
            })
        
        # Live chickens - Auction
        for i in range(3):
            core_listings.append({
                "id": f"listing-poultry-auction-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Poultry"),
                "species_id": chicken_species_id,
                "breed_id": broiler_breed_id,
                "product_type_id": live_animal_pt,
                "title": f"Live Broiler Chickens - Batch {i+1}",
                "description": f"Healthy live broiler chickens ready for processing. Age: 6-8 weeks. Weight: 2-2.5kg.",
                "quantity": 100 + (i * 50),
                "unit": "head",
                "price_per_unit": 45.00 + (i * 5),
                "listing_type": "auction",
                "starting_price": 40.00 + (i * 5),
                "reserve_price": 42.00 + (i * 5),
                "auction_end_time": (datetime.now(timezone.utc) + timedelta(days=3+i)).isoformat(),
                "region": provinces[i],
                "city": f"City {i+1}",
                "province": provinces[i],
                "delivery_available": True,
                "has_vet_certificate": True,
                "health_status": "healthy",
                "vaccination_status": "fully_vaccinated",
                "age": "6-8 weeks",
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=2),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
            })
    
    # RUMINANTS - CATTLE
    cattle_species_id = get_species_id("Cattle") or get_species_id("Beef Cattle")
    if cattle_species_id:
        angus_breed_id = get_breed_id(cattle_species_id, "Angus") or get_breed_id(cattle_species_id, "Aberdeen Angus")
        brahman_breed_id = get_breed_id(cattle_species_id, "Brahman")
        
        # Angus Cattle - Buy Now
        for i in range(4):
            core_listings.append({
                "id": f"listing-cattle-angus-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Ruminants"),
                "species_id": cattle_species_id,
                "breed_id": angus_breed_id,
                "product_type_id": live_animal_pt,
                "title": f"Premium Angus Cattle - Breeding Stock {i+1}",
                "description": f"High-quality Angus cattle for breeding. Excellent genetics, all vaccinated and certified. Location: {provinces[i]}",
                "quantity": 20 + (i * 5),
                "unit": "head",
                "price_per_unit": 15000.00 + (i * 2000),
                "listing_type": "buy_now",
                "region": provinces[i],
                "city": f"City {i+1}",
                "province": provinces[i],
                "delivery_available": i % 2 == 0,
                "has_vet_certificate": True,
                "health_status": "healthy",
                "vaccination_status": "fully_vaccinated",
                "age": "18-24 months",
                "sex": "mixed",
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=8-i),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=8-i)
            })
        
        # Brahman Cattle - Hybrid (Auction + Buy Now)
        for i in range(2):
            core_listings.append({
                "id": f"listing-cattle-brahman-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Ruminants"),
                "species_id": cattle_species_id,
                "breed_id": brahman_breed_id,
                "product_type_id": live_animal_pt,
                "title": f"Brahman Cattle - Heat Tolerant Breed {i+1}",
                "description": f"Purebred Brahman cattle, excellent for hot climates. Hardy and disease-resistant.",
                "quantity": 15 + (i * 5),
                "unit": "head",
                "price_per_unit": 18000.00 + (i * 2000),
                "listing_type": "hybrid",
                "starting_price": 16000.00 + (i * 2000),
                "buy_now_price": 20000.00 + (i * 2000),
                "reserve_price": 17000.00 + (i * 2000),
                "auction_end_time": (datetime.now(timezone.utc) + timedelta(days=5+i)).isoformat(),
                "region": provinces[i+2],
                "city": f"City {i+1}",
                "province": provinces[i+2],
                "delivery_available": True,
                "has_vet_certificate": True,
                "health_status": "excellent",
                "vaccination_status": "fully_vaccinated",
                "age": "24-30 months",
                "sex": "mixed",
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=1),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
            })
    
    # RUMINANTS - GOATS
    goat_species_id = get_species_id("Goats") or get_species_id("Goat")
    if goat_species_id:
        boer_breed_id = get_breed_id(goat_species_id, "Boer")
        
        # Boer Goats - Various types
        for i in range(5):
            core_listings.append({
                "id": f"listing-goat-boer-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Ruminants"),
                "species_id": goat_species_id,
                "breed_id": boer_breed_id,
                "product_type_id": live_animal_pt,
                "title": f"Boer Goats - Quality Breeding Stock {i+1}",
                "description": f"Purebred Boer goats, excellent meat production. Healthy and well-maintained. Location: {provinces[i]}",
                "quantity": 30 + (i * 10),
                "unit": "head",
                "price_per_unit": 2500.00 + (i * 200),
                "listing_type": "buy_now" if i % 2 == 0 else "auction",
                "starting_price": 2200.00 + (i * 200) if i % 2 == 1 else None,
                "reserve_price": 2300.00 + (i * 200) if i % 2 == 1 else None,
                "auction_end_time": (datetime.now(timezone.utc) + timedelta(days=4+i)).isoformat() if i % 2 == 1 else None,
                "region": provinces[i],
                "city": f"City {i+1}",
                "province": provinces[i],
                "delivery_available": i % 3 != 0,
                "has_vet_certificate": True,
                "health_status": "healthy",
                "vaccination_status": "fully_vaccinated",
                "age": "12-18 months",
                "sex": "mixed",
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=6-i),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=6-i)
            })
    
    # RUMINANTS - SHEEP
    sheep_species_id = get_species_id("Sheep")
    if sheep_species_id:
        dorper_breed_id = get_breed_id(sheep_species_id, "Dorper")
        
        # Dorper Sheep
        for i in range(4):
            core_listings.append({
                "id": f"listing-sheep-dorper-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Ruminants"),
                "species_id": sheep_species_id,
                "breed_id": dorper_breed_id,
                "product_type_id": live_animal_pt,
                "title": f"Dorper Sheep - Commercial Flock {i+1}",
                "description": f"Hardy Dorper sheep, excellent for meat production. Free-range raised. Location: {provinces[i]}",
                "quantity": 50 + (i * 25),
                "unit": "head",
                "price_per_unit": 1200.00 + (i * 100),
                "listing_type": "buy_now",
                "region": provinces[i],
                "city": f"City {i+1}",
                "province": provinces[i],
                "delivery_available": True,
                "has_vet_certificate": True,
                "health_status": "healthy",
                "vaccination_status": "fully_vaccinated",
                "age": "6-12 months",
                "sex": "mixed",
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=7-i),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=7-i)
            })
    
    # ============================================
    # EXOTIC LIVESTOCK LISTINGS (include_exotics=True)
    # ============================================
    
    exotic_listings = []
    
    # OSTRICH
    ostrich_species_id = get_species_id("Ostrich")
    if ostrich_species_id:
        for i in range(3):
            exotic_listings.append({
                "id": f"listing-ostrich-{i+1}",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Large Flightless Birds") or get_category_id("Ostrich"),
                "species_id": ostrich_species_id,
                "breed_id": None,
                "product_type_id": live_animal_pt,
                "title": f"Ostrich Breeding Pairs - Premium Quality {i+1}",
                "description": f"Mature ostrich breeding pairs. All permits and certifications in order. Location: {provinces[i]}",
                "quantity": 2 + i,
                "unit": "head",
                "price_per_unit": 45000.00 + (i * 5000),
                "listing_type": "hybrid",
                "starting_price": 40000.00 + (i * 5000),
                "buy_now_price": 50000.00 + (i * 5000),
                "reserve_price": 42000.00 + (i * 5000),
                "auction_end_time": (datetime.now(timezone.utc) + timedelta(days=7+i)).isoformat(),
                "region": provinces[i],
                "city": f"City {i+1}",
                "province": provinces[i],
                "delivery_available": True,
                "has_vet_certificate": True,
                "health_status": "excellent",
                "vaccination_status": "fully_vaccinated",
                "age": "3-5 years",
                "sex": "mixed",
                "permit_required": True,
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=3-i),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=3-i)
            })
    
    # GAME ANIMALS
    game_species = ["Springbok", "Blesbok", "Impala"]
    for species_name in game_species:
        species_id = get_species_id(species_name)
        if species_id:
            exotic_listings.append({
                "id": f"listing-game-{species_name.lower()}-1",
                "seller_id": seller_id,
                "org_id": None,
                "category_group_id": get_category_id("Game Animals"),
                "species_id": species_id,
                "breed_id": None,
                "product_type_id": live_animal_pt,
                "title": f"{species_name} - Game Farm Stock",
                "description": f"Healthy {species_name} for game farming. All permits required. Professional handling.",
                "quantity": 10,
                "unit": "head",
                "price_per_unit": 3500.00,
                "listing_type": "buy_now",
                "region": "Limpopo",
                "city": "Polokwane",
                "province": "Limpopo",
                "delivery_available": False,
                "has_vet_certificate": True,
                "health_status": "healthy",
                "vaccination_status": "fully_vaccinated",
                "permit_required": True,
                "status": "active",
                "moderation_status": "APPROVED",
                "created_at": datetime.now(timezone.utc) - timedelta(days=2),
                "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
            })
    
    # ============================================
    # INSERT ALL LISTINGS
    # ============================================
    
    all_listings = core_listings + exotic_listings
    
    print(f"\n📦 Inserting {len(all_listings)} listings...")
    print(f"   - Core livestock: {len(core_listings)}")
    print(f"   - Exotic livestock: {len(exotic_listings)}")
    
    inserted_count = 0
    for listing in all_listings:
        try:
            result = await db.listings.update_one(
                {"id": listing["id"]},
                {"$set": listing},
                upsert=True
            )
            if result.upserted_id or result.modified_count > 0:
                inserted_count += 1
        except Exception as e:
            print(f"   ❌ Error inserting {listing['id']}: {e}")
    
    print(f"\n✅ Successfully seeded {inserted_count} listings")
    print(f"\n📊 Breakdown:")
    print(f"   - Buy Now: {sum(1 for l in all_listings if l.get('listing_type') == 'buy_now')}")
    print(f"   - Auctions: {sum(1 for l in all_listings if l.get('listing_type') == 'auction')}")
    print(f"   - Hybrid: {sum(1 for l in all_listings if l.get('listing_type') == 'hybrid')}")
    print(f"   - With Delivery: {sum(1 for l in all_listings if l.get('delivery_available'))}")
    print(f"   - Without Delivery: {sum(1 for l in all_listings if not l.get('delivery_available'))}")
    
    return inserted_count

async def main():
    """Main function"""
    try:
        await seed_listings()
        print("\n🎉 Listings seed completed successfully!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())

