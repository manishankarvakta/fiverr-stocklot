import React from 'react';
import { useNavigate } from 'react-router-dom';

const SellerCard = ({ seller, listingId }) => {
  const navigate = useNavigate();

  if (!seller) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {seller.avatar ? (
            <img 
              src={seller.avatar} 
              alt={seller.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{seller.name}</h3>
              {seller.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mt-1">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span>{seller.rating?.toFixed(1) || '—'}</span>
                <span>•</span>
                <span>{seller.review_count} review{seller.review_count === 1 ? '' : 's'}</span>
                <span>•</span>
                <span>{seller.years_active}+ years</span>
              </div>
            </div>

            {/* Contact Information */}
            {seller.contact && (
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <div>📞 {seller.contact.phone_masked || 'Phone hidden'}</div>
                <div>✉️ {seller.contact.email_masked || 'Email hidden'}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => navigate(`/seller/${seller.handle}`)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerCard;