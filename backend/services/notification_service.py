import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from enum import Enum
from email_service import EmailService
import json
import uuid

logger = logging.getLogger(__name__)

class NotificationChannel(str, Enum):
    EMAIL = "email"
    IN_APP = "in_app"
    PUSH = "push"
    SMS = "sms"

class NotificationStatus(str, Enum):
    QUEUED = "queued"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"
    DISMISSED = "dismissed"

class NotificationTopic(str, Enum):
    # Auth & Account
    WELCOME = "welcome"
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGED = "password_changed"
    LOGIN_ALERT = "login_alert"
    
    # Orders & Transactions
    ORDER_PLACED = "order_placed"
    ORDER_CONFIRMED = "order_confirmed"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    PAYMENT_RECEIVED = "payment_received"
    
    # Listings & Marketplace
    LISTING_APPROVED = "listing_approved"
    LISTING_REJECTED = "listing_rejected"
    LISTING_EXPIRED = "listing_expired"
    BID_PLACED = "bid_placed"
    BID_OUTBID = "bid_outbid"
    AUCTION_WON = "auction_won"
    AUCTION_ENDED = "auction_ended"
    
    # Buy Requests & Offers
    OFFER_RECEIVED = "offer_received"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    OFFER_COUNTER = "offer_counter"
    BUY_REQUEST_CREATED = "buy_request_created"
    BUY_REQUEST_EXPIRED = "buy_request_expired"
    
    # Organization & KYC
    ORG_INVITED = "org_invited"
    ORG_APPROVED = "org_approved"
    KYC_APPROVED = "kyc_approved"
    KYC_REJECTED = "kyc_rejected"
    
    # Referrals
    REFERRAL_REWARD = "referral_reward"
    REFERRAL_PAYOUT = "referral_payout"
    
    # System
    MAINTENANCE = "maintenance"
    SYSTEM_ALERT = "system_alert"

class NotificationService:
    def __init__(self, db):
        self.db = db
        self.email_service = EmailService()
        
    async def send_notification(
        self, 
        user_id: str,
        topic: NotificationTopic,
        title: str,
        message: str,
        channels: List[NotificationChannel] = None,
        action_url: str = None,
        data: Dict[str, Any] = None,
        template_data: Dict[str, Any] = None
    ) -> Dict[str, bool]:
        """Send notification across multiple channels"""
        
        if channels is None:
            channels = [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
            
        results = {}
        
        # Get user preferences
        user_prefs = await self._get_user_notification_preferences(user_id)
        
        for channel in channels:
            if self._should_send_to_channel(topic, channel, user_prefs):
                try:
                    if channel == NotificationChannel.EMAIL:
                        success = await self._send_email_notification(
                            user_id, topic, title, message, action_url, template_data
                        )
                    elif channel == NotificationChannel.IN_APP:
                        success = await self._send_in_app_notification(
                            user_id, topic, title, message, action_url, data
                        )
                    elif channel == NotificationChannel.PUSH:
                        success = await self._send_push_notification(
                            user_id, topic, title, message, action_url, data
                        )
                    else:
                        success = False
                        
                    results[channel.value] = success
                    
                except Exception as e:
                    logger.error(f"Failed to send {channel} notification to {user_id}: {e}")
                    results[channel.value] = False
            else:
                results[channel.value] = False  # User disabled this channel
                
        return results
    
    async def _get_user_notification_preferences(self, user_id: str) -> Dict:
        """Get user notification preferences"""
        prefs = await self.db.user_notification_settings.find_one({"user_id": user_id})
        
        if not prefs:
            # Default preferences
            return {
                "email_enabled": True,
                "in_app_enabled": True,
                "push_enabled": False,
                "sms_enabled": False,
                "topics": {
                    # Default enabled topics
                    NotificationTopic.WELCOME: {"email": True, "in_app": True},
                    NotificationTopic.ORDER_PLACED: {"email": True, "in_app": True},
                    NotificationTopic.PAYMENT_RECEIVED: {"email": True, "in_app": True},
                    NotificationTopic.LOGIN_ALERT: {"email": True, "in_app": True},
                }
            }
        
        return prefs
    
    def _should_send_to_channel(self, topic: NotificationTopic, channel: NotificationChannel, prefs: Dict) -> bool:
        """Check if notification should be sent to specific channel"""
        
        # Security notifications are always sent
        security_topics = [NotificationTopic.LOGIN_ALERT, NotificationTopic.PASSWORD_CHANGED]
        if topic in security_topics:
            return True
            
        # Check global channel preference
        channel_key = f"{channel.value}_enabled"
        if not prefs.get(channel_key, False):
            return False
            
        # Check topic-specific preference
        topic_prefs = prefs.get("topics", {}).get(topic.value, {})
        return topic_prefs.get(channel.value, False)
    
    async def _send_email_notification(
        self, 
        user_id: str, 
        topic: NotificationTopic, 
        title: str, 
        message: str,
        action_url: str = None,
        template_data: Dict[str, Any] = None
    ) -> bool:
        """Send email notification"""
        
        # Get user email
        user = await self.db.users.find_one({"id": user_id})
        if not user or not user.get("email"):
            return False
            
        # Create notification record
        notification_id = str(uuid.uuid4())
        notification = {
            "id": notification_id,
            "user_id": user_id,
            "topic": topic.value,
            "channel": NotificationChannel.EMAIL.value,
            "title": title,
            "message": message,
            "action_url": action_url,
            "data": template_data or {},
            "status": NotificationStatus.QUEUED.value,
            "created_at": datetime.now(timezone.utc),
            "sent_at": None
        }
        
        await self.db.notifications.insert_one(notification)
        
        # Send email using template
        html_content = self._render_email_template(topic, template_data or {
            "title": title,
            "message": message,
            "action_url": action_url,
            "user_name": user.get("full_name", "")
        })
        
        success = self.email_service.send_email(
            to=user["email"],
            subject=title,
            html_content=html_content
        )
        
        # Update notification status
        await self.db.notifications.update_one(
            {"id": notification_id},
            {
                "$set": {
                    "status": NotificationStatus.SENT.value if success else NotificationStatus.FAILED.value,
                    "sent_at": datetime.now(timezone.utc) if success else None
                }
            }
        )
        
        return success
    
    async def _send_in_app_notification(
        self, 
        user_id: str, 
        topic: NotificationTopic, 
        title: str, 
        message: str,
        action_url: str = None,
        data: Dict[str, Any] = None
    ) -> bool:
        """Send in-app notification"""
        
        notification_id = str(uuid.uuid4())
        notification = {
            "id": notification_id,
            "user_id": user_id,
            "topic": topic.value,
            "channel": NotificationChannel.IN_APP.value,
            "title": title,
            "message": message,
            "action_url": action_url,
            "data": data or {},
            "status": NotificationStatus.SENT.value,  # In-app notifications are immediately "sent"
            "created_at": datetime.now(timezone.utc),
            "sent_at": datetime.now(timezone.utc),
            "read_at": None
        }
        
        await self.db.notifications.insert_one(notification)
        return True
    
    async def _send_push_notification(
        self, 
        user_id: str, 
        topic: NotificationTopic, 
        title: str, 
        message: str,
        action_url: str = None,
        data: Dict[str, Any] = None
    ) -> bool:
        """Send push notification (placeholder for now)"""
        
        # TODO: Implement actual push notification service
        # For now, just create a record
        notification_id = str(uuid.uuid4())
        notification = {
            "id": notification_id,
            "user_id": user_id,
            "topic": topic.value,
            "channel": NotificationChannel.PUSH.value,
            "title": title,
            "message": message,
            "action_url": action_url,
            "data": data or {},
            "status": NotificationStatus.QUEUED.value,
            "created_at": datetime.now(timezone.utc),
            "sent_at": None
        }
        
        await self.db.notifications.insert_one(notification)
        logger.info(f"Push notification queued for user {user_id}: {title}")
        return True
    
    def _render_email_template(self, topic: NotificationTopic, data: Dict[str, Any]) -> str:
        """Render email template for topic"""
        
        templates = {
            NotificationTopic.WELCOME: """
                <h2>Welcome to StockLot, {user_name}!</h2>
                <p>Thank you for joining South Africa's premier livestock marketplace.</p>
                <p>You can now buy and sell livestock with secure escrow payments.</p>
                {action_button}
            """,
            NotificationTopic.EMAIL_VERIFICATION: """
                <h2>Verify Your Email</h2>
                <p>Hi {user_name}, please verify your email address to complete your registration.</p>
                <p>Click the button below to verify your email:</p>
                {action_button}
            """,
            NotificationTopic.ORDER_PLACED: """
                <h2>Order Confirmed</h2>
                <p>Hi {user_name}, your order has been placed successfully!</p>
                <p>Order details:</p>
                <ul>
                <li>Order ID: {order_id}</li>
                <li>Total: R{total_amount}</li>
                <li>Items: {item_count} livestock</li>
                </ul>
                <p>Your payment is held securely in escrow until delivery.</p>
                {action_button}
            """,
            NotificationTopic.LOGIN_ALERT: """
                <h2>New Login Alert</h2>
                <p>Hi {user_name}, we detected a new login to your account.</p>
                <p>Device: {device_info}</p>
                <p>Location: {location}</p>
                <p>If this wasn't you, please secure your account immediately.</p>
                {action_button}
            """,
        }
        
        template = templates.get(topic, """
            <h2>{title}</h2>
            <p>{message}</p>
            {action_button}
        """)
        
        # Add action button if URL provided
        action_button = ""
        if data.get("action_url"):
            action_button = f"""
                <div style="margin: 20px 0;">
                    <a href="{data['action_url']}" 
                       style="background: #059669; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        {data.get('action_text', 'View Details')}
                    </a>
                </div>
            """
        
        # Replace placeholders
        html_content = template.format(
            user_name=data.get("user_name", ""),
            title=data.get("title", ""),
            message=data.get("message", ""),
            action_button=action_button,
            **data
        )
        
        # Wrap in basic HTML structure
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                {html_content}
                <div class="footer">
                    <p>Best regards,<br>The StockLot Team</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        channel: NotificationChannel = NotificationChannel.IN_APP,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False
    ) -> List[Dict]:
        """Get user notifications"""
        
        query = {
            "user_id": user_id,
            "channel": channel.value
        }
        
        if unread_only:
            query["read_at"] = None
            
        cursor = self.db.notifications.find(query).sort("created_at", -1).skip(offset).limit(limit)
        notifications = await cursor.to_list(length=None)
        
        # Remove MongoDB _id field
        for notification in notifications:
            if "_id" in notification:
                del notification["_id"]
                
        return notifications
    
    async def get_notifications(
        self, 
        user_id: str, 
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
        channel: NotificationChannel = NotificationChannel.IN_APP
    ) -> List[Dict]:
        """Get notifications for user - alias for get_user_notifications with compatible parameters"""
        return await self.get_user_notifications(
            user_id=user_id,
            channel=channel,
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
    
    async def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Mark notification as read"""
        
        result = await self.db.notifications.update_one(
            {"id": notification_id, "user_id": user_id},
            {"$set": {"read_at": datetime.now(timezone.utc)}}
        )
        
        return result.modified_count > 0
    
    async def mark_all_read(self, user_id: str) -> int:
        """Mark all notifications as read for user"""
        
        result = await self.db.notifications.update_many(
            {"user_id": user_id, "read_at": None},
            {"$set": {"read_at": datetime.now(timezone.utc)}}
        )
        
        return result.modified_count
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get unread notification count"""
        
        count = await self.db.notifications.count_documents({
            "user_id": user_id,
            "channel": NotificationChannel.IN_APP.value,
            "read_at": None
        })
        
        return count

# Helper functions for common notification scenarios
async def send_welcome_email(db, user_id: str, user_name: str, user_email: str):
    """Send welcome email to new user"""
    service = NotificationService(db)
    await service.send_notification(
        user_id=user_id,
        topic=NotificationTopic.WELCOME,
        title="Welcome to StockLot!",
        message="Thank you for joining South Africa's premier livestock marketplace.",
        channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        action_url="https://farmstock-hub-1.preview.emergentagent.com/marketplace",
        template_data={
            "user_name": user_name,
            "action_text": "Browse Marketplace"
        }
    )

async def send_order_confirmation(db, user_id: str, order_data: Dict):
    """Send order confirmation notification"""
    service = NotificationService(db)
    await service.send_notification(
        user_id=user_id,
        topic=NotificationTopic.ORDER_PLACED,
        title=f"Order #{order_data['order_id']} Confirmed",
        message=f"Your order for {order_data['item_count']} livestock items has been placed successfully.",
        channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        action_url=f"https://farmstock-hub-1.preview.emergentagent.com/orders/{order_data['order_id']}",
        template_data={
            "order_id": order_data["order_id"],
            "total_amount": order_data["total_amount"],
            "item_count": order_data["item_count"],
            "action_text": "View Order"
        }
    )

async def send_login_alert(db, user_id: str, user_name: str, device_info: str, location: str):
    """Send login security alert"""
    service = NotificationService(db)
    await service.send_notification(
        user_id=user_id,
        topic=NotificationTopic.LOGIN_ALERT,
        title="New Login Detected",
        message=f"New login from {device_info} in {location}",
        channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP], 
        action_url="https://farmstock-hub-1.preview.emergentagent.com/account/security",
        template_data={
            "user_name": user_name,
            "device_info": device_info,
            "location": location,
            "action_text": "Secure Account"
        }
    )