import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const FlagContext = createContext({});

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await api.get('/features');
        setFlags(response.data || {});
      } catch (error) {
        console.error('Error loading feature flags:', error);
        setFlags({});
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
  }, []);

  return (
    <FlagContext.Provider value={{ flags, loading }}>
      {children}
    </FlagContext.Provider>
  );
}

export function useFlag(key) {
  const { flags } = useContext(FlagContext);
  return !!flags[key];
}

export function useFlagLoading() {
  const { loading } = useContext(FlagContext);
  return loading;
}

export function IfFlag({ flag, children, fallback = null }) {
  const enabled = useFlag(flag);
  const loading = useFlagLoading();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }
  
  return enabled ? children : fallback;
}