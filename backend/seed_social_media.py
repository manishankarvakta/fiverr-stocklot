#!/usr/bin/env python3
"""
Update social media links in platform configuration
"""

import os
import sys
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

async def update_social_media_config():
    """Update social media configuration with correct URLs"""
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'stocklot_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔗 Updating StockLot social media configuration...")
    
    # Social media configuration
    social_media_config = {
        "type": "social_media",
        "settings": {
            "facebook": "https://www.facebook.com/stocklot65/",
            "instagram": "https://www.instagram.com/stocklotmarket_/",
            "twitter": "https://x.com/stocklotmarket",
            "x": "https://x.com/stocklotmarket",
            "linkedin": "https://www.linkedin.com/company/stocklotmarket",
            "youtube": "https://www.youtube.com/@stocklotmarket"
        },
        "updated_at": datetime.now(timezone.utc),
        "updated_by": "system_admin"
    }
    
    # Update or insert social media configuration
    result = await db.platform_config.update_one(
        {"type": "social_media"},
        {"$set": social_media_config},
        upsert=True
    )
    
    if result.upserted_id:
        print("✅ Created new social media configuration")
    else:
        print("✅ Updated existing social media configuration")
    
    # Also update the general platform config to ensure consistency
    general_config_update = {
        "settings.social_media": {
            "facebook": "https://www.facebook.com/stocklot65/",
            "instagram": "https://www.instagram.com/stocklotmarket_/",
            "twitter": "https://x.com/stocklotmarket",
            "x": "https://x.com/stocklotmarket",
            "linkedin": "https://www.linkedin.com/company/stocklotmarket",
            "youtube": "https://www.youtube.com/@stocklotmarket"
        },
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.platform_config.update_one(
        {"type": "general"},
        {"$set": general_config_update},
        upsert=True
    )
    
    print("✅ Updated general platform configuration")
    
    # Verify the configuration
    social_doc = await db.platform_config.find_one({"type": "social_media"})
    general_doc = await db.platform_config.find_one({"type": "general"})
    
    print("\n📋 Social Media Configuration:")
    if social_doc:
        for platform, url in social_doc.get("settings", {}).items():
            print(f"  {platform.capitalize()}: {url}")
    
    client.close()
    print("\n🎉 Social media configuration update complete!")

if __name__ == "__main__":
    asyncio.run(update_social_media_config())