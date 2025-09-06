import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription, Checkbox
} from '@/components/ui';
import { 
  DollarSign, CreditCard, CheckCircle, XCircle, Clock, Send, Download,
  Filter, Search, AlertTriangle, Users, Calendar
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'https://farm-admin.preview.emergentagent.com/api';

export default function AdminPayoutsManagement() {
  const [payouts, setPayouts] = useState([]);
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [batchAmount, setBatchAmount] = useState(0);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`${API}/admin/payouts`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const handleProcessBatch = async () => {
    if (selectedPayouts.length === 0) {
      alert('Please select payouts to process');
      return;
    }

    setProcessingBatch(true);
    try {
      const response = await fetch(`${API}/admin/payouts/process-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          payout_ids: selectedPayouts,
          notes: 'Batch processed by admin'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowProcessDialog(false);
        setSelectedPayouts([]);
        fetchPayouts();
        alert(`Successfully processed ${result.processed_count} payouts totaling R${result.total_amount}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process batch');
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      alert('Failed to process batch: ' + error.message);
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleIndividualPayout = async (payoutId, action) => {
    try {
      const response = await fetch(`${API}/admin/payouts/${payoutId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          notes: `Payout ${action} by admin`
        })
      });

      if (response.ok) {
        fetchPayouts();
        alert(`Payout ${action}ed successfully!`);
      } else {
        throw new Error(`Failed to ${action} payout`);
      }
    } catch (error) {
      console.error(`Error ${action}ing payout:`, error);
      alert(`Failed to ${action} payout`);
    }
  };

  const handleExportPayouts = async () => {
    try {
      const response = await fetch(`${API}/admin/payouts/export`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to export payouts');
      }
    } catch (error) {
      console.error('Error exporting payouts:', error);
      alert('Failed to export payouts');
    }
  };

  const togglePayoutSelection = (payoutId, amount) => {
    setSelectedPayouts(current => {
      const newSelection = current.includes(payoutId)
        ? current.filter(id => id !== payoutId)
        : [...current, payoutId];
      
      // Calculate total batch amount
      const selectedPayoutData = payouts.filter(p => newSelection.includes(p.id));
      const total = selectedPayoutData.reduce((sum, p) => sum + (p.amount || 0), 0);
      setBatchAmount(total);
      
      return newSelection;
    });
  };

  const selectAllPending = () => {
    const pendingPayouts = filteredPayouts.filter(p => p.status === 'pending');
    const pendingIds = pendingPayouts.map(p => p.id);
    setSelectedPayouts(pendingIds);
    
    const total = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    setBatchAmount(total);
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.seller_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payout.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Send className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const pendingCount = payouts.filter(p => p.status === 'pending').length;
  const totalPendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Seller Payouts</h1>
          {pendingCount > 0 && (
            <div className="flex gap-2 mt-2">
              <Badge className="bg-yellow-100 text-yellow-800">
                {pendingCount} Pending
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                R{totalPendingAmount.toFixed(2)} Total
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPayouts} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {selectedPayouts.length > 0 && (
            <Button 
              onClick={() => setShowProcessDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Process Batch ({selectedPayouts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {payouts.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {payouts.filter(p => p.status === 'failed').length}
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
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">R{payouts.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by seller name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            {pendingCount > 0 && (
              <Button onClick={selectAllPending} variant="outline">
                Select All Pending
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts ({filteredPayouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Select</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPayouts.includes(payout.id)}
                      onCheckedChange={() => togglePayoutSelection(payout.id, payout.amount)}
                      disabled={payout.status !== 'pending'}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payout.seller_name}</div>
                      <div className="text-sm text-gray-500">{payout.seller_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">R{payout.amount?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-gray-500">{payout.currency || 'ZAR'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payout.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(payout.status)}
                        {payout.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payout.due_date ? new Date(payout.due_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {payout.payment_method || 'Bank Transfer'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {payout.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleIndividualPayout(payout.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIndividualPayout(payout.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {payout.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIndividualPayout(payout.id, 'retry')}
                        >
                          <Send className="h-4 w-4" />
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

      {/* Process Batch Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Batch Payouts</DialogTitle>
            <DialogDescription>
              You are about to process {selectedPayouts.length} payouts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Total Amount: R{batchAmount.toFixed(2)}</strong>
                <br />
                This action will initiate payment processing for all selected payouts.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Selected Payouts:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {payouts
                  .filter(p => selectedPayouts.includes(p.id))
                  .map(payout => (
                    <div key={payout.id} className="flex justify-between text-sm">
                      <span>{payout.seller_name}</span>
                      <span>R{payout.amount?.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessBatch}
              disabled={processingBatch}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingBatch ? 'Processing...' : `Process ${selectedPayouts.length} Payouts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}