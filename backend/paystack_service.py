# 💳 PAYSTACK PAYMENT SERVICE
# Complete escrow system for livestock marketplace

import os
import uuid
import hmac
import hashlib
import json
import time
import aiohttp
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

class PaystackService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.secret_key = os.getenv("PAYSTACK_SECRET_KEY")
        self.public_key = os.getenv("PAYSTACK_PUBLIC_KEY")
        self.demo_mode = os.getenv("PAYSTACK_DEMO_MODE", "false").lower() == "true"
        self.base_url = "https://api.paystack.co"
        
        if not self.secret_key or self.secret_key.startswith("demo-"):
            logger.warning("PAYSTACK_SECRET_KEY not configured - running in demo mode")
            self.demo_mode = True

    async def initialize_transaction(self, email: str, amount: int, order_id: str, 
                                   callback_url: str = None) -> Dict[str, Any]:
        """Initialize Paystack transaction for escrow"""
        try:
            # Demo mode - simulate successful transaction initialization
            if self.demo_mode:
                return {
                    "success": True,
                    "data": {
                        "authorization_url": f"https://demo-checkout.paystack.com/{order_id}",
                        "access_code": f"demo_access_{order_id[:8]}",
                        "reference": f"demo_ref_{order_id[:8]}_{int(time.time())}"
                    },
                    "message": "Demo transaction initialized"
                }
            
            if not self.secret_key:
                raise Exception("Paystack not configured")
            
            # Amount should be in kobo (cents)
            amount_kobo = int(amount * 100)
            
            payload = {
                "email": email,
                "amount": amount_kobo,
                "currency": "ZAR",
                "reference": f"STOCKLOT_{order_id}_{uuid.uuid4().hex[:8]}",
                "callback_url": callback_url or f"{os.getenv('FRONTEND_URL', 'https://buy-request-fix.preview.emergentagent.com')}/payment/callback",
                "metadata": {
                    "order_id": order_id,
                    "platform": "stocklot_livestock",
                    "custom_fields": [
                        {
                            "display_name": "Order ID",
                            "variable_name": "order_id",
                            "value": order_id
                        }
                    ]
                }
            }
            
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/transaction/initialize",
                    json=payload,
                    headers=headers
                ) as response:
                    result = await response.json()
                    
                    if response.status == 200 and result.get("status"):
                        # Store transaction record
                        transaction_doc = {
                            "id": str(uuid.uuid4()),
                            "order_id": order_id,
                            "reference": payload["reference"],
                            "amount": amount,
                            "amount_kobo": amount_kobo,
                            "email": email,
                            "status": "pending",
                            "paystack_data": result.get("data", {}),
                            "created_at": datetime.now(timezone.utc)
                        }
                        await self.db.payment_transactions.insert_one(transaction_doc)
                        
                        return {
                            "ok": True,
                            "reference": payload["reference"],
                            "authorization_url": result["data"]["authorization_url"],
                            "access_code": result["data"]["access_code"]
                        }
                    else:
                        logger.error(f"Paystack initialization failed: {result}")
                        raise Exception(f"Payment initialization failed: {result.get('message', 'Unknown error')}")
                        
        except Exception as e:
            logger.error(f"Error initializing payment: {e}")
            raise

    async def verify_transaction(self, reference: str) -> Dict[str, Any]:
        """Verify transaction status with Paystack"""
        try:
            # Demo mode - simulate successful verification
            if self.demo_mode:
                return {
                    "status": "success",
                    "data": {
                        "status": "success" if reference.startswith("demo_ref_") else "failed",
                        "reference": reference,
                        "amount": 100000,  # 1000.00 in kobo
                        "currency": "ZAR",
                        "transaction_date": datetime.now(timezone.utc).isoformat(),
                        "gateway_response": "Demo transaction successful"
                    },
                    "message": "Demo verification successful"
                }
            
            if not self.secret_key:
                raise Exception("Paystack not configured")
                
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/transaction/verify/{reference}",
                    headers=headers
                ) as response:
                    result = await response.json()
                    
                    if response.status == 200 and result.get("status"):
                        payment_data = result["data"]
                        
                        # Update transaction record
                        await self.db.payment_transactions.update_one(
                            {"reference": reference},
                            {"$set": {
                                "status": payment_data["status"],
                                "gateway_response": payment_data.get("gateway_response"),
                                "paid_at": payment_data.get("paid_at"),
                                "verification_data": payment_data,
                                "verified_at": datetime.now(timezone.utc)
                            }}
                        )
                        
                        return {
                            "ok": True,
                            "status": payment_data["status"],
                            "amount": payment_data["amount"] / 100,  # Convert from kobo
                            "paid_at": payment_data.get("paid_at"),
                            "customer_email": payment_data["customer"]["email"],
                            "metadata": payment_data.get("metadata", {})
                        }
                    else:
                        logger.error(f"Paystack verification failed: {result}")
                        return {"ok": False, "error": result.get("message", "Verification failed")}
                        
        except Exception as e:
            logger.error(f"Error verifying payment: {e}")
            raise

    async def process_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Process Paystack webhook securely"""
        try:
            if not self.secret_key:
                raise Exception("Paystack not configured")
                
            # Verify webhook signature
            expected_signature = hmac.new(
                self.secret_key.encode('utf-8'),
                payload,
                hashlib.sha512
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                logger.warning("Invalid webhook signature")
                return {"ok": False, "error": "Invalid signature"}
            
            # Parse webhook data
            webhook_data = json.loads(payload.decode('utf-8'))
            event_type = webhook_data.get("event")
            data = webhook_data.get("data", {})
            
            logger.info(f"Processing webhook: {event_type}")
            
            if event_type == "charge.success":
                return await self.handle_successful_payment(data)
            elif event_type == "charge.failed":
                return await self.handle_failed_payment(data)
            else:
                logger.info(f"Unhandled webhook event: {event_type}")
                return {"ok": True, "handled": False}
                
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            return {"ok": False, "error": str(e)}

    async def handle_successful_payment(self, payment_data: dict) -> Dict[str, Any]:
        """Handle successful payment and release escrow"""
        try:
            reference = payment_data["reference"]
            metadata = payment_data.get("metadata", {})
            order_id = metadata.get("order_id")
            
            if not order_id:
                logger.error("No order_id in payment metadata")
                return {"ok": False, "error": "Missing order_id"}
            
            # Update order status to PAID
            await self.db.orders.update_one(
                {"id": order_id},
                {"$set": {
                    "status": "paid",
                    "payment_reference": reference,
                    "paid_at": datetime.now(timezone.utc),
                    "payment_amount": payment_data["amount"] / 100
                }}
            )
            
            # Create escrow record
            escrow_doc = {
                "id": str(uuid.uuid4()),
                "order_id": order_id,
                "reference": reference,
                "amount": payment_data["amount"] / 100,
                "currency": payment_data["currency"],
                "status": "held",
                "created_at": datetime.now(timezone.utc)
            }
            await self.db.escrows.insert_one(escrow_doc)
            
            # Notify both parties
            order = await self.db.orders.find_one({"id": order_id})
            if order:
                # Import notification service here to avoid circular imports
                from notification_service_extended import ExtendedNotificationService
                notification_service = ExtendedNotificationService(self.db)
                
                await notification_service.notify_order_paid(
                    order_id=order_id,
                    seller_id=order["seller_id"],
                    buyer_id=order["buyer_id"]
                )
            
            logger.info(f"Payment successful for order {order_id}")
            return {"ok": True, "order_id": order_id, "status": "escrow_held"}
            
        except Exception as e:
            logger.error(f"Error handling successful payment: {e}")
            return {"ok": False, "error": str(e)}

    async def handle_failed_payment(self, payment_data: dict) -> Dict[str, Any]:
        """Handle failed payment"""
        try:
            reference = payment_data["reference"]
            metadata = payment_data.get("metadata", {})
            order_id = metadata.get("order_id")
            
            if order_id:
                # Update order status to FAILED
                await self.db.orders.update_one(
                    {"id": order_id},
                    {"$set": {
                        "status": "payment_failed",
                        "payment_reference": reference,
                        "failed_at": datetime.now(timezone.utc),
                        "failure_reason": payment_data.get("gateway_response", "Payment failed")
                    }}
                )
            
            logger.info(f"Payment failed for order {order_id}")
            return {"ok": True, "status": "failed"}
            
        except Exception as e:
            logger.error(f"Error handling failed payment: {e}")
            return {"ok": False, "error": str(e)}

    async def release_escrow(self, order_id: str, released_by: str) -> Dict[str, Any]:
        """Release escrow funds to seller"""
        try:
            # Find escrow record
            escrow = await self.db.escrows.find_one({"order_id": order_id, "status": "held"})
            if not escrow:
                raise Exception("No held escrow found for order")
            
            # Update escrow status
            await self.db.escrows.update_one(
                {"id": escrow["id"]},
                {"$set": {
                    "status": "released",
                    "released_by": released_by,
                    "released_at": datetime.now(timezone.utc)
                }}
            )
            
            # Update order status
            await self.db.orders.update_one(
                {"id": order_id},
                {"$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc)
                }}
            )
            
            logger.info(f"Escrow released for order {order_id}")
            return {"ok": True, "status": "released"}
            
        except Exception as e:
            logger.error(f"Error releasing escrow: {e}")
            raise

    async def refund_escrow(self, order_id: str, reason: str, refunded_by: str) -> Dict[str, Any]:
        """Refund escrow to buyer"""
        try:
            # Find escrow record
            escrow = await self.db.escrows.find_one({"order_id": order_id, "status": "held"})
            if not escrow:
                raise Exception("No held escrow found for order")
            
            # Update escrow status
            await self.db.escrows.update_one(
                {"id": escrow["id"]},
                {"$set": {
                    "status": "refunded",
                    "refund_reason": reason,
                    "refunded_by": refunded_by,
                    "refunded_at": datetime.now(timezone.utc)
                }}
            )
            
            # Update order status
            await self.db.orders.update_one(
                {"id": order_id},
                {"$set": {
                    "status": "refunded",
                    "refunded_at": datetime.now(timezone.utc),
                    "refund_reason": reason
                }}
            )
            
            logger.info(f"Escrow refunded for order {order_id}")
            return {"ok": True, "status": "refunded"}
            
        except Exception as e:
            logger.error(f"Error refunding escrow: {e}")
            raise

    # ADMIN FUNCTIONS
    async def get_all_transactions(self, limit: int = 100) -> list:
        """Get all payment transactions for admin review"""
        try:
            transactions = await self.db.payment_transactions.find({}).sort("created_at", -1).limit(limit).to_list(length=None)
            return transactions
        except Exception as e:
            logger.error(f"Error getting transactions: {e}")
            raise

    async def get_all_escrows(self, status: Optional[str] = None, limit: int = 100) -> list:
        """Get all escrow records for admin review"""
        try:
            query = {}
            if status:
                query["status"] = status
                
            escrows = await self.db.escrows.find(query).sort("created_at", -1).limit(limit).to_list(length=None)
            return escrows
        except Exception as e:
            logger.error(f"Error getting escrows: {e}")
            raise