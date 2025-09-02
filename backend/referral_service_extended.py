# 🎯 EXTENDED REFERRAL SERVICE
# Complete referral system with tracking and rewards

import uuid
import hashlib
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

class ExtendedReferralService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def generate_referral_code(self, user_id: str) -> str:
        """Generate a unique referral code"""
        # Create a short, memorable code
        base = hashlib.md5(f"{user_id}{random.randint(1000, 9999)}".encode()).hexdigest()[:8].upper()
        return f"STOCK{base}"

    async def get_or_create_referral_code(self, user_id: str) -> str:
        """Get or create user's referral code"""
        try:
            # Check if user has existing code
            existing_code = await self.db.referral_codes.find_one({"user_id": user_id})
            
            if existing_code:
                return existing_code["code"]
            
            # Create new code
            code = self.generate_referral_code(user_id)
            
            # Ensure uniqueness
            while await self.db.referral_codes.find_one({"code": code}):
                code = self.generate_referral_code(user_id)
            
            code_doc = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "code": code,
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.db.referral_codes.insert_one(code_doc)
            return code
            
        except Exception as e:
            logger.error(f"Error getting referral code: {e}")
            raise

    async def track_referral_click(self, code: str, referer: Optional[str] = None, 
                                 ip: Optional[str] = None, user_agent: Optional[str] = None,
                                 dest_path: str = "/signup") -> Dict[str, Any]:
        """Track referral click"""
        try:
            click_doc = {
                "id": str(uuid.uuid4()),
                "code": code,
                "referer": referer,
                "ip": ip,
                "user_agent": user_agent,
                "dest_path": dest_path,
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.db.referral_clicks.insert_one(click_doc)
            return {"ok": True}
            
        except Exception as e:
            logger.error(f"Error tracking click: {e}")
            # Don't fail the redirect for tracking errors
            return {"ok": False, "error": str(e)}

    async def attribute_signup(self, new_user_id: str, referral_code: Optional[str]) -> Dict[str, Any]:
        """Attribute signup to referral code and create reward"""
        try:
            if not referral_code:
                return {"ok": True, "attributed": False}
            
            # Verify code exists
            referrer_doc = await self.db.referral_codes.find_one({"code": referral_code})
            if not referrer_doc:
                return {"ok": True, "attributed": False}
            
            # Prevent self-referral
            if referrer_doc["user_id"] == new_user_id:
                return {"ok": True, "attributed": False}
            
            # Check if user already has attribution (prevent double attribution)
            existing_attribution = await self.db.referral_attributions.find_one({"new_user_id": new_user_id})
            if existing_attribution:
                return {"ok": True, "attributed": False}
            
            # Create attribution
            attribution_doc = {
                "id": str(uuid.uuid4()),
                "code": referral_code,
                "new_user_id": new_user_id,
                "attributed_at": datetime.now(timezone.utc)
            }
            await self.db.referral_attributions.insert_one(attribution_doc)
            
            # Create reward for referrer
            reward_doc = {
                "id": str(uuid.uuid4()),
                "user_id": referrer_doc["user_id"],
                "kind": "CREDIT",
                "amount": 50.00,  # R50 signup bonus
                "status": "PENDING",
                "meta": {"signup_user_id": new_user_id, "referral_code": referral_code},
                "created_at": datetime.now(timezone.utc)
            }
            await self.db.referral_rewards.insert_one(reward_doc)
            
            return {"ok": True, "attributed": True, "reward_amount": 50.00}
            
        except Exception as e:
            logger.error(f"Error attributing signup: {e}")
            return {"ok": False, "error": str(e)}

    async def get_referral_summary(self, user_id: str) -> Dict[str, Any]:
        """Get user's referral performance summary"""
        try:
            # Get user's referral code
            code_doc = await self.db.referral_codes.find_one({"user_id": user_id})
            if not code_doc:
                return {"code": None, "clicks": 0, "signups": 0, "rewards": []}
            
            code = code_doc["code"]
            
            # Count clicks
            clicks = await self.db.referral_clicks.count_documents({"code": code})
            
            # Count signups
            signups = await self.db.referral_attributions.count_documents({"code": code})
            
            # Get rewards
            rewards = await self.db.referral_rewards.find({
                "user_id": user_id
            }).to_list(length=None)
            
            return {
                "code": code,
                "clicks": clicks,
                "signups": signups,
                "rewards": rewards
            }
            
        except Exception as e:
            logger.error(f"Error getting referral summary: {e}")
            raise

    # ADMIN FUNCTIONS
    async def get_all_referrals(self, limit: int = 100) -> List[dict]:
        """Get all referrals for admin review"""
        try:
            referrals = await self.db.referral_rewards.find({}).sort("created_at", -1).limit(limit).to_list(length=None)
            return referrals
        except Exception as e:
            logger.error(f"Error getting all referrals: {e}")
            raise

    async def approve_referral_reward(self, reward_id: str, approved_by: str) -> Dict[str, Any]:
        """Approve referral reward for payout"""
        try:
            await self.db.referral_rewards.update_one(
                {"id": reward_id},
                {"$set": {
                    "status": "APPROVED",
                    "approved_by": approved_by,
                    "approved_at": datetime.now(timezone.utc)
                }}
            )
            return {"ok": True}
        except Exception as e:
            logger.error(f"Error approving referral reward: {e}")
            raise

    async def reject_referral_reward(self, reward_id: str, reason: str, rejected_by: str) -> Dict[str, Any]:
        """Reject referral reward"""
        try:
            await self.db.referral_rewards.update_one(
                {"id": reward_id},
                {"$set": {
                    "status": "REJECTED",
                    "rejection_reason": reason,
                    "rejected_by": rejected_by,
                    "rejected_at": datetime.now(timezone.utc)
                }}
            )
            return {"ok": True}
        except Exception as e:
            logger.error(f"Error rejecting referral reward: {e}")
            raise

    async def flag_fraud(self, user_id: str, reason: str, flagged_by: str) -> Dict[str, Any]:
        """Flag user for fraudulent referral activity"""
        try:
            # Mark user as flagged
            await self.db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "referral_fraud_flagged": True,
                    "referral_fraud_reason": reason,
                    "referral_fraud_flagged_by": flagged_by,
                    "referral_fraud_flagged_at": datetime.now(timezone.utc)
                }}
            )
            
            # Reject all pending rewards for this user
            await self.db.referral_rewards.update_many(
                {"user_id": user_id, "status": "PENDING"},
                {"$set": {
                    "status": "REJECTED",
                    "rejection_reason": f"Fraud: {reason}",
                    "rejected_by": flagged_by,
                    "rejected_at": datetime.now(timezone.utc)
                }}
            )
            
            return {"ok": True}
        except Exception as e:
            logger.error(f"Error flagging fraud: {e}")
            raise