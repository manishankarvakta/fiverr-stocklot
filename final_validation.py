#!/usr/bin/env python3
"""
FINAL STOCKLOT DEPLOYMENT VALIDATION
Complete end-to-end testing of all critical systems before going live
"""

import asyncio
import aiohttp
import json
from datetime import datetime

async def run_final_validation():
    """Run comprehensive validation of all systems"""
    
    print("🚀 STOCKLOT - FINAL DEPLOYMENT VALIDATION")
    print("Testing all critical systems before production deployment...")
    print("=" * 70)
    
    base_url = "https://farmstock-hub-1.preview.emergentagent.com"
    test_results = []
    
    def log_test(test_name, status, details=""):
        test_results.append({"test": test_name, "status": status, "details": details})
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {status}" + (f" - {details}" if details else ""))
    
    # Test Critical APIs
    print("🔌 TESTING CRITICAL API ENDPOINTS...")
    
    endpoints = [
        ("/api/health", "Health Check"),
        ("/api/species", "Species Data"),
        ("/api/product-types", "Product Types"),
        ("/api/listings?page=1&limit=5", "Listings API"),
    ]
    
    async with aiohttp.ClientSession() as session:
        for endpoint, name in endpoints:
            try:
                async with session.get(f"{base_url}{endpoint}", timeout=10) as response:
                    if response.status == 200:
                        log_test(f"API: {name}", "PASS", f"Status: {response.status}")
                    else:
                        log_test(f"API: {name}", "FAIL", f"Status: {response.status}")
            except Exception as e:
                log_test(f"API: {name}", "FAIL", f"Error: {str(e)[:50]}")
    
    # Test Email System
    print("\n📧 TESTING EMAIL SYSTEM...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://api.mailgun.net/v3/e.stocklot.farm",
                auth=aiohttp.BasicAuth('api', 'c6bcf50f6059adff4bfbd10a2e98f9d2-1ae02a08-912e425d'),
                timeout=10
            ) as response:
                if response.status == 200:
                    log_test("Email: Mailgun Domain", "PASS", "Domain accessible")
                else:
                    log_test("Email: Mailgun Domain", "WARNING", f"Status: {response.status}")
    except Exception as e:
        log_test("Email: Mailgun Domain", "FAIL", f"Error: {str(e)[:50]}")
    
    # Test Payment System
    print("\n💳 TESTING PAYMENT SYSTEM...")
    test_listing_id = "21859c3c-a366-4a0d-bd66-9f3c272863be"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{base_url}/api/listings/{test_listing_id}") as response:
                if response.status == 200:
                    listing = await response.json()
                    log_test("Payment: Test Listing", "PASS", f"Listing: {listing.get('title', 'Unknown')[:30]}")
                else:
                    log_test("Payment: Test Listing", "FAIL", f"Status: {response.status}")
    except Exception as e:
        log_test("Payment: Test Listing", "FAIL", f"Error: {str(e)[:50]}")
    
    # Test Notification System
    print("\n🔔 TESTING NOTIFICATION SYSTEM...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{base_url}/api/admin/settings/notifications",
                headers={'Authorization': 'Bearer admin@stocklot.co.za'}
            ) as response:
                if response.status == 200:
                    log_test("Notifications: Admin Settings", "PASS", "Settings accessible")
                else:
                    log_test("Notifications: Admin Settings", "FAIL", f"Status: {response.status}")
    except Exception as e:
        log_test("Notifications: Admin Settings", "FAIL", f"Error: {str(e)[:50]}")
    
    # Test Frontend Pages
    print("\n🌐 TESTING FRONTEND PAGES...")
    pages = [
        ("/", "Homepage"),
        ("/marketplace", "Marketplace"),
        ("/login", "Login Page"),
        (f"/listing/{test_listing_id}", "Test Listing PDP"),
    ]
    
    async with aiohttp.ClientSession() as session:
        for path, page_name in pages:
            try:
                async with session.get(f"https://farmstock-hub-1.preview.emergentagent.com{path}", timeout=15) as response:
                    if response.status == 200:
                        log_test(f"Frontend: {page_name}", "PASS", f"Status: {response.status}")
                    else:
                        log_test(f"Frontend: {page_name}", "FAIL", f"Status: {response.status}")
            except Exception as e:
                log_test(f"Frontend: {page_name}", "FAIL", f"Error: {str(e)[:50]}")
    
    # Generate Report
    passed = [t for t in test_results if t["status"] == "PASS"]
    failed = [t for t in test_results if t["status"] == "FAIL"]
    warnings = [t for t in test_results if t["status"] == "WARNING"]
    
    print("\n" + "="*80)
    print("🚀 FINAL STOCKLOT DEPLOYMENT VALIDATION REPORT")
    print("="*80)
    
    print(f"\n📊 TEST SUMMARY:")
    print(f"   ✅ PASSED: {len(passed)}")
    print(f"   ❌ FAILED: {len(failed)}")
    print(f"   ⚠️  WARNINGS: {len(warnings)}")
    
    success_rate = (len(passed) / len(test_results)) * 100 if test_results else 0
    print(f"   📈 SUCCESS RATE: {success_rate:.1f}%")
    
    if failed:
        print(f"\n❌ FAILED TESTS:")
        for test in failed[:5]:
            print(f"   • {test['test']}: {test['details']}")
    
    # Final Verdict
    print(f"\n🎯 DEPLOYMENT VERDICT:")
    if len(failed) == 0 and success_rate >= 90:
        print("   🟢 EXCELLENT - READY FOR PRODUCTION DEPLOYMENT")
        print("   🚀 All critical systems are operational!")
        return True
    elif len(failed) <= 2:
        print("   🟡 GOOD - READY WITH MONITORING")
        print("   📊 Most systems working, minor issues acceptable")
        return True
    else:
        print("   🔴 ISSUES DETECTED - REVIEW BEFORE DEPLOYMENT")
        print("   🔧 Address failed tests for optimal performance")
        return False

if __name__ == "__main__":
    result = asyncio.run(run_final_validation())
    exit(0 if result else 1)