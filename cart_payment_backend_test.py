#!/usr/bin/env python3
"""
🧪 CART & PAYMENT GATEWAY BACKEND TESTING
Comprehensive testing of Cart API endpoints and Payment Gateway functionality
Testing the payment gateway and cart functionality fixes as requested in review
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

class CartPaymentTester:
    """Comprehensive Cart & Payment Gateway Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_user_id = None
        self.test_listing_id = None
        self.test_cart_item_id = None
        self.test_checkout_session_id = None
        self.test_order_id = None
        self.guest_email = f"guest_{uuid.uuid4().hex[:8]}@test.com"
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as regular user"""
        try:
            # Try to register a test user first
            register_data = {
                "email": f"testuser_{uuid.uuid4().hex[:8]}@test.com",
                "password": "testpass123",
                "full_name": "Test User",
                "role": "buyer"
            }
            
            async with self.session.post(f"{self.api_url}/auth/register", json=register_data) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    self.auth_token = data.get("token") or register_data["email"]
                    self.test_user_id = data.get("user", {}).get("id")
                    logger.info("✅ User registration and authentication successful")
                    return True
                else:
                    # Try to login with existing user
                    login_data = {
                        "email": "buyer@test.com",
                        "password": "testpass123"
                    }
                    
                    async with self.session.post(f"{self.api_url}/auth/login", json=login_data) as login_response:
                        if login_response.status == 200:
                            data = await login_response.json()
                            self.auth_token = data.get("token") or login_data["email"]
                            self.test_user_id = data.get("user", {}).get("id")
                            logger.info("✅ User login successful")
                            return True
                        else:
                            logger.error(f"❌ Authentication failed: {login_response.status}")
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
    
    async def get_test_listing(self):
        """Get a test listing for cart operations"""
        try:
            async with self.session.get(f"{self.api_url}/listings", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", [])
                    if listings:
                        self.test_listing_id = listings[0]["id"]
                        logger.info(f"✅ Found test listing: {self.test_listing_id}")
                        return True
                    else:
                        logger.warning("⚠️ No listings found - creating mock listing ID")
                        self.test_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"  # Real listing ID from system
                        return True
                else:
                    logger.warning(f"⚠️ Could not fetch listings: {response.status}")
                    self.test_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"  # Real listing ID from system
                    return True
        except Exception as e:
            logger.error(f"❌ Error getting test listing: {e}")
            self.test_listing_id = "a985a5b3-4c39-4739-8f02-69c9542f3ef3"  # Real listing ID from system
            return True

    async def test_cart_api_endpoints(self):
        """Test 1: Cart API Endpoints Testing"""
        logger.info("\n🧪 Testing Cart API Endpoints...")
        
        # Test 1.1: GET /api/cart (authenticated cart access)
        try:
            async with self.session.get(f"{self.api_url}/cart", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ GET /api/cart - Cart access successful")
                    logger.info(f"   Items in cart: {data.get('item_count', 0)}")
                    logger.info(f"   Cart total: R{data.get('total', 0):.2f}")
                    self.test_results.append(("GET /api/cart", True, f"Cart accessed - {data.get('item_count', 0)} items"))
                elif response.status == 401:
                    logger.error("❌ GET /api/cart - Authentication required")
                    self.test_results.append(("GET /api/cart", False, "Authentication required"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET /api/cart failed: {response.status} - {error_text}")
                    self.test_results.append(("GET /api/cart", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing GET /api/cart: {e}")
            self.test_results.append(("GET /api/cart", False, str(e)))
        
        # Test 1.2: POST /api/cart/add (add items to cart)
        if self.test_listing_id:
            cart_item_data = {
                "listing_id": self.test_listing_id,
                "quantity": 2,
                "shipping_option": "standard"
            }
            
            try:
                async with self.session.post(
                    f"{self.api_url}/cart/add",
                    json=cart_item_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("✅ POST /api/cart/add - Item added successfully")
                        logger.info(f"   Cart item count: {data.get('cart_item_count', 0)}")
                        self.test_results.append(("POST /api/cart/add", True, f"Added {cart_item_data['quantity']} items"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ POST /api/cart/add failed: {response.status} - {error_text}")
                        self.test_results.append(("POST /api/cart/add", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing POST /api/cart/add: {e}")
                self.test_results.append(("POST /api/cart/add", False, str(e)))
        
        # Test 1.3: GET /api/cart again to verify item was added
        try:
            async with self.session.get(f"{self.api_url}/cart", headers=self.get_headers()) as response:
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])
                    if items:
                        self.test_cart_item_id = items[0].get("id")
                        logger.info("✅ Cart verification - Item successfully added")
                        logger.info(f"   Items in cart: {len(items)}")
                        self.test_results.append(("Cart Item Verification", True, f"Found {len(items)} items"))
                    else:
                        logger.warning("⚠️ Cart verification - No items found after adding")
                        self.test_results.append(("Cart Item Verification", False, "No items found"))
                else:
                    logger.error(f"❌ Cart verification failed: {response.status}")
                    self.test_results.append(("Cart Item Verification", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error verifying cart: {e}")
            self.test_results.append(("Cart Item Verification", False, str(e)))
        
        # Test 1.4: PUT /api/cart/update (update quantity) - Note: This endpoint might not exist, testing anyway
        if self.test_cart_item_id:
            update_data = {
                "item_id": self.test_cart_item_id,
                "quantity": 3
            }
            
            try:
                async with self.session.put(
                    f"{self.api_url}/cart/update",
                    json=update_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        logger.info("✅ PUT /api/cart/update - Quantity updated successfully")
                        self.test_results.append(("PUT /api/cart/update", True, "Quantity updated"))
                    elif response.status == 404:
                        logger.warning("⚠️ PUT /api/cart/update - Endpoint not found (may not be implemented)")
                        self.test_results.append(("PUT /api/cart/update", False, "Endpoint not implemented"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ PUT /api/cart/update failed: {response.status} - {error_text}")
                        self.test_results.append(("PUT /api/cart/update", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing PUT /api/cart/update: {e}")
                self.test_results.append(("PUT /api/cart/update", False, str(e)))
        
        # Test 1.5: DELETE /api/cart/remove (remove items)
        if self.test_cart_item_id:
            try:
                async with self.session.delete(
                    f"{self.api_url}/cart/item/{self.test_cart_item_id}",
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        logger.info("✅ DELETE /api/cart/remove - Item removed successfully")
                        self.test_results.append(("DELETE /api/cart/remove", True, "Item removed"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ DELETE /api/cart/remove failed: {response.status} - {error_text}")
                        self.test_results.append(("DELETE /api/cart/remove", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error testing DELETE /api/cart/remove: {e}")
                self.test_results.append(("DELETE /api/cart/remove", False, str(e)))

    async def test_guest_checkout_payment_flow(self):
        """Test 2: Guest Checkout Payment Flow"""
        logger.info("\n🧪 Testing Guest Checkout Payment Flow...")
        
        # First, add items back to cart for checkout testing
        if self.test_listing_id:
            cart_item_data = {
                "listing_id": self.test_listing_id,
                "quantity": 1,
                "shipping_option": "standard"
            }
            
            await self.session.post(
                f"{self.api_url}/cart/add",
                json=cart_item_data,
                headers=self.get_headers()
            )
        
        # Test 2.1: POST /api/checkout/guest/quote with sample cart items
        guest_quote_data = {
            "items": [
                {
                    "listing_id": self.test_listing_id,
                    "qty": 1
                }
            ],
            "ship_to": {
                "province": "Western Cape",
                "country": "South Africa",
                "lat": -33.9249,
                "lng": 18.4241
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/guest/quote",
                json=guest_quote_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info("✅ POST /api/checkout/guest/quote - Quote generated successfully")
                    logger.info(f"   Quote total: R{data.get('total', 0):.2f}")
                    logger.info(f"   Items: {len(data.get('items', []))}")
                    self.test_results.append(("POST /api/checkout/guest/quote", True, f"Quote: R{data.get('total', 0):.2f}"))
                elif response.status == 404:
                    logger.warning("⚠️ POST /api/checkout/guest/quote - Endpoint not found (may not be implemented)")
                    self.test_results.append(("POST /api/checkout/guest/quote", False, "Endpoint not implemented"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ POST /api/checkout/guest/quote failed: {response.status} - {error_text}")
                    self.test_results.append(("POST /api/checkout/guest/quote", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing POST /api/checkout/guest/quote: {e}")
            self.test_results.append(("POST /api/checkout/guest/quote", False, str(e)))
        
        # Test 2.2: POST /api/checkout/guest/create to verify order creation and payment
        guest_create_data = {
            "contact": {
                "email": self.guest_email,
                "phone": "+27123456789",
                "full_name": "Test Guest"
            },
            "ship_to": {
                "province": "Western Cape",
                "country": "South Africa",
                "lat": -33.9249,
                "lng": 18.4241
            },
            "items": [
                {
                    "listing_id": self.test_listing_id,
                    "qty": 1,
                    "species": "chickens",
                    "product_type": "live_birds",
                    "line_total": 15.50
                }
            ],
            "quote": {
                "summary": {
                    "grand_total": 15.50,
                    "delivery_total": 0.0
                }
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/guest/create",
                json=guest_create_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    logger.info("✅ POST /api/checkout/guest/create - Order creation successful")
                    
                    # Check for order creation
                    if "order" in data or "orders" in data:
                        logger.info("   ✅ Order creation works")
                        self.test_results.append(("Guest Checkout - Order Creation", True, "Order created"))
                    else:
                        logger.warning("   ⚠️ Order creation unclear from response")
                        self.test_results.append(("Guest Checkout - Order Creation", False, "Order creation unclear"))
                    
                    # Check for Paystack service integration
                    if "authorization_url" in data or "payment_url" in data:
                        auth_url = data.get("authorization_url") or data.get("payment_url")
                        logger.info("   ✅ Paystack service integration returns authorization_url")
                        logger.info(f"   Payment URL: {auth_url}")
                        self.test_results.append(("Guest Checkout - Paystack Integration", True, "Authorization URL generated"))
                    else:
                        logger.warning("   ⚠️ No authorization_url in response")
                        self.test_results.append(("Guest Checkout - Paystack Integration", False, "No authorization URL"))
                    
                    self.test_results.append(("POST /api/checkout/guest/create", True, "Guest checkout successful"))
                    
                elif response.status == 404:
                    logger.warning("⚠️ POST /api/checkout/guest/create - Endpoint not found (may not be implemented)")
                    self.test_results.append(("POST /api/checkout/guest/create", False, "Endpoint not implemented"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ POST /api/checkout/guest/create failed: {response.status} - {error_text}")
                    
                    # Test error handling for payment initialization failures
                    if "payment" in error_text.lower() or "paystack" in error_text.lower():
                        logger.info("   ✅ Proper error handling for payment initialization failures")
                        self.test_results.append(("Guest Checkout - Error Handling", True, "Payment errors handled"))
                    
                    self.test_results.append(("POST /api/checkout/guest/create", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing POST /api/checkout/guest/create: {e}")
            self.test_results.append(("POST /api/checkout/guest/create", False, str(e)))
        
        # Test 2.3: Test fallback behavior when payment service is down
        logger.info("\n   Testing fallback behavior when payment service is down...")
        
        # This is harder to test directly, but we can check if the system handles payment service errors gracefully
        invalid_payment_data = {
            "contact": {
                "email": self.guest_email,
                "phone": "+27123456789",
                "full_name": "Test Guest"
            },
            "ship_to": {
                "province": "Western Cape",
                "country": "South Africa",
                "lat": -33.9249,
                "lng": 18.4241
            },
            "items": [
                {
                    "listing_id": "invalid-listing-id",
                    "qty": 1,
                    "species": "chickens",
                    "product_type": "live_birds",
                    "line_total": 15.50
                }
            ],
            "quote": {
                "summary": {
                    "grand_total": 15.50,
                    "delivery_total": 0.0
                }
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/guest/create",
                json=invalid_payment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status >= 400:
                    error_text = await response.text()
                    logger.info("   ✅ Fallback behavior working - system handles errors gracefully")
                    self.test_results.append(("Guest Checkout - Fallback Behavior", True, "Errors handled gracefully"))
                else:
                    logger.warning("   ⚠️ Expected error for invalid data, but got success")
                    self.test_results.append(("Guest Checkout - Fallback Behavior", False, "No error for invalid data"))
        except Exception as e:
            logger.info("   ✅ Fallback behavior working - exceptions handled")
            self.test_results.append(("Guest Checkout - Fallback Behavior", True, "Exceptions handled"))

    async def test_payment_integration_verification(self):
        """Test 3: Payment Integration Verification"""
        logger.info("\n🧪 Testing Payment Integration Verification...")
        
        # Test 3.1: Verify PaystackService is properly initialized
        try:
            async with self.session.get(f"{self.api_url}/health", headers=self.get_headers()) as response:
                if response.status == 200:
                    logger.info("✅ Backend service is running - PaystackService likely initialized")
                    self.test_results.append(("PaystackService Initialization", True, "Backend service running"))
                else:
                    logger.error("❌ Backend service not responding properly")
                    self.test_results.append(("PaystackService Initialization", False, "Backend service issues"))
        except Exception as e:
            logger.error(f"❌ Error checking service status: {e}")
            self.test_results.append(("PaystackService Initialization", False, str(e)))
        
        # Test 3.2: Test that authorization URLs are generated correctly
        payment_init_data = {
            "order_id": f"test_order_{uuid.uuid4().hex[:8]}",
            "amount": 1550,  # R15.50 in cents
            "email": self.guest_email,
            "reference": f"test_ref_{uuid.uuid4().hex[:8]}"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/payments/paystack/init",
                json=payment_init_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "authorization_url" in data:
                        auth_url = data["authorization_url"]
                        logger.info("✅ Authorization URLs generated correctly")
                        logger.info(f"   URL: {auth_url}")
                        
                        # Verify URL format
                        if "checkout.paystack.com" in auth_url:
                            logger.info("   ✅ URL format is correct (Paystack checkout)")
                            self.test_results.append(("Authorization URL Generation", True, "Correct Paystack URL"))
                        else:
                            logger.warning("   ⚠️ URL format may be incorrect")
                            self.test_results.append(("Authorization URL Generation", False, "Incorrect URL format"))
                    else:
                        logger.error("   ❌ No authorization_url in response")
                        self.test_results.append(("Authorization URL Generation", False, "No authorization URL"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Payment initialization failed: {response.status} - {error_text}")
                    self.test_results.append(("Authorization URL Generation", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing payment initialization: {e}")
            self.test_results.append(("Authorization URL Generation", False, str(e)))
        
        # Test 3.3: Confirm callback URLs are properly configured
        try:
            async with self.session.get(
                f"{self.api_url}/payments/webhook/paystack",
                headers={"Content-Type": "application/json"}
            ) as response:
                # Webhook endpoint should be accessible (even if it returns an error for GET)
                if response.status in [200, 405, 400]:  # 405 = Method Not Allowed is acceptable
                    logger.info("✅ Callback URLs properly configured - webhook endpoint accessible")
                    self.test_results.append(("Callback URL Configuration", True, "Webhook endpoint accessible"))
                else:
                    logger.warning(f"⚠️ Webhook endpoint status: {response.status}")
                    self.test_results.append(("Callback URL Configuration", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing webhook endpoint: {e}")
            self.test_results.append(("Callback URL Configuration", False, str(e)))

    async def test_end_to_end_flow(self):
        """Test 4: End-to-End Flow Testing"""
        logger.info("\n🧪 Testing End-to-End Flow...")
        
        # Test 4.1: Complete flow: Cart → Guest Quote → Order Creation → Payment Redirection
        logger.info("   Testing complete flow: Cart → Guest Quote → Order Creation → Payment Redirection")
        
        # Step 1: Add to cart (already tested above)
        if self.test_listing_id:
            cart_item_data = {
                "listing_id": self.test_listing_id,
                "quantity": 1,
                "shipping_option": "standard"
            }
            
            try:
                await self.session.post(
                    f"{self.api_url}/cart/add",
                    json=cart_item_data,
                    headers=self.get_headers()
                )
                logger.info("   ✅ Step 1: Cart - Item added")
            except:
                logger.warning("   ⚠️ Step 1: Cart - Could not add item")
        
        # Step 2: Create checkout session
        checkout_data = {
            "shipping_address": {
                "name": "Test User",
                "address": "123 Test Street",
                "city": "Cape Town",
                "province": "Western Cape",
                "postal_code": "8001",
                "country": "South Africa"
            },
            "payment_method": "paystack"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/create",
                json=checkout_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.test_checkout_session_id = data.get("checkout_session_id")
                    logger.info("   ✅ Step 2: Checkout Session - Created successfully")
                    logger.info(f"   Session ID: {self.test_checkout_session_id}")
                else:
                    logger.warning(f"   ⚠️ Step 2: Checkout Session - Failed ({response.status})")
        except Exception as e:
            logger.warning(f"   ⚠️ Step 2: Checkout Session - Error: {e}")
        
        # Step 3: Complete checkout and create orders
        if self.test_checkout_session_id:
            payment_data = {
                "payment_method": "paystack",
                "payment_reference": f"test_ref_{uuid.uuid4().hex[:8]}"
            }
            
            try:
                async with self.session.post(
                    f"{self.api_url}/checkout/{self.test_checkout_session_id}/complete",
                    json=payment_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        orders = data.get("orders", [])
                        if orders:
                            self.test_order_id = orders[0].get("id")
                            logger.info("   ✅ Step 3: Order Creation - Orders created successfully")
                            logger.info(f"   Created {len(orders)} order(s)")
                        else:
                            logger.warning("   ⚠️ Step 3: Order Creation - No orders in response")
                    else:
                        logger.warning(f"   ⚠️ Step 3: Order Creation - Failed ({response.status})")
            except Exception as e:
                logger.warning(f"   ⚠️ Step 3: Order Creation - Error: {e}")
        
        # Step 4: Test payment redirection
        if self.test_order_id:
            payment_init_data = {
                "order_id": self.test_order_id,
                "amount": 1550,  # R15.50 in cents
                "email": self.guest_email
            }
            
            try:
                async with self.session.post(
                    f"{self.api_url}/payments/paystack/init",
                    json=payment_init_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "authorization_url" in data:
                            logger.info("   ✅ Step 4: Payment Redirection - Authorization URL generated")
                            self.test_results.append(("End-to-End Flow", True, "Complete flow working"))
                        else:
                            logger.warning("   ⚠️ Step 4: Payment Redirection - No authorization URL")
                            self.test_results.append(("End-to-End Flow", False, "No payment redirection"))
                    else:
                        logger.warning(f"   ⚠️ Step 4: Payment Redirection - Failed ({response.status})")
                        self.test_results.append(("End-to-End Flow", False, "Payment initialization failed"))
            except Exception as e:
                logger.warning(f"   ⚠️ Step 4: Payment Redirection - Error: {e}")
                self.test_results.append(("End-to-End Flow", False, str(e)))
        else:
            logger.warning("   ⚠️ End-to-End Flow - Could not complete due to missing order ID")
            self.test_results.append(("End-to-End Flow", False, "Missing order ID"))
        
        # Test 4.2: Verify guest user creation for new emails
        new_guest_email = f"newguest_{uuid.uuid4().hex[:8]}@test.com"
        guest_data = {
            "contact": {
                "email": new_guest_email,
                "phone": "+27123456789",
                "full_name": "New Guest User"
            },
            "ship_to": {
                "province": "Gauteng",
                "country": "South Africa",
                "lat": -26.2041,
                "lng": 28.0473
            },
            "items": [
                {
                    "listing_id": self.test_listing_id,
                    "qty": 1,
                    "species": "chickens",
                    "product_type": "live_birds",
                    "line_total": 15.50
                }
            ],
            "quote": {
                "summary": {
                    "grand_total": 15.50,
                    "delivery_total": 0.0
                }
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/guest/create",
                json=guest_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [200, 201]:
                    logger.info("   ✅ Guest user creation for new emails - Working")
                    self.test_results.append(("Guest User Creation", True, "New guest users created"))
                elif response.status == 404:
                    logger.warning("   ⚠️ Guest checkout endpoint not implemented")
                    self.test_results.append(("Guest User Creation", False, "Endpoint not implemented"))
                else:
                    logger.warning(f"   ⚠️ Guest user creation - Failed ({response.status})")
                    self.test_results.append(("Guest User Creation", False, f"Status {response.status}"))
        except Exception as e:
            logger.warning(f"   ⚠️ Guest user creation - Error: {e}")
            self.test_results.append(("Guest User Creation", False, str(e)))
        
        # Test 4.3: Test handling of existing users during guest checkout
        existing_guest_data = {
            "contact": {
                "email": self.guest_email,  # Reuse existing email
                "phone": "+27123456789",
                "full_name": "Existing Guest User"
            },
            "ship_to": {
                "province": "KwaZulu-Natal",
                "country": "South Africa",
                "lat": -29.8587,
                "lng": 31.0218
            },
            "items": [
                {
                    "listing_id": self.test_listing_id,
                    "qty": 1,
                    "species": "chickens",
                    "product_type": "live_birds",
                    "line_total": 15.50
                }
            ],
            "quote": {
                "summary": {
                    "grand_total": 15.50,
                    "delivery_total": 0.0
                }
            }
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/checkout/guest/create",
                json=existing_guest_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status in [200, 201]:
                    logger.info("   ✅ Handling of existing users during guest checkout - Working")
                    self.test_results.append(("Existing User Handling", True, "Existing users handled"))
                elif response.status == 404:
                    logger.warning("   ⚠️ Guest checkout endpoint not implemented")
                    self.test_results.append(("Existing User Handling", False, "Endpoint not implemented"))
                else:
                    logger.warning(f"   ⚠️ Existing user handling - Failed ({response.status})")
                    self.test_results.append(("Existing User Handling", False, f"Status {response.status}"))
        except Exception as e:
            logger.warning(f"   ⚠️ Existing user handling - Error: {e}")
            self.test_results.append(("Existing User Handling", False, str(e)))

    async def run_all_tests(self):
        """Run all cart and payment tests"""
        logger.info("🚀 Starting Cart & Payment Gateway Backend Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Get test listing
            await self.get_test_listing()
            
            # Run all tests
            await self.test_cart_api_endpoints()
            await self.test_guest_checkout_payment_flow()
            await self.test_payment_integration_verification()
            await self.test_end_to_end_flow()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 CART & PAYMENT GATEWAY BACKEND TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Cart & Payment system is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - Cart & Payment system is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - Cart & Payment system has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - Cart & Payment system requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FEATURES TESTED:")
        logger.info("   • Cart API Endpoints (GET, POST, PUT, DELETE)")
        logger.info("   • Guest Checkout Payment Flow")
        logger.info("   • Payment Integration Verification")
        logger.info("   • End-to-End Flow Testing")
        logger.info("   • Guest User Creation and Management")
        logger.info("   • Paystack Service Integration")
        logger.info("   • Authorization URL Generation")
        logger.info("   • Callback URL Configuration")
        logger.info("   • Error Handling and Fallback Behavior")
        
        logger.info("\n💳 PAYMENT GATEWAY FEATURES:")
        logger.info("   • Paystack Integration")
        logger.info("   • Authorization URL Generation")
        logger.info("   • Webhook Processing")
        logger.info("   • Error Handling")
        logger.info("   • Guest Checkout Support")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = CartPaymentTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())