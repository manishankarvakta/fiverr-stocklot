
import { 
  Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Textarea, Badge, Avatar, AvatarFallback,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Tabs, TabsList, TabsTrigger, TabsContent,
  Switch, Alert, AlertDescription, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "./components/ui";
import { 
  Bell, Search, Menu, X, Users, Package, TrendingUp, DollarSign, 
  Eye, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Phone, Mail, Star, ShoppingCart, 
  CheckCircle, XCircle, AlertTriangle, AlertCircle, Filter, SortAsc, Home, Building, User, Settings, 
  LogOut, Edit, Trash2, Plus, RefreshCw, ArrowRight, ArrowLeft, ArrowLeftRight, Upload, Download, 
  FileText, Image, Video, Play, Pause, BarChart3, PieChart, Zap, Globe, Shield, CreditCard, 
  LayoutDashboard, MessageCircle, Ban, Check, Copy, Heart, Award, Truck, LogIn, Brain
} from "lucide-react";
import { getBackendUrl } from '@/utils/apiHelper';

function ListingCard({ listing, onViewDetails, onBidPlaced, showNotification, onAddToCart }) {
  console.log('🎯 ListingCard rendering:', listing.title); // Debug log
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const backendUrl = getBackendUrl();
      console.log('🛒 Adding to cart:', listing.id, 'Backend URL:', backendUrl); // Debug log

      const response = await fetch(`${backendUrl}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || user.email}`
        },
        body: JSON.stringify({
          listing_id: listing.id,
          quantity: 1,
          shipping_option: 'standard'
        })
      });

      console.log('🛒 Cart response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛒 Cart response data:', data); // Debug log
        showNotification?.(`${listing.title} added to cart!`, 'success');
        onAddToCart?.(data.cart_item_count);
      } else {
        const errorData = await response.text();
        console.error('🛒 Cart error response:', response.status, errorData);
        throw new Error(`Failed to add to cart: ${response.status} ${errorData}`);
      }
    } catch (error) {
      console.error('🚨 Error adding to cart:', error);
      showNotification?.('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = (listing) => {
    if (!user) {
      // For guest users, add to cart and redirect to guest checkout
      const cartItem = {
        listing_id: listing.id,
        title: listing.title,
        price: listing.price_per_unit,
        qty: 1,
        species: listing.species_id,
        product_type: listing.product_type_id
      };
      
      // Add to cart in localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item.listing_id === listing.id);
      
      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].qty += 1;
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Redirect to guest checkout
      navigate('/checkout/guest'); 
      return;
    }
    
    // For authenticated users, show the listing details
    onViewDetails(listing);
  };

  // Separate function for viewing details (works for both guests and authenticated users)
  const handleViewDetails = (listing) => {
    // Navigate to PDP page for both guests and authenticated users
    navigate(`/listing/${listing.id}`);
  };

  const isAuction = listing.listing_type === 'auction' || listing.listing_type === 'hybrid';
  const isExpired = listing.auction_end_time && new Date(listing.auction_end_time) < new Date();
  const timeRemainingCalc = listing.auction_end_time ? new Date(listing.auction_end_time) - new Date() : 0;
  
  // Update timeRemaining state
  useEffect(() => {
    setTimeRemaining(timeRemainingCalc);
  }, [timeRemainingCalc]);
  
  // Mock service area for demonstration - in real app this comes from listing data
  const serviceArea = listing.service_area || {
    mode: 'RADIUS',
    origin: { lat: -26.2041 + (Math.random() - 0.5) * 4, lng: 28.0473 + (Math.random() - 0.5) * 4 },
    radius_km: 150 + Math.random() * 200
  };
  
  // Format time remaining
  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const getCurrentPrice = () => {
    if (listing.listing_type === 'buy_now') {
      return listing.price_per_unit;
    }
    return listing.current_bid || listing.starting_price || listing.price_per_unit;
  };

  return (
    <Card className="border-emerald-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Listing Type Badge */}
      <div className="absolute top-3 left-3 z-10">
        {listing.listing_type === 'buy_now' && (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Buy Now
          </Badge>
        )}
        {listing.listing_type === 'auction' && (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            Auction
          </Badge>
        )}
        {listing.listing_type === 'hybrid' && (
          <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
            <DollarSign className="h-3 w-3 mr-1" />
            Hybrid
          </Badge>
        )}
      </div>

      {/* Countdown Timer for Auctions */}
      {isAuction && !isExpired && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-red-500 hover:bg-red-600 text-white animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimeRemaining(timeRemaining)}
          </Badge>
        </div>
      )}

      {isExpired && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gray-500 text-white">
            Ended
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center relative">
          <span className="text-6xl">
            {listing.title?.toLowerCase().includes('chicken') || listing.title?.toLowerCase().includes('poultry') ? '🐔' : 
             listing.title?.toLowerCase().includes('goat') ? '🐐' : 
             listing.title?.toLowerCase().includes('cattle') || listing.title?.toLowerCase().includes('cow') ? '🐄' : 
             listing.title?.toLowerCase().includes('sheep') ? '🐑' : 
             listing.title?.toLowerCase().includes('pig') ? '🐷' : '🐾'}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-emerald-900 line-clamp-2 flex-1">{listing.title}</h3>
            {/* Delivery Range Badge - Temporarily disabled until component is created */}
            <Badge variant="outline" className="text-xs">
              {listing.seller_country || 'ZA'}
            </Badge>
          </div>
          
          {/* Pricing Display */}
          <div className="mb-3">
            {listing.listing_type === 'buy_now' && (
              <div className="text-2xl font-bold text-emerald-600">
                R{getCurrentPrice()}
                <span className="text-sm text-emerald-500 ml-1">per {listing.unit}</span>
              </div>
            )}
            
            {listing.listing_type === 'auction' && (
              <div>
                <div className="text-lg text-emerald-700 mb-1">
                  Current Bid: <span className="font-bold text-emerald-600">R{getCurrentPrice()}</span>
                </div>
                {listing.reserve_price && (
                  <div className="text-sm text-emerald-500">
                    Reserve: R{listing.reserve_price}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {listing.total_bids || 0} bid(s)
                </div>
              </div>
            )}
            
            {listing.listing_type === 'hybrid' && (
              <div>
                <div className="text-lg text-emerald-700 mb-1">
                  Current Bid: <span className="font-bold text-emerald-600">R{getCurrentPrice()}</span>
                </div>
                <div className="text-sm text-blue-600 font-semibold">
                  Buy Now: R{listing.buy_now_price}
                </div>
                <div className="text-xs text-gray-500">
                  {listing.total_bids || 0} bid(s)
                </div>
              </div>
            )}
          </div>

          {/* Location & Quantity */}
          <div className="flex justify-between text-sm text-emerald-600 mb-3">
            <span><MapPin className="inline h-4 w-4 mr-1" />{listing.city || listing.region}</span>
            <span>Qty: {listing.quantity}</span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                {listing.seller_name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-emerald-700">{listing.seller_name || 'Verified Seller'}</span>
            {listing.has_vet_certificate && (
              <Badge className="text-xs bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Vet Certified
              </Badge>
            )}
          </div>

          {/* Livestock Specifications */}
          <div className="mb-4 space-y-2">
            {/* Weight and Age Information */}
            {(listing.weight_kg || listing.age_weeks || listing.age_days || listing.breed) && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {listing.weight_kg && (
                  <div>
                    <span className="font-semibold text-gray-700">Weight:</span> {listing.weight_kg} kg
                  </div>
                )}
                {(listing.age_weeks || listing.age_days) && (
                  <div>
                    <span className="font-semibold text-gray-700">Age:</span> 
                    {listing.age_weeks ? ` ${listing.age_weeks} weeks` : ''}
                    {listing.age_days ? ` ${listing.age_days} days` : ''}
                    {!listing.age_weeks && !listing.age_days && listing.age ? ` ${listing.age}` : ''}
                  </div>
                )}
                {listing.breed && (
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Breed:</span> {listing.breed}
                  </div>
                )}
              </div>
            )}

            {/* Health and Vaccination Information */}
            {(listing.vaccination_status || listing.health_certificates || listing.description?.includes('vaccin') || listing.description?.includes('health')) && (
              <div className="flex flex-wrap gap-1">
                {listing.vaccination_status && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {listing.vaccination_status}
                  </Badge>
                )}
                {listing.health_certificates && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Health Certificate
                  </Badge>
                )}
                {listing.description?.toLowerCase().includes('marek') && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    Marek's Vaccinated
                  </Badge>
                )}
                {listing.description?.toLowerCase().includes('newcastle') && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Newcastle Vaccinated
                  </Badge>
                )}
                {listing.has_vet_certificate && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    Inspection OK
                  </Badge>
                )}
              </div>
            )}

            {/* Additional Specifications */}
            {listing.description && listing.description.length > 0 && (
              <div className="text-xs text-gray-600 line-clamp-2">
                {listing.description}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {listing.listing_type === 'buy_now' && (
              <>
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button 
                  variant="outline"
                  className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleViewDetails(listing)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </>
            )}
            
            {listing.listing_type === 'auction' && !isExpired && (
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                onClick={() => onBidPlaced(listing)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Place Bid
              </Button>
            )}
            
            {listing.listing_type === 'hybrid' && !isExpired && (
              <>
                <Button 
                  variant="outline"
                  className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => onBidPlaced(listing)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Bid
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  onClick={() => handleBuyNow(listing)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </>
            )}
            
            {isExpired && (
              <Button variant="outline" className="flex-1" disabled>
                Auction Ended
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}