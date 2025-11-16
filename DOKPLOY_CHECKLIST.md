# Dokploy Deployment Checklist

## Pre-Deployment Configuration

### 1. Environment Variables (Set in Dokploy Dashboard)

#### Backend Service Environment Variables:
```bash
# Required
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=<secure-password>
DB_NAME=stocklot
JWT_SECRET_KEY=<very-secure-random-key>
ALLOWED_ORIGINS=https://your-dokploy-domain.com,https://www.your-dokploy-domain.com

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<secure-password>
MINIO_BUCKET_NAME=stocklot-uploads

# Application
ENVIRONMENT=production
DEBUG=false

# Frontend Backend URL (for build)
REACT_APP_BACKEND_URL=http://backend:8000

# Optional Services
OPENAI_API_KEY=<if-using-ai-features>
PAYSTACK_SECRET_KEY=<if-using-payments>
PAYSTACK_PUBLIC_KEY=<if-using-payments>
PAYSTACK_WEBHOOK_SECRET=<if-using-payments>
MAILGUN_API_KEY=<if-using-email>
MAILGUN_DOMAIN=<if-using-email>
MAPBOX_ACCESS_TOKEN=<if-using-maps>
```

#### Frontend Service Environment Variables:
```bash
# Required for build
REACT_APP_BACKEND_URL=http://backend:8000
```

### 2. Service Configuration in Dokploy

#### Backend Service:
- **Port**: 8000
- **Health Check Path**: `/api/health`
- **Health Check Interval**: 30s
- **Build Context**: `./backend`
- **Dockerfile**: `Dockerfile`

#### Frontend Service:
- **Port**: 80 (mapped to 3001 externally if needed)
- **Health Check**: HTTP check on port 80
- **Build Context**: `./frontend`
- **Dockerfile**: `Dockerfile`
- **Build Args**: `REACT_APP_BACKEND_URL=http://backend:8000`

#### MongoDB Service:
- **Port**: Internal only (no external port)
- **Health Check**: MongoDB ping
- **Volume**: Persistent storage

#### MinIO Service:
- **Port**: Internal only (no external port)
- **Health Check**: HTTP check on port 9000
- **Volume**: Persistent storage

### 3. Network Configuration

- All services must be on the same Docker network
- Services communicate using service names:
  - Backend → MongoDB: `mongodb:27017`
  - Backend → MinIO: `minio:9000`
  - Frontend → Backend: `backend:8000`

### 4. Volume Configuration

Persistent volumes are created automatically:
- `mongodb_data` - MongoDB database files
- `mongodb_config` - MongoDB configuration
- `minio_data` - MinIO object storage
- `backend_uploads` - Backend file uploads

### 5. Health Checks

All services have health checks configured:
- **MongoDB**: MongoDB ping command
- **MinIO**: HTTP health endpoint
- **Backend**: `/api/health` endpoint
- **Frontend**: HTTP check on port 80

### 6. Deployment Steps

1. **Upload docker-compose.yml** to Dokploy
2. **Set environment variables** in Dokploy dashboard
3. **Configure build args** for frontend (REACT_APP_BACKEND_URL)
4. **Deploy services** in order:
   - MongoDB (wait for healthy)
   - MinIO (wait for healthy)
   - Backend (depends on MongoDB and MinIO)
   - Frontend (depends on Backend)
5. **Verify health** of all services
6. **Test endpoints**:
   - Frontend: `https://your-domain.com`
   - Backend: `https://api.your-domain.com/api/health`

### 7. Post-Deployment Verification

- [ ] All services show as "healthy" in Dokploy
- [ ] Frontend loads at your domain
- [ ] Backend API responds at `/api/health`
- [ ] Frontend can communicate with backend
- [ ] MongoDB connection works (check backend logs)
- [ ] MinIO buckets are created (check minio-setup logs)
- [ ] CORS allows your domain (check browser console)
- [ ] No port conflicts with other services

### 8. Troubleshooting

#### Backend not starting:
- Check MongoDB is healthy
- Check MinIO is healthy
- Verify MONGO_URL environment variable
- Check backend logs for errors

#### Frontend shows Bad Gateway:
- Verify REACT_APP_BACKEND_URL is set correctly
- Check backend is healthy
- Verify network connectivity
- Check CORS configuration

#### CORS errors:
- Add your domain to ALLOWED_ORIGINS
- Restart backend after changing CORS
- Check browser console for specific error

#### Port conflicts:
- MongoDB and MinIO are internal-only (no conflicts)
- Backend uses port 8000
- Frontend uses port 80 (mapped externally)

### 9. Production Optimizations

- ✅ Backend uses workers (4 workers) in production
- ✅ Frontend is built with production optimizations
- ✅ No development flags in production
- ✅ Health checks configured
- ✅ Proper restart policies
- ✅ Persistent volumes for data

### 10. Security Checklist

- [ ] Changed default MongoDB password
- [ ] Changed default MinIO password
- [ ] Set secure JWT_SECRET_KEY
- [ ] Configured ALLOWED_ORIGINS (not "*")
- [ ] Enabled HTTPS in Dokploy
- [ ] Reviewed security headers in nginx.conf
- [ ] No sensitive data in docker-compose.yml

