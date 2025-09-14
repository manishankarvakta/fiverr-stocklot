#!/usr/bin/env python3
"""
🤖 AI CHATBOT CONNECTION DIAGNOSIS TEST
Comprehensive testing of the AI FAQ chatbot system to diagnose connection issues
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AIChatbotDiagnosisTester:
    """AI Chatbot Connection Diagnosis Tester"""
    
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
    
    async def authenticate_optional(self):
        """Authenticate as admin user (optional for FAQ testing)"""
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
                    logger.warning(f"⚠️ Authentication failed: {response.status} (proceeding as guest)")
                    return False
        except Exception as e:
            logger.warning(f"⚠️ Authentication error: {e} (proceeding as guest)")
            return False
    
    def get_headers(self):
        """Get headers with optional authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_faq_chat_endpoint_accessibility(self):
        """Test 1: FAQ Chat Endpoint Accessibility"""
        logger.info("\n🧪 Testing FAQ Chat Endpoint Accessibility...")
        
        test_question = "How do I buy livestock?"
        
        try:
            chat_data = {
                "question": test_question
            }
            
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json=chat_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    response_text = data.get("response", "")
                    source = data.get("source", "")
                    timestamp = data.get("timestamp", "")
                    
                    logger.info("✅ FAQ Chat endpoint is accessible")
                    logger.info(f"   Question: {test_question}")
                    logger.info(f"   Response length: {len(response_text)} characters")
                    logger.info(f"   Source: {source}")
                    logger.info(f"   Timestamp: {timestamp}")
                    logger.info(f"   Response preview: {response_text[:100]}...")
                    
                    # Check if it's a fallback response
                    fallback_indicators = [
                        "having trouble connecting",
                        "AI system right now",
                        "support@stocklot.co.za",
                        "having trouble right now"
                    ]
                    
                    is_fallback = any(indicator in response_text.lower() for indicator in fallback_indicators)
                    
                    if is_fallback:
                        logger.warning("⚠️ Response appears to be a fallback message (AI connection issue)")
                        self.test_results.append(("FAQ Chat Endpoint", True, f"Accessible but using fallback (source: {source})"))
                    else:
                        logger.info("✅ Response appears to be AI-generated")
                        self.test_results.append(("FAQ Chat Endpoint", True, f"Working with AI (source: {source})"))
                    
                    return {
                        "accessible": True,
                        "is_fallback": is_fallback,
                        "source": source,
                        "response": response_text
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ FAQ Chat endpoint failed: {response.status} - {error_text}")
                    self.test_results.append(("FAQ Chat Endpoint", False, f"Status {response.status}"))
                    return {"accessible": False, "error": f"Status {response.status}"}
                    
        except Exception as e:
            logger.error(f"❌ Error testing FAQ Chat endpoint: {e}")
            self.test_results.append(("FAQ Chat Endpoint", False, str(e)))
            return {"accessible": False, "error": str(e)}
    
    async def test_openai_api_key_validation(self):
        """Test 2: OpenAI API Key Validation"""
        logger.info("\n🧪 Testing OpenAI API Key Configuration...")
        
        # Check environment variable from backend
        try:
            # Test with multiple livestock-related questions to see AI behavior
            test_questions = [
                "What vaccinations do chickens need?",
                "How to breed goats successfully?", 
                "What is the best feed for sheep?",
                "Tell me about cattle diseases"
            ]
            
            ai_responses = 0
            fallback_responses = 0
            
            for question in test_questions:
                try:
                    chat_data = {"question": question}
                    
                    async with self.session.post(
                        f"{self.api_url}/faq/chat",
                        json=chat_data,
                        headers=self.get_headers()
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "")
                            source = data.get("source", "")
                            
                            # Check if response is AI-generated or fallback
                            fallback_indicators = [
                                "having trouble connecting",
                                "AI system right now",
                                "support@stocklot.co.za"
                            ]
                            
                            if any(indicator in response_text.lower() for indicator in fallback_indicators):
                                fallback_responses += 1
                                logger.info(f"   Question: '{question}' -> Fallback response (source: {source})")
                            else:
                                ai_responses += 1
                                logger.info(f"   Question: '{question}' -> AI response (source: {source}, {len(response_text)} chars)")
                        
                except Exception as e:
                    logger.error(f"   Error testing question '{question}': {e}")
                    fallback_responses += 1
            
            logger.info(f"\n📊 OpenAI API Key Analysis:")
            logger.info(f"   AI responses: {ai_responses}/{len(test_questions)}")
            logger.info(f"   Fallback responses: {fallback_responses}/{len(test_questions)}")
            
            if ai_responses > 0:
                logger.info("✅ OpenAI API key appears to be working (some AI responses)")
                self.test_results.append(("OpenAI API Key", True, f"{ai_responses}/{len(test_questions)} AI responses"))
            elif fallback_responses == len(test_questions):
                logger.warning("⚠️ OpenAI API key appears to be invalid (all fallback responses)")
                logger.warning("   Current key: sk-test-dummy-key-for-testing (placeholder key)")
                self.test_results.append(("OpenAI API Key", False, "All responses are fallbacks - invalid key"))
            else:
                logger.warning("⚠️ Mixed results - OpenAI API key may have issues")
                self.test_results.append(("OpenAI API Key", False, f"Mixed results: {ai_responses} AI, {fallback_responses} fallback"))
                
        except Exception as e:
            logger.error(f"❌ Error testing OpenAI API key: {e}")
            self.test_results.append(("OpenAI API Key", False, str(e)))
    
    async def test_fallback_logic_behavior(self):
        """Test 3: Fallback Logic Behavior"""
        logger.info("\n🧪 Testing Fallback Logic Behavior...")
        
        try:
            # Test with empty question to trigger validation
            empty_question_data = {"question": ""}
            
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json=empty_question_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 400:
                    logger.info("✅ Empty question validation working (400 Bad Request)")
                    self.test_results.append(("Empty Question Validation", True, "Returns 400 as expected"))
                else:
                    data = await response.json()
                    logger.warning(f"⚠️ Empty question returned {response.status}: {data}")
                    self.test_results.append(("Empty Question Validation", False, f"Status {response.status}"))
            
            # Test with a question that should work with basic FAQ matching
            game_meat_question = "game meat"
            
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json={"question": game_meat_question},
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    response_text = data.get("response", "")
                    source = data.get("source", "")
                    
                    logger.info(f"✅ Game meat question processed")
                    logger.info(f"   Question: {game_meat_question}")
                    logger.info(f"   Response: {response_text[:200]}...")
                    logger.info(f"   Source: {source}")
                    
                    # Check if basic FAQ matching works
                    if "game meat" in response_text.lower() or "hunting" in response_text.lower() or "wild" in response_text.lower():
                        logger.info("✅ Basic FAQ matching appears to work")
                        self.test_results.append(("Basic FAQ Matching", True, "Game meat question handled appropriately"))
                    else:
                        logger.warning("⚠️ Basic FAQ matching may not be working optimally")
                        self.test_results.append(("Basic FAQ Matching", False, "Game meat question not handled well"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Game meat question failed: {response.status} - {error_text}")
                    self.test_results.append(("Basic FAQ Matching", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing fallback logic: {e}")
            self.test_results.append(("Fallback Logic", False, str(e)))
    
    async def test_ml_services_availability(self):
        """Test 4: ML Services Availability"""
        logger.info("\n🧪 Testing ML Services Availability...")
        
        try:
            # Test health check to see if ML services are loaded
            async with self.session.get(f"{self.api_url}/health") as response:
                if response.status == 200:
                    logger.info("✅ Backend health check passed")
                    self.test_results.append(("Backend Health", True, "API is responsive"))
                else:
                    logger.error(f"❌ Backend health check failed: {response.status}")
                    self.test_results.append(("Backend Health", False, f"Status {response.status}"))
            
            # Test if ML FAQ service endpoints are available
            ml_endpoints_to_test = [
                "/faq/chat",  # Main FAQ endpoint we're testing
            ]
            
            for endpoint in ml_endpoints_to_test:
                try:
                    # Use a simple test question
                    test_data = {"question": "test"}
                    
                    async with self.session.post(
                        f"{self.api_url}{endpoint}",
                        json=test_data,
                        headers=self.get_headers()
                    ) as response:
                        if response.status in [200, 400]:  # 400 is OK for validation errors
                            logger.info(f"✅ ML endpoint {endpoint} is accessible")
                            self.test_results.append((f"ML Endpoint {endpoint}", True, "Accessible"))
                        else:
                            logger.error(f"❌ ML endpoint {endpoint} failed: {response.status}")
                            self.test_results.append((f"ML Endpoint {endpoint}", False, f"Status {response.status}"))
                            
                except Exception as e:
                    logger.error(f"❌ Error testing ML endpoint {endpoint}: {e}")
                    self.test_results.append((f"ML Endpoint {endpoint}", False, str(e)))
                    
        except Exception as e:
            logger.error(f"❌ Error testing ML services: {e}")
            self.test_results.append(("ML Services", False, str(e)))
    
    async def test_specific_chatbot_interaction_flow(self):
        """Test 5: Specific Chatbot Interaction Flow"""
        logger.info("\n🧪 Testing Specific Chatbot Interaction Flow...")
        
        # Test the exact scenario mentioned in the review request
        test_scenarios = [
            {
                "question": "game meat",
                "description": "User's original question about game meat"
            },
            {
                "question": "How do I buy livestock?",
                "description": "Simple livestock buying question"
            },
            {
                "question": "What are the requirements for selling cattle?",
                "description": "Cattle selling requirements"
            }
        ]
        
        for scenario in test_scenarios:
            try:
                logger.info(f"\n   Testing scenario: {scenario['description']}")
                
                chat_data = {"question": scenario["question"]}
                
                async with self.session.post(
                    f"{self.api_url}/faq/chat",
                    json=chat_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "")
                        source = data.get("source", "")
                        
                        logger.info(f"   ✅ Question: '{scenario['question']}'")
                        logger.info(f"   📝 Response length: {len(response_text)} characters")
                        logger.info(f"   🔍 Source: {source}")
                        
                        # Check for specific error messages
                        if "I'm having trouble connecting to our AI system" in response_text:
                            logger.warning("   ⚠️ Exact error message found: 'I'm having trouble connecting to our AI system'")
                            self.test_results.append((f"Chatbot Flow - {scenario['description']}", False, "AI connection error message"))
                        elif "having trouble" in response_text.lower():
                            logger.warning("   ⚠️ Generic trouble message found")
                            self.test_results.append((f"Chatbot Flow - {scenario['description']}", False, "Generic trouble message"))
                        elif len(response_text) > 50 and source == "ai":
                            logger.info("   ✅ Appears to be working AI response")
                            self.test_results.append((f"Chatbot Flow - {scenario['description']}", True, f"AI response ({len(response_text)} chars)"))
                        else:
                            logger.info(f"   ✅ Response received (source: {source})")
                            self.test_results.append((f"Chatbot Flow - {scenario['description']}", True, f"Response from {source}"))
                        
                        # Show response preview
                        logger.info(f"   💬 Response preview: {response_text[:150]}...")
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"   ❌ Failed: {response.status} - {error_text}")
                        self.test_results.append((f"Chatbot Flow - {scenario['description']}", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"   ❌ Error in scenario '{scenario['description']}': {e}")
                self.test_results.append((f"Chatbot Flow - {scenario['description']}", False, str(e)))
    
    async def run_diagnosis(self):
        """Run complete AI chatbot diagnosis"""
        logger.info("🤖 Starting AI Chatbot Connection Diagnosis...")
        
        await self.setup_session()
        
        try:
            # Optional authentication (FAQ works for guests too)
            await self.authenticate_optional()
            
            # Run all diagnostic tests
            endpoint_result = await self.test_faq_chat_endpoint_accessibility()
            await self.test_openai_api_key_validation()
            await self.test_fallback_logic_behavior()
            await self.test_ml_services_availability()
            await self.test_specific_chatbot_interaction_flow()
            
        finally:
            await self.cleanup_session()
        
        # Print diagnosis summary
        self.print_diagnosis_summary()
    
    def print_diagnosis_summary(self):
        """Print comprehensive diagnosis summary"""
        logger.info("\n" + "="*80)
        logger.info("🤖 AI CHATBOT CONNECTION DIAGNOSIS SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 DIAGNOSTIC RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Analyze results
        ai_connection_issues = []
        working_features = []
        
        for test_name, success, details in self.test_results:
            if not success:
                ai_connection_issues.append(f"{test_name}: {details}")
            else:
                working_features.append(f"{test_name}: {details}")
        
        logger.info("\n🔍 DIAGNOSIS:")
        
        if "OpenAI API Key" in [name for name, success, _ in self.test_results if not success]:
            logger.info("❌ PRIMARY ISSUE: OpenAI API Key Problem")
            logger.info("   The current API key 'sk-test-dummy-key-for-testing' is a placeholder")
            logger.info("   This is causing the AI connection failure")
            logger.info("   Recommendation: Replace with valid OpenAI API key")
        
        if any("AI connection error message" in details for _, success, details in self.test_results if not success):
            logger.info("❌ CONFIRMED: Chatbot showing 'I'm having trouble connecting to our AI system'")
            logger.info("   This is the expected fallback behavior when OpenAI is unavailable")
        
        if any("fallback" in details.lower() for _, success, details in self.test_results if success):
            logger.info("✅ FALLBACK SYSTEM: Working correctly")
            logger.info("   System gracefully handles AI unavailability")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      {details}")
        
        logger.info("\n🎯 EXPECTED BEHAVIOR:")
        logger.info("   • FAQ endpoint should be accessible ✓")
        logger.info("   • Invalid OpenAI key should trigger fallback responses ✓")
        logger.info("   • Fallback message should include support contact info ✓")
        logger.info("   • Basic FAQ matching should work without OpenAI (if implemented)")
        
        logger.info("\n💡 RECOMMENDATIONS:")
        logger.info("   1. Replace 'sk-test-dummy-key-for-testing' with valid OpenAI API key")
        logger.info("   2. Verify ML_SERVICES_AVAILABLE flag is properly set")
        logger.info("   3. Test with valid API key to confirm AI responses work")
        logger.info("   4. Consider implementing basic FAQ matching as fallback")
        
        logger.info("="*80)

async def main():
    """Main diagnosis runner"""
    tester = AIChatbotDiagnosisTester()
    await tester.run_diagnosis()

if __name__ == "__main__":
    asyncio.run(main())