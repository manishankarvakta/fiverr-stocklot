#!/usr/bin/env python3
"""
Focused Critical Fixes Testing
Testing specific issues identified in the review request
"""

import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_marketplace_category_filtering():
    """Test the marketplace category filtering fix"""
    print("🔍 TESTING MARKETPLACE CATEGORY FILTERING FIX")
    print("=" * 60)
    
    try:
        # Get category groups
        response = requests.get(f"{API_BASE}/taxonomy/categories")
        if response.status_code != 200:
            print(f"❌ Failed to get categories: {response.status_code}")
            return False
            
        categories = response.json()
        print(f"✅ Found {len(categories)} category groups")
        
        # Test each category group
        working_filters = 0
        total_filters = 0
        
        for category in categories:
            category_id = category.get("id")
            category_name = category.get("name")
            total_filters += 1
            
            # Test category group filtering
            filter_response = requests.get(f"{API_BASE}/listings", params={
                "category_group_id": category_id
            })
            
            if filter_response.status_code == 200:
                listings = filter_response.json()
                listing_count = len(listings) if isinstance(listings, list) else listings.get("total", 0)
                
                if listing_count > 0:
                    print(f"✅ {category_name}: Found {listing_count} listings")
                    working_filters += 1
                else:
                    print(f"❌ {category_name}: Still returning 0 results")
            else:
                print(f"❌ {category_name}: API error {filter_response.status_code}")
        
        success_rate = (working_filters / total_filters * 100) if total_filters > 0 else 0
        print(f"\n📊 Category Filtering Success Rate: {success_rate:.1f}% ({working_filters}/{total_filters})")
        
        return working_filters > 0
        
    except Exception as e:
        print(f"❌ Error testing category filtering: {e}")
        return False

def test_buyer_processing_fee():
    """Test the 1.5% buyer processing fee"""
    print("\n🔍 TESTING 1.5% BUYER PROCESSING FEE")
    print("=" * 60)
    
    try:
        test_amounts = [1000, 2500, 5000]  # Test amounts in cents
        working_fees = 0
        
        for amount in test_amounts:
            response = requests.get(f"{API_BASE}/fees/breakdown", params={
                "amount": amount
            })
            
            if response.status_code == 200:
                fee_data = response.json()
                processing_fee = fee_data.get("processing_fee_minor", 0)
                expected_fee = int(amount * 0.015)  # 1.5%
                
                print(f"Amount: R{amount/100:.2f}")
                print(f"  Expected fee: R{expected_fee/100:.2f}")
                print(f"  Actual fee: R{processing_fee/100:.2f}")
                
                if processing_fee == expected_fee:
                    print(f"  ✅ Correct 1.5% calculation")
                    working_fees += 1
                else:
                    print(f"  ❌ Incorrect calculation")
            else:
                print(f"❌ Fee breakdown API error: {response.status_code}")
        
        success_rate = (working_fees / len(test_amounts) * 100) if test_amounts else 0
        print(f"\n📊 Processing Fee Success Rate: {success_rate:.1f}% ({working_fees}/{len(test_amounts)})")
        
        return working_fees > 0
        
    except Exception as e:
        print(f"❌ Error testing processing fee: {e}")
        return False

def test_admin_authentication_and_endpoints():
    """Test admin authentication and dashboard endpoints"""
    print("\n🔍 TESTING ADMIN AUTHENTICATION & DASHBOARD ENDPOINTS")
    print("=" * 60)
    
    try:
        # Try admin login
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        data = response.json()
        token = data.get("access_token")
        if not token:
            print("❌ No access token in response")
            return False
            
        print("✅ Admin authentication successful")
        
        # Test admin endpoints
        headers = {"Authorization": f"Bearer {token}"}
        admin_endpoints = [
            ("/admin/moderation/stats", "Moderation Stats"),
            ("/admin/roles/requests", "Role Requests"),
            ("/admin/disease/zones", "Disease Zones"),
            ("/admin/config/flags", "Feature Flags")
        ]
        
        working_endpoints = 0
        
        for endpoint, name in admin_endpoints:
            endpoint_response = requests.get(f"{API_BASE}{endpoint}", headers=headers)
            
            if endpoint_response.status_code == 200:
                print(f"✅ {name}: Working")
                working_endpoints += 1
            else:
                print(f"❌ {name}: Status {endpoint_response.status_code}")
        
        success_rate = (working_endpoints / len(admin_endpoints) * 100) if admin_endpoints else 0
        print(f"\n📊 Admin Endpoints Success Rate: {success_rate:.1f}% ({working_endpoints}/{len(admin_endpoints)})")
        
        return working_endpoints > 0
        
    except Exception as e:
        print(f"❌ Error testing admin endpoints: {e}")
        return False

def test_seller_analytics():
    """Test seller analytics endpoint"""
    print("\n🔍 TESTING SELLER ANALYTICS ENDPOINT")
    print("=" * 60)
    
    try:
        # First try without authentication - should get 401/403
        response = requests.get(f"{API_BASE}/seller/analytics")
        
        if response.status_code in [401, 403]:
            print("✅ Seller analytics properly requires authentication")
            
            # Try to create a seller user and test
            register_data = {
                "email": "testseller@example.com",
                "password": "testpass123",
                "full_name": "Test Seller",
                "role": "seller"
            }
            
            register_response = requests.post(f"{API_BASE}/auth/register", json=register_data)
            if register_response.status_code == 200:
                print("✅ Test seller created")
                
                # Login as seller
                login_data = {
                    "email": "testseller@example.com",
                    "password": "testpass123"
                }
                
                login_response = requests.post(f"{API_BASE}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    seller_data = login_response.json()
                    seller_token = seller_data.get("access_token")
                    
                    if seller_token:
                        headers = {"Authorization": f"Bearer {seller_token}"}
                        analytics_response = requests.get(f"{API_BASE}/seller/analytics", headers=headers)
                        
                        if analytics_response.status_code == 200:
                            print("✅ Seller analytics endpoint working")
                            return True
                        else:
                            print(f"❌ Seller analytics failed: {analytics_response.status_code}")
                            print(f"Response: {analytics_response.text}")
                    else:
                        print("❌ No seller token received")
                else:
                    print(f"❌ Seller login failed: {login_response.status_code}")
            else:
                print(f"❌ Seller registration failed: {register_response.status_code}")
        else:
            print(f"❌ Seller analytics should require auth, got: {response.status_code}")
        
        return False
        
    except Exception as e:
        print(f"❌ Error testing seller analytics: {e}")
        return False

def test_error_handling():
    """Test error handling"""
    print("\n🔍 TESTING ERROR HANDLING")
    print("=" * 60)
    
    try:
        working_errors = 0
        total_tests = 0
        
        # Test 404 for non-existent endpoint
        total_tests += 1
        response = requests.get(f"{API_BASE}/non-existent-endpoint")
        if response.status_code == 404:
            print("✅ 404 handling working")
            working_errors += 1
        else:
            print(f"❌ Expected 404, got {response.status_code}")
        
        # Test 401 for protected endpoints
        protected_endpoints = ["/cart", "/orders/user"]
        
        for endpoint in protected_endpoints:
            total_tests += 1
            response = requests.get(f"{API_BASE}{endpoint}")
            if response.status_code in [401, 403]:
                print(f"✅ {endpoint}: Properly protected")
                working_errors += 1
            else:
                print(f"❌ {endpoint}: Expected 401/403, got {response.status_code}")
        
        success_rate = (working_errors / total_tests * 100) if total_tests > 0 else 0
        print(f"\n📊 Error Handling Success Rate: {success_rate:.1f}% ({working_errors}/{total_tests})")
        
        return working_errors > 0
        
    except Exception as e:
        print(f"❌ Error testing error handling: {e}")
        return False

def main():
    """Run all focused tests"""
    print("🚀 FOCUSED CRITICAL FIXES TESTING")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 80)
    
    results = []
    
    # Run tests
    results.append(("Marketplace Category Filtering", test_marketplace_category_filtering()))
    results.append(("1.5% Buyer Processing Fee", test_buyer_processing_fee()))
    results.append(("Admin Dashboard Endpoints", test_admin_authentication_and_endpoints()))
    results.append(("Seller Analytics Endpoint", test_seller_analytics()))
    results.append(("Error Handling", test_error_handling()))
    
    # Generate summary
    print("\n📊 FINAL SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {success_rate:.1f}%")
    print()
    
    print("🎯 CRITICAL FIXES STATUS:")
    for test_name, success in results:
        status = "✅ WORKING" if success else "❌ NOT WORKING"
        print(f"  • {test_name}: {status}")
    
    if success_rate >= 80:
        print("\n🎉 CRITICAL FIXES TESTING COMPLETED SUCCESSFULLY!")
        return True
    else:
        print("\n⚠️  CRITICAL FIXES TESTING COMPLETED WITH ISSUES!")
        return False

if __name__ == "__main__":
    main()