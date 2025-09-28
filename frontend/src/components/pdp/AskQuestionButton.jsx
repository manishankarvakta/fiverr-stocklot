import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AskQuestionButton = ({ listingId, sellerId }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const askQuestion = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Get authentication token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${backendUrl}/api/inbox/ask`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify({ 
          listing_id: listingId,
          seller_id: sellerId 
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Only show login prompt if user is actually not authenticated
          if (!token) {
            alert('Please log in to contact the seller.');
            navigate('/login');
            return;
          } else {
            // Token might be expired, try to refresh or redirect to login
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            navigate('/login');
            return;
          }
        }
        throw new Error('Failed to create conversation');
      }

      const { conversation_id } = await response.json();
      navigate(`/inbox?open=${conversation_id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={askQuestion}
      disabled={loading}
      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span>{loading ? 'Starting...' : 'Ask a Question'}</span>
    </button>
  );
};

export default AskQuestionButton;