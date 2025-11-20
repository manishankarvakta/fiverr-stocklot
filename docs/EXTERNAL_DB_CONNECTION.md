# External MongoDB Connection URL Format

## Standard Format

```
mongodb://[username]:[password]@[host]:[port]/[database]?[options]
```

## Your Current Configuration

Based on your environment variables, your external MongoDB connection URL should be:

```bash
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
```

## URL Components Breakdown

| Component | Your Value | Description |
|-----------|-----------|-------------|
| **Protocol** | `mongodb://` | MongoDB connection protocol |
| **Username** | `admin` | MongoDB root/admin username |
| **Password** | `strong_mongo_password` | MongoDB root/admin password |
| **Host** | `103.239.43.246` | External MongoDB server IP address |
| **Port** | `27025` | MongoDB port (default is 27017, yours is 27025) |
| **Database** | `my_database_name` | Database name to connect to |
| **Options** | `authSource=admin` | Authentication database (usually `admin` for root user) |

## Complete Examples

### Example 1: Basic External Connection
```bash
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
```

### Example 2: With Additional Options
```bash
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin&retryWrites=true&w=majority
```

### Example 3: MongoDB Atlas (Cloud)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/my_database_name?retryWrites=true&w=majority
```

### Example 4: With Replica Set
```bash
MONGO_URI=mongodb://admin:password@host1:27017,host2:27017,host3:27017/my_database_name?authSource=admin&replicaSet=myReplicaSet
```

## Common Connection Options

| Option | Description | Example |
|--------|-------------|---------|
| `authSource` | Database to authenticate against | `authSource=admin` |
| `retryWrites` | Enable retryable writes | `retryWrites=true` |
| `w` | Write concern | `w=majority` |
| `readPreference` | Read preference | `readPreference=secondary` |
| `ssl` | Enable SSL/TLS | `ssl=true` |
| `tls` | Enable TLS | `tls=true` |
| `connectTimeoutMS` | Connection timeout (ms) | `connectTimeoutMS=10000` |
| `socketTimeoutMS` | Socket timeout (ms) | `socketTimeoutMS=10000` |

## Recommended External Connection String

For your setup with external MongoDB at `103.239.43.246:27025`:

```bash
# Basic (what you have)
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin

# With additional reliability options (recommended)
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin&retryWrites=true&w=majority&connectTimeoutMS=10000&socketTimeoutMS=10000
```

## Environment Variable Setup

In your Dokploy environment variables, set:

```bash
# External MongoDB Connection
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin

# Database name (also set separately for clarity)
MONGO_DBNAME=my_database_name
# OR
DB_NAME=my_database_name
```

## Security Considerations

1. **Use Strong Passwords**: Ensure `strong_mongo_password` is actually strong
2. **Restrict IP Access**: Configure MongoDB firewall to only allow your Dokploy server IP
3. **Use SSL/TLS**: If possible, enable SSL:
   ```bash
   MONGO_URI=mongodb://admin:password@host:port/db?authSource=admin&ssl=true
   ```
4. **Don't Commit Secrets**: Never commit connection strings with passwords to git

## Testing the Connection

### From Backend Container
```bash
docker exec -it stocklot-backend python3 -c "
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    uri = os.environ.get('MONGO_URI')
    client = AsyncIOMotorClient(uri)
    result = await client.admin.command('ping')
    print('✅ Connection successful:', result)
    await client.close()

asyncio.run(test())
"
```

### Using MongoDB Shell
```bash
mongosh "mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin"
```

## Troubleshooting External Connections

### Connection Refused
- Check if MongoDB port (27025) is open in firewall
- Verify MongoDB is listening on the correct interface (0.0.0.0, not just 127.0.0.1)
- Check if IP address is correct

### Authentication Failed
- Verify username and password are correct
- Check `authSource=admin` is set
- Ensure user has permissions on the target database

### Timeout Issues
- Add `connectTimeoutMS=10000` to connection string
- Check network connectivity between Dokploy server and MongoDB server
- Verify firewall rules allow the connection

## Your Specific Configuration

Based on your environment, use:

```bash
MONGO_URI=mongodb://admin:strong_mongo_password@103.239.43.246:27025/my_database_name?authSource=admin
MONGO_DBNAME=my_database_name
```

This will connect the backend to your external MongoDB server at IP `103.239.43.246` on port `27025`.

