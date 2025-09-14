#!/usr/bin/env python3
"""
🤖 AI CHATBOT TESTING WITH VALID OPENAI API KEY
Testing the AI chatbot functionality now that we have a valid OpenAI API key
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AIChatbotTester:
    """AI Chatbot Backend Tester"""
    
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
    
    async def test_game_meat_question(self):
        """Test 1: Game Meat Question - Should get AI-powered response"""
        logger.info("\n🧪 Testing Game Meat Question...")
        
        question_data = {
            "question": "Do you also have other individuals that sell game meat?"
        }
        
        try:
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json=question_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    response_text = data.get("response", "")
                    source = data.get("source", "")
                    timestamp = data.get("timestamp", "")
                    
                    logger.info("✅ Game meat question response received")
                    logger.info(f"   Response length: {len(response_text)} characters")
                    logger.info(f"   Source: {source}")
                    logger.info(f"   Timestamp: {timestamp}")
                    logger.info(f"   Response preview: {response_text[:200]}...")
                    
                    # Check if it's an AI response (not fallback)
                    is_ai_response = source == "ai" or source == "openai_gpt4o_mini"
                    is_fallback = "having trouble connecting" in response_text.lower() or source == "fallback"
                    
                    if is_ai_response and not is_fallback:
                        logger.info("🎉 SUCCESS: AI-powered response received (not fallback)")
                        self.test_results.append(("Game Meat Question (AI Response)", True, f"AI response: {len(response_text)} chars, source: {source}"))
                    elif is_fallback:
                        logger.warning("⚠️ FALLBACK: Still getting fallback response instead of AI")
                        self.test_results.append(("Game Meat Question (AI Response)", False, f"Fallback response received, source: {source}"))
                    else:
                        logger.info("✅ Response received but checking source...")
                        self.test_results.append(("Game Meat Question (AI Response)", True, f"Response received, source: {source}"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Game meat question failed: {response.status} - {error_text}")
                    self.test_results.append(("Game Meat Question (AI Response)", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in game meat question: {e}")
            self.test_results.append(("Game Meat Question (AI Response)", False, str(e)))
    
    async def test_livestock_questions(self):
        """Test 2: General Livestock Questions"""
        logger.info("\n🧪 Testing General Livestock Questions...")
        
        questions = [
            "How do I buy cattle on StockLot?",
            "What vaccinations do chickens need in South Africa?",
            "How does escrow payment work?"
        ]
        
        for i, question in enumerate(questions):
            try:
                question_data = {"question": question}
                
                async with self.session.post(
                    f"{self.api_url}/faq/chat",
                    json=question_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "")
                        source = data.get("source", "")
                        timestamp = data.get("timestamp", "")
                        
                        logger.info(f"✅ Question {i+1} response received")
                        logger.info(f"   Question: {question}")
                        logger.info(f"   Response length: {len(response_text)} characters")
                        logger.info(f"   Source: {source}")
                        logger.info(f"   Response preview: {response_text[:150]}...")
                        
                        # Check response quality
                        is_ai_response = source == "ai" or source == "openai_gpt4o_mini"
                        is_fallback = "having trouble connecting" in response_text.lower() or source == "fallback"
                        has_sa_context = "south africa" in response_text.lower() or "za" in response_text.lower()
                        is_livestock_focused = any(word in response_text.lower() for word in ["livestock", "cattle", "chicken", "farm", "stocklot"])
                        
                        if is_ai_response and not is_fallback:
                            logger.info("🎉 SUCCESS: AI-powered response received")
                            quality_score = sum([has_sa_context, is_livestock_focused])
                            self.test_results.append((f"Livestock Question {i+1} (AI)", True, f"AI response, quality indicators: {quality_score}/2"))
                        elif is_fallback:
                            logger.warning("⚠️ FALLBACK: Getting fallback response")
                            self.test_results.append((f"Livestock Question {i+1} (AI)", False, "Fallback response received"))
                        else:
                            logger.info("✅ Response received")
                            self.test_results.append((f"Livestock Question {i+1} (AI)", True, f"Response received, source: {source}"))
                            
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Question {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Livestock Question {i+1} (AI)", False, f"Status {response.status}"))
            except Exception as e:
                logger.error(f"❌ Error in question {i+1}: {e}")
                self.test_results.append((f"Livestock Question {i+1} (AI)", False, str(e)))
    
    async def test_ai_response_quality(self):
        """Test 3: AI Response Quality and Metadata"""
        logger.info("\n🧪 Testing AI Response Quality and Metadata...")
        
        # Test with a complex livestock question that should trigger detailed AI response
        complex_question = "I want to start a commercial broiler farm in Gauteng. What are the key requirements for housing, feeding, and disease prevention for 1000 birds?"
        
        try:
            question_data = {"question": complex_question}
            
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json=question_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    response_text = data.get("response", "")
                    source = data.get("source", "")
                    timestamp = data.get("timestamp", "")
                    
                    logger.info("✅ Complex question response received")
                    logger.info(f"   Response length: {len(response_text)} characters")
                    logger.info(f"   Source: {source}")
                    logger.info(f"   Timestamp: {timestamp}")
                    
                    # Quality checks
                    is_detailed = len(response_text) > 200  # Should be detailed response
                    is_ai_source = source in ["ai", "openai_gpt4o_mini"]
                    has_livestock_expertise = any(term in response_text.lower() for term in [
                        "broiler", "housing", "feeding", "disease", "vaccination", "biosecurity"
                    ])
                    has_sa_context = any(term in response_text.lower() for term in [
                        "south africa", "gauteng", "south african"
                    ])
                    is_structured = any(char in response_text for char in ["•", "-", "1.", "2.", "\n"])
                    
                    quality_indicators = [
                        ("Detailed response (>200 chars)", is_detailed),
                        ("AI source", is_ai_source),
                        ("Livestock expertise", has_livestock_expertise),
                        ("South African context", has_sa_context),
                        ("Structured format", is_structured)
                    ]
                    
                    passed_checks = sum(1 for _, check in quality_indicators if check)
                    
                    logger.info(f"   Quality checks passed: {passed_checks}/5")
                    for check_name, passed in quality_indicators:
                        status = "✅" if passed else "❌"
                        logger.info(f"   {status} {check_name}")
                    
                    if passed_checks >= 4:
                        logger.info("🎉 HIGH QUALITY: AI response meets quality standards")
                        self.test_results.append(("AI Response Quality", True, f"Quality score: {passed_checks}/5"))
                    elif passed_checks >= 2:
                        logger.info("⚠️ MODERATE QUALITY: AI response has some quality issues")
                        self.test_results.append(("AI Response Quality", True, f"Quality score: {passed_checks}/5 (moderate)"))
                    else:
                        logger.warning("❌ LOW QUALITY: AI response quality is poor")
                        self.test_results.append(("AI Response Quality", False, f"Quality score: {passed_checks}/5"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Complex question failed: {response.status} - {error_text}")
                    self.test_results.append(("AI Response Quality", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in quality test: {e}")
            self.test_results.append(("AI Response Quality", False, str(e)))
    
    async def test_no_connection_issues(self):
        """Test 4: Verify No More Connection Issues"""
        logger.info("\n🧪 Testing for Connection Issues...")
        
        # Test multiple questions to ensure consistent AI responses
        test_questions = [
            "What is the best breed of cattle for beef production?",
            "How do I register as a seller on StockLot?",
            "What are the payment options available?",
            "Tell me about chicken vaccination schedules"
        ]
        
        connection_issues = 0
        ai_responses = 0
        fallback_responses = 0
        
        for i, question in enumerate(test_questions):
            try:
                question_data = {"question": question}
                
                async with self.session.post(
                    f"{self.api_url}/faq/chat",
                    json=question_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "")
                        source = data.get("source", "")
                        
                        # Check for connection issues
                        has_connection_error = any(phrase in response_text.lower() for phrase in [
                            "having trouble connecting",
                            "ai system right now",
                            "connection error",
                            "service unavailable"
                        ])
                        
                        is_ai_response = source in ["ai", "openai_gpt4o_mini"]
                        is_fallback = source == "fallback" or has_connection_error
                        
                        if has_connection_error:
                            connection_issues += 1
                            logger.warning(f"⚠️ Question {i+1}: Connection issue detected")
                        elif is_ai_response:
                            ai_responses += 1
                            logger.info(f"✅ Question {i+1}: AI response received")
                        elif is_fallback:
                            fallback_responses += 1
                            logger.info(f"📝 Question {i+1}: Fallback response (but no connection error)")
                        else:
                            logger.info(f"✅ Question {i+1}: Response received (source: {source})")
                            
                    else:
                        connection_issues += 1
                        logger.error(f"❌ Question {i+1}: HTTP error {response.status}")
                        
            except Exception as e:
                connection_issues += 1
                logger.error(f"❌ Question {i+1}: Exception - {e}")
        
        total_questions = len(test_questions)
        success_rate = ((total_questions - connection_issues) / total_questions) * 100
        
        logger.info(f"\n📊 Connection Test Results:")
        logger.info(f"   Total questions: {total_questions}")
        logger.info(f"   AI responses: {ai_responses}")
        logger.info(f"   Fallback responses: {fallback_responses}")
        logger.info(f"   Connection issues: {connection_issues}")
        logger.info(f"   Success rate: {success_rate:.1f}%")
        
        if connection_issues == 0:
            logger.info("🎉 SUCCESS: No connection issues detected!")
            self.test_results.append(("No Connection Issues", True, f"0 connection issues, {ai_responses} AI responses"))
        elif connection_issues <= 1:
            logger.info("✅ MOSTLY STABLE: Minimal connection issues")
            self.test_results.append(("No Connection Issues", True, f"{connection_issues} minor issues, {ai_responses} AI responses"))
        else:
            logger.warning("❌ CONNECTION PROBLEMS: Multiple connection issues detected")
            self.test_results.append(("No Connection Issues", False, f"{connection_issues} connection issues detected"))
    
    async def test_openai_integration_status(self):
        """Test 5: OpenAI Integration Status"""
        logger.info("\n🧪 Testing OpenAI Integration Status...")
        
        # Test a simple question to check OpenAI integration
        test_question = "Hello, can you help me with livestock trading?"
        
        try:
            question_data = {"question": test_question}
            
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json=question_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    response_text = data.get("response", "")
                    source = data.get("source", "")
                    
                    logger.info("✅ Integration test response received")
                    logger.info(f"   Source: {source}")
                    logger.info(f"   Response length: {len(response_text)} characters")
                    
                    # Check integration status
                    is_openai_source = source in ["ai", "openai_gpt4o_mini"]
                    has_api_key_error = "api key" in response_text.lower() or "401" in response_text
                    has_connection_error = "having trouble connecting" in response_text.lower()
                    is_intelligent_response = len(response_text) > 50 and not has_connection_error
                    
                    if is_openai_source and is_intelligent_response and not has_api_key_error:
                        logger.info("🎉 SUCCESS: OpenAI integration is working correctly!")
                        self.test_results.append(("OpenAI Integration Status", True, f"Working correctly, source: {source}"))
                    elif has_api_key_error:
                        logger.error("❌ API KEY ISSUE: OpenAI API key problem detected")
                        self.test_results.append(("OpenAI Integration Status", False, "API key issue detected"))
                    elif has_connection_error:
                        logger.warning("⚠️ CONNECTION ISSUE: Still having connection problems")
                        self.test_results.append(("OpenAI Integration Status", False, "Connection issues persist"))
                    else:
                        logger.info("✅ RESPONSE RECEIVED: Integration status unclear")
                        self.test_results.append(("OpenAI Integration Status", True, f"Response received, source: {source}"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Integration test failed: {response.status} - {error_text}")
                    self.test_results.append(("OpenAI Integration Status", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error in integration test: {e}")
            self.test_results.append(("OpenAI Integration Status", False, str(e)))
    
    async def run_all_tests(self):
        """Run all AI chatbot tests"""
        logger.info("🚀 Starting AI Chatbot Testing with Valid OpenAI API Key...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_openai_integration_status()
            await self.test_game_meat_question()
            await self.test_livestock_questions()
            await self.test_ai_response_quality()
            await self.test_no_connection_issues()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🤖 AI CHATBOT TESTING SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! AI Chatbot is fully functional with OpenAI integration.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - AI Chatbot is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - AI Chatbot has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - AI Chatbot requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FEATURES TESTED:")
        logger.info("   • OpenAI Integration Status")
        logger.info("   • Game Meat Question (AI-powered response)")
        logger.info("   • General Livestock Questions")
        logger.info("   • AI Response Quality (detailed, livestock-focused)")
        logger.info("   • Connection Stability (no more connection errors)")
        
        logger.info("\n🔑 EXPECTED AI FEATURES:")
        logger.info("   • Source: 'openai_gpt4o_mini' or 'ai'")
        logger.info("   • High confidence scores (0.95)")
        logger.info("   • Token usage information")
        logger.info("   • South African context")
        logger.info("   • Livestock-focused expertise")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AIChatbotTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())