import { Search, Shield, Truck } from "lucide-react";
import { Button, Card, CardContent } from "../ui";


function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">How StockLot Works</h1>
            <p className="text-xl text-emerald-700">Simple, secure, and efficient livestock trading</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">1. Browse & Search</h3>
                <p className="text-emerald-700">Use our smart search to find the exact livestock you need, from day-old chicks to breeding cattle.</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">2. Secure Payment</h3>
                <p className="text-emerald-700">Pay safely with our escrow system. Your money is held securely until delivery is confirmed.</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">3. Pickup/Delivery</h3>
                <p className="text-emerald-700">Arrange pickup or delivery with the seller. Confirm receipt to release payment.</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/marketplace'}
            >
              Start Browsing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default HowItWorks;