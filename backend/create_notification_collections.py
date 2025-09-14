#!/usr/bin/env python3
"""
Create MongoDB collections for notification system
Run this script to initialize the notification system collections and indexes
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import from relative path
import sys
sys.path.append('/app/backend')
sys.path.append('/app/backend/models')

from notification_models import (
    AdminNotificationSettings, NotificationTemplate, 
    DigestFrequency
)

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/stocklot')

async def create_collections_and_indexes():
    """Create notification collections and indexes"""
    
    print("🔄 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_default_database()
    
    try:
        # Create collections if they don't exist
        collections_to_create = [
            'user_notification_prefs',
            'notifications_outbox', 
            'notif_counters',
            'admin_settings_notifications',
            'notification_templates'
        ]
        
        existing_collections = await db.list_collection_names()
        
        for collection_name in collections_to_create:
            if collection_name not in existing_collections:
                await db.create_collection(collection_name)
                print(f"✅ Created collection: {collection_name}")
            else:
                print(f"📝 Collection already exists: {collection_name}")
        
        # Create indexes
        print("\n🔄 Creating indexes...")
        
        # Outbox indexes for efficient querying
        await db.notifications_outbox.create_index([("status", 1), ("scheduled_at", 1)])
        await db.notifications_outbox.create_index([("dedupe_key", 1), ("status", 1)])
        await db.notifications_outbox.create_index([("user_id", 1)])
        print("✅ Created outbox indexes")
        
        # User preferences indexes
        await db.user_notification_prefs.create_index([("user_id", 1)], unique=True)
        print("✅ Created user preferences indexes")
        
        # Counter indexes for daily limits
        await db.notif_counters.create_index([("user_id", 1), ("yyyymmdd", 1)], unique=True)
        print("✅ Created counter indexes")
        
        # Template indexes
        await db.notification_templates.create_index([("key", 1)], unique=True)
        print("✅ Created template indexes")
        
        # Seed default admin settings
        print("\n🔄 Seeding default data...")
        
        admin_settings = await db.admin_settings_notifications.find_one({"id": 1})
        if not admin_settings:
            default_settings = AdminNotificationSettings()
            await db.admin_settings_notifications.insert_one(default_settings.dict())
            print("✅ Created default admin notification settings")
        else:
            print("📝 Admin settings already exist")
        
        # Seed default templates
        default_templates = [
            {
                "key": "buy_request.posted",
                "subject": "New Buy Request • {{species}} {{province}}",
                "html": "<h2>New {{species}} buy request</h2><p>{{title}}</p><p><a href=\"{{url}}\">View request</a></p>",
                "text": "New buy request: {{species}} - {{title}}. Open: {{url}}",
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "key": "listing.posted", 
                "subject": "New Listing • {{species}} in {{province}}",
                "html": "<h2>New {{species}} listing</h2><p>{{title}}</p><p><a href=\"{{url}}\">View listing</a></p>",
                "text": "New listing: {{species}} - {{title}}. Open: {{url}}",
                "updated_at": datetime.now(timezone.utc)
            }
        ]
        
        for template in default_templates:
            existing = await db.notification_templates.find_one({"key": template["key"]})
            if not existing:
                await db.notification_templates.insert_one(template)
                print(f"✅ Created template: {template['key']}")
            else:
                print(f"📝 Template already exists: {template['key']}")
        
        print("\n🎉 Notification system collections and indexes created successfully!")
        print("📊 Summary:")
        print(f"   - Collections: {len(collections_to_create)}")
        print(f"   - Indexes: Multiple for optimal performance")
        print(f"   - Default templates: 2 (buy_request.posted, listing.posted)")
        print(f"   - Admin settings: 1 default configuration")
        
    except Exception as e:
        print(f"❌ Error creating collections: {e}")
        raise
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_collections_and_indexes())