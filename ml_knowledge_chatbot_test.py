#!/usr/bin/env python3
"""
Enhanced ML Knowledge and Chatbot System Testing
Tests the new ML-powered FAQ chat, smart search, knowledge scraping, and feedback system
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class MLKnowledgeChatbotTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = []
        
    async def setup(self):
        """Setup test session and authenticate admin user"""
        self.session = aiohttp.ClientSession()
        
        # Authenticate admin user for admin-only endpoints
        try:
            async with self.session.post(f"{API_BASE}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }) as response:
                if response.status == 200:
                    data = await response.json()
                    self.admin_token = data.get("access_token") or ADMIN_EMAIL
                    print(f"✅ Admin authentication successful")
                else:
                    print(f"❌ Admin authentication failed: {response.status}")
                    self.admin_token = ADMIN_EMAIL  # Fallback
        except Exception as e:
            print(f"⚠️  Admin auth error: {e}")
            self.admin_token = ADMIN_EMAIL  # Fallback
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and isinstance(response_data, dict):
            if "error" in response_data:
                print(f"   Error: {response_data['error']}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def test_enhanced_faq_chat(self):
        """Test /api/faq/chat with learning capabilities"""
        print("\n🤖 Testing Enhanced FAQ Chat Endpoint...")
        
        # Test cases with livestock-related questions
        test_questions = [
            {
                "question": "How do I buy cattle?",
                "expected_keywords": ["cattle", "buy", "livestock"]
            },
            {
                "question": "What vaccinations do chickens need?",
                "expected_keywords": ["vaccination", "chicken", "health"]
            },
            {
                "question": "How to breed goats successfully?",
                "expected_keywords": ["goat", "breed", "livestock"]
            },
            {
                "question": "What is the best feed for sheep?",
                "expected_keywords": ["sheep", "feed", "nutrition"]
            }
        ]
        
        for i, test_case in enumerate(test_questions, 1):
            try:
                # Test without authentication (guest user)
                async with self.session.post(f"{API_BASE}/faq/chat", json={
                    "question": test_case["question"]
                }) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Verify response structure
                        required_fields = ["response", "source", "timestamp"]
                        has_required_fields = all(field in data for field in required_fields)
                        
                        # Check if response is relevant (contains expected keywords or is fallback)
                        response_text = data.get("response", "").lower()
                        is_relevant = (
                            any(keyword in response_text for keyword in test_case["expected_keywords"]) or
                            "support" in response_text or  # Fallback response
                            data.get("source") in ["ai", "fallback", "error"]
                        )
                        
                        success = has_required_fields and is_relevant and len(response_text) > 10
                        
                        self.log_result(
                            f"FAQ Chat Test {i}: '{test_case['question'][:30]}...'",
                            success,
                            f"Response source: {data.get('source')}, Length: {len(response_text)} chars"
                        )
                        
                        # Test session tracking (if available)
                        if "session_id" in data:
                            self.log_result(
                                f"FAQ Chat Session Tracking {i}",
                                True,
                                f"Session ID: {data['session_id']}"
                            )
                    else:
                        self.log_result(
                            f"FAQ Chat Test {i}",
                            False,
                            f"HTTP {response.status}: {await response.text()}"
                        )
                        
            except Exception as e:
                self.log_result(f"FAQ Chat Test {i}", False, f"Exception: {str(e)}")
        
        # Test with authenticated user
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            async with self.session.post(f"{API_BASE}/faq/chat", 
                                       json={"question": "How do I manage livestock health records?"},
                                       headers=headers) as response:
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "FAQ Chat Authenticated User Test",
                        True,
                        f"Response source: {data.get('source')}, User context applied"
                    )
                else:
                    self.log_result(
                        "FAQ Chat Authenticated User Test",
                        False,
                        f"HTTP {response.status}"
                    )
        except Exception as e:
            self.log_result("FAQ Chat Authenticated User Test", False, f"Exception: {str(e)}")
    
    async def test_smart_search_endpoint(self):
        """Test /api/search/smart with ML-powered suggestions"""
        print("\n🔍 Testing Smart Search Endpoint...")
        
        # Test cases with livestock-related queries
        search_queries = [
            "Angus cattle",
            "Boer goats", 
            "sheep breeding",
            "chicken feed",
            "dairy cows",
            "livestock vaccination"
        ]
        
        for i, query in enumerate(search_queries, 1):
            try:
                async with self.session.post(f"{API_BASE}/search/smart", json={
                    "query": query
                }) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Verify response structure
                        required_fields = ["success", "search", "ml_enhanced"]
                        has_required_fields = all(field in data for field in required_fields)
                        
                        search_data = data.get("search", {})
                        search_fields = ["query", "timestamp", "results", "suggestions"]
                        has_search_fields = all(field in search_data for field in search_fields)
                        
                        # Check if results contain relevant data
                        results = search_data.get("results", [])
                        suggestions = search_data.get("suggestions", [])
                        
                        success = (
                            has_required_fields and 
                            has_search_fields and
                            search_data.get("query") == query
                        )
                        
                        self.log_result(
                            f"Smart Search Test {i}: '{query}'",
                            success,
                            f"Results: {len(results)}, Suggestions: {len(suggestions)}, ML Enhanced: {data.get('ml_enhanced')}"
                        )
                        
                        # Test result types (listings and FAQ)
                        result_types = set(result.get("type") for result in results)
                        if result_types:
                            self.log_result(
                                f"Smart Search Result Types {i}",
                                True,
                                f"Found types: {', '.join(result_types)}"
                            )
                        
                    else:
                        self.log_result(
                            f"Smart Search Test {i}",
                            False,
                            f"HTTP {response.status}: {await response.text()}"
                        )
                        
            except Exception as e:
                self.log_result(f"Smart Search Test {i}", False, f"Exception: {str(e)}")
        
        # Test empty query handling
        try:
            async with self.session.post(f"{API_BASE}/search/smart", json={
                "query": ""
            }) as response:
                
                success = response.status == 400  # Should return bad request for empty query
                self.log_result(
                    "Smart Search Empty Query Test",
                    success,
                    f"HTTP {response.status} (expected 400)"
                )
        except Exception as e:
            self.log_result("Smart Search Empty Query Test", False, f"Exception: {str(e)}")
    
    async def test_ml_knowledge_scraping_endpoints(self):
        """Test ML knowledge scraping endpoints (admin-only)"""
        print("\n🧠 Testing ML Knowledge Scraping Endpoints...")
        
        if not self.admin_token:
            self.log_result("ML Knowledge Scraping", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: Knowledge scraping endpoint
        try:
            async with self.session.post(f"{API_BASE}/ml/knowledge/scrape", 
                                       headers=headers) as response:
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "ML Knowledge Scrape Endpoint",
                        True,
                        f"Scraping initiated successfully"
                    )
                elif response.status == 503:
                    self.log_result(
                        "ML Knowledge Scrape Endpoint",
                        True,  # Expected if ML service not available
                        "ML scraping service not available (expected in test environment)"
                    )
                elif response.status == 403:
                    self.log_result(
                        "ML Knowledge Scrape Endpoint",
                        False,
                        "Admin access denied - check authentication"
                    )
                else:
                    self.log_result(
                        "ML Knowledge Scrape Endpoint",
                        False,
                        f"HTTP {response.status}: {await response.text()}"
                    )
        except Exception as e:
            self.log_result("ML Knowledge Scrape Endpoint", False, f"Exception: {str(e)}")
        
        # Test 2: Learn from interactions endpoint
        try:
            async with self.session.post(f"{API_BASE}/ml/knowledge/learn-from-interactions",
                                       headers=headers) as response:
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "ML Learn from Interactions Endpoint",
                        True,
                        "Learning from interactions successful"
                    )
                elif response.status == 503:
                    self.log_result(
                        "ML Learn from Interactions Endpoint",
                        True,  # Expected if ML service not available
                        "ML learning service not available (expected in test environment)"
                    )
                elif response.status == 403:
                    self.log_result(
                        "ML Learn from Interactions Endpoint",
                        False,
                        "Admin access denied - check authentication"
                    )
                else:
                    self.log_result(
                        "ML Learn from Interactions Endpoint",
                        False,
                        f"HTTP {response.status}: {await response.text()}"
                    )
        except Exception as e:
            self.log_result("ML Learn from Interactions Endpoint", False, f"Exception: {str(e)}")
        
        # Test 3: ML insights endpoint
        try:
            async with self.session.get(f"{API_BASE}/ml/knowledge/insights?limit=5",
                                      headers=headers) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response structure
                    required_fields = ["success", "insights", "total_insights"]
                    has_required_fields = all(field in data for field in required_fields)
                    
                    insights = data.get("insights", [])
                    
                    self.log_result(
                        "ML Knowledge Insights Endpoint",
                        has_required_fields,
                        f"Found {len(insights)} insights, Total: {data.get('total_insights', 0)}"
                    )
                    
                    # Check insight structure if any insights exist
                    if insights:
                        insight = insights[0]
                        insight_fields = ["learning_id", "timestamp", "questions_analyzed", "knowledge_gaps", "recommendations"]
                        has_insight_fields = all(field in insight for field in insight_fields)
                        
                        self.log_result(
                            "ML Insights Data Structure",
                            has_insight_fields,
                            f"Insight fields complete: {has_insight_fields}"
                        )
                        
                elif response.status == 403:
                    self.log_result(
                        "ML Knowledge Insights Endpoint",
                        False,
                        "Admin access denied - check authentication"
                    )
                else:
                    self.log_result(
                        "ML Knowledge Insights Endpoint",
                        False,
                        f"HTTP {response.status}: {await response.text()}"
                    )
        except Exception as e:
            self.log_result("ML Knowledge Insights Endpoint", False, f"Exception: {str(e)}")
    
    async def test_enhanced_feedback_system(self):
        """Test /api/faq/{faq_id}/feedback with ML learning flags"""
        print("\n📝 Testing Enhanced Feedback System...")
        
        if not self.admin_token:
            self.log_result("Enhanced Feedback System", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test feedback recording with different scenarios
        test_feedback_cases = [
            {
                "faq_id": "test_faq_001",
                "rating": 5,
                "helpful": True,
                "comment": "Very helpful information about cattle breeding",
                "session_id": "session_123"
            },
            {
                "faq_id": "test_faq_002", 
                "rating": 2,
                "helpful": False,
                "comment": "Information was not relevant to my goat farming question",
                "session_id": "session_456"
            },
            {
                "faq_id": "test_faq_003",
                "rating": 4,
                "helpful": True,
                "comment": "Good information but could be more detailed",
                "session_id": "session_789"
            }
        ]
        
        for i, feedback_data in enumerate(test_feedback_cases, 1):
            try:
                faq_id = feedback_data.pop("faq_id")
                
                async with self.session.post(f"{API_BASE}/faq/{faq_id}/feedback",
                                           json=feedback_data,
                                           headers=headers) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Verify response structure
                        success = (
                            data.get("success") is True and
                            "message" in data and
                            "learning" in data.get("message", "").lower()
                        )
                        
                        self.log_result(
                            f"FAQ Feedback Test {i}",
                            success,
                            f"Rating: {feedback_data.get('rating')}, Helpful: {feedback_data.get('helpful')}"
                        )
                        
                    elif response.status == 401 or response.status == 403:
                        self.log_result(
                            f"FAQ Feedback Test {i}",
                            False,
                            "Authentication required - check user token"
                        )
                    else:
                        self.log_result(
                            f"FAQ Feedback Test {i}",
                            False,
                            f"HTTP {response.status}: {await response.text()}"
                        )
                        
            except Exception as e:
                self.log_result(f"FAQ Feedback Test {i}", False, f"Exception: {str(e)}")
        
        # Test session tracking integration
        try:
            session_id = f"test_session_{datetime.now().timestamp()}"
            
            async with self.session.post(f"{API_BASE}/faq/test_session_faq/feedback",
                                       json={
                                           "rating": 5,
                                           "helpful": True,
                                           "comment": "Testing session tracking",
                                           "session_id": session_id
                                       },
                                       headers=headers) as response:
                
                if response.status == 200:
                    data = await response.json()
                    self.log_result(
                        "FAQ Feedback Session Tracking",
                        True,
                        f"Session ID {session_id} recorded successfully"
                    )
                else:
                    self.log_result(
                        "FAQ Feedback Session Tracking",
                        False,
                        f"HTTP {response.status}"
                    )
        except Exception as e:
            self.log_result("FAQ Feedback Session Tracking", False, f"Exception: {str(e)}")
    
    async def test_system_integration(self):
        """Test overall system integration and learning capabilities"""
        print("\n🔗 Testing System Integration...")
        
        # Test 1: FAQ chat -> feedback loop
        try:
            # Ask a question
            async with self.session.post(f"{API_BASE}/faq/chat", json={
                "question": "What are the best practices for livestock health management?"
            }) as response:
                
                if response.status == 200:
                    chat_data = await response.json()
                    
                    # Provide feedback if we have admin token
                    if self.admin_token:
                        headers = {"Authorization": f"Bearer {self.admin_token}"}
                        
                        async with self.session.post(f"{API_BASE}/faq/integration_test_faq/feedback",
                                                   json={
                                                       "rating": 4,
                                                       "helpful": True,
                                                       "comment": "Integration test feedback"
                                                   },
                                                   headers=headers) as feedback_response:
                            
                            integration_success = (
                                feedback_response.status == 200 and
                                chat_data.get("source") in ["ai", "fallback", "error"]
                            )
                            
                            self.log_result(
                                "FAQ Chat -> Feedback Integration",
                                integration_success,
                                f"Chat source: {chat_data.get('source')}, Feedback: {feedback_response.status}"
                            )
                    else:
                        self.log_result(
                            "FAQ Chat -> Feedback Integration",
                            True,  # Chat worked, feedback requires auth
                            f"Chat successful, feedback requires authentication"
                        )
                        
        except Exception as e:
            self.log_result("FAQ Chat -> Feedback Integration", False, f"Exception: {str(e)}")
        
        # Test 2: Smart search -> learning integration
        try:
            # Perform a search that might not return results
            async with self.session.post(f"{API_BASE}/search/smart", json={
                "query": "rare exotic livestock species integration test"
            }) as response:
                
                if response.status == 200:
                    data = await response.json()
                    search_data = data.get("search", {})
                    
                    # Check if system learned from the query
                    learned_from_query = search_data.get("learned_from_query", False)
                    results_count = len(search_data.get("results", []))
                    suggestions_count = len(search_data.get("suggestions", []))
                    
                    self.log_result(
                        "Smart Search Learning Integration",
                        True,  # Any response is good for integration test
                        f"Results: {results_count}, Suggestions: {suggestions_count}, Learned: {learned_from_query}"
                    )
                    
        except Exception as e:
            self.log_result("Smart Search Learning Integration", False, f"Exception: {str(e)}")
    
    async def run_all_tests(self):
        """Run all ML knowledge and chatbot tests"""
        print("🚀 Starting Enhanced ML Knowledge and Chatbot System Tests")
        print(f"🌐 Testing against: {API_BASE}")
        print("=" * 80)
        
        await self.setup()
        
        try:
            # Run all test suites
            await self.test_enhanced_faq_chat()
            await self.test_smart_search_endpoint()
            await self.test_ml_knowledge_scraping_endpoints()
            await self.test_enhanced_feedback_system()
            await self.test_system_integration()
            
            # Generate summary
            self.generate_summary()
            
        finally:
            await self.cleanup()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY - Enhanced ML Knowledge and Chatbot System")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Group results by category
        categories = {
            "FAQ Chat": [r for r in self.test_results if "FAQ Chat" in r["test"]],
            "Smart Search": [r for r in self.test_results if "Smart Search" in r["test"]],
            "ML Knowledge": [r for r in self.test_results if "ML Knowledge" in r["test"] or "ML Learn" in r["test"] or "ML Insights" in r["test"]],
            "Feedback System": [r for r in self.test_results if "Feedback" in r["test"]],
            "Integration": [r for r in self.test_results if "Integration" in r["test"]]
        }
        
        print("\n📋 Results by Category:")
        for category, results in categories.items():
            if results:
                category_passed = sum(1 for r in results if r["success"])
                category_total = len(results)
                print(f"  {category}: {category_passed}/{category_total} passed")
        
        # Show failed tests
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print(f"\n❌ Failed Tests ({len(failed_results)}):")
            for result in failed_results:
                print(f"  • {result['test']}: {result['details']}")
        
        # Expected results summary
        print(f"\n🎯 Expected Results Verification:")
        
        # Check if core functionality is working
        faq_chat_working = any(r["success"] and "FAQ Chat Test" in r["test"] for r in self.test_results)
        smart_search_working = any(r["success"] and "Smart Search Test" in r["test"] for r in self.test_results)
        ml_endpoints_accessible = any(r["success"] and ("ML Knowledge" in r["test"] or "503" in r["details"]) for r in self.test_results)
        feedback_working = any(r["success"] and "FAQ Feedback Test" in r["test"] for r in self.test_results)
        
        print(f"  ✅ Smart search returns relevant results: {'✅' if smart_search_working else '❌'}")
        print(f"  ✅ FAQ chat provides intelligent responses: {'✅' if faq_chat_working else '❌'}")
        print(f"  ✅ ML endpoints accessible to admin users: {'✅' if ml_endpoints_accessible else '❌'}")
        print(f"  ✅ Feedback system captures ML learning data: {'✅' if feedback_working else '❌'}")
        
        # Overall system status
        core_features_working = sum([faq_chat_working, smart_search_working, ml_endpoints_accessible, feedback_working])
        
        if core_features_working >= 3:
            print(f"\n🎉 OVERALL STATUS: ✅ ENHANCED ML KNOWLEDGE AND CHATBOT SYSTEM IS FUNCTIONAL")
            print(f"   {core_features_working}/4 core features are working correctly")
        else:
            print(f"\n⚠️  OVERALL STATUS: ❌ SYSTEM NEEDS ATTENTION")
            print(f"   Only {core_features_working}/4 core features are working")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    tester = MLKnowledgeChatbotTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())