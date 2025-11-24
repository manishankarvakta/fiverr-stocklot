'use client';

import { useEffect, useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Building2, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';

// Get backend URL
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
};

export default function ContextSwitcher() {
  const auth = useAuth();
  const user = auth.status === 'authenticated' ? auth.user : null;
  const isAuthenticated = auth.status === 'authenticated';
  const [items, setItems] = useState([]);
  const [currentValue, setCurrentValue] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch contexts if user is authenticated
    if (isAuthenticated && user) {
      fetchContexts();
    } else {
      // If not authenticated, set default user context and stop loading
      setItems([{
        label: 'Personal',
        value: 'user',
        type: 'USER'
      }]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchContexts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/orgs/my-contexts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('response', response);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setItems(data.items || []);
          setCurrentValue(data.current || 'user');
        } else {
          console.error('Response is not JSON');
        }
      } else {
        // Handle non-OK responses
        if (response.status === 401) {
          console.warn('Unauthorized - user may not be authenticated');
        } else {
          console.error('Failed to fetch contexts:', response.status, response.statusText);
        }
      }
    } catch (error) {
      console.error('Error fetching contexts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContextChange = async (value) => {
    try {
      setCurrentValue(value);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available for context switch');
        return;
      }

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/orgs/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ target: value })
      });

      if (response.ok) {
        // Store context in localStorage for frontend use
        localStorage.setItem('currentContext', value);
        // Refresh page to apply context
        window.location.reload();
      } else {
        console.error('Failed to switch context:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error switching context:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-64 h-10 bg-gray-100 animate-pulse rounded-md"></div>
    );
  }

  const currentItem = items.find(item => item.value === currentValue);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 font-medium">Selling as:</span>
      <Select value={currentValue} onValueChange={handleContextChange}>
        <SelectTrigger className="w-64 border-emerald-200 focus:border-emerald-500">
          <SelectValue placeholder="Select context">
            <div className="flex items-center space-x-2">
              {currentItem?.type === 'USER' ? (
                <User className="h-4 w-4 text-emerald-600" />
              ) : (
                <Building2 className="h-4 w-4 text-blue-600" />
              )}
              <span>{currentItem?.label || 'Select context'}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              <div className="flex items-center space-x-2">
                {item.type === 'USER' ? (
                  <User className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Building2 className="h-4 w-4 text-blue-600" />
                )}
                <span>{item.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}