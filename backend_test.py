#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FarmStockAPITester:
    def __init__(self, base_url="https://trustscores.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.org_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        if response_data is not None:
            print(f"   Response data: {json.dumps(response_data, indent=2)[:200]}...")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def test_api_endpoint(self, method, endpoint, expected_status=200, data=None, description=""):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        test_name = f"{method} {endpoint}" + (f" ({description})" if description else "")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}

            if success:
                self.log_result(test_name, True, f"Status: {response.status_code}", response_data)
                return True, response_data
            else:
                self.log_result(test_name, False, f"Expected {expected_status}, got {response.status_code}", response_data)
                return False, response_data

        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n🔍 Testing Basic API Connectivity...")
        
        # Test root endpoint (might not exist, but tests connectivity)
        try:
            response = requests.get(self.base_url.replace('/api', ''), timeout=5)
            print(f"   Base URL connectivity: {response.status_code}")
        except Exception as e:
            print(f"   Base URL connectivity failed: {e}")

    def test_species_endpoint(self):
        """Test species endpoint"""
        print("\n🔍 Testing Species Endpoint...")
        success, data = self.test_api_endpoint('GET', '/species', description="Get all species")
        
        if success and isinstance(data, list):
            print(f"   Found {len(data)} species")
            for species in data[:3]:  # Show first 3
                print(f"   - {species.get('name', 'Unknown')} (ID: {species.get('id', 'N/A')})")
            return data
        return []

    def test_product_types_endpoint(self):
        """Test product types endpoint"""
        print("\n🔍 Testing Product Types Endpoint...")
        success, data = self.test_api_endpoint('GET', '/product-types', description="Get all product types")
        
        if success and isinstance(data, list):
            print(f"   Found {len(data)} product types")
            for pt in data[:3]:  # Show first 3
                print(f"   - {pt.get('label', 'Unknown')} ({pt.get('code', 'N/A')})")
            return data
        return []

    def test_listings_endpoint(self):
        """Test listings endpoint with various filters"""
        print("\n🔍 Testing Listings Endpoint...")
        
        # Test basic listings
        success, data = self.test_api_endpoint('GET', '/listings', description="Get all listings")
        
        if success:
            if isinstance(data, list):
                print(f"   Found {len(data)} listings")
                if len(data) > 0:
                    for listing in data[:2]:  # Show first 2
                        print(f"   - {listing.get('title', 'Unknown')} - R{listing.get('price_per_unit', 0)} per {listing.get('unit', 'unit')}")
                        print(f"     Species ID: {listing.get('species_id', 'N/A')}, Status: {listing.get('status', 'N/A')}")
                else:
                    print("   ⚠️  No listings found - this is the main issue!")
            else:
                print(f"   ⚠️  Unexpected response format: {type(data)}")
        
        return data if success else []

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication...")
        
        # Test registration with a unique email
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User",
            "phone": "+27123456789",
            "role": "seller"
        }
        
        success, data = self.test_api_endpoint('POST', '/auth/register', 200, register_data, "Register new user")
        
        if success:
            # Test login
            login_data = {
                "email": test_email,
                "password": "TestPass123!"
            }
            
            success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Login user")
            
            if success and 'access_token' in login_response:
                self.token = login_response['access_token']
                self.user_data = login_response.get('user', {})
                print(f"   Successfully authenticated as: {self.user_data.get('full_name', 'Unknown')}")
                return True
        
        return False

    def test_admin_login(self):
        """Test admin login"""
        print("\n🔍 Testing Admin Authentication...")
        
        login_data = {
            "email": "admin@stocklot.co.za",
            "password": "admin123"
        }
        
        success, login_response = self.test_api_endpoint('POST', '/auth/login', 200, login_data, "Admin login")
        
        if success and 'access_token' in login_response:
            admin_user = login_response.get('user', {})
            if 'admin' in admin_user.get('roles', []):
                print(f"   ✅ Admin authenticated successfully: {admin_user.get('full_name', 'Unknown')}")
                self.admin_token = login_response['access_token']  # Store admin token
                return True
            else:
                print(f"   ❌ User authenticated but not admin: {admin_user.get('roles', [])}")
        
        return False

    def test_admin_organization_management(self):
        """Test NEW admin organization management endpoints"""
        if not hasattr(self, 'admin_token') or not self.admin_token:
            print("\n⚠️  Skipping admin organization tests - no admin token")
            return False
            
        print("\n🔍 Testing NEW Admin Organization Management Endpoints...")
        
        # Store current token and switch to admin
        user_token = self.token
        self.token = self.admin_token
        
        try:
            # Test GET /api/admin/organizations (list all organizations)
            success, orgs_data = self.test_api_endpoint('GET', '/admin/organizations', 200, description="Admin: Get all organizations")
            
            if success and isinstance(orgs_data, list):
                print(f"   ✅ Found {len(orgs_data)} organizations in admin view")
                
                # If we have organizations, test detailed view and management
                if len(orgs_data) > 0 and self.org_id:
                    # Test GET /api/admin/organizations/{id} (detailed org info)
                    success, org_details = self.test_api_endpoint('GET', f'/admin/organizations/{self.org_id}', 200, 
                                                                description="Admin: Get organization details")
                    
                    if success:
                        org_info = org_details.get('organization', {})
                        print(f"   ✅ Got detailed info for org: {org_info.get('name', 'Unknown')}")
                        
                        # Test POST /api/admin/organizations/{id}/verify-kyc (update KYC)
                        kyc_data = {
                            "status": "VERIFIED",
                            "level": 1,
                            "notes": "Test KYC verification by admin"
                        }
                        success, _ = self.test_api_endpoint('POST', f'/admin/organizations/{self.org_id}/verify-kyc', 200, 
                                                         kyc_data, "Admin: Verify organization KYC")
                        
                        # Test POST /api/admin/organizations/{id}/suspend (suspend org)
                        success, _ = self.test_api_endpoint('POST', f'/admin/organizations/{self.org_id}/suspend', 200, 
                                                         {}, "Admin: Suspend organization")
                        
                        if success:
                            print("   ✅ Organization suspended successfully")
            
        finally:
            # Restore user token
            self.token = user_token
        
        return True

    def test_enhanced_authentication(self):
        """Test NEW enhanced authentication endpoints"""
        print("\n🔍 Testing NEW Enhanced Authentication Endpoints...")
        
        # Test enhanced registration
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_email = f"enhanced_user_{timestamp}@example.com"
        
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Enhanced Test User",
            "phone": "+27123456789",
            "role": "buyer"
        }
        
        success, data = self.test_api_endpoint('POST', '/auth/register-enhanced', 201, register_data, "Enhanced Registration")
        
        if success:
            # Test enhanced login
            login_data = {
                "email": test_email,
                "password": "TestPass123!"
            }
            
            success, login_response = self.test_api_endpoint('POST', '/auth/login-enhanced', 200, login_data, "Enhanced Login")
            
            if success and 'access_token' in login_response:
                enhanced_token = login_response['access_token']
                enhanced_user = login_response.get('user', {})
                print(f"   ✅ Enhanced auth successful: {enhanced_user.get('full_name', 'Unknown')}")
                return True, enhanced_token
        
        return False, None

    def test_legal_pages_system(self):
        """Test NEW legal pages system - FOCUS ON REVIEW REQUEST"""
        print("\n🔍 Testing NEW Legal Pages System...")
        
        # Test Terms of Service endpoint
        success, data = self.test_api_endpoint('GET', '/legal/terms', 200, description="Get Terms of Service for /terms page")
        
        if success:
            terms_content = data.get('content', '') if isinstance(data, dict) else str(data)
            print(f"   ✅ Terms of Service loaded - Content length: {len(terms_content)} chars")
            
            # Check if it's comprehensive livestock marketplace terms
            if 'livestock' in terms_content.lower() and 'marketplace' in terms_content.lower():
                print("   ✅ Terms contain livestock marketplace specific content")
            else:
                print("   ⚠️  Terms may not be livestock marketplace specific")
        
        # Test Privacy Policy endpoint  
        success2, data2 = self.test_api_endpoint('GET', '/legal/privacy', 200, description="Get Privacy Policy for /privacy page")
        
        if success2:
            privacy_content = data2.get('content', '') if isinstance(data2, dict) else str(data2)
            print(f"   ✅ Privacy Policy loaded - Content length: {len(privacy_content)} chars")
            
            # Check if it's POPIA compliant
            if 'popia' in privacy_content.lower() or 'protection of personal information' in privacy_content.lower():
                print("   ✅ Privacy Policy appears to be POPIA compliant")
            else:
                print("   ⚠️  Privacy Policy may not be POPIA compliant")
        
        return success and success2

    def test_suggestions_system(self):
        """Test NEW suggestions system - FOCUS ON FOOTER BUTTON"""
        print("\n🔍 Testing NEW Suggestions System (Footer Button)...")
        
        # Test creating different types of suggestions
        suggestion_types = [
            {
                "title": "Test Animal Category Suggestion",
                "description": "Add support for exotic animals like ostriches",
                "kind": "ANIMAL",
                "priority": "MEDIUM"
            },
            {
                "title": "Test Feature Suggestion", 
                "description": "Add mobile app for better user experience",
                "kind": "FEATURE",
                "priority": "HIGH"
            },
            {
                "title": "Test Bug Report",
                "description": "Search function not working properly on mobile",
                "kind": "BUG", 
                "priority": "HIGH"
            }
        ]
        
        success_count = 0
        for suggestion_data in suggestion_types:
            success, response = self.test_api_endpoint('POST', '/suggestions', 201, suggestion_data, 
                                                    f"Create {suggestion_data['kind']} suggestion")
            if success:
                success_count += 1
        
        # Test getting suggestions (admin)
        if hasattr(self, 'admin_token') and self.admin_token:
            old_token = self.token
            self.token = self.admin_token
            
            try:
                success, data = self.test_api_endpoint('GET', '/suggestions', 200, description="Admin: Get all suggestions")
                if success:
                    suggestions = data if isinstance(data, list) else []
                    print(f"   ✅ Admin can view {len(suggestions)} suggestions")
            finally:
                self.token = old_token
        
        return success_count > 0

    def test_blog_system(self):
        """Test NEW blog system endpoints - FOCUS ON REVIEW REQUEST FEATURES"""
        print("\n🔍 Testing NEW Blog System Endpoints...")
        
        # Test GET /api/blog/articles (public endpoint for blog list page)
        success, data = self.test_api_endpoint('GET', '/blog/articles', 200, description="Get blog articles for /blog page")
        
        if success:
            articles = data if isinstance(data, list) else []
            print(f"   ✅ Found {len(articles)} blog articles for /blog page")
            
            # Test admin blog creation endpoints if we have admin token
            if hasattr(self, 'admin_token') and self.admin_token:
                user_token = self.token
                self.token = self.admin_token
                
                try:
                    # Test blog creation endpoint for /admin/blog/create
                    blog_data = {
                        "title": "Test Blog Article - StockLot Marketplace",
                        "content": "# Test Article\n\nThis is a **test blog article** with markdown formatting for the StockLot livestock marketplace.\n\n## Features\n- Rich text editing\n- Image uploads\n- SEO settings",
                        "excerpt": "Test blog article for StockLot marketplace testing",
                        "tags": ["livestock", "marketplace", "test"],
                        "status": "published",
                        "seo_title": "Test Blog Article - StockLot Livestock Marketplace",
                        "seo_description": "A comprehensive test blog article for the StockLot livestock marketplace platform"
                    }
                    
                    success, response = self.test_api_endpoint('POST', '/blog/articles', 201, blog_data, "Admin: Create blog article")
                    
                    if success:
                        print("   ✅ Admin blog article creation successful")
                        article_id = response.get('id')
                        
                        if article_id:
                            # Test getting single article
                            self.test_api_endpoint('GET', f'/blog/articles/{article_id}', 200, description="Get single blog article")
                            
                            # Test updating article
                            update_data = {
                                "title": "Updated Test Blog Article",
                                "content": blog_data["content"] + "\n\n## Updated Content\nThis article has been updated."
                            }
                            self.test_api_endpoint('PUT', f'/blog/articles/{article_id}', 200, update_data, "Update blog article")
                        
                        return True
                        
                finally:
                    self.token = user_token
            else:
                print("   ⚠️  Skipping admin blog creation - no admin token")
                return True  # Still consider success if public endpoint works
        
        return False

    def test_referral_system(self):
        """Test NEW referral system endpoints - FOCUS ON STABILITY"""
        if not self.token:
            print("\n⚠️  Skipping referral tests - no authentication token")
            return False
            
        print("\n🔍 Testing NEW Referral System (Stability Focus)...")
        
        # Test GET /api/referrals/dashboard - main endpoint for /referrals page
        success, data = self.test_api_endpoint('GET', '/referrals/dashboard', 200, description="Get referral dashboard for /referrals page")
        
        if success:
            dashboard_data = data
            print(f"   ✅ Referral dashboard loaded successfully")
            
            # Check for key stability indicators
            if 'referral_code' in dashboard_data:
                print(f"   ✅ Referral code present: {dashboard_data.get('referral_code')}")
            
            if 'stats' in dashboard_data:
                stats = dashboard_data['stats']
                print(f"   ✅ Stats loaded - Clicks: {stats.get('total_clicks', 0)}, Signups: {stats.get('total_signups', 0)}")
            
            if 'wallet' in dashboard_data:
                wallet = dashboard_data['wallet']
                print(f"   ✅ Wallet data loaded - Balance: R{wallet.get('balance', 0)}")
        
        # Test individual endpoints for stability
        endpoints_to_test = [
            ('/referrals/my-code', 'Get referral code'),
            ('/referrals/stats', 'Get referral stats'), 
            ('/referrals/wallet', 'Get wallet balance'),
            ('/referrals/history', 'Get referral history')
        ]
        
        stable_endpoints = 0
        for endpoint, description in endpoints_to_test:
            success, _ = self.test_api_endpoint('GET', endpoint, 200, description=description)
            if success:
                stable_endpoints += 1
        
        print(f"   📊 Referral system stability: {stable_endpoints}/{len(endpoints_to_test)} endpoints working")
        
        # Test generating new referral code
        success, _ = self.test_api_endpoint('POST', '/referrals/generate-code', 201, 
                                          {"campaign": "stability_test"}, "Generate new referral code")
        
        return success and stable_endpoints >= 3  # At least 3/4 endpoints should work

    def test_buy_now_listings_fix(self):
        """Test that listings have listing_type field for Buy Now functionality"""
        print("\n🔍 Testing Buy Now Listings Fix (listing_type field)...")
        
        success, data = self.test_api_endpoint('GET', '/listings', 200, description="Check listings for listing_type field")
        
        if success:
            listings = data if isinstance(data, list) else []
            buy_now_listings = [l for l in listings if l.get('listing_type') == 'buy_now']
            
            if buy_now_listings:
                print(f"   ✅ Found {len(buy_now_listings)} buy_now listings out of {len(listings)} total")
                print("   ✅ Buy Now functionality should work - listing_type field present")
                return True
            else:
                print(f"   ❌ No buy_now listings found in {len(listings)} listings")
                print("   ❌ Guest checkout may not work - missing listing_type field")
                return False
        
        return False

    def test_create_listing(self, species_data, product_types_data):
        """Test creating a new listing"""
        if not self.token:
            print("\n⚠️  Skipping listing creation - no authentication token")
            return False
            
        print("\n🔍 Testing Listing Creation...")
        
        # Find chicken species and day-old product type
        chicken_species = next((s for s in species_data if 'chicken' in s.get('name', '').lower()), None)
        day_old_pt = next((pt for pt in product_types_data if pt.get('code') == 'DAY_OLD'), None)
        
        if not chicken_species or not day_old_pt:
            print("   ⚠️  Cannot create test listing - missing species or product type data")
            return False
        
        listing_data = {
            "species_id": chicken_species['id'],
            "product_type_id": day_old_pt['id'],
            "title": "Test Chickens - API Test",
            "description": "Test listing created by API test",
            "quantity": 10,
            "unit": "head",
            "price_per_unit": 25.00,
            "fulfillment": "delivery_only",
            "delivery_available": False,
            "has_vet_certificate": False,
            "region": "Test Region",
            "city": "Test City"
        }
        
        success, data = self.test_api_endpoint('POST', '/listings', 200, listing_data, "Create test listing")
        return success

    def test_organization_endpoints(self):
        """Test organization-specific endpoints - FOCUS ON FIXED ENDPOINTS"""
        if not self.token:
            print("\n⚠️  Skipping organization tests - no authentication token")
            return False
            
        print("\n🔍 Testing Organization Endpoints (FIXED ENDPOINTS)...")
        
        # Test organization creation
        timestamp = datetime.now().strftime('%H%M%S')
        org_data = {
            "name": f"Test Farm {timestamp}",
            "kind": "FARM",
            "handle": f"test-farm-{timestamp}",
            "phone": "+27123456789",
            "email": f"test-farm-{timestamp}@example.com",
            "website": "https://test-farm.com"
        }
        
        success, response = self.test_api_endpoint('POST', '/orgs', 200, org_data, "Create organization")
        
        if success and 'id' in response:
            self.org_id = response['id']
            org_handle = response.get('handle')
            print(f"   ✅ Created organization with ID: {self.org_id}, Handle: {org_handle}")
            
            # CRITICAL TEST: Test the FIXED GET /api/orgs/{identifier} endpoint
            print("\n   🎯 TESTING FIXED ORGANIZATION RETRIEVAL ENDPOINTS:")
            
            # Test getting organization by ID (this was returning 500 before)
            success_id, _ = self.test_api_endpoint('GET', f'/orgs/{self.org_id}', 200, description="Get organization by ID (FIXED)")
            
            # Test getting organization by handle (this was returning 500 before)
            if org_handle:
                success_handle, _ = self.test_api_endpoint('GET', f'/orgs/{org_handle}', 200, description="Get organization by handle (FIXED)")
            
            # Test non-existent organization (should return 404)
            self.test_api_endpoint('GET', f'/orgs/non-existent-org-id', 404, description="Get non-existent org (404 expected)")
            
            # Test getting organization members
            self.test_api_endpoint('GET', f'/orgs/{self.org_id}/members', 200, description="Get organization members")
            
            # Test inviting member (will fail as user doesn't exist)
            invite_data = {"email": "nonexistent@example.com", "role": "STAFF"}
            self.test_api_endpoint('POST', f'/orgs/{self.org_id}/invite', 404, invite_data, "Invite member (expected fail)")
        
        # Test context switching
        self.test_api_endpoint('GET', '/orgs/my-contexts', 200, description="Get my contexts")
        
        if self.org_id:
            switch_data = {"target": self.org_id}
            self.test_api_endpoint('POST', '/orgs/switch', 200, switch_data, "Switch to org context")
            
            switch_data = {"target": "user"}
            self.test_api_endpoint('POST', '/orgs/switch', 200, switch_data, "Switch to user context")
        
        return success

    def test_organization_listing_creation(self, species_data, product_types_data):
        """Test creating listings with organization context"""
        if not self.token or not self.org_id:
            print("\n⚠️  Skipping org listing creation - no auth token or org ID")
            return False
            
        print("\n🔍 Testing Organization Listing Creation...")
        
        # Find chicken species and day-old product type
        chicken_species = next((s for s in species_data if 'chicken' in s.get('name', '').lower()), None)
        day_old_pt = next((pt for pt in product_types_data if pt.get('code') == 'DAY_OLD'), None)
        
        if not chicken_species or not day_old_pt:
            print("   ⚠️  Cannot create test listing - missing species or product type data")
            return False
        
        listing_data = {
            "species_id": chicken_species['id'],
            "product_type_id": day_old_pt['id'],
            "title": "Test Org Chickens - API Test",
            "description": "Test listing created by organization",
            "quantity": 20,
            "unit": "head",
            "price_per_unit": 30.00,
            "fulfillment": "delivery_only",
            "delivery_available": False,
            "has_vet_certificate": False,
            "region": "Test Region",
            "city": "Test City"
        }
        
        # Test creating listing with organization context header
        headers = {"X-Org-Context": self.org_id}
        url = f"{self.base_url}/listings"
        auth_headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.token}'}
        auth_headers.update(headers)
        
        try:
            response = requests.post(url, json=listing_data, headers=auth_headers, timeout=10)
            success = response.status_code == 200
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text[:500]}
            
            test_name = "Create organization listing with X-Org-Context header"
            if success:
                self.log_result(test_name, True, f"Status: {response.status_code}", response_data)
                return True
            else:
                self.log_result(test_name, False, f"Expected 200, got {response.status_code}", response_data)
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_result("Create organization listing", False, f"Request failed: {str(e)}")
            return False

    def test_reviews_ratings_system(self):
        """Test Reviews & Ratings System (Duo Reviews) - COMPREHENSIVE TESTING"""
        if not self.token:
            print("\n⚠️  Skipping reviews tests - no authentication token")
            return False
            
        print("\n🌟 Testing Reviews & Ratings System (Duo Reviews)...")
        
        # Store original token for later restoration
        original_token = self.token
        
        try:
            # Test 1: Review Creation - Test both directions
            print("\n   🔍 Testing Review Creation...")
            
            # Create test order group data for testing (simulate completed order)
            test_order_group_id = f"test_order_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Test BUYER_ON_SELLER review creation
            buyer_review_data = {
                "order_group_id": test_order_group_id,
                "direction": "BUYER_ON_SELLER",
                "rating": 5,
                "title": "Excellent livestock quality!",
                "body": "The cattle were in perfect condition, exactly as described. Great seller!",
                "tags": ["quality", "professional", "timely"]
            }
            
            success, response = self.test_api_endpoint('POST', '/reviews', 201, buyer_review_data, 
                                                    "Create BUYER_ON_SELLER review")
            buyer_review_id = response.get('review_id') if success else None
            
            # Test SELLER_ON_BUYER review creation
            seller_review_data = {
                "order_group_id": test_order_group_id,
                "direction": "SELLER_ON_BUYER", 
                "rating": 4,
                "title": "Reliable buyer",
                "body": "Payment was prompt and communication was clear throughout.",
                "tags": ["reliable", "prompt_payment"]
            }
            
            success2, response2 = self.test_api_endpoint('POST', '/reviews', 201, seller_review_data,
                                                      "Create SELLER_ON_BUYER review")
            seller_review_id = response2.get('review_id') if success2 else None
            
            # Test 2: Review CRUD Operations
            print("\n   🔍 Testing Review CRUD Operations...")
            
            if buyer_review_id:
                # Test PATCH /api/reviews/{id} - Update review
                update_data = {
                    "rating": 4,
                    "title": "Updated: Very good livestock quality",
                    "body": "Updated review: The cattle were in very good condition. Minor delivery delay but overall satisfied."
                }
                self.test_api_endpoint('PATCH', f'/reviews/{buyer_review_id}', 200, update_data,
                                     "Update review within edit window")
                
                # Test DELETE /api/reviews/{id} - Delete review (will likely fail due to edit window)
                self.test_api_endpoint('DELETE', f'/reviews/{buyer_review_id}', 200, description="Delete review")
            
            # Test 3: Review Replies
            print("\n   🔍 Testing Review Replies...")
            
            if seller_review_id:
                reply_data = {
                    "body": "Thank you for the positive feedback! We appreciate working with professional buyers like you."
                }
                self.test_api_endpoint('POST', f'/reviews/{seller_review_id}/reply', 200, reply_data,
                                     "Add reply to review")
            
            # Test 4: Public Review Access
            print("\n   🔍 Testing Public Review Access...")
            
            # Get a test seller ID (use current user or create one)
            test_seller_id = self.user_data.get('id') if self.user_data else 'test_seller_123'
            
            # Test GET /api/public/sellers/{seller_id}/reviews with various parameters
            review_endpoints = [
                (f'/public/sellers/{test_seller_id}/reviews', 'Get seller reviews (default)'),
                (f'/public/sellers/{test_seller_id}/reviews?page=1&limit=10', 'Get seller reviews with pagination'),
                (f'/public/sellers/{test_seller_id}/reviews?sort=recent', 'Get seller reviews sorted by recent'),
                (f'/public/sellers/{test_seller_id}/reviews?sort=helpful', 'Get seller reviews sorted by helpful'),
                (f'/public/sellers/{test_seller_id}/reviews?sort=rating_high', 'Get seller reviews sorted by rating high'),
                (f'/public/sellers/{test_seller_id}/reviews?sort=rating_low', 'Get seller reviews sorted by rating low')
            ]
            
            for endpoint, description in review_endpoints:
                self.test_api_endpoint('GET', endpoint, 200, description=description)
            
            # Test 5: Buyer Reliability (Seller-only access)
            print("\n   🔍 Testing Buyer Reliability...")
            
            test_buyer_id = self.user_data.get('id') if self.user_data else 'test_buyer_123'
            self.test_api_endpoint('GET', f'/seller/buyers/{test_buyer_id}/summary', 200,
                                 description="Get buyer reliability summary (seller access)")
            
            # Test 6: Admin Moderation (if admin token available)
            print("\n   🔍 Testing Admin Moderation...")
            
            if hasattr(self, 'admin_token') and self.admin_token:
                # Switch to admin token
                self.token = self.admin_token
                
                try:
                    # Test admin review queue
                    self.test_api_endpoint('GET', '/admin/reviews', 200, description="Admin: Get review moderation queue")
                    
                    # Test admin review actions (if we have review IDs)
                    if buyer_review_id:
                        # Test approve review
                        approve_data = {"reason": "Review meets quality standards", "admin_notes": "Approved during testing"}
                        self.test_api_endpoint('POST', f'/admin/reviews/{buyer_review_id}/approve', 200, approve_data,
                                             "Admin: Approve review")
                        
                        # Test flag review
                        flag_data = {"reason": "Flagged for testing purposes", "admin_notes": "Test flag action"}
                        self.test_api_endpoint('POST', f'/admin/reviews/{buyer_review_id}/flag', 200, flag_data,
                                             "Admin: Flag review")
                        
                        # Test reject review
                        reject_data = {"reason": "Does not meet community standards", "admin_notes": "Test rejection"}
                        self.test_api_endpoint('POST', f'/admin/reviews/{buyer_review_id}/reject', 200, reject_data,
                                             "Admin: Reject review")
                    
                finally:
                    # Restore original token
                    self.token = original_token
            else:
                print("   ⚠️  Skipping admin moderation tests - no admin token")
            
            # Test 7: Rating Aggregates Recomputation
            print("\n   🔍 Testing Rating Aggregates...")
            
            if hasattr(self, 'admin_token') and self.admin_token:
                # Switch to admin token for recompute
                self.token = self.admin_token
                
                try:
                    self.test_api_endpoint('POST', '/admin/ratings/recompute', 200, {},
                                         "Admin: Recompute rating aggregates")
                finally:
                    self.token = original_token
            else:
                print("   ⚠️  Skipping rating recompute test - no admin token")
            
            # Test 8: Anti-Abuse Measures Testing
            print("\n   🔍 Testing Anti-Abuse Measures...")
            
            # Test duplicate review prevention
            duplicate_review_data = {
                "order_group_id": test_order_group_id,
                "direction": "BUYER_ON_SELLER",
                "rating": 3,
                "title": "Duplicate review attempt",
                "body": "This should be blocked as duplicate"
            }
            
            self.test_api_endpoint('POST', '/reviews', 400, duplicate_review_data,
                                 "Test duplicate review prevention (should fail)")
            
            # Test invalid order group
            invalid_review_data = {
                "order_group_id": "non_existent_order_123",
                "direction": "BUYER_ON_SELLER", 
                "rating": 5,
                "title": "Invalid order test",
                "body": "This should fail due to invalid order"
            }
            
            self.test_api_endpoint('POST', '/reviews', 400, invalid_review_data,
                                 "Test invalid order group (should fail)")
            
            # Test invalid rating values
            invalid_rating_data = {
                "order_group_id": test_order_group_id,
                "direction": "BUYER_ON_SELLER",
                "rating": 6,  # Invalid - should be 1-5
                "title": "Invalid rating test",
                "body": "This should fail due to invalid rating"
            }
            
            self.test_api_endpoint('POST', '/reviews', 422, invalid_rating_data,
                                 "Test invalid rating value (should fail)")
            
            print("\n   ✅ Reviews & Ratings System testing completed!")
            return True
            
        except Exception as e:
            print(f"\n   ❌ Error during reviews testing: {e}")
            return False
        
        finally:
            # Always restore original token
            self.token = original_token

    def run_comprehensive_test(self):
        """Run all tests including NEW features"""
        print("🚀 Starting StockLot API Comprehensive Test - REVIEWS & RATINGS FOCUS")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_basic_connectivity()
        
        # Test core endpoints
        species_data = self.test_species_endpoint()
        product_types_data = self.test_product_types_endpoint()
        listings_data = self.test_listings_endpoint()
        
        # Test NEW: Buy Now listings fix (critical for guest checkout)
        self.test_buy_now_listings_fix()
        
        # Test authentication
        auth_success = self.test_authentication()
        
        # Test NEW: Enhanced authentication endpoints
        enhanced_auth_success, enhanced_token = self.test_enhanced_authentication()
        
        # Test admin authentication
        admin_success = self.test_admin_login()
        
        # Test NEW SYSTEMS if authenticated - FOCUS ON REVIEW REQUEST FEATURES
        if auth_success or enhanced_auth_success:
            # Test NEW: Reviews & Ratings System (Duo Reviews) - MAIN FOCUS
            self.test_reviews_ratings_system()
            
            # Test NEW: Blog system (main focus)
            self.test_blog_system()
            
            # Test NEW: Legal pages system (main focus)
            self.test_legal_pages_system()
            
            # Test NEW: Suggestions system for footer button (main focus)
            self.test_suggestions_system()
            
            # Test NEW: Referral system stability (main focus)
            self.test_referral_system()
            
            # Test listing creation if authenticated
            self.test_create_listing(species_data, product_types_data)
            
            # Test organization endpoints (FIXED ENDPOINTS)
            org_success = self.test_organization_endpoints()
            
            # Test NEW admin organization management endpoints
            if admin_success:
                self.test_admin_organization_management()
            
            # Test organization listing creation
            self.test_organization_listing_creation(species_data, product_types_data)
            
            # Re-test listings after creation
            print("\n🔍 Re-testing Listings After Creation...")
            new_listings_data = self.test_listings_endpoint()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY - NEW FEATURES FOCUS")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        # NEW FEATURES Analysis - FOCUS ON REVIEW REQUEST
        print(f"\n🎯 REVIEW REQUEST FEATURES ANALYSIS:")
        
        # Check Reviews & Ratings System (Duo Reviews) - MAIN FOCUS
        review_tests = [r for r in self.test_results if 'review' in r['test'].lower()]
        successful_review_tests = [t for t in review_tests if t['success']]
        if len(successful_review_tests) >= 5:  # At least 5 review endpoints working
            print("   ✅ Reviews & Ratings System: Working - Duo reviews, moderation, and aggregates functional")
        elif len(successful_review_tests) > 0:
            print(f"   ⚠️  Reviews & Ratings System: Partially working - {len(successful_review_tests)}/{len(review_tests)} endpoints functional")
        else:
            print("   ❌ Reviews & Ratings System: Failed - Review system may not work")
        
        # Check Blog System
        blog_tests = [r for r in self.test_results if 'blog' in r['test'].lower()]
        if any(t['success'] for t in blog_tests):
            print("   ✅ Blog System: Working - /blog and /admin/blog/create should function")
        else:
            print("   ❌ Blog System: Failed - Blog pages may not work")
        
        # Check Legal Pages
        legal_tests = [r for r in self.test_results if 'legal' in r['test'].lower() or 'terms' in r['test'].lower() or 'privacy' in r['test'].lower()]
        if any(t['success'] for t in legal_tests):
            print("   ✅ Legal Pages: Working - /terms and /privacy should load")
        else:
            print("   ❌ Legal Pages: Failed - Legal pages may not load")
        
        # Check Suggestions System (Footer Button)
        suggestion_tests = [r for r in self.test_results if 'suggestion' in r['test'].lower()]
        if any(t['success'] for t in suggestion_tests):
            print("   ✅ Suggestions System: Working - Footer button should function")
        else:
            print("   ❌ Suggestions System: Failed - Footer button may not work")
        
        # Check Referral System Stability
        referral_tests = [r for r in self.test_results if 'referral' in r['test'].lower()]
        successful_referral_tests = [t for t in referral_tests if t['success']]
        if len(successful_referral_tests) >= 3:  # At least 3 referral endpoints working
            print("   ✅ Referral System: Stable - /referrals page should load without flinching")
        elif len(successful_referral_tests) > 0:
            print("   ⚠️  Referral System: Partially working - /referrals page may have issues")
        else:
            print("   ❌ Referral System: Failed - /referrals page may not work")
        
        # Original Analysis
        print(f"\n🔍 CORE SYSTEM ANALYSIS:")
        if len(species_data) == 0:
            print("   ❌ Species data not loading - database initialization issue")
        else:
            print(f"   ✅ Species data loaded ({len(species_data)} species)")
            
        if len(product_types_data) == 0:
            print("   ❌ Product types not loading - database initialization issue")
        else:
            print(f"   ✅ Product types loaded ({len(product_types_data)} types)")
            
        if len(listings_data) == 0:
            print("   ❌ NO LISTINGS FOUND - This is the main issue!")
            print("   🔧 Possible causes:")
            print("      - Database initialization didn't run")
            print("      - Sample data creation failed")
            print("      - Database connection issues")
            print("      - Listings collection is empty")
        else:
            print(f"   ✅ Listings found ({len(listings_data)} listings)")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test function"""
    tester = FarmStockAPITester()
    success = tester.run_comprehensive_test()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())