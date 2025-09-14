"""
Password Reset Service
Handles secure password reset tokens and email sending
"""

import logging
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from email_service import EmailService

logger = logging.getLogger(__name__)

class PasswordResetToken(BaseModel):
    id: str
    user_id: str
    email: str
    token_hash: str  # Store hashed version of token
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: datetime
    reset_count: int = 0  # Track attempts for security

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class PasswordResetService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.email_service = EmailService()
        self.tokens_collection = db.password_reset_tokens
        self.users_collection = db.users
        
    def _generate_secure_token(self) -> str:
        """Generate cryptographically secure reset token"""
        return secrets.token_urlsafe(32)
    
    def _hash_token(self, token: str) -> str:
        """Hash token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    async def request_password_reset(self, email: str, base_url: str = None) -> Dict[str, Any]:
        """
        Send password reset email to user
        
        Args:
            email: User's email address
            base_url: Base URL for reset link (for production use)
            
        Returns:
            Success status and message
        """
        try:
            # Check if user exists
            user = await self.users_collection.find_one({"email": email})
            if not user:
                # Don't reveal if email exists for security
                logger.info(f"Password reset requested for non-existent email: {email}")
                return {
                    "success": True,
                    "message": "If this email is registered, you will receive password reset instructions."
                }
            
            # Check rate limiting - max 3 requests per hour
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            recent_tokens = await self.tokens_collection.count_documents({
                "email": email,
                "created_at": {"$gte": one_hour_ago}
            })
            
            if recent_tokens >= 3:
                logger.warning(f"Rate limit exceeded for password reset: {email}")
                return {
                    "success": False,
                    "message": "Too many reset requests. Please try again in an hour."
                }
            
            # Generate secure token
            reset_token = self._generate_secure_token()
            token_hash = self._hash_token(reset_token)
            
            # Create reset token record
            reset_record = {
                "id": secrets.token_urlsafe(16),
                "user_id": user["id"],
                "email": email,
                "token_hash": token_hash,
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),  # 1 hour expiry
                "created_at": datetime.now(timezone.utc),
                "used_at": None,
                "reset_count": 0
            }
            
            # Save to database
            await self.tokens_collection.insert_one(reset_record)
            
            # Clean up old tokens for this user
            await self._cleanup_old_tokens(email)
            
            # Send reset email
            reset_url = f"{base_url or 'http://localhost:3000'}/reset-password?token={reset_token}"
            
            email_sent = await self.email_service.send_password_reset_email(
                user_email=email,
                user_name=user.get("full_name", "User"),
                reset_url=reset_url,
                expires_in="1 hour"
            )
            
            if email_sent:
                logger.info(f"Password reset email sent successfully to {email}")
                return {
                    "success": True,
                    "message": "Password reset instructions have been sent to your email."
                }
            else:
                logger.error(f"Failed to send password reset email to {email}")
                return {
                    "success": False,
                    "message": "Failed to send reset email. Please try again."
                }
                
        except Exception as e:
            logger.error(f"Error requesting password reset: {e}")
            return {
                "success": False,
                "message": "Password reset request failed. Please try again."
            }
    
    async def verify_reset_token(self, token: str) -> Dict[str, Any]:
        """
        Verify if reset token is valid
        
        Args:
            token: Reset token from email link
            
        Returns:
            Verification result with user info if valid
        """
        try:
            token_hash = self._hash_token(token)
            
            # Find valid token
            reset_record = await self.tokens_collection.find_one({
                "token_hash": token_hash,
                "used_at": None,
                "expires_at": {"$gt": datetime.now(timezone.utc)}
            })
            
            if not reset_record:
                return {
                    "valid": False,
                    "message": "Invalid or expired reset token."
                }
            
            # Get user info
            user = await self.users_collection.find_one({"id": reset_record["user_id"]})
            if not user:
                return {
                    "valid": False,
                    "message": "User account not found."
                }
            
            return {
                "valid": True,
                "user_email": user["email"],
                "user_name": user.get("full_name", "User"),
                "expires_at": reset_record["expires_at"]
            }
            
        except Exception as e:
            logger.error(f"Error verifying reset token: {e}")
            return {
                "valid": False,
                "message": "Token verification failed."
            }
    
    async def confirm_password_reset(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Complete password reset with new password
        
        Args:
            token: Reset token from email
            new_password: New password (will be hashed)
            
        Returns:
            Success status and message
        """
        try:
            token_hash = self._hash_token(token)
            
            # Find and validate token
            reset_record = await self.tokens_collection.find_one({
                "token_hash": token_hash,
                "used_at": None,
                "expires_at": {"$gt": datetime.now(timezone.utc)}
            })
            
            if not reset_record:
                return {
                    "success": False,
                    "message": "Invalid or expired reset token."
                }
            
            # Validate password strength
            if len(new_password) < 8:
                return {
                    "success": False,
                    "message": "Password must be at least 8 characters long."
                }
            
            # Hash new password
            import bcrypt
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update user password
            update_result = await self.users_collection.update_one(
                {"id": reset_record["user_id"]},
                {
                    "$set": {
                        "password": password_hash,
                        "updated_at": datetime.now(timezone.utc),
                        "password_changed_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            if update_result.modified_count == 0:
                return {
                    "success": False,
                    "message": "Failed to update password. User not found."
                }
            
            # Mark token as used
            await self.tokens_collection.update_one(
                {"_id": reset_record["_id"]},
                {
                    "$set": {
                        "used_at": datetime.now(timezone.utc),
                        "reset_count": reset_record.get("reset_count", 0) + 1
                    }
                }
            )
            
            # Get user for notification email
            user = await self.users_collection.find_one({"id": reset_record["user_id"]})
            
            # Send confirmation email
            await self.email_service.send_password_changed_notification(
                user_email=user["email"],
                user_name=user.get("full_name", "User")
            )
            
            logger.info(f"Password reset completed successfully for user: {user['email']}")
            
            return {
                "success": True,
                "message": "Password has been reset successfully. You can now log in with your new password."
            }
            
        except Exception as e:
            logger.error(f"Error confirming password reset: {e}")
            return {
                "success": False,
                "message": "Password reset failed. Please try again."
            }
    
    async def _cleanup_old_tokens(self, email: str):
        """Remove old/expired tokens for user"""
        try:
            await self.tokens_collection.delete_many({
                "email": email,
                "$or": [
                    {"expires_at": {"$lt": datetime.now(timezone.utc)}},
                    {"used_at": {"$ne": None}}
                ]
            })
        except Exception as e:
            logger.error(f"Error cleaning up old tokens: {e}")
    
    async def get_reset_statistics(self) -> Dict[str, Any]:
        """Get password reset statistics for admin"""
        try:
            now = datetime.now(timezone.utc)
            
            # Get counts
            total_requests = await self.tokens_collection.count_documents({})
            successful_resets = await self.tokens_collection.count_documents({"used_at": {"$ne": None}})
            expired_tokens = await self.tokens_collection.count_documents({"expires_at": {"$lt": now}})
            
            # Recent activity (last 24 hours)
            yesterday = now - timedelta(days=1)
            recent_requests = await self.tokens_collection.count_documents({
                "created_at": {"$gte": yesterday}
            })
            
            return {
                "total_requests": total_requests,
                "successful_resets": successful_resets,
                "expired_tokens": expired_tokens,
                "recent_requests_24h": recent_requests,
                "success_rate": round((successful_resets / max(total_requests, 1)) * 100, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting reset statistics: {e}")
            return {}