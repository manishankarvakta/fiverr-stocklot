"""
Notification Event Service - Handles event emission and listener registration
This service manages the event bus for notifications
"""

import asyncio
import logging
from typing import Dict, Callable, List, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class NotificationEventService:
    """Event bus service for notification system"""
    
    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}
        
    def on(self, event_type: str, handler: Callable):
        """Register event listener"""
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(handler)
        logger.info(f"Registered listener for event: {event_type}")
    
    async def emit(self, event_type: str, payload: Dict[str, Any]):
        """Emit event to all registered listeners"""
        try:
            if event_type not in self._listeners:
                logger.debug(f"No listeners for event type: {event_type}")
                return
            
            handlers = self._listeners[event_type]
            logger.info(f"Emitting {event_type} to {len(handlers)} listeners")
            
            # Run all handlers concurrently
            tasks = []
            for handler in handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        tasks.append(handler(payload))
                    else:
                        # Run sync handler in thread pool
                        tasks.append(asyncio.get_event_loop().run_in_executor(
                            None, handler, payload
                        ))
                except Exception as e:
                    logger.error(f"Error preparing handler for {event_type}: {e}")
            
            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Log any errors
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        logger.error(f"Handler {i} failed for {event_type}: {result}")
                
        except Exception as e:
            logger.error(f"Error emitting event {event_type}: {e}")
    
    def remove_listener(self, event_type: str, handler: Callable):
        """Remove event listener"""
        if event_type in self._listeners:
            try:
                self._listeners[event_type].remove(handler)
                if not self._listeners[event_type]:
                    del self._listeners[event_type]
                logger.info(f"Removed listener for event: {event_type}")
            except ValueError:
                logger.warning(f"Handler not found for event: {event_type}")
    
    def get_listener_count(self, event_type: str) -> int:
        """Get number of listeners for event type"""
        return len(self._listeners.get(event_type, []))
    
    def get_all_events(self) -> List[str]:
        """Get list of all registered event types"""
        return list(self._listeners.keys())

# Global event bus instance
event_bus = NotificationEventService()

# Event type constants
class NotificationEvents:
    BUY_REQUEST_CREATED = "buy_request.created"
    LISTING_CREATED = "listing.created"
    OFFER_RECEIVED = "offer.received"
    OFFER_ACCEPTED = "offer.accepted"
    ORDER_PAID = "order.paid"
    DOCUMENT_EXPIRING = "document.expiring"
    DOCUMENT_REJECTED = "document.rejected"

# Convenience functions for common events
async def emit_buy_request_created(
    request_id: str,
    buyer_id: str, 
    species: str,
    province: str = None,
    title: str = "",
    quantity: int = 0,
    url: str = ""
):
    """Emit buy request created event"""
    await event_bus.emit(NotificationEvents.BUY_REQUEST_CREATED, {
        "event_type": "buy_request.created",
        "request_id": request_id,
        "user_id": buyer_id,
        "species": species,
        "province": province,
        "title": title,
        "quantity": quantity,
        "url": url or f"/buy-requests/{request_id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def emit_listing_created(
    listing_id: str,
    seller_id: str,
    species: str, 
    province: str = None,
    title: str = "",
    price: float = 0,
    url: str = ""
):
    """Emit listing created event"""
    await event_bus.emit(NotificationEvents.LISTING_CREATED, {
        "event_type": "listing.created",
        "listing_id": listing_id,
        "user_id": seller_id,
        "species": species,
        "province": province,
        "title": title,
        "price": price,
        "url": url or f"/listing/{listing_id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def emit_offer_received(
    offer_id: str,
    request_id: str,
    buyer_id: str,
    seller_id: str,
    price: float,
    quantity: int
):
    """Emit offer received event"""
    await event_bus.emit(NotificationEvents.OFFER_RECEIVED, {
        "event_type": "offer.received",
        "offer_id": offer_id,
        "request_id": request_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "price": price,
        "quantity": quantity,
        "url": f"/buy-requests/{request_id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def emit_offer_accepted(
    offer_id: str,
    request_id: str,
    buyer_id: str,
    seller_id: str,
    total_value: float
):
    """Emit offer accepted event"""
    await event_bus.emit(NotificationEvents.OFFER_ACCEPTED, {
        "event_type": "offer.accepted",
        "offer_id": offer_id,
        "request_id": request_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "total_value": total_value,
        "url": f"/buy-requests/{request_id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def emit_order_paid(
    order_id: str,
    buyer_id: str,
    seller_id: str,
    amount: float
):
    """Emit order paid event"""
    await event_bus.emit(NotificationEvents.ORDER_PAID, {
        "event_type": "order.paid",
        "order_id": order_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "amount": amount,
        "url": f"/orders/{order_id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

def register_notification_listeners(notification_service):
    """Register all notification event listeners"""
    # Import models directly to avoid import issues
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
    
    from notification_models import NotificationEvent
    
    async def handle_buy_request_created(payload):
        """Handle buy request created event"""
        event = NotificationEvent(
            event_type=payload["event_type"],
            request_id=payload["request_id"],
            species=payload["species"],
            province=payload.get("province"),
            title=payload["title"],
            url=payload["url"],
            user_id=payload["user_id"],
            quantity=payload.get("quantity")
        )
        await notification_service.on_buy_request_created(event)
    
    async def handle_listing_created(payload):
        """Handle listing created event"""
        event = NotificationEvent(
            event_type=payload["event_type"],
            listing_id=payload["listing_id"],
            species=payload["species"],
            province=payload.get("province"),
            title=payload["title"],
            url=payload["url"],
            user_id=payload["user_id"],
            price=payload.get("price")
        )
        await notification_service.on_listing_created(event)
    
    # Register listeners
    event_bus.on(NotificationEvents.BUY_REQUEST_CREATED, handle_buy_request_created)
    event_bus.on(NotificationEvents.LISTING_CREATED, handle_listing_created)
    
    logger.info("Notification event listeners registered successfully")

# Initialize function to be called from main server
def initialize_notification_events(notification_service):
    """Initialize notification event system"""
    register_notification_listeners(notification_service)  
    logger.info("Notification event system initialized")