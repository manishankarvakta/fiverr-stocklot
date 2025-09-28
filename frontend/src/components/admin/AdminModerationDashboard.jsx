import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { Shield, AlertTriangle, Eye, Clock, CheckCircle, XCircle, Users, Package, MessageSquare, Flag } from 'lucide-react';

const AdminModerationDashboard = () => {
  const [stats, setStats] = useState({
    pending_users: 0,
    pending_listings: 0,
    flagged_content: 0,
    pending_reviews: 0,
    total_reports: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      // Load moderation statistics
      const statsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/moderation/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent moderation items
      const itemsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/moderation/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setRecentItems(Array.isArray(itemsData) ? itemsData : itemsData.items || []);
      }
    } catch (error) {
      console.error('Error loading moderation data:', error);
      alert('Error loading moderation data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (itemId, itemType, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/moderation/${itemType}/${itemId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_notes: `Quick ${action} from moderation dashboard`,
          reason: action === 'reject' ? 'Moderation review' : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.message) {
          alert(`${itemType} ${action} successful!`);
          loadModerationData(); // Refresh data
        } else {
          alert(`Failed to ${action} ${itemType}: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} ${itemType}: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} ${itemType}:`, error);
      alert(`Error ${action} ${itemType}: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'flagged': return <Badge className="bg-orange-100 text-orange-800"><Flag className="h-3 w-3 mr-1" />Flagged</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'listing': return <Package className="h-4 w-4" />;
      case 'review': return <MessageSquare className="h-4 w-4" />;
      case 'report': return <Flag className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Moderation Center</h2>
          <p className="text-gray-600">Monitor and moderate platform content and users</p>
        </div>
        <Button onClick={loadModerationData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Shield className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Moderation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_users}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Listings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending_listings}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged Content</p>
                <p className="text-2xl font-bold text-red-600">{stats.flagged_content}</p>
              </div>
              <Flag className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pending_reviews}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total_reports}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = '#users'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-gray-600">Review user accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = '#listings'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold">Livestock Listings</h3>
                <p className="text-sm text-gray-600">Moderate listings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = '#buy-requests'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-semibold">Buy Requests</h3>
                <p className="text-sm text-gray-600">Review buy requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = '#reports'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flag className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold">Reports & Flags</h3>
                <p className="text-sm text-gray-600">Handle reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Moderation Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Items Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading recent items...</p>
              </div>
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No items requiring immediate attention</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <h3 className="font-semibold">{item.title || `${item.type} #${item.id?.substring(0, 8)}`}</h3>
                          <p className="text-sm text-gray-600">{item.description || item.content?.substring(0, 100) + '...'}</p>
                        </div>
                        {getStatusBadge(item.status)}
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Created: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}</p>
                        <p>Reported by: {item.reporter || item.user_name || 'System'}</p>
                        {item.reason && <p>Reason: {item.reason}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Navigate to detailed view based on type
                          const routes = {
                            'user': '#users',
                            'listing': '#listings',
                            'review': '#reviews',
                            'buy_request': '#buy-requests'
                          };
                          window.location.href = routes[item.type] || '#';
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleQuickAction(item.id, item.type, 'approve')}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleQuickAction(item.id, item.type, 'reject')}
                            disabled={actionLoading}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {item.status === 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleQuickAction(item.id, item.type, 'unflag')}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminModerationDashboard;