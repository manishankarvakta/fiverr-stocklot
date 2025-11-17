import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Switch } from '../ui';
import { Settings, ToggleLeft, ToggleRight, Percent } from 'lucide-react';
import api from '../../api/client';

const AdminFeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const response = await api.get('/admin/feature-flags');
      setFlags(response.data.flags);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFlag = async (flagKey, enabled, rolloutPercent = null) => {
    setUpdating({ ...updating, [flagKey]: true });
    
    try {
      await api.put(`/admin/feature-flags/${flagKey}`, {
        enabled,
        rollout_percent: rolloutPercent
      });
      
      await fetchFlags(); // Refresh
    } catch (error) {
      console.error('Error updating feature flag:', error);
      alert(error.response?.data?.detail || 'Failed to update feature flag');
    } finally {
      setUpdating({ ...updating, [flagKey]: false });
    }
  };

  const getFeatureDescription = (key) => {
    const descriptions = {
      'ff.group_buy': 'Group Buying / Bill Splitting - Allow multiple buyers to jointly purchase livestock',
      'ff.auction': 'Auction Mode - Real-time bidding system for listings',
      'ff.transport': 'Transport Integration - Quote and book livestock transport',
      'ff.insurance': 'Insurance Toggle - Mortality-in-transit insurance options',
      'ff.finance': 'Micro-credit Financing - Buy now, pay later functionality',
      'ff.price_guidance': 'AI Price Guidance - Smart price recommendations',
      'ff.matching_alerts': 'Smart Matching - AI-powered buyer-seller matching',
      'ff.trust_engine': 'Trust Score System - Reputation and risk assessment',
      'ff.referrals': 'Referral Program - User referral rewards system',
      'ff.vet_check': 'Digital Vet Check - Online veterinary verification',
      'ff.export_dashboard': 'Export Dashboard - International trade compliance',
      'ff.multilingual': 'Multi-language Support - Afrikaans, Zulu, Xhosa support'
    };
    return descriptions[key] || 'Feature flag description';
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feature Flags Management</h2>
        <Button onClick={fetchFlags} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.key}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {flag.key}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {getFeatureDescription(flag.key)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={flag.enabled ? "default" : "secondary"}
                    className={flag.enabled ? "bg-green-500" : "bg-gray-400"}
                  >
                    {flag.enabled ? "ON" : "OFF"}
                  </Badge>
                  {flag.meta?.rollout_percent > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      <Percent className="h-3 w-3 mr-1" />
                      {flag.meta.rollout_percent}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => updateFlag(flag.key, enabled)}
                    disabled={updating[flag.key]}
                  />
                  <span className="text-sm">
                    {flag.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                
                {updating[flag.key] && (
                  <div className="text-sm text-gray-500">Updating...</div>
                )}
              </div>

              {/* Rollout Percentage Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rollout Percentage</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={flag.meta?.rollout_percent || 0}
                    onChange={(e) => {
                      const percent = parseInt(e.target.value);
                      updateFlag(flag.key, flag.enabled, percent);
                    }}
                    className="flex-1"
                    disabled={updating[flag.key]}
                  />
                  <span className="text-sm w-12 text-center">
                    {flag.meta?.rollout_percent || 0}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Controls what percentage of users see this feature when enabled
                </p>
              </div>

              {/* Metadata */}
              {flag.meta && Object.keys(flag.meta).length > 0 && (
                <div className="text-xs text-gray-500">
                  <div className="font-semibold">Metadata:</div>
                  <pre className="mt-1 bg-gray-50 p-2 rounded">
                    {JSON.stringify(flag.meta, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Last updated: {new Date(flag.updated_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {flags.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">No feature flags found</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminFeatureFlags;