# 📋 REVIEW SYSTEM MODELS
# Comprehensive duo review system with anti-abuse measures

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime, timezone, timedelta
import uuid

# REVIEW ENUMS
class ReviewDirection(str, Enum):
    BUYER_ON_SELLER = "BUYER_ON_SELLER"
    SELLER_ON_BUYER = "SELLER_ON_BUYER"

class ReviewStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FLAGGED = "FLAGGED"

class OrderGroupStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    DELIVERED = "DELIVERED"
    COMPLETE = "COMPLETE"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"

# REVIEW MODELS
class ReviewCreate(BaseModel):
    order_group_id: str
    direction: ReviewDirection
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = Field(None, max_length=2000)
    photos: Optional[List[str]] = Field(default_factory=list, max_items=6)
    tags: Optional[List[str]] = Field(default_factory=list, max_items=10)
    
    @validator('photos')
    def validate_photos(cls, v):
        if v and len(v) > 6:
            raise ValueError('Maximum 6 photos allowed')
        return v or []
    
    @validator('tags')
    def validate_tags(cls, v):
        if v and len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return v or []

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    body: Optional[str] = Field(None, max_length=2000)
    photos: Optional[List[str]] = Field(None, max_items=6)
    tags: Optional[List[str]] = Field(None, max_items=10)

class ReviewReply(BaseModel):
    body: str = Field(..., max_length=1000)

class UserReview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_group_id: str
    reviewer_user_id: str
    subject_user_id: str
    direction: ReviewDirection
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    body: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    photos: List[str] = Field(default_factory=list)
    is_verified: bool = True
    moderation_status: ReviewStatus = ReviewStatus.PENDING
    toxicity_score: Optional[float] = None
    blind_until: Optional[datetime] = None
    editable_until: Optional[datetime] = None
    reply_body: Optional[str] = None
    reply_created_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SellerRatingStats(BaseModel):
    seller_id: str
    avg_rating_bayes: float = 0.0
    avg_rating_raw: float = 0.0
    ratings_count: int = 0
    star_1: int = 0
    star_2: int = 0
    star_3: int = 0
    star_4: int = 0
    star_5: int = 0
    last_review_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BuyerRatingStats(BaseModel):
    buyer_id: str
    avg_rating_bayes: float = 0.0
    avg_rating_raw: float = 0.0
    ratings_count: int = 0
    reliability_score: float = 0.0
    last_review_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# MODERATION MODELS
class ModerationResult(BaseModel):
    toxicity_score: float  # 0..1 (lower is better)
    flagged: bool
    categories: Optional[Dict[str, float]] = None

class ReviewModerationAction(BaseModel):
    review_id: str
    action: str  # approve, reject, flag
    reason: Optional[str] = None
    admin_notes: Optional[str] = None

# ELIGIBILITY MODELS  
class ReviewEligibility(BaseModel):
    eligible: bool
    reason: Optional[str] = None
    order_status: Optional[str] = None
    days_since_delivery: Optional[int] = None
    has_open_dispute: Optional[bool] = None
    kyc_level: Optional[int] = None
    existing_review: Optional[bool] = None

# AGGREGATE MODELS
class ReviewStats(BaseModel):
    avg_bayes: float
    avg_raw: float
    count: int
    stars: Dict[str, int]  # {"1": 5, "2": 10, ...}
    last_review_at: Optional[datetime] = None

class MarketplaceMean(BaseModel):
    seller_mean: float = 4.3
    buyer_mean: float = 4.3
    confidence_constant: float = 20.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# RESPONSE MODELS
class ReviewResponse(BaseModel):
    id: str
    rating: int
    title: Optional[str]
    body: Optional[str]
    tags: List[str]
    photos: List[str]
    reviewer_name: Optional[str] = None
    reviewer_verified: Optional[bool] = None
    is_verified: bool
    reply_body: Optional[str] = None
    reply_created_at: Optional[datetime] = None
    created_at: datetime
    is_visible: bool = True  # False if still in blind window

class SellerReviewSummary(BaseModel):
    reviews: List[ReviewResponse]
    stats: ReviewStats
    total_pages: int
    current_page: int

class BuyerReliabilitySummary(BaseModel):
    avg_bayes: float
    ratings_count: int
    reliability_score: float
    last_review_at: Optional[datetime]
    last_3_tags: List[str]

# ADMIN MODELS
class ReviewModerationQueue(BaseModel):
    reviews: List[Dict[str, Any]]
    pending_count: int
    flagged_count: int
    total_count: int

class ReviewAnalytics(BaseModel):
    daily_reviews: int
    weekly_reviews: int
    monthly_reviews: int
    avg_toxicity_score: float
    auto_approved_rate: float
    manual_review_rate: float