import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight,
  Home,
  BarChart3,
  Users,
  Package,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  Target,
  Heart,
  Bell,
  FileText,
  Upload,
  Star,
  Eye,
  DollarSign,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ userRole = 'seller', isCollapsed = false, onToggle }) => {
  const [expandedGroups, setExpandedGroups] = useState(['dashboard']);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Define navigation structure based on user role
  const getNavigationConfig = () => {
    if (userRole === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          items: [
            { path: '/admin/dashboard', label: 'Overview', icon: BarChart3 }
          ]
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          items: [
            { path: '/admin/analytics/overview', label: 'Overview', icon: BarChart3 },
            { path: '/admin/analytics/pdp', label: 'Product Analytics', icon: Eye },
            { path: '/admin/reports/revenue', label: 'Revenue Reports', icon: DollarSign }
          ]
        },
        {
          id: 'moderation',
          label: 'Moderation',
          icon: Shield,
          items: [
            { path: '/admin/moderation/users', label: 'Users', icon: Users },
            { path: '/admin/moderation/listings', label: 'Listings', icon: Package },
            { path: '/admin/moderation/buy-requests', label: 'Buy Requests', icon: MessageSquare },
            { path: '/admin/moderation/reviews', label: 'Reviews', icon: Star },
            { path: '/admin/moderation/roles', label: 'Role Requests', icon: Shield }
          ]
        },
        {
          id: 'experiments',
          label: 'A/B Testing',
          icon: Target,
          items: [
            { path: '/admin/experiments', label: 'Experiments', icon: Target },
            { path: '/admin/experiments/results', label: 'Results', icon: BarChart3 }
          ]
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          items: [
            { path: '/admin/settings', label: 'General', icon: Settings },
            { path: '/admin/settings/fees', label: 'Fees', icon: DollarSign }
          ]
        }
      ];
    } 
    
    if (userRole === 'seller') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          items: [
            { path: '/seller/dashboard', label: 'Overview', icon: BarChart3 }
          ]
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: Users,
          items: [
            { path: '/seller/profile/basic', label: 'Basic Info', icon: Users },
            { path: '/seller/profile/business', label: 'Business', icon: Package },
            { path: '/seller/profile/expertise', label: 'Expertise', icon: Star },
            { path: '/seller/profile/photos', label: 'Photos', icon: Eye },
            { path: '/seller/profile/policies', label: 'Policies', icon: FileText },
            { path: '/seller/profile/preferences', label: 'Buying Prefs', icon: Heart },
            { path: '/seller/profile/facility', label: 'Facility Info', icon: Settings },
            { path: '/seller/profile/experience', label: 'Experience', icon: TrendingUp }
          ]
        },
        {
          id: 'listings',
          label: 'Listings',
          icon: Package,
          items: [
            { path: '/seller/listings', label: 'My Listings', icon: Package },
            { path: '/seller/listings/create', label: 'Create Listing', icon: Upload },
            { path: '/seller/inventory/bulk', label: 'Bulk Update', icon: Upload }
          ]
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          items: [
            { path: '/seller/dashboard/analytics', label: 'Performance', icon: BarChart3 },
            { path: '/seller/dashboard/trading-statements', label: 'Trading Statements', icon: FileText }
          ]
        },
        {
          id: 'delivery',
          label: 'Delivery',
          icon: TrendingUp,
          items: [
            { path: '/seller/dashboard/shipping-rates', label: 'Shipping Rates', icon: DollarSign }
          ]
        },
        {
          id: 'marketing',
          label: 'Marketing',
          icon: TrendingUp,
          items: [
            { path: '/seller/dashboard/promotions', label: 'Campaigns', icon: TrendingUp },
            { path: '/seller/dashboard/offers', label: 'Offers', icon: MessageSquare }
          ]
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: FileText,
          items: [
            { path: '/seller/orders', label: 'All Orders', icon: FileText },
            { path: '/seller/orders/pending', label: 'Pending', icon: FileText }
          ]
        },
        // Role switcher for dual-role users
        {
          id: 'role-switch',
          label: 'Switch to Buyer',
          icon: Users,
          items: [
            { path: '/buyer/dashboard', label: 'Buyer Dashboard', icon: Package }
          ]
        }
      ];
    }

    // Buyer navigation
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        items: [
          { path: '/buyer/dashboard', label: 'Overview', icon: BarChart3 }
        ]
      },
      {
        id: 'shopping',
        label: 'Shopping',
        icon: Package,
        items: [
          { path: '/marketplace', label: 'Marketplace', icon: Package },
          { path: '/buyer/dashboard/wishlist', label: 'Wishlist', icon: Heart },
          { path: '/buyer/dashboard/price-alerts', label: 'Price Alerts', icon: Bell }
        ]
      },
      {
        id: 'offers-inbox',
        label: 'Accept offers',
        icon: MessageSquare,
        items: [
          { path: '/offers-inbox', label: 'Accept Offers', icon: MessageSquare }
        ]
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        items: [
          { path: '/buyer/dashboard/trading-statements', label: 'Trading Statements', icon: FileText }
        ]
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: FileText,
        items: [
          { path: '/buyer/dashboard/orders', label: 'My Orders', icon: FileText },
          { path: '/buyer/dashboard/orders/tracking', label: 'Order tracking', icon: FileText },
          { path: '/buyer/dashboard/orders/history', label: 'History', icon: Clock },
        ]
      },
      // Role switcher for dual-role users
      {
        id: 'role-switch',
        label: 'Switch to Seller',
        icon: Users,
        items: [
          { path: '/seller/dashboard', label: 'Seller Dashboard', icon: DollarSign }
        ]
      }
    ];
  };

  const navigationConfig = getNavigationConfig();

  const isActiveItem = (path) => {
    return location.pathname === path;
  };

  const isActiveGroup = (groupItems) => {
    return groupItems.some(item => location.pathname.startsWith(item.path));
  };

  const SidebarItem = ({ item, isNested = false }) => {
    const Icon = item.icon;
    const isActive = isActiveItem(item.path);
    
    return (
      <NavLink
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
          ${isNested ? 'ml-6 text-sm' : 'text-sm font-medium'}
          ${isActive 
            ? 'bg-emerald-100 text-emerald-700 border-r-2 border-emerald-500' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
      >
        <Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
        {!isCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const SidebarGroup = ({ group }) => {
    const Icon = group.icon;
    const isExpanded = expandedGroups.includes(group.id);
    const hasActiveItem = isActiveGroup(group.items);

    if (group.items.length === 1) {
      // Single item groups render as direct items
      return <SidebarItem item={group.items[0]} />;
    }

    return (
      <div className="space-y-1">
        <button
          onClick={() => !isCollapsed && toggleGroup(group.id)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
            text-sm font-medium
            ${hasActiveItem 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'text-gray-700 hover:bg-gray-100'
            }
            ${isCollapsed ? 'justify-center px-2' : 'justify-between'}
          `}
        >
          <div className="flex items-center gap-3">
            <Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
            {!isCollapsed && <span>{group.label}</span>}
          </div>
          {!isCollapsed && (
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </button>
        
        {!isCollapsed && isExpanded && (
          <div className="space-y-1 ml-2">
            {group.items.map((item, index) => (
              <SidebarItem key={index} item={item} isNested />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
     <button 
      onClick={() => navigate('/')}
     >
       <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-gray-900">StockLot</h2>
              <p className="text-xs text-gray-500 capitalize">{userRole} Panel</p>
            </div>
          )}
        </div>
      </div>
     </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationConfig.map((group, index) => (
          <SidebarGroup key={index} group={group} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;