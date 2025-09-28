import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, X, Eye, Layout, Sidebar as SidebarIcon } from 'lucide-react';

const SidebarDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 New Sidebar Navigation Implemented!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Clean, organized, and user-friendly navigation for all dashboards
          </p>
        </div>

        {/* Before vs After */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Before */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <X className="h-5 w-5" />
                <h3 className="font-semibold">Before: Cluttered Horizontal Tabs</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Problems:</strong>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>8+ tabs in a single horizontal row</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Overwhelming and hard to navigate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Poor mobile experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>No visual hierarchy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Limited space for content</span>
                  </li>
                </ul>
                <div className="bg-gray-100 p-3 rounded text-xs text-gray-500">
                  Old interface: Basic | Business | Expertise | Photos | Policies | Buying Prefs | Facility Info | Experience
                </div>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                <h3 className="font-semibold">After: Clean Sidebar Navigation</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Benefits:</strong>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Clean vertical organization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Collapsible for more screen space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Mobile-responsive design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Clear visual hierarchy with icons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Progress tracking & completion status</span>
                  </li>
                </ul>
                <div className="bg-green-100 p-3 rounded text-xs text-green-700">
                  New interface: Organized sidebar with grouped sections and progress tracking
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <SidebarIcon className="h-6 w-6 text-emerald-600" />
            New Sidebar Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Layout className="h-5 w-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Role-Based Navigation</h4>
              <p className="text-sm text-gray-600">
                Different sidebar menus for Admin, Seller, and Buyer roles with relevant sections
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Collapsible Design</h4>
              <p className="text-sm text-gray-600">
                Sidebar can collapse to icons only, giving more space for content
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Progress Tracking</h4>
              <p className="text-sm text-gray-600">
                Visual indicators showing completion status and profile strength
              </p>
            </div>
          </div>
        </div>

        {/* Implementation Details */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Implementation Status</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Sidebar Component</span>
              </div>
              <span className="text-sm text-green-600">✅ Complete</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Dashboard Layout</span>
              </div>
              <span className="text-sm text-green-600">✅ Complete</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Seller Profile Layout</span>
              </div>
              <span className="text-sm text-green-600">✅ Complete</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium">Route Integration</span>
              </div>
              <span className="text-sm text-green-600">✅ Complete</span>
            </div>
          </div>
        </div>

        {/* Try It Out */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Try the New Sidebar Navigation!</h3>
          <p className="text-emerald-100 mb-6">
            Experience the improved navigation with clean organization and better UX
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/seller/profile/basic"
              className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg font-medium hover:bg-emerald-50 transition-colors"
            >
              Seller Profile Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            
            <Link
              to="/seller/dashboard"
              className="flex items-center gap-2 bg-emerald-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-300 transition-colors"
            >
              Seller Dashboard Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 bg-emerald-400 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-300 transition-colors"
            >
              Admin Dashboard Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Technical Summary */}
        <div className="bg-gray-900 text-white rounded-lg p-8">
          <h3 className="text-xl font-bold mb-4">🛠️ Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Components Created:</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Sidebar.jsx - Main sidebar navigation</li>
                <li>• DashboardLayout.jsx - Dashboard wrapper</li>
                <li>• SellerProfileLayout.jsx - Profile-specific layout</li>
                <li>• BasicInfo.jsx & BusinessInfo.jsx - Profile sections</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Features Implemented:</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Role-based navigation (Admin/Seller/Buyer)</li>
                <li>• Collapsible sidebar with responsive design</li>
                <li>• Nested routing with React Router</li>
                <li>• Progress tracking & completion indicators</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarDemo;