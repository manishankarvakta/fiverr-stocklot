"""
Paystack Transfer Recipients and Payouts - Database Models
South African Livestock Marketplace Integration
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
from decimal import Decimal
import uuid

class RecipientType(str, Enum):
    BASA = "basa"  # Banking Association South Africa
    AUTHORIZATION = "authorization"

class TransferStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REVERSED = "reversed"
    PROCESSING = "processing"

class EscrowStatus(str, Enum):
    CREATED = "created"
    FUNDED = "funded"
    RELEASED = "released"
    REFUNDED = "refunded"
    DISPUTED = "disputed"

# Transfer Recipient Models
class TransferRecipient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    paystack_recipient_code: str
    recipient_type: RecipientType
    
    # Bank account details
    bank_code: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_name: Optional[str] = None
    
    # Validation details
    is_validated: bool = False
    validation_reference: Optional[str] = None
    validation_cost: Optional[Decimal] = None  # ZAR cost for validation
    
    # Authorization details (for card recipients)
    authorization_code: Optional[str] = None
    card_last4: Optional[str] = None
    card_bank: Optional[str] = None
    
    # Metadata
    name: str
    description: Optional[str] = None
    currency: str = "ZAR"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: Optional[datetime] = None

class BankAccountRecipientCreate(BaseModel):
    account_number: str = Field(..., min_length=10, max_length=20)
    bank_code: str = Field(..., min_length=3, max_length=10)
    account_name: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    validate_account: bool = Field(True)
    document_type: str = Field("identityNumber")
    document_number: Optional[str] = None
    
    @validator('account_number')
    def validate_account_number(cls, v):
        if not v.isdigit():
            raise ValueError('Account number must contain only digits')
        return v

class AuthorizationRecipientCreate(BaseModel):
    authorization_code: str = Field(...)
    email: str = Field(...)
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

# Transfer Models
class Transfer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference: str
    
    # Transfer details
    sender_id: str
    recipient_id: str
    recipient_user_id: Optional[str] = None
    
    # Financial details
    amount: int  # Amount in cents (ZAR)
    currency: str = "ZAR"
    source: str = "balance"
    reason: Optional[str] = None
    
    # Paystack details
    paystack_transfer_code: Optional[str] = None
    paystack_transfer_id: Optional[int] = None
    
    # Status and tracking
    status: TransferStatus = TransferStatus.PENDING
    failure_reason: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    
    # Related transaction
    escrow_transaction_id: Optional[str] = None
    livestock_listing_id: Optional[str] = None
    
    # Timestamps
    initiated_at: datetime = Field(default_factory=lambda: datetime.now())
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: Optional[datetime] = None

class TransferCreate(BaseModel):
    recipient_id: str
    amount: Decimal = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=500)
    reference: Optional[str] = Field(None, max_length=50)
    
    @validator('amount')
    def validate_amount(cls, v):
        amount_cents = int(v * 100)
        if amount_cents < 100:  # Minimum R1.00
            raise ValueError("Amount must be at least ZAR 1.00")
        if amount_cents > 1000000:  # Maximum R10,000.00
            raise ValueError("Amount cannot exceed ZAR 10,000.00")
        return v

# Escrow Models
class EscrowTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference: str
    
    # Parties involved
    buyer_id: str
    seller_id: str
    livestock_listing_id: str
    
    # Financial details
    amount: int  # Amount in cents (ZAR)
    currency: str = "ZAR"
    platform_fee: int = 0  # Platform fee in cents
    seller_amount: int  # Amount to be transferred to seller
    
    # Status tracking
    status: EscrowStatus = EscrowStatus.CREATED
    
    # Release conditions
    auto_release_date: Optional[datetime] = None
    release_approved_by_buyer: bool = False
    release_approved_by_admin: bool = False
    release_reason: Optional[str] = None
    
    # Timestamps
    funded_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: Optional[datetime] = None

class EscrowReleaseRequest(BaseModel):
    escrow_transaction_id: str
    release_reason: Optional[str] = Field(None, max_length=500)

# Response Models
class RecipientResponse(BaseModel):
    id: str
    user_id: str
    paystack_recipient_code: str
    recipient_type: str
    name: str
    description: Optional[str]
    currency: str
    is_active: bool
    is_validated: bool
    
    # Bank account details
    bank_code: Optional[str]
    bank_name: Optional[str]
    account_number: Optional[str]
    account_name: Optional[str]
    
    # Authorization details
    authorization_code: Optional[str]
    card_last4: Optional[str]
    card_bank: Optional[str]
    
    # Metadata
    validation_cost: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

class TransferResponse(BaseModel):
    id: str
    reference: str
    status: str
    amount: int
    amount_zar: float
    currency: str
    reason: Optional[str]
    recipient_name: Optional[str]
    failure_reason: Optional[str]
    retry_count: int
    max_retries: int
    initiated_at: datetime
    completed_at: Optional[datetime]
    failed_at: Optional[datetime]
    paystack_transfer_code: Optional[str]
    
    @validator('amount_zar', pre=True, always=True)
    def calculate_amount_zar(cls, v, values):
        return values.get('amount', 0) / 100.0

class PaystackResponse(BaseModel):
    status: bool
    message: str
    data: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    meta: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: int = 200

class BankListResponse(BaseModel):
    banks: List[dict]
    total: int