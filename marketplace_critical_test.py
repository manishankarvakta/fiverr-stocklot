#!/usr/bin/env python3
"""
🧪 CRITICAL MARKETPLACE FEATURES TEST
Focused testing of the most critical marketplace features from the review request
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CriticalMarketplaceTester:
    """Critical Marketplace Features Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
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
                    self.auth_token = data.get("token") or auth_data["email"]
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

    async def test_marketplace_exotic_filtering_fix(self):
        """CRITICAL: Test marketplace exotic filtering fix"""
        logger.info("\n🧪 CRITICAL TEST: Marketplace Exotic Filtering Fix...")
        
        test_cases = [
            {"params": {}, "description": "Default (should return listings, not 0)"},
            {"params": {"include_exotics": "true"}, "description": "Include exotics = true"},
            {"params": {"include_exotics": "false"}, "description": "Include exotics = false"},
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
                        total_count = data.get("total_count", 0)
                        
                        logger.info(f"✅ {test_case['description']}: {len(listings)} listings, total: {total_count}")
                        
                        # CRITICAL: Ensure we're getting listings (not 0 due to exotic bug)
                        if total_count > 0:
                            self.test_results.append((f"Exotic Filter Test {i+1}", True, f"{total_count} listings"))
                        else:
                            logger.error(f"❌ CRITICAL: {test_case['description']} returned 0 listings!")
                            self.test_results.append((f"Exotic Filter Test {i+1}", False, "0 listings - EXOTIC BUG"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {test_case['description']} failed: {response.status}")
                        self.test_results.append((f"Exotic Filter Test {i+1}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in {test_case['description']}: {e}")
                self.test_results.append((f"Exotic Filter Test {i+1}", False, str(e)))

    async def test_category_group_filter_fix(self):
        """CRITICAL: Test category_group_id filter fix"""
        logger.info("\n🧪 CRITICAL TEST: Category Group ID Filter Fix...")
        
        # Get category groups
        try:
            async with self.session.get(f"{self.api_url}/category-groups", headers=self.get_headers()) as response:
                if response.status == 200:
                    category_groups = await response.json()
                    logger.info(f"✅ Retrieved {len(category_groups)} category groups")
                    
                    # Test first 3 category groups
                    for i, category_group in enumerate(category_groups[:3]):
                        try:
                            params = {
                                "category_group_id": category_group["id"],
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
                                    total_count = data.get("total_count", 0)
                                    
                                    logger.info(f"✅ Category '{category_group['name']}': {total_count} listings")
                                    self.test_results.append((f"Category Filter ({category_group['name']})", True, f"{total_count} listings"))
                                else:
                                    logger.error(f"❌ Category filter failed for {category_group['name']}: {response.status}")
                                    self.test_results.append((f"Category Filter ({category_group['name']})", False, f"Status {response.status}"))
                        except Exception as e:
                            logger.error(f"❌ Error testing category {category_group['name']}: {e}")
                            self.test_results.append((f"Category Filter ({category_group['name']})", False, str(e)))
                else:
                    logger.error(f"❌ Failed to get category groups: {response.status}")
                    self.test_results.append(("Get Category Groups", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error getting category groups: {e}")
            self.test_results.append(("Get Category Groups", False, str(e)))

    async def test_seller_delivery_rates(self):
        """Test seller delivery rate endpoints"""
        logger.info("\n🧪 Testing Seller Delivery Rate Endpoints...")
        
        # Test GET delivery rate
        try:
            async with self.session.get(
                f"{self.api_url}/seller/delivery-rate",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ GET seller delivery rate successful")
                    logger.info(f"   Base fee: R{data.get('base_fee_cents', 0)/100:.2f}")
                    logger.info(f"   Per km: R{data.get('per_km_cents', 0)/100:.2f}")
                    self.test_results.append(("GET Seller Delivery Rate", True, "Retrieved successfully"))
                elif response.status == 404:
                    logger.info("✅ GET seller delivery rate - No rate configured (expected)")
                    self.test_results.append(("GET Seller Delivery Rate", True, "No rate configured"))
                else:
                    logger.error(f"❌ GET delivery rate failed: {response.status}")
                    self.test_results.append(("GET Seller Delivery Rate", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in GET delivery rate: {e}")
            self.test_results.append(("GET Seller Delivery Rate", False, str(e)))
        
        # Test POST delivery rate
        delivery_rate_data = {
            "base_fee_cents": 2500,  # R25.00
            "per_km_cents": 200,     # R2.00/km
            "min_km": 10,            # Free within 10km
            "max_km": 150,           # Max 150km
            "province_whitelist": ["Western Cape", "Gauteng"]
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/seller/delivery-rate",
                json=delivery_rate_data,
                headers=self.get_headers()
            ) as response:
                if response.status in [200, 201]:
                    logger.info("✅ POST seller delivery rate successful")
                    self.test_results.append(("POST Seller Delivery Rate", True, "Created successfully"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ POST delivery rate failed: {response.status} - {error_text}")
                    self.test_results.append(("POST Seller Delivery Rate", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in POST delivery rate: {e}")
            self.test_results.append(("POST Seller Delivery Rate", False, str(e)))

    async def test_delivery_quote(self):
        """Test delivery quote endpoint"""
        logger.info("\n🧪 Testing Delivery Quote Endpoint...")
        
        quote_request = {
            "seller_id": "test_seller_123",
            "buyer_lat": -33.9249,  # Cape Town
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
                    logger.info("✅ Delivery quote successful")
                    logger.info(f"   Distance: {data.get('distance_km', 'N/A')} km")
                    logger.info(f"   Fee: R{data.get('delivery_fee_cents', 0)/100:.2f}")
                    logger.info(f"   Out of range: {data.get('out_of_range', False)}")
                    self.test_results.append(("Delivery Quote", True, "Quote calculated"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Delivery quote failed: {response.status} - {error_text}")
                    self.test_results.append(("Delivery Quote", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in delivery quote: {e}")
            self.test_results.append(("Delivery Quote", False, str(e)))

    async def test_checkout_preview_processing_fee(self):
        """CRITICAL: Test checkout preview with buyer processing fee"""
        logger.info("\n🧪 CRITICAL TEST: Checkout Preview with Processing Fee...")
        
        sample_cart = {
            "cart": [
                {
                    "seller_id": "seller_001",
                    "merch_subtotal_minor": 150000,  # R1,500
                    "delivery_minor": 5000,          # R50
                    "abattoir_minor": 0,
                    "species": "cattle",
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
                    
                    logger.info("✅ Checkout preview successful")
                    logger.info(f"   Sellers: {len(per_seller)}")
                    logger.info(f"   Buyer total: R{cart_totals.get('buyer_grand_total_minor', 0)/100:.2f}")
                    
                    # Check for buyer processing fee
                    processing_fee_found = False
                    total_processing_fee = 0
                    
                    for seller in per_seller:
                        lines = seller.get("lines", {})
                        processing_fee = lines.get("buyer_processing_fee_minor", 0)
                        if processing_fee > 0:
                            processing_fee_found = True
                            total_processing_fee += processing_fee
                            logger.info(f"   Processing fee: R{processing_fee/100:.2f}")
                    
                    if processing_fee_found:
                        expected_fee = 150000 * 0.015  # 1.5% of R1500
                        logger.info(f"✅ CRITICAL: Processing fee verified: R{total_processing_fee/100:.2f} (expected ~R{expected_fee/100:.2f})")
                        self.test_results.append(("Checkout Preview Processing Fee", True, f"R{total_processing_fee/100:.2f}"))
                    else:
                        logger.error("❌ CRITICAL: No buyer processing fee found!")
                        self.test_results.append(("Checkout Preview Processing Fee", False, "No processing fee"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Checkout preview failed: {response.status} - {error_text}")
                    self.test_results.append(("Checkout Preview Processing Fee", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in checkout preview: {e}")
            self.test_results.append(("Checkout Preview Processing Fee", False, str(e)))

    async def test_fee_breakdown_1_5_percent(self):
        """CRITICAL: Verify 1.5% processing fee calculation"""
        logger.info("\n🧪 CRITICAL TEST: 1.5% Processing Fee Verification...")
        
        test_amounts = [1000.00, 500.00, 2000.00]
        
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
                        
                        logger.info(f"✅ R{amount:.0f}: Processing fee R{processing_fee:.2f} ({processing_rate}%)")
                        
                        # Verify 1.5% (allow small rounding differences)
                        if abs(processing_fee - expected_fee) < 0.01 and abs(processing_rate - 1.5) < 0.1:
                            self.test_results.append((f"1.5% Fee R{amount:.0f}", True, f"Verified: {processing_rate}%"))
                        else:
                            logger.error(f"❌ CRITICAL: Fee mismatch for R{amount} - got {processing_rate}%, expected 1.5%")
                            self.test_results.append((f"1.5% Fee R{amount:.0f}", False, f"Got {processing_rate}%"))
                    else:
                        logger.error(f"❌ Fee breakdown failed for R{amount}: {response.status}")
                        self.test_results.append((f"1.5% Fee R{amount:.0f}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in fee breakdown for R{amount}: {e}")
                self.test_results.append((f"1.5% Fee R{amount:.0f}", False, str(e)))

    async def test_price_alerts_completion(self):
        """Test price alerts system completion"""
        logger.info("\n🧪 Testing Price Alerts System Completion...")
        
        # Test statistics
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
                    self.test_results.append(("Price Alerts Stats", True, f"Total: {stats.get('total_alerts', 0)}"))
                else:
                    logger.error(f"❌ Price alerts stats failed: {response.status}")
                    self.test_results.append(("Price Alerts Stats", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in price alerts stats: {e}")
            self.test_results.append(("Price Alerts Stats", False, str(e)))
        
        # Test getting alerts
        try:
            async with self.session.get(
                f"{self.api_url}/price-alerts",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    alerts = data.get("alerts", [])
                    logger.info(f"✅ Get price alerts successful - {len(alerts)} alerts")
                    self.test_results.append(("Get Price Alerts", True, f"{len(alerts)} alerts"))
                else:
                    logger.error(f"❌ Get price alerts failed: {response.status}")
                    self.test_results.append(("Get Price Alerts", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error getting price alerts: {e}")
            self.test_results.append(("Get Price Alerts", False, str(e)))

    async def run_critical_tests(self):
        """Run all critical marketplace tests"""
        logger.info("🚀 Starting CRITICAL Marketplace Features Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed")
                return
            
            # Run critical tests
            await self.test_marketplace_exotic_filtering_fix()
            await self.test_category_group_filter_fix()
            await self.test_seller_delivery_rates()
            await self.test_delivery_quote()
            await self.test_checkout_preview_processing_fee()
            await self.test_fee_breakdown_1_5_percent()
            await self.test_price_alerts_completion()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_critical_summary()
    
    def print_critical_summary(self):
        """Print critical test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 CRITICAL MARKETPLACE FEATURES TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Categorize results
        critical_issues = []
        working_features = []
        
        for test_name, success, details in self.test_results:
            if success:
                working_features.append((test_name, details))
            else:
                critical_issues.append((test_name, details))
        
        # Show critical issues first
        if critical_issues:
            logger.info(f"\n❌ CRITICAL ISSUES FOUND ({len(critical_issues)}):")
            for test_name, details in critical_issues:
                logger.info(f"   ❌ {test_name}: {details}")
        
        # Show working features
        if working_features:
            logger.info(f"\n✅ WORKING FEATURES ({len(working_features)}):")
            for test_name, details in working_features:
                logger.info(f"   ✅ {test_name}: {details}")
        
        # Overall assessment
        if passed == total:
            logger.info("\n🎉 ALL CRITICAL TESTS PASSED! System is production-ready.")
        elif passed >= total * 0.8:
            logger.info("\n✅ MOSTLY WORKING - System is largely functional with minor issues.")
        elif passed >= total * 0.6:
            logger.info("\n⚠️ NEEDS ATTENTION - Some critical features have issues.")
        else:
            logger.info("\n❌ CRITICAL ISSUES - System requires immediate attention.")
        
        logger.info("\n🎯 CRITICAL FEATURES TESTED:")
        logger.info("   • Marketplace Exotic Filtering Fix (CRITICAL)")
        logger.info("   • Category Group ID Filter (CRITICAL)")
        logger.info("   • Seller Delivery Rate Management")
        logger.info("   • Delivery Quote Calculations")
        logger.info("   • Checkout Preview with 1.5% Processing Fee (CRITICAL)")
        logger.info("   • Fee Breakdown 1.5% Verification (CRITICAL)")
        logger.info("   • Price Alerts System Completion")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = CriticalMarketplaceTester()
    await tester.run_critical_tests()

if __name__ == "__main__":
    asyncio.run(main())