import os
import logging
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import pandas as pd
import json
import uuid
from geopy.distance import geodesic

logger = logging.getLogger(__name__)

class MLMatchingService:
    def __init__(self, db):
        self.db = db
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'distance_km',
            'species_match_score', 
            'quantity_fit_score',
            'price_competitiveness',
            'seller_history_score',
            'buyer_reliability_score',
            'freshness_score',
            'deadline_urgency'
        ]
        self.model_path = '/app/backend/models/matching_model.pkl'
        self.scaler_path = '/app/backend/models/matching_scaler.pkl'
        
        # Load existing model if available
        self._load_model()
    
    def _load_model(self):
        """Load trained model and scaler if they exist"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Loaded existing matching model")
            else:
                logger.info("No existing model found, will use weighted scoring")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None
    
    async def rank_requests_for_seller(
        self,
        seller_id: str,
        requests: List[Dict[str, Any]],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Rank buy requests for a seller using ML or weighted scoring"""
        
        try:
            if not requests:
                return []
            
            # Get seller profile and history
            seller = await self.db.users.find_one({"id": seller_id})
            if not seller:
                return requests[:limit]
            
            seller_history = await self._get_seller_history(seller_id)
            
            # Extract features for each request
            features_list = []
            request_data = []
            
            for request in requests:
                features = await self._extract_features(request, seller, seller_history)
                if features:
                    features_list.append(features)
                    request_data.append(request)
            
            if not features_list:
                return requests[:limit]
            
            # Get rankings using model or fallback
            if self.model is not None:
                rankings = self._predict_rankings(features_list)
            else:
                rankings = self._calculate_weighted_scores(features_list)
            
            # Combine requests with scores and sort
            scored_requests = []
            for i, request in enumerate(request_data):
                scored_requests.append({
                    **request,
                    'ml_score': float(rankings[i]),
                    'ranking_features': features_list[i]
                })
            
            # Sort by score (higher is better)
            scored_requests.sort(key=lambda x: x['ml_score'], reverse=True)
            
            return scored_requests[:limit]
            
        except Exception as e:
            logger.error(f"Request ranking failed: {e}")
            return requests[:limit]
    
    async def _extract_features(
        self, 
        request: Dict[str, Any], 
        seller: Dict[str, Any],
        seller_history: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Extract ML features from request and seller data"""
        
        try:
            # 1. Distance calculation
            distance_km = await self._calculate_distance(request, seller)
            
            # 2. Species match score
            species_match = self._calculate_species_match(request, seller)
            
            # 3. Quantity fit score
            quantity_fit = self._calculate_quantity_fit(request, seller_history)
            
            # 4. Price competitiveness
            price_competitive = await self._calculate_price_competitiveness(request)
            
            # 5. Seller history score
            seller_score = self._calculate_seller_history_score(seller_history)
            
            # 6. Buyer reliability score
            buyer_score = await self._calculate_buyer_reliability(request.get('buyer_id'))
            
            # 7. Freshness score
            freshness = self._calculate_freshness_score(request)
            
            # 8. Deadline urgency
            urgency = self._calculate_deadline_urgency(request)
            
            features = {
                'distance_km': distance_km,
                'species_match_score': species_match,
                'quantity_fit_score': quantity_fit,
                'price_competitiveness': price_competitive,
                'seller_history_score': seller_score,
                'buyer_reliability_score': buyer_score,
                'freshness_score': freshness,
                'deadline_urgency': urgency
            }
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return None
    
    async def _calculate_distance(
        self, 
        request: Dict[str, Any], 
        seller: Dict[str, Any]
    ) -> float:
        """Calculate distance between buyer and seller"""
        
        try:
            # Get coordinates from location data
            buyer_coords = request.get('location_data', {}).get('coordinates')
            seller_coords = seller.get('location_data', {}).get('coordinates')
            
            if buyer_coords and seller_coords:
                buyer_location = (buyer_coords['latitude'], buyer_coords['longitude'])
                seller_location = (seller_coords['latitude'], seller_coords['longitude'])
                distance = geodesic(buyer_location, seller_location).kilometers
                return min(distance, 1000)  # Cap at 1000km
            
            # Fallback: province-based rough distance
            buyer_province = request.get('province', '')
            seller_provinces = seller.get('service_provinces', [])
            
            if buyer_province in seller_provinces:
                return 50  # Same province, assume 50km
            else:
                return 300  # Different province, assume 300km
                
        except Exception as e:
            logger.error(f"Distance calculation failed: {e}")
            return 500  # Default fallback distance
    
    def _calculate_species_match(
        self, 
        request: Dict[str, Any], 
        seller: Dict[str, Any]
    ) -> float:
        """Calculate how well seller's specialties match the request"""
        
        try:
            request_species = request.get('species', '').lower()
            seller_specialties = [s.lower() for s in seller.get('specialties', [])]
            
            if not seller_specialties:
                return 0.5  # No specialties listed, neutral score
            
            # Direct species match
            if request_species in seller_specialties:
                return 1.0
            
            # Partial matches for related species
            species_relations = {
                'cattle': ['beef', 'dairy', 'cow', 'bull', 'heifer'],
                'poultry': ['chicken', 'broiler', 'layer', 'duck', 'turkey'],
                'sheep': ['lamb', 'mutton', 'wool'],
                'goats': ['goat', 'kid'],
                'swine': ['pig', 'pork', 'boar']
            }
            
            for specialty in seller_specialties:
                for species_group, related in species_relations.items():
                    if (request_species == species_group and specialty in related) or \
                       (specialty == species_group and request_species in related):
                        return 0.8
            
            return 0.2  # No match, but seller might still be interested
            
        except Exception as e:
            logger.error(f"Species match calculation failed: {e}")
            return 0.5
    
    def _calculate_quantity_fit(
        self, 
        request: Dict[str, Any], 
        seller_history: Dict[str, Any]
    ) -> float:
        """Calculate how well request quantity fits seller's typical deals"""
        
        try:
            request_qty = request.get('qty', 0)
            if request_qty <= 0:
                return 0.0
            
            avg_qty = seller_history.get('avg_quantity', 50)
            max_qty = seller_history.get('max_quantity', 100)
            
            if request_qty <= avg_qty:
                return 1.0  # Perfect fit
            elif request_qty <= max_qty:
                return 0.8  # Good fit
            elif request_qty <= max_qty * 2:
                return 0.6  # Manageable
            else:
                return 0.3  # Large order, might be challenging
                
        except Exception as e:
            logger.error(f"Quantity fit calculation failed: {e}")
            return 0.5
    
    async def _calculate_price_competitiveness(self, request: Dict[str, Any]) -> float:
        """Calculate how competitive the target price is"""
        
        try:
            target_price = request.get('target_price')
            if not target_price:
                return 0.7  # No price given, neutral score
            
            species = request.get('species', '')
            
            # Get recent market prices for comparison
            recent_prices = await self._get_recent_market_prices(species)
            
            if not recent_prices:
                return 0.7  # No market data, neutral score
            
            avg_market_price = np.mean(recent_prices)
            
            # Score based on how the target price compares to market
            price_ratio = target_price / avg_market_price
            
            if price_ratio >= 1.2:
                return 1.0  # Above market price, very attractive
            elif price_ratio >= 1.0:
                return 0.9  # At market price, good
            elif price_ratio >= 0.8:
                return 0.6  # Below market, less attractive
            else:
                return 0.3  # Well below market, challenging
                
        except Exception as e:
            logger.error(f"Price competitiveness calculation failed: {e}")
            return 0.7
    
    async def _get_recent_market_prices(self, species: str, days_back: int = 30) -> List[float]:
        """Get recent market prices for a species"""
        
        try:
            start_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            
            # Get completed orders for this species
            cursor = self.db.seller_orders.find({
                "species": species,
                "status": "completed",
                "created_at": {"$gte": start_date}
            }).limit(50)
            
            orders = await cursor.to_list(length=None)
            prices = [order.get('unit_price', 0) for order in orders if order.get('unit_price', 0) > 0]
            
            return prices
            
        except Exception as e:
            logger.error(f"Market price retrieval failed: {e}")
            return []
    
    def _calculate_seller_history_score(self, seller_history: Dict[str, Any]) -> float:
        """Calculate seller performance score"""
        
        try:
            acceptance_rate = seller_history.get('acceptance_rate', 0.5)
            avg_rating = seller_history.get('avg_rating', 4.0) / 5.0
            total_sales = min(seller_history.get('total_sales', 0) / 100, 1.0)  # Normalize to 0-1
            dispute_rate = 1.0 - min(seller_history.get('dispute_rate', 0.1), 1.0)
            
            # Weighted combination
            score = (
                acceptance_rate * 0.3 +
                avg_rating * 0.3 +
                total_sales * 0.2 +
                dispute_rate * 0.2
            )
            
            return min(max(score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Seller history score calculation failed: {e}")
            return 0.5
    
    async def _calculate_buyer_reliability(self, buyer_id: str) -> float:
        """Calculate buyer reliability score"""
        
        try:
            if not buyer_id:
                return 0.5
            
            # Get buyer's order history
            cursor = self.db.order_groups.find({
                "buyer_id": buyer_id,
                "status": {"$in": ["paid", "complete", "cancelled"]}
            }).limit(20)
            
            orders = await cursor.to_list(length=None)
            
            if not orders:
                return 0.5  # No history, neutral score
            
            # Calculate metrics
            total_orders = len(orders)
            paid_orders = len([o for o in orders if o.get('status') in ['paid', 'complete']])
            cancelled_orders = len([o for o in orders if o.get('status') == 'cancelled'])
            
            payment_rate = paid_orders / total_orders
            cancellation_rate = cancelled_orders / total_orders
            
            # Check for payment delays (simplified - would need payment timestamps)
            avg_payment_speed = 0.8  # Placeholder
            
            score = (
                payment_rate * 0.5 +
                (1.0 - cancellation_rate) * 0.3 +
                avg_payment_speed * 0.2
            )
            
            return min(max(score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Buyer reliability calculation failed: {e}")
            return 0.5
    
    def _calculate_freshness_score(self, request: Dict[str, Any]) -> float:
        """Calculate how fresh/recent the request is"""
        
        try:
            created_at = request.get('created_at')
            if not created_at:
                return 0.5
            
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            
            now = datetime.now(timezone.utc)
            age_hours = (now - created_at).total_seconds() / 3600
            
            # Fresher requests get higher scores
            if age_hours <= 1:
                return 1.0  # Very fresh
            elif age_hours <= 6:
                return 0.9  # Fresh
            elif age_hours <= 24:
                return 0.7  # Recent
            elif age_hours <= 72:
                return 0.5  # Few days old
            else:
                return 0.3  # Old request
                
        except Exception as e:
            logger.error(f"Freshness score calculation failed: {e}")
            return 0.5
    
    def _calculate_deadline_urgency(self, request: Dict[str, Any]) -> float:
        """Calculate urgency based on deadline"""
        
        try:
            expires_at = request.get('expires_at')
            if not expires_at:
                return 0.5
            
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            now = datetime.now(timezone.utc)
            time_left_hours = (expires_at - now).total_seconds() / 3600
            
            if time_left_hours <= 0:
                return 0.0  # Expired
            elif time_left_hours <= 24:
                return 1.0  # Very urgent
            elif time_left_hours <= 72:
                return 0.8  # Urgent
            elif time_left_hours <= 168:  # 1 week
                return 0.6  # Some urgency
            else:
                return 0.4  # Not urgent
                
        except Exception as e:
            logger.error(f"Deadline urgency calculation failed: {e}")
            return 0.5
    
    async def _get_seller_history(self, seller_id: str) -> Dict[str, Any]:
        """Get seller's historical performance metrics"""
        
        try:
            # Get offers and orders
            offers_cursor = self.db.buy_request_offers.find({"seller_id": seller_id}).limit(100)
            offers = await offers_cursor.to_list(length=None)
            
            orders_cursor = self.db.seller_orders.find({"seller_id": seller_id}).limit(50)
            orders = await orders_cursor.to_list(length=None)
            
            if not offers and not orders:
                return {
                    'acceptance_rate': 0.5,
                    'avg_rating': 4.0,
                    'total_sales': 0,
                    'avg_quantity': 50,
                    'max_quantity': 100,
                    'dispute_rate': 0.1
                }
            
            # Calculate metrics
            total_offers = len(offers)
            accepted_offers = len([o for o in offers if o.get('status') == 'accepted'])
            acceptance_rate = accepted_offers / total_offers if total_offers > 0 else 0.5
            
            total_sales = len(orders)
            quantities = [o.get('qty', 0) for o in orders if o.get('qty', 0) > 0]
            avg_quantity = np.mean(quantities) if quantities else 50
            max_quantity = max(quantities) if quantities else 100
            
            # Get ratings (would need ratings collection)
            avg_rating = 4.0  # Placeholder - would calculate from reviews
            
            # Calculate dispute rate (simplified)
            disputed_orders = len([o for o in orders if o.get('status') == 'disputed'])
            dispute_rate = disputed_orders / total_sales if total_sales > 0 else 0.1
            
            return {
                'acceptance_rate': acceptance_rate,
                'avg_rating': avg_rating,
                'total_sales': total_sales,
                'avg_quantity': avg_quantity,
                'max_quantity': max_quantity,
                'dispute_rate': dispute_rate
            }
            
        except Exception as e:
            logger.error(f"Seller history calculation failed: {e}")
            return {
                'acceptance_rate': 0.5,
                'avg_rating': 4.0,
                'total_sales': 0,
                'avg_quantity': 50,
                'max_quantity': 100,
                'dispute_rate': 0.1
            }
    
    def _calculate_weighted_scores(self, features_list: List[Dict[str, Any]]) -> List[float]:
        """Calculate weighted scores when no ML model is available"""
        
        weights = {
            'distance_km': -0.2,  # Negative because closer is better
            'species_match_score': 0.25,
            'quantity_fit_score': 0.15,
            'price_competitiveness': 0.20,
            'seller_history_score': 0.15,
            'buyer_reliability_score': 0.10,
            'freshness_score': 0.10,
            'deadline_urgency': 0.05
        }
        
        scores = []
        for features in features_list:
            score = 0
            for feature_name, weight in weights.items():
                feature_value = features.get(feature_name, 0.5)
                
                # Normalize distance (invert and scale)
                if feature_name == 'distance_km':
                    feature_value = max(0, 1 - (feature_value / 500))  # Normalize to 0-1
                
                score += weight * feature_value
            
            scores.append(max(0, score))  # Ensure non-negative scores
        
        return scores
    
    def _predict_rankings(self, features_list: List[Dict[str, Any]]) -> List[float]:
        """Use trained ML model to predict rankings"""
        
        try:
            # Convert features to numpy array
            feature_matrix = []
            for features in features_list:
                feature_vector = [features.get(name, 0.5) for name in self.feature_names]
                # Normalize distance
                feature_vector[0] = max(0, 1 - (feature_vector[0] / 500))
                feature_matrix.append(feature_vector)
            
            feature_matrix = np.array(feature_matrix)
            
            # Scale features
            feature_matrix_scaled = self.scaler.transform(feature_matrix)
            
            # Predict scores
            scores = self.model.predict(feature_matrix_scaled)
            
            return [max(0, float(score)) for score in scores]
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            # Fallback to weighted scoring
            return self._calculate_weighted_scores(features_list)
    
    async def record_interaction(
        self,
        seller_id: str,
        request_id: str,
        interaction_type: str,  # 'view', 'offer_sent', 'offer_accepted', 'skipped'
        features: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Record seller-request interaction for training data"""
        
        try:
            interaction_record = {
                "id": str(uuid.uuid4()),
                "seller_id": seller_id,
                "request_id": request_id,
                "interaction_type": interaction_type,
                "features": features,
                "timestamp": datetime.now(timezone.utc)
            }
            
            await self.db.ml_interactions.insert_one(interaction_record)
            return True
            
        except Exception as e:
            logger.error(f"Interaction recording failed: {e}")
            return False
    
    async def train_model(self, min_samples: int = 1000) -> Dict[str, Any]:
        """Train ML model from collected interaction data"""
        
        try:
            # Get training data
            cursor = self.db.ml_interactions.find({
                "features": {"$exists": True, "$ne": None},
                "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(days=90)}
            }).limit(10000)
            
            interactions = await cursor.to_list(length=None)
            
            if len(interactions) < min_samples:
                return {
                    "success": False,
                    "error": f"Not enough training data. Need {min_samples}, have {len(interactions)}"
                }
            
            # Prepare training data
            X = []
            y = []
            
            for interaction in interactions:
                features = interaction.get("features", {})
                if not features:
                    continue
                
                # Convert features to vector
                feature_vector = [features.get(name, 0.5) for name in self.feature_names]
                # Normalize distance
                feature_vector[0] = max(0, 1 - (feature_vector[0] / 500))
                
                # Create label based on interaction type
                label = self._interaction_to_label(interaction["interaction_type"])
                
                X.append(feature_vector)
                y.append(label)
            
            if len(X) < min_samples:
                return {
                    "success": False,
                    "error": f"Not enough valid training samples: {len(X)}"
                }
            
            X = np.array(X)
            y = np.array(y)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            self.scaler.fit(X_train)
            X_train_scaled = self.scaler.transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Save model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            
            # Save training record
            training_record = {
                "id": str(uuid.uuid4()),
                "trained_at": datetime.now(timezone.utc),
                "samples_used": len(X),
                "test_mse": float(mse),
                "test_r2": float(r2),
                "feature_importance": dict(zip(
                    self.feature_names,
                    [float(imp) for imp in self.model.feature_importances_]
                ))
            }
            
            await self.db.ml_training_history.insert_one(training_record)
            
            return {
                "success": True,
                "model_performance": {
                    "mse": float(mse),
                    "r2": float(r2),
                    "samples_used": len(X)
                },
                "feature_importance": training_record["feature_importance"]
            }
            
        except Exception as e:
            logger.error(f"Model training failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _interaction_to_label(self, interaction_type: str) -> float:
        """Convert interaction type to training label"""
        
        label_map = {
            'offer_accepted': 1.0,  # Highest value
            'offer_sent': 0.8,      # High value
            'view': 0.3,            # Some interest
            'skipped': 0.1          # Low interest
        }
        
        return label_map.get(interaction_type, 0.3)
    
    async def get_model_performance(self) -> Dict[str, Any]:
        """Get current model performance metrics"""
        
        try:
            # Get latest training record
            cursor = self.db.ml_training_history.find().sort("trained_at", -1).limit(1)
            latest_training = await cursor.to_list(length=1)
            
            if not latest_training:
                return {"model_available": False}
            
            training_data = latest_training[0]
            
            return {
                "model_available": True,
                "last_trained": training_data["trained_at"],
                "performance": {
                    "mse": training_data["test_mse"],
                    "r2": training_data["test_r2"],
                    "samples_used": training_data["samples_used"]
                },
                "feature_importance": training_data["feature_importance"]
            }
            
        except Exception as e:
            logger.error(f"Performance retrieval failed: {e}")
            return {"model_available": False, "error": str(e)}