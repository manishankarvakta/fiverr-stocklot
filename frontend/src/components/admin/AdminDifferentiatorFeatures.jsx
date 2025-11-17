import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui';
import { 
  Users, Gavel, Truck, Shield, CreditCard, 
  TrendingUp, Award, RefreshCw, BarChart3
} from 'lucide-react';
import AdminFeatureFlags from './AdminFeatureFlags';

const AdminDifferentiatorFeatures = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      key: 'group_buy',
      name: 'Group Buying / Bill Splitting',
      icon: Users,
      description: 'Multiple buyers jointly purchase livestock',
      status: 'Implemented',
      endpoints: ['/group-buys', '/group-buys/{id}/pledge', '/group-buys/{id}/pay']
    },
    {
      key: 'auction',
      name: 'Auction Mode',
      icon: Gavel,
      description: 'Real-time bidding system with anti-sniping',
      status: 'Implemented',
      endpoints: ['/auctions', '/auctions/{id}/bids']
    },
    {
      key: 'transport',
      name: 'Logistics Integration',
      icon: Truck,
      description: 'Transport quotes and booking system',
      status: 'Implemented',
      endpoints: ['/transport/quotes', '/transport/book']
    },
    {
      key: 'insurance',
      name: 'Insurance Toggle',
      icon: Shield,
      description: 'Mortality-in-transit insurance coverage',
      status: 'Implemented',
      endpoints: ['/insurance/quotes', '/insurance/buy']
    },
    {
      key: 'finance',
      name: 'Micro-credit Financing',
      icon: CreditCard,
      description: 'Buy now, pay later functionality',
      status: 'Implemented',
      endpoints: ['/financing/apply']
    },
    {
      key: 'trust_engine',
      name: 'Trust Score System',
      icon: Award,
      description: 'Reputation and risk assessment engine',
      status: 'Implemented',
      endpoints: ['/trust/score/{user_id}', '/trust/my-score']
    },
    {
      key: 'price_guidance',
      name: 'AI Price Guidance',
      icon: TrendingUp,
      description: 'Smart price recommendations and market analysis',
      status: 'Backend Ready',
      endpoints: ['Integration with existing AI services']
    },
    {
      key: 'referrals',
      name: 'Referral Program',
      icon: RefreshCw,
      description: 'User referral rewards system',
      status: 'Framework Ready',
      endpoints: ['To be implemented']
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Implemented': return 'bg-green-500';
      case 'Backend Ready': return 'bg-blue-500';
      case 'Framework Ready': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Differentiator Features</h1>
        <div className="text-sm text-gray-500">
          StockLot Advanced Features Management
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Feature Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.key}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="h-5 w-5" />
                        {feature.name}
                      </CardTitle>
                      <div 
                        className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(feature.status)}`}
                      >
                        {feature.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-gray-700">API Endpoints:</div>
                      {feature.endpoints.map((endpoint, index) => (
                        <div key={index} className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                          {endpoint}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Implementation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Implementation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {features.filter(f => f.status === 'Implemented').length}
                  </div>
                  <div className="text-sm text-gray-500">Fully Implemented</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {features.filter(f => f.status === 'Backend Ready').length}
                  </div>
                  <div className="text-sm text-gray-500">Backend Ready</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {features.filter(f => f.status === 'Framework Ready').length}
                  </div>
                  <div className="text-sm text-gray-500">Framework Ready</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-green-800 mb-2">
                  🎉 Major Achievement: All Core Differentiators Implemented!
                </div>
                <div className="text-sm text-green-700">
                  StockLot now has all the key features that set it apart from competitors:
                  Group Buying, Live Auctions, Transport Integration, Insurance Options, 
                  Micro-credit Financing, and Trust Scoring system.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feature-flags">
          <AdminFeatureFlags />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                Analytics dashboard coming soon...
                <div className="text-sm mt-2">
                  Track feature adoption, user engagement, and business impact
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDifferentiatorFeatures;