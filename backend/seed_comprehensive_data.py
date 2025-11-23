#!/usr/bin/env python3
"""
🌱 COMPREHENSIVE DATABASE SEED SCRIPT
Seeds admin, seller, buyer users, taxonomy, listings, orders, and all related data
with proper relationships between entities.
"""

import os
import sys
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import bcrypt
from typing import Dict, List, Any

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

# MongoDB connection
# NOTE: server.py hardcodes db_name = 'stocklotDB', so we must use that
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL') or 'mongodb://posDBUser:posDBPassword@103.239.43.246:27017/?authSource=admin'
db_name = 'stocklotDB'  # Hardcoded to match server.py line 136

def hash_password(password: str) -> str:
    """Hash password using bcrypt - EXACT match to server.py implementation"""
    # This must match server.py line 844-846 exactly
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password - EXACT match to server.py implementation"""
    # This must match server.py line 848-850 exactly
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"   Password verification error: {e}")
        return False

async def seed_comprehensive_data():
    """Seed comprehensive data for StockLot marketplace"""
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Starting comprehensive database seeding...")
    print(f"📊 Database: {db_name}")
    
    # ============================================
    # 1. SEED USERS (Admin, Sellers, Buyers)
    # ============================================
    print("\n👥 Seeding users...")
    
    users_data = [
        # Admin Users
        {
            "id": "admin-001",
            "email": "admin@stocklot.co.za",
            "password": None,  # Will be hashed in the loop
            "password_plain": "Admin123!",
            "full_name": "StockLot Administrator",
            "phone": "+27123456789",
            "business_name": "StockLot Platform",
            "roles": ["admin"],
            "status": "active",
            "province": "Gauteng",
            "city": "Johannesburg",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc)
        },
        {
            "id": "admin-002",
            "email": "moderator@stocklot.co.za",
            "password": None,
            "password_plain": "Moderator123!",
            "full_name": "Content Moderator",
            "phone": "+27123456790",
            "roles": ["admin"],
            "status": "active",
            "province": "Western Cape",
            "city": "Cape Town",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        
        # Seller Users
        {
            "id": "seller-001",
            "email": "farmer.john@example.com",
            "password": None,
            "password_plain": "Seller123!",
            "full_name": "John Farmer",
            "phone": "+27111234567",
            "business_name": "Farmer John's Livestock",
            "roles": ["seller"],
            "status": "active",
            "province": "Gauteng",
            "city": "Pretoria",
            "farm_size": 500.0,
            "specialization": ["cattle", "sheep"],
            "years_experience": 15,
            "certifications": ["organic_certified", "veterinary_certificate"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=180),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc) - timedelta(hours=2)
        },
        {
            "id": "seller-002",
            "email": "poultry.expert@example.com",
            "password": None,
            "password_plain": "Seller123!",
            "full_name": "Sarah Poultry",
            "phone": "+27111234568",
            "business_name": "Premium Poultry Farm",
            "roles": ["seller"],
            "status": "active",
            "province": "KwaZulu-Natal",
            "city": "Durban",
            "farm_size": 200.0,
            "specialization": ["poultry", "chickens"],
            "years_experience": 10,
            "certifications": ["veterinary_certificate"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=120),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc) - timedelta(hours=5)
        },
        {
            "id": "seller-003",
            "email": "goat.specialist@example.com",
            "password": None,
            "password_plain": "Seller123!",
            "full_name": "Mike Goatman",
            "phone": "+27111234569",
            "business_name": "Mountain Goat Ranch",
            "roles": ["seller"],
            "status": "active",
            "province": "Eastern Cape",
            "city": "Port Elizabeth",
            "farm_size": 300.0,
            "specialization": ["goats"],
            "years_experience": 8,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=90),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": "seller-004",
            "email": "exotic.livestock@example.com",
            "password": None,
            "password_plain": "Seller123!",
            "full_name": "Emma Exotic",
            "phone": "+27111234570",
            "business_name": "Exotic Livestock Co",
            "roles": ["seller"],
            "status": "active",
            "province": "Western Cape",
            "city": "Stellenbosch",
            "farm_size": 1000.0,
            "specialization": ["ostrich", "game_animals"],
            "years_experience": 12,
            "certifications": ["exotic_permit", "veterinary_certificate"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=60),
            "updated_at": datetime.now(timezone.utc)
        },
        
        # Buyer Users
        {
            "id": "buyer-001",
            "email": "buyer.alice@example.com",
            "password": None,
            "password_plain": "Buyer123!",
            "full_name": "Alice Buyer",
            "phone": "+27111234571",
            "roles": ["buyer"],
            "status": "active",
            "province": "Gauteng",
            "city": "Johannesburg",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=150),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc) - timedelta(hours=1)
        },
        {
            "id": "buyer-002",
            "email": "buyer.bob@example.com",
            "password": None,
            "password_plain": "Buyer123!",
            "full_name": "Bob Purchaser",
            "phone": "+27111234572",
            "roles": ["buyer"],
            "status": "active",
            "province": "Western Cape",
            "city": "Cape Town",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=100),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc) - timedelta(hours=3)
        },
        {
            "id": "buyer-003",
            "email": "buyer.charlie@example.com",
            "password": None,
            "password_plain": "Buyer123!",
            "full_name": "Charlie Customer",
            "phone": "+27111234573",
            "roles": ["buyer"],
            "status": "active",
            "province": "KwaZulu-Natal",
            "city": "Pietermaritzburg",
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=75),
            "updated_at": datetime.now(timezone.utc)
        },
        
        # Users with multiple roles
        {
            "id": "user-001",
            "email": "farmer.buyer@example.com",
            "password": None,
            "password_plain": "User123!",
            "full_name": "David MultiRole",
            "phone": "+27111234574",
            "business_name": "David's Farm & Feed",
            "roles": ["buyer", "seller"],
            "status": "active",
            "province": "Free State",
            "city": "Bloemfontein",
            "farm_size": 400.0,
            "specialization": ["cattle", "sheep"],
            "years_experience": 20,
            "is_verified": True,
            "created_at": datetime.now(timezone.utc) - timedelta(days=200),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc) - timedelta(minutes=30)
        }
    ]
    
    # Verify password hashing works before seeding
    test_password = "Test123!"
    test_hash = hash_password(test_password)
    if not verify_password(test_password, test_hash):
        print("❌ ERROR: Password hashing/verification failed!")
        return
    print("   ✅ Password hashing verified")
    
    for user in users_data:
        email = user["email"]
        
        # Get plain password from user data
        user_password = user.pop("password_plain", None)
        if not user_password:
            # Fallback to default passwords based on email
            if "admin" in email.lower():
                user_password = "Admin123!"
            elif "moderator" in email.lower():
                user_password = "Moderator123!"
            elif "seller" in email.lower() or "farmer" in email.lower() or "poultry" in email.lower() or "goat" in email.lower() or "exotic" in email.lower():
                user_password = "Seller123!"
            elif "buyer" in email.lower():
                user_password = "Buyer123!"
            else:
                user_password = "User123!"
        
        # Ensure roles are lowercase strings (matching UserRole enum values: "buyer", "seller", "admin")
        if isinstance(user.get("roles"), list):
            user["roles"] = [str(role).lower() for role in user["roles"]]
        
        # Ensure status is lowercase (matching UserStatus enum values: "pending", "active", "suspended", "banned")
        if user.get("status"):
            user["status"] = str(user["status"]).lower()
        
        # Remove password_plain if it exists (cleanup)
        user.pop("password_plain", None)
        user.pop("password", None)  # Remove any existing password field
        
        # Hash the password using EXACT same method as server.py
        # This is critical - must match server.py line 844-846 exactly
        password_hash = hash_password(user_password)
        
        # Verify the hash works before storing
        if not verify_password(user_password, password_hash):
            print(f"   ❌ {email} - Password hash verification failed before storage!")
            continue
        
        # Store the hashed password
        user["password"] = password_hash
        
        # Delete existing user by both id and email to avoid duplicates
        delete_result_id = await db.users.delete_one({"id": user["id"]})
        delete_result_email = await db.users.delete_one({"email": email})
        
        # Insert the user
        try:
            result = await db.users.insert_one(user)
            if not result.inserted_id:
                print(f"   ❌ {email} - Insert failed (no inserted_id)")
                continue
        except Exception as e:
            print(f"   ❌ {email} - Insert error: {e}")
            continue
        
        # Immediately verify the user was inserted correctly and password works
        inserted_user = await db.users.find_one({"email": email})
        if not inserted_user:
            print(f"   ❌ {email} - User not found after insertion!")
            continue
        
        stored_password = inserted_user.get("password", "")
        if not stored_password:
            print(f"   ❌ {email} - No password field in stored user!")
            # Try to fix it
            await db.users.update_one({"email": email}, {"$set": {"password": password_hash}})
            stored_password = password_hash
        
        # Verify password works
        if verify_password(user_password, stored_password):
            print(f"   ✅ {email} - created and password verified")
        else:
            print(f"   ⚠️  {email} - password verification failed after storage")
            print(f"      Stored hash length: {len(stored_password)}")
            print(f"      Stored hash preview: {stored_password[:30]}...")
            
            # Try to fix by re-hashing
            new_hash = hash_password(user_password)
            if verify_password(user_password, new_hash):
                update_result = await db.users.update_one(
                    {"email": email},
                    {"$set": {"password": new_hash}}
                )
                # Verify again
                updated_user = await db.users.find_one({"email": email})
                if updated_user and verify_password(user_password, updated_user.get("password", "")):
                    print(f"   ✅ {email} - password re-hashed and verified")
                else:
                    print(f"   ❌ {email} - password fix failed after update")
            else:
                print(f"   ❌ {email} - new hash also fails verification!")
    
    print(f"✅ Seeded {len(users_data)} users")
    
    # ============================================
    # 2. SEED TAXONOMY (Categories, Species, Breeds)
    # ============================================
    print("\n📁 Seeding taxonomy...")
    
    # Category Groups
    category_groups = [
        {
            "id": "cat-poultry",
            "name": "Poultry",
            "description": "Chickens, Ducks, Geese, Turkeys",
            "category_type": "core",
            "display_order": 1,
            "icon": "🐔",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "cat-ruminants",
            "name": "Ruminants",
            "description": "Cattle, Goats, Sheep",
            "category_type": "core",
            "display_order": 2,
            "icon": "🐄",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "cat-rabbits",
            "name": "Rabbits",
            "description": "Rabbits and Hares",
            "category_type": "core",
            "display_order": 3,
            "icon": "🐰",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "cat-aquaculture",
            "name": "Aquaculture",
            "description": "Fish and Aquatic Species",
            "category_type": "core",
            "display_order": 4,
            "icon": "🐟",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "cat-exotic",
            "name": "Game Animals",
            "description": "Wild game species for commercial farming",
            "category_type": "exotic",
            "display_order": 10,
            "icon": "🦌",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "cat-ostrich",
            "name": "Large Flightless Birds",
            "description": "Ostrich, Emu, Rhea",
            "category_type": "exotic",
            "display_order": 11,
            "icon": "🦃",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for cat in category_groups:
        await db.category_groups.update_one(
            {"id": cat["id"]},
            {"$set": cat},
            upsert=True
        )
    
    print(f"✅ Seeded {len(category_groups)} category groups")
    
    # Species
    species_data = [
        # Poultry
        {"id": "spec-chicken", "name": "Chicken", "category_group_id": "cat-poultry"},
        {"id": "spec-duck", "name": "Duck", "category_group_id": "cat-poultry"},
        {"id": "spec-goose", "name": "Goose", "category_group_id": "cat-poultry"},
        # Ruminants
        {"id": "spec-cattle", "name": "Cattle", "category_group_id": "cat-ruminants"},
        {"id": "spec-sheep", "name": "Sheep", "category_group_id": "cat-ruminants"},
        {"id": "spec-goat", "name": "Goat", "category_group_id": "cat-ruminants"},
        # Rabbits
        {"id": "spec-rabbit", "name": "Rabbit", "category_group_id": "cat-rabbits"},
        # Exotic
        {"id": "spec-ostrich", "name": "Ostrich", "category_group_id": "cat-ostrich"},
        {"id": "spec-impala", "name": "Impala", "category_group_id": "cat-exotic"},
    ]
    
    for spec in species_data:
        await db.species.update_one(
            {"id": spec["id"]},
            {"$set": {**spec, "created_at": datetime.now(timezone.utc)}},
            upsert=True
        )
    
    print(f"✅ Seeded {len(species_data)} species")
    
    # Breeds
    breeds_data = [
        # Cattle breeds
        {"id": "breed-angus", "name": "Angus", "species_id": "spec-cattle", "purpose_hint": "Beef"},
        {"id": "breed-brahman", "name": "Brahman", "species_id": "spec-cattle", "purpose_hint": "Beef"},
        {"id": "breed-bonsmara", "name": "Bonsmara", "species_id": "spec-cattle", "purpose_hint": "Beef"},
        {"id": "breed-nguni", "name": "Nguni", "species_id": "spec-cattle", "purpose_hint": "Dual Purpose"},
        # Sheep breeds
        {"id": "breed-dorper", "name": "Dorper", "species_id": "spec-sheep", "purpose_hint": "Meat"},
        {"id": "breed-merino", "name": "Merino", "species_id": "spec-sheep", "purpose_hint": "Wool"},
        # Goat breeds
        {"id": "breed-boer", "name": "Boer Goat", "species_id": "spec-goat", "purpose_hint": "Meat"},
        {"id": "breed-savanna", "name": "Savanna", "species_id": "spec-goat", "purpose_hint": "Meat"},
        # Chicken breeds
        {"id": "breed-broiler", "name": "Broiler", "species_id": "spec-chicken", "purpose_hint": "Meat"},
        {"id": "breed-layer", "name": "Layer", "species_id": "spec-chicken", "purpose_hint": "Eggs"},
    ]
    
    for breed in breeds_data:
        await db.breeds.update_one(
            {"id": breed["id"]},
            {"$set": {**breed, "created_at": datetime.now(timezone.utc)}},
            upsert=True
        )
    
    print(f"✅ Seeded {len(breeds_data)} breeds")
    
    # Product Types (using applicable_to_groups array format)
    product_types = [
        {
            "id": "pt-live-animal",
            "code": "LIVE_ANIMAL",
            "label": "Live Animal",
            "description": "Live animals for sale",
            "applicable_to_groups": ["Ruminants", "Rabbits", "Other Small Livestock"],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "pt-day-old-chicks",
            "code": "DAY_OLD",
            "label": "Day-Old Chicks",
            "description": "Day-old chicks",
            "applicable_to_groups": ["Poultry"],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "pt-eggs",
            "code": "FERTILIZED_EGGS",
            "label": "Hatching Eggs",
            "description": "Fertilized hatching eggs",
            "applicable_to_groups": ["Poultry"],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "pt-breeding-stock",
            "code": "BREEDING_STOCK",
            "label": "Breeding Stock",
            "description": "Animals for breeding purposes",
            "applicable_to_groups": ["Ruminants", "Poultry", "Rabbits"],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "pt-market-ready",
            "code": "MARKET_READY",
            "label": "Market-Ready",
            "description": "Ready for slaughter/harvest",
            "applicable_to_groups": ["Ruminants", "Poultry", "Rabbits"],
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for pt in product_types:
        await db.product_types.update_one(
            {"id": pt["id"]},
            {"$set": pt},
            upsert=True
        )
    
    print(f"✅ Seeded {len(product_types)} product types")
    
    # ============================================
    # 3. SEED LISTINGS
    # ============================================
    print("\n📦 Seeding listings...")
    
    listings_data = [
        {
            "id": "listing-001",
            "seller_id": "seller-001",
            "org_id": None,
            "category_group_id": "cat-ruminants",
            "species_id": "spec-cattle",
            "breed_id": "breed-angus",
            "product_type_id": "pt-live-animal",
            "title": "Premium Angus Cattle - Breeding Stock",
            "description": "Healthy Angus cattle, excellent for breeding. All vaccinated and certified.",
            "quantity": 25,
            "unit": "head",
            "price_per_unit": 15000.00,
            "listing_type": "buy_now",
            "region": "Gauteng",
            "city": "Pretoria",
            "delivery_available": True,
            "has_vet_certificate": True,
            "health_status": "healthy",
            "vaccination_status": "fully_vaccinated",
            "age": "18-24 months",
            "sex": "mixed",
            "moderation_status": "APPROVED",
            "created_at": datetime.now(timezone.utc) - timedelta(days=10),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=10)
        },
        {
            "id": "listing-002",
            "seller_id": "seller-002",
            "org_id": None,
            "category_group_id": "cat-poultry",
            "species_id": "spec-chicken",
            "breed_id": "breed-broiler",
            "product_type_id": "pt-day-old-chicks",
            "title": "Ross 308 Day-Old Broiler Chicks",
            "description": "Premium quality day-old broiler chicks, fast-growing breed.",
            "quantity": 1000,
            "unit": "head",
            "price_per_unit": 8.50,
            "listing_type": "buy_now",
            "region": "KwaZulu-Natal",
            "city": "Durban",
            "delivery_available": True,
            "has_vet_certificate": True,
            "health_status": "excellent",
            "vaccination_status": "scheduled",
            "survival_rate": 95,
            "moderation_status": "APPROVED",
            "created_at": datetime.now(timezone.utc) - timedelta(days=5),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=5)
        },
        {
            "id": "listing-003",
            "seller_id": "seller-003",
            "org_id": None,
            "category_group_id": "cat-ruminants",
            "species_id": "spec-goat",
            "breed_id": "breed-boer",
            "product_type_id": "pt-live-animal",
            "title": "Boer Goats - Quality Breeding Stock",
            "description": "Purebred Boer goats, excellent meat production. Healthy and well-maintained.",
            "quantity": 50,
            "unit": "head",
            "price_per_unit": 2500.00,
            "listing_type": "auction",
            "starting_price": 2000.00,
            "reserve_price": 2200.00,
            "auction_duration": "168",
            "region": "Eastern Cape",
            "city": "Port Elizabeth",
            "delivery_available": False,
            "has_vet_certificate": True,
            "health_status": "healthy",
            "vaccination_status": "fully_vaccinated",
            "age": "12-18 months",
            "sex": "mixed",
            "moderation_status": "APPROVED",
            "created_at": datetime.now(timezone.utc) - timedelta(days=3),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=3)
        },
        {
            "id": "listing-004",
            "seller_id": "seller-004",
            "org_id": None,
            "category_group_id": "cat-ostrich",
            "species_id": "spec-ostrich",
            "product_type_id": "pt-live-animal",
            "title": "Ostrich Breeding Pairs",
            "description": "Mature ostrich breeding pairs. All permits and certifications in order.",
            "quantity": 5,
            "unit": "head",
            "price_per_unit": 45000.00,
            "listing_type": "hybrid",
            "starting_price": 40000.00,
            "buy_now_price": 50000.00,
            "auction_duration": "168",
            "region": "Western Cape",
            "city": "Stellenbosch",
            "delivery_available": True,
            "has_vet_certificate": True,
            "health_status": "excellent",
            "vaccination_status": "fully_vaccinated",
            "age": "3-5 years",
            "sex": "mixed",
            "moderation_status": "APPROVED",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
        },
        {
            "id": "listing-005",
            "seller_id": "seller-001",
            "org_id": None,
            "category_group_id": "cat-ruminants",
            "species_id": "spec-sheep",
            "breed_id": "breed-dorper",
            "product_type_id": "pt-live-animal",
            "title": "Dorper Sheep - Commercial Flock",
            "description": "Hardy Dorper sheep, excellent for meat production. Free-range raised.",
            "quantity": 100,
            "unit": "head",
            "price_per_unit": 1200.00,
            "listing_type": "buy_now",
            "region": "Gauteng",
            "city": "Pretoria",
            "delivery_available": True,
            "has_vet_certificate": True,
            "health_status": "healthy",
            "vaccination_status": "fully_vaccinated",
            "age": "6-12 months",
            "sex": "mixed",
            "moderation_status": "APPROVED",
            "created_at": datetime.now(timezone.utc) - timedelta(days=7),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=7)
        }
    ]
    
    for listing in listings_data:
        await db.listings.update_one(
            {"id": listing["id"]},
            {"$set": listing},
            upsert=True
        )
    
    print(f"✅ Seeded {len(listings_data)} listings")
    
    # ============================================
    # 4. SEED ORDERS
    # ============================================
    print("\n🛒 Seeding orders...")
    
    orders_data = [
        {
            "id": "order-001",
            "buyer_id": "buyer-001",
            "seller_id": "seller-002",
            "items": [
                {
                    "listing_id": "listing-002",
                    "listing_title": "Ross 308 Day-Old Broiler Chicks",
                    "seller_id": "seller-002",
                    "quantity": 500,
                    "price": 8.50,
                    "shipping_cost": 150.00,
                    "item_total": 4400.00
                }
            ],
            "total_amount": 4400.00,
            "shipping_address": {
                "full_name": "Alice Buyer",
                "phone": "+27111234571",
                "address_line_1": "123 Farm Street",
                "city": "Johannesburg",
                "province": "Gauteng",
                "postal_code": "2000",
                "country": "South Africa"
            },
            "payment_method": "paystack",
            "payment_status": "paid",
            "order_status": "confirmed",
            "delivery_status": "preparing",
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "id": "order-002",
            "buyer_id": "buyer-002",
            "seller_id": "seller-001",
            "items": [
                {
                    "listing_id": "listing-005",
                    "listing_title": "Dorper Sheep - Commercial Flock",
                    "seller_id": "seller-001",
                    "quantity": 20,
                    "price": 1200.00,
                    "shipping_cost": 500.00,
                    "item_total": 24500.00
                }
            ],
            "total_amount": 24500.00,
            "shipping_address": {
                "full_name": "Bob Purchaser",
                "phone": "+27111234572",
                "address_line_1": "456 Ranch Road",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8000",
                "country": "South Africa"
            },
            "payment_method": "paystack",
            "payment_status": "paid",
            "order_status": "confirmed",
            "delivery_status": "shipped",
            "tracking_number": "TRK123456789",
            "created_at": datetime.now(timezone.utc) - timedelta(days=5),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
        }
    ]
    
    for order in orders_data:
        await db.orders.update_one(
            {"id": order["id"]},
            {"$set": order},
            upsert=True
        )
    
    print(f"✅ Seeded {len(orders_data)} orders")
    
    # ============================================
    # 5. SEED BUY REQUESTS
    # ============================================
    print("\n📋 Seeding buy requests...")
    
    buy_requests_data = [
        {
            "id": "buyreq-001",
            "buyer_id": "buyer-003",
            "org_id": None,
            "category_group_id": "cat-ruminants",
            "species_id": "spec-cattle",
            "breed_id": "breed-nguni",
            "product_type_id": "pt-breeding-stock",
            "title": "Looking for Nguni Cattle Breeding Stock",
            "description": "Seeking quality Nguni cattle for breeding program. Minimum 10 head.",
            "quantity": 10,
            "unit": "head",
            "max_price_per_unit": 12000.00,
            "region": "KwaZulu-Natal",
            "city": "Pietermaritzburg",
            "status": "open",
            "created_at": datetime.now(timezone.utc) - timedelta(days=7),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=7)
        },
        {
            "id": "buyreq-002",
            "buyer_id": "buyer-001",
            "org_id": None,
            "category_group_id": "cat-poultry",
            "species_id": "spec-chicken",
            "breed_id": "breed-layer",
            "product_type_id": "pt-day-old-chicks",
            "title": "Need Layer Chicks for Egg Production",
            "description": "Looking for quality layer chicks, minimum 2000 head.",
            "quantity": 2000,
            "unit": "head",
            "max_price_per_unit": 7.00,
            "region": "Gauteng",
            "city": "Johannesburg",
            "status": "open",
            "created_at": datetime.now(timezone.utc) - timedelta(days=3),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=3)
        }
    ]
    
    for br in buy_requests_data:
        await db.buy_requests.update_one(
            {"id": br["id"]},
            {"$set": br},
            upsert=True
        )
    
    print(f"✅ Seeded {len(buy_requests_data)} buy requests")
    
    # ============================================
    # 6. SEED ORGANIZATIONS
    # ============================================
    print("\n🏢 Seeding organizations...")
    
    organizations_data = [
        {
            "id": "org-001",
            "name": "Premium Livestock Co",
            "owner_id": "user-001",
            "type": "business",
            "registration_number": "CK2023/123456/07",
            "province": "Free State",
            "city": "Bloemfontein",
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=100),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    for org in organizations_data:
        await db.organizations.update_one(
            {"id": org["id"]},
            {"$set": org},
            upsert=True
        )
    
    print(f"✅ Seeded {len(organizations_data)} organizations")
    
    # ============================================
    # 7. SEED REVIEWS
    # ============================================
    print("\n⭐ Seeding reviews...")
    
    reviews_data = [
        {
            "id": "review-001",
            "reviewer_id": "buyer-001",
            "reviewee_id": "seller-002",
            "order_id": "order-001",
            "rating": 5,
            "comment": "Excellent quality chicks, arrived healthy and on time. Highly recommended!",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
        },
        {
            "id": "review-002",
            "reviewer_id": "buyer-002",
            "reviewee_id": "seller-001",
            "order_id": "order-002",
            "rating": 4,
            "comment": "Good quality sheep, seller was professional. Delivery took a bit longer than expected.",
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
        }
    ]
    
    for review in reviews_data:
        await db.reviews.update_one(
            {"id": review["id"]},
            {"$set": review},
            upsert=True
        )
    
    print(f"✅ Seeded {len(reviews_data)} reviews")
    
    # ============================================
    # 8. SEED CARTS
    # ============================================
    print("\n🛒 Seeding shopping carts...")
    
    carts_data = [
        {
            "id": "cart-001",
            "user_id": "buyer-003",
            "items": [
                {
                    "id": "cart-item-001",
                    "listing_id": "listing-003",
                    "quantity": 10,
                    "price": 2500.00,
                    "shipping_cost": 200.00,
                    "shipping_option": "standard",
                    "added_at": datetime.now(timezone.utc) - timedelta(hours=2)
                }
            ],
            "created_at": datetime.now(timezone.utc) - timedelta(hours=2),
            "updated_at": datetime.now(timezone.utc) - timedelta(hours=2)
        }
    ]
    
    for cart in carts_data:
        await db.carts.update_one(
            {"id": cart["id"]},
            {"$set": cart},
            upsert=True
        )
    
    print(f"✅ Seeded {len(carts_data)} shopping carts")
    
    # ============================================
    # 9. SEED NOTIFICATIONS
    # ============================================
    print("\n🔔 Seeding notifications...")
    
    notifications_data = [
        {
            "id": "notif-001",
            "user_id": "buyer-001",
            "topic": "ORDER_PAID",
            "payload": {
                "order_id": "order-001",
                "message": "Your order has been confirmed and payment received."
            },
            "read": False,
            "created_at": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "id": "notif-002",
            "user_id": "seller-002",
            "topic": "ORDER_PAID",
            "payload": {
                "order_id": "order-001",
                "message": "New order received from Alice Buyer"
            },
            "read": True,
            "read_at": datetime.now(timezone.utc) - timedelta(days=2),
            "created_at": datetime.now(timezone.utc) - timedelta(days=2)
        }
    ]
    
    for notif in notifications_data:
        await db.notifications.update_one(
            {"id": notif["id"]},
            {"$set": notif},
            upsert=True
        )
    
    print(f"✅ Seeded {len(notifications_data)} notifications")
    
    # ============================================
    # 10. SEED SYSTEM SETTINGS
    # ============================================
    print("\n⚙️ Seeding system settings...")
    
    settings_data = [
        {
            "id": "setting-001",
            "key": "PLATFORM_COMMISSION_PCT",
            "value": 10.0,
            "description": "Platform commission percentage",
            "updated_by": "admin-001",
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": "setting-002",
            "key": "MINIMUM_ORDER_VALUE",
            "value": 100.00,
            "description": "Minimum order value in ZAR",
            "updated_by": "admin-001",
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": "setting-003",
            "key": "MAX_LISTING_IMAGES",
            "value": 5,
            "description": "Maximum number of images per listing",
            "updated_by": "admin-001",
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    for setting in settings_data:
        await db.system_settings.update_one(
            {"id": setting["id"]},
            {"$set": setting},
            upsert=True
        )
    
    print(f"✅ Seeded {len(settings_data)} system settings")
    
    # ============================================
    # 11. VERIFY USER LOGIN
    # ============================================
    print("\n🔍 Verifying user login capability...")
    
    test_users = [
        ("admin@stocklot.co.za", "Admin123!"),
        ("farmer.john@example.com", "Seller123!"),
        ("buyer.alice@example.com", "Buyer123!")
    ]
    
    for email, password in test_users:
        user_doc = await db.users.find_one({"email": email})
        if user_doc:
            if user_doc.get("password"):
                if verify_password(password, user_doc["password"]):
                    print(f"   ✅ {email} - login ready")
                else:
                    print(f"   ❌ {email} - password verification failed")
                    # Fix the password
                    user_doc["password"] = hash_password(password)
                    await db.users.update_one({"email": email}, {"$set": {"password": user_doc["password"]}})
                    print(f"   🔄 {email} - password fixed")
            else:
                print(f"   ❌ {email} - missing password field")
                # Add password
                await db.users.update_one({"email": email}, {"$set": {"password": hash_password(password)}})
                print(f"   🔄 {email} - password added")
        else:
            print(f"   ❌ {email} - user not found")
    
    client.close()
    print("\n🎉 Comprehensive database seeding complete!")
    print("\n📝 Summary:")
    print(f"   - Users: {len(users_data)}")
    print(f"   - Category Groups: {len(category_groups)}")
    print(f"   - Species: {len(species_data)}")
    print(f"   - Breeds: {len(breeds_data)}")
    print(f"   - Product Types: {len(product_types)}")
    print(f"   - Listings: {len(listings_data)}")
    print(f"   - Orders: {len(orders_data)}")
    print(f"   - Buy Requests: {len(buy_requests_data)}")
    print(f"   - Organizations: {len(organizations_data)}")
    print(f"   - Reviews: {len(reviews_data)}")
    print(f"   - Carts: {len(carts_data)}")
    print(f"   - Notifications: {len(notifications_data)}")
    print(f"   - System Settings: {len(settings_data)}")
    print("\n🔑 Test Credentials:")
    print("   Admin: admin@stocklot.co.za / Admin123!")
    print("   Seller: farmer.john@example.com / Seller123!")
    print("   Buyer: buyer.alice@example.com / Buyer123!")
    print("\n💡 If login still fails, check:")
    print("   1. MongoDB connection is correct")
    print("   2. Database name matches (stocklotDB)")
    print("   3. Users collection exists and has documents")
    print("   4. Password field is stored correctly in user documents")

if __name__ == "__main__":
    asyncio.run(seed_comprehensive_data())

