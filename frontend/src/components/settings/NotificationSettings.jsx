import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Bell, Mail, Smartphone, MessageSquare, DollarSign,
  Package, Star, AlertTriangle, Save, Check
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    email_notifications: {
      orders: true,
      price_alerts: true,
      messages: true,
      listings: true,
      reviews: false,
      marketing: false
    },
    push_notifications: {
      orders: true,
      price_alerts: false,
      messages: true,
      listings: false,
      reviews: false
    },
    sms_notifications: {
      orders: false,
      urgent_only: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/settings/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/settings/notifications`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ settings })
        }
      );

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Notification Settings</h1>
          <p className="text-emerald-700">Manage how you receive notifications</p>
        </div>
        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : saveSuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Order Updates</Label>
                <p className="text-sm text-gray-600">Order confirmations, shipping updates, delivery notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.email_notifications.orders}
              onCheckedChange={(checked) => updateSetting('email_notifications', 'orders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Price Alerts</Label>
                <p className="text-sm text-gray-600">When livestock prices drop or match your criteria</p>
              </div>
            </div>
            <Switch
              checked={settings.email_notifications.price_alerts}
              onCheckedChange={(checked) => updateSetting('email_notifications', 'price_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Messages</Label>
                <p className="text-sm text-gray-600">New messages from buyers or sellers</p>
              </div>
            </div>
            <Switch
              checked={settings.email_notifications.messages}
              onCheckedChange={(checked) => updateSetting('email_notifications', 'messages', checked)}
            />
          </div>

          {user.roles?.includes('seller') && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Listing Updates</Label>
                  <p className="text-sm text-gray-600">Views, inquiries, and listing performance</p>
                </div>
              </div>
              <Switch
                checked={settings.email_notifications.listings}
                onCheckedChange={(checked) => updateSetting('email_notifications', 'listings', checked)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Reviews & Ratings</Label>
                <p className="text-sm text-gray-600">New reviews and rating notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.email_notifications.reviews}
              onCheckedChange={(checked) => updateSetting('email_notifications', 'reviews', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Marketing & Promotions</Label>
                <p className="text-sm text-gray-600">Special offers, new features, and market insights</p>
              </div>
            </div>
            <Switch
              checked={settings.email_notifications.marketing}
              onCheckedChange={(checked) => updateSetting('email_notifications', 'marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Order Updates</Label>
                <p className="text-sm text-gray-600">Instant notifications for order status changes</p>
              </div>
            </div>
            <Switch
              checked={settings.push_notifications.orders}
              onCheckedChange={(checked) => updateSetting('push_notifications', 'orders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Price Alerts</Label>
                <p className="text-sm text-gray-600">Real-time price drop notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.push_notifications.price_alerts}
              onCheckedChange={(checked) => updateSetting('push_notifications', 'price_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Messages</Label>
                <p className="text-sm text-gray-600">Instant message notifications</p>
              </div>
            </div>
            <Switch
              checked={settings.push_notifications.messages}
              onCheckedChange={(checked) => updateSetting('push_notifications', 'messages', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            SMS Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Order Confirmations</Label>
                <p className="text-sm text-gray-600">SMS confirmations for important order updates</p>
              </div>
            </div>
            <Switch
              checked={settings.sms_notifications.orders}
              onCheckedChange={(checked) => updateSetting('sms_notifications', 'orders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="font-medium">Urgent Notifications Only</Label>
                <p className="text-sm text-gray-600">Only receive SMS for critical updates</p>
              </div>
            </div>
            <Switch
              checked={settings.sms_notifications.urgent_only}
              onCheckedChange={(checked) => updateSetting('sms_notifications', 'urgent_only', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Notification Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Enable order updates to stay informed about your transactions</li>
                <li>• Price alerts help you find the best deals on livestock</li>
                <li>• SMS notifications ensure you don't miss urgent updates</li>
                <li>• You can always update these preferences later</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;