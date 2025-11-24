import { CheckCircle } from "lucide-react";
import { Button, Card, CardContent } from "../ui";
function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-emerald-700">No hidden fees. Pay only when you sell.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-emerald-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-semibold text-emerald-900 mb-4">For Buyers</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-4">FREE</div>
                <p className="text-emerald-700 mb-6">Browse, search, and buy livestock with no fees</p>
                <ul className="space-y-2 text-emerald-700 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Unlimited browsing</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Smart AI search</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Secure payments</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Buyer protection</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 ring-2 ring-emerald-500">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-semibold text-emerald-900 mb-4">For Sellers</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-4">10%</div>
                <p className="text-emerald-700 mb-6">Commission only on successful sales</p>
                <ul className="space-y-2 text-emerald-700 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Unlimited listings</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Seller verification</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Escrow protection</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> 24/7 support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg mr-4"
              onClick={() => window.location.href = '/register'}
            >
              Start Selling
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-3 text-lg"
              onClick={() => window.location.href = '/marketplace'}
            >
              Browse Livestock
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Pricing;