#!/usr/bin/env python3
"""
Seed data for Admin Moderation System testing
"""

import os
import sys
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

async def seed_admin_moderation_data():
    """Seed test data for admin moderation system"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'stocklot_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Seeding Admin Moderation test data...")
    
    # 1. Seed Feature Flags
    feature_flags = [
        {
            "key": "ENABLE_AI_MODERATION",
            "label": "AI Content Moderation",
            "description": "Enable AI-powered content moderation for listings and messages",
            "status": "ACTIVE",
            "rollout": {"default": True, "percent": 100},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "key": "DISEASE_ZONE_ALERTS",
            "label": "Disease Zone Alerts",
            "description": "Enable automatic alerts for disease zone changes",
            "status": "ACTIVE",
            "rollout": {"default": True, "percent": 100},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "key": "ENHANCED_KYC",
            "label": "Enhanced KYC Process",
            "description": "Enable enhanced KYC verification for high-value transactions",
            "status": "DRAFT",
            "rollout": {"default": False, "percent": 25},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "key": "MOBILE_PUSH_NOTIFICATIONS",
            "label": "Mobile Push Notifications",
            "description": "Enable push notifications for mobile app users",
            "status": "DISABLED",
            "rollout": {"default": False, "percent": 0},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    for flag in feature_flags:
        await db.feature_flags.update_one(
            {"key": flag["key"]},
            {"$set": flag},
            upsert=True
        )
    
    print(f"✅ Seeded {len(feature_flags)} feature flags")
    
    # 2. Seed Fee Configurations
    fee_configs = [
        {
            "id": f"fc-{datetime.now().strftime('%Y%m%d%H%M%S')}-001",
            "label": "Standard Platform Fees v1.0",
            "platform_commission_pct": 10.0,
            "seller_payout_fee_pct": 2.5,
            "buyer_processing_fee_pct": 1.5,
            "escrow_fee_minor": 2500,  # R25.00
            "minimum_order_value": 10000,  # R100.00
            "maximum_order_value": 100000000,  # R1,000,000.00
            "status": "ACTIVE",
            "created_by": "admin@stocklot.co.za",
            "created_at": datetime.now(timezone.utc),
            "activated_at": datetime.now(timezone.utc)
        },
        {
            "id": f"fc-{datetime.now().strftime('%Y%m%d%H%M%S')}-002",
            "label": "High Volume Fees v1.0",
            "platform_commission_pct": 8.0,
            "seller_payout_fee_pct": 2.0,
            "buyer_processing_fee_pct": 1.0,
            "escrow_fee_minor": 2000,  # R20.00
            "minimum_order_value": 50000,  # R500.00
            "maximum_order_value": 100000000,  # R1,000,000.00
            "status": "DRAFT",
            "created_by": "admin@stocklot.co.za",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for config in fee_configs:
        await db.fee_configs.update_one(
            {"id": config["id"]},
            {"$set": config},
            upsert=True
        )
    
    print(f"✅ Seeded {len(fee_configs)} fee configurations")
    
    # 3. Seed Disease Zones
    disease_zones = [
        {
            "id": str(uuid.uuid4()),
            "name": "Foot and Mouth Zone - Western Cape",
            "region": "Western Cape",
            "authority": "Department of Agriculture",
            "disease_type": "Foot and Mouth Disease",
            "status": "ACTIVE",
            "polygon_geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [18.424, -33.924],
                    [18.524, -33.924],
                    [18.524, -33.824],
                    [18.424, -33.824],
                    [18.424, -33.924]
                ]]
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Avian Flu Zone - Gauteng",
            "region": "Gauteng",
            "authority": "Department of Agriculture",
            "disease_type": "Avian Influenza",
            "status": "ACTIVE",
            "polygon_geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [28.047, -26.204],
                    [28.147, -26.204],
                    [28.147, -26.104],
                    [28.047, -26.104],
                    [28.047, -26.204]
                ]]
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    for zone in disease_zones:
        await db.disease_zones.update_one(
            {"id": zone["id"]},
            {"$set": zone},
            upsert=True
        )
    
    print(f"✅ Seeded {len(disease_zones)} disease zones")
    
    # 4. Seed Role Upgrade Requests
    role_requests = [
        {
            "id": str(uuid.uuid4()),
            "user_id": "test-user-001",
            "requested_role": "seller",
            "status": "PENDING",
            "kyc_level": 2,
            "business_license": "https://example.com/license.pdf",
            "certification_docs": ["https://example.com/cert1.pdf"],
            "attachments": [
                {"type": "business_license", "url": "https://example.com/license.pdf"},
                {"type": "certification", "url": "https://example.com/cert1.pdf"}
            ],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "test-user-002",
            "requested_role": "exporter",
            "status": "PENDING",
            "kyc_level": 3,
            "business_license": "https://example.com/export_license.pdf",
            "certification_docs": ["https://example.com/export_cert.pdf"],
            "attachments": [
                {"type": "export_license", "url": "https://example.com/export_license.pdf"},
                {"type": "export_certification", "url": "https://example.com/export_cert.pdf"}
            ],
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for request in role_requests:
        await db.role_upgrade_requests.update_one(
            {"id": request["id"]},
            {"$set": request},
            upsert=True
        )
    
    print(f"✅ Seeded {len(role_requests)} role upgrade requests")
    
    # 5. Create test users for role requests
    test_users = [
        {
            "id": "test-user-001",
            "email": "seller.test@example.com",
            "full_name": "Test Seller User",
            "business_name": "Test Livestock Farm",
            "roles": ["buyer"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": "test-user-002",
            "email": "exporter.test@example.com", 
            "full_name": "Test Exporter User",
            "business_name": "Global Livestock Exports",
            "roles": ["buyer", "seller"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for user in test_users:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": user},
            upsert=True
        )
    
    print(f"✅ Seeded {len(test_users)} test users")
    
    # 6. Seed some moderation events for activity feed
    moderation_events = [
        {
            "entity_type": "role",
            "entity_id": "test-request-001",
            "old_status": "PENDING",
            "new_status": "APPROVED",
            "actor_id": "admin@stocklot.co.za",
            "reason": "All documentation verified",
            "metadata": {"user_id": "test-user-001", "role": "seller"},
            "created_at": datetime.now(timezone.utc)
        },
        {
            "entity_type": "flag",
            "entity_id": "ENABLE_AI_MODERATION",
            "old_status": "DRAFT",
            "new_status": "ACTIVE",
            "actor_id": "admin@stocklot.co.za",
            "metadata": {"rollout": {"default": True, "percent": 100}},
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for event in moderation_events:
        await db.moderation_events.insert_one(event)
    
    print(f"✅ Seeded {len(moderation_events)} moderation events")
    
    client.close()
    print("🎉 Admin Moderation seed data complete!")

if __name__ == "__main__":
    asyncio.run(seed_admin_moderation_data())