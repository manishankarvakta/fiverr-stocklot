"""
Google reCAPTCHA Enterprise Service
Handles server-side reCAPTCHA token verification using Google Cloud API
"""

import os
import logging
from typing import Optional, Dict, Any
from google.cloud import recaptchaenterprise_v1
from google.cloud.recaptchaenterprise_v1 import Assessment

logger = logging.getLogger(__name__)

class RecaptchaService:
    def __init__(self):
        self.project_id = os.getenv('RECAPTCHA_PROJECT_ID')
        self.site_key = os.getenv('RECAPTCHA_SITE_KEY')
        self.client = None
        
        # Initialize the client if configured
        if self.is_configured():
            try:
                self.client = recaptchaenterprise_v1.RecaptchaEnterpriseServiceClient()
                logger.info("reCAPTCHA Enterprise client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize reCAPTCHA Enterprise client: {e}")
                self.client = None
    
    def create_assessment(
        self, 
        token: str, 
        recaptcha_action: str,
        user_ip_address: Optional[str] = None
    ) -> Optional[Assessment]:
        """
        Create an assessment to analyze the risk of a UI action.
        
        Args:
            token: The generated token obtained from the client.
            recaptcha_action: Action name corresponding to the token.
            user_ip_address: Optional user IP address for enhanced analysis.
            
        Returns:
            Assessment response or None if verification fails.
        """
        try:
            if not self.client or not self.is_configured():
                logger.warning("reCAPTCHA not properly configured")
                return None

            # Set the properties of the event to be tracked.
            event = recaptchaenterprise_v1.Event()
            event.site_key = self.site_key
            event.token = token
            
            if user_ip_address:
                event.user_ip_address = user_ip_address

            assessment = recaptchaenterprise_v1.Assessment()
            assessment.event = event

            project_name = f"projects/{self.project_id}"

            # Build the assessment request.
            request = recaptchaenterprise_v1.CreateAssessmentRequest()
            request.assessment = assessment
            request.parent = project_name

            response = self.client.create_assessment(request)

            # Check if the token is valid.
            if not response.token_properties.valid:
                logger.warning(
                    f"reCAPTCHA token invalid: {response.token_properties.invalid_reason}"
                )
                return None

            # Check if the expected action was executed.
            if response.token_properties.action != recaptcha_action:
                logger.warning(
                    f"reCAPTCHA action mismatch. Expected: {recaptcha_action}, "
                    f"Got: {response.token_properties.action}"
                )
                return None

            # Log the assessment results
            logger.info(
                f"reCAPTCHA assessment successful. Score: {response.risk_analysis.score}, "
                f"Action: {recaptcha_action}"
            )
            
            # Log reasons if any
            for reason in response.risk_analysis.reasons:
                logger.info(f"reCAPTCHA reason: {reason}")

            return response
            
        except Exception as e:
            logger.error(f"reCAPTCHA assessment error: {e}")
            return None
        
    async def verify_token(
        self, 
        token: str, 
        action: str = 'SUBMIT', 
        remote_ip: str = None
    ) -> Dict[str, Any]:
        """
        Verify reCAPTCHA Enterprise token with comprehensive analysis.
        
        Args:
            token: The reCAPTCHA token from the frontend
            action: Expected action (e.g., 'LOGIN', 'REGISTER', 'SOCIAL_LOGIN')
            remote_ip: Client IP address
            
        Returns:
            Dict with verification results
        """
        try:
            if not token:
                return {
                    'success': True,  # Allow requests without reCAPTCHA for backward compatibility
                    'score': 0.5,
                    'action': action,
                    'reason': 'No reCAPTCHA token provided'
                }
            
            if not self.is_configured():
                logger.warning("reCAPTCHA not configured, allowing request")
                return {
                    'success': True,
                    'score': 0.5,
                    'action': action,
                    'reason': 'reCAPTCHA not configured'
                }
            
            # Create assessment using Google Cloud API
            assessment = self.create_assessment(token, action, remote_ip)
            
            if not assessment:
                # Fail open for now - allow request but log the issue
                logger.warning("reCAPTCHA assessment failed, allowing request")
                return {
                    'success': True,
                    'score': 0.3,
                    'action': action,
                    'reason': 'Assessment failed'
                }
            
            # Extract score and other properties
            score = assessment.risk_analysis.score
            reasons = [str(reason) for reason in assessment.risk_analysis.reasons]
            
            # Determine if the request should be allowed
            # Score ranges from 0.0 (very likely a bot) to 1.0 (very likely a legitimate user)
            success = score >= 0.5  # Adjust threshold as needed
            
            return {
                'success': success,
                'score': score,
                'action': assessment.token_properties.action,
                'reasons': reasons,
                'valid': assessment.token_properties.valid,
                'assessment_name': assessment.name if hasattr(assessment, 'name') else None
            }
            
        except Exception as e:
            logger.error(f"reCAPTCHA verification error: {e}")
            # Fail open - allow request but log the error
            return {
                'success': True,
                'score': 0.3,
                'action': action,
                'reason': f'Verification error: {str(e)}'
            }
    
    async def is_human_likely(
        self, 
        token: str, 
        action: str = 'SUBMIT', 
        threshold: float = 0.7,
        remote_ip: str = None
    ) -> bool:
        """
        Simple helper to check if interaction appears to be from a human.
        
        Args:
            token: reCAPTCHA token
            action: Expected action
            threshold: Minimum score to consider human (0.0-1.0)
            remote_ip: Client IP address
            
        Returns:
            Boolean indicating if the interaction appears human
        """
        result = await self.verify_token(token, action, remote_ip)
        return result.get('success', False) and result.get('score', 0) >= threshold
    
    def is_configured(self) -> bool:
        """Check if reCAPTCHA is properly configured"""
        return bool(self.project_id and self.site_key)
    
    async def get_assessment_score(self, token: str, action: str = 'SUBMIT') -> float:
        """
        Get just the risk score from reCAPTCHA assessment.
        
        Returns:
            Float score between 0.0 (bot) and 1.0 (human), or 0.5 if unavailable
        """
        result = await self.verify_token(token, action)
        return result.get('score', 0.5)

# Global instance
recaptcha_service = RecaptchaService()