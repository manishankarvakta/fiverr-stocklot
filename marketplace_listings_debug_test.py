#!/usr/bin/env python3
"""
🔍 MARKETPLACE LISTINGS API DATA STRUCTURE DEBUG TEST
Comprehensive investigation of marketplace listings API response structure
to identify why livestock specifications are not displaying in the frontend
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MarketplaceListingsDebugger:
    """Marketplace Listings API Data Structure Debugger"""
    
    def __init__(self, base_url: str = "https://buy-request-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self):
        """Authenticate as admin user"""
        try:
            auth_data = {
                "email": "admin@stocklot.co.za",
                "password": "admin123"
            }
            
            async with self.session.post(f"{self.api_url}/auth/login", json=auth_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("token") or auth_data["email"]  # Fallback to email as token
                    logger.info("✅ Authentication successful")
                    return True
                else:
                    logger.error(f"❌ Authentication failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    async def test_listings_api_structure(self):
        """Test 1: Analyze GET /api/listings endpoint response structure"""
        logger.info("\n🔍 Testing GET /api/listings endpoint structure...")
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", []) if isinstance(data, dict) else data
                    
                    logger.info(f"✅ GET /api/listings successful - Found {len(listings)} listings")
                    
                    if listings:
                        # Analyze first listing structure
                        first_listing = listings[0]
                        logger.info("\n📋 FIRST LISTING STRUCTURE ANALYSIS:")
                        logger.info(f"   Listing ID: {first_listing.get('id', 'N/A')}")
                        logger.info(f"   Title: {first_listing.get('title', 'N/A')}")
                        logger.info(f"   Price per unit: {first_listing.get('price_per_unit', 'N/A')}")
                        logger.info(f"   Quantity: {first_listing.get('quantity', 'N/A')}")
                        logger.info(f"   Unit: {first_listing.get('unit', 'N/A')}")
                        
                        # Check for livestock specification fields
                        logger.info("\n🐄 LIVESTOCK SPECIFICATION FIELDS CHECK:")
                        
                        # Weight fields
                        weight_kg = first_listing.get('weight_kg')
                        weight = first_listing.get('weight')
                        logger.info(f"   weight_kg: {weight_kg}")
                        logger.info(f"   weight: {weight}")
                        
                        # Age fields
                        age_weeks = first_listing.get('age_weeks')
                        age_days = first_listing.get('age_days')
                        age = first_listing.get('age')
                        logger.info(f"   age_weeks: {age_weeks}")
                        logger.info(f"   age_days: {age_days}")
                        logger.info(f"   age: {age}")
                        
                        # Breed field
                        breed = first_listing.get('breed')
                        breed_id = first_listing.get('breed_id')
                        logger.info(f"   breed: {breed}")
                        logger.info(f"   breed_id: {breed_id}")
                        
                        # Vaccination and health fields
                        vaccination_status = first_listing.get('vaccination_status')
                        health_certificates = first_listing.get('health_certificates')
                        has_vet_certificate = first_listing.get('has_vet_certificate')
                        vet_certificate_url = first_listing.get('vet_certificate_url')
                        health_notes = first_listing.get('health_notes')
                        logger.info(f"   vaccination_status: {vaccination_status}")
                        logger.info(f"   health_certificates: {health_certificates}")
                        logger.info(f"   has_vet_certificate: {has_vet_certificate}")
                        logger.info(f"   vet_certificate_url: {vet_certificate_url}")
                        logger.info(f"   health_notes: {health_notes}")
                        
                        # Description field
                        description = first_listing.get('description')
                        logger.info(f"   description: {description}")
                        
                        # Species and product type
                        species_id = first_listing.get('species_id')
                        product_type_id = first_listing.get('product_type_id')
                        logger.info(f"   species_id: {species_id}")
                        logger.info(f"   product_type_id: {product_type_id}")
                        
                        # Check all available fields
                        logger.info("\n📝 ALL AVAILABLE FIELDS:")
                        for key, value in first_listing.items():
                            logger.info(f"   {key}: {value}")
                        
                        # Analyze missing livestock specification fields
                        missing_fields = []
                        expected_livestock_fields = [
                            'weight_kg', 'weight', 'age_weeks', 'age_days', 'age', 'breed',
                            'vaccination_status', 'health_certificates'
                        ]
                        
                        for field in expected_livestock_fields:
                            if field not in first_listing or first_listing.get(field) is None:
                                missing_fields.append(field)
                        
                        if missing_fields:
                            logger.info(f"\n❌ MISSING LIVESTOCK SPECIFICATION FIELDS: {missing_fields}")
                        else:
                            logger.info("\n✅ ALL LIVESTOCK SPECIFICATION FIELDS PRESENT")
                        
                        self.test_results.append(("Listings API Structure Analysis", True, f"Found {len(listings)} listings, Missing fields: {missing_fields}"))
                    else:
                        logger.info("⚠️ No listings found in response")
                        self.test_results.append(("Listings API Structure Analysis", False, "No listings found"))
                        
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET /api/listings failed: {response.status} - {error_text}")
                    self.test_results.append(("Listings API Structure Analysis", False, f"Status {response.status}"))
                    
        except Exception as e:
            logger.error(f"❌ Error testing listings API: {e}")
            self.test_results.append(("Listings API Structure Analysis", False, str(e)))
    
    async def test_species_and_breeds_data(self):
        """Test 2: Check species and breeds data to understand breed information"""
        logger.info("\n🔍 Testing species and breeds data...")
        
        # Test species endpoint
        try:
            async with self.session.get(
                f"{self.api_url}/species",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    species_data = await response.json()
                    species_list = species_data.get("species", []) if isinstance(species_data, dict) else species_data
                    
                    logger.info(f"✅ GET /api/species successful - Found {len(species_list)} species")
                    
                    # Show first few species
                    for i, species in enumerate(species_list[:3]):
                        logger.info(f"   Species {i+1}: {species.get('name')} (ID: {species.get('id')})")
                    
                    self.test_results.append(("Species Data Check", True, f"Found {len(species_list)} species"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET /api/species failed: {response.status} - {error_text}")
                    self.test_results.append(("Species Data Check", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing species API: {e}")
            self.test_results.append(("Species Data Check", False, str(e)))
        
        # Test breeds endpoint
        try:
            async with self.session.get(
                f"{self.api_url}/breeds",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    breeds_data = await response.json()
                    breeds_list = breeds_data.get("breeds", []) if isinstance(breeds_data, dict) else breeds_data
                    
                    logger.info(f"✅ GET /api/breeds successful - Found {len(breeds_list)} breeds")
                    
                    # Show first few breeds
                    for i, breed in enumerate(breeds_list[:5]):
                        logger.info(f"   Breed {i+1}: {breed.get('name')} (ID: {breed.get('id')}, Species: {breed.get('species_id')})")
                    
                    self.test_results.append(("Breeds Data Check", True, f"Found {len(breeds_list)} breeds"))
                else:
                    error_text = await response.text()
                    logger.error(f"❌ GET /api/breeds failed: {response.status} - {error_text}")
                    self.test_results.append(("Breeds Data Check", False, f"Status {response.status}"))
        except Exception as e:
            logger.error(f"❌ Error testing breeds API: {e}")
            self.test_results.append(("Breeds Data Check", False, str(e)))
    
    async def test_individual_listing_details(self):
        """Test 3: Check individual listing details to see if more data is available"""
        logger.info("\n🔍 Testing individual listing details...")
        
        # First get a listing ID
        try:
            async with self.session.get(
                f"{self.api_url}/listings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", []) if isinstance(data, dict) else data
                    
                    if listings:
                        listing_id = listings[0].get('id')
                        
                        # Test individual listing endpoint
                        async with self.session.get(
                            f"{self.api_url}/listings/{listing_id}",
                            headers=self.get_headers()
                        ) as detail_response:
                            if detail_response.status == 200:
                                listing_detail = await detail_response.json()
                                
                                logger.info(f"✅ GET /api/listings/{listing_id} successful")
                                logger.info("\n📋 INDIVIDUAL LISTING DETAIL STRUCTURE:")
                                
                                # Check for livestock specification fields in detail view
                                detail_data = listing_detail.get("listing", listing_detail) if isinstance(listing_detail, dict) else listing_detail
                                
                                logger.info(f"   Title: {detail_data.get('title', 'N/A')}")
                                logger.info(f"   Description: {detail_data.get('description', 'N/A')}")
                                
                                # Check livestock fields
                                logger.info("\n🐄 LIVESTOCK SPECIFICATION FIELDS IN DETAIL:")
                                livestock_fields = [
                                    'weight_kg', 'weight', 'age_weeks', 'age_days', 'age', 'breed',
                                    'vaccination_status', 'health_certificates', 'has_vet_certificate',
                                    'vet_certificate_url', 'health_notes'
                                ]
                                
                                for field in livestock_fields:
                                    value = detail_data.get(field)
                                    logger.info(f"   {field}: {value}")
                                
                                # Show all fields in detail view
                                logger.info("\n📝 ALL FIELDS IN DETAIL VIEW:")
                                for key, value in detail_data.items():
                                    logger.info(f"   {key}: {value}")
                                
                                self.test_results.append(("Individual Listing Details", True, f"Retrieved details for listing {listing_id}"))
                            else:
                                error_text = await detail_response.text()
                                logger.error(f"❌ GET /api/listings/{listing_id} failed: {detail_response.status} - {error_text}")
                                self.test_results.append(("Individual Listing Details", False, f"Status {detail_response.status}"))
                    else:
                        logger.info("⚠️ No listings available to test individual details")
                        self.test_results.append(("Individual Listing Details", False, "No listings available"))
                        
        except Exception as e:
            logger.error(f"❌ Error testing individual listing details: {e}")
            self.test_results.append(("Individual Listing Details", False, str(e)))
    
    async def test_database_content_analysis(self):
        """Test 4: Analyze database content by creating a test listing with livestock specifications"""
        logger.info("\n🔍 Testing database content by creating test listing...")
        
        # First get species and product type IDs
        species_id = None
        product_type_id = None
        breed_id = None
        
        try:
            # Get species
            async with self.session.get(f"{self.api_url}/species", headers=self.get_headers()) as response:
                if response.status == 200:
                    species_data = await response.json()
                    species_list = species_data.get("species", []) if isinstance(species_data, dict) else species_data
                    if species_list:
                        # Find cattle species
                        for species in species_list:
                            if "cattle" in species.get("name", "").lower():
                                species_id = species.get("id")
                                break
                        if not species_id:
                            species_id = species_list[0].get("id")
            
            # Get breeds
            async with self.session.get(f"{self.api_url}/breeds", headers=self.get_headers()) as response:
                if response.status == 200:
                    breeds_data = await response.json()
                    breeds_list = breeds_data.get("breeds", []) if isinstance(breeds_data, dict) else breeds_data
                    if breeds_list:
                        # Find a breed for the species
                        for breed in breeds_list:
                            if breed.get("species_id") == species_id:
                                breed_id = breed.get("id")
                                break
                        if not breed_id and breeds_list:
                            breed_id = breeds_list[0].get("id")
            
            # Get product types
            async with self.session.get(f"{self.api_url}/product-types", headers=self.get_headers()) as response:
                if response.status == 200:
                    product_data = await response.json()
                    product_list = product_data.get("product_types", []) if isinstance(product_data, dict) else product_data
                    if product_list:
                        product_type_id = product_list[0].get("id")
            
            if species_id and product_type_id:
                # Create test listing with livestock specifications
                test_listing = {
                    "species_id": species_id,
                    "breed_id": breed_id,
                    "product_type_id": product_type_id,
                    "title": "Test Angus Cattle - Marketplace Debug",
                    "description": "Premium Angus cattle, 18 months old, 450kg, vaccinated against Foot and Mouth Disease, Anthrax, and Blackleg. Vet certificate available. Excellent breeding stock.",
                    "quantity": 5,
                    "unit": "head",
                    "price_per_unit": 15000.00,
                    "has_vet_certificate": True,
                    "health_notes": "Vaccinated: Foot and Mouth Disease, Anthrax, Blackleg. Last vaccination: 2024-12-01",
                    "region": "Gauteng",
                    "city": "Johannesburg",
                    # Try to add livestock specification fields
                    "weight_kg": 450,
                    "age_weeks": 78,  # 18 months
                    "breed": "Angus",
                    "vaccination_status": "Fully vaccinated",
                    "health_certificates": ["Vet Certificate", "Vaccination Record"]
                }
                
                async with self.session.post(
                    f"{self.api_url}/listings",
                    json=test_listing,
                    headers=self.get_headers()
                ) as response:
                    if response.status in [200, 201]:
                        created_listing = await response.json()
                        listing_id = created_listing.get("id") or created_listing.get("listing", {}).get("id")
                        
                        logger.info("✅ Test listing created successfully")
                        logger.info(f"   Listing ID: {listing_id}")
                        
                        # Now retrieve the created listing to see what fields are stored
                        if listing_id:
                            async with self.session.get(
                                f"{self.api_url}/listings/{listing_id}",
                                headers=self.get_headers()
                            ) as get_response:
                                if get_response.status == 200:
                                    retrieved_listing = await get_response.json()
                                    listing_data = retrieved_listing.get("listing", retrieved_listing) if isinstance(retrieved_listing, dict) else retrieved_listing
                                    
                                    logger.info("\n📋 CREATED LISTING RETRIEVED DATA:")
                                    logger.info(f"   Title: {listing_data.get('title')}")
                                    logger.info(f"   Description: {listing_data.get('description')}")
                                    
                                    # Check if livestock specification fields were stored
                                    logger.info("\n🐄 LIVESTOCK SPECIFICATION FIELDS IN CREATED LISTING:")
                                    livestock_fields = [
                                        'weight_kg', 'age_weeks', 'breed', 'vaccination_status', 'health_certificates'
                                    ]
                                    
                                    stored_fields = []
                                    missing_fields = []
                                    
                                    for field in livestock_fields:
                                        value = listing_data.get(field)
                                        logger.info(f"   {field}: {value}")
                                        if value is not None:
                                            stored_fields.append(field)
                                        else:
                                            missing_fields.append(field)
                                    
                                    logger.info(f"\n✅ STORED FIELDS: {stored_fields}")
                                    logger.info(f"❌ MISSING FIELDS: {missing_fields}")
                                    
                                    self.test_results.append(("Database Content Analysis", True, f"Stored: {stored_fields}, Missing: {missing_fields}"))
                                else:
                                    logger.error(f"❌ Failed to retrieve created listing: {get_response.status}")
                                    self.test_results.append(("Database Content Analysis", False, "Failed to retrieve created listing"))
                        else:
                            logger.error("❌ No listing ID returned from creation")
                            self.test_results.append(("Database Content Analysis", False, "No listing ID returned"))
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Failed to create test listing: {response.status} - {error_text}")
                        self.test_results.append(("Database Content Analysis", False, f"Creation failed: {response.status}"))
            else:
                logger.error("❌ Could not get required species_id or product_type_id")
                self.test_results.append(("Database Content Analysis", False, "Missing required IDs"))
                
        except Exception as e:
            logger.error(f"❌ Error in database content analysis: {e}")
            self.test_results.append(("Database Content Analysis", False, str(e)))
    
    async def test_frontend_expected_fields(self):
        """Test 5: Check if API returns the specific fields that frontend ListingCard expects"""
        logger.info("\n🔍 Testing frontend expected fields...")
        
        # Based on the review request, the ListingCard component looks for these fields:
        expected_frontend_fields = [
            'weight_kg',
            'age_weeks',
            'age_days', 
            'breed',
            'vaccination_status',
            'health_certificates',
            'description'
        ]
        
        try:
            async with self.session.get(
                f"{self.api_url}/listings",
                headers=self.get_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    listings = data.get("listings", []) if isinstance(data, dict) else data
                    
                    if listings:
                        logger.info("\n🎯 FRONTEND EXPECTED FIELDS ANALYSIS:")
                        
                        # Check each listing for frontend expected fields
                        field_availability = {field: 0 for field in expected_frontend_fields}
                        
                        for i, listing in enumerate(listings[:5]):  # Check first 5 listings
                            logger.info(f"\n   Listing {i+1}: {listing.get('title', 'N/A')}")
                            
                            for field in expected_frontend_fields:
                                value = listing.get(field)
                                if value is not None and value != "":
                                    field_availability[field] += 1
                                    logger.info(f"     ✅ {field}: {value}")
                                else:
                                    logger.info(f"     ❌ {field}: {value}")
                        
                        logger.info(f"\n📊 FIELD AVAILABILITY SUMMARY (out of {min(len(listings), 5)} listings):")
                        for field, count in field_availability.items():
                            percentage = (count / min(len(listings), 5)) * 100
                            logger.info(f"   {field}: {count}/{min(len(listings), 5)} ({percentage:.1f}%)")
                        
                        # Identify completely missing fields
                        missing_fields = [field for field, count in field_availability.items() if count == 0]
                        available_fields = [field for field, count in field_availability.items() if count > 0]
                        
                        logger.info(f"\n✅ AVAILABLE FIELDS: {available_fields}")
                        logger.info(f"❌ COMPLETELY MISSING FIELDS: {missing_fields}")
                        
                        self.test_results.append(("Frontend Expected Fields", True, f"Available: {len(available_fields)}/{len(expected_frontend_fields)}, Missing: {missing_fields}"))
                    else:
                        logger.info("⚠️ No listings found for frontend field analysis")
                        self.test_results.append(("Frontend Expected Fields", False, "No listings found"))
                        
        except Exception as e:
            logger.error(f"❌ Error testing frontend expected fields: {e}")
            self.test_results.append(("Frontend Expected Fields", False, str(e)))
    
    async def run_all_tests(self):
        """Run all marketplace listings debug tests"""
        logger.info("🚀 Starting Marketplace Listings API Data Structure Debug...")
        
        await self.setup_session()
        
        try:
            # Authenticate first
            if not await self.authenticate():
                logger.error("❌ Authentication failed - cannot proceed with tests")
                return
            
            # Run all debug tests
            await self.test_listings_api_structure()
            await self.test_species_and_breeds_data()
            await self.test_individual_listing_details()
            await self.test_database_content_analysis()
            await self.test_frontend_expected_fields()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_debug_summary()
    
    def print_debug_summary(self):
        """Print comprehensive debug summary"""
        logger.info("\n" + "="*80)
        logger.info("🔍 MARKETPLACE LISTINGS API DATA STRUCTURE DEBUG SUMMARY")
        logger.info("="*80)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        logger.info(f"📊 DEBUG RESULTS: {passed}/{total} tests completed successfully")
        
        logger.info("\n📋 DETAILED RESULTS:")
        for test_name, success, details in self.test_results:
            status = "✅ COMPLETED" if success else "❌ FAILED"
            logger.info(f"   {status}: {test_name}")
            if details:
                logger.info(f"      Details: {details}")
        
        logger.info("\n🎯 KEY FINDINGS:")
        logger.info("   • API Response Structure Analysis")
        logger.info("   • Livestock Specification Fields Availability")
        logger.info("   • Frontend Expected Fields Mapping")
        logger.info("   • Database Content Verification")
        logger.info("   • Individual vs List View Comparison")
        
        logger.info("\n🔍 INVESTIGATION FOCUS:")
        logger.info("   • weight_kg, weight, age_weeks, age_days, age, breed fields")
        logger.info("   • vaccination_status, health_certificates, has_vet_certificate fields")
        logger.info("   • description field content analysis")
        logger.info("   • API vs Frontend field name matching")
        
        logger.info("="*80)

async def main():
    """Main debug runner"""
    debugger = MarketplaceListingsDebugger()
    await debugger.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())