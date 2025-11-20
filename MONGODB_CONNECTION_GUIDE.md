# MongoDB Connection Guide for Dokploy

## Overview

This guide explains how to configure MongoDB connection for StockLot backend in Dokploy environment.

## Environment Variables

### Option 1: Use Internal Docker Network (Recommended for Dokploy)

If MongoDB is running in the same `dokploy-network`, use the Docker service name:

```bash
# MongoDB credentials
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name

# OR use alternative names (both supported)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=strong_mongo_password
DB_NAME=my_database_name

# Connection will be built automatically as:
# mongodb://admin:strong_mongo_password@mongodb:27017/my_database_name?authSource=admin
```

**Important**: Do NOT set `MONGO_URI` or `MONGO_URL` if using internal Docker network. The connection string will be built automatically using the service name `mongodb:27017`.

### Option 2: Use External MongoDB

If MongoDB is running externally (outside Docker), set `MONGO_URI`:

```bash
# Override with external MongoDB connection
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin

# Still set database name
MONGO_DBNAME=my_database_name
# OR
DB_NAME=my_database_name
```

## Environment Variable Priority

The backend supports multiple environment variable names for flexibility:

1. **Connection String**:
   - `MONGO_URI` (highest priority - if set, used directly)
   - `MONGO_URL` (fallback)
   - Auto-built from components (if neither is set)

2. **Database Name**:
   - `MONGO_DBNAME` (highest priority)
   - `DB_NAME` (fallback)
   - Default: `stocklot`

3. **MongoDB Credentials** (for auto-building connection):
   - `MONGO_INITDB_ROOT_USERNAME` or `MONGO_ROOT_USERNAME`
   - `MONGO_INITDB_ROOT_PASSWORD` or `MONGO_ROOT_PASSWORD`

## Recommended Configuration for Dokploy

### If MongoDB is in dokploy-network:

```bash
# MongoDB Service Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name

# Backend will connect to: mongodb:27017 (Docker service name)
# DO NOT set MONGO_URI - let it build automatically
```

### If MongoDB is External:

```bash
# External MongoDB Connection
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
MONGO_DBNAME=my_database_name
```

## Verification

### Check Backend Logs

On startup, the backend will log:
```
Connecting to MongoDB: mongodb://admin:***@mongodb:27017/my_database_name?authSource=admin
Database name: my_database_name
MongoDB client initialized successfully
✅ MongoDB connection verified on startup
✅ Database access verified - X collections found
```

### Test Health Endpoint

```bash
curl https://apilifestock.aamardokan.online/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "database": "connected"
}
```

### Test Enhanced Health Check

```bash
curl https://apilifestock.aamardokan.online/api/performance/health-check
```

## Troubleshooting

### Database Not Connecting

1. **Check if MongoDB service is running**:
   ```bash
   docker ps | grep mongodb
   ```

2. **Verify network connectivity**:
   - If using `mongodb:27017`, ensure both services are on `dokploy-network`
   - If using external IP, ensure firewall allows connection

3. **Check environment variables**:
   ```bash
   docker exec stocklot-backend env | grep MONGO
   ```

4. **Check backend logs**:
   ```bash
   docker logs stocklot-backend | grep -i mongo
   ```

### Common Issues

1. **Wrong Service Name**: 
   - ❌ Using `localhost:27017` in Docker
   - ✅ Use `mongodb:27017` (service name)

2. **Wrong Network**:
   - ❌ Services on different networks
   - ✅ All services on `dokploy-network`

3. **Authentication Failed**:
   - Check `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD`
   - Ensure `authSource=admin` in connection string

4. **Database Not Found**:
   - Check `MONGO_DBNAME` or `DB_NAME` matches actual database name
   - MongoDB creates database on first write

## Your Current Configuration

Based on your env file, you have:

```bash
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
MONGO_DBNAME=my_database_name
```

**This will work if MongoDB is running externally at that IP.**

**If MongoDB is in dokploy-network, change to:**

```bash
# Remove MONGO_URI - let it build automatically
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name
```

The backend will automatically connect to `mongodb:27017` within the Docker network.

