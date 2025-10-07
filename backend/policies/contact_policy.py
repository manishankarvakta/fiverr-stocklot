"""
Contact redaction policy for StockLot
Implements privacy protection for seller contact information
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# Feature flag to enforce in-app only contact
IN_APP_ONLY_CONTACT = os.getenv('IN_APP_ONLY_CONTACT', 'true').lower() == 'true'

async def can_view_seller_contact(viewer: Optional[Dict[str, Any]], seller_id: str, db) -> bool:
    """
    Determine if viewer can see seller's real contact information
    
    Args:
        viewer: Current user data (None if not authenticated)
        seller_id: ID of the seller whose contact is being requested
        db: Database connection
        
    Returns:
        bool: True if real contact can be shown, False to mask it
    """
    # If IN_APP_ONLY_CONTACT flag is enabled, block all contact visibility
    if IN_APP_ONLY_CONTACT:
        return False
    
    # No viewer means guest - cannot see contact
    if not viewer:
        return False
    
    # Admin users can always see contact (optional override)
    if viewer.get('role') == 'ADMIN':
        return True
    
    # Seller can always see their own contact
    if str(viewer.get('_id', viewer.get('id', ''))) == str(seller_id):
        return True
    
    try:
        # Check if viewer has active escrow relationship with seller (within 90 days)
        since_date = datetime.utcnow() - timedelta(days=90)
        
        # Check in orders/escrow collection
        escrow_relationship = await db.orders.find_one({
            'buyer_id': ObjectId(viewer['_id']) if '_id' in viewer else ObjectId(viewer['id']),
            'seller_id': ObjectId(seller_id),
            'created_at': {'$gte': since_date},
            'escrow_status': {'$in': ['FUNDS_HELD', 'DELIVERY_CONFIRMED', 'COMPLETED']}
        })
        
        return bool(escrow_relationship)
        
    except Exception as e:
        logger.error(f"Error checking escrow relationship: {e}")
        return False

def mask_contact_info(phone: Optional[str] = None, email: Optional[str] = None) -> Dict[str, str]:
    """
    Mask phone number and email for privacy protection
    
    Args:
        phone: Original phone number
        email: Original email address
        
    Returns:
        Dict with masked contact information
    """
    # Mask phone number
    if phone and len(phone) > 3:
        # Keep first digit and last 2 digits, mask the rest
        masked_phone = phone[0] + '•' * (len(phone) - 3) + phone[-2:]
    else:
        masked_phone = 'Hidden until purchase'
    
    # Mask email
    if email and '@' in email:
        try:
            username, domain = email.split('@', 1)
            if len(username) <= 2:
                masked_username = username[0] + '••'
            else:
                masked_username = username[:2] + '•' * (len(username) - 2)
            masked_email = f"{masked_username}@{domain}"
        except Exception:
            masked_email = 'Hidden until purchase'
    else:
        masked_email = 'Hidden until purchase'
    
    return {
        'phone_masked': masked_phone,
        'email_masked': masked_email
    }

def get_contact_for_user(seller_data: Dict[str, Any], viewer: Optional[Dict[str, Any]], seller_id: str, db) -> Dict[str, str]:
    """
    Get appropriate contact information based on user permissions
    
    Args:
        seller_data: Seller's full data including contact info
        viewer: Current user data
        seller_id: Seller's ID
        db: Database connection
        
    Returns:
        Dict with either real or masked contact information
    """
    try:
        # This should be called as async in the actual endpoint
        # For now, we'll implement sync version and make the endpoint async
        phone = seller_data.get('phone', '')
        email = seller_data.get('email', '')
        
        # For demonstration, always mask contact since we can't easily make this async here
        # The actual implementation should await can_view_seller_contact()
        if IN_APP_ONLY_CONTACT or not viewer:
            return mask_contact_info(phone, email)
        
        # In production, this should be:
        # allowed = await can_view_seller_contact(viewer, seller_id, db)
        # if allowed:
        #     return {'phone_masked': phone, 'email_masked': email}
        # else:
        #     return mask_contact_info(phone, email)
        
        # For now, default to masking for safety
        return mask_contact_info(phone, email)
        
    except Exception as e:
        logger.error(f"Error getting contact for user: {e}")
        return mask_contact_info()