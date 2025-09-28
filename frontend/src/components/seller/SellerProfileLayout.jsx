import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, Star, Eye, FileText, Heart, Settings, TrendingUp, Save, ArrowLeft } from 'lucide-react';

const SellerProfileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const profileSections = [
    {
      id: 'basic',
      label: 'Basic Info',
      icon: User,
      path: '/seller/profile/basic',
      description: 'Name, contact details, and location'
    },
    {
      id: 'business',
      label: 'Business',
      icon: Package,
      path: '/seller/profile/business',
      description: 'Company info and business details'
    },
    {
      id: 'expertise',
      label: 'Expertise',
      icon: Star,
      path: '/seller/profile/expertise',
      description: 'Specializations and certifications'
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: Eye,
      path: '/seller/profile/photos',
      description: 'Profile and facility photos'
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      path: '/seller/profile/policies',
      description: 'Terms, conditions, and policies'
    },
    {
      id: 'preferences',
      label: 'Buying Preferences',
      icon: Heart,
      path: '/seller/profile/preferences',
      description: 'Your buying preferences and interests'
    },
    {
      id: 'facility',
      label: 'Facility Info',
      icon: Settings,
      path: '/seller/profile/facility',
      description: 'Farm/facility information and capacity'
    },
    {
      id: 'experience',
      label: 'Experience',
      icon: TrendingUp,
      path: '/seller/profile/experience',
      description: 'Years of experience and achievements'
    }
  ];

  const currentSection = profileSections.find(section => 
    location.pathname.includes(section.path)
  ) || profileSections[0];

  const currentIndex = profileSections.findIndex(section => section.id === currentSection.id);
  const nextSection = profileSections[currentIndex + 1];
  const prevSection = profileSections[currentIndex - 1];

  const handleSectionChange = (section) => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to continue without saving?')) {
        setHasUnsavedChanges(false);
        navigate(section.path);
      }
    } else {
      navigate(section.path);
    }
  };

  const handleSave = () => {
    // Save logic here
    setHasUnsavedChanges(false);
    // Show success message
  };

  const completionPercentage = 75; // Mock completion percentage

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/seller/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Seller Profile</h1>
                <p className="text-sm text-gray-600">Complete your profile to increase buyer trust</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Completion Progress */}
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{completionPercentage}%</span>
              </div>
              
              {hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Profile Sections</h3>
              </div>
              <nav className="p-2">
                {profileSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = currentSection.id === section.id;
                  const isCompleted = section.id === 'basic' || section.id === 'business'; // Mock completion status
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
                        ${isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{section.label}</p>
                        <p className="text-xs text-gray-500 truncate">{section.description}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Profile Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed Sections</span>
                  <span className="font-medium">6/8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trust Score</span>
                  <span className="font-medium text-green-600">8.5/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Section Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <currentSection.icon className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{currentSection.label}</h2>
                      <p className="text-sm text-gray-600">{currentSection.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {prevSection && (
                      <button
                        onClick={() => handleSectionChange(prevSection)}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    {nextSection && (
                      <button
                        onClick={() => handleSectionChange(nextSection)}
                        className="px-3 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        Next: {nextSection.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                <Outlet context={{ setHasUnsavedChanges }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfileLayout;