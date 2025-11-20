# Simplified Environment Variables for Dokploy

Based on the working Docker Compose reference pattern, here are the simplified environment variables.

## Key Changes

Following the reference example pattern:
- **Simple MongoDB connection** - Direct service name usage: `mongodb:27017`
- **No complex fallbacks** - Direct environment variable usage
- **Service name communication** - All services use Docker service names

## Environment Variables

### Backend Service

```bash
# MongoDB - Internal connection (simple, like reference example)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name

# MinIO
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key

# Application
JWT_SECRET_KEY=your-secret-key
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online
```

**Connection will be built as:**
```
mongodb://admin:strong_mongo_password@mongodb:27017/my_database_name?authSource=admin
```

### MongoDB Service

```bash
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name
```

### Frontend Service

```bash
REACT_APP_BACKEND_URL=https://apilifestock.aamardokan.online
```

### MinIO Service

```bash
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key
```

## How It Works (Like Reference Example)

1. **MongoDB Service**: Runs with credentials, no port exposure needed
2. **Backend Service**: Connects using `mongodb:27017` (service name)
3. **Simple Connection**: `mongodb://admin:password@mongodb:27017/dbname?authSource=admin`
4. **No Complex Logic**: Direct service name usage, no external IP fallbacks

## Comparison with Reference Example

### Reference Example Pattern:
```yaml
mongodb:
  image: "mongo:7-jammy"
  # No ports, no expose - just runs

transactor:
  environment:
    - DB_URL=mongodb://mongodb:27017
    - MONGO_URL=mongodb://mongodb:27017
```

### Our Pattern (Now Matching):
```yaml
mongodb:
  image: mongo:7.0
  # No ports, no expose - just runs

backend:
  environment:
    - DB_URL=mongodb://admin:password@mongodb:27017/dbname?authSource=admin
    - MONGO_URL=mongodb://admin:password@mongodb:27017/dbname?authSource=admin
```

## Key Principles from Reference

1. ✅ **No port exposure for MongoDB** - Services connect via service name
2. ✅ **Simple connection strings** - Direct service name: `mongodb:27017`
3. ✅ **No container_name** - Let Docker manage names
4. ✅ **Service name communication** - All internal communication via service names
5. ✅ **Network isolation** - All on `dokploy-network`

## Verification

After deployment, backend logs should show:
```
Connecting to MongoDB: mongodb://admin:***@mongodb:27017/my_database_name?authSource=admin
MongoDB client initialized successfully
✅ MongoDB connection verified on startup
```

This matches the reference example pattern where services simply connect to `mongodb:27017` without any external IP or complex fallback logic.

