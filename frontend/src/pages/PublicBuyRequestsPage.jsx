import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPublicBuyRequestsQuery } from '@/store/api/buyRequests.api';

const PublicBuyRequestsPage = ({ user, onLogin }) => {
  const navigate = useNavigate();

  // Load buy requests using RTK Query
  const { 
    data: buyRequestsData, 
    isLoading: loading, 
    error: queryError 
  } = useGetPublicBuyRequestsQuery({ limit: 10 });

  const requests = buyRequestsData?.items || [];
  
  const error = queryError 
    ? (queryError?.data?.message || queryError?.data?.detail || 'Unable to load buy requests')
    : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buy requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Buy Requests</h1>
          <p className="text-gray-600 mt-1">
            Discover livestock purchase opportunities across South Africa
          </p>
        </div>
        
        {user && user.roles?.includes('buyer') && (
          <button 
            onClick={() => navigate('/enhanced-buy-requests')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Post Buy Request
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          {requests.length} requests found
        </p>
      </div>

      {/* Results Grid */}
      {requests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map(request => (
            <div key={request.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-medium">{request.title}</h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  request.has_target_price ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {request.has_target_price ? 'Budget Set' : 'Open Budget'}
                </span>
              </div>
              
              {/* Species and Product Type Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  request.species === 'cattle' ? 'bg-amber-100 text-amber-800' :
                  request.species === 'poultry' ? 'bg-yellow-100 text-yellow-800' :
                  request.species === 'sheep' ? 'bg-blue-100 text-blue-800' :
                  request.species === 'goats' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.species}
                </span>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">
                  {request.product_type}
                </span>
              </div>
              
              {/* Main Details */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">📦</span> {request.qty} {request.unit}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">📍</span> {request.province}
                  </span>
                </div>
                
                {request.weight_range && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">⚖️</span> 
                    Weight: {request.weight_range.min}-{request.weight_range.max} kg
                  </div>
                )}
                
                {request.age_requirements && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">🎂</span> 
                    Age: {request.age_requirements.min}-{request.age_requirements.max} months
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">💰</span> 
                    {request.offers_count} offers received
                  </span>
                  
                  {request.inspection_allowed && (
                    <span className="text-green-600 text-xs font-medium">
                      ✓ Inspection OK
                    </span>
                  )}
                </div>
              </div>
              
              {/* Vaccination & Certificates */}
              {(request.vaccination_requirements?.length > 0 || request.has_vet_certificates) && (
                <div className="text-xs text-blue-600 mb-3">
                  {request.has_vet_certificates && <span>✓ Vet certificates required </span>}
                  {request.vaccination_requirements?.length > 0 && 
                    <span>✓ Vaccinations: {request.vaccination_requirements.join(', ')}</span>
                  }
                </div>
              )}
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-orange-600">
                  ⏰ Deadline: {new Date(request.deadline_at).toLocaleDateString()}
                </span>
                
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                    View Details
                  </button>
                  <button 
                    onClick={() => {
                      if (!user && onLogin) {
                        onLogin();
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={!user || !user.roles?.includes('seller')}
                  >
                    {!user ? 'Log in to offer' : 'Send Offer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">No buy requests found</h3>
          <p className="text-gray-600 mb-4">
            Check back later for new requests.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicBuyRequestsPage;