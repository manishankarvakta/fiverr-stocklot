"""
🐾 EXOTIC LIVESTOCK SERVICE
Service for managing exotic and specialty livestock operations including
taxonomy, compliance checks, and permit validation.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ExoticLivestockService:
    def __init__(self, db):
        self.db = db
        
    async def get_exotic_categories(self) -> List[Dict[str, Any]]:
        """Get all exotic livestock categories"""
        try:
            # Get exotic categories (categories created by expansion)
            exotic_category_names = [
                "Game Animals",
                "Large Flightless Birds", 
                "Camelids & Exotic Ruminants",
                "Specialty Avian",
                "Aquaculture Exotic",
                "Specialty Small Mammals"
            ]
            
            cursor = self.db.category_groups.find({
                "name": {"$in": exotic_category_names}
            })
            
            categories = await cursor.to_list(length=None)
            
            # Clean MongoDB _id fields
            for category in categories:
                if "_id" in category:
                    del category["_id"]
            
            return categories
            
        except Exception as e:
            logger.error(f"Error fetching exotic categories: {e}")
            return []
    
    async def get_exotic_species(self, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get exotic species, optionally filtered by category"""
        try:
            filter_query = {"is_exotic": True}
            
            if category_id:
                filter_query["category_group_id"] = category_id
            
            cursor = self.db.species.find(filter_query)
            species = await cursor.to_list(length=None)
            
            # Clean MongoDB _id fields
            for sp in species:
                if "_id" in sp:
                    del sp["_id"]
            
            return species
            
        except Exception as e:
            logger.error(f"Error fetching exotic species: {e}")
            return []
    
    async def get_species_compliance_requirements(self, species_id: str, country_code: str = "ZA") -> List[Dict[str, Any]]:
        """Get compliance requirements for a specific species"""
        try:
            cursor = self.db.compliance_rules.find({
                "species_id": species_id,
                "country_code": country_code
            })
            
            requirements = await cursor.to_list(length=None)
            
            # Clean MongoDB _id fields
            for req in requirements:
                if "_id" in req:
                    del req["_id"]
            
            return requirements
            
        except Exception as e:
            logger.error(f"Error fetching compliance requirements: {e}")
            return []
    
    async def get_valid_product_types_for_species(self, species_name: str) -> List[Dict[str, Any]]:
        """Get valid product types for a specific species"""
        try:
            # First get the species to find its category
            species_doc = await self.db.species.find_one({"name": species_name})
            if not species_doc:
                return []
            
            # Get the category
            category_doc = await self.db.category_groups.find_one({"id": species_doc["category_group_id"]})
            if not category_doc:
                return []
            
            category_name = category_doc["name"]
            
            # Get product types applicable to this category
            cursor = self.db.product_types.find({
                "applicable_to_groups": {"$in": [category_name]}
            })
            
            product_types = await cursor.to_list(length=None)
            
            # Add general product types that apply to all live animals
            general_cursor = self.db.product_types.find({
                "code": {"$in": ["LIVE", "BREEDING_STOCK"]}
            })
            
            general_types = await general_cursor.to_list(length=None)
            product_types.extend(general_types)
            
            # Clean MongoDB _id fields and remove duplicates
            seen_codes = set()
            cleaned_types = []
            
            for pt in product_types:
                if "_id" in pt:
                    del pt["_id"]
                
                if pt["code"] not in seen_codes:
                    seen_codes.add(pt["code"])
                    cleaned_types.append(pt)
            
            return cleaned_types
            
        except Exception as e:
            logger.error(f"Error fetching valid product types: {e}")
            return []
    
    async def validate_exotic_listing(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate exotic livestock listing and return compliance info"""
        try:
            species_name = listing_data.get("species")
            if not species_name:
                return {"valid": False, "error": "Species is required"}
            
            # Get species info
            species_doc = await self.db.species.find_one({"name": species_name})
            if not species_doc:
                return {"valid": False, "error": f"Species '{species_name}' not found"}
            
            validation_result = {
                "valid": True,
                "species_info": {
                    "name": species_doc["name"],
                    "is_exotic": species_doc.get("is_exotic", False),
                    "is_game": species_doc.get("is_game", False),
                    "permit_required": species_doc.get("permit_required", False)
                },
                "compliance_requirements": [],
                "warnings": [],
                "recommendations": []
            }
            
            # Get compliance requirements
            requirements = await self.get_species_compliance_requirements(species_doc["id"])
            validation_result["compliance_requirements"] = requirements
            
            # Add warnings for permit-required species
            if species_doc.get("permit_required"):
                validation_result["warnings"].append(
                    f"Live trade of {species_name} requires special permits and compliance documentation"
                )
            
            # Add recommendations for game animals
            if species_doc.get("is_game"):
                validation_result["recommendations"].append(
                    f"Game farming of {species_name} must comply with provincial wildlife regulations"
                )
                validation_result["recommendations"].append(
                    "Ensure proper containment facilities and veterinary oversight"
                )
            
            # Validate product type compatibility
            product_type = listing_data.get("product_type")
            if product_type:
                valid_types = await self.get_valid_product_types_for_species(species_name)
                valid_codes = [pt["code"] for pt in valid_types]
                
                if product_type not in valid_codes:
                    validation_result["valid"] = False
                    validation_result["error"] = f"Product type '{product_type}' not valid for {species_name}. Valid types: {', '.join(valid_codes)}"
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating exotic listing: {e}")
            return {"valid": False, "error": f"Validation error: {str(e)}"}
    
    async def get_exotic_species_statistics(self) -> Dict[str, Any]:
        """Get statistics about exotic species in the system"""
        try:
            # Count by category
            pipeline = [
                {"$match": {"is_exotic": True}},
                {"$lookup": {
                    "from": "category_groups",
                    "localField": "category_group_id",
                    "foreignField": "id",
                    "as": "category"
                }},
                {"$unwind": "$category"},
                {"$group": {
                    "_id": "$category.name",
                    "count": {"$sum": 1},
                    "species": {"$push": "$name"}
                }}
            ]
            
            cursor = self.db.species.aggregate(pipeline)
            category_stats = await cursor.to_list(length=None)
            
            # Total exotic species count
            total_exotic = await self.db.species.count_documents({"is_exotic": True})
            
            # Game species count
            game_species = await self.db.species.count_documents({"is_game": True})
            
            # Permit-required species count
            permit_required = await self.db.species.count_documents({"permit_required": True})
            
            statistics = {
                "total_exotic_species": total_exotic,
                "game_species_count": game_species,
                "permit_required_count": permit_required,
                "by_category": {}
            }
            
            for stat in category_stats:
                statistics["by_category"][stat["_id"]] = {
                    "count": stat["count"],
                    "species": stat["species"]
                }
            
            return statistics
            
        except Exception as e:
            logger.error(f"Error getting exotic species statistics: {e}")
            return {"error": str(e)}
    
    async def search_exotic_species(self, query: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search exotic species with optional filters"""
        try:
            search_filter = {"is_exotic": True}
            
            # Add text search
            if query:
                search_filter["$or"] = [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            
            # Add additional filters
            if filters:
                if filters.get("is_game"):
                    search_filter["is_game"] = True
                
                if filters.get("permit_required"):
                    search_filter["permit_required"] = True
                
                if filters.get("category_id"):
                    search_filter["category_group_id"] = filters["category_id"]
                
                if filters.get("is_edible") is not None:
                    search_filter["is_edible"] = filters["is_edible"]
            
            cursor = self.db.species.find(search_filter)
            species = await cursor.to_list(length=None)
            
            # Clean MongoDB _id fields and add category info
            for sp in species:
                if "_id" in sp:
                    del sp["_id"]
                
                # Add category name
                if sp.get("category_group_id"):
                    category_doc = await self.db.category_groups.find_one({"id": sp["category_group_id"]})
                    if category_doc:
                        sp["category_name"] = category_doc["name"]
            
            return species
            
        except Exception as e:
            logger.error(f"Error searching exotic species: {e}")
            return []
    
    async def get_exotic_breeding_recommendations(self, species_name: str) -> Dict[str, Any]:
        """Get breeding recommendations for exotic species"""
        try:
            species_doc = await self.db.species.find_one({"name": species_name})
            if not species_doc:
                return {"error": f"Species '{species_name}' not found"}
            
            # Get breeds for this species
            cursor = self.db.breeds.find({"species_id": species_doc["id"]})
            breeds = await cursor.to_list(length=None)
            
            recommendations = {
                "species": species_name,
                "available_breeds": [],
                "breeding_notes": [],
                "regulatory_considerations": []
            }
            
            # Add breed info
            for breed in breeds:
                if "_id" in breed:
                    del breed["_id"]
                recommendations["available_breeds"].append({
                    "name": breed["name"],
                    "characteristics": breed.get("characteristics", ""),
                    "origin_country": breed.get("origin_country", "")
                })
            
            # Add species-specific breeding notes
            if species_doc.get("is_game"):
                recommendations["breeding_notes"].append(
                    "Game species require specialized containment and veterinary care"
                )
                recommendations["breeding_notes"].append(
                    "Breeding stock must be sourced from registered game farms"
                )
            
            if species_doc.get("permit_required"):
                recommendations["regulatory_considerations"].append(
                    "Breeding operations require permits and regular inspections"
                )
                recommendations["regulatory_considerations"].append(
                    "Offspring registration may be required for conservation tracking"
                )
            
            # Get compliance requirements
            requirements = await self.get_species_compliance_requirements(species_doc["id"])
            for req in requirements:
                recommendations["regulatory_considerations"].append(
                    f"{req['requirement_code']}: {req['notes']}"
                )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting breeding recommendations: {e}")
            return {"error": str(e)}