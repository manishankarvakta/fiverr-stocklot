import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  MapPin, 
  DollarSign,
  Activity,
  Users,
  Target,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const MarketAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    species: '',
    province: '',
    daysBack: 30
  });
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [error, setError] = useState(null);

  const ZA_PROVINCES = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  // Load species options
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species`);
        const data = await res.json();
        const opts = (data?.species || data || []).map(s => ({
          value: s.code || s.id || s.name,
          label: s.name
        }));
        setSpeciesOptions(opts);
      } catch (error) {
        console.error('Error fetching species:', error);
      }
    };
    
    fetchSpecies();
  }, []);

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        days_back: filters.daysBack,
        ...(filters.species && { species: filters.species }),
        ...(filters.province && { province: filters.province })
      });

      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/analytics/market?${params}`,
        {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );

      if (!res.ok) {
        throw new Error('Failed to load market analytics');
      }

      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load analytics on mount and filter changes
  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  // Calculate insights from analytics data
  const calculateInsights = () => {
    if (!analytics?.analytics || analytics.analytics.length === 0) {
      return {
        totalRequests: 0,
        totalQuantity: 0,
        avgPrice: 0,
        priceRange: { min: 0, max: 0 },
        topProvinces: [],
        topSpecies: [],
        trends: []
      };
    }

    const data = analytics.analytics;
    
    // Basic aggregations
    const totalRequests = data.reduce((sum, item) => sum + item.request_count, 0);
    const totalQuantity = data.reduce((sum, item) => sum + item.total_quantity, 0);
    const avgPrice = data.reduce((sum, item) => sum + (item.avg_target_price || 0), 0) / data.length;

    // Price range
    const prices = data.filter(item => item.avg_target_price > 0).map(item => item.avg_target_price);
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices)
    } : { min: 0, max: 0 };

    // Top provinces by request count
    const provinceStats = {};
    data.forEach(item => {
      if (item._id.province) {
        provinceStats[item._id.province] = (provinceStats[item._id.province] || 0) + item.request_count;
      }
    });
    const topProvinces = Object.entries(provinceStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([province, count]) => ({ province, count }));

    // Top species by request count
    const speciesStats = {};
    data.forEach(item => {
      if (item._id.species) {
        speciesStats[item._id.species] = (speciesStats[item._id.species] || 0) + item.request_count;
      }
    });
    const topSpecies = Object.entries(speciesStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([species, count]) => ({ species, count }));

    return {
      totalRequests,
      totalQuantity,
      avgPrice,
      priceRange,
      topProvinces,
      topSpecies,
      trends: data.sort((a, b) => b._id.week - a._id.week).slice(0, 4)
    };
  };

  const insights = calculateInsights();

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === 'error' ? 'bg-red-500' : 
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 4000);
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'N/A';
    return `R${Number(price).toFixed(2)}`;
  };

  const formatDate = (weekNumber) => {
    if (!weekNumber) return 'N/A';
    const currentYear = new Date().getFullYear();
    return `Week ${weekNumber}, ${currentYear}`;
  };

  const exportData = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Analytics data exported successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Market Analytics Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered insights into livestock market trends and patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportData}
            disabled={!analytics}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={loadAnalytics}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Species</label>
              <Select 
                value={filters.species} 
                onValueChange={(value) => setFilters(prev => ({...prev, species: value}))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All species</SelectItem>
                  {speciesOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Province</label>
              <Select 
                value={filters.province} 
                onValueChange={(value) => setFilters(prev => ({...prev, province: value}))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All provinces</SelectItem>
                  {ZA_PROVINCES.map(province => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Period</label>
              <Select 
                value={filters.daysBack.toString()} 
                onValueChange={(value) => setFilters(prev => ({...prev, daysBack: parseInt(value)}))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing market data...</p>
          <p className="text-sm text-gray-500 mt-1">AI is processing {filters.daysBack} days of data</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Unable to load analytics
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadAnalytics} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content */}
      {!loading && !error && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{insights.totalRequests}</div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{insights.totalQuantity.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Quantity Needed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatPrice(insights.avgPrice)}</div>
                    <div className="text-sm text-gray-600">Average Target Price</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {formatPrice(insights.priceRange.min)} - {formatPrice(insights.priceRange.max)}
                    </div>
                    <div className="text-sm text-gray-600">Price Range</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Provinces */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Top Provinces by Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.topProvinces.map((province, index) => (
                    <div key={province.province} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-800">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{province.province}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(province.count / Math.max(...insights.topProvinces.map(p => p.count))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-600">
                        {province.count} requests
                      </div>
                    </div>
                  ))}
                  {insights.topProvinces.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No data available for the selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Species */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Most Requested Species
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.topSpecies.map((species, index) => (
                    <div key={species.species} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-semibold text-purple-800">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium capitalize">{species.species}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(species.count / Math.max(...insights.topSpecies.map(s => s.count))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-600">
                        {species.count} requests
                      </div>
                    </div>
                  ))}
                  {insights.topSpecies.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No data available for the selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Market Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {insights.trends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {formatDate(trend._id.week)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Requests:</span>
                        <span className="font-semibold">{trend.request_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Avg Price:</span>
                        <span className="font-semibold">{formatPrice(trend.avg_target_price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Species:</span>
                        <span className="font-semibold capitalize">{trend._id.species || 'Mixed'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Province:</span>
                        <span className="font-semibold">{trend._id.province || 'Various'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.trends.length === 0 && (
                  <div className="col-span-4 text-center text-gray-500 py-8">
                    No trend data available for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          {analytics.trends && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-800 mb-2">Market Activity</div>
                    <div className="text-sm text-blue-700">
                      {insights.totalRequests > 50 ? 
                        "High market activity detected. Good time for sellers to list livestock." :
                        "Moderate market activity. Consider competitive pricing to attract buyers."
                      }
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-800 mb-2">Price Trends</div>
                    <div className="text-sm text-green-700">
                      {insights.priceRange.max > insights.priceRange.min * 2 ? 
                        "Wide price variation suggests diverse market segments and opportunities." :
                        "Stable pricing indicates mature market with established price points."
                      }
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-purple-800 mb-2">Geographic Insights</div>
                    <div className="text-sm text-purple-700">
                      {insights.topProvinces.length > 0 ? 
                        `${insights.topProvinces[0]?.province} shows highest demand. Consider focusing marketing efforts there.` :
                        "Demand is evenly distributed across provinces."
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketAnalyticsDashboard;