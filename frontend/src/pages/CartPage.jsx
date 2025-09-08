import React from 'react';

function CartPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
          🛒 Shopping Cart
        </h1>
        
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Your cart is empty</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Browse our marketplace to find livestock for your farm.</p>
          <button 
            onClick={() => window.location.href = '/marketplace'}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartPage;