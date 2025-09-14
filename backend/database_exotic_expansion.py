#!/usr/bin/env python3
"""
🐾 EXOTIC & SPECIALTY LIVESTOCK DATABASE EXPANSION
Implements comprehensive taxonomy for game animals, large flightless birds, 
camelids, specialty avian, aquaculture exotic, and other specialty livestock.

This script expands StockLot's database to support exotic livestock trading
while maintaining the live-animal focus and regulatory compliance.
"""

import asyncio
import motor.motor_asyncio
import os
from datetime import datetime
import logging
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExoticLivestockExpansion:
    def __init__(self):
        self.mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/stocklot')
        self.client = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_url)
            self.db = self.client.stocklot
            await self.client.admin.command('ismaster')
            logger.info("✅ Connected to MongoDB")
            return True
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            return False
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("🔐 MongoDB connection closed")
    
    async def create_exotic_categories(self):
        """Create new category groups for exotic livestock"""
        logger.info("📁 Creating exotic livestock categories...")
        
        exotic_categories = [
            {
                "name": "Game Animals",
                "description": "Wild game species for commercial farming and breeding (live only, permit required)"
            },
            {
                "name": "Large Flightless Birds", 
                "description": "Ratites: ostrich, emu, rhea for meat, leather, feathers, and eggs"
            },
            {
                "name": "Camelids & Exotic Ruminants",
                "description": "Alpaca, llama, camel for fiber, milk, and breeding stock"
            },
            {
                "name": "Specialty Avian",
                "description": "Ornamental and game birds: pheasants, peacocks, partridge, exotic ducks"
            },
            {
                "name": "Aquaculture Exotic",
                "description": "Crocodiles, exotic fish, ornamental species for commercial farming"
            },
            {
                "name": "Specialty Small Mammals",
                "description": "Cane rats, guinea pigs, and other edible small mammals"
            }
        ]
        
        created_categories = {}
        
        for category_data in exotic_categories:
            try:
                # Check if category already exists
                existing = await self.db.category_groups.find_one({"name": category_data["name"]})
                
                if existing:
                    logger.info(f"   📁 Category '{category_data['name']}' already exists")
                    created_categories[category_data["name"]] = existing["id"]
                else:
                    # Create new category
                    import uuid
                    category_id = str(uuid.uuid4())
                    
                    category_doc = {
                        "id": category_id,
                        "name": category_data["name"],
                        "description": category_data["description"],
                        "created_at": datetime.utcnow()
                    }
                    
                    await self.db.category_groups.insert_one(category_doc)
                    created_categories[category_data["name"]] = category_id
                    logger.info(f"   ✅ Created category: {category_data['name']}")
                    
            except Exception as e:
                logger.error(f"   ❌ Failed to create category {category_data['name']}: {e}")
        
        return created_categories
    
    async def create_exotic_product_types(self):
        """Create product types for exotic livestock (live-only focus)"""
        logger.info("🏷️  Creating exotic product types...")
        
        # Live-only product types for exotic animals
        exotic_product_types = [
            {
                "code": "LIVE_GAME",
                "label": "Live Game Animal",
                "description": "Live wild game animals for commercial farming (permit required)",
                "applicable_to_groups": ["Game Animals"]
            },
            {
                "code": "BREEDING_PAIR_GAME",
                "label": "Game Breeding Pair",
                "description": "Breeding pairs of game animals for commercial farming",
                "applicable_to_groups": ["Game Animals"]
            },
            {
                "code": "RATITE_EGGS",
                "label": "Ratite Fertilized Eggs",
                "description": "Fertilized eggs from ostrich, emu, rhea for hatching",
                "applicable_to_groups": ["Large Flightless Birds"]
            },
            {
                "code": "RATITE_CHICKS",
                "label": "Ratite Chicks",
                "description": "Day-old or young ratite chicks",
                "applicable_to_groups": ["Large Flightless Birds"]
            },
            {
                "code": "CAMELID_BREEDING",
                "label": "Camelid Breeding Stock",
                "description": "Breeding stock for alpaca, llama, camel farming",
                "applicable_to_groups": ["Camelids & Exotic Ruminants"]
            },
            {
                "code": "ORNAMENTAL_BREEDING",
                "label": "Ornamental Bird Breeding Stock",
                "description": "Breeding pairs for specialty avian species",
                "applicable_to_groups": ["Specialty Avian"]
            },
            {
                "code": "AQUACULTURE_EXOTIC_JUVENILES",
                "label": "Exotic Aquaculture Juveniles",
                "description": "Young exotic aquatic animals for farming",
                "applicable_to_groups": ["Aquaculture Exotic"]
            }
        ]
        
        created_types = {}
        
        for pt_data in exotic_product_types:
            try:
                # Check if product type already exists
                existing = await self.db.product_types.find_one({"code": pt_data["code"]})
                
                if existing:
                    logger.info(f"   🏷️  Product type '{pt_data['code']}' already exists")
                    created_types[pt_data["code"]] = existing["id"]
                else:
                    # Create new product type
                    import uuid
                    pt_id = str(uuid.uuid4())
                    
                    pt_doc = {
                        "id": pt_id,
                        "code": pt_data["code"],
                        "label": pt_data["label"],
                        "description": pt_data["description"],
                        "applicable_to_groups": pt_data["applicable_to_groups"],
                        "created_at": datetime.utcnow()
                    }
                    
                    await self.db.product_types.insert_one(pt_doc)
                    created_types[pt_data["code"]] = pt_id
                    logger.info(f"   ✅ Created product type: {pt_data['label']}")
                    
            except Exception as e:
                logger.error(f"   ❌ Failed to create product type {pt_data['code']}: {e}")
        
        return created_types
    
    async def create_exotic_species(self, categories: Dict[str, str]):
        """Create exotic species with proper categorization"""
        logger.info("🦌 Creating exotic livestock species...")
        
        # Comprehensive exotic species list
        exotic_species_data = [
            # GAME ANIMALS / ANTELOPE
            {
                "name": "Kudu",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Large spiral-horned antelope, popular for game farming and venison production"
            },
            {
                "name": "Impala",
                "category": "Game Animals", 
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Medium-sized antelope, fast-breeding for commercial game farming"
            },
            {
                "name": "Springbok",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "South Africa's national animal, excellent for game farming"
            },
            {
                "name": "Eland",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Largest antelope species, docile and suitable for commercial farming"
            },
            {
                "name": "Blesbok",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Medium antelope with distinctive white blaze, popular for game farming"
            },
            {
                "name": "Gemsbok (Oryx)",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Desert-adapted antelope with straight horns, drought-resistant"
            },
            {
                "name": "Nyala",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Spiral-horned antelope, striking appearance for game farming"
            },
            {
                "name": "Waterbuck",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Large antelope preferring areas near water sources"
            },
            
            # PLAINS GAME
            {
                "name": "Zebra",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Striped equid, unique for game farming and eco-tourism"
            },
            {
                "name": "Wildebeest",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Large antelope, important for game farming and conservation"
            },
            
            # WILD PIGS
            {
                "name": "Bushpig",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Wild pig species, highly regulated for live trade"
            },
            {
                "name": "Warthog",
                "category": "Game Animals",
                "is_exotic": True,
                "is_edible": True,
                "is_game": True,
                "permit_required": True,
                "description": "Wild pig with prominent tusks, regulated live trade"
            },
            
            # LARGE FLIGHTLESS BIRDS (RATITES)
            {
                "name": "Ostrich",
                "category": "Large Flightless Birds",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "World's largest bird, farmed for meat, leather, feathers, and eggs"
            },
            {
                "name": "Emu",
                "category": "Large Flightless Birds",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "Australian ratite, farmed for oil, eggs, meat, and leather"
            },
            {
                "name": "Rhea",
                "category": "Large Flightless Birds",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "South American ratite, smaller than ostrich and emu"
            },
            
            # CAMELIDS & EXOTIC RUMINANTS
            {
                "name": "Alpaca",
                "category": "Camelids & Exotic Ruminants",
                "is_exotic": True,
                "is_edible": False,
                "description": "Small camelid bred primarily for fiber production"
            },
            {
                "name": "Llama",
                "category": "Camelids & Exotic Ruminants",
                "is_exotic": True,
                "is_edible": False,
                "description": "Large camelid used for fiber, pack animal, and breeding"
            },
            {
                "name": "Camel",
                "category": "Camelids & Exotic Ruminants",
                "is_exotic": True,
                "is_edible": True,
                "description": "Large camelid for milk, meat, and tourism purposes"
            },
            
            # SPECIALTY AVIAN
            {
                "name": "Pheasant",
                "category": "Specialty Avian",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "Game bird species for hunting and ornamental purposes"
            },
            {
                "name": "Peacock/Peafowl",
                "category": "Specialty Avian",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "Ornamental bird with spectacular plumage display"
            },
            {
                "name": "Partridge",
                "category": "Specialty Avian",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "Small game bird for hunting and meat production"
            },
            {
                "name": "Muscovy Duck",
                "category": "Specialty Avian",
                "is_exotic": True,
                "is_edible": True,
                "is_egg_laying": True,
                "description": "Large duck species with distinctive appearance"
            },
            
            # AQUACULTURE EXOTIC
            {
                "name": "Crocodile",
                "category": "Aquaculture Exotic",
                "is_exotic": True,
                "is_edible": True,
                "permit_required": True,
                "description": "Farmed for skins and meat, requires special permits"
            },
            {
                "name": "Freshwater Prawn (Giant)",
                "category": "Aquaculture Exotic",
                "is_exotic": True,
                "is_edible": True,
                "description": "Large freshwater crustacean for aquaculture"
            },
            
            # SPECIALTY SMALL MAMMALS
            {
                "name": "Cane Rat (Grasscutter)",
                "category": "Specialty Small Mammals",
                "is_exotic": True,
                "is_edible": True,
                "description": "Large rodent, delicacy in West Africa, gaining popularity"
            },
            {
                "name": "Guinea Pig (Cuy)",
                "category": "Specialty Small Mammals",
                "is_exotic": True,
                "is_edible": True,
                "description": "Traditional protein source in Andean regions"
            }
        ]
        
        created_species = {}
        
        for species_data in exotic_species_data:
            try:
                # Check if species already exists
                existing = await self.db.species.find_one({"name": species_data["name"]})
                
                if existing:
                    logger.info(f"   🦌 Species '{species_data['name']}' already exists")
                    created_species[species_data["name"]] = existing["id"]
                else:
                    # Get category ID
                    category_name = species_data["category"]
                    category_id = categories.get(category_name)
                    
                    if not category_id:
                        logger.error(f"   ❌ Category '{category_name}' not found for species '{species_data['name']}'")
                        continue
                    
                    # Create new species
                    import uuid
                    species_id = str(uuid.uuid4())
                    
                    species_doc = {
                        "id": species_id,
                        "name": species_data["name"],
                        "category_group_id": category_id,
                        "is_exotic": species_data.get("is_exotic", True),
                        "is_edible": species_data.get("is_edible", True),
                        "is_game": species_data.get("is_game", False),
                        "is_egg_laying": species_data.get("is_egg_laying", False),
                        "permit_required": species_data.get("permit_required", False),
                        "description": species_data["description"],
                        "created_at": datetime.utcnow()
                    }
                    
                    await self.db.species.insert_one(species_doc)
                    created_species[species_data["name"]] = species_id
                    logger.info(f"   ✅ Created species: {species_data['name']} ({category_name})")
                    
            except Exception as e:
                logger.error(f"   ❌ Failed to create species {species_data['name']}: {e}")
        
        return created_species
    
    async def create_exotic_breeds(self, species: Dict[str, str]):
        """Create breeds for exotic species"""
        logger.info("🧬 Creating exotic livestock breeds...")
        
        # Key breeds for exotic species
        exotic_breeds_data = {
            "Ostrich": [
                {"name": "African Black", "characteristics": "Traditional South African ostrich, excellent meat and leather production"},
                {"name": "Red Neck", "characteristics": "Hardy breed with good egg production"},
                {"name": "Blue Neck", "characteristics": "Large size, premium leather quality"}
            ],
            "Emu": [
                {"name": "Australian Emu", "characteristics": "Original emu breed, good oil and meat production"},
                {"name": "Commercial Emu", "characteristics": "Selectively bred for commercial farming"}
            ],
            "Alpaca": [
                {"name": "Huacaya", "characteristics": "Dense, crimped fleece, compact body type"},
                {"name": "Suri", "characteristics": "Long, silky fleece with lustrous locks"}
            ],
            "Llama": [
                {"name": "Classic Llama", "characteristics": "Traditional wool-bearing llama"},
                {"name": "Ccara", "characteristics": "Single-coated llama, less dense fleece"}
            ],
            "Pheasant": [
                {"name": "Ring-necked Pheasant", "characteristics": "Popular game bird for hunting preserves"},
                {"name": "Golden Pheasant", "characteristics": "Ornamental pheasant with brilliant plumage"}
            ],
            "Kudu": [
                {"name": "Greater Kudu", "characteristics": "Large subspecies with impressive spiral horns"},
                {"name": "Lesser Kudu", "characteristics": "Smaller, more agile subspecies"}
            ],
            "Springbok": [
                {"name": "Common Springbok", "characteristics": "Traditional South African springbok"},
                {"name": "Black Springbok", "characteristics": "Rare color variant, valuable for breeding"}
            ]
        }
        
        created_breeds = {}
        
        for species_name, breeds_list in exotic_breeds_data.items():
            species_id = species.get(species_name)
            if not species_id:
                logger.warning(f"   ⚠️  Species '{species_name}' not found, skipping breeds")
                continue
                
            for breed_data in breeds_list:
                try:
                    # Check if breed already exists
                    existing = await self.db.breeds.find_one({
                        "species_id": species_id,
                        "name": breed_data["name"]
                    })
                    
                    if existing:
                        logger.info(f"   🧬 Breed '{breed_data['name']}' already exists for {species_name}")
                        created_breeds[f"{species_name}_{breed_data['name']}"] = existing["id"]
                    else:
                        # Create new breed
                        import uuid
                        breed_id = str(uuid.uuid4())
                        
                        breed_doc = {
                            "id": breed_id,
                            "species_id": species_id,
                            "name": breed_data["name"],
                            "characteristics": breed_data["characteristics"],
                            "origin_country": "Various",
                            "created_at": datetime.utcnow()
                        }
                        
                        await self.db.breeds.insert_one(breed_doc)
                        created_breeds[f"{species_name}_{breed_data['name']}"] = breed_id
                        logger.info(f"   ✅ Created breed: {breed_data['name']} ({species_name})")
                        
                except Exception as e:
                    logger.error(f"   ❌ Failed to create breed {breed_data['name']} for {species_name}: {e}")
        
        return created_breeds
    
    async def create_compliance_rules(self, species: Dict[str, str]):
        """Create compliance rules for exotic species"""
        logger.info("📋 Creating compliance rules for exotic livestock...")
        
        # Compliance rules for exotic species
        compliance_rules = [
            {
                "country_code": "ZA",
                "species_names": ["Kudu", "Impala", "Springbok", "Eland", "Blesbok", "Gemsbok (Oryx)", "Nyala", "Waterbuck"],
                "requirement_code": "GAME_FARMING_PERMIT",
                "notes": "Permit required for commercial game farming and transport of live wildlife"
            },
            {
                "country_code": "ZA", 
                "species_names": ["Zebra", "Wildebeest"],
                "requirement_code": "WILDLIFE_PERMIT",
                "notes": "Special wildlife permit required for exotic plains game"
            },
            {
                "country_code": "ZA",
                "species_names": ["Bushpig", "Warthog"],
                "requirement_code": "DANGEROUS_GAME_PERMIT",
                "notes": "Highly regulated - dangerous game permit and containment requirements"
            },
            {
                "country_code": "ZA",
                "species_names": ["Crocodile"],
                "requirement_code": "CITES_PERMIT",
                "notes": "CITES permit required for live crocodile trade and export"
            },
            {
                "country_code": "ZA",
                "species_names": ["Ostrich", "Emu", "Rhea"],
                "requirement_code": "RATITE_FARMING_REGISTRATION",
                "notes": "Registration required for commercial ratite farming operations"
            },
            {
                "country_code": "ZA",
                "species_names": ["Alpaca", "Llama", "Camel"],
                "requirement_code": "EXOTIC_IMPORT_PERMIT",
                "notes": "Import permit and quarantine required for camelid species"
            }
        ]
        
        created_rules = []
        
        for rule_data in compliance_rules:
            for species_name in rule_data["species_names"]:
                species_id = species.get(species_name)
                if not species_id:
                    logger.warning(f"   ⚠️  Species '{species_name}' not found for compliance rule")
                    continue
                
                try:
                    # Check if rule already exists
                    existing = await self.db.compliance_rules.find_one({
                        "country_code": rule_data["country_code"],
                        "species_id": species_id,
                        "requirement_code": rule_data["requirement_code"]
                    })
                    
                    if existing:
                        logger.info(f"   📋 Compliance rule already exists for {species_name}")
                        created_rules.append(existing["id"])
                    else:
                        # Create new compliance rule
                        import uuid
                        rule_id = str(uuid.uuid4())
                        
                        rule_doc = {
                            "id": rule_id,
                            "country_code": rule_data["country_code"],
                            "species_id": species_id,
                            "requirement_code": rule_data["requirement_code"],
                            "notes": rule_data["notes"],
                            "created_at": datetime.utcnow()
                        }
                        
                        await self.db.compliance_rules.insert_one(rule_doc)
                        created_rules.append(rule_id)
                        logger.info(f"   ✅ Created compliance rule: {rule_data['requirement_code']} for {species_name}")
                        
                except Exception as e:
                    logger.error(f"   ❌ Failed to create compliance rule for {species_name}: {e}")
        
        return created_rules
    
    async def run_expansion(self):
        """Run the complete exotic livestock expansion"""
        logger.info("🚀 STARTING EXOTIC LIVESTOCK DATABASE EXPANSION")
        logger.info("=" * 60)
        
        try:
            # Connect to database
            if not await self.connect():
                return False
            
            # 1. Create exotic categories
            categories = await self.create_exotic_categories()
            logger.info(f"📁 Created {len(categories)} exotic categories")
            
            # 2. Create exotic product types
            product_types = await self.create_exotic_product_types()
            logger.info(f"🏷️  Created {len(product_types)} exotic product types")
            
            # 3. Create exotic species
            species = await self.create_exotic_species(categories)
            logger.info(f"🦌 Created {len(species)} exotic species")
            
            # 4. Create exotic breeds
            breeds = await self.create_exotic_breeds(species)
            logger.info(f"🧬 Created {len(breeds)} exotic breeds")
            
            # 5. Create compliance rules
            compliance = await self.create_compliance_rules(species)
            logger.info(f"📋 Created {len(compliance)} compliance rules")
            
            # Summary
            logger.info("=" * 60)
            logger.info("🎉 EXOTIC LIVESTOCK EXPANSION COMPLETED SUCCESSFULLY!")
            logger.info(f"   📁 Categories: {len(categories)}")
            logger.info(f"   🏷️  Product Types: {len(product_types)}")
            logger.info(f"   🦌 Species: {len(species)}")
            logger.info(f"   🧬 Breeds: {len(breeds)}")
            logger.info(f"   📋 Compliance Rules: {len(compliance)}")
            logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Expansion failed: {e}")
            return False
        
        finally:
            await self.close()

# Run the expansion
async def main():
    expansion = ExoticLivestockExpansion()
    success = await expansion.run_expansion()
    
    if success:
        print("\n🎉 Exotic livestock database expansion completed successfully!")
        print("StockLot now supports comprehensive exotic livestock trading!")
    else:
        print("\n❌ Expansion failed. Check logs for details.")
        return 1
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))