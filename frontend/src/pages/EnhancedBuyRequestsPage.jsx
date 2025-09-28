import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Plus, 
  Brain, 
  Map, 
  BarChart3, 
  Target, 
  Sparkles,
  Users,
  TrendingUp,
  MapPin
} from 'lucide-react';

// Import enhanced components
import EnhancedCreateBuyRequestForm from '../components/buyRequests/EnhancedCreateBuyRequestForm';
import MapViewBuyRequests from '../components/buyRequests/MapViewBuyRequests';
import IntelligentMatchingDashboard from '../components/buyRequests/IntelligentMatchingDashboard';
import MarketAnalyticsDashboard from '../components/analytics/MarketAnalyticsDashboard';
import BuyRequestsList from '../components/buyRequests/BuyRequestsList';

const EnhancedBuyRequestsPage = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [userRole, setUserRole] = useState('BUYER');
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeMatches: 0,
    avgResponseTime: '2.3h'
  });

  // Get user role from auth context or localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.roles && payload.roles.includes('SELLER')) {
          setUserRole('SELLER');
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  // Load basic stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests?limit=1`);
        if (res.ok) {
          const data = await res.json();
          setStats(prev => ({
            ...prev,
            totalRequests: data.total_count || 0
          }));
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
  }, []);

  const tabConfig = [
    {
      id: 'browse',
      label: 'Browse Requests',
      icon: Target,
      description: 'View and search buy requests',
      badge: null
    },
    {
      id: 'map',
      label: 'Map View',
      icon: Map,
      description: 'Interactive map of requests',
      badge: 'New'
    },
    ...(userRole === 'SELLER' ? [{
      id: 'matching',
      label: 'Smart Matching',
      icon: Brain,
      description: 'AI-powered matches',
      badge: 'AI'
    }] : []),
    {
      id: 'create',
      label: 'Create Request',
      icon: Plus,
      description: 'Post a new buy request',
      badge: null
    },
    {
      id: 'analytics',
      label: 'Market Analytics',
      icon: BarChart3,
      description: 'Market trends and insights',
      badge: 'AI'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="border-b relative overflow-hidden"
        style={{
          backgroundImage: `url('https://customer-assets.emergentagent.com/job_procurement-hub-10/artifacts/uftjgtw8_unnamed%20%282%29.png')`,
          backgroundSize: 'contain',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'white'
        }}
      >
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Enhanced Buy Requests
                </h1>
                <p className="mt-2 text-gray-600">
                  AI-powered livestock marketplace with intelligent matching and location insights
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
                  <div className="text-sm text-gray-500">Active Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeMatches}</div>
                  <div className="text-sm text-gray-500">Smart Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}</div>
                  <div className="text-sm text-gray-500">Avg Response</div>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Brain className="h-3 w-3 mr-1" />
                AI-Powered Matching
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <MapPin className="h-3 w-3 mr-1" />
                Location Intelligence
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                Market Analytics
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <Users className="h-3 w-3 mr-1" />
                Smart Notifications
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 mb-8 bg-white border">
            {tabConfig.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex flex-col items-center gap-2 py-4 data-[state=active]:bg-blue-50"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        tab.badge === 'AI' ? 'bg-purple-100 text-purple-800' : 
                        tab.badge === 'New' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 hidden lg:block">
                  {tab.description}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Browse Buy Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BuyRequestsList 
                  canRespond={userRole === 'SELLER'} 
                  defaultCountry="ZA" 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Interactive Map View
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    New Feature
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MapViewBuyRequests 
                  canRespond={userRole === 'SELLER'} 
                  defaultCountry="ZA" 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {userRole === 'SELLER' && (
            <TabsContent value="matching" className="space-y-6">
              <IntelligentMatchingDashboard userRole={userRole} />
            </TabsContent>
          )}

          <TabsContent value="create" className="space-y-6">
            <EnhancedCreateBuyRequestForm 
              defaultCountry="ZA"
              provinces={[
                'Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape',
                'Free State','Limpopo','Mpumalanga','North West','Northern Cape'
              ]}
              onCreated={(requestId) => {
                // Handle successful creation
                console.log('Request created:', requestId);
                setActiveTab('browse');
              }}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <MarketAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Enhanced with AI-powered features including intelligent matching, price suggestions, and location-based insights.</p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <span>🤖 AI Analysis</span>
              <span>🗺️ Location Intelligence</span>
              <span>📊 Market Analytics</span>
              <span>⚡ Smart Matching</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBuyRequestsPage;