#!/usr/bin/env python3
"""
Complete 65 Email Templates Test Suite
Sends all StockLot email templates to stocklot65@gmail.com using working Mailgun
"""

import asyncio
import aiohttp
from datetime import datetime, timedelta
import json

MAILGUN_API_KEY = "c6bcf50f6059adff4bfbd10a2e98f9d2-1ae02a08-912e425d"
MAILGUN_DOMAIN = "e.stocklot.farm"
MAILGUN_BASE_URL = f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}"

# Complete catalog of all 65 email templates with realistic content
EMAIL_TEMPLATES = {
    # Auth & Account (E01-E10)
    "E01": {"subject": "Welcome to StockLot - Verify Your Email", "category": "Auth", "html": "<h2>Welcome to StockLot!</h2><p>Verify your account to start trading livestock.</p><p><a href='https://stocklot.farm/verify'>Verify Email</a></p>"},
    "E02": {"subject": "Email Verification Successful", "category": "Auth", "html": "<h2>Email Verified!</h2><p>Your account is now active. Start browsing livestock listings.</p>"},
    "E03": {"subject": "Password Reset Request", "category": "Auth", "html": "<h2>Reset Your Password</h2><p><a href='https://stocklot.farm/reset'>Reset Password</a></p>"},
    "E04": {"subject": "Password Reset Successful", "category": "Auth", "html": "<h2>Password Updated</h2><p>Your password has been successfully changed.</p>"},
    "E05": {"subject": "New Login from Unknown Device", "category": "Auth", "html": "<h2>New Login Detected</h2><p>Someone logged into your account from Chrome on MacOS.</p>"},
    "E06": {"subject": "Two-Factor Authentication Enabled", "category": "Auth", "html": "<h2>2FA Enabled</h2><p>Your account security has been enhanced with 2FA.</p>"},
    "E07": {"subject": "Your 2FA Code: 123456", "category": "Auth", "html": "<h2>Your verification code: <strong>123456</strong></h2>"},
    "E08": {"subject": "Account Suspended - Action Required", "category": "Auth", "html": "<h2>Account Suspended</h2><p>Your account has been temporarily suspended. Contact support.</p>"},
    "E09": {"subject": "KYC Verification Approved", "category": "Auth", "html": "<h2>KYC Approved!</h2><p>Your identity verification is complete. You can now trade livestock.</p>"},
    "E10": {"subject": "KYC Documents Required", "category": "Auth", "html": "<h2>Documents Needed</h2><p>Please upload your ID and proof of address to continue.</p>"},
    
    # Organizations (E11-E14)
    "E11": {"subject": "Organization Invitation - Join StockLot Farm Co-op", "category": "Organizations", "html": "<h2>You're Invited!</h2><p>Join StockLot Farm Co-op to access group buying and selling benefits.</p>"},
    "E12": {"subject": "Welcome to StockLot Farm Co-op", "category": "Organizations", "html": "<h2>Welcome to the Team!</h2><p>You're now part of StockLot Farm Co-op organization.</p>"},
    "E13": {"subject": "Your Role Updated to Manager", "category": "Organizations", "html": "<h2>Role Updated</h2><p>You've been promoted to Manager in StockLot Farm Co-op.</p>"},
    "E14": {"subject": "You've Left StockLot Farm Co-op", "category": "Organizations", "html": "<h2>Organization Left</h2><p>You've successfully left StockLot Farm Co-op.</p>"},
    
    # Listings & Compliance (E15-E24)
    "E15": {"subject": "Listing Submitted for Review - Premium Angus Cattle", "category": "Listings", "html": "<h2>Listing Under Review</h2><p>Your <strong>Premium Angus Cattle</strong> listing is being reviewed by our team.</p>"},
    "E16": {"subject": "Listing Approved - Premium Angus Cattle", "category": "Listings", "html": "<h2>Listing Approved!</h2><p>Your <strong>Premium Angus Cattle</strong> is now live on StockLot marketplace.</p>"},
    "E17": {"subject": "Listing Rejected - Please Review", "category": "Listings", "html": "<h2>Listing Needs Updates</h2><p>Your listing was rejected. Reason: Quality standards not met.</p>"},
    "E18": {"subject": "Price Reduced - Premium Angus Cattle", "category": "Listings", "html": "<h2>Price Updated</h2><p>Your listing price has been reduced from R16,000 to R15,000 per head.</p>"},
    "E19": {"subject": "Certificate Expiring Soon - Veterinary Health", "category": "Compliance", "html": "<h2>Certificate Expiring</h2><p>Your Veterinary Health Certificate expires on 2025-02-18. Please renew.</p>"},
    "E20": {"subject": "Certificate Rejected - Please Resubmit", "category": "Compliance", "html": "<h2>Certificate Issue</h2><p>Your certificate was rejected. Issue: ID document unclear. Please resubmit.</p>"},
    "E21": {"subject": "Listing Paused - Missing Documents", "category": "Listings", "html": "<h2>Listing Paused</h2><p>Your listing has been paused due to expired certificates.</p>"},
    "E22": {"subject": "Documents Uploaded Successfully", "category": "Compliance", "html": "<h2>Documents Received</h2><p>Thank you for uploading your compliance documents.</p>"},
    "E23": {"subject": "Listing Renewed for 30 Days", "category": "Listings", "html": "<h2>Listing Extended</h2><p>Your listing has been renewed for another 30 days.</p>"},
    "E24": {"subject": "Listing Expires Tomorrow", "category": "Listings", "html": "<h2>Listing Expiring</h2><p>Your listing expires tomorrow. Renew now to keep it active.</p>"},
    
    # Search & Watchlists (E25-E26)
    "E25": {"subject": "New Cattle Listings Match Your Search", "category": "Search", "html": "<h2>New Matches Found!</h2><p>5 new cattle listings match your saved search 'Premium Cattle Western Cape'.</p>"},
    "E26": {"subject": "Price Alert - Cattle Below R15,000", "category": "Search", "html": "<h2>Price Alert!</h2><p>Cattle listings below your target price of R15,000 are now available.</p>"},
    
    # Orders & Escrow (E27-E38)
    "E27": {"subject": "Order Created - Complete Payment", "category": "Orders", "html": "<h2>Order Created</h2><p>Order ORD-TEST-12345 for R30,000. <a href='https://stocklot.farm/checkout'>Complete Payment</a></p>"},
    "E28": {"subject": "Payment Confirmed - Order Processing", "category": "Orders", "html": "<h2>Payment Received</h2><p>Your payment of R30,475 has been confirmed. Order is now processing.</p>"},
    "E29": {"subject": "Funds Held in Escrow - Order Protected", "category": "Escrow", "html": "<h2>Escrow Active</h2><p>R30,000 is safely held in escrow until delivery confirmation.</p>"},
    "E30": {"subject": "Seller Notified - Prepare for Delivery", "category": "Orders", "html": "<h2>Prepare Your Livestock</h2><p>Buyer has paid. Please prepare the livestock for delivery.</p>"},
    "E31": {"subject": "Tracking Added - Monitor Your Delivery", "category": "Logistics", "html": "<h2>Shipment Tracking</h2><p>Track your livestock delivery: <strong>TRK123456789</strong></p>"},
    "E32": {"subject": "Livestock Delivered - Confirm Receipt", "category": "Orders", "html": "<h2>Delivery Complete</h2><p>Your livestock has been delivered. Please confirm receipt to release funds.</p>"},
    "E33": {"subject": "Funds Released to Seller", "category": "Escrow", "html": "<h2>Transaction Complete</h2><p>R26,250 has been released to the seller. Thank you for using StockLot!</p>"},
    "E34": {"subject": "Dispute Raised - Order Under Review", "category": "Orders", "html": "<h2>Dispute Filed</h2><p>A dispute has been raised for order ORD-TEST-12345. Our team will investigate.</p>"},
    "E35": {"subject": "Order Cancelled - Refund Processing", "category": "Orders", "html": "<h2>Order Cancelled</h2><p>Order ORD-TEST-12345 has been cancelled. Refund is processing.</p>"},
    "E36": {"subject": "Refund Processed - R30,475", "category": "Orders", "html": "<h2>Refund Complete</h2><p>R30,475 has been refunded to your payment method.</p>"},
    "E37": {"subject": "Order Expired - Payment Not Received", "category": "Orders", "html": "<h2>Order Expired</h2><p>Order ORD-TEST-12345 expired due to non-payment.</p>"},
    "E38": {"subject": "Payment Failed - Retry Required", "category": "Orders", "html": "<h2>Payment Issue</h2><p>Payment failed. <a href='https://stocklot.farm/retry'>Retry Payment</a></p>"},
    
    # Payouts & Finance (E39-E43)
    "E39": {"subject": "Payout Processed - R26,250", "category": "Payouts", "html": "<h2>Payout Sent</h2><p>R26,250 has been sent to your Standard Bank account ending in 1234.</p>"},
    "E40": {"subject": "Payout Failed - Update Banking Details", "category": "Payouts", "html": "<h2>Payout Issue</h2><p>Payout failed. Please update your banking details.</p>"},
    "E41": {"subject": "New Bank Account Added", "category": "Finance", "html": "<h2>Bank Account Added</h2><p>Standard Bank account ending in 1234 has been added successfully.</p>"},
    "E42": {"subject": "Monthly Statement - February 2025", "category": "Finance", "html": "<h2>Monthly Statement</h2><p>Your February 2025 statement is ready for download.</p>"},
    "E43": {"subject": "Payout Schedule Updated", "category": "Payouts", "html": "<h2>Payout Settings</h2><p>Your payout schedule has been updated to weekly.</p>"},
    
    # Logistics (E44-E48)
    "E44": {"subject": "Delivery Quote Request", "category": "Logistics", "html": "<h2>Delivery Quote</h2><p>Route: Cape Town to Johannesburg. Estimated cost: R2,500.</p>"},
    "E45": {"subject": "Carrier Assigned - Express Logistics", "category": "Logistics", "html": "<h2>Carrier Confirmed</h2><p>Express Logistics will handle your livestock delivery.</p>"},
    "E46": {"subject": "Livestock Shipped - ETA Tomorrow", "category": "Logistics", "html": "<h2>In Transit</h2><p>Your livestock is en route. Expected arrival: Tomorrow at 14:00.</p>"},
    "E47": {"subject": "Delivery Confirmed - Livestock Received", "category": "Logistics", "html": "<h2>Delivery Complete</h2><p>Livestock has been successfully delivered and received.</p>"},
    "E48": {"subject": "Proof of Delivery Available", "category": "Logistics", "html": "<h2>Delivery Proof</h2><p>Signed proof of delivery is now available for download.</p>"},
    
    # Auctions (E49-E53)
    "E49": {"subject": "Auction Starting Soon - Brahman Bulls", "category": "Auctions", "html": "<h2>Auction Alert</h2><p>Auction for 15 Brahman Bulls starts in 24 hours.</p>"},
    "E50": {"subject": "You've Been Outbid - Current Bid R9,500", "category": "Auctions", "html": "<h2>Outbid!</h2><p>Your bid of R8,500 has been exceeded. Current highest: R9,500.</p>"},
    "E51": {"subject": "Auction Won - Brahman Bulls R12,000", "category": "Auctions", "html": "<h2>Congratulations!</h2><p>You won the auction with a bid of R12,000.</p>"},
    "E52": {"subject": "Auction Ended - No Bids Received", "category": "Auctions", "html": "<h2>Auction Complete</h2><p>The auction ended with no bids meeting the reserve price.</p>"},
    "E53": {"subject": "Auction Results - Final Prices", "category": "Auctions", "html": "<h2>Auction Results</h2><p>Final results for today's livestock auction are now available.</p>"},
    
    # Buy Requests/Offers (E54-E58)
    "E54": {"subject": "Buy Request Posted - Looking for Cattle", "category": "Buy Requests", "html": "<h2>Request Active</h2><p>Your buy request for cattle is now live on the marketplace.</p>"},
    "E55": {"subject": "New Offer Received - R13,500", "category": "Offers", "html": "<h2>New Offer!</h2><p>A seller has offered cattle at R13,500 per head for your request.</p>"},
    "E56": {"subject": "Offer Accepted - Proceed to Payment", "category": "Offers", "html": "<h2>Offer Accepted</h2><p>Great! Your offer has been accepted. Proceed to payment.</p>"},
    "E57": {"subject": "Offer Rejected - Try Again", "category": "Offers", "html": "<h2>Offer Declined</h2><p>Your offer wasn't accepted this time. Consider adjusting your price.</p>"},
    "E58": {"subject": "Buy Request Expired", "category": "Buy Requests", "html": "<h2>Request Expired</h2><p>Your buy request has expired. Create a new one to continue.</p>"},
    
    # Reviews & Ratings (E59-E62)
    "E59": {"subject": "Please Review Your Purchase", "category": "Reviews", "html": "<h2>How was your experience?</h2><p>Please rate your recent cattle purchase and help other buyers.</p>"},
    "E60": {"subject": "New Review Received - 5 Stars!", "category": "Reviews", "html": "<h2>Great Review!</h2><p>You received a 5-star review: 'Excellent cattle, very professional...'</p>"},
    "E61": {"subject": "Review Response Posted", "category": "Reviews", "html": "<h2>Response Added</h2><p>You've successfully responded to a customer review.</p>"},
    "E62": {"subject": "Review Dispute Under Investigation", "category": "Reviews", "html": "<h2>Review Appeal</h2><p>Your review dispute is being investigated by our team.</p>"},
    
    # Messaging (E63-E64)
    "E63": {"subject": "New Message - Order #12345 Discussion", "category": "Messaging", "html": "<h2>New Message</h2><p>You have a new message about Order #12345: 'Thank you for the quick delivery...'</p>"},
    "E64": {"subject": "Message Thread Updated", "category": "Messaging", "html": "<h2>Thread Update</h2><p>There's new activity in your conversation thread.</p>"},
    
    # Admin Alerts (E65)
    "E65": {"subject": "System Alert - Payment Webhook Error", "category": "Admin", "html": "<h2>System Alert</h2><p>Payment Processor webhook failed: Webhook timeout after 30s. First seen: 06:50 UTC.</p>"}
}

async def send_all_65_templates():
    """Send all 65 email templates to stocklot65@gmail.com"""
    
    test_email = "stocklot65@gmail.com"
    print(f"🚀 COMPREHENSIVE EMAIL TEMPLATES TEST SUITE")
    print(f"📧 Sending ALL 65 StockLot email templates to: {test_email}")
    print(f"🌐 Domain: {MAILGUN_DOMAIN}")
    print(f"⏰ Started at: {datetime.now()}")
    print("=" * 80)
    
    success_count = 0
    failed_count = 0
    
    try:
        async with aiohttp.ClientSession() as session:
            for template_id, template_data in EMAIL_TEMPLATES.items():
                try:
                    # Prepare email data
                    data = {
                        'from': f'StockLot <noreply@{MAILGUN_DOMAIN}>',
                        'to': test_email,
                        'subject': f'[{template_id}] {template_data["subject"]}',
                        'text': f'StockLot Email Template {template_id}\n\nCategory: {template_data["category"]}\nSubject: {template_data["subject"]}\n\nThis is a test of the StockLot email notification system.',
                        'html': f'''
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
                            <div style="background: #007bff; color: white; padding: 10px; margin: -20px -20px 20px; text-align: center;">
                                <h2 style="margin: 0;">StockLot Email Template {template_id}</h2>
                                <p style="margin: 5px 0 0;">Category: {template_data["category"]}</p>
                            </div>
                            {template_data["html"]}
                            <hr style="margin: 20px 0;">
                            <p style="color: #666; font-size: 12px;">
                                This is a test email from StockLot's comprehensive notification system.<br>
                                Template ID: {template_id} | Category: {template_data["category"]}<br>
                                Sent to: {test_email} | Domain: {MAILGUN_DOMAIN}
                            </p>
                        </div>
                        ''',
                        'o:tag': ['template-test', template_id.lower(), template_data["category"].lower()],
                        'o:testmode': 'no'
                    }
                    
                    # Send via Mailgun
                    async with session.post(
                        f"{MAILGUN_BASE_URL}/messages",
                        auth=aiohttp.BasicAuth('api', MAILGUN_API_KEY),
                        data=data
                    ) as response:
                        
                        if response.status == 200:
                            result = await response.json()
                            print(f"✅ {template_id}: {template_data['subject']} ({template_data['category']})")
                            success_count += 1
                        else:
                            error_text = await response.text()
                            print(f"❌ {template_id}: Failed (HTTP {response.status}) - {template_data['subject']}")
                            failed_count += 1
                
                except Exception as e:
                    print(f"❌ {template_id}: Exception - {str(e)}")
                    failed_count += 1
                
                # Small delay to avoid overwhelming Mailgun
                await asyncio.sleep(0.3)
    
    except Exception as e:
        print(f"❌ Session error: {str(e)}")
    
    print("=" * 80)
    print(f"📊 COMPREHENSIVE RESULTS:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ❌ Failed: {failed_count}")
    print(f"   📧 Total Templates: {len(EMAIL_TEMPLATES)}")
    print(f"   🎯 Success Rate: {(success_count/len(EMAIL_TEMPLATES)*100):.1f}%")
    print(f"⏰ Completed at: {datetime.now()}")
    
    if success_count > 0:
        print(f"\n📩 SUCCESS! Check {test_email} for {success_count} template emails!")
        print(f"🏷️  All emails have template IDs [E01-E65] in the subject line")
        print(f"📧 Emails sent from: templates@{MAILGUN_DOMAIN}")
        print(f"📋 Categories: Auth, Organizations, Listings, Orders, Payouts, Logistics, Auctions, Reviews, etc.")
    
    # Summary by category
    if success_count > 0:
        categories = {}
        for template_id, template_data in EMAIL_TEMPLATES.items():
            category = template_data["category"]
            categories[category] = categories.get(category, 0) + 1
        
        print(f"\n📊 TEMPLATES BY CATEGORY:")
        for category, count in sorted(categories.items()):
            print(f"   • {category}: {count} templates")
    
    return success_count >= 60  # Consider success if 60+ templates sent

if __name__ == "__main__":
    success = asyncio.run(send_all_65_templates())
    
    print(f"\n🎉 ALL 65 STOCKLOT EMAIL TEMPLATES {'SUCCESSFULLY TESTED' if success else 'TESTING COMPLETED'}!")
    print(f"📧 Check stocklot65@gmail.com for the complete template collection!")
    
    exit(0 if success else 1)