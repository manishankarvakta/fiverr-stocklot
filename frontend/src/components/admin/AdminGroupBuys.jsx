import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from '../ui';
import { Users, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../api/client';

const AdminGroupBuys = () => {
  const [groupBuys, setGroupBuys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');

  useEffect(() => {
    loadGroupBuys();
  }, [statusFilter]);

  const loadGroupBuys = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/group-buys?status=${statusFilter}`);
      setGroupBuys(response.data.items || []);
    } catch (error) {
      console.error('Error loading group buys:', error);
      setGroupBuys([]);
    } finally {
      setLoading(false);
    }
  };

  const lockGroupBuy = async (groupId) => {
    try {
      await api.post(`/admin/group-buys/${groupId}/lock`);
      alert('Group buy locked successfully');
      loadGroupBuys();
    } catch (error) {
      console.error('Error locking group buy:', error);
      alert(error.response?.data?.detail || 'Failed to lock group buy');
    }
  };

  const closeGroupBuy = async (groupId, outcome) => {
    try {
      await api.post(`/admin/group-buys/${groupId}/close`, { outcome });
      alert(`Group buy closed as ${outcome.toLowerCase()}`);
      loadGroupBuys();
    } catch (error) {
      console.error('Error closing group buy:', error);
      alert(error.response?.data?.detail || 'Failed to close group buy');
    }
  };

  const cancelGroupBuy = async (groupId) => {
    try {
      await api.post(`/admin/group-buys/${groupId}/cancel`);
      alert('Group buy cancelled successfully');
      loadGroupBuys();
    } catch (error) {
      console.error('Error cancelling group buy:', error);
      alert(error.response?.data?.detail || 'Failed to cancel group buy');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'LOCKED': return 'bg-yellow-100 text-yellow-800';
      case 'FUNDED': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Group Buy Management
        </h2>
        <select 
          className="border rounded-lg px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="OPEN">Open</option>
          <option value="LOCKED">Locked</option>
          <option value="FUNDED">Funded</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {groupBuys.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">No {statusFilter.toLowerCase()} group buys found</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groupBuys.map((groupBuy) => {
            const progressPercent = groupBuy.target_amount_cents > 0 
              ? Math.min(100, (groupBuy.pledged_cents / groupBuy.target_amount_cents) * 100)
              : 0;

            return (
              <Card key={groupBuy.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {groupBuy.listing_title || `Group Buy ${groupBuy.id.slice(-8)}`}
                      </CardTitle>
                      <div className="text-sm text-gray-600">
                        Seller: {groupBuy.seller_name} • Listing: {groupBuy.listing_id.slice(-8)}
                      </div>
                    </div>
                    <Badge className={getStatusColor(groupBuy.status)}>
                      {groupBuy.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Funding Progress</span>
                      <span>
                        R{(groupBuy.pledged_cents / 100).toFixed(2)} / 
                        R{(groupBuy.target_amount_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">Target Amount</div>
                      <div className="text-green-600">
                        R{(groupBuy.target_amount_cents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Pledged</div>
                      <div className="text-blue-600">
                        R{(groupBuy.pledged_cents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Members</div>
                      <div>{groupBuy.members_paid}/{groupBuy.min_members}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Lock Expires</div>
                      <div>
                        {groupBuy.lock_expires_at 
                          ? new Date(groupBuy.lock_expires_at).toLocaleString()
                          : '—'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {groupBuy.status === 'OPEN' && (
                      <Button
                        onClick={() => lockGroupBuy(groupBuy.id)}
                        size="sm"
                        variant="outline"
                        className="hover:bg-yellow-50"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                      </Button>
                    )}
                    
                    {(groupBuy.status === 'LOCKED' || groupBuy.status === 'OPEN') && (
                      <>
                        <Button
                          onClick={() => closeGroupBuy(groupBuy.id, 'FUNDED')}
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Close as Funded
                        </Button>
                        <Button
                          onClick={() => closeGroupBuy(groupBuy.id, 'FAILED')}
                          size="sm"
                          variant="outline"
                          className="hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Close as Failed
                        </Button>
                      </>
                    )}
                    
                    {['OPEN', 'LOCKED'].includes(groupBuy.status) && (
                      <Button
                        onClick={() => cancelGroupBuy(groupBuy.id)}
                        size="sm"
                        variant="outline"
                        className="hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => window.open(`/admin/group-buys/${groupBuy.id}`, '_blank')}
                      size="sm"
                      variant="outline"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminGroupBuys;