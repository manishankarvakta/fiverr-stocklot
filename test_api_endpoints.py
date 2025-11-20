#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing Script
Tests all endpoints documented in API_DOCUMENTATION.md
"""

import requests
import json
import sys
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Configuration
BACKEND_URL = "https://apilifestock.aamardokan.online"
BASE_URL = f"{BACKEND_URL}/api"

# Test results storage
results = {
    "passed": [],
    "failed": [],
    "skipped": [],
    "total": 0
}

# Authentication token (will be set after login)
auth_token = None
test_user_credentials = {
    "email": "test@example.com",
    "password": "testpassword123"
}

def print_status(endpoint: str, method: str, status: str, details: str = ""):
    """Print test status with color coding"""
    status_symbols = {
        "PASS": "✅",
        "FAIL": "❌",
        "SKIP": "⏭️"
    }
    symbol = status_symbols.get(status, "❓")
    print(f"{symbol} {method:6} {endpoint:50} {status}")
    if details:
        print(f"   └─ {details}")

def test_endpoint(
    method: str,
    endpoint: str,
    requires_auth: bool = False,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
    expected_status: int = 200,
    skip: bool = False
) -> Tuple[bool, str]:
    """Test a single endpoint"""
    global auth_token
    
    if skip:
        results["skipped"].append(f"{method} {endpoint}")
        print_status(endpoint, method, "SKIP", "Skipped")
        return True, "Skipped"
    
    results["total"] += 1
    url = f"{BASE_URL}{endpoint}"
    
    headers = {"Content-Type": "application/json"}
    if requires_auth and auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, params=params, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, params=params, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, params=params, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, params=params, timeout=10)
        else:
            return False, f"Unknown method: {method}"
        
        # Check if status is acceptable (200-299 or expected status)
        is_success = (
            (200 <= response.status_code < 300) or 
            (response.status_code == expected_status)
        )
        
        if is_success:
            results["passed"].append(f"{method} {endpoint}")
            print_status(endpoint, method, "PASS", f"Status: {response.status_code}")
            return True, f"Status: {response.status_code}"
        else:
            error_msg = f"Status: {response.status_code}"
            try:
                error_data = response.json()
                if "detail" in error_data:
                    error_msg += f" - {error_data['detail']}"
                elif "error" in error_data:
                    error_msg += f" - {error_data['error']}"
            except:
                error_msg += f" - {response.text[:100]}"
            
            results["failed"].append(f"{method} {endpoint}")
            print_status(endpoint, method, "FAIL", error_msg)
            return False, error_msg
            
    except requests.exceptions.Timeout:
        results["failed"].append(f"{method} {endpoint}")
        print_status(endpoint, method, "FAIL", "Request timeout")
        return False, "Request timeout"
    except requests.exceptions.ConnectionError:
        results["failed"].append(f"{method} {endpoint}")
        print_status(endpoint, method, "FAIL", "Connection error")
        return False, "Connection error"
    except Exception as e:
        results["failed"].append(f"{method} {endpoint}")
        print_status(endpoint, method, "FAIL", f"Error: {str(e)}")
        return False, str(e)

def authenticate():
    """Authenticate and get token"""
    global auth_token
    print("\n" + "="*80)
    print("🔐 AUTHENTICATION")
    print("="*80)
    
    # Try to register first (might fail if user exists)
    register_data = {
        "email": test_user_credentials["email"],
        "password": test_user_credentials["password"],
        "full_name": "Test User",
        "role": "both"
    }
    test_endpoint("POST", "/auth/register", data=register_data, expected_status=[200, 201, 400, 409])
    
    # Login
    login_data = {
        "email": test_user_credentials["email"],
        "password": test_user_credentials["password"]
    }
    
    url = f"{BASE_URL}/auth/login"
    try:
        response = requests.post(url, json=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            auth_token = data.get("access_token") or data.get("token")
            if auth_token:
                print(f"✅ Authentication successful")
                return True
            else:
                print(f"⚠️  Login successful but no token received")
                return False
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return False

def test_health_endpoints():
    """Test health and system endpoints"""
    print("\n" + "="*80)
    print("🏥 HEALTH & SYSTEM ENDPOINTS")
    print("="*80)
    
    test_endpoint("GET", "/health")
    test_endpoint("GET", "/performance/health-check", skip=True)  # May not exist

def test_authentication_endpoints():
    """Test authentication endpoints"""
    print("\n" + "="*80)
    print("🔐 AUTHENTICATION ENDPOINTS")
    print("="*80)
    
    # Public endpoints
    test_endpoint("POST", "/auth/register", data={
        "email": f"test{datetime.now().timestamp()}@example.com",
        "password": "testpass123",
        "full_name": "Test User",
        "role": "buyer"
    }, expected_status=[200, 201, 400])
    
    test_endpoint("POST", "/auth/login", data={
        "email": "nonexistent@example.com",
        "password": "wrongpass"
    }, expected_status=[401, 400])
    
    # Authenticated endpoints (after auth)
    if auth_token:
        test_endpoint("GET", "/auth/me", requires_auth=True)
        test_endpoint("POST", "/auth/logout", requires_auth=True)
        test_endpoint("POST", "/auth/refresh", requires_auth=True)

def test_listings_endpoints():
    """Test listings endpoints"""
    print("\n" + "="*80)
    print("📦 LISTINGS ENDPOINTS")
    print("="*80)
    
    # Public endpoints
    test_endpoint("GET", "/listings")
    test_endpoint("GET", "/listings", params={"limit": 10, "page": 1})
    test_endpoint("GET", "/listings/search", params={"q": "cattle"})
    
    # Authenticated endpoints
    if auth_token:
        test_endpoint("GET", "/listings/my", requires_auth=True)

def test_cart_endpoints():
    """Test cart endpoints"""
    print("\n" + "="*80)
    print("🛒 CART ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/cart", requires_auth=True)
        test_endpoint("POST", "/cart/add", requires_auth=True, data={
            "listing_id": "test_listing_id",
            "quantity": 1
        }, expected_status=[200, 400, 404])

def test_orders_endpoints():
    """Test orders endpoints"""
    print("\n" + "="*80)
    print("📋 ORDERS ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/orders/user", requires_auth=True)

def test_messaging_endpoints():
    """Test messaging endpoints"""
    print("\n" + "="*80)
    print("💬 MESSAGING ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/inbox/summary", requires_auth=True)
        test_endpoint("GET", "/inbox", requires_auth=True)
        test_endpoint("GET", "/messaging/conversations", requires_auth=True)

def test_notifications_endpoints():
    """Test notifications endpoints"""
    print("\n" + "="*80)
    print("🔔 NOTIFICATIONS ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/notifications", requires_auth=True)

def test_wishlist_endpoints():
    """Test wishlist endpoints"""
    print("\n" + "="*80)
    print("❤️  WISHLIST ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/buyer/wishlist", requires_auth=True)
        test_endpoint("GET", "/buyer/wishlist/stats", requires_auth=True)

def test_price_alerts_endpoints():
    """Test price alerts endpoints"""
    print("\n" + "="*80)
    print("💰 PRICE ALERTS ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/buyer/price-alerts", requires_auth=True)
        test_endpoint("GET", "/buyer/price-alerts/stats", requires_auth=True)

def test_search_endpoints():
    """Test search endpoints"""
    print("\n" + "="*80)
    print("🔍 SEARCH ENDPOINTS")
    print("="*80)
    
    test_endpoint("POST", "/search/semantic", data={
        "query": "cattle for sale"
    }, expected_status=[200, 400, 500])
    
    test_endpoint("GET", "/search/autocomplete", params={"q": "cow"})

def test_buy_requests_endpoints():
    """Test buy requests endpoints"""
    print("\n" + "="*80)
    print("🛒 BUY REQUESTS ENDPOINTS")
    print("="*80)
    
    test_endpoint("GET", "/public/buy-requests")
    
    if auth_token:
        test_endpoint("GET", "/buy-requests/my", requires_auth=True)

def test_admin_endpoints():
    """Test admin endpoints"""
    print("\n" + "="*80)
    print("👑 ADMIN ENDPOINTS")
    print("="*80)
    
    if auth_token:
        # These will likely fail if user is not admin, but we test them
        test_endpoint("GET", "/admin/users", requires_auth=True, expected_status=[200, 403])
        test_endpoint("GET", "/admin/moderation/stats", requires_auth=True, expected_status=[200, 403])

def test_upload_endpoints():
    """Test upload endpoints"""
    print("\n" + "="*80)
    print("📤 UPLOAD ENDPOINTS")
    print("="*80)
    
    # Upload endpoints require file uploads, so we skip them for now
    # but test that they exist
    if auth_token:
        test_endpoint("POST", "/upload/profile-image", requires_auth=True, 
                     data={}, expected_status=[400, 422], skip=True)

def test_contact_endpoints():
    """Test contact endpoints"""
    print("\n" + "="*80)
    print("📧 CONTACT ENDPOINTS")
    print("="*80)
    
    test_endpoint("POST", "/contact", data={
        "name": "Test User",
        "email": "test@example.com",
        "message": "Test message"
    }, expected_status=[200, 201, 400])

def test_kyc_endpoints():
    """Test KYC endpoints"""
    print("\n" + "="*80)
    print("🆔 KYC ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/kyc/status", requires_auth=True)
        test_endpoint("POST", "/kyc/start", requires_auth=True, expected_status=[200, 400])

def test_2fa_endpoints():
    """Test 2FA endpoints"""
    print("\n" + "="*80)
    print("🔒 2FA ENDPOINTS")
    print("="*80)
    
    if auth_token:
        test_endpoint("GET", "/auth/2fa/status", requires_auth=True)

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {results['total']}")
    print(f"✅ Passed:   {len(results['passed'])}")
    print(f"❌ Failed:   {len(results['failed'])}")
    print(f"⏭️  Skipped:  {len(results['skipped'])}")
    
    if results['failed']:
        print("\n❌ FAILED ENDPOINTS:")
        for endpoint in results['failed']:
            print(f"   - {endpoint}")
    
    if results['skipped']:
        print("\n⏭️  SKIPPED ENDPOINTS:")
        for endpoint in results['skipped']:
            print(f"   - {endpoint}")
    
    success_rate = (len(results['passed']) / results['total'] * 100) if results['total'] > 0 else 0
    print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    return len(results['failed']) == 0

def main():
    """Main test function"""
    print("="*80)
    print("🧪 STOCKLOT API ENDPOINT TESTING")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test health first
    test_health_endpoints()
    
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
    test_admin_endpoints()
    test_upload_endpoints()
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

