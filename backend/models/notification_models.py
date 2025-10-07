from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Literal
from datetime import datetime
from enum import Enum

class NotificationChannel(str, Enum):
    INAPP = "INAPP"
    EMAIL = "EMAIL"
    PUSH = "PUSH"

class DigestFrequency(str, Enum):
    IMMEDIATE = "immediate"
    DAILY = "daily"
    WEEKLY = "weekly"
    OFF = "off"

class NotificationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

class UserNotificationPrefs(BaseModel):
    user_id: str
    email_global: bool = True
    push_global: bool = False
    inapp_global: bool = True
    email_new_listing: bool = True
    email_buy_request: bool = True
    digest_frequency: DigestFrequency = DigestFrequency.IMMEDIATE
    species_interest: Optional[List[str]] = None
    provinces_interest: Optional[List[str]] = None
    max_per_day: int = 5
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationOutbox(BaseModel):
    id: Optional[str] = None
    channel: NotificationChannel
    template_key: str
    user_id: str
    payload: Dict[str, Any]
    dedupe_key: Optional[str] = None
    scheduled_at: datetime = Field(default_factory=datetime.utcnow)
    attempts: int = 0
    max_attempts: int = 5
    status: NotificationStatus = NotificationStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationCounter(BaseModel):
    user_id: str
    yyyymmdd: int
    count: int = 0

class AdminNotificationSettings(BaseModel):
    id: int = 1
    enable_broadcast_buy_requests: bool = True
    enable_broadcast_listings: bool = True
    default_digest_frequency: DigestFrequency = DigestFrequency.IMMEDIATE
    default_max_per_day: int = 5
    default_email_opt_in: bool = True
    default_inapp_opt_in: bool = True
    default_push_opt_in: bool = False
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationTemplate(BaseModel):
    key: str
    subject: str
    html: str
    text: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TestBroadcastRequest(BaseModel):
    type: Literal["buy_request", "listing"]
    species: str
    province: Optional[str] = None
    title: str
    url: str

class TemplatePreviewRequest(BaseModel):
    subject: str
    html: str
    text: str
    payload: Dict[str, Any]

class NotificationEvent(BaseModel):
    event_type: str  # 'buy_request.created', 'listing.created'
    request_id: Optional[str] = None
    listing_id: Optional[str] = None
    species: str
    province: Optional[str] = None
    title: str
    url: str
    user_id: str  # creator (buyer_id or seller_id)
    quantity: Optional[int] = None
    price: Optional[int] = None

class OutboxQuery(BaseModel):
    status: Optional[NotificationStatus] = NotificationStatus.PENDING
    limit: int = 500
    offset: int = 0