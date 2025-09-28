import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from '../ui';
import { DollarSign, Flag, Settings, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import adminApi from '../../api/adminClient';

const FeesFlagsQueue = () => {
  const [fees, setFees] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFeeForm, setShowFeeForm] = useState(false);
  
  const [feeForm, setFeeForm] = useState({
    label: '',
    platform_commission_pct: 10.0,
    seller_payout_fee_pct: 2.5,
    buyer_processing_fee_pct: 1.5,
    escrow_fee_minor: 2500,
    minimum_order_value: 10000,
    maximum_order_value: 100000000
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feesResponse, flagsResponse] = await Promise.all([
        adminApi.get('/admin/config/fees'),
        adminApi.get('/admin/config/flags')
      ]);
      
      setFees(feesResponse.data.rows || []);
      setFlags(flagsResponse.data.rows || []);
    } catch (error) {
      console.error('Error loading fees and flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFeeConfig = async () => {
    setActionLoading(true);
    try {
      await adminApi.post('/admin/config/fees', feeForm);
      
      alert('Fee configuration created successfully!');
      setShowFeeForm(false);
      setFeeForm({
        label: '',
        platform_commission_pct: 10.0,
        seller_payout_fee_pct: 2.5,
        buyer_processing_fee_pct: 1.5,
        escrow_fee_minor: 2500,
        minimum_order_value: 10000,
        maximum_order_value: 100000000
      });
      
      await loadData();
    } catch (error) {
      console.error('Error creating fee config:', error);
      alert('Failed to create fee configuration. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const activateFeeConfig = async (configId) => {
    if (!confirm('Activate this fee configuration? This will deactivate the current active configuration.')) {
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.post(`/admin/config/fees/${configId}/activate`);
      
      alert('Fee configuration activated successfully!');
      await loadData();
    } catch (error) {
      console.error('Error activating fee config:', error);
      alert('Failed to activate fee configuration. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const updateFeatureFlag = async (key, status) => {
    setActionLoading(true);
    try {
      const flag = flags.find(f => f.key === key);
      const rollout = flag?.rollout || { default: true, percent: 100 };
      
      await adminApi.post(`/admin/config/flags/${key}`, {
        status,
        rollout
      });
      
      alert(`Feature flag ${status.toLowerCase()} successfully!`);
      await loadData();
    } catch (error) {
      console.error('Error updating feature flag:', error);
      alert('Failed to update feature flag. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'DISABLED': return 'bg-red-100 text-red-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return `R${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fee Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fee Configurations
            </CardTitle>
            <Button
              onClick={() => setShowFeeForm(!showFeeForm)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Fee Form */}
          {showFeeForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-4">New Fee Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="label">Configuration Label</Label>
                  <Input
                    id="label"
                    value={feeForm.label}
                    onChange={(e) => setFeeForm({...feeForm, label: e.target.value})}
                    placeholder="e.g., Standard Fees v2.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="platform_commission">Platform Commission (%)</Label>
                  <Input
                    id="platform_commission"
                    type="number"
                    step="0.1"
                    value={feeForm.platform_commission_pct}
                    onChange={(e) => setFeeForm({...feeForm, platform_commission_pct: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="seller_payout">Seller Payout Fee (%)</Label>
                  <Input
                    id="seller_payout"
                    type="number"
                    step="0.1"
                    value={feeForm.seller_payout_fee_pct}
                    onChange={(e) => setFeeForm({...feeForm, seller_payout_fee_pct: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="buyer_processing">Buyer Processing Fee (%)</Label>
                  <Input
                    id="buyer_processing"
                    type="number"
                    step="0.1"
                    value={feeForm.buyer_processing_fee_pct}
                    onChange={(e) => setFeeForm({...feeForm, buyer_processing_fee_pct: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="escrow_fee">Escrow Fee (cents)</Label>
                  <Input
                    id="escrow_fee"
                    type="number"
                    value={feeForm.escrow_fee_minor}
                    onChange={(e) => setFeeForm({...feeForm, escrow_fee_minor: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={createFeeConfig}
                  disabled={actionLoading || !feeForm.label}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFeeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Fee Configurations List */}
          <div className="space-y-3">
            {fees.map((config) => (
              <div key={config.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{config.label}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(config.status)}>
                      {config.status}
                    </Badge>
                    {config.status !== 'ACTIVE' && (
                      <Button
                        size="sm"
                        onClick={() => activateFeeConfig(config.id)}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="grid grid-cols-2 gap-4">
                    <span>Platform Commission: {config.platform_commission_pct}%</span>
                    <span>Seller Payout Fee: {config.seller_payout_fee_pct}%</span>
                    <span>Buyer Processing: {config.buyer_processing_fee_pct}%</span>
                    <span>Escrow Fee: {formatCurrency(config.escrow_fee_minor)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(config.created_at).toLocaleDateString()}
                    {config.activated_at && (
                      <span> • Activated: {new Date(config.activated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {fees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No fee configurations yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flags.map((flag) => (
              <div key={flag.key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{flag.label}</h4>
                    <p className="text-sm text-gray-600 font-mono">{flag.key}</p>
                    {flag.description && (
                      <p className="text-xs text-gray-500 mt-1">{flag.description}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(flag.status)}>
                    {flag.status}
                  </Badge>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => updateFeatureFlag(flag.key, 'ACTIVE')}
                    disabled={actionLoading || flag.status === 'ACTIVE'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFeatureFlag(flag.key, 'DRAFT')}
                    disabled={actionLoading || flag.status === 'DRAFT'}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateFeatureFlag(flag.key, 'DISABLED')}
                    disabled={actionLoading || flag.status === 'DISABLED'}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Disable
                  </Button>
                </div>
                
                {flag.rollout && (
                  <div className="text-xs text-gray-500 mt-2">
                    Rollout: {flag.rollout.percent || 100}% • 
                    Default: {flag.rollout.default ? 'ON' : 'OFF'}
                  </div>
                )}
              </div>
            ))}
            
            {flags.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No feature flags configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeesFlagsQueue;