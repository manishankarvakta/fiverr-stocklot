# 🛡️ MODERATION PROVIDER INTERFACE
# Abstraction layer for AI content moderation with OpenAI and Emergent support

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
import os
import openai
import logging
from models_reviews import ModerationResult

logger = logging.getLogger(__name__)

class ModerationProvider(ABC):
    """Abstract interface for AI content moderation"""
    
    @abstractmethod
    async def moderate(self, text: str) -> ModerationResult:
        """Analyze text for toxicity and policy violations"""
        pass
    
    @abstractmethod
    async def embed(self, text: str) -> Optional[List[float]]:
        """Generate embeddings for text (for future 'helpful' ranking)"""
        pass

class OpenAIModerationProvider(ModerationProvider):
    """OpenAI-based content moderation"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        openai.api_key = self.api_key
    
    async def moderate(self, text: str) -> ModerationResult:
        """Use OpenAI Moderation API to analyze content"""
        try:
            if not text or not text.strip():
                return ModerationResult(
                    toxicity_score=0.0,
                    flagged=False,
                    categories={}
                )
            
            # Use OpenAI Moderation API
            response = await openai.Moderation.acreate(input=text)
            
            if not response or not response.results:
                logger.warning("Empty response from OpenAI Moderation API")
                return ModerationResult(
                    toxicity_score=0.0,
                    flagged=False,
                    categories={}
                )
            
            result = response.results[0]
            
            # Calculate overall toxicity score (weighted average of categories)
            categories = result.category_scores
            weights = {
                'hate': 0.25,
                'hate/threatening': 0.30,
                'harassment': 0.20,
                'harassment/threatening': 0.30,
                'self-harm': 0.10,
                'self-harm/intent': 0.15,
                'self-harm/instructions': 0.15,
                'sexual': 0.15,
                'sexual/minors': 0.35,
                'violence': 0.20,
                'violence/graphic': 0.25
            }
            
            toxicity_score = 0.0
            total_weight = 0.0
            
            for category, score in categories.items():
                weight = weights.get(category, 0.1)
                toxicity_score += score * weight
                total_weight += weight
            
            if total_weight > 0:
                toxicity_score = toxicity_score / total_weight
            
            # Cap at 1.0
            toxicity_score = min(toxicity_score, 1.0)
            
            return ModerationResult(
                toxicity_score=toxicity_score,
                flagged=result.flagged,
                categories=dict(categories)
            )
            
        except Exception as e:
            logger.error(f"OpenAI moderation failed: {e}")
            # Fail safe - don't block content if moderation fails
            return ModerationResult(
                toxicity_score=0.0,
                flagged=False,
                categories={}
            )
    
    async def embed(self, text: str) -> Optional[List[float]]:
        """Generate embeddings using OpenAI"""
        try:
            if not text or not text.strip():
                return None
            
            response = await openai.Embedding.acreate(
                model="text-embedding-ada-002",
                input=text
            )
            
            if response and response.data:
                return response.data[0].embedding
            
            return None
            
        except Exception as e:
            logger.error(f"OpenAI embedding failed: {e}")
            return None

class EmergentModerationProvider(ModerationProvider):
    """Emergent LLM-based content moderation"""
    
    def __init__(self):
        self.api_key = os.getenv('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY environment variable is required")
    
    async def moderate(self, text: str) -> ModerationResult:
        """Use Emergent LLM for content moderation"""
        try:
            # Import emergentintegrations here to avoid import errors if not installed
            from emergentintegrations import EmergentChat
            
            if not text or not text.strip():
                return ModerationResult(
                    toxicity_score=0.0,
                    flagged=False,
                    categories={}
                )
            
            chat = EmergentChat(api_key=self.api_key)
            
            # Create moderation prompt
            prompt = f"""Analyze the following text for inappropriate content. Rate each category from 0.0 to 1.0:

Text: "{text}"

Respond with a JSON object containing:
- toxicity_score: overall toxicity (0.0 = clean, 1.0 = very toxic)
- flagged: true if content should be blocked
- categories: object with scores for hate, harassment, sexual, violence, spam

Example: {{"toxicity_score": 0.2, "flagged": false, "categories": {{"hate": 0.1, "harassment": 0.0, "sexual": 0.3, "violence": 0.0, "spam": 0.1}}}}"""
            
            response = await chat.complete(
                messages=[{"role": "user", "content": prompt}],
                model="gpt-4o-mini",
                max_tokens=200,
                temperature=0.1
            )
            
            if not response or not response.get('choices'):
                logger.warning("Empty response from Emergent moderation")
                return ModerationResult(toxicity_score=0.0, flagged=False, categories={})
            
            content = response['choices'][0]['message']['content'].strip()
            
            # Parse JSON response
            import json
            try:
                moderation_data = json.loads(content)
                return ModerationResult(
                    toxicity_score=min(moderation_data.get('toxicity_score', 0.0), 1.0),
                    flagged=moderation_data.get('flagged', False),
                    categories=moderation_data.get('categories', {})
                )
            except json.JSONDecodeError:
                logger.error(f"Failed to parse Emergent moderation response: {content}")
                return ModerationResult(toxicity_score=0.0, flagged=False, categories={})
            
        except Exception as e:
            logger.error(f"Emergent moderation failed: {e}")
            # Fail safe
            return ModerationResult(toxicity_score=0.0, flagged=False, categories={})
    
    async def embed(self, text: str) -> Optional[List[float]]:
        """Generate embeddings using Emergent"""
        try:
            from emergentintegrations import EmergentEmbeddings
            
            if not text or not text.strip():
                return None
            
            embeddings = EmergentEmbeddings(api_key=self.api_key)
            response = await embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            
            if response and response.get('data'):
                return response['data'][0]['embedding']
            
            return None
            
        except Exception as e:
            logger.error(f"Emergent embedding failed: {e}")
            return None

class ModerationProviderFactory:
    """Factory to create appropriate moderation provider"""
    
    @staticmethod
    def create() -> ModerationProvider:
        """Create moderation provider based on configuration"""
        provider = os.getenv('AI_PROVIDER', 'openai').lower()
        
        if provider == 'emergent' and os.getenv('EMERGENT_LLM_KEY'):
            try:
                return EmergentModerationProvider()
            except Exception as e:
                logger.warning(f"Failed to create Emergent provider, falling back to OpenAI: {e}")
        
        # Default to OpenAI
        try:
            return OpenAIModerationProvider()
        except Exception as e:
            logger.error(f"Failed to create any moderation provider: {e}")
            raise RuntimeError("No valid moderation provider available")

# Singleton instance
_moderation_provider: Optional[ModerationProvider] = None

def get_moderation_provider() -> ModerationProvider:
    """Get singleton moderation provider instance"""
    global _moderation_provider
    if _moderation_provider is None:
        _moderation_provider = ModerationProviderFactory.create()
    return _moderation_provider