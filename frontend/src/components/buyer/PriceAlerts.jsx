import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Bell, Plus, X, Edit, TrendingDown, TrendingUp, Package, Search, Filter, Calendar, DollarSign } from 'lucide-react';
// import api from '../../api/client';

const PriceAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadPriceAlerts();
    loadAlertStats();
  }, [filters]);

  const loadPriceAlerts = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/buyer/price-alerts', {
        params: {
          status: filters.status !== 'all' ? filters.status : undefined,
          category: filters.category !== 'all' ? filters.category : undefined,
          search: filters.search || undefined
        }
      });
      
      setAlerts(response.data.alerts || []);
      
    } catch (error) {
      console.error('Error loading price alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlertStats = async () => {
    try {
      const response = await api.get('/buyer/price-alerts/stats');
      setStats(response.data || {});
    } catch (error) {
      console.error('Error loading alert stats:', error);
    }
  };

  const createPriceAlert = async (alertData) => {
    try {
      await api.post('/buyer/price-alerts', alertData);
      await loadPriceAlerts();
      await loadAlertStats();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating price alert:', error);
    }
  };

  const updatePriceAlert = async (alertId, alertData) => {
    try {
      await api.patch(`/buyer/price-alerts/${alertId}`, alertData);
      await loadPriceAlerts();
      await loadAlertStats();
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error updating price alert:', error);
    }
  };

  const deletePriceAlert = async (alertId) => {
    try {
      await api.delete(`/buyer/price-alerts/${alertId}`);
      await loadPriceAlerts();
      await loadAlertStats();
    } catch (error) {
      console.error('Error deleting price alert:', error);
    }
  };

  const getAlertStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      triggered: { label: 'Triggered', color: 'bg-blue-100 text-blue-800' },
      paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriceComparisonIndicator = (alert) => {
    if (!alert.current_price || !alert.target_price) return null;
    
    const difference = alert.current_price - alert.target_price;
    const percentage = (Math.abs(difference) / alert.target_price) * 100;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {difference > 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{percentage.toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-gray-600 mt-1">Get notified when livestock prices reach your target levels</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_alerts || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triggered This Month</p>
                <p className="text-2xl font-bold text-blue-600">{stats.triggered_this_month || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingDown className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-purple-600">R{(stats.potential_savings || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-orange-600">{((stats.success_rate || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="triggered">Triggered</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="poultry">Poultry</option>
              <option value="ruminants">Ruminants</option>
              <option value="pigs">Pigs</option>
              <option value="exotic">Exotic</option>
            </select>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {alerts.length} alerts
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Alert Type & Status */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {alert.alert_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Price Alert'}
                    </span>
                  </div>
                  {getAlertStatusBadge(alert.status)}
                </div>
                
                {/* Listing Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 truncate">{alert.listing_title || alert.search_query}</span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.category}</p>
                  {alert.seller_name && (
                    <p className="text-xs text-gray-500">by {alert.seller_name}</p>
                  )}
                </div>
                
                {/* Price Comparison */}
                <div className="lg:col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Target: </span>
                      <span className="font-medium text-emerald-600">R{alert.target_price.toLocaleString()}</span>
                    </div>
                    {alert.current_price && (
                      <div className="text-sm">
                        <span className="text-gray-600">Current: </span>
                        <span className="font-medium">R{alert.current_price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Price Difference */}
                <div className="lg:col-span-2">
                  {getPriceComparisonIndicator(alert)}
                  {alert.status === 'triggered' && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Alert Triggered!
                    </div>
                  )}
                </div>
                
                {/* Created Date */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                  {alert.expires_at && (
                    <div className="text-xs text-orange-600 mt-1">
                      Expires: {new Date(alert.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="lg:col-span-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePriceAlert(alert.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Alert Conditions */}
              {(alert.conditions || alert.description) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    {alert.description || `Notify when price drops to R${alert.target_price.toLocaleString()} or below`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No price alerts set</h3>
            <p className="text-gray-500 mb-4">
              Create alerts to get notified when livestock prices reach your target levels
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Create Your First Alert
            </button>
          </CardContent>
        </Card>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <CreateAlertModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createPriceAlert}
        />
      )}

      {/* Edit Alert Modal */}
      {selectedAlert && (
        <EditAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onSubmit={(alertData) => updatePriceAlert(selectedAlert.id, alertData)}
        />
      )}
    </div>
  );
};

// Create Alert Modal Component
const CreateAlertModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    alert_type: 'price_drop',
    search_query: '',
    category: '',
    target_price: '',
    listing_id: '',
    expires_at: '',
    email_notifications: true,
    push_notifications: false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        target_price: parseFloat(formData.target_price),
        expires_at: formData.expires_at || null
      });
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Price Alert</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Type
            </label>
            <select
              value={formData.alert_type}
              onChange={(e) => setFormData(prev => ({ ...prev, alert_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="price_drop">Price Drop Alert</option>
              <option value="price_increase">Price Increase Alert</option>
              <option value="availability">Availability Alert</option>
              <option value="new_listing">New Listing Alert</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              required
              value={formData.search_query}
              onChange={(e) => setFormData(prev => ({ ...prev, search_query: e.target.value }))}
              placeholder="e.g., Angus cattle, Broiler chickens"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all-default">All Categories</option>
              <option value="poultry">Poultry</option>
              <option value="ruminants">Ruminants</option>
              <option value="pigs">Pigs</option>
              <option value="exotic">Exotic</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Price (R)
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.target_price}
              onChange={(e) => setFormData(prev => ({ ...prev, target_price: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires On (Optional)
            </label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.email_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, email_notifications: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Email notifications</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.push_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, push_notifications: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Push notifications</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Alert Modal (similar to create but with existing data)
const EditAlertModal = ({ alert, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    alert_type: alert.alert_type || 'price_drop',
    search_query: alert.search_query || '',
    category: alert.category || '',
    target_price: alert.target_price || '',
    expires_at: alert.expires_at ? alert.expires_at.split('T')[0] : '',
    email_notifications: alert.email_notifications ?? true,
    push_notifications: alert.push_notifications ?? false,
    status: alert.status || 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        target_price: parseFloat(formData.target_price),
        expires_at: formData.expires_at || null
      });
    } catch (error) {
      console.error('Error updating alert:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Price Alert</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Price (R)
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.target_price}
              onChange={(e) => setFormData(prev => ({ ...prev, target_price: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires On (Optional)
            </label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.email_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, email_notifications: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Email notifications</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.push_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, push_notifications: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Push notifications</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceAlerts;