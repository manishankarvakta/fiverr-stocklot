import { CheckCircle } from "lucide-react";
import { Button, Card, CardContent } from "../ui";

function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">About StockLot</h1>
            <p className="text-xl text-emerald-700">Revolutionizing livestock trading in South Africa</p>
          </div>
          
          <Card className="border-emerald-200 mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Our Mission</h2>
              <p className="text-emerald-700 leading-relaxed mb-6">
                StockLot is South Africa's premier digital livestock marketplace, connecting farmers, buyers, and agricultural businesses across the country. We're committed to modernizing livestock trading with secure payments, verified sellers, and comprehensive animal categories.
              </p>
              <p className="text-emerald-700 leading-relaxed">
                From day-old chicks to breeding cattle, we provide a trusted platform where quality livestock meets reliable buyers, fostering growth in South Africa's agricultural sector.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">Why Choose StockLot?</h3>
                <ul className="space-y-2 text-emerald-700">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Secure escrow payments</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Verified sellers and animals</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Comprehensive categories</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Smart AI search</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">Our Impact</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">10,000+</div>
                    <div className="text-emerald-700">Animals traded</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">500+</div>
                    <div className="text-emerald-700">Verified farmers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">98%</div>
                    <div className="text-emerald-700">Satisfaction rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/register'}
            >
              Join StockLot Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AboutUs;