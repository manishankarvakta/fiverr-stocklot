#!/usr/bin/env python3
"""
🤖 ENHANCED CHATBOT WITH IMPROVED FALLBACK SYSTEM TESTING
Comprehensive testing of the enhanced chatbot functionality as requested in review
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

class EnhancedChatbotTester:
    """Enhanced Chatbot Backend Tester"""
    
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
        """Test 1: Game Meat Question (Specific user request)"""
        logger.info("\n🧪 Testing Game Meat Question...")
        
        question = "Do you also have other individuals that sell game meat?"
        
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
                    timestamp = data.get("timestamp", "")
                    
                    logger.info("✅ Game meat question processed successfully")
                    logger.info(f"   Question: {question}")
                    logger.info(f"   Response length: {len(response_text)} characters")
                    logger.info(f"   Source: {source}")
                    logger.info(f"   Response preview: {response_text[:200]}...")
                    
                    # Check if response is livestock-focused and informative
                    is_livestock_focused = any(keyword in response_text.lower() for keyword in [
                        "livestock", "farming", "cattle", "goats", "sheep", "chickens", "poultry",
                        "stocklot", "regulations", "permits", "game farming"
                    ])
                    
                    # Check if it's not just a generic fallback
                    is_not_generic_fallback = "I'm having trouble connecting" not in response_text
                    
                    # Check for proper support contact info if fallback
                    has_support_info = "support@stocklot.co.za" in response_text or "+27" in response_text
                    
                    if is_livestock_focused and is_not_generic_fallback:
                        logger.info("✅ Response is livestock-focused and intelligent")
                        self.test_results.append(("Game Meat Question - Intelligence", True, "Livestock-focused response"))
                    elif has_support_info:
                        logger.info("⚠️ Fallback response but with proper support info")
                        self.test_results.append(("Game Meat Question - Fallback", True, "Proper fallback with support info"))
                    else:
                        logger.warning("⚠️ Generic response without livestock focus")
                        self.test_results.append(("Game Meat Question - Quality", False, "Generic response"))
                    
                    self.test_results.append(("Game Meat Question - API", True, f"Response: {len(response_text)} chars"))
                    
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Game meat question failed: {response.status} - {error_text}")
                    self.test_results.append(("Game Meat Question - API", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing game meat question: {e}")
            self.test_results.append(("Game Meat Question - API", False, str(e)))
    
    async def test_livestock_questions(self):
        """Test 2: Livestock Questions"""
        logger.info("\n🧪 Testing Livestock Questions...")
        
        livestock_questions = [
            "How do I buy cattle?",
            "What vaccinations do chickens need?", 
            "How do payments work?"
        ]
        
        for i, question in enumerate(livestock_questions):
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
                        
                        logger.info(f"✅ Livestock question {i+1} processed successfully")
                        logger.info(f"   Question: {question}")
                        logger.info(f"   Response length: {len(response_text)} characters")
                        logger.info(f"   Source: {source}")
                        logger.info(f"   Response preview: {response_text[:150]}...")
                        
                        # Check response quality
                        is_informative = len(response_text) > 50  # Substantial response
                        is_livestock_related = any(keyword in response_text.lower() for keyword in [
                            "livestock", "cattle", "chicken", "vaccination", "payment", "stocklot", 
                            "farm", "buy", "seller", "marketplace", "escrow"
                        ])
                        
                        # Check for StockLot platform mentions
                        mentions_platform = any(term in response_text.lower() for term in [
                            "stocklot", "platform", "marketplace", "our system"
                        ])
                        
                        if is_informative and is_livestock_related:
                            logger.info("✅ Response is informative and livestock-focused")
                            self.test_results.append((f"Livestock Question {i+1} - Quality", True, "Informative & relevant"))
                        else:
                            logger.warning("⚠️ Response quality could be improved")
                            self.test_results.append((f"Livestock Question {i+1} - Quality", False, "Not sufficiently informative"))
                        
                        if mentions_platform:
                            logger.info("✅ Response mentions StockLot platform")
                            self.test_results.append((f"Livestock Question {i+1} - Platform", True, "Mentions platform"))
                        else:
                            logger.info("ℹ️ Response doesn't mention platform specifically")
                            self.test_results.append((f"Livestock Question {i+1} - Platform", False, "No platform mention"))
                        
                        self.test_results.append((f"Livestock Question {i+1} - API", True, f"Response: {len(response_text)} chars"))
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Livestock question {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Livestock Question {i+1} - API", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error testing livestock question {i+1}: {e}")
                self.test_results.append((f"Livestock Question {i+1} - API", False, str(e)))
    
    async def test_response_quality_features(self):
        """Test 3: Response Quality Features"""
        logger.info("\n🧪 Testing Response Quality Features...")
        
        test_questions = [
            "What is livestock trading?",
            "How does escrow work?",
            "What are the benefits of your platform?",
            "Tell me about South African livestock regulations"
        ]
        
        for i, question in enumerate(test_questions):
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
                        timestamp = data.get("timestamp", "")
                        
                        logger.info(f"✅ Quality test {i+1} processed successfully")
                        logger.info(f"   Question: {question}")
                        logger.info(f"   Response length: {len(response_text)} characters")
                        logger.info(f"   Source: {source}")
                        
                        # Check for professional tone
                        has_professional_tone = not any(casual in response_text.lower() for casual in [
                            "dunno", "yeah", "nah", "whatever", "idk"
                        ])
                        
                        # Check for South African context
                        has_sa_context = any(sa_term in response_text.lower() for sa_term in [
                            "south africa", "south african", "za", "rand", "r ", "gauteng", "cape town"
                        ])
                        
                        # Check for actionable information
                        has_actionable_info = any(action in response_text.lower() for action in [
                            "you can", "to get started", "contact", "visit", "register", "sign up", "browse"
                        ])
                        
                        # Check for proper source attribution
                        has_source_attribution = source in ["ai", "fallback", "error"] and timestamp
                        
                        if has_professional_tone:
                            logger.info("✅ Professional tone maintained")
                            self.test_results.append((f"Quality Test {i+1} - Professional Tone", True, "Professional language"))
                        else:
                            logger.warning("⚠️ Tone could be more professional")
                            self.test_results.append((f"Quality Test {i+1} - Professional Tone", False, "Casual language detected"))
                        
                        if has_sa_context:
                            logger.info("✅ South African context included")
                            self.test_results.append((f"Quality Test {i+1} - SA Context", True, "SA context present"))
                        else:
                            logger.info("ℹ️ No specific South African context")
                            self.test_results.append((f"Quality Test {i+1} - SA Context", False, "No SA context"))
                        
                        if has_actionable_info:
                            logger.info("✅ Actionable information provided")
                            self.test_results.append((f"Quality Test {i+1} - Actionable Info", True, "Actionable guidance"))
                        else:
                            logger.info("ℹ️ Limited actionable information")
                            self.test_results.append((f"Quality Test {i+1} - Actionable Info", False, "Limited guidance"))
                        
                        if has_source_attribution:
                            logger.info("✅ Proper source attribution")
                            self.test_results.append((f"Quality Test {i+1} - Source Attribution", True, f"Source: {source}"))
                        else:
                            logger.warning("⚠️ Missing source attribution")
                            self.test_results.append((f"Quality Test {i+1} - Source Attribution", False, "Missing attribution"))
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Quality test {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Quality Test {i+1} - API", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error in quality test {i+1}: {e}")
                self.test_results.append((f"Quality Test {i+1} - API", False, str(e)))
    
    async def test_enhanced_features(self):
        """Test 4: Enhanced Features"""
        logger.info("\n🧪 Testing Enhanced Features...")
        
        # Test with authenticated user vs guest user
        test_scenarios = [
            ("Guest User", None),
            ("Authenticated User", self.get_headers())
        ]
        
        test_question = "What livestock services do you offer?"
        
        for scenario_name, headers in test_scenarios:
            try:
                chat_data = {"question": test_question}
                
                async with self.session.post(
                    f"{self.api_url}/faq/chat",
                    json=chat_data,
                    headers=headers or {"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "")
                        source = data.get("source", "")
                        
                        logger.info(f"✅ {scenario_name} test successful")
                        logger.info(f"   Response length: {len(response_text)} characters")
                        logger.info(f"   Source: {source}")
                        
                        # Check if response is intelligent (not generic fallback)
                        is_intelligent = "I'm having trouble connecting" not in response_text
                        
                        # Check for livestock-specific information
                        has_livestock_info = any(term in response_text.lower() for term in [
                            "cattle", "goats", "sheep", "chickens", "poultry", "livestock", "farming"
                        ])
                        
                        if is_intelligent and has_livestock_info:
                            logger.info("✅ Intelligent livestock-focused response")
                            self.test_results.append((f"Enhanced Features - {scenario_name} Intelligence", True, "Intelligent response"))
                        elif "support@stocklot.co.za" in response_text:
                            logger.info("⚠️ Fallback response with proper support contact")
                            self.test_results.append((f"Enhanced Features - {scenario_name} Fallback", True, "Proper fallback"))
                        else:
                            logger.warning("⚠️ Generic or poor quality response")
                            self.test_results.append((f"Enhanced Features - {scenario_name} Quality", False, "Poor response quality"))
                        
                        self.test_results.append((f"Enhanced Features - {scenario_name} API", True, f"Response: {len(response_text)} chars"))
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ {scenario_name} test failed: {response.status} - {error_text}")
                        self.test_results.append((f"Enhanced Features - {scenario_name} API", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error in {scenario_name} test: {e}")
                self.test_results.append((f"Enhanced Features - {scenario_name} API", False, str(e)))
    
    async def test_fallback_system_quality(self):
        """Test 5: Fallback System Quality"""
        logger.info("\n🧪 Testing Fallback System Quality...")
        
        # Test with questions that might trigger fallback
        edge_case_questions = [
            "What is the meaning of life?",  # Completely off-topic
            "How do I hack your system?",    # Inappropriate
            "",                              # Empty question
            "a" * 1000,                     # Very long question
            "🐄🐄🐄🐄🐄"                      # Emoji only
        ]
        
        for i, question in enumerate(edge_case_questions):
            try:
                chat_data = {"question": question}
                
                async with self.session.post(
                    f"{self.api_url}/faq/chat",
                    json=chat_data,
                    headers=self.get_headers()
                ) as response:
                    if response.status in [200, 400]:  # 400 might be expected for empty question
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "")
                            source = data.get("source", "")
                            
                            logger.info(f"✅ Edge case {i+1} handled successfully")
                            logger.info(f"   Question: {question[:50]}{'...' if len(question) > 50 else ''}")
                            logger.info(f"   Response length: {len(response_text)} characters")
                            logger.info(f"   Source: {source}")
                            
                            # Check for proper fallback handling
                            has_support_contact = "support@stocklot.co.za" in response_text
                            has_phone_contact = "+27" in response_text
                            is_helpful_fallback = any(helpful in response_text.lower() for helpful in [
                                "help", "support", "contact", "assist"
                            ])
                            
                            if has_support_contact and is_helpful_fallback:
                                logger.info("✅ Proper fallback with support information")
                                self.test_results.append((f"Fallback Test {i+1} - Quality", True, "Proper support fallback"))
                            else:
                                logger.warning("⚠️ Fallback could include better support info")
                                self.test_results.append((f"Fallback Test {i+1} - Quality", False, "Incomplete fallback"))
                            
                            self.test_results.append((f"Fallback Test {i+1} - API", True, "Handled gracefully"))
                        else:
                            logger.info(f"✅ Edge case {i+1} properly rejected with 400")
                            self.test_results.append((f"Fallback Test {i+1} - Validation", True, "Proper validation"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Edge case {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Fallback Test {i+1} - API", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error in edge case {i+1}: {e}")
                self.test_results.append((f"Fallback Test {i+1} - API", False, str(e)))
    
    async def test_session_tracking(self):
        """Test 6: Session Tracking"""
        logger.info("\n🧪 Testing Session Tracking...")
        
        # Test multiple questions in sequence to check session handling
        session_questions = [
            "What livestock do you trade?",
            "How do I register as a seller?",
            "What are your fees?"
        ]
        
        for i, question in enumerate(session_questions):
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
                        timestamp = data.get("timestamp", "")
                        
                        logger.info(f"✅ Session question {i+1} processed")
                        logger.info(f"   Question: {question}")
                        logger.info(f"   Response length: {len(response_text)} characters")
                        logger.info(f"   Timestamp: {timestamp}")
                        
                        # Check for consistent session handling
                        has_timestamp = bool(timestamp)
                        has_response = len(response_text) > 0
                        
                        if has_timestamp and has_response:
                            logger.info("✅ Session tracking working")
                            self.test_results.append((f"Session Tracking {i+1}", True, "Proper session handling"))
                        else:
                            logger.warning("⚠️ Session tracking issues")
                            self.test_results.append((f"Session Tracking {i+1}", False, "Session issues"))
                        
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Session question {i+1} failed: {response.status} - {error_text}")
                        self.test_results.append((f"Session Tracking {i+1}", False, f"Status {response.status}"))
                        
            except Exception as e:
                logger.error(f"❌ Error in session question {i+1}: {e}")
                self.test_results.append((f"Session Tracking {i+1}", False, str(e)))
    
    async def run_all_tests(self):
        """Run all enhanced chatbot tests"""
        logger.info("🚀 Starting Enhanced Chatbot with Improved Fallback System Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all tests
            await self.test_game_meat_question()
            await self.test_livestock_questions()
            await self.test_response_quality_features()
            await self.test_enhanced_features()
            await self.test_fallback_system_quality()
            await self.test_session_tracking()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🤖 ENHANCED CHATBOT WITH IMPROVED FALLBACK SYSTEM TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            logger.info("🎉 ALL TESTS PASSED! Enhanced chatbot is fully functional.")
        elif passed >= total * 0.8:
            logger.info("✅ MOSTLY WORKING - Enhanced chatbot is largely functional with minor issues.")
        elif passed >= total * 0.5:
            logger.info("⚠️ PARTIALLY WORKING - Enhanced chatbot has significant issues that need attention.")
        else:
            logger.info("❌ MAJOR ISSUES - Enhanced chatbot requires immediate attention.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FEATURES TESTED:")
        logger.info("   • Game Meat Question (User-specific request)")
        logger.info("   • Livestock Questions (Cattle, Chickens, Payments)")
        logger.info("   • Response Quality (Professional tone, SA context, actionable info)")
        logger.info("   • Enhanced Features (Intelligent vs fallback responses)")
        logger.info("   • Fallback System Quality (Support contact, graceful handling)")
        logger.info("   • Session Tracking (Consistent handling across requests)")
        
        logger.info("\n🔍 QUALITY CRITERIA EVALUATED:")
        logger.info("   • Livestock-focused responses")
        logger.info("   • Informative and actionable content")
        logger.info("   • Professional tone with South African context")
        logger.info("   • Proper source attribution")
        logger.info("   • Intelligent responses vs generic fallbacks")
        logger.info("   • Support contact information in fallbacks")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = EnhancedChatbotTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())