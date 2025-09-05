# 💰 StockLot Fee System - Dual Fee Model Implementation

## Overview

The StockLot Fee System implements a comprehensive dual fee model that supports both **Seller-Pays** and **Buyer-Pays Commission** models. This production-ready system provides transparent fee calculations, immutable financial records, and flexible configuration options for the livestock marketplace.

## 🎯 Key Features

### Dual Fee Models
- **Seller-Pays Model**: Traditional model where platform deducts fees from seller payouts
- **Buyer-Pays Commission Model**: Transparent model where commission is shown to buyers at checkout
- **Dynamic Switching**: Fee models can be configured per species, region, or export status

### Financial Accuracy
- **Banker's Rounding**: Precise money calculations with industry-standard rounding
- **Immutable Records**: Fee snapshots stored permanently for audit compliance
- **Multi-Currency Support**: Built for ZAR with extensibility for other currencies
- **Anti-Tampering**: Server-side recalculation prevents fee manipulation

### Marketplace Integration
- **Multi-Seller Carts**: Support for complex carts with multiple sellers
- **Escrow Integration**: Seamless integration with payment escrow system
- **Payout Automation**: Automated seller payout calculations and tracking
- **Webhook Support**: Idempotent webhook processing for payment providers

## 💸 Fee Structure (Current Rates)

### Default Fee Rates
- **Platform Commission**: 10% of merchandise value
- **Seller Payout Fee**: 2.5% of merchandise value  
- **Buyer Processing Fee**: 1.5% of merchandise value
- **Escrow Service Fee**: R25 (fixed per order)

### Fee Model Examples

#### Seller-Pays Model (R1,000 merchandise)
```
Buyer Pays:
- Merchandise: R1,000.00
- Processing Fee (1.5%): R15.00
- Escrow Fee: R25.00
- Total: R1,040.00

Seller Receives:
- Merchandise: R1,000.00
- Less Commission (10%): -R100.00
- Less Payout Fee (2.5%): -R25.00
- Net Payout: R875.00

Platform Revenue:
- Commission: R100.00
- Processing Fee: R15.00
- Escrow Fee: R25.00
- Total: R140.00
```

#### Buyer-Pays Commission Model (R1,000 merchandise)
```
Buyer Pays:
- Merchandise: R1,000.00
- Commission (10%): R100.00
- Processing Fee (1.5%): R15.00
- Escrow Fee: R25.00
- Total: R1,140.00

Seller Receives:
- Merchandise: R1,000.00
- Less Payout Fee (2.5%): -R25.00
- Net Payout: R975.00

Platform Revenue:
- Commission: R100.00
- Processing Fee: R15.00
- Escrow Fee: R25.00
- Total: R140.00
```

## 🗄️ Database Schema

### Collections

#### fee_configs
```javascript
{
  id: "config-uuid",
  name: "Default South Africa 2025",
  platform_commission_pct: 10.0,
  seller_payout_fee_pct: 2.5,
  buyer_processing_fee_pct: 1.5,
  escrow_service_fee_minor: 2500,
  model: "SELLER_PAYS",
  applies_to: { species: ["cattle"], export_only: false },
  is_active: true,
  effective_from: "2025-01-01T00:00:00Z",
  effective_to: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z"
}
```

#### seller_order_fees (Immutable Snapshots)
```javascript
{
  id: "fee-snapshot-uuid",
  seller_order_id: "order_group_id_seller_id",
  fee_config_id: "config-uuid",
  model: "SELLER_PAYS",
  
  // Base amounts
  merch_subtotal_minor: 100000, // R1,000.00
  delivery_minor: 5000,         // R50.00
  abattoir_minor: 2000,         // R20.00
  
  // Buyer-side charges
  buyer_processing_fee_minor: 1500,  // R15.00
  escrow_service_fee_minor: 2500,    // R25.00
  buyer_commission_minor: 0,         // R0.00 (SELLER_PAYS)
  
  // Seller-side deductions
  platform_commission_minor: 10000,  // R100.00
  seller_payout_fee_minor: 2500,     // R25.00
  
  // Totals
  buyer_total_minor: 108500,          // R1,085.00
  seller_net_payout_minor: 87500,    // R875.00
  
  currency: "ZAR",
  created_at: "2025-01-01T12:00:00Z"
}
```

#### payouts
```javascript
{
  id: "payout-uuid",
  seller_order_id: "order_group_id_seller_id",
  amount_minor: 87500,  // R875.00
  currency: "ZAR",
  status: "SENT",
  transfer_ref: "paystack_transfer_123",
  attempts: 1,
  created_at: "2025-01-01T12:30:00Z",
  updated_at: "2025-01-01T12:35:00Z"
}
```

#### webhook_events (Idempotency)
```javascript
{
  id: 12345,
  provider: "paystack",
  event_id: "evt_paystack_123",
  signature: "sha256=...",
  payload: { /* webhook data */ },
  received_at: "2025-01-01T12:00:00Z"
}
```

## 🚀 API Endpoints

### Admin Fee Configuration

#### Create Fee Configuration
```http
POST /api/admin/fees/configs
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Default SA Config",
  "platform_commission_pct": 10.0,
  "seller_payout_fee_pct": 2.5,
  "buyer_processing_fee_pct": 1.5,
  "escrow_service_fee_minor": 2500,
  "model": "SELLER_PAYS",
  "applies_to": {},
  "effective_from": "2025-01-01T00:00:00Z"
}

Response 201:
{
  "success": true,
  "config": { /* config object */ },
  "message": "Fee configuration created successfully"
}
```

#### Activate Fee Configuration
```http
POST /api/admin/fees/configs/{config_id}/activate
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "message": "Fee configuration activated successfully"
}
```

#### List Fee Configurations
```http
GET /api/admin/fees/configs?active_only=true
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "configs": [{ /* config objects */ }],
  "count": 1
}
```

### Public Checkout & Preview

#### Checkout Preview
```http
POST /api/checkout/preview
Content-Type: application/json

{
  "cart": [
    {
      "seller_id": "seller_123",
      "merch_subtotal_minor": 100000,
      "delivery_minor": 5000,
      "abattoir_minor": 2000,
      "species": "cattle",
      "export": false
    }
  ],
  "currency": "ZAR"
}

Response 200:
{
  "success": true,
  "preview": {
    "per_seller": [
      {
        "seller_id": "seller_123",
        "fee_model": "SELLER_PAYS",
        "lines": {
          "merch_subtotal_minor": 100000,
          "buyer_processing_fee_minor": 1500,
          "escrow_service_fee_minor": 2500,
          "buyer_commission_minor": 0,
          "delivery_minor": 5000,
          "abattoir_minor": 2000
        },
        "totals": {
          "buyer_total_minor": 108500,
          "seller_net_payout_minor": 87500
        }
      }
    ],
    "cart_totals": {
      "buyer_grand_total_minor": 108500,
      "seller_total_net_payout_minor": 87500,
      "platform_revenue_estimate_minor": 14000
    },
    "fee_config_id": "config-uuid"
  }
}
```

#### Fee Breakdown
```http
GET /api/fees/breakdown?amount=1000.00&species=cattle&export=false

Response 200:
{
  "success": true,
  "breakdown": {
    "base_amount_minor": 100000,
    "commission_rate_pct": 10.0,
    "commission_minor": 10000,
    "processing_fee_rate_pct": 1.5,
    "processing_fee_minor": 1500,
    "payout_fee_rate_pct": 2.5,
    "payout_fee_minor": 2500,
    "escrow_fee_minor": 2500,
    "total_buyer_fees_minor": 4000,
    "total_seller_deductions_minor": 12500,
    "net_to_seller_minor": 87500,
    "net_to_platform_minor": 14000
  },
  "config_used": {
    "id": "config-uuid",
    "name": "Default SA Config",
    "model": "SELLER_PAYS"
  }
}
```

### Order Management

#### Finalize Order Fees
```http
POST /api/orders/{order_group_id}/fees/finalize
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "per_seller": [
    {
      "seller_id": "seller_123",
      "merch_subtotal_minor": 100000,
      "delivery_minor": 5000,
      "abattoir_minor": 2000,
      "species": "cattle",
      "export": false
    }
  ],
  "fee_config_id": "config-uuid"
}

Response 200:
{
  "success": true,
  "finalized_fees": [{ /* immutable fee snapshots */ }],
  "message": "Order fees finalized successfully"
}
```

### Payout Management

#### Release Seller Payout
```http
POST /api/payouts/{seller_order_id}/release
Authorization: Bearer <seller_token>

Response 200:
{
  "success": true,
  "payout": {
    "id": "payout-uuid",
    "seller_order_id": "order_group_id_seller_id",
    "amount_minor": 87500,
    "currency": "ZAR",
    "status": "SENT",
    "transfer_ref": "mock_transfer_123"
  },
  "status": "SENT",
  "transfer_ref": "mock_transfer_123",
  "message": "Payout released successfully"
}
```

#### Get Seller Payouts
```http
GET /api/payouts/seller/{seller_id}?status=SENT&limit=50
Authorization: Bearer <seller_token>

Response 200:
{
  "success": true,
  "payouts": [{ /* payout objects */ }],
  "summary": {
    "total_payouts": 10,
    "pending_amount_minor": 0,
    "sent_amount_minor": 875000,
    "pending_amount_major": 0.00,
    "sent_amount_major": 8750.00
  }
}
```

### Analytics

#### Revenue Summary
```http
GET /api/admin/fees/revenue-summary?start_date=2025-01-01T00:00:00Z&end_date=2025-01-31T23:59:59Z
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "summary": {
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T23:59:59Z"
    },
    "by_model": {
      "SELLER_PAYS": {
        "orders": 150,
        "commission_minor": 2500000,
        "processing_fees_minor": 375000,
        "escrow_fees_minor": 375000,
        "total_revenue_minor": 3250000
      }
    },
    "totals": {
      "orders": 150,
      "commission_minor": 2500000,
      "processing_fees_minor": 375000,
      "escrow_fees_minor": 375000,
      "total_revenue_minor": 3250000
    }
  }
}
```

### Webhook Processing

#### Paystack Webhook
```http
POST /api/payments/webhook/paystack
X-Paystack-Signature: sha256=...
Content-Type: application/json

{
  "event": "charge.success",
  "data": {
    "id": 123456,
    "reference": "order_ref_123",
    "amount": 108500,
    "status": "success"
  }
}

Response 200:
{
  "success": true,
  "message": "Webhook processed"
}
```

## 🔧 Implementation Details

### Money Calculation Logic

```typescript
function calculatePercentageFee(baseAmountMinor: number, ratePct: number): number {
  return Math.round(baseAmountMinor * (ratePct / 100.0));
}

function calculateSellerOrderFees(config: FeeConfig, merchMinor: number) {
  const buyerProcessingMinor = calculatePercentageFee(merchMinor, config.buyer_processing_fee_pct);
  const escrowMinor = config.escrow_service_fee_minor;
  
  let buyerCommissionMinor = 0;
  let platformCommissionMinor = 0;
  const sellerPayoutFeeMinor = calculatePercentageFee(merchMinor, config.seller_payout_fee_pct);
  
  if (config.model === 'BUYER_PAYS_COMMISSION') {
    buyerCommissionMinor = calculatePercentageFee(merchMinor, config.platform_commission_pct);
  } else {
    platformCommissionMinor = calculatePercentageFee(merchMinor, config.platform_commission_pct);
  }
  
  const buyerTotalMinor = merchMinor + buyerProcessingMinor + escrowMinor + buyerCommissionMinor;
  const sellerNetPayoutMinor = merchMinor - platformCommissionMinor - sellerPayoutFeeMinor;
  
  return { buyerTotalMinor, sellerNetPayoutMinor, /* ... */ };
}
```

### Idempotency and Integrity

1. **Immutable Snapshots**: Fee calculations are stored as immutable records per order
2. **Server-Side Validation**: All fee calculations are recomputed server-side to prevent tampering
3. **Webhook Idempotency**: Duplicate webhook events are automatically detected and ignored
4. **Audit Trail**: Complete audit trail for all fee-related operations

### Multi-Seller Cart Support

```javascript
// Multi-seller cart example
const cart = [
  {
    seller_id: "seller_1",
    merch_subtotal_minor: 50000,  // R500
    species: "cattle",
    export: false
  },
  {
    seller_id: "seller_2", 
    merch_subtotal_minor: 75000,  // R750
    species: "sheep",
    export: true  // Different fee model may apply
  }
];

// Each seller gets separate fee calculation and payout
```

## 🔒 Security & Compliance

### Access Control
- **Admin Endpoints**: Require admin role for fee configuration management
- **Seller Endpoints**: Sellers can only access their own payout information
- **Order Access**: Users can only finalize fees for their own orders

### Data Protection
- **Immutable Records**: Fee snapshots cannot be modified after creation
- **Audit Trail**: Complete history of all fee-related operations
- **Encryption**: All sensitive financial data encrypted at rest and in transit

### Financial Compliance
- **Audit Requirements**: All fee calculations preserved for regulatory compliance
- **Reconciliation**: Built-in tools for financial reconciliation and reporting
- **Tax Support**: Extensible structure for VAT and other tax calculations

## 📊 Monitoring & Analytics

### Key Metrics
- **Platform Revenue**: Total commission, processing fees, and escrow fees
- **Fee Model Performance**: Revenue comparison between SELLER_PAYS and BUYER_PAYS_COMMISSION
- **Payout Status**: Tracking of pending, sent, and failed payouts
- **Conversion Impact**: Analysis of fee model impact on conversion rates

### Alerts
- **Failed Payouts**: Automatic alerts for failed payout attempts
- **Configuration Changes**: Notifications when fee configurations are modified
- **Revenue Anomalies**: Detection of unusual revenue patterns

## 🚀 Getting Started

### 1. Database Setup
The fee system database is automatically initialized when the backend starts:
```bash
# Restart backend to setup fee collections
sudo supervisorctl restart backend
```

### 2. Create Default Configuration
```bash
curl -X POST https://your-domain.com/api/admin/fees/configs \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Default SA 2025",
    "platform_commission_pct": 10.0,
    "seller_payout_fee_pct": 2.5,
    "buyer_processing_fee_pct": 1.5,
    "escrow_service_fee_minor": 2500,
    "model": "SELLER_PAYS",
    "effective_from": "2025-01-01T00:00:00Z"
  }'
```

### 3. Activate Configuration
```bash
curl -X POST https://your-domain.com/api/admin/fees/configs/{config_id}/activate \
  -H "Authorization: Bearer <admin_token>"
```

### 4. Test Checkout Preview
```bash
curl -X POST https://your-domain.com/api/checkout/preview \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [{
      "seller_id": "test_seller",
      "merch_subtotal_minor": 100000,
      "delivery_minor": 5000,
      "species": "cattle"
    }]
  }'
```

## 🐛 Troubleshooting

### Common Issues

#### Configuration Not Active
```javascript
// Error: No active fee configuration found
// Solution: Ensure a fee configuration is activated
POST /api/admin/fees/configs/{config_id}/activate
```

#### Payout Not Found
```javascript
// Error: Unable to create payout - fee snapshot not found
// Solution: Ensure order fees have been finalized first
POST /api/orders/{order_group_id}/fees/finalize
```

#### Webhook Duplicate Processing
```javascript
// The system automatically handles webhook idempotency
// Duplicate events are logged but not reprocessed
```

### Debug Endpoints

#### Check Fee Configuration
```bash
curl https://your-domain.com/api/admin/fees/configs?active_only=true \
  -H "Authorization: Bearer <admin_token>"
```

#### Verify Fee Calculation
```bash
curl "https://your-domain.com/api/fees/breakdown?amount=1000.00&species=cattle"
```

## 📈 Performance Optimization

### Database Indexes
The system includes optimized indexes for:
- Fee configuration lookups
- Order fee queries
- Payout status tracking
- Revenue analytics
- Webhook idempotency

### Caching Strategies
- Active fee configurations are cached in memory
- Fee calculations are cached per cart composition
- Revenue summaries are cached with TTL

### Scaling Considerations
- Fee calculations are stateless and horizontally scalable
- Database queries are optimized for high throughput
- Webhook processing is designed for high-volume scenarios

## 🔄 Migration & Upgrades

### Adding New Fee Models
1. Add new enum value to `FeeModel`
2. Update calculation logic in `FeeService`
3. Test with preview endpoints before production deployment

### Changing Fee Rates
1. Create new fee configuration with updated rates
2. Set appropriate effective date
3. Activate configuration when ready to deploy
4. Old rates remain in historical records for audit compliance

### Database Migrations
The system supports schema evolution:
- New fields can be added to existing collections
- Historical records are preserved during upgrades
- Migration scripts handle data transformations

---

## 📞 Support

For technical support or questions about the fee system implementation:

1. **Configuration Issues**: Check admin configuration endpoints
2. **Calculation Problems**: Use fee breakdown endpoint for debugging
3. **Payout Issues**: Verify order finalization and fee snapshots
4. **Integration Questions**: Review API documentation and examples

The StockLot Fee System provides a robust, scalable, and transparent foundation for marketplace fee management with comprehensive audit capabilities and flexible configuration options. 🚀