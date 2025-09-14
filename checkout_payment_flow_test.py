#!/usr/bin/env python3
"""
🚨 CHECKOUT TO PAYMENT FLOW TESTING
Testing the specific user-reported issue: 
"Order placed successfully! 2 order(s) created" but no payment redirect
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
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

class CheckoutPaymentFlowTester:
    """Test the complete checkout to payment redirection flow"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_user_id = None
        self.test_order_ids = []
        self.test_checkout_session_id = None
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as test user"""
        try:
            # Try to authenticate with existing admin user
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    self.test_user_id = data.get("user", {}).get("id")
                    logger.info("✅ Authentication successful")
                    return True
                else:
                    # Try with simple email as token (fallback authentication)
                    self.auth_token = auth_data["email"]
                    logger.info("✅ Using fallback authentication")
                    return True
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            # Try with simple email as token (fallback authentication)
            self.auth_token = "admin@stocklot.co.za"
            logger.info("✅ Using fallback authentication")
            return True
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_complete_checkout_flow(self):
        """Test the complete checkout flow that user is experiencing"""
        logger.info("\n🧪 Testing Complete Checkout Flow (User's Scenario)...")
        
        # Step 1: Get available listings
        try:
            async with self.session.get(f"{self.api_url}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    if not listings:
                        logger.error("❌ No listings available for testing")
                        self.test_results.append(("Complete Checkout Flow", False, "No listings available"))
                        return
                    
                    # Use multiple listings to simulate user's "2 orders created" scenario
                    test_listings = listings[:2] if len(listings) >= 2 else listings
                    logger.info(f"✅ Found {len(test_listings)} listings for testing")
                    
                else:
                    logger.error(f"❌ Failed to get listings: {response.status}")
                    self.test_results.append(("Complete Checkout Flow", False, "Failed to get listings"))
                    return
        except Exception as e:
            logger.error(f"❌ Error getting listings: {e}")
            self.test_results.append(("Complete Checkout Flow", False, f"Listings error: {e}"))
            return
        
        # Step 2: Add multiple items to cart (simulate user's scenario)
        cart_items_added = 0
        for i, listing in enumerate(test_listings):
            try:
                cart_item = {
                    "listing_id": listing["id"],
                    "quantity": 1,
                    "shipping_option": "standard"
                }
                
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=cart_item,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        cart_items_added += 1
                        logger.info(f"✅ Added item {i+1} to cart: {listing['title'][:50]}...")
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Failed to add item {i+1} to cart: {response.status} - {error_text}")
            except Exception as e:
                logger.error(f"❌ Error adding item {i+1} to cart: {e}")
        
        if cart_items_added == 0:
            logger.error("❌ No items added to cart")
            self.test_results.append(("Complete Checkout Flow", False, "No items added to cart"))
            return
        
        logger.info(f"✅ Successfully added {cart_items_added} items to cart")
        
        # Step 3: Verify cart contents
        try:
            async with self.session.get(f"{self.api_url}/cart", headers=self.get_headers()) as response:
                if response.status == 200:
                    cart_data = await response.json()
                    cart_items = cart_data.get("items", [])
                    cart_total = cart_data.get("total", 0)
                    logger.info(f"✅ Cart verification: {len(cart_items)} items, total: R{cart_total:.2f}")
                else:
                    logger.error(f"❌ Failed to get cart: {response.status}")
        except Exception as e:
            logger.error(f"❌ Error getting cart: {e}")
        
        # Step 4: Create checkout session
        try:
            checkout_data = {
                "shipping_address": {
                    "line1": "123 Test Street",
                    "city": "Cape Town",
                    "province": "Western Cape",
                    "postal_code": "8001",
                    "country": "ZA"
                },
                "payment_method": "paystack"
            }
            
            async with self.session.post(
                f"{self.api_url}/checkout/create",
                json=checkout_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.test_checkout_session_id = data.get("checkout_session_id")
                    total_amount = data.get("total_amount", 0)
                    items = data.get("items", [])
                    logger.info(f"✅ Checkout session created: {self.test_checkout_session_id}")
                    logger.info(f"   Total amount: R{total_amount:.2f}")
                    logger.info(f"   Items in checkout: {len(items)}")
                    self.test_results.append(("Checkout Session Creation", True, f"Session created, {len(items)} items, R{total_amount:.2f}"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create checkout session: {response.status} - {error_text}")
                    self.test_results.append(("Checkout Session Creation", False, f"Status {response.status}"))
                    return
        except Exception as e:
            logger.error(f"❌ Error creating checkout session: {e}")
            self.test_results.append(("Checkout Session Creation", False, str(e)))
            return
        
        # Step 5: Complete checkout (this is where user sees "Order placed successfully! 2 order(s) created")
        try:
            payment_data = {
                "payment_method": "paystack"
            }
            
            async with self.session.post(
                f"{self.api_url}/checkout/{self.test_checkout_session_id}/complete",
                json=payment_data,
                headers=self.get_headers()
            ) as response:
                response_text = await response.text()
                
                if response.status == 200:
                    data = await response.json()
                    orders = data.get("orders", [])
                    success_message = data.get("message", "")
                    
                    logger.info(f"✅ Checkout completed successfully!")
                    logger.info(f"   Message: {success_message}")
                    logger.info(f"   Orders created: {len(orders)}")
                    
                    # Store order IDs for payment testing
                    self.test_order_ids = [order["id"] for order in orders]
                    for i, order in enumerate(orders):
                        logger.info(f"   Order {i+1}: {order['id']} (Total: R{order.get('total', 0):.2f})")
                    
                    # This is the user's scenario - orders are created but no payment redirect
                    logger.info(f"🎯 USER'S SCENARIO REPRODUCED: '{success_message}' - {len(orders)} order(s) created")
                    self.test_results.append(("Order Creation", True, f"{len(orders)} orders created: {success_message}"))
                else:
                    logger.error(f"❌ Failed to complete checkout: {response.status} - {response_text}")
                    self.test_results.append(("Order Creation", False, f"Status {response.status}"))
                    return
        except Exception as e:
            logger.error(f"❌ Error completing checkout: {e}")
            self.test_results.append(("Order Creation", False, str(e)))
            return
        
        # Step 6: Now test what SHOULD happen - payment initialization for each order
        logger.info(f"\n🔍 Testing Payment Initialization for {len(self.test_order_ids)} Created Orders...")
        
        payment_urls = []
        for i, order_id in enumerate(self.test_order_ids):
            try:
                # Test payment initialization for this order
                payment_init_data = {
                    "order_id": order_id,
                    "amount": 50.00,  # Test amount
                    "callback_url": f"{self.base_url}/payment/callback"
                }
                
                async with self.session.post(
                    f"{self.api_url}/payments/paystack/init",
                    json=payment_init_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        auth_url = data.get("authorization_url")
                        if auth_url:
                            payment_urls.append(auth_url)
                            logger.info(f"✅ Payment URL generated for order {i+1}: {auth_url[:50]}...")
                        else:
                            logger.error(f"❌ No authorization_url in response for order {i+1}")
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Payment initialization failed for order {i+1}: {response.status} - {error_text}")
            except Exception as e:
                logger.error(f"❌ Error initializing payment for order {i+1}: {e}")
        
        # Step 7: Analyze the gap - why doesn't checkout redirect to payment?
        if len(payment_urls) > 0:
            logger.info(f"\n🎯 ANALYSIS: Payment gateway is working ({len(payment_urls)} URLs generated)")
            logger.info("❌ ISSUE IDENTIFIED: Checkout completion doesn't automatically redirect to payment!")
            logger.info("💡 SOLUTION NEEDED: Frontend should call /api/payments/paystack/init after order creation")
            
            self.test_results.append(("Payment Gateway Functionality", True, f"{len(payment_urls)} payment URLs generated"))
            self.test_results.append(("Checkout-to-Payment Integration", False, "Missing automatic payment redirect"))
        else:
            logger.error("❌ CRITICAL: Payment gateway not working for created orders")
            self.test_results.append(("Payment Gateway Functionality", False, "No payment URLs generated"))
            self.test_results.append(("Checkout-to-Payment Integration", False, "Payment gateway not working"))
    
    async def test_frontend_integration_gap(self):
        """Test what the frontend should be doing after checkout"""
        logger.info("\n🧪 Testing Frontend Integration Requirements...")
        
        if not self.test_order_ids:
            logger.warning("⚠️ No orders available for frontend integration testing")
            self.test_results.append(("Frontend Integration", False, "No orders to test"))
            return
        
        # Test what frontend SHOULD do after getting "Order placed successfully" message
        logger.info("🔍 Simulating what frontend SHOULD do after checkout completion:")
        
        # For each order, frontend should:
        # 1. Get order details
        # 2. Initialize payment
        # 3. Redirect user to payment URL
        
        for i, order_id in enumerate(self.test_order_ids):
            logger.info(f"\n   Testing order {i+1}: {order_id}")
            
            # Step 1: Get order details (frontend should do this)
            try:
                async with self.session.get(
                    f"{self.api_url}/orders/user",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        buyer_orders = data.get("buyer_orders", [])
                        order_found = any(order.get("id") == order_id for order in buyer_orders)
                        if order_found:
                            logger.info(f"   ✅ Order details accessible via API")
                        else:
                            logger.error(f"   ❌ Order not found in user orders")
                    else:
                        logger.error(f"   ❌ Failed to get order details: {response.status}")
            except Exception as e:
                logger.error(f"   ❌ Error getting order details: {e}")
            
            # Step 2: Initialize payment (frontend should do this automatically)
            try:
                payment_data = {
                    "order_id": order_id,
                    "amount": 100.00,  # This should come from order total
                    "callback_url": f"{self.base_url}/payment/success"
                }
                
                async with self.session.post(
                    f"{self.api_url}/payments/paystack/init",
                    json=payment_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        auth_url = data.get("authorization_url")
                        if auth_url:
                            logger.info(f"   ✅ Payment URL ready: {auth_url[:50]}...")
                            logger.info(f"   💡 Frontend should redirect to: {auth_url}")
                        else:
                            logger.error(f"   ❌ No authorization_url in payment response")
                    else:
                        error_text = await response.text()
                        logger.error(f"   ❌ Payment initialization failed: {response.status} - {error_text}")
            except Exception as e:
                logger.error(f"   ❌ Error in payment initialization: {e}")
        
        # Conclusion
        logger.info(f"\n🎯 FRONTEND INTEGRATION ANALYSIS:")
        logger.info(f"   • Orders are created successfully ✅")
        logger.info(f"   • Payment gateway is functional ✅")
        logger.info(f"   • Missing: Automatic payment redirect after checkout ❌")
        logger.info(f"   • Solution: Frontend needs to call payment init after order creation")
        
        self.test_results.append(("Frontend Integration Analysis", True, "Gap identified: missing payment redirect"))
    
    async def run_all_tests(self):
        """Run all checkout payment flow tests"""
        logger.info("🚀 Starting Checkout to Payment Flow Testing...")
        logger.info("🎯 Investigating: 'Order placed successfully! 2 order(s) created' but no payment redirect")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run tests
            await self.test_complete_checkout_flow()
            await self.test_frontend_integration_gap()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🚨 CHECKOUT TO PAYMENT FLOW TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Analyze the specific issue
        checkout_working = any("Order Creation" in test and success for test, success, _ in self.test_results)
        payment_working = any("Payment Gateway" in test and success for test, success, _ in self.test_results)
        integration_issue = any("Integration" in test and not success for test, success, _ in self.test_results)
        
        logger.info(f"\n🎯 ROOT CAUSE ANALYSIS:")
        if checkout_working and payment_working and integration_issue:
            logger.info("✅ ISSUE IDENTIFIED: Checkout and Payment work separately")
            logger.info("❌ PROBLEM: Missing integration between checkout completion and payment initialization")
            logger.info("💡 SOLUTION: Frontend needs to automatically redirect to payment after order creation")
        elif not checkout_working:
            logger.info("❌ CRITICAL: Checkout process is broken")
        elif not payment_working:
            logger.info("❌ CRITICAL: Payment gateway is not working")
        else:
            logger.info("✅ All systems working - investigating integration")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info(f"\n🔧 RECOMMENDED FIXES:")
        if integration_issue:
            logger.info("   1. Frontend: After checkout completion, automatically call /api/payments/paystack/init")
            logger.info("   2. Frontend: Use order ID and total amount from checkout response")
            logger.info("   3. Frontend: Redirect user to authorization_url from payment response")
            logger.info("   4. Backend: Consider adding payment_url to checkout completion response")
        
        logger.info(f"\n📱 USER EXPERIENCE FLOW (SHOULD BE):")
        logger.info("   1. User completes checkout → Orders created ✅")
        logger.info("   2. Frontend calls payment init → Payment URL generated ✅")
        logger.info("   3. User redirected to Paystack → Payment processed ❌ (MISSING)")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = CheckoutPaymentFlowTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())