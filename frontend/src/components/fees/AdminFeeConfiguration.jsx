// ⚙️ ADMIN FEE CONFIGURATION COMPONENT
// Admin interface for managing fee configurations

import React, { useState, useEffect } from 'react';
import { 
  Settings, Plus, Check, X, Edit3, Eye, Calendar, 
  TrendingUp, AlertTriangle, Save, Trash2 
} from 'lucide-react';

const AdminFeeConfiguration = ({ currentUser }) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    platform_commission_pct: 10.0,
    seller_payout_fee_pct: 2.5,
    buyer_processing_fee_pct: 1.5,
    escrow_service_fee_minor: 2500,
    model: 'SELLER_PAYS',
    applies_to: {},
    effective_from: new Date().toISOString().slice(0, 16),
    effective_to: ''
  });

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/fees/configs', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }

      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.configs || []);
      } else {
        throw new Error(data.message || 'Failed to load configurations');
      }

    } catch (err) {
      console.error('Fetch configurations error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Format form data
      const configData = {
        ...formData,
        escrow_service_fee_minor: parseInt(formData.escrow_service_fee_minor),
        platform_commission_pct: parseFloat(formData.platform_commission_pct),
        seller_payout_fee_pct: parseFloat(formData.seller_payout_fee_pct),
        buyer_processing_fee_pct: parseFloat(formData.buyer_processing_fee_pct),
        effective_from: new Date(formData.effective_from).toISOString(),
        effective_to: formData.effective_to ? new Date(formData.effective_to).toISOString() : null
      };

      const response = await fetch('/api/admin/fees/configs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      });

      if (!response.ok) {
        throw new Error('Failed to create configuration');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchConfigurations();
        setShowCreateForm(false);
        resetForm();
        alert('Configuration created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create configuration');
      }

    } catch (err) {
      console.error('Create configuration error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateConfig = async (configId) => {
    if (!confirm('Are you sure you want to activate this configuration? This will deactivate the current configuration.')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/fees/configs/${configId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to activate configuration');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchConfigurations();
        alert('Configuration activated successfully!');
      } else {
        throw new Error(data.message || 'Failed to activate configuration');
      }

    } catch (err) {
      console.error('Activate configuration error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      platform_commission_pct: 10.0,
      seller_payout_fee_pct: 2.5,
      buyer_processing_fee_pct: 1.5,
      escrow_service_fee_minor: 2500,
      model: 'SELLER_PAYS',
      applies_to: {},
      effective_from: new Date().toISOString().slice(0, 16),
      effective_to: ''
    });
    setEditingConfig(null);
  };

  const formatCurrency = (amountMinor) => {
    return `R${(amountMinor / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getFeeModelDisplay = (model) => {
    return model === 'BUYER_PAYS_COMMISSION' ? 'Buyer-Pays Commission' : 'Seller-Pays';
  };

  const getFeeModelColor = (model) => {
    return model === 'BUYER_PAYS_COMMISSION' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  // Check if user has admin access
  if (!currentUser?.roles?.includes('admin') && !currentUser?.roles?.includes('ADMIN')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Admin access required to manage fee configurations</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Fee Configuration</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New Configuration
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingConfig) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configuration Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Default SA 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Fee Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Model *
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="SELLER_PAYS">Seller-Pays (Traditional)</option>
                  <option value="BUYER_PAYS_COMMISSION">Buyer-Pays Commission (Transparent)</option>
                </select>
              </div>

              {/* Platform Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.platform_commission_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform_commission_pct: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Seller Payout Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller Payout Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.seller_payout_fee_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, seller_payout_fee_pct: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Buyer Processing Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Processing Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.buyer_processing_fee_pct}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyer_processing_fee_pct: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Escrow Service Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escrow Service Fee (cents)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.escrow_service_fee_minor}
                    onChange={(e) => setFormData(prev => ({ ...prev, escrow_service_fee_minor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-2 text-sm text-gray-500">
                    = {formatCurrency(parseInt(formData.escrow_service_fee_minor) || 0)}
                  </div>
                </div>
              </div>

              {/* Effective From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective From *
                </label>
                <input
                  type="datetime-local"
                  value={formData.effective_from}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Effective To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective To (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.effective_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {editingConfig ? 'Update Configuration' : 'Create Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Fee Configurations</h2>
        </div>

        {loading && configs.length === 0 ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : configs.length === 0 ? (
          <div className="p-6 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No fee configurations found</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 text-green-600 hover:text-green-700"
            >
              Create your first configuration
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {configs.map((config) => (
              <div key={config.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {config.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getFeeModelColor(config.model)}`}>
                        {getFeeModelDisplay(config.model)}
                      </span>
                      {config.is_active && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-500">Commission</span>
                        <div className="font-medium">{config.platform_commission_pct}%</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Payout Fee</span>
                        <div className="font-medium">{config.seller_payout_fee_pct}%</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Processing</span>
                        <div className="font-medium">{config.buyer_processing_fee_pct}%</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Escrow</span>
                        <div className="font-medium">{formatCurrency(config.escrow_service_fee_minor)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>From: {formatDate(config.effective_from)}</span>
                      </div>
                      {config.effective_to && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>To: {formatDate(config.effective_to)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!config.is_active && (
                      <button
                        onClick={() => handleActivateConfig(config.id)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingConfig(config);
                        setFormData({
                          name: config.name,
                          platform_commission_pct: config.platform_commission_pct,
                          seller_payout_fee_pct: config.seller_payout_fee_pct,
                          buyer_processing_fee_pct: config.buyer_processing_fee_pct,
                          escrow_service_fee_minor: config.escrow_service_fee_minor,
                          model: config.model,
                          applies_to: config.applies_to || {},
                          effective_from: config.effective_from?.slice(0, 16) || '',
                          effective_to: config.effective_to?.slice(0, 16) || ''
                        });
                        setShowCreateForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeeConfiguration;