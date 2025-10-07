"""
Server-Sent Events (SSE) Service
Handles real-time communication with clients
"""

import json
import logging
from typing import Dict, Set, Any
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
import asyncio

logger = logging.getLogger(__name__)

class SSEService:
    def __init__(self):
        # Map of user_id -> set of Response objects
        self.clients: Dict[str, Set[Response]] = {}
        
    def add_client(self, user_id: str, response: Response) -> None:
        """Add a client connection"""
        if user_id not in self.clients:
            self.clients[user_id] = set()
        self.clients[user_id].add(response)
        logger.info(f"Added SSE client for user {user_id}. Total clients: {len(self.clients[user_id])}")
    
    def remove_client(self, user_id: str, response: Response) -> None:
        """Remove a client connection"""
        if user_id in self.clients:
            self.clients[user_id].discard(response)
            if not self.clients[user_id]:
                del self.clients[user_id]
        logger.info(f"Removed SSE client for user {user_id}")
    
    def push_to_user(self, user_id: str, event: str, data: Any) -> None:
        """Push an event to all connections for a user"""
        if user_id not in self.clients:
            return
        
        message = f"event: {event}\ndata: {json.dumps(data)}\n\n"
        
        # Remove closed connections while sending
        closed_connections = set()
        
        for response in self.clients[user_id].copy():
            try:
                response.write(message.encode())
            except Exception as e:
                logger.warning(f"Failed to send SSE to user {user_id}: {e}")
                closed_connections.add(response)
        
        # Clean up closed connections
        for response in closed_connections:
            self.remove_client(user_id, response)
    
    def push_to_multiple_users(self, user_ids: list, event: str, data: Any) -> None:
        """Push an event to multiple users"""
        for user_id in user_ids:
            self.push_to_user(user_id, event, data)
    
    async def create_event_stream(self, request: Request, user_id: str):
        """Create an SSE stream for a user"""
        
        async def event_generator():
            # Send initial connection confirmation
            yield f"event: connected\ndata: {json.dumps({'status': 'connected', 'user_id': user_id})}\n\n"
            
            # Keep connection alive and handle disconnection
            try:
                while True:
                    # Check if client is still connected
                    if await request.is_disconnected():
                        break
                    
                    # Send heartbeat every 30 seconds
                    yield f"event: heartbeat\ndata: {json.dumps({'timestamp': str(asyncio.get_event_loop().time())})}\n\n"
                    await asyncio.sleep(30)
                    
            except asyncio.CancelledError:
                pass
            except Exception as e:
                logger.error(f"SSE stream error for user {user_id}: {e}")
            finally:
                logger.info(f"SSE stream ended for user {user_id}")
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )

# Global SSE service instance
sse_service = SSEService()

# Event types
class InboxEvents:
    MESSAGE_NEW = "message:new"
    MESSAGE_READ = "message:read"
    CONVERSATION_CREATED = "conversation:created"
    CONVERSATION_UPDATED = "conversation:updated"
    TYPING_START = "typing:start"
    TYPING_STOP = "typing:stop"
    USER_ONLINE = "user:online"
    USER_OFFLINE = "user:offline"