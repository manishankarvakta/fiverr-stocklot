import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import json

logger = logging.getLogger(__name__)

class BuyRequestStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    FULFILLED = "fulfilled"

class ModerationStatus(str, Enum):
    AUTO_PASS = "auto_pass"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"

class OfferStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class BuyRequestService:
    def __init__(self, db):
        self.db = db
        
    async def create_buy_request(
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
        """Create a new buy request"""
        
        request_id = str(uuid.uuid4())
        
        # Default expiry: 14 days from now
        if not expires_at:
            expires_at = datetime.now(timezone.utc) + timedelta(days=14)
        
        # Basic content moderation
        moderation_score = 0
        moderation_reasons = []
        
        if notes:
            # Simple spam detection
            spam_keywords = ['viagra', 'crypto', 'bitcoin', 'click here', 'make money']
            for keyword in spam_keywords:
                if keyword.lower() in notes.lower():
                    moderation_score += 5
                    moderation_reasons.append(f"Contains spam keyword: {keyword}")
        
        # Auto-approve if score is low
        moderation_status = ModerationStatus.AUTO_PASS if moderation_score < 5 else ModerationStatus.PENDING_REVIEW
        
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
            "moderation_score": moderation_score,
            "moderation_reasons": moderation_reasons,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.buy_requests.insert_one(buy_request)
        
        # Remove MongoDB _id
        if "_id" in buy_request:
            del buy_request["_id"]
            
        return buy_request
    
    async def get_buy_requests(
        self,
        status: BuyRequestStatus = None,
        species: str = None,
        province: str = None,
        country: str = None,
        limit: int = 50,
        offset: int = 0,
        search_query: str = None,
        sort_by: str = "created_at"
    ) -> List[Dict[str, Any]]:
        """Get buy requests with filtering"""
        
        query = {}
        
        # Only show approved requests by default
        query["moderation_status"] = {"$in": [ModerationStatus.AUTO_PASS.value, ModerationStatus.APPROVED.value]}
        
        if status:
            query["status"] = status.value
        
        if species:
            query["species"] = species
            
        if province:
            query["province"] = province
            
        if country:
            query["country"] = country
            
        if search_query:
            query["$or"] = [
                {"notes": {"$regex": search_query, "$options": "i"}},
                {"breed": {"$regex": search_query, "$options": "i"}},
                {"product_type": {"$regex": search_query, "$options": "i"}}
            ]
        
        # Sort options
        sort_direction = -1  # Descending by default
        if sort_by == "price_asc":
            sort_field = "target_price"
            sort_direction = 1
        elif sort_by == "price_desc":
            sort_field = "target_price"
        elif sort_by == "expiring":
            sort_field = "expires_at"
            sort_direction = 1
        else:
            sort_field = "created_at"
        
        cursor = self.db.buy_requests.find(query).sort(sort_field, sort_direction).skip(offset).limit(limit)
        requests = await cursor.to_list(length=None)
        
        # Remove MongoDB _id fields
        for request in requests:
            if "_id" in request:
                del request["_id"]
                
        return requests
    
    async def get_buy_request_by_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get buy request by ID"""
        
        request = await self.db.buy_requests.find_one({"id": request_id})
        
        if request:
            if "_id" in request:
                del request["_id"]
                
        return request
    
    async def create_offer(
        self,
        request_id: str,
        seller_id: str,
        offer_price: float,
        qty: int,
        message: str = None,
        listing_id: str = None,
        org_id: str = None
    ) -> Dict[str, Any]:
        """Create an offer on a buy request"""
        
        # Verify the request exists and is open
        request = await self.get_buy_request_by_id(request_id)
        if not request:
            raise ValueError("Buy request not found")
        
        if request["status"] != BuyRequestStatus.OPEN.value:
            raise ValueError("Buy request is no longer open")
            
        # Check if seller already has a pending offer
        existing_offer = await self.db.buy_request_offers.find_one({
            "request_id": request_id,
            "seller_id": seller_id,
            "status": OfferStatus.PENDING.value
        })
        
        if existing_offer:
            raise ValueError("You already have a pending offer on this request")
        
        offer_id = str(uuid.uuid4())
        
        offer = {
            "id": offer_id,
            "request_id": request_id,
            "seller_id": seller_id,
            "org_id": org_id,
            "listing_id": listing_id,
            "offer_price": offer_price,
            "qty": qty,
            "message": message,
            "status": OfferStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.buy_request_offers.insert_one(offer)
        
        # Remove MongoDB _id
        if "_id" in offer:
            del offer["_id"]
            
        return offer
    
    async def get_offers_for_request(self, request_id: str) -> List[Dict[str, Any]]:
        """Get all offers for a buy request"""
        
        cursor = self.db.buy_request_offers.find({"request_id": request_id}).sort("created_at", -1)
        offers = await cursor.to_list(length=None)
        
        # Remove MongoDB _id fields and enrich with seller info
        for offer in offers:
            if "_id" in offer:
                del offer["_id"]
                
            # Get seller name (simplified - would normally join with users)
            seller = await self.db.users.find_one({"id": offer["seller_id"]})
            if seller:
                offer["seller_name"] = seller.get("full_name", "Verified Seller")
            else:
                offer["seller_name"] = "Verified Seller"
                
        return offers
    
    async def accept_offer(
        self,
        request_id: str,
        offer_id: str,
        buyer_id: str
    ) -> Dict[str, Any]:
        """Accept an offer (this will trigger order creation)"""
        
        # Verify request belongs to buyer
        request = await self.db.buy_requests.find_one({
            "id": request_id,
            "buyer_id": buyer_id,
            "status": BuyRequestStatus.OPEN.value
        })
        
        if not request:
            raise ValueError("Request not found or not accessible")
        
        # Get the offer
        offer = await self.db.buy_request_offers.find_one({
            "id": offer_id,
            "request_id": request_id,
            "status": OfferStatus.PENDING.value
        })
        
        if not offer:
            raise ValueError("Offer not found or no longer available")
        
        # Mark offer as accepted
        await self.db.buy_request_offers.update_one(
            {"id": offer_id},
            {"$set": {"status": OfferStatus.ACCEPTED.value}}
        )
        
        # Mark request as fulfilled
        await self.db.buy_requests.update_one(
            {"id": request_id},
            {"$set": {"status": BuyRequestStatus.FULFILLED.value, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {
            "request": request,
            "offer": offer,
            "next_step": "create_order"
        }
    
    async def decline_offer(
        self,
        request_id: str,
        offer_id: str,
        buyer_id: str
    ) -> bool:
        """Decline an offer"""
        
        # Verify request belongs to buyer
        request = await self.db.buy_requests.find_one({
            "id": request_id,
            "buyer_id": buyer_id
        })
        
        if not request:
            raise ValueError("Request not found or not accessible")
        
        # Mark offer as declined
        result = await self.db.buy_request_offers.update_one(
            {
                "id": offer_id,
                "request_id": request_id,
                "status": OfferStatus.PENDING.value
            },
            {"$set": {"status": OfferStatus.DECLINED.value}}
        )
        
        return result.modified_count > 0
    
    async def get_seller_offers(
        self,
        seller_id: str,
        status: OfferStatus = None,
        species: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get offers made by a seller"""
        
        query = {"seller_id": seller_id}
        
        if status:
            query["status"] = status.value
        
        # Get offers with request details
        pipeline = [
            {"$match": query},
            {"$lookup": {
                "from": "buy_requests",
                "localField": "request_id",
                "foreignField": "id",
                "as": "request"
            }},
            {"$unwind": "$request"},
            {"$sort": {"created_at": -1}},
            {"$skip": offset},
            {"$limit": limit}
        ]
        
        if species:
            pipeline.insert(1, {"$match": {"request.species": species}})
        
        cursor = self.db.buy_request_offers.aggregate(pipeline)
        offers = await cursor.to_list(length=None)
        
        # Clean up the results
        for offer in offers:
            if "_id" in offer:
                del offer["_id"]
            if "_id" in offer.get("request", {}):
                del offer["request"]["_id"]
                
        return offers
    
    async def close_request(self, request_id: str, buyer_id: str) -> bool:
        """Close a buy request"""
        
        result = await self.db.buy_requests.update_one(
            {
                "id": request_id,
                "buyer_id": buyer_id,
                "status": BuyRequestStatus.OPEN.value
            },
            {"$set": {"status": BuyRequestStatus.CLOSED.value, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return result.modified_count > 0
    
    async def get_in_range_requests_for_seller(
        self,
        seller_id: str,
        service_area: Dict[str, Any],
        species: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get buy requests within seller's service area"""
        
        query = {
            "status": BuyRequestStatus.OPEN.value,
            "moderation_status": {"$in": [ModerationStatus.AUTO_PASS.value, ModerationStatus.APPROVED.value]}
        }
        
        if species:
            query["species"] = species
        
        # Simple province/country filtering for now
        # TODO: Implement proper geofencing with coordinates
        if service_area.get("provinces"):
            query["province"] = {"$in": service_area["provinces"]}
        
        if service_area.get("countries"):
            query["country"] = {"$in": service_area["countries"]}
        
        cursor = self.db.buy_requests.find(query).sort("created_at", -1).limit(limit)
        requests = await cursor.to_list(length=None)
        
        # Remove MongoDB _id fields
        for request in requests:
            if "_id" in request:
                del request["_id"]
                
        return requests
    
    async def auto_expire_requests(self) -> int:
        """Auto-expire requests that have passed their expiry date"""
        
        now = datetime.now(timezone.utc)
        
        result = await self.db.buy_requests.update_many(
            {
                "status": BuyRequestStatus.OPEN.value,
                "expires_at": {"$lte": now}
            },
            {"$set": {"status": BuyRequestStatus.CLOSED.value, "updated_at": now}}
        )
        
        return result.modified_count
    
    async def moderate_request(
        self,
        request_id: str,
        admin_id: str,
        action: str  # "approve" or "reject"
    ) -> bool:
        """Moderate a buy request (admin only)"""
        
        if action not in ["approve", "reject"]:
            raise ValueError("Action must be 'approve' or 'reject'")
        
        status = ModerationStatus.APPROVED if action == "approve" else ModerationStatus.REJECTED
        request_status = BuyRequestStatus.OPEN if action == "approve" else BuyRequestStatus.CLOSED
        
        result = await self.db.buy_requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "moderation_status": status.value,
                    "status": request_status.value,
                    "reviewed_by": admin_id,
                    "reviewed_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return result.modified_count > 0
    
    async def get_moderation_queue(
        self,
        status: ModerationStatus = ModerationStatus.PENDING_REVIEW,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get requests pending moderation"""
        
        query = {"moderation_status": status.value}
        
        cursor = self.db.buy_requests.find(query).sort("created_at", -1).limit(limit)
        requests = await cursor.to_list(length=None)
        
        # Remove MongoDB _id fields
        for request in requests:
            if "_id" in request:
                del request["_id"]
                
        return requests

# Helper function to notify nearby sellers
async def notify_nearby_sellers(db, buy_request: Dict[str, Any]):
    """Notify sellers in the area about a new buy request"""
    
    # This would integrate with your existing geofence service
    # For now, we'll do a simple province-based notification
    
    if not buy_request.get("province"):
        return
    
    # Find sellers in the same province with matching species capability
    sellers = await db.users.find({
        "roles": {"$in": ["SELLER", "EXPORTER"]},
        "service_provinces": buy_request["province"]  # Assuming sellers have service areas
    }).to_list(length=100)
    
    # Create in-app notifications
    notifications = []
    for seller in sellers:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": seller["id"],
            "topic": "buy_request_nearby",
            "title": f"New buy request: {buy_request['species']}",
            "message": f"A buyer wants {buy_request['qty']} {buy_request['unit']} of {buy_request['species']} in {buy_request['province']}",
            "action_url": f"/seller/requests",
            "data": {
                "buy_request_id": buy_request["id"],
                "species": buy_request["species"],
                "province": buy_request["province"]
            },
            "status": "sent",
            "created_at": datetime.now(timezone.utc),
            "sent_at": datetime.now(timezone.utc)
        }
        notifications.append(notification)
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return len(notifications)