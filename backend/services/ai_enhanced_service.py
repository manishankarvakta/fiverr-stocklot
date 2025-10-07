import os
import logging
import openai
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
import json
import re
from enum import Enum

logger = logging.getLogger(__name__)

class ModerationCategory(str, Enum):
    SPAM = "spam"
    FRAUD = "fraud"
    INAPPROPRIATE = "inappropriate"
    SAFE = "safe"
    SUSPICIOUS = "suspicious"

class MatchingScore(str, Enum):
    EXCELLENT = "excellent"  # 90-100%
    GOOD = "good"           # 75-89%
    FAIR = "fair"           # 60-74%
    POOR = "poor"           # <60%

class AIEnhancedService:
    def __init__(self):
        self.openai_client = openai.OpenAI(
            api_key=os.environ.get('OPENAI_API_KEY')
        )
        
    async def enhanced_content_moderation(
        self,
        content: str,
        species: str = None,
        price: float = None,
        location: str = None
    ) -> Dict[str, Any]:
        """Enhanced AI-powered content moderation for buy requests"""
        
        try:
            # Prepare context for AI analysis
            context = f"""
            Content to moderate: "{content}"
            Species: {species or 'Not specified'}
            Price: R{price or 'Not specified'}
            Location: {location or 'Not specified'}
            
            This is a livestock trading platform. Analyze this buy request for:
            1. Spam indicators
            2. Fraud potential
            3. Inappropriate content
            4. Unrealistic pricing (if price given)
            5. Suspicious patterns
            
            Return a JSON response with:
            - category: spam|fraud|inappropriate|safe|suspicious
            - confidence: number 0-100
            - reasons: array of specific issues found
            - suggestions: array of improvements if needed
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert content moderator for a livestock trading platform. Analyze content for safety, legitimacy, and quality. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add timestamp and additional metadata
            result.update({
                "ai_model": "gpt-4",
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "content_length": len(content),
                "has_price": price is not None,
                "has_location": location is not None
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Enhanced moderation failed: {e}")
            # Fallback to basic moderation
            return {
                "category": "safe",
                "confidence": 50,
                "reasons": ["AI analysis unavailable"],
                "suggestions": [],
                "ai_model": "fallback",
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }
    
    async def generate_smart_matching_score(
        self,
        buy_request: Dict[str, Any],
        seller_profile: Dict[str, Any],
        offer_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """AI-powered buyer-seller matching with intelligent scoring"""
        
        try:
            context = f"""
            Buy Request:
            - Species: {buy_request.get('species')}
            - Product Type: {buy_request.get('product_type')}
            - Breed: {buy_request.get('breed', 'Any')}
            - Quantity: {buy_request.get('qty')} {buy_request.get('unit')}
            - Target Price: R{buy_request.get('target_price', 'Flexible')}
            - Location: {buy_request.get('province')}, {buy_request.get('country')}
            - Notes: {buy_request.get('notes', 'None')}
            
            Seller Profile:
            - Experience: {seller_profile.get('experience_years', 'Unknown')} years
            - Specialties: {seller_profile.get('specialties', [])}
            - Location: {seller_profile.get('province')}, {seller_profile.get('country')}
            - Rating: {seller_profile.get('average_rating', 'Unrated')}
            - Service Areas: {seller_profile.get('service_provinces', [])}
            
            Offer Details:
            - Price Offered: R{offer_details.get('offer_price')}
            - Quantity Available: {offer_details.get('qty')}
            - Message: {offer_details.get('message', 'None')}
            
            Analyze this match and provide:
            - overall_score: number 0-100
            - category: excellent|good|fair|poor
            - factors: object with scores for price_match, location_match, experience_match, quantity_match, specialty_match
            - strengths: array of positive matching factors
            - concerns: array of potential issues
            - recommendation: detailed explanation
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert livestock trade analyst. Score buyer-seller matches based on compatibility, pricing, location, experience, and other factors. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=600
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add metadata
            result.update({
                "ai_model": "gpt-4",
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "buy_request_id": buy_request.get('id'),
                "seller_id": seller_profile.get('id')
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Smart matching failed: {e}")
            # Fallback scoring
            return {
                "overall_score": 75,
                "category": "good",
                "factors": {
                    "price_match": 75,
                    "location_match": 70,
                    "experience_match": 80,
                    "quantity_match": 75,
                    "specialty_match": 70
                },
                "strengths": ["Basic compatibility"],
                "concerns": ["AI analysis unavailable"],
                "recommendation": "Standard match - manual review recommended",
                "ai_model": "fallback",
                "analyzed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }
    
    async def generate_price_suggestions(
        self,
        species: str,
        product_type: str,
        breed: str = None,
        location: str = None,
        quantity: int = None,
        unit: str = None,
        market_data: List[Dict] = None
    ) -> Dict[str, Any]:
        """AI-generated price recommendations based on market data"""
        
        try:
            # Prepare market context
            market_context = ""
            if market_data:
                recent_prices = [f"R{item.get('price', 0)} ({item.get('location', 'Unknown')})" 
                               for item in market_data[:10]]
                market_context = f"Recent market prices: {', '.join(recent_prices)}"
            
            context = f"""
            Generate price suggestions for livestock buy request:
            - Species: {species}
            - Product Type: {product_type}
            - Breed: {breed or 'Any breed'}
            - Location: {location or 'South Africa'}
            - Quantity: {quantity or 'Flexible'} {unit or 'head'}
            
            {market_context}
            
            Consider South African livestock market conditions, seasonal factors, breed premiums, and location differences.
            
            Provide JSON response with:
            - suggested_price: recommended price per unit
            - price_range: {min: number, max: number}
            - factors: array of pricing factors considered
            - seasonal_note: advice about seasonal pricing
            - market_outlook: brief market analysis
            - confidence: number 0-100 for price accuracy
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a South African livestock market analyst. Provide accurate, market-based pricing recommendations for livestock trading. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add metadata
            result.update({
                "ai_model": "gpt-4",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "market_data_points": len(market_data) if market_data else 0,
                "currency": "ZAR"
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Price suggestion failed: {e}")
            # Fallback pricing
            return {
                "suggested_price": 1500,
                "price_range": {"min": 1200, "max": 1800},
                "factors": ["Standard market estimate"],
                "seasonal_note": "Prices may vary seasonally",
                "market_outlook": "Analysis unavailable",
                "confidence": 50,
                "ai_model": "fallback",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }
    
    async def generate_auto_description(
        self,
        species: str,
        product_type: str,
        breed: str = None,
        quantity: int = None,
        unit: str = None,
        location: str = None,
        target_price: float = None,
        basic_notes: str = None
    ) -> Dict[str, Any]:
        """Generate detailed buy request descriptions from basic inputs"""
        
        try:
            context = f"""
            Generate a professional, detailed buy request description for:
            - Species: {species}
            - Product Type: {product_type}
            - Breed: {breed or 'Any suitable breed'}
            - Quantity: {quantity or 'Flexible'} {unit or 'head'}
            - Location: {location or 'South Africa'}
            - Budget: R{target_price or 'Negotiable'} per {unit or 'head'}
            - Additional notes: {basic_notes or 'None provided'}
            
            Create a professional description that includes:
            1. Clear statement of requirements
            2. Quality expectations appropriate for the species/breed
            3. Delivery/collection preferences
            4. Any relevant health/vaccination requirements
            5. Professional closing
            
            Make it sound professional but approachable for livestock trading.
            
            Provide JSON with:
            - description: the full generated description
            - title: suggested title for the request
            - tags: array of relevant search tags
            - requirements: structured list of key requirements
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional livestock trading advisor. Generate clear, professional buy request descriptions that attract quality sellers. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.4,
                max_tokens=600
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add metadata
            result.update({
                "ai_model": "gpt-4",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "input_species": species,
                "input_product_type": product_type
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Auto-description failed: {e}")
            # Fallback description
            basic_desc = f"Looking for {quantity or 'multiple'} {unit or 'head'} of {species}"
            if breed:
                basic_desc += f" ({breed} breed preferred)"
            basic_desc += f" in {location or 'South Africa'}."
            
            return {
                "description": basic_desc,
                "title": f"{species} Buy Request - {location or 'SA'}",
                "tags": [species.lower(), product_type.lower()],
                "requirements": ["Healthy animals", "Proper documentation"],
                "ai_model": "fallback",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }
    
    async def smart_categorization(
        self,
        buy_request: Dict[str, Any]
    ) -> Dict[str, Any]:
        """AI-powered smart categorization and tagging"""
        
        try:
            context = f"""
            Analyze this buy request and generate smart categories and tags:
            
            Species: {buy_request.get('species')}
            Product Type: {buy_request.get('product_type')}
            Breed: {buy_request.get('breed')}
            Quantity: {buy_request.get('qty')} {buy_request.get('unit')}
            Price: R{buy_request.get('target_price')}
            Location: {buy_request.get('province')}, {buy_request.get('country')}
            Notes: {buy_request.get('notes', '')}
            
            Generate JSON with:
            - primary_category: main business category
            - subcategories: array of relevant subcategories
            - tags: array of searchable tags
            - buyer_type: estimated buyer profile (commercial|smallholder|hobbyist|reseller)
            - urgency_level: low|medium|high based on content analysis
            - market_segment: premium|standard|budget based on requirements
            - special_requirements: array of any special needs detected
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a livestock market analyst. Categorize buy requests to improve searchability and matching. Always respond with valid JSON."
                    },
                    {"role": "user", "content": context}
                ],
                temperature=0.3,
                max_tokens=400
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add metadata
            result.update({
                "ai_model": "gpt-4",
                "categorized_at": datetime.now(timezone.utc).isoformat(),
                "request_id": buy_request.get('id')
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Smart categorization failed: {e}")
            # Fallback categorization
            return {
                "primary_category": buy_request.get('species', 'livestock').lower(),
                "subcategories": [buy_request.get('product_type', 'general').lower()],
                "tags": [
                    buy_request.get('species', '').lower(),
                    buy_request.get('product_type', '').lower(),
                    buy_request.get('province', '').lower()
                ],
                "buyer_type": "standard",
                "urgency_level": "medium",
                "market_segment": "standard",
                "special_requirements": [],
                "ai_model": "fallback",
                "categorized_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }