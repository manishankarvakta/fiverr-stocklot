import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import SendOfferModal from '../components/buyRequests/SendOfferModal';
import { 
  MapPin, Clock, Package, Eye, Heart, Shield, FileText, 
  ImageIcon, Truck, CheckCircle, AlertCircle 
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Image Gallery Component
const ImageGallery = ({ images, alt = "Buy Request Images" }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg flex items-center justify-center">
        <ImageIcon className="h-12 w-12 text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
        <img 
          src={images[selectedImage]} 
          alt={`${alt} ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                selectedImage === index ? 'border-emerald-500' : 'border-gray-200'
              }`}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Buy Request Card
const EnhancedBuyRequestCard = ({ request, onViewDetails, onSendOffer }) => {
  const timeRemaining = () => {
    const deadline = new Date(request.deadline_at);
    const now = new Date();
    const diff = deadline - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: 'Expired', color: 'text-red-600' };
    if (days < 3) return { text: `${days} days left`, color: 'text-orange-600' };
    return { text: `${days} days left`, color: 'text-green-600' };
  };

  const remaining = timeRemaining();

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-emerald-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-emerald-900">
              WANTED: {request.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {request.species}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {request.product_type}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            {request.has_target_price && (
              <div className="text-lg font-bold text-emerald-600">
                R{request.target_price || 'TBD'}/unit
              </div>
            )}
            <div className={`text-sm ${remaining.color}`}>
              <Clock className="inline h-3 w-3 mr-1" />
              {remaining.text}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Image Preview */}
        {request.images && request.images.length > 0 && (
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={request.images[0]} 
              alt="Request reference"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">{request.qty} {request.unit}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>{request.province}</span>
          </div>
        </div>

        {/* Enhanced Features */}
        <div className="flex flex-wrap gap-2">
          {request.weight_range && (
            <Badge variant="outline" className="text-xs">
              Weight: {request.weight_range.min || '?'}-{request.weight_range.max || '?'} {request.weight_range.unit}
            </Badge>
          )}
          {request.age_requirements && (
            <Badge variant="outline" className="text-xs">
              Age: {request.age_requirements.min || '?'}-{request.age_requirements.max || '?'} {request.age_requirements.unit}
            </Badge>
          )}
          {request.vaccination_requirements && request.vaccination_requirements.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Vaccinations Required
            </Badge>
          )}
          {request.has_vet_certificates && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Vet Cert Required
            </Badge>
          )}
          {request.delivery_preferences !== 'both' && (
            <Badge variant="outline" className="text-xs">
              <Truck className="h-3 w-3 mr-1" />
              {request.delivery_preferences === 'pickup' ? 'Pickup Only' : 'Delivery Only'}
            </Badge>
          )}
          {request.inspection_allowed && (
            <Badge variant="outline" className="text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Inspection OK
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{request.offers_count} offers</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(request)}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              View Details
            </Button>
            <Button 
              size="sm"
              onClick={() => onSendOffer(request)}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              Send Offer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Request Detail Modal
const RequestDetailModal = ({ request, isOpen, onClose, onSendOffer }) => {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            WANTED: {request.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="media">Images & Docs</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Species:</span>
                    <span>{request.species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Product Type:</span>
                    <span>{request.product_type}</span>
                  </div>
                  {request.breed && (
                    <div className="flex justify-between">
                      <span className="font-medium">Breed:</span>
                      <span>{request.breed}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Quantity:</span>
                    <span>{request.qty} {request.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{request.province}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Deadline:</span>
                    <span>{new Date(request.deadline_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Pricing & Preferences</h3>
                <div className="space-y-2 text-sm">
                  {request.target_price ? (
                    <div className="flex justify-between">
                      <span className="font-medium">Target Price:</span>
                      <span className="text-emerald-600 font-semibold">R{request.target_price}/unit</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="font-medium">Budget:</span>
                      <span className="text-gray-600">Open to offers</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Delivery:</span>
                    <span className="capitalize">{request.delivery_preferences}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Inspection:</span>
                    <span>{request.inspection_allowed ? 'Allowed' : 'Not required'}</span>
                  </div>
                </div>
              </div>
            </div>

            {request.notes_excerpt && (
              <div>
                <h3 className="font-semibold mb-2">Additional Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {request.notes_excerpt}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {request.weight_range && (
                <div>
                  <h3 className="font-semibold mb-2">Weight Requirements</h3>
                  <p className="text-sm">
                    {request.weight_range.min ? `Min: ${request.weight_range.min} ${request.weight_range.unit}` : 'No minimum'} • 
                    {request.weight_range.max ? ` Max: ${request.weight_range.max} ${request.weight_range.unit}` : ' No maximum'}
                  </p>
                </div>
              )}

              {request.age_requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Age Requirements</h3>
                  <p className="text-sm">
                    {request.age_requirements.min ? `Min: ${request.age_requirements.min} ${request.age_requirements.unit}` : 'No minimum'} • 
                    {request.age_requirements.max ? ` Max: ${request.age_requirements.max} ${request.age_requirements.unit}` : ' No maximum'}
                  </p>
                </div>
              )}
            </div>

            {request.vaccination_requirements && request.vaccination_requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Required Vaccinations</h3>
                <div className="flex flex-wrap gap-2">
                  {request.vaccination_requirements.map((vaccine, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                      <Shield className="h-3 w-3 mr-1" />
                      {vaccine}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {request.additional_requirements && (
              <div>
                <h3 className="font-semibold mb-2">Additional Requirements</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {request.additional_requirements}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            {request.images && request.images.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-3">Reference Images</h3>
                <ImageGallery images={request.images} alt="Buy Request Reference" />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No reference images provided</p>
              </div>
            )}

            {request.vet_certificates && request.vet_certificates.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Vet Certificates</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {request.vet_certificates.map((cert, index) => (
                    <div key={index} className="border rounded-lg p-3 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm">Certificate {index + 1}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="text-center py-8">
              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="font-semibold mb-2">Ready to Make an Offer?</h3>
                <p className="text-gray-600 mb-4">
                  Contact the buyer with your best offer and delivery details.
                </p>
                <Button 
                  onClick={() => onSendOffer(request)}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  Send Your Offer
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const EnhancedPublicBuyRequestsPage = ({ user, onLogin }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  const navigate = useNavigate();

  // Load buy requests
  useEffect(() => {
    const loadBuyRequests = async () => {
      try {
        console.log('Loading enhanced buy requests from:', `${BACKEND_URL}/api/public/buy-requests`);
        
        const response = await fetch(`${BACKEND_URL}/api/public/buy-requests?limit=20`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Enhanced buy requests loaded:', data);
        
        setRequests(data.items || []);
        setError(null);
        
      } catch (error) {
        console.error('Error loading buy requests:', error);
        setError(`Failed to load buy requests: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadBuyRequests();
  }, []);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  const handleSendOffer = (request) => {
    if (!user) {
      // Show login prompt
      if (onLogin) {
        onLogin();
      } else {
        navigate('/login');
      }
      return;
    }

    if (!user.roles?.includes('seller')) {
      alert('You need a seller account to send offers. Please update your account type.');
      return;
    }

    // Set the selected request and show the offer modal
    setSelectedRequest(request);
    setShowOfferModal(true);
  };

  const handleOfferSuccess = () => {
    setShowOfferModal(false);
    setSelectedRequest(null);
    // Refresh the requests to update offer counts
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enhanced buy requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Buy Requests</h1>
          <p className="text-gray-600 mt-1">
            Browse livestock purchase requests from buyers across South Africa
          </p>
        </div>
        
        {user && user.roles?.includes('buyer') && (
          <Button 
            onClick={() => navigate('/create-buy-request')}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
          >
            + Post Buy Request
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          {requests.length} active requests found • Enhanced with images, requirements, and detailed specifications
        </p>
      </div>

      {/* Results Grid */}
      {requests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map(request => (
            <EnhancedBuyRequestCard
              key={request.id}
              request={request}
              onViewDetails={handleViewDetails}
              onSendOffer={handleSendOffer}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">No buy requests found</h3>
          <p className="text-gray-600 mb-4">
            Be the first to post a comprehensive buy request with images and detailed requirements.
          </p>
          {user && user.roles?.includes('buyer') && (
            <Button 
              onClick={() => navigate('/create-buy-request')}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              Create Your First Request
            </Button>
          )}
        </div>
      )}

      {/* Request Detail Modal */}
      <RequestDetailModal
        request={selectedRequest}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onSendOffer={handleSendOffer}
      />
    </div>
  );
};

export default EnhancedPublicBuyRequestsPage;