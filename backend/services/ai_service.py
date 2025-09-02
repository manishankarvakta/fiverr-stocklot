"""
AI Service using OpenAI for intelligent responses
"""
import os
import logging
from typing import Optional, Dict, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # System prompt for StockLot livestock marketplace
        self.system_prompt = """
You are a helpful AI assistant for StockLot, South Africa's premier livestock marketplace. 
You help users with questions about buying and selling livestock, payments, shipping, and general marketplace usage.

Key information about StockLot:
- We're a South African livestock marketplace connecting farmers and buyers
- We sell cattle, goats, sheep, pigs, chickens, and other livestock
- We use secure escrow payments for buyer protection
- Sellers can set their own shipping costs (standard and express options)
- We support South African banking for payments and payouts
- Users can add livestock to cart and checkout like any e-commerce site
- We have vet certification badges for animal health verification
- We serve all 9 South African provinces
- Our platform fee is 10% on successful sales

Important contact information:
- Email: support@stocklot.co.za
- Phone: +27 11 123 4567
- Website: stocklot.co.za

Always be helpful, professional, and focus on livestock trading in South Africa.
If you don't know something specific, direct users to contact our support team.
Keep responses concise and practical.
"""

    async def get_faq_response(self, question: str, user_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get an AI-powered response to user questions about StockLot
        """
        try:
            # Prepare the conversation
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": question}
            ]
            
            # Add user context if available
            if user_context:
                context_info = f"User context: {user_context.get('user_type', 'visitor')} from {user_context.get('location', 'South Africa')}"
                messages.insert(1, {"role": "system", "content": context_info})

            # Get response from OpenAI
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",  # Fast and cost-effective
                messages=messages,
                max_tokens=300,
                temperature=0.7,
                presence_penalty=0.0,
                frequency_penalty=0.0
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            return self._get_fallback_response()
    
    async def generate_listing_description(self, animal_details: Dict[str, Any]) -> str:
        """
        Generate an engaging listing description for livestock
        """
        try:
            prompt = f"""
Create a compelling, professional listing description for this livestock:
- Animal: {animal_details.get('species', 'Livestock')}
- Breed: {animal_details.get('breed', 'Not specified')}
- Age: {animal_details.get('age', 'Not specified')}
- Weight: {animal_details.get('weight', 'Not specified')}
- Sex: {animal_details.get('sex', 'Not specified')}
- Health status: {animal_details.get('health_status', 'Healthy')}
- Purpose: {animal_details.get('purpose', 'Not specified')}

Write a 2-3 sentence description that highlights the animal's qualities and value proposition for South African farmers/buyers.
Be professional, factual, and appealing to livestock buyers.
"""

            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a livestock expert writing compelling but accurate descriptions for South African livestock marketplace listings."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.8
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating listing description: {e}")
            return f"Quality {animal_details.get('species', 'livestock')} available for sale. {animal_details.get('breed', 'Premium breed')} in excellent condition."
    
    async def analyze_livestock_image(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze livestock image using OpenAI Vision
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this livestock image and provide: 1) Animal type/species, 2) Estimated age category (young/adult/mature), 3) General health appearance (1-5 rating), 4) Any notable features. Be concise and practical for a livestock marketplace."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url}
                            }
                        ]
                    }
                ],
                max_tokens=200
            )
            
            analysis = response.choices[0].message.content.strip()
            
            # Parse the response into structured data
            return {
                "analysis": analysis,
                "confidence": "high",
                "timestamp": "2024-08-20"
            }
            
        except Exception as e:
            logger.error(f"Error analyzing livestock image: {e}")
            return {
                "analysis": "Unable to analyze image at this time",
                "confidence": "low", 
                "error": str(e)
            }
    
    def _get_fallback_response(self) -> str:
        """
        Fallback response when AI is unavailable
        """
        return """I'm having trouble connecting to our AI system right now, but our support team can help! 

📧 Email: support@stocklot.co.za
📞 Call: +27 11 123 4567

Common questions:
• How to buy livestock: Browse marketplace → Add to Cart → Checkout
• How to sell: Create listing with photos and details
• Payments: Secure escrow system protects both buyers and sellers
• Shipping: Sellers set their own rates, we connect you directly

Is there something specific I can help you with?"""

# Global AI service instance
ai_service = AIService()