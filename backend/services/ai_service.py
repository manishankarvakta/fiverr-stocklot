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
        
        # System prompt for StockLot livestock marketplace - COMPREHENSIVE & ACCURATE
        self.system_prompt = """You are StockLot, the livestock & game marketplace assistant for South Africa and global exporters.

CRITICAL - StockLot marketplace categories (YOU MUST ACKNOWLEDGE ALL OF THESE):
✅ POULTRY: Chickens, ducks, turkeys, geese, ostriches
✅ RUMINANTS: Cattle, goats, sheep, buffalo  
✅ AQUACULTURE: Fish farming, prawns, aquatic livestock (WE DEFINITELY SELL FISH!)
✅ GAME ANIMALS: Kudu, eland, springbok, ostrich (through approved processors)
✅ SMALL LIVESTOCK: Pigs, rabbits
✅ EXOTIC/OTHER: Any farmed animal for commercial purposes

Your goals:
1) Help users discover animals, breeds, game species (e.g., kudu, eland, ostrich), fertilised eggs, day-old chicks, AQUACULTURE (fish), and related logistics on StockLot.
2) Explain our flows: Buy Requests, Listings, Auctions, Escrow, Delivery, Abattoirs, Export/Import.
3) Answer general chat relevant to livestock/game trading, husbandry, transport, pricing, regulations, or meat processing.

CRITICAL RULES:
- StockLot DOES sell fish through our Aquaculture category - never say we don't sell fish!
- NEVER reveal phone numbers, email addresses, or direct contact details
- Always use "Contact support through the platform" or "Use in-app messaging after escrow"
- For wild pigs: clarify if they want meat (from processors) vs live animals (regulated)
- For game meat: must be from approved abattoirs/processors with permits

Platform Features:
- Secure escrow payments for buyer protection  
- Sellers set their own delivery rates (standard and express options)
- South African banking integration for payments and payouts
- Vet certification badges for animal health verification
- Nationwide service across all 9 provinces
- Platform fee varies by transaction type and value

Constraints & Safety:
- No illegal wildlife trade, endangered species, CITES-restricted items
- Respect disease and quarantine controls (FMD, avian influenza)
- Never complete payments or reveal internal admin actions
- Be concise, friendly, actionable - use bullet points

Output Style:
- Short answers first, then optional "Next steps"
- Group by species → product type (live, breeding stock, meat cuts)
- Provide clear CTAs: "Create Buy Request", "Browse Aquaculture", "Browse Game/Exotic"
- Convert money to ZAR format when relevant

For support: Direct users to use "in-app messaging" or "platform support system" - NEVER provide phone numbers or email addresses."""

    async def get_faq_response(self, question: str, user_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get an AI-powered response to user questions about StockLot
        """
        try:
            # Prepare the conversation with enhanced training examples
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": "Do you have fish for sale?"},
                {"role": "assistant", "content": "Yes! StockLot has an active Aquaculture category with various fish species, prawns, and aquatic livestock. You can find:\n• Live fish for farming\n• Fingerlings for stocking\n• Breeding stock\n• Aquaculture equipment\n\nNext steps:\n• Browse Aquaculture → Fish\n• Create a Buy Request with your specific fish requirements"},
                {"role": "user", "content": "Do you have game meat?"},
                {"role": "assistant", "content": "Yes! StockLot supports game farming and game meat through approved processors. Browse our Game/Exotic category for kudu, springbok, eland, and other game products. All game sales require proper permits and must come from registered processors with veterinary certificates."},
                {"role": "user", "content": "How can I contact support?"},
                {"role": "assistant", "content": "You can contact support through our platform messaging system. Once you're logged in, use the in-app messaging feature or contact support through the platform. This ensures secure communication and maintains your transaction protection."},
                {"role": "user", "content": f"StockLot covers ALL livestock including Aquaculture (fish), Game Animals (kudu, eland), Poultry, Ruminants, and Small Livestock. NEVER provide phone numbers or emails - only mention platform messaging.\n\nQuestion: {question}"}
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
                temperature=0.3,  # Lower temperature for consistency
                presence_penalty=0.0,
                frequency_penalty=0.0
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Filter out any contact information that might slip through
            ai_response = self._remove_contact_details(ai_response)
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            return self._get_fallback_response()
    
    def _remove_contact_details(self, response: str) -> str:
        """Remove any phone numbers, emails, or contact details from response"""
        import re
        
        # Remove phone numbers (comprehensive patterns)
        response = re.sub(r'\+?[\d\s\-\(\)]{10,}', '[contact removed]', response)
        response = re.sub(r'(\+27|0)\s*\d{2}\s*\d{3}\s*\d{4}', '[contact removed]', response)
        response = re.sub(r'\b\d{3}[\-\s]?\d{3}[\-\s]?\d{4}\b', '[contact removed]', response)
        response = re.sub(r'\b\d{10,}\b', '[contact removed]', response)
        
        # Remove email addresses
        response = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[contact removed]', response)
        
        # Remove specific StockLot contact details
        response = re.sub(r'support@stocklot\.co\.za', 'platform support', response, flags=re.IGNORECASE)
        response = re.sub(r'hello@stocklot\.farm', 'platform messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'info@stocklot\.(co\.za|farm)', 'platform support', response, flags=re.IGNORECASE)
        
        # Remove contact action phrases and replace with platform alternatives
        response = re.sub(r'contact.*support.*team.*at.*', 'contact support through the platform', response, flags=re.IGNORECASE)
        response = re.sub(r'call.*\d+', 'use in-app messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'phone.*\d+', 'platform messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'email.*us.*at.*', 'contact through the platform', response, flags=re.IGNORECASE)
        
        # Replace contact references with platform messaging
        response = response.replace('[contact removed]', 'platform messaging')
        response = response.replace('contact us', 'contact support through the platform')
        response = response.replace('call us', 'use in-app messaging')
        response = response.replace('email us', 'contact through platform support')
        
        return response
    
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
        Fallback response when AI is unavailable - NO CONTACT DETAILS
        """
        return """I'm having trouble connecting to our AI system right now, but I can still help with basic information! 

🐄 **StockLot Marketplace Features:**
• **Livestock Categories**: Poultry, Ruminants, Aquaculture (fish), Game Animals, Small Livestock
• **Secure Payments**: Escrow system protects buyers and sellers
• **Nationwide Delivery**: Sellers set their own transport rates
• **Health Certified**: All animals come with vet certificates

📋 **Quick Help:**
• **Buy**: Browse marketplace → Add to Cart → Secure checkout
• **Sell**: Create listing with photos and detailed descriptions  
• **Support**: Use in-app messaging or platform support system

🐟 **Yes, we have fish!** Browse our Aquaculture category for fish farming needs.
🦌 **Game meat available** through approved processors with proper permits.

Contact support through the platform messaging system for personalized help!"""

# Global AI service instance
ai_service = AIService()