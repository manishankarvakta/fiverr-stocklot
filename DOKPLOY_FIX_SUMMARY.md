# Dokploy MongoDB Authentication Fix

## Problem
❌ **Error:** `Authentication failed., full error: {'ok': 0.0, 'errmsg': 'Authentication failed.', 'code': 18, 'codeName': 'AuthenticationFailed'}`

## Root Causes Fixed

### 1. ✅ MongoDB Environment Variables
- **Before:** Only supported `MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD`
- **After:** Now supports both `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD` (Dokploy standard) AND legacy names

### 2. ✅ MongoDB Connection String
- **Before:** Only supported `MONGO_URL`
- **After:** Now supports both `MONGO_URI` and `MONGO_URL`
- **Fixed:** Backend code updated to check both variables

### 3. ✅ Service Name Issue
- **Your env has:** `MONGO_URI=mongodb://mongo:27017/mydatabase` ❌
- **Should be:** `MONGO_URI=mongodb://mongodb:27017/stocklot?authSource=admin` ✅
- **Reason:** Docker service name is `mongodb` (not `mongo`)

### 4. ✅ Database Name Variable
- **Before:** Only supported `DB_NAME`
- **After:** Now supports both `MONGO_DBNAME` and `DB_NAME`

## Correct Environment Variables for Dokploy

```env
# MongoDB Container Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=stocklot

# MongoDB Connection String (for backend)
# ⚠️ IMPORTANT: Use 'mongodb' as service name (matches docker-compose service name)
# ⚠️ IMPORTANT: Must include ?authSource=admin for authentication
MONGO_URI=mongodb://admin:strong_mongo_password@mongodb:27017/stocklot?authSource=admin

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_secret_key
MINIO_BUCKET_NAME=stocklot-uploads

# Frontend
REACT_APP_BACKEND_URL=https://apilifestock.aamardokan.online
REACT_APP_MINIO_URL=https://lifestock.aamardokan.online/minio
REACT_APP_MINIO_ENDPOINT=minio:9000
REACT_APP_MINIO_USE_SSL=false

# Domains
FRONTEND_DOMAIN=https://lifestock.aamardokan.online
BACKEND_DOMAIN=https://apilifestock.aamardokan.online

# CORS
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online

# App Config
ENVIRONMENT=production
DEBUG=false
JWT_SECRET_KEY=your-strong-jwt-secret-key-here
```

## Key Changes Made

### 1. `docker-compose.yml`
- ✅ Updated MongoDB environment variables to support `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD`
- ✅ Updated backend environment to support both `MONGO_URI` and `MONGO_URL`
- ✅ Added support for `MONGO_DBNAME` variable
- ✅ Updated CORS to use `CORS_ORIGINS` variable
- ✅ Commented out MongoDB port exposure (not needed in production)

### 2. `backend/server.py`
- ✅ Updated to check both `MONGO_URI` and `MONGO_URL` environment variables
- ✅ Updated to support both `DB_NAME` and `MONGO_DBNAME` variables
- ✅ Added proper error handling if neither variable is set

## Critical Fixes Required in Your Dokploy Env

### ❌ WRONG (Your Current):
```env
MONGO_URI=mongodb://mongo:27017/mydatabase
```

### ✅ CORRECT (Fixed):
```env
MONGO_URI=mongodb://admin:strong_mongo_password@mongodb:27017/stocklot?authSource=admin
```

**Why:**
1. Service name must be `mongodb` (not `mongo`) - matches docker-compose service name
2. Must include username and password
3. Must include `?authSource=admin` for authentication
4. Database name should be `stocklot` (or match `MONGO_DBNAME`)

## Testing After Deployment

1. **Check MongoDB Connection:**
```bash
docker exec stocklot-backend python3 -c "
import os
print('MONGO_URI:', os.environ.get('MONGO_URI', 'NOT SET'))
print('MONGO_URL:', os.environ.get('MONGO_URL', 'NOT SET'))
print('DB_NAME:', os.environ.get('DB_NAME', 'NOT SET'))
print('MONGO_DBNAME:', os.environ.get('MONGO_DBNAME', 'NOT SET'))
"
```

2. **Test MongoDB Connection:**
```bash
docker exec stocklot-backend python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os

async def test():
    mongo_url = os.environ.get('MONGO_URI') or os.environ.get('MONGO_URL')
    print(f'Connecting to: {mongo_url[:50]}...')
    client = AsyncIOMotorClient(mongo_url)
    await client.admin.command('ping')
    print('✅ MongoDB connection successful!')
    client.close()

asyncio.run(test())
"
```

3. **Check Backend Health:**
```bash
curl https://apilifestock.aamardokan.online/api/health
```

## Files Updated

1. ✅ `docker-compose.yml` - MongoDB and backend environment variables
2. ✅ `backend/server.py` - MongoDB connection code
3. ✅ `DOKPLOY_SETUP.md` - Complete setup guide
4. ✅ `DOKPLOY_ENV_TEMPLATE.txt` - Environment variable template

## Next Steps

1. **Update your Dokploy environment variables** with the corrected values above
2. **Redeploy** your application
3. **Check logs** for MongoDB connection success:
   ```bash
   docker logs stocklot-backend | grep -i mongo
   ```
4. **Verify** the health endpoint returns success

## Support

If you still see authentication errors:
1. Verify `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` match in both places
2. Ensure connection string uses `mongodb:27017` (not `mongo:27017`)
3. Ensure connection string includes `?authSource=admin`
4. Check that MongoDB container is healthy: `docker ps | grep mongodb`

