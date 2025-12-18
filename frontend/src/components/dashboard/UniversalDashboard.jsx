import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Heart, Bell, FileText, Truck, Shield, Settings, BarChart3, DollarSign,
  ShoppingBag, Package2, Eye, Clock, TrendingUp, CheckCircle, Star, 
  Target, Zap, Activity, PieChart
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import Header from '../ui/common/Header';
import Footer from '../ui/common/Footer';
import BuyerOffersInbox from '../pagesNo/BuyerOffersInbox';
import SellerAnalytics from '../seller/SellerAnalytics';
import DashboardLayout from '../layout/DashboardLayout';

const UniversalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Please Login</h2>
        <p className="text-gray-600">Access to dashboard requires authentication.</p>
      </div>
    );
  }

  // Dashboard features (NO repetitions from dropdown)
  const dashboardFeatures = [
    // Orders & Tracking (NOT in dropdown)
    {
      title: "Orders & Tracking",
      icon: ShoppingBag,
      description: "Manage and track your orders",
      cards: [
        {
          title: "My Orders",
          description: "View and track all your orders",
          icon: ShoppingBag,
          action: () => navigate('/orders'),
          available: true
        },
        {
          title: "Order Tracking",
          description: "Real-time order status updates",
          icon: Eye,
          action: () => navigate('/orders/tracking'),
          available: true
        },
        {
          title: "Order History", 
          description: "Complete history of past orders",
          icon: Clock,
          action: () => navigate('/orders/history'),
          available: true
        }
      ]
    },

    // Listings Management (NOT in dropdown)
    {
      title: "Listings Management",
      icon: Package2,
      description: "Manage your livestock listings",
      cards: [
        {
          title: "My Listings",
          description: "View and edit your active listings",
          icon: Package2,
          action: () => navigate('/seller/listings'),
          available: user.roles?.includes('seller')
        },
        {
          title: "Listing Analytics",
          description: "Performance metrics for your listings",
          icon: BarChart3,
          action: () => navigate('/seller/analytics'),
          available: user.roles?.includes('seller')
        },
        {
          title: "Listing Performance",
          description: "Views, clicks, and engagement stats",
          icon: TrendingUp,
          action: () => navigate('/seller/performance'),
          available: user.roles?.includes('seller')
        }
      ]
    },

    // Buyer Tools (NOT in dropdown)
    {
      title: "Buyer Tools",
      icon: Heart,
      description: "Enhanced shopping features",
      cards: [
        {
          title: "Wishlist",
          description: "Your saved livestock listings",
          icon: Heart,
          action: () => navigate('/buyer/dashboard/wishlist'),
          available: user.roles?.includes('buyer')
        },
        {
          title: "Price Alerts",
          description: "Get notified when prices drop",
          icon: Bell,
          action: () => navigate('/buyer/dashboard/price-alerts'),
          available: user.roles?.includes('buyer')
        },
        {
          title: "Saved Searches",
          description: "Quick access to your frequent searches",
          icon: Target,
          action: () => navigate('/buyer/saved-searches'),
          available: user.roles?.includes('buyer')
        }
      ]
    },

    // Seller Business Tools (NOT in dropdown)
    {
      title: "Seller Business Tools", 
      icon: DollarSign,
      description: "Advanced selling features",
      cards: [
        {
          title: "Shipping Rates",
          description: "Configure your delivery rates and zones",
          icon: Truck,
          action: () => navigate('/seller/dashboard/shipping-rates'),
          available: user.roles?.includes('seller')
        },
        {
          title: "Seller Analytics",
          description: "Sales performance and insights",
          icon: PieChart,
          action: () => navigate('/seller/dashboard/analytics'),
          available: user.roles?.includes('seller')
        },
        {
          title: "Customer Reviews",
          description: "Manage customer feedback and ratings",
          icon: Star,
          action: () => navigate('/seller/reviews'),
          available: user.roles?.includes('seller')
        }
      ]
    },

    // Financial Reports (NOT in dropdown)
    {
      title: "Financial Reports",
      icon: FileText,
      description: "Trading statements and financial data",
      cards: [
        {
          title: "Buyer Trading Statements",
          description: "View your purchase history and expenses",
          icon: FileText,
          action: () => navigate('/buyer/dashboard/trading-statements'),
          available: user.roles?.includes('buyer')
        },
        {
          title: "Seller Trading Statements",
          description: "View your sales history and earnings",
          icon: FileText,
          action: () => navigate('/seller/dashboard/trading-statements'),
          available: user.roles?.includes('seller')
        },
        {
          title: "Tax Reports",
          description: "Generate tax-ready financial reports",
          icon: Activity,
          action: () => navigate('/reports/tax'),
          available: user.roles?.includes('seller')
        }
      ]
    },

    // Account Verification & Security (NOT in dropdown)
    {
      title: "Account Verification & Security",
      icon: Shield,
      description: "Secure and verify your account",
      cards: [
        {
          title: "KYC Verification",
          description: "Complete your identity verification",
          icon: CheckCircle,
          action: () => navigate('/kyc'),
          available: true
        },
        {
          title: "Two-Factor Authentication",
          description: "Secure your account with 2FA",
          icon: Shield,
          action: () => navigate('/auth/two-factor'),
          available: true
        },
        {
          title: "Change Password",
          description: "Update your account password",
          icon: Settings,
          action: () => navigate('/auth/reset-password'),
          available: true
        }
      ]
    },

    // Notifications & Alerts (NOT in dropdown)
    {
      title: "Notifications & Alerts",
      icon: Bell,
      description: "Manage your notifications",
      cards: [
        {
          title: "Notification Settings",
          description: "Configure email and push notifications",
          icon: Settings,
          action: () => navigate('/settings/notifications'),
          available: true
        },
        {
          title: "Alert Preferences",
          description: "Customize price and stock alerts",
          icon: Zap,
          action: () => navigate('/settings/alerts'),
          available: true
        }
      ]
    }
  ];

  // Filter sections to only show those with available cards
  const visibleSections = dashboardFeatures.map(section => ({
    ...section,
    cards: section.cards.filter(card => card.available)
  })).filter(section => section.cards.length > 0);

  return (
    <>
      {/* <Header /> */}
    {/* <div className="max-w-7xl mx-auto p-6 space-y-8"> */}
      {/* Header */}
      {/* <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">User Dashboard</h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-emerald-700">Welcome back, {user.full_name || user.email}</span>
          <div className="flex gap-1">
            {user.roles?.map(role => (
              <Badge key={role} variant="outline" className="capitalize text-emerald-700 border-emerald-300">
                {role}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-emerald-600">Access orders, listings, analytics, and advanced features from your dashboard.</p>
      </div> */}

      {/* Quick Stats Overview */}
      
        {/* <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Active Orders</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card> */}

        {user.roles?.includes('seller') && (
          // <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          //   <CardContent className="pt-6">
          //     <div className="flex items-center justify-between">
          //       <div>
          //         <p className="text-purple-100">Active Listings</p>
          //         <p className="text-2xl font-bold">-</p>
          //       </div>
          //       <Package2 className="h-8 w-8 text-purple-100" />
          //     </div>
          //   </CardContent>
          // </Card>
          // <SellerAnalytics />

          <DashboardLayout userRole="seller" />
        )}

        {user.roles?.includes('buyer') && (
          // <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          //   <CardContent className="pt-6">
          //     <div className="flex items-center justify-between">
          //       <div>
          //         <p className="text-green-100">Wishlist Items</p>
          //         <p className="text-2xl font-bold">-</p>
          //       </div>
          //       <Heart className="h-8 w-8 text-green-100" />
          //     </div>
          //   </CardContent>
          // </Card>
          // <BuyerOffersInbox />
          <DashboardLayout userRole="buyer" />
        )}

        {/* <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Notifications</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <Bell className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card> */}
      

      {/* Dashboard Feature Sections */}
      {/* {visibleSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <section.icon className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold text-emerald-900">{section.title}</h2>
          </div>
          <p className="text-emerald-700 mb-4">{section.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.cards.map((card, cardIndex) => (
              <Card key={cardIndex} className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-emerald-900">
                    <card.icon className="h-5 w-5 text-emerald-600" />
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-700 text-sm mb-4">{card.description}</p>
                  <Button 
                    onClick={card.action}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Access
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))} */}

      {/* Note about dropdown features */}
      {/* <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-emerald-900 mb-2">Need basic account features?</h3>
        <p className="text-emerald-800">
          Profile settings, payment methods, addresses, messages, and other basic features 
          are available in the user dropdown menu (click your profile picture in the top right).
        </p>
      </div> */}

      {/* Footer */}
      {/* <div className="text-center py-8 border-t border-emerald-200">
        <p className="text-emerald-600">Need help navigating your dashboard? Contact our support team.</p>
      </div> */}
    {/* </div> */}
      {/* <Footer /> */}
      </>
  );
};

export default UniversalDashboard;