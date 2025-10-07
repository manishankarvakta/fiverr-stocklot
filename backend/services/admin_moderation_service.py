import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
from email_service import EmailService
from notification_service import NotificationService

logger = logging.getLogger(__name__)

class AdminModerationService:
    def __init__(self, db):
        self.db = db
        self.email_service = EmailService()
        self.notification_service = NotificationService(db)
        
    # ========================================
    # ROLE UPGRADE REQUESTS
    # ========================================
    
    async def get_role_requests(self, status: str = None, role: str = None, limit: int = 100):
        """Get role upgrade requests for admin review"""
        try:
            query = {}
            if status:
                query["status"] = status
            if role:
                query["requested_role"] = role
            
            cursor = self.db.role_upgrade_requests.aggregate([
                {"$match": query},
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id", 
                    "foreignField": "id",
                    "as": "user"
                }},
                {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
                {"$sort": {"created_at": -1}},
                {"$limit": limit},
                {"$project": {
                    "_id": 0,  # Exclude MongoDB ObjectId
                    "id": 1,
                    "user_id": 1,
                    "requested_role": 1,
                    "status": 1,
                    "kyc_level": 1,
                    "attachments": 1,
                    "business_license": 1,
                    "certification_docs": 1,
                    "created_at": 1,
                    "user_name": {"$ifNull": ["$user.full_name", "Unknown User"]},
                    "org_name": {"$ifNull": ["$user.business_name", None]}
                }}
            ])
            
            results = await cursor.to_list(length=None)
            
            # Convert datetime objects to ISO strings for JSON serialization
            for result in results:
                if "created_at" in result and hasattr(result["created_at"], 'isoformat'):
                    result["created_at"] = result["created_at"].isoformat()
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting role requests: {e}")
            return []
    
    async def approve_role_request(self, request_id: str, admin_id: str, note: str = None):
        """Approve a role upgrade request"""
        try:
            # Get the request
            request = await self.db.role_upgrade_requests.find_one({"id": request_id})
            if not request:
                raise ValueError("Role request not found")
            
            # Update request status
            await self.db.role_upgrade_requests.update_one(
                {"id": request_id},
                {
                    "$set": {
                        "status": "APPROVED",
                        "reviewer_id": admin_id,
                        "reviewed_at": datetime.now(timezone.utc),
                        "reason": note
                    }
                }
            )
            
            # Add role to user
            user = await self.db.users.find_one({"id": request["user_id"]})
            if user:
                current_roles = user.get("roles", ["buyer"])
                if request["requested_role"] not in current_roles:
                    current_roles.append(request["requested_role"])
                    
                await self.db.users.update_one(
                    {"id": request["user_id"]},
                    {"$set": {"roles": current_roles}}
                )
            
            # Log moderation event
            await self.db.moderation_events.insert_one({
                "entity_type": "role",
                "entity_id": request_id,
                "old_status": "PENDING",
                "new_status": "APPROVED",
                "actor_id": admin_id,
                "reason": note,
                "metadata": {
                    "user_id": request["user_id"],
                    "role": request["requested_role"]
                },
                "created_at": datetime.now(timezone.utc)
            })
            
            # Send notifications
            await self.send_role_approval_notification(
                request["user_id"], 
                request["requested_role"],
                user.get("full_name", "User")
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error approving role request {request_id}: {e}")
            return False
    
    async def reject_role_request(self, request_id: str, admin_id: str, reason: str):
        """Reject a role upgrade request"""
        try:
            # Get the request
            request = await self.db.role_upgrade_requests.find_one({"id": request_id})
            if not request:
                raise ValueError("Role request not found")
            
            # Update request status
            await self.db.role_upgrade_requests.update_one(
                {"id": request_id},
                {
                    "$set": {
                        "status": "REJECTED",
                        "reviewer_id": admin_id,
                        "reviewed_at": datetime.now(timezone.utc),
                        "reason": reason
                    }
                }
            )
            
            # Log moderation event
            await self.db.moderation_events.insert_one({
                "entity_type": "role",
                "entity_id": request_id,
                "old_status": "PENDING",
                "new_status": "REJECTED",
                "actor_id": admin_id,
                "reason": reason,
                "metadata": {
                    "user_id": request["user_id"],
                    "role": request["requested_role"]
                },
                "created_at": datetime.now(timezone.utc)
            })
            
            # Send rejection notification
            user = await self.db.users.find_one({"id": request["user_id"]})
            await self.send_role_rejection_notification(
                request["user_id"],
                request["requested_role"], 
                reason,
                user.get("full_name", "User")
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error rejecting role request {request_id}: {e}")
            return False
    
    # ========================================
    # DISEASE ZONE MANAGEMENT
    # ========================================
    
    async def get_disease_zones(self):
        """Get all disease zones"""
        try:
            cursor = self.db.disease_zones.find({}, {"_id": 0}).sort("updated_at", -1)
            results = await cursor.to_list(length=200)
            
            # Convert datetime objects to ISO strings
            for result in results:
                for field in ["created_at", "updated_at"]:
                    if field in result and hasattr(result[field], 'isoformat'):
                        result[field] = result[field].isoformat()
            
            return results
        except Exception as e:
            logger.error(f"Error getting disease zones: {e}")
            return []
    
    async def get_disease_zone_changes(self, status: str = "PENDING"):
        """Get pending disease zone changes"""
        try:
            cursor = self.db.disease_zone_changes.aggregate([
                {"$match": {"status": status}},
                {"$lookup": {
                    "from": "disease_zones",
                    "localField": "disease_zone_id",
                    "foreignField": "id", 
                    "as": "zone"
                }},
                {"$unwind": {"path": "$zone", "preserveNullAndEmptyArrays": True}},
                {"$lookup": {
                    "from": "users",
                    "localField": "proposer_id",
                    "foreignField": "id",
                    "as": "proposer"
                }},
                {"$unwind": {"path": "$proposer", "preserveNullAndEmptyArrays": True}},
                {"$sort": {"created_at": 1}},
                {"$project": {
                    "_id": 0,  # Exclude MongoDB ObjectId
                    "id": 1,
                    "disease_zone_id": 1,
                    "proposed_polygon": 1,
                    "change_reason": 1,
                    "status": 1,
                    "created_at": 1,
                    "zone_name": {"$ifNull": ["$zone.name", "Unknown Zone"]},
                    "proposer": {"$ifNull": ["$proposer.full_name", "Unknown User"]}
                }}
            ])
            
            results = await cursor.to_list(length=None)
            
            # Convert datetime objects to ISO strings
            for result in results:
                if "created_at" in result and hasattr(result["created_at"], 'isoformat'):
                    result["created_at"] = result["created_at"].isoformat()
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting disease zone changes: {e}")
            return []
    
    async def get_disease_zone_change_detail(self, change_id: str):
        """Get detailed information about a disease zone change"""
        try:
            cursor = self.db.disease_zone_changes.aggregate([
                {"$match": {"id": change_id}},
                {"$lookup": {
                    "from": "disease_zones",
                    "localField": "disease_zone_id",
                    "foreignField": "id",
                    "as": "zone"
                }},
                {"$unwind": "$zone"},
                {"$project": {
                    "id": 1,
                    "disease_zone_id": 1,
                    "proposed_polygon": 1,
                    "change_reason": 1,
                    "status": 1,
                    "created_at": 1,
                    "zone_name": "$zone.name",
                    "current_polygon": "$zone.polygon_geojson",
                    "geojson": "$proposed_polygon"
                }}
            ])
            
            result = await cursor.to_list(length=1)
            return result[0] if result else None
            
        except Exception as e:
            logger.error(f"Error getting disease zone change detail: {e}")
            return None
    
    async def approve_disease_zone_change(self, change_id: str, admin_id: str):
        """Approve a disease zone polygon change"""
        try:
            # Get the change
            change = await self.get_disease_zone_change_detail(change_id)
            if not change:
                raise ValueError("Disease zone change not found")
            
            # Update the disease zone with new polygon
            await self.db.disease_zones.update_one(
                {"id": change["disease_zone_id"]},
                {
                    "$set": {
                        "polygon_geojson": change["proposed_polygon"],
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Update change status
            await self.db.disease_zone_changes.update_one(
                {"id": change_id},
                {
                    "$set": {
                        "status": "APPROVED",
                        "reviewer_id": admin_id,
                        "reviewed_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Log moderation event
            await self.db.moderation_events.insert_one({
                "entity_type": "disease_zone",
                "entity_id": change_id,
                "old_status": "PENDING", 
                "new_status": "APPROVED",
                "actor_id": admin_id,
                "metadata": {
                    "zone_id": change["disease_zone_id"],
                    "zone_name": change["zone_name"]
                },
                "created_at": datetime.now(timezone.utc)
            })
            
            # Notify affected sellers (implement geofence logic)
            await self.notify_disease_zone_update(change["disease_zone_id"], change["zone_name"])
            
            return True
            
        except Exception as e:
            logger.error(f"Error approving disease zone change {change_id}: {e}")
            return False
    
    async def reject_disease_zone_change(self, change_id: str, admin_id: str, reason: str):
        """Reject a disease zone polygon change"""
        try:
            # Update change status
            await self.db.disease_zone_changes.update_one(
                {"id": change_id},
                {
                    "$set": {
                        "status": "REJECTED",
                        "reviewer_id": admin_id,
                        "reviewed_at": datetime.now(timezone.utc),
                        "reason": reason
                    }
                }
            )
            
            # Log moderation event
            await self.db.moderation_events.insert_one({
                "entity_type": "disease_zone",
                "entity_id": change_id,
                "old_status": "PENDING",
                "new_status": "REJECTED", 
                "actor_id": admin_id,
                "reason": reason,
                "created_at": datetime.now(timezone.utc)
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Error rejecting disease zone change {change_id}: {e}")
            return False
    
    # ========================================
    # FEES & FEATURE FLAGS
    # ========================================
    
    async def get_fee_configs(self):
        """Get all fee configurations"""
        try:
            cursor = self.db.fee_configs.find({}, {"_id": 0}).sort("created_at", -1)
            results = await cursor.to_list(length=50)
            
            # Convert datetime objects to ISO strings
            for result in results:
                for field in ["created_at", "activated_at"]:
                    if field in result and hasattr(result[field], 'isoformat'):
                        result[field] = result[field].isoformat()
            
            return results
        except Exception as e:
            logger.error(f"Error getting fee configs: {e}")
            return []
    
    async def create_fee_config(self, config_data: Dict, admin_id: str):
        """Create a new fee configuration"""
        try:
            fee_config = {
                "id": f"fc-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "label": config_data["label"],
                "platform_commission_pct": config_data["platform_commission_pct"],
                "seller_payout_fee_pct": config_data["seller_payout_fee_pct"],
                "buyer_processing_fee_pct": config_data["buyer_processing_fee_pct"],
                "escrow_fee_minor": config_data["escrow_fee_minor"],
                "minimum_order_value": config_data.get("minimum_order_value", 10000),
                "maximum_order_value": config_data.get("maximum_order_value", 100000000),
                "status": "DRAFT",
                "created_by": admin_id,
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.db.fee_configs.insert_one(fee_config)
            return fee_config
            
        except Exception as e:
            logger.error(f"Error creating fee config: {e}")
            return None
    
    async def activate_fee_config(self, config_id: str, admin_id: str):
        """Activate a fee configuration (deactivates others)"""
        try:
            # Archive current active config
            await self.db.fee_configs.update_many(
                {"status": "ACTIVE"},
                {"$set": {"status": "ARCHIVED"}}
            )
            
            # Activate new config
            await self.db.fee_configs.update_one(
                {"id": config_id},
                {
                    "$set": {
                        "status": "ACTIVE",
                        "activated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Log moderation event
            await self.db.moderation_events.insert_one({
                "entity_type": "fee",
                "entity_id": config_id,
                "old_status": "DRAFT",
                "new_status": "ACTIVE",
                "actor_id": admin_id,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Broadcast update to all frontends
            await self.broadcast_system_update("fees.updated", {
                "active_fee_config_id": config_id
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Error activating fee config {config_id}: {e}")
            return False
    
    async def get_feature_flags(self):
        """Get all feature flags"""
        try:
            cursor = self.db.feature_flags.find({}, {"_id": 0}).sort("key", 1)
            results = await cursor.to_list(length=None)
            
            # Convert datetime objects to ISO strings
            for result in results:
                for field in ["created_at", "updated_at"]:
                    if field in result and hasattr(result[field], 'isoformat'):
                        result[field] = result[field].isoformat()
            
            return results
        except Exception as e:
            logger.error(f"Error getting feature flags: {e}")
            return []
    
    async def update_feature_flag(self, key: str, status: str, rollout: Dict, admin_id: str):
        """Update a feature flag"""
        try:
            await self.db.feature_flags.update_one(
                {"key": key},
                {
                    "$set": {
                        "status": status,
                        "rollout": rollout,
                        "updated_by": admin_id,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # Log moderation event
            await self.db.moderation_events.insert_one({
                "entity_type": "flag",
                "entity_id": key,
                "old_status": "unknown",
                "new_status": status,
                "actor_id": admin_id,
                "metadata": {"rollout": rollout},
                "created_at": datetime.now(timezone.utc)
            })
            
            # Broadcast update to all frontends
            await self.broadcast_system_update("flags.updated", {
                "key": key,
                "status": status,
                "rollout": rollout
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating feature flag {key}: {e}")
            return False
    
    # ========================================
    # NOTIFICATION SYSTEM
    # ========================================
    
    async def send_role_approval_notification(self, user_id: str, role: str, user_name: str):
        """Send role approval notification to user"""
        try:
            # In-app notification
            await self.db.user_notifications.insert_one({
                "id": f"un-role-approved-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "user_id": user_id,
                "title": f"Role Upgrade Approved ✅",
                "message": f"Congratulations! Your {role.title()} role upgrade has been approved. You now have access to {role} features.",
                "type": "role_approved",
                "action_url": "/profile",
                "created_at": datetime.now(timezone.utc)
            })
            
            # Email notification
            success = self.email_service.send_email(
                to_user_id=user_id,
                subject=f"StockLot Role Upgrade Approved - {role.title()}",
                html_content=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #16a34a;">🎉 Role Upgrade Approved!</h2>
                    <p>Hi {user_name},</p>
                    <p>Great news! Your role upgrade to <strong>{role.title()}</strong> has been approved.</p>
                    <p>You now have access to:</p>
                    <ul>
                        <li>Enhanced seller features</li>
                        <li>Professional verification badge</li>
                        <li>Priority customer support</li>
                    </ul>
                    <p><a href="{os.getenv('FRONTEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')}/profile" 
                         style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                         View Your Profile
                    </a></p>
                    <p>Thank you for being part of the StockLot community!</p>
                </div>
                """
            )
            
            logger.info(f"Role approval notification sent to user {user_id}: {success}")
            
        except Exception as e:
            logger.error(f"Error sending role approval notification: {e}")
    
    async def send_role_rejection_notification(self, user_id: str, role: str, reason: str, user_name: str):
        """Send role rejection notification to user"""
        try:
            # In-app notification
            await self.db.user_notifications.insert_one({
                "id": f"un-role-rejected-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "user_id": user_id,
                "title": f"Role Upgrade Update",
                "message": f"Your {role.title()} role upgrade request has been reviewed. Reason: {reason}",
                "type": "role_rejected",
                "action_url": "/profile",
                "created_at": datetime.now(timezone.utc)
            })
            
            # Email notification
            success = self.email_service.send_email(
                to_user_id=user_id,
                subject=f"StockLot Role Upgrade Update - {role.title()}",
                html_content=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Role Upgrade Update</h2>
                    <p>Hi {user_name},</p>
                    <p>Thank you for your interest in upgrading to <strong>{role.title()}</strong> role.</p>
                    <p>After review, we need additional information or documentation:</p>
                    <p style="background-color: #fef2f2; padding: 12px; border-left: 4px solid #dc2626; margin: 16px 0;">
                        <strong>Reason:</strong> {reason}
                    </p>
                    <p>Please review the requirements and submit a new request when ready.</p>
                    <p><a href="{os.getenv('FRONTEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')}/profile" 
                         style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                         Update Profile
                    </a></p>
                </div>
                """
            )
            
            logger.info(f"Role rejection notification sent to user {user_id}: {success}")
            
        except Exception as e:
            logger.error(f"Error sending role rejection notification: {e}")
    
    async def notify_disease_zone_update(self, zone_id: str, zone_name: str):
        """Notify sellers affected by disease zone changes"""
        try:
            # This would implement geofence logic to find affected sellers
            # For now, we'll create a general notification
            
            # Find sellers in affected region (simplified)
            affected_sellers = await self.db.users.find({
                "roles": {"$in": ["seller"]},
                "location_region": {"$exists": True}
            }).to_list(length=100)
            
            for seller in affected_sellers:
                await self.db.user_notifications.insert_one({
                    "id": f"un-disease-{zone_id}-{seller['id']}",
                    "user_id": seller["id"],
                    "title": "Disease Zone Update",
                    "message": f"Disease control measures have been updated in {zone_name}. Please review restrictions that may affect your listings.",
                    "type": "disease_alert",
                    "action_url": "/listings",
                    "created_at": datetime.now(timezone.utc)
                })
            
            logger.info(f"Disease zone update notifications sent for zone {zone_name}")
            
        except Exception as e:
            logger.error(f"Error sending disease zone notifications: {e}")
    
    async def broadcast_system_update(self, event_type: str, payload: Dict):
        """Broadcast system updates to all connected clients"""
        try:
            # This would implement SSE or WebSocket broadcasting
            # For now, we'll log the event
            logger.info(f"Broadcasting {event_type}: {payload}")
            
            # Store the broadcast event for audit
            await self.db.system_events.insert_one({
                "event_type": event_type,
                "payload": payload,
                "created_at": datetime.now(timezone.utc)
            })
            
        except Exception as e:
            logger.error(f"Error broadcasting system update: {e}")
    
    # ========================================
    # MODERATION UTILITIES
    # ========================================
    
    async def get_moderation_stats(self):
        """Get moderation dashboard statistics"""
        try:
            stats = {}
            
            # Role requests
            role_stats = await self.db.role_upgrade_requests.aggregate([
                {"$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }}
            ]).to_list(length=None)
            
            stats["role_requests"] = {stat["_id"]: stat["count"] for stat in role_stats}
            
            # Listings pending review
            listings_pending = await self.db.listings.count_documents({
                "moderation_status": "PENDING_REVIEW"
            })
            stats["listings_pending"] = listings_pending
            
            # Disease zone changes
            disease_changes_pending = await self.db.disease_zone_changes.count_documents({
                "status": "PENDING"
            })
            stats["disease_changes_pending"] = disease_changes_pending
            
            # Recent moderation activity
            cursor = self.db.moderation_events.find({}, {"_id": 0}).sort("created_at", -1).limit(10)
            recent_activity = await cursor.to_list(length=None)
            
            # Convert datetime objects to ISO strings
            for activity in recent_activity:
                if "created_at" in activity and hasattr(activity["created_at"], 'isoformat'):
                    activity["created_at"] = activity["created_at"].isoformat()
            
            stats["recent_activity"] = recent_activity
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting moderation stats: {e}")
            return {}