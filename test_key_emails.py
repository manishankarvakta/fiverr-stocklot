#!/usr/bin/env python3
"""
Test Key Email Triggers to stocklot65@gmail.com
Tests the most important email notifications that are already working in the system
"""

import asyncio
import sys
import os
from datetime import datetime, timezone

# Add backend path
sys.path.append('/app/backend')
sys.path.append('/app/backend/services')

async def test_key_email_triggers():
    """Test key email triggers that are already implemented in the system"""
    
    test_email = "stocklot65@gmail.com"
    print(f"🔔 TESTING KEY EMAIL TRIGGERS")
    print(f"📧 Sending test emails to: {test_email}")
    print(f"⏰ Started at: {datetime.now()}")
    print("=" * 80)
    
    try:
        # Import the existing email notification service that's already working
        from email_notification_service import EmailNotificationService
        email_service = EmailNotificationService(db=None)
        
        success_count = 0
        
        # Test 1: Welcome Email (E01) - this is used in registration
        print("📧 Testing E01: Welcome Email...")
        try:
            success = await email_service.send_welcome_email(
                user_email=test_email,
                first_name="StockLot Test",
                verify_url="https://stocklot.farm/verify-email?token=TEST123"
            )
            if success:
                print("✅ E01: Welcome email sent successfully")
                success_count += 1
            else:
                print("❌ E01: Failed to send welcome email")
        except Exception as e:
            print(f"❌ E01: Error - {str(e)}")
        
        # Test 2: Order Created Email (E27)
        print("\n📧 Testing E27: Order Created Email...")
        try:
            success = await email_service.send_order_created_email(
                buyer_email=test_email,
                buyer_name="StockLot Test User",
                order_code="ORD-TEST-12345",
                total=75000.00,
                checkout_url="https://stocklot.farm/checkout/TEST123"
            )
            if success:
                print("✅ E27: Order created email sent successfully")
                success_count += 1
            else:
                print("❌ E27: Failed to send order created email")
        except Exception as e:
            print(f"❌ E27: Error - {str(e)}")
        
        # Test 3: Escrow Held Email (E29)
        print("\n📧 Testing E29: Escrow Held Email...")
        try:
            success = await email_service.send_escrow_held_email(
                emails=[test_email],
                order_code="ORD-TEST-12345",
                amount=75000.00
            )
            if success:
                print("✅ E29: Escrow held email sent successfully")
                success_count += 1
            else:
                print("❌ E29: Failed to send escrow held email")
        except Exception as e:
            print(f"❌ E29: Error - {str(e)}")
        
        print("=" * 80)
        print(f"📊 SUMMARY:")
        print(f"   ✅ Successful: {success_count}")
        print(f"   📧 Total tested: 3")
        print(f"   🎯 Success Rate: {(success_count/3*100):.1f}%")
        print(f"⏰ Completed at: {datetime.now()}")
        
        if success_count > 0:
            print(f"\n📩 Check stocklot65@gmail.com for {success_count} test emails!")
            print(f"🏷️  Look for emails from StockLot notifications")
        else:
            print(f"\n❌ No emails sent. Check Mailgun configuration.")
            print(f"💡 Tip: Verify MAILGUN_API_KEY and MAILGUN_DOMAIN are set")
        
        return success_count > 0
        
    except ImportError as e:
        print(f"❌ Cannot import email service: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_key_email_triggers())
    print(f"\n🎉 Email testing {'completed successfully' if result else 'failed'}!")
    exit(0 if result else 1)