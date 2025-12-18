// import React from 'react';
// import { Card, CardContent } from '@/components/ui';
// import { Button } from '@/components/ui';
// import { MessageCircle } from 'lucide-react';

// // function UnifiedInbox() {
// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <div className="container mx-auto px-4 py-16">
// //         <div className="max-w-4xl mx-auto">
// //           <h1 className="text-4xl font-bold text-emerald-900 mb-8">Inbox</h1>
// //           <Card className="border-emerald-200">
// //             <CardContent className="p-8">
// //               <MessageCircle className="h-12 w-12 text-emerald-600 mb-6" />
// //               <p className="text-emerald-700 mb-6">
// //                 Unified inbox. Please use the main App.js version for full features.
// //               </p>
// //               <Button 
// //                 onClick={() => window.location.href = '/dashboard'}
// //                 className="bg-emerald-600 hover:bg-emerald-700 text-white"
// //               >
// //                 Go to Dashboard
// //               </Button>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// export default UnifiedInbox;




import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { 
  Bell, MessageSquare, Package, DollarSign, CheckCircle, 
  XCircle, Clock, User, Mail, Trash2, Check, 
  Filter, Search, RefreshCw, Loader2, AlertCircle,
  Eye, ArrowRight, Star, Archive
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkNotificationsReadMutation,
  useMarkAllReadMutation,
} from '@/store/api/notifications.api';

const UnifiedInboxPage = ({ user }) => {
  const [filter, setFilter] = useState('all'); // all, unread, offers, orders, system
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const navigate = useNavigate();

  // RTK Query hooks
  const { data: notificationsData, isLoading: loading, refetch } = useGetNotificationsQuery(
    { unread_only: filter === 'unread' },
    {
      pollingInterval: 30000, // Poll every 30 seconds
      skip: !user,
    }
  );

  const { data: unreadCountData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
    skip: !user,
  });

  const [markNotificationsReadMutation] = useMarkNotificationsReadMutation();
  const [markAllAsReadMutation, { isLoading: actionLoading }] = useMarkAllReadMutation();

  const unreadCount = unreadCountData?.count || 0;

  // Filter notifications
  const notifications = useMemo(() => {
    if (!notificationsData?.items) return [];
    
    let items = [...notificationsData.items];
    
    // Filter by type if needed
    if (filter === 'offers') {
      items = items.filter(n => n.topic?.includes('offer'));
    } else if (filter === 'orders') {
      items = items.filter(n => n.topic?.includes('order'));
    } else if (filter === 'system') {
      items = items.filter(n => n.topic?.includes('system') || n.topic?.includes('maintenance'));
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(n => 
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term)
      );
    }
    
    return items;
  }, [notificationsData, filter, searchTerm]);

  const markAsRead = async (notificationIds) => {
    try {
      // Mark multiple notifications as read using bulk endpoint
      await markNotificationsReadMutation(notificationIds).unwrap();
      refetch();
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation().unwrap();
      refetch();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead([notification.id]);
    }
    
    // Navigate to action URL if provided
    if (notification.action_url || notification.data?.action_url) {
      const url = notification.action_url || notification.data.action_url;
      navigate(url);
    }
  };

  const toggleSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'offer_received':
      case 'offer_accepted':
      case 'offer_declined':
      case 'offer_counter':
        return <DollarSign className="h-4 w-4" />;
      case 'order_placed':
      case 'order_confirmed':
      case 'order_shipped':
      case 'order_delivered':
        return <Package className="h-4 w-4" />;
      case 'message_received':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'offer_received':
        return 'text-green-600 bg-green-50';
      case 'offer_accepted':
        return 'text-emerald-600 bg-emerald-50';
      case 'offer_declined':
        return 'text-red-600 bg-red-50';
      case 'order_placed':
      case 'order_confirmed':
        return 'text-blue-600 bg-blue-50';
      case 'system_alert':
      case 'maintenance':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStats = () => {
    return {
      total: notifications.length,
      unread: unreadCount,
      offers: notifications.filter(n => n.topic?.includes('offer')).length,
      orders: notifications.filter(n => n.topic?.includes('order')).length,
      system: notifications.filter(n => n.topic?.includes('system')).length
    };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-emerald-900 mb-2">Authentication Required</h2>
          <p className="text-emerald-700 mb-4">Please log in to view your inbox</p>
          <Button onClick={() => navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-emerald-700 mt-1">All your notifications and messages in one place</p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => refetch()} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} disabled={actionLoading}>
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
              <div className="text-sm text-gray-600">Offers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.orders}</div>
              <div className="text-sm text-gray-600">Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.system}</div>
              <div className="text-sm text-gray-600">System</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border p-4 mb-6 space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'unread', label: 'Unread', count: stats.unread },
              { key: 'offers', label: 'Offers', count: stats.offers },
              { key: 'orders', label: 'Orders', count: stats.orders },
              { key: 'system', label: 'System', count: stats.system }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                onClick={() => setFilter(key)}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                className="h-9"
              >
                {label} ({count})
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <Button onClick={() => refetch()}>
              Search
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded">
              <span className="text-sm text-emerald-700">
                {selectedNotifications.length} selected
              </span>
              <Button
                size="sm"
                onClick={() => markAsRead(selectedNotifications)}
                disabled={actionLoading}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark as Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedNotifications([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? "You're all caught up! No notifications to show."
                  : `No ${filter} notifications found.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/buy-requests')} className="bg-emerald-600 hover:bg-emerald-700">
                  Browse Marketplace
                </Button>
                <Button onClick={() => navigate('/create-buy-request')} variant="outline">
                  Create Buy Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(notification.id);
                      }}
                      className="mt-1"
                    />

                    {/* Notification Icon */}
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.topic)}`}>
                      {getNotificationIcon(notification.topic)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          
                          {/* Additional Data */}
                          {notification.data && Object.keys(notification.data).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {notification.data.offer_price && (
                                <Badge variant="outline" className="text-xs">
                                  R{notification.data.offer_price.toLocaleString()}
                                </Badge>
                              )}
                              {notification.data.seller_name && (
                                <Badge variant="outline" className="text-xs">
                                  from {notification.data.seller_name}
                                </Badge>
                              )}
                              {notification.data.buyer_name && (
                                <Badge variant="outline" className="text-xs">
                                  from {notification.data.buyer_name}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          )}
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedInboxPage;

