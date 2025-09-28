import { useState } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useSocialAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authenticateWithSocial = async (provider, token, role = null) => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        provider,
        token,
        role,
      };

      const response = await fetch(`${BACKEND_URL}/api/auth/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Social authentication failed');
      }

      const data = await response.json();

      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Social authentication error:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (role) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/auth/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update role');
      }

      // Update user data in localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.roles = [role];
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Update role error:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    authenticateWithSocial,
    updateUserRole,
    loading,
    error,
  };
};