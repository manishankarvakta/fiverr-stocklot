import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Alert, AlertDescription,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui';
import { 
  Users, DollarSign, ShoppingCart, TrendingUp, Eye, Edit, Trash2, Plus,
  Activity, Bell, Settings, RefreshCw, Download, Upload, Search, Filter
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'https://stocklot-repair.preview.emergentagent.com/api';

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

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API}/admin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleQuickAction = async (actionType) => {
    setQuickActionType(actionType);
    setQuickActionData({});
    setShowQuickAction(true);
  };

  const executeQuickAction = async () => {
    setLoading(true);
    try {
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
          endpoint = '/admin/notifications/broadcast';
          body = quickActionData;
          break;
        case 'generate_report':
          endpoint = '/admin/reports/generate';
          body = { type: quickActionData.reportType };
          break;
        default:
          throw new Error('Unknown action type');
      }

      const response = await fetch(`${API}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowQuickAction(false);
        setQuickActionData({});
        fetchDashboardStats(); // Refresh stats
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
          </div>
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