'use client';

import { useEffect, useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Building2, User } from 'lucide-react';

export default function ContextSwitcher() {
  const [items, setItems] = useState([]);
  const [currentValue, setCurrentValue] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContexts();
  }, []);

  const fetchContexts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orgs/my-contexts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setCurrentValue(data.current || 'user');
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
      const response = await fetch('/api/orgs/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target: value })
      });

      if (response.ok) {
        // Store context in localStorage for frontend use
        localStorage.setItem('currentContext', value);
        // Refresh page to apply context
        window.location.reload();
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