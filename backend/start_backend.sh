#!/bin/bash
cd /Users/manishankarvakta/Desktop/FIVERR/client/stocklot/backend
source venv/bin/activate
export MONGO_URL="mongodb://localhost:27017/"
export DB_NAME="stocklot"
export MINIO_ENDPOINT="localhost:9000"
export MINIO_ACCESS_KEY="minioadmin"
export MINIO_SECRET_KEY="minioadmin"
export MINIO_BUCKET_NAME="stocklot-uploads"
export MINIO_USE_SSL="false"
export AWS_ENDPOINT_URL="http://localhost:9000"
export AWS_ACCESS_KEY_ID="minioadmin"
export AWS_SECRET_ACCESS_KEY="minioadmin"
export AWS_DEFAULT_REGION="us-east-1"
export ENVIRONMENT="development"
export DEBUG="true"
export JWT_SECRET_KEY="local-dev-secret-key-change-in-production"
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002"
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
