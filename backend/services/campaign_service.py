"""
Campaign Management Service - Marketing Campaigns & Promotions
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models_expansion import Campaign, CampaignCreate, CampaignUpdate, CampaignStatus, CampaignType
import uuid

class CampaignService:
    def __init__(self):
        self.name = "CampaignService"
        # Mock in-memory storage - in production, use database
        self.campaigns = {}
        self._init_sample_campaigns()
    
    def _init_sample_campaigns(self):
        """Initialize with sample campaigns for testing."""
        sample_campaigns = [
            {
                "id": str(uuid.uuid4()),
                "seller_id": "seller-123",
                "name": "Summer Poultry Special",
                "description": "20% off all broiler chickens",
                "type": CampaignType.DISCOUNT,
                "status": CampaignStatus.ACTIVE,
                "budget": 5000.0,
                "spent": 1250.0,
                "start_date": datetime.utcnow() - timedelta(days=5),
                "end_date": datetime.utcnow() + timedelta(days=25),
                "target_audience": "all",
                "discount_percentage": 20.0,
                "listing_ids": ["listing-1", "listing-2"],
                "impressions": 8500,
                "clicks": 325,
                "conversions": 28,
                "created_at": datetime.utcnow() - timedelta(days=7)
            },
            {
                "id": str(uuid.uuid4()),
                "seller_id": "seller-123", 
                "name": "Featured Cattle Listing",
                "description": "Boost visibility for premium Angus cattle",
                "type": CampaignType.FEATURED,
                "status": CampaignStatus.PAUSED,
                "budget": 2000.0,
                "spent": 800.0,
                "start_date": datetime.utcnow() - timedelta(days=10),
                "end_date": datetime.utcnow() + timedelta(days=20),
                "target_audience": "high_value",
                "discount_percentage": None,
                "listing_ids": ["listing-3"],
                "impressions": 3200,
                "clicks": 180,
                "conversions": 12,
                "created_at": datetime.utcnow() - timedelta(days=12)
            }
        ]
        
        for campaign in sample_campaigns:
            campaign_obj = Campaign(**campaign)
            self.campaigns[campaign_obj.id] = campaign_obj
    
    async def get_campaigns(
        self, 
        seller_id: str,
        status: Optional[CampaignStatus] = None,
        campaign_type: Optional[CampaignType] = None,
        search: Optional[str] = None
    ) -> List[Campaign]:
        """Get campaigns for a seller with optional filters."""
        
        campaigns = [
            campaign for campaign in self.campaigns.values()
            if campaign.seller_id == seller_id
        ]
        
        # Apply filters
        if status:
            campaigns = [c for c in campaigns if c.status == status]
        
        if campaign_type:
            campaigns = [c for c in campaigns if c.type == campaign_type]
        
        if search:
            search_lower = search.lower()
            campaigns = [
                c for c in campaigns 
                if search_lower in c.name.lower() or 
                   (c.description and search_lower in c.description.lower())
            ]
        
        # Sort by created date (newest first)
        campaigns.sort(key=lambda x: x.created_at, reverse=True)
        
        return campaigns
    
    async def get_campaign(self, campaign_id: str, seller_id: str) -> Optional[Campaign]:
        """Get a specific campaign by ID and seller."""
        
        campaign = self.campaigns.get(campaign_id)
        if campaign and campaign.seller_id == seller_id:
            return campaign
        return None
    
    async def create_campaign(self, campaign_data: CampaignCreate, seller_id: str) -> Campaign:
        """Create a new marketing campaign."""
        
        campaign = Campaign(
            seller_id=seller_id,
            **campaign_data.dict()
        )
        
        # Store campaign
        self.campaigns[campaign.id] = campaign
        
        return campaign
    
    async def update_campaign(
        self, 
        campaign_id: str, 
        campaign_update: CampaignUpdate, 
        seller_id: str
    ) -> Optional[Campaign]:
        """Update an existing campaign."""
        
        campaign = await self.get_campaign(campaign_id, seller_id)
        if not campaign:
            return None
        
        # Update fields
        update_data = campaign_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(campaign, field, value)
        
        campaign.updated_at = datetime.utcnow()
        
        return campaign
    
    async def delete_campaign(self, campaign_id: str, seller_id: str) -> bool:
        """Delete a campaign."""
        
        campaign = await self.get_campaign(campaign_id, seller_id)
        if not campaign:
            return False
        
        # Only allow deletion of draft or cancelled campaigns
        if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.CANCELLED]:
            return False
        
        del self.campaigns[campaign_id]
        return True
    
    async def update_campaign_status(
        self, 
        campaign_id: str, 
        status: CampaignStatus, 
        seller_id: str
    ) -> Optional[Campaign]:
        """Update campaign status."""
        
        campaign = await self.get_campaign(campaign_id, seller_id)
        if not campaign:
            return None
        
        campaign.status = status
        campaign.updated_at = datetime.utcnow()
        
        return campaign
    
    async def get_campaign_stats(self, seller_id: str) -> Dict[str, Any]:
        """Get campaign statistics for a seller."""
        
        seller_campaigns = [
            c for c in self.campaigns.values() 
            if c.seller_id == seller_id
        ]
        
        # Calculate statistics
        active_campaigns = len([c for c in seller_campaigns if c.status == CampaignStatus.ACTIVE])
        total_reach = sum(c.impressions for c in seller_campaigns)
        total_spend = sum(c.spent for c in seller_campaigns)
        total_budget = sum(c.budget for c in seller_campaigns)
        total_conversions = sum(c.conversions for c in seller_campaigns)
        
        # Calculate ROI (simplified)
        campaign_roi = (total_conversions * 200 - total_spend) / total_spend if total_spend > 0 else 0
        
        return {
            "active_campaigns": active_campaigns,
            "total_campaigns": len(seller_campaigns),
            "total_reach": total_reach,
            "total_spend": total_spend,
            "total_budget": total_budget,
            "campaign_roi": campaign_roi,
            "total_conversions": total_conversions,
            "average_ctr": sum(c.clicks / c.impressions if c.impressions > 0 else 0 for c in seller_campaigns) / len(seller_campaigns) if seller_campaigns else 0
        }
    
    async def get_campaign_performance(self, campaign_id: str, seller_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed performance metrics for a campaign."""
        
        campaign = await self.get_campaign(campaign_id, seller_id)
        if not campaign:
            return None
        
        # Generate mock performance data
        performance_data = []
        for i in range(30):  # Last 30 days
            date = datetime.utcnow() - timedelta(days=30-i)
            performance_data.append({
                "date": date.isoformat(),
                "impressions": campaign.impressions // 30 + (i * 5),
                "clicks": campaign.clicks // 30 + (i * 2),
                "conversions": campaign.conversions // 30 + (i // 5),
                "spend": campaign.spent / 30 + (i * 2.5)
            })
        
        return {
            "campaign_id": campaign_id,
            "performance_data": performance_data,
            "total_impressions": campaign.impressions,
            "total_clicks": campaign.clicks,
            "total_conversions": campaign.conversions,
            "total_spend": campaign.spent,
            "ctr": campaign.clicks / campaign.impressions if campaign.impressions > 0 else 0,
            "conversion_rate": campaign.conversions / campaign.clicks if campaign.clicks > 0 else 0,
            "cost_per_click": campaign.spent / campaign.clicks if campaign.clicks > 0 else 0,
            "cost_per_conversion": campaign.spent / campaign.conversions if campaign.conversions > 0 else 0
        }