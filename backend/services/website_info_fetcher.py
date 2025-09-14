"""
🌐 Website Information Fetcher Service
Real-time scraping of StockLot website for accurate chatbot responses
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import re

logger = logging.getLogger(__name__)

class WebsiteInfoFetcher:
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = None
        self.cached_info = {}
        self.cache_expiry = {}
        
    async def setup_session(self):
        """Initialize HTTP session"""
        headers = {
            'User-Agent': 'StockLot-ChatBot/1.0 (Internal Knowledge Fetcher)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
        
        timeout = aiohttp.ClientTimeout(total=15)
        self.session = aiohttp.ClientSession(headers=headers, timeout=timeout)
    
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    async def get_marketplace_categories(self) -> Dict[str, Any]:
        """Fetch current marketplace categories from website"""
        try:
            if not self.session:
                await self.setup_session()
            
            # Check cache (5 minute expiry)
            cache_key = "marketplace_categories"
            if self._is_cached_valid(cache_key, 300):  # 5 minutes
                return self.cached_info[cache_key]
            
            async with self.session.get(f"{self.base_url}/marketplace") as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    categories = {
                        "categories_found": [],
                        "listings_count": 0,
                        "available_species": [],
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Extract category information
                    category_cards = soup.find_all(['div', 'card'], class_=re.compile(r'.*[Cc]ategory.*|.*[Cc]ard.*'))
                    for card in category_cards:
                        category_text = card.get_text().strip()
                        
                        # Look for livestock categories
                        if any(keyword in category_text.lower() for keyword in ['poultry', 'chicken', '🐓']):
                            categories["categories_found"].append({
                                "name": "Poultry",
                                "icon": "🐓",
                                "includes": ["chickens", "ducks", "turkeys", "geese", "ostriches"],
                                "available": True
                            })
                        elif any(keyword in category_text.lower() for keyword in ['ruminant', 'cattle', 'goat', '🐄']):
                            categories["categories_found"].append({
                                "name": "Ruminants", 
                                "icon": "🐄",
                                "includes": ["cattle", "goats", "sheep", "buffalo"],
                                "available": True
                            })
                        elif any(keyword in category_text.lower() for keyword in ['aquaculture', 'fish', '🐟']):
                            categories["categories_found"].append({
                                "name": "Aquaculture",
                                "icon": "🐟", 
                                "includes": ["fish farming", "fingerlings", "prawns", "aquatic livestock"],
                                "available": True
                            })
                        elif any(keyword in category_text.lower() for keyword in ['rabbit', '🐰']):
                            categories["categories_found"].append({
                                "name": "Rabbits",
                                "icon": "🐰",
                                "includes": ["rabbits", "small livestock"],
                                "available": True
                            })
                        elif any(keyword in category_text.lower() for keyword in ['other', 'small', 'livestock', '🕊️']):
                            categories["categories_found"].append({
                                "name": "Other Small Livestock",
                                "icon": "🕊️",
                                "includes": ["pigs", "exotic animals", "game animals"],
                                "available": True
                            })
                    
                    # Extract total listings count
                    listings_text = soup.get_text()
                    listings_match = re.search(r'(\d+)\s+Total\s+Listings', listings_text, re.IGNORECASE)
                    if listings_match:
                        categories["listings_count"] = int(listings_match.group(1))
                    
                    # If we found categories, assume comprehensive livestock marketplace
                    if categories["categories_found"]:
                        categories["comprehensive_marketplace"] = True
                        categories["supports_aquaculture"] = any(cat["name"] == "Aquaculture" for cat in categories["categories_found"])
                        categories["supports_game_meat"] = True  # Inferred from Other Small Livestock
                    
                    self._cache_result(cache_key, categories)
                    return categories
                    
        except Exception as e:
            logger.error(f"Error fetching marketplace categories: {e}")
            
        # Fallback with known categories
        return {
            "categories_found": [
                {"name": "Poultry", "icon": "🐓", "includes": ["chickens", "ducks", "turkeys"], "available": True},
                {"name": "Ruminants", "icon": "🐄", "includes": ["cattle", "goats", "sheep"], "available": True},
                {"name": "Aquaculture", "icon": "🐟", "includes": ["fish farming", "fingerlings", "prawns"], "available": True},
                {"name": "Other Small Livestock", "icon": "🕊️", "includes": ["pigs", "game animals"], "available": True}
            ],
            "comprehensive_marketplace": True,
            "supports_aquaculture": True,
            "supports_game_meat": True,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "source": "fallback_known_categories"
        }
    
    async def get_current_listings(self, category: str = None) -> Dict[str, Any]:
        """Fetch current listings to verify what's actually available"""
        try:
            if not self.session:
                await self.setup_session()
            
            cache_key = f"listings_{category or 'all'}"
            if self._is_cached_valid(cache_key, 180):  # 3 minutes
                return self.cached_info[cache_key]
            
            # Fetch listings from API
            api_url = f"{self.base_url}/api/listings"
            if category:
                api_url += f"?category={category}"
                
            async with self.session.get(api_url) as response:
                if response.status == 200:
                    listings_data = await response.json()
                    
                    listings_info = {
                        "total_count": len(listings_data) if isinstance(listings_data, list) else 0,
                        "categories_present": set(),
                        "species_present": set(),
                        "sample_listings": [],
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }
                    
                    if isinstance(listings_data, list):
                        for listing in listings_data[:10]:  # Sample first 10
                            if isinstance(listing, dict):
                                # Extract category/species info
                                if listing.get('species'):
                                    listings_info["species_present"].add(listing['species'].lower())
                                if listing.get('category'):
                                    listings_info["categories_present"].add(listing['category'].lower())
                                
                                # Add sample listing
                                listings_info["sample_listings"].append({
                                    "title": listing.get('title', 'Unknown'),
                                    "species": listing.get('species', 'Unknown'),
                                    "description": listing.get('description', '')[:100] + '...' if listing.get('description') else ''
                                })
                    
                    # Convert sets to lists for JSON serialization
                    listings_info["categories_present"] = list(listings_info["categories_present"])
                    listings_info["species_present"] = list(listings_info["species_present"])
                    
                    # Check for aquaculture/fish
                    has_fish = any(species in ['fish', 'trout', 'tilapia', 'salmon', 'carp'] 
                                 for species in listings_info["species_present"])
                    has_aquaculture = 'aquaculture' in listings_info["categories_present"]
                    listings_info["aquaculture_confirmed"] = has_fish or has_aquaculture
                    
                    # Check for game/exotic
                    has_game = any(species in ['kudu', 'springbok', 'eland', 'ostrich', 'venison'] 
                                 for species in listings_info["species_present"])
                    listings_info["game_meat_confirmed"] = has_game
                    
                    self._cache_result(cache_key, listings_info)
                    return listings_info
                    
        except Exception as e:
            logger.error(f"Error fetching current listings: {e}")
        
        return {"total_count": 0, "categories_present": [], "species_present": [], "last_updated": datetime.now(timezone.utc).isoformat()}
    
    async def get_platform_features(self) -> Dict[str, Any]:
        """Fetch platform features and capabilities"""
        try:
            if not self.session:
                await self.setup_session()
                
            cache_key = "platform_features"
            if self._is_cached_valid(cache_key, 600):  # 10 minutes
                return self.cached_info[cache_key]
            
            async with self.session.get(f"{self.base_url}/marketplace") as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    features = {
                        "payment_methods": [],
                        "delivery_options": [],
                        "support_channels": [],
                        "security_features": [],
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }
                    
                    page_text = soup.get_text().lower()
                    
                    # Extract payment features
                    if 'escrow' in page_text:
                        features["payment_methods"].append("Secure Escrow Payments")
                    if 'bank' in page_text:
                        features["payment_methods"].append("South African Banks")
                    if 'buyer protection' in page_text:
                        features["security_features"].append("Buyer Protection")
                    
                    # Extract delivery features  
                    if 'delivery' in page_text:
                        features["delivery_options"].append("Livestock Transport")
                    if 'nationwide' in page_text:
                        features["delivery_options"].append("Nationwide Delivery")
                    
                    # Support channels (NEVER include contact details in response)
                    features["support_channels"] = ["In-app messaging", "Platform support system"]
                    
                    self._cache_result(cache_key, features)
                    return features
                    
        except Exception as e:
            logger.error(f"Error fetching platform features: {e}")
        
        return {
            "payment_methods": ["Secure Escrow Payments", "South African Banks"],
            "delivery_options": ["Livestock Transport", "Nationwide Delivery"], 
            "support_channels": ["In-app messaging", "Platform support system"],
            "security_features": ["Buyer Protection", "Seller Verification"],
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "source": "fallback"
        }
    
    async def get_comprehensive_info(self, query: str) -> Dict[str, Any]:
        """Get comprehensive information based on user query"""
        try:
            # Get all relevant information
            categories = await self.get_marketplace_categories()
            listings = await self.get_current_listings()
            features = await self.get_platform_features()
            
            comprehensive_info = {
                "marketplace_categories": categories,
                "current_listings": listings,
                "platform_features": features,
                "query_context": query.lower(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Add query-specific insights
            query_lower = query.lower()
            
            if any(word in query_lower for word in ['fish', 'aquaculture', 'fingerling']):
                comprehensive_info["query_specific"] = {
                    "topic": "aquaculture",
                    "confirmed_available": categories.get("supports_aquaculture", True),
                    "evidence": "Aquaculture category present in marketplace",
                    "recommendation": "Browse Aquaculture category or create Buy Request for fish farming needs"
                }
            elif any(word in query_lower for word in ['game', 'kudu', 'springbok', 'venison']):
                comprehensive_info["query_specific"] = {
                    "topic": "game_meat", 
                    "confirmed_available": categories.get("supports_game_meat", True),
                    "evidence": "Game animals supported through Other Small Livestock and approved processors",
                    "recommendation": "Browse Game/Exotic category or create Buy Request for game meat from approved processors"
                }
            elif any(word in query_lower for word in ['wild pig', 'boar']):
                comprehensive_info["query_specific"] = {
                    "topic": "wild_pigs",
                    "clarification_needed": True,
                    "options": ["Processed meat from approved processors", "Domestic pig breeding stock"],
                    "recommendation": "Clarify if you need processed wild pig meat or domestic pig breeding stock"
                }
            
            return comprehensive_info
            
        except Exception as e:
            logger.error(f"Error getting comprehensive info: {e}")
            return {"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}
    
    def _is_cached_valid(self, key: str, max_age_seconds: int) -> bool:
        """Check if cached data is still valid"""
        if key not in self.cached_info or key not in self.cache_expiry:
            return False
        
        expiry_time = self.cache_expiry[key]
        return datetime.now(timezone.utc) < expiry_time
    
    def _cache_result(self, key: str, data: Dict[str, Any], max_age_seconds: int = 300):
        """Cache result with expiry time"""
        self.cached_info[key] = data
        self.cache_expiry[key] = datetime.now(timezone.utc).replace(microsecond=0) + \
                               datetime.timedelta(seconds=max_age_seconds)
        
        logger.info(f"Cached website info for key: {key}")