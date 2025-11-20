# Dokploy Environment Variables Setup

## Minimal Required Environment Variables

Set these in your Dokploy dashboard for each service:

### Backend Service Environment Variables

```bash
# MongoDB - External Connection (REQUIRED)
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
MONGO_DBNAME=my_database_name

# MinIO Credentials (REQUIRED)
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key

# Application Security (REQUIRED)
JWT_SECRET_KEY=your-very-secure-secret-key-change-in-production
ENVIRONMENT=production
DEBUG=false

# CORS Configuration (REQUIRED)
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online
```

### Frontend Service Environment Variables

```bash
# Backend URL (REQUIRED for build)
REACT_APP_BACKEND_URL=https://apilifestock.aamardokan.online
```

### MinIO Service Environment Variables

```bash
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key
```

## Optional Environment Variables

These can be added if you're using the features:

```bash
# Payment Services
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
PAYSTACK_DEMO_MODE=true

# Email Services
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_mailgun_domain

# AI Services
OPENAI_API_KEY=your_openai_key

# Mapping Services
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Key Changes for Dokploy

1. **Removed Internal MongoDB Service**
   - Using external MongoDB at `103.239.43.246:27025`
   - Connection string set via `MONGO_URI`

2. **Simplified Environment Variables**
   - Removed redundant variable names
   - Using direct values from env vars
   - No complex fallback chains

3. **Network Configuration**
   - All services on `dokploy-network` (external)
   - Backend connects to external MongoDB directly
   - MinIO remains internal for object storage

4. **Health Checks**
   - Backend health check doesn't depend on MongoDB service
   - Increased start_period to 60s for external DB connections
   - Health check always returns 200 (database status is informational)

## Verification

After setting environment variables in Dokploy:

1. **Check Backend Logs**:
   ```bash
   docker logs stocklot-backend | grep -i mongo
   ```
   Should show: `Connecting to MongoDB: mongodb://admin:***@103.239.43.246:27025/...`

2. **Test Health Endpoint**:
   ```bash
   curl https://apilifestock.aamardokan.online/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "database": "connected"
   }
   ```

3. **Verify Database Connection**:
   ```bash
   docker exec stocklot-backend env | grep MONGO
   ```
   Should show your `MONGO_URI` and `MONGO_DBNAME`

## Troubleshooting

### Database Not Connecting

1. **Verify MONGO_URI is set correctly**:
   ```bash
   docker exec stocklot-backend env | grep MONGO_URI
   ```

2. **Test connection from container**:
   ```bash
   docker exec stocklot-backend python3 -c "
   import os
   from motor.motor_asyncio import AsyncIOMotorClient
   import asyncio
   
   async def test():
       uri = os.environ.get('MONGO_URI')
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

3. **Check firewall/network**:
   - Ensure port 27025 is accessible from Dokploy server
   - Verify MongoDB allows connections from Dokploy server IP

### Container Unhealthy

1. **Check health endpoint**:
   ```bash
   docker exec stocklot-backend curl http://localhost:8000/api/health
   ```

2. **Check logs**:
   ```bash
   docker logs stocklot-backend --tail 50
   ```

3. **Verify all required env vars are set**:
   - `MONGO_URI` (required)
   - `MONGO_DBNAME` (required)
   - `MINIO_ROOT_USER` (required)
   - `MINIO_ROOT_PASSWORD` (required)
   - `JWT_SECRET_KEY` (required)

