#!/usr/bin/env python3

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def debug_database():
    """Debug database contents"""
    print("🔍 Debugging FarmStock Database Contents")
    print("=" * 50)
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Check collections
        collections = await db.list_collection_names()
        print(f"\nCollections in database: {collections}")
        
        # Check species
        species_count = await db.species.count_documents({})
        print(f"\nSpecies count: {species_count}")
        if species_count > 0:
            species_sample = await db.species.find().limit(3).to_list(length=3)
            print("Sample species:")
            for species in species_sample:
                print(f"  - {species.get('name', 'Unknown')} (ID: {species.get('id', 'N/A')})")
        
        # Check product types
        pt_count = await db.product_types.count_documents({})
        print(f"\nProduct types count: {pt_count}")
        if pt_count > 0:
            pt_sample = await db.product_types.find().limit(3).to_list(length=3)
            print("Sample product types:")
            for pt in pt_sample:
                print(f"  - {pt.get('label', 'Unknown')} ({pt.get('code', 'N/A')})")
        
        # Check breeds
        breeds_count = await db.breeds.count_documents({})
        print(f"\nBreeds count: {breeds_count}")
        if breeds_count > 0:
            breeds_sample = await db.breeds.find().limit(5).to_list(length=5)
            print("Sample breeds:")
            for breed in breeds_sample:
                print(f"  - {breed.get('name', 'Unknown')} (Species: {breed.get('species_id', 'N/A')})")
        
        # Check users
        users_count = await db.users.count_documents({})
        print(f"\nUsers count: {users_count}")
        if users_count > 0:
            users_sample = await db.users.find().limit(2).to_list(length=2)
            print("Sample users:")
            for user in users_sample:
                print(f"  - {user.get('full_name', 'Unknown')} ({user.get('email', 'N/A')})")
        
        # Check listings - THE MAIN ISSUE
        listings_count = await db.listings.count_documents({})
        print(f"\nListings count: {listings_count}")
        
        if listings_count > 0:
            listings_sample = await db.listings.find().limit(3).to_list(length=3)
            print("Sample listings:")
            for listing in listings_sample:
                print(f"  - {listing.get('title', 'Unknown')} - R{listing.get('price_per_unit', 0)}")
                print(f"    Status: {listing.get('status', 'N/A')}, Species: {listing.get('species_id', 'N/A')}")
        else:
            print("❌ NO LISTINGS FOUND!")
            print("\nLet's check what might have gone wrong during initialization...")
            
            # Check if we have the required data for creating listings
            chicken_species = await db.species.find_one({"name": "Chickens"})
            goat_species = await db.species.find_one({"name": "Goats"})
            day_old_pt = await db.product_types.find_one({"code": "DAY_OLD"})
            grower_pt = await db.product_types.find_one({"code": "GROWER"})
            breeding_pt = await db.product_types.find_one({"code": "BREEDING_STOCK"})
            
            print(f"\nRequired data check:")
            print(f"  - Chickens species: {'✅' if chicken_species else '❌'}")
            print(f"  - Goats species: {'✅' if goat_species else '❌'}")
            print(f"  - Day-old product type: {'✅' if day_old_pt else '❌'}")
            print(f"  - Grower product type: {'✅' if grower_pt else '❌'}")
            print(f"  - Breeding product type: {'✅' if breeding_pt else '❌'}")
            
            if chicken_species:
                # Check for breeds
                ross_breed = await db.breeds.find_one({"name": "Ross 308", "species_id": chicken_species["id"]})
                isa_breed = await db.breeds.find_one({"name": "ISA Brown", "species_id": chicken_species["id"]})
                print(f"  - Ross 308 breed: {'✅' if ross_breed else '❌'}")
                print(f"  - ISA Brown breed: {'✅' if isa_breed else '❌'}")
            
            if goat_species:
                boer_breed = await db.breeds.find_one({"name": "Boer", "species_id": goat_species["id"]})
                print(f"  - Boer breed: {'✅' if boer_breed else '❌'}")
            
            # Check for sample seller
            sample_seller = await db.users.find_one({"email": "seller@farmstock.co.za"})
            print(f"  - Sample seller user: {'✅' if sample_seller else '❌'}")
            
            if sample_seller:
                print(f"    Seller ID: {sample_seller.get('id', 'N/A')}")
                print(f"    Seller roles: {sample_seller.get('roles', [])}")
    
    except Exception as e:
        print(f"Error accessing database: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(debug_database())