"""
Two-Factor Authentication (2FA) Service
Implements TOTP-based 2FA using Google Authenticator with QR codes
"""

import asyncio
import logging
import secrets
import qrcode
import pyotp
import io
import base64
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from email_service import EmailService

logger = logging.getLogger(__name__)

class TwoFactorSecret(BaseModel):
    id: str
    user_id: str
    secret_key: str  # Store encrypted
    backup_codes: List[str]  # Store encrypted
    enabled: bool = False
    created_at: datetime
    enabled_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

class TwoFactorSetupRequest(BaseModel):
    user_id: str

class TwoFactorVerifyRequest(BaseModel):
    token: str
    backup_code: Optional[str] = None

class TwoFactorDisableRequest(BaseModel):
    password: str
    token: Optional[str] = None

class TwoFactorService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.email_service = EmailService()
        self.secrets_collection = db.two_factor_secrets
        self.users_collection = db.users
        
        # Create indexes in background
        try:
            asyncio.create_task(self._create_indexes())
        except:
            pass  # Will create indexes later
    
    async def _create_indexes(self):
        """Create database indexes for performance"""
        try:
            await self.secrets_collection.create_index("user_id", unique=True)
            await self.secrets_collection.create_index("created_at")
        except Exception as e:
            logger.warning(f"Could not create 2FA indexes: {e}")
    
    def _generate_secret_key(self) -> str:
        """Generate cryptographically secure secret for TOTP"""
        return pyotp.random_base32()
    
    def _generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for account recovery"""
        return [secrets.token_hex(4).upper() for _ in range(count)]
    
    def _encrypt_data(self, data: str) -> str:
        """Simple encryption for secrets (in production use proper encryption)"""
        # For now, just base64 encode - replace with proper encryption in production
        return base64.b64encode(data.encode()).decode()
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt secret data"""
        # For now, just base64 decode - replace with proper decryption in production
        try:
            return base64.b64decode(encrypted_data.encode()).decode()
        except Exception:
            return encrypted_data  # Fallback for unencrypted data
    
    async def setup_2fa(self, user_id: str) -> Dict[str, Any]:
        """
        Initialize 2FA setup for user
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            Setup details including QR code and backup codes
        """
        try:
            # Check if user exists
            user = await self.users_collection.find_one({"id": user_id})
            if not user:
                return {
                    "success": False,
                    "message": "User not found."
                }
            
            # Check if 2FA is already enabled
            existing_secret = await self.secrets_collection.find_one({"user_id": user_id})
            if existing_secret and existing_secret.get("enabled"):
                return {
                    "success": False,
                    "message": "2FA is already enabled for this account."
                }
            
            # Generate new secret and backup codes
            secret_key = self._generate_secret_key()
            backup_codes = self._generate_backup_codes()
            
            # Create TOTP instance
            totp = pyotp.TOTP(secret_key)
            
            # Generate QR code
            app_name = "StockLot"
            qr_uri = totp.provisioning_uri(
                user["email"],
                issuer_name=app_name
            )
            
            # Generate QR code image
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_uri)
            qr.make(fit=True)
            
            qr_image = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            qr_image.save(buffer, format='PNG')
            qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Store secret (not enabled yet)
            secret_record = {
                "id": secrets.token_urlsafe(16),
                "user_id": user_id,
                "secret_key": self._encrypt_data(secret_key),
                "backup_codes": [self._encrypt_data(code) for code in backup_codes],
                "enabled": False,
                "created_at": datetime.now(timezone.utc)
            }
            
            # Replace or insert secret
            await self.secrets_collection.replace_one(
                {"user_id": user_id},
                secret_record,
                upsert=True
            )
            
            logger.info(f"2FA setup initiated for user: {user_id}")
            
            return {
                "success": True,
                "secret_key": secret_key,  # For manual entry
                "qr_code": f"data:image/png;base64,{qr_code_base64}",
                "backup_codes": backup_codes,
                "app_name": app_name,
                "username": user["email"]
            }
            
        except Exception as e:
            logger.error(f"Error setting up 2FA: {e}")
            return {
                "success": False,
                "message": "Failed to setup 2FA. Please try again."
            }
    
    async def verify_2fa_setup(self, user_id: str, token: str) -> Dict[str, Any]:
        """
        Verify 2FA setup with first token and enable 2FA
        
        Args:
            user_id: User's unique identifier  
            token: 6-digit TOTP token from authenticator app
            
        Returns:
            Verification result and enable status
        """
        try:
            # Get secret record
            secret_record = await self.secrets_collection.find_one({
                "user_id": user_id,
                "enabled": False
            })
            
            if not secret_record:
                return {
                    "success": False,
                    "message": "No 2FA setup found. Please start setup process again."
                }
            
            # Decrypt secret
            secret_key = self._decrypt_data(secret_record["secret_key"])
            
            # Verify token
            totp = pyotp.TOTP(secret_key)
            is_valid = totp.verify(token, valid_window=1)  # Allow 1 window tolerance
            
            if not is_valid:
                return {
                    "success": False,
                    "message": "Invalid verification code. Please check your authenticator app."
                }
            
            # Enable 2FA
            await self.secrets_collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "enabled": True,
                        "enabled_at": datetime.now(timezone.utc),
                        "last_used_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Update user record to indicate 2FA is enabled
            await self.users_collection.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "two_factor_enabled": True,
                        "two_factor_enabled_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            logger.info(f"2FA enabled successfully for user: {user_id}")
            
            return {
                "success": True,
                "message": "Two-factor authentication has been enabled successfully!"
            }
            
        except Exception as e:
            logger.error(f"Error verifying 2FA setup: {e}")
            return {
                "success": False,
                "message": "Failed to verify 2FA setup. Please try again."
            }
    
    async def verify_2fa_login(self, user_id: str, token: str, backup_code: str = None) -> Dict[str, Any]:
        """
        Verify 2FA during login process
        
        Args:
            user_id: User's unique identifier
            token: 6-digit TOTP token (optional if using backup code)
            backup_code: Backup recovery code (optional if using token)
            
        Returns:
            Verification result for login
        """
        try:
            # Get secret record
            secret_record = await self.secrets_collection.find_one({
                "user_id": user_id,
                "enabled": True
            })
            
            if not secret_record:
                return {
                    "success": False,
                    "message": "2FA is not enabled for this account."
                }
            
            # Verify using backup code if provided
            if backup_code:
                encrypted_backup_codes = secret_record["backup_codes"]
                decrypted_codes = [self._decrypt_data(code) for code in encrypted_backup_codes]
                
                if backup_code.upper() in decrypted_codes:
                    # Remove used backup code
                    decrypted_codes.remove(backup_code.upper())
                    new_encrypted_codes = [self._encrypt_data(code) for code in decrypted_codes]
                    
                    await self.secrets_collection.update_one(
                        {"user_id": user_id},
                        {
                            "$set": {
                                "backup_codes": new_encrypted_codes,
                                "last_used_at": datetime.now(timezone.utc)
                            }
                        }
                    )
                    
                    logger.info(f"2FA backup code used for user: {user_id}")
                    
                    return {
                        "success": True,
                        "message": "Login successful using backup code.",
                        "remaining_backup_codes": len(decrypted_codes)
                    }
                else:
                    return {
                        "success": False,
                        "message": "Invalid backup code."
                    }
            
            # Verify using TOTP token
            if not token:
                return {
                    "success": False,
                    "message": "Authentication code is required."
                }
            
            secret_key = self._decrypt_data(secret_record["secret_key"])
            totp = pyotp.TOTP(secret_key)
            is_valid = totp.verify(token, valid_window=1)
            
            if not is_valid:
                return {
                    "success": False,
                    "message": "Invalid authentication code. Please try again."
                }
            
            # Update last used
            await self.secrets_collection.update_one(
                {"user_id": user_id},
                {"$set": {"last_used_at": datetime.now(timezone.utc)}}
            )
            
            logger.info(f"2FA login verified for user: {user_id}")
            
            return {
                "success": True,
                "message": "Two-factor authentication verified successfully."
            }
            
        except Exception as e:
            logger.error(f"Error verifying 2FA login: {e}")
            return {
                "success": False,
                "message": "2FA verification failed. Please try again."
            }
    
    async def disable_2fa(self, user_id: str, password: str, token: str = None) -> Dict[str, Any]:
        """
        Disable 2FA for user account
        
        Args:
            user_id: User's unique identifier
            password: User's current password for verification
            token: Optional 2FA token for additional security
            
        Returns:
            Disable operation result
        """
        try:
            # Verify user password
            user = await self.users_collection.find_one({"id": user_id})
            if not user:
                return {
                    "success": False,
                    "message": "User not found."
                }
            
            # Verify password
            import bcrypt
            if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
                return {
                    "success": False,
                    "message": "Invalid password."
                }
            
            # If 2FA token provided, verify it
            if token:
                verify_result = await self.verify_2fa_login(user_id, token)
                if not verify_result["success"]:
                    return verify_result
            
            # Disable 2FA
            await self.secrets_collection.delete_one({"user_id": user_id})
            
            await self.users_collection.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "two_factor_enabled": False,
                        "two_factor_disabled_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            logger.info(f"2FA disabled for user: {user_id}")
            
            return {
                "success": True,
                "message": "Two-factor authentication has been disabled."
            }
            
        except Exception as e:
            logger.error(f"Error disabling 2FA: {e}")
            return {
                "success": False,
                "message": "Failed to disable 2FA. Please try again."
            }
    
    async def regenerate_backup_codes(self, user_id: str, token: str) -> Dict[str, Any]:
        """
        Regenerate backup codes for user
        
        Args:
            user_id: User's unique identifier
            token: Current 2FA token for verification
            
        Returns:
            New backup codes
        """
        try:
            # Verify current 2FA token
            verify_result = await self.verify_2fa_login(user_id, token)
            if not verify_result["success"]:
                return verify_result
            
            # Generate new backup codes
            new_backup_codes = self._generate_backup_codes()
            encrypted_codes = [self._encrypt_data(code) for code in new_backup_codes]
            
            # Update database
            await self.secrets_collection.update_one(
                {"user_id": user_id},
                {"$set": {"backup_codes": encrypted_codes}}
            )
            
            logger.info(f"Backup codes regenerated for user: {user_id}")
            
            return {
                "success": True,
                "backup_codes": new_backup_codes
            }
            
        except Exception as e:
            logger.error(f"Error regenerating backup codes: {e}")
            return {
                "success": False,
                "message": "Failed to regenerate backup codes."
            }
    
    async def get_2fa_status(self, user_id: str) -> Dict[str, Any]:
        """Get 2FA status for user"""
        try:
            user = await self.users_collection.find_one({"id": user_id})
            secret_record = await self.secrets_collection.find_one({"user_id": user_id})
            
            if not secret_record:
                return {
                    "enabled": False,
                    "setup_started": False
                }
            
            backup_codes = secret_record.get("backup_codes", [])
            
            return {
                "enabled": secret_record.get("enabled", False),
                "setup_started": True,
                "enabled_at": secret_record.get("enabled_at"),
                "last_used_at": secret_record.get("last_used_at"),
                "backup_codes_remaining": len(backup_codes)
            }
            
        except Exception as e:
            logger.error(f"Error getting 2FA status: {e}")
            return {
                "enabled": False,
                "setup_started": False,
                "error": str(e)
            }

    async def get_2fa_statistics(self) -> Dict[str, Any]:
        """Get 2FA statistics for admin dashboard"""
        try:
            now = datetime.now(timezone.utc)
            
            # Basic counts
            total_users = await self.users_collection.count_documents({})
            users_with_2fa = await self.users_collection.count_documents({"two_factor_enabled": True})
            setup_started = await self.secrets_collection.count_documents({})
            
            # Recent activity (last 7 days)
            week_ago = now - timedelta(days=7)
            recent_setups = await self.secrets_collection.count_documents({
                "enabled_at": {"$gte": week_ago}
            })
            
            recent_usage = await self.secrets_collection.count_documents({
                "last_used_at": {"$gte": week_ago}
            })
            
            return {
                "total_users": total_users,
                "users_with_2fa": users_with_2fa,
                "adoption_rate": round((users_with_2fa / max(total_users, 1)) * 100, 2),
                "setup_started": setup_started,
                "recent_setups_7d": recent_setups,
                "recent_usage_7d": recent_usage
            }
            
        except Exception as e:
            logger.error(f"Error getting 2FA statistics: {e}")
            return {}