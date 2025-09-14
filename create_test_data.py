#!/usr/bin/env python3
"""
Create test data for admin moderation endpoints
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

async def create_test_data():
    """Create test data for admin moderation system"""
    
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['stocklot']
    
    print("🌱 Creating test data for admin moderation...")
    
    # 1. Create role upgrade requests
    role_requests = [
        {
            "id": str(uuid.uuid4()),
            "user_id": "user_001",
            "requested_role": "seller",
            "status": "PENDING",
            "kyc_level": 1,
            "attachments": ["doc1.pdf"],
            "business_license": "BL123456",
            "certification_docs": ["cert1.pdf"],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "user_002", 
            "requested_role": "exporter",
            "status": "PENDING",
            "kyc_level": 2,
            "attachments": ["doc2.pdf"],
            "business_license": "BL789012",
            "certification_docs": ["cert2.pdf"],
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.role_upgrade_requests.delete_many({})
    await db.role_upgrade_requests.insert_many(role_requests)
    print(f"✅ Created {len(role_requests)} role upgrade requests")
    
    # 2. Create disease zones
    disease_zones = [
        {
            "id": str(uuid.uuid4()),
            "name": "Foot and Mouth Disease Zone - Western Cape",
            "disease_type": "foot_and_mouth",
            "status": "ACTIVE",
            "affected_areas": ["Western Cape", "Northern Cape"],
            "restrictions": ["No livestock movement", "Quarantine required"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Avian Flu Zone - Gauteng",
            "disease_type": "avian_flu",
            "status": "ACTIVE", 
            "affected_areas": ["Gauteng", "Mpumalanga"],
            "restrictions": ["No poultry movement", "Testing required"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.disease_zones.delete_many({})
    await db.disease_zones.insert_many(disease_zones)
    print(f"✅ Created {len(disease_zones)} disease zones")
    
    # 3. Create feature flags
    feature_flags = [
        {
            "id": str(uuid.uuid4()),
            "key": "ENABLE_AI_MODERATION",
            "label": "AI Content Moderation",
            "description": "Enable AI-powered content moderation",
            "status": "ACTIVE",
            "rollout": {"default": True, "percent": 100},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "key": "DISEASE_ZONE_ALERTS",
            "label": "Disease Zone Alerts", 
            "description": "Enable disease zone alerts",
            "status": "ACTIVE",
            "rollout": {"default": True, "percent": 100},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.feature_flags.delete_many({})
    await db.feature_flags.insert_many(feature_flags)
    print(f"✅ Created {len(feature_flags)} feature flags")
    
    # 4. Create test users for role requests
    test_users = [
        {
            "id": "user_001",
            "email": "seller@test.com",
            "full_name": "Test Seller User",
            "roles": ["buyer"],
            "business_name": "Test Farm Ltd",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "user_002",
            "email": "exporter@test.com", 
            "full_name": "Test Exporter User",
            "roles": ["buyer", "seller"],
            "business_name": "Export Co Ltd",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for user in test_users:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": user},
            upsert=True
        )
    print(f"✅ Created {len(test_users)} test users")
    
    print("🎉 Test data creation complete!")

if __name__ == "__main__":
    asyncio.run(create_test_data())