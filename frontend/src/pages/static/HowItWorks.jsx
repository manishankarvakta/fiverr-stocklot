import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Search, Shield, Truck, CreditCard, CheckCircle, Users, TrendingUp } from 'lucide-react';
import Header from '@/components/ui/common/Header';
import Footer from '@/components/ui/common/Footer';

function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <Header />
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
                <p className="text-emerald-700">Pay securely through our escrow system. Your money is protected until you receive your livestock.</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">3. Delivery & Receive</h3>
                <p className="text-emerald-700">Arrange delivery or collection. Once confirmed, payment is released to the seller.</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-emerald-900 mb-6 text-center">Why Choose StockLot?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Verified Sellers</h3>
                  <p className="text-emerald-700">All sellers are verified and KYC-compliant for your peace of mind.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CreditCard className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Escrow Protection</h3>
                  <p className="text-emerald-700">Your payment is held securely until you confirm receipt of your order.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Community Reviews</h3>
                  <p className="text-emerald-700">Read authentic reviews from other buyers to make informed decisions.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <TrendingUp className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Best Prices</h3>
                  <p className="text-emerald-700">Compare prices from multiple sellers to get the best deals.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a 
              href="/marketplace" 
              className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-colors"
            >
              Start Shopping Now
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default HowItWorks;

