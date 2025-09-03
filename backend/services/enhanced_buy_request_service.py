import os
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import json

from ai_enhanced_service import AIEnhancedService, ModerationCategory, MatchingScore
from mapbox_service import MapboxService
from buy_request_service import BuyRequestService, BuyRequestStatus, ModerationStatus, OfferStatus

logger = logging.getLogger(__name__)

class EnhancedBuyRequestService(BuyRequestService):
    def __init__(self, db):
        super().__init__(db)
        self.ai_service = AIEnhancedService()
        self.mapbox_service = MapboxService()
        
    async def create_enhanced_buy_request(
        self,
        buyer_id: str,
        species: str,
        product_type: str,
        qty: int,
        unit: str,
        target_price: float = None,
        breed: str = None,
        province: str = None,
        country: str = "ZA",
        expires_at: datetime = None,
        notes: str = None,
        org_id: str = None,
        enable_ai_enhancements: bool = True,
        auto_generate_description: bool = False,
        # New enhanced fields
        images: list = None,
        vet_certificates: list = None,
        weight_range: dict = None,
        age_requirements: dict = None,
        vaccination_requirements: list = None,
        delivery_preferences: str = "both",
        inspection_allowed: bool = True,
        additional_requirements: str = None
    ) -> Dict[str, Any]:
        """Create a new buy request with AI and mapping enhancements"""
        
        request_id = str(uuid.uuid4())
        
        # Default expiry: 14 days from now
        if not expires_at:
            expires_at = datetime.now(timezone.utc) + timedelta(days=14)
        
        # Initialize enhanced data structures
        ai_analysis = {}
        location_data = {}
        price_suggestions = {}
        auto_content = {}
        categorization = {}
        
        if enable_ai_enhancements:
            # 1. Enhanced AI Content Moderation
            try:
                location_str = f"{province}, {country}" if province else country
                ai_analysis = await self.ai_service.enhanced_content_moderation(
                    content=notes or f"Looking for {qty} {unit} of {species}",
                    species=species,
                    price=target_price,
                    location=location_str
                )
                logger.info(f"AI moderation completed for request {request_id}")
            except Exception as e:
                logger.error(f"AI moderation failed: {e}")
                ai_analysis = {"category": "safe", "confidence": 50, "error": str(e)}
            
            # 2. AI Price Suggestions (get recent market data first)
            try:
                # Get recent market data for price analysis
                recent_requests = await self._get_recent_market_data(species, product_type, province)
                
                price_suggestions = await self.ai_service.generate_price_suggestions(
                    species=species,
                    product_type=product_type,
                    breed=breed,
                    location=province,
                    quantity=qty,
                    unit=unit,
                    market_data=recent_requests
                )
                logger.info(f"Price suggestions generated for request {request_id}")
            except Exception as e:
                logger.error(f"Price suggestions failed: {e}")
                price_suggestions = {"error": str(e)}
            
            # 3. Auto-generate enhanced description
            if auto_generate_description:
                try:
                    auto_content = await self.ai_service.generate_auto_description(
                        species=species,
                        product_type=product_type,
                        breed=breed,
                        quantity=qty,
                        unit=unit,
                        location=province,
                        target_price=target_price,
                        basic_notes=notes
                    )
                    
                    # Use AI-generated description if available
                    if auto_content.get('description'):
                        notes = auto_content['description']
                    
                    logger.info(f"Auto-description generated for request {request_id}")
                except Exception as e:
                    logger.error(f"Auto-description failed: {e}")
                    auto_content = {"error": str(e)}
        
        # 4. Geocode location for mapping features
        try:
            location_str = f"{province}, {country}" if province else country
            geocode_result = await self.mapbox_service.geocode_location(location_str, country)
            
            if geocode_result.get('success'):
                location_data = {
                    "coordinates": {
                        "longitude": geocode_result['longitude'],
                        "latitude": geocode_result['latitude']
                    },
                    "formatted_address": geocode_result.get('formatted_address'),
                    "place_name": geocode_result.get('place_name'),
                    "geocoded_at": geocode_result.get('geocoded_at')
                }
                logger.info(f"Location geocoded for request {request_id}")
            else:
                location_data = {"geocoding_error": geocode_result.get('error')}
        except Exception as e:
            logger.error(f"Geocoding failed: {e}")
            location_data = {"geocoding_error": str(e)}
        
        # 5. Smart categorization
        if enable_ai_enhancements:
            try:
                request_data = {
                    "species": species,
                    "product_type": product_type,
                    "breed": breed,
                    "qty": qty,
                    "unit": unit,
                    "target_price": target_price,
                    "province": province,
                    "country": country,
                    "notes": notes
                }
                
                categorization = await self.ai_service.smart_categorization(request_data)
                logger.info(f"Smart categorization completed for request {request_id}")
            except Exception as e:
                logger.error(f"Smart categorization failed: {e}")
                categorization = {"error": str(e)}
        
        # Determine moderation status based on AI analysis
        if ai_analysis.get('category') in ['spam', 'fraud', 'inappropriate']:
            moderation_status = ModerationStatus.PENDING_REVIEW
        elif ai_analysis.get('category') == 'suspicious':
            moderation_status = ModerationStatus.PENDING_REVIEW
        else:
            moderation_status = ModerationStatus.AUTO_PASS
        
        # Build enhanced buy request
        buy_request = {
            "id": request_id,
            "buyer_id": buyer_id,
            "org_id": org_id,
            "species": species,
            "breed": breed,
            "product_type": product_type,
            "qty": qty,
            "unit": unit,
            "target_price": target_price,
            "province": province,
            "country": country,
            "status": BuyRequestStatus.OPEN.value,
            "expires_at": expires_at,
            "notes": notes,
            "moderation_status": moderation_status.value,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            
            # Enhanced AI features
            "ai_analysis": ai_analysis,
            "price_suggestions": price_suggestions,
            "auto_content": auto_content,
            "categorization": categorization,
            
            # Mapping features
            "location_data": location_data,
            
            # Feature flags
            "ai_enhanced": enable_ai_enhancements,
            "version": "2.0"
        }
        
        await self.db.buy_requests.insert_one(buy_request)
        
        # Trigger intelligent notifications to nearby sellers
        if location_data.get('coordinates'):
            await self._notify_nearby_sellers_enhanced(buy_request)
        
        # Remove MongoDB _id
        if "_id" in buy_request:
            del buy_request["_id"]
            
        return buy_request
    
    async def create_enhanced_offer(
        self,
        request_id: str,
        seller_id: str,
        offer_price: float,
        qty: int,
        message: str = None,
        listing_id: str = None,
        org_id: str = None,
        enable_ai_matching: bool = True
    ) -> Dict[str, Any]:
        """Create an enhanced offer with AI matching score"""
        
        # First create the basic offer
        offer = await super().create_offer(
            request_id, seller_id, offer_price, qty, message, listing_id, org_id
        )
        
        if enable_ai_matching:
            try:
                # Get buy request details
                buy_request = await self.get_buy_request_by_id(request_id)
                if not buy_request:
                    raise ValueError("Buy request not found")
                
                # Get seller profile
                seller = await self.db.users.find_one({"id": seller_id})
                if not seller:
                    raise ValueError("Seller not found")
                
                # Generate AI matching score
                matching_analysis = await self.ai_service.generate_smart_matching_score(
                    buy_request=buy_request,
                    seller_profile=seller,
                    offer_details={
                        "offer_price": offer_price,
                        "qty": qty,
                        "message": message
                    }
                )
                
                # Calculate distance if both locations are available
                distance_analysis = {}
                if (buy_request.get('location_data', {}).get('coordinates') and 
                    seller.get('location_data', {}).get('coordinates')):
                    
                    buyer_coords = buy_request['location_data']['coordinates']
                    seller_coords = seller['location_data']['coordinates']
                    
                    distance_result = await self.mapbox_service.calculate_delivery_distance(
                        seller_location=(seller_coords['longitude'], seller_coords['latitude']),
                        buyer_location=(buyer_coords['longitude'], buyer_coords['latitude'])
                    )
                    
                    if distance_result.get('success'):
                        distance_analysis = distance_result
                
                # Update offer with AI analysis
                enhanced_data = {
                    "ai_matching": matching_analysis,
                    "distance_analysis": distance_analysis,
                    "enhanced_at": datetime.now(timezone.utc).isoformat()
                }
                
                await self.db.buy_request_offers.update_one(
                    {"id": offer["id"]},
                    {"$set": {"ai_enhanced_data": enhanced_data}}
                )
                
                offer["ai_enhanced_data"] = enhanced_data
                logger.info(f"AI matching completed for offer {offer['id']}")
                
            except Exception as e:
                logger.error(f"AI matching failed for offer {offer['id']}: {e}")
                # Continue without AI enhancement
        
        return offer
    
    async def get_intelligent_matches(
        self,
        seller_id: str,
        max_distance_km: float = 200,
        min_matching_score: int = 60,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get intelligently matched buy requests for a seller"""
        
        try:
            # Get seller profile and location
            seller = await self.db.users.find_one({"id": seller_id})
            if not seller:
                return []
            
            seller_coords = seller.get('location_data', {}).get('coordinates')
            if not seller_coords:
                # Fallback to province-based matching
                return await self.get_in_range_requests_for_seller(
                    seller_id=seller_id,
                    service_area={"provinces": seller.get('service_provinces', [])},
                    limit=limit
                )
            
            # Find nearby requests
            seller_location = (seller_coords['longitude'], seller_coords['latitude'])
            
            # Get all open requests with coordinates
            query = {
                "status": BuyRequestStatus.OPEN.value,
                "moderation_status": {"$in": [ModerationStatus.AUTO_PASS.value, ModerationStatus.APPROVED.value]},
                "location_data.coordinates": {"$exists": True}
            }
            
            cursor = self.db.buy_requests.find(query).limit(limit * 2)  # Get more to filter
            requests = await cursor.to_list(length=None)
            
            # Filter by distance and add AI scoring
            matched_requests = []
            
            for request in requests:
                if "_id" in request:
                    del request["_id"]
                
                req_coords = request['location_data']['coordinates']
                req_location = (req_coords['longitude'], req_coords['latitude'])
                
                # Calculate distance
                distance_result = await self.mapbox_service.calculate_delivery_distance(
                    seller_location=seller_location,
                    buyer_location=req_location
                )
                
                if (distance_result.get('success') and 
                    distance_result['distance_km'] <= max_distance_km):
                    
                    # Generate AI matching score
                    try:
                        matching_analysis = await self.ai_service.generate_smart_matching_score(
                            buy_request=request,
                            seller_profile=seller,
                            offer_details={"offer_price": request.get('target_price', 0)}
                        )
                        
                        if matching_analysis.get('overall_score', 0) >= min_matching_score:
                            request['distance_analysis'] = distance_result
                            request['ai_matching'] = matching_analysis
                            request['match_score'] = matching_analysis.get('overall_score', 0)
                            matched_requests.append(request)
                            
                    except Exception as e:
                        logger.error(f"AI scoring failed for request {request['id']}: {e}")
                        # Include without AI score
                        request['distance_analysis'] = distance_result
                        request['match_score'] = 75  # Default score
                        matched_requests.append(request)
            
            # Sort by combined score (AI matching + distance)
            def combined_score(req):
                ai_score = req.get('match_score', 75)
                distance_km = req.get('distance_analysis', {}).get('distance_km', 100)
                # Closer is better, normalize distance to 0-25 points
                distance_score = max(0, 25 - (distance_km / 10))
                return ai_score + distance_score
            
            matched_requests.sort(key=combined_score, reverse=True)
            
            return matched_requests[:limit]
            
        except Exception as e:
            logger.error(f"Intelligent matching failed: {e}")
            # Fallback to basic matching
            return await self.get_in_range_requests_for_seller(
                seller_id=seller_id,
                service_area={"provinces": ["Gauteng", "Western Cape"]},  # Default
                limit=limit
            )
    
    async def get_market_analytics(
        self,
        species: str = None,
        province: str = None,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """Get predictive market analytics"""
        
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            
            # Build query
            query = {
                "created_at": {"$gte": start_date},
                "ai_enhanced": True
            }
            
            if species:
                query["species"] = species
            if province:
                query["province"] = province
            
            # Aggregate data
            pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": {
                        "species": "$species",
                        "province": "$province",
                        "week": {"$week": "$created_at"}
                    },
                    "avg_target_price": {"$avg": "$target_price"},
                    "total_quantity": {"$sum": "$qty"},
                    "request_count": {"$sum": 1},
                    "avg_ai_confidence": {"$avg": "$price_suggestions.confidence"}
                }},
                {"$sort": {"_id.week": -1}}
            ]
            
            cursor = self.db.buy_requests.aggregate(pipeline)
            analytics_data = await cursor.to_list(length=None)
            
            # Calculate trends and insights
            trends = {
                "total_requests": len(analytics_data),
                "avg_price_trend": "stable",  # Calculate from data
                "demand_hotspots": [],
                "seasonal_insights": [],
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
            return {
                "success": True,
                "analytics": analytics_data,
                "trends": trends,
                "period_days": days_back
            }
            
        except Exception as e:
            logger.error(f"Market analytics failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def _get_recent_market_data(
        self,
        species: str,
        product_type: str,
        province: str = None,
        days_back: int = 30
    ) -> List[Dict[str, Any]]:
        """Get recent market data for price analysis"""
        
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            
            query = {
                "species": species,
                "product_type": product_type,
                "created_at": {"$gte": start_date},
                "target_price": {"$exists": True, "$ne": None}
            }
            
            if province:
                query["province"] = province
            
            cursor = self.db.buy_requests.find(query).sort("created_at", -1).limit(50)
            recent_data = await cursor.to_list(length=None)
            
            return [{
                "price": item.get("target_price"),
                "location": item.get("province"),
                "date": item.get("created_at"),
                "quantity": item.get("qty")
            } for item in recent_data]
            
        except Exception as e:
            logger.error(f"Market data retrieval failed: {e}")
            return []
    
    async def _notify_nearby_sellers_enhanced(self, buy_request: Dict[str, Any]):
        """Enhanced notification system with geofencing"""
        
        try:
            coordinates = buy_request.get('location_data', {}).get('coordinates')
            if not coordinates:
                return
            
            # Create geofence for this request
            geofence_result = await self.mapbox_service.create_geofence(
                center=(coordinates['longitude'], coordinates['latitude']),
                radius_km=100,  # 100km radius
                name=f"BuyRequest_{buy_request['id']}"
            )
            
            if not geofence_result.get('success'):
                logger.error("Failed to create geofence for notifications")
                return
            
            # Find sellers within geofence
            sellers_query = {
                "roles": {"$in": ["SELLER", "EXPORTER"]},
                "location_data.coordinates": {"$exists": True}
            }
            
            cursor = self.db.users.find(sellers_query)
            sellers = await cursor.to_list(length=None)
            
            notifications = []
            for seller in sellers:
                seller_coords = seller.get('location_data', {}).get('coordinates')
                if not seller_coords:
                    continue
                
                # Check if seller is in geofence
                seller_point = (seller_coords['longitude'], seller_coords['latitude'])
                if await self.mapbox_service.check_point_in_geofence(
                    seller_point, geofence_result['geofence']
                ):
                    # Calculate exact distance
                    distance_result = await self.mapbox_service.calculate_delivery_distance(
                        seller_location=seller_point,
                        buyer_location=(coordinates['longitude'], coordinates['latitude'])
                    )
                    
                    distance_km = distance_result.get('distance_km', 'Unknown')
                    
                    notification = {
                        "id": str(uuid.uuid4()),
                        "user_id": seller["id"],
                        "topic": "buy_request_nearby",
                        "title": f"New buy request: {buy_request['species']} ({distance_km}km away)",
                        "message": f"A buyer wants {buy_request['qty']} {buy_request['unit']} of {buy_request['species']} in {buy_request['province']}",
                        "action_url": f"/seller/requests/{buy_request['id']}",
                        "data": {
                            "buy_request_id": buy_request["id"],
                            "species": buy_request["species"],
                            "province": buy_request["province"],
                            "distance_km": distance_km,
                            "geofence_id": geofence_result['geofence']['properties']['name']
                        },
                        "status": "sent",
                        "created_at": datetime.now(timezone.utc),
                        "sent_at": datetime.now(timezone.utc)
                    }
                    notifications.append(notification)
            
            if notifications:
                await self.db.notifications.insert_many(notifications)
                logger.info(f"Sent {len(notifications)} enhanced notifications for request {buy_request['id']}")
            
        except Exception as e:
            logger.error(f"Enhanced notifications failed: {e}")
            # Fallback to basic notifications
            await super().notify_nearby_sellers(self.db, buy_request)