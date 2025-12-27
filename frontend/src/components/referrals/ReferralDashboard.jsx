import React, { useState, useEffect } from 'react';
import { Copy, Share2, DollarSign, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import Header from '../ui/common/Header';
import Footer from '../ui/common/Footer';

const ReferralDashboard = () => {
  // Simple way to check if user is logged in and show toasts
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  
  const showToast = (message, type = 'success') => {
    // Simple toast implementation - you can enhance this
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };
  // Use a single state object to prevent multiple re-renders
  const [state, setState] = useState({
    stats: {
      code: '',
      total_clicks: 0,
      total_signups: 0,
      qualified_referrals: 0,
      total_earned: 0,
      pending_rewards: 0
    },
    wallet: {
      balance: 0,
      currency: 'ZAR',
      transactions: []
    },
    referralLink: '',
    loading: true,
    error: null,
    initialized: false
  });

  // Prevent unnecessary re-renders by memoizing derived values
  const formattedBalance = React.useMemo(() => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: state.wallet.currency || 'ZAR'
    }).format(state.wallet.balance || 0);
  }, [state.wallet.balance, state.wallet.currency]);

  const formattedEarnings = React.useMemo(() => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(state.stats.total_earned || 0);
  }, [state.stats.total_earned]);

  // Batch state updates to prevent multiple re-renders
  const updateState = React.useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    let mounted = true;
    
    if (user && !state.initialized) {
      const loadData = async () => {
        if (!mounted) return;
        updateState({ loading: true, error: null });
        
        try {
          await fetchReferralData();
          if (mounted) {
            updateState({ initialized: true });
          }
        } catch (err) {
          if (mounted) {
            updateState({ error: err.message });
          }
        } finally {
          if (mounted) {
            updateState({ loading: false });
          }
        }
      };
      
      loadData();
    } else if (!user) {
      updateState({ loading: false });
    }
    
    return () => {
      mounted = false;
    };
  }, [user?.id, state.initialized, updateState]); // Only re-run if user ID changes or not initialized

  const fetchReferralData = React.useCallback(async () => {
    try {
      // Use the backend URL from environment
      const baseURL = process.env.REACT_APP_BACKEND_URL || '';
      const token = localStorage.getItem('token');
      
      // Fetch referral code and stats
      const [codeResponse, statsResponse, walletResponse] = await Promise.all([
        fetch(`${baseURL}/api/referrals/my-code`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${baseURL}/api/referrals/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${baseURL}/api/referrals/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Batch all updates together to prevent multiple re-renders
      const updates = {};

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        updates.referralLink = codeData.link || '';
        updates.stats = { ...state.stats, code: codeData.code || '' };
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        updates.stats = { ...updates.stats || state.stats, ...statsData };
      }

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        updates.wallet = walletData;
      }

      // Single state update to prevent layout shifts
      updateState(updates);

    } catch (error) {
      console.error('Error fetching referral data:', error);
      showToast('Failed to load referral data', 'error');
    }
  }, [state.stats, updateState]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Referral link copied to clipboard');
    } catch (error) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Join StockLot - South Africa's premier livestock marketplace! Use my referral link: ${state.referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const StatCard = ({ title, value, icon: Icon, description, color = "blue" }) => {
    // Memoize the card to prevent unnecessary re-renders
    return React.useMemo(() => (
      <Card className="transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 text-${color}-600`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    ), [title, value, Icon, description, color]);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your referral dashboard.</p>
        </div>
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (

    <>
    <Header />
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Dashboard</h1>
          <p className="text-gray-600">Share StockLot with your network and earn rewards!</p>
        </div>

        {/* Referral Link Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  value={state.referralLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(state.referralLink)} size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => copyToClipboard(state.referralLink)} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={shareViaWhatsApp} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share via WhatsApp
                </Button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">How it works:</h4>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Share your referral link with farmers and livestock traders</li>
                  <li>2. They sign up and make their first purchase</li>
                  <li>3. You earn 2% of their first order value (R50-R2000 cap)</li>
                  <li>4. Get paid via wallet credits or request a payout</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Clicks"
            value={state.stats.total_clicks}
            icon={TrendingUp}
            description="People who clicked your link"
            color="blue"
          />
          <StatCard
            title="Sign-ups"
            value={state.stats.total_signups}
            icon={Users}
            description="People who registered"
            color="green"
          />
          <StatCard
            title="Qualified Referrals"
            value={state.stats.qualified_referrals}
            icon={Users}
            description="Completed first purchase"
            color="purple"
          />
          <StatCard
            title="Total Earned"
            value={`R${state.stats.total_earned.toFixed(2)}`}
            icon={DollarSign}
            description="All-time earnings"
            color="emerald"
          />
        </div>

        {/* Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  R{state.wallet.balance.toFixed(2)}
                </div>
                <p className="text-muted-foreground mb-4">Available Credits</p>
                
                {state.wallet.balance > 50 && (
                  <Button className="w-full">
                    Request Payout
                  </Button>
                )}
              </div>
              
              {state.stats.pending_rewards > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Rewards</span>
                    <Badge variant="secondary">R{state.stats.pending_rewards.toFixed(2)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processing - will be added to your balance shortly
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {state.wallet.transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No transactions yet
                  </p>
                ) : (
                  state.wallet.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}R{Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tips for Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Target the Right Audience</h4>
                <p className="text-sm text-muted-foreground">
                  Share with farmers, livestock traders, and agricultural communities
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Use Multiple Channels</h4>
                <p className="text-sm text-muted-foreground">
                  Share on WhatsApp, farming groups, and social media
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Track Your Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor clicks and conversions to optimize your strategy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default ReferralDashboard;