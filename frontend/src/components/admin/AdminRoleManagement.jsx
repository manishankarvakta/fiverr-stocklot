'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Shield, Users, Crown, UserCheck, Eye, UserX, 
  Settings, Plus, Search, AlertTriangle, CheckCircle 
} from 'lucide-react';

const ADMIN_ROLES = {
  'SUPER_ADMIN': { 
    label: 'Super Admin', 
    color: 'bg-red-100 text-red-800', 
    icon: <Crown className="h-4 w-4" />,
    permissions: ['All platform controls', 'User management', 'System settings', 'Financial oversight']
  },
  'ADMIN': { 
    label: 'Platform Admin', 
    color: 'bg-orange-100 text-orange-800', 
    icon: <Shield className="h-4 w-4" />,
    permissions: ['User management', 'Content moderation', 'Order oversight', 'KYC verification']
  },
  'MODERATOR': { 
    label: 'Content Moderator', 
    color: 'bg-blue-100 text-blue-800', 
    icon: <UserCheck className="h-4 w-4" />,
    permissions: ['Content review', 'Listing approval', 'Dispute mediation', 'User warnings']
  },
  'SUPPORT': { 
    label: 'Customer Support', 
    color: 'bg-green-100 text-green-800', 
    icon: <Users className="h-4 w-4" />,
    permissions: ['User assistance', 'Order support', 'Basic KYC help', 'Ticket resolution']
  },
  'VIEWER': { 
    label: 'Analytics Viewer', 
    color: 'bg-gray-100 text-gray-800', 
    icon: <Eye className="h-4 w-4" />,
    permissions: ['Dashboard access', 'Report viewing', 'Data export', 'Read-only access']
  }
};

const ADMIN_PERMISSIONS = {
  'users.manage': 'Manage Users',
  'users.suspend': 'Suspend Users', 
  'organizations.manage': 'Manage Organizations',
  'organizations.verify': 'Verify Organizations',
  'listings.moderate': 'Moderate Listings',
  'orders.oversight': 'Order Oversight',
  'payments.manage': 'Payment Management',
  'analytics.access': 'Analytics Access',
  'system.settings': 'System Settings',
  'admin.manage': 'Manage Admins'
};

export default function AdminRoleManagement() {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ user_id: '', role: 'MODERATOR', permissions: [] });
  const [activeTab, setActiveTab] = useState('admins');

  useEffect(() => {
    fetchAdmins();
    fetchUsers();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAdminRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminData)
      });

      if (response.ok) {
        fetchAdmins();
        setShowAddAdmin(false);
        setNewAdminData({ user_id: '', role: 'MODERATOR', permissions: [] });
      }
    } catch (error) {
      console.error('Error adding admin role:', error);
    }
  };

  const removeAdminRole = async (adminId) => {
    if (!confirm('Are you sure you want to remove this admin role?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/roles/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error removing admin role:', error);
    }
  };

  const updateAdminRole = async (adminId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/roles/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchAdmins();
      }
    } catch (error) {
      console.error('Error updating admin role:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.filter(a => a.role === 'SUPER_ADMIN').length}
                </p>
                <p className="text-sm text-gray-600">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.filter(a => a.role === 'ADMIN').length}
                </p>
                <p className="text-sm text-gray-600">Platform Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.filter(a => ['MODERATOR', 'SUPPORT'].includes(a.role)).length}
                </p>
                <p className="text-sm text-gray-600">Staff Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {admins.filter(a => a.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="admins">Platform Admins</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Platform Administrator</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {filteredUsers.slice(0, 10).map((user) => (
                      <div
                        key={user.id}
                        className={`p-2 cursor-pointer hover:bg-gray-50 ${
                          newAdminData.user_id === user.id ? 'bg-blue-50 border-blue-500' : ''
                        }`}
                        onClick={() => setNewAdminData(prev => ({ ...prev, user_id: user.id }))}
                      >
                        <div className="font-medium text-sm">{user.full_name || user.email}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Role</label>
                  <Select value={newAdminData.role} onValueChange={(value) => setNewAdminData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ADMIN_ROLES).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            {role.icon}
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-gray-500">
                                {role.permissions.slice(0, 2).join(', ')}
                                {role.permissions.length > 2 && '...'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {ADMIN_ROLES[newAdminData.role] && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Role Permissions:</h4>
                    <div className="space-y-1">
                      {ADMIN_ROLES[newAdminData.role].permissions.map((perm, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {perm}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={addAdminRole} 
                  disabled={!newAdminData.user_id || !newAdminData.role}
                  className="w-full"
                >
                  Add Administrator
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Platform Admins Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {admin.user?.full_name?.charAt(0) || admin.user?.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">
                            {admin.user?.full_name || admin.user?.email?.split('@')[0]}
                          </h4>
                          <Badge className={ADMIN_ROLES[admin.role]?.color}>
                            <div className="flex items-center space-x-1">
                              {ADMIN_ROLES[admin.role]?.icon}
                              <span>{ADMIN_ROLES[admin.role]?.label}</span>
                            </div>
                          </Badge>
                          {admin.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{admin.user?.email}</p>
                        <p className="text-xs text-gray-500">
                          Added {new Date(admin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select
                        value={admin.role}
                        onValueChange={(value) => updateAdminRole(admin.id, { role: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ADMIN_ROLES).map(([key, role]) => (
                            <SelectItem key={key} value={key}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAdminRole(admin.id, { status: admin.status === 'active' ? 'inactive' : 'active' })}
                      >
                        {admin.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeAdminRole(admin.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {admins.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No administrators found</p>
                    <p className="text-sm">Add your first platform administrator</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Permission</th>
                      {Object.entries(ADMIN_ROLES).map(([key, role]) => (
                        <th key={key} className="text-center py-2 px-3">
                          <div className="flex flex-col items-center">
                            {role.icon}
                            <span className="text-xs mt-1">{role.label.split(' ')[0]}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(ADMIN_PERMISSIONS).map(([key, permission]) => (
                      <tr key={key} className="border-b">
                        <td className="py-2 font-medium">{permission}</td>
                        {Object.entries(ADMIN_ROLES).map(([roleKey, role]) => (
                          <td key={roleKey} className="text-center py-2">
                            {key === 'admin.manage' && roleKey === 'SUPER_ADMIN' ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : key === 'system.settings' && ['SUPER_ADMIN', 'ADMIN'].includes(roleKey) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : key.includes('users') && ['SUPER_ADMIN', 'ADMIN'].includes(roleKey) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : key.includes('moderate') && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(roleKey) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : key.includes('analytics') && ['SUPER_ADMIN', 'ADMIN', 'VIEWER'].includes(roleKey) ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <div className="w-4 h-4 mx-auto"></div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Audit log feature coming soon</p>
                  <p className="text-sm">Track all administrator actions and changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}