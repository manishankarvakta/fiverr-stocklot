# Dokploy Deployment Setup Guide

## Environment Variables for Dokploy

Copy these environment variables to your Dokploy project settings:

```env
# MongoDB Configuration (for MongoDB container)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=stocklot

# MongoDB Connection String (for backend - uses 'mongodb' service name)
MONGO_URI=mongodb://admin:strong_mongo_password@mongodb:27017/stocklot?authSource=admin
MONGO_URL=${MONGO_URI}

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your_minio_secret_key
MINIO_BUCKET_NAME=stocklot-uploads

# Frontend Environment Variables
REACT_APP_BACKEND_URL=https://apilifestock.aamardokan.online
REACT_APP_MINIO_URL=https://lifestock.aamardokan.online/minio
REACT_APP_MINIO_ENDPOINT=minio:9000
REACT_APP_MINIO_USE_SSL=false

# Domains
FRONTEND_DOMAIN=https://lifestock.aamardokan.online
BACKEND_DOMAIN=https://apilifestock.aamardokan.online

# CORS Configuration
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online

# Application Configuration
ENVIRONMENT=production
DEBUG=false
JWT_SECRET_KEY=your-strong-jwt-secret-key-here

# Optional Services
OPENAI_API_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=
PAYSTACK_DEMO_MODE=true
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAPBOX_ACCESS_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Important Notes

### 1. MongoDB Service Name
- The MongoDB service in docker-compose is named `mongodb`
- Connection string uses `mongodb:27017` (Docker network service name)
- **DO NOT** use `mongo:27017` - that's a different service name

### 2. MongoDB Authentication
- MongoDB container uses `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD`
- Connection string must include `?authSource=admin` for authentication
- Format: `mongodb://username:password@mongodb:27017/database?authSource=admin`

### 3. MinIO Configuration
- MinIO service name is `minio` (matches docker-compose)
- Internal endpoint: `minio:9000`
- External URL: Set via `REACT_APP_MINIO_URL` for frontend

### 4. Network Isolation
- All services use `stocklot-network` Docker network
- Services communicate via service names (mongodb, minio, backend, frontend)
- No external port exposure needed for internal communication

## Troubleshooting

### MongoDB Authentication Error
If you see: `Authentication failed`

1. **Check service name**: Ensure connection string uses `mongodb:27017` not `mongo:27017`
2. **Check credentials**: Verify `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` match
3. **Check authSource**: Connection string must include `?authSource=admin`
4. **Check database name**: Ensure `MONGO_DBNAME` matches the database in connection string

### Connection String Format
✅ **Correct:**
```
MONGO_URI=mongodb://admin:strong_mongo_password@mongodb:27017/stocklot?authSource=admin
```

❌ **Wrong:**
```
MONGO_URI=mongodb://mongo:27017/mydatabase  # Missing auth, wrong service name
MONGO_URI=mongodb://admin:password@localhost:27017/stocklot  # Wrong host for Docker
```

## Docker Compose Services

The project includes these services:
1. **mongodb** - MongoDB database (internal only)
2. **minio** - MinIO object storage (internal only)
3. **minio-setup** - One-time MinIO bucket initialization
4. **backend** - FastAPI backend (exposed on port 8000)
5. **frontend** - React frontend (exposed on port 3001)

## Deployment Steps

1. **Set Environment Variables** in Dokploy project settings
2. **Deploy** using docker-compose
3. **Check Logs** for MongoDB connection:
   ```bash
   docker logs stocklot-backend | grep -i mongo
   ```
4. **Verify Health**:
   ```bash
   curl https://apilifestock.aamardokan.online/api/health
   ```

## Testing Connection

After deployment, test MongoDB connection:
```bash
# From backend container
docker exec stocklot-backend python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os

async def test():
    mongo_url = os.environ.get('MONGO_URI') or os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    await client.admin.command('ping')
    print('✅ MongoDB connection successful')
    client.close()

asyncio.run(test())
"
```

