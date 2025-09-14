"""
Price Alert Service - Price Tracking & Notifications
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models_expansion import PriceAlert, PriceAlertCreate, PriceAlertUpdate, AlertStatus, AlertType
import uuid

class PriceAlertService:
    def __init__(self):
        self.name = "PriceAlertService"
        # Mock in-memory storage
        self.price_alerts = {}
        self._init_sample_alerts()
    
    def _init_sample_alerts(self):
        """Initialize with sample price alerts."""
        sample_alerts = [
            {
                "id": str(uuid.uuid4()),
                "user_id": "user-123",
                "alert_type": AlertType.PRICE_DROP,
                "search_query": "Angus cattle",
                "category": "cattle",
                "target_price": 20000.0,
                "current_price": 25000.0,
                "status": AlertStatus.ACTIVE,
                "email_notifications": True,
                "push_notifications": False,
                "expires_at": datetime.utcnow() + timedelta(days=30),
                "created_at": datetime.utcnow() - timedelta(days=5)
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": "user-123",
                "alert_type": AlertType.AVAILABILITY,
                "search_query": "Broiler chickens",
                "category": "poultry",
                "target_price": 150.0,
                "current_price": None,
                "status": AlertStatus.ACTIVE,
                "email_notifications": True,
                "push_notifications": True,
                "expires_at": datetime.utcnow() + timedelta(days=14),
                "created_at": datetime.utcnow() - timedelta(days=3)
            }
        ]
        
        for alert_data in sample_alerts:
            alert = PriceAlert(**alert_data)
            self.price_alerts[alert.id] = alert
    
    async def get_user_alerts(
        self,
        user_id: str,
        status: Optional[AlertStatus] = None,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[PriceAlert]:
        """Get price alerts for a user with filters."""
        
        user_alerts = [
            alert for alert in self.price_alerts.values()
            if alert.user_id == user_id
        ]
        
        # Apply filters
        if status:
            user_alerts = [alert for alert in user_alerts if alert.status == status]
        
        if category and category != "all":
            user_alerts = [alert for alert in user_alerts if alert.category == category]
        
        if search:
            search_lower = search.lower()
            user_alerts = [
                alert for alert in user_alerts
                if (alert.search_query and search_lower in alert.search_query.lower())
            ]
        
        # Sort by created date
        user_alerts.sort(key=lambda x: x.created_at, reverse=True)
        
        return user_alerts
    
    async def create_alert(self, user_id: str, alert_data: PriceAlertCreate) -> PriceAlert:
        """Create a new price alert."""
        
        alert = PriceAlert(
            user_id=user_id,
            **alert_data.dict()
        )
        
        self.price_alerts[alert.id] = alert
        return alert
    
    async def update_alert(
        self,
        alert_id: str,
        user_id: str,
        update_data: PriceAlertUpdate
    ) -> Optional[PriceAlert]:
        """Update an existing price alert."""
        
        alert = self.price_alerts.get(alert_id)
        if not alert or alert.user_id != user_id:
            return None
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(alert, field, value)
        
        alert.updated_at = datetime.utcnow()
        return alert
    
    async def delete_alert(self, alert_id: str, user_id: str) -> bool:
        """Delete a price alert."""
        
        alert = self.price_alerts.get(alert_id)
        if not alert or alert.user_id != user_id:
            return False
        
        del self.price_alerts[alert_id]
        return True
    
    async def get_alert_stats(self, user_id: str) -> Dict[str, Any]:
        """Get price alert statistics for a user."""
        
        user_alerts = [
            alert for alert in self.price_alerts.values()
            if alert.user_id == user_id
        ]
        
        active_alerts = len([a for a in user_alerts if a.status == AlertStatus.ACTIVE])
        triggered_this_month = len([
            a for a in user_alerts 
            if a.status == AlertStatus.TRIGGERED and 
               a.triggered_at and 
               a.triggered_at > datetime.utcnow() - timedelta(days=30)
        ])
        
        # Calculate potential savings (mock)
        potential_savings = sum(
            (alert.current_price - alert.target_price) if alert.current_price and alert.current_price > alert.target_price else 0
            for alert in user_alerts
        )
        
        # Calculate success rate (mock)
        total_alerts = len(user_alerts)
        triggered_alerts = len([a for a in user_alerts if a.status == AlertStatus.TRIGGERED])
        success_rate = triggered_alerts / total_alerts if total_alerts > 0 else 0
        
        return {
            "active_alerts": active_alerts,
            "triggered_this_month": triggered_this_month,
            "potential_savings": potential_savings,
            "success_rate": success_rate,
            "total_alerts": total_alerts
        }
    
    async def check_alerts(self) -> List[Dict[str, Any]]:
        """Check all active alerts for triggers."""
        
        triggered_alerts = []
        
        for alert in self.price_alerts.values():
            if alert.status != AlertStatus.ACTIVE:
                continue
                
            # Check if expired
            if alert.expires_at and alert.expires_at < datetime.utcnow():
                alert.status = AlertStatus.EXPIRED
                continue
            
            # Mock price checking - in production, check real prices
            should_trigger = await self._should_trigger_alert(alert)
            
            if should_trigger:
                alert.status = AlertStatus.TRIGGERED
                alert.triggered_at = datetime.utcnow()
                
                triggered_alerts.append({
                    "alert_id": alert.id,
                    "user_id": alert.user_id,
                    "alert_type": alert.alert_type,
                    "search_query": alert.search_query,
                    "target_price": alert.target_price,
                    "current_price": alert.current_price,
                    "message": f"Price alert triggered for {alert.search_query}"
                })
        
        return triggered_alerts
    
    async def _should_trigger_alert(self, alert: PriceAlert) -> bool:
        """Check if an alert should be triggered."""
        
        # Mock price checking logic
        import random
        
        if alert.alert_type == AlertType.PRICE_DROP:
            # Simulate price drop detection
            mock_current_price = alert.target_price * random.uniform(0.8, 1.2)
            alert.current_price = mock_current_price
            return mock_current_price <= alert.target_price
        
        elif alert.alert_type == AlertType.AVAILABILITY:
            # Simulate availability check
            return random.random() < 0.1  # 10% chance of triggering
        
        elif alert.alert_type == AlertType.NEW_LISTING:
            # Simulate new listing detection
            return random.random() < 0.05  # 5% chance of triggering
        
        return False