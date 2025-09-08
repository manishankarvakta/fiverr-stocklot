import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactSellerButton = ({ sellerId, listingId }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startConversation = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${backendUrl}/api/inbox/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          seller_id: sellerId,
          listing_id: listingId 
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Please log in to contact the seller.');
          navigate('/login');
          return;
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
      onClick={startConversation}
      disabled={loading}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span>{loading ? 'Starting...' : 'Contact Seller'}</span>
    </button>
  );
};

export default ContactSellerButton;