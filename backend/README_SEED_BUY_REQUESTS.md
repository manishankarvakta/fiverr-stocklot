# Seed Buy Requests - Instructions

## Step 1: Clear All Buy Requests

Run the clear script to remove all existing buy requests:

```bash
# Option 1: Run from Docker (if MongoDB is in Docker)
docker exec -it stocklot-backend python clear_buy_requests.py

# Option 2: Run locally (if MongoDB is accessible)
cd backend
source venv/bin/activate
python clear_buy_requests.py
```

## Step 2: Seed New Buy Requests

Run the seed script to create 10 buy requests with proper structure:

```bash
# Option 1: Run from Docker (if MongoDB is in Docker)
docker exec -it stocklot-backend python seed_buy_requests_proper.py

# Option 2: Run locally (if MongoDB is accessible)
cd backend
source venv/bin/activate
python seed_buy_requests_proper.py
```

## Step 3: Verify

The seed script will:
- Create 10 buy requests with complete data
- Match the exact structure from the create API
- Include all required fields: species, breed, product_type, qty, unit, province, notes, etc.

## Data Structure

The seeded buy requests will have:
- `species`: Cattle, Goats, Poultry, Sheep, Pigs
- `breed`: Angus, Boer Goat, Layer, Dorper, Nguni, Broiler, Large White, Brahman, Kalahari Red, Merino
- `product_type`: Live Animal, Day-Old Chicks
- `qty`: Various quantities (15-2000)
- `unit`: "head"
- `province`: Various South African provinces
- `country`: "ZA"
- `status`: "open"
- `expires_at`: Future dates (5-20 days from now)
- `notes`: Descriptive notes
- All enhanced fields with proper defaults

## Troubleshooting

If connection fails:
1. Make sure MongoDB is running
2. Check if you need to set `MONGO_URL` or `DB_URL` environment variable
3. If using Docker, make sure the container name matches (`stocklot-mongodb`)

