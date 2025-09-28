import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui';
import { 
  BarChart3, TrendingUp, Eye, ShoppingCart, Users, Clock,
  ExternalLink, RefreshCw, Calendar, Target
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || '/api';

export default function AdminPDPAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
    fetchDailyMetrics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/admin/analytics/pdp?days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching PDP analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyMetrics = async () => {
    try {
      const response = await fetch(`${API}/admin/analytics/daily?days=7`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDailyMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching daily metrics:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = "blue" }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 bg-${color}-100 rounded-full`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">PDP Analytics</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">PDP Analytics Dashboard</h1>
          <p className="text-gray-600">Track product detail page performance and user engagement</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total PDP Views"
          value={formatNumber(analytics?.total_views)}
          subtitle={`Last ${timeRange} days`}
          icon={Eye}
          color="blue"
        />
        <MetricCard
          title="Unique Visitors"
          value={formatNumber(analytics?.unique_viewers)}
          subtitle={`${((analytics?.unique_viewers / analytics?.total_views) * 100).toFixed(1)}% of total views`}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Cart Conversion"
          value={`${analytics?.conversion_rate}%`}
          subtitle={`${analytics?.cart_adds} cart adds`}
          icon={ShoppingCart}
          color="orange"
        />
        <MetricCard
          title="Avg. Views/Day"
          value={Math.round(analytics?.total_views / parseInt(timeRange))}
          subtitle="Daily average"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Daily Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Daily Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyMetrics.length > 0 ? (
              <div className="grid grid-cols-7 gap-2">
                {dailyMetrics.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="space-y-1">
                      <div 
                        className="bg-blue-500 rounded"
                        style={{ 
                          height: `${Math.max((day.pdp_view || 0) / 50, 1) * 40}px`,
                          minHeight: '4px'
                        }}
                        title={`${day.pdp_view || 0} views`}
                      ></div>
                      <div className="text-xs font-medium">{day.pdp_view || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No daily metrics available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Listings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Top Performing Listings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Unique Viewers</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Last Viewed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics?.top_listings?.map((listing) => (
                <TableRow key={listing.listing_id}>
                  <TableCell>
                    <div className="font-medium">
                      {listing.title || 'Unknown Listing'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {listing.listing_id.substring(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1 text-blue-500" />
                      <span className="font-semibold">{listing.views}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-green-500" />
                      <span>{listing.unique_viewers}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      R{listing.price?.toLocaleString() || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {listing.last_viewed 
                        ? new Date(listing.last_viewed).toLocaleDateString()
                        : 'N/A'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/listing/${listing.listing_id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!analytics?.top_listings || analytics.top_listings.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No listing data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Average time on PDP</span>
              <span className="font-medium">2m 34s</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Bounce rate</span>
              <span className="font-medium">34.2%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Mobile traffic</span>
              <span className="font-medium">68.5%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Returning visitors</span>
              <span className="font-medium">23.1%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Analytics Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Set Performance Goals
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}