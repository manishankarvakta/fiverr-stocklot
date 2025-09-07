#!/usr/bin/env python3
"""
StockLot Email Notification Service
Comprehensive email system supporting 65 notification types with Mailgun integration
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timezone
from enum import Enum
import asyncio
import aiohttp
from dataclasses import dataclass, asdict
from jinja2 import Environment, FileSystemLoader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailCategory(str, Enum):
    """Email categories for preference management and compliance"""
    TRANSACTIONAL_AUTH = "transactional.auth"
    TRANSACTIONAL_KYC = "transactional.kyc" 
    TRANSACTIONAL_ORG = "transactional.org"
    TRANSACTIONAL_LISTINGS = "transactional.listings"
    TRANSACTIONAL_ORDERS = "transactional.orders"
    TRANSACTIONAL_PAYMENTS = "transactional.payments"
    TRANSACTIONAL_PAYOUTS = "transactional.payouts"
    SECURITY = "security"
    COMPLIANCE = "compliance"
    LIFECYCLE = "lifecycle"
    ENGAGEMENT = "engagement"
    LOGISTICS = "logistics"
    AUCTIONS = "auctions"
    RFQ = "rfq"
    REVIEWS = "reviews"
    MESSAGING = "messaging"
    STATEMENTS = "statements"
    ADMIN_ALERTS = "admin.alerts"

class EmailPriority(str, Enum):
    """Email delivery priority"""
    HIGH = "high"        # Immediate (auth, security, payments)
    NORMAL = "normal"    # Standard delivery
    LOW = "low"          # Can be delayed/batched

@dataclass
class EmailTemplate:
    """Email template definition"""
    id: str
    subject: str
    category: EmailCategory
    priority: EmailPriority
    variables: List[str]
    description: str
    trigger: str
    recipients: str
    can_unsubscribe: bool = False

@dataclass
class EmailNotification:
    """Email notification instance"""
    template_id: str
    recipient_email: str
    recipient_name: str
    variables: Dict[str, Any]
    scheduled_at: Optional[datetime] = None
    tags: List[str] = None

class EmailNotificationService:
    """Comprehensive email notification service with Mailgun integration"""
    
    def __init__(self, db=None):
        self.db = db
        self.mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        self.mailgun_domain = os.environ.get('MAILGUN_DOMAIN', 'stocklot.farm')
        self.mailgun_base_url = f"https://api.mailgun.net/v3/{self.mailgun_domain}"
        self.from_email = f"StockLot <no-reply@{self.mailgun_domain}>"
        
        # Template engine setup
        self.jinja_env = Environment(
            loader=FileSystemLoader('/app/backend/templates/email')
        )
        
        # Load email templates catalog
        self.templates = self._load_templates()
        
    def _load_templates(self) -> Dict[str, EmailTemplate]:
        """Load the complete catalog of 65 email templates"""
        templates = {}
        
        # A) Auth & Account (10)
        templates.update({
            "E01": EmailTemplate("E01", "Welcome – Verify your email", EmailCategory.TRANSACTIONAL_AUTH, EmailPriority.HIGH, 
                               ["first_name", "verify_url"], "User registers", "user", False),
            "E02": EmailTemplate("E02", "Email verified – You're in", EmailCategory.TRANSACTIONAL_AUTH, EmailPriority.HIGH,
                               ["first_name"], "Verification succeeds", "user", False),
            "E03": EmailTemplate("E03", "Reset your password", EmailCategory.TRANSACTIONAL_AUTH, EmailPriority.HIGH,
                               ["first_name", "reset_url"], "Forgot password request", "user", False),
            "E04": EmailTemplate("E04", "Your password was changed", EmailCategory.SECURITY, EmailPriority.HIGH,
                               ["first_name", "device", "ip", "when"], "Password updated", "user", False),
            "E05": EmailTemplate("E05", "New login on your account", EmailCategory.SECURITY, EmailPriority.HIGH,
                               ["first_name", "device", "ip", "location", "when"], "New device/session", "user", False),
            "E06": EmailTemplate("E06", "Your 2FA code", EmailCategory.SECURITY, EmailPriority.HIGH,
                               ["first_name", "otp"], "2FA challenge", "user", False),
            "E07": EmailTemplate("E07", "2FA settings changed", EmailCategory.SECURITY, EmailPriority.HIGH,
                               ["first_name", "action", "when"], "2FA enabled/disabled", "user", False),
            "E08": EmailTemplate("E08", "KYC submitted", EmailCategory.TRANSACTIONAL_KYC, EmailPriority.NORMAL,
                               ["first_name", "kyc_level"], "User submits KYC", "user", False),
            "E09": EmailTemplate("E09", "KYC approved", EmailCategory.TRANSACTIONAL_KYC, EmailPriority.NORMAL,
                               ["first_name", "kyc_level"], "KYC verified", "user", False),
            "E10": EmailTemplate("E10", "KYC needs attention", EmailCategory.TRANSACTIONAL_KYC, EmailPriority.HIGH,
                               ["first_name", "issues", "resubmit_url"], "KYC rejected", "user", False),
        })
        
        # B) Profiles & Organizations (4)
        templates.update({
            "E11": EmailTemplate("E11", "Organization created", EmailCategory.TRANSACTIONAL_ORG, EmailPriority.NORMAL,
                               ["first_name", "org_name"], "Farm/Co-op created", "org owner", False),
            "E12": EmailTemplate("E12", "You've been invited to {{org_name}}", EmailCategory.TRANSACTIONAL_ORG, EmailPriority.NORMAL,
                               ["inviter_name", "org_name", "accept_url"], "Member invited", "invitee", False),
            "E13": EmailTemplate("E13", "Your role changed on {{org_name}}", EmailCategory.TRANSACTIONAL_ORG, EmailPriority.NORMAL,
                               ["member_name", "org_name", "old_role", "new_role"], "Role updated", "member", False),
            "E14": EmailTemplate("E14", "Removed from {{org_name}}", EmailCategory.TRANSACTIONAL_ORG, EmailPriority.NORMAL,
                               ["member_name", "org_name"], "Member removed", "member", False),
        })
        
        # C) Listings & Compliance (10)
        templates.update({
            "E15": EmailTemplate("E15", "Listing submitted for review", EmailCategory.TRANSACTIONAL_LISTINGS, EmailPriority.NORMAL,
                               ["seller_name", "listing_title", "listing_url"], "Seller creates listing", "seller", False),
            "E16": EmailTemplate("E16", "Listing approved", EmailCategory.TRANSACTIONAL_LISTINGS, EmailPriority.NORMAL,
                               ["listing_title", "listing_url"], "Admin approves", "seller", False),
            "E17": EmailTemplate("E17", "Listing rejected – action required", EmailCategory.TRANSACTIONAL_LISTINGS, EmailPriority.HIGH,
                               ["listing_title", "reason", "edit_url"], "Admin rejects", "seller", False),
            "E18": EmailTemplate("E18", "Certificate expiring in 7 days", EmailCategory.COMPLIANCE, EmailPriority.HIGH,
                               ["listing_title", "cert_type", "expiry_date", "upload_url"], "Cert near expiry", "seller", False),
            "E19": EmailTemplate("E19", "Certificate expired – listing paused", EmailCategory.COMPLIANCE, EmailPriority.HIGH,
                               ["listing_title", "cert_type", "upload_url"], "Cert expires", "seller", False),
            "E20": EmailTemplate("E20", "Listing reaches 30 days soon", EmailCategory.LIFECYCLE, EmailPriority.NORMAL,
                               ["listing_title", "pause_date", "renew_url"], "Day-25 reminder", "seller", True),
            "E21": EmailTemplate("E21", "Listing auto-paused (30-day or doc missing)", EmailCategory.LIFECYCLE, EmailPriority.HIGH,
                               ["listing_title", "reason", "reactivate_url"], "Auto-pause rule", "seller", False),
            "E22": EmailTemplate("E22", "Your listing sold", EmailCategory.TRANSACTIONAL_LISTINGS, EmailPriority.HIGH,
                               ["listing_title", "order_code", "orders_url"], "Order created", "seller", False),
            "E23": EmailTemplate("E23", "Inventory low/out of stock", EmailCategory.LIFECYCLE, EmailPriority.NORMAL,
                               ["listing_title", "remaining", "edit_url"], "Stock threshold", "seller", True),
            "E24": EmailTemplate("E24", "Reactivate your paused listing", EmailCategory.LIFECYCLE, EmailPriority.LOW,
                               ["listing_title", "reactivate_url"], "Nudge after pause", "seller", True),
        })
        
        # D) Search & Watchlists (2)
        templates.update({
            "E25": EmailTemplate("E25", "New matches for your saved search", EmailCategory.ENGAGEMENT, EmailPriority.LOW,
                               ["search_name", "results_count", "results_url"], "New listings match", "user", True),
            "E26": EmailTemplate("E26", "Price drop on an item you watch", EmailCategory.ENGAGEMENT, EmailPriority.NORMAL,
                               ["listing_title", "old_price", "new_price", "listing_url"], "Price change", "user", True),
        })
        
        # E) Orders & Escrow (12)
        templates.update({
            "E27": EmailTemplate("E27", "Order created – next steps", EmailCategory.TRANSACTIONAL_ORDERS, EmailPriority.HIGH,
                               ["buyer_name", "order_code", "total", "checkout_url"], "Buyer places order", "buyer", False),
            "E28": EmailTemplate("E28", "New order received", EmailCategory.TRANSACTIONAL_ORDERS, EmailPriority.HIGH,
                               ["seller_name", "order_code", "orders_url"], "Order created", "seller", False),
            "E29": EmailTemplate("E29", "Payment received – escrow held", EmailCategory.TRANSACTIONAL_PAYMENTS, EmailPriority.HIGH,
                               ["order_code", "amount"], "Payment success", "buyer & seller", False),
            "E30": EmailTemplate("E30", "Payment failed", EmailCategory.TRANSACTIONAL_PAYMENTS, EmailPriority.HIGH,
                               ["order_code", "retry_url", "reason"], "Charge fails", "buyer", False),
            "E31": EmailTemplate("E31", "Order canceled", EmailCategory.TRANSACTIONAL_ORDERS, EmailPriority.HIGH,
                               ["order_code", "reason"], "Cancelation processed", "buyer & seller", False),
            "E32": EmailTemplate("E32", "Seller marked order Ready to Dispatch", EmailCategory.TRANSACTIONAL_ORDERS, EmailPriority.NORMAL,
                               ["order_code", "tracking_setup_url"], "Fulfillment update", "buyer", False),
            "E33": EmailTemplate("E33", "Order dispatched", EmailCategory.TRANSACTIONAL_ORDERS, EmailPriority.HIGH,
                               ["order_code", "carrier", "tracking_code", "track_url"], "Shipped", "buyer", False),
            "E34": EmailTemplate("E34", "Delivery ETA reminder", EmailCategory.TRANSACTIONAL_ORDERS, EmailPriority.NORMAL,
                               ["order_code", "eta"], "T-24h of ETA", "buyer", False),
            "E35": EmailTemplate("E35", "Confirm delivery to release escrow", EmailCategory.TRANSACTIONAL_PAYMENTS, EmailPriority.HIGH,
                               ["order_code", "confirm_url"], "Delivery confirmation", "buyer", False),
            "E36": EmailTemplate("E36", "Buyer confirmed receipt", EmailCategory.TRANSACTIONAL_PAYMENTS, EmailPriority.HIGH,
                               ["order_code"], "Buyer confirms", "seller", False),
            "E37": EmailTemplate("E37", "Escrow released – payout on its way", EmailCategory.TRANSACTIONAL_PAYOUTS, EmailPriority.HIGH,
                               ["order_code", "net_payout", "payout_ref"], "Escrow release", "seller", False),
            "E38": EmailTemplate("E38", "Refund issued", EmailCategory.TRANSACTIONAL_PAYMENTS, EmailPriority.HIGH,
                               ["order_code", "amount", "reason"], "Refund completed", "buyer", False),
        })
        
        # F) Payouts & Finance (5)
        templates.update({
            "E39": EmailTemplate("E39", "Payout initiated", EmailCategory.TRANSACTIONAL_PAYOUTS, EmailPriority.HIGH,
                               ["payout_amount", "bank_name", "account_last4", "transfer_ref"], "Transfer created", "seller", False),
            "E40": EmailTemplate("E40", "Payout failed – action required", EmailCategory.TRANSACTIONAL_PAYOUTS, EmailPriority.HIGH,
                               ["payout_amount", "reason", "fix_url"], "Transfer error", "seller", False),
            "E41": EmailTemplate("E41", "Payout succeeded", EmailCategory.TRANSACTIONAL_PAYOUTS, EmailPriority.HIGH,
                               ["payout_amount", "bank_name", "transfer_ref"], "Transfer success", "seller", False),
            "E42": EmailTemplate("E42", "Monthly statement", EmailCategory.STATEMENTS, EmailPriority.LOW,
                               ["period", "gross", "fees", "net", "pdf_url"], "First of month", "seller", True),
            "E43": EmailTemplate("E43", "Tax invoice/receipt", EmailCategory.STATEMENTS, EmailPriority.NORMAL,
                               ["order_code", "amount", "invoice_pdf_url"], "Payment completed", "buyer", False),
        })
        
        # G) Logistics, Transporters & Abattoirs (5)
        templates.update({
            "E44": EmailTemplate("E44", "Delivery quote request created", EmailCategory.LOGISTICS, EmailPriority.NORMAL,
                               ["rfq_code", "pickup", "dropoff", "deadlines", "rfq_url"], "RFQ created", "transporters", False),
            "E45": EmailTemplate("E45", "New transporter bid received", EmailCategory.LOGISTICS, EmailPriority.NORMAL,
                               ["rfq_code", "carrier_name", "bid_amount", "rfq_url"], "Bid submitted", "buyer/seller", False),
            "E46": EmailTemplate("E46", "RFQ awarded", EmailCategory.LOGISTICS, EmailPriority.HIGH,
                               ["rfq_code", "consignment_url"], "Award done", "transporter", False),
            "E47": EmailTemplate("E47", "Consignment docs required", EmailCategory.COMPLIANCE, EmailPriority.HIGH,
                               ["consignment_code", "doc_list", "upload_url"], "Missing permits", "transporter & seller", False),
            "E48": EmailTemplate("E48", "Proof of delivery uploaded", EmailCategory.LOGISTICS, EmailPriority.NORMAL,
                               ["consignment_code", "pod_url"], "POD added", "buyer & seller", False),
        })
        
        # H) Auctions (5)
        templates.update({
            "E49": EmailTemplate("E49", "Auction listing approved", EmailCategory.AUCTIONS, EmailPriority.NORMAL,
                               ["lot_title", "auction_url"], "Auction approved", "seller", False),
            "E50": EmailTemplate("E50", "Auction starting soon", EmailCategory.AUCTIONS, EmailPriority.NORMAL,
                               ["lot_title", "start_time", "auction_url"], "T-24h reminder", "watchers", True),
            "E51": EmailTemplate("E51", "You've been outbid", EmailCategory.AUCTIONS, EmailPriority.HIGH,
                               ["lot_title", "current_bid", "bid_url"], "Bid surpassed", "bidder", False),
            "E52": EmailTemplate("E52", "You won the auction – complete payment", EmailCategory.AUCTIONS, EmailPriority.HIGH,
                               ["lot_title", "final_bid", "checkout_url"], "Auction won", "winner", False),
            "E53": EmailTemplate("E53", "Auction ended – reserve not met", EmailCategory.AUCTIONS, EmailPriority.NORMAL,
                               ["lot_title", "highest_bid", "relist_url"], "Reserve unmet", "seller", False),
        })
        
        # I) Buy Requests / Offers (5)
        templates.update({
            "E54": EmailTemplate("E54", "Buy request posted", EmailCategory.RFQ, EmailPriority.NORMAL,
                               ["request_code", "request_url"], "Buyer posts RFQ", "buyer", False),
            "E55": EmailTemplate("E55", "New nearby buy request", EmailCategory.RFQ, EmailPriority.NORMAL,
                               ["request_title", "distance", "request_url"], "Geo/species match", "sellers", True),
            "E56": EmailTemplate("E56", "Offer received on your request", EmailCategory.RFQ, EmailPriority.HIGH,
                               ["request_code", "offer_price", "offer_url"], "Seller offers", "buyer", False),
            "E57": EmailTemplate("E57", "Your offer was accepted – proceed to checkout", EmailCategory.RFQ, EmailPriority.HIGH,
                               ["offer_code", "order_code", "orders_url"], "Buyer accepts", "seller", False),
            "E58": EmailTemplate("E58", "Offer expired", EmailCategory.RFQ, EmailPriority.NORMAL,
                               ["offer_code", "expired_at"], "Offer validity passed", "buyer & seller", False),
        })
        
        # J) Reviews & Ratings (4)
        templates.update({
            "E59": EmailTemplate("E59", "Time to review your recent transaction", EmailCategory.REVIEWS, EmailPriority.LOW,
                               ["order_code", "review_url"], "Post-delivery", "buyer & seller", True),
            "E60": EmailTemplate("E60", "You received a review", EmailCategory.REVIEWS, EmailPriority.NORMAL,
                               ["order_code", "stars", "review_excerpt", "profile_url"], "Review posted", "buyer/seller", True),
            "E61": EmailTemplate("E61", "Your review is now public", EmailCategory.REVIEWS, EmailPriority.LOW,
                               ["order_code", "review_url"], "Double-blind reveal", "both", True),
            "E62": EmailTemplate("E62", "Your review was moderated", EmailCategory.REVIEWS, EmailPriority.NORMAL,
                               ["order_code", "reason", "appeal_url"], "Moderation action", "author", True),
        })
        
        # K) Messaging & System Threads (2)
        templates.update({
            "E63": EmailTemplate("E63", "New message in your conversation", EmailCategory.MESSAGING, EmailPriority.NORMAL,
                               ["subject", "snippet", "thread_url"], "Message when idle", "participant", True),
            "E64": EmailTemplate("E64", "You were mentioned / assigned", EmailCategory.MESSAGING, EmailPriority.HIGH,
                               ["subject", "snippet", "thread_url"], "@mention", "mentioned user", True),
        })
        
        # L) Admin / System Health (1)
        templates.update({
            "E65": EmailTemplate("E65", "Action required: webhook or job failure", EmailCategory.ADMIN_ALERTS, EmailPriority.HIGH,
                               ["service", "error", "first_seen", "runbook_url"], "System failure", "admins", False),
        })
        
        return templates
    
    async def send_email(self, notification: EmailNotification) -> bool:
        """Send email notification via Mailgun"""
        try:
            template = self.templates.get(notification.template_id)
            if not template:
                logger.error(f"Template {notification.template_id} not found")
                return False
            
            # Render subject with variables
            subject = self._render_template_string(template.subject, notification.variables)
            
            # Get HTML content
            html_content = await self._render_html_template(notification.template_id, notification.variables)
            
            # Prepare Mailgun payload
            data = {
                'from': self.from_email,
                'to': notification.recipient_email,
                'subject': subject,
                'html': html_content,
                'o:tag': notification.tags or [notification.template_id],
                'o:tracking': 'yes',
                'o:tracking-clicks': 'yes',
                'o:tracking-opens': 'yes'
            }
            
            # Add template variables for Mailgun
            if notification.variables:
                data['h:X-Mailgun-Variables'] = json.dumps(notification.variables)
            
            # Send via Mailgun API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.mailgun_base_url}/messages",
                    auth=aiohttp.BasicAuth('api', self.mailgun_api_key),
                    data=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Email sent successfully: {result.get('id')}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"Mailgun error: {response.status} - {error_text}")
                        return False
                        
        except Exception as e:
            logger.error(f"Failed to send email {notification.template_id}: {str(e)}")
            return False
    
    def _render_template_string(self, template_str: str, variables: Dict[str, Any]) -> str:
        """Render template string with variables"""
        try:
            template = self.jinja_env.from_string(template_str)
            return template.render(**variables)
        except Exception as e:
            logger.error(f"Template rendering error: {str(e)}")
            return template_str
    
    async def _render_html_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        """Render HTML email template"""
        try:
            template = self.jinja_env.get_template(f"{template_id.lower()}.html")
            return template.render(**variables)
        except Exception as e:
            logger.warning(f"HTML template {template_id} not found, using fallback")
            return self._create_fallback_template(template_id, variables)
    
    def _create_fallback_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        """Create basic HTML template as fallback"""
        template_info = self.templates.get(template_id)
        if not template_info:
            return "<p>Email content not available</p>"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>StockLot</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #22c55e; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                .button {{ background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐄 StockLot</h1>
                    <p>South Africa's Premier Livestock Marketplace</p>
                </div>
                <div class="content">
                    <h2>{self._render_template_string(template_info.subject, variables)}</h2>
                    <p>Hello {variables.get('first_name', 'there')},</p>
                    <p>{template_info.description}</p>
                    <p><strong>Template:</strong> {template_id}</p>
                </div>
                <div class="footer">
                    <p>© 2025 StockLot. All rights reserved.</p>
                    <p><a href="mailto:hello@stocklot.farm">Contact Support</a> | <a href="#">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    # Convenience methods for common notifications
    async def send_welcome_email(self, user_email: str, first_name: str, verify_url: str) -> bool:
        """Send welcome verification email (E01)"""
        notification = EmailNotification(
            template_id="E01",
            recipient_email=user_email,
            recipient_name=first_name,
            variables={
                "first_name": first_name,
                "verify_url": verify_url
            },
            tags=["E01", "auth", "welcome"]
        )
        return await self.send_email(notification)
    
    async def send_order_created_email(self, buyer_email: str, buyer_name: str, order_code: str, total: float, checkout_url: str) -> bool:
        """Send order created email (E27)"""
        notification = EmailNotification(
            template_id="E27",
            recipient_email=buyer_email,
            recipient_name=buyer_name,
            variables={
                "buyer_name": buyer_name,
                "order_code": order_code,
                "total": f"R{total:,.2f}",
                "checkout_url": checkout_url
            },
            tags=["E27", "orders", "checkout"]
        )
        return await self.send_email(notification)
    
    async def send_escrow_held_email(self, emails: List[str], order_code: str, amount: float) -> bool:
        """Send escrow held notification (E29)"""
        success_count = 0
        for email in emails:
            notification = EmailNotification(
                template_id="E29",
                recipient_email=email,
                recipient_name="",
                variables={
                    "order_code": order_code,
                    "amount": f"R{amount:,.2f}"
                },
                tags=["E29", "orders", "escrow"]
            )
            if await self.send_email(notification):
                success_count += 1
        return success_count == len(emails)
    
    def get_template_catalog(self) -> Dict[str, Dict]:
        """Export complete template catalog for development team"""
        catalog = {}
        for template_id, template in self.templates.items():
            catalog[template_id] = {
                "id": template.id,
                "subject": template.subject,
                "category": template.category.value,
                "priority": template.priority.value,
                "variables": template.variables,
                "description": template.description,
                "trigger": template.trigger,
                "recipients": template.recipients,
                "can_unsubscribe": template.can_unsubscribe
            }
        return catalog

# Usage example:
if __name__ == "__main__":
    async def test_service():
        service = EmailNotificationService()
        
        # Test welcome email
        success = await service.send_welcome_email(
            user_email="test@example.com",
            first_name="John",
            verify_url="https://stocklot.farm/verify/abc123"
        )
        print(f"Welcome email sent: {success}")
        
        # Export catalog
        catalog = service.get_template_catalog()
        print(f"Total templates: {len(catalog)}")
    
    asyncio.run(test_service())