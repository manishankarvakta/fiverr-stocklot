import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '../ui';
import { 
  Users, Plus, Star, DollarSign, TrendingUp, Eye, Edit, Trash2, CheckCircle, XCircle,
  UserPlus, Award, Target, BarChart3, Calendar, Clock
} from 'lucide-react';
// import api from '../../utils/apiHelper';

export default function AdminInfluencerPayouts() {
  const [influencers, setInfluencers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [showAddInfluencer, setShowAddInfluencer] = useState(false);
  const [showEditInfluencer, setShowEditInfluencer] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newInfluencer, setNewInfluencer] = useState({
    name: '',
    email: '',
    phone: '',
    platform: '',
    handle: '',
    follower_count: 0,
    commission_rate: 5,
    payment_method: 'bank_transfer',
    bank_details: '',
    status: 'active'
  });

  useEffect(() => {
    fetchInfluencers();
    fetchPayouts();
  }, []);

  const fetchInfluencers = async () => {
    try {
      const response = await api.get('/admin/influencers');
      setInfluencers(response.data.influencers || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      setInfluencers([]);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await api.get('/admin/payouts');
      setPayouts(response.data.payouts || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setPayouts([]);
    }
  };

  const handleAddInfluencer = async () => {
    setLoading(true);
    try {
      const influencerData = {
        ...newInfluencer,
        follower_count: parseInt(newInfluencer.follower_count) || 0,
        commission_rate: parseFloat(newInfluencer.commission_rate) || 5
      };

      const response = await api.post('/admin/influencers', influencerData);
      
      if (response.data.success) {
        setShowAddInfluencer(false);
        setNewInfluencer({
          name: '', email: '', phone: '', platform: '', handle: '',
          follower_count: 0, commission_rate: 5, payment_method: 'bank_transfer',
          bank_details: '', status: 'active'
        });
        fetchInfluencers();
        alert('Influencer added successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add influencer');
      }
    } catch (error) {
      console.error('Error adding influencer:', error);
      alert('Failed to add influencer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInfluencer = async () => {
    setLoading(true);
    try {
      const influencerData = {
        ...selectedInfluencer,
        follower_count: parseInt(selectedInfluencer.follower_count) || 0,
        commission_rate: parseFloat(selectedInfluencer.commission_rate) || 5
      };

      const response = await api.put(`/admin/influencers/${selectedInfluencer.id}`, influencerData);

      if (response.data.success) {
        setShowEditInfluencer(false);
        setSelectedInfluencer(null);
        fetchInfluencers();
        alert('Influencer updated successfully!');
      } else {
        throw new Error('Failed to update influencer');
      }
    } catch (error) {
      console.error('Error updating influencer:', error);
      alert('Failed to update influencer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInfluencer = async (influencerId) => {
    if (window.confirm('Are you sure you want to delete this influencer?')) {
      try {
        const response = await api.delete(`/admin/influencers/${influencerId}`);

        if (response.data.success) {
          fetchInfluencers();
          alert('Influencer deleted successfully!');
        } else {
          throw new Error('Failed to delete influencer');
        }
      } catch (error) {
        console.error('Error deleting influencer:', error);
        alert('Failed to delete influencer');
      }
    }
  };

  const handleProcessPayout = async (influencerId, amount, period) => {
    setLoading(true);
    try {
      const response = await api.post('/admin/influencer-payouts', {
        influencer_id: influencerId,
        amount: parseFloat(amount),
        period: period,
        status: 'pending'
      });

      if (response.data.success) {
        setShowPayoutDialog(false);
        fetchPayouts();
        alert('Payout processed successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process payout');
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Failed to process payout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInfluencerStatus = async (influencerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await api.patch(`/admin/influencers/${influencerId}/status`, { status: newStatus });

      if (response.data.success) {
        fetchInfluencers();
        alert(`Influencer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error('Failed to update influencer status');
      }
    } catch (error) {
      console.error('Error updating influencer status:', error);
      alert('Failed to update influencer status');
    }
  };

  const openEditDialog = (influencer) => {
    setSelectedInfluencer({ ...influencer });
    setShowEditInfluencer(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return '📷';
      case 'tiktok': return '🎵';
      case 'youtube': return '📺';
      case 'twitter': return '🐦';
      case 'facebook': return '📘';
      default: return '👤';
    }
  };

  const formatFollowers = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const activeInfluencers = influencers.filter(i => i.status === 'active').length;
  const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Influencer Payouts</h1>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-blue-100 text-blue-800">
              {activeInfluencers} Active Influencers
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              R{totalPayouts.toFixed(2)} Total Payouts
            </Badge>
          </div>
        </div>
        <Button onClick={() => setShowAddInfluencer(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Influencer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Influencers</p>
                <p className="text-2xl font-bold text-blue-600">{activeInfluencers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-green-600">R{totalPayouts.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {payouts.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Commission</p>
                <p className="text-2xl font-bold">
                  {influencers.length > 0 
                    ? `${(influencers.reduce((sum, i) => sum + (i.commission_rate || 0), 0) / influencers.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Influencers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Influencers ({influencers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {influencers.map((influencer) => {
                const totalEarned = payouts
                  .filter(p => p.influencer_id === influencer.id && p.status === 'completed')
                  .reduce((sum, p) => sum + (p.amount || 0), 0);

                return (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {influencer.name?.charAt(0) || 'I'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{influencer.name}</div>
                          <div className="text-sm text-gray-500">{influencer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPlatformIcon(influencer.platform)}</span>
                        <div>
                          <div className="font-medium">{influencer.platform}</div>
                          <div className="text-sm text-gray-500">@{influencer.handle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatFollowers(influencer.follower_count)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50">
                        {influencer.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(influencer.status)}>
                        {influencer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">R{totalEarned.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(influencer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleInfluencerStatus(influencer.id, influencer.status)}
                        >
                          {influencer.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInfluencer(influencer);
                            setShowPayoutDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteInfluencer(influencer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Influencer Dialog */}
      <Dialog open={showAddInfluencer} onOpenChange={setShowAddInfluencer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Influencer</DialogTitle>
            <DialogDescription>
              Register a new influencer for the affiliate program
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newInfluencer.name}
                onChange={(e) => setNewInfluencer({...newInfluencer, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newInfluencer.email}
                onChange={(e) => setNewInfluencer({...newInfluencer, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newInfluencer.phone}
                onChange={(e) => setNewInfluencer({...newInfluencer, phone: e.target.value})}
                placeholder="+27 123 456 789"
              />
            </div>
            <div>
              <Label>Platform *</Label>
              <Select value={newInfluencer.platform} onValueChange={(value) => setNewInfluencer({...newInfluencer, platform: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Handle/Username *</Label>
              <Input
                value={newInfluencer.handle}
                onChange={(e) => setNewInfluencer({...newInfluencer, handle: e.target.value})}
                placeholder="@johndoe"
              />
            </div>
            <div>
              <Label>Follower Count</Label>
              <Input
                type="number"
                value={newInfluencer.follower_count}
                onChange={(e) => setNewInfluencer({...newInfluencer, follower_count: e.target.value})}
                placeholder="10000"
              />
            </div>
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={newInfluencer.commission_rate}
                onChange={(e) => setNewInfluencer({...newInfluencer, commission_rate: e.target.value})}
                placeholder="5.0"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={newInfluencer.payment_method} onValueChange={(value) => setNewInfluencer({...newInfluencer, payment_method: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Bank Details / Payment Info</Label>
              <Textarea
                value={newInfluencer.bank_details}
                onChange={(e) => setNewInfluencer({...newInfluencer, bank_details: e.target.value})}
                placeholder="Bank account details or payment information"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInfluencer(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddInfluencer} 
              disabled={loading || !newInfluencer.name || !newInfluencer.email}
            >
              {loading ? 'Adding...' : 'Add Influencer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Influencer Dialog */}
      <Dialog open={showEditInfluencer} onOpenChange={setShowEditInfluencer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Influencer</DialogTitle>
            <DialogDescription>
              Update influencer information
            </DialogDescription>
          </DialogHeader>

          {selectedInfluencer && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={selectedInfluencer.name}
                  onChange={(e) => setSelectedInfluencer({...selectedInfluencer, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={selectedInfluencer.email}
                  onChange={(e) => setSelectedInfluencer({...selectedInfluencer, email: e.target.value})}
                />
              </div>
              <div>
                <Label>Follower Count</Label>
                <Input
                  type="number"
                  value={selectedInfluencer.follower_count}
                  onChange={(e) => setSelectedInfluencer({...selectedInfluencer, follower_count: e.target.value})}
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedInfluencer.commission_rate}
                  onChange={(e) => setSelectedInfluencer({...selectedInfluencer, commission_rate: e.target.value})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={selectedInfluencer.status} onValueChange={(value) => setSelectedInfluencer({...selectedInfluencer, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditInfluencer(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditInfluencer} disabled={loading}>
              {loading ? 'Updating...' : 'Update Influencer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}