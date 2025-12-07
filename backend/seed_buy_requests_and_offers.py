#!/usr/bin/env python3
"""
🌱 SEED BUY REQUESTS AND SELLER OFFERS
Creates buy requests from buyers and offers from sellers on those requests
"""

import os
import sys
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

# MongoDB connection
# Try multiple connection options like seed_comprehensive_data.py
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DB_URL')
if not mongo_url:
    # Try Docker Compose default first
    mongo_url = 'mongodb://admin:adminpassword@stocklot-mongodb:27017/'
    # Fallback to local
    # mongo_url = 'mongodb://localhost:27017/'

db_name = 'stocklot'  # Match server.py line 136

async def seed_buy_requests_and_offers():
    """Seed buy requests and seller offers"""
    
    print("🌱 Starting buy requests and offers seeding...")
    print(f"📊 Database: {db_name}")
    print(f"🔗 MongoDB URL: {mongo_url.split('@')[1] if '@' in mongo_url else mongo_url}")
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("\n💡 Try one of these:")
        print("   1. Set MONGO_URL environment variable")
        print("   2. Run from Docker: docker exec -it stocklot-backend python seed_buy_requests_and_offers.py")
        print("   3. Update mongo_url in the script")
        return
    
    # Check if users exist
    buyers = await db.users.find({"roles": {"$in": ["buyer", "both"]}}).to_list(length=None)
    sellers = await db.users.find({"roles": {"$in": ["seller", "both"]}}).to_list(length=None)
    
    if not buyers:
        print("⚠️  No buyers found. Please seed users first.")
        client.close()
        return
    
    if not sellers:
        print("⚠️  No sellers found. Please seed users first.")
        client.close()
        return
    
    print(f"✅ Found {len(buyers)} buyers and {len(sellers)} sellers")
    
    # Get buyer and seller IDs
    buyer_ids = [b["id"] for b in buyers[:3]]  # Use first 3 buyers
    seller_ids = [s["id"] for s in sellers[:4]]  # Use first 4 sellers
    
    # ============================================
    # 1. SEED BUY REQUESTS
    # ============================================
    print("\n📋 Seeding buy requests...")
    
    now = datetime.now(timezone.utc)
    
    buy_requests_data = [
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
            "notes": "Looking for quality Angus cattle for breeding program. Must be healthy and vaccinated. Prefer animals between 12-18 months old.",
            "expires_at": now + timedelta(days=14),
            "created_at": now - timedelta(days=5),
            "updated_at": now - timedelta(days=5)
        },
        {
            "id": f"buyreq-{str(uuid.uuid4())[:8]}",
            "buyer_id": buyer_ids[0],
            "species": "Goats",
            "product_type": "Live Animal",
            "qty": 25,
            "unit": "head",
            "target_price": 2500.00,
            "breed": "Boer Goat",
            "province": "KwaZulu-Natal",
            "country": "ZA",
            "status": "open",
            "notes": "Need Boer goats for meat production. Looking for good quality breeding stock.",
            "expires_at": now + timedelta(days=10),
            "created_at": now - timedelta(days=3),
            "updated_at": now - timedelta(days=3)
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
            "notes": "Looking for quality layer chicks for egg production farm. Need vaccinated and healthy chicks.",
            "expires_at": now + timedelta(days=7),
            "created_at": now - timedelta(days=2),
            "updated_at": now - timedelta(days=2)
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
            "notes": "Seeking Dorper sheep for wool and meat production. Prefer mature breeding stock.",
            "expires_at": now + timedelta(days=12),
            "created_at": now - timedelta(days=4),
            "updated_at": now - timedelta(days=4)
        },
        {
            "id": f"buyreq-{str(uuid.uuid4())[:8]}",
            "buyer_id": buyer_ids[2] if len(buyer_ids) > 2 else buyer_ids[0],
            "species": "Cattle",
            "product_type": "Breeding Stock",
            "qty": 8,
            "unit": "head",
            "target_price": 15000.00,
            "breed": "Brahman",
            "province": "Limpopo",
            "country": "ZA",
            "status": "open",
            "notes": "Looking for premium Brahman breeding stock. Must have pedigree certificates and health records.",
            "expires_at": now + timedelta(days=21),
            "created_at": now - timedelta(days=1),
            "updated_at": now - timedelta(days=1)
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
            "notes": "Need broiler chickens for meat production. Looking for ready-to-slaughter birds.",
            "expires_at": now + timedelta(days=5),
            "created_at": now - timedelta(days=6),
            "updated_at": now - timedelta(days=6)
        }
    ]
    
    # Insert buy requests
    for br in buy_requests_data:
        await db.buy_requests.update_one(
            {"id": br["id"]},
            {"$set": br},
            upsert=True
        )
    
    print(f"✅ Seeded {len(buy_requests_data)} buy requests")
    
    # ============================================
    # 2. SEED SELLER OFFERS ON BUY REQUESTS
    # ============================================
    print("\n💼 Seeding seller offers...")
    
    offers_data = []
    
    # Create offers for each buy request
    for i, buy_request in enumerate(buy_requests_data):
        request_id = buy_request["id"]
        target_price = buy_request.get("target_price", 0)
        qty_needed = buy_request.get("qty", 0)
        
        # Create 2-3 offers per buy request from different sellers
        num_offers = 2 if i % 2 == 0 else 3
        
        for j in range(num_offers):
            seller_id = seller_ids[j % len(seller_ids)]
            
            # Calculate offer price (slightly below, at, or above target)
            price_variation = [0.95, 1.0, 1.05, 0.98, 1.02][j % 5]
            offer_price = target_price * price_variation
            
            # Offer quantity (can be less, equal, or more than requested)
            qty_variations = [qty_needed * 0.8, qty_needed, qty_needed * 1.2, qty_needed * 0.9, qty_needed * 1.1]
            offer_qty = int(qty_variations[j % len(qty_variations)])
            
            # Determine status (mix of pending, accepted, declined)
            if i == 0 and j == 0:
                status = "accepted"  # First offer on first request is accepted
            elif i == 1 and j == 1:
                status = "declined"  # Second offer on second request is declined
            else:
                status = "pending"
            
            # Create offer
            offer = {
                "id": f"offer-{str(uuid.uuid4())[:8]}",
                "request_id": request_id,
                "buy_request_id": request_id,  # Some APIs use this field
                "seller_id": seller_id,
                "price_per_unit": round(offer_price, 2),
                "quantity_available": offer_qty,
                "notes": f"Quality {buy_request.get('breed', 'livestock')} available. All animals are healthy and vaccinated. Can deliver within 7-14 days.",
                "delivery_cost": round(offer_price * offer_qty * 0.05, 2) if buy_request.get("province") != "Gauteng" else 0,
                "delivery_days": 7 if j % 2 == 0 else 14,
                "status": status,
                "created_at": buy_request["created_at"] + timedelta(hours=j * 2),
                "expires_at": buy_request["expires_at"] - timedelta(days=1),
                "updated_at": buy_request["created_at"] + timedelta(hours=j * 2)
            }
            
            offers_data.append(offer)
    
    # Insert offers
    for offer in offers_data:
        await db.buy_request_offers.update_one(
            {"id": offer["id"]},
            {"$set": offer},
            upsert=True
        )
    
    print(f"✅ Seeded {len(offers_data)} seller offers")
    
    # Print summary
    print("\n📊 Summary:")
    print(f"   - Buy Requests: {len(buy_requests_data)}")
    print(f"   - Seller Offers: {len(offers_data)}")
    print(f"   - Pending Offers: {len([o for o in offers_data if o['status'] == 'pending'])}")
    print(f"   - Accepted Offers: {len([o for o in offers_data if o['status'] == 'accepted'])}")
    print(f"   - Declined Offers: {len([o for o in offers_data if o['status'] == 'declined'])}")
    
    print("\n✅ Buy requests and offers seeding completed!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_buy_requests_and_offers())

