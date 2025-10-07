"""
Transfer Recipient Service for South African Livestock Marketplace
Handles recipient onboarding, validation, and management
"""
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from decimal import Decimal
import uuid

from .paystack_transfer_client import PaystackTransferClient, PaystackError
from .transfer_models import (
    TransferRecipient, BankAccountRecipientCreate, AuthorizationRecipientCreate,
    RecipientType, RecipientResponse
)

logger = logging.getLogger(__name__)

class TransferRecipientService:
    def __init__(self, db, paystack_client: PaystackTransferClient = None):
        self.db = db
        self.paystack_client = paystack_client or PaystackTransferClient()
    
    def _generate_recipient_reference(self) -> str:
        """Generate secure recipient reference"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_suffix = str(uuid.uuid4()).replace('-', '')[:8].upper()
        return f"LSM_RCP_{timestamp}_{random_suffix}"
    
    async def validate_south_african_account(
        self,
        account_number: str,
        bank_code: str,
        account_name: str,
        account_type: str = "personal",
        document_type: str = "identityNumber",
        document_number: str = None
    ) -> Tuple[bool, str, Optional[Decimal]]:
        """
        Validate South African bank account
        Returns: (is_valid, message, validation_cost)
        """
        try:
            logger.info(f"Validating SA account: {account_number} with bank {bank_code}")
            
            response = await self.paystack_client.validate_account(
                account_number=account_number,
                bank_code=bank_code,
                account_name=account_name,
                account_type=account_type,
                document_type=document_type,
                document_number=document_number
            )
            
            if response.status and response.data:
                is_verified = response.data.get("verified", False)
                verification_message = response.data.get("verificationMessage", "")
                
                # Account validation costs ZAR 3.00 per successful request
                validation_cost = Decimal("3.00") if is_verified else Decimal("0.00")
                
                logger.info(f"Account validation result: {is_verified} - {verification_message}")
                return is_verified, verification_message, validation_cost
            
            return False, response.message or "Account validation failed", Decimal("0.00")
            
        except PaystackError as e:
            logger.error(f"Paystack error during account validation: {e.message}")
            return False, e.message, Decimal("0.00")
        except Exception as e:
            logger.error(f"Unexpected error during account validation: {str(e)}")
            return False, f"Validation error: {str(e)}", Decimal("0.00")
    
    async def create_bank_account_recipient(
        self,
        user_id: str,
        recipient_data: BankAccountRecipientCreate
    ) -> TransferRecipient:
        """Create a transfer recipient for South African bank account"""
        
        try:
            # Check if recipient already exists
            existing_recipient = await self.db.transfer_recipients.find_one({
                "user_id": user_id,
                "account_number": recipient_data.account_number,
                "bank_code": recipient_data.bank_code,
                "is_active": True
            })
            
            if existing_recipient:
                logger.warning(f"Recipient already exists for user {user_id} with account {recipient_data.account_number}")
                # Convert to Pydantic model
                existing_recipient.pop("_id", None)
                return TransferRecipient(**existing_recipient)
            
            # Validate account if required
            is_validated = False
            validation_cost = Decimal("0.00")
            validation_reference = None
            
            if recipient_data.validate_account:
                is_valid, validation_message, cost = await self.validate_south_african_account(
                    account_number=recipient_data.account_number,
                    bank_code=recipient_data.bank_code,
                    account_name=recipient_data.account_name,
                    document_type=recipient_data.document_type,
                    document_number=recipient_data.document_number
                )
                
                if not is_valid:
                    raise ValueError(f"Account validation failed: {validation_message}")
                
                is_validated = True
                validation_cost = cost
                validation_reference = self._generate_recipient_reference()
            
            # Get bank details
            banks_response = await self.paystack_client.list_banks(country="south africa")
            bank_name = "Unknown Bank"
            
            if banks_response.status and banks_response.data:
                for bank in banks_response.data:
                    if bank.get("code") == recipient_data.bank_code:
                        bank_name = bank.get("name", "Unknown Bank")
                        break
            
            # Create Paystack transfer recipient
            recipient_response = await self.paystack_client.create_transfer_recipient(
                recipient_type="basa",
                name=recipient_data.name,
                account_number=recipient_data.account_number,
                bank_code=recipient_data.bank_code,
                description=recipient_data.description,
                currency="ZAR"
            )
            
            if not recipient_response.status:
                raise PaystackError(f"Failed to create Paystack recipient: {recipient_response.message}")
            
            paystack_recipient_code = recipient_response.data.get("recipient_code")
            if not paystack_recipient_code:
                raise PaystackError("No recipient code returned from Paystack")
            
            # Create database record
            transfer_recipient_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "paystack_recipient_code": paystack_recipient_code,
                "recipient_type": RecipientType.BASA.value,
                "bank_code": recipient_data.bank_code,
                "bank_name": bank_name,
                "account_number": recipient_data.account_number,
                "account_name": recipient_data.account_name,
                "is_validated": is_validated,
                "validation_reference": validation_reference,
                "validation_cost": float(validation_cost) if validation_cost else None,
                "name": recipient_data.name,
                "description": recipient_data.description,
                "currency": "ZAR",
                "is_active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            await self.db.transfer_recipients.insert_one(transfer_recipient_data)
            
            logger.info(f"Created transfer recipient {paystack_recipient_code} for user {user_id}")
            
            # Remove MongoDB ObjectId for return
            transfer_recipient_data.pop("_id", None)
            return TransferRecipient(**transfer_recipient_data)
            
        except PaystackError as e:
            logger.error(f"Paystack error creating recipient: {e.message}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error creating recipient: {str(e)}")
            raise ValueError(f"Recipient creation failed: {str(e)}")
    
    async def create_authorization_recipient(
        self,
        user_id: str,
        recipient_data: AuthorizationRecipientCreate
    ) -> TransferRecipient:
        """Create a transfer recipient using authorization code"""
        
        try:
            # Check if recipient already exists
            existing_recipient = await self.db.transfer_recipients.find_one({
                "user_id": user_id,
                "authorization_code": recipient_data.authorization_code,
                "is_active": True
            })
            
            if existing_recipient:
                logger.warning(f"Authorization recipient already exists for user {user_id}")
                existing_recipient.pop("_id", None)
                return TransferRecipient(**existing_recipient)
            
            # Create Paystack transfer recipient
            recipient_response = await self.paystack_client.create_transfer_recipient(
                recipient_type="authorization",
                name=recipient_data.name,
                authorization_code=recipient_data.authorization_code,
                email=recipient_data.email,
                description=recipient_data.description,
                currency="ZAR"
            )
            
            if not recipient_response.status:
                raise PaystackError(f"Failed to create Paystack recipient: {recipient_response.message}")
            
            paystack_recipient_code = recipient_response.data.get("recipient_code")
            recipient_details = recipient_response.data.get("details", {})
            
            # Create database record
            transfer_recipient_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "paystack_recipient_code": paystack_recipient_code,
                "recipient_type": RecipientType.AUTHORIZATION.value,
                "authorization_code": recipient_data.authorization_code,
                "card_last4": recipient_details.get("account_number", "")[-4:] if recipient_details.get("account_number") else None,
                "card_bank": recipient_details.get("bank_name"),
                "name": recipient_data.name,
                "description": recipient_data.description,
                "currency": "ZAR",
                "is_active": True,
                "is_validated": True,  # Authorization codes are pre-validated
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            
            await self.db.transfer_recipients.insert_one(transfer_recipient_data)
            
            logger.info(f"Created authorization recipient {paystack_recipient_code} for user {user_id}")
            
            transfer_recipient_data.pop("_id", None)
            return TransferRecipient(**transfer_recipient_data)
            
        except Exception as e:
            logger.error(f"Error creating authorization recipient: {str(e)}")
            raise ValueError(f"Recipient creation failed: {str(e)}")
    
    async def get_user_recipients(
        self,
        user_id: str,
        include_inactive: bool = False
    ) -> List[RecipientResponse]:
        """Get all transfer recipients for a user"""
        
        query = {"user_id": user_id}
        if not include_inactive:
            query["is_active"] = True
        
        recipients_docs = await self.db.transfer_recipients.find(query).sort("created_at", -1).to_list(length=None)
        
        recipients = []
        for doc in recipients_docs:
            doc.pop("_id", None)
            recipients.append(RecipientResponse(**doc))
        
        return recipients
    
    async def get_recipient_by_id(self, recipient_id: str, user_id: str = None) -> Optional[TransferRecipient]:
        """Get transfer recipient by ID"""
        query = {"id": recipient_id}
        if user_id:
            query["user_id"] = user_id
        
        recipient_doc = await self.db.transfer_recipients.find_one(query)
        if recipient_doc:
            recipient_doc.pop("_id", None)
            return TransferRecipient(**recipient_doc)
        return None
    
    async def update_recipient(
        self,
        recipient_id: str,
        user_id: str,
        name: str = None,
        description: str = None,
        is_active: bool = None
    ) -> TransferRecipient:
        """Update transfer recipient details"""
        
        try:
            recipient = await self.get_recipient_by_id(recipient_id, user_id)
            if not recipient:
                raise ValueError("Transfer recipient not found")
            
            # Prepare update data
            update_data = {"updated_at": datetime.now()}
            
            if name is not None:
                update_data["name"] = name
            if description is not None:
                update_data["description"] = description
            if is_active is not None:
                update_data["is_active"] = is_active
            
            # Update Paystack record if name changed
            if name and name != recipient.name:
                update_response = await self.paystack_client.update_transfer_recipient(
                    recipient_code=recipient.paystack_recipient_code,
                    name=name
                )
                
                if not update_response.status:
                    logger.warning(f"Failed to update Paystack recipient: {update_response.message}")
            
            # Update database
            await self.db.transfer_recipients.update_one(
                {"id": recipient_id, "user_id": user_id},
                {"$set": update_data}
            )
            
            # Get updated recipient
            updated_recipient = await self.get_recipient_by_id(recipient_id, user_id)
            logger.info(f"Updated transfer recipient {recipient_id}")
            return updated_recipient
            
        except Exception as e:
            logger.error(f"Error updating recipient: {str(e)}")
            raise ValueError(f"Recipient update failed: {str(e)}")
    
    async def deactivate_recipient(
        self,
        recipient_id: str,
        user_id: str = None
    ) -> bool:
        """Deactivate transfer recipient"""
        
        try:
            recipient = await self.get_recipient_by_id(recipient_id, user_id)
            if not recipient:
                raise ValueError("Transfer recipient not found")
            
            # Deactivate in Paystack
            delete_response = await self.paystack_client.delete_transfer_recipient(
                recipient.paystack_recipient_code
            )
            
            if not delete_response.status:
                logger.warning(f"Failed to delete Paystack recipient: {delete_response.message}")
            
            # Deactivate locally
            await self.db.transfer_recipients.update_one(
                {"id": recipient_id},
                {
                    "$set": {
                        "is_active": False,
                        "updated_at": datetime.now()
                    }
                }
            )
            
            logger.info(f"Deactivated transfer recipient {recipient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deactivating recipient: {str(e)}")
            raise ValueError(f"Recipient deactivation failed: {str(e)}")