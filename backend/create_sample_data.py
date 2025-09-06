#!/usr/bin/env python3
"""
🐄 SAMPLE DATA CREATOR
Creates sample buy requests, listings, and social media configuration
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone, timedelta

# Add the backend directory to the path
sys.path.append('/app/backend')

async def create_sample_data():
    """Create sample data for the platform"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/stocklot_db')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'stocklot_db')
    db = client[db_name]
    
    print("🚀 Creating sample data...")
    
    # 1. Create sample admin settings with social media
    print("📱 Adding social media configuration...")
    admin_settings = {
        "id": str(uuid.uuid4()),
        "type": "social_media",
        "config": {
            "facebook_url": "https://facebook.com/stocklotfarm",
            "instagram_url": "https://instagram.com/stocklot_farm",
            "youtube_url": "https://youtube.com/@stocklotfarm", 
            "x_url": "https://x.com/stocklot_farm",
            "linkedin_url": "https://linkedin.com/company/stocklot-farm"
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.admin_settings.replace_one(
        {"type": "social_media"}, 
        admin_settings, 
        upsert=True
    )
    
    # 2. Create sample buy requests
    print("🛒 Creating sample buy requests...")
    buy_requests = [
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_user_1",
            "title": "Looking for Premium Brahman Bulls",
            "description": "Seeking 5-10 high-quality Brahman bulls for breeding program. Must be 18-36 months old with excellent genetics and health records.",
            "species": "cattle",
            "product_type": "live_animal",
            "quantity_needed": 8,
            "max_price_per_unit": 45000,
            "total_budget": 360000,
            "location": {
                "province": "Free State",
                "city": "Bloemfontein",
                "coordinates": [-29.0852, 26.1596]
            },
            "specifications": {
                "age_range": "18-36 months",
                "weight_range": "400-600 kg",
                "breed": "Brahman",
                "purpose": "breeding",
                "health_requirements": ["vaccinated", "tested", "certified"]
            },
            "timeline": "Within 2 months",
            "contact_preferences": ["phone", "email"],
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=30)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_user_2", 
            "title": "Urgent: Dorper Sheep for Commercial Farm",
            "description": "Commercial farm expansion requires 50-100 Dorper sheep. Looking for healthy, productive animals with good breeding potential.",
            "species": "sheep",
            "product_type": "live_animal",
            "quantity_needed": 75,
            "max_price_per_unit": 2500,
            "total_budget": 187500,
            "location": {
                "province": "Northern Cape",
                "city": "Kimberley", 
                "coordinates": [-28.7282, 24.7499]
            },
            "specifications": {
                "age_range": "12-24 months",
                "weight_range": "35-45 kg",
                "breed": "Dorper", 
                "purpose": "commercial_farming",
                "health_requirements": ["vaccinated", "dewormed"]
            },
            "timeline": "ASAP - within 3 weeks",
            "contact_preferences": ["phone", "whatsapp"],
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=5),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=25)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_user_3",
            "title": "Angus Cattle for Feedlot Operation", 
            "description": "Established feedlot seeking 200+ Angus cattle for finishing program. Prefer consistent size and quality.",
            "species": "cattle",
            "product_type": "live_animal", 
            "quantity_needed": 250,
            "max_price_per_unit": 18000,
            "total_budget": 4500000,
            "location": {
                "province": "Gauteng",
                "city": "Pretoria",
                "coordinates": [-25.7479, 28.2293]
            },
            "specifications": {
                "age_range": "12-18 months",
                "weight_range": "300-400 kg", 
                "breed": "Angus",
                "purpose": "feedlot",
                "health_requirements": ["vaccinated", "certified"]
            },
            "timeline": "Flexible - next 6 weeks",
            "contact_preferences": ["email", "phone"],
            "status": "active", 
            "created_at": datetime.now(timezone.utc) - timedelta(days=10), 
            "expires_at": datetime.now(timezone.utc) + timedelta(days=50)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_user_4",
            "title": "Boer Goats for Small Farm Setup",
            "description": "Starting small-scale goat farming operation. Need 20-30 quality Boer goats including breeding does and buck.",
            "species": "goats", 
            "product_type": "live_animal",
            "quantity_needed": 25,
            "max_price_per_unit": 3500,
            "total_budget": 87500,
            "location": {
                "province": "KwaZulu-Natal",
                "city": "Pietermaritzburg",
                "coordinates": [-29.6001, 30.3794]
            },
            "specifications": {
                "age_range": "8-24 months",
                "weight_range": "25-50 kg",
                "breed": "Boer",
                "purpose": "small_scale_farming", 
                "health_requirements": ["vaccinated", "healthy"]
            },
            "timeline": "Within 1 month",
            "contact_preferences": ["phone", "email"],
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=28)
        }
    ]
    
    for buy_request in buy_requests:
        await db.buy_requests.replace_one(
            {"id": buy_request["id"]}, 
            buy_request, 
            upsert=True
        )
    
    print(f"✅ Created {len(buy_requests)} buy requests")
    
    # 3. Create sample listings 
    print("📋 Creating sample livestock listings...")
    listings = [
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_seller_1",
            "title": "Premium Brahman Bulls - Excellent Genetics",
            "description": "Top-quality Brahman bulls from award-winning bloodlines. Perfect for breeding programs. All animals health tested and certified.",
            "species": "cattle", 
            "product_type": "live_animal",
            "quantity_available": 12,
            "price_per_unit": 42000,
            "total_value": 504000,
            "location": {
                "province": "Limpopo", 
                "city": "Polokwane",
                "coordinates": [-23.8963, 29.4516]
            },
            "specifications": {
                "age_range": "18-30 months",
                "weight_range": "450-550 kg",
                "breed": "Brahman",
                "health_status": "excellent",
                "certifications": ["health_certificate", "breeding_certificate"]
            },
            "images": [
                "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=800",
                "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800"
            ],
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=3),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_seller_2",
            "title": "Dorper Sheep Flock - Ready for Production", 
            "description": "Healthy Dorper sheep flock available. Mix of ewes and rams, excellent for commercial or small-scale farming.",
            "species": "sheep",
            "product_type": "live_animal",
            "quantity_available": 85,
            "price_per_unit": 2200,
            "total_value": 187000,
            "location": {
                "province": "Western Cape",
                "city": "Worcester", 
                "coordinates": [-33.6464, 19.4503]
            },
            "specifications": {
                "age_range": "12-30 months",
                "weight_range": "35-50 kg",
                "breed": "Dorper",
                "health_status": "excellent", 
                "certifications": ["health_certificate", "vaccination_record"]
            },
            "images": [
                "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
                "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800"
            ],
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=7),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "sample_seller_3", 
            "title": "Young Angus Cattle - Feedlot Ready",
            "description": "Uniform group of young Angus cattle, perfect for feedlot operations. Consistent quality and excellent growth potential.",
            "species": "cattle",
            "product_type": "live_animal", 
            "quantity_available": 180,
            "price_per_unit": 16500,
            "total_value": 2970000,
            "location": {
                "province": "Free State",
                "city": "Bethlehem",
                "coordinates": [-28.2292, 28.3067]
            },
            "specifications": {
                "age_range": "12-16 months", 
                "weight_range": "320-380 kg",
                "breed": "Angus",
                "health_status": "excellent",
                "certifications": ["health_certificate", "growth_records"]
            },
            "images": [
                "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800",
                "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=800"
            ],
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    for listing in listings:
        await db.listings.replace_one(
            {"id": listing["id"]}, 
            listing,
            upsert=True
        )
    
    print(f"✅ Created {len(listings)} livestock listings")
    
    # 4. Update platform stats cache
    print("📊 Updating platform statistics...")
    stats = {
        "active_listings": len(listings),
        "total_users": 6,  # 4 buyers + 3 sellers (some overlap)
        "successful_orders": 15,
        "total_livestock": sum(listing["quantity_available"] for listing in listings),
        "total_buy_requests": len(buy_requests)
    }
    
    config_update = {
        "platform": stats,
        "cache_updated_at": datetime.now(timezone.utc),
        "ttl_seconds": 300
    }
    
    await db.platform_config.replace_one(
        {"type": "stats"}, 
        config_update,
        upsert=True
    )
    
    print("✅ Sample data creation completed!")
    print(f"📊 Platform Stats: {stats}")
    print("🎉 Ready to test!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data())