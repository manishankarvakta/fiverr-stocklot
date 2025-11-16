FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/profiles /app/uploads/farms /app/uploads/kyc /app/uploads/livestock /app/uploads/certificates /app/uploads/ai_analysis

# Expose port
EXPOSE 8000

# Run the application
# Use --reload only in development (set via environment variable)
# For production, use workers for better performance
CMD ["sh", "-c", "if [ \"$ENVIRONMENT\" = \"development\" ]; then uvicorn server:app --host 0.0.0.0 --port 8000 --reload; else uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4; fi"]

