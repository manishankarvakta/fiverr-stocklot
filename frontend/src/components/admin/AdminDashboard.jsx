import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/select';
import { 
  Users, DollarSign, ShoppingCart, TrendingUp, Eye, Edit, Trash2, Plus,
  Activity, Bell, Settings, RefreshCw, Download, Upload, Search, Filter
} from 'lucide-react';
// import api from '../../utils/apiHelper';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [quickActionType, setQuickActionType] = useState('');
  const [quickActionData, setQuickActionData] = useState({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchUsers();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default stats if API fails
      setStats({
        totalUsers: 0,
        totalListings: 0,
        totalOrders: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleQuickAction = async (actionType) => {
    setQuickActionType(actionType);
    setQuickActionData({});
    setShowQuickAction(true);
  };

  const executeQuickAction = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (quickActionType) {
        case 'create_user':
          endpoint = '/admin/users';
          body = quickActionData;
          break;
        case 'create_listing':
          endpoint = '/admin/listings';
          body = quickActionData;
          break;
        case 'send_notification':
          endpoint = '/admin/notifications';
          body = quickActionData;
          break;
        case 'generate_report':
          endpoint = '/admin/reports/generate';
          body = { type: quickActionData.reportType };
          break;
        case 'manage_exotic_species':
          // Redirect to exotic management
          window.open('/api/exotic-livestock/statistics', '_blank');
          setShowQuickAction(false);
          return;
        default:
          throw new Error('Unknown action type');
      }

      const response = await api.post(endpoint, body);
      
      if (response.data.success) {
        setShowQuickAction(false);
        setQuickActionData({});
        fetchDashboardStats(); // Refresh stats
        fetchUsers(); // Refresh users
        alert('Action completed successfully!');
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderQuickActionForm = () => {
    switch (quickActionType) {
      case 'create_user':
        return (
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                value={quickActionData.email || ''}
                onChange={(e) => setQuickActionData({...quickActionData, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={quickActionData.name || ''}
                onChange={(e) => setQuickActionData({...quickActionData, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={quickActionData.role} onValueChange={(value) => setQuickActionData({...quickActionData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={quickActionData.title || ''}
                onChange={(e) => setQuickActionData({...quickActionData, title: e.target.value})}
                placeholder="Notification title"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={quickActionData.message || ''}
                onChange={(e) => setQuickActionData({...quickActionData, message: e.target.value})}
                placeholder="Notification message"
              />
            </div>
            <div>
              <Label>Target</Label>
              <Select value={quickActionData.target} onValueChange={(value) => setQuickActionData({...quickActionData, target: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="buyers">Buyers Only</SelectItem>
                  <SelectItem value="sellers">Sellers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'generate_report':
        return (
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={quickActionData.reportType} onValueChange={(value) => setQuickActionData({...quickActionData, reportType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">Users Report</SelectItem>
                  <SelectItem value="listings">Listings Report</SelectItem>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="activity">Activity Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <div>Select an action</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchDashboardStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.totalRevenue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={() => handleQuickAction('create_user')} className="h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              Create User
            </Button>
            <Button onClick={() => handleQuickAction('create_listing')} className="h-20 flex flex-col" variant="outline">
              <Plus className="h-6 w-6 mb-2" />
              Create Listing
            </Button>
            <Button onClick={() => handleQuickAction('send_notification')} className="h-20 flex flex-col" variant="outline">
              <Bell className="h-6 w-6 mb-2" />
              Send Notification
            </Button>
            <Button onClick={() => handleQuickAction('generate_report')} className="h-20 flex flex-col" variant="outline">
              <Download className="h-6 w-6 mb-2" />
              Generate Report
            </Button>
            <Button onClick={() => handleQuickAction('manage_exotic_species')} className="h-20 flex flex-col" variant="outline">
              <Settings className="h-6 w-6 mb-2" />
              Exotic Species
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exotic Livestock Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐾 Exotic Livestock Management
            <Badge variant="secondary">26 Species</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <h4 className="font-semibold text-amber-800 mb-2">Game Animals</h4>
              <p className="text-sm text-amber-700">12 species including Kudu, Springbok, Eland</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Large Flightless Birds</h4>
              <p className="text-sm text-blue-700">3 species: Ostrich, Emu, Rhea</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-semibold text-green-800 mb-2">Camelids & Others</h4>
              <p className="text-sm text-green-700">11 specialty species available</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleQuickAction('manage_exotic_species')} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Manage Species
            </Button>
            <Button onClick={() => handleQuickAction('manage_compliance_rules')} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Compliance Rules
            </Button>
            <Button onClick={() => window.open('/api/exotic-livestock/statistics', '_blank')} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Statistics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings removed - use sidebar navigation to access comprehensive settings */}

      {/* Registered Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Users
            <Badge variant="secondary">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.slice(0, 10).map((user, index) => (
                <div key={user.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.full_name || user.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      Roles: {(user.roles || ['buyer']).join(', ')} | 
                      Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {user.roles && user.roles.includes('admin') && (
                      <Badge variant="destructive">Admin</Badge>
                    )}
                  </div>
                </div>
              ))}
              {users.length > 10 && (
                <div className="text-center py-2 text-gray-500">
                  Showing 10 of {users.length} users
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action Dialog */}
      <Dialog open={showQuickAction} onOpenChange={setShowQuickAction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {quickActionType === 'create_user' && 'Create New User'}
              {quickActionType === 'create_listing' && 'Create New Listing'}
              {quickActionType === 'send_notification' && 'Send Notification'}
              {quickActionType === 'generate_report' && 'Generate Report'}
              {quickActionType === 'manage_exotic_species' && 'Manage Exotic Species'}
              {quickActionType === 'manage_compliance_rules' && 'Manage Compliance Rules'}
            </DialogTitle>
            <DialogDescription>
              Complete the form to execute this action
            </DialogDescription>
          </DialogHeader>

          {renderQuickActionForm()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAction(false)}>
              Cancel
            </Button>
            <Button onClick={executeQuickAction} disabled={loading}>
              {loading ? 'Processing...' : 'Execute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}