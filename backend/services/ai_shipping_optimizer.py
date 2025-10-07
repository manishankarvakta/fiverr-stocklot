# AI-Powered Shipping Rate Optimization Service
# Uses OpenAI to provide intelligent shipping rate suggestions and analytics

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import openai
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class AIShippingOptimizer:
    """AI-powered shipping rate optimization and analytics service"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.openai_client = None
        self.enabled = False
        
        # Initialize OpenAI client
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        if api_key:
            try:
                self.openai_client = AsyncOpenAI(api_key=api_key)
                self.enabled = True
                logger.info("✅ AI Shipping Optimizer initialized with OpenAI integration")
            except Exception as e:
                logger.error(f"❌ Failed to initialize OpenAI client: {e}")
                self.enabled = False
        else:
            logger.warning("⚠️ No OpenAI API key found - AI shipping features disabled")
    
    async def suggest_optimal_rates(
        self, 
        seller_id: str, 
        seller_location: Dict[str, Any],
        historical_data: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate AI-powered shipping rate suggestions based on location, market data, and competition"""
        
        if not self.enabled:
            return {
                "success": False,
                "error": "AI service not available",
                "fallback_suggestions": self._get_fallback_rates(seller_location)
            }
        
        try:
            # Gather market intelligence
            market_data = await self._gather_market_intelligence(seller_location)
            competitor_rates = await self._analyze_competitor_rates(seller_location)
            delivery_patterns = await self._analyze_delivery_patterns(seller_id)
            
            # Create AI prompt with comprehensive context
            prompt = self._build_rate_suggestion_prompt(
                seller_location, market_data, competitor_rates, 
                delivery_patterns, historical_data
            )
            
            # Get AI suggestions
            response = await self._get_openai_suggestions(prompt)
            
            # Parse and validate suggestions
            suggestions = self._parse_ai_suggestions(response)
            
            # Add market-based insights
            insights = await self._generate_pricing_insights(
                suggestions, market_data, competitor_rates
            )
            
            return {
                "success": True,
                "suggestions": suggestions,
                "insights": insights,
                "market_data": market_data,
                "confidence_score": self._calculate_confidence_score(suggestions, market_data),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error generating AI shipping suggestions: {e}")
            return {
                "success": False,
                "error": str(e),
                "fallback_suggestions": self._get_fallback_rates(seller_location)
            }
    
    async def analyze_shipping_performance(
        self, 
        seller_id: str, 
        timeframe_days: int = 30
    ) -> Dict[str, Any]:
        """AI analysis of shipping performance and optimization recommendations"""
        
        if not self.enabled:
            return {"success": False, "error": "AI service not available"}
        
        try:
            # Gather performance data
            performance_data = await self._gather_performance_metrics(seller_id, timeframe_days)
            customer_feedback = await self._gather_shipping_feedback(seller_id, timeframe_days)
            cost_analysis = await self._analyze_shipping_costs(seller_id, timeframe_days)
            
            # Create AI analysis prompt
            prompt = self._build_performance_analysis_prompt(
                performance_data, customer_feedback, cost_analysis
            )
            
            # Get AI analysis
            response = await self._get_openai_analysis(prompt)
            analysis = self._parse_performance_analysis(response)
            
            # Generate actionable recommendations
            recommendations = await self._generate_optimization_recommendations(
                analysis, performance_data
            )
            
            return {
                "success": True,
                "performance_analysis": analysis,
                "recommendations": recommendations,
                "metrics": performance_data,
                "cost_insights": cost_analysis,
                "improvement_score": self._calculate_improvement_potential(analysis),
                "analyzed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error analyzing shipping performance: {e}")
            return {"success": False, "error": str(e)}
    
    async def predict_delivery_demand(
        self, 
        seller_location: Dict[str, Any], 
        time_horizon_days: int = 30
    ) -> Dict[str, Any]:
        """AI-powered delivery demand prediction and capacity planning"""
        
        if not self.enabled:
            return {"success": False, "error": "AI service not available"}
        
        try:
            # Gather demand data
            historical_demand = await self._gather_demand_history(seller_location, 90)
            seasonal_patterns = await self._analyze_seasonal_patterns(seller_location)
            market_trends = await self._analyze_market_trends(seller_location)
            
            # Create prediction prompt
            prompt = self._build_demand_prediction_prompt(
                historical_demand, seasonal_patterns, market_trends, time_horizon_days
            )
            
            # Get AI predictions
            response = await self._get_openai_predictions(prompt)
            predictions = self._parse_demand_predictions(response)
            
            # Generate capacity recommendations
            capacity_plan = await self._generate_capacity_recommendations(
                predictions, historical_demand
            )
            
            return {
                "success": True,
                "demand_predictions": predictions,
                "capacity_recommendations": capacity_plan,
                "seasonal_insights": seasonal_patterns,
                "confidence_level": self._calculate_prediction_confidence(predictions),
                "predicted_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error predicting delivery demand: {e}")
            return {"success": False, "error": str(e)}
    
    # Private helper methods
    
    async def _gather_market_intelligence(self, location: Dict) -> Dict:
        """Gather market intelligence for pricing context"""
        try:
            # Query regional shipping rates from database
            region_rates = await self.db.seller_delivery_rates.find({
                "province": location.get("province"),
                "is_active": True
            }).to_list(100)
            
            # Calculate market averages
            if region_rates:
                avg_base_fee = sum(r.get("base_fee_cents", 0) for r in region_rates) / len(region_rates)
                avg_per_km = sum(r.get("per_km_cents", 0) for r in region_rates) / len(region_rates)
                max_km_ranges = [r.get("max_km", 0) for r in region_rates]
                
                return {
                    "regional_average_base_fee_cents": int(avg_base_fee),
                    "regional_average_per_km_cents": int(avg_per_km),
                    "typical_max_range_km": max(max_km_ranges) if max_km_ranges else 200,
                    "sample_size": len(region_rates),
                    "province": location.get("province")
                }
            
            return {
                "regional_average_base_fee_cents": 2000,  # R20 default
                "regional_average_per_km_cents": 150,     # R1.50 default
                "typical_max_range_km": 200,
                "sample_size": 0,
                "province": location.get("province")
            }
            
        except Exception as e:
            logger.error(f"Error gathering market intelligence: {e}")
            return {}
    
    async def _analyze_competitor_rates(self, location: Dict) -> Dict:
        """Analyze competitor shipping rates in the area"""
        try:
            # Find nearby sellers within 50km (simplified for demo)
            nearby_rates = await self.db.seller_delivery_rates.find({
                "is_active": True
            }).limit(20).to_list(20)
            
            if nearby_rates:
                rates = [r.get("per_km_cents", 0) for r in nearby_rates if r.get("per_km_cents", 0) > 0]
                if rates:
                    return {
                        "min_rate_per_km_cents": min(rates),
                        "max_rate_per_km_cents": max(rates),
                        "median_rate_per_km_cents": sorted(rates)[len(rates)//2],
                        "competitive_range": {
                            "low": min(rates),
                            "high": max(rates)
                        }
                    }
            
            return {
                "min_rate_per_km_cents": 100,  # R1.00
                "max_rate_per_km_cents": 250,  # R2.50
                "median_rate_per_km_cents": 150, # R1.50
                "competitive_range": {"low": 100, "high": 250}
            }
            
        except Exception as e:
            logger.error(f"Error analyzing competitor rates: {e}")
            return {}
    
    async def _analyze_delivery_patterns(self, seller_id: str) -> Dict:
        """Analyze historical delivery patterns for the seller"""
        try:
            # Query delivery history (simplified for demo)
            recent_deliveries = await self.db.orders.find({
                "seller_id": seller_id,
                "status": {"$in": ["delivered", "completed"]},
                "created_at": {"$gte": datetime.now() - timedelta(days=90)}
            }).to_list(100)
            
            if recent_deliveries:
                distances = []
                costs = []
                for delivery in recent_deliveries:
                    if delivery.get("delivery_distance_km"):
                        distances.append(delivery["delivery_distance_km"])
                    if delivery.get("delivery_cost_cents"):
                        costs.append(delivery["delivery_cost_cents"])
                
                return {
                    "avg_delivery_distance_km": sum(distances) / len(distances) if distances else 50,
                    "max_delivery_distance_km": max(distances) if distances else 100,
                    "total_deliveries": len(recent_deliveries),
                    "avg_delivery_cost_cents": sum(costs) / len(costs) if costs else 3000
                }
            
            return {
                "avg_delivery_distance_km": 50,
                "max_delivery_distance_km": 100,
                "total_deliveries": 0,
                "avg_delivery_cost_cents": 3000
            }
            
        except Exception as e:
            logger.error(f"Error analyzing delivery patterns: {e}")
            return {}
    
    def _build_rate_suggestion_prompt(
        self, location: Dict, market_data: Dict, 
        competitor_rates: Dict, delivery_patterns: Dict, 
        historical_data: Optional[List] = None
    ) -> str:
        """Build AI prompt for shipping rate suggestions"""
        
        return f"""You are an expert livestock shipping rate consultant for South African farmers. 
        Generate optimal shipping rate recommendations based on the following data:

        SELLER LOCATION:
        - Province: {location.get('province', 'Unknown')}
        - Region: {location.get('address', 'Unknown')}

        MARKET INTELLIGENCE:
        - Regional average base fee: R{market_data.get('regional_average_base_fee_cents', 2000)/100:.2f}
        - Regional average per-km rate: R{market_data.get('regional_average_per_km_cents', 150)/100:.2f}
        - Typical delivery range: {market_data.get('typical_max_range_km', 200)}km
        - Market sample size: {market_data.get('sample_size', 0)} sellers

        COMPETITOR ANALYSIS:
        - Lowest competitor rate: R{competitor_rates.get('min_rate_per_km_cents', 100)/100:.2f}/km
        - Highest competitor rate: R{competitor_rates.get('max_rate_per_km_cents', 250)/100:.2f}/km
        - Median market rate: R{competitor_rates.get('median_rate_per_km_cents', 150)/100:.2f}/km

        DELIVERY PATTERNS:
        - Average delivery distance: {delivery_patterns.get('avg_delivery_distance_km', 50)}km
        - Maximum distance delivered: {delivery_patterns.get('max_delivery_distance_km', 100)}km
        - Total deliveries completed: {delivery_patterns.get('total_deliveries', 0)}

        Please provide shipping rate recommendations in the following JSON format:
        {{
            "recommended_rates": {{
                "conservative": {{
                    "base_fee_cents": <amount>,
                    "per_km_cents": <amount>,
                    "min_km": <distance>,
                    "max_km": <distance>,
                    "reasoning": "<explanation>"
                }},
                "competitive": {{
                    "base_fee_cents": <amount>,
                    "per_km_cents": <amount>,
                    "min_km": <distance>,
                    "max_km": <distance>,
                    "reasoning": "<explanation>"
                }},
                "premium": {{
                    "base_fee_cents": <amount>,
                    "per_km_cents": <amount>,
                    "min_km": <distance>,
                    "max_km": <distance>,
                    "reasoning": "<explanation>"
                }}
            }},
            "market_positioning": "<conservative|competitive|premium>",
            "key_insights": [
                "<insight 1>",
                "<insight 2>",
                "<insight 3>"
            ],
            "optimization_tips": [
                "<tip 1>",
                "<tip 2>",
                "<tip 3>"
            ]
        }}
        
        Consider factors like:
        - Livestock transport requires specialized handling
        - South African fuel costs and road conditions
        - Seasonal demand variations
        - Customer willingness to pay for quality service
        - Competitive positioning without underpricing
        """
    
    async def _get_openai_suggestions(self, prompt: str) -> str:
        """Get AI suggestions from OpenAI"""
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert shipping and logistics consultant specializing in agricultural markets in South Africa. Provide data-driven, practical recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def _parse_ai_suggestions(self, response: str) -> Dict:
        """Parse AI response into structured suggestions"""
        try:
            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            # Fallback parsing if JSON not found
            return self._parse_fallback_suggestions(response)
            
        except Exception as e:
            logger.error(f"Error parsing AI suggestions: {e}")
            return self._get_default_suggestions()
    
    def _get_fallback_rates(self, location: Dict) -> Dict:
        """Provide fallback rate suggestions when AI is unavailable"""
        province = location.get('province', 'Unknown')
        
        # Basic rate suggestions based on province
        base_rates = {
            'Gauteng': {'base': 2500, 'per_km': 180, 'max_km': 300},
            'Western Cape': {'base': 2000, 'per_km': 160, 'max_km': 250},
            'KwaZulu-Natal': {'base': 2200, 'per_km': 170, 'max_km': 250},
        }
        
        rates = base_rates.get(province, {'base': 2000, 'per_km': 150, 'max_km': 200})
        
        return {
            "conservative": {
                "base_fee_cents": rates['base'] - 500,
                "per_km_cents": rates['per_km'] - 20,
                "min_km": 0,
                "max_km": rates['max_km'],
                "reasoning": "Conservative pricing for market entry"
            },
            "competitive": {
                "base_fee_cents": rates['base'],
                "per_km_cents": rates['per_km'],
                "min_km": 0,
                "max_km": rates['max_km'],
                "reasoning": "Market-competitive pricing"
            },
            "premium": {
                "base_fee_cents": rates['base'] + 500,
                "per_km_cents": rates['per_km'] + 30,
                "min_km": 0,
                "max_km": rates['max_km'] + 50,
                "reasoning": "Premium service positioning"
            }
        }
    
    def _get_default_suggestions(self) -> Dict:
        """Default suggestions when parsing fails"""
        return {
            "recommended_rates": {
                "conservative": {
                    "base_fee_cents": 1500,
                    "per_km_cents": 120,
                    "min_km": 0,
                    "max_km": 200,
                    "reasoning": "Conservative market entry pricing"
                },
                "competitive": {
                    "base_fee_cents": 2000,
                    "per_km_cents": 150,
                    "min_km": 0,
                    "max_km": 250,
                    "reasoning": "Standard competitive market rates"
                },
                "premium": {
                    "base_fee_cents": 2500,
                    "per_km_cents": 200,
                    "min_km": 0,
                    "max_km": 300,
                    "reasoning": "Premium service with extended range"
                }
            },
            "market_positioning": "competitive",
            "key_insights": [
                "Market rates vary significantly by region",
                "Livestock transport requires specialized handling",
                "Customer service quality affects pricing power"
            ],
            "optimization_tips": [
                "Consider volume discounts for large orders",
                "Optimize routes to reduce costs",
                "Build customer relationships for repeat business"
            ]
        }
    
    async def _generate_pricing_insights(
        self, suggestions: Dict, market_data: Dict, competitor_rates: Dict
    ) -> Dict:
        """Generate additional pricing insights"""
        return {
            "market_analysis": {
                "position_vs_market": "competitive",
                "potential_revenue_impact": "positive",
                "risk_assessment": "low"
            },
            "demand_forecast": {
                "expected_volume": "moderate",
                "seasonal_adjustments": "consider 10-15% increase during calving season"
            },
            "competitive_advantage": [
                "Livestock expertise",
                "Reliable delivery",
                "Transparent pricing"
            ]
        }
    
    def _calculate_confidence_score(self, suggestions: Dict, market_data: Dict) -> float:
        """Calculate confidence score for suggestions"""
        base_score = 0.7
        
        # Increase confidence with market data
        if market_data.get('sample_size', 0) > 5:
            base_score += 0.2
        
        # Increase confidence if suggestions are reasonable
        if suggestions.get('recommended_rates'):
            base_score += 0.1
        
        return min(base_score, 1.0)

    # Additional method stubs for comprehensive service
    async def _gather_performance_metrics(self, seller_id: str, days: int) -> Dict:
        """Gather shipping performance metrics"""
        return {"on_time_delivery_rate": 0.85, "customer_satisfaction": 4.2}
    
    async def _gather_shipping_feedback(self, seller_id: str, days: int) -> Dict:
        """Gather customer feedback on shipping"""
        return {"avg_rating": 4.2, "common_complaints": ["delivery time"], "praise_points": ["care"]}
    
    async def _analyze_shipping_costs(self, seller_id: str, days: int) -> Dict:
        """Analyze shipping cost patterns"""
        return {"avg_cost_per_km": 1.5, "fuel_cost_trend": "increasing"}
        
    def _build_performance_analysis_prompt(self, performance: Dict, feedback: Dict, costs: Dict) -> str:
        """Build prompt for performance analysis"""
        return "Analyze shipping performance and provide recommendations..."
    
    async def _get_openai_analysis(self, prompt: str) -> str:
        """Get performance analysis from OpenAI"""
        return await self._get_openai_suggestions(prompt)
    
    def _parse_performance_analysis(self, response: str) -> Dict:
        """Parse performance analysis response"""
        return {"strengths": [], "weaknesses": [], "opportunities": []}
    
    async def _generate_optimization_recommendations(self, analysis: Dict, performance: Dict) -> List[Dict]:
        """Generate optimization recommendations"""
        return [{"action": "optimize routes", "impact": "high", "effort": "medium"}]
    
    def _calculate_improvement_potential(self, analysis: Dict) -> float:
        """Calculate improvement potential score"""
        return 0.75
    
    def _parse_fallback_suggestions(self, response: str) -> Dict:
        """Parse suggestions when JSON parsing fails"""
        return self._get_default_suggestions()
    
    async def _gather_demand_history(self, location: Dict, days: int) -> Dict:
        """Gather historical demand data"""
        return {"weekly_average": 15, "peak_demand": 25, "low_demand": 5}
    
    async def _analyze_seasonal_patterns(self, location: Dict) -> Dict:
        """Analyze seasonal delivery patterns"""
        return {"peak_months": ["March", "September"], "low_months": ["June", "December"]}
    
    async def _analyze_market_trends(self, location: Dict) -> Dict:
        """Analyze market trends affecting delivery"""
        return {"growth_rate": 0.15, "emerging_areas": ["online sales"]}
    
    def _build_demand_prediction_prompt(self, historical: Dict, seasonal: Dict, trends: Dict, days: int) -> str:
        """Build demand prediction prompt"""
        return f"Predict delivery demand for {days} days based on historical data..."
    
    async def _get_openai_predictions(self, prompt: str) -> str:
        """Get demand predictions from OpenAI"""
        return await self._get_openai_suggestions(prompt)
    
    def _parse_demand_predictions(self, response: str) -> Dict:
        """Parse demand prediction response"""
        return {"daily_demand": [10, 12, 8, 15, 20], "confidence_intervals": []}
    
    async def _generate_capacity_recommendations(self, predictions: Dict, historical: Dict) -> Dict:
        """Generate capacity planning recommendations"""
        return {"recommended_capacity": 20, "peak_capacity_needed": 30, "cost_optimization": []}
    
    def _calculate_prediction_confidence(self, predictions: Dict) -> float:
        """Calculate prediction confidence level"""
        return 0.8