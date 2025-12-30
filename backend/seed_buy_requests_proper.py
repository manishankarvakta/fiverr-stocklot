#!/usr/bin/env python3
"""Seed buy requests with proper structure matching the create API"""

import os
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection - match server.py logic exactly
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL')
if not mongo_url:
    # Use same default as server.py
    mongo_url = 'mongodb://admin:adminpassword@mongodb:27017/'
    print("Using Docker Compose MongoDB URL (same as server.py)")
else:
    print(f"Using MongoDB URL from environment: {mongo_url}")

db_name = 'stocklot'

async def seed_buy_requests():
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
        
        # Get buyers (users with buyer role)
        buyers = await db.users.find({
            "$or": [
                {"roles": {"$in": ["buyer", "both"]}},
                {"role": {"$in": ["buyer", "both"]}}
            ]
        }).to_list(length=10)
        
        if not buyers:
            print("⚠️  No buyers found. Please seed users first.")
            client.close()
            return
        
        print(f"✅ Found {len(buyers)} buyers")
        
        # Get buyer IDs
        buyer_ids = [b["id"] for b in buyers[:10]]
        
        now = datetime.now(timezone.utc)
        
        # Create 10 buy requests with proper structure matching create API
        buy_requests = [
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[0],
                "species": "Cattle",
                "product_type": "Live Animal",
                "qty": 15,
                "unit": "head",
                "target_price": 12000.00,
                "breed": "Angus",
                "province": "Gauteng",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=14),
                "notes": "Looking for quality Angus cattle for breeding program. Must be healthy and vaccinated. Prefer animals between 12-18 months old.",
                "moderation_status": "auto_pass",
                "moderation_score": 2.5,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=5),
                "updated_at": now - timedelta(days=5),
                # Enhanced fields
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[0] if len(buyer_ids) > 0 else buyer_ids[0],
                "species": "Goats",
                "product_type": "Live Animal",
                "qty": 25,
                "unit": "head",
                "target_price": 2500.00,
                "breed": "Boer Goat",
                "province": "KwaZulu-Natal",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=10),
                "notes": "Need Boer goats for meat production. Looking for good quality breeding stock.",
                "moderation_status": "auto_pass",
                "moderation_score": 1.8,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=3),
                "updated_at": now - timedelta(days=3),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[1] if len(buyer_ids) > 1 else buyer_ids[0],
                "species": "Poultry",
                "product_type": "Day-Old Chicks",
                "qty": 2000,
                "unit": "head",
                "target_price": 8.50,
                "breed": "Layer",
                "province": "Western Cape",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=7),
                "notes": "Looking for quality layer chicks for egg production farm. Need vaccinated and healthy chicks.",
                "moderation_status": "auto_pass",
                "moderation_score": 2.0,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=2),
                "updated_at": now - timedelta(days=2),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[1] if len(buyer_ids) > 1 else buyer_ids[0],
                "species": "Sheep",
                "product_type": "Live Animal",
                "qty": 30,
                "unit": "head",
                "target_price": 3500.00,
                "breed": "Dorper",
                "province": "Eastern Cape",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=12),
                "notes": "Seeking Dorper sheep for wool and meat production. Prefer mature breeding stock.",
                "moderation_status": "auto_pass",
                "moderation_score": 1.5,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=4),
                "updated_at": now - timedelta(days=4),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[2] if len(buyer_ids) > 2 else buyer_ids[0],
                "species": "Cattle",
                "product_type": "Live Animal",
                "qty": 20,
                "unit": "head",
                "target_price": 15000.00,
                "breed": "Nguni",
                "province": "KwaZulu-Natal",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=15),
                "notes": "Seeking quality Nguni cattle for breeding program. Minimum 10 head.",
                "moderation_status": "auto_pass",
                "moderation_score": 2.2,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=6),
                "updated_at": now - timedelta(days=6),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[2] if len(buyer_ids) > 2 else buyer_ids[0],
                "species": "Poultry",
                "product_type": "Live Animal",
                "qty": 100,
                "unit": "head",
                "target_price": 120.00,
                "breed": "Broiler",
                "province": "Gauteng",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=5),
                "notes": "Need broiler chickens for meat production. Looking for ready-to-slaughter birds.",
                "moderation_status": "auto_pass",
                "moderation_score": 1.9,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=6),
                "updated_at": now - timedelta(days=6),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[3] if len(buyer_ids) > 3 else buyer_ids[0],
                "species": "Pigs",
                "product_type": "Live Animal",
                "qty": 50,
                "unit": "head",
                "target_price": 4500.00,
                "breed": "Large White",
                "province": "Free State",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=18),
                "notes": "Looking for Large White pigs for commercial farming. Prefer weaners or growers.",
                "moderation_status": "auto_pass",
                "moderation_score": 2.1,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=7),
                "updated_at": now - timedelta(days=7),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[3] if len(buyer_ids) > 3 else buyer_ids[0],
                "species": "Cattle",
                "product_type": "Live Animal",
                "qty": 12,
                "unit": "head",
                "target_price": 18000.00,
                "breed": "Brahman",
                "province": "Limpopo",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=20),
                "notes": "Seeking Brahman cattle for crossbreeding program. Must have good genetics.",
                "moderation_status": "auto_pass",
                "moderation_score": 1.7,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=8),
                "updated_at": now - timedelta(days=8),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[4] if len(buyer_ids) > 4 else buyer_ids[0],
                "species": "Goats",
                "product_type": "Live Animal",
                "qty": 40,
                "unit": "head",
                "target_price": 2200.00,
                "breed": "Kalahari Red",
                "province": "Northern Cape",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=16),
                "notes": "Need Kalahari Red goats for meat production. Looking for quality breeding stock.",
                "moderation_status": "auto_pass",
                "moderation_score": 2.3,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=9),
                "updated_at": now - timedelta(days=9),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            },
            {
                "id": f"buyreq-{str(uuid.uuid4())[:8]}",
                "buyer_id": buyer_ids[4] if len(buyer_ids) > 4 else buyer_ids[0],
                "species": "Sheep",
                "product_type": "Live Animal",
                "qty": 35,
                "unit": "head",
                "target_price": 3200.00,
                "breed": "Merino",
                "province": "Western Cape",
                "country": "ZA",
                "status": "open",
                "expires_at": now + timedelta(days=13),
                "notes": "Seeking Merino sheep for wool production. Prefer fine wool varieties.",
                "moderation_status": "auto_pass",
                "moderation_score": 1.6,
                "moderation_reasons": [],
                "created_at": now - timedelta(days=10),
                "updated_at": now - timedelta(days=10),
                "images": [],
                "vet_certificates": [],
                "weight_range": None,
                "age_requirements": None,
                "vaccination_requirements": [],
                "delivery_preferences": "both",
                "inspection_allowed": True,
                "additional_requirements": None
            }
        ]
        
        # Insert buy requests
        for br in buy_requests:
            await db.buy_requests.update_one(
                {"id": br["id"]},
                {"$set": br},
                upsert=True
            )
        
        print(f"✅ Seeded {len(buy_requests)} buy requests")
        
        # Verify
        count = await db.buy_requests.count_documents({})
        print(f"📊 Total buy requests in database: {count}")
        
        # Show sample
        sample = await db.buy_requests.find_one({"status": "open"})
        if sample:
            print(f"\n📄 Sample buy request:")
            print(f"   ID: {sample.get('id')}")
            print(f"   Species: {sample.get('species')}")
            print(f"   Breed: {sample.get('breed')}")
            print(f"   Product Type: {sample.get('product_type')}")
            print(f"   Qty: {sample.get('qty')} {sample.get('unit')}")
            print(f"   Province: {sample.get('province')}")
            print(f"   Status: {sample.get('status')}")
        
        client.close()
        print("\n✅ Buy requests seeding completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_buy_requests())

