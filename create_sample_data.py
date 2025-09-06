#!/usr/bin/env python3
"""
Create sample data: 4 buy requests and 4 marketplace listings
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
import uuid

async def create_sample_data():
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'stocklot')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🚀 Creating sample data for testing...")
    
    # Get existing users
    users = await db.users.find({}).to_list(length=None)
    if len(users) < 2:
        print("❌ Need at least 2 users in database")
        return
    
    admin_user = next((u for u in users if 'admin' in u.get('roles', [])), users[0])
    seller_user = next((u for u in users if 'seller' in u.get('roles', [])), users[1])
    
    print(f"📊 Using admin: {admin_user['email']}, seller: {seller_user['email']}")
    
    # Create 4 sample buy requests
    buy_requests = [
        {
            "id": str(uuid.uuid4()),
            "title": "Premium Angus Cattle for Commercial Operation",
            "species": "cattle",
            "product_type": "commercial",
            "breed": "Angus",
            "quantity": 50,
            "unit": "head",
            "age_range": {"min": 18, "max": 24},
            "weight_range": {"min": 400, "max": 550},
            "quality_requirements": ["healthy", "vaccinated", "good_conformation"],
            "target_price": 18000,
            "price_range": {"min": 15000, "max": 20000},
            "delivery_location": {"province": "Gauteng", "city": "Johannesburg"},
            "delivery_preferences": {
                "max_distance_km": 200,
                "delivery_required": True,
                "delivery_date_flexibility": "flexible"
            },
            "requirements_details": "Looking for high-quality Angus cattle for commercial breeding operation. Must be healthy, vaccinated, and have good genetic lineage. Prefer animals between 18-24 months old.",
            "buyer_id": admin_user["id"],
            "buyer_info": {
                "name": "Commercial Livestock Farm",
                "location": "Johannesburg, Gauteng",
                "experience_level": "experienced",
                "operation_type": "commercial"
            },
            "status": "open",
            "moderation_status": "approved",
            "urgency": "medium",
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30),
            "coordinates": {"lat": -26.2041, "lng": 28.0473},  # Johannesburg
            "view_count": 12,
            "offer_count": 2
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Boer Goats for Small Farm Expansion",
            "species": "goats",
            "product_type": "breeding",
            "breed": "Boer",
            "quantity": 20,
            "unit": "head",
            "age_range": {"min": 12, "max": 36},
            "target_price": 3500,
            "price_range": {"min": 3000, "max": 4000},
            "delivery_location": {"province": "Western Cape", "city": "Cape Town"},
            "delivery_preferences": {
                "max_distance_km": 150,
                "delivery_required": False,
                "pickup_preferred": True
            },
            "requirements_details": "Small family farm looking to expand goat herd with quality Boer goats. Prefer breeding stock with good bloodlines.",
            "buyer_id": seller_user["id"],
            "buyer_info": {
                "name": "Sunrise Family Farm",
                "location": "Cape Town, Western Cape",
                "experience_level": "intermediate",
                "operation_type": "small_scale"
            },
            "status": "open",
            "moderation_status": "approved",
            "urgency": "low",
            "created_at": datetime.now(timezone.utc) - timedelta(days=5),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=25),
            "coordinates": {"lat": -33.9249, "lng": 18.4241},  # Cape Town
            "view_count": 8,
            "offer_count": 1
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Commercial Broiler Chickens - Urgent",
            "species": "poultry",
            "product_type": "commercial",
            "breed": "Broiler",
            "quantity": 1000,
            "unit": "head",
            "age_range": {"min": 6, "max": 8},
            "target_price": 85,
            "price_range": {"min": 80, "max": 95},
            "delivery_location": {"province": "KwaZulu-Natal", "city": "Durban"},
            "delivery_preferences": {
                "max_distance_km": 100,
                "delivery_required": True,
                "delivery_date_flexibility": "strict"
            },
            "requirements_details": "Urgent requirement for commercial broiler chickens aged 6-8 weeks. Must be healthy and ready for processing. Delivery needed within 2 weeks.",
            "buyer_id": admin_user["id"],
            "buyer_info": {
                "name": "KZN Poultry Processing",
                "location": "Durban, KwaZulu-Natal",
                "experience_level": "experienced",
                "operation_type": "commercial"
            },
            "status": "open",
            "moderation_status": "approved",
            "urgency": "high",
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=10),
            "coordinates": {"lat": -29.8587, "lng": 31.0218},  # Durban
            "view_count": 25,
            "offer_count": 3
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Merino Sheep for Wool Production",
            "species": "sheep",
            "product_type": "breeding",
            "breed": "Merino",
            "quantity": 100,
            "unit": "head",
            "age_range": {"min": 24, "max": 48},
            "weight_range": {"min": 45, "max": 65},
            "target_price": 2800,
            "price_range": {"min": 2500, "max": 3200},
            "delivery_location": {"province": "Free State", "city": "Bloemfontein"},
            "delivery_preferences": {
                "max_distance_km": 300,
                "delivery_required": True,
                "delivery_date_flexibility": "flexible"
            },
            "requirements_details": "Expanding wool production operation. Looking for quality Merino sheep with good wool characteristics. Prefer ewes aged 2-4 years.",
            "buyer_id": seller_user["id"],
            "buyer_info": {
                "name": "Free State Wool Co.",
                "location": "Bloemfontein, Free State",
                "experience_level": "experienced",
                "operation_type": "commercial"
            },
            "status": "open",
            "moderation_status": "approved",
            "urgency": "medium",
            "created_at": datetime.now(timezone.utc) - timedelta(days=7),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=20),
            "coordinates": {"lat": -29.0852, "lng": 26.1596},  # Bloemfontein
            "view_count": 15,
            "offer_count": 1
        }
    ]
    
    # Create 4 sample marketplace listings
    listings = [
        {
            "id": str(uuid.uuid4()),
            "title": "Premium Brahman Bulls - Breeding Stock",
            "description": "Excellent quality Brahman bulls suitable for breeding. Well-maintained, healthy animals with good genetic lineage. All vaccinations up to date.",
            "species": "cattle",
            "product_type": "breeding",
            "breed": "Brahman",
            "quantity": 8,
            "unit": "head",
            "age_months": 30,
            "weight_kg": 600,
            "unit_price": 25000,
            "total_price": 200000,
            "quality_grade": "A",
            "health_certifications": ["vaccinated", "health_tested", "tb_tested"],
            "location": {"province": "Limpopo", "city": "Polokwane"},
            "seller_id": seller_user["id"],
            "seller_info": {
                "name": "Limpopo Brahman Stud",
                "verified": True,
                "rating": 4.8,
                "experience_years": 15
            },
            "availability": {
                "status": "available",
                "available_from": datetime.now(timezone.utc),
                "delivery_options": ["pickup", "delivery"]
            },
            "images": [
                "https://images.unsplash.com/photo-1560457079-9a6532ccb118?w=800",
                "https://images.unsplash.com/photo-1566207474742-de921626ad0c?w=800"
            ],
            "status": "active",
            "moderation_status": "approved",
            "created_at": datetime.now(timezone.utc) - timedelta(days=3),
            "updated_at": datetime.now(timezone.utc),
            "coordinates": {"lat": -23.9045, "lng": 29.4689},  # Polokwane
            "view_count": 18,
            "inquiry_count": 4
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Dorper Sheep - Commercial Grade",
            "description": "High-quality Dorper sheep suitable for meat production. Hardy breed adapted to South African conditions. Excellent meat-to-bone ratio.",
            "species": "sheep",
            "product_type": "commercial",
            "breed": "Dorper",
            "quantity": 50,
            "unit": "head",
            "age_months": 18,
            "weight_kg": 55,
            "unit_price": 2200,
            "total_price": 110000,
            "quality_grade": "A",
            "health_certifications": ["vaccinated", "dewormed"],
            "location": {"province": "Northern Cape", "city": "Kimberley"},
            "seller_id": admin_user["id"],
            "seller_info": {
                "name": "Karoo Sheep Farm",
                "verified": True,
                "rating": 4.6,
                "experience_years": 12
            },
            "availability": {
                "status": "available",
                "available_from": datetime.now(timezone.utc),
                "delivery_options": ["pickup", "delivery"]
            },
            "images": [
                "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
                "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800"
            ],
            "status": "active",
            "moderation_status": "approved",
            "created_at": datetime.now(timezone.utc) - timedelta(days=6),
            "updated_at": datetime.now(timezone.utc),
            "coordinates": {"lat": -28.7282, "lng": 24.7499},  # Kimberley
            "view_count": 22,
            "inquiry_count": 6
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Free Range Chickens - Layer Hens",
            "description": "Productive layer hens raised on free range. Excellent egg production rate. Healthy and well-cared for birds.",
            "species": "poultry",
            "product_type": "commercial",
            "breed": "Rhode Island Red",
            "quantity": 200,
            "unit": "head",
            "age_months": 12,
            "unit_price": 120,
            "total_price": 24000,
            "quality_grade": "A",
            "health_certifications": ["vaccinated", "health_checked"],
            "location": {"province": "Mpumalanga", "city": "Nelspruit"},
            "seller_id": seller_user["id"],
            "seller_info": {
                "name": "Lowveld Poultry Farm",
                "verified": False,
                "rating": 4.3,
                "experience_years": 8
            },
            "availability": {
                "status": "available",
                "available_from": datetime.now(timezone.utc) + timedelta(days=3),
                "delivery_options": ["pickup"]
            },
            "images": [
                "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800"
            ],
            "status": "active",
            "moderation_status": "approved",
            "created_at": datetime.now(timezone.utc) - timedelta(days=4),
            "updated_at": datetime.now(timezone.utc),
            "coordinates": {"lat": -25.4753, "lng": 30.9698},  # Nelspruit
            "view_count": 31,
            "inquiry_count": 8
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Nguni Cattle - Heritage Breed",
            "description": "Beautiful Nguni cattle showcasing South Africa's heritage breeds. Hardy, disease-resistant animals adapted to local conditions. Perfect for sustainable farming.",
            "species": "cattle",
            "product_type": "breeding",
            "breed": "Nguni",
            "quantity": 12,
            "unit": "head",
            "age_months": 36,
            "weight_kg": 450,
            "unit_price": 15000,
            "total_price": 180000,
            "quality_grade": "A",
            "health_certifications": ["vaccinated", "health_tested", "pregnancy_tested"],
            "location": {"province": "Eastern Cape", "city": "East London"},
            "seller_id": admin_user["id"],
            "seller_info": {
                "name": "Heritage Cattle Ranch",
                "verified": True,
                "rating": 4.9,
                "experience_years": 20
            },
            "availability": {
                "status": "available",
                "available_from": datetime.now(timezone.utc),
                "delivery_options": ["pickup", "delivery"]
            },
            "images": [
                "https://images.unsplash.com/photo-1560457079-9a6532ccb118?w=800",
                "https://images.unsplash.com/photo-1605808995051-88e00e18e5b7?w=800"
            ],
            "status": "active",
            "moderation_status": "approved",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "updated_at": datetime.now(timezone.utc),
            "coordinates": {"lat": -33.0153, "lng": 27.8546},  # East London
            "view_count": 45,
            "inquiry_count": 12
        }
    ]
    
    # Insert buy requests
    print("📝 Creating 4 buy requests...")
    result = await db.buy_requests.insert_many(buy_requests)
    print(f"✅ Created {len(result.inserted_ids)} buy requests")
    
    # Insert listings
    print("🏪 Creating 4 marketplace listings...")
    result = await db.listings.insert_many(listings)
    print(f"✅ Created {len(result.inserted_ids)} marketplace listings")
    
    # Create some sample offers for the buy requests
    print("💼 Creating sample offers...")
    offers = [
        {
            "id": str(uuid.uuid4()),
            "request_id": buy_requests[0]["id"],  # Angus cattle request
            "seller_id": seller_user["id"],
            "seller_name": "Premium Livestock Suppliers",
            "offer_price": 17500,
            "quantity_offered": 50,
            "message": "We have excellent Angus cattle that match your requirements. Can deliver within 2 weeks.",
            "status": "pending",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=14)
        },
        {
            "id": str(uuid.uuid4()),
            "request_id": buy_requests[2]["id"],  # Broiler chickens request
            "seller_id": admin_user["id"],
            "seller_name": "KZN Poultry Supplies",
            "offer_price": 88,
            "quantity_offered": 1000,
            "message": "We can supply 1000 broiler chickens aged 7 weeks. Ready for immediate delivery.",
            "status": "pending",
            "created_at": datetime.now(timezone.utc) - timedelta(hours=6),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7)
        }
    ]
    
    result = await db.buy_request_offers.insert_many(offers)
    print(f"✅ Created {len(result.inserted_ids)} offers")
    
    # Update buy request offer counts
    for request in buy_requests:
        offer_count = len([o for o in offers if o["request_id"] == request["id"]])
        if offer_count > 0:
            await db.buy_requests.update_one(
                {"id": request["id"]},
                {"$set": {"offer_count": offer_count}}
            )
    
    print("\n🎉 Sample data creation completed!")
    print("=" * 50)
    print("📊 SUMMARY:")
    print(f"✅ Buy Requests: {len(buy_requests)}")
    print(f"✅ Marketplace Listings: {len(listings)}")
    print(f"✅ Offers: {len(offers)}")
    print("\n🚀 You can now test:")
    print("- Buy Requests page: /buy-requests")
    print("- Marketplace page: /marketplace")
    print("- Dashboard APIs: my-requests, seller-inbox, my-offers")
    print("- AI Enhanced Features: price suggestions, auto-description")
    print("- ML Engine: smart pricing, demand forecasting")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data())