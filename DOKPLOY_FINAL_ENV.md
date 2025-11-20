# Final Environment Variables for Dokploy

## Option 1: Using Internal MongoDB (Recommended for Dokploy Network)

When MongoDB is running in the same `dokploy-network`, use the Docker service name.

### Backend Service Environment Variables

```bash
# MongoDB - Internal connection via dokploy-network (Docker service name)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name

# MinIO Credentials
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key

# Application Security
JWT_SECRET_KEY=your-very-secure-secret-key-change-in-production
ENVIRONMENT=production
DEBUG=false

# CORS Configuration
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online
```

**Connection will be automatically built as:**
```
mongodb://admin:strong_mongo_password@mongodb:27017/my_database_name?authSource=admin
```

### MongoDB Service Environment Variables

```bash
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name
```

### Frontend Service Environment Variables

```bash
REACT_APP_BACKEND_URL=https://apilifestock.aamardokan.online
```

### MinIO Service Environment Variables

```bash
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key
```

---

## Option 2: Using External MongoDB

If MongoDB is running outside Dokploy (external server), set `MONGO_URI` to override.

### Backend Service Environment Variables

```bash
# MongoDB - External connection (overrides internal)
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
MONGO_DBNAME=my_database_name

# MinIO Credentials
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key

# Application Security
JWT_SECRET_KEY=your-very-secure-secret-key-change-in-production
ENVIRONMENT=production
DEBUG=false

# CORS Configuration
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online
```

**Note:** When `MONGO_URI` is set, it will be used instead of the internal MongoDB service.

---

## Quick Setup Checklist

### For Internal MongoDB (Recommended):
- [ ] Set MongoDB service environment variables
- [ ] Set Backend service environment variables (without MONGO_URI)
- [ ] Set Frontend service environment variables
- [ ] Set MinIO service environment variables
- [ ] Replace all placeholder values with actual credentials

### For External MongoDB:
- [ ] Set Backend service environment variables (with MONGO_URI)
- [ ] Set Frontend service environment variables
- [ ] Set MinIO service environment variables
- [ ] Verify external MongoDB is accessible from Dokploy server
- [ ] Replace all placeholder values with actual credentials

---

## How It Works

1. **If `MONGO_URI` is NOT set:**
   - Backend connects to internal MongoDB service using: `mongodb:27017`
   - Uses Docker service name resolution within `dokploy-network`
   - Connection string built from: `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_DBNAME`

2. **If `MONGO_URI` IS set:**
   - Backend uses the provided connection string
   - Connects to external MongoDB server
   - Internal MongoDB service is still created but not used by backend

---

## Connection String Format

### Internal (Dokploy Network):
```
mongodb://admin:password@mongodb:27017/database_name?authSource=admin
```
- Uses service name: `mongodb` (resolves within dokploy-network)
- Port: `27017` (internal Docker port)

### External:
```
mongodb://admin:password@103.239.43.246:27025/database_name?authSource=admin
```
- Uses IP address: `103.239.43.246`
- Port: `27025` (external port)

---

## Verification

After deployment, check backend logs:

```bash
docker logs stocklot-backend | grep -i mongo
```

Should show:
```
Connecting to MongoDB: mongodb://admin:***@mongodb:27017/my_database_name?authSource=admin
```

Or for external:
```
Connecting to MongoDB: mongodb://admin:***@103.239.43.246:27025/my_database_name?authSource=admin
```

Test health endpoint:
```bash
curl https://apilifestock.aamardokan.online/api/health
```

---

## Important Notes

1. **Dokploy Network**: All services must be on `dokploy-network` (external: true)
2. **Service Names**: Use Docker service names for internal connections (`mongodb:27017`, `minio:9000`)
3. **MONGO_URI Priority**: If set, it overrides internal MongoDB connection
4. **Credentials**: Must match between MongoDB service and backend connection string
5. **Database Name**: Must match `MONGO_DBNAME` in both MongoDB service and backend
