# Local Docker Compose Setup

This guide explains how to run StockLot locally using Docker Compose.

## Files

- **`docker-compose.yml`** - Local development configuration
- **`docker-compose.dokploy.yml`** - Dokploy production configuration (backup)

## Quick Start

### 1. Start Services

```bash
docker-compose up -d
```

### 2. Access Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **MongoDB**: localhost:27025
- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000

### 3. Stop Services

```bash
docker-compose down
```

## Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=adminpassword
DB_NAME=stocklot

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=stocklot-uploads

# Application
ENVIRONMENT=development
DEBUG=true
JWT_SECRET_KEY=local-dev-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Frontend
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Key Differences from Dokploy Version

### Local Development (`docker-compose.yml`)

1. **Port Mappings**: All services exposed to host
   - MongoDB: `27025:27017`
   - MinIO: `9000:9000`, `9001:9001`
   - Backend: `8000:8000`
   - Frontend: `3001:80`

2. **Network**: `stocklot-network` (bridge, not external)

3. **Container Names**: Set for easier local management

4. **Code Mounting**: Backend code mounted for hot reload
   ```yaml
   volumes:
     - ./backend:/app  # Hot reload enabled
   ```

5. **Development Settings**:
   - `ENVIRONMENT=development`
   - `DEBUG=true`
   - Default CORS origins include localhost

### Dokploy Production (`docker-compose.dokploy.yml`)

1. **No Port Mappings**: Services use `expose` only
2. **External Network**: `dokploy-network` (external: true)
3. **No Container Names**: Let Dokploy manage
4. **No Code Mounting**: Production build only
5. **Production Settings**: `ENVIRONMENT=production`, `DEBUG=false`

## Switching Between Configurations

### Use Local Development

```bash
# Ensure docker-compose.yml is for local
cp docker-compose.yml docker-compose.local.yml  # Backup if needed
# docker-compose.yml is already configured for local
docker-compose up -d
```

### Use Dokploy Configuration

```bash
# Copy dokploy config to main file
cp docker-compose.dokploy.yml docker-compose.yml
# Then deploy to Dokploy
```

## Development Workflow

### 1. Start Services

```bash
docker-compose up -d
```

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 3. Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all
docker-compose build
docker-compose up -d
```

### 4. Access Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### 5. Database Access

```bash
# Connect to MongoDB
docker exec -it stocklot-mongodb mongosh -u admin -p adminpassword

# Or from host
mongosh mongodb://admin:adminpassword@localhost:27025/stocklot?authSource=admin
```

## Troubleshooting

### Port Already in Use

If ports are already in use, change them in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Change backend port
  - "3002:80"    # Change frontend port
```

### Reset Everything

```bash
# Stop and remove containers, volumes, networks
docker-compose down -v

# Remove all volumes (WARNING: deletes data)
docker volume rm stocklot_mongodb_data stocklot_minio_data stocklot_backend_uploads
```

### Check Service Status

```bash
docker-compose ps
```

### View Service Health

```bash
# Backend health
curl http://localhost:8000/api/health

# Frontend
curl http://localhost:3001
```

## Hot Reload

Backend code is mounted for hot reload:

```yaml
volumes:
  - ./backend:/app
```

Changes to Python files will be reflected after restart or if using `--reload` flag.

## MinIO Access

- **Console**: http://localhost:9001
- **Credentials**: minioadmin / minioadmin
- **API Endpoint**: http://localhost:9000

## MongoDB Access

- **Connection String**: `mongodb://admin:adminpassword@localhost:27025/stocklot?authSource=admin`
- **From Host**: Use port `27025`
- **From Containers**: Use service name `mongodb:27017`

## Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec backend bash
docker-compose exec mongodb mongosh

# Check service status
docker-compose ps

# Remove everything (including volumes)
docker-compose down -v
```

