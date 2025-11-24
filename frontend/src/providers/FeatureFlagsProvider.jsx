import React, { createContext, useContext, useState, useEffect } from 'react';

const FeatureFlagsContext = createContext({});

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({});

  useEffect(() => {
    // Load feature flags from localStorage or API
    try {
      const storedFlags = JSON.parse(localStorage.getItem('feature_flags') || '{}');
      setFlags(storedFlags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      setFlags({});
    }
  }, []);

  const isEnabled = (flagName) => {
    // Check if flag is enabled
    // Default to true for development, or check localStorage
    if (flags[flagName] !== undefined) {
      return flags[flagName];
    }
    // Default behavior: enable all features in development
    // In production, you might want to default to false
    return true;
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, isEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// IfFlag component - wraps children and conditionally renders based on feature flag
export const IfFlag = ({ flag, children, fallback = null }) => {
  const context = useContext(FeatureFlagsContext);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // If context provider is available, use it
    if (context && context.isEnabled) {
      const isFlagEnabled = context.isEnabled(flag);
      setEnabled(isFlagEnabled);
      return;
    }

    // Otherwise, check localStorage directly
    try {
      const storedFlags = JSON.parse(localStorage.getItem('feature_flags') || '{}');
      if (storedFlags[flag] !== undefined) {
        setEnabled(storedFlags[flag]);
      } else {
        // Default to true for development
        setEnabled(true);
      }
    } catch (error) {
      console.error('Error checking feature flag:', error);
      setEnabled(true); // Default to enabled
    }
  }, [flag, context]);

  return enabled ? children : fallback;
};

export default FeatureFlagsProvider;

