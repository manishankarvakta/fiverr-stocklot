"""
Transfer Automation Service for South African Livestock Marketplace
Handles automated transfers, escrow releases, and background processing
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid
import asyncio

from .paystack_transfer_client import PaystackTransferClient, PaystackError
from .transfer_recipient_service import TransferRecipientService
from .transfer_models import (
    Transfer, TransferStatus, EscrowTransaction, EscrowStatus,
    TransferCreate, EscrowReleaseRequest
)

logger = logging.getLogger(__name__)

class TransferAutomationService:
    def __init__(self, db, paystack_client: PaystackTransferClient = None):
        self.db = db
        self.paystack_client = paystack_client or PaystackTransferClient()
        self.recipient_service = TransferRecipientService(db, paystack_client)
        
        # Configuration
        self.min_transfer_amount = 100  # ZAR 1.00 in cents
        self.max_transfer_amount = 1000000  # ZAR 10,000.00 in cents
    
    def _generate_transfer_reference(self) -> str:
        """Generate secure transfer reference"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_suffix = str(uuid.uuid4()).replace('-', '')[:8].upper()
        return f"LSM_TRF_{timestamp}_{random_suffix}"
    
    async def initiate_transfer(
        self,
        sender_id: str,
        recipient_id: str,
        amount: int,  # Amount in cents
        reason: str = None,
        reference: str = None,
        escrow_transaction_id: str = None,
        livestock_listing_id: str = None
    ) -> Transfer:
        """Initiate a transfer to a recipient"""
        
        try:
            # Validate recipient
            recipient = await self.recipient_service.get_recipient_by_id(recipient_id)
            if not recipient or not recipient.is_active:
                raise ValueError("Transfer recipient not found or inactive")
            
            if not recipient.is_validated and recipient.recipient_type == "basa":
                raise ValueError("Bank account recipient must be validated before transfers")
            
            # Validate amount
            if amount < self.min_transfer_amount:
                raise ValueError(f"Transfer amount must be at least ZAR {self.min_transfer_amount / 100:.2f}")
            
            if amount > self.max_transfer_amount:
                raise ValueError(f"Transfer amount cannot exceed ZAR {self.max_transfer_amount / 100:.2f}")
            
            # Generate reference if not provided
            if not reference:
                reference = self._generate_transfer_reference()
            
            # Check for duplicate reference
            existing_transfer = await self.db.transfers.find_one({"reference": reference})
            if existing_transfer:
                raise ValueError(f"Transfer with reference {reference} already exists")
            
            # Create transfer record
            transfer_data = {
                "id": str(uuid.uuid4()),
                "reference": reference,
                "sender_id": sender_id,
                "recipient_id": recipient_id,
                "recipient_user_id": recipient.user_id,
                "amount": amount,
                "currency": "ZAR",
                "reason": reason or f"Transfer to {recipient.name}",
                "escrow_transaction_id": escrow_transaction_id,
                "livestock_listing_id": livestock_listing_id,
                "status": TransferStatus.PENDING.value,
                "retry_count": 0,
                "max_retries": 3,
                "initiated_at": datetime.now(),
                "created_at": datetime.now()
            }
            
            await self.db.transfers.insert_one(transfer_data)
            
            logger.info(f"Created transfer {transfer_data['id']} with reference {reference}")
            
            # Process transfer asynchronously
            asyncio.create_task(self._process_single_transfer(transfer_data["id"]))
            
            # Remove MongoDB ObjectId for return
            transfer_data.pop("_id", None)
            return Transfer(**transfer_data)
            
        except Exception as e:
            logger.error(f"Error creating transfer: {str(e)}")
            raise ValueError(f"Transfer creation failed: {str(e)}")
    
    async def _process_single_transfer(self, transfer_id: str) -> bool:
        """Process a single transfer"""
        
        try:
            transfer_doc = await self.db.transfers.find_one({"id": transfer_id})
            if not transfer_doc:
                logger.error(f"Transfer {transfer_id} not found")
                return False
            
            if transfer_doc.get("status") != TransferStatus.PENDING.value:
                logger.warning(f"Transfer {transfer_id} is not in pending status: {transfer_doc.get('status')}")
                return False
            
            # Get recipient details
            recipient = await self.recipient_service.get_recipient_by_id(transfer_doc["recipient_id"])
            if not recipient:
                await self._mark_transfer_failed(transfer_id, "Transfer recipient not found")
                return False
            
            # Update transfer status to processing
            await self.db.transfers.update_one(
                {"id": transfer_id},
                {"$set": {"status": TransferStatus.PROCESSING.value, "updated_at": datetime.now()}}
            )
            
            logger.info(f"Processing transfer {transfer_id} to recipient {recipient.paystack_recipient_code}")
            
            # Initiate Paystack transfer
            transfer_response = await self.paystack_client.initiate_transfer(
                recipient_code=recipient.paystack_recipient_code,
                amount=transfer_doc["amount"],
                reference=transfer_doc["reference"],
                reason=transfer_doc["reason"],
                currency="ZAR"
            )
            
            if transfer_response.status:
                # Transfer initiated successfully
                transfer_data = transfer_response.data
                
                update_data = {
                    "paystack_transfer_code": transfer_data.get("transfer_code"),
                    "paystack_transfer_id": transfer_data.get("id"),
                    "updated_at": datetime.now()
                }
                
                # Check immediate status
                paystack_status = transfer_data.get("status")
                if paystack_status == "success":
                    update_data["status"] = TransferStatus.SUCCESS.value
                    update_data["completed_at"] = datetime.now()
                    logger.info(f"Transfer {transfer_id} completed immediately")
                elif paystack_status == "failed":
                    update_data["status"] = TransferStatus.FAILED.value
                    update_data["failure_reason"] = transfer_data.get("message", "Transfer failed")
                    update_data["failed_at"] = datetime.now()
                    logger.error(f"Transfer {transfer_id} failed immediately: {update_data['failure_reason']}")
                else:
                    # Transfer is pending - will be updated by webhook
                    logger.info(f"Transfer {transfer_id} is pending, awaiting webhook notification")
                
                await self.db.transfers.update_one(
                    {"id": transfer_id},
                    {"$set": update_data}
                )
                
                return True
            else:
                # Transfer initiation failed
                await self._handle_transfer_failure(transfer_id, transfer_response.message)
                return False
                
        except PaystackError as e:
            logger.error(f"Paystack error processing transfer {transfer_id}: {e.message}")
            await self._handle_transfer_failure(transfer_id, e.message)
            return False
        except Exception as e:
            logger.error(f"Unexpected error processing transfer {transfer_id}: {str(e)}")
            await self._handle_transfer_failure(transfer_id, f"Processing error: {str(e)}")
            return False
    
    async def _handle_transfer_failure(self, transfer_id: str, error_message: str):
        """Handle transfer failure with retry logic"""
        
        transfer_doc = await self.db.transfers.find_one({"id": transfer_id})
        if not transfer_doc:
            return
        
        retry_count = transfer_doc.get("retry_count", 0) + 1
        max_retries = transfer_doc.get("max_retries", 3)
        
        update_data = {
            "retry_count": retry_count,
            "failure_reason": error_message,
            "updated_at": datetime.now()
        }
        
        if retry_count <= max_retries:
            # Schedule retry with exponential backoff
            retry_delay = min(300 * (2 ** (retry_count - 1)), 1800)  # Max 30 minutes
            
            logger.info(f"Scheduling retry for transfer {transfer_id} in {retry_delay} seconds (attempt {retry_count}/{max_retries})")
            
            # Reset to pending for retry
            update_data["status"] = TransferStatus.PENDING.value
            
            # Schedule retry (in production, this would use Celery or similar)
            asyncio.create_task(self._retry_transfer_after_delay(transfer_id, retry_delay))
        else:
            # Max retries exceeded
            update_data["status"] = TransferStatus.FAILED.value
            update_data["failed_at"] = datetime.now()
            
            logger.error(f"Transfer {transfer_id} failed after {retry_count} attempts: {error_message}")
            
            # TODO: Notify admin of failed transfer
        
        await self.db.transfers.update_one(
            {"id": transfer_id},
            {"$set": update_data}
        )
    
    async def _retry_transfer_after_delay(self, transfer_id: str, delay_seconds: int):
        """Retry transfer after delay"""
        await asyncio.sleep(delay_seconds)
        await self._process_single_transfer(transfer_id)
    
    async def _mark_transfer_failed(self, transfer_id: str, reason: str):
        """Mark transfer as permanently failed"""
        await self.db.transfers.update_one(
            {"id": transfer_id},
            {
                "$set": {
                    "status": TransferStatus.FAILED.value,
                    "failure_reason": reason,
                    "failed_at": datetime.now(),
                    "updated_at": datetime.now()
                }
            }
        )
        
        logger.error(f"Transfer {transfer_id} marked as failed: {reason}")
    
    async def process_escrow_release(
        self,
        escrow_transaction_id: str,
        released_by_user_id: str = None,
        release_reason: str = None
    ) -> Transfer:
        """Process escrow release and initiate transfer"""
        
        try:
            escrow_doc = await self.db.escrow_transactions.find_one({"id": escrow_transaction_id})
            if not escrow_doc:
                raise ValueError("Escrow transaction not found")
            
            if escrow_doc.get("status") != EscrowStatus.FUNDED.value:
                raise ValueError(f"Escrow transaction is not funded: {escrow_doc.get('status')}")
            
            # Check if transfer already exists
            existing_transfer = await self.db.transfers.find_one({"escrow_transaction_id": escrow_transaction_id})
            if existing_transfer:
                logger.warning(f"Transfer already exists for escrow transaction {escrow_transaction_id}")
                existing_transfer.pop("_id", None)
                return Transfer(**existing_transfer)
            
            # Get seller's transfer recipient
            seller_recipients = await self.recipient_service.get_user_recipients(
                user_id=escrow_doc["seller_id"],
                include_inactive=False
            )
            
            if not seller_recipients:
                raise ValueError("No active transfer recipient found for seller")
            
            # Use the most recently created recipient
            recipient = seller_recipients[0]
            
            # Update escrow status
            escrow_update = {
                "status": EscrowStatus.RELEASED.value,
                "released_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            if release_reason:
                escrow_update["release_reason"] = release_reason
            
            if released_by_user_id:
                escrow_update["release_approved_by_admin"] = True
            
            await self.db.escrow_transactions.update_one(
                {"id": escrow_transaction_id},
                {"$set": escrow_update}
            )
            
            # Get listing title for transfer reason
            listing_title = "Unknown listing"
            if escrow_doc.get("livestock_listing_id"):
                listing_doc = await self.db.listings.find_one({"id": escrow_doc["livestock_listing_id"]})
                if listing_doc:
                    listing_title = listing_doc.get("title", "Unknown listing")
            
            # Initiate transfer
            transfer = await self.initiate_transfer(
                sender_id=escrow_doc["buyer_id"],  # Technically from escrow, but tracking buyer
                recipient_id=recipient.id,
                amount=escrow_doc["seller_amount"],
                reason=f"Livestock sale payment - {listing_title}",
                escrow_transaction_id=escrow_transaction_id,
                livestock_listing_id=escrow_doc.get("livestock_listing_id")
            )
            
            logger.info(f"Initiated transfer {transfer.id} for escrow release {escrow_transaction_id}")
            return transfer
            
        except Exception as e:
            logger.error(f"Error processing escrow release {escrow_transaction_id}: {str(e)}")
            raise ValueError(f"Escrow release failed: {str(e)}")
    
    async def get_transfer_status(self, transfer_id: str) -> Dict[str, Any]:
        """Get detailed transfer status"""
        
        transfer_doc = await self.db.transfers.find_one({"id": transfer_id})
        if not transfer_doc:
            raise ValueError("Transfer not found")
        
        # Get latest status from Paystack if transfer is still pending
        if (transfer_doc.get("status") == TransferStatus.PENDING.value and 
            transfer_doc.get("paystack_transfer_code")):
            try:
                status_response = await self.paystack_client.fetch_transfer(
                    transfer_doc["paystack_transfer_code"]
                )
                if status_response.status:
                    paystack_status = status_response.data.get("status")
                    if paystack_status == "success" and transfer_doc.get("status") != TransferStatus.SUCCESS.value:
                        await self.db.transfers.update_one(
                            {"id": transfer_id},
                            {
                                "$set": {
                                    "status": TransferStatus.SUCCESS.value,
                                    "completed_at": datetime.now(),
                                    "updated_at": datetime.now()
                                }
                            }
                        )
                        transfer_doc["status"] = TransferStatus.SUCCESS.value
                        transfer_doc["completed_at"] = datetime.now()
                    elif paystack_status == "failed" and transfer_doc.get("status") != TransferStatus.FAILED.value:
                        await self.db.transfers.update_one(
                            {"id": transfer_id},
                            {
                                "$set": {
                                    "status": TransferStatus.FAILED.value,
                                    "failure_reason": status_response.data.get("message", "Transfer failed"),
                                    "failed_at": datetime.now(),
                                    "updated_at": datetime.now()
                                }
                            }
                        )
                        transfer_doc["status"] = TransferStatus.FAILED.value
                        transfer_doc["failure_reason"] = status_response.data.get("message", "Transfer failed")
                        transfer_doc["failed_at"] = datetime.now()
            except Exception as e:
                logger.warning(f"Failed to fetch transfer status from Paystack: {str(e)}")
        
        # Get recipient name
        recipient_name = None
        if transfer_doc.get("recipient_id"):
            recipient = await self.recipient_service.get_recipient_by_id(transfer_doc["recipient_id"])
            if recipient:
                recipient_name = recipient.name
        
        return {
            "id": transfer_doc["id"],
            "reference": transfer_doc["reference"],
            "status": transfer_doc.get("status"),
            "amount": transfer_doc["amount"],
            "currency": transfer_doc["currency"],
            "reason": transfer_doc.get("reason"),
            "recipient_name": recipient_name,
            "failure_reason": transfer_doc.get("failure_reason"),
            "retry_count": transfer_doc.get("retry_count", 0),
            "max_retries": transfer_doc.get("max_retries", 3),
            "initiated_at": transfer_doc["initiated_at"],
            "completed_at": transfer_doc.get("completed_at"),
            "failed_at": transfer_doc.get("failed_at"),
            "paystack_transfer_code": transfer_doc.get("paystack_transfer_code")
        }