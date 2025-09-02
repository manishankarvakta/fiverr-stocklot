import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, 
  Tabs, TabsList, TabsTrigger, TabsContent, Alert, AlertDescription,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Switch, Label, Textarea
} from '../ui';
import { 
  Shield, Users, Package, TrendingUp, DollarSign, Bell, RefreshCw, Settings,
  AlertTriangle, CheckCircle, XCircle, Eye, Ban, Check, FileText, Building,
  MessageCircle, CreditCard, BarChart3, Globe, Zap, Clock, Award, Search, Filter,
  Download, Plus, Edit, Trash2, Copy, Upload, MapPin, Calendar, ShoppingCart, Share2
} from 'lucide-react';

// Import the functional admin components
import AdminListingsQueue from './AdminListingsQueue';
import AdminUsersQueue from './AdminUsersQueue';
import AdminOrdersManagement from './AdminOrdersManagement';
import AdminOrganizationsManagement from './AdminOrganizationsManagement';
import AdminComplianceQueue from './AdminComplianceQueue';
import AdminMessagingControls from './AdminMessagingControls';
import AdminReferralsManagement from './AdminReferralsManagement';
import AdminSettingsControls from './AdminSettingsControls';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
// Import the new missing admin components
import AdminPayoutsManagement from './AdminPayoutsManagement';
import AdminPaymentMethods from './AdminPaymentMethods';
import AdminWebhooksManagement from './AdminWebhooksManagement';
import AdminGeofencingControls from './AdminGeofencingControls';
import AdminLogisticsManagement from './AdminLogisticsManagement';
import AdminAuctionsManagement from './AdminAuctionsManagement';
import AdminCMSManagement from './AdminCMSManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Admin Dashboard Component with Fixed Authentication
export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({});

  // Enhanced Authentication Check
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // First check if we have a token
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login?redirect=admin');
          return;
        }

        // Try to get current user from API if user prop is null
        if (!user) {
          console.log('User prop is null, fetching user from API');
          const response = await fetch(`${API}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.log('Failed to fetch user, redirecting to login');
            navigate('/login?redirect=admin');
            return;
          }
          
          const userData = await response.json();
          if (!userData.roles?.includes('admin')) {
            console.log('User does not have admin role');
            navigate('/login?redirect=admin');
            return;
          }
        } else {
          // User prop exists, check admin role
          if (!user.roles?.includes('admin')) {
            console.log('User does not have admin role');
            navigate('/login?redirect=admin');
            return;
          }
        }

        console.log('Admin authentication successful');
        setAuthLoading(false);
        fetchAdminStats();
        
      } catch (error) {
        console.error('Authentication check failed:', error);
        navigate('/login?redirect=admin');
      }
    };

    checkAuthentication();
  }, [user, navigate]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen during authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-emerald-700 font-medium">Loading Admin Dashboard</p>
          <p className="text-emerald-600 text-sm">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      {/* Professional Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">StockLot Admin Portal</h1>
              <p className="text-sm text-gray-300">Complete Platform Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="text-white border-white/20" onClick={fetchAdminStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.full_name || 'System Admin'}</p>
              <p className="text-xs text-gray-300">Super Administrator</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 w-full max-w-7xl overflow-x-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="geofencing">Disease Zones</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
            <TabsTrigger value="cms">CMS</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <AdminOverview stats={stats} loading={loading} user={user} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUsersQueue />
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <AdminListingsQueue />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <AdminOrdersManagement />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <AdminPayoutsManagement />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <AdminPaymentMethods />
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations">
            <AdminOrganizationsManagement />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <AdminComplianceQueue />
          </TabsContent>

          {/* Messaging Tab */}
          <TabsContent value="messaging">
            <AdminMessagingControls />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <AdminReferralsManagement />
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks">
            <AdminWebhooksManagement />
          </TabsContent>

          {/* Disease Zones Tab */}
          <TabsContent value="geofencing">
            <AdminGeofencingControls />
          </TabsContent>

          {/* Logistics Tab */}
          <TabsContent value="logistics">
            <AdminLogisticsManagement />
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions">
            <AdminAuctionsManagement />
          </TabsContent>

          {/* CMS Tab */}
          <TabsContent value="cms">
            <AdminCMSManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettingsControls />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// This is now the overview dashboard component, not the layout
function AdminOverview({ stats, loading, user }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch recent activity (mock for now)
    setRecentActivity([
      { id: 1, type: 'listing', message: 'New cattle listing submitted for approval', time: '5 minutes ago', user: 'Johan van der Merwe' },
      { id: 2, type: 'user', message: 'New user registered as seller', time: '12 minutes ago', user: 'Sarah Williams' },
      { id: 3, type: 'payment', message: 'Payment verification requested', time: '18 minutes ago', user: 'Thabo Mthembu' },
      { id: 4, type: 'order', message: 'Large order completed - R45,000', time: '1 hour ago', user: 'Premium Farms Ltd' }
    ]);

    // Fetch system alerts (mock for now)
    setAlerts([
      { id: 1, type: 'warning', message: '12 listings pending approval', count: 12 },
      { id: 2, type: 'info', message: '3 payment methods need verification', count: 3 },
      { id: 3, type: 'success', message: 'All systems operational', count: 0 }
    ]);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'listing': return <Package className="h-4 w-4 text-blue-600" />;
      case 'user': return <Users className="h-4 w-4 text-green-600" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'order': return <DollarSign className="h-4 w-4 text-orange-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.full_name || 'Administrator'}!</h1>
            <p className="text-emerald-100 mt-1">
              Here's what's happening with your livestock marketplace today
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{new Date().toLocaleDateString()}</div>
            <div className="text-emerald-100">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={getAlertColor(alert.type)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {alert.message}
                {alert.count > 0 && (
                  <Badge className="ml-2 bg-white text-gray-800">{alert.count}</Badge>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_users || 0}</p>
                <p className="text-sm text-green-600 mt-1">+12% from last month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Listings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_listings || 0}</p>
                <p className="text-sm text-green-600 mt-1">+8% from last week</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_orders || 0}</p>
                <p className="text-sm text-blue-600 mt-1">R2.4M total value</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending_approvals || 0}</p>
                <p className="text-sm text-orange-600 mt-1">Needs attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-500">by {activity.user}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-20 flex-col bg-blue-600 hover:bg-blue-700">
                <Users className="h-6 w-6 mb-2" />
                Manage Users
              </Button>
              <Button className="h-20 flex-col bg-green-600 hover:bg-green-700">
                <Package className="h-6 w-6 mb-2" />
                Review Listings
              </Button>
              <Button 
                className="h-20 flex-col bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  // Navigate to settings tab
                  const settingsTab = document.querySelector('[value="settings"]');
                  if (settingsTab) {
                    settingsTab.click();
                  }
                }}
              >
                <Settings className="h-6 w-6 mb-2" />
                Platform Settings
              </Button>
              <Button className="h-20 flex-col bg-orange-600 hover:bg-orange-700">
                <BarChart3 className="h-6 w-6 mb-2" />
                View Analytics
              </Button>
            </div>
            
            {/* Social Media Quick Access */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Social Media & App Settings</h4>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Configure your marketplace's social media links and mobile app download buttons
              </p>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Navigate to settings tab and then social media tab
                  const settingsTab = document.querySelector('[value="settings"]');
                  if (settingsTab) {
                    settingsTab.click();
                    setTimeout(() => {
                      const socialTab = document.querySelector('[value="social"]');
                      if (socialTab) {
                        socialTab.click();
                      }
                    }, 300);
                  }
                }}
              >
                Configure Social Media & Apps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Uptime</span>
                <Badge className="bg-green-100 text-green-800">99.9%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <Badge className="bg-green-100 text-green-800">&lt; 200ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Success Rate</span>
                <Badge className="bg-green-100 text-green-800">98.7%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Satisfaction</span>
                <Badge className="bg-green-100 text-green-800">4.8/5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Users</span>
                <span className="font-semibold text-blue-600">+234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Listings</span>
                <span className="font-semibold text-green-600">+567</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed Orders</span>
                <span className="font-semibold text-purple-600">+89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Revenue Growth</span>
                <span className="font-semibold text-emerald-600">+24%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Livestock Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Cattle', count: 156, percentage: 45 },
                { name: 'Poultry', count: 234, percentage: 35 },
                { name: 'Goats', count: 89, percentage: 15 },
                { name: 'Sheep', count: 34, percentage: 5 }
              ].map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{category.count}</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}