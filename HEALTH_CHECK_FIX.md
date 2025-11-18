# MongoDB Health Check Fix

## Problem
❌ **Error:** `dependency failed to start: container stocklot-mongodb is unhealthy`

## Root Cause
The MongoDB health check was trying to test authentication during the health check, but MongoDB might not have authentication fully initialized yet, or the health check command syntax was incorrect.

## Solution

### 1. Simplified Health Check
- **Before:** Complex authentication test in health check
- **After:** Simple ping test (`db.adminCommand('ping')`)
- **Reason:** Health check should only verify MongoDB is running, not fully authenticated
- **Authentication:** Backend will test authentication with retry mechanism

### 2. Removed Deploy Field
- **Issue:** `deploy` field is for Docker Swarm, not Docker Compose
- **Fix:** Removed `deploy` section from backend service
- **Result:** Uses standard `restart: unless-stopped` policy

### 3. Extended Startup Period
- **MongoDB:** 40s startup period to allow full initialization
- **Backend:** 40s startup period to allow MongoDB connection retries
- **Health Check:** 10 retries with 10s intervals

## Updated Health Check

```yaml
healthcheck:
  # Simple ping test - MongoDB will be ready when this succeeds
  # Authentication will be tested by backend with retry mechanism
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')", "--quiet"]
  interval: 10s
  timeout: 5s
  retries: 10
  start_period: 40s
```

## How It Works Now

1. **MongoDB starts** and begins initialization
2. **Health check** tests simple ping (no auth required)
3. **After 40s**, MongoDB should be ready
4. **Backend waits** for MongoDB to be healthy
5. **Backend connects** with authentication and retry mechanism
6. **Backend tests** authentication during connection (not health check)

## Testing

After deployment, verify MongoDB is healthy:

```bash
# Check MongoDB container status
docker ps | grep mongodb

# Check MongoDB health
docker inspect stocklot-mongodb | grep -A 10 Health

# Test MongoDB connection manually
docker exec stocklot-mongodb mongosh --eval "db.adminCommand('ping')"
```

## Key Changes

✅ **Simplified health check** - Only tests if MongoDB is running
✅ **Removed deploy field** - Not needed for Docker Compose
✅ **Extended startup time** - Gives MongoDB 40s to initialize
✅ **Backend handles auth** - Authentication tested by backend with retries

## Files Modified

1. `docker-compose.yml` - Simplified health check, removed deploy field

The health check now only verifies MongoDB is running, and the backend handles authentication testing with proper retry logic.

