import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Bell, Mail, MessageCircle, TrendingDown, 
  DollarSign, Package, Clock, Settings,
  Check, AlertTriangle, Info
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const AlertPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    price_alerts: {
      enabled: true,
      email: true,
      push: true,
      threshold_percentage: 10
    },
    stock_alerts: {
      enabled: true,
      email: true,
      push: false,
      low_stock_threshold: 5
    },
    listing_alerts: {
      enabled: true,
      email: false,
      push: true,
      keywords: ['ross 308', 'boer goat', 'dairy cattle']
    },
    marketplace_updates: {
      enabled: false,
      email: true,
      push: false,
      frequency: 'weekly'
    },
    seller_updates: {
      enabled: true,
      email: true,
      push: true,
      order_updates: true,
      review_alerts: true,
      message_alerts: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/settings/alerts`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      } else {
        console.error('Failed to fetch alert preferences');
      }
    } catch (error) {
      console.error('Error fetching alert preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/settings/alerts`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ preferences })
        }
      );

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Alert preferences saved successfully!' });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateKeywords = (keywords) => {
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    updatePreference('listing_alerts', 'keywords', keywordArray);
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access alert preferences.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading alert preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Alert Preferences</h1>
          <p className="text-emerald-700">Customize your notification settings</p>
        </div>
        
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {saving ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg border ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            {saveMessage.text}
          </div>
        </div>
      )}

      {/* Price Alerts */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <TrendingDown className="h-5 w-5 text-emerald-600" />
            Price Drop Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-emerald-800 font-medium">Enable price drop alerts</Label>
              <p className="text-sm text-emerald-600">Get notified when prices drop on items you're watching</p>
            </div>
            <Switch
              checked={preferences.price_alerts.enabled}
              onCheckedChange={(checked) => updatePreference('price_alerts', 'enabled', checked)}
            />
          </div>
          
          {preferences.price_alerts.enabled && (
            <>
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-emerald-100">
                <div className="flex items-center justify-between">
                  <Label className="text-emerald-700">Email notifications</Label>
                  <Switch
                    checked={preferences.price_alerts.email}
                    onCheckedChange={(checked) => updatePreference('price_alerts', 'email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-emerald-700">Push notifications</Label>
                  <Switch
                    checked={preferences.price_alerts.push}
                    onCheckedChange={(checked) => updatePreference('price_alerts', 'push', checked)}
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-emerald-700">Alert threshold</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={preferences.price_alerts.threshold_percentage}
                    onChange={(e) => updatePreference('price_alerts', 'threshold_percentage', parseInt(e.target.value))}
                    className="w-20 border-emerald-200"
                  />
                  <span className="text-sm text-emerald-600">% price drop</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock Alerts (for sellers) */}
      {user.roles?.includes('seller') && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Package className="h-5 w-5 text-emerald-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-emerald-800 font-medium">Enable low stock alerts</Label>
                <p className="text-sm text-emerald-600">Get notified when your livestock inventory is running low</p>
              </div>
              <Switch
                checked={preferences.stock_alerts.enabled}
                onCheckedChange={(checked) => updatePreference('stock_alerts', 'enabled', checked)}
              />
            </div>
            
            {preferences.stock_alerts.enabled && (
              <>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Email notifications</Label>
                    <Switch
                      checked={preferences.stock_alerts.email}
                      onCheckedChange={(checked) => updatePreference('stock_alerts', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Push notifications</Label>
                    <Switch
                      checked={preferences.stock_alerts.push}
                      onCheckedChange={(checked) => updatePreference('stock_alerts', 'push', checked)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-emerald-700">Low stock threshold</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={preferences.stock_alerts.low_stock_threshold}
                      onChange={(e) => updatePreference('stock_alerts', 'low_stock_threshold', parseInt(e.target.value))}
                      className="w-24 border-emerald-200"
                    />
                    <span className="text-sm text-emerald-600">animals remaining</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Listing Alerts (for buyers) */}
      {user.roles?.includes('buyer') && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Bell className="h-5 w-5 text-emerald-600" />
              New Listing Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-emerald-800 font-medium">Enable new listing alerts</Label>
                <p className="text-sm text-emerald-600">Get notified when new listings match your interests</p>
              </div>
              <Switch
                checked={preferences.listing_alerts.enabled}
                onCheckedChange={(checked) => updatePreference('listing_alerts', 'enabled', checked)}
              />
            </div>
            
            {preferences.listing_alerts.enabled && (
              <>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Email notifications</Label>
                    <Switch
                      checked={preferences.listing_alerts.email}
                      onCheckedChange={(checked) => updatePreference('listing_alerts', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Push notifications</Label>
                    <Switch
                      checked={preferences.listing_alerts.push}
                      onCheckedChange={(checked) => updatePreference('listing_alerts', 'push', checked)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-emerald-700">Keywords to watch</Label>
                  <Input
                    value={preferences.listing_alerts.keywords.join(', ')}
                    onChange={(e) => updateKeywords(e.target.value)}
                    placeholder="e.g., ross 308, boer goat, dairy cattle"
                    className="mt-1 border-emerald-200"
                  />
                  <p className="text-xs text-emerald-600 mt-1">Separate multiple keywords with commas</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Marketplace Updates */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <Info className="h-5 w-5 text-emerald-600" />
            Marketplace Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-emerald-800 font-medium">Enable marketplace updates</Label>
              <p className="text-sm text-emerald-600">Receive newsletters with market trends and platform updates</p>
            </div>
            <Switch
              checked={preferences.marketplace_updates.enabled}
              onCheckedChange={(checked) => updatePreference('marketplace_updates', 'enabled', checked)}
            />
          </div>
          
          {preferences.marketplace_updates.enabled && (
            <>
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-emerald-100">
                <div className="flex items-center justify-between">
                  <Label className="text-emerald-700">Email newsletters</Label>
                  <Switch
                    checked={preferences.marketplace_updates.email}
                    onCheckedChange={(checked) => updatePreference('marketplace_updates', 'email', checked)}
                  />
                </div>
                <div>
                  <Label className="text-emerald-700">Frequency</Label>
                  <select
                    value={preferences.marketplace_updates.frequency}
                    onChange={(e) => updatePreference('marketplace_updates', 'frequency', e.target.value)}
                    className="mt-1 px-3 py-2 border border-emerald-200 rounded-lg text-emerald-700 w-full"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Seller-specific Updates */}
      {user.roles?.includes('seller') && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              Business Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-emerald-800 font-medium">Enable business updates</Label>
                <p className="text-sm text-emerald-600">Get notified about orders, reviews, and customer messages</p>
              </div>
              <Switch
                checked={preferences.seller_updates.enabled}
                onCheckedChange={(checked) => updatePreference('seller_updates', 'enabled', checked)}
              />
            </div>
            
            {preferences.seller_updates.enabled && (
              <>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Email notifications</Label>
                    <Switch
                      checked={preferences.seller_updates.email}
                      onCheckedChange={(checked) => updatePreference('seller_updates', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Push notifications</Label>
                    <Switch
                      checked={preferences.seller_updates.push}
                      onCheckedChange={(checked) => updatePreference('seller_updates', 'push', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Order updates</Label>
                    <Switch
                      checked={preferences.seller_updates.order_updates}
                      onCheckedChange={(checked) => updatePreference('seller_updates', 'order_updates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Review alerts</Label>
                    <Switch
                      checked={preferences.seller_updates.review_alerts}
                      onCheckedChange={(checked) => updatePreference('seller_updates', 'review_alerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-emerald-700">Message alerts</Label>
                    <Switch
                      checked={preferences.seller_updates.message_alerts}
                      onCheckedChange={(checked) => updatePreference('seller_updates', 'message_alerts', checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-medium mb-1">About Notifications:</p>
              <ul className="space-y-1 text-emerald-700">
                <li>• Email notifications are sent to your registered email address</li>
                <li>• Push notifications appear in your browser when you're online</li>
                <li>• You can adjust these settings at any time</li>
                <li>• Critical account and security alerts cannot be disabled</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertPreferences;