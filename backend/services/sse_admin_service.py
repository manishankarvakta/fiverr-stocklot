"""
Server-Sent Events (SSE) Admin Event Bus for StockLot Livestock Marketplace
Provides real-time updates for admin dashboard and monitoring
"""
import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum
import uuid

logger = logging.getLogger(__name__)

class SSEEventType(str, Enum):
    LISTING_STATUS_CHANGED = "LISTING.STATUS_CHANGED"
    DOCUMENT_VERIFIED = "DOC.VERIFIED"
    DOCUMENT_REJECTED = "DOC.REJECTED"
    ORDER_PAID = "ORDER.PAID"
    TRANSFER_SUCCESS = "TRANSFER.SUCCESS"
    TRANSFER_FAILED = "TRANSFER.FAILED"
    FEATURE_FLAG_UPDATED = "FEATURE_FLAG.UPDATED"
    USER_REGISTERED = "USER.REGISTERED"
    WEBHOOK_PROCESSED = "WEBHOOK.PROCESSED"
    SYSTEM_ALERT = "SYSTEM.ALERT"

@dataclass
class SSEEvent:
    event_type: SSEEventType
    data: Dict[str, Any]
    timestamp: datetime
    event_id: str = None
    retry: int = 3000  # 3 seconds retry
    
    def __post_init__(self):
        if self.event_id is None:
            self.event_id = str(uuid.uuid4())
    
    def to_sse_format(self) -> str:
        """Convert event to SSE format"""
        lines = []
        lines.append(f"id: {self.event_id}")
        lines.append(f"event: {self.event_type.value}")
        lines.append(f"retry: {self.retry}")
        
        # Format data as JSON
        data_json = json.dumps({
            "type": self.event_type.value,
            "data": self.data,
            "timestamp": self.timestamp.isoformat(),
            "event_id": self.event_id
        })
        
        lines.append(f"data: {data_json}")
        lines.append("")  # Empty line to end event
        
        return "\n".join(lines)

class SSEAdminService:
    def __init__(self, db):
        self.db = db
        self.active_connections: Dict[str, asyncio.Queue] = {}
        self.event_history: List[SSEEvent] = []
        self.max_history_size = 100
        
    async def register_client(self, client_id: str) -> asyncio.Queue:
        """Register a new SSE client"""
        if client_id in self.active_connections:
            # Close existing connection
            await self.unregister_client(client_id)
        
        # Create new queue for this client
        queue = asyncio.Queue(maxsize=50)  # Limit queued events
        self.active_connections[client_id] = queue
        
        logger.info(f"SSE client registered: {client_id}")
        
        # Send connection confirmation
        connection_event = SSEEvent(
            event_type=SSEEventType.SYSTEM_ALERT,
            data={
                "message": "Connected to StockLot admin event stream",
                "client_id": client_id,
                "connection_time": datetime.now(timezone.utc).isoformat()
            },
            timestamp=datetime.now(timezone.utc)
        )
        
        await self._queue_event_for_client(client_id, connection_event)
        
        return queue
    
    async def unregister_client(self, client_id: str):
        """Unregister an SSE client"""
        if client_id in self.active_connections:
            queue = self.active_connections[client_id]
            
            # Add a close event to the queue
            close_event = SSEEvent(
                event_type=SSEEventType.SYSTEM_ALERT,
                data={
                    "message": "Connection closing",
                    "client_id": client_id
                },
                timestamp=datetime.now(timezone.utc)
            )
            
            try:
                await self._queue_event_for_client(client_id, close_event)
            except:
                pass
            
            # Remove from active connections
            del self.active_connections[client_id]
            logger.info(f"SSE client unregistered: {client_id}")
    
    async def emit_event(self, event_type: SSEEventType, data: Dict[str, Any], persist: bool = True):
        """Emit an event to all connected admin clients"""
        event = SSEEvent(
            event_type=event_type,
            data=data,
            timestamp=datetime.now(timezone.utc)
        )
        
        # Add to history
        self.event_history.append(event)
        if len(self.event_history) > self.max_history_size:
            self.event_history.pop(0)
        
        # Persist to database if requested
        if persist:
            await self._persist_event(event)
        
        # Send to all connected clients
        await self._broadcast_event(event)
        
        logger.info(f"SSE event emitted: {event_type.value} to {len(self.active_connections)} clients")
    
    async def _queue_event_for_client(self, client_id: str, event: SSEEvent):
        """Queue an event for a specific client"""
        if client_id in self.active_connections:
            queue = self.active_connections[client_id]
            try:
                # Use put_nowait to avoid blocking
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(f"SSE queue full for client {client_id}, dropping event")
                # Remove oldest event and add new one
                try:
                    queue.get_nowait()
                    queue.put_nowait(event)
                except asyncio.QueueEmpty:
                    pass
    
    async def _broadcast_event(self, event: SSEEvent):
        """Broadcast event to all connected clients"""
        disconnected_clients = []
        
        for client_id in list(self.active_connections.keys()):
            try:
                await self._queue_event_for_client(client_id, event)
            except Exception as e:
                logger.error(f"Error sending event to client {client_id}: {str(e)}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            await self.unregister_client(client_id)
    
    async def _persist_event(self, event: SSEEvent):
        """Persist event to database for audit and replay"""
        try:
            event_doc = {
                "id": str(uuid.uuid4()),
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "data": event.data,
                "timestamp": event.timestamp,
                "created_at": datetime.now(timezone.utc),
                "persisted": True
            }
            
            await self.db.admin_events.insert_one(event_doc)
            
        except Exception as e:
            logger.error(f"Error persisting SSE event: {str(e)}")
    
    async def get_recent_events(self, limit: int = 50, event_types: List[str] = None) -> List[Dict[str, Any]]:
        """Get recent events from database"""
        try:
            query = {}
            if event_types:
                query["event_type"] = {"$in": event_types}
            
            events_docs = await self.db.admin_events.find(query).sort("timestamp", -1).limit(limit).to_list(length=None)
            
            events = []
            for doc in events_docs:
                doc.pop("_id", None)
                events.append(doc)
            
            return events
            
        except Exception as e:
            logger.error(f"Error getting recent events: {str(e)}")
            return []
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get SSE connection statistics"""
        return {
            "active_connections": len(self.active_connections),
            "connected_clients": list(self.active_connections.keys()),
            "events_in_history": len(self.event_history),
            "last_event": self.event_history[-1].timestamp.isoformat() if self.event_history else None,
            "uptime": datetime.now(timezone.utc).isoformat()
        }

# Business Logic Event Emitters
class AdminEventEmitters:
    def __init__(self, sse_service: SSEAdminService, db):
        self.sse_service = sse_service
        self.db = db
    
    async def emit_listing_status_change(self, listing_id: str, old_status: str, new_status: str, user_id: str = None):
        """Emit listing status change event"""
        # Get listing details
        listing = await self.db.listings.find_one({"id": listing_id})
        
        await self.sse_service.emit_event(
            SSEEventType.LISTING_STATUS_CHANGED,
            {
                "listing_id": listing_id,
                "listing_title": listing.get("title", "Unknown") if listing else "Unknown",
                "old_status": old_status,
                "new_status": new_status,
                "updated_by": user_id,
                "listing_type": listing.get("product_type", "Unknown") if listing else "Unknown"
            }
        )
    
    async def emit_document_verification(self, document_id: str, document_type: str, status: str, user_id: str, reason: str = None):
        """Emit document verification event"""
        await self.sse_service.emit_event(
            SSEEventType.DOCUMENT_VERIFIED if status == "verified" else SSEEventType.DOCUMENT_REJECTED,
            {
                "document_id": document_id,
                "document_type": document_type,
                "status": status,
                "user_id": user_id,
                "reason": reason,
                "verified_by": user_id
            }
        )
    
    async def emit_order_paid(self, order_id: str, amount: int, currency: str = "ZAR", buyer_id: str = None):
        """Emit order paid event"""
        # Get order details
        order = await self.db.orders.find_one({"id": order_id})
        
        await self.sse_service.emit_event(
            SSEEventType.ORDER_PAID,
            {
                "order_id": order_id,
                "amount": amount,
                "amount_zar": amount / 100.0,
                "currency": currency,
                "buyer_id": buyer_id,
                "seller_id": order.get("seller_id") if order else None,
                "order_total": order.get("total_amount") if order else amount
            }
        )
    
    async def emit_transfer_status(self, transfer_id: str, status: str, amount: int, recipient_name: str = None, failure_reason: str = None):
        """Emit transfer status event"""
        event_type = SSEEventType.TRANSFER_SUCCESS if status == "success" else SSEEventType.TRANSFER_FAILED
        
        await self.sse_service.emit_event(
            event_type,
            {
                "transfer_id": transfer_id,
                "status": status,
                "amount": amount,
                "amount_zar": amount / 100.0,
                "recipient_name": recipient_name,
                "failure_reason": failure_reason
            }
        )
    
    async def emit_feature_flag_update(self, flag_key: str, enabled: bool, updated_by: str):
        """Emit feature flag update event"""
        await self.sse_service.emit_event(
            SSEEventType.FEATURE_FLAG_UPDATED,
            {
                "flag_key": flag_key,
                "enabled": enabled,
                "updated_by": updated_by,
                "description": f"Feature flag '{flag_key}' {'enabled' if enabled else 'disabled'}"
            }
        )
    
    async def emit_user_registration(self, user_id: str, email: str, full_name: str, roles: List[str]):
        """Emit user registration event"""
        await self.sse_service.emit_event(
            SSEEventType.USER_REGISTERED,
            {
                "user_id": user_id,
                "email": email,
                "full_name": full_name,
                "roles": roles,
                "is_seller": "seller" in roles,
                "is_buyer": "buyer" in roles
            }
        )
    
    async def emit_webhook_processed(self, webhook_type: str, event_id: str, status: str, processing_time_ms: int = None):
        """Emit webhook processed event"""
        await self.sse_service.emit_event(
            SSEEventType.WEBHOOK_PROCESSED,
            {
                "webhook_type": webhook_type,
                "event_id": event_id,
                "status": status,
                "processing_time_ms": processing_time_ms,
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
        )
    
    async def emit_system_alert(self, alert_type: str, message: str, severity: str = "info", details: Dict[str, Any] = None):
        """Emit system alert event"""
        await self.sse_service.emit_event(
            SSEEventType.SYSTEM_ALERT,
            {
                "alert_type": alert_type,
                "message": message,
                "severity": severity,
                "details": details or {},
                "requires_action": severity in ["warning", "error", "critical"]
            }
        )