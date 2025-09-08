import React from 'react';
import { useNavigate } from 'react-router-dom';

const RelatedGrid = ({ items = [] }) => {
  const navigate = useNavigate();

  if (!items.length) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Similar Listings</h3>
      
      <div className="space-y-3">
        {items.slice(0, 4).map(item => (
          <button
            key={item.id}
            onClick={() => navigate(`/listing/${item.id}`)}
            className="w-full flex items-center space-x-3 p-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm text-left transition-all"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
              {item.media ? (
                <img 
                  src={item.media} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                {item.title}
              </h4>
              <div className="text-sm font-semibold text-green-600">
                {formatPrice(item.price)}
              </div>
              <div className="text-xs text-gray-500">
                {item.province}
              </div>
            </div>
          </button>
        ))}
      </div>

      {items.length > 4 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/marketplace')}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View more similar listings →
          </button>
        </div>
      )}
    </div>
  );
};

export default RelatedGrid;