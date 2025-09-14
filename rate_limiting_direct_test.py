#!/usr/bin/env python3
"""
Direct Rate Limiting Service Testing
Tests the rate limiting service directly to verify it works with memory store
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional
from unittest.mock import Mock

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import the rate limiting service
import sys
import os
sys.path.append('/app/backend')
sys.path.append('/app/backend/services')

from services.rate_limiting_service import RateLimitingService, rate_limit_middleware, RATE_LIMITS

class DirectRateLimitTester:
    def __init__(self):
        # Create a rate limiting service with memory store only
        self.rate_limiter = RateLimitingService()
        # Force memory store by setting redis_client to None
        self.rate_limiter.redis_client = None
        
        self.test_results = {
            "memory_store_basic": {"passed": False, "details": ""},
            "burst_limit_test": {"passed": False, "details": ""},
            "window_reset_test": {"passed": False, "details": ""},
            "different_identifiers": {"passed": False, "details": ""},
            "rate_limit_middleware": {"passed": False, "details": ""}
        }

    async def test_memory_store_basic(self):
        """Test basic memory store rate limiting"""
        logger.info("🧪 Testing memory store basic rate limiting...")
        
        try:
            identifier = "test_user_1"
            endpoint = "test_endpoint"
            max_requests = 3
            window_seconds = 60
            
            results = []
            
            # Make requests up to the limit
            for i in range(max_requests + 2):  # Try 2 more than limit
                is_allowed, rate_info = await self.rate_limiter.check_rate_limit(
                    identifier=identifier,
                    endpoint=endpoint,
                    max_requests=max_requests,
                    window_seconds=window_seconds
                )
                
                results.append({
                    "request": i + 1,
                    "allowed": is_allowed,
                    "remaining": rate_info.get("remaining", 0),
                    "error": rate_info.get("error")
                })
                
                logger.info(f"Request {i + 1}: allowed={is_allowed}, remaining={rate_info.get('remaining', 0)}")
            
            # Check results
            allowed_requests = [r for r in results if r["allowed"]]
            blocked_requests = [r for r in results if not r["allowed"]]
            
            if len(allowed_requests) == max_requests and len(blocked_requests) >= 1:
                self.test_results["memory_store_basic"]["passed"] = True
                self.test_results["memory_store_basic"]["details"] = (
                    f"✅ Memory store working: {len(allowed_requests)} allowed, {len(blocked_requests)} blocked"
                )
                logger.info("✅ Memory store basic test PASSED")
            else:
                self.test_results["memory_store_basic"]["details"] = (
                    f"❌ Memory store failed: {len(allowed_requests)} allowed (expected {max_requests}), "
                    f"{len(blocked_requests)} blocked (expected ≥1)"
                )
                logger.error("❌ Memory store basic test FAILED")
                
        except Exception as e:
            self.test_results["memory_store_basic"]["details"] = f"❌ Test error: {str(e)}"
            logger.error(f"❌ Memory store basic test error: {e}")

    async def test_burst_limit(self):
        """Test burst limit functionality"""
        logger.info("🧪 Testing burst limit functionality...")
        
        try:
            identifier = "test_user_2"
            endpoint = "test_burst"
            max_requests = 10
            window_seconds = 60
            burst_limit = 3
            
            results = []
            
            # Make rapid requests to test burst limit
            for i in range(burst_limit + 2):  # Try 2 more than burst limit
                is_allowed, rate_info = await self.rate_limiter.check_rate_limit(
                    identifier=identifier,
                    endpoint=endpoint,
                    max_requests=max_requests,
                    window_seconds=window_seconds,
                    burst_limit=burst_limit
                )
                
                results.append({
                    "request": i + 1,
                    "allowed": is_allowed,
                    "error": rate_info.get("error")
                })
                
                logger.info(f"Burst request {i + 1}: allowed={is_allowed}, error={rate_info.get('error')}")
            
            # Check if burst limit was enforced
            blocked_by_burst = [r for r in results if not r["allowed"] and "burst" in str(r.get("error", "")).lower()]
            
            if len(blocked_by_burst) >= 1:
                self.test_results["burst_limit_test"]["passed"] = True
                self.test_results["burst_limit_test"]["details"] = (
                    f"✅ Burst limit working: {len(blocked_by_burst)} requests blocked by burst limit"
                )
                logger.info("✅ Burst limit test PASSED")
            else:
                self.test_results["burst_limit_test"]["details"] = (
                    f"❌ Burst limit not working: No requests blocked by burst limit"
                )
                logger.error("❌ Burst limit test FAILED")
                
        except Exception as e:
            self.test_results["burst_limit_test"]["details"] = f"❌ Test error: {str(e)}"
            logger.error(f"❌ Burst limit test error: {e}")

    async def test_different_identifiers(self):
        """Test that different identifiers have separate limits"""
        logger.info("🧪 Testing different identifiers...")
        
        try:
            endpoint = "test_separate"
            max_requests = 2
            window_seconds = 60
            
            # Test with two different identifiers
            user1_results = []
            user2_results = []
            
            # Fill up user1's limit
            for i in range(max_requests + 1):
                is_allowed, rate_info = await self.rate_limiter.check_rate_limit(
                    identifier="user1",
                    endpoint=endpoint,
                    max_requests=max_requests,
                    window_seconds=window_seconds
                )
                user1_results.append(is_allowed)
            
            # Test user2 should still be allowed
            for i in range(max_requests):
                is_allowed, rate_info = await self.rate_limiter.check_rate_limit(
                    identifier="user2",
                    endpoint=endpoint,
                    max_requests=max_requests,
                    window_seconds=window_seconds
                )
                user2_results.append(is_allowed)
            
            user1_allowed = sum(user1_results)
            user2_allowed = sum(user2_results)
            
            if user1_allowed == max_requests and user2_allowed == max_requests:
                self.test_results["different_identifiers"]["passed"] = True
                self.test_results["different_identifiers"]["details"] = (
                    f"✅ Separate limits working: user1={user1_allowed}/{max_requests}, user2={user2_allowed}/{max_requests}"
                )
                logger.info("✅ Different identifiers test PASSED")
            else:
                self.test_results["different_identifiers"]["details"] = (
                    f"❌ Separate limits failed: user1={user1_allowed}/{max_requests}, user2={user2_allowed}/{max_requests}"
                )
                logger.error("❌ Different identifiers test FAILED")
                
        except Exception as e:
            self.test_results["different_identifiers"]["details"] = f"❌ Test error: {str(e)}"
            logger.error(f"❌ Different identifiers test error: {e}")

    async def test_rate_limit_middleware(self):
        """Test the rate limit middleware function"""
        logger.info("🧪 Testing rate limit middleware...")
        
        try:
            # Mock request object
            mock_request = Mock()
            mock_request.client.host = "127.0.0.1"
            mock_request.headers = {}
            
            # Test with a strict limit
            endpoint_key = "test_middleware"
            
            # Temporarily add a test configuration
            original_config = RATE_LIMITS.get(endpoint_key)
            RATE_LIMITS[endpoint_key] = {"max_requests": 2, "window_seconds": 60, "burst_limit": 1}
            
            try:
                results = []
                
                # Make requests through middleware
                for i in range(4):  # Try 4 requests with limit of 2
                    try:
                        await rate_limit_middleware(mock_request, endpoint_key, "test_user")
                        results.append({"request": i + 1, "allowed": True})
                        logger.info(f"Middleware request {i + 1}: allowed")
                    except Exception as e:
                        if "429" in str(e) or "rate limit" in str(e).lower():
                            results.append({"request": i + 1, "allowed": False, "error": str(e)})
                            logger.info(f"Middleware request {i + 1}: blocked - {e}")
                        else:
                            raise e
                
                allowed_count = sum(1 for r in results if r["allowed"])
                blocked_count = sum(1 for r in results if not r["allowed"])
                
                if allowed_count <= 2 and blocked_count >= 1:
                    self.test_results["rate_limit_middleware"]["passed"] = True
                    self.test_results["rate_limit_middleware"]["details"] = (
                        f"✅ Middleware working: {allowed_count} allowed, {blocked_count} blocked"
                    )
                    logger.info("✅ Rate limit middleware test PASSED")
                else:
                    self.test_results["rate_limit_middleware"]["details"] = (
                        f"❌ Middleware failed: {allowed_count} allowed, {blocked_count} blocked"
                    )
                    logger.error("❌ Rate limit middleware test FAILED")
                    
            finally:
                # Restore original configuration
                if original_config:
                    RATE_LIMITS[endpoint_key] = original_config
                else:
                    RATE_LIMITS.pop(endpoint_key, None)
                    
        except Exception as e:
            self.test_results["rate_limit_middleware"]["details"] = f"❌ Test error: {str(e)}"
            logger.error(f"❌ Rate limit middleware test error: {e}")

    async def run_all_tests(self):
        """Run all direct rate limiting tests"""
        logger.info("🚀 Starting direct rate limiting service tests...")
        
        await self.test_memory_store_basic()
        await asyncio.sleep(0.5)
        
        await self.test_burst_limit()
        await asyncio.sleep(0.5)
        
        await self.test_different_identifiers()
        await asyncio.sleep(0.5)
        
        await self.test_rate_limit_middleware()

    def print_test_results(self):
        """Print comprehensive test results"""
        logger.info("\n" + "="*80)
        logger.info("🧪 DIRECT RATE LIMITING SERVICE TEST RESULTS")
        logger.info("="*80)
        
        passed_tests = 0
        total_tests = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result["passed"] else "❌ FAILED"
            logger.info(f"\n{test_name.upper().replace('_', ' ')}: {status}")
            logger.info(f"Details: {result['details']}")
            
            if result["passed"]:
                passed_tests += 1
        
        success_rate = (passed_tests / total_tests) * 100
        logger.info(f"\n" + "="*80)
        logger.info(f"📊 OVERALL RESULTS: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        if success_rate >= 75:
            logger.info("🎉 RATE LIMITING SERVICE IS WORKING CORRECTLY!")
        elif success_rate >= 50:
            logger.info("⚠️ RATE LIMITING PARTIALLY WORKING - NEEDS ATTENTION")
        else:
            logger.info("🚨 CRITICAL: RATE LIMITING SERVICE NEEDS IMMEDIATE FIXES")
        
        logger.info("="*80)

async def main():
    """Main test execution"""
    tester = DirectRateLimitTester()
    await tester.run_all_tests()
    tester.print_test_results()

if __name__ == "__main__":
    asyncio.run(main())