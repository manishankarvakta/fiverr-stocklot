"""
KYC (Know Your Customer) Verification Service
Comprehensive identity and document verification system
"""

import logging
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from enum import Enum
from email_service import EmailService

logger = logging.getLogger(__name__)

class VerificationLevel(str, Enum):
    BASIC = "basic"           # Email + Phone verification
    STANDARD = "standard"     # Basic + ID document
    ENHANCED = "enhanced"     # Standard + Address + Business docs
    PREMIUM = "premium"       # Enhanced + Photo verification

class DocumentType(str, Enum):
    ID_CARD = "id_card"
    PASSPORT = "passport"
    DRIVERS_LICENSE = "drivers_license"
    UTILITY_BILL = "utility_bill"
    BANK_STATEMENT = "bank_statement"
    BUSINESS_REGISTRATION = "business_registration"
    TAX_CERTIFICATE = "tax_certificate"
    SELFIE_WITH_ID = "selfie_with_id"

class VerificationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class KYCDocument(BaseModel):
    id: str
    user_id: str
    document_type: DocumentType
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    upload_date: datetime
    verification_status: VerificationStatus
    reviewer_id: Optional[str] = None
    review_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    extraction_data: Optional[Dict] = None  # AI extracted data
    expiry_date: Optional[datetime] = None

class KYCVerification(BaseModel):
    id: str
    user_id: str
    verification_level: VerificationLevel
    current_status: VerificationStatus
    created_date: datetime
    last_updated: datetime
    approved_date: Optional[datetime] = None
    reviewer_id: Optional[str] = None
    documents: List[str] = []  # Document IDs
    verification_score: Optional[float] = None
    risk_flags: List[str] = []
    compliance_notes: Optional[str] = None

class KYCSubmissionRequest(BaseModel):
    verification_level: VerificationLevel
    documents: List[Dict[str, Any]]  # Document metadata

class KYCService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.email_service = EmailService()
        self.kyc_verifications_collection = db.kyc_verifications
        self.kyc_documents_collection = db.kyc_documents
        self.users_collection = db.users
        
        # Create indexes
        try:
            asyncio.create_task(self._create_indexes())
        except:
            pass
    
    async def _create_indexes(self):
        """Create database indexes for performance"""
        try:
            await self.kyc_verifications_collection.create_index("user_id", unique=True)
            await self.kyc_verifications_collection.create_index("current_status")
            await self.kyc_verifications_collection.create_index("verification_level")
            await self.kyc_documents_collection.create_index("user_id")
            await self.kyc_documents_collection.create_index("verification_status")
            await self.kyc_documents_collection.create_index("document_type")
        except Exception as e:
            logger.warning(f"Could not create KYC indexes: {e}")
    
    def _generate_verification_id(self) -> str:
        """Generate unique verification ID"""
        return f"kyc_{secrets.token_urlsafe(16)}"
    
    def _generate_document_id(self) -> str:
        """Generate unique document ID"""
        return f"doc_{secrets.token_urlsafe(12)}"
    
    def _calculate_verification_score(self, documents: List[KYCDocument]) -> float:
        """Calculate risk score based on documents and verification"""
        base_score = 0.0
        
        # Document type scoring
        document_scores = {
            DocumentType.ID_CARD: 25.0,
            DocumentType.PASSPORT: 30.0,
            DocumentType.DRIVERS_LICENSE: 20.0,
            DocumentType.UTILITY_BILL: 15.0,
            DocumentType.BANK_STATEMENT: 20.0,
            DocumentType.BUSINESS_REGISTRATION: 25.0,
            DocumentType.TAX_CERTIFICATE: 15.0,
            DocumentType.SELFIE_WITH_ID: 20.0
        }
        
        for doc in documents:
            if doc.verification_status == VerificationStatus.APPROVED:
                base_score += document_scores.get(doc.document_type, 10.0)
        
        # Cap at 100
        return min(base_score, 100.0)
    
    def _detect_risk_flags(self, documents: List[KYCDocument], user_data: Dict) -> List[str]:
        """Detect potential risk flags"""
        flags = []
        
        # Check for document inconsistencies
        names = []
        addresses = []
        
        for doc in documents:
            if doc.extraction_data:
                if 'name' in doc.extraction_data:
                    names.append(doc.extraction_data['name'].lower())
                if 'address' in doc.extraction_data:
                    addresses.append(doc.extraction_data['address'].lower())
        
        # Name consistency check
        if len(set(names)) > 1:
            flags.append("name_mismatch")
        
        # Address consistency check  
        if len(set(addresses)) > 1:
            flags.append("address_mismatch")
        
        # Check document age (if extraction data available)
        recent_docs = []
        for doc in documents:
            if doc.extraction_data and 'issue_date' in doc.extraction_data:
                try:
                    issue_date = datetime.fromisoformat(doc.extraction_data['issue_date'])
                    if datetime.now(timezone.utc) - issue_date < timedelta(days=30):
                        recent_docs.append(doc.document_type)
                except:
                    pass
        
        if len(recent_docs) > 2:
            flags.append("multiple_recent_documents")
        
        return flags
    
    async def start_verification(self, user_id: str, verification_level: VerificationLevel) -> Dict[str, Any]:
        """Start KYC verification process for user"""
        try:
            # Check if user exists
            user = await self.users_collection.find_one({"id": user_id})
            if not user:
                return {
                    "success": False,
                    "message": "User not found."
                }
            
            # Check if verification already exists
            existing = await self.kyc_verifications_collection.find_one({"user_id": user_id})
            if existing and existing.get("current_status") in [VerificationStatus.APPROVED, VerificationStatus.UNDER_REVIEW]:
                return {
                    "success": False,
                    "message": "KYC verification already in progress or completed."
                }
            
            # Create new verification record
            verification_record = {
                "id": self._generate_verification_id(),
                "user_id": user_id,
                "verification_level": verification_level,
                "current_status": VerificationStatus.PENDING,
                "created_date": datetime.now(timezone.utc),
                "last_updated": datetime.now(timezone.utc),
                "documents": [],
                "risk_flags": []
            }
            
            # Replace or insert verification
            await self.kyc_verifications_collection.replace_one(
                {"user_id": user_id},
                verification_record,
                upsert=True
            )
            
            # Send welcome email
            try:
                self.email_service.send_kyc_verification_started(
                    user_email=user["email"],
                    user_name=user.get("full_name", "User"),
                    verification_level=verification_level,
                    verification_id=verification_record["id"]
                )
            except Exception as e:
                logger.warning(f"Failed to send KYC verification started email: {e}")
            
            logger.info(f"KYC verification started for user {user_id} at level {verification_level}")
            
            return {
                "success": True,
                "verification_id": verification_record["id"],
                "verification_level": verification_level,
                "required_documents": self._get_required_documents(verification_level),
                "message": "KYC verification started successfully."
            }
            
        except Exception as e:
            logger.error(f"Error starting KYC verification: {e}")
            return {
                "success": False,
                "message": "Failed to start verification process."
            }
    
    def _get_required_documents(self, level: VerificationLevel) -> Dict[str, List[str]]:
        """Get required documents for verification level"""
        requirements = {
            VerificationLevel.BASIC: {
                "required": [],
                "description": "Email and phone verification only"
            },
            VerificationLevel.STANDARD: {
                "required": ["id_card", "passport", "drivers_license"],
                "description": "One government-issued ID required",
                "choose_one": True
            },
            VerificationLevel.ENHANCED: {
                "required": ["id_card", "passport", "drivers_license"],
                "additional": ["utility_bill", "bank_statement"],
                "description": "Government ID + proof of address required"
            },
            VerificationLevel.PREMIUM: {
                "required": ["id_card", "passport", "drivers_license"],
                "additional": ["utility_bill", "bank_statement", "business_registration"],
                "selfie": ["selfie_with_id"],
                "description": "Full verification including photo verification"
            }
        }
        
        return requirements.get(level, {})
    
    async def upload_document(self, user_id: str, document_type: DocumentType, 
                            file_path: str, file_name: str, file_size: int, 
                            mime_type: str) -> Dict[str, Any]:
        """Upload and process KYC document"""
        try:
            # Verify user has active verification
            verification = await self.kyc_verifications_collection.find_one({
                "user_id": user_id,
                "current_status": {"$in": [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW]}
            })
            
            if not verification:
                return {
                    "success": False,
                    "message": "No active KYC verification found. Please start verification process."
                }
            
            # Check file size (max 10MB)
            if file_size > 10 * 1024 * 1024:
                return {
                    "success": False,
                    "message": "File size too large. Maximum 10MB allowed."
                }
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if mime_type not in allowed_types:
                return {
                    "success": False,
                    "message": "Invalid file type. Only JPG, PNG, and PDF files allowed."
                }
            
            # Create document record
            document_record = {
                "id": self._generate_document_id(),
                "user_id": user_id,
                "document_type": document_type,
                "file_path": file_path,
                "file_name": file_name,
                "file_size": file_size,
                "mime_type": mime_type,
                "upload_date": datetime.now(timezone.utc),
                "verification_status": VerificationStatus.PENDING
            }
            
            # Insert document
            await self.kyc_documents_collection.insert_one(document_record)
            
            # Update verification with document ID
            await self.kyc_verifications_collection.update_one(
                {"user_id": user_id},
                {
                    "$push": {"documents": document_record["id"]},
                    "$set": {"last_updated": datetime.now(timezone.utc)}
                }
            )
            
            # TODO: Trigger AI document processing
            await self._process_document_ai(document_record["id"])
            
            logger.info(f"Document uploaded for KYC: {document_record['id']}")
            
            return {
                "success": True,
                "document_id": document_record["id"],
                "message": "Document uploaded successfully."
            }
            
        except Exception as e:
            logger.error(f"Error uploading KYC document: {e}")
            return {
                "success": False,
                "message": "Failed to upload document."
            }
    
    async def _process_document_ai(self, document_id: str):
        """Process document with AI (placeholder for future implementation)"""
        try:
            # This would integrate with AI service for document extraction
            # For now, just mark as under review
            await self.kyc_documents_collection.update_one(
                {"id": document_id},
                {
                    "$set": {
                        "verification_status": VerificationStatus.UNDER_REVIEW,
                        "extraction_data": {
                            "processed": True,
                            "ai_confidence": 0.85,
                            "extracted_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                }
            )
            
            logger.info(f"AI processing completed for document: {document_id}")
            
        except Exception as e:
            logger.error(f"Error in AI document processing: {e}")
    
    async def submit_for_review(self, user_id: str) -> Dict[str, Any]:
        """Submit KYC verification for admin review"""
        try:
            # Get verification record
            verification = await self.kyc_verifications_collection.find_one({"user_id": user_id})
            if not verification:
                return {
                    "success": False,
                    "message": "No KYC verification found."
                }
            
            # Get all documents
            documents = []
            for doc_id in verification.get("documents", []):
                doc = await self.kyc_documents_collection.find_one({"id": doc_id})
                if doc:
                    documents.append(KYCDocument(**doc))
            
            # Verify minimum documents uploaded
            required_docs = self._get_required_documents(verification["verification_level"])
            if not self._check_document_requirements(documents, required_docs):
                return {
                    "success": False,
                    "message": "Required documents not uploaded. Please check requirements."
                }
            
            # Calculate verification score and detect risks
            verification_score = self._calculate_verification_score(documents)
            user = await self.users_collection.find_one({"id": user_id})
            risk_flags = self._detect_risk_flags(documents, user)
            
            # Update verification status
            await self.kyc_verifications_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "current_status": VerificationStatus.UNDER_REVIEW,
                        "last_updated": datetime.now(timezone.utc),
                        "verification_score": verification_score,
                        "risk_flags": risk_flags
                    }
                }
            )
            
            # Send notification emails
            try:
                self.email_service.send_kyc_submitted_confirmation(
                    user_email=user["email"],
                    user_name=user.get("full_name", "User"),
                    verification_id=verification["id"]
                )
            except Exception as e:
                logger.warning(f"Failed to send KYC submitted confirmation email: {e}")
            
            # Notify admin of new submission
            try:
                self.email_service.send_kyc_admin_notification(
                    verification_id=verification["id"],
                    user_email=user["email"],
                    verification_level=verification["verification_level"],
                    risk_score=verification_score,
                    risk_flags=risk_flags
                )
            except Exception as e:
                logger.warning(f"Failed to send KYC admin notification email: {e}")
            
            logger.info(f"KYC submitted for review: {verification['id']}")
            
            return {
                "success": True,
                "message": "KYC verification submitted for review.",
                "estimated_review_time": "2-5 business days"
            }
            
        except Exception as e:
            logger.error(f"Error submitting KYC for review: {e}")
            return {
                "success": False,
                "message": "Failed to submit for review."
            }
    
    def _check_document_requirements(self, documents: List[KYCDocument], requirements: Dict) -> bool:
        """Check if uploaded documents meet requirements"""
        uploaded_types = [doc.document_type for doc in documents]
        
        required = requirements.get("required", [])
        additional = requirements.get("additional", [])
        selfie = requirements.get("selfie", [])
        choose_one = requirements.get("choose_one", False)
        
        # Check required documents
        if choose_one and required:
            if not any(doc_type in uploaded_types for doc_type in required):
                return False
        else:
            for req_doc in required:
                if req_doc not in uploaded_types:
                    return False
        
        # For enhanced/premium levels, check additional requirements
        if additional and not any(doc_type in uploaded_types for doc_type in additional):
            return False
        
        if selfie and not any(doc_type in uploaded_types for doc_type in selfie):
            return False
        
        return True
    
    async def get_verification_status(self, user_id: str) -> Dict[str, Any]:
        """Get KYC verification status for user"""
        try:
            verification = await self.kyc_verifications_collection.find_one({"user_id": user_id})
            
            if not verification:
                return {
                    "has_verification": False,
                    "message": "No KYC verification started."
                }
            
            # Get documents
            documents = []
            for doc_id in verification.get("documents", []):
                doc = await self.kyc_documents_collection.find_one({"id": doc_id})
                if doc:
                    documents.append({
                        "id": doc["id"],
                        "document_type": doc["document_type"],
                        "file_name": doc["file_name"],
                        "upload_date": doc["upload_date"],
                        "verification_status": doc["verification_status"]
                    })
            
            required_docs = self._get_required_documents(verification["verification_level"])
            
            return {
                "has_verification": True,
                "verification_id": verification["id"],
                "verification_level": verification["verification_level"],
                "current_status": verification["current_status"],
                "created_date": verification["created_date"],
                "last_updated": verification["last_updated"],
                "verification_score": verification.get("verification_score"),
                "risk_flags": verification.get("risk_flags", []),
                "documents": documents,
                "required_documents": required_docs,
                "approved_date": verification.get("approved_date"),
                "reviewer_notes": verification.get("compliance_notes")
            }
            
        except Exception as e:
            logger.error(f"Error getting KYC status: {e}")
            return {
                "has_verification": False,
                "error": "Failed to get verification status."
            }
    
    async def get_kyc_statistics(self) -> Dict[str, Any]:
        """Get KYC statistics for admin dashboard"""
        try:
            now = datetime.now(timezone.utc)
            
            # Basic counts
            total_verifications = await self.kyc_verifications_collection.count_documents({})
            pending = await self.kyc_verifications_collection.count_documents({"current_status": VerificationStatus.PENDING})
            under_review = await self.kyc_verifications_collection.count_documents({"current_status": VerificationStatus.UNDER_REVIEW})
            approved = await self.kyc_verifications_collection.count_documents({"current_status": VerificationStatus.APPROVED})
            rejected = await self.kyc_verifications_collection.count_documents({"current_status": VerificationStatus.REJECTED})
            
            # Level breakdown
            levels = {}
            for level in VerificationLevel:
                count = await self.kyc_verifications_collection.count_documents({"verification_level": level})
                levels[level] = count
            
            # Recent activity
            week_ago = now - timedelta(days=7)
            recent_submissions = await self.kyc_verifications_collection.count_documents({
                "created_date": {"$gte": week_ago}
            })
            
            recent_approvals = await self.kyc_verifications_collection.count_documents({
                "approved_date": {"$gte": week_ago}
            })
            
            # Document stats
            total_documents = await self.kyc_documents_collection.count_documents({})
            
            return {
                "total_verifications": total_verifications,
                "status_breakdown": {
                    "pending": pending,
                    "under_review": under_review,
                    "approved": approved,
                    "rejected": rejected
                },
                "level_breakdown": levels,
                "recent_submissions_7d": recent_submissions,
                "recent_approvals_7d": recent_approvals,
                "total_documents": total_documents,
                "approval_rate": round((approved / max(total_verifications, 1)) * 100, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting KYC statistics: {e}")
            return {}