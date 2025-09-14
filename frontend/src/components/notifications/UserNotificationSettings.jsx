import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { toast } from '../ui/toast';
import { 
  Loader2, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Settings,
  Heart,
  MapPin
} from 'lucide-react';

const UserNotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  const [preferences, setPreferences] = useState({
    email_global: true,
    push_global: false,
    inapp_global: true,
    email_new_listing: true,
    email_buy_request: true,
    digest_frequency: 'immediate',
    species_interest: [],
    provinces_interest: [],
    max_per_day: 5,
  });

  const [availableSpecies, setAvailableSpecies] = useState([]);
  const [availableProvinces, setAvailableProvinces] = useState([]);

  useEffect(() => {
    loadPreferences();
    loadOptions();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/me/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load preferences');
      
      const data = await response.json();
      setPreferences(data.data || preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      // Load available species and provinces
      const [speciesRes, provincesRes] = await Promise.all([
        fetch('/api/preferences/species'),
        fetch('/api/preferences/provinces')
      ]);
      
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        setAvailableSpecies(speciesData.species || []);
      }
      
      if (provincesRes.ok) {
        const provincesData = await provincesRes.json();
        setAvailableProvinces(provincesData.provinces || []);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/me/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save preferences');
      }

      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleInterest = (list, item) => {
    const currentList = preferences[list] || [];
    const newList = currentList.includes(item)
      ? currentList.filter(x => x !== item)
      : [...currentList, item];
    
    updatePreference(list, newList);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Notification Settings</h1>
      </div>
      
      <p className="text-muted-foreground">
        Customize how and when you receive notifications about new listings and buy requests.
      </p>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="text-base font-medium">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Order updates, new listings & requests
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_global}
                onCheckedChange={(checked) => updatePreference('email_global', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="text-base font-medium">In-app alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Bell icon & notification inbox
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.inapp_global}
                onCheckedChange={(checked) => updatePreference('inapp_global', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="text-base font-medium">Push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Browser/mobile notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_global}
                onCheckedChange={(checked) => updatePreference('push_global', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What to Receive */}
      <Card>
        <CardHeader>
          <CardTitle>What to Receive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">New Listings</Label>
                <p className="text-sm text-muted-foreground">
                  When livestock matching your interests is available
                </p>
              </div>
              <Switch
                checked={preferences.email_new_listing}
                onCheckedChange={(checked) => updatePreference('email_new_listing', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">New Buy Requests</Label>
                <p className="text-sm text-muted-foreground">
                  When buyers are looking for livestock you might have
                </p>
              </div>
              <Switch
                checked={preferences.email_buy_request}
                onCheckedChange={(checked) => updatePreference('email_buy_request', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Frequency & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Digest Frequency</Label>
              <Select
                value={preferences.digest_frequency}
                onValueChange={(value) => updatePreference('digest_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                  <SelectItem value="off">Turn Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max notifications per day</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={preferences.max_per_day}
                onChange={(e) => updatePreference('max_per_day', parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Your Interests
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Only receive notifications for livestock you're interested in. Leave empty to receive all.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!loadingOptions && (
            <>
              {/* Species Interests */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Species</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSpecies.map(species => (
                    <button
                      key={species}
                      onClick={() => toggleInterest('species_interest', species)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        (preferences.species_interest || []).includes(species)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {species}
                    </button>
                  ))}
                </div>
              </div>

              {/* Province Interests */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Provinces
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableProvinces.map(province => (
                    <button
                      key={province}
                      onClick={() => toggleInterest('provinces_interest', province)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        (preferences.provinces_interest || []).includes(province)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {province}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-between items-center pt-4">
        <p className="text-sm text-muted-foreground">
          Changes apply to future notifications
        </p>
        <Button onClick={savePreferences} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default UserNotificationSettings;