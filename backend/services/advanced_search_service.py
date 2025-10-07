# Advanced Search Service with AI Intelligence
from typing import Dict, List, Any, Optional, Tuple
import re
import json
from datetime import datetime, timedelta
# Note: Core models like Listing, Species, ProductType are defined in server.py
# We'll work with database documents directly instead of importing models
from services.ai_enhanced_service import AIEnhancedService
import motor.motor_asyncio
import asyncio
from bson import ObjectId

class AdvancedSearchService:
    """
    Advanced search service with AI-powered features:
    - Semantic search with natural language queries
    - Visual search by image similarity
    - Smart filter suggestions
    - Predictive search with auto-complete
    - Market intelligence integration
    """
    
    def __init__(self, db, ai_service: AIEnhancedService):
        self.db = db
        self.ai_service = ai_service
        self.search_analytics = {}
        
    async def semantic_search(self, query: str, user_context: Dict = None) -> Dict[str, Any]:
        """
        AI-powered semantic search that understands natural language
        Examples: 
        - "young dairy cows near johannesburg under 5000"
        - "grass-fed beef cattle ready for slaughter"
        - "disease-free chickens for egg production"
        """
        try:
            # Parse natural language query using AI
            search_intent = await self.ai_service.parse_search_query(query)
            
            # Build MongoDB aggregation pipeline based on AI understanding
            pipeline = await self._build_semantic_pipeline(search_intent, user_context)
            
            # Execute search with scoring
            listings = await self.db.listings.aggregate(pipeline).to_list(50)
            
            # AI-powered result ranking
            ranked_results = await self._rank_search_results(listings, search_intent, user_context)
            
            # Generate search insights
            insights = await self._generate_search_insights(query, ranked_results)
            
            return {
                'results': ranked_results,
                'total_count': len(ranked_results),
                'search_intent': search_intent,
                'insights': insights,
                'suggestions': await self._get_search_suggestions(query, user_context)
            }
            
        except Exception as e:
            print(f"Error in semantic search: {str(e)}")
            # Fallback to basic search
            return await self.basic_search(query)
    
    async def visual_search(self, image_data: bytes, similarity_threshold: float = 0.7) -> Dict[str, Any]:
        """
        Search for similar livestock by image using computer vision
        """
        try:
            # Use AI service for image analysis
            image_features = await self.ai_service.analyze_livestock_image(image_data)
            
            # Find similar listings based on visual features
            similar_listings = await self._find_visually_similar(image_features, similarity_threshold)
            
            return {
                'results': similar_listings,
                'image_analysis': image_features,
                'similarity_scores': [item.get('similarity_score', 0) for item in similar_listings]
            }
            
        except Exception as e:
            print(f"Error in visual search: {str(e)}")
            return {'results': [], 'error': str(e)}
    
    async def smart_autocomplete(self, partial_query: str, user_context: Dict = None) -> List[Dict[str, Any]]:
        """
        AI-powered autocomplete with context awareness
        """
        try:
            # Get user's search history and preferences
            user_history = await self._get_user_search_history(user_context)
            
            # Generate intelligent suggestions
            suggestions = []
            
            # 1. Popular searches
            popular = await self._get_popular_searches(partial_query)
            suggestions.extend([{
                'text': item,
                'type': 'popular',
                'icon': '🔥'
            } for item in popular])
            
            # 2. Personalized suggestions based on history
            personalized = await self._get_personalized_suggestions(partial_query, user_history)
            suggestions.extend([{
                'text': item,
                'type': 'personalized',
                'icon': '⭐'
            } for item in personalized])
            
            # 3. AI-generated completions
            ai_suggestions = await self.ai_service.generate_search_completions(partial_query)
            suggestions.extend([{
                'text': item,
                'type': 'ai_generated',
                'icon': '🤖'
            } for item in ai_suggestions])
            
            # 4. Location-based suggestions
            if user_context and user_context.get('location'):
                location_suggestions = await self._get_location_suggestions(partial_query, user_context['location'])
                suggestions.extend([{
                    'text': item,
                    'type': 'location',
                    'icon': '📍'
                } for item in location_suggestions])
            
            return suggestions[:10]  # Return top 10 suggestions
            
        except Exception as e:
            print(f"Error in smart autocomplete: {str(e)}")
            return []
    
    async def intelligent_filters(self, base_query: str, current_results: List[Dict]) -> Dict[str, Any]:
        """
        Generate smart filter suggestions based on search results and AI analysis
        """
        try:
            # Analyze current results to suggest relevant filters
            filter_analysis = await self._analyze_results_for_filters(current_results)
            
            # AI-powered filter suggestions
            smart_filters = {
                'price_ranges': await self._suggest_price_ranges(current_results),
                'locations': await self._suggest_locations(current_results, base_query),
                'breeds': await self._suggest_breeds(current_results),
                'characteristics': await self._suggest_characteristics(current_results, base_query),
                'age_groups': await self._suggest_age_groups(current_results),
                'quantity_ranges': await self._suggest_quantity_ranges(current_results)
            }
            
            # Add AI reasoning for each suggestion
            for filter_type, options in smart_filters.items():
                for option in options:
                    if isinstance(option, dict):
                        option['ai_reasoning'] = await self.ai_service.explain_filter_suggestion(
                            filter_type, option, base_query
                        )
            
            return {
                'suggested_filters': smart_filters,
                'filter_insights': filter_analysis,
                'application_tips': await self._get_filter_application_tips(base_query)
            }
            
        except Exception as e:
            print(f"Error generating intelligent filters: {str(e)}")
            return {}
    
    async def predictive_search(self, user_context: Dict) -> Dict[str, Any]:
        """
        Predict what user might be looking for based on behavior, trends, and AI
        """
        try:
            predictions = {}
            
            # 1. Seasonal predictions
            seasonal = await self._get_seasonal_predictions()
            predictions['seasonal'] = seasonal
            
            # 2. User behavior predictions
            user_predictions = await self._predict_user_interests(user_context)
            predictions['personalized'] = user_predictions
            
            # 3. Market trend predictions
            market_trends = await self._predict_market_trends()
            predictions['market_trends'] = market_trends
            
            # 4. Location-based predictions
            if user_context.get('location'):
                location_predictions = await self._predict_local_interests(user_context['location'])
                predictions['local'] = location_predictions
            
            # 5. AI-powered general predictions
            ai_predictions = await self.ai_service.predict_search_interests(user_context)
            predictions['ai_insights'] = ai_predictions
            
            return {
                'predictions': predictions,
                'confidence_scores': await self._calculate_prediction_confidence(predictions),
                'actionable_suggestions': await self._convert_predictions_to_actions(predictions)
            }
            
        except Exception as e:
            print(f"Error in predictive search: {str(e)}")
            return {}
    
    async def search_analytics_insights(self, query: str, user_context: Dict = None) -> Dict[str, Any]:
        """
        Provide real-time analytics and insights about search query
        """
        try:
            insights = {}
            
            # Market insights for the search
            insights['market_overview'] = await self._get_market_insights(query)
            
            # Price trends for searched items
            insights['price_trends'] = await self._get_price_trends(query)
            
            # Availability insights
            insights['availability'] = await self._get_availability_insights(query)
            
            # Competition analysis
            insights['competition'] = await self._get_competition_insights(query, user_context)
            
            # Timing recommendations
            insights['timing'] = await self._get_timing_recommendations(query)
            
            # Alternative suggestions
            insights['alternatives'] = await self._get_alternative_suggestions(query)
            
            return {
                'insights': insights,
                'generated_at': datetime.utcnow().isoformat(),
                'data_freshness': 'real-time'
            }
            
        except Exception as e:
            print(f"Error generating search analytics: {str(e)}")
            return {}
    
    # Helper methods
    async def _build_semantic_pipeline(self, search_intent: Dict, user_context: Dict) -> List[Dict]:
        """Build MongoDB aggregation pipeline from AI-parsed search intent"""
        pipeline = []
        
        # Base match stage
        match_stage = {"$match": {"status": "active"}}
        
        # Add filters based on AI understanding
        if search_intent.get('species'):
            match_stage["$match"]["species_name"] = {"$regex": search_intent['species'], "$options": "i"}
        
        if search_intent.get('location'):
            match_stage["$match"]["$or"] = [
                {"seller_province": {"$regex": search_intent['location'], "$options": "i"}},
                {"seller_city": {"$regex": search_intent['location'], "$options": "i"}}
            ]
        
        if search_intent.get('price_range'):
            min_price = search_intent['price_range'].get('min', 0)
            max_price = search_intent['price_range'].get('max', float('inf'))
            match_stage["$match"]["price_per_unit"] = {"$gte": min_price, "$lte": max_price}
        
        if search_intent.get('age_preference'):
            # Handle age-related queries
            age_keywords = search_intent['age_preference']
            if 'young' in age_keywords.lower():
                match_stage["$match"]["description"] = {"$regex": "young|calf|kid|chick", "$options": "i"}
        
        pipeline.append(match_stage)
        
        # Add scoring stage for relevance
        pipeline.append({
            "$addFields": {
                "relevance_score": {
                    "$add": [
                        {"$cond": [{"$regexMatch": {"input": "$title", "regex": search_intent.get('keywords', ''), "options": "i"}}, 10, 0]},
                        {"$cond": [{"$regexMatch": {"input": "$description", "regex": search_intent.get('keywords', ''), "options": "i"}}, 5, 0]},
                        {"$cond": [{"$eq": ["$listing_type", "buy_now"]}, 3, 0]}
                    ]
                }
            }
        })
        
        # Sort by relevance
        pipeline.append({"$sort": {"relevance_score": -1, "created_at": -1}})
        
        return pipeline
    
    async def _rank_search_results(self, listings: List[Dict], search_intent: Dict, user_context: Dict) -> List[Dict]:
        """Use AI to rank search results based on relevance and user context"""
        try:
            ranked_listings = []
            
            for listing in listings:
                # Calculate AI-powered relevance score
                ai_score = await self.ai_service.calculate_listing_relevance(
                    listing, search_intent, user_context
                )
                
                listing['ai_relevance_score'] = ai_score
                listing['ranking_factors'] = await self._explain_ranking(listing, search_intent)
                ranked_listings.append(listing)
            
            # Sort by AI relevance score
            ranked_listings.sort(key=lambda x: x.get('ai_relevance_score', 0), reverse=True)
            
            return ranked_listings
            
        except Exception as e:
            print(f"Error ranking results: {str(e)}")
            return listings
    
    async def _generate_search_insights(self, query: str, results: List[Dict]) -> Dict[str, Any]:
        """Generate insights about the search results"""
        if not results:
            return {
                'message': 'No results found. Try broadening your search criteria.',
                'suggestions': ['Remove specific breed requirements', 'Expand location radius', 'Adjust price range']
            }
        
        insights = {}
        
        # Price analysis
        prices = [r.get('price_per_unit', 0) for r in results if r.get('price_per_unit')]
        if prices:
            insights['price_analysis'] = {
                'average': sum(prices) / len(prices),
                'min': min(prices),
                'max': max(prices),
                'price_distribution': 'varied' if max(prices) > min(prices) * 2 else 'consistent'
            }
        
        # Location distribution
        locations = [r.get('seller_province') for r in results if r.get('seller_province')]
        location_counts = {}
        for loc in locations:
            location_counts[loc] = location_counts.get(loc, 0) + 1
        insights['location_distribution'] = location_counts
        
        # Availability trends
        insights['availability'] = {
            'total_listings': len(results),
            'immediate_availability': len([r for r in results if r.get('quantity', 0) > 0]),
            'variety_score': len(set([r.get('breed_name', 'Unknown') for r in results]))
        }
        
        return insights
    
    async def _get_search_suggestions(self, query: str, user_context: Dict) -> List[str]:
        """Generate related search suggestions"""
        suggestions = []
        
        # Add related species suggestions
        suggestions.extend([
            f"{query} with veterinary certificates",
            f"{query} near me",
            f"{query} for breeding",
            f"{query} bulk quantities"
        ])
        
        return suggestions[:5]
    
    async def basic_search(self, query: str) -> Dict[str, Any]:
        """Fallback basic search when AI search fails"""
        try:
            # Simple text search across listings
            regex_query = {"$regex": query, "$options": "i"}
            search_filter = {
                "$or": [
                    {"title": regex_query},
                    {"description": regex_query},
                    {"species_name": regex_query},
                    {"breed_name": regex_query}
                ],
                "status": "active"
            }
            
            listings = await self.db.listings.find(search_filter).limit(20).to_list(20)
            
            return {
                'results': listings,
                'total_count': len(listings),
                'search_type': 'basic'
            }
            
        except Exception as e:
            print(f"Error in basic search: {str(e)}")
            return {'results': [], 'error': str(e)}