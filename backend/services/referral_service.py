import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import secrets
import string

logger = logging.getLogger(__name__)

class ReferralStage(str, Enum):
    CLICK = "click"
    SIGNUP = "signup"
    KYC = "kyc"
    FIRST_ORDER = "first_order"
    QUALIFIED = "qualified"

class RewardType(str, Enum):
    CASH = "cash"
    CREDIT = "credit"
    FEE_DISCOUNT = "fee_discount"

class RewardStatus(str, Enum):
    PENDING = "pending"
    LOCKED = "locked"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"

class PayoutStatus(str, Enum):
    REQUESTED = "requested"
    IN_REVIEW = "in_review"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ReferralService:
    def __init__(self, db):
        self.db = db
        
    def _generate_referral_code(self) -> str:
        """Generate unique referral code"""
        # Generate format: AFRI-XXXXXX
        suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        return f"AFRI-{suffix}"
    
    async def get_or_create_referral_code(self, user_id: str) -> str:
        """Get existing referral code or create new one"""
        
        # Check if user already has a code
        existing = await self.db.referral_codes.find_one({
            "user_id": user_id,
            "active": True
        })
        
        if existing:
            return existing["code"]
        
        # Generate new code
        code = self._generate_referral_code()
        
        # Ensure uniqueness
        while await self.db.referral_codes.find_one({"code": code}):
            code = self._generate_referral_code()
            
        # Save to database
        referral_code = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "code": code,
            "active": True,
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.referral_codes.insert_one(referral_code)
        return code
    
    async def track_referral_click(
        self,
        code: str,
        ip_address: str,
        user_agent: str,
        landing_path: str,
        utm_params: Dict[str, str] = None
    ) -> bool:
        """Track referral link click"""
        
        # Verify code exists
        referral = await self.db.referral_codes.find_one({"code": code, "active": True})
        if not referral:
            return False
            
        click_record = {
            "id": str(uuid.uuid4()),
            "code": code,
            "ip": ip_address,
            "user_agent": user_agent,
            "landing_path": landing_path,
            "utm_params": utm_params or {},
            "session_id": str(uuid.uuid4()),  # Generate session ID
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.referral_clicks.insert_one(click_record)
        return True
    
    async def attribute_signup(self, referred_user_id: str, referral_code: str) -> bool:
        """Attribute a signup to a referral"""
        
        # Get referral code info
        code_info = await self.db.referral_codes.find_one({"code": referral_code, "active": True})
        if not code_info:
            return False
            
        referrer_user_id = code_info["user_id"]
        
        # Prevent self-referral
        if referrer_user_id == referred_user_id:
            return False
            
        # Check if attribution already exists
        existing = await self.db.referral_attributions.find_one({"referred_user_id": referred_user_id})
        if existing:
            return False  # User already attributed
            
        # Create attribution
        attribution = {
            "id": str(uuid.uuid4()),
            "code": referral_code,
            "referrer_user_id": referrer_user_id,
            "referred_user_id": referred_user_id,
            "stage": ReferralStage.SIGNUP.value,
            "first_order_id": None,
            "first_order_amount": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.referral_attributions.insert_one(attribution)
        return True
    
    async def progress_referral(
        self,
        referred_user_id: str,
        new_stage: ReferralStage,
        order_id: str = None,
        order_amount: float = None
    ) -> bool:
        """Progress referral to next stage"""
        
        attribution = await self.db.referral_attributions.find_one({"referred_user_id": referred_user_id})
        if not attribution:
            return False
            
        update_data = {
            "stage": new_stage.value,
            "updated_at": datetime.now(timezone.utc)
        }
        
        if order_id:
            update_data["first_order_id"] = order_id
        if order_amount:
            update_data["first_order_amount"] = order_amount
            
        result = await self.db.referral_attributions.update_one(
            {"id": attribution["id"]},
            {"$set": update_data}
        )
        
        # If qualified, create reward
        if new_stage == ReferralStage.QUALIFIED and order_amount:
            await self._create_referral_reward(attribution["id"], attribution["referrer_user_id"], order_amount)
            
        return result.modified_count > 0
    
    async def _create_referral_reward(self, attribution_id: str, referrer_user_id: str, order_amount: float) -> str:
        """Create referral reward"""
        
        # Calculate reward amount (10% of first order, capped at R2000, min R50)
        reward_amount = max(50, min(0.10 * order_amount, 2000))
        
        reward = {
            "id": str(uuid.uuid4()),
            "attribution_id": attribution_id,
            "referrer_user_id": referrer_user_id,
            "type": RewardType.CREDIT.value,  # Default to credit
            "amount": reward_amount,
            "currency": "ZAR",
            "status": RewardStatus.APPROVED.value,  # Auto-approve for now
            "notes": f"Referral reward for qualified order (R{order_amount})",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.referral_rewards.insert_one(reward)
        
        # Add to user wallet
        await self._add_wallet_credit(referrer_user_id, reward_amount, reward["id"])
        
        return reward["id"]
    
    async def _add_wallet_credit(self, user_id: str, amount: float, reward_id: str):
        """Add credit to user wallet"""
        
        # Create or update wallet
        await self.db.wallets.update_one(
            {"user_id": user_id},
            {
                "$inc": {"balance": amount},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            },
            upsert=True
        )
        
        # Create transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "amount": amount,
            "type": "CREDIT_REFERRAL",
            "reference_id": reward_id,
            "description": f"Referral reward credit",
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.wallet_transactions.insert_one(transaction)
    
    async def get_referral_stats(self, user_id: str) -> Dict[str, Any]:
        """Get referral statistics for user"""
        
        # Get user's referral code
        code_info = await self.db.referral_codes.find_one({"user_id": user_id, "active": True})
        if not code_info:
            return {
                "code": None,
                "total_clicks": 0,
                "total_signups": 0,
                "qualified_referrals": 0,
                "total_earned": 0,
                "pending_rewards": 0
            }
        
        code = code_info["code"]
        
        # Count clicks
        total_clicks = await self.db.referral_clicks.count_documents({"code": code})
        
        # Count signups
        total_signups = await self.db.referral_attributions.count_documents({"referrer_user_id": user_id})
        
        # Count qualified referrals
        qualified_referrals = await self.db.referral_attributions.count_documents({
            "referrer_user_id": user_id,
            "stage": ReferralStage.QUALIFIED.value
        })
        
        # Calculate earnings
        earnings_pipeline = [
            {"$match": {"referrer_user_id": user_id}},
            {"$group": {
                "_id": "$status",
                "total": {"$sum": "$amount"}
            }}
        ]
        
        earnings = await self.db.referral_rewards.aggregate(earnings_pipeline).to_list(length=None)
        
        total_earned = 0
        pending_rewards = 0
        
        for earning in earnings:
            if earning["_id"] in [RewardStatus.APPROVED.value, RewardStatus.PAID.value]:
                total_earned += earning["total"]
            elif earning["_id"] in [RewardStatus.PENDING.value, RewardStatus.LOCKED.value]:
                pending_rewards += earning["total"]
        
        return {
            "code": code,
            "total_clicks": total_clicks,
            "total_signups": total_signups,
            "qualified_referrals": qualified_referrals,
            "total_earned": round(total_earned, 2),
            "pending_rewards": round(pending_rewards, 2)
        }
    
    async def get_user_wallet(self, user_id: str) -> Dict[str, Any]:
        """Get user wallet information"""
        
        wallet = await self.db.wallets.find_one({"user_id": user_id})
        
        if not wallet:
            return {
                "balance": 0,
                "currency": "ZAR",
                "transactions": []
            }
        
        # Get recent transactions
        transactions = await self.db.wallet_transactions.find({
            "user_id": user_id
        }).sort("created_at", -1).limit(20).to_list(length=None)
        
        # Remove MongoDB _id fields
        for tx in transactions:
            if "_id" in tx:
                del tx["_id"]
        
        return {
            "balance": wallet["balance"],
            "currency": wallet.get("currency", "ZAR"),
            "transactions": transactions
        }
    
    async def request_payout(self, user_id: str, reward_id: str, method: str = "PAYSTACK_TRANSFER") -> str:
        """Request payout for a reward"""
        
        # Verify reward belongs to user and is eligible
        reward = await self.db.referral_rewards.find_one({
            "id": reward_id,
            "referrer_user_id": user_id,
            "status": {"$in": [RewardStatus.APPROVED.value, RewardStatus.PENDING.value]}
        })
        
        if not reward:
            raise ValueError("Reward not found or not eligible for payout")
            
        # Create payout request
        payout = {
            "id": str(uuid.uuid4()),
            "reward_id": reward_id,
            "referrer_user_id": user_id,
            "method": method,
            "amount": reward["amount"],
            "currency": reward["currency"],
            "status": PayoutStatus.IN_REVIEW.value,
            "provider_ref": None,
            "error": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.referral_payouts.insert_one(payout)
        
        # Lock the reward
        await self.db.referral_rewards.update_one(
            {"id": reward_id},
            {"$set": {"status": RewardStatus.LOCKED.value}}
        )
        
        return payout["id"]
    
    async def get_user_referrals(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's referral history"""
        
        pipeline = [
            {"$match": {"referrer_user_id": user_id}},
            {"$lookup": {
                "from": "users",
                "localField": "referred_user_id", 
                "foreignField": "id",
                "as": "referred_user"
            }},
            {"$lookup": {
                "from": "referral_rewards",
                "localField": "id",
                "foreignField": "attribution_id",
                "as": "rewards"
            }},
            {"$sort": {"created_at": -1}},
            {"$limit": limit}
        ]
        
        referrals = await self.db.referral_attributions.aggregate(pipeline).to_list(length=None)
        
        # Clean up and format data
        for referral in referrals:
            if "_id" in referral:
                del referral["_id"]
                
            # Mask referred user email for privacy
            if referral.get("referred_user"):
                user = referral["referred_user"][0] if referral["referred_user"] else {}
                referral["referred_user"] = {
                    "email": user.get("email", "")[:3] + "***@***.com" if user.get("email") else "",
                    "joined_at": user.get("created_at")
                }
            
            # Calculate total rewards
            total_rewards = sum(r.get("amount", 0) for r in referral.get("rewards", []))
            referral["total_reward"] = total_rewards
            
            # Remove detailed rewards (privacy)
            if "rewards" in referral:
                del referral["rewards"]
                
        return referrals
    
    async def generate_referral_link(self, user_id: str, utm_source: str = "referral", utm_medium: str = "link") -> str:
        """Generate complete referral link"""
        
        code = await self.get_or_create_referral_code(user_id)
        
        base_url = os.getenv("FRONTEND_URL", "https://pdp-cart-bug.preview.emergentagent.com")
        
        return f"{base_url}/api/referrals/click?code={code}&to=/signup&utm_source={utm_source}&utm_medium={utm_medium}"
    
    async def check_fraud_indicators(self, attribution_id: str) -> List[str]:
        """Check for fraud indicators on referral"""
        
        attribution = await self.db.referral_attributions.find_one({"id": attribution_id})
        if not attribution:
            return []
            
        flags = []
        
        # Check for same IP usage between referrer and referred
        referrer_clicks = await self.db.referral_clicks.find({"code": attribution["code"]}).to_list(length=10)
        if referrer_clicks:
            # This is a simplified check - in production, implement more sophisticated fraud detection
            click_ips = [click.get("ip") for click in referrer_clicks]
            if len(set(click_ips)) == 1:  # All clicks from same IP
                flags.append("Same IP address used for multiple clicks")
        
        return flags