#!/usr/bin/env python3
"""
Taxonomy Analysis Test - Database Structure Examination for Exotic Livestock Expansion

This test examines the current database structure to understand the existing taxonomy 
before implementing the exotic livestock expansion.

Analysis Areas:
1. Current Species - what livestock is already supported
2. Current Categories - existing organization structure  
3. Current Product Types - what product types exist
4. Current Breeds - what breeds are available
5. Database Schema Analysis - field structure and relationships
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://farmstock-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@stocklot.co.za"
ADMIN_PASSWORD = "admin123"

class TaxonomyAnalyzer:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "species_analysis": {},
            "category_analysis": {},
            "product_type_analysis": {},
            "breed_analysis": {},
            "schema_analysis": {},
            "exotic_readiness": {}
        }
    
    def authenticate(self):
        """Authenticate as admin user"""
        try:
            print("🔐 Authenticating as admin user...")
            
            # Login
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token") or ADMIN_EMAIL
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                print(f"✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def analyze_species(self):
        """Analyze current species in the database"""
        print("\n📊 ANALYZING CURRENT SPECIES...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/species")
            
            if response.status_code == 200:
                species_data = response.json()
                print(f"✅ Found {len(species_data)} species")
                
                # Analyze species by category
                species_by_category = {}
                exotic_indicators = []
                
                for species in species_data:
                    category_id = species.get("category_group_id", "unknown")
                    if category_id not in species_by_category:
                        species_by_category[category_id] = []
                    species_by_category[category_id].append(species)
                    
                    # Check for exotic indicators
                    name = species.get("name", "").lower()
                    if any(keyword in name for keyword in ["game", "exotic", "ostrich", "emu", "venison"]):
                        exotic_indicators.append(species)
                
                self.results["species_analysis"] = {
                    "total_count": len(species_data),
                    "species_by_category": species_by_category,
                    "existing_exotic_species": exotic_indicators,
                    "species_list": [{"name": s.get("name"), "id": s.get("id"), "category_group_id": s.get("category_group_id")} for s in species_data]
                }
                
                print(f"📋 Species breakdown by category:")
                for category_id, species_list in species_by_category.items():
                    print(f"   Category {category_id}: {len(species_list)} species")
                    for species in species_list[:3]:  # Show first 3
                        print(f"     - {species.get('name')}")
                    if len(species_list) > 3:
                        print(f"     ... and {len(species_list) - 3} more")
                
                if exotic_indicators:
                    print(f"🦌 Found {len(exotic_indicators)} potential exotic species:")
                    for species in exotic_indicators:
                        print(f"   - {species.get('name')}")
                else:
                    print("🔍 No obvious exotic species found")
                
                return True
                
            else:
                print(f"❌ Failed to fetch species: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Species analysis error: {e}")
            return False
    
    def analyze_categories(self):
        """Analyze current category groups"""
        print("\n📊 ANALYZING CURRENT CATEGORIES...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/category-groups")
            
            if response.status_code == 200:
                categories_data = response.json()
                print(f"✅ Found {len(categories_data)} category groups")
                
                category_structure = {}
                for category in categories_data:
                    category_structure[category.get("id")] = {
                        "name": category.get("name"),
                        "description": category.get("description"),
                        "id": category.get("id")
                    }
                    print(f"   📁 {category.get('name')}: {category.get('description', 'No description')}")
                
                self.results["category_analysis"] = {
                    "total_count": len(categories_data),
                    "categories": category_structure,
                    "category_names": [c.get("name") for c in categories_data]
                }
                
                # Check for exotic/game category
                exotic_categories = [c for c in categories_data if any(keyword in c.get("name", "").lower() for keyword in ["game", "exotic", "wild"])]
                if exotic_categories:
                    print(f"🦌 Found {len(exotic_categories)} exotic-related categories:")
                    for cat in exotic_categories:
                        print(f"   - {cat.get('name')}")
                else:
                    print("🔍 No exotic/game categories found")
                
                return True
                
            else:
                print(f"❌ Failed to fetch categories: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Category analysis error: {e}")
            return False
    
    def analyze_product_types(self):
        """Analyze current product types"""
        print("\n📊 ANALYZING CURRENT PRODUCT TYPES...")
        
        try:
            # Try different possible endpoints
            endpoints_to_try = [
                "/product-types",
                "/products/types", 
                "/listings/product-types",
                "/taxonomy/product-types"
            ]
            
            product_types_data = None
            successful_endpoint = None
            
            for endpoint in endpoints_to_try:
                try:
                    response = self.session.get(f"{BACKEND_URL}{endpoint}")
                    if response.status_code == 200:
                        product_types_data = response.json()
                        successful_endpoint = endpoint
                        break
                except:
                    continue
            
            if product_types_data:
                print(f"✅ Found {len(product_types_data)} product types (via {successful_endpoint})")
                
                product_analysis = {}
                for pt in product_types_data:
                    code = pt.get("code", "unknown")
                    product_analysis[code] = {
                        "label": pt.get("label"),
                        "description": pt.get("description"),
                        "applicable_to_groups": pt.get("applicable_to_groups", [])
                    }
                    print(f"   🏷️  {pt.get('label')} ({code}): {pt.get('description', 'No description')}")
                    if pt.get("applicable_to_groups"):
                        print(f"      Applies to: {', '.join(pt.get('applicable_to_groups'))}")
                
                self.results["product_type_analysis"] = {
                    "total_count": len(product_types_data),
                    "endpoint_used": successful_endpoint,
                    "product_types": product_analysis,
                    "codes": [pt.get("code") for pt in product_types_data]
                }
                
                # Check for exotic-specific product types
                exotic_products = [pt for pt in product_types_data if any(keyword in pt.get("label", "").lower() for keyword in ["game", "venison", "exotic"])]
                if exotic_products:
                    print(f"🦌 Found {len(exotic_products)} exotic-related product types:")
                    for pt in exotic_products:
                        print(f"   - {pt.get('label')}")
                else:
                    print("🔍 No exotic-specific product types found")
                
                return True
            else:
                print("❌ Could not find product types endpoint")
                self.results["product_type_analysis"] = {
                    "error": "No accessible product types endpoint found",
                    "endpoints_tried": endpoints_to_try
                }
                return False
                
        except Exception as e:
            print(f"❌ Product type analysis error: {e}")
            return False
    
    def analyze_breeds(self):
        """Analyze current breeds"""
        print("\n📊 ANALYZING CURRENT BREEDS...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/breeds")
            
            if response.status_code == 200:
                breeds_data = response.json()
                print(f"✅ Found {len(breeds_data)} breeds")
                
                # Group breeds by species
                breeds_by_species = {}
                exotic_breeds = []
                
                for breed in breeds_data:
                    species_id = breed.get("species_id", "unknown")
                    if species_id not in breeds_by_species:
                        breeds_by_species[species_id] = []
                    breeds_by_species[species_id].append(breed)
                    
                    # Check for exotic breed indicators
                    name = breed.get("name", "").lower()
                    if any(keyword in name for keyword in ["game", "wild", "exotic", "kudu", "springbok", "impala", "ostrich"]):
                        exotic_breeds.append(breed)
                
                self.results["breed_analysis"] = {
                    "total_count": len(breeds_data),
                    "breeds_by_species": breeds_by_species,
                    "existing_exotic_breeds": exotic_breeds,
                    "breed_list": [{"name": b.get("name"), "species_id": b.get("species_id")} for b in breeds_data]
                }
                
                print(f"📋 Breed breakdown by species:")
                for species_id, breed_list in breeds_by_species.items():
                    print(f"   Species {species_id}: {len(breed_list)} breeds")
                    for breed in breed_list[:2]:  # Show first 2
                        print(f"     - {breed.get('name')}")
                    if len(breed_list) > 2:
                        print(f"     ... and {len(breed_list) - 2} more")
                
                if exotic_breeds:
                    print(f"🦌 Found {len(exotic_breeds)} potential exotic breeds:")
                    for breed in exotic_breeds:
                        print(f"   - {breed.get('name')}")
                else:
                    print("🔍 No obvious exotic breeds found")
                
                return True
                
            else:
                print(f"❌ Failed to fetch breeds: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Breed analysis error: {e}")
            return False
    
    def analyze_schema_structure(self):
        """Analyze database schema structure"""
        print("\n📊 ANALYZING DATABASE SCHEMA STRUCTURE...")
        
        try:
            # Get sample records to understand field structure
            schema_info = {}
            
            # Analyze Species model structure
            if self.results["species_analysis"].get("species_list"):
                sample_species = self.results["species_analysis"]["species_list"][0] if self.results["species_analysis"]["species_list"] else {}
                schema_info["species_fields"] = list(sample_species.keys()) if sample_species else []
                
                # Check for exotic-related fields
                exotic_fields = [field for field in schema_info["species_fields"] if any(keyword in field.lower() for keyword in ["exotic", "game", "wild", "edible"])]
                schema_info["species_exotic_fields"] = exotic_fields
            
            # Analyze Category structure
            if self.results["category_analysis"].get("categories"):
                sample_category = list(self.results["category_analysis"]["categories"].values())[0] if self.results["category_analysis"]["categories"] else {}
                schema_info["category_fields"] = list(sample_category.keys()) if sample_category else []
            
            # Analyze Product Type structure
            if self.results["product_type_analysis"].get("product_types"):
                sample_product = list(self.results["product_type_analysis"]["product_types"].values())[0] if self.results["product_type_analysis"]["product_types"] else {}
                schema_info["product_type_fields"] = list(sample_product.keys()) if sample_product else []
            
            # Analyze Breed structure
            if self.results["breed_analysis"].get("breed_list"):
                sample_breed = self.results["breed_analysis"]["breed_list"][0] if self.results["breed_analysis"]["breed_list"] else {}
                schema_info["breed_fields"] = list(sample_breed.keys()) if sample_breed else []
            
            self.results["schema_analysis"] = schema_info
            
            print("📋 Schema Field Analysis:")
            for model, fields in schema_info.items():
                if isinstance(fields, list):
                    print(f"   {model}: {', '.join(fields)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Schema analysis error: {e}")
            return False
    
    def assess_exotic_readiness(self):
        """Assess readiness for exotic livestock expansion"""
        print("\n📊 ASSESSING EXOTIC LIVESTOCK READINESS...")
        
        readiness_score = 0
        max_score = 100
        assessment = {}
        
        # Check existing exotic support (20 points)
        existing_exotic_species = len(self.results["species_analysis"].get("existing_exotic_species", []))
        existing_exotic_breeds = len(self.results["breed_analysis"].get("existing_exotic_breeds", []))
        
        if existing_exotic_species > 0 or existing_exotic_breeds > 0:
            readiness_score += 20
            assessment["existing_exotic_support"] = f"✅ Found {existing_exotic_species} exotic species and {existing_exotic_breeds} exotic breeds"
        else:
            assessment["existing_exotic_support"] = "❌ No existing exotic species or breeds found"
        
        # Check category structure (20 points)
        categories = self.results["category_analysis"].get("category_names", [])
        has_game_category = any("game" in cat.lower() or "exotic" in cat.lower() for cat in categories)
        
        if has_game_category:
            readiness_score += 20
            assessment["category_structure"] = "✅ Exotic/Game category already exists"
        else:
            assessment["category_structure"] = "⚠️  No dedicated exotic/game category - needs creation"
        
        # Check product type diversity (20 points)
        product_types = self.results["product_type_analysis"].get("codes", [])
        if len(product_types) >= 10:
            readiness_score += 20
            assessment["product_type_diversity"] = f"✅ Good product type diversity ({len(product_types)} types)"
        else:
            assessment["product_type_diversity"] = f"⚠️  Limited product types ({len(product_types)} types)"
        
        # Check schema flexibility (20 points)
        species_fields = self.results["schema_analysis"].get("species_fields", [])
        has_exotic_fields = len(self.results["schema_analysis"].get("species_exotic_fields", [])) > 0
        
        if has_exotic_fields or "is_exotic" in species_fields or "edible" in species_fields:
            readiness_score += 20
            assessment["schema_flexibility"] = "✅ Schema has exotic-related fields"
        else:
            assessment["schema_flexibility"] = "⚠️  Schema may need exotic-specific fields"
        
        # Check compliance support (20 points)
        has_compliance_fields = any(field in species_fields for field in ["compliance", "permit", "regulation", "certificate"])
        
        if has_compliance_fields:
            readiness_score += 20
            assessment["compliance_support"] = "✅ Schema supports compliance/permit fields"
        else:
            assessment["compliance_support"] = "⚠️  May need compliance/permit field support"
        
        self.results["exotic_readiness"] = {
            "readiness_score": readiness_score,
            "max_score": max_score,
            "percentage": round((readiness_score / max_score) * 100, 1),
            "assessment": assessment,
            "recommendations": self.generate_recommendations(assessment)
        }
        
        print(f"🎯 EXOTIC LIVESTOCK READINESS SCORE: {readiness_score}/{max_score} ({self.results['exotic_readiness']['percentage']}%)")
        
        for category, result in assessment.items():
            print(f"   {result}")
        
        return True
    
    def generate_recommendations(self, assessment):
        """Generate recommendations based on assessment"""
        recommendations = []
        
        if "❌" in assessment.get("existing_exotic_support", ""):
            recommendations.append("Add exotic species (Ostrich, Emu, Game animals) to species table")
            recommendations.append("Add exotic breeds (Kudu, Springbok, Impala, etc.) to breeds table")
        
        if "⚠️" in assessment.get("category_structure", ""):
            recommendations.append("Create 'Game Animals' or 'Exotic Livestock' category group")
        
        if "⚠️" in assessment.get("product_type_diversity", ""):
            recommendations.append("Add exotic-specific product types (VENISON, GAME_MEAT, LIVE_GAME)")
        
        if "⚠️" in assessment.get("schema_flexibility", ""):
            recommendations.append("Add exotic-related fields to Species model (is_exotic, is_edible, is_game)")
        
        if "⚠️" in assessment.get("compliance_support", ""):
            recommendations.append("Add compliance fields (permit_required, hunting_season, regulations)")
        
        return recommendations
    
    def save_results(self):
        """Save analysis results to file"""
        try:
            with open("/app/taxonomy_analysis_results.json", "w") as f:
                json.dump(self.results, f, indent=2, default=str)
            print(f"\n💾 Results saved to taxonomy_analysis_results.json")
            return True
        except Exception as e:
            print(f"❌ Failed to save results: {e}")
            return False
    
    def print_summary(self):
        """Print comprehensive summary"""
        print("\n" + "="*80)
        print("📊 TAXONOMY ANALYSIS SUMMARY")
        print("="*80)
        
        print(f"\n🔢 CURRENT TAXONOMY COUNTS:")
        print(f"   Species: {self.results['species_analysis'].get('total_count', 0)}")
        print(f"   Categories: {self.results['category_analysis'].get('total_count', 0)}")
        print(f"   Product Types: {self.results['product_type_analysis'].get('total_count', 0)}")
        print(f"   Breeds: {self.results['breed_analysis'].get('total_count', 0)}")
        
        print(f"\n📋 EXISTING CATEGORIES:")
        for category in self.results['category_analysis'].get('category_names', []):
            print(f"   - {category}")
        
        print(f"\n🦌 EXOTIC READINESS:")
        readiness = self.results.get('exotic_readiness', {})
        print(f"   Score: {readiness.get('percentage', 0)}% ({readiness.get('readiness_score', 0)}/{readiness.get('max_score', 100)})")
        
        print(f"\n💡 KEY RECOMMENDATIONS:")
        for rec in readiness.get('recommendations', []):
            print(f"   • {rec}")
        
        print(f"\n🔍 ANALYSIS COMPLETE - Ready for exotic livestock expansion planning!")

def main():
    """Main analysis function"""
    print("🔬 STARTING TAXONOMY ANALYSIS FOR EXOTIC LIVESTOCK EXPANSION")
    print("="*80)
    
    analyzer = TaxonomyAnalyzer()
    
    # Authenticate
    if not analyzer.authenticate():
        print("❌ Authentication failed - cannot proceed")
        sys.exit(1)
    
    # Run all analyses
    success_count = 0
    total_analyses = 6
    
    if analyzer.analyze_species():
        success_count += 1
    
    if analyzer.analyze_categories():
        success_count += 1
    
    if analyzer.analyze_product_types():
        success_count += 1
    
    if analyzer.analyze_breeds():
        success_count += 1
    
    if analyzer.analyze_schema_structure():
        success_count += 1
    
    if analyzer.assess_exotic_readiness():
        success_count += 1
    
    # Save results and print summary
    analyzer.save_results()
    analyzer.print_summary()
    
    print(f"\n✅ Analysis completed: {success_count}/{total_analyses} sections successful")
    
    if success_count == total_analyses:
        print("🎉 FULL TAXONOMY ANALYSIS COMPLETED SUCCESSFULLY!")
        return True
    else:
        print("⚠️  Some analyses failed - check results for details")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)