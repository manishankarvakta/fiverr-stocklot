"""
FastAPI Endpoint Inventory Service
Collects all routes and SSE topics for communication auditing
"""

import os
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI
from fastapi.routing import APIRoute, APIRouter
import logging

logger = logging.getLogger(__name__)

class EndpointInventory:
    """Service to collect and manage API endpoint inventory"""
    
    def __init__(self):
        self.endpoints: List[Dict[str, Any]] = []
        self.sse_topics: List[str] = []
    
    def collect_fastapi_endpoints(self, app: FastAPI) -> List[Dict[str, Any]]:
        """
        Collect all FastAPI routes from the application
        """
        endpoints = []
        
        def extract_routes(routes, prefix=""):
            for route in routes:
                if isinstance(route, APIRoute):
                    # Extract route information
                    path = prefix + route.path
                    methods = list(route.methods)
                    
                    # Get route metadata
                    endpoint_info = {
                        "method": methods,
                        "path": path,
                        "name": route.name,
                        "summary": getattr(route, 'summary', None),
                        "description": getattr(route, 'description', None),
                        "tags": getattr(route, 'tags', []),
                        "deprecated": getattr(route, 'deprecated', False)
                    }
                    
                    # Add middleware info if available
                    if hasattr(route, 'dependencies') and route.dependencies:
                        endpoint_info["middleware"] = [
                            dep.dependency.__name__ if callable(dep.dependency) else str(dep.dependency)
                            for dep in route.dependencies
                        ]
                    
                    endpoints.append(endpoint_info)
                
                elif hasattr(route, 'routes'):
                    # Handle sub-routers (like APIRouter mounts)
                    sub_prefix = prefix
                    if hasattr(route, 'path_regex'):
                        # Extract prefix from router mount
                        path_info = getattr(route, 'path', '')
                        if path_info:
                            sub_prefix = prefix + path_info.rstrip('/{path:path}')
                    
                    extract_routes(route.routes, sub_prefix)
        
        # Start extraction from main app routes
        extract_routes(app.routes)
        
        # Sort by path for consistent output
        endpoints.sort(key=lambda x: (x['path'], x['method']))
        
        self.endpoints = endpoints
        return endpoints
    
    def register_sse_topic(self, topic: str, description: str = ""):
        """Register an SSE topic"""
        if topic not in self.sse_topics:
            self.sse_topics.append(topic)
            logger.info(f"Registered SSE topic: {topic}")
    
    def get_sse_topics(self) -> List[str]:
        """Get all registered SSE topics"""
        return sorted(self.sse_topics)
    
    def export_inventory(self) -> Dict[str, Any]:
        """Export complete endpoint inventory"""
        return {
            "endpoints": self.endpoints,
            "sse_topics": self.get_sse_topics(),
            "stats": {
                "total_endpoints": len(self.endpoints),
                "total_sse_topics": len(self.sse_topics),
                "methods": list(set([method for ep in self.endpoints for method in ep['method']])),
                "unique_paths": len(set([ep['path'] for ep in self.endpoints]))
            }
        }
    
    def save_inventory(self, filepath: str):
        """Save inventory to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.export_inventory(), f, indent=2, default=str)
        logger.info(f"Saved endpoint inventory to {filepath}")


# Global inventory instance
inventory = EndpointInventory()

# SSE Topics Registry - Single source of truth
SSE_TOPICS = [
    "admin.stats.updated",
    "admin.role.request.created", 
    "admin.role.request.approved",
    "admin.role.request.rejected",
    "admin.disease.zone.updated",
    "admin.fee.config.updated",
    "admin.feature.flag.updated",
    "orders.created",
    "orders.updated", 
    "orders.completed",
    "orders.cancelled",
    "checkout.preview.updated",
    "payments.initialized",
    "payments.completed",
    "payments.failed",
    "listings.created",
    "listings.updated",
    "listings.moderated",
    "buy_requests.created",
    "buy_requests.matched",
    "buy_requests.updated",
    "inbox.new_message",
    "inbox.thread_updated",
    "inbox.events",  # Added missing SSE topic
    "notifications.new",
    "escrow.updated",
    "shipping.updated",
    "seller.verification.updated",
    "system.maintenance",
    "heartbeat",
    "focus"  # Added missing SSE topic from frontend
]

# Register all SSE topics
for topic in SSE_TOPICS:
    inventory.register_sse_topic(topic)

def get_endpoint_inventory() -> EndpointInventory:
    """Get the global endpoint inventory instance"""
    return inventory