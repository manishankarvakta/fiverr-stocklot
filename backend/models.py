# 📋 PYDANTIC MODELS FOR NEW API ENDPOINTS
# Models for Messaging, Referrals, Buy Requests, Notifications

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime, timezone
import uuid

# MESSAGING MODELS
class MessageCreate(BaseModel):
    body: Optional[str] = None
    attachments: Optional[List[dict]] = None

class ThreadCreate(BaseModel):
    context_type: str  # LISTING, ORDER, BUY_REQUEST, SUPPORT
    context_id: str
    participants: Optional[List[dict]] = None

class MessageThread(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    context_type: str
    context_id: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    thread_id: str
    sender_id: str
    body: Optional[str] = None
    attachments: Optional[List[dict]] = None
    redacted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageParticipant(BaseModel):
    thread_id: str
    user_id: str
    role: str = "OBSERVER"  # BUYER, SELLER, ADMIN, OBSERVER
    last_read_at: Optional[datetime] = None

# REFERRAL MODELS
class ReferralCode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    code: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReferralClick(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    referer: Optional[str] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    dest_path: str = "/signup"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReferralAttribution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    new_user_id: str
    attributed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReferralReward(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    kind: str = "CREDIT"  # CASH, CREDIT
    amount: float
    status: str = "PENDING"  # PENDING, APPROVED, PAID, REJECTED
    meta: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReferralSummary(BaseModel):
    code: str
    clicks: int
    signups: int
    rewards: List[dict]

# BUY REQUEST MODELS (Extensions)
class BuyRequestStatus(str, Enum):
    OPEN = "open"
    FULFILLED = "fulfilled"
    CLOSED = "closed"
    EXPIRED = "expired"

class OfferStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"

class BuyRequestOffer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buy_request_id: str
    seller_id: str
    org_id: Optional[str] = None
    price_per_unit: float
    quantity_available: int
    notes: Optional[str] = None
    delivery_cost: Optional[float] = None
    delivery_days: Optional[int] = None
    status: OfferStatus = OfferStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

class OfferCreate(BaseModel):
    price_per_unit: float
    quantity_available: int
    notes: Optional[str] = None
    delivery_cost: Optional[float] = None
    delivery_days: Optional[int] = None

class OfferUpdate(BaseModel):
    status: OfferStatus

# NOTIFICATION MODELS
class NotificationTopic(str, Enum):
    NEW_MESSAGE = "NEW_MESSAGE"
    BUY_REQUEST_NEARBY = "BUY_REQUEST_NEARBY"
    OFFER_RECEIVED = "OFFER_RECEIVED"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    ORDER_PAID = "ORDER_PAID"
    ORDER_FULFILLMENT_UPDATED = "ORDER_FULFILLMENT_UPDATED"
    DISPUTE_OPENED = "DISPUTE_OPENED"
    DOC_EXPIRING = "DOC_EXPIRING"
    DOC_REJECTED = "DOC_REJECTED"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    topic: NotificationTopic
    payload: dict
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    user_id: str
    topic: NotificationTopic
    payload: dict

# ADMIN MODELS
class AdminAuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    action: str
    resource_type: str
    resource_id: str
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserModerationAction(BaseModel):
    user_id: str
    action: str  # messaging_ban, account_suspend, etc.
    reason: str
    duration_days: Optional[int] = None

# SYSTEM SETTINGS MODELS
class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str
    value: Union[str, int, float, bool, dict]
    description: Optional[str] = None
    updated_by: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeatureFlag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    enabled: bool = False
    description: Optional[str] = None
    target_users: Optional[List[str]] = None
    updated_by: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# SUGGESTION MODELS
class SuggestionKind(str, Enum):
    ANIMAL = "ANIMAL"
    FEATURE = "FEATURE"
    BUG = "BUG"
    OTHER = "OTHER"

class SuggestionStatus(str, Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    PLANNED = "PLANNED"
    DECLINED = "DECLINED"
    DONE = "DONE"

class SuggestionPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class SuggestionCreate(BaseModel):
    kind: SuggestionKind
    title: str = Field(..., max_length=200)
    details: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    consent: bool = False

class Suggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    org_id: Optional[str] = None
    kind: SuggestionKind
    title: str
    details: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    contact_email: Optional[str] = None
    priority: SuggestionPriority = SuggestionPriority.LOW
    status: SuggestionStatus = SuggestionStatus.NEW
    votes: int = 0
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class SuggestionUpdate(BaseModel):
    status: Optional[SuggestionStatus] = None
    priority: Optional[SuggestionPriority] = None
    admin_notes: Optional[str] = None

# SHOPPING CART AND ORDER MODELS
class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    quantity: int = 1
    price: float
    shipping_cost: float = 0
    shipping_option: str = "standard"
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class OrderItem(BaseModel):
    listing_id: str
    listing_title: str
    seller_id: str
    quantity: int
    price: float
    shipping_cost: float
    item_total: float

class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    province: str
    postal_code: str
    country: str = "South Africa"

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    seller_id: str
    items: List[OrderItem]
    total_amount: float
    shipping_address: Optional[ShippingAddress] = None
    payment_method: Optional[str] = None
    payment_status: str = "pending"  # pending, paid, failed, refunded
    order_status: str = "confirmed"  # confirmed, processing, cancelled
    delivery_status: str = "preparing"  # preparing, shipped, in_transit, delivered, cancelled
    status_note: Optional[str] = None
    tracking_number: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CheckoutSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    subtotal: float
    total_amount: float
    shipping_address: Optional[ShippingAddress] = None
    payment_method: Optional[str] = None
    status: str = "pending"  # pending, completed, expired, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    completed_at: Optional[datetime] = None