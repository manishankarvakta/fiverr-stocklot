"""
Media Service using Cloudinary for professional image/video management
"""
import os
import logging
from typing import Optional, Dict, Any, List
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from io import BytesIO
import base64

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self):
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dhri4ssmi"),
            api_key=os.getenv("CLOUDINARY_API_KEY", "993674421885635"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET", "k8Z1L_Kx3tNhgC7HbhWVQF6tZpg"),
            secure=True
        )
        
        # Livestock-specific upload presets
        self.livestock_preset = "livestock_images"
        self.profile_preset = "profile_images"
        
    async def upload_livestock_image(
        self, 
        image_file: Any, 
        listing_id: str,
        image_type: str = "primary"
    ) -> Dict[str, Any]:
        """
        Upload livestock image with automatic optimization and transformations
        """
        try:
            # Upload to Cloudinary with livestock-specific transformations
            result = cloudinary.uploader.upload(
                image_file,
                folder=f"livestock/{listing_id}",
                public_id=f"{listing_id}_{image_type}_{int(os.urandom(4).hex(), 16)}",
                transformation=[
                    {
                        "width": 800,
                        "height": 600,
                        "crop": "fill",
                        "quality": "auto:good",
                        "fetch_format": "auto"
                    }
                ],
                tags=["livestock", "marketplace", image_type],
                context={
                    "listing_id": listing_id,
                    "image_type": image_type,
                    "uploaded_by": "stocklot_system"
                }
            )
            
            # Generate multiple size variants
            variants = self._generate_image_variants(result["public_id"])
            
            return {
                "success": True,
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "variants": variants,
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format"),
                "bytes": result.get("bytes"),
                "created_at": result.get("created_at")
            }
            
        except Exception as e:
            logger.error(f"Error uploading livestock image: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def upload_profile_image(self, image_file: Any, user_id: str) -> Dict[str, Any]:
        """
        Upload user profile image with face detection and cropping
        """
        try:
            result = cloudinary.uploader.upload(
                image_file,
                folder=f"profiles/{user_id}",
                public_id=f"profile_{user_id}",
                transformation=[
                    {
                        "width": 300,
                        "height": 300,
                        "crop": "fill",
                        "gravity": "face",
                        "quality": "auto:good",
                        "fetch_format": "auto"
                    }
                ],
                tags=["profile", "user"],
                overwrite=True,
                context={
                    "user_id": user_id,
                    "image_type": "profile"
                }
            )
            
            return {
                "success": True,
                "public_id": result["public_id"],
                "secure_url": result["secure_url"],
                "width": result.get("width"),
                "height": result.get("height")
            }
            
        except Exception as e:
            logger.error(f"Error uploading profile image: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_image_variants(self, public_id: str) -> Dict[str, str]:
        """
        Generate different sized variants of uploaded image
        """
        try:
            return {
                "thumbnail": cloudinary.utils.cloudinary_url(
                    public_id,
                    width=150, height=150, crop="fill", quality="auto:good"
                )[0],
                "small": cloudinary.utils.cloudinary_url(
                    public_id,
                    width=300, height=225, crop="fill", quality="auto:good"
                )[0],
                "medium": cloudinary.utils.cloudinary_url(
                    public_id,
                    width=600, height=450, crop="fill", quality="auto:good"
                )[0],
                "large": cloudinary.utils.cloudinary_url(
                    public_id,
                    width=1200, height=900, crop="fill", quality="auto:good"
                )[0],
                "watermarked": cloudinary.utils.cloudinary_url(
                    public_id,
                    width=800, height=600, crop="fill", quality="auto:good",
                    overlay="text:Arial_60:StockLot.co.za",
                    gravity="south_east", x=20, y=20, opacity=30
                )[0]
            }
            
        except Exception as e:
            logger.error(f"Error generating image variants: {e}")
            return {}
    
    async def delete_image(self, public_id: str) -> Dict[str, Any]:
        """
        Delete image from Cloudinary
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return {
                "success": result.get("result") == "ok",
                "public_id": public_id
            }
            
        except Exception as e:
            logger.error(f"Error deleting image: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_image_analytics(self, public_id: str) -> Dict[str, Any]:
        """
        Get analytics for uploaded image
        """
        try:
            # Get image details
            result = cloudinary.api.resource(public_id)
            
            return {
                "public_id": result["public_id"],
                "views": result.get("views", 0),
                "bytes": result.get("bytes", 0),
                "width": result.get("width", 0),
                "height": result.get("height", 0),
                "format": result.get("format"),
                "created_at": result.get("created_at"),
                "uploaded_by": result.get("context", {}).get("uploaded_by"),
                "tags": result.get("tags", [])
            }
            
        except Exception as e:
            logger.error(f"Error getting image analytics: {e}")
            return {"error": str(e)}
    
    def generate_responsive_image_html(
        self, 
        public_id: str, 
        alt_text: str,
        css_class: str = ""
    ) -> str:
        """
        Generate responsive HTML image tag with Cloudinary optimizations
        """
        try:
            return f'''
            <img 
                src="{cloudinary.utils.cloudinary_url(public_id, width="auto", crop="scale", quality="auto:good", fetch_format="auto")[0]}"
                alt="{alt_text}"
                class="{css_class}"
                loading="lazy"
                srcset="
                    {cloudinary.utils.cloudinary_url(public_id, width=300, crop="scale", quality="auto:good")[0]} 300w,
                    {cloudinary.utils.cloudinary_url(public_id, width=600, crop="scale", quality="auto:good")[0]} 600w,
                    {cloudinary.utils.cloudinary_url(public_id, width=900, crop="scale", quality="auto:good")[0]} 900w,
                    {cloudinary.utils.cloudinary_url(public_id, width=1200, crop="scale", quality="auto:good")[0]} 1200w
                "
                sizes="(max-width: 300px) 300px, (max-width: 600px) 600px, (max-width: 900px) 900px, 1200px"
            />
            '''
            
        except Exception as e:
            logger.error(f"Error generating responsive image HTML: {e}")
            return f'<img src="" alt="{alt_text}" class="{css_class}" />'

# Global media service instance
media_service = MediaService()