#!/bin/bash
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
