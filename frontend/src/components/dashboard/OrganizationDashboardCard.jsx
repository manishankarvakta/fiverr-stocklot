'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Building2, Users, Package, Crown, Shield, UserCheck, 
  Eye, Plus, Settings, Globe, Phone, Mail, Calendar,
  TrendingUp, DollarSign, CheckCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ORGANIZATION_TYPES = {
  'FARM': { label: 'Farm', color: 'bg-green-100 text-green-800', icon: '🚜' },
  'COMPANY': { label: 'Company', color: 'bg-blue-100 text-blue-800', icon: '🏢' },
  'COOP': { label: 'Cooperative', color: 'bg-purple-100 text-purple-800', icon: '🤝' },
  'ABATTOIR': { label: 'Abattoir', color: 'bg-red-100 text-red-800', icon: '🥩' },
  'TRANSPORTER': { label: 'Transporter', color: 'bg-yellow-100 text-yellow-800', icon: '🚛' },
  'EXPORTER': { label: 'Exporter', color: 'bg-indigo-100 text-indigo-800', icon: '🌍' }
};

const getRoleIcon = (role) => {
  switch (role) {
    case 'OWNER': return <Crown className="h-4 w-4" />;
    case 'ADMIN': return <Shield className="h-4 w-4" />;
    case 'MANAGER': return <UserCheck className="h-4 w-4" />;
    default: return <Users className="h-4 w-4" />;
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case 'OWNER': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ADMIN': return 'bg-red-100 text-red-800 border-red-300';
    case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export default function OrganizationDashboardCard({ user }) {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentContext, setCurrentContext] = useState('user');

  useEffect(() => {
    fetchUserOrganizations();
    setCurrentContext(localStorage.getItem('currentContext') || 'user');
  }, []);

  const fetchUserOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orgs/my-contexts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const orgContexts = data.items.filter(item => item.type === 'ORG');
        
        // Fetch detailed info for each organization
        const orgDetails = await Promise.all(
          orgContexts.map(async (orgContext) => {
            try {
              const orgResponse = await fetch(`/api/orgs/${orgContext.value}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                return {
                  ...orgData,
                  userRole: orgContext.role
                };
              }
            } catch (error) {
              console.error('Error fetching org details:', error);
            }
            return null;
          })
        );

        setOrganizations(orgDetails.filter(org => org !== null));
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToOrganization = async (orgId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/orgs/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target: orgId })
      });

      localStorage.setItem('currentContext', orgId);
      setCurrentContext(orgId);
      window.location.reload();
    } catch (error) {
      console.error('Error switching context:', error);
    }
  };

  const activeOrganization = organizations.find(org => org.id === currentContext);

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Context Display */}
      <Card className={`border-2 ${currentContext === 'user' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg">
              {currentContext === 'user' ? (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-emerald-900">Personal Account</span>
                    <p className="text-sm font-normal text-emerald-700">Individual seller profile</p>
                  </div>
                </>
              ) : (
                activeOrganization && (
                  <>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-blue-900">{activeOrganization.name}</span>
                      <p className="text-sm font-normal text-blue-700">
                        {ORGANIZATION_TYPES[activeOrganization.kind]?.label} • {activeOrganization.userRole}
                      </p>
                    </div>
                  </>
                )
              )}
            </CardTitle>
            <Badge className={currentContext === 'user' ? 'bg-emerald-600' : 'bg-blue-600'}>
              Active Context
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {currentContext === 'user' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-900">0</div>
                  <div className="text-sm text-emerald-700">Personal Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-900">0</div>
                  <div className="text-sm text-emerald-700">Total Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-900">4.9⭐</div>
                  <div className="text-sm text-emerald-700">Rating</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/create-listing')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
                <Button variant="outline" onClick={() => navigate('/create-organization')}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </div>
            </div>
          ) : (
            activeOrganization && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
                  <div className="text-2xl">{ORGANIZATION_TYPES[activeOrganization.kind]?.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={ORGANIZATION_TYPES[activeOrganization.kind]?.color}>
                        {ORGANIZATION_TYPES[activeOrganization.kind]?.label}
                      </Badge>
                      <Badge className={getRoleColor(activeOrganization.userRole)}>
                        {getRoleIcon(activeOrganization.userRole)}
                        <span className="ml-1">{activeOrganization.userRole}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {activeOrganization.handle && (
                        <div className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>stocklot.co.za/o/{activeOrganization.handle}</span>
                        </div>
                      )}
                      {activeOrganization.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{activeOrganization.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">0</div>
                    <div className="text-sm text-blue-700">Org Listings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">1</div>
                    <div className="text-sm text-blue-700">Team Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">R0</div>
                    <div className="text-sm text-blue-700">Revenue</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/create-listing')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Listing
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/orgs/${activeOrganization.handle}/dashboard`)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Organization List */}
      {organizations.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Your Organizations</span>
              <Badge variant="outline">{organizations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    org.id === currentContext 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => switchToOrganization(org.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {ORGANIZATION_TYPES[org.kind]?.icon}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{org.name}</h4>
                          <Badge className={ORGANIZATION_TYPES[org.kind]?.color}>
                            {ORGANIZATION_TYPES[org.kind]?.label}
                          </Badge>
                          <Badge className={getRoleColor(org.userRole)}>
                            {getRoleIcon(org.userRole)}
                            <span className="ml-1">{org.userRole}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{org.handle && `@${org.handle}`}</p>
                      </div>
                    </div>
                    {org.id === currentContext && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/create-organization')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Organization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Organizations - Call to Action */}
      {organizations.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scale Up?</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Create an organization to enable team collaboration, shared listings, and professional branding for your livestock business.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Team Management</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4" />
                  <span>Shared Listings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Analytics</span>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={() => navigate('/create-organization')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Create Your First Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}