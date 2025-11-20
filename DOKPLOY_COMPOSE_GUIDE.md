# Dokploy Docker Compose Guide

This guide explains how the StockLot application is configured for Dokploy based on [official Dokploy documentation](https://docs.dokploy.com/docs/core/docker-compose).

## Key Principles from Dokploy Docs

### 1. Network Configuration
- **Use `dokploy-network`**: All services must be on the `dokploy-network` (external: true)
- **Service Communication**: Services communicate using service names (e.g., `mongodb:27017`, `backend:8000`)
- **No Port Binding**: Use `expose` instead of `ports` to avoid conflicts with Dokploy's reverse proxy

### 2. Container Names
- **Don't Set `container_name`**: According to [Dokploy docs](https://docs.dokploy.com/docs/core/docker-compose/example), setting `container_name` causes issues with logs, metrics, and other features
- **Let Dokploy Manage**: Dokploy automatically manages container names

### 3. Domain Routing
- **Two Options**:
  1. **Native Domain Config** (v0.7.0+): Configure domains directly in Dokploy UI (recommended)
  2. **Traefik Labels**: Use Traefik labels in compose file (shown in example)

### 4. Port Exposure
- **Use `expose`**: Limits port access to container network only
- **Avoid `ports`**: Prevents conflicts with Dokploy's reverse proxy and host ports

## Our Configuration

### Services Overview

1. **mongodb**: MongoDB database service
2. **minio**: Object storage service
3. **minio-setup**: One-time bucket initialization
4. **backend**: FastAPI backend service
5. **frontend**: React frontend with Nginx

### Service Communication

All services communicate via `dokploy-network` using service names:

```
Backend → MongoDB: mongodb:27017
Backend → MinIO: minio:9000
Frontend → Backend: backend:8000 (via REACT_APP_BACKEND_URL)
```

### Network Flow

```
Internet → Dokploy Reverse Proxy (Traefik) → dokploy-network → Services
```

## Domain Configuration

### Option 1: Native Domain Config (Recommended)

In Dokploy UI (v0.7.0+):
1. Go to your Docker Compose service
2. Navigate to "Domains" section
3. Add domains:
   - Frontend: `lifestock.aamardokan.online` → `frontend:80`
   - Backend: `apilifestock.aamardokan.online` → `backend:8000`

### Option 2: Traefik Labels (Included in compose file)

The compose file includes Traefik labels as backup:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend-stocklot.rule=Host(`lifestock.aamardokan.online`)"
  - "traefik.http.routers.frontend-stocklot.entrypoints=websecure"
  - "traefik.http.routers.frontend-stocklot.tls.certResolver=letsencrypt"
  - "traefik.http.services.frontend-stocklot.loadbalancer.server.port=80"
```

**Note**: If using native domain config, Traefik labels are optional.

## Environment Variables

### Backend Service

```bash
# MongoDB (Internal via dokploy-network)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name

# OR External MongoDB
MONGO_URI=mongodb://admin:password@external-ip:port/dbname?authSource=admin

# MinIO
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key

# Application
JWT_SECRET_KEY=your-secret-key
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online
```

### Frontend Service

```bash
REACT_APP_BACKEND_URL=https://apilifestock.aamardokan.online
```

### MongoDB Service

```bash
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=strong_mongo_password
MONGO_DBNAME=my_database_name
```

### MinIO Service

```bash
MINIO_ROOT_USER=your_minio_access_key
MINIO_ROOT_PASSWORD=your_minio_secret_key
```

## Key Differences from Standard Docker Compose

### ✅ What We're Doing (Dokploy Best Practices)

1. **No `container_name`**: Let Dokploy manage container names
2. **Use `expose`**: Instead of `ports` to avoid conflicts
3. **External Network**: `dokploy-network` is external: true
4. **Service Names**: Use service names for internal communication
5. **Health Checks**: All services have health checks
6. **Dependencies**: Proper `depends_on` with health conditions

### ❌ What We're NOT Doing

1. **No `ports` mapping**: Would conflict with Dokploy's reverse proxy
2. **No `container_name`**: Causes issues with logs/metrics
3. **No host port binding**: Dokploy handles routing

## Deployment Steps

1. **Set Environment Variables** in Dokploy UI for each service
2. **Configure Domains** in Dokploy UI (or use Traefik labels)
3. **Deploy** the Docker Compose application
4. **Wait for Health Checks** to pass
5. **Verify** services are accessible via domains

## Troubleshooting

### Services Can't Communicate

- Verify all services are on `dokploy-network`
- Check service names match (case-sensitive)
- Ensure health checks are passing

### Port Conflicts

- Remove any `ports` mappings
- Use only `expose` for internal ports
- Let Dokploy handle external routing

### Domain Not Working

- Check DNS A records point to Dokploy server
- Verify Traefik labels or native domain config
- Wait 10 seconds for SSL certificate generation

## References

- [Dokploy Docker Compose Example](https://docs.dokploy.com/docs/core/docker-compose/example)
- [Dokploy Domains Configuration](https://docs.dokploy.com/docs/core/docker-compose/domains)
- [Dokploy Utilities](https://docs.dokploy.com/docs/core/docker-compose/utilities)

