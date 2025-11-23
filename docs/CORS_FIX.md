# CORS Error Fix

## Problem

```
Access to fetch at 'https://apilifestock.aamardokan.online/api/auth/register' 
from origin 'http://localhost:3002' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

The backend needs to allow `http://localhost:3002` in CORS configuration.

### Option 1: Update Dokploy Environment Variable (Recommended)

In Dokploy Backend Service, set `ALLOWED_ORIGINS` to include your localhost:

```bash
ALLOWED_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online,http://localhost:3002
```

Or for development, allow all origins:

```bash
ALLOWED_ORIGINS=*
```

### Option 2: Code Already Updated

The code has been updated to include common localhost ports by default:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002` ✅ (now included)
- `http://localhost:3003`

## How CORS Works in This Application

### CORS Configuration Location

**File:** `backend/server.py` lines 323-343

```python
# CORS middleware - Allow origins from environment or default list
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
# Add default origins if not in environment
default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",  # Now included
    "http://localhost:3003",
    "https://stocklot.farm",
    "https://www.stocklot.farm"
]
# Combine and filter empty strings
cors_origins = [origin.strip() for origin in allowed_origins + default_origins if origin.strip()]

# If ALLOWED_ORIGINS is set to "*", allow all origins
if os.getenv("ALLOWED_ORIGINS") == "*":
    cors_origins = ["*"]
```

### CORS Middleware Setup

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)
```

## Environment Variable Priority

1. **If `ALLOWED_ORIGINS` is set to `"*"`**: Allows all origins
2. **If `ALLOWED_ORIGINS` is set to specific origins**: Uses those + defaults
3. **If `ALLOWED_ORIGINS` is not set**: Uses default origins only

## Quick Fix for Development

### In Dokploy Backend Service Environment Variables:

```bash
# Allow all origins (for development/testing)
ALLOWED_ORIGINS=*

# OR specify exact origins
ALLOWED_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online,http://localhost:3000,http://localhost:3001,http://localhost:3002
```

## Verification

After updating environment variables in Dokploy:

1. **Restart backend service** in Dokploy
2. **Check backend logs** for CORS configuration:
   ```
   CORS allowed origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', ...]
   ```
3. **Test from browser console**:
   ```javascript
   fetch('https://apilifestock.aamardokan.online/api/health')
     .then(r => r.json())
     .then(console.log)
   ```

## Common CORS Issues

### Issue 1: Preflight Request Fails

**Symptom:** Browser sends OPTIONS request, gets blocked

**Solution:** Ensure `OPTIONS` is in `allow_methods` (already included)

### Issue 2: Credentials Not Sent

**Symptom:** Cookies/auth headers not included

**Solution:** Ensure `allow_credentials=True` (already set)

### Issue 3: Specific Header Blocked

**Symptom:** Custom headers not allowed

**Solution:** `allow_headers=["*"]` allows all headers (already set)

## Production vs Development

### Development
```bash
ALLOWED_ORIGINS=*
# OR
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

### Production
```bash
ALLOWED_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online
```

## Testing CORS

### From Browser Console

```javascript
// Test CORS
fetch('https://apilifestock.aamardokan.online/api/health', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('CORS Error:', error));
```

### From Command Line

```bash
# Test preflight request
curl -X OPTIONS https://apilifestock.aamardokan.online/api/auth/register \
  -H "Origin: http://localhost:3002" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Should return headers:
```
Access-Control-Allow-Origin: http://localhost:3002
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: *
```

## Next Steps

1. **Update Dokploy Backend Environment Variable**:
   ```bash
   ALLOWED_ORIGINS=https://lifestock.aamardokan.online,https://apilifestock.aamardokan.online,http://localhost:3002
   ```

2. **Restart Backend Service** in Dokploy

3. **Test Again** from `http://localhost:3002`

The CORS error should be resolved!

