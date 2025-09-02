import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, Package, TrendingUp, DollarSign, 
  Bell, Menu, X, Settings, BarChart3 
} from 'lucide-react';

const MobileAdminDashboard = ({ stats = {}, isMobile = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  // Quick stats for mobile view
  const quickStats = [
    {
      title: 'Users',
      value: stats.total_users || 0,
      icon: Users,
      color: 'from-emerald-500 to-green-500',
      change: `+${stats.new_users_today || 0} today`
    },
    {
      title: 'Listings', 
      value: stats.total_listings || 0,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      change: `${stats.active_listings || 0} active`
    },
    {
      title: 'Revenue',
      value: `R${(stats.total_transaction_value || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      change: `R${(stats.commission_earned || 0).toLocaleString()} commission`
    }
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b border-emerald-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-emerald-900">Admin Panel</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Quick Stats */}
        <div className="p-4 space-y-3">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600">{stat.title}</p>
                      <p className="text-xl font-bold text-emerald-900">{stat.value}</p>
                      <p className="text-xs text-emerald-500">{stat.change}</p>
                    </div>
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile Action Menu */}
        {menuOpen && (
          <div className="bg-white border-t border-emerald-200 px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-emerald-200 text-emerald-700"
                onClick={() => setActiveTab('users')}
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-emerald-200 text-emerald-700"
                onClick={() => setActiveTab('listings')}
              >
                <Package className="h-4 w-4" />
                Listings
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-emerald-200 text-emerald-700"
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-emerald-200 text-emerald-700"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="p-4">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-900">New user registered</p>
                    <p className="text-xs text-emerald-600">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-900">New listing created</p>
                    <p className="text-xs text-emerald-600">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-900">Payment completed</p>
                    <p className="text-xs text-emerald-600">10 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Return null for desktop view (uses main AdminDashboard)
  return null;
};

export default MobileAdminDashboard;