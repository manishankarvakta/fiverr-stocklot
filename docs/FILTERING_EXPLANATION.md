# 🔍 Marketplace Filtering System Explanation

## Overview
The Marketplace filtering system uses a multi-layer approach to filter listings based on user selections and preferences.

## Filter Flow

### 1. Frontend Filter State
The frontend maintains filter state in the `filters` object:
```javascript
{
  category_group_id: '',      // Category group (Poultry, Ruminants, etc.)
  species_id: '',             // Specific species (Chickens, Cattle, etc.)
  breed_id: '',               // Specific breed (Ross 308, Angus, etc.)
  product_type_id: '',        // Product type (Live Animal, Day-Old Chicks, etc.)
  province: '',                // Province filter
  price_min: '',               // Minimum price
  price_max: '',               // Maximum price
  listing_type: 'all',        // buy_now, auction, hybrid, or all
  include_exotics: false       // Show exotic livestock or not
}
```

### 2. Redux RTK Query Parameters
The filters are converted to API parameters:
```javascript
const listingsParams = {
  category_group_id: filters.category_group_id,
  species_id: filters.species_id,
  breed_id: filters.breed_id,
  product_type_id: filters.product_type_id,
  region: filters.province,        // Note: backend uses 'region' not 'province'
  price_min: filters.price_min,
  price_max: filters.price_max,
  listing_type: filters.listing_type,
  include_exotics: filters.include_exotics,
  deliverable_only: deliverableOnly
}
```

### 3. Backend Filtering Logic

#### Step 1: Base Filter
```python
filter_query = {"status": "active"}  # Only active listings show
```

#### Step 2: Category Group Filter
If `category_group_id` is provided:
- Find all species in that category group
- Filter listings to only those species
- If no species found in category → return empty results

#### Step 3: Species Filter
If `species_id` is provided:
- Filter listings to that specific species
- Overrides category group filter if both provided

#### Step 4: Breed Filter
If `breed_id` is provided:
- Filter listings to that specific breed

#### Step 5: Product Type Filter
If `product_type_id` is provided:
- Filter listings to that product type

#### Step 6: Region/Province Filter
If `region` is provided:
- Uses case-insensitive regex match
- Matches listings with matching province/region

#### Step 7: Price Range Filter
If `price_min` or `price_max` provided:
- Filters by `price_per_unit` field
- Uses MongoDB `$gte` (greater than or equal) and `$lte` (less than or equal)

#### Step 8: Listing Type Filter
If `listing_type` is not "all":
- Filters by `listing_type` field (buy_now, auction, hybrid)

#### Step 9: Exotic Filtering (CRITICAL)
If `include_exotics=False` (default):
- Gets all core (non-exotic) species IDs
- Filters listings to only show core species
- If a listing's species is exotic → it won't show

If `include_exotics=True`:
- Shows all listings regardless of exotic status

#### Step 10: Delivery Filter
If `deliverable_only=True`:
- Filters to listings where `delivery_available=True`

## Why Listings Might Not Show

### Common Issues:

1. **Status Not Active**
   - Listings must have `status: "active"`
   - Check: `db.listings.find({"status": "active"})`

2. **Exotic Species with include_exotics=False**
   - If listing's species has `is_exotic: true`
   - And `include_exotics=False` (default)
   - Listing won't show
   - Solution: Set `include_exotics=True` or use core species

3. **Missing Taxonomy Relationships**
   - Listing must have valid `species_id` that exists in `species` collection
   - Species must have valid `category_group_id` that exists in `category_groups` collection
   - Check relationships:
     ```python
     # Verify listing has valid species
     listing = await db.listings.find_one({"id": "listing-001"})
     species = await db.species.find_one({"id": listing["species_id"]})
     category = await db.category_groups.find_one({"id": species["category_group_id"]})
     ```

4. **Category Group Mismatch**
   - If filtering by category_group_id
   - But listing's species has different category_group_id
   - Listing won't show

5. **Empty Filter Results**
   - If category has no species → empty results
   - If species has no listings → empty results
   - If all species in category are exotic but include_exotics=False → empty results

## Testing Checklist

### Test Core Livestock (include_exotics=False)
- [ ] Poultry listings show
- [ ] Ruminants listings show
- [ ] Rabbits listings show
- [ ] Aquaculture listings show
- [ ] Exotic listings DON'T show

### Test Exotic Livestock (include_exotics=True)
- [ ] Ostrich listings show
- [ ] Game Animals listings show
- [ ] Core livestock still shows

### Test Filters
- [ ] Category filter works
- [ ] Species filter works
- [ ] Breed filter works
- [ ] Product type filter works
- [ ] Province filter works
- [ ] Price range filter works
- [ ] Listing type filter works
- [ ] Delivery filter works

### Test Listing Types
- [ ] Buy Now listings show
- [ ] Auction listings show
- [ ] Hybrid listings show

## Debugging Queries

### Check if listings exist:
```python
# Count all active listings
count = await db.listings.count_documents({"status": "active"})

# Count core species listings
core_species = await db.species.find({"is_exotic": {"$ne": True}}).to_list(length=None)
core_species_ids = [s["id"] for s in core_species]
core_count = await db.listings.count_documents({
    "status": "active",
    "species_id": {"$in": core_species_ids}
})
```

### Check taxonomy relationships:
```python
# Get all listings with their species and categories
listings = await db.listings.find({"status": "active"}).limit(10).to_list(length=None)
for listing in listings:
    species = await db.species.find_one({"id": listing.get("species_id")})
    if species:
        category = await db.category_groups.find_one({"id": species.get("category_group_id")})
        print(f"Listing: {listing['title']}")
        print(f"  Species: {species.get('name')} (exotic: {species.get('is_exotic', False)})")
        print(f"  Category: {category.get('name') if category else 'MISSING'}")
```

## Response Format

The backend returns:
```json
{
  "listings": [...],
  "total_count": 123,
  "include_exotics": false,
  "filters_applied": {...}
}
```

The frontend handles:
- Array response: `Array.isArray(data) ? data : data.listings`
- Object response: `data.listings || data.data || []`

