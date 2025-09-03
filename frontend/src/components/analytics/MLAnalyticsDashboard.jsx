import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Camera, 
  FileText, 
  MapPin, 
  DollarSign,
  Activity,
  Target,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  Sparkles,
  BarChart3,
  PieChart,
  Zap,
  Star,
  Image as ImageIcon,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const MLAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [pricingAnalytics, setPricingAnalytics] = useState(null);
  const [demandForecasts, setDemandForecasts] = useState(null);
  const [marketIntelligence, setMarketIntelligence] = useState(null);
  const [photoAnalytics, setPhotoAnalytics] = useState(null);
  const [contentOptimization, setContentOptimization] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    species: '',
    region: '',
    timeframe: '30'
  });

  const ZA_PROVINCES = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  const SPECIES_OPTIONS = [
    'cattle', 'poultry', 'sheep', 'goats', 'swine', 'fish'
  ];

  // Load ML analytics data
  const loadAnalytics = async (tab = activeTab) => {
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      switch (tab) {
        case 'pricing':
          await loadPricingAnalytics(backendUrl, headers);
          break;
          
        case 'demand':
          await loadDemandForecasts(backendUrl, headers);
          break;
          
        case 'market':
          await loadMarketIntelligence(backendUrl, headers);
          break;
          
        case 'photos':
          await loadPhotoAnalytics(backendUrl, headers);
          break;
          
        case 'content':
          await loadContentOptimization(backendUrl, headers);
          break;
          
        default:
          // Load overview data
          await Promise.all([
            loadPricingAnalytics(backendUrl, headers),
            loadDemandForecasts(backendUrl, headers),
            loadMarketIntelligence(backendUrl, headers)
          ]);
      }
    } catch (error) {
      console.error('Analytics loading failed:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingAnalytics = async (backendUrl, headers) => {
    try {
      // Load sample pricing analysis data
      const mockData = {
        total_analyses: 156,
        avg_accuracy: 87.5,
        price_improvements: 23.4,
        recent_analyses: [
          {
            species: 'cattle',
            region: 'Gauteng',
            recommended_price: 15000,
            market_price: 13500,
            improvement: 11.1,
            confidence: 92
          },
          {
            species: 'poultry',
            region: 'Western Cape',
            recommended_price: 85,
            market_price: 80,
            improvement: 6.25,
            confidence: 88
          }
        ],
        price_factors: {
          'Market Demand': 85,
          'Seasonal Trends': 78,
          'Quality Score': 92,
          'Location Premium': 67,
          'Competition Level': 73
        }
      };
      setPricingAnalytics(mockData);
    } catch (error) {
      console.error('Pricing analytics failed:', error);
    }
  };

  const loadDemandForecasts = async (backendUrl, headers) => {
    try {
      if (filters.species) {
        const response = await fetch(`${backendUrl}/api/ml/engine/demand-forecast`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            species: filters.species,
            region: filters.region || 'gauteng',
            forecast_days: parseInt(filters.timeframe) || 30
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setDemandForecasts(data);
        }
      } else {
        // Mock data for overview
        setDemandForecasts({
          forecasts: [
            {
              species: 'cattle',
              predicted_demand: 'increasing',
              confidence: 78,
              growth_rate: 12.5,
              key_factors: ['Seasonal demand', 'Export opportunities']
            },
            {
              species: 'poultry',
              predicted_demand: 'stable',
              confidence: 85,
              growth_rate: 3.2,
              key_factors: ['Consistent consumer demand', 'Supply stability']
            }
          ]
        });
      }
    } catch (error) {
      console.error('Demand forecast failed:', error);
    }
  };

  const loadMarketIntelligence = async (backendUrl, headers) => {
    try {
      const response = await fetch(`${backendUrl}/api/ml/engine/market-intelligence`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          species: filters.species,
          region: filters.region
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMarketIntelligence(data);
      } else {
        // Mock data
        setMarketIntelligence({
          competitive_analysis: {
            total_competitors: 45,
            market_concentration: 'medium',
            price_competition: 'high',
            avg_price: 12500
          },
          market_trends: {
            demand_trend: { direction: 'increasing', confidence: 82 },
            pricing_trend: { direction: 'stable', confidence: 75 },
            market_direction: 'bullish'
          },
          growth_opportunities: [
            {
              type: 'supply_gap',
              description: 'Growing demand with stable supply',
              potential: 'high'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Market intelligence failed:', error);
    }
  };

  const loadPhotoAnalytics = async (backendUrl, headers) => {
    try {
      // Mock photo analytics data
      setPhotoAnalytics({
        total_analyzed: 324,
        avg_quality_score: 7.2,
        improvement_suggestions: 89,
        quality_distribution: {
          excellent: 45,
          good: 134,
          fair: 98,
          poor: 47
        },
        common_issues: [
          { issue: 'Poor lighting', count: 78, improvement: 'Use natural daylight' },
          { issue: 'Animal not centered', count: 56, improvement: 'Center the animal in frame' },
          { issue: 'Blurry image', count: 34, improvement: 'Ensure camera focus' }
        ]
      });
    } catch (error) {
      console.error('Photo analytics failed:', error);
    }
  };

  const loadContentOptimization = async (backendUrl, headers) => {
    try {
      // Mock content optimization data
      setContentOptimization({
        total_optimized: 198,
        avg_improvement: 28.5,
        seo_score_avg: 72,
        content_issues: [
          { issue: 'Missing keywords', count: 67, impact: 'high' },
          { issue: 'Short descriptions', count: 45, impact: 'medium' },
          { issue: 'No location info', count: 32, impact: 'medium' }
        ],
        optimization_results: [
          {
            listing_id: '123',
            before_score: 45,
            after_score: 78,
            improvement: 73.3,
            key_changes: ['Added keywords', 'Extended description', 'Added location']
          }
        ]
      });
    } catch (error) {
      console.error('Content optimization failed:', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  useEffect(() => {
    loadAnalytics(activeTab);
  }, [activeTab]);

  // Render functions
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Smart Pricing</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pricingAnalytics?.total_analyses || 0}</div>
          <p className="text-xs text-green-600">
            <TrendingUp className="h-3 w-3 inline mr-1" />
            {pricingAnalytics?.price_improvements || 0}% avg improvement
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Demand Forecasts</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{demandForecasts?.forecasts?.length || 0}</div>
          <p className="text-xs text-blue-600">
            <Activity className="h-3 w-3 inline mr-1" />
            Active forecasts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Photo Analysis</CardTitle>
          <Camera className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{photoAnalytics?.total_analyzed || 0}</div>
          <p className="text-xs text-amber-600">
            <Star className="h-3 w-3 inline mr-1" />
            {photoAnalytics?.avg_quality_score || 0}/10 avg quality
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Optimization</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{contentOptimization?.total_optimized || 0}</div>
          <p className="text-xs text-purple-600">
            <Sparkles className="h-3 w-3 inline mr-1" />
            {contentOptimization?.avg_improvement || 0}% improvement
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderPricingAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-green-600">
                {pricingAnalytics?.avg_accuracy || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Average accuracy</p>
              
              <div className="pt-4">
                <h4 className="font-medium mb-2">Price Factors Impact</h4>
                {Object.entries(pricingAnalytics?.price_factors || {}).map(([factor, impact]) => (
                  <div key={factor} className="flex items-center justify-between mb-2">
                    <span className="text-sm">{factor}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={impact} className="w-20 h-2" />
                      <span className="text-xs">{impact}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Pricing Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pricingAnalytics?.recent_analyses?.map((analysis, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium capitalize">{analysis.species}</h4>
                      <p className="text-sm text-muted-foreground">{analysis.region}</p>
                    </div>
                    <Badge variant={analysis.improvement > 10 ? "default" : "secondary"}>
                      {analysis.confidence}% confidence
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recommended</p>
                      <p className="font-medium">R{analysis.recommended_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market Average</p>
                      <p className="font-medium">R{analysis.market_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Improvement</p>
                      <p className="font-medium text-green-600">+{analysis.improvement}%</p>
                    </div>
                  </div>
                </div>
              )) || <p className="text-muted-foreground">No recent analyses available</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDemandForecasts = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Demand Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demandForecasts?.forecasts?.map((forecast, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium capitalize">{forecast.species}</h4>
                  <Badge variant={
                    forecast.predicted_demand === 'increasing' ? 'default' :
                    forecast.predicted_demand === 'decreasing' ? 'destructive' : 'secondary'
                  }>
                    {forecast.predicted_demand}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="text-sm font-medium">{forecast.confidence}%</span>
                  </div>
                  <Progress value={forecast.confidence} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Growth Rate</span>
                    <span className={`text-sm font-medium ${
                      forecast.growth_rate > 0 ? 'text-green-600' : 
                      forecast.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {forecast.growth_rate > 0 ? '+' : ''}{forecast.growth_rate}%
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Key Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {forecast.key_factors?.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )) || <p className="text-muted-foreground">No forecasts available</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketIntelligence = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Competitive Landscape</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{marketIntelligence?.competitive_analysis?.total_competitors || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Competitors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">R{marketIntelligence?.competitive_analysis?.avg_price?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Average Price</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Market Concentration</span>
                  <Badge variant={
                    marketIntelligence?.competitive_analysis?.market_concentration === 'high' ? 'destructive' :
                    marketIntelligence?.competitive_analysis?.market_concentration === 'medium' ? 'default' : 'secondary'
                  }>
                    {marketIntelligence?.competitive_analysis?.market_concentration || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Price Competition</span>
                  <Badge variant={
                    marketIntelligence?.competitive_analysis?.price_competition === 'high' ? 'destructive' :
                    marketIntelligence?.competitive_analysis?.price_competition === 'medium' ? 'default' : 'secondary'
                  }>
                    {marketIntelligence?.competitive_analysis?.price_competition || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Demand Trend</span>
                <div className="flex items-center gap-2">
                  {marketIntelligence?.market_trends?.demand_trend?.direction === 'increasing' ? 
                    <TrendingUp className="h-4 w-4 text-green-600" /> :
                    marketIntelligence?.market_trends?.demand_trend?.direction === 'decreasing' ?
                    <TrendingDown className="h-4 w-4 text-red-600" /> :
                    <Activity className="h-4 w-4 text-gray-600" />
                  }
                  <span className="text-sm font-medium capitalize">
                    {marketIntelligence?.market_trends?.demand_trend?.direction || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Market Direction</span>
                <Badge variant={
                  marketIntelligence?.market_trends?.market_direction === 'bullish' ? 'default' :
                  marketIntelligence?.market_trends?.market_direction === 'bearish' ? 'destructive' : 'secondary'
                }>
                  {marketIntelligence?.market_trends?.market_direction || 'Stable'}
                </Badge>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Growth Opportunities</h4>
                {marketIntelligence?.growth_opportunities?.map((opp, index) => (
                  <div key={index} className="border rounded p-3 mb-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium capitalize">{opp.type?.replace('_', ' ')}</span>
                      <Badge variant={opp.potential === 'high' ? 'default' : 'secondary'}>
                        {opp.potential} potential
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{opp.description}</p>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No opportunities identified</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPhotoAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {photoAnalytics?.avg_quality_score || 0}/10
              </div>
              <p className="text-sm text-muted-foreground">Average Quality Score</p>
            </div>
            
            <div className="mt-4 space-y-2">
              {Object.entries(photoAnalytics?.quality_distribution || {}).map(([quality, count]) => (
                <div key={quality} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{quality}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / (photoAnalytics?.total_analyzed || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Common Photo Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {photoAnalytics?.common_issues?.map((issue, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{issue.issue}</h4>
                    <Badge variant="outline">{issue.count} photos</Badge>
                  </div>
                  <p className="text-sm text-green-600">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    {issue.improvement}
                  </p>
                </div>
              )) || <p className="text-muted-foreground">No common issues identified</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContentOptimization = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {contentOptimization?.avg_improvement || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Average Improvement</p>
              </div>
              
              <div>
                <div className="text-xl font-bold">
                  {contentOptimization?.seo_score_avg || 0}/100
                </div>
                <p className="text-sm text-muted-foreground">Average SEO Score</p>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Content Issues</h4>
                {contentOptimization?.content_issues?.map((issue, index) => (
                  <div key={index} className="flex justify-between items-center mb-2">
                    <span className="text-sm">{issue.issue}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={issue.impact === 'high' ? 'destructive' : 'secondary'}>
                        {issue.impact}
                      </Badge>
                      <span className="text-xs">{issue.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentOptimization?.optimization_results?.map((result, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Listing #{result.listing_id}</span>
                    <Badge variant="default">+{result.improvement}%</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <p className="text-muted-foreground">Before</p>
                      <p className="font-medium">{result.before_score}/100</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">After</p>
                      <p className="font-medium">{result.after_score}/100</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Key Changes:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.key_changes?.map((change, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {change}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )) || <p className="text-muted-foreground">No optimization results available</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            ML Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Advanced machine learning insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Filters */}
          <Select value={filters.species} onValueChange={(value) => setFilters({...filters, species: value})}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Species</SelectItem>
              {SPECIES_OPTIONS.map(species => (
                <SelectItem key={species} value={species}>
                  {species.charAt(0).toUpperCase() + species.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.region} onValueChange={(value) => setFilters({...filters, region: value})}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Regions</SelectItem>
              {ZA_PROVINCES.map(province => (
                <SelectItem key={province} value={province.toLowerCase()}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => loadAnalytics()} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Smart Pricing</TabsTrigger>
          <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
          <TabsTrigger value="market">Market Intel</TabsTrigger>
          <TabsTrigger value="photos">Photo Analysis</TabsTrigger>
          <TabsTrigger value="content">Content Opt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          {renderPricingAnalytics()}
        </TabsContent>

        <TabsContent value="demand" className="space-y-6">
          {renderDemandForecasts()}
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          {renderMarketIntelligence()}
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          {renderPhotoAnalytics()}
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {renderContentOptimization()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLAnalyticsDashboard;