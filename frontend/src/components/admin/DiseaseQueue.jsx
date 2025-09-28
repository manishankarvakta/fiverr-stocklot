import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { MapPin, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import adminApi from '../../api/adminClient';

const DiseaseQueue = () => {
  const [zones, setZones] = useState([]);
  const [changes, setChanges] = useState([]);
  const [selectedChange, setSelectedChange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesResponse, changesResponse] = await Promise.all([
        adminApi.get('/admin/disease/zones'),
        adminApi.get('/admin/disease/changes?status=PENDING')
      ]);
      
      setZones(zonesResponse.data.rows || []);
      setChanges(changesResponse.data.rows || []);
    } catch (error) {
      console.error('Error loading disease zone data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChangeDetail = async (changeId) => {
    try {
      const response = await adminApi.get(`/admin/disease/changes/${changeId}`);
      setSelectedChange(response.data.change);
    } catch (error) {
      console.error('Error loading change detail:', error);
    }
  };

  const handleAction = async (changeId, action) => {
    setActionLoading(true);
    try {
      const reason = action === 'reject' ? 
        prompt('Please provide a reason for rejection:') : undefined;
      
      if (action === 'reject' && !reason) return;

      const endpoint = `/admin/disease/changes/${changeId}/${action}`;
      const body = action === 'reject' ? { reason } : {};

      await adminApi.post(endpoint, body);
      
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      alert(`Disease zone change ${actionText} successfully!`);
      
      // Reload data
      await loadData();
      setSelectedChange(null);
      
    } catch (error) {
      console.error(`Error ${action}ing change:`, error);
      alert(`Failed to ${action} change. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pending Changes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pending Disease Zone Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading changes...</div>
          ) : (
            <div className="space-y-3">
              {changes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending changes
                </div>
              ) : (
                changes.map((change) => (
                  <div
                    key={change.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadChangeDetail(change.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{change.zone_name}</h4>
                        <p className="text-sm text-gray-600">
                          Proposed by: {change.proposer}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(change.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(change.status)}>
                          {change.status}
                        </Badge>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Preview & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Change Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedChange ? (
            <div className="text-center py-8 text-gray-500">
              Select a change to preview
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{selectedChange.zone_name}</h4>
                <p className="text-sm text-gray-600">
                  Change ID: {selectedChange.id}
                </p>
              </div>

              {selectedChange.change_reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Change
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedChange.change_reason}
                  </p>
                </div>
              )}

              {/* GeoJSON Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Polygon
                </label>
                <div className="h-64 border rounded-lg overflow-hidden bg-gray-50">
                  {selectedChange.geojson ? (
                    <div className="p-4 h-full overflow-auto">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(selectedChange.geojson, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No polygon data available
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Approving this change will update the disease zone polygon and notify 
                affected sellers. Listings within the new area may be auto-suspended 
                based on current policies.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction(selectedChange.id, 'approve')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Change
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => handleAction(selectedChange.id, 'reject')}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Change
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Disease Zones Overview */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Disease Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{zone.name}</h4>
                  <Badge className={getStatusColor(zone.status)}>
                    {zone.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Region:</strong> {zone.region || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Authority:</strong> {zone.authority || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Disease:</strong> {zone.disease_type || 'N/A'}
                </p>
              </div>
            ))}
          </div>
          
          {zones.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No disease zones configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiseaseQueue;