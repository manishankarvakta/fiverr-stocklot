# OpenAI AI-Powered Listing Service
import os
import json
import asyncio
import aiohttp
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import base64
from io import BytesIO

class OpenAIListingService:
    """
    AI-powered listing generation service using OpenAI Vision and Text APIs
    """
    
    def __init__(self, db):
        self.db = db
        self.api_key = os.getenv('OPENAI_API_KEY') or os.getenv('EMERGENT_LLM_KEY')
        self.base_url = "https://api.openai.com/v1"
        
        if not self.api_key:
            print("⚠️ No OpenAI API key found. AI listing features will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            print("✅ OpenAI AI Listing Service initialized")
    
    async def analyze_livestock_image(self, image_data: bytes, 
                                    province: str = None, 
                                    hints: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze livestock image using OpenAI Vision API and generate listing suggestions
        """
        if not self.enabled:
            raise Exception("OpenAI service not available")
        
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Build system prompt for livestock analysis
            system_prompt = self._get_vision_system_prompt()
            user_prompt = self._get_vision_user_prompt(province, hints)
            
            # Call OpenAI Vision API
            vision_result = await self._call_openai_vision(image_base64, system_prompt, user_prompt)
            
            if not vision_result:
                raise Exception("Failed to analyze image")
            
            # Parse structured response
            parsed_fields = self._parse_vision_response(vision_result)
            
            # Get pricing comparables
            pricing_data = await self._get_pricing_comparables(
                species=parsed_fields.get('species', {}).get('value'),
                breed=parsed_fields.get('breed', {}).get('value'),
                province=province,
                age_class=parsed_fields.get('age_class', {}).get('value')
            )
            
            # Polish title and description if needed
            if self._needs_text_polish(parsed_fields):
                polished_text = await self._polish_text_content(parsed_fields, pricing_data, province)
                parsed_fields.update(polished_text)
            
            # Run content moderation
            moderation_result = await self._moderate_content(
                f"{parsed_fields.get('title', {}).get('value', '')} {parsed_fields.get('description', {}).get('value', '')}"
            )
            
            if moderation_result.get('flagged'):
                parsed_fields = self._apply_safe_fallbacks(parsed_fields)
            
            return {
                'success': True,
                'fields': parsed_fields,
                'pricing': pricing_data,
                'moderation': moderation_result,
                'analysis_notes': vision_result.get('notes', '')
            }
            
        except Exception as e:
            print(f"Error analyzing livestock image: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'fields': {},
                'pricing': None
            }
    
    def _get_vision_system_prompt(self) -> str:
        """System prompt for OpenAI Vision API livestock analysis"""
        return """
You are an expert livestock analyst for a South African marketplace. 
Analyze photos of LIVE animals (not meat/carcasses) and extract listing information.

SPECIES OPTIONS: Cattle, Sheep, Goats, Pigs, Chickens, Ducks, Rabbits, Fish, Ostrich
COMMON SA BREEDS:
- Cattle: Angus, Brahman, Bonsmara, Nguni, Simmentaler, Charolais, Hereford, Limousin
- Sheep: Dorper, Merino, Damara, Boer Goat (if goats), Kalahari Red
- Goats: Boer, Savanna, Kalahari Red, Angora
- Pigs: Large White, Landrace, Duroc, Hampshire
- Chickens: Broiler, Layer, Potchefstroom Koekoek, New Hampshire

AGE CLASSES:
- Cattle: Calf, Yearling, Young Bull/Heifer, Mature Cow/Bull
- Sheep/Goats: Lamb/Kid, Yearling, Mature Ewe/Ram
- Pigs: Piglet, Weaner, Finisher, Breeding Stock
- Poultry: Chick, Pullet/Cockerel, Hen/Rooster

Return ONLY valid JSON matching this exact schema:
{
  "fields": {
    "species": {"value": "Cattle|Sheep|Goats|etc", "confidence": 0.0-1.0},
    "breed": {"value": "breed_name_or_null", "confidence": 0.0-1.0},
    "age_class": {"value": "age_class_or_null", "confidence": 0.0-1.0},
    "sex": {"value": "male|female|mixed|unknown", "confidence": 0.0-1.0},
    "quantity": {"value": number_or_null, "confidence": 0.0-1.0},
    "weight_est_kg": {"value": number_or_null, "confidence": 0.0-1.0},
    "title": {"value": "short_title_under_80_chars", "confidence": 0.0-1.0},
    "description": {"value": "neutral_description", "confidence": 0.0-1.0}
  },
  "notes": "brief_analysis_notes"
}

RULES:
- NO medical/health claims ever
- If unsure, use null with low confidence
- Count animals visible in image for quantity
- Keep title under 80 characters
- Description should be factual and neutral
- Use common South African terminology
"""
    
    def _get_vision_user_prompt(self, province: str = None, hints: Dict[str, Any] = None) -> str:
        """User prompt with context for livestock analysis"""
        context_parts = []
        
        if province:
            context_parts.append(f"Province: {province}")
        
        if hints:
            if hints.get('species'):
                context_parts.append(f"Expected species: {hints['species']}")
            if hints.get('breed'):
                context_parts.append(f"Possible breed: {hints['breed']}")
        
        context = " | ".join(context_parts) if context_parts else "No specific context"
        
        return f"""
Analyze this livestock image and extract listing information.
Context: {context}

Generate appropriate title and description for a marketplace listing.
Focus on observable characteristics and avoid assumptions about health or quality.
Return structured JSON response only.
"""
    
    async def _call_openai_vision(self, image_base64: str, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Call OpenAI Vision API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4o-mini",  # Cost-effective vision model
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 800,
            "temperature": 0.1
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result['choices'][0]['message']['content']
                    return json.loads(content)
                else:
                    error_text = await response.text()
                    print(f"OpenAI Vision API error: {response.status} - {error_text}")
                    return None
    
    def _parse_vision_response(self, vision_result: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and validate vision API response"""
        fields = vision_result.get('fields', {})
        
        # Validate and clean up fields
        cleaned_fields = {}
        
        field_definitions = {
            'species': str,
            'breed': str,
            'age_class': str,
            'sex': str,
            'quantity': int,
            'weight_est_kg': float,
            'title': str,
            'description': str
        }
        
        for field_name, field_type in field_definitions.items():
            if field_name in fields:
                field_data = fields[field_name]
                if isinstance(field_data, dict) and 'value' in field_data:
                    value = field_data['value']
                    confidence = max(0.0, min(1.0, float(field_data.get('confidence', 0.5))))
                    
                    # Validate value type
                    if value is not None:
                        try:
                            if field_type == int:
                                value = int(value)
                            elif field_type == float:
                                value = float(value)
                            elif field_type == str:
                                value = str(value).strip()
                                if not value:
                                    value = None
                        except (ValueError, TypeError):
                            value = None
                            confidence = 0.0
                    
                    cleaned_fields[field_name] = {
                        'value': value,
                        'confidence': confidence
                    }
        
        return cleaned_fields
    
    async def _get_pricing_comparables(self, species: str = None, breed: str = None, 
                                     province: str = None, age_class: str = None) -> Dict[str, Any]:
        """Get pricing comparables from recent listings"""
        if not species:
            return None
        
        try:
            # Build query for comparable listings
            query = {
                'species_name': species,
                'status': {'$in': ['sold', 'completed']},
                'created_at': {'$gte': datetime.utcnow() - timedelta(days=90)}
            }
            
            if breed:
                query['breed_name'] = breed
            if province:
                query['seller_province'] = province
            if age_class:
                query['age_class'] = age_class
            
            # Get recent sold listings
            recent_sales = await self.db.listings.find(query).to_list(500)
            
            if not recent_sales:
                return {
                    'count': 0,
                    'p25': 0,
                    'median': 0,
                    'p75': 0,
                    'note': 'No comparable sales found'
                }
            
            # Extract prices and calculate percentiles
            prices = [listing.get('price_per_unit', 0) for listing in recent_sales if listing.get('price_per_unit')]
            prices.sort()
            
            if not prices:
                return {
                    'count': 0,
                    'p25': 0,
                    'median': 0,
                    'p75': 0,
                    'note': 'No pricing data available'
                }
            
            def percentile(data, p):
                k = (len(data) - 1) * p
                f = int(k)
                c = k - f
                if f == len(data) - 1:
                    return data[f]
                return data[f] * (1 - c) + data[f + 1] * c
            
            p25 = percentile(prices, 0.25)
            median = percentile(prices, 0.50)
            p75 = percentile(prices, 0.75)
            
            note = f"Based on {len(prices)} sales in last 90 days"
            if len(prices) < 5:
                note += " - Limited data, adjust manually"
            
            return {
                'count': len(prices),
                'p25': p25,
                'median': median,
                'p75': p75,
                'note': note,
                'province': province,
                'species': species,
                'breed': breed
            }
            
        except Exception as e:
            print(f"Error getting pricing comparables: {str(e)}")
            return None
    
    def _needs_text_polish(self, fields: Dict[str, Any]) -> bool:
        """Check if title or description needs AI polishing"""
        title = fields.get('title', {})
        description = fields.get('description', {})
        
        title_needs_polish = not title.get('value') or title.get('confidence', 0) < 0.7
        desc_needs_polish = not description.get('value') or description.get('confidence', 0) < 0.7
        
        return title_needs_polish or desc_needs_polish
    
    async def _polish_text_content(self, fields: Dict[str, Any], pricing_data: Dict[str, Any], 
                                 province: str = None) -> Dict[str, Any]:
        """Polish title and description using OpenAI text API"""
        try:
            species = fields.get('species', {}).get('value', '')
            breed = fields.get('breed', {}).get('value', '')
            age_class = fields.get('age_class', {}).get('value', '')
            sex = fields.get('sex', {}).get('value', '')
            quantity = fields.get('quantity', {}).get('value', 1)
            
            # Build context for text generation
            context_parts = []
            if species:
                context_parts.append(f"Species: {species}")
            if breed:
                context_parts.append(f"Breed: {breed}")
            if age_class:
                context_parts.append(f"Age: {age_class}")
            if sex:
                context_parts.append(f"Sex: {sex}")
            if quantity:
                context_parts.append(f"Quantity: {quantity}")
            if province:
                context_parts.append(f"Location: {province}")
            
            if pricing_data:
                median_price = pricing_data.get('median', 0)
                if median_price > 0:
                    context_parts.append(f"Market price: ~R{median_price:,.0f}")
            
            system_prompt = """
You write concise livestock listing titles and descriptions.
- Title: Under 80 characters, include key details
- Description: 2-3 sentences, factual and neutral
- No health claims or medical information
- Use South African livestock terminology

Return JSON only:
{"title": "...", "description": "..."}
"""
            
            user_prompt = f"""
Create listing title and description for:
{' | '.join(context_parts)}

Make it appealing but factual. Focus on breed, age, quantity, and location.
"""
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 200,
                "temperature": 0.3
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result['choices'][0]['message']['content']
                        polished = json.loads(content)
                        
                        return {
                            'title': {
                                'value': polished.get('title', '')[:80],
                                'confidence': 0.8
                            },
                            'description': {
                                'value': polished.get('description', ''),
                                'confidence': 0.8
                            }
                        }
                    else:
                        print(f"Text polish API error: {response.status}")
                        return {}
            
        except Exception as e:
            print(f"Error polishing text content: {str(e)}")
            return {}
    
    async def _moderate_content(self, content: str) -> Dict[str, Any]:
        """Moderate content using OpenAI moderation API"""
        if not content.strip():
            return {'flagged': False, 'categories': {}}
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "omni-moderation-latest",
                "input": content[:5000]  # Limit input length
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/moderations",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        moderation_result = result['results'][0]
                        return {
                            'flagged': moderation_result.get('flagged', False),
                            'categories': moderation_result.get('categories', {}),
                            'category_scores': moderation_result.get('category_scores', {})
                        }
                    else:
                        print(f"Moderation API error: {response.status}")
                        return {'flagged': False, 'categories': {}}
            
        except Exception as e:
            print(f"Error moderating content: {str(e)}")
            return {'flagged': False, 'categories': {}}
    
    def _apply_safe_fallbacks(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Apply safe fallback content if moderation flags content"""
        safe_fields = fields.copy()
        
        # Replace flagged title with safe alternative
        if 'title' in safe_fields:
            species = fields.get('species', {}).get('value', 'Livestock')
            quantity = fields.get('quantity', {}).get('value', 1)
            safe_title = f"{species} for Sale"
            if quantity and quantity > 1:
                safe_title = f"{quantity} {species} for Sale"
            
            safe_fields['title'] = {
                'value': safe_title[:80],
                'confidence': 0.6
            }
        
        # Replace flagged description with safe alternative
        if 'description' in safe_fields:
            safe_fields['description'] = {
                'value': "Quality livestock available for sale. Contact seller for more details.",
                'confidence': 0.6
            }
        
        return safe_fields
    
    async def store_ai_suggestion(self, user_id: str, image_url: str, 
                                 suggestion_data: Dict[str, Any]) -> str:
        """Store AI suggestion for tracking and learning"""
        try:
            suggestion_record = {
                '_id': str(uuid.uuid4()),
                'user_id': user_id,
                'image_url': image_url,
                'suggestion_json': suggestion_data,
                'accepted_fields': {},
                'rejected_fields': {},
                'created_at': datetime.utcnow(),
                'status': 'pending'
            }
            
            await self.db.ai_listing_suggestions.insert_one(suggestion_record)
            return suggestion_record['_id']
            
        except Exception as e:
            print(f"Error storing AI suggestion: {str(e)}")
            return None