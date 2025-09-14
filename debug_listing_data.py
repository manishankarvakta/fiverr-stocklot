#!/usr/bin/env python3
"""
Debug script to examine listing data structure
"""

import asyncio
import aiohttp
import json
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_listing_data():
    """Debug listing data structure"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Get a sample listing
        listing_doc = await db.listings.find_one({})
        if listing_doc:
            logger.info("Sample listing document structure:")
            logger.info(f"ID: {listing_doc.get('id')}")
            logger.info(f"Title: {listing_doc.get('title')}")
            logger.info(f"Seller ID: {listing_doc.get('seller_id')} (type: {type(listing_doc.get('seller_id'))})")
            logger.info(f"Species: {listing_doc.get('species')} (type: {type(listing_doc.get('species'))})")
            logger.info(f"Price per unit: {listing_doc.get('price_per_unit')} (type: {type(listing_doc.get('price_per_unit'))})")
            
            # Check if seller_id exists in users collection
            seller_id = listing_doc.get('seller_id')
            if seller_id:
                seller_doc = await db.users.find_one({"id": seller_id})
                if seller_doc:
                    logger.info(f"Seller found: {seller_doc.get('full_name')}")
                    logger.info(f"Seller created_at: {seller_doc.get('created_at')} (type: {type(seller_doc.get('created_at'))})")
                else:
                    logger.error(f"Seller not found for ID: {seller_id}")
            
            # Check for problematic fields
            problematic_fields = []
            for field, value in listing_doc.items():
                if isinstance(value, str) and field in ['species', 'breed', 'category']:
                    # These should be strings, but let's check if they're being treated as objects
                    logger.info(f"{field}: '{value}' (string - OK)")
                elif field == 'seller_id' and not isinstance(value, str):
                    problematic_fields.append(f"{field}: {type(value)} (should be string)")
            
            if problematic_fields:
                logger.error("Problematic fields found:")
                for field in problematic_fields:
                    logger.error(f"  - {field}")
            else:
                logger.info("No obvious data type issues found")
                
        else:
            logger.error("No listings found in database")
            
    except Exception as e:
        logger.error(f"Error debugging listing data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(debug_listing_data())