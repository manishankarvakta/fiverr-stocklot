import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import json

logger = logging.getLogger(__name__)

class BlogStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class AIModel(str, Enum):
    GPT_4O_MINI = "openai:gpt-4o-mini"
    CLAUDE_SONNET = "anthropic:claude-3-sonnet"
    GEMINI_PRO = "google:gemini-pro"

class BlogGenerationStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class BlogService:
    def __init__(self, db):
        self.db = db
        
    async def create_blog_post(
        self,
        title: str,
        content: str,
        author_id: str,
        excerpt: str = None,
        tags: List[str] = None,
        status: BlogStatus = BlogStatus.DRAFT,
        scheduled_at: datetime = None
    ) -> Dict[str, Any]:
        """Create a new blog post"""
        
        post_id = str(uuid.uuid4())
        slug = self._generate_slug(title)
        
        post = {
            "id": post_id,
            "slug": slug,
            "title": title,
            "excerpt": excerpt or content[:200] + "...",
            "content": content,
            "html_cached": None,  # Could add markdown to HTML conversion
            "author_id": author_id,
            "status": status.value,
            "scheduled_at": scheduled_at,
            "published_at": None,
            "tags": tags or [],
            "seo_title": title,
            "seo_description": excerpt or content[:160],
            "cover_image_url": None,
            "view_count": 0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.blog_posts.insert_one(post)
        
        # Remove MongoDB _id
        if "_id" in post:
            del post["_id"]
            
        return post
    
    async def generate_ai_blog_post(
        self,
        topic: str,
        prompt: Dict[str, Any],
        model: AIModel = AIModel.GPT_4O_MINI,
        author_id: str = None
    ) -> str:
        """Generate blog post using AI - returns job_id"""
        
        job_id = str(uuid.uuid4())
        
        job = {
            "id": job_id,
            "topic": topic,
            "prompt": prompt,
            "model": model.value,
            "status": BlogGenerationStatus.QUEUED.value,
            "author_id": author_id,
            "generated_post_id": None,
            "error": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await self.db.blog_generation_jobs.insert_one(job)
        
        # For now, simulate AI generation with placeholder content
        await self._simulate_ai_generation(job_id, topic, prompt)
        
        return job_id
    
    async def _simulate_ai_generation(self, job_id: str, topic: str, prompt: Dict[str, Any]):
        """Simulate AI blog generation (replace with actual AI service)"""
        
        try:
            # Update job status
            await self.db.blog_generation_jobs.update_one(
                {"id": job_id},
                {"$set": {"status": BlogGenerationStatus.RUNNING.value, "updated_at": datetime.now(timezone.utc)}}
            )
            
            # Generate content based on topic and prompt
            content = self._generate_sample_content(topic, prompt)
            
            # Create draft blog post
            post = await self.create_blog_post(
                title=topic,
                content=content,
                author_id="ai-system",
                excerpt=prompt.get("excerpt", content[:200] + "..."),
                tags=prompt.get("tags", ["livestock", "market-analysis"]),
                status=BlogStatus.REVIEW
            )
            
            # Update job with completed status
            await self.db.blog_generation_jobs.update_one(
                {"id": job_id},
                {
                    "$set": {
                        "status": BlogGenerationStatus.COMPLETED.value,
                        "generated_post_id": post["id"],
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
        except Exception as e:
            logger.error(f"AI generation failed for job {job_id}: {e}")
            await self.db.blog_generation_jobs.update_one(
                {"id": job_id},
                {
                    "$set": {
                        "status": BlogGenerationStatus.FAILED.value,
                        "error": str(e),
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
    
    def _generate_sample_content(self, topic: str, prompt: Dict[str, Any]) -> str:
        """Generate sample content (replace with actual AI integration)"""
        
        sections = prompt.get("sections", ["Overview", "Market Analysis", "Key Insights", "Conclusion"])
        tone = prompt.get("tone", "professional")
        length = prompt.get("length", "1200-1500 words")
        
        content = f"# {topic}\n\n"
        
        if "cattle" in topic.lower():
            content += """
## Market Overview

The South African cattle market continues to show strong fundamentals with increased demand from both domestic and export markets. Recent trends indicate steady price growth across all cattle categories.

## Current Price Analysis

### Weaner Calves
- Average price range: R25-35 per kg live weight
- Premium breeds commanding 15-20% above market average
- Strong demand from feedlot operators

### Adult Cattle
- Slaughter cattle: R28-32 per kg live weight  
- Breeding stock: R15,000-45,000 per head (breed dependent)
- Growing export opportunities to regional markets

## Breed Performance

**Nguni Cattle**: Excellent adaptation to local conditions, growing commercial interest
**Bonsmara**: Strong performance in both commercial and stud markets
**Brahman**: High demand for heat tolerance and tick resistance

## Market Drivers

1. **Export Growth**: Increased demand from Middle East and North African markets
2. **Local Consumption**: Rising middle class driving protein demand
3. **Genetics Investment**: Improved breeding programs boosting quality

## Compliance & Documentation

All cattle movements require:
- Valid health certificates
- Movement permits
- Proper identification (ear tags/brands)
- Disease-free area certifications where applicable

## Logistics Considerations

Transport remains a key cost factor. Optimal load planning and route optimization can reduce costs by 15-25%. Consider:
- Load density regulations
- Journey time limits
- Water and feed requirements
- Destination facilities

## Outlook

The cattle market outlook remains positive with strong fundamentals supporting continued growth. Key factors to watch:
- Rainfall patterns affecting grazing
- Feed cost trends
- Exchange rate impacts on exports
- Disease outbreak risks

*This analysis is based on current market data and industry reports. Always consult with agricultural advisors for specific investment decisions.*
"""
        elif "poultry" in topic.lower():
            content += """
## Poultry Market Dynamics

The South African poultry industry remains one of the most dynamic livestock sectors, with strong domestic demand and growing export potential.

## Current Market Conditions

### Day-Old Chicks
- Broiler chicks: R8-12 per chick
- Layer chicks: R15-25 per chick  
- Free-range premium: 20-30% above conventional

### Live Birds
- Broilers (6-8 weeks): R45-65 per bird
- Layers (point of lay): R85-120 per bird
- Breeding stock: R150-500 per bird

## Disease Management Focus

**Avian Influenza**: Ongoing monitoring and biosecurity measures
**Newcastle Disease**: Vaccination programs essential
**Movement Restrictions**: Check current controlled areas

## Feed Cost Impact

Feed represents 65-70% of production costs:
- Maize price trends critically impact profitability
- Soya meal availability affecting protein costs
- Alternative protein sources gaining interest

## Export Opportunities

Growing demand from:
- Regional SADC markets
- Middle East (halal certified)
- Indian Ocean islands

## Technology Adoption

Modern poultry operations increasingly adopt:
- Automated feeding systems
- Climate control technology
- Data-driven management
- Biosecurity protocols

## Regulatory Environment

Key compliance requirements:
- DAFF registration and permits
- Animal health certificates
- Food safety certifications
- Environmental impact assessments

## Market Outlook

Positive growth trajectory supported by:
- Population growth driving demand
- Protein substitution trends
- Technology improvements
- Export market development

*Industry data sourced from SAPA and DAFF reports. Market conditions subject to seasonal and economic fluctuations.*
"""
        else:
            content += f"""
## Introduction

{topic} represents an important segment of South Africa's diverse livestock industry. This analysis examines current market conditions, trends, and opportunities.

## Market Analysis

The livestock sector continues to adapt to changing consumer preferences, regulatory requirements, and global market dynamics. Key factors influencing the market include:

### Supply Factors
- Production capacity and efficiency
- Feed costs and availability
- Disease management and biosecurity
- Breeding and genetics programs

### Demand Drivers  
- Domestic consumption patterns
- Export market opportunities
- Price competitiveness
- Quality and certification requirements

## Current Trends

Several trends are shaping the livestock industry:

1. **Sustainability Focus**: Increasing emphasis on environmental responsibility
2. **Technology Adoption**: Digital tools improving efficiency and traceability
3. **Quality Premiums**: Consumer willingness to pay for higher quality products
4. **Market Consolidation**: Larger operations gaining market share

## Regulatory Environment

The livestock industry operates within a comprehensive regulatory framework designed to ensure:
- Animal health and welfare
- Food safety and quality
- Environmental protection
- Fair trade practices

## Future Outlook

The outlook for {topic.lower()} remains cautiously optimistic, with opportunities for growth in both domestic and export markets. Success factors include:
- Operational efficiency
- Quality consistency
- Market differentiation
- Regulatory compliance

*This analysis provides general market insights. Specific investment decisions should be based on detailed due diligence and professional advice.*
"""
        
        return content.strip()
    
    def _generate_slug(self, title: str) -> str:
        """Generate URL-friendly slug from title"""
        import re
        
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        
        # Add random suffix to ensure uniqueness
        import random
        suffix = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=6))
        return f"{slug}-{suffix}"
    
    async def publish_post(self, post_id: str) -> bool:
        """Publish a blog post"""
        
        result = await self.db.blog_posts.update_one(
            {"id": post_id},
            {
                "$set": {
                    "status": BlogStatus.PUBLISHED.value,
                    "published_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return result.modified_count > 0
    
    async def schedule_post(self, post_id: str, scheduled_at: datetime) -> bool:
        """Schedule a blog post for future publication"""
        
        result = await self.db.blog_posts.update_one(
            {"id": post_id},
            {
                "$set": {
                    "status": BlogStatus.SCHEDULED.value,
                    "scheduled_at": scheduled_at,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return result.modified_count > 0
    
    async def get_posts(
        self,
        status: BlogStatus = None,
        author_id: str = None,
        limit: int = 50,
        offset: int = 0,
        published_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get blog posts with filtering"""
        
        query = {}
        
        if status:
            query["status"] = status.value
        elif published_only:
            query["status"] = BlogStatus.PUBLISHED.value
            
        if author_id:
            query["author_id"] = author_id
            
        cursor = self.db.blog_posts.find(query).sort("created_at", -1).skip(offset).limit(limit)
        posts = await cursor.to_list(length=None)
        
        # Remove MongoDB _id fields
        for post in posts:
            if "_id" in post:
                del post["_id"]
                
        return posts
    
    async def get_post_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get blog post by slug"""
        
        post = await self.db.blog_posts.find_one({"slug": slug})
        
        if post:
            # Increment view count
            await self.db.blog_posts.update_one(
                {"id": post["id"]},
                {"$inc": {"view_count": 1}}
            )
            
            if "_id" in post:
                del post["_id"]
                
        return post
    
    async def update_post(self, post_id: str, updates: Dict[str, Any]) -> bool:
        """Update blog post"""
        
        updates["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.db.blog_posts.update_one(
            {"id": post_id},
            {"$set": updates}
        )
        
        return result.modified_count > 0
    
    async def delete_post(self, post_id: str) -> bool:
        """Delete blog post"""
        
        result = await self.db.blog_posts.delete_one({"id": post_id})
        return result.deleted_count > 0
    
    async def publish_scheduled_posts(self) -> int:
        """Publish posts that are scheduled for now or earlier"""
        
        now = datetime.now(timezone.utc)
        
        result = await self.db.blog_posts.update_many(
            {
                "status": BlogStatus.SCHEDULED.value,
                "scheduled_at": {"$lte": now}
            },
            {
                "$set": {
                    "status": BlogStatus.PUBLISHED.value,
                    "published_at": now,
                    "updated_at": now
                }
            }
        )
        
        return result.modified_count
    
    async def create_topic_template(
        self,
        title: str,
        day_of_week: int,
        prompt: Dict[str, Any],
        model: AIModel = AIModel.GPT_4O_MINI,
        tags: List[str] = None
    ) -> str:
        """Create a blog topic template for scheduled generation"""
        
        template_id = str(uuid.uuid4())
        
        template = {
            "id": template_id,
            "title": title,
            "day_of_week": day_of_week,  # 0=Sunday, 1=Monday, etc.
            "prompt": prompt,
            "model": model.value,
            "tags": tags or [],
            "active": True,
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.blog_topic_templates.insert_one(template)
        return template_id
    
    async def generate_weekly_content(self) -> List[str]:
        """Generate content for today's topic templates"""
        
        today = datetime.now(timezone.utc)
        day_of_week = today.weekday()  # 0=Monday, 6=Sunday
        
        # Get templates for today
        templates = await self.db.blog_topic_templates.find({
            "day_of_week": day_of_week,
            "active": True
        }).to_list(length=None)
        
        job_ids = []
        
        for template in templates:
            job_id = await self.generate_ai_blog_post(
                topic=template["title"],
                prompt=template["prompt"],
                model=AIModel(template["model"]),
                author_id="ai-weekly-generator"
            )
            job_ids.append(job_id)
            
        return job_ids