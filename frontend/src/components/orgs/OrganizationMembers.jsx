'use client';

import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Users, Crown, Shield, UserCheck, Eye, MoreVertical } from 'lucide-react';
import InviteMemberForm from './InviteMemberForm';

const getRoleIcon = (role) => {
  switch (role) {
    case 'OWNER': return <Crown className="h-4 w-4" />;
    case 'ADMIN': return <Shield className="h-4 w-4" />;
    case 'MANAGER': return <UserCheck className="h-4 w-4" />;
    case 'STAFF': return <Users className="h-4 w-4" />;
    case 'VIEWER': return <Eye className="h-4 w-4" />;
    default: return <Users className="h-4 w-4" />;
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case 'OWNER': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ADMIN': return 'bg-red-100 text-red-800 border-red-300';
    case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'STAFF': return 'bg-green-100 text-green-800 border-green-300';
    case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function OrganizationMembers({ orgId, userRole }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [orgId]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orgs/${orgId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      } else {
        setError('Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const canInvite = ['OWNER', 'ADMIN'].includes(userRole);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-600">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          {canInvite && (
            <Button 
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Invite Member
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {members.map((member, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-500 text-white font-semibold">
                    {member.full_name?.charAt(0) || member.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {member.full_name || member.email.split('@')[0]}
                    </h4>
                    <Badge className={`text-xs px-2 py-1 ${getRoleColor(member.role)}`}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span>{member.role}</span>
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {canInvite && member.role !== 'OWNER' && (
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No members yet</p>
              {canInvite && (
                <p className="text-sm">Invite your first team member to get started</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showInviteForm && canInvite && (
        <InviteMemberForm 
          orgId={orgId} 
          onSuccess={() => {
            fetchMembers();
            setShowInviteForm(false);
          }} 
        />
      )}
    </div>
  );
}