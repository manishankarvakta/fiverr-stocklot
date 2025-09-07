#!/usr/bin/env python3
"""
Comprehensive Unified Inbox System Backend Testing
Tests all inbox endpoints including SSE, conversations, messages, and data validation
"""

import asyncio
import aiohttp
import json
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

# Configuration
BACKEND_URL = "http://localhost:8001/api"
TEST_USER_EMAIL = "inbox_test_user@stocklot.co.za"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_2_EMAIL = "inbox_test_user2@stocklot.co.za"
TEST_USER_2_PASSWORD = "testpass123"

class UnifiedInboxTester:
    def __init__(self):
        self.session = None
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.test_conversation_id = None
        self.test_message_id = None
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def register_and_login_users(self):
        """Register and login test users"""
        print("🔐 Setting up test users...")
        
        # Register User 1
        user1_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": "Inbox Test User 1",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/register", json=user1_data) as resp:
                if resp.status in [200, 201]:
                    print("✅ User 1 registered successfully")
                elif resp.status == 400:
                    print("ℹ️  User 1 already exists")
        except Exception as e:
            print(f"⚠️  User 1 registration: {e}")
        
        # Register User 2
        user2_data = {
            "email": TEST_USER_2_EMAIL,
            "password": TEST_USER_2_PASSWORD,
            "full_name": "Inbox Test User 2",
            "phone": "+27123456790",
            "role": "seller"
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/register", json=user2_data) as resp:
                if resp.status in [200, 201]:
                    print("✅ User 2 registered successfully")
                elif resp.status == 400:
                    print("ℹ️  User 2 already exists")
        except Exception as e:
            print(f"⚠️  User 2 registration: {e}")
        
        # Login User 1
        login1_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        async with self.session.post(f"{BACKEND_URL}/auth/login", json=login1_data) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.user1_token = data.get("access_token")
                self.user1_id = data.get("user", {}).get("id")
                print("✅ User 1 logged in successfully")
            else:
                error = await resp.text()
                print(f"❌ User 1 login failed: {resp.status} - {error}")
                return False
        
        # Login User 2
        login2_data = {"email": TEST_USER_2_EMAIL, "password": TEST_USER_2_PASSWORD}
        async with self.session.post(f"{BACKEND_URL}/auth/login", json=login2_data) as resp:
            if resp.status == 200:
                data = await resp.json()
                self.user2_token = data.get("access_token")
                self.user2_id = data.get("user", {}).get("id")
                print("✅ User 2 logged in successfully")
            else:
                error = await resp.text()
                print(f"❌ User 2 login failed: {resp.status} - {error}")
                return False
        
        return True
    
    def get_auth_headers(self, user_num: int = 1):
        """Get authorization headers for user"""
        token = self.user1_token if user_num == 1 else self.user2_token
        return {"Authorization": f"Bearer {token}"}
    
    async def test_sse_endpoint(self):
        """Test SSE endpoint for real-time updates"""
        print("\n📡 Testing SSE Endpoint...")
        
        # Test 1: SSE endpoint without authentication
        print("1. Testing SSE without authentication...")
        try:
            async with self.session.get(f"{BACKEND_URL}/inbox/events") as resp:
                if resp.status == 401:
                    print("✅ SSE correctly requires authentication")
                else:
                    print(f"❌ SSE should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ SSE no-auth test error: {e}")
        
        # Test 2: SSE endpoint with authentication
        print("2. Testing SSE with authentication...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox/events", headers=headers) as resp:
                if resp.status == 200:
                    print("✅ SSE endpoint accessible with authentication")
                    
                    # Check headers
                    content_type = resp.headers.get('content-type', '')
                    if 'text/event-stream' in content_type:
                        print("✅ SSE returns correct content-type")
                    else:
                        print(f"❌ SSE wrong content-type: {content_type}")
                    
                    # Check for required headers
                    cache_control = resp.headers.get('cache-control', '')
                    if 'no-cache' in cache_control:
                        print("✅ SSE has correct cache-control header")
                    else:
                        print(f"❌ SSE missing no-cache header: {cache_control}")
                    
                    # Try to read initial event (with timeout)
                    try:
                        # Read first chunk with timeout
                        chunk = await asyncio.wait_for(resp.content.read(1024), timeout=5.0)
                        if chunk:
                            chunk_str = chunk.decode('utf-8')
                            if 'event: connected' in chunk_str:
                                print("✅ SSE sends connection confirmation")
                            else:
                                print(f"⚠️  SSE unexpected initial data: {chunk_str[:100]}")
                        else:
                            print("⚠️  SSE no initial data received")
                    except asyncio.TimeoutError:
                        print("⚠️  SSE connection timeout (expected for streaming)")
                    except Exception as e:
                        print(f"⚠️  SSE stream read error: {e}")
                else:
                    error = await resp.text()
                    print(f"❌ SSE auth test failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ SSE auth test error: {e}")
    
    async def test_inbox_summary(self):
        """Test inbox summary endpoint"""
        print("\n📊 Testing Inbox Summary...")
        
        # Test 1: Without authentication
        print("1. Testing summary without authentication...")
        try:
            async with self.session.get(f"{BACKEND_URL}/inbox/summary") as resp:
                if resp.status == 401:
                    print("✅ Summary correctly requires authentication")
                else:
                    print(f"❌ Summary should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Summary no-auth test error: {e}")
        
        # Test 2: With authentication
        print("2. Testing summary with authentication...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox/summary", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print("✅ Summary endpoint accessible")
                    
                    # Check required fields
                    required_fields = ['total_unread', 'orders_unread', 'offers_unread', 
                                     'requests_unread', 'logistics_unread', 'system_unread']
                    
                    for field in required_fields:
                        if field in data:
                            print(f"✅ Summary has {field}: {data[field]}")
                        else:
                            print(f"❌ Summary missing {field}")
                    
                    # Validate data types
                    for field in required_fields:
                        if field in data and isinstance(data[field], int):
                            print(f"✅ {field} is integer")
                        else:
                            print(f"❌ {field} should be integer")
                else:
                    error = await resp.text()
                    print(f"❌ Summary test failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Summary test error: {e}")
    
    async def test_inbox_listing(self):
        """Test inbox listing with bucket filters"""
        print("\n📋 Testing Inbox Listing...")
        
        # Test 1: Without authentication
        print("1. Testing inbox without authentication...")
        try:
            async with self.session.get(f"{BACKEND_URL}/inbox") as resp:
                if resp.status == 401:
                    print("✅ Inbox correctly requires authentication")
                else:
                    print(f"❌ Inbox should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Inbox no-auth test error: {e}")
        
        # Test 2: Default inbox (ALL bucket)
        print("2. Testing default inbox...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ Default inbox accessible, found {len(data)} conversations")
                    
                    # Validate response structure
                    if isinstance(data, list):
                        print("✅ Inbox returns list")
                        
                        if len(data) > 0:
                            conv = data[0]
                            required_fields = ['id', 'subject', 'type', 'participants', 'unread_count']
                            for field in required_fields:
                                if field in conv:
                                    print(f"✅ Conversation has {field}")
                                else:
                                    print(f"❌ Conversation missing {field}")
                    else:
                        print(f"❌ Inbox should return list, got: {type(data)}")
                else:
                    error = await resp.text()
                    print(f"❌ Default inbox test failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Default inbox test error: {e}")
        
        # Test 3: Bucket filters
        buckets = ["ALL", "ORDERS", "OFFERS", "REQUESTS", "LOGISTICS", "SYSTEM"]
        print("3. Testing bucket filters...")
        
        for bucket in buckets:
            try:
                headers = self.get_auth_headers(1)
                params = {"bucket": bucket}
                async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"✅ {bucket} bucket accessible, found {len(data)} conversations")
                    else:
                        error = await resp.text()
                        print(f"❌ {bucket} bucket failed: {resp.status} - {error}")
            except Exception as e:
                print(f"❌ {bucket} bucket test error: {e}")
        
        # Test 4: Pagination
        print("4. Testing pagination...")
        try:
            headers = self.get_auth_headers(1)
            params = {"page": 1}
            async with self.session.get(f"{BACKEND_URL}/inbox", headers=headers, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ Pagination works, page 1 has {len(data)} conversations")
                else:
                    error = await resp.text()
                    print(f"❌ Pagination test failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Pagination test error: {e}")
    
    async def test_conversation_management(self):
        """Test conversation creation and management"""
        print("\n💬 Testing Conversation Management...")
        
        # Test 1: Create conversation without authentication
        print("1. Testing conversation creation without auth...")
        conversation_data = {
            "type": "DIRECT",
            "subject": "Test Conversation",
            "participants": [
                {"user_id": self.user1_id, "role": "BUYER"},
                {"user_id": self.user2_id, "role": "SELLER"}
            ]
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations", json=conversation_data) as resp:
                if resp.status == 401:
                    print("✅ Conversation creation correctly requires authentication")
                else:
                    print(f"❌ Conversation creation should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Conversation no-auth test error: {e}")
        
        # Test 2: Create conversation with authentication
        print("2. Testing conversation creation with auth...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations", 
                                       json=conversation_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.test_conversation_id = data.get("id")
                    print(f"✅ Conversation created successfully: {self.test_conversation_id}")
                else:
                    error = await resp.text()
                    print(f"❌ Conversation creation failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Conversation creation test error: {e}")
        
        if not self.test_conversation_id:
            print("❌ Cannot continue conversation tests without valid conversation ID")
            return
        
        # Test 3: Get conversation details without auth
        print("3. Testing get conversation without auth...")
        try:
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}") as resp:
                if resp.status == 401:
                    print("✅ Get conversation correctly requires authentication")
                else:
                    print(f"❌ Get conversation should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Get conversation no-auth test error: {e}")
        
        # Test 4: Get conversation details with auth
        print("4. Testing get conversation with auth...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}", 
                                      headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print("✅ Conversation details retrieved successfully")
                    
                    # Validate structure
                    required_fields = ['id', 'type', 'subject', 'participants']
                    for field in required_fields:
                        if field in data:
                            print(f"✅ Conversation has {field}")
                        else:
                            print(f"❌ Conversation missing {field}")
                elif resp.status == 404:
                    print("❌ Conversation not found")
                else:
                    error = await resp.text()
                    print(f"❌ Get conversation failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Get conversation test error: {e}")
        
        # Test 5: Update conversation (mute/archive)
        print("5. Testing conversation update...")
        update_data = {"muted": True, "archived": False}
        
        try:
            headers = self.get_auth_headers(1)
            async with self.session.patch(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}", 
                                        json=update_data, headers=headers) as resp:
                if resp.status == 200:
                    print("✅ Conversation updated successfully")
                else:
                    error = await resp.text()
                    print(f"❌ Conversation update failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Conversation update test error: {e}")
        
        # Test 6: Access control - User 2 accessing conversation
        print("6. Testing participant access control...")
        try:
            headers = self.get_auth_headers(2)
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}", 
                                      headers=headers) as resp:
                if resp.status == 200:
                    print("✅ User 2 can access conversation (participant)")
                elif resp.status == 404:
                    print("❌ User 2 cannot access conversation (should be participant)")
                else:
                    error = await resp.text()
                    print(f"⚠️  User 2 access unexpected: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Access control test error: {e}")
        
        # Test 7: Invalid conversation ID
        print("7. Testing invalid conversation ID...")
        try:
            headers = self.get_auth_headers(1)
            fake_id = str(uuid.uuid4())
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{fake_id}", 
                                      headers=headers) as resp:
                if resp.status == 404:
                    print("✅ Invalid conversation ID returns 404")
                else:
                    print(f"❌ Invalid conversation ID should return 404, got: {resp.status}")
        except Exception as e:
            print(f"❌ Invalid conversation ID test error: {e}")
    
    async def test_message_operations(self):
        """Test message sending, retrieval, and read operations"""
        print("\n📨 Testing Message Operations...")
        
        if not self.test_conversation_id:
            print("❌ Cannot test messages without valid conversation ID")
            return
        
        # Test 1: Get messages without auth
        print("1. Testing get messages without auth...")
        try:
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages") as resp:
                if resp.status == 401:
                    print("✅ Get messages correctly requires authentication")
                else:
                    print(f"❌ Get messages should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Get messages no-auth test error: {e}")
        
        # Test 2: Get messages with auth (empty conversation)
        print("2. Testing get messages with auth...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                      headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ Messages retrieved successfully, found {len(data)} messages")
                    
                    if isinstance(data, list):
                        print("✅ Messages returns list")
                    else:
                        print(f"❌ Messages should return list, got: {type(data)}")
                else:
                    error = await resp.text()
                    print(f"❌ Get messages failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Get messages test error: {e}")
        
        # Test 3: Send message without auth
        print("3. Testing send message without auth...")
        message_data = {
            "body": "Hello, this is a test message!",
            "attachments": []
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                       json=message_data) as resp:
                if resp.status == 401:
                    print("✅ Send message correctly requires authentication")
                else:
                    print(f"❌ Send message should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Send message no-auth test error: {e}")
        
        # Test 4: Send message with auth
        print("4. Testing send message with auth...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                       json=message_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.test_message_id = data.get("id")
                    print(f"✅ Message sent successfully: {self.test_message_id}")
                else:
                    error = await resp.text()
                    print(f"❌ Send message failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Send message test error: {e}")
        
        # Test 5: Send message with PII (should be redacted)
        print("5. Testing PII redaction...")
        pii_message_data = {
            "body": "Contact me at john@example.com or call +27123456789 for more details!",
            "attachments": []
        }
        
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                       json=pii_message_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print("✅ PII message sent (should be redacted)")
                    
                    # Get messages to check if PII was redacted
                    async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                              headers=headers) as get_resp:
                        if get_resp.status == 200:
                            messages = await get_resp.json()
                            if len(messages) > 0:
                                last_message = messages[-1]
                                if "[redacted-email]" in last_message.get("body", "") or "[redacted-phone]" in last_message.get("body", ""):
                                    print("✅ PII was properly redacted")
                                else:
                                    print(f"⚠️  PII redaction unclear: {last_message.get('body', '')}")
                else:
                    error = await resp.text()
                    print(f"❌ PII message failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ PII message test error: {e}")
        
        # Test 6: Mark conversation as read without auth
        print("6. Testing mark as read without auth...")
        try:
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/read") as resp:
                if resp.status == 401:
                    print("✅ Mark as read correctly requires authentication")
                else:
                    print(f"❌ Mark as read should require auth but got: {resp.status}")
        except Exception as e:
            print(f"❌ Mark as read no-auth test error: {e}")
        
        # Test 7: Mark conversation as read with auth
        print("7. Testing mark as read with auth...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/read", 
                                       headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print("✅ Conversation marked as read successfully")
                else:
                    error = await resp.text()
                    print(f"❌ Mark as read failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Mark as read test error: {e}")
        
        # Test 8: Message pagination
        print("8. Testing message pagination...")
        try:
            headers = self.get_auth_headers(1)
            params = {"page": 1}
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                      headers=headers, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ Message pagination works, page 1 has {len(data)} messages")
                else:
                    error = await resp.text()
                    print(f"❌ Message pagination failed: {resp.status} - {error}")
        except Exception as e:
            print(f"❌ Message pagination test error: {e}")
    
    async def test_data_validation(self):
        """Test request body validation and error handling"""
        print("\n🔍 Testing Data Validation...")
        
        # Test 1: Invalid conversation creation data
        print("1. Testing invalid conversation creation...")
        invalid_data = {
            "type": "INVALID_TYPE",
            "subject": "",
            "participants": []
        }
        
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations", 
                                       json=invalid_data, headers=headers) as resp:
                if resp.status == 422:
                    print("✅ Invalid conversation data returns 422")
                elif resp.status == 400:
                    print("✅ Invalid conversation data returns 400")
                else:
                    print(f"⚠️  Invalid conversation data returned: {resp.status}")
        except Exception as e:
            print(f"❌ Invalid conversation test error: {e}")
        
        # Test 2: Empty message body
        print("2. Testing empty message body...")
        if self.test_conversation_id:
            empty_message = {"body": "", "attachments": []}
            
            try:
                headers = self.get_auth_headers(1)
                async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                           json=empty_message, headers=headers) as resp:
                    if resp.status in [200, 400, 422]:
                        print(f"✅ Empty message handled: {resp.status}")
                    else:
                        print(f"⚠️  Empty message unexpected: {resp.status}")
            except Exception as e:
                print(f"❌ Empty message test error: {e}")
        
        # Test 3: Invalid conversation type
        print("3. Testing invalid conversation type...")
        invalid_type_data = {
            "type": "NONEXISTENT",
            "subject": "Test",
            "participants": [{"user_id": self.user1_id, "role": "BUYER"}]
        }
        
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations", 
                                       json=invalid_type_data, headers=headers) as resp:
                if resp.status in [400, 422]:
                    print("✅ Invalid conversation type properly rejected")
                else:
                    print(f"⚠️  Invalid conversation type returned: {resp.status}")
        except Exception as e:
            print(f"❌ Invalid conversation type test error: {e}")
        
        # Test 4: Malformed JSON
        print("4. Testing malformed JSON...")
        try:
            headers = self.get_auth_headers(1)
            headers['Content-Type'] = 'application/json'
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations", 
                                       data="invalid json", headers=headers) as resp:
                if resp.status in [400, 422]:
                    print("✅ Malformed JSON properly rejected")
                else:
                    print(f"⚠️  Malformed JSON returned: {resp.status}")
        except Exception as e:
            print(f"❌ Malformed JSON test error: {e}")
    
    async def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️  Testing Error Handling...")
        
        # Test 1: Non-existent conversation access
        print("1. Testing non-existent conversation access...")
        fake_id = str(uuid.uuid4())
        
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{fake_id}", 
                                      headers=headers) as resp:
                if resp.status == 404:
                    print("✅ Non-existent conversation returns 404")
                else:
                    print(f"❌ Non-existent conversation should return 404, got: {resp.status}")
        except Exception as e:
            print(f"❌ Non-existent conversation test error: {e}")
        
        # Test 2: Non-existent conversation messages
        print("2. Testing non-existent conversation messages...")
        try:
            headers = self.get_auth_headers(1)
            async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{fake_id}/messages", 
                                      headers=headers) as resp:
                if resp.status == 404:
                    print("✅ Non-existent conversation messages return 404")
                else:
                    print(f"❌ Non-existent conversation messages should return 404, got: {resp.status}")
        except Exception as e:
            print(f"❌ Non-existent conversation messages test error: {e}")
        
        # Test 3: Send message to non-existent conversation
        print("3. Testing send message to non-existent conversation...")
        message_data = {"body": "Test message", "attachments": []}
        
        try:
            headers = self.get_auth_headers(1)
            async with self.session.post(f"{BACKEND_URL}/inbox/conversations/{fake_id}/messages", 
                                       json=message_data, headers=headers) as resp:
                if resp.status == 404:
                    print("✅ Send to non-existent conversation returns 404")
                else:
                    print(f"❌ Send to non-existent conversation should return 404, got: {resp.status}")
        except Exception as e:
            print(f"❌ Send to non-existent conversation test error: {e}")
        
        # Test 4: Invalid authorization token
        print("4. Testing invalid authorization token...")
        try:
            invalid_headers = {"Authorization": "Bearer invalid_token_here"}
            async with self.session.get(f"{BACKEND_URL}/inbox/summary", headers=invalid_headers) as resp:
                if resp.status == 401:
                    print("✅ Invalid token returns 401")
                else:
                    print(f"❌ Invalid token should return 401, got: {resp.status}")
        except Exception as e:
            print(f"❌ Invalid token test error: {e}")
    
    async def test_mongodb_collections(self):
        """Test MongoDB collections structure (indirect through API)"""
        print("\n🗄️  Testing MongoDB Collections Structure...")
        
        # Test that conversations and messages are properly stored
        if self.test_conversation_id:
            print("1. Verifying conversation persistence...")
            try:
                headers = self.get_auth_headers(1)
                async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}", 
                                          headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        
                        # Check conversation structure
                        required_fields = ['id', 'type', 'subject', 'participants', 'created_at']
                        for field in required_fields:
                            if field in data:
                                print(f"✅ Conversation has {field}")
                            else:
                                print(f"❌ Conversation missing {field}")
                        
                        # Check participants structure
                        if 'participants' in data and len(data['participants']) > 0:
                            participant = data['participants'][0]
                            participant_fields = ['user_id', 'role']
                            for field in participant_fields:
                                if field in participant:
                                    print(f"✅ Participant has {field}")
                                else:
                                    print(f"❌ Participant missing {field}")
                    else:
                        print(f"❌ Could not verify conversation structure: {resp.status}")
            except Exception as e:
                print(f"❌ Conversation structure test error: {e}")
        
        # Test message structure
        if self.test_conversation_id:
            print("2. Verifying message persistence...")
            try:
                headers = self.get_auth_headers(1)
                async with self.session.get(f"{BACKEND_URL}/inbox/conversations/{self.test_conversation_id}/messages", 
                                          headers=headers) as resp:
                    if resp.status == 200:
                        messages = await resp.json()
                        
                        if len(messages) > 0:
                            message = messages[0]
                            message_fields = ['id', 'conversation_id', 'sender_id', 'body', 'created_at']
                            for field in message_fields:
                                if field in message:
                                    print(f"✅ Message has {field}")
                                else:
                                    print(f"❌ Message missing {field}")
                        else:
                            print("ℹ️  No messages to verify structure")
                    else:
                        print(f"❌ Could not verify message structure: {resp.status}")
            except Exception as e:
                print(f"❌ Message structure test error: {e}")
    
    async def run_all_tests(self):
        """Run all unified inbox tests"""
        print("🚀 Starting Unified Inbox System Backend Testing")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Setup test users
            if not await self.register_and_login_users():
                print("❌ Failed to setup test users, aborting tests")
                return
            
            # Run all test suites
            await self.test_sse_endpoint()
            await self.test_inbox_summary()
            await self.test_inbox_listing()
            await self.test_conversation_management()
            await self.test_message_operations()
            await self.test_data_validation()
            await self.test_error_handling()
            await self.test_mongodb_collections()
            
            print("\n" + "=" * 60)
            print("🎉 Unified Inbox System Testing Complete!")
            
        except Exception as e:
            print(f"\n❌ Testing failed with error: {e}")
        finally:
            await self.cleanup_session()

async def main():
    """Main test runner"""
    tester = UnifiedInboxTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())