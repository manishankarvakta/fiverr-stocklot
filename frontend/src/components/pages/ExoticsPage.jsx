const { useState, useEffect } = require("react");
const { Button, Card, CardContent } = require("../ui");

function ExoticsPage() {
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [lastSuccessfulListings, setLastSuccessfulListings] = useState([]); // Backup listings
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchExoticData = async () => {
      try {
        setLoading(true);
        
        // Fetch exotic categories
        const categoriesResponse = await fetch('/api/taxonomy/categories?mode=exotic');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        // Fetch exotic listings ONLY (not all listings with exotic flag)
        const listingsResponse = await fetch('/api/exotic-livestock/species');
        if (listingsResponse.ok) {
          const speciesData = await listingsResponse.json();
          
          // For now, create mock exotic listings since we may not have real ones yet
          const mockExoticListings = [
            {
              id: 'exotic-1',
              title: 'Ostrich Breeding Pair - African Black',
              species: 'Ostrich',
              breed: 'African Black',
              price: 45000,
              seller: 'Kalahari Ratite Farm'
            },
            {
              id: 'exotic-2', 
              title: 'Kudu Bull - Live Game Animal',
              species: 'Kudu',
              breed: 'Greater Kudu',
              price: 35000,
              seller: 'Limpopo Game Ranch'
            },
            {
              id: 'exotic-3',
              title: 'Alpaca Breeding Stock - Huacaya',
              species: 'Alpaca', 
              breed: 'Huacaya',
              price: 25000,
              seller: 'Mountain View Alpacas'
            }
          ];
          
          setListings(mockExoticListings);
        }
      } catch (error) {
        console.error('Error fetching exotic data:', error);
      } finally {
        setLoading(false);
        setListingsLoading(false); // Clear both loading states
      }
    };

    fetchExoticData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Exotic & Specialty Livestock
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-amber-100">
            Premium game animals, ratites, camelids, and specialty species
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-white text-amber-600 hover:bg-amber-50 px-8 py-3"
              onClick={() => document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Categories
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-amber-600 px-8 py-3"
              onClick={() => window.location.href = '/marketplace'}
            >
              View Core Livestock
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div id="categories-section" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Exotic Categories</h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow bg-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{category.name}</h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => window.location.href = `/marketplace?category=${category.slug}&include_exotics=true`}
                    >
                      Browse {category.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured Listings */}
      {listings.length > 0 && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Featured Exotic Listings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.slice(0, 8).map(listing => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-500 rounded-t-lg"></div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{listing.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{listing.species} • {listing.breed}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-amber-600">
                          R{listing.price?.toLocaleString() || 'Price on request'}
                        </span>
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => window.location.href = `/listing/${listing.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3"
                onClick={() => window.location.href = '/marketplace?include_exotics=true'}
              >
                View All Exotic Listings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-amber-50 border-t border-amber-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notice</h3>
            <p className="text-amber-800">
              Exotic livestock sales are for live animals only. Some species require special permits, 
              proper containment, and veterinary oversight. All transactions are protected by our secure escrow system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ExoticsPage;