"""
Recommendation Service - AI-Powered Livestock Recommendations
"""

from typing import List, Dict, Any, Optional
from models_expansion import RecommendationItem, SearchRecommendations
import uuid

class RecommendationService:
    def __init__(self):
        self.name = "RecommendationService"
        # Mock recommendation data
        self.sample_listings = [
            {
                "listing_id": str(uuid.uuid4()),
                "title": "Premium Angus Bulls - Elite Genetics",
                "price": 28000.0,
                "seller_name": "Highland Cattle Ranch",
                "category": "cattle",
                "keywords": ["angus", "bulls", "breeding", "genetics"]
            },
            {
                "listing_id": str(uuid.uuid4()),
                "title": "Free Range Broiler Chickens - Certified Organic",
                "price": 220.0,
                "seller_name": "Green Valley Poultry",
                "category": "poultry",
                "keywords": ["broiler", "chickens", "organic", "free-range"]
            },
            {
                "listing_id": str(uuid.uuid4()),
                "title": "Boer Goat Does - High Yield Breeding Stock",
                "price": 4200.0,
                "seller_name": "Mountain View Goats",
                "category": "goats",
                "keywords": ["boer", "goats", "breeding", "does"]
            },
            {
                "listing_id": str(uuid.uuid4()),
                "title": "Dorper Sheep Rams - Pure Breed",
                "price": 3500.0,
                "seller_name": "Sunshine Sheep Farm",
                "category": "sheep",
                "keywords": ["dorper", "sheep", "rams", "breeding"]
            },
            {
                "listing_id": str(uuid.uuid4()),
                "title": "Layer Hens - High Production Rhode Island Reds",
                "price": 180.0,
                "seller_name": "Countryside Poultry",
                "category": "poultry",
                "keywords": ["layer", "hens", "rhode island", "eggs"]
            }
        ]
    
    async def get_similar_listings(
        self, 
        listing_id: str, 
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> List[RecommendationItem]:
        """Get listings similar to the specified listing."""
        
        # Mock similarity algorithm
        current_listing = await self._get_listing_details(listing_id)
        if not current_listing:
            return []
        
        similar_listings = []
        
        for listing in self.sample_listings:
            if listing["listing_id"] == listing_id:
                continue
            
            # Calculate similarity score based on category and keywords
            similarity_score = self._calculate_similarity(current_listing, listing)
            
            if similarity_score > 0.3:  # Threshold for similarity
                reason = self._get_similarity_reason(current_listing, listing)
                
                similar_listings.append(RecommendationItem(
                    listing_id=listing["listing_id"],
                    title=listing["title"],
                    price=listing["price"],
                    seller_name=listing["seller_name"],
                    similarity_score=similarity_score,
                    reason=reason
                ))
        
        # Sort by similarity score
        similar_listings.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return similar_listings[:limit]
    
    async def get_recommendations_for_user(
        self,
        user_id: str,
        limit: int = 20
    ) -> SearchRecommendations:
        """Get personalized recommendations for a user."""
        
        # Mock user preferences - in production, analyze user behavior
        user_preferences = await self._get_user_preferences(user_id)
        
        # Similar listings based on user history
        similar_listings = await self._get_user_based_recommendations(user_id, limit // 4)
        
        # Popular in user's preferred categories
        popular_in_category = await self._get_popular_in_categories(
            user_preferences.get("preferred_categories", ["cattle", "poultry"]),
            limit // 4
        )
        
        # Recently viewed (mock)
        recently_viewed = await self._get_recently_viewed_recommendations(user_id, limit // 4)
        
        # Price range matches
        price_range_matches = await self._get_price_range_recommendations(
            user_preferences.get("price_range", [1000, 10000]),
            limit // 4
        )
        
        return SearchRecommendations(
            similar_listings=similar_listings,
            popular_in_category=popular_in_category,
            recently_viewed=recently_viewed,
            price_range_matches=price_range_matches
        )
    
    async def get_trending_listings(self, category: Optional[str] = None, limit: int = 10) -> List[RecommendationItem]:
        """Get currently trending listings."""
        
        trending_listings = []
        listings_to_check = self.sample_listings
        
        if category:
            listings_to_check = [l for l in listings_to_check if l["category"] == category]
        
        for listing in listings_to_check:
            # Mock trending score
            trending_score = self._calculate_trending_score(listing)
            
            trending_listings.append(RecommendationItem(
                listing_id=listing["listing_id"],
                title=listing["title"],
                price=listing["price"],
                seller_name=listing["seller_name"],
                similarity_score=trending_score,
                reason="trending"
            ))
        
        # Sort by trending score
        trending_listings.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return trending_listings[:limit]
    
    async def _get_listing_details(self, listing_id: str) -> Optional[Dict[str, Any]]:
        """Get listing details by ID."""
        
        for listing in self.sample_listings:
            if listing["listing_id"] == listing_id:
                return listing
        
        return None
    
    def _calculate_similarity(self, listing1: Dict[str, Any], listing2: Dict[str, Any]) -> float:
        """Calculate similarity score between two listings."""
        
        score = 0.0
        
        # Category match
        if listing1["category"] == listing2["category"]:
            score += 0.5
        
        # Keyword overlap
        keywords1 = set(listing1["keywords"])
        keywords2 = set(listing2["keywords"])
        keyword_overlap = len(keywords1.intersection(keywords2)) / len(keywords1.union(keywords2))
        score += keyword_overlap * 0.3
        
        # Price similarity (closer prices = higher similarity)
        price_diff = abs(listing1["price"] - listing2["price"])
        max_price = max(listing1["price"], listing2["price"])
        price_similarity = 1 - (price_diff / max_price)
        score += price_similarity * 0.2
        
        return min(score, 1.0)
    
    def _get_similarity_reason(self, listing1: Dict[str, Any], listing2: Dict[str, Any]) -> str:
        """Get reason for similarity."""
        
        if listing1["category"] == listing2["category"]:
            return f"similar_{listing1['category']}"
        
        keywords1 = set(listing1["keywords"])
        keywords2 = set(listing2["keywords"])
        common_keywords = keywords1.intersection(keywords2)
        
        if common_keywords:
            return f"similar_keywords_{list(common_keywords)[0]}"
        
        return "price_range"
    
    async def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences based on history."""
        
        # Mock user preferences
        return {
            "preferred_categories": ["cattle", "poultry"],
            "price_range": [1000, 15000],
            "preferred_sellers": ["Highland Cattle Ranch", "Green Valley Poultry"],
            "keywords": ["breeding", "organic", "premium"]
        }
    
    async def _get_user_based_recommendations(self, user_id: str, limit: int) -> List[RecommendationItem]:
        """Get recommendations based on user behavior."""
        
        recommendations = []
        
        for listing in self.sample_listings[:limit]:
            recommendations.append(RecommendationItem(
                listing_id=listing["listing_id"],
                title=listing["title"],
                price=listing["price"],
                seller_name=listing["seller_name"],
                similarity_score=0.8,
                reason="user_history"
            ))
        
        return recommendations
    
    async def _get_popular_in_categories(self, categories: List[str], limit: int) -> List[RecommendationItem]:
        """Get popular listings in specified categories."""
        
        recommendations = []
        
        for listing in self.sample_listings:
            if listing["category"] in categories and len(recommendations) < limit:
                recommendations.append(RecommendationItem(
                    listing_id=listing["listing_id"],
                    title=listing["title"],
                    price=listing["price"],
                    seller_name=listing["seller_name"],
                    similarity_score=0.7,
                    reason=f"popular_in_{listing['category']}"
                ))
        
        return recommendations
    
    async def _get_recently_viewed_recommendations(self, user_id: str, limit: int) -> List[RecommendationItem]:
        """Get recommendations based on recently viewed items."""
        
        recommendations = []
        
        for listing in self.sample_listings[:limit]:
            recommendations.append(RecommendationItem(
                listing_id=listing["listing_id"],
                title=listing["title"],
                price=listing["price"],
                seller_name=listing["seller_name"],
                similarity_score=0.6,
                reason="recently_viewed"
            ))
        
        return recommendations
    
    async def _get_price_range_recommendations(self, price_range: List[float], limit: int) -> List[RecommendationItem]:
        """Get recommendations within user's price range."""
        
        min_price, max_price = price_range
        recommendations = []
        
        for listing in self.sample_listings:
            if min_price <= listing["price"] <= max_price and len(recommendations) < limit:
                recommendations.append(RecommendationItem(
                    listing_id=listing["listing_id"],
                    title=listing["title"],
                    price=listing["price"],
                    seller_name=listing["seller_name"],
                    similarity_score=0.5,
                    reason="price_range_match"
                ))
        
        return recommendations
    
    def _calculate_trending_score(self, listing: Dict[str, Any]) -> float:
        """Calculate trending score for a listing."""
        
        import random
        # Mock trending algorithm
        base_score = random.uniform(0.3, 0.9)
        
        # Boost score for certain categories
        if listing["category"] in ["cattle", "poultry"]:
            base_score += 0.1
        
        return min(base_score, 1.0)