# 📦 Listings Seed Script

## Purpose
This script seeds comprehensive listings data for testing all filtering and search scenarios in the Marketplace.

## What It Seeds

### Core Livestock Listings (include_exotics=False)
- **Poultry**: Day-old chicks (Buy Now), Live chickens (Auctions)
- **Cattle**: Angus (Buy Now), Brahman (Hybrid)
- **Goats**: Boer goats (Buy Now & Auctions)
- **Sheep**: Dorper sheep (Buy Now)

### Exotic Livestock Listings (include_exotics=True)
- **Ostrich**: Breeding pairs (Hybrid)
- **Game Animals**: Springbok, Blesbok, Impala (Buy Now)

### Coverage
- ✅ All listing types: buy_now, auction, hybrid
- ✅ Multiple provinces across South Africa
- ✅ Different price ranges
- ✅ With and without delivery options
- ✅ Different product types
- ✅ All have `status: "active"` and `moderation_status: "APPROVED"`

## Prerequisites

1. **MongoDB running** and accessible
2. **Taxonomy seeded** - Categories, Species, Breeds, Product Types must exist
3. **At least one seller user** - Script will create if doesn't exist

## Running the Script

### Option 1: Direct Python
```bash
cd backend
python seed_listings_for_testing.py
```

### Option 2: With Virtual Environment
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python seed_listings_for_testing.py
```

### Option 3: As Module
```bash
cd backend
python -m seed_listings_for_testing
```

## Environment Variables

The script uses:
- `MONGODB_URL` (default: `mongodb://localhost:27017/stocklot`)

Set it if needed:
```bash
export MONGODB_URL="mongodb://localhost:27017/stocklot"
python seed_listings_for_testing.py
```

## Expected Output

```
🌱 Starting listings seed...
✅ Using seller ID: seller-test-001
✅ Loaded taxonomy: 6 categories, 15 species

📦 Inserting 35 listings...
   - Core livestock: 28
   - Exotic livestock: 7

✅ Successfully seeded 35 listings

📊 Breakdown:
   - Buy Now: 18
   - Auctions: 8
   - Hybrid: 9
   - With Delivery: 22
   - Without Delivery: 13

🎉 Listings seed completed successfully!
```

## Troubleshooting

### Error: "No species found"
- **Cause**: Taxonomy not seeded
- **Solution**: Run `python seed_comprehensive_data.py` first

### Error: "Category not found"
- **Cause**: Category groups not seeded
- **Solution**: Run `python seed_comprehensive_data.py` first

### No listings showing in marketplace
1. Check listings have `status: "active"`
   ```python
   await db.listings.find({"status": "active"}).count()
   ```

2. Check exotic filtering:
   - If `include_exotics=False`, only core species show
   - Check species: `await db.species.find({"is_exotic": True}).to_list(length=None)`

3. Check taxonomy relationships:
   ```python
   listing = await db.listings.find_one({"id": "listing-poultry-1"})
   species = await db.species.find_one({"id": listing["species_id"]})
   category = await db.category_groups.find_one({"id": species["category_group_id"]})
   ```

## Testing Scenarios

After seeding, test these scenarios:

### 1. Core Livestock Only (Default)
- Toggle: `include_exotics = false`
- Should show: Poultry, Cattle, Goats, Sheep
- Should NOT show: Ostrich, Game Animals

### 2. All Livestock (Including Exotics)
- Toggle: `include_exotics = true`
- Should show: All listings including Ostrich and Game Animals

### 3. Category Filter
- Select "Poultry" → Should show only poultry listings
- Select "Ruminants" → Should show Cattle, Goats, Sheep

### 4. Species Filter
- Select "Chickens" → Should show only chicken listings
- Select "Cattle" → Should show only cattle listings

### 5. Breed Filter
- Select "Ross 308" → Should show only Ross 308 listings
- Select "Angus" → Should show only Angus cattle

### 6. Listing Type Filter
- "Buy Now Only" → Should show only buy_now listings
- "Auctions Only" → Should show only auction listings
- "Hybrid" → Should show only hybrid listings

### 7. Province Filter
- Enter "Gauteng" → Should show listings in Gauteng
- Enter "Western Cape" → Should show listings in Western Cape

### 8. Price Range Filter
- Min: 1000, Max: 5000 → Should show listings in that range
- Min: 10000 → Should show only high-value listings

### 9. Delivery Filter
- Toggle "Deliverable Only" → Should show only listings with delivery_available=true

### 10. Smart Search
- Search: "Ross 308 chicks in Gauteng" → Should find relevant listings
- Search: "Angus cattle under R20000" → Should find matching listings

## Verifying Seed Data

### Check listings count:
```python
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient("mongodb://localhost:27017/stocklot")
db = client.get_database("stocklot")

# Count active listings
count = await db.listings.count_documents({"status": "active"})
print(f"Active listings: {count}")

# Count by listing type
buy_now = await db.listings.count_documents({"status": "active", "listing_type": "buy_now"})
auction = await db.listings.count_documents({"status": "active", "listing_type": "auction"})
hybrid = await db.listings.count_documents({"status": "active", "listing_type": "hybrid"})
print(f"Buy Now: {buy_now}, Auction: {auction}, Hybrid: {hybrid}")

# Count by category
poultry = await db.listings.count_documents({"status": "active", "category_group_id": "cat-poultry"})
ruminants = await db.listings.count_documents({"status": "active", "category_group_id": "cat-ruminants"})
print(f"Poultry: {poultry}, Ruminants: {ruminants}")
```

## Notes

- The script uses `upsert=True` so it's safe to run multiple times
- Existing listings with same ID will be updated
- New listings will be created
- Seller user is auto-created if doesn't exist

