# 🌱 Comprehensive Database Seed Script

This script seeds the StockLot database with comprehensive test data including users, taxonomy, listings, orders, and all related entities with proper relationships.

## 📋 What Gets Seeded

### 1. Users (9 total)
- **2 Admin users** - Full platform access
- **4 Seller users** - Different specializations (cattle, poultry, goats, exotic)
- **3 Buyer users** - Regular customers
- **1 Multi-role user** - Both buyer and seller

### 2. Taxonomy
- **6 Category Groups** - Poultry, Ruminants, Rabbits, Aquaculture, Game Animals, Large Flightless Birds
- **9 Species** - Chicken, Duck, Cattle, Sheep, Goat, Rabbit, Ostrich, Impala
- **10 Breeds** - Angus, Brahman, Dorper, Merino, Boer Goat, Broiler, Layer, etc.
- **5 Product Types** - Live Animal, Day-Old Chicks, Hatching Eggs, Breeding Stock, Market-Ready

### 3. Listings (5 total)
- Buy Now listings (cattle, poultry, sheep)
- Auction listing (goats)
- Hybrid listing (ostrich)
- All with proper moderation status

### 4. Orders (2 total)
- Completed orders with different statuses
- Proper buyer-seller relationships

### 5. Buy Requests (2 total)
- Open buy requests from buyers
- Different categories and requirements

### 6. Organizations (1 total)
- Business organization for multi-role user

### 7. Reviews (2 total)
- Customer reviews for completed orders

### 8. Shopping Carts (1 total)
- Active cart with items

### 9. Notifications (2 total)
- Sample notifications for users

### 10. System Settings (3 total)
- Platform configuration settings

## 🚀 How to Run

### Option 1: Direct Python Execution
```bash
cd backend
python seed_comprehensive_data.py
```

### Option 2: With Environment Variables
```bash
cd backend
MONGO_URL="mongodb://user:pass@host:port/?authSource=admin" \
DB_NAME="stocklotDB" \
python seed_comprehensive_data.py
```

### Option 3: Using Docker
```bash
docker exec -it stocklot-backend python seed_comprehensive_data.py
```

## 🔑 Test Credentials

After seeding, you can use these credentials to log in:

### Admin Users
- **Email:** `admin@stocklot.co.za`
- **Password:** `Admin123!`

- **Email:** `moderator@stocklot.co.za`
- **Password:** `Moderator123!`

### Seller Users
- **Email:** `farmer.john@example.com`
- **Password:** `Seller123!`

- **Email:** `poultry.expert@example.com`
- **Password:** `Seller123!`

- **Email:** `goat.specialist@example.com`
- **Password:** `Seller123!`

- **Email:** `exotic.livestock@example.com`
- **Password:** `Seller123!`

### Buyer Users
- **Email:** `buyer.alice@example.com`
- **Password:** `Buyer123!`

- **Email:** `buyer.bob@example.com`
- **Password:** `Buyer123!`

- **Email:** `buyer.charlie@example.com`
- **Password:** `Buyer123!`

### Multi-Role User
- **Email:** `farmer.buyer@example.com`
- **Password:** `User123!`

## 📊 Data Relationships

The seed script ensures proper relationships:

- **Users → Listings:** Sellers have listings
- **Users → Orders:** Buyers have orders, linked to seller listings
- **Users → Buy Requests:** Buyers create buy requests
- **Listings → Taxonomy:** Listings linked to categories, species, breeds, product types
- **Orders → Listings:** Orders contain listing items
- **Reviews → Orders:** Reviews linked to completed orders
- **Carts → Listings:** Shopping carts contain listing items
- **Notifications → Users:** Notifications linked to users

## ⚠️ Important Notes

1. **Idempotent:** The script uses `update_one` with `upsert=True`, so it's safe to run multiple times
2. **Password Hashing:** All passwords are properly hashed using bcrypt
3. **Timestamps:** All records have proper `created_at` and `updated_at` timestamps
4. **Relationships:** All foreign key relationships are properly maintained
5. **Moderation:** Listings have proper moderation status (APPROVED for seeded listings)

## 🔄 Re-seeding

To re-seed the database:
1. The script will update existing records if they exist
2. To start fresh, you may want to clear collections first (use with caution):
   ```python
   # WARNING: This will delete all data!
   await db.users.delete_many({})
   await db.listings.delete_many({})
   # ... etc
   ```

## 📝 Customization

You can modify the seed script to:
- Add more users
- Add more listings
- Change test data values
- Add more categories/species/breeds
- Customize relationships

## ✅ Verification

After seeding, verify the data:
1. Check user count: Should have 9 users
2. Check listings: Should have 5 listings
3. Check orders: Should have 2 orders
4. Test login with any of the test credentials above

