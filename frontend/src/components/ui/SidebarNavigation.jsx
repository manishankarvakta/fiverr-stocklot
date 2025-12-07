import React, { useState } from 'react';
import { 
  User, Building2, Award, Camera, FileText, ShoppingCart, 
  BarChart3, Users, Shield, Settings, Bell, Heart,
  TrendingUp, Package, MessageSquare, Star, Calendar,
  ChevronRight, ChevronDown, Menu, X
} from 'lucide-react';

const SidebarNavigation = ({ 
  activeSection, 
  onSectionChange, 
  sections = [],
  userRole = "seller",
  className = "" 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set(['profile', 'business']));

  // Default sections based on context
  const getDefaultSections = () => {
    if (userRole === 'admin') {
      return [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: BarChart3,
          path: '/admin/dashboard'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: TrendingUp,
          group: 'analytics',
          children: [
            { id: 'analytics-overview', label: 'Overview', path: '/admin/analytics/overview' },
            { id: 'analytics-pdp', label: 'Product Pages', path: '/admin/analytics/pdp' },
            { id: 'analytics-revenue', label: 'Revenue Reports', path: '/admin/reports/revenue' }
          ]
        },
        {
          id: 'moderation',
          label: 'Moderation',
          icon: Shield,
          group: 'moderation',
          children: [
            { id: 'users', label: 'Users', path: '/admin/moderation/users' },
            { id: 'listings', label: 'Listings', path: '/admin/moderation/listings' },
            { id: 'reviews', label: 'Reviews', path: '/admin/moderation/reviews' },
            { id: 'roles', label: 'Role Requests', path: '/admin/moderation/roles' }
          ]
        },
        {
          id: 'experiments',
          label: 'A/B Testing',
          icon: Award,
          path: '/admin/experiments'
        }
      ];
    }
    
    if (userRole === 'seller') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: BarChart3,
          path: '/seller/dashboard'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: TrendingUp,
          path: '/seller/analytics'
        },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Package,
          group: 'inventory',
          children: [
            { id: 'inventory-list', label: 'All Items', path: '/seller/inventory' },
            { id: 'inventory-bulk', label: 'Bulk Update', path: '/seller/inventory/bulk' }
          ]
        },
        {
          id: 'marketing',
          label: 'Marketing',
          icon: TrendingUp,
          group: 'marketing',
          children: [
            { id: 'campaigns', label: 'Campaigns', path: '/seller/dashboard/promotions' },
            { id: 'offers', label: 'Offers', path: '/seller/dashboard/offers' }
          ]
        }
      ];
    }

    // Default profile/form sections
    return [
      {
        id: 'basic-info',
        label: 'Basic Info',
        icon: User,
        group: 'profile'
      },
      {
        id: 'business',
        label: 'Business',
        icon: Building2,
        group: 'profile'
      },
      {
        id: 'expertise',
        label: 'Expertise',
        icon: Award,
        group: 'profile'
      },
      {
        id: 'photos',
        label: 'Photos',
        icon: Camera,
        group: 'media'
      },
      {
        id: 'policies',
        label: 'Policies',
        icon: FileText,
        group: 'business'
      },
      {
        id: 'buying-prefs',
        label: 'Buying Preferences',
        icon: ShoppingCart,
        group: 'business'
      }
    ];
  };

  const sectionData = sections.length > 0 ? sections : getDefaultSections();
  
  // Group sections
  const groupedSections = sectionData.reduce((acc, section) => {
    const group = section.group || 'main';
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {});

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSectionClick = (section) => {
    if (section.children) {
      toggleGroup(section.id);
    } else {
      onSectionChange(section.id);
      if (section.path) {
        window.location.href = section.path;
      }
      setIsMobileOpen(false);
    }
  };

  const SectionItem = ({ section, isChild = false, depth = 0 }) => {
    const isActive = activeSection === section.id;
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedGroups.has(section.id);
    const Icon = section.icon;

    return (
      <div>
        <button
          onClick={() => handleSectionClick(section)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200
            ${isChild ? 'pl-8 py-2' : ''}
            ${isActive 
              ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600 font-medium' 
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }
            ${isCollapsed && !isChild ? 'justify-center px-2' : ''}
          `}
        >
          {Icon && (
            <Icon className={`${isChild ? 'h-4 w-4' : 'h-5 w-5'} flex-shrink-0`} />
          )}
          
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-medium">{section.label}</span>
              {hasChildren && (
                <ChevronRight 
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="border-l border-gray-200 ml-6">
            {section.children.map((child) => (
              <SectionItem 
                key={child.id} 
                section={child} 
                isChild={true}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const GroupSection = ({ groupId, sections }) => {
    const groupLabels = {
      profile: 'Profile Information',
      business: 'Business Details', 
      media: 'Media & Files',
      analytics: 'Analytics & Reports',
      moderation: 'Moderation Tools',
      inventory: 'Inventory Management',
      marketing: 'Marketing Tools'
    };

    const groupLabel = groupLabels[groupId] || groupId.charAt(0).toUpperCase() + groupId.slice(1);
    const isExpanded = expandedGroups.has(groupId);

    if (sections.length === 1 && !sections[0].children) {
      return <SectionItem section={sections[0]} />;
    }

    return (
      <div className="mb-2">
        {!isCollapsed && groupId !== 'main' && (
          <button
            onClick={() => toggleGroup(groupId)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
          >
            <span className="flex-1 text-left">{groupLabel}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          </button>
        )}
        
        {(isExpanded || groupId === 'main') && (
          <div className="space-y-1">
            {sections.map((section) => (
              <SectionItem key={section.id} section={section} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${className}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-72'}
        fixed lg:sticky top-0 left-0 h-screen
        bg-white border-r border-gray-200 
        transition-all duration-300 z-50
        flex flex-col
      `}>
        {/* Header */}
        <div className={`
          flex items-center gap-3 p-4 border-b border-gray-200
          ${isCollapsed ? 'justify-center' : ''}
        `}>
          {!isCollapsed && (
            <>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">StockLot</h2>
                <p className="text-xs text-gray-500 capitalize">{userRole} Panel</p>
              </div>
            </>
          )}
          
          {/* Collapse Toggle - Desktop Only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block ml-auto p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-2">
            {Object.entries(groupedSections).map(([groupId, sections]) => (
              <GroupSection key={groupId} groupId={groupId} sections={sections} />
            ))}
          </nav>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarNavigation;