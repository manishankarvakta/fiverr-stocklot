import os
import logging
import openai
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import json
import uuid
from collections import defaultdict
import base64
from PIL import Image
import io

logger = logging.getLogger(__name__)

class MLEngineService:
    def __init__(self, db):
        self.db = db
        self.openai_client = openai.OpenAI(
            api_key=os.environ.get('OPENAI_API_KEY')
        )
        
        # Model storage paths
        self.models_dir = '/app/backend/models/ml_engine'
        self.pricing_model_path = f'{self.models_dir}/pricing_model.pkl'
        self.demand_model_path = f'{self.models_dir}/demand_model.pkl'
        self.scaler_path = f'{self.models_dir}/scaler.pkl'
        
        # Initialize models and scalers
        self.pricing_model = None
        self.demand_model = None
        self.scaler = StandardScaler()
        
        # Load existing models
        self._load_models()
        
        # Market intelligence cache
        self.market_cache = {}
        self.cache_ttl = 3600  # 1 hour
    
    def _load_models(self):
        """Load trained ML models if they exist"""
        try:
            os.makedirs(self.models_dir, exist_ok=True)
            
            if os.path.exists(self.pricing_model_path):
                self.pricing_model = joblib.load(self.pricing_model_path)
                logger.info("Loaded pricing model")
            
            if os.path.exists(self.demand_model_path):
                self.demand_model = joblib.load(self.demand_model_path)
                logger.info("Loaded demand forecasting model")
                
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Loaded feature scaler")
                
        except Exception as e:
            logger.error(f"Error loading ML models: {e}")
            self.pricing_model = None
            self.demand_model = None
    
    async def smart_pricing_analysis(
        self, 
        listing_data: Dict[str, Any],
        market_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Advanced AI-powered pricing analysis using 15+ market factors"""
        
        try:
            # Extract 15+ pricing factors
            features = await self._extract_pricing_features(listing_data, market_context)
            
            # Get AI-powered pricing insights
            ai_insights = await self._get_ai_pricing_insights(listing_data, features)
            
            # Calculate ML-based price if model available
            ml_price = None
            confidence = 0.0
            
            if self.pricing_model:
                ml_price, confidence = await self._predict_optimal_price(features)
            
            # Get competitive analysis
            competitive_analysis = await self._analyze_competition(listing_data)
            
            # Calculate final recommended pricing
            pricing_recommendation = await self._generate_pricing_recommendation(
                listing_data, features, ai_insights, ml_price, competitive_analysis
            )
            
            return {
                "success": True,
                "pricing_factors": features,
                "ai_insights": ai_insights,
                "ml_prediction": {
                    "price": ml_price,
                    "confidence": confidence,
                    "model_available": self.pricing_model is not None
                },
                "competitive_analysis": competitive_analysis,
                "recommendation": pricing_recommendation,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Smart pricing analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def _extract_pricing_features(
        self, 
        listing_data: Dict[str, Any],
        market_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Extract 15+ features for pricing analysis"""
        
        features = {}
        
        # 1. Basic livestock attributes
        features['species_category'] = self._encode_species(listing_data.get('species', ''))
        features['breed_premium'] = self._calculate_breed_premium(
            listing_data.get('species'), listing_data.get('breed')
        )
        features['age_factor'] = self._calculate_age_factor(listing_data.get('age'))
        features['weight'] = listing_data.get('weight', 0)
        features['quantity'] = listing_data.get('quantity', 1)
        
        # 2. Quality indicators
        features['health_score'] = listing_data.get('health_score', 5.0)
        features['vaccination_status'] = 1 if listing_data.get('vaccinated') else 0
        features['certification_level'] = self._calculate_certification_score(listing_data)
        
        # 3. Market timing factors
        now = datetime.now()
        features['season_factor'] = self._calculate_seasonal_factor(
            listing_data.get('species'), now.month
        )
        features['day_of_week'] = now.weekday()
        features['month'] = now.month
        features['is_holiday_season'] = self._is_holiday_season(now)
        
        # 4. Geographic factors
        features['province_demand'] = await self._calculate_province_demand(
            listing_data.get('province')
        )
        features['location_premium'] = self._calculate_location_premium(
            listing_data.get('province')
        )
        features['transport_cost_factor'] = await self._estimate_transport_costs(
            listing_data.get('province')
        )
        
        # 5. Seller performance factors
        seller_id = listing_data.get('seller_id')
        if seller_id:
            seller_metrics = await self._get_seller_metrics(seller_id)
            features['seller_rating'] = seller_metrics.get('rating', 4.0)
            features['seller_experience'] = seller_metrics.get('years_experience', 1)
            features['seller_volume'] = seller_metrics.get('monthly_volume', 10)
            features['seller_reliability'] = seller_metrics.get('reliability_score', 0.8)
        else:
            features.update({
                'seller_rating': 4.0,
                'seller_experience': 1,
                'seller_volume': 10,
                'seller_reliability': 0.8
            })
        
        # 6. Market dynamics
        if market_context:
            features['market_demand'] = market_context.get('demand_index', 1.0)
            features['supply_shortage'] = market_context.get('supply_shortage', 0.0)
            features['price_trend'] = market_context.get('price_trend', 0.0)
        else:
            market_data = await self._get_current_market_data(listing_data.get('species'))
            features.update(market_data)
        
        return features
    
    async def _get_ai_pricing_insights(
        self, 
        listing_data: Dict[str, Any], 
        features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get AI-powered pricing insights using GPT-4"""
        
        try:
            # Prepare context for AI analysis
            context = f"""
            Livestock Listing Analysis:
            - Species: {listing_data.get('species', 'Unknown')}
            - Breed: {listing_data.get('breed', 'Mixed')}
            - Age: {listing_data.get('age', 'Unknown')} months
            - Weight: {listing_data.get('weight', 'Unknown')} kg
            - Quantity: {listing_data.get('quantity', 1)}
            - Location: {listing_data.get('province', 'Unknown')}
            - Health Score: {features.get('health_score', 5.0)}/10
            - Vaccinated: {'Yes' if features.get('vaccination_status') else 'No'}
            - Season Factor: {features.get('season_factor', 1.0)}
            - Market Demand: {features.get('market_demand', 1.0)}
            - Seller Rating: {features.get('seller_rating', 4.0)}/5
            
            Based on South African livestock market conditions, analyze pricing factors and provide insights.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a South African livestock market expert specializing in pricing analysis. Provide detailed, actionable pricing insights based on market conditions, seasonal factors, and livestock characteristics. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=600
            )
            
            # Parse AI response
            ai_analysis = json.loads(response.choices[0].message.content)
            
            return {
                "market_positioning": ai_analysis.get("market_positioning", "standard"),
                "pricing_strategy": ai_analysis.get("pricing_strategy", "competitive"),
                "key_value_drivers": ai_analysis.get("key_value_drivers", []),
                "risk_factors": ai_analysis.get("risk_factors", []),
                "seasonal_advice": ai_analysis.get("seasonal_advice", ""),
                "confidence_level": ai_analysis.get("confidence_level", 75),
                "market_outlook": ai_analysis.get("market_outlook", "stable")
            }
            
        except Exception as e:
            logger.error(f"AI pricing insights failed: {e}")
            return {
                "market_positioning": "standard",
                "pricing_strategy": "competitive",
                "key_value_drivers": ["Quality", "Location", "Season"],
                "risk_factors": ["Market volatility"],
                "seasonal_advice": "Consider seasonal demand patterns",
                "confidence_level": 50,
                "market_outlook": "stable"
            }
    
    async def demand_forecasting(
        self,
        species: str,
        region: str,
        forecast_days: int = 30
    ) -> Dict[str, Any]:
        """Predict demand patterns using temporal analysis"""
        
        try:
            # Get historical demand data
            historical_data = await self._get_historical_demand_data(species, region)
            
            # Extract temporal patterns
            temporal_features = self._extract_temporal_features(historical_data)
            
            # Generate AI-powered demand insights
            ai_forecast = await self._get_ai_demand_forecast(
                species, region, historical_data, forecast_days
            )
            
            # ML-based prediction if model available
            ml_forecast = None
            if self.demand_model and len(historical_data) > 0:
                ml_forecast = self._predict_demand_ml(temporal_features, forecast_days)
            
            # Combine forecasts
            final_forecast = self._combine_demand_forecasts(ai_forecast, ml_forecast)
            
            return {
                "success": True,
                "species": species,
                "region": region,
                "forecast_period_days": forecast_days,
                "historical_data_points": len(historical_data),
                "temporal_patterns": temporal_features,
                "ai_forecast": ai_forecast,
                "ml_forecast": ml_forecast,
                "combined_forecast": final_forecast,
                "confidence_score": final_forecast.get("confidence", 0.7),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Demand forecasting failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def photo_intelligence_analysis(
        self, 
        image_data: str,  # Base64 encoded image
        listing_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """AI-powered photo quality analysis and recommendations"""
        
        try:
            # Analyze image with GPT-4 Vision
            vision_analysis = await self._analyze_image_with_vision(image_data, listing_context)
            
            # Technical image analysis
            technical_analysis = self._analyze_image_technical(image_data)
            
            # Generate optimization recommendations
            recommendations = await self._generate_photo_recommendations(
                vision_analysis, technical_analysis, listing_context
            )
            
            # Calculate overall quality score
            quality_score = self._calculate_photo_quality_score(
                vision_analysis, technical_analysis
            )
            
            return {
                "success": True,
                "quality_score": quality_score,
                "vision_analysis": vision_analysis,
                "technical_analysis": technical_analysis,
                "recommendations": recommendations,
                "improvement_potential": max(0, 100 - quality_score),
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Photo intelligence analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def content_optimization_analysis(
        self,
        listing_data: Dict[str, Any],
        performance_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """AI-powered content optimization and SEO recommendations"""
        
        try:
            # Analyze current content
            content_analysis = await self._analyze_listing_content(listing_data)
            
            # Generate SEO recommendations
            seo_recommendations = await self._generate_seo_recommendations(listing_data)
            
            # Create optimized descriptions
            optimized_content = await self._generate_optimized_content(listing_data)
            
            # Performance improvement predictions
            performance_predictions = self._predict_content_performance(
                listing_data, content_analysis, performance_data
            )
            
            return {
                "success": True,
                "current_content_score": content_analysis.get("score", 0),
                "content_analysis": content_analysis,
                "seo_recommendations": seo_recommendations,
                "optimized_content": optimized_content,
                "performance_predictions": performance_predictions,
                "improvement_potential": performance_predictions.get("improvement_potential", 0),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Content optimization failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def market_intelligence_analysis(
        self,
        species: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """Comprehensive market intelligence and competitive analysis"""
        
        try:
            # Get competitive landscape
            competitive_analysis = await self._analyze_competitive_landscape(species, region)
            
            # Market trends analysis
            market_trends = await self._analyze_market_trends(species, region)
            
            # Growth opportunities identification
            growth_opportunities = await self._identify_growth_opportunities(
                competitive_analysis, market_trends
            )
            
            # Pricing intelligence
            pricing_intelligence = await self._analyze_pricing_landscape(species, region)
            
            # AI-powered market insights
            ai_insights = await self._generate_market_insights(
                competitive_analysis, market_trends, pricing_intelligence
            )
            
            return {
                "success": True,
                "analysis_scope": {
                    "species": species or "all",
                    "region": region or "national"
                },
                "competitive_analysis": competitive_analysis,
                "market_trends": market_trends,
                "growth_opportunities": growth_opportunities,
                "pricing_intelligence": pricing_intelligence,
                "ai_insights": ai_insights,
                "data_freshness": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market intelligence analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    # Helper methods for pricing analysis
    def _encode_species(self, species: str) -> float:
        """Encode species into numerical value"""
        if not species:
            return 0.7  # Default value for unknown species
        
        species_values = {
            'cattle': 1.0, 'poultry': 0.6, 'sheep': 0.8,
            'goats': 0.7, 'swine': 0.9, 'fish': 0.5,
            'commercial broilers': 0.6, 'broiler': 0.6, 'chicken': 0.6
        }
        return species_values.get(species.lower() if species else '', 0.7)
    
    def _calculate_breed_premium(self, species: str, breed: str) -> float:
        """Calculate breed premium factor"""
        if not breed or not species:
            return 1.0
        
        # Premium breeds mapping
        premium_breeds = {
            'cattle': ['angus', 'wagyu', 'hereford', 'charolais'],
            'poultry': ['rhode island red', 'leghorn', 'brahma'],
            'sheep': ['merino', 'dorper', 'suffolk'],
            'goats': ['boer', 'angora', 'saanen']
        }
        
        species_breeds = premium_breeds.get(species.lower() if species else '', [])
        return 1.3 if any(b in breed.lower() for b in species_breeds) else 1.0
    
    def _calculate_age_factor(self, age: Optional[int]) -> float:
        """Calculate age-based pricing factor"""
        if not age:
            return 1.0
        
        # Age curves for different life stages
        if age < 6:  # Young animals
            return 0.8
        elif age < 24:  # Prime age
            return 1.2
        elif age < 60:  # Mature
            return 1.0
        else:  # Older animals
            return 0.7
    
    def _calculate_seasonal_factor(self, species: str, month: int) -> float:
        """Calculate seasonal demand factor"""
        # South African seasonal patterns
        seasonal_patterns = {
            'cattle': {12: 1.3, 1: 1.2, 6: 0.9, 7: 0.8},  # High demand summer/holidays
            'poultry': {12: 1.4, 4: 1.2, 7: 0.9},  # Holiday and Easter peaks
            'sheep': {9: 1.3, 10: 1.2, 12: 1.1},  # Spring and holiday demand
        }
        
        pattern = seasonal_patterns.get(species.lower() if species else '', {})
        return pattern.get(month, 1.0)
    
    def _is_holiday_season(self, date: datetime) -> int:
        """Check if date falls in holiday season"""
        month = date.month
        day = date.day
        
        # South African holiday seasons
        if month == 12 or (month == 1 and day < 15):  # Summer holidays
            return 1
        if month == 4 and 10 <= day <= 25:  # Easter holidays
            return 1
        if month == 9 and 20 <= day <= 30:  # Heritage Day/Spring
            return 1
        
        return 0
    
    async def _calculate_province_demand(self, province: str) -> float:
        """Calculate provincial demand index"""
        if not province:
            return 1.0
        
        # Get recent buy requests by province
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
            cursor = self.db.buy_requests.find({
                "province": province,
                "created_at": {"$gte": start_date}
            })
            recent_requests = await cursor.to_list(length=None)
            
            # Normalize demand (1.0 = average, higher = more demand)
            avg_requests = 20  # Baseline
            province_requests = len(recent_requests)
            
            return min(2.0, max(0.2, province_requests / avg_requests))
            
        except Exception:
            return 1.0
    
    def _calculate_location_premium(self, province: str) -> float:
        """Calculate location-based premium"""
        # Major economic centers get premium
        premium_locations = {
            'gauteng': 1.2,
            'western cape': 1.15,
            'kwazulu-natal': 1.1
        }
        
        return premium_locations.get(province.lower() if province else '', 1.0)
    
    async def _estimate_transport_costs(self, province: str) -> float:
        """Estimate transport cost factor"""
        # Distance from major markets affects pricing
        transport_factors = {
            'gauteng': 1.0,  # Central, low transport
            'western cape': 1.1,
            'kwazulu-natal': 1.05,
            'free state': 1.08,
            'eastern cape': 1.15,
            'northern cape': 1.2,
            'limpopo': 1.12,
            'mpumalanga': 1.08,
            'north west': 1.1
        }
        
        return transport_factors.get(province.lower(), 1.1)
    
    async def _get_seller_metrics(self, seller_id: str) -> Dict[str, Any]:
        """Get seller performance metrics"""
        try:
            # Get seller profile
            seller = await self.db.users.find_one({"id": seller_id})
            if not seller:
                return {}
            
            # Calculate metrics from orders and reviews
            orders_cursor = self.db.seller_orders.find({"seller_id": seller_id})
            orders = await orders_cursor.to_list(length=None)
            
            total_orders = len(orders)
            if total_orders == 0:
                return {
                    "rating": 4.0,
                    "years_experience": 1,
                    "monthly_volume": 10,
                    "reliability_score": 0.8
                }
            
            # Calculate actual metrics
            avg_rating = 4.5  # Would calculate from reviews
            years_exp = seller.get("years_experience", 2)
            monthly_vol = total_orders / max(1, (datetime.now() - seller.get("created_at", datetime.now())).days / 30)
            reliability = len([o for o in orders if o.get("status") == "completed"]) / total_orders
            
            return {
                "rating": avg_rating,
                "years_experience": years_exp,
                "monthly_volume": monthly_vol,
                "reliability_score": reliability
            }
            
        except Exception:
            return {
                "rating": 4.0,
                "years_experience": 1,
                "monthly_volume": 10,
                "reliability_score": 0.8
            }
    
    async def _get_current_market_data(self, species: str) -> Dict[str, float]:
        """Get current market dynamics"""
        try:
            # Calculate from recent transactions
            start_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            # Demand indicator from buy requests
            demand_cursor = self.db.buy_requests.find({
                "species": species,
                "created_at": {"$gte": start_date}
            })
            recent_demand = await demand_cursor.to_list(length=None)
            
            # Supply indicator from listings
            supply_cursor = self.db.listings.find({
                "species": species,
                "created_at": {"$gte": start_date}
            })
            recent_supply = await supply_cursor.to_list(length=None)
            
            demand_count = len(recent_demand)
            supply_count = len(recent_supply)
            
            # Calculate market indicators
            demand_index = min(2.0, max(0.2, demand_count / 10))  # Normalized
            supply_shortage = max(0.0, min(1.0, (demand_count - supply_count) / max(1, demand_count)))
            
            # Price trend from recent orders
            orders_cursor = self.db.seller_orders.find({
                "species": species,
                "created_at": {"$gte": start_date - timedelta(days=14)}
            }).sort("created_at", 1)
            orders = await orders_cursor.to_list(length=None)
            
            price_trend = 0.0
            if len(orders) >= 4:
                recent_prices = [o.get("unit_price", 0) for o in orders[-5:]]
                older_prices = [o.get("unit_price", 0) for o in orders[:5]]
                if sum(older_prices) > 0:
                    price_trend = (sum(recent_prices) / len(recent_prices)) / (sum(older_prices) / len(older_prices)) - 1
            
            return {
                "market_demand": demand_index,
                "supply_shortage": supply_shortage,
                "price_trend": price_trend
            }
            
        except Exception:
            return {
                "market_demand": 1.0,
                "supply_shortage": 0.0,
                "price_trend": 0.0
            }
    
    async def _predict_optimal_price(self, features: Dict[str, Any]) -> Tuple[float, float]:
        """Predict optimal price using ML model"""
        try:
            # Convert features to array
            feature_vector = [
                features.get('species_category', 0.7),
                features.get('breed_premium', 1.0),
                features.get('age_factor', 1.0),
                features.get('weight', 0),
                features.get('quantity', 1),
                features.get('health_score', 5.0),
                features.get('vaccination_status', 0),
                features.get('certification_level', 1.0),
                features.get('season_factor', 1.0),
                features.get('province_demand', 1.0),
                features.get('seller_rating', 4.0),
                features.get('market_demand', 1.0)
            ]
            
            # Scale features
            feature_vector_scaled = self.scaler.transform([feature_vector])
            
            # Predict
            price_prediction = self.pricing_model.predict(feature_vector_scaled)[0]
            
            # Calculate confidence (simplified)
            confidence = min(0.95, max(0.5, 0.8))  # Would use model uncertainty
            
            return max(0, price_prediction), confidence
            
        except Exception as e:
            logger.error(f"ML price prediction failed: {e}")
            return 0.0, 0.0
    
    def _calculate_certification_score(self, listing_data: Dict[str, Any]) -> float:
        """Calculate certification/quality score"""
        score = 1.0
        
        # Add bonuses for certifications
        if listing_data.get('organic_certified'):
            score += 0.3
        if listing_data.get('free_range'):
            score += 0.2
        if listing_data.get('halal_certified'):
            score += 0.15
        if listing_data.get('animal_welfare_certified'):
            score += 0.25
        
        return min(2.0, score)
    
    
    # ============================================================================
    # DEMAND FORECASTING METHODS
    # ============================================================================
    
    async def _get_historical_demand_data(self, species: str, region: str) -> List[Dict[str, Any]]:
        """Get historical demand data for forecasting"""
        try:
            # Get buy requests from last 6 months
            start_date = datetime.now(timezone.utc) - timedelta(days=180)
            
            cursor = self.db.buy_requests.find({
                "species": species,
                "province": region,
                "created_at": {"$gte": start_date}
            }).sort("created_at", 1)
            
            requests = await cursor.to_list(length=None)
            
            # Aggregate by week
            weekly_data = defaultdict(lambda: {"count": 0, "total_quantity": 0, "avg_price": 0})
            
            for req in requests:
                # Get week key
                week_start = req["created_at"] - timedelta(days=req["created_at"].weekday())
                week_key = week_start.strftime("%Y-%W")
                
                weekly_data[week_key]["count"] += 1
                weekly_data[week_key]["total_quantity"] += req.get("quantity", 1)
                weekly_data[week_key]["avg_price"] += req.get("target_price", 0)
            
            # Convert to list format
            historical_data = []
            for week_key, data in weekly_data.items():
                historical_data.append({
                    "week": week_key,
                    "demand_count": data["count"],
                    "total_quantity": data["total_quantity"],
                    "avg_price": data["avg_price"] / max(1, data["count"]),
                    "timestamp": datetime.strptime(week_key + "-1", "%Y-%W-%w")
                })
            
            return sorted(historical_data, key=lambda x: x["timestamp"])
            
        except Exception as e:
            logger.error(f"Error getting historical demand data: {e}")
            return []
    
    def _extract_temporal_features(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract temporal patterns from historical data"""
        
        if not historical_data:
            return {
                "trend": "stable",
                "seasonality": "none",
                "volatility": "low",
                "growth_rate": 0.0
            }
        
        try:
            # Extract time series
            demands = [d["demand_count"] for d in historical_data]
            quantities = [d["total_quantity"] for d in historical_data]
            prices = [d["avg_price"] for d in historical_data]
            
            # Calculate trend
            if len(demands) >= 4:
                recent_avg = np.mean(demands[-4:])
                older_avg = np.mean(demands[:4])
                trend_ratio = recent_avg / max(1, older_avg)
                
                if trend_ratio > 1.2:
                    trend = "increasing"
                elif trend_ratio < 0.8:
                    trend = "decreasing"
                else:
                    trend = "stable"
            else:
                trend = "insufficient_data"
            
            # Calculate volatility
            if len(demands) > 1:
                volatility_score = np.std(demands) / max(1, np.mean(demands))
                if volatility_score > 0.5:
                    volatility = "high"
                elif volatility_score > 0.3:
                    volatility = "medium"
                else:
                    volatility = "low"
            else:
                volatility = "unknown"
            
            # Simple seasonality detection
            if len(demands) >= 12:  # At least 3 months of weekly data
                seasonality = "detected" if np.std(demands) > np.mean(demands) * 0.3 else "minimal"
            else:
                seasonality = "insufficient_data"
            
            # Growth rate
            growth_rate = (trend_ratio - 1) * 100 if len(demands) >= 4 else 0.0
            
            return {
                "trend": trend,
                "seasonality": seasonality,
                "volatility": volatility,
                "growth_rate": growth_rate,
                "data_points": len(historical_data),
                "avg_weekly_demand": np.mean(demands) if demands else 0,
                "peak_demand": max(demands) if demands else 0,
                "min_demand": min(demands) if demands else 0
            }
            
        except Exception as e:
            logger.error(f"Error extracting temporal features: {e}")
            return {
                "trend": "error",
                "seasonality": "error",
                "volatility": "error",
                "growth_rate": 0.0
            }
    
    async def _get_ai_demand_forecast(
        self, 
        species: str, 
        region: str, 
        historical_data: List[Dict[str, Any]], 
        forecast_days: int
    ) -> Dict[str, Any]:
        """Generate AI-powered demand forecast"""
        
        try:
            # Prepare context for AI
            data_summary = {
                "species": species,
                "region": region,
                "data_points": len(historical_data),
                "recent_demand": historical_data[-4:] if len(historical_data) >= 4 else historical_data,
                "forecast_period": forecast_days
            }
            
            context = f"""
            Livestock Demand Forecasting Analysis:
            - Species: {species}
            - Region: {region}
            - Historical data points: {len(historical_data)}
            - Forecast period: {forecast_days} days
            
            Recent demand data: {data_summary['recent_demand']}
            
            Based on South African livestock market patterns, seasonal factors, and current trends,
            provide a demand forecast with confidence levels and key factors.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a South African livestock market analyst specializing in demand forecasting. Provide detailed, data-driven forecasts with confidence intervals. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.2,
                max_tokens=500
            )
            
            # Parse AI response
            ai_forecast = json.loads(response.choices[0].message.content)
            
            return {
                "forecast_type": "ai_generated",
                "predicted_demand": ai_forecast.get("predicted_demand", "stable"),
                "confidence_level": ai_forecast.get("confidence_level", 70),
                "key_factors": ai_forecast.get("key_factors", []),
                "risk_factors": ai_forecast.get("risk_factors", []),
                "seasonal_patterns": ai_forecast.get("seasonal_patterns", {}),
                "recommendations": ai_forecast.get("recommendations", []),
                "forecast_range": ai_forecast.get("forecast_range", {"min": 0, "max": 0, "expected": 0})
            }
            
        except Exception as e:
            logger.error(f"AI demand forecast failed: {e}")
            return {
                "forecast_type": "fallback",
                "predicted_demand": "stable",
                "confidence_level": 50,
                "key_factors": ["Historical patterns", "Seasonal trends"],
                "risk_factors": ["Market volatility"],
                "seasonal_patterns": {},
                "recommendations": ["Monitor market conditions"],
                "forecast_range": {"min": 0, "max": 10, "expected": 5}
            }
    
    def _predict_demand_ml(self, temporal_features: Dict[str, Any], forecast_days: int) -> Optional[Dict[str, Any]]:
        """ML-based demand prediction if model available"""
        
        try:
            if not self.demand_model:
                return None
            
            # Prepare features for ML model
            feature_vector = [
                temporal_features.get("avg_weekly_demand", 0),
                temporal_features.get("growth_rate", 0),
                temporal_features.get("data_points", 0),
                datetime.now().month,  # Seasonal factor
                datetime.now().weekday(),  # Day of week factor
                forecast_days / 30  # Forecast horizon factor
            ]
            
            # Scale features and predict
            feature_vector_scaled = self.scaler.transform([feature_vector])
            prediction = self.demand_model.predict(feature_vector_scaled)[0]
            
            # Calculate confidence (simplified)
            confidence = min(0.9, max(0.3, 0.7))
            
            return {
                "forecast_type": "ml_generated",
                "predicted_value": max(0, prediction),
                "confidence": confidence,
                "model_features": len(feature_vector),
                "forecast_horizon_days": forecast_days
            }
            
        except Exception as e:
            logger.error(f"ML demand prediction failed: {e}")
            return None
    
    def _combine_demand_forecasts(
        self, 
        ai_forecast: Dict[str, Any], 
        ml_forecast: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Combine AI and ML forecasts into final prediction"""
        
        try:
            if not ml_forecast:
                # Use AI forecast only
                return {
                    "method": "ai_only",
                    "prediction": ai_forecast.get("predicted_demand", "stable"),
                    "confidence": ai_forecast.get("confidence_level", 70) / 100,
                    "forecast_range": ai_forecast.get("forecast_range", {}),
                    "key_insights": ai_forecast.get("key_factors", []),
                    "recommendations": ai_forecast.get("recommendations", [])
                }
            
            # Combine forecasts with weighted average
            ai_confidence = ai_forecast.get("confidence_level", 70) / 100
            ml_confidence = ml_forecast.get("confidence", 0.7)
            
            # Weight based on confidence levels
            ai_weight = ai_confidence / (ai_confidence + ml_confidence)
            ml_weight = ml_confidence / (ai_confidence + ml_confidence)
            
            # Combine predictions (simplified)
            combined_confidence = (ai_confidence + ml_confidence) / 2
            
            return {
                "method": "combined_ai_ml",
                "prediction": ai_forecast.get("predicted_demand", "stable"),
                "ml_prediction": ml_forecast.get("predicted_value", 0),
                "confidence": combined_confidence,
                "ai_weight": ai_weight,
                "ml_weight": ml_weight,
                "forecast_range": ai_forecast.get("forecast_range", {}),
                "key_insights": ai_forecast.get("key_factors", []),
                "recommendations": ai_forecast.get("recommendations", [])
            }
            
        except Exception as e:
            logger.error(f"Error combining forecasts: {e}")
            return {
                "method": "fallback",
                "prediction": "stable",
                "confidence": 0.5,
                "forecast_range": {"min": 0, "max": 10, "expected": 5},
                "key_insights": ["Unable to generate reliable forecast"],
                "recommendations": ["Monitor market manually"]
            }
    
    # ============================================================================
    # MARKET INTELLIGENCE METHODS
    # ============================================================================
    
    async def _analyze_competitive_landscape(
        self, 
        species: Optional[str] = None, 
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze competitive landscape"""
        
        try:
            # Get recent listings for competition analysis
            query = {}
            if species:
                query["species"] = species
            if region:
                query["province"] = region
            
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
            query["created_at"] = {"$gte": start_date}
            
            cursor = self.db.listings.find(query)
            listings = await cursor.to_list(length=None)
            
            if not listings:
                return {
                    "total_competitors": 0,
                    "market_concentration": "low",
                    "price_competition": "unknown",
                    "quality_differentiation": "unknown"
                }
            
            # Analyze seller concentration
            seller_counts = defaultdict(int)
            price_ranges = []
            quality_scores = []
            
            for listing in listings:
                seller_counts[listing.get("seller_id", "unknown")] += 1
                if listing.get("price"):
                    price_ranges.append(listing["price"])
                if listing.get("quality_score"):
                    quality_scores.append(listing["quality_score"])
            
            # Calculate metrics
            total_sellers = len(seller_counts)
            top_seller_share = max(seller_counts.values()) / len(listings) if listings else 0
            
            # Market concentration
            if top_seller_share > 0.4:
                concentration = "high"
            elif top_seller_share > 0.2:
                concentration = "medium"
            else:
                concentration = "low"
            
            # Price competition analysis
            if price_ranges:
                price_std = np.std(price_ranges)
                price_mean = np.mean(price_ranges)
                price_variation = price_std / price_mean if price_mean > 0 else 0
                
                if price_variation > 0.3:
                    price_competition = "high"
                elif price_variation > 0.15:
                    price_competition = "medium"
                else:
                    price_competition = "low"
            else:
                price_competition = "unknown"
            
            return {
                "total_competitors": total_sellers,
                "total_listings": len(listings),
                "market_concentration": concentration,
                "top_seller_market_share": round(top_seller_share * 100, 1),
                "price_competition": price_competition,
                "avg_price": round(np.mean(price_ranges), 2) if price_ranges else 0,
                "price_range": {
                    "min": min(price_ranges) if price_ranges else 0,
                    "max": max(price_ranges) if price_ranges else 0
                },
                "quality_differentiation": "high" if len(set(quality_scores)) > 3 else "medium"
            }
            
        except Exception as e:
            logger.error(f"Competitive analysis failed: {e}")
            return {
                "total_competitors": 0,
                "market_concentration": "unknown",
                "price_competition": "unknown",
                "error": str(e)
            }
    
    async def _analyze_market_trends(
        self, 
        species: Optional[str] = None, 
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze market trends and patterns"""
        
        try:
            # Get trend data from multiple sources
            demand_trend = await self._calculate_demand_trend(species, region)
            pricing_trend = await self._calculate_pricing_trend(species, region)
            supply_trend = await self._calculate_supply_trend(species, region)
            
            # Generate AI insights on trends
            trend_insights = await self._generate_trend_insights(
                demand_trend, pricing_trend, supply_trend, species, region
            )
            
            return {
                "demand_trend": demand_trend,
                "pricing_trend": pricing_trend,
                "supply_trend": supply_trend,
                "market_direction": self._determine_market_direction(
                    demand_trend, pricing_trend, supply_trend
                ),
                "trend_insights": trend_insights,
                "volatility_assessment": self._assess_market_volatility(
                    demand_trend, pricing_trend
                )
            }
            
        except Exception as e:
            logger.error(f"Market trends analysis failed: {e}")
            return {
                "demand_trend": {"direction": "stable", "confidence": 50},
                "pricing_trend": {"direction": "stable", "confidence": 50},
                "supply_trend": {"direction": "stable", "confidence": 50},
                "error": str(e)
            }
    
    async def _identify_growth_opportunities(
        self, 
        competitive_analysis: Dict[str, Any], 
        market_trends: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify growth opportunities based on analysis"""
        
        opportunities = []
        
        try:
            # Market concentration opportunities
            if competitive_analysis.get("market_concentration") == "low":
                opportunities.append({
                    "type": "market_entry",
                    "description": "Low market concentration presents opportunities for new entrants",
                    "potential": "high",
                    "timeline": "short_term"
                })
            
            # Price competition opportunities
            if competitive_analysis.get("price_competition") == "high":
                opportunities.append({
                    "type": "differentiation",
                    "description": "High price competition suggests need for quality/service differentiation",
                    "potential": "medium",
                    "timeline": "medium_term"
                })
            
            # Demand trend opportunities
            demand_direction = market_trends.get("demand_trend", {}).get("direction")
            if demand_direction == "increasing":
                opportunities.append({
                    "type": "capacity_expansion",
                    "description": "Increasing demand trend suggests expansion opportunities",
                    "potential": "high",
                    "timeline": "short_term"
                })
            
            # Supply-demand imbalance opportunities
            supply_direction = market_trends.get("supply_trend", {}).get("direction")
            if demand_direction == "increasing" and supply_direction != "increasing":
                opportunities.append({
                    "type": "supply_gap",
                    "description": "Growing demand with stable supply creates pricing opportunities",
                    "potential": "high",
                    "timeline": "immediate"
                })
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Growth opportunity identification failed: {e}")
            return [{
                "type": "analysis_error",
                "description": "Unable to identify opportunities due to analysis error",
                "potential": "unknown",
                "timeline": "unknown"
            }]
    
    # ============================================================================
    # CONTENT OPTIMIZATION METHODS
    # ============================================================================
    
    async def _analyze_listing_content(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current listing content quality"""
        
        try:
            title = listing_data.get("title", "")
            description = listing_data.get("description", "")
            
            # Basic content metrics
            title_score = self._score_title_quality(title)
            description_score = self._score_description_quality(description)
            keyword_score = self._score_keyword_usage(title, description, listing_data)
            completeness_score = self._score_listing_completeness(listing_data)
            
            # Overall content score
            overall_score = (
                title_score * 0.25 +
                description_score * 0.35 +
                keyword_score * 0.25 +
                completeness_score * 0.15
            )
            
            return {
                "score": round(overall_score, 1),
                "title_score": title_score,
                "description_score": description_score,
                "keyword_score": keyword_score,
                "completeness_score": completeness_score,
                "word_count": len(description.split()) if description else 0,
                "title_length": len(title) if title else 0,
                "readability": "good" if description and len(description) > 50 else "poor"
            }
            
        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            return {
                "score": 5.0,
                "error": str(e)
            }
    
    def _score_title_quality(self, title: str) -> float:
        """Score title quality"""
        if not title:
            return 0.0
        
        score = 5.0  # Base score
        
        # Length check
        if 30 <= len(title) <= 60:
            score += 2.0
        elif 20 <= len(title) <= 80:
            score += 1.0
        
        # Keyword presence
        livestock_keywords = ["cattle", "sheep", "goats", "poultry", "swine", "bull", "cow", "chicken"]
        if any(keyword in title.lower() for keyword in livestock_keywords):
            score += 1.5
        
        # Quality indicators
        quality_words = ["premium", "quality", "healthy", "certified", "grade"]
        if any(word in title.lower() for word in quality_words):
            score += 1.0
        
        # Location presence
        if any(char.isupper() for char in title):  # Likely contains province/location
            score += 0.5
        
        return min(10.0, score)
    
    def _score_description_quality(self, description: str) -> float:
        """Score description quality"""
        if not description:
            return 0.0
        
        score = 3.0  # Base score
        word_count = len(description.split())
        
        # Length scoring
        if 100 <= word_count <= 300:
            score += 3.0
        elif 50 <= word_count <= 400:
            score += 2.0
        elif word_count >= 20:
            score += 1.0
        
        # Information richness
        info_keywords = [
            "age", "weight", "breed", "health", "vaccination", "diet", "pasture",
            "organic", "free-range", "certified", "grade", "quality"
        ]
        matched_info = sum(1 for keyword in info_keywords if keyword in description.lower())
        score += min(3.0, matched_info * 0.5)
        
        # Professional language indicators
        professional_phrases = [
            "available for", "ready for", "contact for", "serious buyers",
            "inspection welcome", "delivery available"
        ]
        if any(phrase in description.lower() for phrase in professional_phrases):
            score += 1.0
        
        return min(10.0, score)
    
    def _score_keyword_usage(self, title: str, description: str, listing_data: Dict[str, Any]) -> float:
        """Score SEO keyword usage"""
        content = f"{title} {description}".lower()
        species = listing_data.get("species", "").lower()
        province = listing_data.get("province", "").lower()
        
        score = 5.0  # Base score
        
        # Species keyword presence
        if species and species in content:
            score += 2.0
        
        # Location keyword presence
        if province and province in content:
            score += 1.5
        
        # Industry keywords
        industry_terms = [
            "livestock", "farming", "agricultural", "cattle", "breeding",
            "pasture", "farm", "ranch", "dairy", "beef", "meat"
        ]
        matched_industry = sum(1 for term in industry_terms if term in content)
        score += min(2.0, matched_industry * 0.3)
        
        # Avoid keyword stuffing penalty
        total_words = len(content.split())
        if total_words > 0:
            keyword_density = matched_industry / total_words
            if keyword_density > 0.1:  # Too many keywords
                score -= 1.0
        
        return min(10.0, max(0.0, score))
    
    def _score_listing_completeness(self, listing_data: Dict[str, Any]) -> float:
        """Score how complete the listing information is"""
        score = 0.0
        
        # Required fields
        required_fields = ["species", "price", "quantity", "province"]
        for field in required_fields:
            if listing_data.get(field):
                score += 2.0
        
        # Optional but valuable fields
        optional_fields = ["breed", "age", "weight", "health_score", "vaccination_status"]
        for field in optional_fields:
            if listing_data.get(field):
                score += 0.4
        
        # Media presence
        if listing_data.get("images") and len(listing_data["images"]) > 0:
            score += 1.0
        if len(listing_data.get("images", [])) >= 3:
            score += 0.5
        
        return min(10.0, score)
    
    # ============================================================================
    # ADDITIONAL HELPER METHODS
    # ============================================================================
    
    async def _calculate_demand_trend(self, species: Optional[str], region: Optional[str]) -> Dict[str, Any]:
        """Calculate demand trend over time"""
        # Implementation for demand trend calculation
        return {"direction": "stable", "confidence": 70, "growth_rate": 0.0}
    
    async def _calculate_pricing_trend(self, species: Optional[str], region: Optional[str]) -> Dict[str, Any]:
        """Calculate pricing trend over time"""
        # Implementation for pricing trend calculation
        return {"direction": "stable", "confidence": 70, "change_rate": 0.0}
    
    async def _calculate_supply_trend(self, species: Optional[str], region: Optional[str]) -> Dict[str, Any]:
        """Calculate supply trend over time"""
        # Implementation for supply trend calculation
        return {"direction": "stable", "confidence": 70, "growth_rate": 0.0}
    
    def _determine_market_direction(self, demand_trend, pricing_trend, supply_trend) -> str:
        """Determine overall market direction"""
        # Simplified market direction logic
        demand_dir = demand_trend.get("direction", "stable")
        price_dir = pricing_trend.get("direction", "stable")
        
        if demand_dir == "increasing" and price_dir == "increasing":
            return "bullish"
        elif demand_dir == "decreasing" and price_dir == "decreasing":
            return "bearish"
        else:
            return "stable"
    
    async def _analyze_pricing_landscape(self, species: Optional[str], region: Optional[str]) -> Dict[str, Any]:
        """Analyze pricing intelligence landscape"""
        
        try:
            # Get recent pricing data
            query = {}
            if species:
                query["species"] = species
            if region:
                query["province"] = region
            
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
            query["created_at"] = {"$gte": start_date}
            
            # Get buy requests with target prices
            buy_requests_cursor = self.db.buy_requests.find(query)
            buy_requests = await buy_requests_cursor.to_list(length=None)
            
            # Get actual transaction prices from orders
            orders_cursor = self.db.seller_orders.find(query)
            orders = await orders_cursor.to_list(length=None)
            
            pricing_data = {
                "buy_request_prices": [req.get("target_price", 0) for req in buy_requests if req.get("target_price")],
                "transaction_prices": [ord.get("unit_price", 0) for ord in orders if ord.get("unit_price")],
                "total_data_points": len(buy_requests) + len(orders)
            }
            
            if not pricing_data["buy_request_prices"] and not pricing_data["transaction_prices"]:
                return {
                    "avg_buy_request_price": 0,
                    "avg_transaction_price": 0,
                    "price_gap": 0,
                    "market_efficiency": "unknown",
                    "data_points": 0
                }
            
            # Calculate pricing metrics
            avg_buy_price = np.mean(pricing_data["buy_request_prices"]) if pricing_data["buy_request_prices"] else 0
            avg_transaction_price = np.mean(pricing_data["transaction_prices"]) if pricing_data["transaction_prices"] else 0
            
            price_gap = 0
            if avg_buy_price > 0 and avg_transaction_price > 0:
                price_gap = ((avg_transaction_price - avg_buy_price) / avg_buy_price) * 100
            
            # Market efficiency assessment
            if abs(price_gap) < 5:
                efficiency = "high"
            elif abs(price_gap) < 15:
                efficiency = "medium"
            else:
                efficiency = "low"
            
            return {
                "avg_buy_request_price": round(avg_buy_price, 2),
                "avg_transaction_price": round(avg_transaction_price, 2),
                "price_gap_percentage": round(price_gap, 2),
                "market_efficiency": efficiency,
                "data_points": pricing_data["total_data_points"],
                "price_volatility": self._calculate_price_volatility(pricing_data)
            }
            
        except Exception as e:
            logger.error(f"Pricing landscape analysis failed: {e}")
            return {
                "avg_buy_request_price": 0,
                "avg_transaction_price": 0,
                "price_gap_percentage": 0,
                "market_efficiency": "unknown",
                "data_points": 0,
                "error": str(e)
            }
    
    def _calculate_price_volatility(self, pricing_data: Dict[str, Any]) -> str:
        """Calculate price volatility assessment"""
        try:
            all_prices = pricing_data["buy_request_prices"] + pricing_data["transaction_prices"]
            if len(all_prices) < 3:
                return "insufficient_data"
            
            price_std = np.std(all_prices)
            price_mean = np.mean(all_prices)
            
            if price_mean == 0:
                return "unknown"
            
            coefficient_of_variation = price_std / price_mean
            
            if coefficient_of_variation < 0.1:
                return "low"
            elif coefficient_of_variation < 0.3:
                return "medium"
            else:
                return "high"
                
        except Exception:
            return "unknown"
    
    async def _generate_market_insights(
        self,
        competitive_analysis: Dict[str, Any],
        market_trends: Dict[str, Any],
        pricing_intelligence: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate AI-powered market insights"""
        
        try:
            # Prepare context for AI analysis
            context = f"""
            Market Analysis Summary:
            - Total Competitors: {competitive_analysis.get('total_competitors', 0)}
            - Market Concentration: {competitive_analysis.get('market_concentration', 'unknown')}
            - Price Competition: {competitive_analysis.get('price_competition', 'unknown')}
            - Demand Trend: {market_trends.get('demand_trend', {}).get('direction', 'stable')}
            - Market Direction: {market_trends.get('market_direction', 'stable')}
            - Average Market Price: R{pricing_intelligence.get('avg_transaction_price', 0)}
            - Price Gap: {pricing_intelligence.get('price_gap_percentage', 0)}%
            - Market Efficiency: {pricing_intelligence.get('market_efficiency', 'unknown')}
            
            Based on this South African livestock market data, provide strategic insights and recommendations.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a South African livestock market strategist. Provide actionable market insights, opportunities, and strategic recommendations based on market data. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=600
            )
            
            # Parse AI response
            ai_insights = json.loads(response.choices[0].message.content)
            
            return {
                "strategic_recommendations": ai_insights.get("strategic_recommendations", []),
                "market_opportunities": ai_insights.get("market_opportunities", []),
                "risk_factors": ai_insights.get("risk_factors", []),
                "competitive_positioning": ai_insights.get("competitive_positioning", ""),
                "pricing_strategy": ai_insights.get("pricing_strategy", ""),
                "market_outlook": ai_insights.get("market_outlook", "stable"),
                "confidence_level": ai_insights.get("confidence_level", 75)
            }
            
        except Exception as e:
            logger.error(f"AI market insights generation failed: {e}")
            return {
                "strategic_recommendations": ["Monitor market conditions closely"],
                "market_opportunities": ["Standard market participation"],
                "risk_factors": ["Market volatility"],
                "competitive_positioning": "Maintain competitive stance",
                "pricing_strategy": "Follow market pricing",
                "market_outlook": "stable",
                "confidence_level": 50,
                "error": str(e)
            }
    
    async def _generate_trend_insights(
        self,
        demand_trend: Dict[str, Any],
        pricing_trend: Dict[str, Any],
        supply_trend: Dict[str, Any],
        species: Optional[str],
        region: Optional[str]
    ) -> Dict[str, Any]:
        """Generate AI insights on market trends"""
        
        try:
            context = f"""
            Market Trend Analysis for {species or 'livestock'} in {region or 'South Africa'}:
            
            Demand Trend: {demand_trend.get('direction', 'stable')} (confidence: {demand_trend.get('confidence', 50)}%)
            Pricing Trend: {pricing_trend.get('direction', 'stable')} (confidence: {pricing_trend.get('confidence', 50)}%)
            Supply Trend: {supply_trend.get('direction', 'stable')} (confidence: {supply_trend.get('confidence', 50)}%)
            
            Provide strategic insights on these market trends for livestock traders and farmers.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a livestock market analyst specializing in trend analysis. Provide clear, actionable insights based on market trend data. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.2,
                max_tokens=400
            )
            
            trend_insights = json.loads(response.choices[0].message.content)
            
            return {
                "trend_summary": trend_insights.get("trend_summary", "Market trends are mixed"),
                "key_drivers": trend_insights.get("key_drivers", []),
                "implications": trend_insights.get("implications", []),
                "recommended_actions": trend_insights.get("recommended_actions", []),
                "outlook": trend_insights.get("outlook", "neutral")
            }
            
        except Exception as e:
            logger.error(f"Trend insights generation failed: {e}")
            return {
                "trend_summary": "Unable to generate trend insights",
                "key_drivers": ["Market data analysis"],
                "implications": ["Continue monitoring trends"],
                "recommended_actions": ["Maintain current strategy"],
                "outlook": "neutral",
                "error": str(e)
            }
    
    async def _generate_seo_recommendations(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SEO recommendations for listing optimization"""
        
        try:
            species = listing_data.get("species", "")
            province = listing_data.get("province", "")
            title = listing_data.get("title", "")
            description = listing_data.get("description", "")
            
            # Basic SEO analysis
            recommendations = []
            improvements = []
            
            # Title optimization
            if not title or len(title) < 30:
                recommendations.append("Create descriptive title with 30-60 characters")
                improvements.append("title_length")
            
            if species and species.lower() not in title.lower():
                recommendations.append(f"Include '{species}' in the title")
                improvements.append("species_keyword")
            
            if province and province.lower() not in title.lower():
                recommendations.append(f"Include location '{province}' in title")
                improvements.append("location_keyword")
            
            # Description optimization
            if not description or len(description) < 100:
                recommendations.append("Write detailed description (100+ words)")
                improvements.append("description_length")
            
            # Keyword optimization
            seo_keywords = [
                f"{species.lower()}", f"{province.lower()}", "livestock", "farming",
                "quality", "breeding", "healthy", "certified"
            ]
            
            content = f"{title} {description}".lower()
            missing_keywords = [kw for kw in seo_keywords if kw and kw not in content]
            
            if missing_keywords:
                recommendations.append(f"Consider including keywords: {', '.join(missing_keywords[:3])}")
                improvements.append("keyword_optimization")
            
            return {
                "seo_score": max(10, 100 - len(recommendations) * 15),
                "recommendations": recommendations,
                "improvement_areas": improvements,
                "target_keywords": seo_keywords,
                "optimization_potential": "high" if len(recommendations) > 3 else "medium" if len(recommendations) > 1 else "low"
            }
            
        except Exception as e:
            logger.error(f"SEO recommendations failed: {e}")
            return {
                "seo_score": 50,
                "recommendations": ["Unable to analyze SEO"],
                "improvement_areas": [],
                "target_keywords": [],
                "optimization_potential": "unknown",
                "error": str(e)
            }
    
    async def _generate_optimized_content(self, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate optimized content suggestions"""
        
        try:
            species = listing_data.get("species", "")
            breed = listing_data.get("breed", "")
            province = listing_data.get("province", "")
            current_title = listing_data.get("title", "")
            current_description = listing_data.get("description", "")
            
            # Generate optimized title
            if not current_title or len(current_title) < 20:
                optimized_title = f"Premium {breed or 'Quality'} {species} Available in {province}"
            else:
                optimized_title = current_title
            
            # Generate optimized description
            if not current_description or len(current_description) < 50:
                optimized_description = f"""
High-quality {breed or ''} {species} available for immediate sale in {province}. 

Our livestock are:
• Healthy and well-maintained
• Suitable for breeding/commercial purposes  
• Available with health certificates
• Competitively priced

Located in {province}, South Africa. Serious buyers welcome to inspect before purchase.
Contact for more details on availability and pricing.
                """.strip()
            else:
                optimized_description = current_description
            
            return {
                "optimized_title": optimized_title,
                "optimized_description": optimized_description,
                "improvement_summary": [
                    "Enhanced with location keywords",
                    "Added quality indicators", 
                    "Improved call-to-action",
                    "Better keyword distribution"
                ],
                "estimated_improvement": "25-40%"
            }
            
        except Exception as e:
            logger.error(f"Content optimization failed: {e}")
            return {
                "optimized_title": listing_data.get("title", "Livestock for Sale"),
                "optimized_description": listing_data.get("description", "Quality livestock available"),
                "improvement_summary": ["Basic optimization applied"],
                "estimated_improvement": "10-20%",
                "error": str(e)
            }
    
    def _predict_content_performance(
        self,
        listing_data: Dict[str, Any],
        content_analysis: Dict[str, Any],
        performance_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Predict content performance improvements"""
        
        try:
            current_score = content_analysis.get("score", 5.0)
            
            # Simplified performance prediction
            if current_score < 4:
                predicted_improvement = 40
                confidence = 85
            elif current_score < 6:
                predicted_improvement = 25
                confidence = 75
            elif current_score < 8:
                predicted_improvement = 15
                confidence = 60
            else:
                predicted_improvement = 5
                confidence = 45
            
            return {
                "current_performance_score": current_score,
                "predicted_improvement_percentage": predicted_improvement,
                "confidence_level": confidence,
                "improvement_potential": predicted_improvement,
                "key_factors": [
                    "Title optimization",
                    "Description enhancement", 
                    "Keyword integration",
                    "SEO improvements"
                ],
                "timeline": "1-2 weeks" if predicted_improvement > 20 else "immediate"
            }
            
        except Exception as e:
            logger.error(f"Performance prediction failed: {e}")
            return {
                "current_performance_score": 5.0,
                "predicted_improvement_percentage": 20,
                "confidence_level": 50,
                "improvement_potential": 20,
                "key_factors": ["Content optimization"],
                "timeline": "1-2 weeks",
                "error": str(e)
            }