# Buy Requests and Offers Data Verification Guide

## Collection Names

- **Buy Requests**: `buy_requests`
- **Seller Offers**: `buy_request_offers`

## Required Fields for Offers

Based on the API endpoint `/api/seller/offers` (line 17185 in server.py), offers must have:

### Required Fields:
- `id` - Unique offer ID
- `request_id` - Links to `buy_requests.id` (used in $lookup)
- `seller_id` - Seller user ID
- `price_per_unit` - Price per unit
- `quantity_available` - Available quantity
- `status` - "pending", "accepted", "declined", "expired"
- `created_at` - Creation timestamp

### Optional Fields:
- `buy_request_id` - Alternative field name (some APIs use this)
- `notes` - Seller's message
- `delivery_cost` - Delivery cost
- `delivery_days` - Delivery time in days
- `expires_at` - Offer expiration date
- `updated_at` - Last update timestamp

## API Endpoint Structure

The `/api/seller/offers` endpoint:
1. Queries `buy_request_offers` collection with `seller_id` filter
2. Uses `$lookup` to join with `buy_requests` on:
   - `localField: "request_id"` (from offers)
   - `foreignField: "id"` (from buy_requests)
3. Returns offers with nested `request` object

## How to Verify Data

### Option 1: Using MongoDB Shell/Compass
```javascript
// Check if collection exists
db.getCollectionNames()

// Count offers
db.buy_request_offers.countDocuments({})

// View sample offer
db.buy_request_offers.findOne({})

// Check if buy requests exist
db.buy_requests.countDocuments({})

// Verify offer-to-request links
db.buy_request_offers.aggregate([
  {
    $lookup: {
      from: "buy_requests",
      localField: "request_id",
      foreignField: "id",
      as: "request"
    }
  },
  { $limit: 1 }
])
```

### Option 2: Using Python Script
Run the check script:
```bash
cd backend
python check_offers.py
```

### Option 3: Test API Endpoint
```bash
# Get auth token first, then:
curl -X GET "http://localhost:8000/api/seller/offers" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues

1. **Collection doesn't exist**: Seed script hasn't run or failed
2. **No matching buy_requests**: Offers reference non-existent request IDs
3. **Wrong field names**: API expects `request_id`, not `buy_request_id` (though both work)
4. **Seller ID mismatch**: Offers have `seller_id` that doesn't match logged-in user
5. **Role check fails**: User must have "seller" role in their `roles` array

## Running the Seed Script

### From Docker:
```bash
docker exec -it stocklot-backend python seed_buy_requests_and_offers.py
```

### With Environment Variable:
```bash
cd backend
MONGO_URL="mongodb://admin:adminpassword@mongodb:27017/" \
python seed_buy_requests_and_offers.py
```

### Update Connection in Script:
Edit line 19-24 in `seed_buy_requests_and_offers.py` to match your MongoDB connection.

## Expected Data Structure

### Buy Request Example:
```json
{
  "id": "buyreq-abc123",
  "buyer_id": "buyer-001",
  "species": "Cattle",
  "product_type": "Live Animal",
  "qty": 15,
  "unit": "head",
  "target_price": 12000.00,
  "breed": "Angus",
  "province": "Gauteng",
  "status": "open",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Offer Example:
```json
{
  "id": "offer-xyz789",
  "request_id": "buyreq-abc123",
  "seller_id": "seller-001",
  "price_per_unit": 11500.00,
  "quantity_available": 15,
  "notes": "Quality Angus cattle available...",
  "delivery_cost": 500.00,
  "delivery_days": 7,
  "status": "pending",
  "created_at": "2024-01-02T00:00:00Z",
  "expires_at": "2024-01-09T00:00:00Z"
}
```

