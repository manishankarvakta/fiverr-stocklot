// src/auth/AuthProvider.jsx - Redux Toolkit based authentication
import React, { useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadUserProfile,
  logoutUser,
  selectAuthStatus,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectUserRoles,
  selectHasRole,
  selectHasAnyRole,
  setUser,
} from '../store/authSlice';

// Create context for backward compatibility (wraps Redux)
const AuthContext = React.createContext({
  status: "loading",
  user: null,
  signOut: async () => {},
  refetch: async () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
});

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch(setUser(userData));
        // Then verify with API
        dispatch(loadUserProfile(true));
      } catch (e) {
        console.log("❌ AuthProvider: Invalid stored data, clearing...");
        localStorage.removeItem('user');
        dispatch(loadUserProfile(true));
      }
    } else {
      // No stored user, check with API
      dispatch(loadUserProfile(true));
    }
  }, [dispatch]);

  // Periodic session check (every 30 minutes when authenticated)
  useEffect(() => {
    if (status === "authenticated") {
      const interval = setInterval(() => {
        console.log("⏰ AuthProvider: Periodic session check");
        dispatch(loadUserProfile(false)); // Don't force refresh
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(interval);
    }
  }, [status, dispatch]);

  // Tab focus check (only if more than 10 minutes since last check)
  useEffect(() => {
    const handleFocus = () => {
      if (status === "authenticated") {
        const lastCheck = localStorage.getItem('authLastCheck');
        const now = Date.now();
        if (!lastCheck || now - parseInt(lastCheck) > 10 * 60 * 1000) {
          console.log("👁️ AuthProvider: Tab focused, checking session");
          dispatch(loadUserProfile(false));
          localStorage.setItem('authLastCheck', now.toString());
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, dispatch]);

  const signOut = async () => {
    await dispatch(logoutUser());
  };

  const refetch = () => {
    dispatch(loadUserProfile(true));
  };

  // Helper functions for role checking
  const hasRole = (role) => {
    const roles = user?.roles || [];
    return Array.isArray(roles) ? roles.includes(role) : false;
  };

  const hasAnyRole = (requiredRoles) => {
    const userRoles = user?.roles || [];
    if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) return false;
    return requiredRoles.some(role => userRoles.includes(role));
  };

  const value = {
    status,
    user,
    signOut,
    refetch,
    hasRole,
    hasAnyRole,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for components to access auth state (uses Redux under the hood)
// This hook provides backward compatibility with Context API while using Redux
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Return context value which is already populated from Redux
  // This maintains backward compatibility while using Redux internally
  return context;
}

// AuthGate - prevents login card flash by showing loading until auth is resolved
export function AuthGate({ children }) {
  const status = useSelector(selectAuthStatus);
  
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
