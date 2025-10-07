"""
Unified Inbox Models - MongoDB/Pydantic Models
Following the comprehensive inbox specification
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime, timezone
import uuid

# Enums
class ConversationType(str, Enum):
    DIRECT = "DIRECT"
    ORDER = "ORDER"
    BUY_REQUEST = "BUY_REQUEST"
    OFFER = "OFFER"
    CONSIGNMENT = "CONSIGNMENT"
    SYSTEM = "SYSTEM"

class UserRole(str, Enum):
    BUYER = "BUYER"
    SELLER = "SELLER"
    TRANSPORTER = "TRANSPORTER"
    ABATTOIR = "ABATTOIR"
    EXPORTER = "EXPORTER"
    ADMIN = "ADMIN"

class SystemMessageType(str, Enum):
    ORDER_STATUS = "ORDER_STATUS"
    ESCROW = "ESCROW"
    AUCTION = "AUCTION"
    DOC_VERIFIED = "DOC_VERIFIED"
    DOC_REJECTED = "DOC_REJECTED"
    PAYOUT = "PAYOUT"
    ADMIN_NOTE = "ADMIN_NOTE"

class MessageVisibility(str, Enum):
    VISIBLE = "VISIBLE"
    HIDDEN = "HIDDEN"
    REDACTED = "REDACTED"

# Sub-schemas
class Participant(BaseModel):
    user_id: str
    org_id: Optional[str] = None
    role: UserRole
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    left_at: Optional[datetime] = None

class PerUser(BaseModel):
    user_id: str
    unread_count: int = 0
    muted: bool = False
    archived: bool = False
    deleted: bool = False

class Attachment(BaseModel):
    url: str
    name: str
    size: int
    mime: str

class ReadMark(BaseModel):
    user_id: str
    at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LinkedObject(BaseModel):
    kind: str  # 'ORDER'|'OFFER'|'BUY_REQUEST'|'CONSIGNMENT'
    id: str
    code: Optional[str] = None

# Main Models
class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ConversationType
    
    # Foreign keys (null when not applicable)
    order_group_id: Optional[str] = None
    buy_request_id: Optional[str] = None
    offer_id: Optional[str] = None
    consignment_id: Optional[str] = None
    
    subject: str
    participants: List[Participant] = []
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    last_sender_id: Optional[str] = None
    
    # Per-user state snapshot (denormalized for speed)
    per_user: List[PerUser] = []
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    body: str = ""
    attachments: List[Attachment] = []
    
    # System message fields
    system_type: Optional[SystemMessageType] = None
    meta: Optional[Dict[str, Any]] = None
    
    # Moderation fields
    visibility: MessageVisibility = MessageVisibility.VISIBLE
    redaction_reason: Optional[str] = None
    
    # Read receipts
    read_by: List[ReadMark] = []
    delivered_to: List[ReadMark] = []
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# API Request/Response Models
class ConversationListItem(BaseModel):
    id: str
    subject: str
    type: ConversationType
    linked: Optional[LinkedObject] = None
    participants: List[Dict[str, Any]] = []  # Simplified for API response
    last_message_preview: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    muted: bool = False
    archived: bool = False

class SendMessageBody(BaseModel):
    body: str
    attachments: Optional[List[Attachment]] = None

class CreateConversationRequest(BaseModel):
    type: ConversationType
    subject: str
    participants: List[Dict[str, Any]]
    order_group_id: Optional[str] = None
    buy_request_id: Optional[str] = None
    offer_id: Optional[str] = None
    consignment_id: Optional[str] = None

class UpdateConversationRequest(BaseModel):
    muted: Optional[bool] = None
    archived: Optional[bool] = None

class InboxSummary(BaseModel):
    total_unread: int = 0
    orders_unread: int = 0
    offers_unread: int = 0
    requests_unread: int = 0
    logistics_unread: int = 0
    system_unread: int = 0

# For backwards compatibility with existing system
class LegacyThreadCreate(BaseModel):
    context_type: str
    context_id: str
    participants: Optional[List[dict]] = None

class LegacyMessageCreate(BaseModel):
    body: Optional[str] = None
    attachments: Optional[List[dict]] = None