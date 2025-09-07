import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '@/components/ui';
import { 
  CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle, AlertTriangle,
  Shield, DollarSign, Globe, Settings, Eye
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || '/api';

export default function AdminPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showEditMethod, setShowEditMethod] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newMethod, setNewMethod] = useState({
    name: '',
    type: 'credit_card',
    provider: '',
    description: '',
    status: 'active',
    supported_currencies: ['ZAR'],
    processing_fee: 0,
    fixed_fee: 0,
    min_amount: 0,
    max_amount: 0,
    settings: {}
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API}/admin/payment-methods`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleAddPaymentMethod = async () => {
    setLoading(true);
    try {
      const methodData = {
        ...newMethod,
        processing_fee: parseFloat(newMethod.processing_fee) || 0,
        fixed_fee: parseFloat(newMethod.fixed_fee) || 0,
        min_amount: parseFloat(newMethod.min_amount) || 0,
        max_amount: parseFloat(newMethod.max_amount) || 0
      };

      const response = await fetch(`${API}/admin/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(methodData)
      });

      if (response.ok) {
        setShowAddMethod(false);
        setNewMethod({
          name: '', type: 'credit_card', provider: '', description: '',
          status: 'active', supported_currencies: ['ZAR'], processing_fee: 0,
          fixed_fee: 0, min_amount: 0, max_amount: 0, settings: {}
        });
        fetchPaymentMethods();
        alert('Payment method added successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert('Failed to add payment method: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaymentMethod = async () => {
    setLoading(true);
    try {
      const methodData = {
        ...selectedMethod,
        processing_fee: parseFloat(selectedMethod.processing_fee) || 0,
        fixed_fee: parseFloat(selectedMethod.fixed_fee) || 0,
        min_amount: parseFloat(selectedMethod.min_amount) || 0,
        max_amount: parseFloat(selectedMethod.max_amount) || 0
      };

      const response = await fetch(`${API}/admin/payment-methods/${selectedMethod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(methodData)
      });

      if (response.ok) {
        setShowEditMethod(false);
        setSelectedMethod(null);
        fetchPaymentMethods();
        alert('Payment method updated successfully!');
      } else {
        throw new Error('Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        const response = await fetch(`${API}/admin/payment-methods/${methodId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchPaymentMethods();
          alert('Payment method deleted successfully!');
        } else {
          throw new Error('Failed to delete payment method');
        }
      } catch (error) {
        console.error('Error deleting payment method:', error);
        alert('Failed to delete payment method');
      }
    }
  };

  const handleToggleStatus = async (methodId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${API}/admin/payment-methods/${methodId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchPaymentMethods();
        alert(`Payment method ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error('Failed to toggle payment method status');
      }
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      alert('Failed to toggle payment method status');
    }
  };

  const openEditDialog = (method) => {
    setSelectedMethod({ ...method });
    setShowEditMethod(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Globe className="h-4 w-4" />;
      case 'digital_wallet': return <Shield className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const paymentMethodTypes = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'cryptocurrency', label: 'Cryptocurrency' },
    { value: 'mobile_money', label: 'Mobile Money' }
  ];

  const activeCount = paymentMethods.filter(m => m.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <Badge className="bg-green-100 text-green-800 mt-2">
            {activeCount} Active Methods
          </Badge>
        </div>
        <Button onClick={() => setShowAddMethod(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">
                  {paymentMethods.filter(m => m.status === 'inactive').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credit Cards</p>
                <p className="text-2xl font-bold text-blue-600">
                  {paymentMethods.filter(m => m.type === 'credit_card').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Methods</p>
                <p className="text-2xl font-bold">{paymentMethods.length}</p>
              </div>
              <Settings className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods ({paymentMethods.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Currencies</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(method.type)}
                      </div>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-500">{method.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {paymentMethodTypes.find(t => t.value === method.type)?.label || method.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{method.provider}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {method.processing_fee > 0 && (
                        <div>{method.processing_fee}% + </div>
                      )}
                      <div>R{method.fixed_fee || 0}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(method.status)}>
                      {method.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {method.supported_currencies?.map((currency, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {currency}
                        </Badge>
                      )) || <Badge variant="outline">ZAR</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(method)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(method.id, method.status)}
                      >
                        {method.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePaymentMethod(method.id)}
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

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Configure a new payment method for the platform
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Method Name *</Label>
              <Input
                value={newMethod.name}
                onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                placeholder="e.g., Visa Credit Card"
              />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={newMethod.type} onValueChange={(value) => setNewMethod({...newMethod, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider *</Label>
              <Input
                value={newMethod.provider}
                onChange={(e) => setNewMethod({...newMethod, provider: e.target.value})}
                placeholder="e.g., Stripe, PayPal, Paystack"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newMethod.status} onValueChange={(value) => setNewMethod({...newMethod, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Processing Fee (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={newMethod.processing_fee}
                onChange={(e) => setNewMethod({...newMethod, processing_fee: e.target.value})}
                placeholder="2.9"
              />
            </div>
            <div>
              <Label>Fixed Fee (R)</Label>
              <Input
                type="number"
                step="0.01"
                value={newMethod.fixed_fee}
                onChange={(e) => setNewMethod({...newMethod, fixed_fee: e.target.value})}
                placeholder="0.30"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newMethod.description}
                onChange={(e) => setNewMethod({...newMethod, description: e.target.value})}
                placeholder="Brief description of this payment method"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMethod(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPaymentMethod} 
              disabled={loading || !newMethod.name || !newMethod.provider}
            >
              {loading ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Method Dialog */}
      <Dialog open={showEditMethod} onOpenChange={setShowEditMethod}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
            <DialogDescription>
              Update payment method configuration
            </DialogDescription>
          </DialogHeader>

          {selectedMethod && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method Name *</Label>
                <Input
                  value={selectedMethod.name}
                  onChange={(e) => setSelectedMethod({...selectedMethod, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={selectedMethod.type} onValueChange={(value) => setSelectedMethod({...selectedMethod, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider *</Label>
                <Input
                  value={selectedMethod.provider}
                  onChange={(e) => setSelectedMethod({...selectedMethod, provider: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={selectedMethod.status} onValueChange={(value) => setSelectedMethod({...selectedMethod, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Processing Fee (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedMethod.processing_fee}
                  onChange={(e) => setSelectedMethod({...selectedMethod, processing_fee: e.target.value})}
                />
              </div>
              <div>
                <Label>Fixed Fee (R)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedMethod.fixed_fee}
                  onChange={(e) => setSelectedMethod({...selectedMethod, fixed_fee: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedMethod.description}
                  onChange={(e) => setSelectedMethod({...selectedMethod, description: e.target.value})}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMethod(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPaymentMethod} disabled={loading}>
              {loading ? 'Updating...' : 'Update Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}