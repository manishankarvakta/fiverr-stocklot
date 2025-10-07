import os
import logging
from typing import Optional, Dict, Any
from google.auth.transport import requests
from google.oauth2 import id_token
import facebook
import httpx
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class SocialAuthService:
    def __init__(self, db):
        self.db = db
        self.google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.facebook_app_id = os.getenv('FACEBOOK_APP_ID')
        self.facebook_app_secret = os.getenv('FACEBOOK_APP_SECRET')
    
    async def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Google OAuth token and return user info
        """
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                self.google_client_id
            )
            
            # Check if token is for our app
            if idinfo['aud'] != self.google_client_id:
                logger.warning("Google token audience mismatch")
                return None
            
            return {
                'provider': 'google',
                'provider_id': idinfo['sub'],
                'email': idinfo['email'],
                'full_name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False)
            }
        except ValueError as e:
            logger.error(f"Invalid Google token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error verifying Google token: {e}")
            return None
    
    async def verify_facebook_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Facebook OAuth token and return user info
        """
        try:
            # Create Facebook Graph API client
            graph = facebook.GraphAPI(access_token=access_token, version="3.1")
            
            # Get user info
            user_info = graph.get_object(
                'me', 
                fields='id,name,email,picture.type(large)'
            )
            
            # Verify app ID by checking token info
            token_info = graph.get_object('me', fields='id')
            
            return {
                'provider': 'facebook',
                'provider_id': user_info['id'],
                'email': user_info.get('email', ''),
                'full_name': user_info.get('name', ''),
                'picture': user_info.get('picture', {}).get('data', {}).get('url', ''),
                'email_verified': True  # Facebook provides verified emails
            }
        except facebook.GraphAPIError as e:
            logger.error(f"Facebook Graph API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error verifying Facebook token: {e}")
            return None
    
    async def find_or_create_user(
        self, 
        social_info: Dict[str, Any], 
        role: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Find existing user by email or create new user with social info
        """
        try:
            email = social_info['email']
            if not email:
                raise ValueError("Email is required for social authentication")
            
            # Try to find existing user by email
            existing_user = await self.db.users.find_one({'email': email})
            
            if existing_user:
                # Update social provider info if not already linked
                social_providers = existing_user.get('social_providers', {})
                provider = social_info['provider']
                
                if provider not in social_providers:
                    social_providers[provider] = {
                        'provider_id': social_info['provider_id'],
                        'linked_at': datetime.now(timezone.utc),
                        'picture': social_info.get('picture', '')
                    }
                    
                    await self.db.users.update_one(
                        {'_id': existing_user['_id']},
                        {
                            '$set': {
                                'social_providers': social_providers,
                                'updated_at': datetime.now(timezone.utc)
                            }
                        }
                    )
                
                return {
                    'user_id': existing_user['id'],
                    'email': existing_user['email'],
                    'full_name': existing_user['full_name'],
                    'roles': existing_user.get('roles', ['buyer']),
                    'is_new_user': False,
                    'needs_role_selection': False
                }
            else:
                # Create new user - they'll need to select role
                user_id = social_info['provider_id']  # Use provider ID as user ID for now
                
                new_user = {
                    'id': user_id,
                    'email': email,
                    'full_name': social_info['full_name'],
                    'phone': None,
                    'roles': [role] if role else ['buyer'],  # Default to buyer if no role specified
                    'is_verified': social_info.get('email_verified', False),
                    'social_providers': {
                        social_info['provider']: {
                            'provider_id': social_info['provider_id'],
                            'linked_at': datetime.now(timezone.utc),
                            'picture': social_info.get('picture', '')
                        }
                    },
                    'created_at': datetime.now(timezone.utc),
                    'updated_at': datetime.now(timezone.utc)
                }
                
                await self.db.users.insert_one(new_user)
                
                return {
                    'user_id': user_id,
                    'email': email,
                    'full_name': social_info['full_name'],
                    'roles': new_user['roles'],
                    'is_new_user': True,
                    'needs_role_selection': not role  # They need to select role if not provided
                }
                
        except Exception as e:
            logger.error(f"Error finding/creating user: {e}")
            raise e
    
    async def update_user_role(self, user_id: str, role: str) -> bool:
        """
        Update user's role after social signup
        """
        try:
            result = await self.db.users.update_one(
                {'id': user_id},
                {
                    '$set': {
                        'roles': [role],
                        'updated_at': datetime.now(timezone.utc)
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user role: {e}")
            return False