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

    # Password Changed Notification Email
    def send_password_changed_notification(self, user_email: str, user_name: str) -> bool:
        """Send password changed confirmation email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .alert-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .alert-box h3 { color: #92400e; margin: 0 0 10px 0; }
                .security-tips { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
                ul { padding-left: 20px; }
                li { margin: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Password Successfully Changed</h1>
                    <p>Your StockLot account is now secured with your new password</p>
                </div>
                <div class="content">
                    <div class="success-icon">🔐</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Your password has been successfully changed for your StockLot account. This change was completed on:</p>
                    
                    <p><strong>{{ change_time }}</strong></p>
                    
                    <div class="alert-box">
                        <h3>🚨 Didn't make this change?</h3>
                        <p>If you did not request this password change, please contact our security team immediately at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a> or call our emergency line.</p>
                    </div>
                    
                    <div class="security-tips">
                        <h3>🛡️ Security Best Practices</h3>
                        <ul>
                            <li>Use a unique password for your StockLot account</li>
                            <li>Enable two-factor authentication when available</li>
                            <li>Never share your password with anyone</li>
                            <li>Log out of shared or public computers</li>
                            <li>Review your account activity regularly</li>
                        </ul>
                    </div>
                    
                    <p>Thank you for keeping your StockLot account secure!</p>
                </div>
                <div class="footer">
                    <p>For security questions, contact us at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a></p>
                    <p>Stay Secure! 🔐<br>The StockLot Security Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        from datetime import datetime
        change_time = datetime.now().strftime("%B %d, %Y at %I:%M %p CAT")
        
        html_content = template.render(user_name=user_name, change_time=change_time)
        return self.send_email(user_email, "🔐 Password Changed - StockLot Account", html_content)

    # 2FA Email Notifications
    def send_2fa_enabled_notification(self, user_email: str, user_name: str) -> bool:
        """Send 2FA enabled confirmation email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .security-tips { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ Two-Factor Authentication Enabled</h1>
                    <p>Your StockLot account is now extra secure!</p>
                </div>
                <div class="content">
                    <div class="success-icon">🔐</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Great news! Two-factor authentication (2FA) has been successfully enabled for your StockLot account.</p>
                    
                    <div class="security-tips">
                        <h3>🔐 What this means for you:</h3>
                        <ul>
                            <li><strong>Enhanced Security:</strong> Your account is now protected with an extra layer of security</li>
                            <li><strong>Login Process:</strong> You'll need your authenticator app for future logins</li>
                            <li><strong>Backup Codes:</strong> Save your backup codes in a secure location</li>
                            <li><strong>Device Access:</strong> Only you can access your account, even if someone knows your password</li>
                        </ul>
                    </div>
                    
                    <p><strong>Important:</strong> Keep your authenticator app safe and don't lose your backup codes. If you lose access to both, account recovery will be more difficult.</p>
                    
                    <p>Thank you for taking steps to secure your StockLot account!</p>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a></p>
                    <p>Stay Secure! 🛡️<br>The StockLot Security Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name)
        return self.send_email(user_email, "🛡️ Two-Factor Authentication Enabled - StockLot", html_content)

    def send_2fa_disabled_notification(self, user_email: str, user_name: str) -> bool:
        """Send 2FA disabled notification email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .warning-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .alert-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .alert-box h3 { color: #92400e; margin: 0 0 10px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Two-Factor Authentication Disabled</h1>
                    <p>Security change notification</p>
                </div>
                <div class="content">
                    <div class="warning-icon">🔓</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>This email confirms that two-factor authentication (2FA) has been <strong>disabled</strong> for your StockLot account.</p>
                    
                    <div class="alert-box">
                        <h3>🚨 Didn't make this change?</h3>
                        <p>If you did not disable 2FA, please contact our security team immediately at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a> and secure your account.</p>
                    </div>
                    
                    <p><strong>Security Reminder:</strong> Your account is now less secure without 2FA. We strongly recommend re-enabling two-factor authentication to protect your account from unauthorized access.</p>
                    
                    <p>You can re-enable 2FA anytime from your account security settings.</p>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a></p>
                    <p>Stay Secure! 🛡️<br>The StockLot Security Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name)
        return self.send_email(user_email, "⚠️ Two-Factor Authentication Disabled - StockLot", html_content)

    def send_2fa_backup_code_used_alert(self, user_email: str, user_name: str, remaining_codes: int) -> bool:
        """Send backup code usage alert"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .alert-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .alert-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .alert-box h3 { color: #92400e; margin: 0 0 10px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Backup Code Used</h1>
                    <p>Security alert for your StockLot account</p>
                </div>
                <div class="content">
                    <div class="alert-icon">⚠️</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>A backup code was used to access your StockLot account. This typically happens when you don't have access to your authenticator app.</p>
                    
                    <div class="alert-box">
                        <h3>📊 Backup Code Status</h3>
                        <p><strong>Remaining backup codes:</strong> {{ remaining_codes }} out of 10</p>
                        {% if remaining_codes <= 3 %}
                        <p style="color: #dc2626;"><strong>⚠️ Low on backup codes!</strong> Consider generating new backup codes soon.</p>
                        {% endif %}
                    </div>
                    
                    <p><strong>Didn't use a backup code?</strong> If this wasn't you, please contact our security team immediately at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a>.</p>
                    
                    <p><strong>Security Tip:</strong> Generate new backup codes if you're running low, and store them securely.</p>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:security@stocklot.co.za">security@stocklot.co.za</a></p>
                    <p>Stay Secure! 🛡️<br>The StockLot Security Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name, remaining_codes=remaining_codes)
        return self.send_email(user_email, "🔐 Backup Code Used - StockLot Security Alert", html_content)

    # KYC Email Notifications
    def send_kyc_verification_started(self, user_email: str, user_name: str, 
                                    verification_level: str, verification_id: str) -> bool:
        """Send KYC verification started email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .verification-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .level-badge { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
                .steps { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔍 KYC Verification Started</h1>
                    <p>Identity verification process initiated</p>
                </div>
                <div class="content">
                    <div class="verification-icon">📋</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Your KYC (Know Your Customer) verification has been successfully started for your StockLot account.</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <span class="level-badge">{{ verification_level }} Verification</span>
                    </div>
                    
                    <div class="steps">
                        <h3>📝 Next Steps:</h3>
                        <ol>
                            <li><strong>Upload Documents:</strong> Provide required identity and address documents</li>
                            <li><strong>Review Process:</strong> Our team will verify your documents (2-5 business days)</li>
                            <li><strong>Approval:</strong> Get notified once your verification is complete</li>
                        </ol>
                    </div>
                    
                    <p><strong>Verification ID:</strong> {{ verification_id }}</p>
                    
                    <p>Complete your verification to unlock enhanced features and higher trading limits on StockLot.</p>
                </div>
                <div class="footer">
                    <p>Questions? Contact us at <a href="mailto:kyc@stocklot.co.za">kyc@stocklot.co.za</a></p>
                    <p>Verification Team 📋<br>StockLot</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name, 
            verification_level=verification_level, 
            verification_id=verification_id
        )
        return self.send_email(user_email, f"🔍 KYC {verification_level.title()} Verification Started", html_content)

    def send_kyc_submitted_confirmation(self, user_email: str, user_name: str, verification_id: str) -> bool:
        """Send KYC submission confirmation email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .timeline { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ KYC Submitted Successfully</h1>
                    <p>Your verification is now under review</p>
                </div>
                <div class="content">
                    <div class="success-icon">📤</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Thank you for submitting your KYC verification documents. We have received all your information and it is now under review by our compliance team.</p>
                    
                    <div class="timeline">
                        <h3>⏰ What happens next:</h3>
                        <ul>
                            <li><strong>Document Review:</strong> Our team will verify your submitted documents</li>
                            <li><strong>Identity Verification:</strong> We'll check the authenticity of your documents</li>
                            <li><strong>Compliance Check:</strong> Final approval by our compliance team</li>
                            <li><strong>Notification:</strong> You'll receive an email with the verification result</li>
                        </ul>
                        <p><strong>Estimated time:</strong> 2-5 business days</p>
                    </div>
                    
                    <p><strong>Reference ID:</strong> {{ verification_id }}</p>
                    
                    <p>We'll notify you as soon as the review is complete. You can continue using StockLot with your current access level in the meantime.</p>
                </div>
                <div class="footer">
                    <p>Questions? Contact us at <a href="mailto:kyc@stocklot.co.za">kyc@stocklot.co.za</a></p>
                    <p>Compliance Team 📋<br>StockLot</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(user_name=user_name, verification_id=verification_id)
        return self.send_email(user_email, "✅ KYC Documents Submitted - Under Review", html_content)

    def send_kyc_admin_notification(self, verification_id: str, user_email: str, 
                                  verification_level: str, risk_score: float, 
                                  risk_flags: List[str]) -> bool:
        """Send KYC admin notification email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
                .content { padding: 30px; }
                .alert-icon { font-size: 36px; text-align: center; margin-bottom: 15px; }
                .risk-score { text-align: center; margin: 20px 0; }
                .score { font-size: 36px; font-weight: bold; color: #3b82f6; }
                .risk-flags { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 15px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔍 New KYC Submission</h1>
                    <p>Requires admin review</p>
                </div>
                <div class="content">
                    <div class="alert-icon">📋</div>
                    
                    <p><strong>New KYC verification submitted for review:</strong></p>
                    
                    <ul>
                        <li><strong>Verification ID:</strong> {{ verification_id }}</li>
                        <li><strong>User Email:</strong> {{ user_email }}</li>
                        <li><strong>Verification Level:</strong> {{ verification_level }}</li>
                        <li><strong>Submission Date:</strong> {{ submission_date }}</li>
                    </ul>
                    
                    <div class="risk-score">
                        <div class="score">{{ risk_score }}%</div>
                        <div>Risk Score</div>
                    </div>
                    
                    {% if risk_flags %}
                    <div class="risk-flags">
                        <h4>⚠️ Risk Flags Detected:</h4>
                        <ul>
                        {% for flag in risk_flags %}
                            <li>{{ flag }}</li>
                        {% endfor %}
                        </ul>
                    </div>
                    {% endif %}
                    
                    <p>Please review this submission in the admin dashboard.</p>
                </div>
                <div class="footer">
                    <p>Admin Dashboard: <a href="/admin/kyc">Review Submissions</a></p>
                    <p>StockLot Compliance System</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        from datetime import datetime
        submission_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        
        html_content = template.render(
            verification_id=verification_id,
            user_email=user_email,
            verification_level=verification_level,
            risk_score=risk_score,
            risk_flags=risk_flags,
            submission_date=submission_date
        )
        
        # Send to admin team
        admin_email = "admin@stocklot.co.za"
        return self.send_email(admin_email, f"🔍 KYC Review Required - {verification_id}", html_content)

    def send_kyc_approved_notification(self, user_email: str, user_name: str, 
                                     verification_level: str, verification_id: str) -> bool:
        """Send KYC approval notification"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .benefits { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 KYC Verification Approved!</h1>
                    <p>Your identity has been successfully verified</p>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Congratulations! Your {{ verification_level }} KYC verification has been <strong>approved</strong>. You now have enhanced access to StockLot features.</p>
                    
                    <div class="benefits">
                        <h3>🚀 You can now enjoy:</h3>
                        <ul>
                            <li>Higher trading limits</li>
                            <li>Access to premium features</li>
                            <li>Enhanced seller privileges</li>
                            <li>Priority customer support</li>
                            <li>Verified badge on your profile</li>
                        </ul>
                    </div>
                    
                    <p><strong>Verification ID:</strong> {{ verification_id }}</p>
                    
                    <p>Thank you for completing the verification process and helping us maintain a secure marketplace!</p>
                </div>
                <div class="footer">
                    <p>Start trading: <a href="/marketplace">Browse Marketplace</a></p>
                    <p>Welcome to Verified StockLot! 🎉<br>The StockLot Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name,
            verification_level=verification_level,
            verification_id=verification_id
        )
        return self.send_email(user_email, f"🎉 KYC {verification_level.title()} Verification Approved!", html_content)

    def send_kyc_rejected_notification(self, user_email: str, user_name: str, 
                                     verification_level: str, verification_id: str, 
                                     rejection_reason: str) -> bool:
        """Send KYC rejection notification"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .reject-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .reason-box { background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .next-steps { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ KYC Verification Update</h1>
                    <p>Additional information required</p>
                </div>
                <div class="content">
                    <div class="reject-icon">📋</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Thank you for submitting your {{ verification_level }} KYC verification. After careful review, we need additional information to complete your verification.</p>
                    
                    <div class="reason-box">
                        <h3>📝 Required Action:</h3>
                        <p>{{ rejection_reason }}</p>
                    </div>
                    
                    <div class="next-steps">
                        <h3>🔄 Next Steps:</h3>
                        <ol>
                            <li>Address the requirements mentioned above</li>
                            <li>Upload corrected or additional documents</li>
                            <li>Resubmit your verification for review</li>
                        </ol>
                    </div>
                    
                    <p><strong>Verification ID:</strong> {{ verification_id }}</p>
                    
                    <p>If you have questions about the requirements, our support team is here to help.</p>
                </div>
                <div class="footer">
                    <p>Need help? Contact us at <a href="mailto:kyc@stocklot.co.za">kyc@stocklot.co.za</a></p>
                    <p>Support Team 📋<br>StockLot</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name,
            verification_level=verification_level,
            verification_id=verification_id,
            rejection_reason=rejection_reason
        )
        return self.send_email(user_email, f"📋 KYC {verification_level.title()} Verification - Action Required", html_content)

    # Price Alert Email Notifications
    def send_price_alert_notification(self, user_email: str, user_name: str, alert_title: str,
                                    trigger_message: str, current_price: float, 
                                    species: str = "", location: str = "") -> bool:
        """Send price alert notification email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .alert-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .price-highlight { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                .price-highlight .price { font-size: 36px; font-weight: bold; color: #92400e; }
                .price-highlight .change { font-size: 18px; color: #d97706; margin-top: 10px; }
                .details-box { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Price Alert Triggered!</h1>
                    <p>{{ alert_title }}</p>
                </div>
                <div class="content">
                    <div class="alert-icon">📈</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Great news! Your price alert has been triggered:</p>
                    
                    <div class="price-highlight">
                        <div class="price">R{{ "%.2f"|format(current_price) }}</div>
                        <div class="change">{{ trigger_message }}</div>
                    </div>
                    
                    <div class="details-box">
                        <h3>📊 Alert Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            {% if species %}
                            <li><strong>Species:</strong> {{ species }}</li>
                            {% endif %}
                            {% if location %}
                            <li><strong>Location:</strong> {{ location }}</li>
                            {% endif %}
                            <li><strong>Current Price:</strong> R{{ "%.2f"|format(current_price) }}</li>
                            <li><strong>Alert Time:</strong> {{ alert_time }}</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{{ marketplace_url }}" class="cta-button">🛒 View Marketplace</a>
                    </div>
                    
                    <p><strong>💡 Quick Actions:</strong></p>
                    <ul>
                        <li>Check current market listings</li>
                        <li>Contact sellers in your area</li>
                        <li>Set up additional price alerts</li>
                        <li>Add items to your wishlist</li>
                    </ul>
                    
                    <p><em>This alert will remain active and continue monitoring prices for you.</em></p>
                </div>
                <div class="footer">
                    <p>Manage your alerts: <a href="{{ alerts_url }}">Price Alert Dashboard</a></p>
                    <p>Happy Trading! 📈<br>The StockLot Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        from datetime import datetime
        alert_time = datetime.now().strftime("%B %d, %Y at %I:%M %p CAT")
        
        html_content = template.render(
            user_name=user_name,
            alert_title=alert_title,
            trigger_message=trigger_message,
            current_price=current_price,
            species=species,
            location=location,
            alert_time=alert_time,
            marketplace_url="https://stocklot.co.za/marketplace",
            alerts_url="https://stocklot.co.za/alerts"
        )
        return self.send_email(user_email, f"🚨 Price Alert: {alert_title}", html_content)

    def send_market_trend_notification(self, user_email: str, user_name: str, 
                                     trend_title: str, trend_data: Dict) -> bool:
        """Send market trend notification email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .trend-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .trend-data { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .trend-item { display: flex; justify-content: space-between; margin: 10px 0; }
                .trend-up { color: #059669; font-weight: bold; }
                .trend-down { color: #dc2626; font-weight: bold; }
                .insights-box { background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Market Trends Update</h1>
                    <p>{{ trend_title }}</p>
                </div>
                <div class="content">
                    <div class="trend-icon">📈</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Here are the latest market trends in your areas of interest:</p>
                    
                    <div class="trend-data">
                        <h3>🔍 Price Movements:</h3>
                        {% for item in trend_items %}
                        <div class="trend-item">
                            <span>{{ item.species }} ({{ item.location }})</span>
                            <span class="{% if item.change > 0 %}trend-up{% else %}trend-down{% endif %}">
                                {{ "+" if item.change > 0 else "" }}{{ item.change }}%
                            </span>
                        </div>
                        {% endfor %}
                    </div>
                    
                    {% if insights %}
                    <div class="insights-box">
                        <h3>💡 Market Insights:</h3>
                        <ul>
                        {% for insight in insights %}
                            <li>{{ insight }}</li>
                        {% endfor %}
                        </ul>
                    </div>
                    {% endif %}
                    
                    <p><strong>📅 Reporting Period:</strong> {{ reporting_period }}</p>
                    
                    <p>Stay ahead of the market with StockLot's real-time price tracking and alerts!</p>
                </div>
                <div class="footer">
                    <p>View detailed analytics: <a href="{{ analytics_url }}">Market Dashboard</a></p>
                    <p>Market Intelligence 📊<br>StockLot Analytics</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name,
            trend_title=trend_title,
            trend_items=trend_data.get("trend_items", []),
            insights=trend_data.get("insights", []),
            reporting_period=trend_data.get("reporting_period", "Last 7 days"),
            analytics_url="https://stocklot.co.za/analytics"
        )
        return self.send_email(user_email, f"📊 Market Trends: {trend_title}", html_content)

    def send_availability_notification(self, user_email: str, user_name: str,
                                     item_title: str, item_details: Dict) -> bool:
        """Send item availability notification email"""
        template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
                .content { padding: 40px 30px; }
                .availability-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                .item-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                .price-tag { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
                .cta-button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
                .footer a { color: #3b82f6; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Item Available!</h1>
                    <p>Your wishlisted item is now available</p>
                </div>
                <div class="content">
                    <div class="availability-icon">✨</div>
                    
                    <p>Hi <strong>{{ user_name }}</strong>,</p>
                    
                    <p>Great news! An item from your wishlist is now available:</p>
                    
                    <div class="item-card">
                        <h3>{{ item_title }}</h3>
                        <div style="margin: 15px 0;">
                            <span class="price-tag">R{{ "%.2f"|format(item_price) }} per {{ item_unit }}</span>
                        </div>
                        <ul style="list-style: none; padding: 0; margin: 10px 0;">
                            {% if location %}
                            <li><strong>📍 Location:</strong> {{ location }}</li>
                            {% endif %}
                            {% if quantity %}
                            <li><strong>📦 Quantity:</strong> {{ quantity }} {{ item_unit }}s available</li>
                            {% endif %}
                            {% if seller_name %}
                            <li><strong>👨‍🌾 Seller:</strong> {{ seller_name }}</li>
                            {% endif %}
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="{{ listing_url }}" class="cta-button">👀 View Listing</a>
                    </div>
                    
                    <p><strong>⚡ Act Fast!</strong> Popular items tend to sell quickly. Contact the seller soon to secure your purchase.</p>
                    
                    <p><em>This notification was sent because you have this item in your wishlist with availability alerts enabled.</em></p>
                </div>
                <div class="footer">
                    <p>Manage your wishlist: <a href="{{ wishlist_url }}">My Wishlist</a></p>
                    <p>Happy Shopping! 🛒<br>The StockLot Team</p>
                </div>
            </div>
        </body>
        </html>
        """)
        
        html_content = template.render(
            user_name=user_name,
            item_title=item_title,
            item_price=item_details.get("price", 0),
            item_unit=item_details.get("unit", "unit"),
            location=item_details.get("location", ""),
            quantity=item_details.get("quantity", ""),
            seller_name=item_details.get("seller_name", ""),
            listing_url=item_details.get("listing_url", "https://stocklot.co.za/marketplace"),
            wishlist_url="https://stocklot.co.za/wishlist"
        )
        return self.send_email(user_email, f"🔔 Available: {item_title}", html_content)

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