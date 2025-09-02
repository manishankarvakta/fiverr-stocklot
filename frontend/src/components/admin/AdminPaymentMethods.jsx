import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  CreditCard, Building, AlertTriangle, CheckCircle, Clock, Shield,
  Eye, Edit, Trash2, Plus, RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [verifyingMethod, setVerifyingMethod] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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

  const verifyPaymentMethod = async (methodId, action) => {
    setVerifyingMethod(true);
    try {
      const response = await fetch(`${API}/admin/payment-methods/${methodId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchPaymentMethods();
        setShowMethodDialog(false);
      }
    } catch (error) {
      console.error('Error verifying payment method:', error);
    } finally {
      setVerifyingMethod(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800'; 
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data for demo
  const mockPaymentMethods = [
    {
      id: 'pm_1',
      seller_id: 'seller_1',
      seller_name: 'John van der Merwe',
      type: 'bank_account',
      bank_name: 'FNB',
      account_number: '****1234',
      account_holder: 'John van der Merwe',
      branch_code: '250655',
      account_type: 'Savings',
      status: 'verified',
      verified_at: '2025-08-15T10:30:00Z',
      created_at: '2025-08-10T14:20:00Z',
      is_primary: true,
      verification_documents: ['bank_statement.pdf', 'id_document.pdf']
    },
    {
      id: 'pm_2',
      seller_id: 'seller_2', 
      seller_name: 'Sipho Farming Co-op',
      type: 'bank_account',
      bank_name: 'Standard Bank',
      account_number: '****5678',
      account_holder: 'Sipho Farming Cooperative',
      branch_code: '051001',
      account_type: 'Business',
      status: 'pending',
      created_at: '2025-08-28T11:15:00Z',
      is_primary: true,
      verification_documents: ['bank_statement.pdf', 'company_registration.pdf'],
      pending_reason: 'Awaiting document verification'
    },
    {
      id: 'pm_3',
      seller_id: 'seller_3',
      seller_name: 'Premium Poultry Ltd',
      type: 'bank_account', 
      bank_name: 'ABSA',
      account_number: '****9012',
      account_holder: 'Premium Poultry Ltd',
      branch_code: '632005',
      account_type: 'Business',
      status: 'rejected',
      created_at: '2025-08-25T16:45:00Z',
      rejected_at: '2025-08-27T09:30:00Z',
      rejection_reason: 'Account holder name mismatch with registration documents',
      is_primary: false
    },
    {
      id: 'pm_4',
      seller_id: 'seller_4',
      seller_name: 'Maria Livestock',
      type: 'bank_account',
      bank_name: 'Nedbank',
      account_number: '****3456',
      account_holder: 'Maria dos Santos',
      branch_code: '198765',
      account_type: 'Savings',
      status: 'suspended',
      verified_at: '2025-08-20T12:00:00Z',
      suspended_at: '2025-08-29T08:15:00Z',
      created_at: '2025-08-18T09:30:00Z',
      suspension_reason: 'Suspicious activity detected',
      is_primary: true
    }
  ];

  const displayMethods = paymentMethods.length > 0 ? paymentMethods : mockPaymentMethods;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Payment Methods Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods Management</h2>
          <p className="text-gray-600">Manage seller bank accounts and payment method verification</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPaymentMethods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified Methods</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayMethods.filter(m => m.status === 'verified').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {displayMethods.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected Methods</p>
                <p className="text-2xl font-bold text-red-600">
                  {displayMethods.filter(m => m.status === 'rejected').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suspended Methods</p>
                <p className="text-2xl font-bold text-gray-600">
                  {displayMethods.filter(m => m.status === 'suspended').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Methods</TabsTrigger>
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.seller_name}</div>
                          <div className="text-sm text-gray-500">{method.account_holder}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.bank_name}</div>
                          <div className="text-sm text-gray-500">{method.account_number}</div>
                          <div className="text-sm text-gray-500">Branch: {method.branch_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{method.account_type}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(method.status)}>
                          {method.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {method.is_primary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(method.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedMethod(method); setShowMethodDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {method.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => verifyPaymentMethod(method.id, 'verify')}
                              >
                                Verify
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => verifyPaymentMethod(method.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {method.status === 'verified' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => verifyPaymentMethod(method.id, 'suspend')}
                            >
                              Suspend
                            </Button>
                          )}
                          {method.status === 'suspended' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => verifyPaymentMethod(method.id, 'reactivate')}
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMethods.filter(m => m.status === 'pending').map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.seller_name}</div>
                          <div className="text-sm text-gray-500">{method.account_holder}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.bank_name}</div>
                          <div className="text-sm text-gray-500">{method.account_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {method.verification_documents?.map((doc, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(method.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedMethod(method); setShowMethodDialog(true);}}
                          >
                            Review
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => verifyPaymentMethod(method.id, 'verify')}
                          >
                            Verify
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verifyPaymentMethod(method.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle>Verified Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Verified Date</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMethods.filter(m => m.status === 'verified').map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.seller_name}</div>
                          <div className="text-sm text-gray-500">{method.account_holder}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.bank_name}</div>
                          <div className="text-sm text-gray-500">{method.account_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(method.verified_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {method.is_primary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedMethod(method); setShowMethodDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verifyPaymentMethod(method.id, 'suspend')}
                          >
                            Suspend
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Rejection Reason</TableHead>
                    <TableHead>Rejected Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMethods.filter(m => m.status === 'rejected').map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.seller_name}</div>
                          <div className="text-sm text-gray-500">{method.account_holder}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.bank_name}</div>
                          <div className="text-sm text-gray-500">{method.account_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 text-sm">{method.rejection_reason}</span>
                      </TableCell>
                      <TableCell>{new Date(method.rejected_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Contact Seller
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Request Resubmission
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Method Details Dialog */}
      <Dialog open={showMethodDialog} onOpenChange={setShowMethodDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Method Details</DialogTitle>
            <DialogDescription>
              Review payment method information and verification status
            </DialogDescription>
          </DialogHeader>
          
          {selectedMethod && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Seller</Label>
                  <p className="text-sm">{selectedMethod.seller_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Holder</Label>
                  <p className="text-sm">{selectedMethod.account_holder}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bank</Label>
                  <p className="text-sm">{selectedMethod.bank_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Number</Label>
                  <p className="text-sm">{selectedMethod.account_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Branch Code</Label>
                  <p className="text-sm">{selectedMethod.branch_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <p className="text-sm">{selectedMethod.account_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedMethod.status)}>
                    {selectedMethod.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Primary Method</Label>
                  <p className="text-sm">{selectedMethod.is_primary ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {selectedMethod.verification_documents && (
                <div>
                  <Label className="text-sm font-medium">Verification Documents</Label>
                  <div className="space-y-1 mt-1">
                    {selectedMethod.verification_documents.map((doc, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedMethod.rejection_reason && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rejection Reason:</strong> {selectedMethod.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedMethod.suspension_reason && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Suspension Reason:</strong> {selectedMethod.suspension_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMethodDialog(false)}>
              Close
            </Button>
            {selectedMethod?.status === 'pending' && (
              <>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => verifyPaymentMethod(selectedMethod.id, 'verify')}
                  disabled={verifyingMethod}
                >
                  {verifyingMethod ? 'Processing...' : 'Verify Method'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => verifyPaymentMethod(selectedMethod.id, 'reject')}
                  disabled={verifyingMethod}
                >
                  Reject Method
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}