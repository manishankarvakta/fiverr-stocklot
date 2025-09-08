import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Separator, ScrollArea
} from '../ui';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, DollarSign, CreditCard,
  Building2, FileText, MessageSquare, Gift, Webhook, MapPin, Truck,
  Gavel, BookOpen, Settings, BarChart3, UserCog, Megaphone, Award,
  Menu, X, Home, LogOut, Bell, Search, Lightbulb
} from 'lucide-react';

// Import all admin components
import AdminDashboard from './AdminDashboard';
import AdminUsersQueue from './AdminUsersQueue';
import AdminListingsQueue from './AdminListingsQueue';
import AdminOrdersManagement from './AdminOrdersManagement';
import AdminPayoutsManagement from './AdminPayoutsManagement';
import AdminPaymentMethods from './AdminPaymentMethods';
import AdminOrganizationsManagement from './AdminOrganizationsManagement';
import AdminComplianceQueue from './AdminComplianceQueue';
import AdminMessagingControls from './AdminMessagingControls';
import AdminReferralsManagement from './AdminReferralsManagement';
import AdminWebhooksManagement from './AdminWebhooksManagement';
import AdminGeofencingControls from './AdminGeofencingControls';
import AdminLogisticsManagement from './AdminLogisticsManagement';
import AdminAuctionsManagement from './AdminAuctionsManagement';
import AdminCMSManagement from './AdminCMSManagement';
import AdminSettingsControls from './AdminSettingsControls';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import AdminRolesManagement from './AdminRolesManagement';
import AdminBroadcastMessaging from './AdminBroadcastMessaging';
import AdminInfluencerPayouts from './AdminInfluencerPayouts';
import AdminBuyRequestsManagement from './AdminBuyRequestsManagement';
import AdminSuggestionsManagement from './AdminSuggestionsManagement';
import AdminPDPAnalytics from './AdminPDPAnalytics';
import AdminABTesting from './AdminABTesting';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const menuItems = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, component: AdminDashboard },
  { id: 'users', label: 'User Management', icon: Users, component: AdminUsersQueue },
  { id: 'listings', label: 'Livestock Listings', icon: Package, component: AdminListingsQueue },
  { id: 'buy-requests', label: 'Buy Requests', icon: MessageSquare, component: AdminBuyRequestsManagement },
  { id: 'orders', label: 'Orders & Escrow', icon: ShoppingCart, component: AdminOrdersManagement },
  
  // Financial Management Section
  { id: 'divider1', type: 'divider', label: 'Financial Management' },
  { id: 'payouts', label: 'Seller Payouts', icon: DollarSign, component: AdminPayoutsManagement },
  { id: 'payments', label: 'Payment Methods', icon: CreditCard, component: AdminPaymentMethods },
  { id: 'influencer-payouts', label: 'Influencer Payouts', icon: Award, component: AdminInfluencerPayouts },
  
  // Business Operations Section
  { id: 'divider2', type: 'divider', label: 'Business Operations' },
  { id: 'organizations', label: 'Organizations KYC', icon: Building2, component: AdminOrganizationsManagement },
  { id: 'compliance', label: 'Document Compliance', icon: FileText, component: AdminComplianceQueue },
  { id: 'messaging', label: 'Message Moderation', icon: MessageSquare, component: AdminMessagingControls },
  { id: 'broadcast', label: 'Broadcast Messages', icon: Megaphone, component: AdminBroadcastMessaging },
  { id: 'referrals', label: 'Referral Programs', icon: Gift, component: AdminReferralsManagement },
  
  // Technical Management Section
  { id: 'divider3', type: 'divider', label: 'Technical Management' },
  { id: 'webhooks', label: 'Webhooks Monitor', icon: Webhook, component: AdminWebhooksManagement },
  { id: 'geofencing', label: 'Disease Zones', icon: MapPin, component: AdminGeofencingControls },
  { id: 'logistics', label: 'Logistics Partners', icon: Truck, component: AdminLogisticsManagement },
  { id: 'auctions', label: 'Live Auctions', icon: Gavel, component: AdminAuctionsManagement },
  
  // Content & System Section
  { id: 'divider4', type: 'divider', label: 'Content & System' },
  { id: 'cms', label: 'Blog & Content', icon: BookOpen, component: AdminCMSManagement },
  { id: 'suggestions', label: 'User Suggestions', icon: Lightbulb, component: AdminSuggestionsManagement },
  { id: 'roles', label: 'Admin Roles', icon: UserCog, component: AdminRolesManagement },
  { id: 'settings', label: 'Platform Settings', icon: Settings, component: AdminSettingsControls },
  { id: 'analytics', label: 'Business Analytics', icon: BarChart3, component: AdminAnalyticsDashboard }
];

export default function AdminLayoutWithSidebar({ user }) {
  const [activeItem, setActiveItem] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Admin access check
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  if (!user.roles || !user.roles.includes('admin')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAdminStats();
    fetchNotifications();
    
    // Set up SSE for real-time updates
    const eventSource = new EventSource(`${API}/admin/events/stream`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event !== 'HEARTBEAT') {
        // Update stats on real events
        fetchAdminStats();
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API}/admin/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getCurrentComponent = () => {
    const activeMenuItem = menuItems.find(item => item.id === activeItem);
    if (activeMenuItem && activeMenuItem.component) {
      const Component = activeMenuItem.component;
      return <Component user={user} />;
    }
    return <AdminDashboard user={user} />;
  };

  const getActiveItemLabel = () => {
    const activeMenuItem = menuItems.find(item => item.id === activeItem);
    return activeMenuItem ? activeMenuItem.label : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-72'
      } flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-emerald-600">StockLot Admin</h1>
                <p className="text-sm text-gray-500">Livestock Marketplace</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Admin Profile */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <UserCog className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{user?.full_name || 'Administrator'}</div>
                <div className="text-sm text-emerald-600">Super Admin</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">{stats.total_users || 0}</div>
                <div className="text-xs text-gray-500">Users</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.total_listings || 0}</div>
                <div className="text-xs text-gray-500">Listings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{stats.total_orders || 0}</div>
                <div className="text-xs text-gray-500">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{stats.pending_approvals || 0}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <ScrollArea className="flex-1">
          <nav className="p-2">
            {menuItems.map((item) => {
              if (item.type === 'divider') {
                return (
                  <div key={item.id} className="py-2">
                    <Separator />
                    {!sidebarCollapsed && (
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && isActive && (
                    <div className="ml-auto w-2 h-2 bg-emerald-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.open('/', '_blank')}
              >
                <Home className="h-4 w-4 mr-2" />
                View Website
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button variant="ghost" size="sm" onClick={() => window.open('/', '_blank')}>
                <Home className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getActiveItemLabel()}</h1>
              <p className="text-sm text-gray-500">
                Manage and monitor your livestock marketplace
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search admin..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">All Systems Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {getCurrentComponent()}
        </main>
      </div>
    </div>
  );
}