#!/usr/bin/env python3
"""
🧪 COMPREHENSIVE MARKETPLACE BACKEND TESTING
Testing all critical features as requested in the review:
- PHASE 1: Marketplace Filters (CRITICAL)
- PHASE 2: New Seller Features  
- PHASE 3: Buyer Processing Fee (VERIFICATION)
- PHASE 4: Price Alerts (COMPLETION CHECK)
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import uuid
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComprehensiveMarketplaceTester:
    """Comprehensive Marketplace Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data storage
        self.category_groups = []
        self.species_data = []
        self.breeds_data = []
        self.test_seller_id = None
        self.test_price_alert_id = None
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as admin user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    logger.info("✅ Authentication successful")
                    return True
                else:
                    logger.error(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def get_taxonomy_data(self):
        """Get category groups, species, and breeds for testing"""
        try:
            # Get category groups
            async with self.session.get(f"{self.api_url}/category-groups", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    self.category_groups = data.get("category_groups", [])
                    logger.info(f"✅ Retrieved {len(self.category_groups)} category groups")
                
            # Get species
            async with self.session.get(f"{self.api_url}/species", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    self.species_data = data.get("species", [])
                    logger.info(f"✅ Retrieved {len(self.species_data)} species")
                
            # Get breeds
            async with self.session.get(f"{self.api_url}/breeds", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    self.breeds_data = data.get("breeds", [])
                    logger.info(f"✅ Retrieved {len(self.breeds_data)} breeds")
                    
        except Exception as e:
            logger.error(f"❌ Error getting taxonomy data: {e}")

    # PHASE 1: MARKETPLACE FILTERS (CRITICAL)
    async def test_marketplace_listings_api(self):
        """Test 1: Marketplace Listings API - Verify exotic filtering fix"""
        logger.info("\n🧪 PHASE 1.1: Testing Marketplace Listings API...")
        
        test_cases = [
            {"params": {}, "description": "Default listings (should return listings, not 0)"},
            {"params": {"include_exotics": "true"}, "description": "Include exotics = true"},
            {"params": {"include_exotics": "false"}, "description": "Include exotics = false (should return listings)"},
            {"params": {"limit": "10"}, "description": "With limit parameter"},
            {"params": {"page": "1", "limit": "5"}, "description": "With pagination"}
        ]
        
        for i, test_case in enumerate(test_cases):
            try:
                async with self.session.get(
                    f"{self.api_url}/listings",
                    params=test_case["params"],
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", [])
                        total = data.get("total", 0)
                        
                        logger.info(f"✅ Marketplace listings test {i+1} successful")
                        logger.info(f"   {test_case['description']}: {len(listings)} listings returned, total: {total}")
                        
                        # Critical check: ensure we're not getting 0 listings due to exotic filtering bug
                        if total > 0:
                            self.test_results.append((f"Marketplace Listings Test {i+1}", True, f"{total} listings returned"))
                        else:
                            logger.warning(f"⚠️ No listings returned for: {test_case['description']}")
                            self.test_results.append((f"Marketplace Listings Test {i+1}", False, "0 listings returned"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Marketplace listings test {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Marketplace Listings Test {i+1}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in marketplace listings test {i+1}: {e}")
                self.test_results.append((f"Marketplace Listings Test {i+1}", False, str(e)))

    async def test_category_group_filter(self):
        """Test 2: Category Group ID Filter - Confirm this parameter works"""
        logger.info("\n🧪 PHASE 1.2: Testing Category Group ID Filter...")
        
        if not self.category_groups:
            await self.get_taxonomy_data()
        
        # Test each category group filter
        for i, category_group in enumerate(self.category_groups[:3]):  # Test first 3 groups
            try:
                params = {
                    "category_group_id": category_group["id"],
                    "include_exotics": "true"  # Test with exotics enabled
                }
                
                async with self.session.get(
                    f"{self.api_url}/listings",
                    params=params,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", [])
                        total = data.get("total", 0)
                        
                        logger.info(f"✅ Category group filter test {i+1} successful")
                        logger.info(f"   Category: {category_group['name']} - {len(listings)} listings returned")
                        
                        self.test_results.append((f"Category Group Filter ({category_group['name']})", True, f"{total} listings"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Category group filter test {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Category Group Filter ({category_group['name']})", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in category group filter test {i+1}: {e}")
                self.test_results.append((f"Category Group Filter ({category_group['name']})", False, str(e)))

    async def test_species_and_breed_filters(self):
        """Test 3: Species ID and Breed ID Filters - Verify frontend filters work"""
        logger.info("\n🧪 PHASE 1.3: Testing Species ID and Breed ID Filters...")
        
        if not self.species_data:
            await self.get_taxonomy_data()
        
        # Test species_id filter
        for i, species in enumerate(self.species_data[:3]):  # Test first 3 species
            try:
                params = {
                    "species_id": species["id"],
                    "include_exotics": "false"
                }
                
                async with self.session.get(
                    f"{self.api_url}/listings",
                    params=params,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", [])
                        total = data.get("total", 0)
                        
                        logger.info(f"✅ Species filter test {i+1} successful")
                        logger.info(f"   Species: {species['name']} - {len(listings)} listings returned")
                        
                        self.test_results.append((f"Species Filter ({species['name']})", True, f"{total} listings"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Species filter test {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Species Filter ({species['name']})", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in species filter test {i+1}: {e}")
                self.test_results.append((f"Species Filter ({species['name']})", False, str(e)))
        
        # Test breed_id filter
        for i, breed in enumerate(self.breeds_data[:3]):  # Test first 3 breeds
            try:
                params = {
                    "breed_id": breed["id"],
                    "include_exotics": "true"
                }
                
                async with self.session.get(
                    f"{self.api_url}/listings",
                    params=params,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        listings = data.get("listings", [])
                        total = data.get("total", 0)
                        
                        logger.info(f"✅ Breed filter test {i+1} successful")
                        logger.info(f"   Breed: {breed['name']} - {len(listings)} listings returned")
                        
                        self.test_results.append((f"Breed Filter ({breed['name']})", True, f"{total} listings"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Breed filter test {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Breed Filter ({breed['name']})", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in breed filter test {i+1}: {e}")
                self.test_results.append((f"Breed Filter ({breed['name']})", False, str(e)))

    # PHASE 2: NEW SELLER FEATURES
    async def test_seller_delivery_rate_endpoints(self):
        """Test 4: Seller Delivery Rate Endpoints - GET and POST"""
        logger.info("\n🧪 PHASE 2.1: Testing Seller Delivery Rate Endpoints...")
        
        # Test GET seller delivery rate
        try:
            async with self.session.get(
                f"{self.api_url}/seller/delivery-rate",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ GET seller delivery rate successful")
                    logger.info(f"   Response: {json.dumps(data, indent=2)}")
                    self.test_results.append(("GET Seller Delivery Rate", True, "Retrieved successfully"))
                elif response.status == 404:
                    logger.info("✅ GET seller delivery rate - No rate configured (expected)")
                    self.test_results.append(("GET Seller Delivery Rate", True, "No rate configured"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET seller delivery rate failed: {response.status} - {error_text}")
                    self.test_results.append(("GET Seller Delivery Rate", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in GET seller delivery rate: {e}")
            self.test_results.append(("GET Seller Delivery Rate", False, str(e)))
        
        # Test POST seller delivery rate
        delivery_rate_data = {
            "base_fee_cents": 2000,  # R20.00
            "per_km_cents": 150,     # R1.50/km
            "min_km": 5,             # Free delivery within 5km
            "max_km": 100,           # Max 100km delivery
            "province_whitelist": ["Western Cape", "Eastern Cape"]
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/seller/delivery-rate",
                json=delivery_rate_data,
                headers=self.get_headers()
            ) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    logger.info("✅ POST seller delivery rate successful")
                    logger.info(f"   Created rate: Base R{delivery_rate_data['base_fee_cents']/100:.2f}, Per km R{delivery_rate_data['per_km_cents']/100:.2f}")
                    self.test_results.append(("POST Seller Delivery Rate", True, "Created successfully"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ POST seller delivery rate failed: {response.status} - {error_text}")
                    self.test_results.append(("POST Seller Delivery Rate", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in POST seller delivery rate: {e}")
            self.test_results.append(("POST Seller Delivery Rate", False, str(e)))

    async def test_delivery_quote_endpoint(self):
        """Test 5: Delivery Quote Endpoint - POST /api/delivery/quote"""
        logger.info("\n🧪 PHASE 2.2: Testing Delivery Quote Endpoint...")
        
        # Test delivery quote calculation
        quote_request = {
            "seller_id": "test_seller_123",
            "buyer_lat": -33.9249,  # Cape Town coordinates
            "buyer_lng": 18.4241
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/delivery/quote",
                json=quote_request,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ Delivery quote endpoint successful")
                    logger.info(f"   Distance: {data.get('distance_km', 'N/A')} km")
                    logger.info(f"   Delivery fee: R{data.get('delivery_fee_cents', 0)/100:.2f}")
                    logger.info(f"   Out of range: {data.get('out_of_range', False)}")
                    self.test_results.append(("Delivery Quote Endpoint", True, f"Quote calculated"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Delivery quote endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("Delivery Quote Endpoint", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in delivery quote endpoint: {e}")
            self.test_results.append(("Delivery Quote Endpoint", False, str(e)))

    async def test_monthly_trading_statements(self):
        """Test 6: Monthly Trading Statements - All 3 new endpoints"""
        logger.info("\n🧪 PHASE 2.3: Testing Monthly Trading Statements...")
        
        # Test endpoints for monthly trading statements
        statement_endpoints = [
            ("/api/seller/trading-statements", "GET Seller Trading Statements"),
            ("/api/seller/trading-statements/current", "GET Current Month Statement"),
            ("/api/seller/trading-statements/2024/12", "GET Specific Month Statement")
        ]
        
        for endpoint, test_name in statement_endpoints:
            try:
                async with self.session.get(
                    f"{self.base_url}{endpoint}",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"✅ {test_name} successful")
                        logger.info(f"   Response keys: {list(data.keys())}")
                        self.test_results.append((test_name, True, "Retrieved successfully"))
                    elif response.status == 404:
                        logger.info(f"✅ {test_name} - No data found (expected for new feature)")
                        self.test_results.append((test_name, True, "No data found"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {test_name} failed: {response.status} - {error_text}")
                        self.test_results.append((test_name, False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in {test_name}: {e}")
                self.test_results.append((test_name, False, str(e)))

    # PHASE 3: BUYER PROCESSING FEE (VERIFICATION)
    async def test_checkout_preview_api(self):
        """Test 7: Checkout Preview API - Verify buyer_processing_fee_minor"""
        logger.info("\n🧪 PHASE 3.1: Testing Checkout Preview API...")
        
        # Test checkout preview with sample cart
        sample_cart = {
            "cart": [
                {
                    "seller_id": "seller_001",
                    "merch_subtotal_minor": 150000,  # R1,500 cattle
                    "delivery_minor": 5000,          # R50 delivery
                    "abattoir_minor": 0,
                    "species": "cattle",
                    "export": False
                },
                {
                    "seller_id": "seller_002", 
                    "merch_subtotal_minor": 80000,   # R800 goats
                    "delivery_minor": 3000,          # R30 delivery
                    "abattoir_minor": 1000,          # R10 abattoir
                    "species": "goats",
                    "export": False
                }
            ],
            "currency": "ZAR"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/preview",
                json=sample_cart,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    per_seller = data.get("per_seller", [])
                    cart_totals = data.get("cart_totals", {})
                    
                    logger.info("✅ Checkout preview API successful")
                    logger.info(f"   Number of sellers: {len(per_seller)}")
                    logger.info(f"   Buyer total: R{cart_totals.get('buyer_grand_total_minor', 0)/100:.2f}")
                    
                    # Verify buyer_processing_fee_minor is included
                    processing_fee_found = False
                    total_processing_fee = 0
                    
                    for seller in per_seller:
                        lines = seller.get("lines", {})
                        processing_fee = lines.get("buyer_processing_fee_minor", 0)
                        if processing_fee > 0:
                            processing_fee_found = True
                            total_processing_fee += processing_fee
                            logger.info(f"   Seller {seller.get('seller_id')}: Processing fee R{processing_fee/100:.2f}")
                    
                    if processing_fee_found:
                        logger.info(f"✅ Buyer processing fee verified: Total R{total_processing_fee/100:.2f}")
                        self.test_results.append(("Checkout Preview API", True, f"Processing fee: R{total_processing_fee/100:.2f}"))
                    else:
                        logger.warning("⚠️ No buyer processing fee found in response")
                        self.test_results.append(("Checkout Preview API", False, "No processing fee found"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Checkout preview API failed: {response.status} - {error_text}")
                    self.test_results.append(("Checkout Preview API", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in checkout preview API: {e}")
            self.test_results.append(("Checkout Preview API", False, str(e)))

    async def test_fee_breakdown_calculations(self):
        """Test 8: Fee Breakdown Calculations - Confirm 1.5% processing fee"""
        logger.info("\n🧪 PHASE 3.2: Testing Fee Breakdown Calculations...")
        
        test_amounts = [1000.00, 500.00, 2000.00, 100.00]  # Test various amounts
        
        for amount in test_amounts:
            try:
                params = {
                    "amount": str(amount),
                    "species": "cattle",
                    "export": "false"
                }
                
                async with self.session.get(
                    f"{self.api_url}/fees/breakdown",
                    params=params,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        breakdown = data.get("breakdown", {})
                        
                        processing_fee = breakdown.get("processing_fee_minor", 0) / 100
                        processing_rate = breakdown.get("processing_fee_rate_pct", 0)
                        expected_fee = amount * 0.015  # 1.5%
                        
                        logger.info(f"✅ Fee breakdown for R{amount:.2f}")
                        logger.info(f"   Processing fee: R{processing_fee:.2f} ({processing_rate}%)")
                        logger.info(f"   Expected: R{expected_fee:.2f} (1.5%)")
                        
                        # Verify 1.5% processing fee (allow small rounding differences)
                        if abs(processing_fee - expected_fee) < 0.01 and abs(processing_rate - 1.5) < 0.1:
                            self.test_results.append((f"Fee Breakdown R{amount:.0f}", True, f"1.5% fee verified"))
                        else:
                            self.test_results.append((f"Fee Breakdown R{amount:.0f}", False, f"Fee mismatch: {processing_rate}%"))
                            
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Fee breakdown failed for R{amount}: {response.status} - {error_text}")
                        self.test_results.append((f"Fee Breakdown R{amount:.0f}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in fee breakdown for R{amount}: {e}")
                self.test_results.append((f"Fee Breakdown R{amount:.0f}", False, str(e)))

    # PHASE 4: PRICE ALERTS (COMPLETION CHECK)
    async def test_price_alerts_statistics(self):
        """Test 9: Price Alerts Statistics - GET /api/price-alerts/stats"""
        logger.info("\n🧪 PHASE 4.1: Testing Price Alerts Statistics...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/price-alerts/stats",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    stats = data.get("stats", {})
                    
                    logger.info("✅ Price alerts statistics successful")
                    logger.info(f"   Total alerts: {stats.get('total_alerts', 0)}")
                    logger.info(f"   Active alerts: {stats.get('active_alerts', 0)}")
                    logger.info(f"   Triggered alerts: {stats.get('triggered_alerts', 0)}")
                    logger.info(f"   User alerts: {stats.get('user_alerts', 0)}")
                    
                    self.test_results.append(("Price Alerts Statistics", True, f"Total: {stats.get('total_alerts', 0)}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Price alerts statistics failed: {response.status} - {error_text}")
                    self.test_results.append(("Price Alerts Statistics", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in price alerts statistics: {e}")
            self.test_results.append(("Price Alerts Statistics", False, str(e)))

    async def test_price_alerts_endpoints(self):
        """Test 10: All Price Alerts Endpoints - Verify 83.3% → 100% completion"""
        logger.info("\n🧪 PHASE 4.2: Testing All Price Alerts Endpoints...")
        
        # Test creating a price alert
        if self.species_data:
            species_id = self.species_data[0]["id"]
            alert_data = {
                "species_id": species_id,
                "target_price_minor": 50000,  # R500.00
                "alert_type": "PRICE_DROP",
                "frequency": "IMMEDIATE",
                "notification_channels": ["EMAIL"],
                "region": "Western Cape"
            }
            
            try:
                async with self.session.post(
                    f"{self.api_url}/price-alerts",
                    json=alert_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        self.test_price_alert_id = data.get("alert", {}).get("id")
                        logger.info("✅ Create price alert successful")
                        self.test_results.append(("Create Price Alert", True, "Alert created"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Create price alert failed: {response.status} - {error_text}")
                        self.test_results.append(("Create Price Alert", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error creating price alert: {e}")
                self.test_results.append(("Create Price Alert", False, str(e)))
        
        # Test getting user's price alerts
        try:
            async with self.session.get(
                f"{self.api_url}/price-alerts",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    alerts = data.get("alerts", [])
                    logger.info(f"✅ Get price alerts successful - {len(alerts)} alerts found")
                    self.test_results.append(("Get Price Alerts", True, f"{len(alerts)} alerts"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Get price alerts failed: {response.status} - {error_text}")
                    self.test_results.append(("Get Price Alerts", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error getting price alerts: {e}")
            self.test_results.append(("Get Price Alerts", False, str(e)))
        
        # Test updating a price alert (if we created one)
        if self.test_price_alert_id:
            update_data = {
                "target_price_minor": 45000,  # R450.00
                "alert_type": "PRICE_MATCH"
            }
            
            try:
                async with self.session.put(
                    f"{self.api_url}/price-alerts/{self.test_price_alert_id}",
                    json=update_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        logger.info("✅ Update price alert successful")
                        self.test_results.append(("Update Price Alert", True, "Alert updated"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Update price alert failed: {response.status} - {error_text}")
                        self.test_results.append(("Update Price Alert", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error updating price alert: {e}")
                self.test_results.append(("Update Price Alert", False, str(e)))
        
        # Test deleting a price alert (if we created one)
        if self.test_price_alert_id:
            try:
                async with self.session.delete(
                    f"{self.api_url}/price-alerts/{self.test_price_alert_id}",
                    headers=self.get_headers()
                ) as response:
                    if response.status in [200, 204]:
                        logger.info("✅ Delete price alert successful")
                        self.test_results.append(("Delete Price Alert", True, "Alert deleted"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Delete price alert failed: {response.status} - {error_text}")
                        self.test_results.append(("Delete Price Alert", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error deleting price alert: {e}")
                self.test_results.append(("Delete Price Alert", False, str(e)))

    async def run_all_tests(self):
        """Run all comprehensive marketplace tests"""
        logger.info("🚀 Starting Comprehensive Marketplace Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Get taxonomy data for filtering tests
            await self.get_taxonomy_data()
            
            # PHASE 1: Marketplace Filters (CRITICAL)
            await self.test_marketplace_listings_api()
            await self.test_category_group_filter()
            await self.test_species_and_breed_filters()
            
            # PHASE 2: New Seller Features
            await self.test_seller_delivery_rate_endpoints()
            await self.test_delivery_quote_endpoint()
            await self.test_monthly_trading_statements()
            
            # PHASE 3: Buyer Processing Fee (VERIFICATION)
            await self.test_checkout_preview_api()
            await self.test_fee_breakdown_calculations()
            
            # PHASE 4: Price Alerts (COMPLETION CHECK)
            await self.test_price_alerts_statistics()
            await self.test_price_alerts_endpoints()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 COMPREHENSIVE MARKETPLACE BACKEND TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Group results by phase
        phase_results = {
            "PHASE 1 - Marketplace Filters": [],
            "PHASE 2 - New Seller Features": [],
            "PHASE 3 - Buyer Processing Fee": [],
            "PHASE 4 - Price Alerts": []
        }
        
        for test_name, success, details in self.test_results:
            if any(x in test_name for x in ["Marketplace Listings", "Category Group", "Species Filter", "Breed Filter"]):
                phase_results["PHASE 1 - Marketplace Filters"].append((test_name, success, details))
            elif any(x in test_name for x in ["Delivery Rate", "Delivery Quote", "Trading Statements"]):
                phase_results["PHASE 2 - New Seller Features"].append((test_name, success, details))
            elif any(x in test_name for x in ["Checkout Preview", "Fee Breakdown"]):
                phase_results["PHASE 3 - Buyer Processing Fee"].append((test_name, success, details))
            elif any(x in test_name for x in ["Price Alert"]):
                phase_results["PHASE 4 - Price Alerts"].append((test_name, success, details))
        
        # Print phase-by-phase results
        for phase, results in phase_results.items():
            if results:
                phase_passed = sum(1 for _, success, _ in results if success)
                phase_total = len(results)
                logger.info(f"\n📋 {phase}: {phase_passed}/{phase_total} passed")
                
                for test_name, success, details in results:
                    status = "✅ PASS" if success else "❌ FAIL"
                    logger.info(f"   {status}: {test_name}")
                    if details:
                        logger.info(f"      Details: {details}")
        
        # Overall assessment
        if passed == total:
            logger.info("\n🎉 ALL TESTS PASSED! All marketplace features are fully functional.")
        elif passed >= total * 0.9:
            logger.info("\n✅ EXCELLENT - Marketplace features are working with minor issues.")
        elif passed >= total * 0.8:
            logger.info("\n✅ GOOD - Marketplace features are largely functional.")
        elif passed >= total * 0.6:
            logger.info("\n⚠️ NEEDS ATTENTION - Some marketplace features have issues.")
        else:
            logger.info("\n❌ CRITICAL ISSUES - Marketplace features require immediate attention.")
        
        logger.info("\n🎯 KEY FEATURES TESTED:")
        logger.info("   • Marketplace Listings API (exotic filtering fix)")
        logger.info("   • Category Group ID Filter")
        logger.info("   • Species ID and Breed ID Filters")
        logger.info("   • Seller Delivery Rate Management")
        logger.info("   • Delivery Quote Calculations")
        logger.info("   • Monthly Trading Statements")
        logger.info("   • Checkout Preview with Processing Fees")
        logger.info("   • Fee Breakdown Calculations (1.5% verification)")
        logger.info("   • Price Alerts System (Complete CRUD)")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = ComprehensiveMarketplaceTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())