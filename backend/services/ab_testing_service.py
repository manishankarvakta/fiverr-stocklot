"""
A/B Testing Service for StockLot Platform
Manages PDP layout experiments and performance tracking
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import uuid
import hashlib
import random

logger = logging.getLogger(__name__)

class ABTestingService:
    def __init__(self, db):
        self.db = db
    
    async def create_experiment(self, name: str, description: str, variants: List[Dict],
                               traffic_split: Dict, duration_days: int = 30):
        """Create a new A/B test experiment"""
        try:
            experiment = {
                "id": str(uuid.uuid4()),
                "name": name,
                "description": description,
                "variants": variants,  # [{"id": "control", "name": "Original", "config": {...}}, ...]
                "traffic_split": traffic_split,  # {"control": 50, "variant_a": 50}
                "status": "draft",
                "start_date": None,
                "end_date": None,
                "duration_days": duration_days,
                "created_at": datetime.now(timezone.utc),
                "created_by": "admin",
                "results": {},
                "winner": None
            }
            
            await self.db.ab_experiments.insert_one(experiment)
            logger.info(f"Created A/B experiment: {name}")
            return experiment
            
        except Exception as e:
            logger.error(f"Error creating A/B experiment: {e}")
            return None
    
    async def start_experiment(self, experiment_id: str):
        """Start an A/B test experiment"""
        try:
            end_date = datetime.now(timezone.utc) + timedelta(days=30)  # Default 30 days
            
            result = await self.db.ab_experiments.update_one(
                {"id": experiment_id},
                {
                    "$set": {
                        "status": "active",
                        "start_date": datetime.now(timezone.utc),
                        "end_date": end_date
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error starting experiment: {e}")
            return False
    
    async def stop_experiment(self, experiment_id: str, winner: str = None):
        """Stop an A/B test experiment"""
        try:
            update_data = {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc)
            }
            
            if winner:
                update_data["winner"] = winner
            
            result = await self.db.ab_experiments.update_one(
                {"id": experiment_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error stopping experiment: {e}")
            return False
    
    def get_user_variant(self, experiment_id: str, user_identifier: str,
                        traffic_split: Dict) -> str:
        """Determine which variant to show a user"""
        try:
            # Create a hash of experiment_id + user_identifier for consistent assignment
            hash_input = f"{experiment_id}:{user_identifier}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest()[:8], 16)
            
            # Convert to percentage (0-99)
            percentage = hash_value % 100
            
            # Determine variant based on traffic split
            cumulative = 0
            for variant, split in traffic_split.items():
                cumulative += split
                if percentage < cumulative:
                    return variant
            
            # Fallback to first variant
            return list(traffic_split.keys())[0]
            
        except Exception as e:
            logger.error(f"Error determining user variant: {e}")
            return "control"
    
    async def get_active_experiments(self, experiment_type: str = "pdp_layout") -> List[Dict]:
        """Get all active experiments"""
        try:
            cursor = self.db.ab_experiments.find({
                "status": "active",
                "start_date": {"$lte": datetime.now(timezone.utc)},
                "end_date": {"$gte": datetime.now(timezone.utc)}
            })
            
            experiments = await cursor.to_list(length=100)
            return experiments
            
        except Exception as e:
            logger.error(f"Error fetching active experiments: {e}")
            return []
    
    async def track_experiment_event(self, experiment_id: str, variant: str,
                                   user_identifier: str, event_type: str,
                                   metadata: Dict = None):
        """Track an event for A/B testing"""
        try:
            event = {
                "id": str(uuid.uuid4()),
                "experiment_id": experiment_id,
                "variant": variant,
                "user_identifier": user_identifier,
                "event_type": event_type,  # "view", "click", "conversion", etc.
                "metadata": metadata or {},
                "timestamp": datetime.now(timezone.utc)
            }
            
            await self.db.ab_experiment_events.insert_one(event)
            return True
            
        except Exception as e:
            logger.error(f"Error tracking experiment event: {e}")
            return False
    
    async def get_experiment_results(self, experiment_id: str) -> Dict:
        """Get results for an A/B test experiment"""
        try:
            # Get experiment details
            experiment = await self.db.ab_experiments.find_one({"id": experiment_id})
            if not experiment:
                return {"error": "Experiment not found"}
            
            # Get event counts by variant
            results_pipeline = [
                {"$match": {"experiment_id": experiment_id}},
                {"$group": {
                    "_id": {
                        "variant": "$variant",
                        "event_type": "$event_type"
                    },
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_identifier"}
                }},
                {"$project": {
                    "variant": "$_id.variant",
                    "event_type": "$_id.event_type",
                    "count": 1,
                    "unique_users": {"$size": "$unique_users"}
                }}
            ]
            
            event_data = await self.db.ab_experiment_events.aggregate(results_pipeline).to_list(length=1000)
            
            # Process results
            variants_results = {}
            for item in event_data:
                variant = item["variant"]
                event_type = item["event_type"]
                
                if variant not in variants_results:
                    variants_results[variant] = {}
                
                variants_results[variant][event_type] = {
                    "count": item["count"],
                    "unique_users": item["unique_users"]
                }
            
            # Calculate conversion rates
            for variant, events in variants_results.items():
                views = events.get("view", {}).get("count", 0)
                conversions = events.get("conversion", {}).get("count", 0)
                
                variants_results[variant]["conversion_rate"] = (
                    (conversions / views * 100) if views > 0 else 0
                )
            
            return {
                "experiment": experiment,
                "results": variants_results,
                "total_participants": len(set(
                    event["user_identifier"] 
                    for event in await self.db.ab_experiment_events.find(
                        {"experiment_id": experiment_id}
                    ).to_list(length=10000)
                ))
            }
            
        except Exception as e:
            logger.error(f"Error getting experiment results: {e}")
            return {"error": str(e)}
    
    async def get_pdp_variant_config(self, listing_id: str, user_identifier: str) -> Dict:
        """Get PDP variant configuration for a user"""
        try:
            # Get active PDP experiments
            experiments = await self.get_active_experiments("pdp_layout")
            
            config = {
                "layout": "default",
                "show_seller_contact": True,
                "show_related_listings": True,
                "gallery_style": "thumbnails",
                "cta_button_style": "primary",
                "experiment_tracking": []
            }
            
            for experiment in experiments:
                variant = self.get_user_variant(
                    experiment["id"], 
                    user_identifier, 
                    experiment["traffic_split"]
                )
                
                # Find variant config
                variant_config = next(
                    (v["config"] for v in experiment["variants"] if v["id"] == variant),
                    {}
                )
                
                # Apply variant config
                config.update(variant_config)
                
                # Track experiment assignment
                config["experiment_tracking"].append({
                    "experiment_id": experiment["id"],
                    "variant": variant
                })
                
                # Track the view event
                await self.track_experiment_event(
                    experiment["id"], variant, user_identifier, "view",
                    {"listing_id": listing_id}
                )
            
            return config
            
        except Exception as e:
            logger.error(f"Error getting PDP variant config: {e}")
            return {"layout": "default", "experiment_tracking": []}

# Predefined experiment templates
PDP_EXPERIMENT_TEMPLATES = {
    "gallery_style": {
        "name": "PDP Gallery Style Test",
        "description": "Test different gallery layouts for product images",
        "variants": [
            {
                "id": "control",
                "name": "Thumbnail Gallery",
                "config": {"gallery_style": "thumbnails"}
            },
            {
                "id": "variant_a",
                "name": "Carousel Gallery",
                "config": {"gallery_style": "carousel"}
            }
        ],
        "traffic_split": {"control": 50, "variant_a": 50}
    },
    "cta_placement": {
        "name": "CTA Button Placement Test",
        "description": "Test different positions for Add to Cart button",
        "variants": [
            {
                "id": "control",  
                "name": "Right Side",
                "config": {"cta_placement": "right", "cta_style": "primary"}
            },
            {
                "id": "variant_a",
                "name": "Below Description",
                "config": {"cta_placement": "bottom", "cta_style": "large"}
            }
        ],
        "traffic_split": {"control": 50, "variant_a": 50}
    },
    "seller_info": {
        "name": "Seller Information Display Test",
        "description": "Test showing seller contact info vs. hidden until purchase",
        "variants": [
            {
                "id": "control",
                "name": "Hidden Contact",
                "config": {"show_seller_contact": False}
            },
            {
                "id": "variant_a", 
                "name": "Visible Contact",
                "config": {"show_seller_contact": True}
            }
        ],
        "traffic_split": {"control": 50, "variant_a": 50}
    }
}