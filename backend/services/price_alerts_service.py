"""
Price Alerts & Notifications Service
Real-time livestock price monitoring and alert system
"""

import logging
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from enum import Enum
from email_service import EmailService

logger = logging.getLogger(__name__)

class AlertType(str, Enum):
    PRICE_DROP = "price_drop"
    PRICE_TARGET = "price_target"
    AVAILABILITY = "availability"
    MARKET_TREND = "market_trend"
    PRICE_INCREASE = "price_increase"
    PERCENTAGE_CHANGE = "percentage_change"

class AlertFrequency(str, Enum):
    INSTANT = "instant"
    DAILY = "daily"
    WEEKLY = "weekly"

class NotificationChannel(str, Enum):
    EMAIL = "email"
    IN_APP = "in_app"
    SMS = "sms"

class AlertStatus(str, Enum):
    ACTIVE = "active"
    TRIGGERED = "triggered"
    PAUSED = "paused"
    EXPIRED = "expired"

class PriceAlert(BaseModel):
    id: str
    user_id: str
    alert_type: AlertType
    title: str
    description: Optional[str] = None
    
    # Target criteria
    species_id: Optional[str] = None
    breed_id: Optional[str] = None
    location: Optional[str] = None  # Province or city
    
    # Price conditions
    target_price: Optional[float] = None
    current_price: Optional[float] = None
    percentage_threshold: Optional[float] = None  # e.g., 15% drop
    
    # Alert settings
    frequency: AlertFrequency = AlertFrequency.INSTANT
    channels: List[NotificationChannel] = [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
    status: AlertStatus = AlertStatus.ACTIVE
    
    # Timestamps
    created_at: datetime
    last_triggered: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Tracking
    trigger_count: int = 0
    last_checked_price: Optional[float] = None

class PriceAlertCreate(BaseModel):
    alert_type: AlertType
    title: str
    description: Optional[str] = None
    species_id: Optional[str] = None
    breed_id: Optional[str] = None
    location: Optional[str] = None
    target_price: Optional[float] = None
    percentage_threshold: Optional[float] = None
    frequency: AlertFrequency = AlertFrequency.INSTANT
    channels: List[NotificationChannel] = [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
    expires_at: Optional[datetime] = None

class PriceAlertUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_price: Optional[float] = None
    percentage_threshold: Optional[float] = None
    frequency: Optional[AlertFrequency] = None
    channels: Optional[List[NotificationChannel]] = None
    status: Optional[AlertStatus] = None

class NotificationRecord(BaseModel):
    id: str
    user_id: str
    alert_id: str
    notification_type: AlertType
    title: str
    message: str
    channels_sent: List[NotificationChannel]
    created_at: datetime
    read_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None

class MarketPriceData(BaseModel):
    id: str
    species_id: str
    breed_id: Optional[str] = None
    location: str
    price_per_unit: float
    unit: str
    quantity_available: int
    source_listing_id: Optional[str] = None
    source_type: str  # 'listing' or 'market_data'
    recorded_at: datetime

class PriceAlertsService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.email_service = EmailService()
        
        # Collections
        self.price_alerts_collection = db.price_alerts
        self.notifications_collection = db.notifications
        self.price_history_collection = db.price_history
        self.listings_collection = db.listings
        self.users_collection = db.users
        self.wishlist_collection = db.wishlist_items
        
        # Create indexes
        try:
            asyncio.create_task(self._create_indexes())
        except:
            pass
    
    async def _create_indexes(self):
        """Create database indexes for performance"""
        try:
            # Price alerts indexes
            await self.price_alerts_collection.create_index("user_id")
            await self.price_alerts_collection.create_index("status")
            await self.price_alerts_collection.create_index("alert_type")
            await self.price_alerts_collection.create_index("species_id")
            await self.price_alerts_collection.create_index("location")
            await self.price_alerts_collection.create_index("expires_at")
            
            # Notifications indexes
            await self.notifications_collection.create_index("user_id")
            await self.notifications_collection.create_index("created_at")
            await self.notifications_collection.create_index("read_at")
            
            # Price history indexes
            await self.price_history_collection.create_index([("species_id", 1), ("location", 1), ("recorded_at", -1)])
            await self.price_history_collection.create_index("recorded_at")
            
        except Exception as e:
            logger.warning(f"Could not create price alerts indexes: {e}")
    
    def _generate_alert_id(self) -> str:
        """Generate unique alert ID"""
        return f"alert_{secrets.token_urlsafe(12)}"
    
    def _generate_notification_id(self) -> str:
        """Generate unique notification ID"""
        return f"notif_{secrets.token_urlsafe(12)}"
    
    async def create_price_alert(self, user_id: str, alert_data: PriceAlertCreate) -> Dict[str, Any]:
        """Create new price alert for user"""
        try:
            # Verify user exists
            user = await self.users_collection.find_one({"id": user_id})
            if not user:
                return {
                    "success": False,
                    "message": "User not found."
                }
            
            # Validate alert data
            if alert_data.alert_type in [AlertType.PRICE_TARGET, AlertType.PRICE_DROP] and not alert_data.target_price:
                return {
                    "success": False,
                    "message": "Target price is required for price alerts."
                }
            
            if alert_data.alert_type == AlertType.PERCENTAGE_CHANGE and not alert_data.percentage_threshold:
                return {
                    "success": False,
                    "message": "Percentage threshold is required for percentage change alerts."
                }
            
            # Get current market price for the criteria
            current_price = await self._get_current_market_price(
                species_id=alert_data.species_id,
                breed_id=alert_data.breed_id,
                location=alert_data.location
            )
            
            # Create alert record
            alert_record = {
                "id": self._generate_alert_id(),
                "user_id": user_id,
                "alert_type": alert_data.alert_type,
                "title": alert_data.title,
                "description": alert_data.description,
                "species_id": alert_data.species_id,
                "breed_id": alert_data.breed_id,
                "location": alert_data.location,
                "target_price": alert_data.target_price,
                "current_price": current_price,
                "percentage_threshold": alert_data.percentage_threshold,
                "frequency": alert_data.frequency,
                "channels": alert_data.channels,
                "status": AlertStatus.ACTIVE,
                "created_at": datetime.now(timezone.utc),
                "trigger_count": 0,
                "last_checked_price": current_price,
                "expires_at": alert_data.expires_at
            }
            
            await self.price_alerts_collection.insert_one(alert_record)
            
            logger.info(f"Price alert created: {alert_record['id']} for user {user_id}")
            
            return {
                "success": True,
                "alert_id": alert_record["id"],
                "current_price": current_price,
                "message": "Price alert created successfully!"
            }
            
        except Exception as e:
            logger.error(f"Error creating price alert: {e}")
            return {
                "success": False,
                "message": "Failed to create price alert."
            }
    
    async def get_user_alerts(self, user_id: str, status: Optional[AlertStatus] = None, 
                            alert_type: Optional[AlertType] = None) -> Dict[str, Any]:
        """Get user's price alerts"""
        try:
            # Build query
            query = {"user_id": user_id}
            if status:
                query["status"] = status
            if alert_type:
                query["alert_type"] = alert_type
            
            # Get alerts
            alerts = []
            cursor = self.price_alerts_collection.find(query).sort("created_at", -1)
            
            async for alert in cursor:
                # Get latest market price
                current_market_price = await self._get_current_market_price(
                    species_id=alert.get("species_id"),
                    breed_id=alert.get("breed_id"),
                    location=alert.get("location")
                )
                
                alert_data = {
                    "id": alert["id"],
                    "alert_type": alert["alert_type"],
                    "title": alert["title"],
                    "description": alert.get("description"),
                    "species_id": alert.get("species_id"),
                    "breed_id": alert.get("breed_id"),
                    "location": alert.get("location"),
                    "target_price": alert.get("target_price"),
                    "current_price": current_market_price,
                    "percentage_threshold": alert.get("percentage_threshold"),
                    "frequency": alert["frequency"],
                    "channels": alert["channels"],
                    "status": alert["status"],
                    "created_at": alert["created_at"],
                    "last_triggered": alert.get("last_triggered"),
                    "trigger_count": alert.get("trigger_count", 0),
                    "expires_at": alert.get("expires_at")
                }
                
                # Calculate price change if we have both prices
                if current_market_price and alert.get("last_checked_price"):
                    price_change = current_market_price - alert["last_checked_price"]
                    price_change_percent = (price_change / alert["last_checked_price"]) * 100
                    alert_data["price_change"] = price_change
                    alert_data["price_change_percent"] = round(price_change_percent, 2)
                
                alerts.append(alert_data)
            
            # Get summary statistics
            total_alerts = len(alerts)
            active_alerts = len([a for a in alerts if a["status"] == "active"])
            triggered_today = len([a for a in alerts if a["last_triggered"] and 
                                 a["last_triggered"].date() == datetime.now(timezone.utc).date()])
            
            return {
                "success": True,
                "alerts": alerts,
                "summary": {
                    "total_alerts": total_alerts,
                    "active_alerts": active_alerts,
                    "triggered_today": triggered_today
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting user alerts: {e}")
            return {
                "success": False,
                "message": "Failed to get alerts.",
                "alerts": [],
                "summary": {}
            }
    
    async def _get_current_market_price(self, species_id: Optional[str] = None, 
                                      breed_id: Optional[str] = None,
                                      location: Optional[str] = None) -> Optional[float]:
        """Get current market price for specified criteria"""
        try:
            # Build query for active listings
            query = {"status": "active"}
            if species_id:
                query["species_id"] = species_id
            if breed_id:
                query["breed_id"] = breed_id
            if location:
                query["location"] = {"$regex": location, "$options": "i"}
            
            # Get recent listings and calculate average price
            cursor = self.listings_collection.find(query).sort("created_at", -1).limit(20)
            prices = []
            
            async for listing in cursor:
                price = listing.get("price_per_unit", 0)
                if price > 0:
                    prices.append(price)
            
            if prices:
                # Return median price for better accuracy
                prices.sort()
                n = len(prices)
                if n % 2 == 0:
                    return (prices[n//2-1] + prices[n//2]) / 2
                else:
                    return prices[n//2]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting current market price: {e}")
            return None
    
    async def check_and_trigger_alerts(self) -> Dict[str, Any]:
        """Check all active alerts and trigger notifications"""
        try:
            triggered_count = 0
            processed_count = 0
            
            # Get all active alerts
            cursor = self.price_alerts_collection.find({
                "status": AlertStatus.ACTIVE,
                "$or": [
                    {"expires_at": None},
                    {"expires_at": {"$gt": datetime.now(timezone.utc)}}
                ]
            })
            
            async for alert in cursor:
                processed_count += 1
                
                # Get current market price
                current_price = await self._get_current_market_price(
                    species_id=alert.get("species_id"),
                    breed_id=alert.get("breed_id"),
                    location=alert.get("location")
                )
                
                if current_price is None:
                    continue
                
                # Check if alert should be triggered
                should_trigger = False
                trigger_message = ""
                
                if alert["alert_type"] == AlertType.PRICE_DROP and alert.get("target_price"):
                    if current_price <= alert["target_price"]:
                        should_trigger = True
                        trigger_message = f"Price dropped to R{current_price:,.2f} (target: R{alert['target_price']:,.2f})"
                
                elif alert["alert_type"] == AlertType.PRICE_TARGET and alert.get("target_price"):
                    if current_price >= alert["target_price"]:
                        should_trigger = True
                        trigger_message = f"Price reached R{current_price:,.2f} (target: R{alert['target_price']:,.2f})"
                
                elif alert["alert_type"] == AlertType.PERCENTAGE_CHANGE and alert.get("percentage_threshold"):
                    if alert.get("last_checked_price"):
                        price_change_percent = ((current_price - alert["last_checked_price"]) / alert["last_checked_price"]) * 100
                        if abs(price_change_percent) >= alert["percentage_threshold"]:
                            should_trigger = True
                            direction = "increased" if price_change_percent > 0 else "decreased"
                            trigger_message = f"Price {direction} by {abs(price_change_percent):.1f}% to R{current_price:,.2f}"
                
                # Trigger alert if conditions met
                if should_trigger:
                    await self._trigger_alert(alert, current_price, trigger_message)
                    triggered_count += 1
                
                # Update last checked price
                await self.price_alerts_collection.update_one(
                    {"id": alert["id"]},
                    {
                        "$set": {
                            "last_checked_price": current_price,
                            "current_price": current_price
                        }
                    }
                )
            
            logger.info(f"Alert check completed: {triggered_count} triggered out of {processed_count} processed")
            
            return {
                "success": True,
                "processed_alerts": processed_count,
                "triggered_alerts": triggered_count
            }
            
        except Exception as e:
            logger.error(f"Error checking alerts: {e}")
            return {
                "success": False,
                "message": "Failed to check alerts."
            }
    
    async def _trigger_alert(self, alert: Dict, current_price: float, trigger_message: str):
        """Trigger a specific alert and send notifications"""
        try:
            # Update alert record
            now = datetime.now(timezone.utc)
            await self.price_alerts_collection.update_one(
                {"id": alert["id"]},
                {
                    "$set": {
                        "last_triggered": now,
                        "status": AlertStatus.TRIGGERED,
                        "current_price": current_price
                    },
                    "$inc": {"trigger_count": 1}
                }
            )
            
            # Get user details
            user = await self.users_collection.find_one({"id": alert["user_id"]})
            if not user:
                return
            
            # Create notification record
            notification = {
                "id": self._generate_notification_id(),
                "user_id": alert["user_id"],
                "alert_id": alert["id"],
                "notification_type": alert["alert_type"],
                "title": f"🚨 {alert['title']}",
                "message": trigger_message,
                "channels_sent": [],
                "created_at": now
            }
            
            # Send notifications through configured channels
            channels_sent = []
            
            # Email notification
            if NotificationChannel.EMAIL in alert["channels"]:
                email_sent = await self.email_service.send_price_alert_notification(
                    user_email=user["email"],
                    user_name=user.get("full_name", "User"),
                    alert_title=alert["title"],
                    trigger_message=trigger_message,
                    current_price=current_price,
                    species=alert.get("species_id", ""),
                    location=alert.get("location", "")
                )
                if email_sent:
                    channels_sent.append(NotificationChannel.EMAIL)
            
            # In-app notification (always create)
            channels_sent.append(NotificationChannel.IN_APP)
            
            # Update notification with sent channels
            notification["channels_sent"] = channels_sent
            await self.notifications_collection.insert_one(notification)
            
            logger.info(f"Alert triggered: {alert['id']} for user {alert['user_id']}")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {e}")
    
    async def get_user_notifications(self, user_id: str, unread_only: bool = False, 
                                   limit: int = 50) -> Dict[str, Any]:
        """Get user's notifications"""
        try:
            query = {"user_id": user_id}
            if unread_only:
                query["read_at"] = None
            
            notifications = []
            cursor = self.notifications_collection.find(query).sort("created_at", -1).limit(limit)
            
            async for notif in cursor:
                notifications.append({
                    "id": notif["id"],
                    "alert_id": notif["alert_id"],
                    "notification_type": notif["notification_type"],
                    "title": notif["title"],
                    "message": notif["message"],
                    "created_at": notif["created_at"],
                    "read_at": notif.get("read_at"),
                    "clicked_at": notif.get("clicked_at")
                })
            
            # Get counts
            total_count = await self.notifications_collection.count_documents({"user_id": user_id})
            unread_count = await self.notifications_collection.count_documents({"user_id": user_id, "read_at": None})
            
            return {
                "success": True,
                "notifications": notifications,
                "total_count": total_count,
                "unread_count": unread_count
            }
            
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            return {
                "success": False,
                "notifications": [],
                "total_count": 0,
                "unread_count": 0
            }
    
    async def mark_notification_read(self, user_id: str, notification_id: str) -> Dict[str, Any]:
        """Mark notification as read"""
        try:
            result = await self.notifications_collection.update_one(
                {"id": notification_id, "user_id": user_id, "read_at": None},
                {"$set": {"read_at": datetime.now(timezone.utc)}}
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "message": "Notification marked as read."
                }
            else:
                return {
                    "success": False,
                    "message": "Notification not found or already read."
                }
                
        except Exception as e:
            logger.error(f"Error marking notification read: {e}")
            return {
                "success": False,
                "message": "Failed to mark notification as read."
            }
    
    async def update_price_alert(self, user_id: str, alert_id: str, 
                               update_data: PriceAlertUpdate) -> Dict[str, Any]:
        """Update price alert"""
        try:
            # Build update query
            update_fields = {}
            if update_data.title is not None:
                update_fields["title"] = update_data.title
            if update_data.description is not None:
                update_fields["description"] = update_data.description
            if update_data.target_price is not None:
                update_fields["target_price"] = update_data.target_price
            if update_data.percentage_threshold is not None:
                update_fields["percentage_threshold"] = update_data.percentage_threshold
            if update_data.frequency is not None:
                update_fields["frequency"] = update_data.frequency
            if update_data.channels is not None:
                update_fields["channels"] = update_data.channels
            if update_data.status is not None:
                update_fields["status"] = update_data.status
            
            if not update_fields:
                return {
                    "success": False,
                    "message": "No fields to update."
                }
            
            result = await self.price_alerts_collection.update_one(
                {"id": alert_id, "user_id": user_id},
                {"$set": update_fields}
            )
            
            if result.modified_count > 0:
                return {
                    "success": True,
                    "message": "Price alert updated successfully."
                }
            else:
                return {
                    "success": False,
                    "message": "Alert not found or no changes made."
                }
                
        except Exception as e:
            logger.error(f"Error updating price alert: {e}")
            return {
                "success": False,
                "message": "Failed to update price alert."
            }
    
    async def delete_price_alert(self, user_id: str, alert_id: str) -> Dict[str, Any]:
        """Delete price alert"""
        try:
            result = await self.price_alerts_collection.delete_one({
                "id": alert_id,
                "user_id": user_id
            })
            
            if result.deleted_count > 0:
                # Also delete related notifications
                await self.notifications_collection.delete_many({
                    "alert_id": alert_id,
                    "user_id": user_id
                })
                
                logger.info(f"Price alert deleted: {alert_id} for user {user_id}")
                
                return {
                    "success": True,
                    "message": "Price alert deleted successfully."
                }
            else:
                return {
                    "success": False,
                    "message": "Alert not found."
                }
                
        except Exception as e:
            logger.error(f"Error deleting price alert: {e}")
            return {
                "success": False,
                "message": "Failed to delete price alert."
            }
    
    async def get_price_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get price alert statistics for user"""
        try:
            # Basic counts
            total_alerts = await self.price_alerts_collection.count_documents({"user_id": user_id})
            active_alerts = await self.price_alerts_collection.count_documents({"user_id": user_id, "status": "active"})
            
            # Triggered alerts in last 30 days
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            recent_triggers = await self.price_alerts_collection.count_documents({
                "user_id": user_id,
                "last_triggered": {"$gte": thirty_days_ago}
            })
            
            # Unread notifications
            unread_notifications = await self.notifications_collection.count_documents({
                "user_id": user_id,
                "read_at": None
            })
            
            # Alert type breakdown
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": "$alert_type", "count": {"$sum": 1}}}
            ]
            
            alert_types = {}
            async for result in self.price_alerts_collection.aggregate(pipeline):
                alert_types[result["_id"]] = result["count"]
            
            return {
                "total_alerts": total_alerts,
                "active_alerts": active_alerts,
                "recent_triggers_30d": recent_triggers,
                "unread_notifications": unread_notifications,
                "alert_type_breakdown": alert_types
            }
            
        except Exception as e:
            logger.error(f"Error getting price statistics: {e}")
            return {}