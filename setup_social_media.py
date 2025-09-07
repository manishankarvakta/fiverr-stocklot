#!/usr/bin/env python3
"""Script to set up social media configuration in the database"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def setup_social_media():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client.stocklot
        
        # Social media configuration
        social_media_config = {
            "type": "social_media",
            "settings": {
                "facebook": "https://www.facebook.com/stocklot65/",
                "instagram": "https://www.instagram.com/stocklotmarket_/", 
                "twitter": "https://twitter.com/stocklot",
                "linkedin": "https://linkedin.com/company/stocklot",
                "youtube": "https://youtube.com/@stocklot"
            },
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Insert/update social media configuration
        result = await db.platform_config.update_one(
            {"type": "social_media"},
            {"$set": social_media_config},
            upsert=True
        )
        
        print(f"✅ Social media config updated. Matched: {result.matched_count}, Modified: {result.modified_count}")
        
        # Also update the system_settings for backward compatibility
        system_settings_update = {
            "type": "public",
            "settings": {
                "social_media": {
                    "facebook": "https://www.facebook.com/stocklot65/",
                    "instagram": "https://www.instagram.com/stocklotmarket_/", 
                    "twitter": "https://twitter.com/stocklot",
                    "linkedin": "https://linkedin.com/company/stocklot",
                    "youtube": "https://youtube.com/@stocklot"
                }
            },
            "updated_at": datetime.now(timezone.utc)
        }
        
        result2 = await db.system_settings.update_one(
            {"type": "public"},
            {"$set": system_settings_update},
            upsert=True
        )
        
        print(f"✅ System settings updated. Matched: {result2.matched_count}, Modified: {result2.modified_count}")
        
        # Verify the configuration
        config = await db.platform_config.find_one({"type": "social_media"})
        if config:
            print("✅ Social media configuration verified:")
            for platform, url in config["settings"].items():
                print(f"   {platform}: {url}")
        else:
            print("❌ Social media configuration not found")
            
        client.close()
        
    except Exception as e:
        print(f"❌ Error setting up social media: {e}")

if __name__ == "__main__":
    asyncio.run(setup_social_media())