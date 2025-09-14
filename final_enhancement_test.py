#!/usr/bin/env python3
"""
FINAL ENHANCEMENT FEATURES TEST - COMPREHENSIVE ANALYSIS
========================================================

Testing the enhanced features with proper authentication and detailed analysis.
Focus on identifying the exact issues and providing actionable recommendations.
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

# Test Results Storage
test_results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "test_details": [],
    "feature_results": {
        "messaging": {"total": 0, "passed": 0, "failed": 0, "issues": []},
        "analytics": {"total": 0, "passed": 0, "failed": 0, "issues": []},
        "search": {"total": 0, "passed": 0, "failed": 0, "issues": []}
    }
}

def log_test(test_name, status, details="", feature_category="general", issue_type=None):
    """Log test results with detailed issue tracking"""
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
            if issue_type:
                test_results["feature_results"][feature_category]["issues"].append({
                    "test": test_name,
                    "issue": issue_type,
                    "details": details
                })
    
    test_results["test_details"].append({
        "test": test_name,
        "status": status,
        "details": details,
        "feature": feature_category,
        "issue_type": issue_type,
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

def test_realtime_messaging_system():
    """Test Real-Time Messaging System with detailed analysis"""
    print("\n💬 TESTING REAL-TIME MESSAGING SYSTEM")
    print("=" * 60)
    
    # Use email as token (as per get_current_user function)
    headers = {"Authorization": f"Bearer {ADMIN_EMAIL}"}
    
    # Test 1: Create Conversation
    print("\n1. Testing Create Conversation API")
    conversation_data = {
        "participants": [ADMIN_EMAIL, "test@example.com"],
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
                if data.get('success'):
                    conversation_id = data.get('conversation_id')
                    log_test("Create Conversation API", "PASS", f"Created conversation: {conversation_id}", "messaging")
                else:
                    log_test("Create Conversation API", "FAIL", f"Service returned error: {data.get('error', 'Unknown error')}", "messaging", "service_error")
            except:
                log_test("Create Conversation API", "FAIL", "Invalid JSON response", "messaging", "response_format")
        elif response.status_code == 500:
            log_test("Create Conversation API", "FAIL", "Internal Server Error - service method returns None", "messaging", "missing_implementation")
        else:
            log_test("Create Conversation API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging", "http_error")
    else:
        log_test("Create Conversation API", "FAIL", "No response received", "messaging", "network_error")
    
    # Test 2: Get Conversations
    print("\n2. Testing Get Conversations API")
    response = make_request("GET", "/messaging/conversations?limit=10", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get('success'):
                    conversations = data.get('conversations', [])
                    log_test("Get Conversations API", "PASS", f"Retrieved {len(conversations)} conversations", "messaging")
                else:
                    log_test("Get Conversations API", "FAIL", f"Service returned error: {data.get('error', 'Unknown error')}", "messaging", "service_error")
            except:
                log_test("Get Conversations API", "FAIL", "Invalid JSON response", "messaging", "response_format")
        elif response.status_code == 500:
            log_test("Get Conversations API", "FAIL", "Internal Server Error - service method returns None", "messaging", "missing_implementation")
        else:
            log_test("Get Conversations API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging", "http_error")
    else:
        log_test("Get Conversations API", "FAIL", "No response received", "messaging", "network_error")
    
    # Test 3: Message Templates (should work)
    print("\n3. Testing Message Templates API")
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
                log_test("Message Templates API", "FAIL", "Invalid JSON response", "messaging", "response_format")
        else:
            log_test("Message Templates API", "FAIL", f"Status {response.status_code}: {response.text}", "messaging", "http_error")
    else:
        log_test("Message Templates API", "FAIL", "No response received", "messaging", "network_error")

def test_business_intelligence_analytics():
    """Test Business Intelligence & Analytics with detailed analysis"""
    print("\n📊 TESTING BUSINESS INTELLIGENCE & ANALYTICS")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {ADMIN_EMAIL}"}
    
    # Test 1: Platform Overview
    print("\n1. Testing Platform Overview API")
    response = make_request("GET", "/analytics/platform-overview?period=30d", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                if 'error' not in data:
                    log_test("Platform Overview API", "PASS", "Retrieved platform overview analytics", "analytics")
                else:
                    log_test("Platform Overview API", "FAIL", f"Service returned error: {data.get('error')}", "analytics", "service_error")
            except:
                log_test("Platform Overview API", "FAIL", "Invalid JSON response", "analytics", "response_format")
        elif response.status_code == 500:
            log_test("Platform Overview API", "FAIL", "Internal Server Error - service method returns None", "analytics", "missing_implementation")
        else:
            log_test("Platform Overview API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics", "http_error")
    else:
        log_test("Platform Overview API", "FAIL", "No response received", "analytics", "network_error")
    
    # Test 2: Market Intelligence (should work)
    print("\n2. Testing Market Intelligence API")
    response = make_request("GET", "/analytics/market-intelligence?category=cattle&region=western_cape", headers=headers)
    if response:
        if response.status_code == 200:
            try:
                data = response.json()
                if 'error' not in data:
                    log_test("Market Intelligence API", "PASS", "Retrieved market intelligence data", "analytics")
                else:
                    log_test("Market Intelligence API", "FAIL", f"Service returned error: {data.get('error')}", "analytics", "service_error")
            except:
                log_test("Market Intelligence API", "FAIL", "Invalid JSON response", "analytics", "response_format")
        else:
            log_test("Market Intelligence API", "FAIL", f"Status {response.status_code}: {response.text}", "analytics", "http_error")
    else:
        log_test("Market Intelligence API", "FAIL", "No response received", "analytics", "network_error")

def test_advanced_search_features():
    """Test Advanced Search Features"""
    print("\n🔍 TESTING ADVANCED SEARCH FEATURES")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {ADMIN_EMAIL}"}
    
    # Test 1: Semantic Search
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
                log_test("Semantic Search API", "FAIL", "Invalid JSON response", "search", "response_format")
        else:
            log_test("Semantic Search API", "FAIL", f"Status {response.status_code}: {response.text}", "search", "http_error")
    else:
        log_test("Semantic Search API", "FAIL", "No response received", "search", "network_error")
    
    # Test 2: Smart Autocomplete
    print("\n2. Testing Smart Autocomplete API")
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
                log_test("Smart Autocomplete API", "FAIL", "Invalid JSON response", "search", "response_format")
        else:
            log_test("Smart Autocomplete API", "FAIL", f"Status {response.status_code}: {response.text}", "search", "http_error")
    else:
        log_test("Smart Autocomplete API", "FAIL", "No response received", "search", "network_error")

def analyze_results():
    """Analyze test results and provide recommendations"""
    print("\n" + "=" * 70)
    print("🎯 COMPREHENSIVE ENHANCEMENT FEATURES ANALYSIS")
    print("=" * 70)
    
    # Feature-specific analysis
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
            
            # Previous vs Current comparison
            previous_rates = {
                "messaging": 33.3,
                "analytics": 16.7,
                "search": 83.3
            }
            
            previous_rate = previous_rates.get(feature, 0)
            if success_rate > previous_rate:
                print(f"  Improvement: +{success_rate - previous_rate:.1f}% from {previous_rate:.1f}%")
            elif success_rate < previous_rate:
                print(f"  Regression: -{previous_rate - success_rate:.1f}% from {previous_rate:.1f}%")
            else:
                print(f"  Status: No change from {previous_rate:.1f}%")
            
            # Issue analysis
            if results["issues"]:
                print(f"  Issues identified:")
                issue_counts = {}
                for issue in results["issues"]:
                    issue_type = issue["issue"]
                    issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1
                
                for issue_type, count in issue_counts.items():
                    print(f"    • {issue_type}: {count} occurrences")
    
    # Overall analysis
    if test_results['total_tests'] > 0:
        overall_success_rate = (test_results['passed_tests'] / test_results['total_tests']) * 100
        print(f"\nOverall Enhancement Features Success Rate: {overall_success_rate:.1f}%")
        
        # Determine status
        if overall_success_rate >= 85:
            status = "🎉 OUTSTANDING: Ready for production"
        elif overall_success_rate >= 70:
            status = "✅ GOOD: Most features functional"
        elif overall_success_rate >= 50:
            status = "⚠️  MODERATE: Significant issues remain"
        else:
            status = "❌ CRITICAL: Major fixes required"
        
        print(f"Status: {status}")
    
    # Root cause analysis
    print(f"\n🔍 ROOT CAUSE ANALYSIS:")
    
    missing_impl_count = len([t for t in test_results['test_details'] if t.get('issue_type') == 'missing_implementation'])
    service_error_count = len([t for t in test_results['test_details'] if t.get('issue_type') == 'service_error'])
    network_error_count = len([t for t in test_results['test_details'] if t.get('issue_type') == 'network_error'])
    
    if missing_impl_count > 0:
        print(f"  • Missing Implementation: {missing_impl_count} endpoints")
        print(f"    - Service methods returning None instead of proper dictionaries")
        print(f"    - Helper methods not implemented in service classes")
    
    if service_error_count > 0:
        print(f"  • Service Errors: {service_error_count} endpoints")
        print(f"    - Services returning error responses instead of data")
    
    if network_error_count > 0:
        print(f"  • Network Errors: {network_error_count} endpoints")
        print(f"    - Connection issues or timeouts")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    
    if missing_impl_count > 0:
        print(f"  1. HIGH PRIORITY: Fix missing helper methods in service classes")
        print(f"     - RealTimeMessagingService: Implement missing database operations")
        print(f"     - BusinessIntelligenceService: Implement missing analytics methods")
        print(f"     - Ensure all service methods return proper dictionaries, not None")
    
    if service_error_count > 0:
        print(f"  2. MEDIUM PRIORITY: Debug service error responses")
        print(f"     - Check service initialization and dependencies")
        print(f"     - Verify database connections and queries")
    
    print(f"  3. TESTING: Re-run tests after fixes to verify improvements")
    print(f"     - Target: 80%+ success rate for messaging and analytics")
    print(f"     - Target: Maintain 83%+ success rate for search features")

def run_final_enhancement_test():
    """Run final comprehensive enhancement test"""
    print("🚀 FINAL ENHANCEMENT FEATURES COMPREHENSIVE TEST")
    print("=" * 70)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 70)
    
    # Run all tests
    test_realtime_messaging_system()
    test_business_intelligence_analytics()
    test_advanced_search_features()
    
    # Analyze results
    analyze_results()
    
    return test_results

if __name__ == "__main__":
    results = run_final_enhancement_test()
    
    # Exit with appropriate code
    if results['failed_tests'] == 0:
        sys.exit(0)
    else:
        sys.exit(1)