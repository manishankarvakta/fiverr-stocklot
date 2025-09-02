#!/usr/bin/env python3
"""
Fix existing listings by adding listing_type field
This is needed for the Buy Now functionality to work
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def fix_listings():
    """Add listing_type field to existing listings"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Check current listings
        listings_count = await db.listings.count_documents({})
        print(f"Found {listings_count} listings in database")
        
        # Check how many already have listing_type
        with_listing_type = await db.listings.count_documents({"listing_type": {"$exists": True}})
        print(f"{with_listing_type} listings already have listing_type field")
        
        # Update all listings without listing_type to have "buy_now"
        result = await db.listings.update_many(
            {"listing_type": {"$exists": False}},
            {"$set": {"listing_type": "buy_now"}}
        )
        
        print(f"✅ Updated {result.modified_count} listings with listing_type='buy_now'")
        
        # Verify the fix
        after_fix = await db.listings.count_documents({"listing_type": "buy_now"})
        print(f"✅ Now {after_fix} listings have listing_type='buy_now'")
        
        # Show a sample listing
        sample = await db.listings.find_one({"listing_type": "buy_now"})
        if sample:
            print(f"✅ Sample listing: {sample.get('title', 'Unknown')} - listing_type: {sample.get('listing_type')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing listings: {e}")
        return False
    finally:
        client.close()

async def main():
    """Main function"""
    print("🔧 Fixing listings to add listing_type field for Buy Now functionality...")
    success = await fix_listings()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))