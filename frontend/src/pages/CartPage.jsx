import React from 'react';

function CartPage() {
  console.log('CartPage component rendering');
  
  return (
    <div style={{ 
      minHeight: 'calc(100vh - 120px)', 
      backgroundColor: 'white', 
      padding: '2rem',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem', 
          display: 'flex', 
          alignItems: 'center',
          color: '#111827'
        }}>
          🛒 Shopping Cart
        </h1>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            color: '#9ca3af'
          }}>🛒</div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#111827'
          }}>Your cart is empty</h2>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '2rem',
            fontSize: '1rem'
          }}>Browse our marketplace to find livestock for your farm.</p>
          <button 
            onClick={() => window.location.href = '/marketplace'}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#16a34a'}
          >
            Browse Marketplace
          </button>
        </div>
        
        {/* Debug info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          ✅ Cart page loaded successfully<br/>
          ✅ Route recognition working<br/>
          ✅ Component rendering properly<br/>
          URL: {window.location.pathname}
        </div>
      </div>
    </div>
  );
}

export default CartPage;