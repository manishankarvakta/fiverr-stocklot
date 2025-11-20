# How FastAPI Connects to MongoDB Database

## Overview

FastAPI uses **Motor** (async MongoDB driver) to connect to MongoDB. The connection is established at application startup and reused throughout the application lifecycle.

## Connection Flow

```
1. Read Environment Variables
   ↓
2. Create AsyncIOMotorClient
   ↓
3. Get Database Instance
   ↓
4. Use Database for CRUD Operations
```

## Step-by-Step Connection Process

### Step 1: Import Motor Library

```python
from motor.motor_asyncio import AsyncIOMotorClient
```

**Location:** `backend/server.py` line 5

### Step 2: Read Connection String from Environment

```python
# Support DB_URL, MONGO_URL, or MONGO_URI (in that order of priority)
mongo_url = os.environ.get('DB_URL') or os.environ.get('MONGO_URL') or os.environ.get('MONGO_URI')
if not mongo_url:
    raise ValueError("DB_URL, MONGO_URL, or MONGO_URI environment variable must be set")

db_name = os.environ.get('DB_NAME') or os.environ.get('MONGO_DBNAME', 'stocklot')
```

**Location:** `backend/server.py` lines 128-132

**Example Connection String:**
```
mongodb://admin:strong_mongo_password@mongodb:27017/my_database_name?authSource=admin
```

### Step 3: Create MongoDB Client

```python
client = AsyncIOMotorClient(
    mongo_url, 
    serverSelectionTimeoutMS=30000,  # 30 seconds timeout
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
    retryWrites=True
)
```

**Location:** `backend/server.py` lines 155-161

**What this does:**
- Creates an async MongoDB client connection
- Sets timeouts for connection attempts
- Enables retryable writes for better reliability

### Step 4: Get Database Instance

```python
db = client[db_name]
```

**Location:** `backend/server.py` line 162

**What this does:**
- Gets a reference to the specific database
- `db` is now the database object used for all operations

### Step 5: Verify Connection on Startup

```python
@app.on_event("startup")
async def startup_event():
    """Test database connection on startup"""
    try:
        # Test MongoDB connection
        await client.admin.command('ping')
        logger.info("✅ MongoDB connection verified on startup")
        
        # Test database access
        collections = await db.list_collection_names()
        logger.info(f"✅ Database access verified - {len(collections)} collections found")
    except Exception as e:
        logger.error(f"❌ Database connection test failed on startup: {e}")
```

**Location:** `backend/server.py` lines 287-300

## How Database is Used in Code

### Example 1: Find One Document (Read)

```python
# Find a user by email
user_doc = await db.users.find_one({"email": credentials.credentials})
```

**Location:** `backend/server.py` line 851

**What it does:**
- Searches `users` collection
- Finds first document matching the email
- Returns document or `None` if not found

### Example 2: Update Document (Update)

```python
# Update user password
await db.users.update_one(
    {"email": email},
    {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc)}}
)
```

**Location:** `backend/server.py` lines 1076-1079

**What it does:**
- Finds user by email
- Updates password and timestamp
- Uses `$set` operator to update specific fields

### Example 3: Insert Document (Create)

```python
# Create password reset record
await db.password_resets.insert_one(reset_record)
```

**Location:** `backend/server.py` line 1129

**What it does:**
- Inserts a new document into `password_resets` collection
- Returns the inserted document with `_id`

### Example 4: Count Documents (Read)

```python
# Count users (for health check)
await db.users.count_documents({}, limit=1)
```

**Location:** `backend/server.py` line 356

**What it does:**
- Counts documents matching the filter (empty `{}` = all documents)
- `limit=1` means stop after finding 1 match (faster)

### Example 5: Find with Sort and Limit

```python
# Get recent FAQ learning entries
cursor = db.faq_learning.find().sort("created_at", -1).limit(10)
```

**Location:** `backend/server.py` line 965

**What it does:**
- Finds all documents in `faq_learning` collection
- Sorts by `created_at` descending (`-1`)
- Limits to 10 results

## Complete Connection Code Location

**File:** `backend/server.py`

**Lines 125-163:**
```python
# MongoDB connection
# Support DB_URL, MONGO_URL, or MONGO_URI (in that order of priority)
mongo_url = os.environ.get('DB_URL') or os.environ.get('MONGO_URL') or os.environ.get('MONGO_URI')
if not mongo_url:
    raise ValueError("DB_URL, MONGO_URL, or MONGO_URI environment variable must be set")

db_name = os.environ.get('DB_NAME') or os.environ.get('MONGO_DBNAME', 'stocklot')

# Mask password in logs for security
def mask_mongo_url(url: str) -> str:
    """Mask password in MongoDB connection string for logging"""
    # ... masking logic ...

logger.info(f"Connecting to MongoDB: {mask_mongo_url(mongo_url)}")
logger.info(f"Database name: {db_name}")

# Initialize MongoDB client
client = AsyncIOMotorClient(
    mongo_url, 
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
    retryWrites=True
)
db = client[db_name]
logger.info("MongoDB client initialized (connection will be tested on first use)")
```

## Database Object Usage Pattern

Once `db` is created, it's used throughout the application:

```python
# Access collections
db.users          # Users collection
db.listings       # Listings collection
db.orders         # Orders collection
db.password_resets # Password resets collection

# CRUD Operations
await db.collection_name.find_one({})      # Read one
await db.collection_name.find({})          # Read many
await db.collection_name.insert_one({})    # Create
await db.collection_name.update_one({})    # Update
await db.collection_name.delete_one({})    # Delete
await db.collection_name.count_documents({}) # Count
```

## Key Points

1. **Single Connection**: One `AsyncIOMotorClient` instance is created at startup
2. **Reused**: The `db` object is reused for all database operations
3. **Async/Await**: All database operations use `await` (async)
4. **Collection Access**: Access collections via `db.collection_name`
5. **Connection Pooling**: Motor automatically manages connection pooling

## Environment Variables Used

From `docker-compose.yml`:
```yaml
environment:
  DB_URL: mongodb://admin:password@mongodb:27017/dbname?authSource=admin
  MONGO_URL: mongodb://admin:password@mongodb:27017/dbname?authSource=admin
  DB_NAME: my_database_name
```

## Connection String Format

```
mongodb://[username]:[password]@[host]:[port]/[database]?[options]
```

**Example:**
```
mongodb://admin:strong_mongo_password@mongodb:27017/my_database_name?authSource=admin
```

- `admin:strong_mongo_password` - Username and password
- `mongodb:27017` - Host (Docker service name) and port
- `my_database_name` - Database name
- `authSource=admin` - Authentication database

## Verification

Check connection in logs:
```
Connecting to MongoDB: mongodb://admin:***@mongodb:27017/my_database_name?authSource=admin
Database name: my_database_name
MongoDB client initialized (connection will be tested on first use)
✅ MongoDB connection verified on startup
✅ Database access verified - X collections found
```

