# 💰 FEE CALCULATION SERVICE
# Dual fee model implementation with precise money math

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
import math

from models_fees import (
    FeeModel, FeeConfig, FeeConfigCreate, CartItem, SellerFeeCalculation,
    CheckoutPreviewResponse, CartTotals, FeeLineItems, FeeTotals, FeeDeductions,
    SellerOrderFees, Payout, PayoutStatus, FeeBreakdown, MoneyAmount
)

logger = logging.getLogger(__name__)

class FeeService:
    """Comprehensive fee calculation and management service"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
        # Default fee rates (can be overridden by active config)
        self.default_rates = {
            'platform_commission_pct': 10.0,
            'seller_payout_fee_pct': 2.5,
            'buyer_processing_fee_pct': 1.5,
            'escrow_service_fee_minor': 2500  # R25.00
        }
    
    # CORE CALCULATION LOGIC
    def calculate_percentage_fee(self, base_amount_minor: int, rate_pct: float) -> int:
        """Calculate percentage fee with banker's rounding"""
        return round(base_amount_minor * (rate_pct / 100.0))
    
    def calculate_seller_order_fees(
        self,
        config: FeeConfig,
        merch_minor: int,
        delivery_minor: int = 0,
        abattoir_minor: int = 0
    ) -> SellerFeeCalculation:
        """Calculate fees for a single seller order"""
        
        # Calculate individual fees using banker's rounding
        buyer_processing_minor = self.calculate_percentage_fee(
            merch_minor, config.buyer_processing_fee_pct
        )
        escrow_minor = config.escrow_service_fee_minor
        
        # Initialize commission variables
        buyer_commission_minor = 0
        platform_commission_minor = 0
        seller_payout_fee_minor = self.calculate_percentage_fee(
            merch_minor, config.seller_payout_fee_pct
        )
        
        # Apply fee model logic
        if config.model == FeeModel.BUYER_PAYS_COMMISSION:
            buyer_commission_minor = self.calculate_percentage_fee(
                merch_minor, config.platform_commission_pct
            )
        else:  # SELLER_PAYS
            platform_commission_minor = self.calculate_percentage_fee(
                merch_minor, config.platform_commission_pct
            )
        
        # Calculate totals
        buyer_total_minor = (
            merch_minor +
            delivery_minor +
            abattoir_minor +
            buyer_processing_minor +
            escrow_minor +
            buyer_commission_minor
        )
        
        seller_net_payout_minor = (
            merch_minor -
            platform_commission_minor -
            seller_payout_fee_minor
        )
        
        # Create response structure
        return SellerFeeCalculation(
            seller_id="", # Will be set by caller
            fee_model=config.model,
            lines=FeeLineItems(
                merch_subtotal_minor=merch_minor,
                delivery_minor=delivery_minor,
                abattoir_minor=abattoir_minor,
                buyer_processing_fee_minor=buyer_processing_minor,
                escrow_service_fee_minor=escrow_minor,
                buyer_commission_minor=buyer_commission_minor
            ),
            totals=FeeTotals(
                buyer_total_minor=buyer_total_minor,
                seller_net_payout_minor=seller_net_payout_minor
            ),
            deductions=FeeDeductions(
                platform_commission_minor=platform_commission_minor,
                seller_payout_fee_minor=seller_payout_fee_minor
            )
        )
    
    # CONFIG MANAGEMENT
    async def create_fee_config(self, config_data: FeeConfigCreate) -> FeeConfig:
        """Create new fee configuration"""
        try:
            config = FeeConfig(
                **config_data.dict(),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Insert into database
            await self.db.fee_configs.insert_one(config.dict())
            
            logger.info(f"Created fee config: {config.id} ({config.name})")
            return config
            
        except Exception as e:
            logger.error(f"Error creating fee config: {e}")
            raise
    
    async def get_active_fee_config(
        self, 
        species: Optional[str] = None, 
        export: bool = False
    ) -> Optional[FeeConfig]:
        """Get currently active fee configuration with rule matching"""
        try:
            # Find active config
            config_doc = await self.db.fee_configs.find_one({
                "is_active": True,
                "effective_from": {"$lte": datetime.now(timezone.utc)},
                "$or": [
                    {"effective_to": {"$gt": datetime.now(timezone.utc)}},
                    {"effective_to": None}
                ]
            })
            
            if not config_doc:
                logger.warning("No active fee config found, using defaults")
                return self._create_default_config()
            
            config = FeeConfig(**config_doc)
            
            # Check if applies_to rules match
            if config.applies_to:
                if species and "species" in config.applies_to:
                    if species not in config.applies_to["species"]:
                        return self._create_default_config()
                
                if "export_only" in config.applies_to:
                    if config.applies_to["export_only"] and not export:
                        return self._create_default_config()
            
            return config
            
        except Exception as e:
            logger.error(f"Error getting active fee config: {e}")
            return self._create_default_config()
    
    def _create_default_config(self) -> FeeConfig:
        """Create default fee configuration"""
        return FeeConfig(
            name="default-fallback",
            platform_commission_pct=self.default_rates['platform_commission_pct'],
            seller_payout_fee_pct=self.default_rates['seller_payout_fee_pct'],
            buyer_processing_fee_pct=self.default_rates['buyer_processing_fee_pct'],
            escrow_service_fee_minor=self.default_rates['escrow_service_fee_minor'],
            model=FeeModel.SELLER_PAYS,
            is_active=True,
            effective_from=datetime.now(timezone.utc)
        )
    
    async def activate_fee_config(self, config_id: str) -> bool:
        """Activate a fee configuration (deactivating others)"""
        try:
            # Deactivate all existing configs
            await self.db.fee_configs.update_many(
                {"is_active": True},
                {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
            )
            
            # Activate the specified config
            result = await self.db.fee_configs.update_one(
                {"id": config_id},
                {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc)}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Activated fee config: {config_id}")
                return True
            else:
                logger.warning(f"Fee config not found for activation: {config_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error activating fee config: {e}")
            return False
    
    # CHECKOUT PREVIEW
    async def calculate_checkout_preview(self, cart: List[CartItem]) -> CheckoutPreviewResponse:
        """Calculate comprehensive checkout preview for multi-seller cart"""
        try:
            per_seller_calculations = []
            cart_totals = CartTotals(
                buyer_grand_total_minor=0,
                seller_total_net_payout_minor=0,
                platform_revenue_estimate_minor=0
            )
            
            # Get fee config (use first item's attributes for rule matching)
            first_item = cart[0] if cart else CartItem(seller_id="", merch_subtotal_minor=0)
            active_config = await self.get_active_fee_config(
                species=first_item.species,
                export=first_item.export
            )
            
            # Calculate fees per seller
            for item in cart:
                # Get seller-specific config if needed
                seller_config = await self.get_active_fee_config(
                    species=item.species,
                    export=item.export
                )
                
                # Calculate fees for this seller
                calculation = self.calculate_seller_order_fees(
                    seller_config,
                    item.merch_subtotal_minor,
                    item.delivery_minor,
                    item.abattoir_minor
                )
                calculation.seller_id = item.seller_id
                
                per_seller_calculations.append(calculation)
                
                # Add to cart totals
                cart_totals.buyer_grand_total_minor += calculation.totals.buyer_total_minor
                cart_totals.seller_total_net_payout_minor += calculation.totals.seller_net_payout_minor
                
                # Calculate platform revenue
                platform_revenue = (
                    calculation.deductions.platform_commission_minor +
                    calculation.lines.buyer_commission_minor +
                    calculation.lines.buyer_processing_fee_minor +
                    calculation.lines.escrow_service_fee_minor
                )
                cart_totals.platform_revenue_estimate_minor += platform_revenue
            
            return CheckoutPreviewResponse(
                per_seller=per_seller_calculations,
                cart_totals=cart_totals,
                fee_config_id=active_config.id,
                currency="ZAR"
            )
            
        except Exception as e:
            logger.error(f"Error calculating checkout preview: {e}")
            raise
    
    # ORDER FINALIZATION
    async def finalize_order_fees(
        self,
        order_group_id: str,
        cart: List[CartItem],
        fee_config_id: str
    ) -> List[SellerOrderFees]:
        """Finalize and store immutable fee snapshots for an order"""
        try:
            # Get fee config
            config_doc = await self.db.fee_configs.find_one({"id": fee_config_id})
            if not config_doc:
                raise ValueError(f"Fee config not found: {fee_config_id}")
            
            config = FeeConfig(**config_doc)
            finalized_fees = []
            
            # Calculate and store fees per seller
            for item in cart:
                # Recalculate fees (never trust client data)
                calculation = self.calculate_seller_order_fees(
                    config,
                    item.merch_subtotal_minor,
                    item.delivery_minor,
                    item.abattoir_minor
                )
                
                # Create immutable fee snapshot
                seller_order_fees = SellerOrderFees(
                    seller_order_id=f"{order_group_id}_{item.seller_id}",  # Composite ID
                    fee_config_id=fee_config_id,
                    model=config.model.value,
                    merch_subtotal_minor=item.merch_subtotal_minor,
                    delivery_minor=item.delivery_minor,
                    abattoir_minor=item.abattoir_minor,
                    buyer_processing_fee_minor=calculation.lines.buyer_processing_fee_minor,
                    escrow_service_fee_minor=calculation.lines.escrow_service_fee_minor,
                    buyer_commission_minor=calculation.lines.buyer_commission_minor,
                    platform_commission_minor=calculation.deductions.platform_commission_minor,
                    seller_payout_fee_minor=calculation.deductions.seller_payout_fee_minor,
                    buyer_total_minor=calculation.totals.buyer_total_minor,
                    seller_net_payout_minor=calculation.totals.seller_net_payout_minor
                )
                
                # Store in database
                await self.db.seller_order_fees.insert_one(seller_order_fees.dict())
                finalized_fees.append(seller_order_fees)
                
                logger.info(f"Finalized fees for seller order: {seller_order_fees.seller_order_id}")
            
            return finalized_fees
            
        except Exception as e:
            logger.error(f"Error finalizing order fees: {e}")
            raise
    
    # PAYOUT PROCESSING
    async def calculate_payout_amount(self, seller_order_id: str) -> Optional[int]:
        """Get net payout amount for seller from immutable fee snapshot"""
        try:
            fee_snapshot = await self.db.seller_order_fees.find_one({
                "seller_order_id": seller_order_id
            })
            
            if not fee_snapshot:
                logger.error(f"Fee snapshot not found for seller order: {seller_order_id}")
                return None
            
            return fee_snapshot["seller_net_payout_minor"]
            
        except Exception as e:
            logger.error(f"Error calculating payout amount: {e}")
            return None
    
    async def create_payout(self, seller_order_id: str) -> Optional[Payout]:
        """Create payout record for seller"""
        try:
            # Get payout amount from fee snapshot
            payout_amount = await self.calculate_payout_amount(seller_order_id)
            if payout_amount is None:
                return None
            
            # Check if payout already exists
            existing_payout = await self.db.payouts.find_one({
                "seller_order_id": seller_order_id
            })
            
            if existing_payout:
                logger.warning(f"Payout already exists for seller order: {seller_order_id}")
                return Payout(**existing_payout)
            
            # Create new payout
            payout = Payout(
                seller_order_id=seller_order_id,
                amount_minor=payout_amount,
                currency="ZAR",
                status=PayoutStatus.PENDING
            )
            
            # Store in database
            await self.db.payouts.insert_one(payout.dict())
            
            logger.info(f"Created payout: {payout.id} for amount: R{payout_amount/100:.2f}")
            return payout
            
        except Exception as e:
            logger.error(f"Error creating payout: {e}")
            return None
    
    async def update_payout_status(
        self,
        payout_id: str,
        status: PayoutStatus,
        transfer_ref: Optional[str] = None
    ) -> bool:
        """Update payout status and transfer reference"""
        try:
            update_data = {
                "status": status.value,
                "updated_at": datetime.now(timezone.utc)
            }
            
            if transfer_ref:
                update_data["transfer_ref"] = transfer_ref
            
            if status == PayoutStatus.FAILED:
                # Increment attempt counter
                await self.db.payouts.update_one(
                    {"id": payout_id},
                    {"$inc": {"attempts": 1}}
                )
            
            result = await self.db.payouts.update_one(
                {"id": payout_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated payout {payout_id} status to {status}")
                return True
            else:
                logger.warning(f"Payout not found for status update: {payout_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating payout status: {e}")
            return False
    
    # ANALYTICS & REPORTING
    async def get_fee_breakdown(
        self,
        merch_amount_minor: int,
        config: Optional[FeeConfig] = None
    ) -> FeeBreakdown:
        """Get detailed fee breakdown for transparency"""
        try:
            if not config:
                config = await self.get_active_fee_config()
            
            calculation = self.calculate_seller_order_fees(
                config, merch_amount_minor
            )
            
            return FeeBreakdown(
                base_amount_minor=merch_amount_minor,
                commission_rate_pct=config.platform_commission_pct,
                commission_minor=calculation.deductions.platform_commission_minor + calculation.lines.buyer_commission_minor,
                processing_fee_rate_pct=config.buyer_processing_fee_pct,
                processing_fee_minor=calculation.lines.buyer_processing_fee_minor,
                payout_fee_rate_pct=config.seller_payout_fee_pct,
                payout_fee_minor=calculation.deductions.seller_payout_fee_minor,
                escrow_fee_minor=calculation.lines.escrow_service_fee_minor,
                total_buyer_fees_minor=(
                    calculation.lines.buyer_processing_fee_minor +
                    calculation.lines.escrow_service_fee_minor +
                    calculation.lines.buyer_commission_minor
                ),
                total_seller_deductions_minor=(
                    calculation.deductions.platform_commission_minor +
                    calculation.deductions.seller_payout_fee_minor
                ),
                net_to_seller_minor=calculation.totals.seller_net_payout_minor,
                net_to_platform_minor=(
                    calculation.deductions.platform_commission_minor +
                    calculation.lines.buyer_commission_minor +
                    calculation.lines.buyer_processing_fee_minor +
                    calculation.lines.escrow_service_fee_minor
                )
            )
            
        except Exception as e:
            logger.error(f"Error generating fee breakdown: {e}")
            raise
    
    async def get_platform_revenue_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get platform revenue summary for analytics"""
        try:
            pipeline = [
                {
                    "$match": {
                        "created_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$model",
                        "total_orders": {"$sum": 1},
                        "total_commission": {"$sum": {
                            "$add": ["$platform_commission_minor", "$buyer_commission_minor"]
                        }},
                        "total_processing_fees": {"$sum": "$buyer_processing_fee_minor"},
                        "total_escrow_fees": {"$sum": "$escrow_service_fee_minor"},
                        "total_payout_fees": {"$sum": "$seller_payout_fee_minor"}
                    }
                }
            ]
            
            results = await self.db.seller_order_fees.aggregate(pipeline).to_list(length=None)
            
            summary = {
                "period": {"start": start_date, "end": end_date},
                "by_model": {},
                "totals": {
                    "orders": 0,
                    "commission_minor": 0,
                    "processing_fees_minor": 0,
                    "escrow_fees_minor": 0,
                    "payout_fees_minor": 0,
                    "total_revenue_minor": 0
                }
            }
            
            for result in results:
                model = result["_id"]
                data = {
                    "orders": result["total_orders"],
                    "commission_minor": result["total_commission"],
                    "processing_fees_minor": result["total_processing_fees"],
                    "escrow_fees_minor": result["total_escrow_fees"],
                    "payout_fees_minor": result["total_payout_fees"]
                }
                data["total_revenue_minor"] = (
                    data["commission_minor"] +
                    data["processing_fees_minor"] +
                    data["escrow_fees_minor"]
                )
                
                summary["by_model"][model] = data
                
                # Add to totals
                for key in ["orders", "commission_minor", "processing_fees_minor", 
                          "escrow_fees_minor", "payout_fees_minor", "total_revenue_minor"]:
                    summary["totals"][key] += data[key]
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating platform revenue summary: {e}")
            return {}
    
    # WEBHOOK PROCESSING
    async def record_webhook_event(
        self,
        provider: str,
        event_id: str,
        payload: Dict[str, Any],
        signature: Optional[str] = None
    ) -> bool:
        """Record webhook event with idempotency"""
        try:
            # Check if event already processed
            existing = await self.db.webhook_events.find_one({
                "provider": provider,
                "event_id": event_id
            })
            
            if existing:
                logger.info(f"Webhook event already processed: {provider}:{event_id}")
                return True
            
            # Insert new event
            webhook_event = {
                "provider": provider,
                "event_id": event_id,
                "signature": signature,
                "payload": payload,
                "received_at": datetime.now(timezone.utc)
            }
            
            await self.db.webhook_events.insert_one(webhook_event)
            logger.info(f"Recorded webhook event: {provider}:{event_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error recording webhook event: {e}")
            return False