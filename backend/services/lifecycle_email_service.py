import os
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import json
import uuid
from email_service import EmailService

logger = logging.getLogger(__name__)

class CampaignType(str, Enum):
    CART_ABANDON_1H = "cart_abandon_1h"
    CART_ABANDON_24H = "cart_abandon_24h"
    CART_ABANDON_72H = "cart_abandon_72h"
    BROWSE_ABANDON_4H = "browse_abandon_4h"
    PRICE_DROP = "price_drop"
    BACK_IN_STOCK = "back_in_stock"
    LOW_STOCK = "low_stock"
    BUY_REQUEST_ABANDON = "buy_request_abandon_2h"
    RFQ_ABANDON = "rfq_abandon_24h"

class LifecycleEmailService:
    def __init__(self, db):
        self.db = db
        self.email_service = EmailService()
        
    async def initialize_tables(self):
        """Initialize lifecycle email tables if not exists"""
        # Create indexes for performance
        await self.db.marketing_subscriptions.create_index("email", unique=True)
        await self.db.sessions.create_index("id", unique=True)
        await self.db.cart_snapshots.create_index([("session_id", 1), ("made_at", -1)])
        await self.db.lifecycle_events.create_index([("event_type", 1), ("occurred_at", -1)])
        await self.db.campaign_sends.create_index([("email", 1), ("campaign_code", 1), ("sent_at", -1)])
        
    async def subscribe_user(self, email: str, consent: bool, source: str, 
                           session_id: str = None, user_id: str = None) -> bool:
        """Subscribe user to marketing emails with consent"""
        try:
            subscription_data = {
                "email": email.lower(),
                "consent": consent,
                "source": source,
                "created_at": datetime.now(timezone.utc),
                "unsubscribed_at": None
            }
            
            if user_id:
                subscription_data["user_id"] = user_id
                
            # Upsert subscription
            await self.db.marketing_subscriptions.update_one(
                {"email": email.lower()},
                {"$set": subscription_data},
                upsert=True
            )
            
            # Update session with email if provided
            if session_id:
                await self.db.sessions.update_one(
                    {"id": session_id},
                    {
                        "$set": {
                            "email": email.lower(),
                            "last_seen_at": datetime.now(timezone.utc)
                        }
                    },
                    upsert=True
                )
                
            logger.info(f"User subscribed: {email} (consent: {consent})")
            return True
            
        except Exception as e:
            logger.error(f"Error subscribing user {email}: {e}")
            return False
    
    async def track_event(self, session_id: str, event_type: str, payload: Dict = None, 
                         user_id: str = None) -> bool:
        """Track lifecycle events"""
        try:
            event_data = {
                "session_id": session_id,
                "event_type": event_type,
                "payload": payload or {},
                "occurred_at": datetime.now(timezone.utc)
            }
            
            if user_id:
                event_data["user_id"] = user_id
                
            await self.db.lifecycle_events.insert_one(event_data)
            
            # Special handling for cart events
            if event_type == "cart.updated" and payload:
                await self.snapshot_cart(session_id, payload, user_id)
                
            return True
            
        except Exception as e:
            logger.error(f"Error tracking event {event_type} for session {session_id}: {e}")
            return False
    
    async def snapshot_cart(self, session_id: str, cart_data: Dict, user_id: str = None):
        """Create cart snapshot for abandonment tracking"""
        try:
            snapshot_data = {
                "session_id": session_id,
                "cart_id": cart_data.get("cart_id", str(uuid.uuid4())),
                "items": cart_data.get("items", []),
                "subtotal_minor": cart_data.get("subtotal_minor", 0),
                "currency": cart_data.get("currency", "ZAR"),
                "made_at": datetime.now(timezone.utc)
            }
            
            if user_id:
                snapshot_data["user_id"] = user_id
                
            await self.db.cart_snapshots.insert_one(snapshot_data)
            
        except Exception as e:
            logger.error(f"Error creating cart snapshot for session {session_id}: {e}")
    
    async def can_send_campaign(self, email: str, campaign_code: str) -> bool:
        """Check if we can send campaign (consent + frequency caps)"""
        try:
            # Check subscription and consent
            subscription = await self.db.marketing_subscriptions.find_one({
                "email": email,
                "consent": True,
                "unsubscribed_at": None
            })
            
            if not subscription:
                return False
            
            # Check frequency caps
            # Max 1 email per campaign per 24h
            recent_campaign = await self.db.campaign_sends.find_one({
                "email": email,
                "campaign_code": campaign_code,
                "sent_at": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
            })
            
            if recent_campaign:
                return False
            
            # Max 3 lifecycle emails per week
            weekly_count = await self.db.campaign_sends.count_documents({
                "email": email,
                "sent_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)}
            })
            
            if weekly_count >= 3:
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Error checking send permissions for {email}: {e}")
            return False
    
    async def process_cart_abandonment(self, minutes_ago: int, campaign_code: str):
        """Process cart abandonment for specific time window"""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)
            
            # Find abandoned carts
            pipeline = [
                # Get latest cart snapshot per session
                {"$sort": {"session_id": 1, "made_at": -1}},
                {"$group": {
                    "_id": "$session_id",
                    "latest_cart": {"$first": "$$ROOT"}
                }},
                # Only carts from the specific time window
                {"$match": {
                    "latest_cart.made_at": {
                        "$lte": cutoff_time,
                        "$gte": cutoff_time - timedelta(minutes=30)  # 30min window
                    }
                }},
                # Join with sessions to get email
                {"$lookup": {
                    "from": "sessions",
                    "localField": "_id",
                    "foreignField": "id", 
                    "as": "session"
                }},
                {"$match": {"session.email": {"$exists": True, "$ne": None}}},
                # Check no checkout occurred after cart
                {"$lookup": {
                    "from": "lifecycle_events",
                    "let": {"session_id": "$_id", "cart_time": "$latest_cart.made_at"},
                    "pipeline": [
                        {"$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$session_id", "$$session_id"]},
                                    {"$in": ["$event_type", ["checkout.started", "order.completed"]]},
                                    {"$gte": ["$occurred_at", "$$cart_time"]}
                                ]
                            }
                        }}
                    ],
                    "as": "checkouts"
                }},
                {"$match": {"checkouts": {"$size": 0}}}
            ]
            
            candidates = await self.db.cart_snapshots.aggregate(pipeline).to_list(length=None)
            
            for candidate in candidates:
                session = candidate["session"][0]
                cart = candidate["latest_cart"]
                email = session["email"]
                
                # Check if we can send
                if not await self.can_send_campaign(email, campaign_code):
                    continue
                
                # Send email
                success = await self.send_cart_abandon_email(email, cart, campaign_code)
                
                if success:
                    # Record send
                    await self.db.campaign_sends.insert_one({
                        "campaign_code": campaign_code,
                        "session_id": session["id"],
                        "user_id": session.get("user_id"),
                        "email": email,
                        "ref_cart_id": cart["cart_id"],
                        "sent_at": datetime.now(timezone.utc),
                        "status": "SENT"
                    })
                    
            logger.info(f"Processed {len(candidates)} cart abandonment candidates for {campaign_code}")
            
        except Exception as e:
            logger.error(f"Error processing cart abandonment {campaign_code}: {e}")
    
    async def send_cart_abandon_email(self, email: str, cart_data: Dict, campaign_code: str) -> bool:
        """Send cart abandonment email"""
        try:
            items = cart_data.get("items", [])
            if not items:
                return False
            
            # Build deep link
            session_id = cart_data.get("session_id")
            base_url = os.getenv("FRONTEND_URL", "https://farmstock-hub-1.preview.emergentagent.com")
            utm_params = f"utm_source=stocklot&utm_medium=email&utm_campaign={campaign_code}"
            cta_url = f"{base_url}/cart?session={session_id}&{utm_params}"
            
            # Prepare email data
            first_item = items[0]
            subtotal = f"R{cart_data.get('subtotal_minor', 0) / 100:.2f}"
            
            # Email templates based on campaign
            if campaign_code == CampaignType.CART_ABANDON_1H:
                subject = "You left something in your cart 🐄"
                template_name = "cart_abandon_1h"
            elif campaign_code == CampaignType.CART_ABANDON_24H:
                subject = "Still interested? Your cart's waiting"
                template_name = "cart_abandon_24h"
            else:
                subject = "Complete your livestock purchase"
                template_name = "cart_abandon_72h"
                
            # Build HTML content
            html_content = self.build_cart_abandon_html(
                first_item.get("title", "Livestock"),
                items[:2],  # Show max 2 items
                subtotal,
                cta_url,
                campaign_code
            )
            
            # Send via email service
            success = self.email_service.send_email(
                to=email,
                subject=subject,
                html_content=html_content
            )
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending cart abandon email to {email}: {e}")
            return False
    
    def build_cart_abandon_html(self, title: str, items: List[Dict], 
                               subtotal: str, cta_url: str, campaign: str) -> str:
        """Build HTML content for cart abandonment email"""
        items_html = ""
        for item in items[:2]:  # Max 2 items
            items_html += f"""
            <tr>
                <td style="padding: 10px;">
                    <img src="{item.get('image', '')}" alt="Livestock" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                </td>
                <td style="padding: 10px;">
                    <strong>{item.get('title', 'Livestock')}</strong><br>
                    <span style="color: #666;">Qty: {item.get('qty', 1)}</span>
                </td>
            </tr>
            """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You left something in your cart</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background-color: #0ea5e9; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">StockLot</h1>
                    <p style="color: #e0f2fe; margin: 5px 0 0 0;">Livestock Marketplace</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 24px;">
                    <h2 style="color: #1F2937; margin: 0 0 16px 0;">You left items in your cart 🐄</h2>
                    <p style="color: #4B5563; margin: 0 0 20px 0;">Complete your order before items sell out.</p>
                    
                    <!-- Items -->
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        {items_html}
                    </table>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
                    
                    <p style="font-size: 16px; margin: 10px 0;">
                        Subtotal: <strong>{subtotal}</strong>
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{cta_url}" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                            Return to your cart
                        </a>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
                        Protected by escrow. Seller details remain private until payment is secured.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #F9FAFB; padding: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
                    You receive this because you opted in to receive cart updates from StockLot.
                    <br><a href="#" style="color: #9CA3AF;">Unsubscribe</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    async def process_browse_abandonment(self):
        """Process browse abandonment (PDPs viewed multiple times, no add to cart)"""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=4)
            
            # Find users who viewed same PDP 2+ times in 24h but didn't add to cart
            pipeline = [
                {"$match": {
                    "event_type": "pdp.view",
                    "occurred_at": {"$gte": datetime.now(timezone.utc) - timedelta(hours=24)}
                }},
                {"$group": {
                    "_id": {
                        "session_id": "$session_id",
                        "listing_id": "$payload.listing_id"
                    },
                    "view_count": {"$sum": 1},
                    "last_view": {"$max": "$occurred_at"}
                }},
                {"$match": {
                    "view_count": {"$gte": 2},
                    "last_view": {"$lte": cutoff_time}
                }}
            ]
            
            candidates = await self.db.lifecycle_events.aggregate(pipeline).to_list(length=None)
            
            for candidate in candidates:
                session_id = candidate["_id"]["session_id"]
                listing_id = candidate["_id"]["listing_id"]
                
                # Check if user added to cart since last view
                cart_add = await self.db.lifecycle_events.find_one({
                    "session_id": session_id,
                    "event_type": "add_to_cart",
                    "payload.listing_id": listing_id,
                    "occurred_at": {"$gte": candidate["last_view"]}
                })
                
                if cart_add:
                    continue  # Already added to cart
                
                # Get session email
                session = await self.db.sessions.find_one({"id": session_id})
                if not session or not session.get("email"):
                    continue
                
                email = session["email"]
                
                # Check send permissions
                if not await self.can_send_campaign(email, CampaignType.BROWSE_ABANDON_4H):
                    continue
                
                # Get listing details
                listing = await self.db.listings.find_one({"id": listing_id})
                if not listing:
                    continue
                
                # Send browse abandonment email
                success = await self.send_browse_abandon_email(email, listing)
                
                if success:
                    await self.db.campaign_sends.insert_one({
                        "campaign_code": CampaignType.BROWSE_ABANDON_4H,
                        "session_id": session_id,
                        "email": email,
                        "ref_listing_id": listing_id,
                        "sent_at": datetime.now(timezone.utc),
                        "status": "SENT"
                    })
                    
            logger.info(f"Processed {len(candidates)} browse abandonment candidates")
            
        except Exception as e:
            logger.error(f"Error processing browse abandonment: {e}")
    
    async def send_browse_abandon_email(self, email: str, listing: Dict) -> bool:
        """Send browse abandonment email"""
        try:
            base_url = os.getenv("FRONTEND_URL", "https://farmstock-hub-1.preview.emergentagent.com")
            utm_params = "utm_source=stocklot&utm_medium=email&utm_campaign=browse_abandon_4h"
            cta_url = f"{base_url}/livestock/{listing['id']}?{utm_params}"
            
            title = listing.get("title", "Livestock")
            price = f"R{listing.get('price', 0):.2f}"
            image = listing.get("images", [{}])[0].get("url", "")
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Still interested in {title}?</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background-color: #0ea5e9; padding: 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">StockLot</h1>
                        <p style="color: #e0f2fe; margin: 5px 0 0 0;">Livestock Marketplace</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 24px;">
                        <h2 style="color: #1F2937; margin: 0 0 16px 0;">Still looking at {title}?</h2>
                        
                        <!-- Listing Preview -->
                        <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <table style="width: 100%;">
                                <tr>
                                    <td style="width: 120px;">
                                        <img src="{image}" alt="{title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                                    </td>
                                    <td style="padding-left: 16px;">
                                        <h3 style="margin: 0 0 8px 0; color: #1F2937;">{title}</h3>
                                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #16a34a;">{price}</p>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{cta_url}" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                                View Listing
                            </a>
                        </div>
                        
                        <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
                            Don't miss out on quality livestock. View details and contact the seller today.
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #F9FAFB; padding: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
                        You receive this because you opted in to receive updates from StockLot.
                        <br><a href="#" style="color: #9CA3AF;">Unsubscribe</a>
                    </div>
                </div>
            </body>
            </html>
            """
            
            success = self.email_service.send_email(
                to=email,
                subject=f"Still interested? {title}",
                html_content=html_content
            )
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending browse abandon email to {email}: {e}")
            return False
    
    async def run_cron_job(self):
        """Main cron job - run every 10 minutes"""
        logger.info("Starting lifecycle email cron job")
        
        try:
            # Cart abandonment sequences
            await self.process_cart_abandonment(60, CampaignType.CART_ABANDON_1H)      # 1 hour
            await self.process_cart_abandonment(1440, CampaignType.CART_ABANDON_24H)   # 24 hours  
            await self.process_cart_abandonment(4320, CampaignType.CART_ABANDON_72H)   # 72 hours
            
            # Browse abandonment
            await self.process_browse_abandonment()
            
            logger.info("Lifecycle email cron job completed")
            
        except Exception as e:
            logger.error(f"Error in lifecycle email cron job: {e}")
    
    async def unsubscribe_user(self, email: str) -> bool:
        """Unsubscribe user from all marketing emails"""
        try:
            result = await self.db.marketing_subscriptions.update_one(
                {"email": email.lower()},
                {"$set": {"unsubscribed_at": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error unsubscribing user {email}: {e}")
            return False