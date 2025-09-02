'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  User, Building2, ChevronRight, CheckCircle, 
  Crown, Users, Package, TrendingUp 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ORGANIZATION_TYPES = [
  { 
    value: 'FARM', 
    label: 'Farm', 
    description: 'Individual or family farm operation',
    icon: '🚜',
    benefits: ['Personal branding', 'Direct sales', 'Family legacy'],
    typical_role: 'seller',
    role_suggestion: 'Farms typically sell livestock they produce'
  },
  { 
    value: 'COMPANY', 
    label: 'Company', 
    description: 'Commercial livestock business',
    icon: '🏢',
    benefits: ['Team collaboration', 'Shared resources', 'Professional presence'],
    typical_role: 'both',
    role_suggestion: 'Companies often both buy and sell livestock'
  },
  { 
    value: 'COOP', 
    label: 'Cooperative', 
    description: 'Farmer cooperative or collective',
    icon: '🤝',
    benefits: ['Collective bargaining', 'Shared costs', 'Group marketing'],
    typical_role: 'both',
    role_suggestion: 'Cooperatives buy from members and sell to markets'
  },
  { 
    value: 'ABATTOIR', 
    label: 'Abattoir', 
    description: 'Meat processing facility',
    icon: '🥩',
    benefits: ['Processing expertise', 'Quality control', 'Value addition'],
    typical_role: 'buyer',
    role_suggestion: 'Abattoirs primarily buy livestock for processing'
  },
  { 
    value: 'TRANSPORTER', 
    label: 'Transporter', 
    description: 'Livestock transport service',
    icon: '🚛',
    benefits: ['Logistics network', 'Transport expertise', 'Service expansion'],
    typical_role: 'buyer',
    role_suggestion: 'Some transporters also trade livestock'
  },
  { 
    value: 'EXPORTER', 
    label: 'Exporter', 
    description: 'International livestock trade',
    icon: '🌍',
    benefits: ['Global reach', 'Export compliance', 'Currency diversification'],
    typical_role: 'both',
    role_suggestion: 'Exporters buy locally and sell internationally'
  }
];

export default function EnhancedRegister() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('individual');
  const [formData, setFormData] = useState({
    // Individual fields
    full_name: '',
    email: '',
    phone: '',
    password: '',
    user_type: 'both',
    // Organization fields
    org_name: '',
    org_kind: '',
    org_handle: '',
    org_phone: '',
    org_email: '',
    org_website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate organization handle from name
    if (field === 'org_name' && !formData.org_handle) {
      const handle = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        org_handle: handle
      }));
    }

    // Auto-suggest buyer/seller type based on organization type
    if (field === 'org_kind' && accountType === 'organization') {
      const orgType = ORGANIZATION_TYPES.find(type => type.value === value);
      if (orgType && orgType.typical_role) {
        setFormData(prev => ({
          ...prev,
          user_type: orgType.typical_role
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Create user account
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          user_type: formData.user_type
        })
      });

      const userData = await userResponse.json();

      if (userResponse.ok) {
        // Step 2: If organization account, create organization
        if (accountType === 'organization' && userData.access_token) {
          const orgResponse = await fetch('/api/orgs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData.access_token}`
            },
            body: JSON.stringify({
              name: formData.org_name,
              kind: formData.org_kind,
              handle: formData.org_handle,
              phone: formData.org_phone,
              email: formData.org_email,
              website: formData.org_website
            })
          });

          if (orgResponse.ok) {
            // Store both user and organization info
            localStorage.setItem('token', userData.access_token);
            localStorage.setItem('currentContext', 'organization');
            navigate('/dashboard');
          } else {
            setError('User created but organization setup failed. You can create it later.');
            setTimeout(() => navigate('/dashboard'), 3000);
          }
        } else {
          // Individual account - go to dashboard
          localStorage.setItem('token', userData.access_token);
          navigate('/dashboard');
        }
      } else {
        setError(userData.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedOrgType = ORGANIZATION_TYPES.find(type => type.value === formData.org_kind);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join StockLot</h1>
          <p className="text-gray-600">Choose how you want to start selling livestock</p>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <Badge variant="outline" className="text-emerald-600">🐄 South Africa's #1</Badge>
            <Badge variant="outline" className="text-emerald-600">📈 15,000+ Livestock Sold</Badge>
            <Badge variant="outline" className="text-emerald-600">⭐ 4.9/5 Rating</Badge>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <Tabs value={accountType} onValueChange={setAccountType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-16">
                <TabsTrigger 
                  value="individual" 
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">Individual Seller</span>
                  </div>
                  <span className="text-xs opacity-80">Personal farm or individual</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="organization" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span className="font-semibold">Organization</span>
                  </div>
                  <span className="text-xs opacity-80">Company, farm, or cooperative</span>
                </TabsTrigger>
              </TabsList>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6">
                {/* Individual Account Tab */}
                <TabsContent value="individual" className="space-y-6">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <User className="h-6 w-6 text-emerald-600" />
                      <div>
                        <h3 className="font-semibold text-emerald-900">Individual Seller Account</h3>
                        <p className="text-sm text-emerald-700">Perfect for personal farms and individual sellers</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs text-emerald-800">Quick Setup</p>
                      </div>
                      <div>
                        <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs text-emerald-800">Personal Branding</p>
                      </div>
                      <div>
                        <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs text-emerald-800">Direct Sales</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="John van der Merwe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+27 12 345 6789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_type">Account Type</Label>
                      <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer Only</SelectItem>
                          <SelectItem value="seller">Seller Only</SelectItem>
                          <SelectItem value="both">Both Buyer & Seller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                </TabsContent>

                {/* Organization Account Tab */}
                <TabsContent value="organization" className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Organization Account</h3>
                        <p className="text-sm text-blue-700">For teams, companies, and commercial operations</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-800">Team Collaboration</p>
                      </div>
                      <div>
                        <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-800">Shared Listings</p>
                      </div>
                      <div>
                        <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-800">Advanced Analytics</p>
                      </div>
                      <div>
                        <Crown className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-800">Professional Brand</p>
                      </div>
                    </div>
                  </div>

                  {/* User Details Section */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Your Details (Admin User)
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="org_full_name">Your Full Name *</Label>
                        <Input
                          id="org_full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="John van der Merwe"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_user_email">Your Email *</Label>
                        <Input
                          id="org_user_email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="john@mkhizefarms.co.za"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_user_phone">Your Phone</Label>
                        <Input
                          id="org_user_phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+27 12 345 6789"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_password">Password *</Label>
                        <Input
                          id="org_password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Create a strong password"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_user_type">Organization Account Type *</Label>
                        <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="What will your organization do?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">
                              <div>
                                <div className="font-medium">Buyer Only</div>
                                <div className="text-xs text-gray-500">Purchase livestock (abattoirs, feed companies)</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="seller">
                              <div>
                                <div className="font-medium">Seller Only</div>
                                <div className="text-xs text-gray-500">Sell livestock (farms, breeding companies)</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="both">
                              <div>
                                <div className="font-medium">Both Buyer & Seller</div>
                                <div className="text-xs text-gray-500">Buy and sell (cooperatives, traders, exporters)</div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          This determines what features your organization can access
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Organization Details Section */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Organization Details
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="org_name">Organization Name *</Label>
                        <Input
                          id="org_name"
                          value={formData.org_name}
                          onChange={(e) => handleInputChange('org_name', e.target.value)}
                          placeholder="Mkhize Family Farm"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_kind">Organization Type *</Label>
                        <Select value={formData.org_kind} onValueChange={(value) => handleInputChange('org_kind', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                          <SelectContent>
                            {(ORGANIZATION_TYPES || []).filter(type => type && type.value && type.value !== "").map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{type.icon}</span>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-gray-500">{type.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedOrgType && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{selectedOrgType.icon}</span>
                          <span className="font-medium">{selectedOrgType.label} Benefits:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedOrgType.benefits.map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                          <p className="text-xs text-blue-800">
                            <strong>💡 Typical Role:</strong> {selectedOrgType.role_suggestion}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="org_handle">Handle (URL)</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          stocklot.co.za/o/
                        </span>
                        <Input
                          id="org_handle"
                          value={formData.org_handle}
                          onChange={(e) => handleInputChange('org_handle', e.target.value)}
                          placeholder="mkhize-farms"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="org_phone">Organization Phone</Label>
                        <Input
                          id="org_phone"
                          value={formData.org_phone}
                          onChange={(e) => handleInputChange('org_phone', e.target.value)}
                          placeholder="+27 12 345 6789"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org_email">Organization Email</Label>
                        <Input
                          id="org_email"
                          type="email"
                          value={formData.org_email}
                          onChange={(e) => handleInputChange('org_email', e.target.value)}
                          placeholder="info@mkhizefarms.co.za"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="org_website">Website</Label>
                      <Input
                        id="org_website"
                        value={formData.org_website}
                        onChange={(e) => handleInputChange('org_website', e.target.value)}
                        placeholder="https://mkhizefarms.co.za"
                      />
                    </div>
                  </div>
                </TabsContent>

                <div className="flex items-center justify-between pt-6 border-t">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Button 
                      type="button" 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => navigate('/login')}
                    >
                      Sign in here
                    </Button>
                  </p>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className={`${
                      accountType === 'individual' 
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    } flex items-center space-x-2`}
                  >
                    {loading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <span>Create {accountType === 'individual' ? 'Individual' : 'Organization'} Account</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}