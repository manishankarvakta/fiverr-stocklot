// src/auth/AuthProvider.jsx - Enhanced session persistence
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService, handleAPIError } from '../services/api';

const AuthContext = createContext({
  status: "loading",
  user: null,
  signOut: async () => {},
  refetch: async () => {}
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading" });
  const [lastCheck, setLastCheck] = useState(0);

  const loadUser = async (forceRefresh = false) => {
    const now = Date.now();
    // Avoid too frequent checks (max once per 5 minutes unless forced)
    if (!forceRefresh && now - lastCheck < 300000) {
      return;
    }
    
    console.log("🔄 AuthProvider: Starting loadUser...", forceRefresh ? "(forced)" : "");
    try {
      setLastCheck(now);
      
      // Check localStorage first for faster response (but don't rely on token)
      const storedUser = localStorage.getItem('user');
      
      // If we have stored user data and not forcing refresh, use it
      if (storedUser && !forceRefresh) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("✅ AuthProvider: Using stored session", userData.email || userData.id);
          setState({
            status: "authenticated",
            user: userData
          });
          return;
        } catch (e) {
          console.log("❌ AuthProvider: Invalid stored data, clearing...");
          localStorage.removeItem('user');
        }
      }
      
      // Make API call to check session using AuthService
      try {
        const userData = await AuthService.getProfile();
        console.log("✅ AuthProvider: Auth successful", userData.email || userData.id);
        
        // Store user data in localStorage for persistence
        const userProfile = userData.user || userData;
        localStorage.setItem('user', JSON.stringify(userProfile));
        
        setState({
          status: "authenticated",
          user: userProfile
        });
      } catch (error) {
        console.log("❌ AuthProvider: Auth failed with error:", error.message);
        
        // Clear stored data and set to anonymous for any auth-related errors
        if (error.message === 'Authentication failed' || 
            error.message.includes('401') || 
            error.message.includes('Unauthorized') ||
            error.response?.status === 401) {
          console.log("❌ AuthProvider: Authentication failed, clearing stored data");
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setState({ status: "anonymous" });
        } else if (error.message.includes('Network error') || 
                   error.message.includes('timeout') ||
                   error.code === 'ECONNABORTED') {
          // For network errors, use stored data if available, otherwise go anonymous
          console.log("⚠️ AuthProvider: Network error, checking stored data");
          if (storedUser && !forceRefresh) {
            try {
              const userData = JSON.parse(storedUser);
              console.log("🔄 AuthProvider: Using stored session due to network error");
              setState({
                status: "authenticated", 
                user: userData
              });
            } catch (e) {
              console.log("❌ AuthProvider: Invalid stored data, going anonymous");
              setState({ status: "anonymous" });
            }
          } else {
            setState({ status: "anonymous" });
          }
        } else {
          // For any other errors, go anonymous to prevent infinite loading
          console.log("❌ AuthProvider: Unknown error, going anonymous");
          setState({ status: "anonymous" });
        }
      }
    } catch (error) {
      console.error("❌ AuthProvider: Auth check error:", error);
      // Don't immediately log out on network errors, use stored data if available
      const storedUser = localStorage.getItem('user');
      if (storedUser && !forceRefresh) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("🔄 AuthProvider: Network error, using stored session");
          setState({
            status: "authenticated",
            user: userData
          });
          return;
        } catch (e) {
          console.log("❌ AuthProvider: Invalid stored data");
        }
      }
      setState({ status: "anonymous" });
    }
  };

  // Load user on mount
  useEffect(() => {
    console.log("🚀 AuthProvider: useEffect triggered, calling loadUser");
    loadUser(true); // Force refresh on mount
  }, []);

  // Periodic session check (every 30 minutes when user is authenticated)
  useEffect(() => {
    if (state.status === "authenticated") {
      const interval = setInterval(() => {
        console.log("⏰ AuthProvider: Periodic session check");
        loadUser(); // Don't force refresh for periodic checks
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(interval);
    }
  }, [state.status]);

  // Reduce tab focus checks to prevent excessive API calls
  useEffect(() => {
    const handleFocus = () => {
      if (state.status === "authenticated") {
        // Only check on focus if it's been more than 10 minutes since last check
        const now = Date.now();
        if (now - lastCheck > 10 * 60 * 1000) {
          console.log("👁️ AuthProvider: Tab focused, checking session");
          loadUser();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [state.status, lastCheck]);

  const signOut = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      handleAPIError(error, false);
    } finally {
      setState({ status: "anonymous" });
      localStorage.removeItem('user'); // Only remove user data, no token
      console.log("✅ AuthProvider: User signed out, storage cleared");
    }
  };

  const value = {
    ...state,
    signOut,
    refetch: () => loadUser(true) // Always force refresh when manually called
  };

  console.log("🔄 AuthProvider: Rendering with state:", state.status);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// AuthGate - prevents login card flash by showing loading until auth is resolved
export function AuthGate({ children }) {
  const auth = useAuth();
  
  console.log("🔒 AuthGate: Current auth status:", auth.status);
  
  if (auth.status === "loading") {
    console.log("⏳ AuthGate: Showing loading state");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }
  
  console.log("✅ AuthGate: Auth resolved, rendering children");
  return <>{children}</>;
}