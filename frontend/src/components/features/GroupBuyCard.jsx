import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from '../ui';
import { Users, Clock, DollarSign, Target } from 'lucide-react';
import api from '../../utils/apiHelper';

const GroupBuyCard = ({ groupBuy, onPledge, onPay }) => {
  const [pledging, setPledging] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [showPledgeForm, setShowPledgeForm] = useState(false);

  const progressPercent = groupBuy.target_amount_cents > 0 
    ? Math.min(100, (groupBuy.total_pledged_cents / groupBuy.target_amount_cents) * 100)
    : 0;

  const handlePledge = async () => {
    if (!pledgeAmount || pledging) return;
    
    setPledging(true);
    try {
      await api.post(`/group-buys/${groupBuy.id}/pledge`, {
        pledge_cents: Math.round(parseFloat(pledgeAmount) * 100)
      });
      
      setShowPledgeForm(false);
      setPledgeAmount('');
      if (onPledge) onPledge();
    } catch (error) {
      console.error('Error pledging:', error);
      alert(error.response?.data?.detail || 'Failed to pledge');
    } finally {
      setPledging(false);
    }
  };

  const handlePay = async () => {
    try {
      await api.post(`/group-buys/${groupBuy.id}/pay`);
      if (onPay) onPay();
    } catch (error) {
      console.error('Error paying:', error);
      alert(error.response?.data?.detail || 'Failed to pay');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'green';
      case 'LOCKED': return 'yellow';
      case 'FUNDED': return 'blue';
      case 'FAILED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Buy
          </CardTitle>
          <Badge variant={getStatusColor(groupBuy.status)}>
            {groupBuy.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>R{(groupBuy.total_pledged_cents / 100).toFixed(2)} / R{(groupBuy.target_amount_cents / 100).toFixed(2)}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{groupBuy.member_count}</div>
            <div className="text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{groupBuy.min_members}</div>
            <div className="text-gray-500">Min Required</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">R{(groupBuy.total_paid_cents / 100).toFixed(0)}</div>
            <div className="text-gray-500">Paid</div>
          </div>
        </div>

        {/* Countdown */}
        {groupBuy.lock_expires_at && groupBuy.status === 'LOCKED' && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Clock className="h-4 w-4" />
            Payment deadline: {new Date(groupBuy.lock_expires_at).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {groupBuy.status === 'OPEN' && (
            <>
              {!showPledgeForm ? (
                <Button 
                  onClick={() => setShowPledgeForm(true)}
                  className="w-full"
                  variant="outline"
                >
                  Join Group Buy
                </Button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Pledge amount (R)"
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(e.target.value)}
                    className="w-full p-2 border rounded"
                    min="100"
                    step="50"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handlePledge}
                      disabled={pledging || !pledgeAmount}
                      className="flex-1"
                    >
                      {pledging ? 'Pledging...' : 'Pledge'}
                    </Button>
                    <Button 
                      onClick={() => setShowPledgeForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {groupBuy.status === 'LOCKED' && (
            <Button 
              onClick={handlePay}
              className="w-full"
            >
              Pay My Pledge
            </Button>
          )}

          {groupBuy.status === 'FUNDED' && (
            <div className="text-center text-green-600 font-semibold">
              ✅ Successfully Funded!
            </div>
          )}

          {groupBuy.status === 'FAILED' && (
            <div className="text-center text-red-600 font-semibold">
              ❌ Group Buy Failed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupBuyCard;