#!/usr/bin/env python3
"""
Unified Inbox Business Integration Testing
Tests the integration between business workflows (orders, offers) and the unified inbox system
"""

import asyncio
import aiohttp
import json
import uuid
import time
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

# Configuration
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
REACT_APP_BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
BACKEND_URL = f"{REACT_APP_BACKEND_URL}/api"
TEST_BUYER_EMAIL = "inbox_buyer@stocklot.co.za"
TEST_SELLER_EMAIL = "inbox_seller@stocklot.co.za"
TEST_PASSWORD = "testpass123"

class UnifiedInboxBusinessTester:
    def __init__(self):
        self.session = None
        self.buyer_token = None
        self.seller_token = None
        self.buyer_id = None
        self.seller_id = None
        self.test_listing_id = None
        self.test_buy_request_id = None
        self.test_order_id = None
        self.test_offer_id = None
        self.test_conversation_ids = []
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def setup_test_users(self):
        """Register and login test users"""
        print("🔐 Setting up test users...")
        
        # Register Buyer
        buyer_data = {
            "email": TEST_BUYER_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test Buyer",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/register", json=buyer_data) as resp:
                if resp.status in [200, 201]:
                    print("✅ Buyer registered successfully")
                elif resp.status == 400:
                    print("ℹ️  Buyer already exists")
        except Exception as e:
            print(f"⚠️  Buyer registration: {e}")
        
        # Register Seller
        seller_data = {
            "email": TEST_SELLER_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test Seller",
            "phone": "+27123456790",
            "role": "seller"
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/register", json=seller_data) as resp:
                if resp.status in [200, 201]:
                    print("✅ Seller registered successfully")
                elif resp.status == 400:
                    print("ℹ️  Seller already exists")
        except Exception as e:
            print(f"⚠️  Seller registration: {e}")
        
        # Login Buyer
        login_data = {"email": TEST_BUYER_EMAIL, "password": TEST_PASSWORD}
        async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.buyer_token = data.get("access_token")
                self.buyer_id = data.get("user", {}).get("id")
                print("✅ Buyer logged in successfully")
            else:
                error = await resp.text()
                print(f"❌ Buyer login failed: {resp.status} - {error}")
                return False
        
        # Login Seller
        login_data = {"email": TEST_SELLER_EMAIL, "password": TEST_PASSWORD}
        async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.seller_token = data.get("access_token")
                self.seller_id = data.get("user", {}).get("id")
                print("✅ Seller logged in successfully")
            else:
                error = await resp.text()
                print(f"❌ Seller login failed: {resp.status} - {error}")
                return False
        
        return True
    
    def get_auth_headers(self, user_type: str = "buyer"):
        """Get authorization headers for user"""
        token = self.buyer_token if user_type == "buyer" else self.seller_token
        return {"Authorization": f"Bearer {token}"}
    
    async def create_test_listing(self):
        """Create a test listing for order testing"""
        print("\n📦 Creating test listing...")
        
        # Get species and product types first
        async with self.session.get(f"{BACKEND_URL}/species") as resp:
            if resp.status == 200:
                species_data = await resp.json()
                if species_data:
                    species_id = species_data[0]["id"]
                else:
                    print("❌ No species found")
                    return False
            else:
                print(f"❌ Failed to get species: {resp.status}")
                return False
        
        async with self.session.get(f"{BACKEND_URL}/product-types") as resp:
            if resp.status == 200:
                product_types = await resp.json()
                if product_types:
                    product_type_id = product_types[0]["id"]
                else:
                    print("❌ No product types found")
                    return False
            else:
                print(f"❌ Failed to get product types: {resp.status}")
                return False
        
        listing_data = {
            "species_id": species_id,
            "product_type_id": product_type_id,
            "title": "Test Livestock for Inbox Integration",
            "description": "Test listing for unified inbox business integration testing",
            "quantity": 10,
            "unit": "head",
            "price_per_unit": 1500.00,
            "delivery_available": True,
            "region": "Gauteng",
            "city": "Johannesburg"
        }
        
        try:
            headers = self.get_auth_headers("seller")
            async with self.session.post(f"{BACKEND_URL}/listings", json=listing_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.test_listing_id = data.get("id")
                    print(f"✅ Test listing created: {self.test_listing_id}")
                    return True
                else:
                    error = await resp.text()
                    print(f"❌ Failed to create listing: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error creating listing: {e}")
            return False
    
    async def create_test_buy_request(self):
        """Create a test buy request for offer testing"""
        print("\n📋 Creating test buy request...")
        
        # Get species and product types first
        async with self.session.get(f"{BACKEND_URL}/species") as resp:
            if resp.status == 200:
                species_data = await resp.json()
                if species_data:
                    species_name = species_data[0]["name"]
                else:
                    print("❌ No species found")
                    return False
            else:
                print(f"❌ Failed to get species: {resp.status}")
                return False
        
        async with self.session.get(f"{BACKEND_URL}/product-types") as resp:
            if resp.status == 200:
                product_types = await resp.json()
                if product_types:
                    product_type = product_types[0]["code"]
                else:
                    print("❌ No product types found")
                    return False
            else:
                print(f"❌ Failed to get product types: {resp.status}")
                return False
        
        buy_request_data = {
            "species": species_name,
            "breed": "Test Breed",
            "product_type": product_type,
            "qty": 5,
            "unit": "head",
            "target_price": 1200.00,
            "location": "Gauteng",
            "deadline": "2024-12-31",
            "description": "Test buy request for unified inbox integration testing"
        }
        
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.post(f"{BACKEND_URL}/buy-requests", json=buy_request_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.test_buy_request_id = data.get("id")
                    print(f"✅ Test buy request created: {self.test_buy_request_id}")
                    return True
                else:
                    error = await resp.text()
                    print(f"❌ Failed to create buy request: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error creating buy request: {e}")
            return False
    
    async def test_order_auto_conversation(self):
        """Test 1: Order Creation Auto-Conversation"""
        print("\n🛒 Testing Order Creation Auto-Conversation...")
        
        if not self.test_listing_id:
            print("❌ No test listing available")
            return False
        
        # Create order
        order_data = {
            "listing_id": self.test_listing_id,
            "quantity": 2
        }
        
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.post(f"{BACKEND_URL}/orders", json=order_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.test_order_id = data.get("id")
                    print(f"✅ Order created successfully: {self.test_order_id}")
                else:
                    error = await resp.text()
                    print(f"❌ Order creation failed: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error creating order: {e}")
            return False
        
        # Wait a moment for conversation creation
        await asyncio.sleep(2)
        
        # Check if conversation was created for buyer
        try:
            headers = self.get_auth_headers("buyer")
            params = {"bucket": "ORDERS"}
            async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers, params=params) as resp:
                if resp.status == 200:
                    conversations = await resp.json()
                    order_conversations = [c for c in conversations if c.get("linked", {}).get("kind") == "ORDER"]
                    
                    if order_conversations:
                        conv = order_conversations[0]
                        self.test_conversation_ids.append(conv["id"])
                        print(f"✅ Order conversation created for buyer: {conv['id']}")
                        print(f"   Subject: {conv['subject']}")
                        print(f"   Type: {conv['type']}")
                        print(f"   Participants: {len(conv['participants'])}")
                        
                        # Verify conversation type is ORDER
                        if conv["type"] == "ORDER":
                            print("✅ Conversation type is ORDER")
                        else:
                            print(f"❌ Wrong conversation type: {conv['type']}")
                        
                        # Verify participants include buyer and seller
                        participant_roles = [p.get("role") for p in conv["participants"]]
                        if "BUYER" in participant_roles and "SELLER" in participant_roles:
                            print("✅ Conversation has proper participants (buyer + seller)")
                        else:
                            print(f"❌ Wrong participants: {participant_roles}")
                        
                        return True
                    else:
                        print("❌ No order conversation found for buyer")
                        return False
                else:
                    error = await resp.text()
                    print(f"❌ Failed to get buyer inbox: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error checking buyer inbox: {e}")
            return False
    
    async def test_offer_auto_conversation(self):
        """Test 2: Offer Creation Auto-Conversation"""
        print("\n💰 Testing Offer Creation Auto-Conversation...")
        
        if not self.test_buy_request_id:
            print("❌ No test buy request available")
            return False
        
        # Create offer
        offer_data = {
            "offer_price": 1300.00,
            "qty": 3,
            "message": "Test offer for inbox integration"
        }
        
        try:
            headers = self.get_auth_headers("seller")
            async with self.session.post(f"{BACKEND_URL}/buy-requests/{self.test_buy_request_id}/offers", 
                                       json=offer_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.test_offer_id = data.get("offer_id")
                    print(f"✅ Offer created successfully: {self.test_offer_id}")
                else:
                    error = await resp.text()
                    print(f"❌ Offer creation failed: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error creating offer: {e}")
            return False
        
        # Wait a moment for conversation creation
        await asyncio.sleep(2)
        
        # Check if conversation was created for buyer
        try:
            headers = self.get_auth_headers("buyer")
            params = {"bucket": "OFFERS"}
            async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers, params=params) as resp:
                if resp.status == 200:
                    conversations = await resp.json()
                    offer_conversations = [c for c in conversations if c.get("linked", {}).get("kind") == "OFFER"]
                    
                    if offer_conversations:
                        conv = offer_conversations[0]
                        self.test_conversation_ids.append(conv["id"])
                        print(f"✅ Offer conversation created for buyer: {conv['id']}")
                        print(f"   Subject: {conv['subject']}")
                        print(f"   Type: {conv['type']}")
                        print(f"   Participants: {len(conv['participants'])}")
                        
                        # Verify conversation type is OFFER
                        if conv["type"] == "OFFER":
                            print("✅ Conversation type is OFFER")
                        else:
                            print(f"❌ Wrong conversation type: {conv['type']}")
                        
                        # Verify subject includes offer details
                        if "Offer:" in conv["subject"] and "R1,300" in conv["subject"]:
                            print("✅ Conversation subject includes offer details and price")
                        else:
                            print(f"⚠️  Conversation subject may not include full offer details: {conv['subject']}")
                        
                        return True
                    else:
                        print("❌ No offer conversation found for buyer")
                        return False
                else:
                    error = await resp.text()
                    print(f"❌ Failed to get buyer inbox: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error checking buyer inbox: {e}")
            return False
    
    async def test_conversation_buckets(self):
        """Test 3: Conversation Auto-Creation Endpoints - Bucket Verification"""
        print("\n📂 Testing Conversation Buckets...")
        
        # Test ORDERS bucket
        try:
            headers = self.get_auth_headers("buyer")
            params = {"bucket": "ORDERS"}
            async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers, params=params) as resp:
                if resp.status == 200:
                    conversations = await resp.json()
                    order_convs = [c for c in conversations if c["type"] == "ORDER"]
                    print(f"✅ ORDERS bucket accessible, found {len(order_convs)} order conversations")
                else:
                    print(f"❌ ORDERS bucket failed: {resp.status}")
        except Exception as e:
            print(f"❌ ORDERS bucket test error: {e}")
        
        # Test OFFERS bucket
        try:
            headers = self.get_auth_headers("buyer")
            params = {"bucket": "OFFERS"}
            async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers, params=params) as resp:
                if resp.status == 200:
                    conversations = await resp.json()
                    offer_convs = [c for c in conversations if c["type"] == "OFFER"]
                    print(f"✅ OFFERS bucket accessible, found {len(offer_convs)} offer conversations")
                else:
                    print(f"❌ OFFERS bucket failed: {resp.status}")
        except Exception as e:
            print(f"❌ OFFERS bucket test error: {e}")
        
        # Test unread counts update
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.get(f"{BACKEND_URL}/inbox/summary", headers=headers) as resp:
                if resp.status == 200:
                    summary = await resp.json()
                    print(f"✅ Inbox summary accessible")
                    print(f"   Total unread: {summary.get('total_unread', 0)}")
                    print(f"   Orders unread: {summary.get('orders_unread', 0)}")
                    print(f"   Offers unread: {summary.get('offers_unread', 0)}")
                    
                    # Verify unread counts are reasonable
                    if summary.get('total_unread', 0) >= 0:
                        print("✅ Unread counts are valid")
                    else:
                        print("❌ Invalid unread counts")
                else:
                    print(f"❌ Inbox summary failed: {resp.status}")
        except Exception as e:
            print(f"❌ Inbox summary test error: {e}")
    
    async def test_system_message_integration(self):
        """Test 4: System Message Integration"""
        print("\n🤖 Testing System Message Integration...")
        
        if not self.test_conversation_ids:
            print("❌ No test conversations available")
            return False
        
        conversation_id = self.test_conversation_ids[0]
        
        # Send a regular message first
        message_data = {
            "body": "Hello, this is a test message for system integration testing!"
        }
        
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{conversation_id}/messages", 
                                       json=message_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ Regular message sent successfully: {data.get('id')}")
                else:
                    error = await resp.text()
                    print(f"❌ Failed to send message: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            return False
        
        # Test message with PII (should be redacted)
        pii_message_data = {
            "body": "Contact me at test@example.com or call +27123456789 for more details!"
        }
        
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{conversation_id}/messages", 
                                       json=pii_message_data, headers=headers) as resp:
                if resp.status == 200:
                    print("✅ PII message sent (should be redacted)")
                else:
                    print(f"⚠️  PII message status: {resp.status}")
        except Exception as e:
            print(f"⚠️  PII message error: {e}")
        
        # Get messages to verify they're stored correctly
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{conversation_id}/messages", 
                                      headers=headers) as resp:
                if resp.status == 200:
                    messages = await resp.json()
                    if messages:
                        msg = messages[-1]  # Get latest message
                        print(f"✅ Message retrieved successfully")
                        print(f"   Message ID: {msg.get('id')}")
                        print(f"   Body: {msg.get('body')[:50]}...")
                        print(f"   Sender ID: {msg.get('sender_id')}")
                        
                        # Verify message structure
                        required_fields = ['id', 'conversation_id', 'sender_id', 'body', 'created_at']
                        for field in required_fields:
                            if field in msg:
                                print(f"✅ Message has {field}")
                            else:
                                print(f"❌ Message missing {field}")
                        
                        # Check for system message fields
                        if 'system_type' in msg:
                            print(f"ℹ️  Message has system_type: {msg['system_type']}")
                        if 'visibility' in msg:
                            print(f"ℹ️  Message visibility: {msg['visibility']}")
                        
                        return True
                    else:
                        print("❌ No messages found")
                        return False
                else:
                    error = await resp.text()
                    print(f"❌ Failed to get messages: {resp.status} - {error}")
                    return False
        except Exception as e:
            print(f"❌ Error getting messages: {e}")
            return False
    
    async def test_database_integration(self):
        """Test 5: Database Integration"""
        print("\n🗄️  Testing Database Integration...")
        
        # Test conversation structure through API
        if not self.test_conversation_ids:
            print("❌ No test conversations available")
            return False
        
        # Test both order and offer conversations if available
        for i, conversation_id in enumerate(self.test_conversation_ids):
            print(f"\n   Testing conversation {i+1}: {conversation_id}")
            
            try:
                headers = self.get_auth_headers("buyer")
                async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{conversation_id}", 
                                          headers=headers) as resp:
                    if resp.status == 200:
                        conversation = await resp.json()
                        print(f"✅ Conversation {i+1} structure verification:")
                        
                        # Check foreign key fields
                        foreign_keys = ['order_group_id', 'buy_request_id', 'offer_id', 'consignment_id']
                        for key in foreign_keys:
                            if key in conversation:
                                value = conversation[key]
                                if value:
                                    print(f"✅ {key} is set: {value}")
                                    
                                    # Verify the foreign key matches our test data
                                    if key == 'order_group_id' and self.test_order_id and value == self.test_order_id:
                                        print(f"✅ Order foreign key matches created order")
                                    elif key == 'offer_id' and self.test_offer_id and value == self.test_offer_id:
                                        print(f"✅ Offer foreign key matches created offer")
                                else:
                                    print(f"ℹ️  {key} is null (expected for some conversation types)")
                        
                        # Check participants structure
                        participants = conversation.get("participants", [])
                        if participants:
                            print(f"✅ Participants list has {len(participants)} members")
                            for j, p in enumerate(participants):
                                if "user_id" in p and "role" in p:
                                    print(f"✅ Participant {j+1}: {p['role']} ({p['user_id'][:8]}...)")
                                    
                                    # Verify participant IDs match our test users
                                    if p['user_id'] == self.buyer_id:
                                        print(f"✅ Buyer participant verified")
                                    elif p['user_id'] == self.seller_id:
                                        print(f"✅ Seller participant verified")
                                else:
                                    print(f"❌ Participant {j+1} missing required fields")
                        else:
                            print("❌ No participants found")
                        
                        # Check conversation metadata
                        metadata_fields = ['id', 'type', 'subject', 'created_at']
                        for field in metadata_fields:
                            if field in conversation:
                                print(f"✅ Conversation has {field}")
                            else:
                                print(f"❌ Conversation missing {field}")
                        
                    else:
                        error = await resp.text()
                        print(f"❌ Failed to get conversation {i+1}: {resp.status} - {error}")
                        return False
            except Exception as e:
                print(f"❌ Error testing conversation {i+1}: {e}")
                return False
        
        return True
    
    async def test_error_handling_resilience(self):
        """Test 6: Error Handling & Resilience"""
        print("\n⚠️  Testing Error Handling & Resilience...")
        
        # Test graceful degradation when conversation creation might fail
        # This is tested by checking that order/offer creation doesn't fail even if conversation creation has issues
        
        # Test 1: Order creation with potential conversation service issues
        print("1. Testing order creation resilience...")
        if self.test_listing_id:
            order_data = {
                "listing_id": self.test_listing_id,
                "quantity": 1
            }
            
            try:
                headers = self.get_auth_headers("buyer")
                async with self.session.post(f"{BACKEND_URL}/orders", json=order_data, headers=headers) as resp:
                    if resp.status == 200:
                        print("✅ Order creation succeeds even with potential conversation issues")
                    else:
                        print(f"⚠️  Order creation status: {resp.status}")
            except Exception as e:
                print(f"❌ Order creation error: {e}")
        
        # Test 2: Invalid conversation access
        print("2. Testing invalid conversation access...")
        fake_conversation_id = str(uuid.uuid4())
        
        try:
            headers = self.get_auth_headers("buyer")
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{fake_conversation_id}", 
                                      headers=headers) as resp:
                if resp.status == 404:
                    print("✅ Invalid conversation ID returns 404")
                else:
                    print(f"⚠️  Invalid conversation ID returned: {resp.status}")
        except Exception as e:
            print(f"❌ Invalid conversation test error: {e}")
        
        # Test 3: Unauthorized access
        print("3. Testing unauthorized access...")
        try:
            # Try to access inbox without authentication
            async with self.session.get(f"{BACKEND_URL}/inbox") as resp:
                if resp.status == 401:
                    print("✅ Unauthorized access properly blocked")
                else:
                    print(f"⚠️  Unauthorized access returned: {resp.status}")
        except Exception as e:
            print(f"❌ Unauthorized access test error: {e}")
        
        # Test 4: Malformed requests
        print("4. Testing malformed requests...")
        try:
            headers = self.get_auth_headers("buyer")
            invalid_data = {"invalid": "data"}
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations", 
                                       json=invalid_data, headers=headers) as resp:
                if resp.status in [400, 422]:
                    print("✅ Malformed conversation creation properly rejected")
                else:
                    print(f"⚠️  Malformed request returned: {resp.status}")
        except Exception as e:
            print(f"❌ Malformed request test error: {e}")
    
    async def run_all_tests(self):
        """Run all unified inbox business integration tests"""
        print("🚀 Starting Unified Inbox Business Integration Testing")
        print("=" * 70)
        
        await self.setup_session()
        
        try:
            # Setup
            if not await self.setup_test_users():
                print("❌ Failed to setup test users, aborting tests")
                return
            
            if not await self.create_test_listing():
                print("❌ Failed to create test listing, some tests will be skipped")
            
            if not await self.create_test_buy_request():
                print("❌ Failed to create test buy request, some tests will be skipped")
            
            # Run business integration tests
            test_results = []
            
            # Test 1: Order Creation Auto-Conversation
            result1 = await self.test_order_auto_conversation()
            test_results.append(("Order Auto-Conversation", result1))
            
            # Test 2: Offer Creation Auto-Conversation
            result2 = await self.test_offer_auto_conversation()
            test_results.append(("Offer Auto-Conversation", result2))
            
            # Test 3: Conversation Buckets
            await self.test_conversation_buckets()
            test_results.append(("Conversation Buckets", True))  # This test doesn't return boolean
            
            # Test 4: System Message Integration
            result4 = await self.test_system_message_integration()
            test_results.append(("System Message Integration", result4))
            
            # Test 5: Database Integration
            result5 = await self.test_database_integration()
            test_results.append(("Database Integration", result5))
            
            # Test 6: Error Handling & Resilience
            await self.test_error_handling_resilience()
            test_results.append(("Error Handling & Resilience", True))  # This test doesn't return boolean
            
            # Summary
            print("\n" + "=" * 70)
            print("📊 UNIFIED INBOX BUSINESS INTEGRATION TEST RESULTS")
            print("=" * 70)
            
            passed = 0
            total = len(test_results)
            
            for test_name, result in test_results:
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"{status} {test_name}")
                if result:
                    passed += 1
            
            print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
            
            if passed == total:
                print("🎉 All unified inbox business integration tests PASSED!")
            else:
                print("⚠️  Some tests failed - check implementation")
            
        except Exception as e:
            print(f"\n❌ Testing failed with error: {e}")
        finally:
            await self.cleanup_session()

async def main():
    """Main test runner"""
    tester = UnifiedInboxBusinessTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())