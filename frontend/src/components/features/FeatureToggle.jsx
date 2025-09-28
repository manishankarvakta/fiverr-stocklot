import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const FeatureToggle = ({ featureKey, children, fallback = null }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        // Simple client-side feature flag check
        // In production, this would be more sophisticated
        const flags = JSON.parse(localStorage.getItem('feature_flags') || '{}');
        setIsEnabled(flags[featureKey] || false);
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [featureKey]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  return isEnabled ? children : fallback;
};

export default FeatureToggle;