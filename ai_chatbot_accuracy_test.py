#!/usr/bin/env python3
"""
AI Chatbot Accuracy Testing - Enhanced System Prompt & Contact Filtering Fixes
Testing the 5 critical test cases after fixes to ai_service.py
"""

import asyncio
import aiohttp
import json
import sys
import os
from datetime import datetime

# Test configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class AIAccuracyTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        
    async def setup(self):
        """Setup test session and authentication"""
        self.session = aiohttp.ClientSession()
        
        # Authenticate as admin user
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.auth_token = result.get("access_token") or ADMIN_EMAIL
                    print(f"✅ Authenticated as admin user")
                else:
                    print(f"⚠️  Authentication failed, proceeding without auth")
                    self.auth_token = None
        except Exception as e:
            print(f"⚠️  Authentication error: {e}, proceeding without auth")
            self.auth_token = None
    
    async def test_faq_chat(self, question: str, test_name: str, expected_criteria: dict):
        """Test FAQ chat endpoint with specific question"""
        try:
            headers = {}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            
            chat_data = {"question": question}
            
            async with self.session.post(
                f"{BACKEND_URL}/faq/chat", 
                json=chat_data,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    response_text = result.get("response", "")
                    source = result.get("source", "unknown")
                    
                    # Analyze response against criteria
                    analysis = self.analyze_response(response_text, expected_criteria)
                    
                    test_result = {
                        "test_name": test_name,
                        "question": question,
                        "response": response_text,
                        "source": source,
                        "status_code": response.status,
                        "analysis": analysis,
                        "passed": analysis["overall_pass"],
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    self.test_results.append(test_result)
                    
                    # Print detailed results
                    status = "✅ PASS" if analysis["overall_pass"] else "❌ FAIL"
                    print(f"\n{status} {test_name}")
                    print(f"Question: {question}")
                    print(f"Response ({len(response_text)} chars): {response_text[:200]}...")
                    print(f"Source: {source}")
                    
                    for criterion, result in analysis["criteria_results"].items():
                        symbol = "✅" if result["passed"] else "❌"
                        print(f"  {symbol} {criterion}: {result['reason']}")
                    
                    return test_result
                    
                else:
                    error_text = await response.text()
                    print(f"❌ {test_name} - HTTP {response.status}: {error_text}")
                    return {
                        "test_name": test_name,
                        "question": question,
                        "error": f"HTTP {response.status}: {error_text}",
                        "passed": False,
                        "timestamp": datetime.now().isoformat()
                    }
                    
        except Exception as e:
            print(f"❌ {test_name} - Exception: {e}")
            return {
                "test_name": test_name,
                "question": question,
                "error": str(e),
                "passed": False,
                "timestamp": datetime.now().isoformat()
            }
    
    def analyze_response(self, response: str, criteria: dict):
        """Analyze response against expected criteria"""
        results = {}
        overall_pass = True
        
        response_lower = response.lower()
        
        for criterion_name, criterion_config in criteria.items():
            if criterion_config["type"] == "must_contain":
                # Check if response contains required phrases
                contains_any = any(phrase.lower() in response_lower for phrase in criterion_config["phrases"])
                passed = contains_any
                reason = f"Contains required phrases: {criterion_config['phrases']}" if passed else f"Missing required phrases: {criterion_config['phrases']}"
                
            elif criterion_config["type"] == "must_not_contain":
                # Check if response does NOT contain forbidden phrases
                contains_any = any(phrase.lower() in response_lower for phrase in criterion_config["phrases"])
                passed = not contains_any
                reason = f"Correctly excludes forbidden phrases" if passed else f"Contains forbidden phrases: {[p for p in criterion_config['phrases'] if p.lower() in response_lower]}"
                
            elif criterion_config["type"] == "should_clarify":
                # Check if response asks for clarification or mentions both options
                clarification_phrases = ["clarify", "specify", "processed", "live", "meat", "animals", "regulations"]
                contains_clarification = any(phrase in response_lower for phrase in clarification_phrases)
                passed = contains_clarification
                reason = f"Provides clarification about options" if passed else f"Does not clarify between options"
                
            elif criterion_config["type"] == "comprehensive_categories":
                # Check if response mentions all major categories
                required_categories = ["poultry", "ruminants", "aquaculture", "game"]
                mentioned_categories = [cat for cat in required_categories if cat in response_lower]
                passed = len(mentioned_categories) >= 3  # At least 3 out of 4 categories
                reason = f"Mentions {len(mentioned_categories)}/4 categories: {mentioned_categories}" if passed else f"Only mentions {len(mentioned_categories)}/4 categories: {mentioned_categories}"
            
            else:
                passed = True
                reason = "Unknown criterion type"
            
            results[criterion_name] = {
                "passed": passed,
                "reason": reason
            }
            
            if not passed:
                overall_pass = False
        
        return {
            "criteria_results": results,
            "overall_pass": overall_pass
        }
    
    async def run_critical_tests(self):
        """Run the 5 critical test cases from the review request"""
        
        print("🧪 ENHANCED AI CHATBOT ACCURACY TESTING")
        print("=" * 60)
        print("Testing critical fixes to system prompt and contact filtering")
        print()
        
        # Test 1: Fish/Aquaculture Test
        await self.test_faq_chat(
            question="Do you have fish for sale?",
            test_name="Fish/Aquaculture Test",
            expected_criteria={
                "says_yes": {
                    "type": "must_contain",
                    "phrases": ["yes", "aquaculture", "fish"]
                },
                "mentions_category": {
                    "type": "must_contain", 
                    "phrases": ["aquaculture", "category", "fish farming", "prawns"]
                },
                "no_contact_details": {
                    "type": "must_not_contain",
                    "phrases": ["+27", "123", "456", "@", "email", "phone"]
                }
            }
        )
        
        # Test 2: Game Meat Test  
        await self.test_faq_chat(
            question="Do you have game meat like kudu or springbok?",
            test_name="Game Meat Test",
            expected_criteria={
                "says_yes": {
                    "type": "must_contain",
                    "phrases": ["yes", "game", "kudu", "springbok"]
                },
                "mentions_processors": {
                    "type": "must_contain",
                    "phrases": ["approved", "processors", "permits", "abattoir"]
                },
                "no_contact_details": {
                    "type": "must_not_contain",
                    "phrases": ["+27", "123", "456", "@", "email", "phone"]
                }
            }
        )
        
        # Test 3: Contact Detail Filtering Test
        await self.test_faq_chat(
            question="How can I contact your support team?",
            test_name="Contact Detail Filtering Test", 
            expected_criteria={
                "no_phone_numbers": {
                    "type": "must_not_contain",
                    "phrases": ["+27 11 123 4567", "+27", "123", "456", "phone"]
                },
                "no_email_addresses": {
                    "type": "must_not_contain",
                    "phrases": ["@stocklot", "@", "email"]
                },
                "platform_messaging_only": {
                    "type": "must_contain",
                    "phrases": ["platform", "messaging", "in-app", "support system"]
                }
            }
        )
        
        # Test 4: Wild Pig Clarification Test
        await self.test_faq_chat(
            question="Do you have wild pigs?",
            test_name="Wild Pig Clarification Test",
            expected_criteria={
                "asks_clarification": {
                    "type": "should_clarify",
                    "phrases": ["clarify", "processed", "live", "meat", "regulations"]
                },
                "mentions_options": {
                    "type": "must_contain",
                    "phrases": ["meat", "live", "processed", "regulations"]
                },
                "no_contact_details": {
                    "type": "must_not_contain", 
                    "phrases": ["+27", "123", "456", "@", "email", "phone"]
                }
            }
        )
        
        # Test 5: Comprehensive Livestock Test
        await self.test_faq_chat(
            question="What animals do you sell?",
            test_name="Comprehensive Livestock Test",
            expected_criteria={
                "comprehensive_categories": {
                    "type": "comprehensive_categories",
                    "phrases": ["poultry", "ruminants", "aquaculture", "game"]
                },
                "includes_aquaculture": {
                    "type": "must_contain",
                    "phrases": ["aquaculture", "fish"]
                },
                "includes_game": {
                    "type": "must_contain",
                    "phrases": ["game", "kudu", "springbok", "exotic"]
                },
                "no_contact_details": {
                    "type": "must_not_contain",
                    "phrases": ["+27", "123", "456", "@", "email", "phone"]
                }
            }
        )
    
    async def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("🎯 ENHANCED AI CHATBOT ACCURACY TEST RESULTS")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result.get("passed", False))
        
        print(f"📊 Overall Results: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        print()
        
        # Detailed results by test
        for result in self.test_results:
            status = "✅ PASS" if result.get("passed", False) else "❌ FAIL"
            print(f"{status} {result['test_name']}")
            
            if "analysis" in result:
                for criterion, details in result["analysis"]["criteria_results"].items():
                    symbol = "✅" if details["passed"] else "❌"
                    print(f"    {symbol} {criterion}: {details['reason']}")
            elif "error" in result:
                print(f"    ❌ Error: {result['error']}")
            print()
        
        # Critical Issues Summary
        critical_issues = []
        for result in self.test_results:
            if not result.get("passed", False):
                critical_issues.append(f"❌ {result['test_name']}: {result.get('error', 'Failed criteria checks')}")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES IDENTIFIED:")
            for issue in critical_issues:
                print(f"  {issue}")
            print()
        
        # Success Summary
        if passed_tests == total_tests:
            print("🎉 ALL CRITICAL TESTS PASSED!")
            print("✅ AI chatbot accuracy fixes are working correctly")
            print("✅ System prompt includes all livestock categories")
            print("✅ Contact detail filtering is functional")
        else:
            print(f"⚠️  {total_tests - passed_tests} CRITICAL TESTS FAILED")
            print("❌ AI chatbot accuracy issues still exist")
            print("❌ Additional fixes required")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": passed_tests/total_tests*100,
            "critical_issues": critical_issues,
            "all_passed": passed_tests == total_tests
        }
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()

async def main():
    """Main test execution"""
    tester = AIAccuracyTester()
    
    try:
        await tester.setup()
        await tester.run_critical_tests()
        report = await tester.generate_report()
        
        # Exit with appropriate code
        sys.exit(0 if report["all_passed"] else 1)
        
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        sys.exit(1)
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    asyncio.run(main())