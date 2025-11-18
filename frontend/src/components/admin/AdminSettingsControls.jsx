import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Switch, Label, Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea
} from '../ui';
import { 
  Settings, Save, RefreshCw, AlertTriangle, CheckCircle, Zap, Shield, Globe,
  Smartphone, Share2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, 
  Youtube, Linkedin, DollarSign, Percent
} from 'lucide-react';

// import api from '../../utils/apiHelper';
export default function AdminSettingsControls() {
  // Original functionality state
  const [flags, setFlags] = useState({});
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});

  // New social media and app settings state
  const [platformSettings, setPlatformSettings] = useState({
    // General Settings
    siteName: 'StockLot',
    siteDescription: 'South Africa\'s Premier Livestock Marketplace',
    supportEmail: 'hello@stocklot.farm',
    supportPhone: '',
    businessAddress: '',
    
    // Commission Settings
    platformCommissionPercent: 5.0,
    sellerPayoutFeePercent: 2.5,
    buyerProcessingFeePercent: 1.5,
    escrowServiceFee: 25.00,
    
    // Social Media Links
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    
    // App Download Links
    androidAppUrl: '',
    iosAppUrl: '',
    appStoreVisible: false,
    
    // Business Settings
    deliveryOnlyMode: false,
    guestCheckoutEnabled: true,
    autoListingApproval: false,
    escrowAutoReleaseDays: 7,
    
    // Contact Information
    whatsappNumber: '',
    telegramChannel: '',
    businessHours: 'Mon-Fri: 8:00 AM - 6:00 PM',
    
    // Feature Flags
    auctionsEnabled: false,
    buyRequestsEnabled: true,
    messagingEnabled: true,
    geofencingEnabled: true,
    
    // Map & Location Settings
    mapboxToken: 'pk.eyJ1Ijoiem9vbWExIiwiYSI6ImNtZXZycjdiNjBsc3gydXNoam4wYjR2eDMifQ.nrmfIILUZdyGr2utPghKyQ',
    enableMapFeatures: true,
    
    // Payment Settings
    paystackPublicKey: '',
    paystackSecretKey: '',
    paystackDemoMode: true
  });

  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchConfig();
    fetchPlatformSettings();
  }, []);

  // Original functionality methods
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/config');
      setFlags(response.data.flags || {});
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error('Error fetching config:', error);
      setFlags({});
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  const updateFlag = async (flagKey, value) => {
    try {
      const response = await api.patch(`/admin/flags/${flagKey}`, { value });
      if (response.data.success) {
        setFlags(prev => ({ ...prev, [flagKey]: value }));
        setChanges(prev => ({ ...prev, [flagKey]: value }));
      }
    } catch (error) {
      console.error('Error updating flag:', error);
    }
  };

  const updateSetting = async (settingKey, value, isPublic = false) => {
    try {
      const response = await api.patch(`/admin/settings/${settingKey}`, { value });
      if (response.data.success) {
        setSettings(prev => ({ ...prev, [settingKey]: value }));
        setChanges(prev => ({ ...prev, [settingKey]: value }));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  // New platform settings methods
  const fetchPlatformSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlatformSettings(prev => ({
          ...prev,
          ...data
        }));
      } else {
        console.error('Failed to fetch platform settings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    }
  };

  const savePlatformSettings = async () => {
    try {
      setSaving(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(platformSettings)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Platform settings saved successfully!');
        } else {
          alert('Failed to save settings: ' + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert('Failed to save platform settings: ' + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error('Error saving platform settings:', error);
      alert('Failed to save platform settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePlatformSetting = (key, value) => {
    setPlatformSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Platform Settings & Controls</h2>
          <p className="text-emerald-600">Manage feature flags, commissions, and platform configuration</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastSaved && (
            <span className="text-sm text-emerald-600">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={fetchConfig} 
            disabled={loading}
            variant="outline"
            className="border-emerald-200 hover:bg-emerald-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={savePlatformSettings} 
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flags" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="apps">App Downloads</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        {/* Feature Flags Tab */}
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <Zap className="h-5 w-5 mr-2" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(flags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-emerald-100 rounded-lg">
                    <div>
                      <Label className="font-medium text-emerald-900">{key.replace(/_/g, ' ').toUpperCase()}</Label>
                      <p className="text-sm text-emerald-600">Feature flag control</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={value ? "default" : "secondary"} className={value ? "bg-emerald-100 text-emerald-800" : ""}>
                        {value ? 'ENABLED' : 'DISABLED'}
                      </Badge>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => updateFlag(key, checked)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                ))}
                
                {Object.keys(flags).length === 0 && (
                  <div className="text-center py-8 text-emerald-600">
                    No feature flags configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings Tab */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <DollarSign className="h-5 w-5 mr-2" />
                Platform Commissions & Fees
              </CardTitle>
              <CardDescription>Configure marketplace commission rates and processing fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platformCommission" className="flex items-center">
                    <Percent className="h-4 w-4 mr-2 text-emerald-600" />
                    Platform Commission (%)
                  </Label>
                  <Input
                    id="platformCommission"
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={platformSettings.platformCommissionPercent}
                    onChange={(e) => updatePlatformSetting('platformCommissionPercent', parseFloat(e.target.value))}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage taken from successful sales</p>
                </div>

                <div>
                  <Label htmlFor="sellerPayoutFee">Seller Payout Fee (%)</Label>
                  <Input
                    id="sellerPayoutFee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={platformSettings.sellerPayoutFeePercent}
                    onChange={(e) => updatePlatformSetting('sellerPayoutFeePercent', parseFloat(e.target.value))}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fee charged for seller payouts</p>
                </div>

                <div>
                  <Label htmlFor="buyerProcessingFee">Buyer Processing Fee (%)</Label>
                  <Input
                    id="buyerProcessingFee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={platformSettings.buyerProcessingFeePercent}
                    onChange={(e) => updatePlatformSetting('buyerProcessingFeePercent', parseFloat(e.target.value))}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Processing fee added to buyer checkout</p>
                </div>

                <div>
                  <Label htmlFor="escrowServiceFee">Escrow Service Fee (R)</Label>
                  <Input
                    id="escrowServiceFee"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={platformSettings.escrowServiceFee}
                    onChange={(e) => updatePlatformSetting('escrowServiceFee', parseFloat(e.target.value))}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fixed fee for escrow protection service</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-semibold text-emerald-900 mb-2">Commission Preview</h4>
                <p className="text-sm text-emerald-700">
                  For a R1,000 livestock sale:
                </p>
                <ul className="text-sm text-emerald-600 mt-2 space-y-1">
                  <li>• Platform commission: R{(1000 * (platformSettings.platformCommissionPercent / 100)).toFixed(2)}</li>
                  <li>• Seller payout fee: R{(1000 * (platformSettings.sellerPayoutFeePercent / 100)).toFixed(2)}</li>
                  <li>• Buyer processing fee: R{(1000 * (platformSettings.buyerProcessingFeePercent / 100)).toFixed(2)}</li>
                  <li>• Escrow service fee: R{platformSettings.escrowServiceFee}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <Settings className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
              <CardDescription>Basic platform information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={platformSettings.siteName}
                    onChange={(e) => updatePlatformSetting('siteName', e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e) => updatePlatformSetting('supportEmail', e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={platformSettings.siteDescription}
                  onChange={(e) => updatePlatformSetting('siteDescription', e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <div className="flex">
                    <Phone className="h-4 w-4 mt-3 mr-2 text-emerald-600" />
                    <Input
                      id="supportPhone"
                      value={platformSettings.supportPhone}
                      onChange={(e) => updatePlatformSetting('supportPhone', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={platformSettings.whatsappNumber}
                    onChange={(e) => updatePlatformSetting('whatsappNumber', e.target.value)}
                    placeholder="+27 123 456 789"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Business Address</Label>
                <div className="flex">
                  <MapPin className="h-4 w-4 mt-3 mr-2 text-emerald-600" />
                  <Input
                    id="businessAddress"
                    value={platformSettings.businessAddress}
                    onChange={(e) => updatePlatformSetting('businessAddress', e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <Share2 className="h-5 w-5 mr-2" />
                Social Media Links
              </CardTitle>
              <CardDescription>Add your social media profiles to display in the footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="facebookUrl" className="flex items-center">
                    <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                    Facebook Page URL
                  </Label>
                  <Input
                    id="facebookUrl"
                    value={platformSettings.facebookUrl}
                    onChange={(e) => updatePlatformSetting('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/your-page"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="twitterUrl" className="flex items-center">
                    <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                    Twitter/X Profile URL
                  </Label>
                  <Input
                    id="twitterUrl"
                    value={platformSettings.twitterUrl}
                    onChange={(e) => updatePlatformSetting('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/your-handle"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="instagramUrl" className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                    Instagram Profile URL
                  </Label>
                  <Input
                    id="instagramUrl"
                    value={platformSettings.instagramUrl}
                    onChange={(e) => updatePlatformSetting('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/your-handle"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="youtubeUrl" className="flex items-center">
                    <Youtube className="h-4 w-4 mr-2 text-red-600" />
                    YouTube Channel URL
                  </Label>
                  <Input
                    id="youtubeUrl"
                    value={platformSettings.youtubeUrl}
                    onChange={(e) => updatePlatformSetting('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/your-channel"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedinUrl" className="flex items-center">
                    <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                    LinkedIn Profile URL
                  </Label>
                  <Input
                    id="linkedinUrl"
                    value={platformSettings.linkedinUrl}
                    onChange={(e) => updatePlatformSetting('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/company/your-company"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Downloads Tab */}
        <TabsContent value="apps">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <Smartphone className="h-5 w-5 mr-2" />
                Mobile App Downloads
              </CardTitle>
              <CardDescription>Configure mobile app download links for your marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="appStoreVisible"
                  checked={platformSettings.appStoreVisible}
                  onCheckedChange={(checked) => updatePlatformSetting('appStoreVisible', checked)}
                />
                <Label htmlFor="appStoreVisible">Show app download links in footer</Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="androidAppUrl">Google Play Store URL</Label>
                  <Input
                    id="androidAppUrl"
                    value={platformSettings.androidAppUrl}
                    onChange={(e) => updatePlatformSetting('androidAppUrl', e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=your.app"
                    className="border-emerald-200 focus:border-emerald-500"
                    disabled={!platformSettings.appStoreVisible}
                  />
                </div>

                <div>
                  <Label htmlFor="iosAppUrl">Apple App Store URL</Label>
                  <Input
                    id="iosAppUrl"
                    value={platformSettings.iosAppUrl}
                    onChange={(e) => updatePlatformSetting('iosAppUrl', e.target.value)}
                    placeholder="https://apps.apple.com/app/your-app/id123456789"
                    className="border-emerald-200 focus:border-emerald-500"
                    disabled={!platformSettings.appStoreVisible}
                  />
                </div>
              </div>

              {platformSettings.appStoreVisible && (platformSettings.androidAppUrl || platformSettings.iosAppUrl) && (
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-700 mb-2">Preview:</p>
                  <div className="flex space-x-2">
                    {platformSettings.androidAppUrl && (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        📱 Google Play
                      </Badge>
                    )}
                    {platformSettings.iosAppUrl && (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        📱 App Store
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <Globe className="h-5 w-5 mr-2" />
                Payment Configuration
              </CardTitle>
              <CardDescription>Configure Paystack payment processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Never share your secret keys. Keep them secure.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="paystackDemoMode"
                  checked={platformSettings.paystackDemoMode}
                  onCheckedChange={(checked) => updatePlatformSetting('paystackDemoMode', checked)}
                />
                <Label htmlFor="paystackDemoMode">Demo Mode (for testing)</Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="paystackPublicKey">Paystack Public Key</Label>
                  <Input
                    id="paystackPublicKey"
                    value={platformSettings.paystackPublicKey}
                    onChange={(e) => updatePlatformSetting('paystackPublicKey', e.target.value)}
                    placeholder={platformSettings.paystackDemoMode ? "pk_test_..." : "pk_live_..."}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="paystackSecretKey">Paystack Secret Key</Label>
                  <Input
                    id="paystackSecretKey"
                    type="password"
                    value={platformSettings.paystackSecretKey}
                    onChange={(e) => updatePlatformSetting('paystackSecretKey', e.target.value)}
                    placeholder={platformSettings.paystackDemoMode ? "sk_test_..." : "sk_live_..."}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-900">
                <Settings className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-emerald-100 rounded-lg">
                    <div>
                      <Label className="font-medium text-emerald-900">{key.replace(/_/g, ' ').toUpperCase()}</Label>
                      <p className="text-sm text-emerald-600">Current: {String(value)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={String(value)}
                        onChange={(e) => updateSetting(key, e.target.value)}
                        className="w-48 border-emerald-200 focus:border-emerald-500"
                        disabled={saving}
                      />
                    </div>
                  </div>
                ))}
                
                {Object.keys(settings).length === 0 && (
                  <div className="text-center py-8 text-emerald-600">
                    No system settings configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Changes */}
      {Object.keys(changes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-900">
              <CheckCircle className="h-5 w-5 mr-2" />
              Recent Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(changes).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-emerald-700">{key}</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    Updated to: {String(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}