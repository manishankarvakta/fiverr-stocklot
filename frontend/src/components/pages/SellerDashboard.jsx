import { useAuth } from "@/auth/AuthProvider";

function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user || !user.roles?.includes('seller')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Seller Access Required</h2>
            <p className="text-emerald-700">Please log in as a seller to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900">Seller Dashboard</h1>
          <p className="text-emerald-700 mt-2">Manage your livestock business</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-emerald-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              My Listings
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Delivery Rates
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Active Listings</p>
                      <p className="text-2xl font-bold text-emerald-900">12</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <Package className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-emerald-900">R45,320</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <DollarSign className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Pending Orders</p>
                      <p className="text-2xl font-bold text-emerald-900">3</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <Clock className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">My Listings</CardTitle>
                <CardDescription>Manage your livestock listings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your livestock listings will appear here.</p>
                <Button className="mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                  Create New Listing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryRateForm />
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">Order Management</CardTitle>
                <CardDescription>Track and manage your orders</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your order history will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">Sales Analytics</CardTitle>
                <CardDescription>Track your business performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your analytics dashboard will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
export default SellerDashboard;