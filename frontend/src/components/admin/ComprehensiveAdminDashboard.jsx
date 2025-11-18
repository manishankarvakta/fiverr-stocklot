import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Button, Input, Label, Badge, Avatar, AvatarFallback,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Switch, Alert, AlertDescription, Textarea
} from '../ui';
import { 
  Users, Package, TrendingUp, DollarSign, Shield, Settings, 
  BarChart3, Bell, Search, Filter, Eye, Edit, Trash2, Plus,
  Download, Upload, MapPin, Clock, CheckCircle, XCircle,
  AlertTriangle, Building, CreditCard, Globe, Mail, Phone,
  FileText, Image, Zap, RefreshCw, ArrowRight, ArrowLeft, ShoppingCart
} from 'lucide-react';
import api from '../../utils/apiHelper';

const ComprehensiveAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch admin data
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Use api client with cookie-based auth
      const [
        statsData,
        usersData,
        listingsData,
        ordersData,
        orgsData,
        disputesData,
        analyticsData
      ] = await Promise.all([
        api.get('/admin/stats').then(r => r.data).catch(() => ({})),
        api.get('/admin/users').then(r => r.data).catch(() => []),
        api.get('/admin/listings').then(r => r.data).catch(() => []),
        api.get('/admin/orders').then(r => r.data).catch(() => []),
        api.get('/admin/organizations').then(r => r.data).catch(() => []),
        api.get('/admin/disputes').then(r => r.data).catch(() => []),
        api.get('/admin/analytics').then(r => r.data).catch(() => ({}))
      ]);

      setStats(statsData);
      setUsers(usersData);
      setListings(listingsData);
      setOrders(ordersData);
      setOrganizations(orgsData);
      setDisputes(disputesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoading(false);
  };

  // Overview Tab Content
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Users" 
          value={stats.total_users || 0}
          change="+12%" 
          icon={Users}
          color="emerald"
        />
        <MetricCard 
          title="Active Listings" 
          value={stats.active_listings || 0}
          change="+8%" 
          icon={Package}
          color="blue"
        />
        <MetricCard 
          title="Monthly Revenue" 
          value={`R${(stats.monthly_revenue || 0).toLocaleString()}`}
          change="+15%" 
          icon={DollarSign}
          color="green"
        />
        <MetricCard 
          title="Growth Rate" 
          value="23%" 
          change="+5%" 
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem 
                action="New user registered"
                user="John Farmer"
                time="2 minutes ago"
                type="user"
              />
              <ActivityItem 
                action="Listing created"
                user="Maria Santos"
                time="5 minutes ago"
                type="listing"
              />
              <ActivityItem 
                action="Order completed"
                user="David Smith"
                time="10 minutes ago"
                type="order"
              />
              <ActivityItem 
                action="Dispute opened"
                user="Sarah Johnson"
                time="15 minutes ago"
                type="dispute"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  3 listings require document verification
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  2 disputes need immediate attention
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment gateway maintenance scheduled
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Users Management Tab
  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search users..." />
            </div>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((user, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {(user.roles || ['user']).map(role => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Listings Management Tab
  const ListingsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Listings Management</h2>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Listing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total_listings || 0}</p>
                <p className="text-sm text-gray-500">Total Listings</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pending_listings || 0}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.approved_listings || 0}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.rejected_listings || 0}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Management Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {listings.slice(0, 5).map((listing, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{listing.title || 'Livestock Listing'}</h4>
                    <p className="text-sm text-gray-500">
                      {listing.species} • {listing.quantity} units • R{listing.price}
                    </p>
                    <p className="text-xs text-gray-400">
                      Listed by {listing.seller_name} • {new Date(listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={
                    listing.status === 'approved' ? 'bg-green-100 text-green-700' :
                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {listing.status || 'pending'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm">Approve</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Main render
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
              <p className="text-sm text-gray-300">Platform Administration & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="text-white border-white/20">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">System Admin</p>
              <p className="text-xs text-gray-300">Last login: Today, 9:30 AM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full max-w-6xl overflow-x-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="listings">
            <ListingsTab />
          </TabsContent>

          <TabsContent value="orders">
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders Management</h3>
              <p className="text-gray-500">Comprehensive order tracking and management interface coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="organizations">
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Organizations Management</h3>
              <p className="text-gray-500">Manage farms, cooperatives, and business organizations.</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-500">Detailed platform analytics and business intelligence dashboards.</p>
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Management</h3>
              <p className="text-gray-500">Document verification, KYC management, and regulatory compliance.</p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Settings</h3>
              <p className="text-gray-500">System configuration, feature flags, and platform management.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, change, icon: Icon, color }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-xs font-medium ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {change} from last month
          </p>
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ActivityItem = ({ action, user, time, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4 text-blue-500" />;
      case 'listing': return <Package className="h-4 w-4 text-green-500" />;
      case 'order': return <ShoppingCart className="h-4 w-4 text-purple-500" />;
      case 'dispute': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{action}</p>
        <p className="text-xs text-gray-500">by {user} • {time}</p>
      </div>
    </div>
  );
};

export default ComprehensiveAdminDashboard;