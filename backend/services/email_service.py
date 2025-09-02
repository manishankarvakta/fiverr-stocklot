import os
import logging
from typing import Dict, List, Optional
from datetime import datetime
import requests
from jinja2 import Template

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.mailgun_api_key = os.getenv('MAILGUN_API_KEY')
        self.mailgun_domain = os.getenv('MAILGUN_DOMAIN', 'mg.stocklot.co.za')
        self.mailgun_base_url = f"https://api.mailgun.net/v3/{self.mailgun_domain}"
        self.from_email = f"StockLot <noreply@{self.mailgun_domain}>"
        
    def send_email(self, to: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """Send email via Mailgun"""
        if not self.mailgun_api_key:
            logger.warning("Mailgun API key not configured - skipping email")
            return False
            
        try:
            response = requests.post(
                f"{self.mailgun_base_url}/messages",
                auth=("api", self.mailgun_api_key),
                data={
                    "from": self.from_email,
                    "to": to,
                    "subject": subject,
                    "html": html_content,
                    "text": text_content or self._html_to_text(html_content)
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Email sent successfully to {to}")
                return True
            else:
                logger.error(f"Failed to send email to {to}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {to}: {e}")
            return False
    
    def _html_to_text(self, html: str) -> str:
        """Simple HTML to text conversion"""
        import re
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html)
        # Replace HTML entities
        text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        return text.strip()

    # Welcome Email
    def send_welcome_email(self, user_email: str, user_name: str, verification_url: str = None) -> bool:
        """Send welcome email to new users"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
                .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
                .feature { background: white; padding: 15px; border-radius: 6px; text-align: center; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐄 Welcome to StockLot!</h1>
                    <p>South Africa's Premier Livestock Marketplace</p>
                </div>
                <div class="content">
                    <p>Hi {{ user_name }},</p>
                    
                    <p>Welcome to StockLot - where livestock trading meets modern technology! We're excited to have you join our community of farmers, traders, and livestock enthusiasts.</p>
                    
                    {% if verification_url %}
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="{{ verification_url }}" class="button">Verify Your Email</a>
                    </div>
                    <p style="color: #e11d48;"><strong>Important:</strong> Please verify your email address to activate all features.</p>
                    {% endif %}
                    
                    <h3 style="color: #10b981;">🎉 What You Can Do Now:</h3>
                    <div class="features">
                        <div class="feature">
                            <h4>🛒 Browse & Buy</h4>
                            <p>Discover quality livestock from verified sellers across South Africa</p>
                        </div>
                        <div class="feature">
                            <h4>📦 Sell Livestock</h4>
                            <p>List your animals with photos, health certificates, and delivery options</p>
                        </div>
                        <div class="feature">
                            <h4>🏢 Create Organizations</h4>
                            <p>Set up team accounts for farms and livestock businesses</p>
                        </div>
                        <div class="feature">
                            <h4>🔒 Secure Escrow</h4>
                            <p>All transactions protected with secure escrow payments</p>
                        </div>
                    </div>
                    
                    <h3 style="color: #10b981;">🚀 Quick Start Tips:</h3>
                    <ul>
                        <li><strong>Complete Your Profile:</strong> Add your location and farming interests</li>
                        <li><strong>Browse Listings:</strong> Use filters to find exactly what you need</li>
                        <li><strong>Set Up Alerts:</strong> Get notified when new livestock matches your criteria</li>
                        <li><strong>Join Communities:</strong> Connect with other farmers in your area</li>
                    </ul>
                    
                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                        <p><strong>💡 Pro Tip:</strong> Complete your KYC verification to unlock higher transaction limits and premium features!</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Questions? Reply to this email or visit our <a href="https://stocklot.co.za/help">Help Center</a></p>
                    <p>Happy Trading! 🎉<br>The StockLot Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name, verification_url=verification_url)
        return self.send_email(user_email, "🐄 Welcome to StockLot - Let's Get Started!", html_content)

    # Password Reset Email
    def send_password_reset_email(self, user_email: str, user_name: str, reset_url: str, expires_in: str = "1 hour") -> bool:
        """Send password reset email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
                .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔒 Password Reset Request</h1>
                    <p>StockLot Account Security</p>
                </div>
                <div class="content">
                    <p>Hi {{ user_name }},</p>
                    
                    <p>We received a request to reset your StockLot account password. If you made this request, click the button below to create a new password:</p>
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="{{ reset_url }}" class="button">Reset My Password</a>
                    </div>
                    
                    <div class="warning">
                        <p><strong>⚠️ Security Notice:</strong></p>
                        <ul>
                            <li>This link expires in {{ expires_in }}</li>
                            <li>Only use this link if you requested a password reset</li>
                            <li>Never share this link with anyone</li>
                        </ul>
                    </div>
                    
                    <p><strong>Didn't request this?</strong> Your account is still secure. Simply ignore this email and your password won't be changed.</p>
                    
                    <p>If you're having trouble with the button, copy and paste this link into your browser:<br>
                    <code style="background: #f3f4f6; padding: 5px; border-radius: 3px; word-break: break-all;">{{ reset_url }}</code></p>
                </div>
                <div class="footer">
                    <p>For security questions, contact us at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a></p>
                    <p>Stay Secure! 🔐<br>The StockLot Security Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name, reset_url=reset_url, expires_in=expires_in)
        return self.send_email(user_email, "🔒 Reset Your StockLot Password", html_content)

    # Order Confirmation Email
    def send_order_confirmation_email(self, user_email: str, user_name: str, order_data: Dict) -> bool:
        """Send order confirmation email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .order-summary { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
                .item { display: flex; justify-content: between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .total { background: #3b82f6; color: white; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Order Confirmed!</h1>
                    <p>Order #{{ order_data.id }}</p>
                </div>
                <div class="content">
                    <p>Hi {{ user_name }},</p>
                    
                    <p>Great news! Your order has been confirmed and payment secured in escrow. Here are the details:</p>
                    
                    <div class="order-summary">
                        <h3 style="color: #3b82f6; margin-top: 0;">📦 Order Summary</h3>
                        {% for item in order_data.items %}
                        <div class="item">
                            <div>
                                <strong>{{ item.title }}</strong><br>
                                <small>{{ item.species }} • Qty: {{ item.qty }} {{ item.unit }}</small>
                            </div>
                            <div style="text-align: right;">
                                <strong>R{{ "%.2f"|format(item.line_total) }}</strong>
                            </div>
                        </div>
                        {% endfor %}
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Subtotal:</span>
                                <span>R{{ "%.2f"|format(order_data.subtotal) }}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Delivery:</span>
                                <span>R{{ "%.2f"|format(order_data.delivery_total) }}</span>
                            </div>
                        </div>
                        
                        <div class="total">
                            Total Paid: R{{ "%.2f"|format(order_data.grand_total) }}
                        </div>
                    </div>
                    
                    <h3 style="color: #3b82f6;">📍 Delivery Information</h3>
                    <p><strong>Address:</strong> {{ order_data.delivery_address }}<br>
                    <strong>Phone:</strong> {{ order_data.phone or 'Not provided' }}</p>
                    
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                        <h4 style="margin-top: 0;">🔒 What Happens Next?</h4>
                        <ol>
                            <li><strong>Seller Notification:</strong> Sellers have been notified and will prepare your order</li>
                            <li><strong>Preparation:</strong> You'll receive updates as items are prepared for delivery</li>
                            <li><strong>Delivery Coordination:</strong> Sellers will contact you to arrange delivery/pickup</li>
                            <li><strong>Payment Release:</strong> Funds are released to sellers after successful delivery</li>
                        </ol>
                    </div>
                    
                    {% if order_data.is_guest %}
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                        <p><strong>👤 Guest Account Created:</strong> We've created an account for you using this email. You can track your orders and view purchase history anytime!</p>
                    </div>
                    {% endif %}
                </div>
                <div class="footer">
                    <p>Track your order: <a href="https://stocklot.co.za/orders/{{ order_data.id }}">View Order Status</a></p>
                    <p>Questions? Contact us at <a href="mailto:orders@stocklot.co.za">orders@stocklot.co.za</a></p>
                    <p>Thank you for choosing StockLot! 🐄<br>The StockLot Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name, order_data=order_data)
        return self.send_email(user_email, f"🎉 Order Confirmed - #{order_data['id']}", html_content)

    # Order Status Update Email
    def send_order_status_update_email(self, user_email: str, user_name: str, order_id: str, status: str, message: str = None) -> bool:
        """Send order status update email"""
        status_info = {
            'PREPARING': {'emoji': '📦', 'title': 'Order Being Prepared', 'color': '#f59e0b'},
            'READY': {'emoji': '✅', 'title': 'Order Ready for Delivery', 'color': '#10b981'},
            'SHIPPED': {'emoji': '🚚', 'title': 'Order Shipped', 'color': '#3b82f6'},
            'DELIVERED': {'emoji': '🎉', 'title': 'Order Delivered', 'color': '#10b981'},
            'CANCELLED': {'emoji': '❌', 'title': 'Order Cancelled', 'color': '#ef4444'},
        }
        
        info = status_info.get(status, {'emoji': '📋', 'title': 'Order Update', 'color': '#6b7280'})
        
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: {{ info.color }}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: {{ info.color }}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{{ info.emoji }} {{ info.title }}</h1>
                    <p>Order #{{ order_id }}</p>
                </div>
                <div class="content">
                    <p>Hi {{ user_name }},</p>
                    
                    <p>We have an update on your StockLot order:</p>
                    
                    {% if message %}
                    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid {{ info.color }};">
                        <p><strong>Update from seller:</strong></p>
                        <p>{{ message }}</p>
                    </div>
                    {% endif %}
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="https://stocklot.co.za/orders/{{ order_id }}" class="button">Track Your Order</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Questions? Contact us at <a href="mailto:orders@stocklot.co.za">orders@stocklot.co.za</a></p>
                    <p>The StockLot Team 🐄</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name, 
            order_id=order_id, 
            info=info, 
            message=message
        )
        return self.send_email(user_email, f"{info['emoji']} Order #{order_id} - {info['title']}", html_content)

    # KYC Verification Email
    def send_kyc_verification_email(self, user_email: str, user_name: str, status: str, notes: str = None) -> bool:
        """Send KYC verification status email"""
        if status == 'APPROVED':
            emoji = '✅'
            title = 'KYC Verification Approved'
            color = '#10b981'
            message = 'Congratulations! Your identity verification has been approved. You now have access to all StockLot features including higher transaction limits.'
        elif status == 'REJECTED':
            emoji = '❌'
            title = 'KYC Verification Needs Attention'
            color = '#ef4444'
            message = 'We need additional information to verify your identity. Please review the notes below and resubmit your verification documents.'
        else:
            emoji = '⏳'
            title = 'KYC Verification In Progress'
            color = '#f59e0b'
            message = 'Thank you for submitting your verification documents. Our team is currently reviewing them and will respond within 24-48 hours.'
        
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: {{ color }}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: {{ color }}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{{ emoji }} {{ title }}</h1>
                    <p>Identity Verification Update</p>
                </div>
                <div class="content">
                    <p>Hi {{ user_name }},</p>
                    
                    <p>{{ message }}</p>
                    
                    {% if notes %}
                    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid {{ color }};">
                        <p><strong>Additional Notes:</strong></p>
                        <p>{{ notes }}</p>
                    </div>
                    {% endif %}
                    
                    {% if status == 'APPROVED' %}
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                        <h4 style="margin-top: 0;">🎉 You Can Now:</h4>
                        <ul>
                            <li>Make transactions of any amount</li>
                            <li>List high-value livestock</li>
                            <li>Access priority customer support</li>
                            <li>Export livestock internationally</li>
                        </ul>
                    </div>
                    {% endif %}
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="https://stocklot.co.za/profile/kyc" class="button">View KYC Status</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Questions? Contact us at <a href="mailto:kyc@stocklot.co.za">kyc@stocklot.co.za</a></p>
                    <p>The StockLot Verification Team 🔐</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name,
            title=title,
            emoji=emoji,
            color=color,
            message=message,
            status=status,
            notes=notes
        )
        return self.send_email(user_email, f"{emoji} KYC Verification - {title}", html_content)

# Global email service instance
email_service = EmailService()