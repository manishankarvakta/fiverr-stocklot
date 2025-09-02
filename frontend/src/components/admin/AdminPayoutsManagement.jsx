import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Label, Alert, AlertDescription, Textarea, Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  DollarSign, Download, RefreshCw, AlertTriangle, CheckCircle, Clock,
  CreditCard, Building, User, Calendar, Filter, Search, Send, Eye, Ban
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPayoutsManagement() {
  const [payouts, setPayouts] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30d'
  });

  useEffect(() => {
    fetchPayouts();
    fetchPayoutRequests();
  }, [filters]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/payouts?status=${filters.status}&range=${filters.dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
        setPendingPayouts(data.pending || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const response = await fetch(`${API}/admin/payout-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayoutRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching payout requests:', error);
    }
  };

  const processPayout = async (payoutId, action) => {
    setProcessingPayout(true);
    try {
      const response = await fetch(`${API}/admin/payouts/${payoutId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchPayouts();
        setShowPayoutDialog(false);
      }
    } catch (error) {
      console.error('Error processing payout:', error);
    } finally {
      setProcessingPayout(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800'; 
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data for demo
  const mockPayouts = [
    {
      id: 'payout_1',
      seller_id: 'seller_1',
      seller_name: 'John van der Merwe',
      amount: 15750.00,
      status: 'pending',
      created_at: '2025-08-28T10:30:00Z',
      bank_account: '**** 1234',
      payment_method: 'EFT',
      order_ids: ['order_1', 'order_2'],
      notes: 'Weekly payout for cattle sales'
    },
    {
      id: 'payout_2', 
      seller_id: 'seller_2',
      seller_name: 'Sipho Farming Co-op',
      amount: 8450.00,
      status: 'completed',
      created_at: '2025-08-25T14:20:00Z',
      completed_at: '2025-08-26T09:15:00Z',
      bank_account: '**** 5678',
      payment_method: 'EFT',
      order_ids: ['order_3'],
      transaction_id: 'TXN_ABC123'
    },
    {
      id: 'payout_3',
      seller_id: 'seller_3', 
      seller_name: 'Premium Poultry Ltd',
      amount: 23100.00,
      status: 'failed',
      created_at: '2025-08-27T16:45:00Z',
      bank_account: '**** 9012',
      payment_method: 'EFT',
      order_ids: ['order_4', 'order_5'],
      failure_reason: 'Invalid bank account details'
    }
  ];

  const mockPayoutRequests = [
    {
      id: 'req_1',
      seller_id: 'seller_4',
      seller_name: 'Maria Livestock',
      requested_amount: 12500.00,
      available_balance: 12500.00,
      status: 'pending_review',
      created_at: '2025-08-29T08:30:00Z',
      bank_account: '**** 3456',
      verification_status: 'verified'
    },
    {
      id: 'req_2',
      seller_id: 'seller_5', 
      seller_name: 'Eastern Cape Farms',
      requested_amount: 7800.00,
      available_balance: 7800.00,
      status: 'pending_review',
      created_at: '2025-08-29T11:15:00Z',
      bank_account: '**** 7890',
      verification_status: 'pending'
    }
  ];

  const displayPayouts = payouts.length > 0 ? payouts : mockPayouts;
  const displayRequests = payoutRequests.length > 0 ? payoutRequests : mockPayoutRequests;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Payouts Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payouts Management</h2>
          <p className="text-gray-600">Manage seller payouts and payment processing</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPayouts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4 mr-2" />
            Process Batch
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payouts</p>
                <p className="text-2xl font-bold text-orange-600">
                  R{displayPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">
                  R{displayPayouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
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
                <p className="text-sm text-gray-500">Failed Payouts</p>
                <p className="text-2xl font-bold text-red-600">
                  {displayPayouts.filter(p => p.status === 'failed').length}
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
                <p className="text-sm text-gray-500">Total This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  R{displayPayouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="requests">Payout Requests</TabsTrigger>
          <TabsTrigger value="failed">Failed Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payout History</CardTitle>
                <div className="flex gap-2">
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.seller_name}</div>
                          <div className="text-sm text-gray-500">{payout.bank_account}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">R{payout.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{payout.payment_method}</TableCell>
                      <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedPayout(payout); setShowPayoutDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payout.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => processPayout(payout.id, 'approve')}
                              >
                                Process
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => processPayout(payout.id, 'cancel')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {payout.status === 'failed' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => processPayout(payout.id, 'retry')}
                            >
                              Retry
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

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Requested Amount</TableHead>
                    <TableHead>Available Balance</TableHead>
                    <TableHead>Bank Verification</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.seller_name}</div>
                          <div className="text-sm text-gray-500">{request.bank_account}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">R{request.requested_amount.toLocaleString()}</TableCell>
                      <TableCell>R{request.available_balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={request.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {request.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
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

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Failure Reason</TableHead>
                    <TableHead>Failed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPayouts.filter(p => p.status === 'failed').map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.seller_name}</div>
                          <div className="text-sm text-gray-500">{payout.bank_account}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">R{payout.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-red-600">{payout.failure_reason}</span>
                      </TableCell>
                      <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            Retry
                          </Button>
                          <Button size="sm" variant="outline">
                            Contact Seller
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

      {/* Payout Details Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>
              Review payout information and transaction details
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Seller</Label>
                  <p className="text-sm">{selectedPayout.seller_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm font-semibold">R{selectedPayout.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedPayout.status)}>
                    {selectedPayout.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="text-sm">{selectedPayout.payment_method}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bank Account</Label>
                  <p className="text-sm">{selectedPayout.bank_account}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedPayout.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedPayout.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedPayout.notes}</p>
                </div>
              )}
              
              {selectedPayout.failure_reason && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Failure Reason:</strong> {selectedPayout.failure_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Close
            </Button>
            {selectedPayout?.status === 'pending' && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => processPayout(selectedPayout.id, 'approve')}
                disabled={processingPayout}
              >
                {processingPayout ? 'Processing...' : 'Process Payout'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}