'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building2, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ORGANIZATION_TYPES = [
  { value: 'FARM', label: 'Farm', description: 'Individual or family farm operation' },
  { value: 'COMPANY', label: 'Company', description: 'Commercial livestock business' },
  { value: 'COOP', label: 'Cooperative', description: 'Farmer cooperative or collective' },
  { value: 'ABATTOIR', label: 'Abattoir', description: 'Meat processing facility' },
  { value: 'TRANSPORTER', label: 'Transporter', description: 'Livestock transport service' },
  { value: 'EXPORTER', label: 'Exporter', description: 'International livestock trade' }
];

export default function CreateOrganizationForm({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    kind: '',
    handle: '',
    phone: '',
    email: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(data);
          if (onClose) onClose();
          // Redirect to organization dashboard
          navigate(`/orgs/${data.handle || data.id}/dashboard`);
        }, 2000);
      } else {
        setError(data.detail || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      setError('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate handle from name
    if (field === 'name' && !formData.handle) {
      const handle = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        handle: handle
      }));
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Created!</h2>
          <p className="text-gray-600">Your organization has been successfully created.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">Create Organization</CardTitle>
              <p className="text-sm text-gray-600">Set up your farm, company, or cooperative</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Mkhize Family Farm"
                required
                className="focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kind">Type *</Label>
              <Select value={formData.kind} onValueChange={(value) => handleInputChange('kind', value)}>
                <SelectTrigger className="focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Handle (URL)</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                stocklot.farm/o/
              </span>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="mkhize-farms"
                className="rounded-l-none focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">This will be your public storefront URL</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+27 12 345 6789"
                className="focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@mkhizefarms.co.za"
                className="focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://mkhizefarms.co.za"
              className="focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.kind}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}