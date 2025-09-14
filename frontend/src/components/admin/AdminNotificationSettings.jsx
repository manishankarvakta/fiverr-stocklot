import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { toast } from '../ui/toast';
import { Loader2, Bell, Settings, TestTube, Users, Mail, MessageSquare, Smartphone } from 'lucide-react';

const AdminNotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({ buy_request: false, listing: false });
  const [settings, setSettings] = useState({
    enable_broadcast_buy_requests: true,
    enable_broadcast_listings: true,
    default_digest_frequency: 'immediate',
    default_max_per_day: 5,
    default_email_opt_in: true,
    default_inapp_opt_in: true,
    default_push_opt_in: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load settings');
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: "Success",
        description: "Notification settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error", 
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestBroadcast = async (type) => {
    setTesting(prev => ({ ...prev, [type]: true }));
    try {
      const testData = {
        type,
        species: 'Cattle',
        province: 'Gauteng',
        title: type === 'buy_request' ? 'Test Buy Request • Cattle' : 'Test Listing • Cattle',
        url: type === 'buy_request' ? '/buy-requests/TEST' : '/listing/TEST'
      };

      const response = await fetch('/api/admin/notifications/test-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) throw new Error('Test broadcast failed');

      const result = await response.json();
      toast({
        title: "Test Sent",
        description: `Test broadcast enqueued for ${result.enqueued} users. Check Outbox to monitor delivery.`,
      });
    } catch (error) {
      console.error('Error sending test broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to send test broadcast",
        variant: "destructive",
      });
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Notification Settings</h1>
      </div>

      {/* Global Broadcast Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Broadcast Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Broadcast: Buy Requests</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Notify relevant users when a new buy request is posted
                </p>
              </div>
              <Switch
                checked={settings.enable_broadcast_buy_requests}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_broadcast_buy_requests: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Broadcast: Listings</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Notify relevant users when a new listing is posted
                </p>
              </div>
              <Switch
                checked={settings.enable_broadcast_listings}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enable_broadcast_listings: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default User Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Default User Preferences
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These settings are applied to new users when they sign up
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Default Digest Frequency</Label>
              <Select
                value={settings.default_digest_frequency}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, default_digest_frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Notifications per Day</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={settings.default_max_per_day}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, default_max_per_day: parseInt(e.target.value) || 5 }))
                }
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="text-base font-medium">Email Opt-in</Label>
                  <p className="text-xs text-muted-foreground">Default email preference</p>
                </div>
              </div>
              <Switch
                checked={settings.default_email_opt_in}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, default_email_opt_in: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="text-base font-medium">In-App Opt-in</Label>
                  <p className="text-xs text-muted-foreground">Default in-app preference</p>
                </div>
              </div>
              <Switch
                checked={settings.default_inapp_opt_in}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, default_inapp_opt_in: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="text-base font-medium">Push Opt-in</Label>
                  <p className="text-xs text-muted-foreground">Default push preference</p>
                </div>
              </div>
              <Switch
                checked={settings.default_push_opt_in}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, default_push_opt_in: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Broadcasts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Send test notifications to a limited number of active users
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => sendTestBroadcast('buy_request')}
              disabled={testing.buy_request}
            >
              {testing.buy_request ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Test: Buy Request
            </Button>
            
            <Button
              variant="outline"
              onClick={() => sendTestBroadcast('listing')}
              disabled={testing.listing}
            >
              {testing.listing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Test: Listing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;