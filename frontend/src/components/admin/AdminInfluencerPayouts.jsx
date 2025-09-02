import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  Award, DollarSign, TrendingUp, Users, Calendar, Eye, Edit, Send,
  Star, Gift, RefreshCw, Plus, BarChart3, CheckCircle, Clock
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminInfluencerPayouts() {
  const [influencers, setInfluencers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [referralStats, setReferralStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [showInfluencerDialog, setShowInfluencerDialog] = useState(false);

  useEffect(() => {
    fetchInfluencers();
    fetchPayouts();
    fetchReferralStats();
  }, []);

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/influencers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInfluencers(data.influencers || []);
      }
    } catch (error) {
      console.error('Error fetching influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`${API}/admin/influencer-payouts`, {
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

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`${API}/admin/referral-stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReferralStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const getTierColor = (tier) => {
    switch (tier.toLowerCase()) {
      case 'diamond': return 'bg-purple-100 text-purple-800';
      case 'platinum': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-blue-100 text-blue-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data
  const mockInfluencers = [
    {
      id: 'inf_1',
      user_id: 'user_123',
      name: 'Johan van der Merwe',
      email: 'johan@farminfluencer.co.za',
      referral_code: 'JOHAN2025',
      tier: 'Gold',
      total_referrals: 156,
      successful_referrals: 89,
      total_commission: 47560.00,
      pending_commission: 8750.00,
      paid_commission: 38810.00,
      commission_rate: 0.15,
      status: 'active',
      joined_date: '2024-11-15T10:00:00Z',
      last_payout: '2025-08-25T14:30:00Z',
      bank_details: {
        account_holder: 'Johan van der Merwe',
        bank: 'FNB',
        account_number: '****1234',
        verified: true
      },
      social_media: {
        youtube: '@FarmingWithJohan',
        facebook: 'Johan Farming',
        instagram: '@johan_livestock'
      }
    },
    {
      id: 'inf_2',
      user_id: 'user_456',
      name: 'Sarah Williams',
      email: 'sarah@agriinfluence.co.za',
      referral_code: 'SARAH2025',
      tier: 'Platinum',
      total_referrals: 234,
      successful_referrals: 178,
      total_commission: 89340.00,
      pending_commission: 12450.00,
      paid_commission: 76890.00,
      commission_rate: 0.20,
      status: 'active',
      joined_date: '2024-09-20T12:30:00Z',
      last_payout: '2025-08-28T11:15:00Z',
      bank_details: {
        account_holder: 'Sarah Williams',
        bank: 'Standard Bank',
        account_number: '****5678',
        verified: true
      },
      social_media: {
        youtube: '@SarahAgri',
        tiktok: '@sarah_livestock',
        instagram: '@sarahfarms'
      }
    },
    {
      id: 'inf_3',
      user_id: 'user_789',
      name: 'Thabo Mthembu',
      email: 'thabo@livestockexpert.co.za',
      referral_code: 'THABO2025',
      tier: 'Silver',
      total_referrals: 67,
      successful_referrals: 45,
      total_commission: 18920.00,
      pending_commission: 3250.00,
      paid_commission: 15670.00,
      commission_rate: 0.12,
      status: 'active',
      joined_date: '2025-01-10T09:45:00Z',
      last_payout: '2025-08-20T16:20:00Z',
      bank_details: {
        account_holder: 'Thabo Mthembu',
        bank: 'ABSA',
        account_number: '****9012',
        verified: false
      },
      social_media: {
        facebook: 'Thabo Livestock',
        whatsapp: '+27 82 555 0123'
      }
    }
  ];

  const mockPayouts = [
    {
      id: 'payout_1',
      influencer_id: 'inf_1',
      influencer_name: 'Johan van der Merwe',
      amount: 8750.00,
      commission_period_start: '2025-08-01T00:00:00Z',
      commission_period_end: '2025-08-31T23:59:59Z',
      referrals_count: 12,
      status: 'pending',
      created_at: '2025-08-29T10:00:00Z',
      details: {
        new_user_referrals: 8,
        transaction_commissions: 4,
        bonus_payments: 0
      }
    },
    {
      id: 'payout_2',
      influencer_id: 'inf_2',
      influencer_name: 'Sarah Williams',
      amount: 12450.00,
      commission_period_start: '2025-08-01T00:00:00Z',
      commission_period_end: '2025-08-31T23:59:59Z',
      referrals_count: 18,
      status: 'completed',
      created_at: '2025-08-28T11:15:00Z',
      paid_at: '2025-08-28T15:30:00Z',
      transaction_id: 'TXN_INF_123456',
      details: {
        new_user_referrals: 15,
        transaction_commissions: 3,
        bonus_payments: 1250.00
      }
    },
    {
      id: 'payout_3',
      influencer_id: 'inf_3',
      influencer_name: 'Thabo Mthembu',
      amount: 3250.00,
      commission_period_start: '2025-08-01T00:00:00Z',
      commission_period_end: '2025-08-31T23:59:59Z',
      referrals_count: 5,
      status: 'pending',
      created_at: '2025-08-29T14:20:00Z',
      details: {
        new_user_referrals: 4,
        transaction_commissions: 1,
        bonus_payments: 0
      }
    }
  ];

  const mockReferralStats = {
    total_influencers: 15,
    active_influencers: 12,
    total_referrals: 1247,
    successful_referrals: 892,
    total_commission_paid: 156780.00,
    pending_commission: 34580.00,
    monthly_growth: 24.5
  };

  const displayInfluencers = influencers.length > 0 ? influencers : mockInfluencers;
  const displayPayouts = payouts.length > 0 ? payouts : mockPayouts;
  const displayStats = Object.keys(referralStats).length > 0 ? referralStats : mockReferralStats;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Influencer & Referral Payouts</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading influencer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Influencer & Referral Payouts</h2>
          <p className="text-gray-600">Manage influencer partnerships and referral commissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {fetchInfluencers(); fetchPayouts();}}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Influencer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Influencers</p>
                <p className="text-2xl font-bold text-blue-600">{displayStats.active_influencers}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Referrals</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayStats.successful_referrals?.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payouts</p>
                <p className="text-2xl font-bold text-orange-600">
                  R{displayStats.pending_commission?.toLocaleString()}
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
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-purple-600">
                  R{displayStats.total_commission_paid?.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="influencers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tiers">Tier Management</TabsTrigger>
        </TabsList>

        <TabsContent value="influencers">
          <Card>
            <CardHeader>
              <CardTitle>Influencer Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayInfluencers.map((influencer) => (
                    <TableRow key={influencer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{influencer.name}</div>
                          <div className="text-sm text-gray-500">{influencer.email}</div>
                          <div className="text-sm text-blue-600">Code: {influencer.referral_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(influencer.tier)}>
                          {influencer.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{influencer.successful_referrals}</div>
                          <div className="text-sm text-gray-500">of {influencer.total_referrals}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{(influencer.commission_rate * 100)}%</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">R{influencer.total_commission.toLocaleString()}</div>
                          <div className="text-sm text-orange-600">
                            R{influencer.pending_commission.toLocaleString()} pending
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(influencer.status)}>
                          {influencer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedInfluencer(influencer); setShowInfluencerDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {influencer.pending_commission > 0 && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Influencer Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="font-medium">{payout.influencer_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          R{payout.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(payout.commission_period_start).toLocaleDateString()} - {new Date(payout.commission_period_end).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{payout.referrals_count}</div>
                          <div className="text-sm text-gray-500">
                            {payout.details.new_user_referrals} new users
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(payout.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payout.status === 'pending' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Process
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

        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Conversion Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round((displayStats.successful_referrals / displayStats.total_referrals) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Average Commission</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R{Math.round(displayStats.total_commission_paid / displayStats.successful_referrals).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Monthly Growth</span>
                    <span className="text-2xl font-bold text-purple-600">+{displayStats.monthly_growth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayInfluencers.slice(0, 5).map((influencer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{influencer.name}</div>
                          <div className="text-sm text-gray-500">{influencer.successful_referrals} referrals</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R{influencer.total_commission.toLocaleString()}</div>
                        <Badge className={getTierColor(influencer.tier)} variant="outline">
                          {influencer.tier}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiers">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Bronze', min_referrals: 0, commission_rate: 0.10, color: 'bg-orange-100 text-orange-800' },
                    { name: 'Silver', min_referrals: 25, commission_rate: 0.12, color: 'bg-blue-100 text-blue-800' },
                    { name: 'Gold', min_referrals: 50, commission_rate: 0.15, color: 'bg-yellow-100 text-yellow-800' },
                    { name: 'Platinum', min_referrals: 100, commission_rate: 0.20, color: 'bg-gray-100 text-gray-800' },
                    { name: 'Diamond', min_referrals: 200, commission_rate: 0.25, color: 'bg-purple-100 text-purple-800' }
                  ].map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={tier.color}>{tier.name}</Badge>
                        <span className="text-sm text-gray-600">
                          {tier.min_referrals}+ referrals
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{(tier.commission_rate * 100)}%</div>
                        <div className="text-sm text-gray-500">commission</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((tier, index) => {
                    const count = displayInfluencers.filter(inf => inf.tier === tier).length;
                    const percentage = Math.round((count / displayInfluencers.length) * 100);
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getTierColor(tier)} variant="outline">
                            {tier}
                          </Badge>
                          <span className="text-sm">{count} influencers</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Influencer Details Dialog */}
      <Dialog open={showInfluencerDialog} onOpenChange={setShowInfluencerDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Influencer Details</DialogTitle>
            <DialogDescription>
              Comprehensive influencer performance and payout information
            </DialogDescription>
          </DialogHeader>
          
          {selectedInfluencer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedInfluencer.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedInfluencer.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Referral Code</Label>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{selectedInfluencer.referral_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tier</Label>
                  <Badge className={getTierColor(selectedInfluencer.tier)}>
                    {selectedInfluencer.tier}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Commission Rate</Label>
                  <p className="text-sm font-semibold">{(selectedInfluencer.commission_rate * 100)}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedInfluencer.status)}>
                    {selectedInfluencer.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedInfluencer.total_referrals}</div>
                  <div className="text-sm text-gray-600">Total Referrals</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedInfluencer.successful_referrals}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((selectedInfluencer.successful_referrals / selectedInfluencer.total_referrals) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Earnings</Label>
                  <p className="text-lg font-bold text-green-600">R{selectedInfluencer.total_commission.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Pending Commission</Label>
                  <p className="text-lg font-bold text-orange-600">R{selectedInfluencer.pending_commission.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Paid Commission</Label>
                  <p className="text-lg font-bold text-blue-600">R{selectedInfluencer.paid_commission.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Bank Details</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{selectedInfluencer.bank_details.account_holder}</div>
                      <div className="text-sm text-gray-600">
                        {selectedInfluencer.bank_details.bank} - {selectedInfluencer.bank_details.account_number}
                      </div>
                    </div>
                    <Badge className={selectedInfluencer.bank_details.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {selectedInfluencer.bank_details.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Social Media</Label>
                <div className="flex gap-2 mt-1">
                  {Object.entries(selectedInfluencer.social_media).map(([platform, handle]) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}: {handle}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfluencerDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              View Referrals
            </Button>
            {selectedInfluencer?.pending_commission > 0 && (
              <Button className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                Process Payout
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}