import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from './api/user.api';

// Async thunk to load user profile
export const loadUserProfile = createAsyncThunk(
  'auth/loadUserProfile',
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      // Check if we should skip (rate limiting)
      const state = getState();
      const { lastCheck } = state.auth;
      const now = Date.now();
      
      if (!forceRefresh && now - lastCheck < 300000) { // 5 minutes
        return null; // Skip if too recent
      }

      // Try to get user profile from API
      const result = await userApi.endpoints.getMe.initiate()();
      
      if (result.error) {
        // Handle 401 - unauthorized
        if (result.error.status === 401) {
          // Clear stored data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          throw new Error('Authentication failed');
        }
        throw result.error;
      }

      const userData = result.data?.user || result.data;
      
      // Store in localStorage for persistence
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }

      return userData;
    } catch (error) {
      // For network errors, try to use stored data
      if (error.message?.includes('Network') || error.message?.includes('timeout')) {
        const storedUser = localStorage.getItem('user');
        if (storedUser && !forceRefresh) {
          try {
            return JSON.parse(storedUser);
          } catch (e) {
            // Invalid stored data
          }
        }
      }
      
      // Clear on auth errors
      if (error.message === 'Authentication failed' || 
          error.message?.includes('401') || 
          error.message?.includes('Unauthorized')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        throw error;
      }
      
      return rejectWithValue(error.message || 'Failed to load user');
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await userApi.endpoints.logout.initiate()();
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null; // Success
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

// Initial state
const initialState = {
  status: 'loading', // 'loading' | 'authenticated' | 'anonymous'
  user: null,
  lastCheck: 0,
  error: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const user = action.payload;
      // Ensure roles is always an array
      if (user && user.roles && !Array.isArray(user.roles)) {
        user.roles = [user.roles];
      }
      state.user = user;
      state.status = user ? 'authenticated' : 'anonymous';
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.status = 'anonymous';
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    updateUser: (state, action) => {
      if (state.user) {
        const updatedUser = { ...state.user, ...action.payload };
        // Ensure roles is always an array
        if (updatedUser.roles && !Array.isArray(updatedUser.roles)) {
          updatedUser.roles = [updatedUser.roles];
        }
        state.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user profile
      .addCase(loadUserProfile.pending, (state) => {
        if (state.status === 'anonymous') {
          state.status = 'loading';
        }
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        if (action.payload) {
          const user = action.payload;
          // Ensure roles is always an array
          if (user.roles && !Array.isArray(user.roles)) {
            user.roles = [user.roles];
          }
          state.user = user;
          state.status = 'authenticated';
          state.lastCheck = Date.now();
        } else {
          // Skipped due to rate limiting, keep current state
          state.lastCheck = Date.now();
        }
        state.error = null;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        // Check if we have stored user data
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Ensure roles is always an array
            if (userData.roles && !Array.isArray(userData.roles)) {
              userData.roles = [userData.roles];
            }
            state.user = userData;
            state.status = 'authenticated';
          } catch (e) {
            state.user = null;
            state.status = 'anonymous';
          }
        } else {
          state.user = null;
          state.status = 'anonymous';
        }
        state.error = action.payload || action.error.message;
        state.lastCheck = Date.now();
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        // Optional: Set loading state if needed
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'anonymous';
        state.error = null;
        state.lastCheck = 0;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API fails, clear local state
        state.user = null;
        state.status = 'anonymous';
        state.error = null;
        state.lastCheck = 0;
      });
  },
});

// Selectors
export const selectAuthStatus = (state) => state.auth.status;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectIsLoading = (state) => state.auth.status === 'loading';
export const selectUserRoles = (state) => state.auth.user?.roles || [];
export const selectHasRole = (state, role) => {
  const roles = state.auth.user?.roles || [];
  return Array.isArray(roles) ? roles.includes(role) : false;
};
export const selectHasAnyRole = (state, requiredRoles) => {
  const userRoles = state.auth.user?.roles || [];
  if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) return false;
  return requiredRoles.some(role => userRoles.includes(role));
};

// Actions
export const { setUser, clearAuth, setStatus, updateUser } = authSlice.actions;

// Reducer
export default authSlice.reducer;

