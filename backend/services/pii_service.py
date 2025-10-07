"""
PII (Personally Identifiable Information) Service
Handles masking/redacting sensitive information in messages
"""

import re
import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

class PIIService:
    def __init__(self):
        # Regex patterns for different types of PII
        self.patterns = [
            # Email addresses
            (r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', 'email', '[redacted-email]'),
            # Phone numbers (various formats)
            (r'(\+?\d[\d\-\s\(\)]{7,}\d)', 'phone', '[redacted-phone]'),
            # URLs
            (r'(https?:\/\/[^\s]+)', 'url', '[redacted-url]'),
            # Raw phone numbers (10-11 digits)
            (r'\b\d{10,11}\b', 'phone_number', '[redacted-phone]'),
            # WhatsApp mentions
            (r'\bwhatsapp\b', 'contact_app', '[redacted-contact]'),
            # Telegram mentions
            (r'\btelegram\b', 'contact_app', '[redacted-contact]'),
            # Skype mentions
            (r'\bskype\b', 'contact_app', '[redacted-contact]'),
            # Social media handles (basic)
            (r'@[a-zA-Z0-9_]+', 'social_handle', '[redacted-handle]'),
        ]
    
    def scrub_pii(self, text: str) -> Dict[str, any]:
        """
        Scrub PII from text content
        
        Returns:
            {
                'body': str,        # Cleaned text
                'redacted': bool    # Whether any PII was found and redacted
            }
        """
        if not text:
            return {'body': '', 'redacted': False}
        
        cleaned_text = text
        redacted = False
        detected_types = []
        
        for pattern, pii_type, replacement in self.patterns:
            matches = re.findall(pattern, cleaned_text, re.IGNORECASE)
            if matches:
                redacted = True
                detected_types.append(pii_type)
                cleaned_text = re.sub(pattern, replacement, cleaned_text, flags=re.IGNORECASE)
                logger.info(f"Redacted {len(matches)} instances of {pii_type}")
        
        return {
            'body': cleaned_text,
            'redacted': redacted,
            'detected_types': detected_types
        }
    
    def is_pre_escrow_blocked(self, order_group_id: str = None) -> bool:
        """
        Determine if PII should be blocked based on escrow status
        
        For now, always return True (always block PII)
        TODO: Integrate with actual escrow status checking
        """
        # TODO: Check if escrow is paid for this order
        # For now, always block PII for safety
        return True
    
    def scan_attachments(self, attachments: list) -> Dict[str, any]:
        """
        Scan attachments for potential PII
        This is a placeholder - in production, you'd use OCR to scan image/PDF content
        
        Returns:
            {
                'allowed': bool,
                'blocked_attachments': list,
                'reason': str
            }
        """
        if not attachments:
            return {'allowed': True, 'blocked_attachments': [], 'reason': None}
        
        # Basic file type checking
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain'
        ]
        
        blocked = []
        for attachment in attachments:
            mime_type = attachment.get('mime', '').lower()
            if mime_type not in allowed_types:
                blocked.append(attachment)
        
        if blocked:
            return {
                'allowed': False,
                'blocked_attachments': blocked,
                'reason': 'File type not allowed'
            }
        
        # TODO: Add virus scanning
        # TODO: Add OCR-based PII detection for images/PDFs
        
        return {'allowed': True, 'blocked_attachments': [], 'reason': None}