#!/usr/bin/env python3
"""
Test AI Enhanced Service endpoints to identify issues
"""
import asyncio
import requests
import json
import os
import sys

# Backend URL (should work locally)
BACKEND_URL = "http://localhost:8001"

def test_endpoint(method, url, headers=None, data=None):
    """Test an endpoint and return response details"""
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=data)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        return {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "content": response.text[:1000] if response.text else "",
            "success": 200 <= response.status_code < 300
        }
    except Exception as e:
        return {
            "error": str(e),
            "success": False
        }

def main():
    print("🔍 Testing AI Enhanced Service Endpoints")
    print("=" * 50)
    
    # Test endpoints
    endpoints_to_test = [
        ("GET", "/api/ai/price-suggestions", {"species": "cattle", "product_type": "commercial", "province": "Gauteng"}),
        ("POST", "/api/ai/auto-description", {
            "species": "cattle",
            "product_type": "commercial", 
            "breed": "Angus",
            "quantity": 10,
            "unit": "head",
            "location": "Gauteng"
        }),
        ("GET", "/api/ai/market-analytics", {"species": "cattle"}),
        ("POST", "/api/ml/faq/ask", {"question": "How do I buy cattle?"}),
        ("GET", "/api/ml/matching/find-matches", {"request_id": "test-123"}),
    ]
    
    results = {}
    
    for method, endpoint, data in endpoints_to_test:
        print(f"\n🧪 Testing {method} {endpoint}")
        url = f"{BACKEND_URL}{endpoint}"
        
        result = test_endpoint(method, url, data=data)
        results[endpoint] = result
        
        if result["success"]:
            print(f"✅ SUCCESS: {result['status_code']}")
        else:
            print(f"❌ FAILED: {result.get('status_code', 'ERROR')}")
            if "error" in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Response: {result['content'][:200]}...")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    successful = sum(1 for r in results.values() if r["success"])
    total = len(results)
    
    print(f"Success Rate: {successful}/{total} ({successful/total*100:.1f}%)")
    
    for endpoint, result in results.items():
        status = "✅" if result["success"] else "❌"
        code = result.get("status_code", "ERROR")
        print(f"{status} {endpoint}: {code}")
    
    # Check specific issues
    print("\n🔍 ISSUE ANALYSIS")
    print("-" * 30)
    
    for endpoint, result in results.items():
        if not result["success"]:
            if result.get("status_code") == 404:
                print(f"🚨 {endpoint}: 404 - Endpoint not found or not registered")
            elif result.get("status_code") == 500:
                print(f"🚨 {endpoint}: 500 - Server error (likely service instantiation issue)")
            elif "error" in result:
                print(f"🚨 {endpoint}: Connection error - {result['error']}")

if __name__ == "__main__":
    main()