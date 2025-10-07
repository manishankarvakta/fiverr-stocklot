"""
Development introspection endpoints for communication auditing
Only available in non-production environments
"""

import os
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any, List
from services.endpoint_inventory import get_endpoint_inventory, SSE_TOPICS
import logging

logger = logging.getLogger(__name__)

dev_router = APIRouter(prefix="/__introspection", tags=["Development"])

def check_dev_environment():
    """Ensure introspection is only available in development"""
    if os.environ.get('ENVIRONMENT', 'development') == 'production':
        raise HTTPException(status_code=403, detail="Introspection disabled in production")
    return True

@dev_router.get("/endpoints")
async def get_endpoints_inventory(
    request: Request,
    _: bool = Depends(check_dev_environment)
) -> Dict[str, Any]:
    """
    Get complete inventory of all FastAPI endpoints
    Available only in development/staging environments
    """
    try:
        inventory = get_endpoint_inventory()
        
        # If no endpoints collected yet, try to collect them now
        if len(inventory.endpoints) == 0:
            app = request.app
            if hasattr(app.state, 'inventory_initializer'):
                inventory = app.state.inventory_initializer()
            else:
                inventory.collect_fastapi_endpoints(app)
        
        return {
            "endpoints": inventory.endpoints,
            "stats": {
                "total_endpoints": len(inventory.endpoints),
                "unique_paths": len(set([ep['path'] for ep in inventory.endpoints])),
                "methods": list(set([method for ep in inventory.endpoints for method in ep['method']])),
            }
        }
    except Exception as e:
        logger.error(f"Error getting endpoints inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to get endpoints inventory")

@dev_router.get("/sse-topics")
async def get_sse_topics(
    _: bool = Depends(check_dev_environment)
) -> Dict[str, Any]:
    """
    Get all registered Server-Sent Events topics
    Available only in development/staging environments
    """
    try:
        inventory = get_endpoint_inventory()
        return {
            "topics": inventory.get_sse_topics(),
            "registry": SSE_TOPICS,  # Static registry for reference
            "stats": {
                "total_topics": len(inventory.get_sse_topics()),
                "registered_topics": len(SSE_TOPICS)
            }
        }
    except Exception as e:
        logger.error(f"Error getting SSE topics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get SSE topics")

@dev_router.get("/communication-summary")
async def get_communication_summary(
    _: bool = Depends(check_dev_environment)
) -> Dict[str, Any]:
    """
    Get complete communication summary for auditing
    """
    try:
        inventory = get_endpoint_inventory()
        
        # Categorize endpoints by type
        admin_endpoints = [ep for ep in inventory.endpoints if '/admin/' in ep['path']]
        api_endpoints = [ep for ep in inventory.endpoints if ep['path'].startswith('/api/') and '/admin/' not in ep['path']]
        public_endpoints = [ep for ep in inventory.endpoints if not ep['path'].startswith('/api/')]
        
        # Categorize SSE topics
        admin_topics = [topic for topic in SSE_TOPICS if topic.startswith('admin.')]
        user_topics = [topic for topic in SSE_TOPICS if not topic.startswith('admin.') and topic != 'heartbeat']
        system_topics = [topic for topic in SSE_TOPICS if topic in ['heartbeat', 'system.maintenance']]
        
        return {
            "endpoints": {
                "admin": admin_endpoints,
                "api": api_endpoints,
                "public": public_endpoints,
                "total": len(inventory.endpoints)
            },
            "sse_topics": {
                "admin": admin_topics,
                "user": user_topics,
                "system": system_topics,
                "total": len(SSE_TOPICS)
            },
            "coverage_hints": {
                "critical_endpoints": [
                    "/api/checkout/preview",
                    "/api/orders",
                    "/api/listings",
                    "/api/admin/moderation/stats",
                    "/api/admin/roles/requests"
                ],
                "high_frequency_topics": [
                    "heartbeat",
                    "orders.updated",
                    "admin.stats.updated",
                    "notifications.new"
                ]
            }
        }
    except Exception as e:
        logger.error(f"Error getting communication summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to get communication summary")

@dev_router.post("/refresh-inventory")
async def refresh_endpoint_inventory(
    _: bool = Depends(check_dev_environment)
) -> Dict[str, Any]:
    """
    Refresh the endpoint inventory by re-scanning the FastAPI app
    """
    try:
        # Get the app instance from the current request
        from fastapi import Request
        
        async def get_app_from_request(request: Request):
            return request.app
            
        # For now, use the current app context - this needs to be improved
        import inspect
        frame = inspect.currentframe()
        while frame:
            if 'app' in frame.f_locals and hasattr(frame.f_locals['app'], 'routes'):
                app = frame.f_locals['app']
                break
            frame = frame.f_back
        
        if 'app' not in locals():
            # Fallback: try to import from server.py  
            import sys
            if 'server' in sys.modules:
                app = sys.modules['server'].app
            else:
                raise Exception("Could not find FastAPI app instance")
                
        inventory = get_endpoint_inventory()
        endpoints = inventory.collect_fastapi_endpoints(app)
        
        return {
            "message": "Inventory refreshed successfully",
            "endpoints_found": len(endpoints),
            "sse_topics": len(inventory.get_sse_topics())
        }
    except Exception as e:
        logger.error(f"Error refreshing inventory: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh inventory: {str(e)}")

# Export the router
__all__ = ['dev_router']