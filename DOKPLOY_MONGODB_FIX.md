# MongoDB Authentication Fix for Dokploy

## Problem
❌ **Error:** `Database initialization failed: Authentication failed.`

## Root Cause
1. **Timing Issue**: Backend tries to connect before MongoDB finishes initializing authentication
2. **Port Conflicts**: Other MongoDB instances might be using port 27017
3. **Network Isolation**: Services need proper network isolation

## Solutions Implemented

### 1. ✅ Removed External Port Exposure
- **Before:** MongoDB port 27017 was exposed externally
- **After:** MongoDB only accessible within Docker network
- **Benefit:** Prevents conflicts with other MongoDB instances

### 2. ✅ Enhanced Health Check
- **Before:** Simple ping test
- **After:** Authentication-aware health check
- **Benefit:** Ensures MongoDB auth is fully initialized before backend starts

### 3. ✅ Added Retry Mechanism
- Backend now retries MongoDB connection with exponential backoff
- Up to 10 retry attempts with increasing delays
- Better error messages for debugging

### 4. ✅ Improved Network Isolation
- Named network: `stocklot-network`
- Custom subnet: `172.28.0.0/16` to avoid IP conflicts
- All services isolated from other projects

### 5. ✅ Extended Startup Period
- MongoDB health check: 40s startup period (was 30s)
- Backend restart policy with delays
- Ensures MongoDB is fully ready

## Updated Configuration

### docker-compose.yml Changes

1. **MongoDB Service:**
   - Removed external port exposure
   - Enhanced health check with authentication
   - Extended startup period to 40s

2. **Backend Service:**
   - Added retry mechanism in code
   - Added restart policy with delays
   - Better connection timeout settings

3. **Network:**
   - Named network for isolation
   - Custom subnet to avoid conflicts

## Environment Variables (No Changes Needed)

Your existing environment variables are correct:
```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=stocklot
MONGO_URI=mongodb://admin:strong_mongo_password@mongodb:27017/stocklot?authSource=admin
```

## How It Works Now

1. **MongoDB starts** and initializes authentication (40s)
2. **Health check verifies** authentication is ready
3. **Backend waits** for MongoDB to be healthy
4. **Backend connects** with retry mechanism (up to 10 attempts)
5. **Database initializes** after successful connection

## Testing

After deployment, check logs:

```bash
# Check MongoDB is ready
docker logs stocklot-mongodb | grep -i "ready\|auth"

# Check backend connection
docker logs stocklot-backend | grep -i "mongo\|database"

# Test connection
docker exec stocklot-backend python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os

async def test():
    mongo_url = os.environ.get('MONGO_URI') or os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    await client.admin.command('ping')
    print('✅ MongoDB connection successful!')
    client.close()

asyncio.run(test())
"
```

## Troubleshooting

### Still Getting Authentication Errors?

1. **Check MongoDB logs:**
   ```bash
   docker logs stocklot-mongodb
   ```
   Look for authentication initialization messages

2. **Verify environment variables:**
   ```bash
   docker exec stocklot-backend env | grep MONGO
   ```
   Ensure all variables are set correctly

3. **Test connection manually:**
   ```bash
   docker exec stocklot-mongodb mongosh -u admin -p strong_mongo_password --authenticationDatabase admin --eval "db.adminCommand('ping')"
   ```

4. **Check network connectivity:**
   ```bash
   docker exec stocklot-backend ping -c 3 mongodb
   ```

### Port Conflicts

If you still have port conflicts:
1. Check for other MongoDB containers: `docker ps | grep mongo`
2. Ensure no other services use port 27017
3. The new config doesn't expose port 27017 externally, so conflicts should be resolved

## Key Improvements

✅ **No external port exposure** - MongoDB only accessible within network
✅ **Authentication-aware health check** - Ensures auth is ready
✅ **Retry mechanism** - Handles timing issues gracefully
✅ **Network isolation** - Custom subnet prevents conflicts
✅ **Extended startup time** - Gives MongoDB time to initialize

## Files Modified

1. `docker-compose.yml` - MongoDB and network configuration
2. `backend/server.py` - Added retry mechanism and connection waiting

These changes ensure MongoDB is fully ready before the backend tries to connect, preventing authentication errors.

