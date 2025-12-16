import React from 'react';
import { Link } from 'react-router-dom';
import CategoryList from '../components/catalog/CategoryList';
import { useGetExoticStatisticsQuery } from '@/store/api/taxonomy.api';

/**
 * 🦌 Exotic & Specialty Livestock Landing Page
 * Dedicated page for exotic livestock with proper SEO and content
 */
export function ExoticsLanding() {
  // Use RTK Query to fetch statistics
  const { data: statistics, isLoading: loading } = useGetExoticStatisticsQuery();
  console.log(statistics);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Exotic & Specialty Livestock
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-amber-100">
              Premium game animals, ratites, camelids, and specialty species for commercial farming
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/exotics?include_exotics=true"
                className="bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                Browse Exotic Livestock
              </Link>
              <Link
                to="/marketplace"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-600 transition-colors"
              >
                View Core Livestock
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      {statistics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Exotic Livestock Available</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{statistics.total_exotic_species}</div>
                <div className="text-gray-600">Exotic Species</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{statistics.game_species_count}</div>
                <div className="text-gray-600">Game Animals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{statistics.permit_required_count}</div>
                <div className="text-gray-600">Permit Required</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Object.keys(statistics.by_category || {}).length}
                </div>
                <div className="text-gray-600">Categories</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CategoryList mode="exotic" showExoticToggle={false} />
      </div>

      {/* Featured Species Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Exotic Species</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Ostrich */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Ostrich</h3>
              <p className="text-gray-600 mb-4">
                World's largest bird, farmed for meat, leather, feathers, and eggs. 
                Excellent for commercial farming with high-value products.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Live Animals</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Breeding Stock</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Fertilized Eggs</span>
              </div>
              <Link
                to="/exotics?species=Ostrich&include_exotics=true"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                View Ostrich Listings →
              </Link>
            </div>
          </div>

          {/* Kudu */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-green-400 to-emerald-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Kudu</h3>
              <p className="text-gray-600 mb-4">
                Large spiral-horned antelope, popular for game farming and venison production. 
                Requires special permits for commercial farming.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Live Animals</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Breeding Stock</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Permit Required</span>
              </div>
              <Link
                to="/exotics?species=Kudu&include_exotics=true"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                View Kudu Listings →
              </Link>
            </div>
          </div>

          {/* Alpaca */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Alpaca</h3>
              <p className="text-gray-600 mb-4">
                Small camelid bred primarily for premium fiber production. 
                Gentle temperament and valuable fleece make them excellent for farming.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Live Animals</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Breeding Stock</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Fiber Production</span>
              </div>
              <Link
                to="/exotics?species=Alpaca&include_exotics=true"
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                View Alpaca Listings →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Exotic Livestock?</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Higher Value Products</h3>
                    <p className="text-gray-600">Exotic livestock often command premium prices for meat, fiber, eggs, and breeding stock.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Niche Markets</h3>
                    <p className="text-gray-600">Access specialized markets for eco-tourism, conservation, and specialty products.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Diversification</h3>
                    <p className="text-gray-600">Reduce farming risk by diversifying into exotic species with different market cycles.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Compliance & Support</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">🛡️ Secure & Legal</h3>
                  <p className="text-blue-800">All exotic livestock sales comply with South African wildlife and agricultural regulations.</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">📋 Permit Assistance</h3>
                  <p className="text-green-800">We guide you through permit requirements and connect you with qualified veterinarians.</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">🔒 Escrow Protection</h3>
                  <p className="text-purple-800">All transactions protected by secure escrow until delivery and satisfaction confirmed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore Exotic Livestock?</h2>
          <p className="text-xl mb-8 text-amber-100">
            Browse our comprehensive selection of exotic and specialty livestock from verified sellers across South Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/exotics?include_exotics=true"
              className="bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
            >
              Start Browsing Exotics
            </Link>
            <Link
              to="/create-listing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-600 transition-colors"
            >
              List Your Exotic Livestock
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExoticsLanding;