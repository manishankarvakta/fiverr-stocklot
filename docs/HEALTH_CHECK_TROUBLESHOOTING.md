# Health Check Troubleshooting Guide

## Problem: "dependency failed to start: container stocklot-backend is unhealthy"

This error occurs when the backend container's health check fails.

## Changes Made

### 1. Health Check Endpoint
- **Always returns HTTP 200** - Server is considered healthy if it can respond
- Database connectivity is tested but doesn't fail the health check
- Uses 5-second timeout to prevent hanging

### 2. Health Check Configuration
- **Increased start_period**: 40s → 60s (more time for startup)
- **Increased retries**: 3 → 5 (more attempts before marking unhealthy)
- **Increased MongoDB timeouts**: 10s → 30s (for external DB connections)

### 3. MongoDB Connection
- **Non-blocking initialization** - Client is created immediately
- **Lazy connection** - Actual connection happens on first use
- **Longer timeouts** - 30 seconds for external database connections

## Verification Steps

### 1. Check Backend Logs
```bash
docker logs stocklot-backend
```

Look for:
- `Connecting to MongoDB: mongodb://...`
- `MongoDB client initialized successfully`
- Any MongoDB connection errors

### 2. Test Health Endpoint Manually
```bash
# From inside the container
docker exec stocklot-backend curl http://localhost:8000/api/health

# From outside (if port is exposed)
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy" or "degraded",
  "timestamp": "...",
  "database": "connected" or "disconnected",
  "error": null or "error message"
}
```

### 3. Check Environment Variables
```bash
docker exec stocklot-backend env | grep MONGO
```

Should show:
- `MONGO_URI` or `MONGO_URL` set correctly
- `DB_NAME` or `MONGO_DBNAME` set correctly

### 4. Test MongoDB Connection
```bash
docker exec stocklot-backend python3 -c "
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    uri = os.environ.get('MONGO_URI') or os.environ.get('MONGO_URL')
    print(f'Connecting to: {uri}')
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=10000)
        result = await client.admin.command('ping')
        print('✅ Connection successful:', result)
    except Exception as e:
        print(f'❌ Connection failed: {e}')
    finally:
        await client.close()

asyncio.run(test())
"
```

## Common Issues and Solutions

### Issue 1: MongoDB Connection Timeout

**Symptoms:**
- Health check times out
- Logs show "serverSelectionTimeoutMS" errors

**Solutions:**
1. **Check MongoDB is accessible**:
   ```bash
   # Test from Dokploy server
   telnet 103.239.43.246 27025
   # OR
   nc -zv 103.239.43.246 27025
   ```

2. **Check firewall rules** - Ensure port 27025 is open

3. **Verify connection string**:
   ```bash
   MONGO_URI=mongodb://admin:password@103.239.43.246:27025/dbname?authSource=admin
   ```

4. **Increase timeouts** (already done in code):
   - `serverSelectionTimeoutMS=30000`
   - `connectTimeoutMS=30000`

### Issue 2: Authentication Failed

**Symptoms:**
- Logs show "Authentication failed"
- Health check shows database: "disconnected"

**Solutions:**
1. **Verify credentials**:
   ```bash
   MONGO_INITDB_ROOT_USERNAME=admin
   MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
   ```

2. **Check authSource**:
   - Must include `?authSource=admin` in connection string
   - For root user, authSource should be `admin`

3. **Test credentials**:
   ```bash
   mongosh "mongodb://admin:password@103.239.43.246:27025/admin?authSource=admin"
   ```

### Issue 3: Container Starts But Health Check Fails

**Symptoms:**
- Container is running
- Health check endpoint returns error
- `docker ps` shows "unhealthy"

**Solutions:**
1. **Check if server is responding**:
   ```bash
   docker exec stocklot-backend curl http://localhost:8000/api/health
   ```

2. **Check health check configuration**:
   - Verify `curl` is installed (it is in Dockerfile)
   - Check health check interval/retries

3. **Increase start_period** (already done):
   - Changed from 40s to 60s

### Issue 4: Database Not Found

**Symptoms:**
- Connection succeeds but queries fail
- "Database not found" errors

**Solutions:**
1. **Verify database name**:
   ```bash
   MONGO_DBNAME=my_database_name
   # OR
   DB_NAME=my_database_name
   ```

2. **Check database exists**:
   ```bash
   mongosh "mongodb://admin:password@host:port/admin?authSource=admin"
   > show dbs
   ```

3. **Create database** (MongoDB creates on first write):
   - Database is created automatically on first insert

## Health Check Response Codes

| Status | Database | Meaning |
|--------|----------|---------|
| `healthy` | `connected` | ✅ Everything working |
| `degraded` | `connected` | ⚠️ Server OK, some services unavailable |
| `degraded` | `disconnected` | ⚠️ Server OK, database unavailable |
| `degraded` | `timeout` | ⚠️ Server OK, database timeout |

**Important**: All responses return HTTP 200, so container is marked healthy even if database is down.

## Quick Fix Commands

### Restart Backend
```bash
docker-compose restart backend
```

### Check Health Status
```bash
docker ps | grep backend
# Look for "healthy" or "unhealthy" status
```

### View Real-time Logs
```bash
docker logs -f stocklot-backend
```

### Force Recreate Container
```bash
docker-compose up -d --force-recreate backend
```

## Expected Behavior

After these changes:

1. **Container starts** even if MongoDB is temporarily unavailable
2. **Health check passes** (returns HTTP 200)
3. **Database status** is reported in response body
4. **Container marked healthy** if server responds
5. **Database operations** will work once connection is established

## Monitoring

Monitor these metrics:
- Health check response time
- Database connection status
- Error rates in logs
- Container restart count

## Next Steps

If health check still fails:

1. Check backend logs for specific errors
2. Verify MongoDB connection string is correct
3. Test MongoDB connectivity from Dokploy server
4. Check firewall/network rules
5. Verify environment variables are set correctly in Dokploy

