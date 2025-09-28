'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { UserPlus, Mail } from 'lucide-react';

const ROLES = [
  { value: 'ADMIN', label: 'Admin', description: 'Full access except ownership transfer' },
  { value: 'MANAGER', label: 'Manager', description: 'Create listings, fulfill orders, view finances' },
  { value: 'STAFF', label: 'Staff', description: 'Create drafts, upload docs, mark fulfilled' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' }
];

export default function InviteMemberForm({ orgId, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'STAFF'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orgs/${orgId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Invitation sent successfully!');
        setFormData({ email: '', role: 'STAFF' });
        if (onSuccess) onSuccess();
      } else {
        setError(data.detail || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <UserPlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
          <p className="text-sm text-gray-600">Add someone to your organization</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700 text-sm flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            {success}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="colleague@example.com"
              required
              className="focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-gray-500">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading || !formData.email}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {loading ? 'Sending Invitation...' : 'Send Invitation'}
        </Button>
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions:</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div><strong>Admin:</strong> Manage settings, members, payouts (except ownership)</div>
          <div><strong>Manager:</strong> Create/publish listings, fulfill orders, view finances</div>
          <div><strong>Staff:</strong> Create drafts, upload documents, mark orders as fulfilled</div>
          <div><strong>Viewer:</strong> Read-only access to listings and orders</div>
        </div>
      </div>
    </div>
  );
}