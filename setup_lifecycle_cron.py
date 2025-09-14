#!/usr/bin/env python3
"""
🕒 LIFECYCLE EMAIL CRON SETUP
Sets up automated lifecycle email processing
"""

import os
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_cron_job():
    """Setup cron job for lifecycle emails"""
    
    # Cron job configuration
    cron_script = """#!/bin/bash
# Lifecycle Email Cron Job
# Runs every 10 minutes to process cart abandonment and other lifecycle emails

cd /app
/usr/bin/python3 -c "
import asyncio
import sys
sys.path.append('/app/backend')
from services.lifecycle_email_service import LifecycleEmailService
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def run_cron():
    try:
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db = client.stocklot
        
        service = LifecycleEmailService(db)
        await service.run_cron_job()
        
        client.close()
        print('✅ Lifecycle email cron completed successfully')
    except Exception as e:
        print(f'❌ Lifecycle email cron error: {e}')

asyncio.run(run_cron())
" >> /var/log/lifecycle_emails.log 2>&1
"""

    # Write cron script
    with open('/app/lifecycle_cron.sh', 'w') as f:
        f.write(cron_script)
    
    # Make executable
    os.chmod('/app/lifecycle_cron.sh', 0o755)
    
    # Add to crontab (runs every 10 minutes)
    cron_entry = "*/10 * * * * /app/lifecycle_cron.sh\n"
    
    try:
        # Get current crontab
        result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
        current_cron = result.stdout if result.returncode == 0 else ""
        
        # Check if entry already exists
        if 'lifecycle_cron.sh' not in current_cron:
            # Add new entry
            new_cron = current_cron + cron_entry
            
            # Write new crontab
            process = subprocess.Popen(['crontab', '-'], stdin=subprocess.PIPE, text=True)
            process.communicate(input=new_cron)
            
            if process.returncode == 0:
                logger.info("✅ Lifecycle email cron job added successfully")
                logger.info("   Runs every 10 minutes to process abandoned carts")
                return True
            else:
                logger.error("❌ Failed to add cron job")
                return False
        else:
            logger.info("✅ Lifecycle email cron job already exists")
            return True
            
    except Exception as e:
        logger.error(f"❌ Error setting up cron job: {e}")
        return False

def show_cron_info():
    """Show information about the lifecycle email system"""
    print("""
🎯 LIFECYCLE EMAIL SYSTEM READY!

📧 EMAIL CAMPAIGNS CONFIGURED:
   • Cart Abandonment: 1H, 24H, 72H sequences
   • Browse Abandonment: 4H after repeated views
   • Price Drop Alerts: When prices decrease ≥5%
   • Back in Stock: When items return to inventory
   • Buy Request Reminders: When forms are abandoned

⚙️ SYSTEM FEATURES:
   • POPIA/GDPR Compliant: Consent required
   • Frequency Caps: Max 3 emails/week, 1 per campaign/day
   • Unsubscribe Links: One-click unsubscribe
   • Session Tracking: Guest and authenticated users
   • Real-time Events: PDP views, cart updates, checkouts

🕒 CRON JOB:
   • Runs every 10 minutes
   • Processes all abandonment sequences
   • Logs to /var/log/lifecycle_emails.log
   • Manual trigger: POST /api/cron/lifecycle-emails

📊 MONITORING:
   • Check logs: tail -f /var/log/lifecycle_emails.log
   • Manual test: curl -X POST /api/cron/lifecycle-emails
   • Database collections: marketing_subscriptions, sessions, cart_snapshots

🚀 PRODUCTION READY!
   The system is now ready for real users and will automatically:
   1. Capture email consent from guests
   2. Track user behavior and cart abandonment
   3. Send targeted lifecycle emails
   4. Respect user preferences and privacy
    """)

if __name__ == "__main__":
    logger.info("🕒 Setting up Lifecycle Email Cron Job...")
    
    success = setup_cron_job()
    
    if success:
        show_cron_info()
    else:
        logger.error("❌ Failed to setup lifecycle email cron job")