# 💰 FEE SYSTEM MODELS
# Dual fee model support: Seller-Pays vs Buyer-Pays Commission

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime, timezone
import uuid

# FEE MODEL ENUMS
class FeeModel(str, Enum):
    SELLER_PAYS = "SELLER_PAYS"
    BUYER_PAYS_COMMISSION = "BUYER_PAYS_COMMISSION"

class PayoutStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"

# FEE CONFIGURATION MODELS
class FeeConfigCreate(BaseModel):
    name: str = Field(..., max_length=100, description="Configuration name")
    platform_commission_pct: float = Field(..., ge=0, le=50, description="Platform commission percentage")
    seller_payout_fee_pct: float = Field(..., ge=0, le=10, description="Seller payout fee percentage")
    buyer_processing_fee_pct: float = Field(..., ge=0, le=10, description="Buyer processing fee percentage")
    escrow_service_fee_minor: int = Field(..., ge=0, description="Escrow service fee in minor units (cents)")
    model: FeeModel = Field(default=FeeModel.SELLER_PAYS, description="Fee model type")
    applies_to: Dict[str, Any] = Field(default_factory=dict, description="Rules for applying this config")
    effective_from: datetime = Field(..., description="When this config becomes effective")
    effective_to: Optional[datetime] = Field(None, description="When this config expires")

class FeeConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    platform_commission_pct: float
    seller_payout_fee_pct: float
    buyer_processing_fee_pct: float
    escrow_service_fee_minor: int
    model: FeeModel
    applies_to: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = False
    effective_from: datetime
    effective_to: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ORDER FEE MODELS
class CartItem(BaseModel):
    seller_id: str
    merch_subtotal_minor: int = Field(..., ge=0, description="Merchandise subtotal in minor units")
    delivery_minor: int = Field(default=0, ge=0, description="Delivery fee in minor units")
    abattoir_minor: int = Field(default=0, ge=0, description="Abattoir fee in minor units")
    species: Optional[str] = None
    export: bool = False

class CheckoutPreviewRequest(BaseModel):
    cart: List[CartItem]
    currency: str = Field(default="ZAR", pattern="^[A-Z]{3}$")

class FeeLineItems(BaseModel):
    merch_subtotal_minor: int
    buyer_processing_fee_minor: int
    escrow_service_fee_minor: int
    buyer_commission_minor: int
    delivery_minor: int
    abattoir_minor: int

class FeeTotals(BaseModel):
    buyer_total_minor: int
    seller_net_payout_minor: int

class FeeDeductions(BaseModel):
    platform_commission_minor: int
    seller_payout_fee_minor: int

class SellerFeeCalculation(BaseModel):
    seller_id: str
    fee_model: FeeModel
    lines: FeeLineItems
    totals: FeeTotals
    deductions: FeeDeductions

class CartTotals(BaseModel):
    buyer_grand_total_minor: int
    seller_total_net_payout_minor: int
    platform_revenue_estimate_minor: int

class CheckoutPreviewResponse(BaseModel):
    per_seller: List[SellerFeeCalculation]
    cart_totals: CartTotals
    fee_config_id: str
    currency: str = "ZAR"

# SELLER ORDER FEE SNAPSHOT (Immutable)
class SellerOrderFees(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_order_id: str
    fee_config_id: str
    model: str  # Snapshot of fee model at time of order
    
    # Base amounts
    merch_subtotal_minor: int
    delivery_minor: int = 0
    abattoir_minor: int = 0
    
    # Buyer-side charges
    buyer_processing_fee_minor: int = 0
    escrow_service_fee_minor: int = 0
    buyer_commission_minor: int = 0
    
    # Seller-side deductions
    platform_commission_minor: int = 0
    seller_payout_fee_minor: int = 0
    
    # Totals
    buyer_total_minor: int
    seller_net_payout_minor: int
    
    currency: str = "ZAR"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# PAYOUT MODELS
class PayoutCreate(BaseModel):
    seller_order_id: str
    amount_minor: int = Field(..., ge=0)
    currency: str = Field(default="ZAR", regex="^[A-Z]{3}$")

class Payout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seller_order_id: str
    amount_minor: int
    currency: str = "ZAR"
    status: PayoutStatus = PayoutStatus.PENDING
    transfer_ref: Optional[str] = None
    attempts: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# WEBHOOK MODELS
class WebhookEvent(BaseModel):
    id: int
    provider: str
    event_id: str
    signature: Optional[str] = None
    payload: Dict[str, Any]
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ORDER FINALIZATION MODELS
class OrderFeesFinalization(BaseModel):
    per_seller: List[Dict[str, Any]]  # Computed fee blocks per seller
    fee_config_id: str

class FinalizeOrderFeesRequest(BaseModel):
    order_group_id: str
    per_seller_fees: List[SellerOrderFees]
    fee_config_id: str

# ADMIN MODELS
class FeeConfigActivation(BaseModel):
    config_id: str

class FeeConfigUpdate(BaseModel):
    name: Optional[str] = None
    platform_commission_pct: Optional[float] = Field(None, ge=0, le=50)
    seller_payout_fee_pct: Optional[float] = Field(None, ge=0, le=10)
    buyer_processing_fee_pct: Optional[float] = Field(None, ge=0, le=10)
    escrow_service_fee_minor: Optional[int] = Field(None, ge=0)
    model: Optional[FeeModel] = None
    applies_to: Optional[Dict[str, Any]] = None
    effective_to: Optional[datetime] = None

# ANALYTICS MODELS
class FeeAnalytics(BaseModel):
    total_platform_revenue_minor: int
    total_commission_minor: int
    total_processing_fees_minor: int
    total_escrow_fees_minor: int
    average_commission_rate: float
    orders_by_fee_model: Dict[str, int]
    revenue_by_fee_model: Dict[str, int]

class SellerPayoutSummary(BaseModel):
    seller_id: str
    total_gross_minor: int
    total_commission_minor: int
    total_payout_fees_minor: int
    total_net_payout_minor: int
    pending_payouts_minor: int
    completed_payouts_minor: int
    payout_count: int

# UTILITY MODELS
class FeeCalculationInput(BaseModel):
    merch_subtotal_minor: int
    delivery_minor: int = 0
    abattoir_minor: int = 0
    species: Optional[str] = None
    export: bool = False

class FeeBreakdown(BaseModel):
    """Detailed fee breakdown for transparency"""
    base_amount_minor: int
    commission_rate_pct: float
    commission_minor: int
    processing_fee_rate_pct: float
    processing_fee_minor: int
    payout_fee_rate_pct: float
    payout_fee_minor: int
    escrow_fee_minor: int
    total_buyer_fees_minor: int
    total_seller_deductions_minor: int
    net_to_seller_minor: int
    net_to_platform_minor: int

# VALIDATION HELPERS
class MoneyAmount(BaseModel):
    """Helper for money validation"""
    amount_minor: int = Field(..., ge=0)
    currency: str = Field(default="ZAR", regex="^[A-Z]{3}$")
    
    @property
    def amount_major(self) -> float:
        """Convert minor units to major currency units"""
        return self.amount_minor / 100.0
    
    @classmethod
    def from_major(cls, amount_major: float, currency: str = "ZAR"):
        """Create from major currency units"""
        return cls(
            amount_minor=round(amount_major * 100),
            currency=currency
        )
    
    def __str__(self):
        return f"{self.currency} {self.amount_major:.2f}"

# API RESPONSE MODELS
class FeeConfigResponse(BaseModel):
    success: bool
    config: Optional[FeeConfig] = None
    message: Optional[str] = None

class PayoutResponse(BaseModel):
    success: bool
    payout: Optional[Payout] = None
    message: Optional[str] = None

class FeeCalculationResponse(BaseModel):
    success: bool
    calculation: Optional[SellerFeeCalculation] = None
    breakdown: Optional[FeeBreakdown] = None
    message: Optional[str] = None