# Dokploy Deployment Guide

This guide explains how to deploy StockLot to Dokploy and fix Bad Gateway errors.

## Quick Fix for Build Errors

If you see these errors:
- `the attribute 'version' is obsolete` - ✅ Fixed (removed version field)
- `docker.env not found` - ✅ Fixed (removed env_file, using environment variables directly)
- `tail error: Too many open files` - ✅ Fixed (improved healthcheck commands)

## Common Issues

### Bad Gateway (502) Errors

Bad Gateway errors typically occur when:
1. Services can't communicate with each other
2. CORS is blocking requests
3. Environment variables are not set correctly
4. Services are binding to wrong interfaces

## Configuration for Dokploy

### 1. Environment Variables

Set these environment variables in Dokploy:

#### Backend Service
```bash
# CORS - Add your Dokploy domain(s)
ALLOWED_ORIGINS=https://your-dokploy-domain.com,https://www.your-dokploy-domain.com

# Or allow all origins (less secure, for testing)
ALLOWED_ORIGINS=*

# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
DB_NAME=stocklot

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your-secure-password
MINIO_BUCKET_NAME=stocklot-uploads

# Application
ENVIRONMENT=production
JWT_SECRET_KEY=your-very-secure-secret-key
```

#### Frontend Service
```bash
# Backend URL - Use your backend service name or external URL
# For internal Docker network:
REACT_APP_BACKEND_URL=http://backend:8000

# For external domain (if backend is exposed):
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### 2. Service Configuration

#### Backend Service
- **Port**: 8000
- **Health Check**: `/api/health`
- **Network**: Must be on same network as frontend

#### Frontend Service
- **Port**: 80 (mapped to 3000 externally)
- **Build Args**: Must include `REACT_APP_BACKEND_URL`
- **Network**: Must be on same network as backend

### 3. Docker Compose for Dokploy

Dokploy may require modifications to `docker-compose.yml`:

1. **Remove `version` field** (Dokploy doesn't need it)
2. **Ensure services are on same network**
3. **Set build args for frontend**

Example frontend service configuration:
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      - REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL:-http://backend:8000}
  environment:
    - REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL:-http://backend:8000}
```

### 4. Network Configuration

**IMPORTANT**: All services must use the `dokploy-network` which is created by Dokploy:
```yaml
networks:
  dokploy-network:
    external: true
```

This ensures:
- Services can communicate internally using service names (e.g., `mongodb:27017`)
- Database connections work properly within the Dokploy environment
- All CRUD operations function correctly

### 5. Troubleshooting

#### Check Service Connectivity
```bash
# From frontend container
docker exec -it stocklot-frontend sh
curl http://backend:8000/api/health
```

#### Check CORS Configuration
- Verify `ALLOWED_ORIGINS` includes your Dokploy domain
- Check browser console for CORS errors
- Backend logs will show CORS rejections

#### Check Environment Variables
```bash
# Backend
docker exec stocklot-backend env | grep ALLOWED_ORIGINS

# Frontend (check build)
docker exec stocklot-frontend env | grep REACT_APP
```

#### Common Fixes

1. **Bad Gateway on Frontend**
   - Verify `REACT_APP_BACKEND_URL` is set correctly
   - Check if backend service is accessible: `curl http://backend:8000/api/health`
   - Ensure services are on same network

2. **Bad Gateway on Backend**
   - Check if MongoDB is running: `docker ps | grep mongodb`
   - Verify `MONGO_URL` environment variable
   - Check backend logs: `docker logs stocklot-backend`

3. **CORS Errors**
   - Add your domain to `ALLOWED_ORIGINS`
   - Use `ALLOWED_ORIGINS=*` for testing (not production)
   - Restart backend after changing CORS settings

4. **Frontend Can't Reach Backend**
   - Use service name `backend:8000` for internal communication
   - Use external URL for browser requests
   - Check nginx proxy configuration in `frontend/nginx.conf`

### 6. Dokploy-Specific Settings

In Dokploy dashboard:

1. **Create Application**
   - Select "Docker Compose" deployment type
   - Upload `docker-compose.yml`
   - Set environment variables

2. **Backend Service**
   - Port: 8000
   - Health Check Path: `/api/health`
   - Environment: Add all backend variables

3. **Frontend Service**
   - Port: 80 (or 3000 if exposed)
   - Build Args: `REACT_APP_BACKEND_URL=http://backend:8000`
   - Environment: `REACT_APP_BACKEND_URL=http://backend:8000`

4. **Network**
   - Ensure all services use the same network
   - Dokploy may create a default network

### 7. Production Checklist

- [ ] Set secure `JWT_SECRET_KEY`
- [ ] Set secure MongoDB passwords
- [ ] Set secure MinIO credentials
- [ ] Configure `ALLOWED_ORIGINS` with your domain
- [ ] Set `REACT_APP_BACKEND_URL` correctly
- [ ] Enable HTTPS (Dokploy should handle this)
- [ ] Test health endpoints
- [ ] Test API connectivity from frontend
- [ ] Monitor logs for errors

## Quick Fix Commands

```bash
# Rebuild frontend with correct backend URL
docker-compose build --build-arg REACT_APP_BACKEND_URL=http://backend:8000 frontend

# Restart all services
docker-compose restart

# Check service health
curl http://localhost:8000/api/health
curl http://localhost:3000
```

## Support

If issues persist:
1. Check Dokploy logs
2. Check Docker container logs
3. Verify network connectivity between services
4. Test with `ALLOWED_ORIGINS=*` temporarily
5. Verify environment variables are set correctly

