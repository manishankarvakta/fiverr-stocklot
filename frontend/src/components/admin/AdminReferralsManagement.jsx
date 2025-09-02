import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../ui';
import { 
  Award, Search, Filter, Download, Eye, Check, X, DollarSign,
  TrendingUp, Users, Gift, AlertTriangle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminReferralsManagement() {
  const [rewards, setRewards] = useState([]);
  const [referralCodes, setReferralCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedReward, setSelectedReward] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRewards();
    fetchReferralCodes();
  }, [filterStatus]);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/referrals/rewards?status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRewards(Array.isArray(data) ? data : data.rewards || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCodes = async () => {
    try {
      const response = await fetch(`${API}/admin/referrals/codes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralCodes(Array.isArray(data) ? data : data.codes || []);
      }
    } catch (error) {
      console.error('Error fetching referral codes:', error);
    }
  };

  const handleRewardAction = async (rewardId, action, reason = '') => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/admin/referrals/rewards/${rewardId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        fetchRewards();
        setShowDialog(false);
      }
    } catch (error) {
      console.error(`Error ${action}ing reward:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFraudFlag = async (userId, reason) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/admin/referrals/fraud/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        fetchRewards();
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Error flagging fraud:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRewards = rewards.filter(reward => {
    if (!reward) return false;
    
    const matchesSearch = !searchTerm || 
      reward.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.referral_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
    }
  };

  const getReferralStats = () => {
    return {
      totalRewards: rewards.length,
      pendingRewards: rewards.filter(r => r.status === 'pending').length,
      approvedRewards: rewards.filter(r => r.status === 'approved').length,
      paidRewards: rewards.filter(r => r.status === 'paid').length,
      rejectedRewards: rewards.filter(r => r.status === 'rejected').length,
      totalValue: rewards.reduce((sum, r) => sum + (r.amount || 0), 0),
      activeCodes: referralCodes.length
    };
  };

  const stats = getReferralStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Referral Program Management</h2>
          <p className="text-gray-600">
            {stats.totalRewards} rewards • R{stats.totalValue.toLocaleString()} total value
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { fetchRewards(); fetchReferralCodes(); }}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRewards}</div>
            <div className="text-sm text-gray-500">Total Rewards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pendingRewards}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approvedRewards}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.paidRewards}</div>
            <div className="text-sm text-gray-500">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedRewards}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">
              R{Math.round(stats.totalValue / 1000)}K
            </div>
            <div className="text-sm text-gray-500">Total Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.activeCodes}</div>
            <div className="text-sm text-gray-500">Active Codes</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by user email or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Referral Rewards ({filteredRewards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading rewards...</p>
            </div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards found</h3>
              <p className="text-gray-500">No referral rewards match your search criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Reward Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Earned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reward.user_email || 'Unknown user'}</div>
                        <div className="text-sm text-gray-500">
                          ID: {reward.user_id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded w-fit">
                        {reward.referral_code || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R{(reward.amount || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reward.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {reward.created_at 
                          ? new Date(reward.created_at).toLocaleDateString()
                          : 'Unknown'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReward(reward);
                            setShowDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {reward.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleRewardAction(reward.id, 'approve')}
                              disabled={actionLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRewardAction(reward.id, 'reject', 'Does not meet criteria')}
                              disabled={actionLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          className="bg-red-100 text-red-800 hover:bg-red-200"
                          onClick={() => handleFraudFlag(reward.user_id, 'Suspicious referral activity')}
                          disabled={actionLoading}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reward Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Referral Reward Review</DialogTitle>
            <DialogDescription>
              Review and manage referral reward
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedReward.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Referral Code</label>
                  <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded w-fit">
                    {selectedReward.referral_code}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reward Amount</label>
                  <p className="text-sm text-gray-900 font-bold text-green-600">
                    R{(selectedReward.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedReward.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Earned Date</label>
                  <p className="text-sm text-gray-900">
                    {selectedReward.created_at 
                      ? new Date(selectedReward.created_at).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Referred User</label>
                  <p className="text-sm text-gray-900">
                    {selectedReward.referred_user_email || 'Not available'}
                  </p>
                </div>
              </div>
              
              {selectedReward.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Additional Details</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                    <pre>{JSON.stringify(selectedReward.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedReward?.status === 'pending' && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleRewardAction(selectedReward.id, 'approve')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve Reward
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRewardAction(selectedReward.id, 'reject', 'Does not meet criteria')}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Reward
                </Button>
              </>
            )}
            <Button
              className="bg-red-100 text-red-800 hover:bg-red-200"
              onClick={() => handleFraudFlag(selectedReward.user_id, 'Suspicious referral activity')}
              disabled={actionLoading}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Flag Fraud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}