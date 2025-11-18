
import { 
  Button, Card, CardContent
} from "./components/ui";
function Blog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">StockLot Blog</h1>
            <p className="text-xl text-emerald-700">Latest news and insights from the livestock industry</p>
          </div>
          
          <Card className="border-emerald-200 text-center">
            <CardContent className="p-12">
              <div className="text-6xl mb-6">📰</div>
              <h2 className="text-2xl font-semibold text-emerald-900 mb-4">Coming Soon</h2>
              <p className="text-emerald-700 mb-8">
                We're preparing valuable content about livestock farming, market trends, and trading tips. 
                Stay tuned for expert insights and industry updates.
              </p>
              <Button 
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/marketplace'}
              >
                Explore Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}