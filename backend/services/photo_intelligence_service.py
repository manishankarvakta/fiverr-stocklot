import os
import logging
import openai
import base64
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from PIL import Image, ImageStat
import io
import cv2
import numpy as np

logger = logging.getLogger(__name__)

class PhotoIntelligenceService:
    def __init__(self, db):
        self.db = db
        self.openai_client = openai.OpenAI(
            api_key=os.environ.get('OPENAI_API_KEY')
        )
    
    async def analyze_livestock_photo(
        self, 
        image_data: str,  # Base64 encoded
        listing_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Comprehensive AI analysis of livestock photos"""
        
        try:
            # Vision AI analysis using GPT-4V
            vision_analysis = await self._analyze_with_vision_ai(image_data, listing_context)
            
            # Technical image quality analysis
            technical_analysis = self._analyze_technical_quality(image_data)
            
            # Livestock-specific analysis
            livestock_analysis = await self._analyze_livestock_specific(image_data, listing_context)
            
            # Marketing effectiveness analysis
            marketing_analysis = self._analyze_marketing_effectiveness(
                vision_analysis, technical_analysis, livestock_analysis
            )
            
            # Generate comprehensive recommendations
            recommendations = self._generate_photo_recommendations(
                vision_analysis, technical_analysis, livestock_analysis, marketing_analysis
            )
            
            # Calculate overall quality score
            overall_score = self._calculate_overall_quality_score(
                vision_analysis, technical_analysis, livestock_analysis, marketing_analysis
            )
            
            return {
                "success": True,
                "overall_quality_score": overall_score,
                "vision_analysis": vision_analysis,
                "technical_analysis": technical_analysis,
                "livestock_analysis": livestock_analysis,
                "marketing_analysis": marketing_analysis,
                "recommendations": recommendations,
                "improvement_areas": self._identify_improvement_areas(overall_score, recommendations),
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Photo intelligence analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def _analyze_with_vision_ai(
        self, 
        image_data: str, 
        listing_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze image using GPT-4 Vision"""
        
        try:
            species = listing_context.get('species', 'livestock')
            breed = listing_context.get('breed', 'unknown')
            
            # Prepare detailed prompt for livestock analysis
            prompt = f"""
            Analyze this {species} photograph for a livestock marketplace listing. The animal is described as {breed} breed.
            
            Evaluate these aspects and provide a JSON response:
            
            1. Animal Visibility & Positioning:
               - Can you clearly see the animal(s)?
               - Is the animal positioned well in frame?
               - Are key features visible?
            
            2. Health & Condition Assessment:
               - Does the animal appear healthy?
               - Visible condition indicators?
               - Any concerns or positive signs?
            
            3. Photo Composition:
               - Lighting quality
               - Background suitability
               - Framing and angle
               - Overall professional appearance
            
            4. Marketing Appeal:
               - How appealing is this for potential buyers?
               - What creates positive/negative impressions?
               - Commercial viability assessment
            
            5. Livestock-Specific Quality:
               - Species-appropriate presentation
               - Breed characteristics visible
               - Environmental context suitability
            
            Respond with JSON containing:
            - visibility_score: 0-10
            - health_assessment: object with score and observations
            - composition_score: 0-10
            - marketing_appeal: 0-10
            - livestock_quality: 0-10
            - key_strengths: array of positive aspects
            - areas_for_improvement: array of improvement suggestions
            - buyer_appeal_factors: array of what buyers would find attractive
            - professional_assessment: overall professional rating 0-10
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            # Parse AI response
            analysis = json.loads(response.choices[0].message.content)
            
            return {
                "visibility_score": analysis.get("visibility_score", 5),
                "health_assessment": analysis.get("health_assessment", {"score": 7, "observations": "Unable to assess"}),
                "composition_score": analysis.get("composition_score", 5),
                "marketing_appeal": analysis.get("marketing_appeal", 5),
                "livestock_quality": analysis.get("livestock_quality", 5),
                "key_strengths": analysis.get("key_strengths", []),
                "areas_for_improvement": analysis.get("areas_for_improvement", []),
                "buyer_appeal_factors": analysis.get("buyer_appeal_factors", []),
                "professional_assessment": analysis.get("professional_assessment", 5),
                "ai_confidence": 0.85
            }
            
        except Exception as e:
            logger.error(f"Vision AI analysis failed: {e}")
            return {
                "visibility_score": 5,
                "health_assessment": {"score": 5, "observations": "Analysis unavailable"},
                "composition_score": 5,
                "marketing_appeal": 5,
                "livestock_quality": 5,
                "key_strengths": [],
                "areas_for_improvement": ["Vision analysis unavailable"],
                "buyer_appeal_factors": [],
                "professional_assessment": 5,
                "ai_confidence": 0.0,
                "error": str(e)
            }
    
    def _analyze_technical_quality(self, image_data: str) -> Dict[str, Any]:
        """Analyze technical aspects of the image"""
        
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array for OpenCV processing
            img_array = np.array(image)
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Analyze various technical aspects
            resolution_analysis = self._analyze_resolution(image)
            brightness_analysis = self._analyze_brightness(image)
            sharpness_analysis = self._analyze_sharpness(img_cv)
            color_analysis = self._analyze_color_balance(image)
            noise_analysis = self._analyze_noise_level(img_cv)
            composition_analysis = self._analyze_composition_technical(img_cv)
            
            # Calculate overall technical score
            technical_score = (
                resolution_analysis["score"] * 0.2 +
                brightness_analysis["score"] * 0.2 +
                sharpness_analysis["score"] * 0.25 +
                color_analysis["score"] * 0.15 +
                noise_analysis["score"] * 0.1 +
                composition_analysis["score"] * 0.1
            )
            
            return {
                "overall_technical_score": round(technical_score, 1),
                "resolution": resolution_analysis,
                "brightness": brightness_analysis,
                "sharpness": sharpness_analysis,
                "color_balance": color_analysis,
                "noise_level": noise_analysis,
                "composition": composition_analysis,
                "file_size": len(image_bytes),
                "dimensions": {"width": image.width, "height": image.height},
                "aspect_ratio": round(image.width / image.height, 2)
            }
            
        except Exception as e:
            logger.error(f"Technical analysis failed: {e}")
            return {
                "overall_technical_score": 5.0,
                "error": str(e),
                "dimensions": {"width": 0, "height": 0},
                "aspect_ratio": 1.0
            }
    
    def _analyze_resolution(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze image resolution quality"""
        
        width, height = image.size
        megapixels = (width * height) / 1_000_000
        
        if megapixels >= 8:
            score = 10
            quality = "Excellent"
        elif megapixels >= 4:
            score = 8
            quality = "Good"
        elif megapixels >= 2:
            score = 6
            quality = "Acceptable"
        elif megapixels >= 1:
            score = 4
            quality = "Low"
        else:
            score = 2
            quality = "Very Low"
        
        return {
            "score": score,
            "quality": quality,
            "megapixels": round(megapixels, 2),
            "width": width,
            "height": height,
            "recommendation": "Use higher resolution camera" if score < 6 else "Resolution is adequate"
        }
    
    def _analyze_brightness(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze image brightness and exposure"""
        
        # Calculate average brightness
        grayscale = image.convert('L')
        stat = ImageStat.Stat(grayscale)
        brightness = stat.mean[0]  # 0-255 scale
        
        # Evaluate brightness
        if 120 <= brightness <= 180:
            score = 10
            quality = "Optimal"
        elif 100 <= brightness <= 200:
            score = 8
            quality = "Good"
        elif 80 <= brightness <= 220:
            score = 6
            quality = "Acceptable"
        elif 60 <= brightness <= 240:
            score = 4
            quality = "Poor"
        else:
            score = 2
            quality = "Very Poor"
        
        return {
            "score": score,
            "quality": quality,
            "brightness_value": round(brightness, 1),
            "recommendation": self._get_brightness_recommendation(brightness)
        }
    
    def _analyze_sharpness(self, img_cv: np.ndarray) -> Dict[str, Any]:
        """Analyze image sharpness using Laplacian variance"""
        
        try:
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Score based on variance (higher = sharper)
            if laplacian_var >= 1000:
                score = 10
                quality = "Very Sharp"
            elif laplacian_var >= 500:
                score = 8
                quality = "Sharp"
            elif laplacian_var >= 200:
                score = 6
                quality = "Acceptable"
            elif laplacian_var >= 100:
                score = 4
                quality = "Soft"
            else:
                score = 2
                quality = "Blurry"
            
            return {
                "score": score,
                "quality": quality,
                "sharpness_value": round(laplacian_var, 1),
                "recommendation": "Ensure proper focus and stable camera" if score < 6 else "Sharpness is good"
            }
            
        except Exception:
            return {
                "score": 5,
                "quality": "Unknown",
                "sharpness_value": 0,
                "recommendation": "Could not analyze sharpness"
            }
    
    def _analyze_color_balance(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze color balance and saturation"""
        
        try:
            # Convert to RGB and calculate channel statistics
            rgb_image = image.convert('RGB')
            stat = ImageStat.Stat(rgb_image)
            
            r_mean, g_mean, b_mean = stat.mean
            r_std, g_std, b_std = stat.stddev
            
            # Calculate color balance (how close RGB channels are)
            color_variance = np.var([r_mean, g_mean, b_mean])
            avg_saturation = (r_std + g_std + b_std) / 3
            
            # Score color balance
            if color_variance <= 100:
                balance_score = 10
            elif color_variance <= 300:
                balance_score = 8
            elif color_variance <= 600:
                balance_score = 6
            else:
                balance_score = 4
            
            # Score saturation
            if 40 <= avg_saturation <= 80:
                saturation_score = 10
            elif 30 <= avg_saturation <= 90:
                saturation_score = 8
            else:
                saturation_score = 6
            
            overall_score = (balance_score + saturation_score) / 2
            
            return {
                "score": round(overall_score, 1),
                "color_balance": balance_score,
                "saturation": saturation_score,
                "rgb_means": [round(r_mean, 1), round(g_mean, 1), round(b_mean, 1)],
                "recommendation": self._get_color_recommendation(balance_score, saturation_score)
            }
            
        except Exception:
            return {
                "score": 5,
                "color_balance": 5,
                "saturation": 5,
                "rgb_means": [128, 128, 128],
                "recommendation": "Could not analyze color balance"
            }
    
    def _analyze_noise_level(self, img_cv: np.ndarray) -> Dict[str, Any]:
        """Analyze image noise level"""
        
        try:
            # Convert to grayscale for noise analysis
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # Calculate noise using standard deviation of Laplacian
            noise_level = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Estimate noise score (inverse relationship)
            if noise_level >= 1000:
                score = 10  # High variance = low noise (sharp details)
            elif noise_level >= 500:
                score = 8
            elif noise_level >= 200:
                score = 6
            elif noise_level >= 100:
                score = 4
            else:
                score = 2  # Low variance = high noise (or blur)
            
            return {
                "score": score,
                "noise_level": "Low" if score >= 8 else "Medium" if score >= 6 else "High",
                "technical_value": round(noise_level, 1),
                "recommendation": "Use better lighting or lower ISO" if score < 6 else "Noise level is acceptable"
            }
            
        except Exception:
            return {
                "score": 5,
                "noise_level": "Unknown",
                "technical_value": 0,
                "recommendation": "Could not analyze noise"
            }
    
    def _analyze_composition_technical(self, img_cv: np.ndarray) -> Dict[str, Any]:
        """Analyze technical composition aspects"""
        
        try:
            height, width = img_cv.shape[:2]
            
            # Analyze rule of thirds (simplified)
            third_x = width // 3
            third_y = height // 3
            
            # Calculate center mass (simplified composition analysis)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # Find contours to identify main subjects
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            composition_score = 7  # Default score
            
            if len(contours) > 0:
                # Find largest contour (likely main subject)
                largest_contour = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # Check if subject is well-positioned
                center_x = x + w // 2
                center_y = y + h // 2
                
                # Rule of thirds check
                if (third_x <= center_x <= 2 * third_x) or (third_y <= center_y <= 2 * third_y):
                    composition_score = 9
                elif width * 0.2 <= center_x <= width * 0.8 and height * 0.2 <= center_y <= height * 0.8:
                    composition_score = 7
                else:
                    composition_score = 5
            
            return {
                "score": composition_score,
                "rule_of_thirds": composition_score >= 8,
                "subject_positioning": "Good" if composition_score >= 7 else "Needs improvement",
                "recommendation": "Subject is well-positioned" if composition_score >= 7 else "Center the subject better or use rule of thirds"
            }
            
        except Exception:
            return {
                "score": 5,
                "rule_of_thirds": False,
                "subject_positioning": "Unknown",
                "recommendation": "Could not analyze composition"
            }
    
    async def _analyze_livestock_specific(
        self, 
        image_data: str, 
        listing_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Livestock-specific image analysis"""
        
        species = listing_context.get('species', '').lower()
        
        # Species-specific analysis criteria
        species_criteria = {
            'cattle': {
                'key_features': ['body condition', 'udder visibility', 'stance', 'coat condition'],
                'ideal_angles': ['side profile', 'front view'],
                'environment': ['pasture', 'barn', 'clean background']
            },
            'poultry': {
                'key_features': ['feather condition', 'comb color', 'leg condition', 'posture'],
                'ideal_angles': ['side profile', 'standing position'],
                'environment': ['clean coop', 'outdoor range', 'neutral background']
            },
            'sheep': {
                'key_features': ['wool quality', 'body condition', 'face visibility', 'stance'],
                'ideal_angles': ['side profile', 'wool detail'],
                'environment': ['pasture', 'shearing area', 'clean space']
            },
            'goats': {
                'key_features': ['body condition', 'coat quality', 'horn visibility', 'udder'],
                'ideal_angles': ['side profile', 'head shot'],
                'environment': ['pasture', 'pen', 'natural setting']
            }
        }
        
        criteria = species_criteria.get(species, species_criteria['cattle'])
        
        # Use AI to analyze against species-specific criteria
        try:
            prompt = f"""
            Analyze this {species} image for livestock marketplace effectiveness:
            
            Key features to evaluate: {', '.join(criteria['key_features'])}
            Ideal angles: {', '.join(criteria['ideal_angles'])}
            Suitable environments: {', '.join(criteria['environment'])}
            
            Rate each aspect 0-10 and provide JSON:
            {{
                "species_specific_score": overall_score,
                "feature_visibility": {{"feature": score}},
                "angle_appropriateness": score,
                "environment_suitability": score,
                "breed_characteristics": score,
                "commercial_appeal": score,
                "veterinary_assessment": {{"visible_health_indicators": [], "concerns": []}},
                "recommendations": []
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=600,
                temperature=0.2
            )
            
            livestock_analysis = json.loads(response.choices[0].message.content)
            
            return {
                "species": species,
                "species_specific_score": livestock_analysis.get("species_specific_score", 6),
                "feature_visibility": livestock_analysis.get("feature_visibility", {}),
                "angle_appropriateness": livestock_analysis.get("angle_appropriateness", 6),
                "environment_suitability": livestock_analysis.get("environment_suitability", 6),
                "breed_characteristics": livestock_analysis.get("breed_characteristics", 6),
                "commercial_appeal": livestock_analysis.get("commercial_appeal", 6),
                "veterinary_assessment": livestock_analysis.get("veterinary_assessment", {}),
                "recommendations": livestock_analysis.get("recommendations", []),
                "analysis_criteria": criteria
            }
            
        except Exception as e:
            logger.error(f"Livestock-specific analysis failed: {e}")
            return {
                "species": species,
                "species_specific_score": 6,
                "feature_visibility": {},
                "angle_appropriateness": 6,
                "environment_suitability": 6,
                "breed_characteristics": 6,
                "commercial_appeal": 6,
                "veterinary_assessment": {"visible_health_indicators": [], "concerns": []},
                "recommendations": ["Livestock-specific analysis unavailable"],
                "analysis_criteria": criteria,
                "error": str(e)
            }
    
    def _analyze_marketing_effectiveness(
        self,
        vision_analysis: Dict[str, Any],
        technical_analysis: Dict[str, Any],
        livestock_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze marketing effectiveness of the photo"""
        
        # Calculate marketing effectiveness based on multiple factors
        buyer_appeal = vision_analysis.get("marketing_appeal", 5)
        professional_look = vision_analysis.get("professional_assessment", 5)
        technical_quality = technical_analysis.get("overall_technical_score", 5)
        livestock_presentation = livestock_analysis.get("commercial_appeal", 5)
        
        # Weighted marketing score
        marketing_score = (
            buyer_appeal * 0.3 +
            professional_look * 0.25 +
            technical_quality * 0.25 +
            livestock_presentation * 0.2
        )
        
        # Analyze specific marketing factors
        trust_factors = []
        concern_factors = []
        
        if technical_quality >= 7:
            trust_factors.append("High image quality builds buyer confidence")
        else:
            concern_factors.append("Low image quality may reduce buyer trust")
        
        if vision_analysis.get("visibility_score", 0) >= 8:
            trust_factors.append("Clear animal visibility increases buyer interest")
        else:
            concern_factors.append("Poor animal visibility reduces marketing impact")
        
        if livestock_analysis.get("environment_suitability", 0) >= 7:
            trust_factors.append("Professional environment presentation")
        else:
            concern_factors.append("Environment may not appeal to buyers")
        
        # Determine marketing effectiveness level
        if marketing_score >= 8:
            effectiveness_level = "Excellent"
            conversion_potential = "High"
        elif marketing_score >= 6:
            effectiveness_level = "Good"
            conversion_potential = "Medium"
        elif marketing_score >= 4:
            effectiveness_level = "Fair"
            conversion_potential = "Low"
        else:
            effectiveness_level = "Poor"
            conversion_potential = "Very Low"
        
        return {
            "marketing_score": round(marketing_score, 1),
            "effectiveness_level": effectiveness_level,
            "conversion_potential": conversion_potential,
            "trust_factors": trust_factors,
            "concern_factors": concern_factors,
            "buyer_appeal_score": buyer_appeal,
            "professional_presentation": professional_look,
            "estimated_view_to_inquiry_rate": self._estimate_inquiry_rate(marketing_score),
            "competitive_advantage": "Strong" if marketing_score >= 8 else "Moderate" if marketing_score >= 6 else "Weak"
        }
    
    def _generate_photo_recommendations(
        self,
        vision_analysis: Dict[str, Any],
        technical_analysis: Dict[str, Any],
        livestock_analysis: Dict[str, Any],
        marketing_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive photo improvement recommendations"""
        
        immediate_actions = []
        technical_improvements = []
        composition_tips = []
        marketing_optimizations = []
        
        # Technical recommendations
        if technical_analysis.get("overall_technical_score", 5) < 6:
            technical_improvements.append("Improve image quality - use better camera or smartphone")
        
        brightness_score = technical_analysis.get("brightness", {}).get("score", 5)
        if brightness_score < 6:
            technical_improvements.append("Improve lighting - use natural daylight or proper artificial lighting")
        
        sharpness_score = technical_analysis.get("sharpness", {}).get("score", 5)
        if sharpness_score < 6:
            technical_improvements.append("Ensure sharp focus - use autofocus or manual focus carefully")
        
        # Composition recommendations
        if vision_analysis.get("composition_score", 5) < 7:
            composition_tips.append("Improve composition - center the animal or use rule of thirds")
        
        if vision_analysis.get("visibility_score", 5) < 8:
            composition_tips.append("Ensure clear animal visibility - remove obstructions and get closer")
        
        # Livestock-specific recommendations
        if livestock_analysis.get("environment_suitability", 5) < 7:
            immediate_actions.append("Choose a cleaner, more professional background")
        
        if livestock_analysis.get("angle_appropriateness", 5) < 7:
            composition_tips.append("Try different angles - side profile often works best")
        
        # Marketing recommendations
        if marketing_analysis.get("marketing_score", 5) < 7:
            marketing_optimizations.append("Add multiple photos showing different angles")
            marketing_optimizations.append("Include close-up shots of key features")
        
        if marketing_analysis.get("buyer_appeal_score", 5) < 7:
            marketing_optimizations.append("Show the animal in natural, appealing environment")
        
        # Priority recommendations
        priority_recommendations = []
        if technical_analysis.get("overall_technical_score", 5) < 5:
            priority_recommendations.append("URGENT: Improve basic image quality")
        if vision_analysis.get("visibility_score", 5) < 5:
            priority_recommendations.append("URGENT: Ensure animal is clearly visible")
        if marketing_analysis.get("marketing_score", 5) < 4:
            priority_recommendations.append("URGENT: This photo may hurt sales - consider replacing")
        
        return {
            "priority_recommendations": priority_recommendations,
            "immediate_actions": immediate_actions,
            "technical_improvements": technical_improvements,
            "composition_tips": composition_tips,
            "marketing_optimizations": marketing_optimizations,
            "quick_wins": self._identify_quick_wins(vision_analysis, technical_analysis),
            "effort_vs_impact": self._analyze_effort_vs_impact(
                technical_analysis, vision_analysis, marketing_analysis
            )
        }
    
    def _calculate_overall_quality_score(
        self,
        vision_analysis: Dict[str, Any],
        technical_analysis: Dict[str, Any],
        livestock_analysis: Dict[str, Any],
        marketing_analysis: Dict[str, Any]
    ) -> float:
        """Calculate overall photo quality score"""
        
        # Weighted combination of all analysis scores
        weights = {
            "technical": 0.25,
            "vision": 0.30,
            "livestock": 0.25,
            "marketing": 0.20
        }
        
        technical_score = technical_analysis.get("overall_technical_score", 5)
        
        # Average vision scores
        vision_scores = [
            vision_analysis.get("visibility_score", 5),
            vision_analysis.get("composition_score", 5),
            vision_analysis.get("professional_assessment", 5)
        ]
        vision_score = sum(vision_scores) / len(vision_scores)
        
        livestock_score = livestock_analysis.get("species_specific_score", 5)
        marketing_score = marketing_analysis.get("marketing_score", 5)
        
        overall_score = (
            technical_score * weights["technical"] +
            vision_score * weights["vision"] +
            livestock_score * weights["livestock"] +
            marketing_score * weights["marketing"]
        )
        
        return round(overall_score, 1)
    
    def _identify_improvement_areas(
        self, 
        overall_score: float, 
        recommendations: Dict[str, Any]
    ) -> List[str]:
        """Identify key areas for improvement"""
        
        areas = []
        
        if overall_score < 4:
            areas.append("Critical: Complete photo replacement recommended")
        elif overall_score < 6:
            areas.append("Major improvements needed in multiple areas")
        elif overall_score < 8:
            areas.append("Good foundation - focus on refinements")
        else:
            areas.append("Excellent photo - minor optimizations only")
        
        # Add specific areas based on recommendations
        if recommendations.get("priority_recommendations"):
            areas.extend(recommendations["priority_recommendations"])
        
        return areas
    
    # Helper methods
    def _get_brightness_recommendation(self, brightness: float) -> str:
        if brightness < 80:
            return "Increase lighting - photo is too dark"
        elif brightness > 200:
            return "Reduce lighting - photo is overexposed"
        else:
            return "Brightness is acceptable"
    
    def _get_color_recommendation(self, balance_score: int, saturation_score: int) -> str:
        if balance_score < 6:
            return "Adjust white balance for more natural colors"
        elif saturation_score < 6:
            return "Adjust color saturation for more appealing image"
        else:
            return "Color balance is good"
    
    def _estimate_inquiry_rate(self, marketing_score: float) -> str:
        if marketing_score >= 8:
            return "15-25%"
        elif marketing_score >= 6:
            return "8-15%"
        elif marketing_score >= 4:
            return "3-8%"
        else:
            return "1-3%"
    
    def _identify_quick_wins(
        self, 
        vision_analysis: Dict[str, Any], 
        technical_analysis: Dict[str, Any]
    ) -> List[str]:
        """Identify easy improvements with high impact"""
        
        quick_wins = []
        
        if technical_analysis.get("brightness", {}).get("score", 5) < 6:
            quick_wins.append("Take photo in better lighting")
        
        if vision_analysis.get("visibility_score", 5) < 7:
            quick_wins.append("Get closer to the animal")
        
        if technical_analysis.get("composition", {}).get("score", 5) < 7:
            quick_wins.append("Center the animal in frame")
        
        return quick_wins
    
    def _analyze_effort_vs_impact(
        self,
        technical_analysis: Dict[str, Any],
        vision_analysis: Dict[str, Any],
        marketing_analysis: Dict[str, Any]
    ) -> Dict[str, List[str]]:
        """Analyze effort vs impact for improvements"""
        
        return {
            "low_effort_high_impact": [
                "Better lighting",
                "Clean background", 
                "Get closer to subject"
            ],
            "medium_effort_high_impact": [
                "Multiple angle shots",
                "Professional staging",
                "Better camera/phone"
            ],
            "high_effort_medium_impact": [
                "Professional photography",
                "Studio lighting setup",
                "Post-processing editing"
            ]
        }