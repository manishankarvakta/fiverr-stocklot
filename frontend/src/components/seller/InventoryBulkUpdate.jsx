import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Upload, Download, CheckCircle, AlertTriangle, Package, FileText } from 'lucide-react';
// import api from '../../api/client';

const InventoryBulkUpdate = () => {
  const [listings, setListings] = useState([]);
  const [selectedListings, setSelectedListings] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkData, setBulkData] = useState({
    price_adjustment: 0,
    quantity_adjustment: 0,
    status: '',
    category: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updateResults, setUpdateResults] = useState(null);

  useEffect(() => {
    loadSellerListings();
  }, []);

  const loadSellerListings = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/seller/listings');
      setListings(response.data.listings || []);
      
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleListingSelection = (listingId) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const selectAllListings = () => {
    if (selectedListings.size === listings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(listings.map(l => l.id)));
    }
  };

  const performBulkUpdate = async () => {
    if (selectedListings.size === 0) {
      alert('Please select listings to update');
      return;
    }

    try {
      setUploading(true);
      
      const updatePayload = {
        listing_ids: Array.from(selectedListings),
        action: bulkAction,
        data: bulkData
      };
      
      const response = await api.post('/seller/inventory/bulk-update', updatePayload);
      
      setUpdateResults(response.data);
      await loadSellerListings(); // Refresh listings
      setSelectedListings(new Set()); // Clear selections
      
    } catch (error) {
      console.error('Error performing bulk update:', error);
      alert('Failed to perform bulk update');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/seller/inventory/bulk-template', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inventory_bulk_template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const uploadCSV = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/seller/inventory/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUpdateResults(response.data);
      await loadSellerListings();
      
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Failed to upload CSV file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      uploadCSV(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Inventory Management</h1>
        <p className="text-gray-600 mt-1">Update multiple listings at once to save time</p>
      </div>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CSV Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a CSV file to update multiple listings at once
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Processing upload...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bulk Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all-default">Select action...</option>
                  <option value="price_update">Update Prices</option>
                  <option value="quantity_update">Update Quantities</option>
                  <option value="status_update">Update Status</option>
                  <option value="category_update">Update Category</option>
                </select>
              </div>

              {bulkAction === 'price_update' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Price Adjustment (%)</label>
                  <input
                    type="number"
                    value={bulkData.price_adjustment}
                    onChange={(e) => setBulkData(prev => ({ ...prev, price_adjustment: parseFloat(e.target.value) }))}
                    placeholder="e.g., 10 for 10% increase, -5 for 5% decrease"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {bulkAction === 'quantity_update' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity Adjustment</label>
                  <input
                    type="number"
                    value={bulkData.quantity_adjustment}
                    onChange={(e) => setBulkData(prev => ({ ...prev, quantity_adjustment: parseInt(e.target.value) }))}
                    placeholder="e.g., 50 to add 50 units, -10 to reduce by 10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {bulkAction === 'status_update' && (
                <div>
                  <label className="block text-sm font-medium mb-2">New Status</label>
                  <select
                    value={bulkData.status}
                    onChange={(e) => setBulkData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all-default">Select status...</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              )}

              <button
                onClick={performBulkUpdate}
                disabled={!bulkAction || selectedListings.size === 0 || uploading}
                className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply to {selectedListings.size} Selected
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Results */}
      {updateResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Update Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Successfully updated: {updateResults.success_count} listings</span>
              </div>
              
              {updateResults.error_count > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Failed to update: {updateResults.error_count} listings</span>
                </div>
              )}
              
              {updateResults.errors && updateResults.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {updateResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Listings ({listings.length})</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedListings.size === listings.length && listings.length > 0}
                  onChange={selectAllListings}
                  className="rounded"
                />
                Select All
              </label>
              <span className="text-sm text-gray-600">
                {selectedListings.size} selected
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 w-12"></th>
                  <th className="text-left py-3">Listing</th>
                  <th className="text-left py-3">Category</th>
                  <th className="text-left py-3">Quantity</th>
                  <th className="text-left py-3">Price</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Views</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedListings.has(listing.id)}
                        onChange={() => toggleListingSelection(listing.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                          {listing.images && listing.images[0] ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-gray-500 text-xs">{listing.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {listing.category}
                      </span>
                    </td>
                    <td className="py-3">{listing.quantity} {listing.unit}</td>
                    <td className="py-3 font-medium">R{listing.price?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        listing.status === 'active' ? 'bg-green-100 text-green-800' :
                        listing.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{listing.views || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {listings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No listings found. Create your first listing to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryBulkUpdate;