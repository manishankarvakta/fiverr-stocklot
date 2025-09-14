import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * 📚 Category List with Core/Exotic Separation
 * Shows primary categories by default, exotic categories on demand
 */
export function CategoryList({ mode = "core", showExoticToggle = false }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExotic, setShowExotic] = useState(mode === "exotic");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const currentMode = showExotic ? "exotic" : "core";
        const response = await fetch(`/api/taxonomy/categories?mode=${currentMode}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [showExotic]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-100 rounded"></div>
          </div>
        ))}
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

  const baseUrl = showExotic ? "/exotics" : "/marketplace";

  return (
    <div className="space-y-4">
      {/* Toggle for Exotic Categories */}
      {showExoticToggle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {showExotic ? "Exotic & Specialty Livestock" : "Core Livestock Categories"}
          </h3>
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
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map(category => (
          <Link
            key={category.id}
            to={`${baseUrl}?category=${category.slug}`}
            className="group border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 bg-white"
          >
            <div className="text-center">
              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                {category.name}
              </h4>
              {category.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {category.description}
                </p>
              )}
              
              {/* Exotic badge */}
              {showExotic && (
                <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                  Specialty
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Info message for exotic categories */}
      {showExotic && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">
                Specialty Livestock Notice
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Some exotic species may require special permits, proper containment, and veterinary oversight. 
                All sales are live animals only - no processed products.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="text-center text-sm text-gray-500">
        {categories.length} {showExotic ? 'exotic' : 'core'} categories available
      </div>
    </div>
  );
}

export default CategoryList;