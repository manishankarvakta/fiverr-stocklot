import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger, Checkbox
} from '../ui';
import { 
  UserCog, Shield, Users, Key, Plus, Edit, Trash2, Eye, RefreshCw,
  Crown, Lock, Unlock, AlertTriangle, CheckCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminRolesManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    slug: '', 
    description: '',
    permissions: [],
    level: 5
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchAdminUsers();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/roles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${API}/admin/permissions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch(`${API}/admin/admin-users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch(`${API}/admin/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRole)
      });
      
      if (response.ok) {
        setShowCreateDialog(false);
        setNewRole({ name: '', slug: '', description: '', permissions: [], level: 5 });
        fetchRoles(); // Refresh the list
      } else {
        console.error('Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const response = await fetch(`${API}/admin/roles/${roleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          fetchRoles(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName.toLowerCase()) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'content_manager': return 'bg-green-100 text-green-800';
      case 'financial_admin': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data for demo
  const mockRoles = [
    {
      id: 'role_1',
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Full system access with all permissions',
      permissions: ['*'],
      user_count: 1,
      created_at: '2025-08-01T12:00:00Z',
      is_system_role: true,
      level: 1
    },
    {
      id: 'role_2', 
      name: 'Admin',
      slug: 'admin',
      description: 'General administrative access to most features',
      permissions: ['users.manage', 'listings.manage', 'orders.manage', 'payouts.manage', 'settings.manage'],
      user_count: 3,
      created_at: '2025-08-01T12:00:00Z',
      is_system_role: true,
      level: 2
    },
    {
      id: 'role_3',
      name: 'Content Manager',
      slug: 'content_manager', 
      description: 'Manage blog content, CMS, and marketing materials',
      permissions: ['cms.manage', 'blog.manage', 'media.manage', 'messaging.broadcast'],
      user_count: 2,
      created_at: '2025-08-15T14:30:00Z',
      is_system_role: false,
      level: 3
    },
    {
      id: 'role_4',
      name: 'Financial Admin',
      slug: 'financial_admin',
      description: 'Manage payouts, payments, and financial operations',
      permissions: ['payouts.manage', 'payments.verify', 'escrow.manage', 'fees.configure'],
      user_count: 1,
      created_at: '2025-08-20T09:15:00Z',
      is_system_role: false,
      level: 3
    },
    {
      id: 'role_5',
      name: 'Moderator',
      slug: 'moderator',
      description: 'Moderate content, users, and handle compliance',
      permissions: ['listings.moderate', 'users.suspend', 'compliance.review', 'messages.moderate'],
      user_count: 5,
      created_at: '2025-08-25T11:20:00Z',
      is_system_role: false,
      level: 4
    }
  ];

  const mockPermissions = [
    { category: 'User Management', permissions: ['users.view', 'users.manage', 'users.suspend', 'users.delete'] },
    { category: 'Listings Management', permissions: ['listings.view', 'listings.manage', 'listings.moderate', 'listings.approve'] },
    { category: 'Orders & Payments', permissions: ['orders.view', 'orders.manage', 'escrow.manage', 'payouts.manage', 'payments.verify'] },
    { category: 'Financial Operations', permissions: ['fees.configure', 'reports.financial', 'analytics.financial'] },
    { category: 'Content Management', permissions: ['cms.manage', 'blog.manage', 'media.manage', 'pages.manage'] },
    { category: 'System Operations', permissions: ['settings.manage', 'roles.manage', 'webhooks.manage', 'logs.view'] },
    { category: 'Communication', permissions: ['messaging.moderate', 'messaging.broadcast', 'notifications.send'] },
    { category: 'Business Operations', permissions: ['compliance.review', 'logistics.manage', 'auctions.manage', 'referrals.manage'] }
  ];

  const mockAdminUsers = [
    {
      id: 'admin_1',
      full_name: 'System Administrator',
      email: 'admin@stocklot.farm',
      roles: ['Super Admin'],
      status: 'active',
      last_login: '2025-08-29T15:30:00Z',
      created_at: '2025-08-01T12:00:00Z',
      login_count: 1247
    },
    {
      id: 'admin_2',
      full_name: 'John Smith',
      email: 'john.smith@stocklot.farm',
      roles: ['Admin'],
      status: 'active',
      last_login: '2025-08-29T10:15:00Z',
      created_at: '2025-08-10T14:20:00Z',
      login_count: 89
    },
    {
      id: 'admin_3',
      full_name: 'Sarah Williams',
      email: 'sarah.williams@stocklot.farm',
      roles: ['Content Manager'],
      status: 'active',
      last_login: '2025-08-28T16:45:00Z',
      created_at: '2025-08-15T11:30:00Z',
      login_count: 156
    },
    {
      id: 'admin_4',
      full_name: 'Michael Johnson',
      email: 'michael.johnson@stocklot.farm',
      roles: ['Financial Admin'],
      status: 'active',
      last_login: '2025-08-29T09:20:00Z',
      created_at: '2025-08-20T13:10:00Z',
      login_count: 67
    },
    {
      id: 'admin_5',
      full_name: 'Emma Davis',
      email: 'emma.davis@stocklot.farm',
      roles: ['Moderator'],
      status: 'inactive',
      last_login: '2025-08-25T14:30:00Z',
      created_at: '2025-08-25T09:00:00Z',
      login_count: 23
    }
  ];

  const displayRoles = roles.length > 0 ? roles : mockRoles;
  const displayPermissions = permissions.length > 0 ? permissions : mockPermissions;
  const displayAdminUsers = adminUsers.length > 0 ? adminUsers : mockAdminUsers;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Admin Roles & Permissions</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Roles & Permissions</h2>
          <p className="text-gray-600">Manage admin user roles and system permissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {fetchRoles(); fetchAdminUsers();}}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Roles</p>
                <p className="text-2xl font-bold text-blue-600">{displayRoles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admin Users</p>
                <p className="text-2xl font-bold text-purple-600">{displayAdminUsers.length}</p>
              </div>
              <UserCog className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Admins</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayAdminUsers.filter(u => u.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Permissions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {displayPermissions.reduce((sum, cat) => sum + cat.permissions.length, 0)}
                </p>
              </div>
              <Key className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles Management</TabsTrigger>
          <TabsTrigger value="admin-users">Admin Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Admin Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {role.is_system_role && <Lock className="h-4 w-4 text-gray-400" />}
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <Badge className={getRoleColor(role.slug)} variant="outline">
                              {role.slug}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{role.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {role.permissions.includes('*') ? (
                            <Badge className="bg-red-100 text-red-800">All Permissions</Badge>
                          ) : (
                            <span>{role.permissions.length} permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{role.user_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {role.level === 1 && <Crown className="h-4 w-4 text-yellow-500" />}
                          <span>Level {role.level}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedRole(role); setShowRoleDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!role.is_system_role && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => console.log('Edit role:', role.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-users">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Login Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAdminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.roles.map((role, index) => (
                            <Badge key={index} className={getRoleColor(role)} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_login ? 
                          new Date(user.last_login).toLocaleDateString() : 
                          'Never'
                        }
                      </TableCell>
                      <TableCell className="font-medium">{user.login_count}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button size="sm" variant="outline">
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid lg:grid-cols-2 gap-6">
            {displayPermissions.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.permissions.map((permission, permIndex) => (
                      <div key={permIndex} className="flex items-center gap-2 p-2 border rounded">
                        <Checkbox />
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {permission}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new admin role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                placeholder="e.g., Content Manager"
              />
            </div>
            
            <div>
              <Label htmlFor="roleSlug">Role Slug</Label>
              <Input
                id="roleSlug"
                value={newRole.slug}
                onChange={(e) => setNewRole({...newRole, slug: e.target.value})}
                placeholder="e.g., content_manager"
              />
            </div>
            
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                placeholder="Describe the role's responsibilities"
              />
            </div>
            
            <div>
              <Label htmlFor="roleLevel">Permission Level</Label>
              <Select value={newRole.level.toString()} onValueChange={(value) => setNewRole({...newRole, level: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 (Super Admin)</SelectItem>
                  <SelectItem value="2">Level 2 (Admin)</SelectItem>
                  <SelectItem value="3">Level 3 (Manager)</SelectItem>
                  <SelectItem value="4">Level 4 (Moderator)</SelectItem>
                  <SelectItem value="5">Level 5 (Staff)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateRole}
              disabled={!newRole.name || !newRole.slug}
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Details Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Role Details</DialogTitle>
            <DialogDescription>
              View role information and assigned permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Role Name</Label>
                  <p className="text-sm">{selectedRole.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Slug</Label>
                  <p className="text-sm">{selectedRole.slug}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Level</Label>
                  <p className="text-sm">Level {selectedRole.level}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Users</Label>
                  <p className="text-sm">{selectedRole.user_count} assigned</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedRole.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Permissions</Label>
                <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                  {selectedRole.permissions.includes('*') ? (
                    <Badge className="bg-red-100 text-red-800">All System Permissions</Badge>
                  ) : (
                    selectedRole.permissions.map((permission, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-1">
                        {permission}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {selectedRole.is_system_role && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This is a system role and cannot be modified or deleted.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Close
            </Button>
            {selectedRole && !selectedRole.is_system_role && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                Edit Role
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}