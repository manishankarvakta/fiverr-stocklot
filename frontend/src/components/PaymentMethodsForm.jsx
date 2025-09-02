import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui';
import { 
  CreditCard, Plus, Edit, Trash2, CheckCircle, AlertTriangle, Building, Shield
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentMethodsForm({ user }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_holder: user?.full_name || '',
    bank_name: '',
    account_number: '',
    account_type: 'savings',
    branch_code: '',
    is_primary: false
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/user/payment-methods`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.methods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API}/user/payment-methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await fetchPaymentMethods();
        setShowAddDialog(false);
        setFormData({
          account_holder: user?.full_name || '',
          bank_name: '',
          account_number: '',
          account_type: 'savings',
          branch_code: '',
          is_primary: false
        });
      } else {
        const error = await response.json();
        alert('Error adding payment method: ' + error.detail);
      }
    } catch (error) {
      console.error('Error submitting payment method:', error);
      alert('Error adding payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePaymentMethod = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
      const response = await fetch(`${API}/user/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        await fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Error deleting payment method');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const southAfricanBanks = [
    'ABSA Bank',
    'Standard Bank',
    'First National Bank (FNB)', 
    'Nedbank',
    'Capitec Bank',
    'Discovery Bank',
    'TymeBank',
    'Bank Zero',
    'African Bank',
    'Bidvest Bank',
    'Investec',
    'Sasfin Bank',
    'Access Bank',
    'Mercantile Bank',
    'Other'
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading payment methods...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Banking Details</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Add your bank account details to receive payments for livestock sales
              </p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bank Accounts Added</h3>
              <p className="text-gray-500 mb-4">
                Add your bank account details to receive payments for your livestock sales
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Bank Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-medium">{method.bank_name}</div>
                        <div className="text-sm text-gray-500">{method.account_holder}</div>
                        <div className="text-sm text-gray-500">
                          {method.account_type} • ****{method.account_number?.slice(-4)}
                        </div>
                        {method.is_primary && (
                          <Badge className="bg-blue-100 text-blue-800 mt-1">Primary</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={getStatusColor(method.status || 'pending')}>
                          {method.status || 'pending'}
                        </Badge>
                        {method.status === 'verified' && (
                          <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                            <CheckCircle className="h-4 w-4" />
                            Verified
                          </div>
                        )}
                        {method.status === 'rejected' && method.rejection_reason && (
                          <div className="text-red-600 text-xs mt-1 max-w-xs">
                            {method.rejection_reason}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {method.status === 'pending' && (
                    <Alert className="mt-3">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your bank account is being verified by our team. This usually takes 1-2 business days.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Add your South African bank account details to receive payments
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  value={formData.account_holder}
                  onChange={(e) => setFormData({...formData, account_holder: e.target.value})}
                  placeholder="Full name as on bank account"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must match exactly with your bank account
                </p>
              </div>
              
              <div>
                <Label>Bank Name</Label>
                <Select 
                  value={formData.bank_name} 
                  onValueChange={(value) => setFormData({...formData, bank_name: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {southAfricanBanks.filter(bank => bank && bank !== "").map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Account Number</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
              
              <div>
                <Label>Account Type</Label>
                <Select 
                  value={formData.account_type} 
                  onValueChange={(value) => setFormData({...formData, account_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current/Cheque</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Branch Code</Label>
                <Input
                  value={formData.branch_code}
                  onChange={(e) => setFormData({...formData, branch_code: e.target.value})}
                  placeholder="e.g., 250655"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find this on your bank card or internet banking
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
              />
              <Label htmlFor="is_primary">Make this my primary payment method</Label>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> Your banking details are encrypted and securely stored. 
                We will verify this account before processing any payments.
              </AlertDescription>
            </Alert>
          </form>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Bank Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}