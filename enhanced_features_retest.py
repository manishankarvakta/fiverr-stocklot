#!/usr/bin/env python3
"""
ENHANCED FEATURES RE-TESTING AFTER HELPER METHOD FIXES
=====================================================

Testing the improved comprehensive enhancement features after fixing missing helper methods:

1. Real-Time Messaging System (Previously 33% success)
2. Business Intelligence & Analytics (Previously 16% success)  
3. Advanced Search Features (83% success - verify still working)

Focus on specific endpoints mentioned in review request.
"""

import requests
import json
import sys
import os
from datetime import datetime
import uuid
import time

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

# Test Results Storage
test_results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "test_details": [],
    "feature_results": {
        "messaging": {"total": 0, "passed": 0, "failed": 0},
        "analytics": {"total": 0, "passed": 0, "failed": 0},
        "search": {"total": 0, "passed": 0, "failed": 0}
    }
}

def log_test(test_name, status, details="", feature_category="general"):
    """Log test results with feature categorization"""
    test_results["total_tests"] += 1
    if status == "PASS":
        test_results["passed_tests"] += 1
        print(f"✅ {test_name}: {details}")
    else:
        test_results["failed_tests"] += 1
        print(f"❌ {test_name}: {details}")
    
    # Update feature-specific results
    if feature_category in test_results["feature_results"]:
        test_results["feature_results"][feature_category]["total"] += 1
        if status == "PASS":
            test_results["feature_results"][feature_category]["passed"] += 1
        else:
            test_results["feature_results"][feature_category]["failed"] += 1
    
    test_results["test_details"].append({
        "test": test_name,
        "status": status,
        "details": details,
        "feature": feature_category,
        "timestamp": datetime.now().isoformat()
    })

def make_request(method, endpoint, headers=None, data=None, files=None):
    """Make HTTP request with error handling"""
    try:
        url = f"{BACKEND_URL}{endpoint}"
        
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == "POST":
            if files:
                response = requests.post(url, headers=headers, data=data, files=files, timeout=30)
            else:
                response = requests.post(url, headers=headers, json=data, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request error for {endpoint}: {e}")
        return None

def get_admin_token():
    """Get admin authentication token"""
    try:
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        response = make_request("POST", "/auth/login", data=login_data)
        if response and response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Admin login failed: {response.status_code if response else 'No response'}")
            return None
    except Exception as e:
        print(f"❌ Error getting admin token: {e}")
        return None

def test_realtime_messaging_system(admin_token):
    """Test Real-Time Messaging System - Previously 33% success"""
    print("\n💬 TESTING REAL-TIME MESSAGING SYSTEM (Target: 80%+ success)")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    conversation_id = None
    
    # Test 1: Create Conversation - POST /api/messaging/conversations
    print("\n1. Testing Create Conversation API")
    conversation_data = {
        "participants": ["admin@stocklot.co.za", "test@example.com"],
        "type": "direct",
        "subject": "Test Livestock Inquiry",
        "metadata": {
            "listing_id": "test_listing_123",
            "context": "inquiry"
        }
    }
    
    response = make_request("POST", "/messaging/conversations", headers=headers, data=conversation_data)
    if response:
        if response.status_code in [200, 201]:
            try:
                data = response.json()
                conversation_id = data.get('conversation_id') or data.get('id')
                log_test("Create Conversation API", "PASS", f"Created conversation: {conversation_id}", "messaging")
            except:
                log_test("Create Conversation API", "FAIL", f"Status {response.status_code} but invalid JSON response", "messaging")
        elif response.status_code == 500:
            log_test("Create Conversation API", "FAIL", f"Internal Server Error - missing helper methods", "messaging")
        else:
            log_test("Create Conversation API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging")
    else:
        log_test("Create Conversation API", "FAIL", "No response received", "messaging")
    
    # Test 2: Get Conversations - GET /api/messaging/conversations
    print("\n2. Testing Get Conversations API")
    response = make_request("GET", "/messaging/conversations?limit=10", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                conversations = data.get('conversations', [])
                log_test("Get Conversations API", "PASS", f"Retrieved {len(conversations)} conversations", "messaging")
            except:
                log_test("Get Conversations API", "FAIL", "Status 200 but invalid JSON response", "messaging")
        elif response.status_code == 500:
            log_test("Get Conversations API", "FAIL", "Internal Server Error - missing helper methods", "messaging")
        else:
            log_test("Get Conversations API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging")
    else:
        log_test("Get Conversations API", "FAIL", "No response received", "messaging")
    
    # Test 3: Send Message - POST /api/messaging/conversations/{id}/messages
    if conversation_id:
        print("\n3. Testing Send Message API")
        message_data = {
            "content": "Hello, I'm interested in your livestock. Can you provide more details?",
            "type": "text",
            "metadata": {
                "test": True,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        response = make_request("POST", f"/messaging/conversations/{conversation_id}/messages", headers=headers, data=message_data)
        if response:
            if response.status_code in [200, 201]:
                log_test("Send Message API", "PASS", "Message sent successfully", "messaging")
            elif response.status_code == 500:
                log_test("Send Message API", "FAIL", "Internal Server Error - missing helper methods", "messaging")
            else:
                log_test("Send Message API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging")
        else:
            log_test("Send Message API", "FAIL", "No response received", "messaging")
        
        # Test 4: Get Messages - GET /api/messaging/conversations/{id}/messages
        print("\n4. Testing Get Messages API")
        response = make_request("GET", f"/messaging/conversations/{conversation_id}/messages?limit=20", headers=headers)
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    messages = data.get('messages', [])
                    log_test("Get Messages API", "PASS", f"Retrieved {len(messages)} messages", "messaging")
                except:
                    log_test("Get Messages API", "FAIL", "Status 200 but invalid JSON response", "messaging")
            elif response.status_code == 500:
                log_test("Get Messages API", "FAIL", "Internal Server Error - missing helper methods", "messaging")
            else:
                log_test("Get Messages API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging")
        else:
            log_test("Get Messages API", "FAIL", "No response received", "messaging")
    else:
        log_test("Send Message API", "SKIP", "No conversation ID available", "messaging")
        log_test("Get Messages API", "SKIP", "No conversation ID available", "messaging")
    
    # Test 5: Media Upload - POST /api/messaging/upload-media
    print("\n5. Testing Media Upload API")
    test_media_data = b"fake_media_data_for_testing"
    files = {'media': ('test_image.jpg', test_media_data, 'image/jpeg')}
    upload_params = {
        "conversation_id": conversation_id or "test_conversation",
        "media_type": "image"
    }
    
    response = make_request("POST", "/messaging/upload-media", headers=headers, data=upload_params, files=files)
    if response:
        if response.status_code in [200, 201]:
            log_test("Media Upload API", "PASS", "Media uploaded successfully", "messaging")
        elif response.status_code == 422:
            log_test("Media Upload API", "FAIL", "Validation error - parameter validation issues", "messaging")
        elif response.status_code == 500:
            log_test("Media Upload API", "FAIL", "Internal Server Error - missing helper methods", "messaging")
        else:
            log_test("Media Upload API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging")
    else:
        log_test("Media Upload API", "FAIL", "No response received", "messaging")
    
    # Test 6: Message Templates - GET /api/messaging/templates (was working)
    print("\n6. Testing Message Templates API")
    response = make_request("GET", "/messaging/templates?category=inquiry", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    templates = data
                else:
                    templates = data.get('templates', [])
                log_test("Message Templates API", "PASS", f"Retrieved {len(templates)} message templates", "messaging")
            except:
                log_test("Message Templates API", "FAIL", "Status 200 but invalid JSON response", "messaging")
        else:
            log_test("Message Templates API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging")
    else:
        log_test("Message Templates API", "FAIL", "No response received", "messaging")

def test_business_intelligence_analytics(admin_token):
    """Test Business Intelligence & Analytics - Previously 16% success"""
    print("\n📊 TESTING BUSINESS INTELLIGENCE & ANALYTICS (Target: 80%+ success)")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    
    # Test 1: Platform Overview - GET /api/analytics/platform-overview
    print("\n1. Testing Platform Overview API")
    response = make_request("GET", "/analytics/platform-overview?period=30d", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                log_test("Platform Overview API", "PASS", "Retrieved platform overview analytics", "analytics")
            except:
                log_test("Platform Overview API", "FAIL", "Status 200 but invalid JSON response", "analytics")
        elif response.status_code == 500:
            log_test("Platform Overview API", "FAIL", "Internal Server Error - missing helper methods", "analytics")
        else:
            log_test("Platform Overview API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics")
    else:
        log_test("Platform Overview API", "FAIL", "No response received", "analytics")
    
    # Test 2: Seller Analytics - GET /api/analytics/seller/{seller_id}
    print("\n2. Testing Seller Analytics API")
    test_seller_id = "test_seller_123"
    response = make_request("GET", f"/analytics/seller/{test_seller_id}?period=30d", headers=headers)
    if response:
        if response.status_code == 200:
            log_test("Seller Analytics API", "PASS", f"Retrieved seller analytics for {test_seller_id}", "analytics")
        elif response.status_code == 404:
            log_test("Seller Analytics API", "PASS", "Seller not found - proper error handling", "analytics")
        elif response.status_code == 500:
            log_test("Seller Analytics API", "FAIL", "Internal Server Error - missing helper methods", "analytics")
        else:
            log_test("Seller Analytics API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics")
    else:
        log_test("Seller Analytics API", "FAIL", "No response received", "analytics")
    
    # Test 3: Buyer Insights - GET /api/analytics/buyer/{buyer_id}
    print("\n3. Testing Buyer Insights API")
    test_buyer_id = "test_buyer_123"
    response = make_request("GET", f"/analytics/buyer/{test_buyer_id}?period=30d", headers=headers)
    if response:
        if response.status_code == 200:
            log_test("Buyer Insights API", "PASS", f"Retrieved buyer insights for {test_buyer_id}", "analytics")
        elif response.status_code == 404:
            log_test("Buyer Insights API", "PASS", "Buyer not found - proper error handling", "analytics")
        elif response.status_code == 500:
            log_test("Buyer Insights API", "FAIL", "Internal Server Error - missing helper methods", "analytics")
        else:
            log_test("Buyer Insights API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics")
    else:
        log_test("Buyer Insights API", "FAIL", "No response received", "analytics")
    
    # Test 4: Market Intelligence - GET /api/analytics/market-intelligence (was working)
    print("\n4. Testing Market Intelligence API")
    response = make_request("GET", "/analytics/market-intelligence?category=cattle&region=western_cape", headers=headers)
    if response:
        if response.status_code == 200:
            log_test("Market Intelligence API", "PASS", "Retrieved market intelligence data", "analytics")
        elif response.status_code == 500:
            log_test("Market Intelligence API", "FAIL", "Internal Server Error - missing helper methods", "analytics")
        else:
            log_test("Market Intelligence API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics")
    else:
        log_test("Market Intelligence API", "FAIL", "No response received", "analytics")
    
    # Test 5: Real-time Metrics - GET /api/analytics/real-time
    print("\n5. Testing Real-time Metrics API")
    response = make_request("GET", "/analytics/real-time", headers=headers)
    if response:
        if response.status_code == 200:
            log_test("Real-time Metrics API", "PASS", "Retrieved real-time metrics", "analytics")
        elif response.status_code == 500:
            log_test("Real-time Metrics API", "FAIL", "Internal Server Error - missing helper methods", "analytics")
        else:
            log_test("Real-time Metrics API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics")
    else:
        log_test("Real-time Metrics API", "FAIL", "No response received", "analytics")
    
    # Test 6: Custom Reports - POST /api/analytics/custom-report
    print("\n6. Testing Custom Reports API")
    report_data = {
        "report_type": "sales_performance",
        "date_range": {
            "start": "2024-01-01",
            "end": "2024-12-31"
        },
        "filters": {
            "category": "ruminants",
            "region": "western_cape"
        },
        "metrics": ["total_sales", "average_price", "listing_count"],
        "format": "json"
    }
    
    response = make_request("POST", "/analytics/custom-report", headers=headers, data=report_data)
    if response:
        if response.status_code in [200, 201]:
            log_test("Custom Reports API", "PASS", "Generated custom report successfully", "analytics")
        elif response.status_code == 500:
            log_test("Custom Reports API", "FAIL", "Internal Server Error - missing helper methods", "analytics")
        else:
            log_test("Custom Reports API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics")
    else:
        log_test("Custom Reports API", "FAIL", "No response received", "analytics")

def test_advanced_search_features(admin_token):
    """Test Advanced Search Features - Previously 83% success (verify still working)"""
    print("\n🔍 TESTING ADVANCED SEARCH FEATURES (Target: Maintain 83%+ success)")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    
    # Test 1: Semantic Search - POST /api/search/semantic
    print("\n1. Testing Semantic Search API")
    semantic_data = {
        "query": "healthy cattle for breeding in Western Cape",
        "filters": {
            "category": "ruminants",
            "location": "Western Cape"
        },
        "limit": 10
    }
    
    response = make_request("POST", "/search/semantic", headers=headers, data=semantic_data)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                results = data.get('results', [])
                log_test("Semantic Search API", "PASS", f"Returned {len(results)} semantic search results", "search")
            except:
                log_test("Semantic Search API", "FAIL", "Status 200 but invalid JSON response", "search")
        else:
            log_test("Semantic Search API", "FAIL", f"Status {response.status_code}: {response.text}", "search")
    else:
        log_test("Semantic Search API", "FAIL", "No response received", "search")
    
    # Test 2: Visual Search - POST /api/search/visual
    print("\n2. Testing Visual Search API")
    test_image_data = b"fake_image_data_for_testing"
    files = {'image': ('test_livestock.jpg', test_image_data, 'image/jpeg')}
    search_params = {
        "similarity_threshold": 0.8,
        "max_results": 5
    }
    
    response = make_request("POST", "/search/visual", headers=headers, data=search_params, files=files)
    if response:
        if response.status_code == 200:
            log_test("Visual Search API", "PASS", "Visual search processed successfully", "search")
        else:
            log_test("Visual Search API", "FAIL", f"Status {response.status_code}: {response.text}", "search")
    else:
        log_test("Visual Search API", "FAIL", "No response received", "search")
    
    # Test 3: Smart Autocomplete - GET /api/search/autocomplete
    print("\n3. Testing Smart Autocomplete API")
    response = make_request("GET", "/search/autocomplete?q=cattle&limit=10", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    suggestions = data
                else:
                    suggestions = data.get('suggestions', [])
                log_test("Smart Autocomplete API", "PASS", f"Returned {len(suggestions)} autocomplete suggestions", "search")
            except:
                log_test("Smart Autocomplete API", "FAIL", "Status 200 but invalid JSON response", "search")
        else:
            log_test("Smart Autocomplete API", "FAIL", f"Status {response.status_code}: {response.text}", "search")
    else:
        log_test("Smart Autocomplete API", "FAIL", "No response received", "search")
    
    # Test 4: Intelligent Filters - POST /api/search/intelligent-filters
    print("\n4. Testing Intelligent Filters API")
    filter_data = {
        "user_preferences": {
            "location": "Western Cape",
            "budget_range": "10000-50000",
            "livestock_type": "cattle"
        },
        "search_context": "breeding stock"
    }
    
    response = make_request("POST", "/search/intelligent-filters", headers=headers, data=filter_data)
    if response:
        if response.status_code == 200:
            log_test("Intelligent Filters API", "PASS", "Generated intelligent filters successfully", "search")
        else:
            log_test("Intelligent Filters API", "FAIL", f"Status {response.status_code}: {response.text}", "search")
    else:
        log_test("Intelligent Filters API", "FAIL", "No response received", "search")
    
    # Test 5: Predictive Search - GET /api/search/predictive
    print("\n5. Testing Predictive Search API")
    response = make_request("GET", "/search/predictive?user_id=test_user&context=browsing", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                predictions = data.get('predictions', [])
                log_test("Predictive Search API", "PASS", f"Generated {len(predictions)} search predictions", "search")
            except:
                log_test("Predictive Search API", "FAIL", "Status 200 but invalid JSON response", "search")
        else:
            log_test("Predictive Search API", "FAIL", f"Status {response.status_code}: {response.text}", "search")
    else:
        log_test("Predictive Search API", "FAIL", "No response received", "search")

def run_enhanced_features_retest():
    """Run enhanced features re-testing"""
    print("🚀 ENHANCED FEATURES RE-TESTING AFTER HELPER METHOD FIXES")
    print("=" * 70)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 70)
    
    # Get admin authentication token
    print("\n🔑 Getting admin authentication token...")
    admin_token = get_admin_token()
    if admin_token:
        print("✅ Admin authentication successful")
    else:
        print("⚠️  Admin authentication failed - testing with limited access")
    
    # Run feature-specific tests
    test_realtime_messaging_system(admin_token)
    test_business_intelligence_analytics(admin_token)
    test_advanced_search_features(admin_token)
    
    # Calculate feature-specific success rates
    print("\n" + "=" * 70)
    print("🎯 ENHANCED FEATURES RE-TEST RESULTS")
    print("=" * 70)
    
    for feature, results in test_results["feature_results"].items():
        if results["total"] > 0:
            success_rate = (results["passed"] / results["total"]) * 100
            feature_name = {
                "messaging": "Real-Time Messaging System",
                "analytics": "Business Intelligence & Analytics", 
                "search": "Advanced Search Features"
            }.get(feature, feature)
            
            print(f"\n{feature_name}:")
            print(f"  Tests: {results['passed']}/{results['total']} passed ({success_rate:.1f}%)")
            
            if success_rate >= 80:
                print(f"  Status: ✅ EXCELLENT - Target achieved!")
            elif success_rate >= 60:
                print(f"  Status: ✅ GOOD - Significant improvement")
            else:
                print(f"  Status: ❌ NEEDS WORK - Still requires fixes")
    
    # Overall results
    print(f"\nOverall Results:")
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"Passed: {test_results['passed_tests']} ✅")
    print(f"Failed: {test_results['failed_tests']} ❌")
    
    if test_results['total_tests'] > 0:
        overall_success_rate = (test_results['passed_tests'] / test_results['total_tests']) * 100
        print(f"Overall Success Rate: {overall_success_rate:.1f}%")
        
        if overall_success_rate >= 85:
            print("🎉 OUTSTANDING: Enhancement features are production-ready!")
        elif overall_success_rate >= 70:
            print("✅ GOOD: Most enhancement features are functional")
        else:
            print("⚠️  NEEDS ATTENTION: Several enhancement features still need fixes")
    
    # Show critical issues
    critical_issues = []
    for test in test_results['test_details']:
        if test['status'] == 'FAIL' and 'Internal Server Error' in test['details']:
            critical_issues.append(test)
    
    if critical_issues:
        print(f"\n🚨 CRITICAL ISSUES IDENTIFIED ({len(critical_issues)} issues):")
        for issue in critical_issues:
            print(f"  • {issue['test']}: {issue['details']}")
        print("\n💡 RECOMMENDATION: Fix missing helper methods in service classes")
    
    return test_results

if __name__ == "__main__":
    results = run_enhanced_features_retest()
    
    # Exit with appropriate code
    if results['failed_tests'] == 0:
        sys.exit(0)
    else:
        sys.exit(1)