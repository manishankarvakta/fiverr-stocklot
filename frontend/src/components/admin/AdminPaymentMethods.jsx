import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea } from '../ui';
import { CreditCard, Plus, Edit, Trash2, Eye, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const AdminPaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [newMethod, setNewMethod] = useState({
    name: '',
    type: 'card',
    provider: '',
    config: {},
    is_active: true,
    min_amount: 0,
    max_amount: 0,
    fee_percentage: 0,
    fee_fixed: 0,
    supported_currencies: ['ZAR'],
    description: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(Array.isArray(data) ? data : data.payment_methods || []);
      } else {
        console.error('Failed to load payment methods:', response.status);
        alert('Failed to load payment methods. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      alert('Error loading payment methods: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMethod = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/payment-methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMethod)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.id) {
          alert('Payment method created successfully!');
          setShowCreateDialog(false);
          setNewMethod({
            name: '',
            type: 'card',
            provider: '',
            config: {},
            is_active: true,
            min_amount: 0,
            max_amount: 0,
            fee_percentage: 0,
            fee_fixed: 0,
            supported_currencies: ['ZAR'],
            description: ''
          });
          loadPaymentMethods();
        } else {
          alert('Failed to create payment method: ' + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert('Failed to create payment method: ' + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      alert('Error creating payment method: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMethodAction = async (methodId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/payment-methods/${methodId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Payment method ${action} successful!`);
          loadPaymentMethods();
        } else {
          alert(`Failed to ${action} payment method: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} payment method: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} payment method:`, error);
      alert(`Error ${action} payment method: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 
      <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge> :
      <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      'card': 'bg-blue-100 text-blue-800',
      'bank_transfer': 'bg-green-100 text-green-800',
      'ewallet': 'bg-purple-100 text-purple-800',
      'crypto': 'bg-orange-100 text-orange-800',
      'mobile_money': 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>{type?.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-gray-600">Configure and manage payment processing methods</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPaymentMethods} disabled={loading} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Payment Methods List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods ({paymentMethods.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading payment methods...</p>
              </div>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payment methods configured</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map(method => (
                <div key={method.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description || 'No description'}</p>
                        </div>
                        {getStatusBadge(method.is_active)}
                        {getTypeBadge(method.type)}
                        <Badge variant="outline">{method.provider}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p>Fee: {method.fee_percentage}% + R{(method.fee_fixed / 100).toFixed(2)}</p>
                        <p>Min: R{(method.min_amount / 100).toFixed(2)}</p>
                        <p>Max: R{method.max_amount ? (method.max_amount / 100).toLocaleString() : 'Unlimited'}</p>
                        <p>Currencies: {method.supported_currencies?.join(', ') || 'ZAR'}</p>
                      </div>
                      {method.config && Object.keys(method.config).length > 0 && (
                        <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                          <strong>Config:</strong> {Object.keys(method.config).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={method.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        onClick={() => handleMethodAction(method.id, method.is_active ? 'deactivate' : 'activate')}
                        disabled={actionLoading}
                      >
                        {method.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this payment method?')) {
                            handleMethodAction(method.id, 'delete');
                          }
                        }}
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payment Method Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Payment Method</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Method Name</label>
                <Input
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                  placeholder="e.g., Paystack Cards"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Provider</label>
                <Input
                  value={newMethod.provider}
                  onChange={(e) => setNewMethod({...newMethod, provider: e.target.value})}
                  placeholder="e.g., Paystack, PayPal"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newMethod.description}
                  onChange={(e) => setNewMethod({...newMethod, description: e.target.value})}
                  placeholder="Brief description of this payment method"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fee %</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newMethod.fee_percentage}
                    onChange={(e) => setNewMethod({...newMethod, fee_percentage: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fixed Fee (cents)</label>
                  <Input
                    type="number"
                    value={newMethod.fee_fixed}
                    onChange={(e) => setNewMethod({...newMethod, fee_fixed: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateMethod}
                disabled={actionLoading || !newMethod.name || !newMethod.provider}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Creating...' : 'Create Method'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentMethods;