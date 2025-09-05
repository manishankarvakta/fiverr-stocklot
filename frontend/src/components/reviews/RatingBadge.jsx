// 🌟 RATING BADGE COMPONENT
// Reusable rating display component for seller ratings

import React from 'react';

const RatingBadge = ({ value, count, size = 'sm', showCount = true }) => {
  const displayValue = value ? value.toFixed(1) : "—";
  const displayCount = count || 0;
  
  // Size variants
  const sizeClasses = {
    xs: 'text-xs gap-1',
    sm: 'text-sm gap-1',
    md: 'text-base gap-2',
    lg: 'text-lg gap-2'
  };
  
  const starSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div className="flex items-center gap-1">
        <svg 
          className={`${starSizes[size]} text-yellow-500 fill-current`}
          viewBox="0 0 24 24"
          aria-label={`${displayValue} out of 5 stars`}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span className="font-medium text-gray-900">
          {displayValue}
        </span>
      </div>
      
      {showCount && (
        <span className="text-gray-500">
          ({displayCount.toLocaleString()})
        </span>
      )}
    </div>
  );
};

export default RatingBadge;