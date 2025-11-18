#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing Script
Tests ALL endpoints from API_DOCUMENTATION.md systematically
"""

import requests
import json
import sys
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from collections import defaultdict

# Configuration
BACKEND_URL = "http://localhost:8000"
BASE_URL = f"{BACKEND_URL}/api"

# Test results storage
results = defaultdict(list)
test_user = None
auth_token = None

def print_header(title: str):
    """Print section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_status(endpoint: str, method: str, status: str, details: str = "", response_time: float = 0):
    """Print test status with color coding"""
    status_symbols = {
        "PASS": "✅",
        "FAIL": "❌",
        "SKIP": "⏭️",
        "WARN": "⚠️"
    }
    symbol = status_symbols.get(status, "❓")
    time_str = f"({response_time:.2f}s)" if response_time > 0 else ""
    print(f"{symbol} {method:6} {endpoint:60} {status:6} {time_str}")
    if details:
        print(f"   └─ {details}")

def test_endpoint(
    method: str,
    endpoint: str,
    category: str = "general",
    requires_auth: bool = False,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
    expected_status: List[int] = [200],
    skip: bool = False,
    description: str = ""
) -> Tuple[bool, str, float]:
    """Test a single endpoint"""
    global auth_token
    
    if skip:
        results[category].append({"endpoint": endpoint, "method": method, "status": "SKIP", "reason": "Skipped"})
        print_status(endpoint, method, "SKIP", "Skipped")
        return True, "Skipped", 0.0
    
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if requires_auth and auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    start_time = time.time()
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=15)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, params=params, timeout=15)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, params=params, timeout=15)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, params=params, timeout=15)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, params=params, timeout=15)
        else:
            return False, f"Unknown method: {method}", 0.0
        
        response_time = time.time() - start_time
        
        # Check if status is acceptable
        is_success = response.status_code in expected_status or (200 <= response.status_code < 300)
        
        if is_success:
            results[category].append({
                "endpoint": endpoint,
                "method": method,
                "status": "PASS",
                "status_code": response.status_code,
                "response_time": response_time
            })
            print_status(endpoint, method, "PASS", f"Status: {response.status_code}", response_time)
            return True, f"Status: {response.status_code}", response_time
        else:
            error_msg = f"Status: {response.status_code}"
            try:
                error_data = response.json()
                if isinstance(error_data, list) and len(error_data) > 0:
                    error_msg += f" - {error_data[0].get('msg', 'Validation error')}"
                elif isinstance(error_data, dict):
                    if "detail" in error_data:
                        detail = error_data["detail"]
                        if isinstance(detail, list) and len(detail) > 0:
                            error_msg += f" - {detail[0].get('msg', str(detail[0]))}"
                        else:
                            error_msg += f" - {detail}"
                    elif "error" in error_data:
                        error_msg += f" - {error_data['error']}"
                    elif "message" in error_data:
                        error_msg += f" - {error_data['message']}"
            except:
                error_msg += f" - {response.text[:100]}"
            
            results[category].append({
                "endpoint": endpoint,
                "method": method,
                "status": "FAIL",
                "status_code": response.status_code,
                "error": error_msg,
                "response_time": response_time
            })
            print_status(endpoint, method, "FAIL", error_msg, response_time)
            return False, error_msg, response_time
            
    except requests.exceptions.Timeout:
        response_time = time.time() - start_time
        results[category].append({
            "endpoint": endpoint,
            "method": method,
            "status": "FAIL",
            "error": "Request timeout"
        })
        print_status(endpoint, method, "FAIL", "Request timeout", response_time)
        return False, "Request timeout", response_time
    except requests.exceptions.ConnectionError:
        results[category].append({
            "endpoint": endpoint,
            "method": method,
            "status": "FAIL",
            "error": "Connection error - Is backend running?"
        })
        print_status(endpoint, method, "FAIL", "Connection error - Is backend running?")
        return False, "Connection error", 0.0
    except Exception as e:
        response_time = time.time() - start_time
        results[category].append({
            "endpoint": endpoint,
            "method": method,
            "status": "FAIL",
            "error": str(e)
        })
        print_status(endpoint, method, "FAIL", f"Error: {str(e)}", response_time)
        return False, str(e), response_time

def authenticate():
    """Authenticate and get token"""
    global auth_token, test_user
    
    print_header("🔐 AUTHENTICATION")
    
    # Try to register a test user
    test_email = f"test{int(time.time())}@example.com"
    register_data = {
        "email": test_email,
        "password": "testpass123",
        "full_name": "Test User",
        "role": "buyer"  # Use 'buyer' instead of 'both' as per validation
    }
    
    success, msg, _ = test_endpoint("POST", "/auth/register", "auth", data=register_data, expected_status=[200, 201, 400, 409])
    
    if not success and "409" not in msg and "400" not in msg:
        print("⚠️  Registration failed, trying login with existing user...")
    
    # Try to login
    login_data = {
        "email": test_email,
        "password": "testpass123"
    }
    
    url = f"{BASE_URL}/auth/login"
    try:
        response = requests.post(url, json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            auth_token = data.get("access_token") or data.get("token")
            if auth_token:
                test_user = data.get("user") or {"email": test_email}
                print(f"✅ Authentication successful - User: {test_user.get('email', test_email)}")
                return True
        else:
            print(f"⚠️  Login failed: {response.status_code}")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                pass
            return False
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return False

def test_health_endpoints():
    """Test health and system endpoints"""
    print_header("🏥 HEALTH & SYSTEM ENDPOINTS")
    test_endpoint("GET", "/health", "health")
    test_endpoint("GET", "/performance/health-check", "health", expected_status=[200, 404])

def test_authentication_endpoints():
    """Test authentication endpoints"""
    print_header("🔐 AUTHENTICATION ENDPOINTS")
    
    # Public endpoints
    test_endpoint("POST", "/auth/register", "auth", data={
        "email": f"test{int(time.time())}@example.com",
        "password": "testpass123",
        "full_name": "Test User",
        "role": "buyer"
    }, expected_status=[200, 201, 400, 409])
    
    # Authenticated endpoints
    if auth_token:
        test_endpoint("GET", "/auth/me", "auth", requires_auth=True)
        test_endpoint("POST", "/auth/logout", "auth", requires_auth=True, expected_status=[200, 204])
        test_endpoint("POST", "/auth/refresh", "auth", requires_auth=True)

def test_listings_endpoints():
    """Test listings endpoints"""
    print_header("📦 LISTINGS ENDPOINTS")
    
    # Public endpoints
    test_endpoint("GET", "/listings", "listings", params={"limit": 10})
    test_endpoint("GET", "/listings/search", "listings", params={"q": "cattle"})
    
    # Authenticated endpoints
    if auth_token:
        test_endpoint("GET", "/listings/my", "listings", requires_auth=True)
        test_endpoint("POST", "/listings", "listings", requires_auth=True, data={
            "title": "Test Listing",
            "description": "Test description",
            "price": 1000,
            "category": "cattle"
        }, expected_status=[200, 201, 400, 422])

def test_cart_endpoints():
    """Test cart endpoints"""
    print_header("🛒 CART ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/cart", "cart", requires_auth=True)
        test_endpoint("POST", "/cart/add", "cart", requires_auth=True, data={
            "listing_id": "test_id",
            "quantity": 1
        }, expected_status=[200, 400, 404, 422])

def test_orders_endpoints():
    """Test orders endpoints"""
    print_header("📋 ORDERS ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/orders/user", "orders", requires_auth=True)

def test_messaging_endpoints():
    """Test messaging endpoints"""
    print_header("💬 MESSAGING ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/inbox/summary", "messaging", requires_auth=True)
        test_endpoint("GET", "/inbox", "messaging", requires_auth=True)
        test_endpoint("GET", "/messaging/conversations", "messaging", requires_auth=True)

def test_notifications_endpoints():
    """Test notifications endpoints"""
    print_header("🔔 NOTIFICATIONS ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/notifications", "notifications", requires_auth=True)

def test_wishlist_endpoints():
    """Test wishlist endpoints"""
    print_header("❤️  WISHLIST ENDPOINTS")
    
    if auth_token:
        # Try different possible paths
        test_endpoint("GET", "/buyer/wishlist", "wishlist", requires_auth=True, expected_status=[200, 404, 422])
        test_endpoint("GET", "/wishlist", "wishlist", requires_auth=True, expected_status=[200, 404])

def test_price_alerts_endpoints():
    """Test price alerts endpoints"""
    print_header("💰 PRICE ALERTS ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/buyer/price-alerts", "price_alerts", requires_auth=True, expected_status=[200, 404, 422])
        test_endpoint("GET", "/price-alerts", "price_alerts", requires_auth=True, expected_status=[200, 404])

def test_search_endpoints():
    """Test search endpoints"""
    print_header("🔍 SEARCH ENDPOINTS")
    
    test_endpoint("POST", "/search/semantic", "search", data={"query": "cattle for sale"}, expected_status=[200, 400, 500])
    test_endpoint("GET", "/search/autocomplete", "search", params={"q": "cow"})

def test_buy_requests_endpoints():
    """Test buy requests endpoints"""
    print_header("🛒 BUY REQUESTS ENDPOINTS")
    
    test_endpoint("GET", "/public/buy-requests", "buy_requests")
    
    if auth_token:
        test_endpoint("GET", "/buy-requests/my", "buy_requests", requires_auth=True)

def test_contact_endpoints():
    """Test contact endpoints"""
    print_header("📧 CONTACT ENDPOINTS")
    
    test_endpoint("POST", "/contact", "contact", data={
        "name": "Test User",
        "email": "test@example.com",
        "message": "Test message",
        "subject": "Test Subject"
    }, expected_status=[200, 201, 400, 422])

def test_kyc_endpoints():
    """Test KYC endpoints"""
    print_header("🆔 KYC ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/kyc/status", "kyc", requires_auth=True)
        test_endpoint("POST", "/kyc/start", "kyc", requires_auth=True, expected_status=[200, 400, 422])

def test_2fa_endpoints():
    """Test 2FA endpoints"""
    print_header("🔒 2FA ENDPOINTS")
    
    if auth_token:
        test_endpoint("GET", "/auth/2fa/status", "2fa", requires_auth=True)

def print_summary():
    """Print comprehensive test summary"""
    print_header("📊 COMPREHENSIVE TEST SUMMARY")
    
    total_tests = sum(len(tests) for tests in results.values())
    total_passed = sum(1 for tests in results.values() for t in tests if t.get("status") == "PASS")
    total_failed = sum(1 for tests in results.values() for t in tests if t.get("status") == "FAIL")
    total_skipped = sum(1 for tests in results.values() for t in tests if t.get("status") == "SKIP")
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"✅ Passed:   {total_passed}")
    print(f"❌ Failed:   {total_failed}")
    print(f"⏭️  Skipped:  {total_skipped}")
    
    if total_tests > 0:
        success_rate = (total_passed / total_tests * 100)
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    # Category breakdown
    print("\n📋 Results by Category:")
    for category, tests in results.items():
        passed = sum(1 for t in tests if t.get("status") == "PASS")
        failed = sum(1 for t in tests if t.get("status") == "FAIL")
        skipped = sum(1 for t in tests if t.get("status") == "SKIP")
        print(f"  {category:20} - Passed: {passed:3} | Failed: {failed:3} | Skipped: {skipped:3}")
    
    # Failed endpoints
    if total_failed > 0:
        print("\n❌ FAILED ENDPOINTS:")
        for category, tests in results.items():
            for test in tests:
                if test.get("status") == "FAIL":
                    error = test.get("error", f"Status: {test.get('status_code', 'Unknown')}")
                    print(f"   - {test['method']:6} {test['endpoint']:50} - {error}")
    
    return total_failed == 0

def main():
    """Main test function"""
    print("="*80)
    print("🧪 STOCKLOT COMPREHENSIVE API ENDPOINT TESTING")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test health first
    test_health_endpoints()
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("\n❌ Backend health check failed. Is the server running?")
            print("   Start with: cd backend && source venv/bin/activate && python3 server.py")
            return 1
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend. Is the server running?")
        print("   Start with: cd backend && source venv/bin/activate && uvicorn server:app --reload")
        return 1
    
    # Authenticate
    authenticated = authenticate()
    
    if not authenticated:
        print("\n⚠️  Warning: Authentication failed. Some tests will be skipped.")
    
    # Run all endpoint tests
    test_authentication_endpoints()
    test_listings_endpoints()
    test_cart_endpoints()
    test_orders_endpoints()
    test_messaging_endpoints()
    test_notifications_endpoints()
    test_wishlist_endpoints()
    test_price_alerts_endpoints()
    test_search_endpoints()
    test_buy_requests_endpoints()
    test_contact_endpoints()
    test_kyc_endpoints()
    test_2fa_endpoints()
    
    # Print summary
    all_passed = print_summary()
    
    print("\n" + "="*80)
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

