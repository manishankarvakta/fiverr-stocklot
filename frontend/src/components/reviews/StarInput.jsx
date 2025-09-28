// ⭐ STAR RATING INPUT COMPONENT
// Interactive star rating input for reviews

import React, { useState } from 'react';

const StarInput = ({ 
  name, 
  value = 0, 
  onChange, 
  required = false, 
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };
  
  const handleClick = (rating) => {
    if (!disabled) {
      onChange(rating);
    }
  };
  
  const handleMouseEnter = (rating) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };
  
  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || value);
        
        return (
          <button
            key={star}
            type="button"
            className={`
              ${sizeClasses[size]} 
              transition-colors duration-150
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
              ${isFilled ? 'text-yellow-500' : 'text-gray-300'}
            `}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        );
      })}
      
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
      />
      
      {/* Rating label */}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {value === 1 && "Poor"}
          {value === 2 && "Fair"}
          {value === 3 && "Good"}
          {value === 4 && "Very Good"}
          {value === 5 && "Excellent"}
        </span>
      )}
    </div>
  );
};

export default StarInput;