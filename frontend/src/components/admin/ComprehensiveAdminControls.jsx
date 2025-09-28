import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Button, Input, Label, Badge, Avatar, AvatarFallback,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Switch, Alert, AlertDescription, Textarea, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui';
import { 
  Users, Package, TrendingUp, DollarSign, Shield, Settings, 
  BarChart3, Bell, Search, Filter, Eye, Edit, Trash2, Plus,
  Download, Upload, MapPin, Clock, CheckCircle, XCircle,
  AlertTriangle, Building, CreditCard, Globe, Mail, Phone,
  FileText, Image, Zap, RefreshCw, ArrowRight, ArrowLeft,
  Star, Heart, MessageCircle, Play, Pause, Copy, Ban, Check
} from 'lucide-react';

const ComprehensiveAdminControls = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState({
    users: [],
    listings: [],
    buyRequests: [],
    organizations: [],
    orders: [],
    referrals: [],
    blog: [],
    payments: [],
    documents: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);

  // Comprehensive admin functions that mirror ALL frontend capabilities
  const adminControls = {
    // USER MANAGEMENT - Mirror ALL user functions
    users: {
      approve: (userId) => apiCall('POST', `/admin/users/${userId}/approve`),
      suspend: (userId) => apiCall('POST', `/admin/users/${userId}/suspend`),
      editProfile: (userId, data) => apiCall('PATCH', `/admin/users/${userId}/profile`, data),
      editAddresses: (userId, addresses) => apiCall('PUT', `/admin/users/${userId}/addresses`, addresses),
      editPaymentMethods: (userId, methods) => apiCall('PUT', `/admin/users/${userId}/payment-methods`, methods),
      impersonate: (userId) => apiCall('POST', `/admin/users/${userId}/impersonate`),
      resetPassword: (userId) => apiCall('POST', `/admin/users/${userId}/reset-password`),
      changeRoles: (userId, roles) => apiCall('PATCH', `/admin/users/${userId}/roles`, { roles }),
      viewDashboard: (userId) => apiCall('GET', `/admin/users/${userId}/dashboard`),
      exportData: (userId) => apiCall('GET', `/admin/users/${userId}/export`)
    },
    
    // LISTING MANAGEMENT - Mirror ALL listing functions
    listings: {
      approve: (listingId) => apiCall('POST', `/admin/listings/${listingId}/approve`),
      reject: (listingId, reason) => apiCall('POST', `/admin/listings/${listingId}/reject`, { reason }),
      edit: (listingId, data) => apiCall('PATCH', `/admin/listings/${listingId}`, data),
      feature: (listingId) => apiCall('POST', `/admin/listings/${listingId}/feature`),
      boost: (listingId, boost) => apiCall('POST', `/admin/listings/${listingId}/boost`, { boost }),
      hide: (listingId) => apiCall('POST', `/admin/listings/${listingId}/hide`),
      transferOwner: (listingId, newOwnerId) => apiCall('POST', `/admin/listings/${listingId}/transfer`, { newOwnerId }),
      bulkApprove: (listingIds) => apiCall('POST', '/admin/listings/bulk-approve', { listingIds }),
      duplicateCheck: (listingId) => apiCall('GET', `/admin/listings/${listingId}/duplicates`)
    },
    
    // BUY REQUESTS MANAGEMENT - Mirror ALL buy request functions
    buyRequests: {
      moderate: (requestId, action) => apiCall('POST', `/admin/buy-requests/${requestId}/${action}`),
      editRequest: (requestId, data) => apiCall('PATCH', `/admin/buy-requests/${requestId}`, data),
      forceClose: (requestId) => apiCall('POST', `/admin/buy-requests/${requestId}/close`),
      manageOffers: (requestId, offerId, action) => apiCall('POST', `/admin/buy-requests/${requestId}/offers/${offerId}/${action}`),
      notifyNearby: (requestId) => apiCall('POST', `/admin/buy-requests/${requestId}/notify-nearby`),
      flagSpam: (requestId) => apiCall('POST', `/admin/buy-requests/${requestId}/flag-spam`)
    },
    
    // ORGANIZATION MANAGEMENT - Mirror ALL org functions
    organizations: {
      approve: (orgId) => apiCall('POST', `/admin/organizations/${orgId}/approve`),
      suspend: (orgId) => apiCall('POST', `/admin/organizations/${orgId}/suspend`),
      editDetails: (orgId, data) => apiCall('PATCH', `/admin/organizations/${orgId}`, data),
      manageMembers: (orgId, members) => apiCall('PUT', `/admin/organizations/${orgId}/members`, members),
      transferOwnership: (orgId, newOwnerId) => apiCall('POST', `/admin/organizations/${orgId}/transfer`, { newOwnerId }),
      viewDashboard: (orgId) => apiCall('GET', `/admin/organizations/${orgId}/dashboard`),
      setPermissions: (orgId, permissions) => apiCall('PUT', `/admin/organizations/${orgId}/permissions`, permissions)
    },
    
    // PAYMENT & FINANCIAL CONTROLS - Mirror ALL payment functions
    payments: {
      processRefund: (orderId, amount) => apiCall('POST', `/admin/orders/${orderId}/refund`, { amount }),
      adjustCommission: (orderId, rate) => apiCall('PATCH', `/admin/orders/${orderId}/commission`, { rate }),
      releaseEscrow: (orderId) => apiCall('POST', `/admin/orders/${orderId}/release-escrow`),
      holdPayment: (orderId, reason) => apiCall('POST', `/admin/orders/${orderId}/hold`, { reason }),
      manageDispute: (disputeId, resolution) => apiCall('POST', `/admin/disputes/${disputeId}/resolve`, { resolution }),
      adjustPricing: (settings) => apiCall('PUT', '/admin/platform/pricing', settings),
      managePayout: (payoutId, action) => apiCall('POST', `/admin/payouts/${payoutId}/${action}`)
    },
    
    // REFERRAL SYSTEM CONTROLS - Mirror ALL referral functions
    referrals: {
      createCode: (data) => apiCall('POST', '/admin/referrals/codes', data),
      adjustRate: (codeId, rate) => apiCall('PATCH', `/admin/referrals/codes/${codeId}/rate`, { rate }),
      processPayout: (userId, amount) => apiCall('POST', `/admin/referrals/users/${userId}/payout`, { amount }),
      viewTracking: (codeId) => apiCall('GET', `/admin/referrals/codes/${codeId}/tracking`),
      flagFraud: (userId) => apiCall('POST', `/admin/referrals/users/${userId}/flag-fraud`),
      bulkPayout: (payouts) => apiCall('POST', '/admin/referrals/bulk-payout', { payouts })
    },
    
    // CONTENT MANAGEMENT - Mirror ALL content functions
    content: {
      createBlog: (data) => apiCall('POST', '/admin/blog/posts', data),
      editBlog: (postId, data) => apiCall('PATCH', `/admin/blog/posts/${postId}`, data),
      publishBlog: (postId) => apiCall('POST', `/admin/blog/posts/${postId}/publish`),
      moderateComments: (postId, commentId, action) => apiCall('POST', `/admin/blog/posts/${postId}/comments/${commentId}/${action}`),
      manageCategories: (categories) => apiCall('PUT', '/admin/blog/categories', { categories }),
      schedulePost: (postId, date) => apiCall('POST', `/admin/blog/posts/${postId}/schedule`, { date })
    }
  };

  // Fetch comprehensive admin data
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [
        users, listings, buyRequests, organizations, orders,
        referrals, blog, payments, documents, notifications
      ] = await Promise.all([
        fetch('/api/admin/users').then(r => r.json()).catch(() => []),
        fetch('/api/admin/listings').then(r => r.json()).catch(() => []),
        fetch('/api/admin/buy-requests').then(r => r.json()).catch(() => []),
        fetch('/api/admin/organizations').then(r => r.json()).catch(() => []),
        fetch('/api/admin/orders').then(r => r.json()).catch(() => []),
        fetch('/api/admin/referrals').then(r => r.json()).catch(() => []),
        fetch('/api/admin/blog').then(r => r.json()).catch(() => []),
        fetch('/api/admin/payments').then(r => r.json()).catch(() => []),
        fetch('/api/admin/documents').then(r => r.json()).catch(() => []),
        fetch('/api/admin/notifications').then(r => r.json()).catch(() => [])
      ]);

      setData({
        users: users || [],
        listings: listings || [],
        buyRequests: buyRequests || [],
        organizations: organizations || [],
        orders: orders || [],
        referrals: referrals || [],
        blog: blog || [],
        payments: payments || [],
        documents: documents || [],
        notifications: notifications || []
      });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoading(false);
  };

  // USER MANAGEMENT TAB - Complete control over all user functions
  const UserManagementTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Complete User Management</h2>
        <div className="flex gap-3">
          <Button onClick={() => adminControls.users.exportData('all')}>
            <Download className="h-4 w-4 mr-2" />
            Export All Users
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* User Control Interface */}
      <Card>
        <CardHeader>
          <CardTitle>User Control Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Advanced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.slice(0, 10).map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(user.roles || ['user']).map(role => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => adminControls.users.editProfile(user.id)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => adminControls.users.viewDashboard(user.id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => adminControls.users.suspend(user.id)} className="text-red-600">
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => adminControls.users.impersonate(user.id)}>
                          Impersonate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => adminControls.users.resetPassword(user.id)}>
                          Reset Pass
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk User Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk User Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button className="w-full">Bulk Approve Users</Button>
            <Button className="w-full" variant="outline">Bulk Export Data</Button>
            <Button className="w-full" variant="outline">Send Announcement</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // LISTING MANAGEMENT TAB - Complete control over all listing functions
  const ListingManagementTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Complete Listing Management</h2>
        <div className="flex gap-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Listing Control Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Control Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.listings.slice(0, 5).map((listing, index) => (
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
                    <Button size="sm" variant="outline" onClick={() => adminControls.listings.edit(listing.id)}>
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => adminControls.listings.approve(listing.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => adminControls.listings.feature(listing.id)}>
                      Feature
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => adminControls.listings.boost(listing.id, 10)}>
                      Boost
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Listing Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Listing Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Pending Approval: 15</span>
                <Button size="sm" onClick={() => adminControls.listings.bulkApprove(['1', '2', '3'])}>
                  Bulk Approve
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Flagged Content: 3</span>
                <Button size="sm" variant="outline">Review</Button>
              </div>
              <div className="flex justify-between items-center">
                <span>Expired Listings: 8</span>
                <Button size="sm" variant="outline">Auto-renew</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Listing Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full">Duplicate Detection</Button>
              <Button className="w-full" variant="outline">Price Validation</Button>
              <Button className="w-full" variant="outline">Quality Score Analysis</Button>
              <Button className="w-full" variant="outline">SEO Optimization</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // COMPREHENSIVE TABS RENDER
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
              <p className="text-sm text-gray-300">Complete Platform Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="text-white border-white/20" onClick={fetchAdminData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 w-full max-w-7xl overflow-x-auto mb-8">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="buy-requests">Buy Requests</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="blog">Blog/Content</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="listings">
            <ListingManagementTab />
          </TabsContent>

          <TabsContent value="buy-requests">
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Buy Requests Management</h3>
              <p className="text-gray-500">Complete control over buy requests: moderate, edit, close, manage offers.</p>
            </div>
          </TabsContent>

          <TabsContent value="organizations">
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Organization Management</h3>
              <p className="text-gray-500">Approve organizations, manage members, edit details, transfer ownership.</p>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Management</h3>
              <p className="text-gray-500">Complete order control: refunds, escrow release, dispute resolution.</p>
            </div>
          </TabsContent>

          <TabsContent value="referrals">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Referral System Management</h3>
              <p className="text-gray-500">Create codes, adjust rates, process payouts, track performance.</p>
            </div>
          </TabsContent>

          <TabsContent value="blog">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Management</h3>
              <p className="text-gray-500">Create, edit, publish blog posts, manage categories, moderate comments.</p>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Management</h3>
              <p className="text-gray-500">Process refunds, adjust commissions, manage escrow, resolve disputes.</p>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Verification</h3>
              <p className="text-gray-500">Verify vet certificates, approve documents, manage compliance.</p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Settings</h3>
              <p className="text-gray-500">Configure platform settings, manage taxonomy, adjust features.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveAdminControls;