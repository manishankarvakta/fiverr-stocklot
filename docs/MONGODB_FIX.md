# MongoDB Connection Fix

## Problem
Backend is trying to connect to external MongoDB (`103.239.43.246:27025`) and timing out.

## Solution
Use the internal MongoDB service that's already defined in docker-compose.yml.

## Configuration

### Option 1: Use Internal MongoDB (Recommended)

**Backend Service Environment Variables:**
```bash
# DO NOT set MONGO_URI - let it use internal MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name
```

**MongoDB Service Environment Variables:**
```bash
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name
```

The backend will automatically connect to: `mongodb://admin:strong_mongo_password@mongodb:27017/my_database_name?authSource=admin`

### Option 2: Use External MongoDB (If Needed)

If you must use external MongoDB, ensure:
1. External MongoDB is accessible from Dokploy server
2. Firewall allows connections from Dokploy server IP
3. MongoDB is listening on the correct interface (0.0.0.0, not 127.0.0.1)

**Backend Service Environment Variables:**
```bash
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
MONGO_DBNAME=my_database_name
```

## Troubleshooting External MongoDB Connection

### 1. Test Connectivity from Dokploy Server
```bash
# From Dokploy server (SSH into it)
telnet 103.239.43.246 27025
# OR
nc -zv 103.239.43.246 27025
```

### 2. Check MongoDB is Listening
On MongoDB server:
```bash
netstat -tlnp | grep 27025
# Should show MongoDB listening on 0.0.0.0:27025 or your server IP
```

### 3. Check Firewall Rules
On MongoDB server, allow Dokploy server IP:
```bash
# Example for UFW
sudo ufw allow from <dokploy-server-ip> to any port 27025
```

### 4. Test Connection from Backend Container
```bash
docker exec stocklot-backend python3 -c "
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    uri = os.environ.get('MONGO_URI') or os.environ.get('MONGO_URL')
    print(f'Testing: {uri}')
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
    try:
        result = await client.admin.command('ping')
        print('✅ Connected:', result)
    except Exception as e:
        print('❌ Failed:', e)
    finally:
        await client.close()

asyncio.run(test())
"
```

## Recommended: Use Internal MongoDB

Since you have MongoDB service in docker-compose.yml, use it:

1. **Remove MONGO_URI** from backend environment variables
2. **Set MongoDB credentials** in both MongoDB service and Backend service
3. **Use service name** `mongodb:27017` for connection

This ensures:
- ✅ No network/firewall issues
- ✅ Faster connection (internal network)
- ✅ Better security (not exposed externally)
- ✅ Automatic service discovery

## Current Configuration

The docker-compose.yml is configured to:
- Use internal MongoDB if `MONGO_URI` is NOT set
- Use external MongoDB if `MONGO_URI` IS set

**To use internal MongoDB:**
- Don't set `MONGO_URI` in Dokploy environment variables
- Set `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_DBNAME` instead

