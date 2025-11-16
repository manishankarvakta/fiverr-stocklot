# 🌟 REVIEW SERVICE
# Comprehensive duo review system with anti-abuse measures and Bayesian ratings

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
import asyncio
import math

from models_reviews import (
    ReviewCreate, ReviewUpdate, ReviewReply, UserReview, 
    SellerRatingStats, BuyerRatingStats, ReviewDirection, ReviewStatus,
    ReviewEligibility, ReviewStats, MarketplaceMean, ReviewResponse,
    SellerReviewSummary, BuyerReliabilitySummary, ModerationResult
)
from moderation_provider import get_moderation_provider

logger = logging.getLogger(__name__)

class ReviewService:
    """Comprehensive review service with duo reviews and anti-abuse measures"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        try:
            self.moderation_provider = get_moderation_provider()
        except Exception as e:
            logger.warning(f"Moderation provider not available, reviews will work without moderation: {e}")
            self.moderation_provider = None
        
        # Configuration
        self.review_window_days = 90
        self.blind_window_hours = 24 * 7  # 7 days
        self.edit_window_hours = 72
        self.toxicity_threshold = float(os.getenv('REVIEW_TOXICITY_THRESHOLD', '0.82'))
        self.min_kyc_level = 1
        
        # Bayesian constants
        self.confidence_constant = 20.0
        self.default_marketplace_mean = 4.3
    
    # ELIGIBILITY CHECKS
    async def check_review_eligibility(
        self, 
        order_group_id: str, 
        reviewer_user_id: str, 
        direction: ReviewDirection
    ) -> ReviewEligibility:
        """Check if user is eligible to review for this order"""
        try:
            # Get order group
            order_group = await self.db.order_groups.find_one({"id": order_group_id})
            if not order_group:
                return ReviewEligibility(
                    eligible=False, 
                    reason="Order not found"
                )
            
            # Check if user is party to the order
            is_buyer = order_group.get("buyer_id") == reviewer_user_id
            is_seller = order_group.get("seller_id") == reviewer_user_id
            
            if not (is_buyer or is_seller):
                return ReviewEligibility(
                    eligible=False,
                    reason="User is not party to this order"
                )
            
            # Check direction matches role
            if direction == ReviewDirection.BUYER_ON_SELLER and not is_buyer:
                return ReviewEligibility(
                    eligible=False,
                    reason="Only buyers can review sellers"
                )
            
            if direction == ReviewDirection.SELLER_ON_BUYER and not is_seller:
                return ReviewEligibility(
                    eligible=False,
                    reason="Only sellers can review buyers"
                )
            
            # Check order status
            status = order_group.get("status", "").upper()
            if status not in ["DELIVERED", "COMPLETE"]:
                return ReviewEligibility(
                    eligible=False,
                    reason=f"Order must be delivered or complete. Current status: {status}",
                    order_status=status
                )
            
            # Check escrow release (if applicable)
            escrow_status = order_group.get("escrow_status")
            if escrow_status and escrow_status != "RELEASED":
                return ReviewEligibility(
                    eligible=False,
                    reason="Escrow must be released before reviewing"
                )
            
            # Check for open disputes
            has_open_dispute = await self._has_open_dispute(order_group_id)
            if has_open_dispute:
                return ReviewEligibility(
                    eligible=False,
                    reason="Cannot review while dispute is open",
                    has_open_dispute=True
                )
            
            # Check review window
            delivered_at = order_group.get("delivered_at") or order_group.get("completed_at")
            if delivered_at:
                if isinstance(delivered_at, str):
                    delivered_at = datetime.fromisoformat(delivered_at.replace('Z', '+00:00'))
                elif delivered_at.tzinfo is None:
                    delivered_at = delivered_at.replace(tzinfo=timezone.utc)
                
                days_since_delivery = (datetime.now(timezone.utc) - delivered_at).days
                if days_since_delivery > self.review_window_days:
                    return ReviewEligibility(
                        eligible=False,
                        reason=f"Review window expired ({self.review_window_days} days)",
                        days_since_delivery=days_since_delivery
                    )
            
            # Check KYC level
            user = await self.db.users.find_one({"id": reviewer_user_id})
            if user:
                kyc_level = user.get("kyc_level", 0)
                if kyc_level < self.min_kyc_level:
                    return ReviewEligibility(
                        eligible=False,
                        reason=f"KYC level {self.min_kyc_level} required",
                        kyc_level=kyc_level
                    )
            
            # Check for existing review
            existing_review = await self.db.user_reviews.find_one({
                "order_group_id": order_group_id,
                "reviewer_user_id": reviewer_user_id,
                "direction": direction.value
            })
            
            if existing_review:
                return ReviewEligibility(
                    eligible=False,
                    reason="Review already exists for this order",
                    existing_review=True
                )
            
            return ReviewEligibility(eligible=True)
            
        except Exception as e:
            logger.error(f"Error checking review eligibility: {e}")
            return ReviewEligibility(
                eligible=False,
                reason="Error checking eligibility"
            )
    
    async def _has_open_dispute(self, order_group_id: str) -> bool:
        """Check if order has open dispute"""
        try:
            dispute = await self.db.disputes.find_one({
                "order_group_id": order_group_id,
                "status": {"$in": ["OPEN", "INVESTIGATING"]}
            })
            return dispute is not None
        except:
            return False
    
    # REVIEW CREATION
    async def create_review(
        self, 
        review_data: ReviewCreate, 
        reviewer_user_id: str
    ) -> Dict[str, Any]:
        """Create a new review with full validation and moderation"""
        try:
            # Check eligibility
            eligibility = await self.check_review_eligibility(
                review_data.order_group_id,
                reviewer_user_id,
                review_data.direction
            )
            
            if not eligibility.eligible:
                return {
                    "success": False,
                    "error": eligibility.reason,
                    "code": "NOT_ELIGIBLE"
                }
            
            # Get subject user ID
            subject_user_id = await self._get_subject_user_id(
                review_data.order_group_id,
                reviewer_user_id,
                review_data.direction
            )
            
            if not subject_user_id:
                return {
                    "success": False,
                    "error": "Could not determine review subject",
                    "code": "INVALID_ORDER"
                }
            
            # Moderate content
            moderation_result = await self._moderate_review_content(review_data)
            
            # Calculate blind and edit windows
            now = datetime.now(timezone.utc)
            blind_until, editable_until = await self._calculate_review_windows(
                review_data.order_group_id,
                now
            )
            
            # Create review document
            review = UserReview(
                order_group_id=review_data.order_group_id,
                reviewer_user_id=reviewer_user_id,
                subject_user_id=subject_user_id,
                direction=review_data.direction,
                rating=review_data.rating,
                title=review_data.title,
                body=review_data.body,
                tags=review_data.tags or [],
                photos=review_data.photos or [],
                is_verified=True,
                moderation_status=ReviewStatus.APPROVED if moderation_result.toxicity_score < self.toxicity_threshold else ReviewStatus.PENDING,
                toxicity_score=moderation_result.toxicity_score,
                blind_until=blind_until,
                editable_until=editable_until,
                created_at=now,
                updated_at=now
            )
            
            # Auto-flag if high toxicity
            if moderation_result.flagged or moderation_result.toxicity_score >= self.toxicity_threshold:
                review.moderation_status = ReviewStatus.FLAGGED
            
            # Save to database
            review_dict = review.dict()
            await self.db.user_reviews.insert_one(review_dict)
            
            # If approved, update aggregates
            if review.moderation_status == ReviewStatus.APPROVED:
                await self._update_rating_aggregates(subject_user_id, review_data.direction)
            
            # Send notifications
            await self._send_review_notifications(review, "created")
            
            return {
                "success": True,
                "review_id": review.id,
                "moderation_status": review.moderation_status.value,
                "toxicity_score": moderation_result.toxicity_score,
                "blind_until": blind_until.isoformat() if blind_until else None,
                "editable_until": editable_until.isoformat() if editable_until else None
            }
            
        except Exception as e:
            logger.error(f"Error creating review: {e}")
            return {
                "success": False,
                "error": "Failed to create review",
                "code": "INTERNAL_ERROR"
            }
    
    async def _get_subject_user_id(
        self, 
        order_group_id: str, 
        reviewer_user_id: str, 
        direction: ReviewDirection
    ) -> Optional[str]:
        """Get the user ID being reviewed"""
        try:
            order_group = await self.db.order_groups.find_one({"id": order_group_id})
            if not order_group:
                return None
            
            if direction == ReviewDirection.BUYER_ON_SELLER:
                return order_group.get("seller_id")
            else:  # SELLER_ON_BUYER
                return order_group.get("buyer_id")
                
        except Exception as e:
            logger.error(f"Error getting subject user ID: {e}")
            return None
    
    async def _moderate_review_content(self, review_data: ReviewCreate) -> ModerationResult:
        """Moderate review content for toxicity"""
        try:
            # Combine all text content for moderation
            text_parts = []
            if review_data.title:
                text_parts.append(review_data.title)
            if review_data.body:
                text_parts.append(review_data.body)
            if review_data.tags:
                text_parts.extend(review_data.tags)
            
            text_content = " ".join(text_parts)
            
            if not text_content.strip():
                return ModerationResult(toxicity_score=0.0, flagged=False)
            
            if self.moderation_provider:
                return await self.moderation_provider.moderate(text_content)
            else:
                # No moderation provider available, return safe default
                return ModerationResult(
                    toxicity_score=0.0,
                    flagged=False,
                    categories={}
                )
            
        except Exception as e:
            logger.error(f"Error moderating review content: {e}")
            # Fail safe - allow content but flag for manual review
            return ModerationResult(toxicity_score=0.5, flagged=True)
    
    async def _calculate_review_windows(
        self, 
        order_group_id: str, 
        now: datetime
    ) -> Tuple[Optional[datetime], datetime]:
        """Calculate blind and edit windows for review"""
        try:
            # Check if there's already a review for this order
            existing_review = await self.db.user_reviews.find_one({
                "order_group_id": order_group_id
            })
            
            blind_until = None
            editable_until = now + timedelta(hours=self.edit_window_hours)
            
            if not existing_review:
                # This is the first review - set blind window
                blind_until = now + timedelta(hours=self.blind_window_hours)
            else:
                # Second review - no blind window, but check if first review should be unblinded
                if existing_review.get("blind_until"):
                    await self.db.user_reviews.update_one(
                        {"_id": existing_review["_id"]},
                        {"$unset": {"blind_until": ""}}
                    )
                
                # Reduce edit window if counterparty already posted
                editable_until = now + timedelta(hours=1)  # Minimal edit window
            
            return blind_until, editable_until
            
        except Exception as e:
            logger.error(f"Error calculating review windows: {e}")
            return None, now + timedelta(hours=self.edit_window_hours)
    
    # REVIEW UPDATES
    async def update_review(
        self, 
        review_id: str, 
        review_update: ReviewUpdate, 
        user_id: str
    ) -> Dict[str, Any]:
        """Update an existing review within edit window"""
        try:
            # Get existing review
            review = await self.db.user_reviews.find_one({
                "id": review_id,
                "reviewer_user_id": user_id
            })
            
            if not review:
                return {
                    "success": False,
                    "error": "Review not found",
                    "code": "NOT_FOUND"
                }
            
            # Check edit window
            now = datetime.now(timezone.utc)
            editable_until = review.get("editable_until")
            
            if editable_until:
                if isinstance(editable_until, str):
                    editable_until = datetime.fromisoformat(editable_until.replace('Z', '+00:00'))
                elif editable_until.tzinfo is None:
                    editable_until = editable_until.replace(tzinfo=timezone.utc)
                
                if now > editable_until:
                    return {
                        "success": False,
                        "error": "Edit window expired",
                        "code": "EDIT_WINDOW_EXPIRED"
                    }
            
            # Check if counterparty has already posted (which locks editing)
            counterparty_review = await self.db.user_reviews.find_one({
                "order_group_id": review["order_group_id"],
                "reviewer_user_id": {"$ne": user_id}
            })
            
            if counterparty_review:
                return {
                    "success": False,
                    "error": "Cannot edit after counterparty has posted their review",
                    "code": "COUNTERPARTY_POSTED"
                }
            
            # Prepare update data
            update_data = {"updated_at": now}
            
            # Only update provided fields
            for field, value in review_update.dict(exclude_unset=True).items():
                if value is not None:
                    update_data[field] = value
            
            # Re-moderate if content changed
            content_changed = any(field in update_data for field in ['title', 'body', 'tags'])
            if content_changed:
                # Create temporary review data for moderation
                temp_review = ReviewCreate(
                    order_group_id=review["order_group_id"],
                    direction=ReviewDirection(review["direction"]),
                    rating=update_data.get("rating", review["rating"]),
                    title=update_data.get("title", review.get("title")),
                    body=update_data.get("body", review.get("body")),
                    tags=update_data.get("tags", review.get("tags", []))
                )
                
                moderation_result = await self._moderate_review_content(temp_review)
                update_data["toxicity_score"] = moderation_result.toxicity_score
                
                # Update moderation status if needed
                if moderation_result.flagged or moderation_result.toxicity_score >= self.toxicity_threshold:
                    update_data["moderation_status"] = ReviewStatus.FLAGGED.value
                elif review.get("moderation_status") == ReviewStatus.FLAGGED.value:
                    update_data["moderation_status"] = ReviewStatus.PENDING.value
            
            # Update review
            await self.db.user_reviews.update_one(
                {"id": review_id},
                {"$set": update_data}
            )
            
            # Update aggregates if moderation status changed to approved
            if update_data.get("moderation_status") == ReviewStatus.APPROVED.value:
                direction = ReviewDirection(review["direction"])
                await self._update_rating_aggregates(review["subject_user_id"], direction)
            
            return {
                "success": True,
                "message": "Review updated successfully"
            }
            
        except Exception as e:
            logger.error(f"Error updating review: {e}")
            return {
                "success": False,
                "error": "Failed to update review",
                "code": "INTERNAL_ERROR"
            }
    
    async def delete_review(self, review_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a review within the allowed window"""
        try:
            # Get existing review
            review = await self.db.user_reviews.find_one({
                "id": review_id,
                "reviewer_user_id": user_id
            })
            
            if not review:
                return {
                    "success": False,
                    "error": "Review not found",
                    "code": "NOT_FOUND"
                }
            
            # Check edit window (same rules as edit)
            now = datetime.now(timezone.utc)
            editable_until = review.get("editable_until")
            
            if editable_until:
                if isinstance(editable_until, str):
                    editable_until = datetime.fromisoformat(editable_until.replace('Z', '+00:00'))
                elif editable_until.tzinfo is None:
                    editable_until = editable_until.replace(tzinfo=timezone.utc)
                
                if now > editable_until:
                    return {
                        "success": False,
                        "error": "Delete window expired",
                        "code": "DELETE_WINDOW_EXPIRED"
                    }
            
            # Delete review
            await self.db.user_reviews.delete_one({"id": review_id})
            
            # Update aggregates
            direction = ReviewDirection(review["direction"])
            await self._update_rating_aggregates(review["subject_user_id"], direction)
            
            return {
                "success": True,
                "message": "Review deleted successfully"
            }
            
        except Exception as e:
            logger.error(f"Error deleting review: {e}")
            return {
                "success": False,
                "error": "Failed to delete review",
                "code": "INTERNAL_ERROR"
            }
    
    # AGGREGATION SYSTEM
    async def _update_rating_aggregates(self, subject_user_id: str, direction: ReviewDirection):
        """Update rating aggregates for seller or buyer"""
        try:
            if direction == ReviewDirection.BUYER_ON_SELLER:
                await self._update_seller_rating_stats(subject_user_id)
            else:
                await self._update_buyer_rating_stats(subject_user_id)
        except Exception as e:
            logger.error(f"Error updating rating aggregates: {e}")
    
    async def _update_seller_rating_stats(self, seller_id: str):
        """Update seller rating statistics with Bayesian smoothing"""
        try:
            # Get approved reviews
            reviews_cursor = self.db.user_reviews.find({
                "subject_user_id": seller_id,
                "direction": ReviewDirection.BUYER_ON_SELLER.value,
                "moderation_status": ReviewStatus.APPROVED.value
            })
            reviews = await reviews_cursor.to_list(length=None)
            
            if not reviews:
                # No reviews - set defaults
                stats = SellerRatingStats(
                    seller_id=seller_id,
                    avg_rating_bayes=0.0,
                    avg_rating_raw=0.0,
                    ratings_count=0
                )
            else:
                # Calculate statistics
                ratings = [r["rating"] for r in reviews]
                ratings_count = len(ratings)
                avg_rating_raw = sum(ratings) / ratings_count
                
                # Star distribution
                star_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
                for rating in ratings:
                    star_counts[rating] += 1
                
                # Bayesian smoothing
                marketplace_mean = await self._get_marketplace_mean("seller")
                avg_rating_bayes = (
                    (self.confidence_constant * marketplace_mean + ratings_count * avg_rating_raw) /
                    (self.confidence_constant + ratings_count)
                )
                
                # Last review date
                last_review_at = max(r["created_at"] for r in reviews)
                if isinstance(last_review_at, str):
                    last_review_at = datetime.fromisoformat(last_review_at.replace('Z', '+00:00'))
                
                stats = SellerRatingStats(
                    seller_id=seller_id,
                    avg_rating_bayes=round(avg_rating_bayes, 2),
                    avg_rating_raw=round(avg_rating_raw, 2),
                    ratings_count=ratings_count,
                    star_1=star_counts[1],
                    star_2=star_counts[2],
                    star_3=star_counts[3],
                    star_4=star_counts[4],
                    star_5=star_counts[5],
                    last_review_at=last_review_at
                )
            
            # Upsert stats
            await self.db.seller_rating_stats.replace_one(
                {"seller_id": seller_id},
                stats.dict(),
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating seller rating stats: {e}")
    
    async def _update_buyer_rating_stats(self, buyer_id: str):
        """Update buyer rating statistics and reliability score"""
        try:
            # Get approved reviews
            reviews_cursor = self.db.user_reviews.find({
                "subject_user_id": buyer_id,
                "direction": ReviewDirection.SELLER_ON_BUYER.value,
                "moderation_status": ReviewStatus.APPROVED.value
            })
            reviews = await reviews_cursor.to_list(length=None)
            
            if not reviews:
                # No reviews - set defaults
                stats = BuyerRatingStats(
                    buyer_id=buyer_id,
                    avg_rating_bayes=0.0,
                    avg_rating_raw=0.0,
                    ratings_count=0,
                    reliability_score=50.0  # Neutral starting score
                )
            else:
                # Calculate basic statistics
                ratings = [r["rating"] for r in reviews]
                ratings_count = len(ratings)
                avg_rating_raw = sum(ratings) / ratings_count
                
                # Bayesian smoothing
                marketplace_mean = await self._get_marketplace_mean("buyer")
                avg_rating_bayes = (
                    (self.confidence_constant * marketplace_mean + ratings_count * avg_rating_raw) /
                    (self.confidence_constant + ratings_count)
                )
                
                # Calculate reliability score
                reliability_score = await self._calculate_buyer_reliability_score(
                    buyer_id, avg_rating_bayes
                )
                
                # Last review date
                last_review_at = max(r["created_at"] for r in reviews)
                if isinstance(last_review_at, str):
                    last_review_at = datetime.fromisoformat(last_review_at.replace('Z', '+00:00'))
                
                stats = BuyerRatingStats(
                    buyer_id=buyer_id,
                    avg_rating_bayes=round(avg_rating_bayes, 2),
                    avg_rating_raw=round(avg_rating_raw, 2),
                    ratings_count=ratings_count,
                    reliability_score=round(reliability_score, 1),
                    last_review_at=last_review_at
                )
            
            # Upsert stats
            await self.db.buyer_rating_stats.replace_one(
                {"buyer_id": buyer_id},
                stats.dict(),
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating buyer rating stats: {e}")
    
    async def _calculate_buyer_reliability_score(
        self, 
        buyer_id: str, 
        avg_rating_bayes: float
    ) -> float:
        """Calculate comprehensive buyer reliability score (0-100)"""
        try:
            # Base score from ratings (0-100)
            base_score = avg_rating_bayes * 20  # 5-star rating * 20 = 100 max
            
            # Get order history for additional metrics
            orders_cursor = self.db.order_groups.find({
                "buyer_id": buyer_id,
                "status": {"$in": ["PAID", "DELIVERED", "COMPLETE", "CANCELLED"]}
            }).limit(50)  # Last 50 orders
            orders = await orders_cursor.to_list(length=None)
            
            if not orders:
                return max(base_score, 50.0)  # Neutral score for new buyers
            
            # Calculate payment reliability
            paid_orders = [o for o in orders if o.get("status") in ["PAID", "DELIVERED", "COMPLETE"]]
            payment_rate = len(paid_orders) / len(orders) if orders else 0
            
            # Calculate dispute rate
            dispute_count = await self.db.disputes.count_documents({
                "buyer_id": buyer_id,
                "status": {"$in": ["RESOLVED", "CLOSED"]}
            })
            dispute_rate = dispute_count / len(orders) if orders else 0
            
            # Calculate delivery confirmation promptness
            # (This would need to be tracked in your order system)
            confirmation_score = 0.8  # Placeholder - implement based on your delivery confirmation system
            
            # Weighted reliability score
            reliability_score = (
                base_score * 0.30 +           # 30% ratings
                payment_rate * 100 * 0.35 +   # 35% payment reliability  
                (1 - dispute_rate) * 100 * 0.20 +  # 20% low dispute rate
                confirmation_score * 100 * 0.15     # 15% confirmation promptness
            )
            
            # Clamp to 0-100 range
            return max(0.0, min(100.0, reliability_score))
            
        except Exception as e:
            logger.error(f"Error calculating buyer reliability score: {e}")
            return 50.0  # Neutral fallback
    
    async def _get_marketplace_mean(self, user_type: str) -> float:
        """Get marketplace mean rating for Bayesian smoothing"""
        try:
            # Try to get from cache/config first
            config = await self.db.system_settings.find_one({
                "key": f"marketplace_mean_{user_type}"
            })
            
            if config and config.get("value"):
                return float(config["value"])
            
            # Calculate from recent reviews (last 90 days)
            ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
            
            direction = (ReviewDirection.BUYER_ON_SELLER.value if user_type == "seller" 
                        else ReviewDirection.SELLER_ON_BUYER.value)
            
            pipeline = [
                {
                    "$match": {
                        "direction": direction,
                        "moderation_status": ReviewStatus.APPROVED.value,
                        "created_at": {"$gte": ninety_days_ago}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "average_rating": {"$avg": "$rating"}
                    }
                }
            ]
            
            result = await self.db.user_reviews.aggregate(pipeline).to_list(length=1)
            
            if result and result[0].get("average_rating"):
                marketplace_mean = float(result[0]["average_rating"])
                
                # Cache the result
                await self.db.system_settings.replace_one(
                    {"key": f"marketplace_mean_{user_type}"},
                    {
                        "key": f"marketplace_mean_{user_type}",
                        "value": marketplace_mean,
                        "updated_at": datetime.now(timezone.utc)
                    },
                    upsert=True
                )
                
                return marketplace_mean
            
            return self.default_marketplace_mean
            
        except Exception as e:
            logger.error(f"Error getting marketplace mean: {e}")
            return self.default_marketplace_mean
    
    # BACKGROUND JOBS
    async def unblind_expired_reviews(self):
        """Unblind reviews whose blind window has expired"""
        try:
            now = datetime.now(timezone.utc)
            
            result = await self.db.user_reviews.update_many(
                {
                    "blind_until": {"$lte": now},
                    "moderation_status": ReviewStatus.APPROVED.value
                },
                {"$unset": {"blind_until": ""}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Unblinded {result.modified_count} reviews")
            
        except Exception as e:
            logger.error(f"Error unblinding reviews: {e}")
    
    async def recompute_all_rating_aggregates(self):
        """Recompute all rating statistics (nightly job)"""
        try:
            # Get all users who have been reviewed
            reviewed_sellers = await self.db.user_reviews.distinct(
                "subject_user_id",
                {"direction": ReviewDirection.BUYER_ON_SELLER.value}
            )
            
            reviewed_buyers = await self.db.user_reviews.distinct(
                "subject_user_id", 
                {"direction": ReviewDirection.SELLER_ON_BUYER.value}
            )
            
            # Update seller stats
            for seller_id in reviewed_sellers:
                await self._update_seller_rating_stats(seller_id)
            
            # Update buyer stats
            for buyer_id in reviewed_buyers:
                await self._update_buyer_rating_stats(buyer_id)
            
            # Update marketplace means
            await self._get_marketplace_mean("seller")
            await self._get_marketplace_mean("buyer")
            
            logger.info(f"Recomputed stats for {len(reviewed_sellers)} sellers and {len(reviewed_buyers)} buyers")
            
        except Exception as e:
            logger.error(f"Error recomputing rating aggregates: {e}")
    
    # NOTIFICATION HELPERS
    async def _send_review_notifications(self, review: UserReview, action: str):
        """Send notifications for review actions"""
        try:
            # This would integrate with your existing notification service
            # For now, just log the action
            logger.info(f"Review notification: {action} for review {review.id}")
            
        except Exception as e:
            logger.error(f"Error sending review notifications: {e}")

import os