import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PublicBuyRequestsPage = ({ user, onLogin }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Load buy requests
  useEffect(() => {
    const loadBuyRequests = async () => {
      try {
        console.log('Loading buy requests from:', `${BACKEND_URL}/api/public/buy-requests`);
        
        const response = await fetch(`${BACKEND_URL}/api/public/buy-requests?limit=10`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Buy requests loaded:', data);
        
        setRequests(data.items || []);
        setError(null);
        
      } catch (error) {
        console.error('Error loading buy requests:', error);
        setError(`Failed to load buy requests: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadBuyRequests();
  }, []);

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
              
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
                <span>📦 {request.qty} {request.unit}</span>
                <span>📍 {request.province}</span>
                <span>👁️ {request.offers_count} offers</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">
                  ⏰ Deadline: {new Date(request.deadline_at).toLocaleDateString()}
                </span>
                
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                    View Details
                  </button>
                  <button 
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