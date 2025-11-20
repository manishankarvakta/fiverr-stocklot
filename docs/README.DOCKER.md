# Docker Setup for StockLot

This document explains how to run the StockLot application using Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp docker.env.example docker.env
   ```
   
   Or use the Makefile:
   ```bash
   make setup
   ```

2. **Edit the `docker.env` file** with your configuration (especially change the default passwords and JWT secret key)

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Check service status:**
   ```bash
   docker-compose ps
   ```

5. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f mongodb
   docker-compose logs -f minio
   ```

## Services

The Docker Compose setup includes the following services:

### 1. MongoDB (Port 27018)
- Database for the application
- Default credentials: `admin` / `adminpassword` (change in `.env`)
- Data persisted in `mongodb_data` volume

### 2. MinIO (Ports 9000, 9001)
- Object storage for files and uploads
- Console accessible at: http://localhost:9001
- Default credentials: `minioadmin` / `minioadmin` (change in `.env`)
- Data persisted in `minio_data` volume
- Buckets automatically created:
  - `stocklot-uploads` - General uploads
  - `stocklot-profiles` - User profile images
  - `stocklot-kyc` - KYC documents
  - `stocklot-livestock` - Livestock images

### 3. Backend API (Port 8000)
- FastAPI application
- API accessible at: http://localhost:8000
- API docs at: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### 4. Frontend (Port 3001)
- React application served by Nginx
- Accessible at: http://localhost:3001

## Environment Variables

Key environment variables (configure in `docker.env`):

- `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD` - MongoDB credentials
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` - MinIO credentials
- `JWT_SECRET_KEY` - **IMPORTANT**: Change this to a strong random key in production
- `OPENAI_API_KEY` - For AI features (optional)
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` - For payment processing (optional)

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes data)
```bash
docker-compose down -v
```

### Rebuild services
```bash
docker-compose build --no-cache
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f [service-name]
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend bash

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p adminpassword

# MinIO client
docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
```

## Accessing Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001
- **MongoDB**: localhost:27018

## Troubleshooting

### Services won't start
1. Check if ports are already in use:
   ```bash
   lsof -i :3001
   lsof -i :8000
   lsof -i :27018
   lsof -i :9000
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs [service-name]
   ```

### Backend can't connect to MongoDB
- Ensure MongoDB service is healthy: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify connection string in backend environment variables

### Frontend can't connect to backend
- Check backend is running: `docker-compose ps backend`
- Verify backend health: `curl http://localhost:8000/api/health`
- Check CORS settings in backend if accessing from different origin

### MinIO buckets not created
- Check minio-setup container logs: `docker-compose logs minio-setup`
- Manually create buckets via MinIO console at http://localhost:9001

## Using Makefile (Optional)

For convenience, a Makefile is provided with common commands:

```bash
make setup      # Copy docker.env.example to docker.env
make build      # Build all Docker images
make up         # Start all services
make down       # Stop all services
make logs       # View logs from all services
make clean      # Stop and remove all containers and volumes
make rebuild    # Rebuild and restart all services
```

## MinIO Integration

MinIO is configured and running, but the backend currently uses local file storage (`/app/uploads`) and Cloudinary for media management. To use MinIO for file storage:

1. **Configure boto3 to use MinIO** (MinIO is S3-compatible):
   - Set `AWS_ENDPOINT_URL=http://minio:9000` in your backend environment
   - Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to match MinIO credentials
   - Update your backend code to use boto3 with MinIO endpoint

2. **Access MinIO Console**:
   - URL: http://localhost:9001
   - Default credentials: `minioadmin` / `minioadmin` (change in `docker.env`)

3. **Buckets are automatically created**:
   - `stocklot-uploads` - General uploads
   - `stocklot-profiles` - User profile images
   - `stocklot-kyc` - KYC documents
   - `stocklot-livestock` - Livestock images

## Production Considerations

1. **Change all default passwords** in `docker.env`
2. **Use strong JWT secret key**
3. **Enable SSL/TLS** for production (use reverse proxy like Traefik or Nginx)
4. **Set up proper backups** for MongoDB and MinIO volumes
5. **Configure resource limits** in docker-compose.yml
6. **Use Docker secrets** for sensitive data instead of environment variables
7. **Set up monitoring** and logging aggregation
8. **Configure proper CORS** origins in backend
9. **Migrate from local storage to MinIO** if you want centralized object storage

## Data Persistence

All data is persisted in Docker volumes:
- `mongodb_data` - MongoDB database files
- `minio_data` - MinIO object storage
- `backend_uploads` - Backend uploads directory

To backup:
```bash
docker run --rm -v stocklot_mongodb_data:/data -v $(pwd):/backup ubuntu tar czf /backup/mongodb_backup.tar.gz /data
docker run --rm -v stocklot_minio_data:/data -v $(pwd):/backup ubuntu tar czf /backup/minio_backup.tar.gz /data
```

