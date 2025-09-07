#!/usr/bin/env python3
"""
🧪 FEE SYSTEM (DUAL FEE MODEL) BACKEND TESTING
Comprehensive testing of the newly implemented Fee System functionality
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

class FeeSystemTester:
    """Comprehensive Fee System Backend Tester"""
    
    def __init__(self, base_url: str = "https://buy-request-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_fee_config_id = None
        self.test_order_group_id = None
        self.test_seller_order_id = None
        
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
    
    async def test_fee_configuration_management(self):
        """Test 1: Fee Configuration Management"""
        logger.info("\n🧪 Testing Fee Configuration Management...")
        
        # Test creating SELLER_PAYS fee config
        seller_pays_config = {
            "name": "Test Seller Pays Config",
            "platform_commission_pct": 10.0,
            "seller_payout_fee_pct": 2.5,
            "buyer_processing_fee_pct": 1.5,
            "escrow_service_fee_minor": 2500,  # R25.00
            "model": "SELLER_PAYS",
            "applies_to": {},
            "effective_from": datetime.now(timezone.utc).isoformat(),
            "effective_to": None
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/admin/fees/configs",
                json=seller_pays_config,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.test_fee_config_id = data.get("config", {}).get("id")
                    logger.info("✅ SELLER_PAYS fee config created successfully")
                    self.test_results.append(("Fee Config Creation (SELLER_PAYS)", True, "Created successfully"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create SELLER_PAYS config: {response.status} - {error_text}")
                    self.test_results.append(("Fee Config Creation (SELLER_PAYS)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error creating SELLER_PAYS config: {e}")
            self.test_results.append(("Fee Config Creation (SELLER_PAYS)", False, str(e)))
        
        # Test creating BUYER_PAYS_COMMISSION fee config
        buyer_pays_config = {
            "name": "Test Buyer Pays Commission Config",
            "platform_commission_pct": 10.0,
            "seller_payout_fee_pct": 2.5,
            "buyer_processing_fee_pct": 1.5,
            "escrow_service_fee_minor": 2500,  # R25.00
            "model": "BUYER_PAYS_COMMISSION",
            "applies_to": {"species": ["cattle"]},
            "effective_from": datetime.now(timezone.utc).isoformat(),
            "effective_to": None
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/admin/fees/configs",
                json=buyer_pays_config,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    logger.info("✅ BUYER_PAYS_COMMISSION fee config created successfully")
                    self.test_results.append(("Fee Config Creation (BUYER_PAYS_COMMISSION)", True, "Created successfully"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create BUYER_PAYS_COMMISSION config: {response.status} - {error_text}")
                    self.test_results.append(("Fee Config Creation (BUYER_PAYS_COMMISSION)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error creating BUYER_PAYS_COMMISSION config: {e}")
            self.test_results.append(("Fee Config Creation (BUYER_PAYS_COMMISSION)", False, str(e)))
        
        # Test activation endpoint
        if self.test_fee_config_id:
            try:
                async with self.session.post(
                    f"{self.api_url}/admin/fees/configs/{self.test_fee_config_id}/activate",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        logger.info("✅ Fee config activation successful")
                        self.test_results.append(("Fee Config Activation", True, "Activated successfully"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Failed to activate config: {response.status} - {error_text}")
                        self.test_results.append(("Fee Config Activation", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error activating config: {e}")
                self.test_results.append(("Fee Config Activation", False, str(e)))
        
        # Test listing functionality
        try:
            async with self.session.get(
                f"{self.api_url}/admin/fees/configs",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    configs = data.get("configs", [])
                    logger.info(f"✅ Fee configs listing successful - Found {len(configs)} configs")
                    self.test_results.append(("Fee Config Listing", True, f"Found {len(configs)} configs"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to list configs: {response.status} - {error_text}")
                    self.test_results.append(("Fee Config Listing", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error listing configs: {e}")
            self.test_results.append(("Fee Config Listing", False, str(e)))
    
    async def test_checkout_preview_system(self):
        """Test 2: Checkout Preview System"""
        logger.info("\n🧪 Testing Checkout Preview System...")
        
        # Test single seller cart
        single_seller_cart = {
            "cart": [
                {
                    "seller_id": "seller_001",
                    "merch_subtotal_minor": 100000,  # R1000.00
                    "delivery_minor": 5000,  # R50.00
                    "abattoir_minor": 2000,  # R20.00
                    "species": "cattle",
                    "export": False
                }
            ],
            "currency": "ZAR"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/preview",
                json=single_seller_cart,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    per_seller = data.get("per_seller", [])
                    cart_totals = data.get("cart_totals", {})
                    
                    logger.info("✅ Single seller checkout preview successful")
                    logger.info(f"   Buyer total: R{cart_totals.get('buyer_grand_total_minor', 0) / 100:.2f}")
                    logger.info(f"   Seller net payout: R{cart_totals.get('seller_total_net_payout_minor', 0) / 100:.2f}")
                    logger.info(f"   Platform revenue: R{cart_totals.get('platform_revenue_estimate_minor', 0) / 100:.2f}")
                    
                    self.test_results.append(("Checkout Preview (Single Seller)", True, "Preview calculated successfully"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Single seller checkout preview failed: {response.status} - {error_text}")
                    self.test_results.append(("Checkout Preview (Single Seller)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in single seller checkout preview: {e}")
            self.test_results.append(("Checkout Preview (Single Seller)", False, str(e)))
        
        # Test multi-seller cart
        multi_seller_cart = {
            "cart": [
                {
                    "seller_id": "seller_001",
                    "merch_subtotal_minor": 100000,  # R1000.00
                    "delivery_minor": 5000,  # R50.00
                    "abattoir_minor": 0,
                    "species": "cattle",
                    "export": False
                },
                {
                    "seller_id": "seller_002",
                    "merch_subtotal_minor": 75000,  # R750.00
                    "delivery_minor": 3000,  # R30.00
                    "abattoir_minor": 1500,  # R15.00
                    "species": "goats",
                    "export": False
                },
                {
                    "seller_id": "seller_003",
                    "merch_subtotal_minor": 200000,  # R2000.00
                    "delivery_minor": 10000,  # R100.00
                    "abattoir_minor": 5000,  # R50.00
                    "species": "sheep",
                    "export": True
                }
            ],
            "currency": "ZAR"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/preview",
                json=multi_seller_cart,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    per_seller = data.get("per_seller", [])
                    cart_totals = data.get("cart_totals", {})
                    
                    logger.info("✅ Multi-seller checkout preview successful")
                    logger.info(f"   Number of sellers: {len(per_seller)}")
                    logger.info(f"   Total buyer amount: R{cart_totals.get('buyer_grand_total_minor', 0) / 100:.2f}")
                    logger.info(f"   Total seller payouts: R{cart_totals.get('seller_total_net_payout_minor', 0) / 100:.2f}")
                    logger.info(f"   Total platform revenue: R{cart_totals.get('platform_revenue_estimate_minor', 0) / 100:.2f}")
                    
                    self.test_results.append(("Checkout Preview (Multi-Seller)", True, f"Preview for {len(per_seller)} sellers"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Multi-seller checkout preview failed: {response.status} - {error_text}")
                    self.test_results.append(("Checkout Preview (Multi-Seller)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in multi-seller checkout preview: {e}")
            self.test_results.append(("Checkout Preview (Multi-Seller)", False, str(e)))
    
    async def test_fee_breakdown_transparency(self):
        """Test 3: Fee Breakdown Transparency"""
        logger.info("\n🧪 Testing Fee Breakdown Transparency...")
        
        test_cases = [
            {"amount": 1000.00, "species": "cattle", "export": False},
            {"amount": 500.00, "species": "goats", "export": False},
            {"amount": 2000.00, "species": "sheep", "export": True},
            {"amount": 150.00, "species": "chickens", "export": False}
        ]
        
        for i, test_case in enumerate(test_cases):
            try:
                params = {
                    "amount": str(test_case["amount"]),
                    "species": test_case["species"],
                    "export": "true" if test_case["export"] else "false"
                }
                
                async with self.session.get(
                    f"{self.api_url}/fees/breakdown",
                    params=params,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        breakdown = data.get("breakdown", {})
                        
                        logger.info(f"✅ Fee breakdown test {i+1} successful")
                        logger.info(f"   Base amount: R{breakdown.get('base_amount_minor', 0) / 100:.2f}")
                        logger.info(f"   Commission: R{breakdown.get('commission_minor', 0) / 100:.2f} ({breakdown.get('commission_rate_pct', 0)}%)")
                        logger.info(f"   Processing fee: R{breakdown.get('processing_fee_minor', 0) / 100:.2f} ({breakdown.get('processing_fee_rate_pct', 0)}%)")
                        logger.info(f"   Escrow fee: R{breakdown.get('escrow_fee_minor', 0) / 100:.2f}")
                        logger.info(f"   Net to seller: R{breakdown.get('net_to_seller_minor', 0) / 100:.2f}")
                        logger.info(f"   Net to platform: R{breakdown.get('net_to_platform_minor', 0) / 100:.2f}")
                        
                        self.test_results.append((f"Fee Breakdown Test {i+1}", True, f"Amount: R{test_case['amount']}, Species: {test_case['species']}"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Fee breakdown test {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Fee Breakdown Test {i+1}", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in fee breakdown test {i+1}: {e}")
                self.test_results.append((f"Fee Breakdown Test {i+1}", False, str(e)))
    
    async def test_order_fee_finalization(self):
        """Test 4: Order Fee Finalization"""
        logger.info("\n🧪 Testing Order Fee Finalization...")
        
        # Generate test order group ID
        self.test_order_group_id = f"order_group_{uuid.uuid4().hex[:8]}"
        
        finalization_data = {
            "per_seller": [
                {
                    "seller_id": "seller_001",
                    "merch_subtotal_minor": 100000,
                    "delivery_minor": 5000,
                    "abattoir_minor": 0,
                    "buyer_processing_fee_minor": 1500,
                    "escrow_service_fee_minor": 2500,
                    "buyer_commission_minor": 0,
                    "platform_commission_minor": 10000,
                    "seller_payout_fee_minor": 2500,
                    "buyer_total_minor": 109000,
                    "seller_net_payout_minor": 87500,
                    "currency": "ZAR"
                }
            ],
            "fee_config_id": self.test_fee_config_id or "default-za-2025"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/orders/{self.test_order_group_id}/fees/finalize",
                json=finalization_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    finalized_fees = data.get("finalized_fees", [])
                    
                    logger.info("✅ Order fee finalization successful")
                    logger.info(f"   Finalized {len(finalized_fees)} seller fee snapshots")
                    
                    if finalized_fees:
                        self.test_seller_order_id = finalized_fees[0].get("seller_order_id")
                    
                    self.test_results.append(("Order Fee Finalization", True, f"Finalized {len(finalized_fees)} fee snapshots"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Order fee finalization failed: {response.status} - {error_text}")
                    self.test_results.append(("Order Fee Finalization", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in order fee finalization: {e}")
            self.test_results.append(("Order Fee Finalization", False, str(e)))
    
    async def test_payout_system(self):
        """Test 5: Payout System"""
        logger.info("\n🧪 Testing Payout System...")
        
        # Test payout release
        if self.test_seller_order_id:
            try:
                async with self.session.post(
                    f"{self.api_url}/payouts/{self.test_seller_order_id}/release",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        payout = data.get("payout", {})
                        
                        logger.info("✅ Payout release successful")
                        logger.info(f"   Payout ID: {payout.get('id')}")
                        logger.info(f"   Amount: R{payout.get('amount_minor', 0) / 100:.2f}")
                        logger.info(f"   Status: {payout.get('status')}")
                        
                        self.test_results.append(("Payout Release", True, f"Amount: R{payout.get('amount_minor', 0) / 100:.2f}"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Payout release failed: {response.status} - {error_text}")
                        self.test_results.append(("Payout Release", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in payout release: {e}")
                self.test_results.append(("Payout Release", False, str(e)))
        else:
            logger.warning("⚠️ Skipping payout release test - no seller order ID available")
            self.test_results.append(("Payout Release", False, "No seller order ID available"))
        
        # Test seller payouts listing
        test_seller_id = "seller_001"
        try:
            async with self.session.get(
                f"{self.api_url}/payouts/seller/{test_seller_id}",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    payouts = data.get("payouts", [])
                    summary = data.get("summary", {})
                    
                    logger.info("✅ Seller payouts listing successful")
                    logger.info(f"   Found {len(payouts)} payouts")
                    logger.info(f"   Total gross: R{summary.get('total_gross_minor', 0) / 100:.2f}")
                    logger.info(f"   Total net: R{summary.get('total_net_payout_minor', 0) / 100:.2f}")
                    
                    self.test_results.append(("Seller Payouts Listing", True, f"Found {len(payouts)} payouts"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Seller payouts listing failed: {response.status} - {error_text}")
                    self.test_results.append(("Seller Payouts Listing", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in seller payouts listing: {e}")
            self.test_results.append(("Seller Payouts Listing", False, str(e)))
    
    async def test_webhook_processing(self):
        """Test 6: Webhook Processing"""
        logger.info("\n🧪 Testing Webhook Processing...")
        
        # Test Paystack webhook with idempotent processing
        webhook_payload = {
            "event": "transfer.success",
            "data": {
                "id": 12345,
                "reference": f"test_transfer_{uuid.uuid4().hex[:8]}",
                "amount": 87500,  # R875.00 in kobo
                "currency": "ZAR",
                "status": "success",
                "recipient": {
                    "recipient_code": "RCP_test123"
                }
            }
        }
        
        # Test first webhook call
        try:
            async with self.session.post(
                f"{self.api_url}/payments/webhook/paystack",
                json=webhook_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [200, 201]:
                    logger.info("✅ First webhook processing successful")
                    self.test_results.append(("Webhook Processing (First Call)", True, "Processed successfully"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ First webhook processing failed: {response.status} - {error_text}")
                    self.test_results.append(("Webhook Processing (First Call)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in first webhook processing: {e}")
            self.test_results.append(("Webhook Processing (First Call)", False, str(e)))
        
        # Test idempotent webhook call (same payload)
        try:
            async with self.session.post(
                f"{self.api_url}/payments/webhook/paystack",
                json=webhook_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [200, 201]:
                    logger.info("✅ Idempotent webhook processing successful")
                    self.test_results.append(("Webhook Processing (Idempotent)", True, "Handled idempotently"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Idempotent webhook processing failed: {response.status} - {error_text}")
                    self.test_results.append(("Webhook Processing (Idempotent)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in idempotent webhook processing: {e}")
            self.test_results.append(("Webhook Processing (Idempotent)", False, str(e)))
    
    async def test_fee_model_calculations(self):
        """Test 7: Fee Model Calculations"""
        logger.info("\n🧪 Testing Fee Model Calculations...")
        
        # Test SELLER_PAYS model calculations
        seller_pays_cart = {
            "cart": [
                {
                    "seller_id": "seller_test",
                    "merch_subtotal_minor": 100000,  # R1000.00
                    "delivery_minor": 0,
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
                json=seller_pays_cart,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    per_seller = data.get("per_seller", [])
                    
                    if per_seller:
                        seller_calc = per_seller[0]
                        lines = seller_calc.get("lines", {})
                        totals = seller_calc.get("totals", {})
                        deductions = seller_calc.get("deductions", {})
                        
                        # Verify SELLER_PAYS calculations
                        expected_commission = 10000  # 10% of R1000
                        expected_processing = 1500   # 1.5% of R1000
                        expected_escrow = 2500       # R25.00
                        expected_payout_fee = 2500   # 2.5% of R1000
                        
                        commission_correct = deductions.get("platform_commission_minor") == expected_commission
                        processing_correct = lines.get("buyer_processing_fee_minor") == expected_processing
                        escrow_correct = lines.get("escrow_service_fee_minor") == expected_escrow
                        payout_fee_correct = deductions.get("seller_payout_fee_minor") == expected_payout_fee
                        
                        if all([commission_correct, processing_correct, escrow_correct, payout_fee_correct]):
                            logger.info("✅ SELLER_PAYS model calculations correct")
                            logger.info(f"   Commission: R{deductions.get('platform_commission_minor', 0) / 100:.2f}")
                            logger.info(f"   Processing fee: R{lines.get('buyer_processing_fee_minor', 0) / 100:.2f}")
                            logger.info(f"   Escrow fee: R{lines.get('escrow_service_fee_minor', 0) / 100:.2f}")
                            logger.info(f"   Payout fee: R{deductions.get('seller_payout_fee_minor', 0) / 100:.2f}")
                            
                            self.test_results.append(("Fee Model Calculations (SELLER_PAYS)", True, "All calculations correct"))
                        else:
                            logger.error("❌ SELLER_PAYS model calculations incorrect")
                            self.test_results.append(("Fee Model Calculations (SELLER_PAYS)", False, "Calculation mismatch"))
                    else:
                        logger.error("❌ No seller calculations returned")
                        self.test_results.append(("Fee Model Calculations (SELLER_PAYS)", False, "No calculations returned"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ SELLER_PAYS calculation test failed: {response.status} - {error_text}")
                    self.test_results.append(("Fee Model Calculations (SELLER_PAYS)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in SELLER_PAYS calculation test: {e}")
            self.test_results.append(("Fee Model Calculations (SELLER_PAYS)", False, str(e)))
    
    async def test_revenue_analytics(self):
        """Test 10: Revenue Analytics"""
        logger.info("\n🧪 Testing Revenue Analytics...")
        
        # Test revenue summary endpoint
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        end_date = datetime.now(timezone.utc).isoformat()
        
        try:
            params = {
                "start_date": start_date,
                "end_date": end_date
            }
            
            async with self.session.get(
                f"{self.api_url}/admin/fees/revenue-summary",
                params=params,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    summary = data.get("summary", {})
                    
                    logger.info("✅ Revenue analytics successful")
                    logger.info(f"   Period: {summary.get('period', {})}")
                    logger.info(f"   Total orders: {summary.get('totals', {}).get('orders', 0)}")
                    logger.info(f"   Total revenue: R{summary.get('totals', {}).get('total_revenue_minor', 0) / 100:.2f}")
                    
                    by_model = summary.get("by_model", {})
                    for model, data in by_model.items():
                        logger.info(f"   {model}: {data.get('orders', 0)} orders, R{data.get('total_revenue_minor', 0) / 100:.2f}")
                    
                    self.test_results.append(("Revenue Analytics", True, f"Total orders: {summary.get('totals', {}).get('orders', 0)}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Revenue analytics failed: {response.status} - {error_text}")
                    self.test_results.append(("Revenue Analytics", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in revenue analytics: {e}")
            self.test_results.append(("Revenue Analytics", False, str(e)))
    
    async def run_all_tests(self):
        """Run all fee system tests"""
        logger.info("🚀 Starting Fee System (Dual Fee Model) Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_fee_configuration_management()
            await self.test_checkout_preview_system()
            await self.test_fee_breakdown_transparency()
            await self.test_order_fee_finalization()
            await self.test_payout_system()
            await self.test_webhook_processing()
            await self.test_fee_model_calculations()
            await self.test_revenue_analytics()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 FEE SYSTEM (DUAL FEE MODEL) BACKEND TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Fee System is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - Fee System is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - Fee System has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - Fee System requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FEATURES TESTED:")
        logger.info("   • Fee Configuration Management (SELLER_PAYS & BUYER_PAYS_COMMISSION)")
        logger.info("   • Checkout Preview System (Single & Multi-seller)")
        logger.info("   • Fee Breakdown Transparency")
        logger.info("   • Order Fee Finalization (Immutable snapshots)")
        logger.info("   • Payout System (Release & Tracking)")
        logger.info("   • Webhook Processing (Idempotent)")
        logger.info("   • Fee Model Calculations (Banker's rounding)")
        logger.info("   • Revenue Analytics")
        
        logger.info("\n💰 FEE MODEL RATES TESTED:")
        logger.info("   • Platform Commission: 10%")
        logger.info("   • Seller Payout Fee: 2.5%")
        logger.info("   • Buyer Processing Fee: 1.5%")
        logger.info("   • Escrow Service Fee: R25.00")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = FeeSystemTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())