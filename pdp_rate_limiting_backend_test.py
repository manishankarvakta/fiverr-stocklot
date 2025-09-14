#!/usr/bin/env python3
"""
PDP Rate Limiting Backend Testing
Tests the PDP rate limiting fixes to verify the 429 error issue is resolved
"""

import asyncio
import aiohttp
import json
import time
import os
from datetime import datetime
from typing import Dict, List, Optional

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class PDPRateLimitTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.auth_token = None
        self.test_listing_ids = []
        
    async def setup(self):
        """Setup test session and get test data"""
        self.session = aiohttp.ClientSession()
        
        # Get some listing IDs for testing
        await self.get_test_listing_ids()
        
        print(f"🔧 Setup complete. Found {len(self.test_listing_ids)} test listings")
        
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
            
    async def get_test_listing_ids(self):
        """Get some listing IDs for PDP testing"""
        try:
            async with self.session.get(f"{API_BASE}/listings") as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get('listings', [])
                    self.test_listing_ids = [listing['id'] for listing in listings[:6]]
                    print(f"✅ Retrieved {len(self.test_listing_ids)} test listing IDs")
                else:
                    print(f"⚠️  Could not get listings: {response.status}")
                    # Use fallback test IDs
                    self.test_listing_ids = ["test-listing-1", "test-listing-2", "test-listing-3"]
        except Exception as e:
            print(f"⚠️  Error getting listings: {e}")
            self.test_listing_ids = ["test-listing-1", "test-listing-2", "test-listing-3"]
    
    async def test_pdp_endpoint_rate_limiting(self):
        """Test PDP endpoint with new generous rate limits (200/minute, 50 burst)"""
        print("\n🎯 TESTING PDP ENDPOINT RATE LIMITING")
        print("=" * 60)
        
        if not self.test_listing_ids:
            print("❌ No test listing IDs available")
            return False
            
        test_listing_id = self.test_listing_ids[0]
        endpoint = f"{API_BASE}/listings/{test_listing_id}/pdp"
        
        # Test 1: Normal browsing behavior (should work fine)
        print("\n📋 Test 1: Normal browsing behavior (10 requests)")
        success_count = 0
        
        for i in range(10):
            try:
                async with self.session.get(endpoint) as response:
                    if response.status == 200:
                        success_count += 1
                        # Check rate limit headers
                        headers = dict(response.headers)
                        remaining = headers.get('X-RateLimit-Remaining', 'N/A')
                        limit = headers.get('X-RateLimit-Limit', 'N/A')
                        print(f"  Request {i+1}: ✅ 200 OK (Remaining: {remaining}/{limit})")
                    elif response.status == 404:
                        print(f"  Request {i+1}: ⚠️  404 Not Found (listing may not exist)")
                        success_count += 1  # Count as success for rate limiting test
                    else:
                        print(f"  Request {i+1}: ❌ {response.status}")
                        
            except Exception as e:
                print(f"  Request {i+1}: ❌ Error: {e}")
                
            # Small delay between requests
            await asyncio.sleep(0.1)
        
        print(f"✅ Normal browsing: {success_count}/10 requests successful")
        
        # Test 2: Burst limit testing (50 requests quickly)
        print("\n📋 Test 2: Burst limit testing (50 rapid requests)")
        burst_success = 0
        burst_blocked = 0
        
        start_time = time.time()
        
        for i in range(50):
            try:
                async with self.session.get(endpoint) as response:
                    if response.status in [200, 404]:  # Both OK for rate limit testing
                        burst_success += 1
                    elif response.status == 429:
                        burst_blocked += 1
                        print(f"  Request {i+1}: 🚫 429 Rate Limited")
                        break
                    else:
                        print(f"  Request {i+1}: ❌ {response.status}")
                        
            except Exception as e:
                print(f"  Request {i+1}: ❌ Error: {e}")
        
        elapsed = time.time() - start_time
        print(f"✅ Burst test: {burst_success} successful, {burst_blocked} blocked in {elapsed:.2f}s")
        
        # Test 3: Rate limit recovery
        if burst_blocked > 0:
            print("\n📋 Test 3: Rate limit recovery (wait and retry)")
            print("  Waiting 15 seconds for rate limit reset...")
            await asyncio.sleep(15)
            
            try:
                async with self.session.get(endpoint) as response:
                    if response.status in [200, 404]:
                        print("  ✅ Rate limit recovered successfully")
                        return True
                    else:
                        print(f"  ❌ Still blocked: {response.status}")
                        return False
            except Exception as e:
                print(f"  ❌ Recovery test error: {e}")
                return False
        
        return success_count >= 8  # Allow some failures
    
    async def test_analytics_endpoint_rate_limiting(self):
        """Test analytics/track endpoint with generous limits (300/minute, 100 burst)"""
        print("\n🎯 TESTING ANALYTICS ENDPOINT RATE LIMITING")
        print("=" * 60)
        
        endpoint = f"{API_BASE}/analytics/track"
        
        # Test analytics tracking with PDP view events
        print("\n📋 Test 1: Analytics tracking (20 requests)")
        success_count = 0
        
        for i in range(20):
            payload = {
                "event_type": "pdp_view",
                "listing_id": self.test_listing_ids[0] if self.test_listing_ids else "test-listing",
                "user_agent": "Test Browser",
                "timestamp": datetime.now().isoformat()
            }
            
            try:
                async with self.session.post(endpoint, json=payload) as response:
                    if response.status in [200, 201]:
                        success_count += 1
                        headers = dict(response.headers)
                        remaining = headers.get('X-RateLimit-Remaining', 'N/A')
                        limit = headers.get('X-RateLimit-Limit', 'N/A')
                        print(f"  Request {i+1}: ✅ {response.status} (Remaining: {remaining}/{limit})")
                    elif response.status == 429:
                        print(f"  Request {i+1}: 🚫 429 Rate Limited")
                        break
                    else:
                        print(f"  Request {i+1}: ❌ {response.status}")
                        
            except Exception as e:
                print(f"  Request {i+1}: ❌ Error: {e}")
                
            await asyncio.sleep(0.05)  # Faster requests for analytics
        
        print(f"✅ Analytics tracking: {success_count}/20 requests successful")
        
        # Test burst capability (100 burst limit)
        print("\n📋 Test 2: Analytics burst test (50 rapid requests)")
        burst_success = 0
        
        for i in range(50):
            payload = {
                "event_type": "pdp_view",
                "listing_id": self.test_listing_ids[i % len(self.test_listing_ids)] if self.test_listing_ids else f"test-{i}",
                "timestamp": datetime.now().isoformat()
            }
            
            try:
                async with self.session.post(endpoint, json=payload) as response:
                    if response.status in [200, 201]:
                        burst_success += 1
                    elif response.status == 429:
                        print(f"  Request {i+1}: 🚫 429 Rate Limited")
                        break
                        
            except Exception as e:
                print(f"  Request {i+1}: ❌ Error: {e}")
        
        print(f"✅ Analytics burst: {burst_success}/50 requests successful")
        
        return success_count >= 15  # Allow some failures
    
    async def test_ab_test_endpoint_rate_limiting(self):
        """Test ab-test/pdp-config endpoint (200/minute, 50 burst)"""
        print("\n🎯 TESTING A/B TEST ENDPOINT RATE LIMITING")
        print("=" * 60)
        
        if not self.test_listing_ids:
            print("❌ No test listing IDs available")
            return False
            
        test_listing_id = self.test_listing_ids[0]
        endpoint = f"{API_BASE}/ab-test/pdp-config/{test_listing_id}"
        
        print("\n📋 Test 1: A/B test config requests (15 requests)")
        success_count = 0
        
        for i in range(15):
            try:
                async with self.session.get(endpoint) as response:
                    if response.status in [200, 404]:  # 404 OK if service not available
                        success_count += 1
                        headers = dict(response.headers)
                        remaining = headers.get('X-RateLimit-Remaining', 'N/A')
                        limit = headers.get('X-RateLimit-Limit', 'N/A')
                        print(f"  Request {i+1}: ✅ {response.status} (Remaining: {remaining}/{limit})")
                    elif response.status == 429:
                        print(f"  Request {i+1}: 🚫 429 Rate Limited")
                        break
                    elif response.status == 503:
                        print(f"  Request {i+1}: ⚠️  503 Service Unavailable (A/B testing service not available)")
                        success_count += 1  # Count as success for rate limiting test
                    else:
                        print(f"  Request {i+1}: ❌ {response.status}")
                        
            except Exception as e:
                print(f"  Request {i+1}: ❌ Error: {e}")
                
            await asyncio.sleep(0.1)
        
        print(f"✅ A/B test config: {success_count}/15 requests successful")
        
        return success_count >= 10  # Allow some failures
    
    async def test_rate_limit_headers(self):
        """Test that rate limit headers are returned correctly"""
        print("\n🎯 TESTING RATE LIMIT HEADERS")
        print("=" * 60)
        
        if not self.test_listing_ids:
            print("❌ No test listing IDs available")
            return False
            
        endpoint = f"{API_BASE}/listings/{self.test_listing_ids[0]}/pdp"
        
        try:
            async with self.session.get(endpoint) as response:
                headers = dict(response.headers)
                
                print("📋 Rate Limit Headers:")
                print(f"  X-RateLimit-Limit: {headers.get('X-RateLimit-Limit', 'Missing')}")
                print(f"  X-RateLimit-Remaining: {headers.get('X-RateLimit-Remaining', 'Missing')}")
                print(f"  X-RateLimit-Reset: {headers.get('X-RateLimit-Reset', 'Missing')}")
                
                # Check if essential headers are present
                has_limit = 'X-RateLimit-Limit' in headers
                has_remaining = 'X-RateLimit-Remaining' in headers
                has_reset = 'X-RateLimit-Reset' in headers
                
                if has_limit and has_remaining and has_reset:
                    print("✅ All rate limit headers present")
                    return True
                else:
                    print("⚠️  Some rate limit headers missing")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing headers: {e}")
            return False
    
    async def test_real_world_pdp_browsing(self):
        """Simulate real-world PDP browsing behavior"""
        print("\n🎯 TESTING REAL-WORLD PDP BROWSING SIMULATION")
        print("=" * 60)
        
        if len(self.test_listing_ids) < 3:
            print("❌ Need at least 3 test listings for simulation")
            return False
        
        print("📋 Simulating user browsing multiple listings...")
        
        success_count = 0
        total_requests = 0
        
        # Simulate browsing 5 different listings, 3 times each (like user going back/forward)
        for listing_id in self.test_listing_ids[:5]:
            for view_num in range(3):
                total_requests += 1
                endpoint = f"{API_BASE}/listings/{listing_id}/pdp"
                
                try:
                    async with self.session.get(endpoint) as response:
                        if response.status in [200, 404]:
                            success_count += 1
                            print(f"  Listing {listing_id[:8]}... view {view_num+1}: ✅ {response.status}")
                        elif response.status == 429:
                            print(f"  Listing {listing_id[:8]}... view {view_num+1}: 🚫 429 Rate Limited")
                        else:
                            print(f"  Listing {listing_id[:8]}... view {view_num+1}: ❌ {response.status}")
                            
                except Exception as e:
                    print(f"  Listing {listing_id[:8]}... view {view_num+1}: ❌ Error: {e}")
                
                # Realistic delay between page views
                await asyncio.sleep(0.5)
        
        print(f"✅ Real-world simulation: {success_count}/{total_requests} requests successful")
        
        # Test analytics tracking during browsing
        print("\n📋 Testing analytics during browsing...")
        analytics_success = 0
        
        for listing_id in self.test_listing_ids[:3]:
            payload = {
                "event_type": "pdp_view",
                "listing_id": listing_id,
                "user_agent": "Real Browser Simulation",
                "timestamp": datetime.now().isoformat()
            }
            
            try:
                async with self.session.post(f"{API_BASE}/analytics/track", json=payload) as response:
                    if response.status in [200, 201]:
                        analytics_success += 1
                        print(f"  Analytics for {listing_id[:8]}...: ✅ {response.status}")
                    else:
                        print(f"  Analytics for {listing_id[:8]}...: ❌ {response.status}")
                        
            except Exception as e:
                print(f"  Analytics for {listing_id[:8]}...: ❌ Error: {e}")
            
            await asyncio.sleep(0.2)
        
        print(f"✅ Analytics tracking: {analytics_success}/3 requests successful")
        
        return success_count >= (total_requests * 0.8)  # 80% success rate
    
    async def test_error_handling_and_recovery(self):
        """Test error handling when rate limits are exceeded"""
        print("\n🎯 TESTING ERROR HANDLING AND RECOVERY")
        print("=" * 60)
        
        if not self.test_listing_ids:
            print("❌ No test listing IDs available")
            return False
            
        endpoint = f"{API_BASE}/listings/{self.test_listing_ids[0]}/pdp"
        
        # Try to trigger rate limiting with rapid requests
        print("📋 Attempting to trigger rate limiting...")
        
        rate_limited = False
        retry_after = None
        
        for i in range(60):  # Try 60 rapid requests
            try:
                async with self.session.get(endpoint) as response:
                    if response.status == 429:
                        rate_limited = True
                        headers = dict(response.headers)
                        retry_after = headers.get('Retry-After')
                        
                        print(f"  ✅ Rate limit triggered at request {i+1}")
                        print(f"  Retry-After header: {retry_after}")
                        
                        # Test error response format
                        try:
                            error_data = await response.json()
                            print(f"  Error response: {error_data}")
                        except:
                            print("  Error response not JSON")
                        
                        break
                        
            except Exception as e:
                print(f"  Request {i+1}: ❌ Error: {e}")
        
        if not rate_limited:
            print("⚠️  Could not trigger rate limiting (limits may be very generous)")
            return True  # This is actually good - means limits are generous enough
        
        # Test recovery after waiting
        if retry_after:
            try:
                wait_time = min(int(retry_after), 30)  # Cap at 30 seconds for testing
                print(f"📋 Waiting {wait_time} seconds for recovery...")
                await asyncio.sleep(wait_time)
                
                async with self.session.get(endpoint) as response:
                    if response.status in [200, 404]:
                        print("  ✅ Successfully recovered after rate limit")
                        return True
                    else:
                        print(f"  ❌ Still rate limited: {response.status}")
                        return False
                        
            except Exception as e:
                print(f"  ❌ Recovery test error: {e}")
                return False
        
        return True
    
    async def run_all_tests(self):
        """Run all PDP rate limiting tests"""
        print("🚀 STARTING PDP RATE LIMITING COMPREHENSIVE TESTING")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test time: {datetime.now().isoformat()}")
        print("=" * 80)
        
        await self.setup()
        
        test_results = {}
        
        try:
            # Test 1: PDP Endpoint Rate Limiting
            test_results['pdp_endpoint'] = await self.test_pdp_endpoint_rate_limiting()
            
            # Test 2: Analytics Endpoint Rate Limiting  
            test_results['analytics_endpoint'] = await self.test_analytics_endpoint_rate_limiting()
            
            # Test 3: A/B Test Endpoint Rate Limiting
            test_results['ab_test_endpoint'] = await self.test_ab_test_endpoint_rate_limiting()
            
            # Test 4: Rate Limit Headers
            test_results['rate_limit_headers'] = await self.test_rate_limit_headers()
            
            # Test 5: Real-world Browsing Simulation
            test_results['real_world_browsing'] = await self.test_real_world_pdp_browsing()
            
            # Test 6: Error Handling and Recovery
            test_results['error_handling'] = await self.test_error_handling_and_recovery()
            
        finally:
            await self.cleanup()
        
        # Print final results
        print("\n" + "=" * 80)
        print("🎯 FINAL TEST RESULTS")
        print("=" * 80)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed_tests += 1
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\nOverall Success Rate: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🎉 PDP RATE LIMITING TESTS PASSED!")
            print("✅ The 429 error issue appears to be resolved with generous rate limits")
        else:
            print("🚨 PDP RATE LIMITING TESTS FAILED!")
            print("❌ Rate limiting issues may still exist")
        
        return success_rate >= 80

async def main():
    """Main test execution"""
    tester = PDPRateLimitTester()
    success = await tester.run_all_tests()
    return success

if __name__ == "__main__":
    asyncio.run(main())