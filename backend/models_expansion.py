"""
StockLot Backend Expansion - New Database Models
Adds missing models for campaigns, wishlists, price alerts, and analytics
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import uuid

# ==================== CAMPAIGN MODELS ====================

class CampaignType(str, Enum):
    DISCOUNT = "discount"
    FEATURED = "featured"  
    BOOST = "boost"
    SEASONAL = "seasonal"

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Campaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_id: str
    name: str
    description: Optional[str] = None
    type: CampaignType
    status: CampaignStatus = CampaignStatus.DRAFT
    budget: float
    spent: float = 0.0
    start_date: datetime
    end_date: datetime
    target_audience: str = "all"
    discount_percentage: Optional[float] = None
    listing_ids: List[str] = []
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: CampaignType
    budget: float
    start_date: datetime
    end_date: datetime
    target_audience: str = "all"
    discount_percentage: Optional[float] = None
    listing_ids: List[str] = []

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CampaignStatus] = None
    budget: Optional[float] = None
    end_date: Optional[datetime] = None
    target_audience: Optional[str] = None
    discount_percentage: Optional[float] = None

# ==================== WISHLIST MODELS ====================

class WishlistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    listing_id: str
    listing_title: str
    listing_price: float
    seller_id: str
    seller_name: str
    notifications_enabled: bool = True
    added_at: datetime = Field(default_factory=datetime.utcnow)

class WishlistItemCreate(BaseModel):
    listing_id: str

class WishlistItemUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None

# ==================== PRICE ALERTS MODELS ====================

class AlertType(str, Enum):
    PRICE_DROP = "price_drop"
    PRICE_INCREASE = "price_increase"
    AVAILABILITY = "availability"
    NEW_LISTING = "new_listing"

class AlertStatus(str, Enum):
    ACTIVE = "active"
    TRIGGERED = "triggered"
    PAUSED = "paused"
    EXPIRED = "expired"

class PriceAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    alert_type: AlertType
    search_query: Optional[str] = None
    category: Optional[str] = None
    listing_id: Optional[str] = None
    target_price: float
    current_price: Optional[float] = None
    status: AlertStatus = AlertStatus.ACTIVE
    email_notifications: bool = True
    push_notifications: bool = False
    expires_at: Optional[datetime] = None
    triggered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PriceAlertCreate(BaseModel):
    alert_type: AlertType
    search_query: Optional[str] = None
    category: Optional[str] = None
    listing_id: Optional[str] = None
    target_price: float
    email_notifications: bool = True
    push_notifications: bool = False
    expires_at: Optional[datetime] = None

class PriceAlertUpdate(BaseModel):
    target_price: Optional[float] = None
    status: Optional[AlertStatus] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    expires_at: Optional[datetime] = None

# ==================== ANALYTICS MODELS ====================

class RevenueReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_type: str  # daily, weekly, monthly, custom
    start_date: datetime
    end_date: datetime
    total_revenue: float
    total_orders: int
    average_order_value: float
    top_categories: List[Dict[str, Any]]
    top_sellers: List[Dict[str, Any]]
    revenue_by_date: List[Dict[str, Any]]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class SellerAnalytics(BaseModel):
    seller_id: str
    total_revenue: float
    total_orders: int
    active_listings: int
    total_views: int
    conversion_rate: float
    average_rating: float
    repeat_customers: int
    timeline_data: List[Dict[str, Any]]
    top_listings: List[Dict[str, Any]]
    period_start: datetime
    period_end: datetime
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class RecommendationItem(BaseModel):
    listing_id: str
    title: str
    price: float
    seller_name: str
    similarity_score: float
    reason: str  # "similar_category", "price_range", "same_seller", etc.

class SearchRecommendations(BaseModel):
    similar_listings: List[RecommendationItem]
    popular_in_category: List[RecommendationItem]
    recently_viewed: List[RecommendationItem]
    price_range_matches: List[RecommendationItem]

# ==================== BULK UPDATE MODELS ====================

class BulkUpdateRecord(BaseModel):
    listing_id: str
    quantity: Optional[int] = None
    price_per_unit: Optional[float] = None
    status: Optional[str] = None
    reserved_quantity: Optional[int] = None
    notes: Optional[str] = None

class BulkUpdateRequest(BaseModel):
    records: List[BulkUpdateRecord]
    preview_mode: bool = True

class BulkUpdateResult(BaseModel):
    success: bool
    message: str
    total_processed: int
    successful_updates: int
    failed_updates: int
    errors: List[Dict[str, str]] = []
    preview_data: Optional[List[Dict[str, Any]]] = None

# ==================== EXPORT MODELS ====================

class ExportRequest(BaseModel):
    type: str  # "analytics_overview", "revenue_report", "inventory", "campaigns"
    format: str = "csv"  # csv, pdf, excel
    date_range: Optional[Dict[str, str]] = None
    filters: Optional[Dict[str, Any]] = None

class ExportResult(BaseModel):
    success: bool
    message: str
    file_url: Optional[str] = None
    download_token: Optional[str] = None
    expires_at: Optional[datetime] = None