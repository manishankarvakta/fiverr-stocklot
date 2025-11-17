import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Search, Filter, MoreVertical, Ban, CheckCircle, AlertTriangle, User } from 'lucide-react';
// import adminApi from '../../api/adminClient';

const UserModeration = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    kyc_level: 'all',
    search: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.role !== 'all') params.role = filters.role;
      if (filters.kyc_level !== 'all') params.kyc_level = filters.kyc_level;
      if (filters.search) params.search = filters.search;
      
      const response = await adminApi.get('/admin/users', { params });
      setUsers(response.data.users || []);
      
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId, reason) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'suspend' }));
      
      await adminApi.post(`/admin/users/${userId}/suspend`, {
        reason,
        duration: '30d' // Default 30 days
      });
      
      // Refresh users list
      await loadUsers();
      
      // Show success message
      alert('User suspended successfully');
      
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const reactivateUser = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'reactivate' }));
      
      await adminApi.post(`/admin/users/${userId}/reactivate`);
      
      // Refresh users list
      await loadUsers();
      
      alert('User reactivated successfully');
      
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const promoteUser = async (userId, newRole) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'promote' }));
      
      await adminApi.post(`/admin/users/${userId}/promote`, {
        role: newRole
      });
      
      await loadUsers();
      alert(`User promoted to ${newRole} successfully`);
      
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      banned: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleColor = (roles) => {
    if (roles.includes('admin')) return 'text-red-600';
    if (roles.includes('seller')) return 'text-blue-600';
    if (roles.includes('transporter')) return 'text-purple-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Moderation</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and access</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="transporter">Transporter</option>
              <option value="admin">Admin</option>
            </select>
            
            <select
              value={filters.kyc_level}
              onChange={(e) => setFilters(prev => ({ ...prev, kyc_level: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All KYC Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">User</th>
                  <th className="text-left py-3">Role</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">KYC Level</th>
                  <th className="text-left py-3">Joined</th>
                  <th className="text-left py-3">Last Active</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${getRoleColor(user.roles)}`}>
                        {user.roles.join(', ')}
                      </span>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Level {user.kyc_level}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-gray-500">
                      {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'active' ? (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for suspension:');
                              if (reason) suspendUser(user.id, reason);
                            }}
                            disabled={actionLoading[user.id]}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Suspend User"
                          >
                            {actionLoading[user.id] === 'suspend' ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateUser(user.id)}
                            disabled={actionLoading[user.id]}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Reactivate User"
                          >
                            {actionLoading[user.id] === 'reactivate' ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="More Actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{selectedUser.full_name}</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-600">Email:</label>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Current Roles:</label>
                <p className="font-medium">{selectedUser.roles.join(', ')}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Business Name:</label>
                <p className="font-medium">{selectedUser.business_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Location:</label>
                <p className="font-medium">{selectedUser.province}, {selectedUser.country}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              {!selectedUser.roles.includes('seller') && (
                <button
                  onClick={() => {
                    promoteUser(selectedUser.id, 'seller');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Promote to Seller
                </button>
              )}
              
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserModeration;