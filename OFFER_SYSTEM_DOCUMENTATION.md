# Offer System Documentation

## How the Offer System Works

### Overview
The offer system is a reverse auction mechanism where:
1. **Buyers** create "Buy Requests" for livestock they want to purchase
2. **Sellers** can see these buy requests and make "Offers" on them
3. **Buyers** can accept, reject, or counter offers
4. When an offer is accepted, an order is created

### Data Flow

#### 1. Buy Request Creation
- Buyer creates a buy request with:
  - Species, breed, product type
  - Quantity needed
  - Target price (optional)
  - Location preferences
  - Delivery preferences
  - Additional requirements

#### 2. Seller Makes Offer
- Seller sees buy requests (via `/buy-requests/seller-inbox`)
- Seller creates an offer with:
  - `price_per_unit` - Seller's offered price
  - `quantity_available` - Quantity seller can provide
  - `notes` - Message to buyer
  - `delivery_cost` - Optional delivery cost
  - `delivery_days` - Estimated delivery time

#### 3. Offer Status
- **pending** - Waiting for buyer response
- **accepted** - Buyer accepted the offer
- **declined** - Buyer rejected the offer
- **expired** - Offer expired

#### 4. API Endpoints

**Get Seller's Offers:**
- `GET /api/seller/offers`
- Returns offers made by the seller
- Response structure:
  ```json
  {
    "offers": [
      {
        "id": "offer_id",
        "request_id": "buy_request_id",
        "seller_id": "seller_id",
        "price_per_unit": 1000.00,
        "quantity_available": 10,
        "notes": "Message from seller",
        "delivery_cost": 500.00,
        "delivery_days": 7,
        "status": "pending",
        "created_at": "2024-01-01T00:00:00Z",
        "expires_at": "2024-01-08T00:00:00Z",
        "request": {
          "id": "buy_request_id",
          "buyer_id": "buyer_id",
          "species": "Cattle",
          "breed": "Angus",
          "qty": 10,
          "unit": "head",
          "target_price": 1200.00,
          "province": "Gauteng",
          "status": "open",
          "notes": "Looking for quality cattle"
        }
      }
    ],
    "total_count": 10,
    "has_more": false
  }
  ```

**Create Offer:**
- `POST /api/buy-requests/{buy_request_id}/offers`
- Seller creates an offer on a buy request

**Accept Offer:**
- `POST /api/buy-requests/{request_id}/offers/{offer_id}/accept`
- Buyer accepts an offer (creates an order)

### Component Structure

The `SellerOffers` component should display:
- Offers made by the seller (not offers received)
- Each offer shows:
  - Buy request details (what buyer wants)
  - Seller's offer details (price, quantity, notes)
  - Status (pending, accepted, declined, expired)
  - Buyer information (from the buy request)
  - Time remaining until expiry

### Key Fields Mapping

**From API Response:**
- `offer.price_per_unit` → Display as "Your Offer Price"
- `offer.quantity_available` → Display as "Quantity You Offered"
- `offer.request.qty` → Display as "Buyer Wants"
- `offer.request.target_price` → Display as "Buyer's Target Price"
- `offer.request.species` → Display as "Species"
- `offer.request.buyer_id` → Use to fetch buyer info

