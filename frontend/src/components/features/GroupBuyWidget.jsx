import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from '../ui';
import { Users, Clock, DollarSign, Target } from 'lucide-react';
// import { IfFlag } from '../../providers/FeatureFlagsProvider';
import api from '../../utils/apiHelper';

const GroupBuyWidget = ({ listingId, sellerId, targetCents, onUpdate }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [pledging, setPledging] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadGroupBuy();
  }, [listingId]);

  const loadGroupBuy = async () => {
    try {
      const response = await api.get(`/group-buys/by-listing/${listingId}`);
      setGroup(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading group buy:', error);
      }
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const extractErrorMessage = (error) => {
    console.log('Raw error:', error);
    
    // Handle different error response formats
    if (error.response?.data) {
      const data = error.response.data;
      
      // Handle Pydantic validation errors (array format)
      if (data.detail && Array.isArray(data.detail)) {
        return data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
      }
      
      // Handle simple detail string
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      
      // Handle other message formats
      if (data.message) return data.message;
      if (data.error) return data.error;
      
      // Fallback to JSON string
      return JSON.stringify(data);
    }
    
    // Handle network errors
    if (error.message) return error.message;
    
    // Ultimate fallback
    return 'An error occurred';
  };

  const createGroupBuy = async () => {
    try {
      const response = await api.post('/group-buys', {
        listing_id: listingId,
        seller_id: sellerId,
        target_amount_cents: targetCents,
        min_members: 2
      });
      setGroup(response.data);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating group buy:', error);
      const message = extractErrorMessage(error);
      alert(`Failed to create group buy: ${message}`);
    }
  };

  const addPledge = async () => {
    if (!pledgeAmount || pledging) return;
    
    setPledging(true);
    try {
      await api.post(`/group-buys/${group.id}/pledge`, {
        pledge_cents: Math.round(parseFloat(pledgeAmount) * 100)
      });
      
      setPledgeAmount('');
      await loadGroupBuy();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding pledge:', error);
      const message = extractErrorMessage(error);
      alert(`Failed to add pledge: ${message}`);
    } finally {
      setPledging(false);
    }
  };

  const payPledge = async () => {
    setPaying(true);
    try {
      await api.post(`/group-buys/${group.id}/pay`);
      alert('Payment initiated! You will be charged via escrow.');
      await loadGroupBuy();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error paying pledge:', error);
      const message = extractErrorMessage(error);
      alert(`Failed to pay pledge: ${message}`);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <IfFlag flag="ff.group_buy">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </IfFlag>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'LOCKED': return 'bg-yellow-100 text-yellow-800';
      case 'FUNDED': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercent = group && group.target_amount_cents > 0 
    ? Math.min(100, (group.total_pledged_cents / group.target_amount_cents) * 100)
    : 0;

  return (
    <IfFlag flag="ff.group_buy">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Buy
            </CardTitle>
            {group && (
              <Badge className={getStatusColor(group.status)}>
                {group.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {group ? (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    R{((group.total_pledged_cents || 0) / 100).toFixed(2)} / 
                    R{(group.target_amount_cents / 100).toFixed(2)}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div>
                  <div className="font-semibold">{group.member_count || 0}</div>
                  <div className="text-gray-500">Members</div>
                </div>
                <div>
                  <div className="font-semibold">{group.min_members}</div>
                  <div className="text-gray-500">Required</div>
                </div>
                <div>
                  <div className="font-semibold">R{((group.total_paid_cents || 0) / 100).toFixed(0)}</div>
                  <div className="text-gray-500">Paid</div>
                </div>
              </div>

              {/* Lock Timer */}
              {group.lock_expires_at && group.status === 'LOCKED' && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <Clock className="h-4 w-4" />
                  Payment deadline: {new Date(group.lock_expires_at).toLocaleString()}
                </div>
              )}

              {/* Actions */}
              {group.status === 'OPEN' && (
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Pledge amount (R)"
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    min="100"
                    step="50"
                  />
                  <Button 
                    onClick={addPledge}
                    disabled={pledging || !pledgeAmount}
                    className="w-full"
                  >
                    {pledging ? 'Adding Pledge...' : 'Join Group Buy'}
                  </Button>
                </div>
              )}

              {group.status === 'LOCKED' && (
                <Button 
                  onClick={payPledge}
                  disabled={paying}
                  className="w-full"
                >
                  {paying ? 'Processing...' : 'Pay My Pledge'}
                </Button>
              )}

              {group.status === 'FUNDED' && (
                <div className="text-center text-green-600 font-semibold bg-green-50 p-3 rounded">
                  ✅ Successfully Funded!
                </div>
              )}

              {group.status === 'FAILED' && (
                <div className="text-center text-red-600 font-semibold bg-red-50 p-3 rounded">
                  ❌ Group Buy Failed
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-gray-600">Start a group buy for this listing</div>
              <Button onClick={createGroupBuy} variant="outline" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Start Group Buy
              </Button>
              <div className="text-xs text-gray-500">
                Allow multiple buyers to split the cost
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </IfFlag>
  );
};

export default GroupBuyWidget;