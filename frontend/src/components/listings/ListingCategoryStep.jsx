import React, { useEffect, useState } from "react";

/**
 * 📝 Listing Creation - Category Selection Step
 * Clean category selection with exotic toggle for listing creation
 */
export function ListingCategoryStep({ value, onChange, onValidation }) {
  const [showExotic, setShowExotic] = useState(false);
  const [coreCategories, setCoreCategories] = useState([]);
  const [exoticCategories, setExoticCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch core categories on mount
  useEffect(() => {
    const fetchCoreCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/taxonomy/categories?mode=core');
        if (!response.ok) throw new Error('Failed to fetch core categories');
        const data = await response.json();
        setCoreCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching core categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoreCategories();
  }, []);

  // Fetch exotic categories when toggle is enabled
  useEffect(() => {
    if (showExotic && exoticCategories.length === 0) {
      const fetchExoticCategories = async () => {
        try {
          const response = await fetch('/api/taxonomy/categories?mode=exotic');
          if (!response.ok) throw new Error('Failed to fetch exotic categories');
          const data = await response.json();
          setExoticCategories(data);
        } catch (err) {
          console.error('Error fetching exotic categories:', err);
          setError(err.message);
        }
      };

      fetchExoticCategories();
    }
  }, [showExotic, exoticCategories.length]);

  // Validation effect  
  useEffect(() => {
    if (onValidation) {
      onValidation(!!value);
    }
  }, [value, onValidation]);

  const handleCategorySelect = (categoryName) => {
    onChange(categoryName);
  };

  const allCategories = [...coreCategories, ...(showExotic ? exoticCategories : [])];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-600">
        <p>Error loading categories: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with exotic toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Select Category</h3>
          <p className="text-sm text-gray-500 mt-1">Choose the category that best fits your livestock</p>
        </div>
        
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showExotic}
            onChange={(e) => setShowExotic(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm text-gray-700">Show Exotic & Specialty</span>
        </label>
      </div>

      {/* Category selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allCategories.map(category => {
          const isSelected = value === category.name;
          const isExotic = exoticCategories.some(ec => ec.id === category.id);
          
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategorySelect(category.name)}
              className={`
                relative border rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {category.name}
                  </h4>
                  {category.description && (
                    <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                      {category.description}
                    </p>
                  )}
                </div>
                
                {/* Exotic badge */}
                {isExotic && (
                  <span className="ml-2 flex-shrink-0 inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                    Specialty
                  </span>
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Exotic warning */}
      {showExotic && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">
                Important: Specialty Livestock Requirements
              </h4>
              <div className="mt-2 text-sm text-amber-700">
                <p>Exotic and specialty livestock may require:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Special permits and licenses</li>
                  <li>Veterinary certificates and health documentation</li>
                  <li>Proper containment and housing facilities</li>
                  <li>Compliance with wildlife and agricultural regulations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection summary */}
      {value && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Selected: {value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingCategoryStep;