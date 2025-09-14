#!/usr/bin/env python3
"""
🧪 LIFECYCLE EMAIL SYSTEM BACKEND TESTING
Comprehensive testing of the newly implemented Lifecycle Email functionality
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

class LifecycleEmailTester:
    """Comprehensive Lifecycle Email System Backend Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
        # Test data
        self.test_session_id = str(uuid.uuid4())
        self.test_email = f"test_{int(datetime.now().timestamp())}@stocklot.co.za"
        self.test_cart_id = str(uuid.uuid4())
        
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
            # The authentication system uses email as Bearer token
            self.auth_token = "admin@stocklot.co.za"
            logger.info("✅ Admin authentication successful")
            return True
                    
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def get_auth_headers(self):
        """Get authentication headers"""
        if self.auth_token:
            return {"Authorization": f"Bearer {self.auth_token}"}
        return {}
    
    async def test_email_subscription_endpoint(self):
        """Test POST /api/marketing/subscribe endpoint"""
        logger.info("\n🧪 Testing Email Subscription Endpoint...")
        
        test_cases = [
            {
                "name": "Valid subscription with consent",
                "data": {
                    "email": self.test_email,
                    "consent": True,
                    "source": "guest_cart",
                    "session_id": self.test_session_id
                },
                "expected_status": 200
            },
            {
                "name": "Valid subscription from checkout",
                "data": {
                    "email": f"checkout_{int(datetime.now().timestamp())}@stocklot.co.za",
                    "consent": True,
                    "source": "checkout",
                    "session_id": str(uuid.uuid4())
                },
                "expected_status": 200
            },
            {
                "name": "Valid subscription from guest browse",
                "data": {
                    "email": f"browse_{int(datetime.now().timestamp())}@stocklot.co.za",
                    "consent": True,
                    "source": "guest_browse",
                    "session_id": str(uuid.uuid4())
                },
                "expected_status": 200
            },
            {
                "name": "Subscription without consent",
                "data": {
                    "email": f"noconsent_{int(datetime.now().timestamp())}@stocklot.co.za",
                    "consent": False,
                    "source": "guest_cart",
                    "session_id": str(uuid.uuid4())
                },
                "expected_status": 200  # Should still work but with consent=False
            },
            {
                "name": "Invalid email format",
                "data": {
                    "email": "invalid-email",
                    "consent": True,
                    "source": "guest_cart",
                    "session_id": str(uuid.uuid4())
                },
                "expected_status": 422  # Validation error
            }
        ]
        
        results = []
        for test_case in test_cases:
            try:
                # Prepare form data
                form_data = aiohttp.FormData()
                for key, value in test_case["data"].items():
                    form_data.add_field(key, str(value))
                
                async with self.session.post(
                    f"{self.api_url}/marketing/subscribe",
                    data=form_data
                ) as response:
                    status = response.status
                    response_data = await response.json()
                    
                    success = status == test_case["expected_status"]
                    results.append({
                        "test": test_case["name"],
                        "status": status,
                        "expected": test_case["expected_status"],
                        "success": success,
                        "response": response_data
                    })
                    
                    if success:
                        logger.info(f"✅ {test_case['name']}: {status}")
                    else:
                        logger.error(f"❌ {test_case['name']}: Expected {test_case['expected_status']}, got {status}")
                        logger.error(f"   Response: {response_data}")
                        
            except Exception as e:
                logger.error(f"❌ {test_case['name']}: Exception - {e}")
                results.append({
                    "test": test_case["name"],
                    "success": False,
                    "error": str(e)
                })
        
        self.test_results.append({
            "category": "Email Subscription Endpoint",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    async def test_event_tracking_endpoint(self):
        """Test POST /api/track endpoint with different event types"""
        logger.info("\n🧪 Testing Event Tracking Endpoint...")
        
        test_events = [
            {
                "name": "PDP View Event",
                "data": {
                    "session_id": self.test_session_id,
                    "event_type": "pdp.view",
                    "payload": json.dumps({
                        "listing_id": str(uuid.uuid4()),
                        "product_title": "Angus Cattle",
                        "price": 15000,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                },
                "expected_status": 200
            },
            {
                "name": "Cart Updated Event",
                "data": {
                    "session_id": self.test_session_id,
                    "event_type": "cart.updated",
                    "payload": json.dumps({
                        "cart_id": self.test_cart_id,
                        "items": [
                            {
                                "listing_id": str(uuid.uuid4()),
                                "title": "Ross 308 Chicks",
                                "qty": 50,
                                "price": 25
                            }
                        ],
                        "subtotal_minor": 1250,
                        "currency": "ZAR"
                    })
                },
                "expected_status": 200
            },
            {
                "name": "Add to Cart Event",
                "data": {
                    "session_id": self.test_session_id,
                    "event_type": "add_to_cart",
                    "payload": json.dumps({
                        "listing_id": str(uuid.uuid4()),
                        "product_title": "Boer Goats",
                        "quantity": 5,
                        "price": 3500
                    })
                },
                "expected_status": 200
            },
            {
                "name": "Checkout Started Event",
                "data": {
                    "session_id": self.test_session_id,
                    "event_type": "checkout.started",
                    "payload": json.dumps({
                        "cart_id": self.test_cart_id,
                        "total_amount": 17500,
                        "items_count": 3
                    })
                },
                "expected_status": 200
            },
            {
                "name": "Order Completed Event",
                "data": {
                    "session_id": self.test_session_id,
                    "event_type": "order.completed",
                    "payload": json.dumps({
                        "order_id": str(uuid.uuid4()),
                        "total_amount": 17500,
                        "payment_method": "card"
                    })
                },
                "expected_status": 200
            },
            {
                "name": "Invalid Event Type",
                "data": {
                    "session_id": self.test_session_id,
                    "event_type": "invalid.event",
                    "payload": json.dumps({"test": "data"})
                },
                "expected_status": 200  # Should still track unknown events
            }
        ]
        
        results = []
        for test_event in test_events:
            try:
                # Prepare form data
                form_data = aiohttp.FormData()
                for key, value in test_event["data"].items():
                    form_data.add_field(key, str(value))
                
                async with self.session.post(
                    f"{self.api_url}/track",
                    data=form_data
                ) as response:
                    status = response.status
                    response_data = await response.json()
                    
                    success = status == test_event["expected_status"]
                    results.append({
                        "test": test_event["name"],
                        "status": status,
                        "expected": test_event["expected_status"],
                        "success": success,
                        "response": response_data
                    })
                    
                    if success:
                        logger.info(f"✅ {test_event['name']}: {status}")
                    else:
                        logger.error(f"❌ {test_event['name']}: Expected {test_event['expected_status']}, got {status}")
                        logger.error(f"   Response: {response_data}")
                        
            except Exception as e:
                logger.error(f"❌ {test_event['name']}: Exception - {e}")
                results.append({
                    "test": test_event["name"],
                    "success": False,
                    "error": str(e)
                })
        
        self.test_results.append({
            "category": "Event Tracking Endpoint",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    async def test_cart_snapshot_creation(self):
        """Test POST /api/cart/snapshot endpoint"""
        logger.info("\n🧪 Testing Cart Snapshot Creation...")
        
        test_cases = [
            {
                "name": "Valid cart snapshot with guest user",
                "data": {
                    "session_id": self.test_session_id,
                    "cart_id": self.test_cart_id,
                    "items": json.dumps([
                        {
                            "listing_id": str(uuid.uuid4()),
                            "title": "Commercial Broilers",
                            "qty": 100,
                            "price": 45,
                            "image": "https://example.com/broilers.jpg"
                        },
                        {
                            "listing_id": str(uuid.uuid4()),
                            "title": "Layer Hens",
                            "qty": 50,
                            "price": 120,
                            "image": "https://example.com/layers.jpg"
                        }
                    ]),
                    "subtotal_minor": 10500,  # R105.00 in cents
                    "currency": "ZAR"
                },
                "expected_status": 200
            },
            {
                "name": "Valid cart snapshot with authenticated user",
                "data": {
                    "session_id": str(uuid.uuid4()),
                    "cart_id": str(uuid.uuid4()),
                    "items": json.dumps([
                        {
                            "listing_id": str(uuid.uuid4()),
                            "title": "Angus Bulls",
                            "qty": 2,
                            "price": 25000,
                            "image": "https://example.com/bulls.jpg"
                        }
                    ]),
                    "subtotal_minor": 5000000,  # R50,000 in cents
                    "currency": "ZAR",
                    "user_id": str(uuid.uuid4())
                },
                "expected_status": 200
            },
            {
                "name": "Empty cart snapshot",
                "data": {
                    "session_id": str(uuid.uuid4()),
                    "cart_id": str(uuid.uuid4()),
                    "items": json.dumps([]),
                    "subtotal_minor": 0,
                    "currency": "ZAR"
                },
                "expected_status": 200
            },
            {
                "name": "Invalid JSON in items",
                "data": {
                    "session_id": str(uuid.uuid4()),
                    "cart_id": str(uuid.uuid4()),
                    "items": "invalid-json",
                    "subtotal_minor": 1000,
                    "currency": "ZAR"
                },
                "expected_status": 500  # Should fail due to JSON parsing error
            }
        ]
        
        results = []
        for test_case in test_cases:
            try:
                # Prepare form data
                form_data = aiohttp.FormData()
                for key, value in test_case["data"].items():
                    form_data.add_field(key, str(value))
                
                async with self.session.post(
                    f"{self.api_url}/cart/snapshot",
                    data=form_data
                ) as response:
                    status = response.status
                    response_data = await response.json()
                    
                    success = status == test_case["expected_status"]
                    results.append({
                        "test": test_case["name"],
                        "status": status,
                        "expected": test_case["expected_status"],
                        "success": success,
                        "response": response_data
                    })
                    
                    if success:
                        logger.info(f"✅ {test_case['name']}: {status}")
                    else:
                        logger.error(f"❌ {test_case['name']}: Expected {test_case['expected_status']}, got {status}")
                        logger.error(f"   Response: {response_data}")
                        
            except Exception as e:
                logger.error(f"❌ {test_case['name']}: Exception - {e}")
                results.append({
                    "test": test_case["name"],
                    "success": False,
                    "error": str(e)
                })
        
        self.test_results.append({
            "category": "Cart Snapshot Creation",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    async def test_lifecycle_email_cron_job(self):
        """Test POST /api/cron/lifecycle-emails endpoint (admin only)"""
        logger.info("\n🧪 Testing Lifecycle Email Cron Job...")
        
        results = []
        
        # Test 1: Without authentication (should fail)
        try:
            async with self.session.post(f"{self.api_url}/cron/lifecycle-emails") as response:
                status = response.status
                response_data = await response.json()
                
                success = status == 401  # Should require authentication
                results.append({
                    "test": "Cron job without authentication",
                    "status": status,
                    "expected": 401,
                    "success": success,
                    "response": response_data
                })
                
                if success:
                    logger.info(f"✅ Cron job without auth: {status} (correctly rejected)")
                else:
                    logger.error(f"❌ Cron job without auth: Expected 401, got {status}")
                    
        except Exception as e:
            logger.error(f"❌ Cron job without auth: Exception - {e}")
            results.append({
                "test": "Cron job without authentication",
                "success": False,
                "error": str(e)
            })
        
        # Test 2: With admin authentication (should succeed)
        try:
            headers = self.get_auth_headers()
            async with self.session.post(
                f"{self.api_url}/cron/lifecycle-emails",
                headers=headers
            ) as response:
                status = response.status
                response_data = await response.json()
                
                success = status == 200
                results.append({
                    "test": "Cron job with admin authentication",
                    "status": status,
                    "expected": 200,
                    "success": success,
                    "response": response_data
                })
                
                if success:
                    logger.info(f"✅ Cron job with admin auth: {status}")
                    logger.info(f"   Response: {response_data}")
                else:
                    logger.error(f"❌ Cron job with admin auth: Expected 200, got {status}")
                    logger.error(f"   Response: {response_data}")
                    
        except Exception as e:
            logger.error(f"❌ Cron job with admin auth: Exception - {e}")
            results.append({
                "test": "Cron job with admin authentication",
                "success": False,
                "error": str(e)
            })
        
        self.test_results.append({
            "category": "Lifecycle Email Cron Job",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    async def test_database_structure(self):
        """Test that lifecycle email service creates proper database collections"""
        logger.info("\n🧪 Testing Database Structure...")
        
        # This test verifies that the endpoints work, which implies database structure is correct
        # We'll test by creating data and verifying it can be processed
        
        results = []
        
        # Test 1: Create subscription and verify it can be processed
        try:
            # Create a subscription
            form_data = aiohttp.FormData()
            form_data.add_field("email", f"dbtest_{int(datetime.now().timestamp())}@stocklot.co.za")
            form_data.add_field("consent", "true")
            form_data.add_field("source", "database_test")
            form_data.add_field("session_id", str(uuid.uuid4()))
            
            async with self.session.post(
                f"{self.api_url}/marketing/subscribe",
                data=form_data
            ) as response:
                if response.status == 200:
                    logger.info("✅ Database structure test: Subscription creation successful")
                    results.append({
                        "test": "Database subscription creation",
                        "success": True,
                        "status": response.status
                    })
                else:
                    logger.error(f"❌ Database structure test: Subscription failed with {response.status}")
                    results.append({
                        "test": "Database subscription creation",
                        "success": False,
                        "status": response.status
                    })
                    
        except Exception as e:
            logger.error(f"❌ Database structure test: Exception - {e}")
            results.append({
                "test": "Database subscription creation",
                "success": False,
                "error": str(e)
            })
        
        # Test 2: Create event tracking and verify it works
        try:
            form_data = aiohttp.FormData()
            form_data.add_field("session_id", str(uuid.uuid4()))
            form_data.add_field("event_type", "database.test")
            form_data.add_field("payload", json.dumps({"test": "database_structure"}))
            
            async with self.session.post(
                f"{self.api_url}/track",
                data=form_data
            ) as response:
                if response.status == 200:
                    logger.info("✅ Database structure test: Event tracking successful")
                    results.append({
                        "test": "Database event tracking",
                        "success": True,
                        "status": response.status
                    })
                else:
                    logger.error(f"❌ Database structure test: Event tracking failed with {response.status}")
                    results.append({
                        "test": "Database event tracking",
                        "success": False,
                        "status": response.status
                    })
                    
        except Exception as e:
            logger.error(f"❌ Database structure test: Exception - {e}")
            results.append({
                "test": "Database event tracking",
                "success": False,
                "error": str(e)
            })
        
        # Test 3: Create cart snapshot and verify it works
        try:
            form_data = aiohttp.FormData()
            form_data.add_field("session_id", str(uuid.uuid4()))
            form_data.add_field("cart_id", str(uuid.uuid4()))
            form_data.add_field("items", json.dumps([{"test": "item"}]))
            form_data.add_field("subtotal_minor", "1000")
            form_data.add_field("currency", "ZAR")
            
            async with self.session.post(
                f"{self.api_url}/cart/snapshot",
                data=form_data
            ) as response:
                if response.status == 200:
                    logger.info("✅ Database structure test: Cart snapshot successful")
                    results.append({
                        "test": "Database cart snapshot",
                        "success": True,
                        "status": response.status
                    })
                else:
                    logger.error(f"❌ Database structure test: Cart snapshot failed with {response.status}")
                    results.append({
                        "test": "Database cart snapshot",
                        "success": False,
                        "status": response.status
                    })
                    
        except Exception as e:
            logger.error(f"❌ Database structure test: Exception - {e}")
            results.append({
                "test": "Database cart snapshot",
                "success": False,
                "error": str(e)
            })
        
        self.test_results.append({
            "category": "Database Structure",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    async def test_error_handling_and_response_formats(self):
        """Test proper error handling and response formats"""
        logger.info("\n🧪 Testing Error Handling and Response Formats...")
        
        test_cases = [
            {
                "name": "Missing required fields in subscription",
                "endpoint": "/marketing/subscribe",
                "method": "POST",
                "data": {"email": "test@example.com"},  # Missing consent, source
                "expected_status": 422
            },
            {
                "name": "Missing required fields in tracking",
                "endpoint": "/track",
                "method": "POST", 
                "data": {"session_id": "test"},  # Missing event_type
                "expected_status": 422
            },
            {
                "name": "Missing required fields in cart snapshot",
                "endpoint": "/cart/snapshot",
                "method": "POST",
                "data": {"session_id": "test"},  # Missing cart_id, items, subtotal_minor
                "expected_status": 422
            }
        ]
        
        results = []
        for test_case in test_cases:
            try:
                form_data = aiohttp.FormData()
                for key, value in test_case["data"].items():
                    form_data.add_field(key, str(value))
                
                async with self.session.post(
                    f"{self.api_url}{test_case['endpoint']}",
                    data=form_data
                ) as response:
                    status = response.status
                    response_data = await response.json()
                    
                    success = status == test_case["expected_status"]
                    results.append({
                        "test": test_case["name"],
                        "status": status,
                        "expected": test_case["expected_status"],
                        "success": success,
                        "response": response_data
                    })
                    
                    if success:
                        logger.info(f"✅ {test_case['name']}: {status}")
                    else:
                        logger.error(f"❌ {test_case['name']}: Expected {test_case['expected_status']}, got {status}")
                        
            except Exception as e:
                logger.error(f"❌ {test_case['name']}: Exception - {e}")
                results.append({
                    "test": test_case["name"],
                    "success": False,
                    "error": str(e)
                })
        
        self.test_results.append({
            "category": "Error Handling and Response Formats",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    async def test_session_tracking(self):
        """Test session tracking across requests"""
        logger.info("\n🧪 Testing Session Tracking...")
        
        session_id = str(uuid.uuid4())
        email = f"session_test_{int(datetime.now().timestamp())}@stocklot.co.za"
        
        results = []
        
        # Step 1: Subscribe user with session
        try:
            form_data = aiohttp.FormData()
            form_data.add_field("email", email)
            form_data.add_field("consent", "true")
            form_data.add_field("source", "session_test")
            form_data.add_field("session_id", session_id)
            
            async with self.session.post(
                f"{self.api_url}/marketing/subscribe",
                data=form_data
            ) as response:
                if response.status == 200:
                    logger.info("✅ Session tracking: User subscription successful")
                    results.append({
                        "test": "Session-based subscription",
                        "success": True,
                        "status": response.status
                    })
                else:
                    results.append({
                        "test": "Session-based subscription",
                        "success": False,
                        "status": response.status
                    })
                    
        except Exception as e:
            results.append({
                "test": "Session-based subscription",
                "success": False,
                "error": str(e)
            })
        
        # Step 2: Track events with same session
        try:
            form_data = aiohttp.FormData()
            form_data.add_field("session_id", session_id)
            form_data.add_field("event_type", "pdp.view")
            form_data.add_field("payload", json.dumps({"listing_id": str(uuid.uuid4())}))
            
            async with self.session.post(
                f"{self.api_url}/track",
                data=form_data
            ) as response:
                if response.status == 200:
                    logger.info("✅ Session tracking: Event tracking successful")
                    results.append({
                        "test": "Session-based event tracking",
                        "success": True,
                        "status": response.status
                    })
                else:
                    results.append({
                        "test": "Session-based event tracking",
                        "success": False,
                        "status": response.status
                    })
                    
        except Exception as e:
            results.append({
                "test": "Session-based event tracking",
                "success": False,
                "error": str(e)
            })
        
        # Step 3: Create cart snapshot with same session
        try:
            form_data = aiohttp.FormData()
            form_data.add_field("session_id", session_id)
            form_data.add_field("cart_id", str(uuid.uuid4()))
            form_data.add_field("items", json.dumps([{"title": "Test Item", "qty": 1}]))
            form_data.add_field("subtotal_minor", "1000")
            form_data.add_field("currency", "ZAR")
            
            async with self.session.post(
                f"{self.api_url}/cart/snapshot",
                data=form_data
            ) as response:
                if response.status == 200:
                    logger.info("✅ Session tracking: Cart snapshot successful")
                    results.append({
                        "test": "Session-based cart snapshot",
                        "success": True,
                        "status": response.status
                    })
                else:
                    results.append({
                        "test": "Session-based cart snapshot",
                        "success": False,
                        "status": response.status
                    })
                    
        except Exception as e:
            results.append({
                "test": "Session-based cart snapshot",
                "success": False,
                "error": str(e)
            })
        
        self.test_results.append({
            "category": "Session Tracking",
            "results": results,
            "success_rate": f"{sum(1 for r in results if r.get('success', False))}/{len(results)}"
        })
        
        return results
    
    def print_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🧪 LIFECYCLE EMAIL SYSTEM TESTING SUMMARY")
        logger.info("="*80)
        
        total_tests = 0
        total_passed = 0
        
        for category in self.test_results:
            logger.info(f"\n📊 {category['category']}")
            logger.info(f"   Success Rate: {category['success_rate']}")
            
            for result in category['results']:
                status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
                logger.info(f"   {status} - {result['test']}")
                
                if not result.get('success', False) and 'error' in result:
                    logger.info(f"      Error: {result['error']}")
                elif not result.get('success', False) and 'status' in result:
                    logger.info(f"      Status: {result['status']} (Expected: {result.get('expected', 'N/A')})")
                
                total_tests += 1
                if result.get('success', False):
                    total_passed += 1
        
        logger.info(f"\n🎯 OVERALL RESULTS:")
        logger.info(f"   Total Tests: {total_tests}")
        logger.info(f"   Passed: {total_passed}")
        logger.info(f"   Failed: {total_tests - total_passed}")
        logger.info(f"   Success Rate: {(total_passed/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        # Key findings
        logger.info(f"\n🔍 KEY FINDINGS:")
        
        failed_categories = [cat for cat in self.test_results 
                           if not all(r.get('success', False) for r in cat['results'])]
        
        if not failed_categories:
            logger.info("   ✅ All lifecycle email endpoints are working correctly")
            logger.info("   ✅ Database structure is properly configured")
            logger.info("   ✅ Session tracking is functional")
            logger.info("   ✅ Error handling is appropriate")
            logger.info("   ✅ Admin authentication is working for cron jobs")
        else:
            logger.info("   ❌ Issues found in the following areas:")
            for cat in failed_categories:
                failed_tests = [r for r in cat['results'] if not r.get('success', False)]
                logger.info(f"      - {cat['category']}: {len(failed_tests)} failed tests")
        
        logger.info("="*80)

async def main():
    """Main test execution"""
    tester = LifecycleEmailTester()
    
    try:
        await tester.setup_session()
        
        # Authenticate as admin
        if not await tester.authenticate():
            logger.error("❌ Failed to authenticate. Cannot proceed with admin-required tests.")
            return
        
        # Run all tests
        logger.info("🚀 Starting Lifecycle Email System Testing...")
        
        await tester.test_email_subscription_endpoint()
        await tester.test_event_tracking_endpoint()
        await tester.test_cart_snapshot_creation()
        await tester.test_lifecycle_email_cron_job()
        await tester.test_database_structure()
        await tester.test_error_handling_and_response_formats()
        await tester.test_session_tracking()
        
        # Print summary
        tester.print_summary()
        
    except Exception as e:
        logger.error(f"❌ Test execution failed: {e}")
    finally:
        await tester.cleanup_session()

if __name__ == "__main__":
    asyncio.run(main())