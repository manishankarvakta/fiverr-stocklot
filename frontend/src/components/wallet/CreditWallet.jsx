import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Alert, AlertDescription, Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label
} from '../ui';
import { 
  DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Clock, 
  CheckCircle, XCircle, AlertTriangle, Wallet, CreditCard, RefreshCw
} from 'lucide-react';
import api from '../../utils/apiHelper'; // Use the proper API client

const CreditWallet = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  
  // Add bank account form state
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    branch_code: ''
  });
  const [addingBank, setAddingBank] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      // Fetch wallet balance using API client
      const balanceResponse = await api.get('/wallets/me');
      setWalletData(balanceResponse.data);

      // Fetch transaction history
      try {
        const ledgerResponse = await api.get('/wallets/me/ledger?limit=50');
        setLedgerEntries(ledgerResponse.data.entries || []);
      } catch (err) {
        console.error('Error fetching ledger:', err);
      }

      // Fetch bank accounts
      try {
        const bankResponse = await api.get('/wallets/me/bank-accounts');
        setBankAccounts(bankResponse.data.bank_accounts || []);
      } catch (err) {
        console.error('Error fetching bank accounts:', err);
      }

      // Fetch payout history
      try {
        const payoutResponse = await api.get('/wallets/me/payouts?limit=20');
        setPayoutHistory(payoutResponse.data.payouts || []);
      } catch (err) {
        console.error('Error fetching payouts:', err);
      }

    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      
      const amount = parseFloat(withdrawAmount);
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (amount > (walletData?.balance_cents || 0) / 100) {
        throw new Error('Insufficient wallet balance');
      }

      if (!selectedBankAccount) {
        throw new Error('Please select a bank account');
      }

      const response = await api.post('/wallets/me/payouts', {
        amount_cents: Math.round(amount * 100),
        bank_account_id: selectedBankAccount
      }, {
        headers: {
          'Idempotency-Key': `payout-${Date.now()}-${Math.random()}`
        }
      });

      if (response.data) {
        alert(`Payout requested successfully! Estimated arrival: ${response.data.estimated_arrival || 'Processing'}`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setSelectedBankAccount('');
        // Refresh wallet data
        fetchWalletData();
      }
      
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to request payout');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleAddBankAccount = async () => {
    try {
      setAddingBank(true);
      
      // Validate form
      if (!bankForm.bank_name || !bankForm.account_holder || !bankForm.account_number) {
        throw new Error('Please fill in all required fields');
      }

      const response = await api.post('/wallets/me/bank-accounts', bankForm);

      if (response.data) {
        alert('Bank account added successfully! Verification required before payouts.');
        setShowAddBankModal(false);
        setBankForm({
          bank_name: '',
          account_holder: '',
          account_number: '',
          branch_code: ''
        });
        // Refresh wallet data
        fetchWalletData();
      }
      
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to add bank account');
    } finally {
      setAddingBank(false);
    }
  };

  const formatAmount = (cents, entryType) => {
    const amount = Math.abs(cents) / 100;
    const sign = entryType === 'CREDIT' ? '+' : '-';
    return `${sign}R${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEntryIcon = (source) => {
    switch (source) {
      case 'REFUND': return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'PROMO': return <Plus className="h-4 w-4 text-blue-600" />;
      case 'PURCHASE': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'WITHDRAWAL': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntryBadgeColor = (entryType) => {
    return entryType === 'CREDIT' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
              <div className="h-10 bg-gray-200 rounded mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              Credit Wallet
            </h1>
            <p className="text-emerald-600 mt-1">Manage your StockLot credits and transaction history</p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchWalletData(true)}
            disabled={refreshing}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Balance Card */}
        <Card className="mb-6 shadow-lg border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Available Balance</h2>
                  <p className="text-emerald-100 text-sm">Ready to use at checkout</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-emerald-700 mb-2">
                  {walletData?.balance_formatted || 'R0.00'}
                </div>
                <p className="text-gray-600">
                  Credits expire after 36 months of inactivity
                </p>
              </div>
              <div className="flex gap-3">
                <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      disabled={(walletData?.balance_cents || 0) <= 0}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdraw to Bank Account</DialogTitle>
                      <DialogDescription>
                        Withdraw funds from your credit wallet to your bank account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount (ZAR)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          max={(walletData?.balance_cents || 0) / 100}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Available: {walletData?.balance_formatted || 'R0.00'}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowWithdrawModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {withdrawing ? 'Processing...' : 'Withdraw'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => navigate('/marketplace')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Shop Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="shadow-lg border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {ledgerEntries.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600">Your wallet activity will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEntryIcon(entry.source)}
                          <Badge 
                            variant="outline"
                            className={getEntryBadgeColor(entry.entry_type)}
                          >
                            {entry.entry_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {entry.description || `${entry.source} transaction`}
                          </p>
                          {entry.source_ref && (
                            <p className="text-sm text-gray-500">
                              Ref: {entry.source_ref}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {entry.source.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600">
                          {formatDate(entry.created_at)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span 
                          className={`font-semibold ${
                            entry.entry_type === 'CREDIT' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}
                        >
                          {formatAmount(entry.amount_cents, entry.entry_type)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="mt-6 bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">How Credit Wallet Works</h3>
                <ul className="text-emerald-800 space-y-1 text-sm">
                  <li>• Credits from refunds are instantly available</li>
                  <li>• Use credits at checkout for any livestock purchase</li>
                  <li>• Credits expire after 36 months of account inactivity</li>
                  <li>• Withdraw to your bank account anytime (processing fee may apply)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditWallet;