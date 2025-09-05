// 🧪 FEE SYSTEM DEMO PAGE
// Demonstration page showing all fee system components

import React, { useState } from 'react';
import { 
  FeeBreakdownDisplay, 
  CheckoutFeePreview, 
  AdminFeeConfiguration, 
  SellerPayoutDashboard 
} from '../components/fees';

const FeeSystemDemo = () => {
  const [activeTab, setActiveTab] = useState('breakdown');
  const [demoAmount, setDemoAmount] = useState(1000);
  const [demoSpecies, setDemoSpecies] = useState('cattle');
  const [demoExport, setDemoExport] = useState(false);

  // Sample cart data for checkout preview
  const [sampleCart] = useState([
    {
      sellerId: 'seller_123',
      sellerName: 'Bokmakirie Farm',
      price: 750,
      deliveryFee: 50,
      abattoirFee: 25,
      species: 'cattle',
      export: false
    },
    {
      sellerId: 'seller_456', 
      sellerName: 'Karoo Livestock',
      price: 500,
      deliveryFee: 75,
      abattoirFee: 0,
      species: 'sheep',
      export: true
    }
  ]);

  // Mock user data
  const mockUser = {
    id: 'user_123',
    token: 'mock_token',
    roles: ['admin', 'seller']
  };

  const tabs = [
    { id: 'breakdown', label: 'Fee Breakdown', icon: '💰' },
    { id: 'checkout', label: 'Checkout Preview', icon: '🛒' },
    { id: 'admin', label: 'Admin Config', icon: '⚙️' },
    { id: 'payouts', label: 'Seller Payouts', icon: '💸' }
  ];

  const handleFeesCalculated = (preview) => {
    console.log('Fees calculated:', preview);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fee System Components Demo
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of the StockLot dual fee model system components.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-200 rounded-lg mb-8">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Fee Breakdown Demo</h2>
                <p className="text-gray-600 mb-6">
                  Adjust the parameters below to see how fees are calculated in real-time.
                </p>
                
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (R)
                    </label>
                    <input
                      type="number"
                      value={demoAmount}
                      onChange={(e) => setDemoAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      step="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Species
                    </label>
                    <select
                      value={demoSpecies}
                      onChange={(e) => setDemoSpecies(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="cattle">Cattle</option>
                      <option value="sheep">Sheep</option>
                      <option value="goats">Goats</option>
                      <option value="pigs">Pigs</option>
                      <option value="poultry">Poultry</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Order
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={demoExport}
                        onChange={(e) => setDemoExport(e.target.checked)}
                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-600">Export order</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown Component */}
              <FeeBreakdownDisplay
                amount={demoAmount}
                species={demoSpecies}
                export={demoExport}
                showDetails={true}
                compact={false}
              />
            </div>
          )}

          {activeTab === 'checkout' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Checkout Preview Demo</h2>
                <p className="text-gray-600 mb-4">
                  Multi-seller cart with different fee models and automatic fee calculations.
                </p>
                
                {/* Sample Cart Display */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Sample Cart Items:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {sampleCart.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{item.sellerName} - {item.species} (R{item.price})</span>
                        <span>{item.export ? 'Export' : 'Domestic'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checkout Preview Component */}
              <CheckoutFeePreview
                cartItems={sampleCart}
                onFeesCalculated={handleFeesCalculated}
              />
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Fee Configuration Management</h2>
                <p className="text-gray-600 mb-4">
                  Admin interface for creating and managing fee configurations. Switch between 
                  Seller-Pays and Buyer-Pays Commission models.
                </p>
              </div>

              {/* Admin Configuration Component */}
              <AdminFeeConfiguration currentUser={mockUser} />
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Seller Payout Dashboard</h2>
                <p className="text-gray-600 mb-4">
                  Comprehensive dashboard for sellers to track their earnings, payout status, 
                  and transaction history.
                </p>
              </div>

              {/* Seller Payout Dashboard Component */}
              <SellerPayoutDashboard
                currentUser={mockUser}
                sellerId={mockUser.id}
              />
            </div>
          )}
        </div>

        {/* Integration Guide */}
        <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Guide</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Import Components:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { 
  FeeBreakdownDisplay, 
  CheckoutFeePreview, 
  AdminFeeConfiguration, 
  SellerPayoutDashboard 
} from './components/fees';`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Usage Examples:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Fee breakdown for product pages
<FeeBreakdownDisplay 
  amount={1000} 
  species="cattle" 
  export={false}
  compact={true} 
/>

// Checkout preview for cart pages
<CheckoutFeePreview 
  cartItems={cartItems} 
  onFeesCalculated={handleFeesCalculated} 
/>

// Admin configuration (admin only)
<AdminFeeConfiguration currentUser={adminUser} />

// Seller payout dashboard  
<SellerPayoutDashboard 
  currentUser={sellerUser}
  sellerId="seller_123" 
/>`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Required Props:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>FeeBreakdownDisplay:</strong> amount (required), species, export, showDetails, compact</li>
                <li><strong>CheckoutFeePreview:</strong> cartItems (required), onFeesCalculated</li>
                <li><strong>AdminFeeConfiguration:</strong> currentUser (required with admin role)</li>
                <li><strong>SellerPayoutDashboard:</strong> currentUser (required), sellerId</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeSystemDemo;