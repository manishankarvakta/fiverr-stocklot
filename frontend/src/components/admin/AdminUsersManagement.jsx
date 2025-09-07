import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui';
import { 
  Users, Plus, Eye, Edit, Trash2, Search, Filter, Mail, Phone, MapPin,
  CheckCircle, XCircle, Clock, Shield, Crown
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'https://easy-signin-1.preview.emergentagent.com/api';

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'buyer',
    status: 'active',
    country: 'South Africa',
    province: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setShowAddUser(false);
        setNewUser({
          email: '', name: '', phone: '', role: 'buyer', 
          status: 'active', country: 'South Africa', province: ''
        });
        fetchUsers();
        alert('User created successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(selectedUser)
      });

      if (response.ok) {
        setShowEditUser(false);
        setSelectedUser(null);
        fetchUsers();
        alert('User updated successfully!');
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchUsers();
          alert('User deleted successfully!');
        } else {
          throw new Error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch(`${API}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUsers();
        alert(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.roles?.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (roles) => {
    if (roles?.includes('admin')) return 'bg-red-100 text-red-800';
    if (roles?.includes('seller')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setShowAddUser(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="seller">Sellers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.roles?.map((role, index) => (
                        <Badge key={index} className={getRoleColor([role])} variant="outline">
                          {role}
                        </Badge>
                      )) || <Badge variant="outline">buyer</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status || 'active')}>
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.province && <div>{user.province}</div>}
                      <div className="text-gray-500">{user.country || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditUser(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                      >
                        {user.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="+27 123 456 789"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Province</Label>
              <Select value={newUser.province} onValueChange={(value) => setNewUser({...newUser, province: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gauteng">Gauteng</SelectItem>
                  <SelectItem value="Western Cape">Western Cape</SelectItem>
                  <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                  <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                  <SelectItem value="Free State">Free State</SelectItem>
                  <SelectItem value="Limpopo">Limpopo</SelectItem>
                  <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                  <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                  <SelectItem value="North West">North West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser} 
              disabled={loading || !newUser.email || !newUser.name}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedUser.status || 'active'} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}