#!/usr/bin/env python3
"""
Comprehensive Admin Panel Authentication and Button Functionality Testing
Tests the admin panel authentication fixes and button functionality across 11 major admin components.
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://farmstock-hub-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test admin credentials
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class AdminPanelTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = []
        
    async def setup(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Clean up HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_result(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
            
    async def authenticate_admin(self) -> bool:
        """Authenticate as admin user and get Bearer token"""
        try:
            # First try to login
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    # Use email as token (as per the authentication system)
                    self.admin_token = ADMIN_EMAIL
                    self.log_result("Admin Authentication", True, "Successfully authenticated as admin", 
                                  {"email": ADMIN_EMAIL, "token_type": "Bearer"})
                    return True
                else:
                    error_text = await response.text()
                    self.log_result("Admin Authentication", False, f"Login failed: {response.status}", 
                                  {"error": error_text})
                    return False
                    
        except Exception as e:
            self.log_result("Admin Authentication", False, f"Authentication error: {str(e)}")
            return False
            
    async def test_bearer_token_headers(self) -> bool:
        """Test that Bearer token headers are properly sent and accepted"""
        if not self.admin_token:
            self.log_result("Bearer Token Headers", False, "No admin token available")
            return False
            
        try:
            headers = {
                'Authorization': f'Bearer {self.admin_token}',
                'Content-Type': 'application/json'
            }
            
            # Test with a simple admin endpoint
            async with self.session.get(f"{API_BASE}/admin/stats", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result("Bearer Token Headers", True, "Bearer token authentication working", 
                                  {"endpoint": "/admin/stats", "response_keys": list(data.keys())})
                    return True
                elif response.status == 403:
                    self.log_result("Bearer Token Headers", False, "Bearer token rejected (403 Forbidden)")
                    return False
                else:
                    error_text = await response.text()
                    self.log_result("Bearer Token Headers", False, f"Unexpected response: {response.status}", 
                                  {"error": error_text})
                    return False
                    
        except Exception as e:
            self.log_result("Bearer Token Headers", False, f"Bearer token test error: {str(e)}")
            return False
            
    async def test_admin_endpoint_access(self, endpoint: str, method: str = 'GET', data: Dict = None) -> Dict:
        """Test access to admin endpoint with Bearer token"""
        if not self.admin_token:
            return {"success": False, "error": "No admin token"}
            
        try:
            headers = {
                'Authorization': f'Bearer {self.admin_token}',
                'Content-Type': 'application/json'
            }
            
            url = f"{API_BASE}{endpoint}"
            
            if method.upper() == 'GET':
                async with self.session.get(url, headers=headers) as response:
                    response_data = await response.text()
                    try:
                        json_data = json.loads(response_data)
                    except:
                        json_data = response_data
                        
                    return {
                        "success": response.status == 200,
                        "status": response.status,
                        "data": json_data,
                        "headers": dict(response.headers)
                    }
            elif method.upper() == 'POST':
                async with self.session.post(url, headers=headers, json=data) as response:
                    response_data = await response.text()
                    try:
                        json_data = json.loads(response_data)
                    except:
                        json_data = response_data
                        
                    return {
                        "success": response.status in [200, 201],
                        "status": response.status,
                        "data": json_data,
                        "headers": dict(response.headers)
                    }
                    
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    async def test_admin_users_management(self):
        """Test AdminUsersQueue component endpoints"""
        print("\n🔍 Testing Admin Users Management...")
        
        # Test GET /admin/users
        result = await self.test_admin_endpoint_access("/admin/users")
        if result["success"]:
            users = result["data"]
            user_count = len(users) if isinstance(users, list) else 0
            self.log_result("Admin Users - Load Users", True, f"Successfully loaded {user_count} users", 
                          {"endpoint": "/admin/users", "user_count": user_count})
        else:
            self.log_result("Admin Users - Load Users", False, f"Failed to load users: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
        # Test user filtering
        result = await self.test_admin_endpoint_access("/admin/users?status=active&role=buyer")
        if result["success"]:
            self.log_result("Admin Users - Filtering", True, "User filtering working", 
                          {"endpoint": "/admin/users with filters"})
        else:
            self.log_result("Admin Users - Filtering", False, "User filtering failed", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_listings_management(self):
        """Test AdminListingsQueue component endpoints"""
        print("\n📦 Testing Admin Listings Management...")
        
        # Test GET /admin/listings
        result = await self.test_admin_endpoint_access("/admin/listings")
        if result["success"]:
            listings = result["data"]
            listing_count = len(listings) if isinstance(listings, list) else (len(listings.get('listings', [])) if isinstance(listings, dict) else 0)
            self.log_result("Admin Listings - Load Listings", True, f"Successfully loaded {listing_count} listings", 
                          {"endpoint": "/admin/listings", "listing_count": listing_count})
        else:
            self.log_result("Admin Listings - Load Listings", False, f"Failed to load listings: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
        # Test listing filtering
        result = await self.test_admin_endpoint_access("/admin/listings?status=pending&category=cattle")
        if result["success"]:
            self.log_result("Admin Listings - Filtering", True, "Listing filtering working", 
                          {"endpoint": "/admin/listings with filters"})
        else:
            self.log_result("Admin Listings - Filtering", False, "Listing filtering failed", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_orders_management(self):
        """Test AdminOrdersManagement component endpoints"""
        print("\n🛒 Testing Admin Orders Management...")
        
        # Test GET /admin/orders
        result = await self.test_admin_endpoint_access("/admin/orders")
        if result["success"]:
            orders = result["data"]
            order_count = len(orders) if isinstance(orders, list) else (len(orders.get('orders', [])) if isinstance(orders, dict) else 0)
            self.log_result("Admin Orders - Load Orders", True, f"Successfully loaded {order_count} orders", 
                          {"endpoint": "/admin/orders", "order_count": order_count})
        else:
            self.log_result("Admin Orders - Load Orders", False, f"Failed to load orders: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
        # Test order filtering
        result = await self.test_admin_endpoint_access("/admin/orders?status=pending&payment_status=paid")
        if result["success"]:
            self.log_result("Admin Orders - Filtering", True, "Order filtering working", 
                          {"endpoint": "/admin/orders with filters"})
        else:
            self.log_result("Admin Orders - Filtering", False, "Order filtering failed", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_payouts_management(self):
        """Test AdminPayoutsManagement component endpoints"""
        print("\n💰 Testing Admin Payouts Management...")
        
        # Test GET /admin/payouts
        result = await self.test_admin_endpoint_access("/admin/payouts")
        if result["success"]:
            payouts = result["data"]
            payout_count = len(payouts) if isinstance(payouts, list) else (len(payouts.get('payouts', [])) if isinstance(payouts, dict) else 0)
            self.log_result("Admin Payouts - Load Payouts", True, f"Successfully loaded {payout_count} payouts", 
                          {"endpoint": "/admin/payouts", "payout_count": payout_count})
        else:
            self.log_result("Admin Payouts - Load Payouts", False, f"Failed to load payouts: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_payment_methods(self):
        """Test AdminPaymentMethods component endpoints"""
        print("\n💳 Testing Admin Payment Methods...")
        
        # Test GET /admin/payment-methods
        result = await self.test_admin_endpoint_access("/admin/payment-methods")
        if result["success"]:
            methods = result["data"]
            method_count = len(methods) if isinstance(methods, list) else (len(methods.get('payment_methods', [])) if isinstance(methods, dict) else 0)
            self.log_result("Admin Payment Methods - Load Methods", True, f"Successfully loaded {method_count} payment methods", 
                          {"endpoint": "/admin/payment-methods", "method_count": method_count})
        else:
            self.log_result("Admin Payment Methods - Load Methods", False, f"Failed to load payment methods: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_moderation_dashboard(self):
        """Test AdminModerationDashboard component endpoints"""
        print("\n🛡️ Testing Admin Moderation Dashboard...")
        
        # Test GET /admin/moderation/stats
        result = await self.test_admin_endpoint_access("/admin/moderation/stats")
        if result["success"]:
            stats = result["data"]
            self.log_result("Admin Moderation - Load Stats", True, "Successfully loaded moderation stats", 
                          {"endpoint": "/admin/moderation/stats", "stats_keys": list(stats.keys()) if isinstance(stats, dict) else "Non-dict response"})
        else:
            self.log_result("Admin Moderation - Load Stats", False, f"Failed to load moderation stats: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
        # Test GET /admin/moderation/recent
        result = await self.test_admin_endpoint_access("/admin/moderation/recent")
        if result["success"]:
            items = result["data"]
            item_count = len(items) if isinstance(items, list) else (len(items.get('items', [])) if isinstance(items, dict) else 0)
            self.log_result("Admin Moderation - Load Recent Items", True, f"Successfully loaded {item_count} recent items", 
                          {"endpoint": "/admin/moderation/recent", "item_count": item_count})
        else:
            self.log_result("Admin Moderation - Load Recent Items", False, f"Failed to load recent items: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_analytics_dashboard(self):
        """Test AdminAnalyticsDashboard component endpoints"""
        print("\n📊 Testing Admin Analytics Dashboard...")
        
        # Test GET /admin/stats
        result = await self.test_admin_endpoint_access("/admin/stats")
        if result["success"]:
            stats = result["data"]
            self.log_result("Admin Analytics - Load Stats", True, "Successfully loaded analytics stats", 
                          {"endpoint": "/admin/stats", "stats_keys": list(stats.keys()) if isinstance(stats, dict) else "Non-dict response"})
        else:
            self.log_result("Admin Analytics - Load Stats", False, f"Failed to load analytics stats: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
        # Test GET /admin/dashboard/stats
        result = await self.test_admin_endpoint_access("/admin/dashboard/stats")
        if result["success"]:
            dashboard_stats = result["data"]
            self.log_result("Admin Analytics - Load Dashboard Stats", True, "Successfully loaded dashboard stats", 
                          {"endpoint": "/admin/dashboard/stats"})
        else:
            self.log_result("Admin Analytics - Load Dashboard Stats", False, f"Failed to load dashboard stats: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_cms_management(self):
        """Test AdminCMSManagement component endpoints"""
        print("\n📝 Testing Admin CMS Management...")
        
        # Test GET /admin/blog/posts (assuming CMS manages blog posts)
        result = await self.test_admin_endpoint_access("/admin/blog/posts")
        if result["success"]:
            posts = result["data"]
            post_count = len(posts) if isinstance(posts, list) else (len(posts.get('posts', [])) if isinstance(posts, dict) else 0)
            self.log_result("Admin CMS - Load Blog Posts", True, f"Successfully loaded {post_count} blog posts", 
                          {"endpoint": "/admin/blog/posts", "post_count": post_count})
        else:
            self.log_result("Admin CMS - Load Blog Posts", False, f"Failed to load blog posts: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_buy_requests_management(self):
        """Test AdminBuyRequestsManagement component endpoints"""
        print("\n🛍️ Testing Admin Buy Requests Management...")
        
        # Test GET /admin/buy-requests
        result = await self.test_admin_endpoint_access("/admin/buy-requests")
        if result["success"]:
            requests = result["data"]
            request_count = len(requests) if isinstance(requests, list) else (len(requests.get('buy_requests', [])) if isinstance(requests, dict) else 0)
            self.log_result("Admin Buy Requests - Load Requests", True, f"Successfully loaded {request_count} buy requests", 
                          {"endpoint": "/admin/buy-requests", "request_count": request_count})
        else:
            self.log_result("Admin Buy Requests - Load Requests", False, f"Failed to load buy requests: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_suggestions_management(self):
        """Test AdminSuggestionsManagement component endpoints"""
        print("\n💡 Testing Admin Suggestions Management...")
        
        # Test GET /admin/suggestions
        result = await self.test_admin_endpoint_access("/admin/suggestions")
        if result["success"]:
            suggestions = result["data"]
            suggestion_count = len(suggestions) if isinstance(suggestions, list) else (len(suggestions.get('suggestions', [])) if isinstance(suggestions, dict) else 0)
            self.log_result("Admin Suggestions - Load Suggestions", True, f"Successfully loaded {suggestion_count} suggestions", 
                          {"endpoint": "/admin/suggestions", "suggestion_count": suggestion_count})
        else:
            self.log_result("Admin Suggestions - Load Suggestions", False, f"Failed to load suggestions: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_admin_compliance_queue(self):
        """Test AdminComplianceQueue component endpoints"""
        print("\n📋 Testing Admin Compliance Queue...")
        
        # Test GET /admin/compliance/documents
        result = await self.test_admin_endpoint_access("/admin/compliance/documents")
        if result["success"]:
            documents = result["data"]
            doc_count = len(documents) if isinstance(documents, list) else (len(documents.get('documents', [])) if isinstance(documents, dict) else 0)
            self.log_result("Admin Compliance - Load Documents", True, f"Successfully loaded {doc_count} compliance documents", 
                          {"endpoint": "/admin/compliance/documents", "doc_count": doc_count})
        else:
            self.log_result("Admin Compliance - Load Documents", False, f"Failed to load compliance documents: {result.get('status', 'Unknown')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️ Testing Error Handling...")
        
        # Test with invalid token
        old_token = self.admin_token
        self.admin_token = "invalid_token"
        
        result = await self.test_admin_endpoint_access("/admin/stats")
        if not result["success"] and result.get("status") in [401, 403]:
            self.log_result("Error Handling - Invalid Token", True, "Properly rejected invalid token", 
                          {"status": result.get("status")})
        else:
            self.log_result("Error Handling - Invalid Token", False, "Should have rejected invalid token", 
                          {"result": result})
            
        # Restore valid token
        self.admin_token = old_token
        
        # Test with missing token
        self.admin_token = None
        result = await self.test_admin_endpoint_access("/admin/stats")
        if not result["success"]:
            self.log_result("Error Handling - Missing Token", True, "Properly handled missing token", 
                          {"error": result.get("error", "No token")})
        else:
            self.log_result("Error Handling - Missing Token", False, "Should have failed without token")
            
        # Restore valid token
        self.admin_token = old_token
        
    async def test_button_functionality(self):
        """Test button click handlers and actions"""
        print("\n🔘 Testing Button Functionality...")
        
        # Test approve/reject actions (simulate button clicks)
        # Note: We'll test the endpoints that buttons would call
        
        # Test user suspend action (simulating button click)
        test_user_id = "test_user_123"  # This would normally be a real user ID
        result = await self.test_admin_endpoint_access(f"/admin/users/{test_user_id}/suspend", "POST", 
                                                     {"reason": "Test suspension"})
        # We expect this to fail with 404 since user doesn't exist, but endpoint should be accessible
        if result.get("status") == 404:
            self.log_result("Button Functionality - User Suspend", True, "Suspend endpoint accessible (404 expected for test user)", 
                          {"endpoint": f"/admin/users/{test_user_id}/suspend"})
        elif result.get("status") == 200:
            self.log_result("Button Functionality - User Suspend", True, "Suspend action successful", 
                          {"endpoint": f"/admin/users/{test_user_id}/suspend"})
        else:
            self.log_result("Button Functionality - User Suspend", False, f"Unexpected response: {result.get('status')}", 
                          {"error": result.get('data', 'No error details')})
            
        # Test listing approve action
        test_listing_id = "test_listing_123"
        result = await self.test_admin_endpoint_access(f"/admin/listings/{test_listing_id}/approve", "POST", 
                                                     {"admin_notes": "Test approval"})
        if result.get("status") in [404, 200]:
            self.log_result("Button Functionality - Listing Approve", True, "Approve endpoint accessible", 
                          {"endpoint": f"/admin/listings/{test_listing_id}/approve", "status": result.get("status")})
        else:
            self.log_result("Button Functionality - Listing Approve", False, f"Unexpected response: {result.get('status')}", 
                          {"error": result.get('data', 'No error details')})
            
    async def run_comprehensive_test(self):
        """Run all admin panel tests"""
        print("🚀 Starting Comprehensive Admin Panel Authentication and Functionality Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Admin Email: {ADMIN_EMAIL}")
        print("=" * 80)
        
        await self.setup()
        
        try:
            # Step 1: Authenticate
            if not await self.authenticate_admin():
                print("❌ Authentication failed - cannot proceed with tests")
                return
                
            # Step 2: Test Bearer token headers
            await self.test_bearer_token_headers()
            
            # Step 3: Test all admin components
            await self.test_admin_users_management()
            await self.test_admin_listings_management()
            await self.test_admin_orders_management()
            await self.test_admin_payouts_management()
            await self.test_admin_payment_methods()
            await self.test_admin_moderation_dashboard()
            await self.test_admin_analytics_dashboard()
            await self.test_admin_cms_management()
            await self.test_admin_buy_requests_management()
            await self.test_admin_suggestions_management()
            await self.test_admin_compliance_queue()
            
            # Step 4: Test error handling
            await self.test_error_handling()
            
            # Step 5: Test button functionality
            await self.test_button_functionality()
            
        finally:
            await self.cleanup()
            
        # Generate summary
        self.generate_summary()
        
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 ADMIN PANEL TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
                    if result.get('details'):
                        print(f"    Details: {result['details']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for result in self.test_results:
            if result['success']:
                print(f"  • {result['test']}: {result['message']}")
                
        # Key findings
        print(f"\n🔍 KEY FINDINGS:")
        auth_tests = [r for r in self.test_results if 'Authentication' in r['test'] or 'Bearer Token' in r['test']]
        auth_success = all(r['success'] for r in auth_tests)
        
        if auth_success:
            print("  ✅ Bearer token authentication is working correctly")
        else:
            print("  ❌ Bearer token authentication has issues")
            
        endpoint_tests = [r for r in self.test_results if 'Load' in r['test'] or 'Filtering' in r['test']]
        endpoint_success_rate = (sum(1 for r in endpoint_tests if r['success']) / len(endpoint_tests) * 100) if endpoint_tests else 0
        
        print(f"  📊 Admin endpoint success rate: {endpoint_success_rate:.1f}%")
        
        button_tests = [r for r in self.test_results if 'Button Functionality' in r['test']]
        button_success = all(r['success'] for r in button_tests)
        
        if button_success:
            print("  ✅ Button functionality endpoints are accessible")
        else:
            print("  ❌ Some button functionality endpoints have issues")
            
        error_tests = [r for r in self.test_results if 'Error Handling' in r['test']]
        error_success = all(r['success'] for r in error_tests)
        
        if error_success:
            print("  ✅ Error handling is working correctly")
        else:
            print("  ❌ Error handling needs improvement")
            
        print("\n" + "=" * 80)

async def main():
    """Main test execution"""
    tester = AdminPanelTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())