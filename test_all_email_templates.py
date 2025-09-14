#!/usr/bin/env python3
"""
Comprehensive Email Templates Test Suite
Sends test emails for all 65 configured triggers to stocklot65@gmail.com
"""

import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta

# Add backend path
sys.path.append('/app/backend')
sys.path.append('/app/backend/services')

from email_notification_service import EmailNotificationService, EmailNotification, EmailCategory, EmailPriority

async def send_all_test_emails():
    """Send test emails for all 65 email templates to stocklot65@gmail.com"""
    
    test_email = "stocklot65@gmail.com"
    print(f"🔔 COMPREHENSIVE EMAIL TEMPLATES TEST")
    print(f"📧 Sending all 65 email templates to: {test_email}")
    print(f"⏰ Started at: {datetime.now()}")
    print("=" * 80)
    
    # Initialize email service
    email_service = EmailNotificationService(db=None)
    
    # Test data for template variables
    test_data = {
        "first_name": "Test User",
        "seller_name": "StockLot Seller",
        "buyer_name": "StockLot Buyer",
        "listing_title": "Premium Angus Cattle - 10 Head",
        "org_name": "StockLot Farm Co-op",
        "order_code": "ORD-TEST-12345",
        "request_code": "REQ-TEST-67890",
        "offer_code": "OFF-TEST-11111",
        "rfq_code": "RFQ-TEST-22222",
        "lot_title": "Auction: 15 Brahman Bulls",
        "consignment_code": "CON-TEST-33333",
        "payout_ref": "PAY-TEST-44444",
        "transfer_ref": "TRF-TEST-55555",
        "invoice_pdf_url": "https://stocklot.farm/invoices/test.pdf",
        "verify_url": "https://stocklot.farm/verify-email?token=TEST",
        "reset_url": "https://stocklot.farm/reset-password?token=TEST", 
        "checkout_url": "https://stocklot.farm/checkout/TEST",
        "listing_url": "https://stocklot.farm/listing/TEST",
        "request_url": "https://stocklot.farm/buy-requests/TEST",
        "offer_url": "https://stocklot.farm/offers/TEST",
        "orders_url": "https://stocklot.farm/orders/TEST",
        "auction_url": "https://stocklot.farm/auctions/TEST",
        "review_url": "https://stocklot.farm/reviews/TEST",
        "thread_url": "https://stocklot.farm/messages/TEST",
        "profile_url": "https://stocklot.farm/profile/TEST",
        "total": 15000.00,
        "amount": 15000.00,
        "payout_amount": 14250.00,
        "net_payout": 14250.00,
        "current_bid": 8500.00,
        "final_bid": 12000.00,
        "offer_price": 13500.00,
        "old_price": 16000.00,
        "new_price": 15000.00,
        "gross": 25000.00,
        "fees": 1750.00,
        "net": 23250.00,
        "remaining": 3,
        "results_count": 5,
        "stars": 5,
        "distance": "12 km",
        "device": "Chrome on MacOS",
        "ip": "192.168.1.1",
        "location": "Cape Town, ZA", 
        "when": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "otp": "123456",
        "action": "enabled",
        "kyc_level": "Individual",
        "issues": "ID document unclear",
        "inviter_name": "Farm Manager",
        "member_name": "Test Member",
        "old_role": "VIEWER",
        "new_role": "MANAGER",
        "reason": "Quality standards not met",
        "cert_type": "Veterinary Health Certificate", 
        "expiry_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "pause_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
        "carrier": "StockLot Express",
        "tracking_code": "TRK123456789",
        "track_url": "https://track.stocklot.farm/TRK123456789",
        "eta": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d 14:00"),
        "bank_name": "Standard Bank",
        "account_last4": "1234",
        "period": "February 2025",
        "pickup": "Cape Town, WC",
        "dropoff": "Johannesburg, GP",
        "deadlines": "2025-02-15",
        "carrier_name": "Express Logistics",
        "bid_amount": 3500.00,
        "doc_list": "Transport permit, Health certificate",
        "start_time": (datetime.now() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M"),
        "highest_bid": 9500.00,
        "expired_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "review_excerpt": "Excellent cattle, very professional...",
        "subject": "Order #12345 Discussion",
        "snippet": "Thank you for the quick delivery...",
        "service": "Payment Processor",
        "error": "Webhook timeout after 30s",
        "first_seen": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "search_name": "Premium Cattle Western Cape",
        "resubmit_url": "https://stocklot.farm/kyc/resubmit",
        "accept_url": "https://stocklot.farm/organizations/join/TOKEN",
        "edit_url": "https://stocklot.farm/listings/edit/TEST",
        "upload_url": "https://stocklot.farm/certificates/upload",
        "renew_url": "https://stocklot.farm/listings/renew/TEST",
        "reactivate_url": "https://stocklot.farm/listings/reactivate/TEST",
        "retry_url": "https://stocklot.farm/payment/retry/TEST",
        "tracking_setup_url": "https://stocklot.farm/orders/tracking/TEST",
        "confirm_url": "https://stocklot.farm/orders/confirm/TEST",
        "fix_url": "https://stocklot.farm/payouts/fix/TEST",
        "pdf_url": "https://stocklot.farm/statements/TEST.pdf",
        "rfq_url": "https://stocklot.farm/rfq/TEST",
        "bid_url": "https://stocklot.farm/auctions/bid/TEST",
        "relist_url": "https://stocklot.farm/auctions/relist/TEST",
        "results_url": "https://stocklot.farm/search/TEST",
        "consignment_url": "https://stocklot.farm/consignments/TEST",
        "pod_url": "https://stocklot.farm/pod/TEST",
        "appeal_url": "https://stocklot.farm/reviews/appeal/TEST",
        "runbook_url": "https://stocklot.farm/admin/runbooks/payment-webhook"
    }
    
    success_count = 0
    failed_count = 0
    
    # Send all 65 email templates
    for i in range(1, 66):
        template_id = f"E{i:02d}"
        
        try:
            # Get template from service
            if template_id not in email_service.templates:
                print(f"❌ {template_id}: Template not found")
                failed_count += 1
                continue
                
            template = email_service.templates[template_id]
            
            # Create notification with correct parameters
            notification = EmailNotification(
                template_id=template_id,
                recipient_email=test_email,
                recipient_name="StockLot Test User",
                variables=test_data,
                tags=[f"test-{template_id.lower()}"]
            )
            
            # Send email
            success = await email_service.send_email(notification)
            
            if success:
                print(f"✅ {template_id}: {template.subject}")
                success_count += 1
            else:
                print(f"❌ {template_id}: Failed to send - {template.subject}")
                failed_count += 1
                
            # Small delay to avoid overwhelming Mailgun
            await asyncio.sleep(0.5)
            
        except Exception as e:
            print(f"❌ {template_id}: Error - {str(e)}")
            failed_count += 1
    
    print("=" * 80)
    print(f"📊 SUMMARY:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ❌ Failed: {failed_count}")
    print(f"   📧 Total: {success_count + failed_count}")
    print(f"   🎯 Success Rate: {(success_count/(success_count+failed_count)*100):.1f}%")
    print(f"⏰ Completed at: {datetime.now()}")
    
    if success_count > 0:
        print(f"\n📩 Check stocklot65@gmail.com for {success_count} test emails!")
        print(f"🏷️  All emails are prefixed with [TEST] for easy identification")
    
    return success_count > 0

if __name__ == "__main__":
    result = asyncio.run(send_all_test_emails())
    exit(0 if result else 1)