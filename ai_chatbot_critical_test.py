#!/usr/bin/env python3
"""
🤖 AI CHATBOT CRITICAL ACCURACY TESTING
Testing AI chatbot accuracy for critical questions about StockLot's offerings
Focus: Fish/Aquaculture, Game Meat, Wild Pigs, Contact Details, General Livestock
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AIChatbotCriticalTester:
    """AI Chatbot Critical Accuracy Tester"""
    
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
    
    async def ask_chatbot(self, question: str, test_name: str) -> Dict[str, Any]:
        """Ask the chatbot a question and return response"""
        try:
            chat_data = {"question": question}
            
            async with self.session.post(
                f"{self.api_url}/faq/chat",
                json=chat_data,
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"✅ {test_name} - Chatbot responded successfully")
                    logger.info(f"   Question: {question}")
                    logger.info(f"   Response: {data.get('response', '')[:200]}...")
                    logger.info(f"   Source: {data.get('source', 'unknown')}")
                    return {
                        "success": True,
                        "response": data.get("response", ""),
                        "source": data.get("source", "unknown"),
                        "timestamp": data.get("timestamp", "")
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ {test_name} - Chatbot request failed: {response.status} - {error_text}")
                    return {
                        "success": False,
                        "error": f"Status {response.status}: {error_text}",
                        "response": "",
                        "source": "error"
                    }
        except Exception as e:
            logger.error(f"❌ {test_name} - Error asking chatbot: {e}")
            return {
                "success": False,
                "error": str(e),
                "response": "",
                "source": "error"
            }
    
    def analyze_fish_aquaculture_response(self, response: str) -> Dict[str, Any]:
        """Analyze fish/aquaculture response for correctness"""
        response_lower = response.lower()
        
        # Check for positive indicators
        positive_indicators = [
            "yes", "aquaculture", "fish", "freshwater", "saltwater", 
            "we have", "we do", "available", "offer", "category"
        ]
        
        # Check for negative indicators (wrong responses)
        negative_indicators = [
            "we don't sell fish", "no fish", "don't have fish", 
            "not available", "we do not offer fish"
        ]
        
        has_positive = any(indicator in response_lower for indicator in positive_indicators)
        has_negative = any(indicator in response_lower for indicator in negative_indicators)
        
        if has_positive and not has_negative:
            return {"correct": True, "reason": "Correctly mentions StockLot has aquaculture/fish"}
        elif has_negative:
            return {"correct": False, "reason": "Incorrectly states StockLot doesn't sell fish"}
        else:
            return {"correct": False, "reason": "Response unclear about fish availability"}
    
    def analyze_game_meat_response(self, response: str) -> Dict[str, Any]:
        """Analyze game meat response for correctness"""
        response_lower = response.lower()
        
        # Check for positive indicators
        positive_indicators = [
            "yes", "game meat", "kudu", "springbok", "approved processors", 
            "we have", "we do", "available", "offer", "game", "exotic"
        ]
        
        # Check for negative indicators (wrong responses)
        negative_indicators = [
            "we don't sell game meat", "no game meat", "don't have game", 
            "we do not specifically list game meat", "not available"
        ]
        
        has_positive = any(indicator in response_lower for indicator in positive_indicators)
        has_negative = any(indicator in response_lower for indicator in negative_indicators)
        
        if has_positive and not has_negative:
            return {"correct": True, "reason": "Correctly mentions StockLot supports game meat"}
        elif has_negative:
            return {"correct": False, "reason": "Incorrectly states StockLot doesn't sell game meat"}
        else:
            return {"correct": False, "reason": "Response unclear about game meat availability"}
    
    def analyze_wild_pig_response(self, response: str) -> Dict[str, Any]:
        """Analyze wild pig response for correctness"""
        response_lower = response.lower()
        
        # Check for clarification indicators
        clarification_indicators = [
            "processed meat", "live animals", "regulations", "clarify", 
            "what type", "meat or live", "processing", "legal"
        ]
        
        # Check for blanket negative (wrong responses)
        blanket_negative = [
            "we don't sell", "not available", "no wild pigs", "don't have"
        ]
        
        has_clarification = any(indicator in response_lower for indicator in clarification_indicators)
        has_blanket_negative = any(indicator in response_lower for indicator in blanket_negative)
        
        if has_clarification and not has_blanket_negative:
            return {"correct": True, "reason": "Correctly asks for clarification about meat vs live animals"}
        elif has_blanket_negative:
            return {"correct": False, "reason": "Gives blanket 'no' answer instead of clarifying"}
        else:
            return {"correct": False, "reason": "Doesn't provide appropriate clarification"}
    
    def analyze_contact_details_response(self, response: str) -> Dict[str, Any]:
        """Analyze contact details response for proper filtering"""
        response_lower = response.lower()
        
        # Check for phone numbers and email addresses (should NOT be present)
        phone_patterns = ["+27", "011", "012", "021", "031", "041", "051", "053", "054", "056", "057", "058"]
        email_patterns = ["@", ".co.za", "support@", "contact@"]
        
        has_phone = any(pattern in response for pattern in phone_patterns)
        has_email = any(pattern in response_lower for pattern in email_patterns)
        
        # Check for proper messaging indicators (should be present)
        messaging_indicators = [
            "platform messaging", "in-app messaging", "messaging system", 
            "contact through platform", "message system"
        ]
        
        has_messaging = any(indicator in response_lower for indicator in messaging_indicators)
        
        if not has_phone and not has_email and has_messaging:
            return {"correct": True, "reason": "Correctly filters contact details and mentions platform messaging"}
        elif has_phone or has_email:
            return {"correct": False, "reason": "Incorrectly shows phone numbers or email addresses"}
        else:
            return {"correct": False, "reason": "Doesn't mention platform messaging system"}
    
    def analyze_general_livestock_response(self, response: str) -> Dict[str, Any]:
        """Analyze general livestock response for comprehensiveness"""
        response_lower = response.lower()
        
        # Check for comprehensive livestock categories
        livestock_categories = [
            "poultry", "cattle", "goats", "sheep", "rabbits", 
            "aquaculture", "fish", "game", "comprehensive", "various"
        ]
        
        category_count = sum(1 for category in livestock_categories if category in response_lower)
        
        if category_count >= 4:
            return {"correct": True, "reason": f"Mentions comprehensive livestock ({category_count} categories)"}
        elif category_count >= 2:
            return {"correct": True, "reason": f"Mentions multiple livestock categories ({category_count})"}
        else:
            return {"correct": False, "reason": "Doesn't mention comprehensive livestock offerings"}
    
    async def test_fish_aquaculture_question(self):
        """Test 1: Fish/Aquaculture Question"""
        logger.info("\n🐟 Testing Fish/Aquaculture Question...")
        
        question = "Do you have fish for sale?"
        result = await self.ask_chatbot(question, "Fish/Aquaculture Test")
        
        if result["success"]:
            analysis = self.analyze_fish_aquaculture_response(result["response"])
            
            if analysis["correct"]:
                logger.info("✅ Fish/Aquaculture response is CORRECT")
                logger.info(f"   Reason: {analysis['reason']}")
                self.test_results.append(("Fish/Aquaculture Question", True, analysis["reason"]))
            else:
                logger.error("❌ Fish/Aquaculture response is INCORRECT")
                logger.error(f"   Reason: {analysis['reason']}")
                logger.error(f"   Response: {result['response'][:300]}...")
                self.test_results.append(("Fish/Aquaculture Question", False, analysis["reason"]))
        else:
            logger.error("❌ Fish/Aquaculture question failed to get response")
            self.test_results.append(("Fish/Aquaculture Question", False, result["error"]))
    
    async def test_game_meat_question(self):
        """Test 2: Game Meat Question"""
        logger.info("\n🦌 Testing Game Meat Question...")
        
        question = "Do you have game meat like kudu or springbok?"
        result = await self.ask_chatbot(question, "Game Meat Test")
        
        if result["success"]:
            analysis = self.analyze_game_meat_response(result["response"])
            
            if analysis["correct"]:
                logger.info("✅ Game Meat response is CORRECT")
                logger.info(f"   Reason: {analysis['reason']}")
                self.test_results.append(("Game Meat Question", True, analysis["reason"]))
            else:
                logger.error("❌ Game Meat response is INCORRECT")
                logger.error(f"   Reason: {analysis['reason']}")
                logger.error(f"   Response: {result['response'][:300]}...")
                self.test_results.append(("Game Meat Question", False, analysis["reason"]))
        else:
            logger.error("❌ Game Meat question failed to get response")
            self.test_results.append(("Game Meat Question", False, result["error"]))
    
    async def test_wild_pig_question(self):
        """Test 3: Wild Pig Question"""
        logger.info("\n🐗 Testing Wild Pig Question...")
        
        question = "Do you have wild pigs?"
        result = await self.ask_chatbot(question, "Wild Pig Test")
        
        if result["success"]:
            analysis = self.analyze_wild_pig_response(result["response"])
            
            if analysis["correct"]:
                logger.info("✅ Wild Pig response is CORRECT")
                logger.info(f"   Reason: {analysis['reason']}")
                self.test_results.append(("Wild Pig Question", True, analysis["reason"]))
            else:
                logger.error("❌ Wild Pig response is INCORRECT")
                logger.error(f"   Reason: {analysis['reason']}")
                logger.error(f"   Response: {result['response'][:300]}...")
                self.test_results.append(("Wild Pig Question", False, analysis["reason"]))
        else:
            logger.error("❌ Wild Pig question failed to get response")
            self.test_results.append(("Wild Pig Question", False, result["error"]))
    
    async def test_contact_details_filtering(self):
        """Test 4: Contact Details Filtering"""
        logger.info("\n📞 Testing Contact Details Filtering...")
        
        question = "How can I contact your support team?"
        result = await self.ask_chatbot(question, "Contact Details Test")
        
        if result["success"]:
            analysis = self.analyze_contact_details_response(result["response"])
            
            if analysis["correct"]:
                logger.info("✅ Contact Details filtering is CORRECT")
                logger.info(f"   Reason: {analysis['reason']}")
                self.test_results.append(("Contact Details Filtering", True, analysis["reason"]))
            else:
                logger.error("❌ Contact Details filtering is INCORRECT")
                logger.error(f"   Reason: {analysis['reason']}")
                logger.error(f"   Response: {result['response'][:300]}...")
                self.test_results.append(("Contact Details Filtering", False, analysis["reason"]))
        else:
            logger.error("❌ Contact Details question failed to get response")
            self.test_results.append(("Contact Details Filtering", False, result["error"]))
    
    async def test_general_livestock_question(self):
        """Test 5: General Livestock Question"""
        logger.info("\n🐄 Testing General Livestock Question...")
        
        question = "What animals do you sell?"
        result = await self.ask_chatbot(question, "General Livestock Test")
        
        if result["success"]:
            analysis = self.analyze_general_livestock_response(result["response"])
            
            if analysis["correct"]:
                logger.info("✅ General Livestock response is CORRECT")
                logger.info(f"   Reason: {analysis['reason']}")
                self.test_results.append(("General Livestock Question", True, analysis["reason"]))
            else:
                logger.error("❌ General Livestock response is INCORRECT")
                logger.error(f"   Reason: {analysis['reason']}")
                logger.error(f"   Response: {result['response'][:300]}...")
                self.test_results.append(("General Livestock Question", False, analysis["reason"]))
        else:
            logger.error("❌ General Livestock question failed to get response")
            self.test_results.append(("General Livestock Question", False, result["error"]))
    
    async def test_chatbot_accessibility(self):
        """Test 6: Chatbot Accessibility"""
        logger.info("\n🔌 Testing Chatbot Accessibility...")
        
        # Test basic connectivity
        question = "Hello, can you help me?"
        result = await self.ask_chatbot(question, "Accessibility Test")
        
        if result["success"]:
            logger.info("✅ Chatbot is accessible and responding")
            logger.info(f"   Source: {result['source']}")
            
            # Check if AI is working or fallback
            if result["source"] == "ai":
                logger.info("   ✅ AI integration is working")
                self.test_results.append(("Chatbot Accessibility", True, "AI integration working"))
            elif result["source"] == "fallback":
                logger.info("   ⚠️ Using fallback responses (AI connection issue)")
                self.test_results.append(("Chatbot Accessibility", True, "Fallback system working"))
            else:
                logger.info(f"   ℹ️ Response source: {result['source']}")
                self.test_results.append(("Chatbot Accessibility", True, f"Source: {result['source']}"))
        else:
            logger.error("❌ Chatbot is not accessible")
            self.test_results.append(("Chatbot Accessibility", False, result["error"]))
    
    async def run_all_tests(self):
        """Run all AI chatbot critical tests"""
        logger.info("🚀 Starting AI Chatbot Critical Accuracy Testing...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all critical tests
            await self.test_chatbot_accessibility()
            await self.test_fish_aquaculture_question()
            await self.test_game_meat_question()
            await self.test_wild_pig_question()
            await self.test_contact_details_filtering()
            await self.test_general_livestock_question()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        logger.info("\n" + "="*80)
        logger.info("🤖 AI CHATBOT CRITICAL ACCURACY TEST SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 OVERALL RESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        # Analyze critical failures
        critical_failures = []
        for test_name, success, details in self.test_results:
            if not success and "Question" in test_name:
                critical_failures.append(test_name)
        
        if len(critical_failures) == 0:
            logger.info("🎉 ALL CRITICAL TESTS PASSED! Chatbot is giving correct information.")
        elif len(critical_failures) <= 1:
            logger.info("✅ MOSTLY CORRECT - Chatbot is largely accurate with minor issues.")
        elif len(critical_failures) <= 2:
            logger.info("⚠️ SOME ISSUES - Chatbot has accuracy problems that need attention.")
        else:
            logger.info("❌ MAJOR ACCURACY ISSUES - Chatbot is giving incorrect information.")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        if critical_failures:
            logger.info("\n🚨 CRITICAL FAILURES REQUIRING IMMEDIATE ATTENTION:")
            for failure in critical_failures:
                logger.info(f"   • {failure}")
        
        logger.info("\n🎯 CRITICAL TEST CASES COVERED:")
        logger.info("   • Fish/Aquaculture: Should say YES, StockLot has Aquaculture category")
        logger.info("   • Game Meat: Should say YES, StockLot supports game meat")
        logger.info("   • Wild Pigs: Should clarify processed vs live animals")
        logger.info("   • Contact Details: Should NOT show phone/email, only platform messaging")
        logger.info("   • General Livestock: Should mention comprehensive offerings")
        
        logger.info("="*80)

async def main():
    """Main test runner"""
    tester = AIChatbotCriticalTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())