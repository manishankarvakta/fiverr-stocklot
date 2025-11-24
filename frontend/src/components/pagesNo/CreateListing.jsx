import { useAuth } from "@/auth/AuthProvider";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateListingMutation } from "@/store/api/listings.api";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { DollarSign, FileText, ShoppingCart, TrendingUp, Upload, Image as ImageIcon, X } from "lucide-react";

// Get backend URL
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
};

function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createListing, { isLoading: isCreating }] = useCreateListingMutation();
  const [taxonomy, setTaxonomy] = useState([]);
  const [coreCategories, setCoreCategories] = useState([]);
  const [exoticCategories, setExoticCategories] = useState([]);
  const [showExoticCategories, setShowExoticCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [formData, setFormData] = useState({
    category_group_id: '',
    species_id: '',
    breed_id: '',
    product_type_id: '',
    title: '',
    description: '',
    quantity: 1,
    unit: 'head',
    price_per_unit: '',
    listing_type: 'buy_now',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    auction_duration: '24',
    delivery_available: false,
    has_vet_certificate: false,
    health_notes: '',
    region: '',
    city: '',
    images: [],
    certificates: [],
    age: '',
    sex: '',
    weight: '',
    vaccination_status: '',
    health_status: 'healthy',
    veterinary_certificate: false,
    animal_type: '',
    survival_rate: ''
  });

  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [filteredProductTypes, setFilteredProductTypes] = useState([]);

  useEffect(() => {
    if (user && user.roles?.includes('seller')) {
      fetchTaxonomy();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.roles?.includes('seller')) {
      fetchTaxonomy();
    }
  }, [showExoticCategories]);

  const fetchTaxonomy = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      
      // Fetch core categories
      const coreResponse = await fetch(`${backendUrl}/api/taxonomy/categories?mode=core`);
      if (coreResponse.ok) {
        const coreData = await coreResponse.json();
        setCoreCategories(coreData);
      }

      // Fetch exotic categories if enabled
      if (showExoticCategories) {
        const exoticResponse = await fetch(`${backendUrl}/api/taxonomy/categories?mode=exotic`);
        if (exoticResponse.ok) {
          const exoticData = await exoticResponse.json();
          setExoticCategories(exoticData);
        }
      } else {
        setExoticCategories([]);
      }

      // Fetch full taxonomy for species/breeds
      const taxonomyResponse = await fetch(`${backendUrl}/api/taxonomy/full`);
      if (taxonomyResponse.ok) {
        const data = await taxonomyResponse.json();
        setTaxonomy(data);
      }
      
    } catch (error) {
      console.error('Error fetching taxonomy:', error);
      setTaxonomy([]);
      setCoreCategories([]);
      setExoticCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryGroupChange = (groupId) => {
    const selectedGroup = taxonomy.find(t => t.group.id === groupId);
    setFormData({
      ...formData,
      category_group_id: groupId,
      species_id: '',
      breed_id: '',
      product_type_id: ''
    });
    
    setFilteredSpecies(selectedGroup ? selectedGroup.species : []);
    setFilteredProductTypes(selectedGroup ? selectedGroup.product_types : []);
    setFilteredBreeds([]);
  };

  const handleSpeciesChange = (speciesId) => {
    const selectedSpecies = filteredSpecies.find(s => s.id === speciesId);
    setFormData({
      ...formData,
      species_id: speciesId,
      breed_id: ''
    });
    
    setFilteredBreeds(selectedSpecies ? selectedSpecies.breeds : []);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    // Create previews
    const previews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setImagePreviews(previews);
    setFormData({...formData, images: files});
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({...formData, images: newImages});
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Get current context
      const currentContext = localStorage.getItem('currentContext') || 'user';
      
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'images' || key === 'certificates') {
          // Handle files separately
          return;
        }
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Append images
      formData.images.forEach((image, index) => {
        submitData.append(`images`, image);
      });

      // Append certificates
      formData.certificates.forEach((cert, index) => {
        submitData.append(`certificates`, cert);
      });

      // Create listing with FormData and organization context
      const result = await createListing({
        data: submitData,
        headers: {
          'X-Org-Context': currentContext
        }
      }).unwrap();
      
      // Success - navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(error?.data?.detail || error?.message || 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !user.roles?.includes('seller')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Seller Access Required</h2>
            <p className="text-emerald-600">You need seller privileges to create listings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">📦</span>
          </div>
          <p className="text-emerald-700">Loading taxonomy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">Create New Listing</h1>
          <p className="text-emerald-700">List your livestock for sale on the StockLot marketplace</p>
        </div>

        {/* Context Banner */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-blue-900">Creating listing as:</span>
              <span className="text-blue-700">
                {localStorage.getItem('currentContext') === 'user' ? 
                  `${user.full_name || user.email} (Personal)` : 
                  'Organization'
                }
              </span>
              <span className="text-blue-600">•</span>
              <span className="text-blue-600">Switch context in the header above if needed</span>
            </div>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Livestock Details</CardTitle>
            <CardDescription>Provide comprehensive information about your livestock</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Exotic Categories Toggle */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-900 mb-1">Livestock Category Selection</h3>
                      <p className="text-sm text-emerald-700">Choose the category that best fits your livestock</p>
                    </div>
                    
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <span className="text-sm text-gray-700">Show Exotic & Specialty</span>
                      <input
                        type="checkbox"
                        checked={showExoticCategories}
                        onChange={(e) => setShowExoticCategories(e.target.checked)}
                        className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                      />
                      <span className="text-xs text-gray-500">(Ostrich, Game Animals, etc.)</span>
                    </label>
                  </div>
                  
                  {showExoticCategories && (
                    <div className="mt-3 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-amber-800">Exotic Livestock Requirements</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Some exotic species require special permits, proper containment, and veterinary oversight. 
                            Ensure you comply with all regulations before listing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Category Group *</Label>
                  <Select value={formData.category_group_id} onValueChange={handleCategoryGroupChange}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select category group" />
                    </SelectTrigger>
                    <SelectContent>
                      {coreCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      
                      {showExoticCategories && exoticCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100">
                            Exotic & Specialty
                          </div>
                          {exoticCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              🌟 {category.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-emerald-800">Species *</Label>
                  <Select value={formData.species_id} onValueChange={handleSpeciesChange} disabled={!formData.category_group_id}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSpecies.map((species, index) => (
                        <SelectItem key={species.id || index} value={species.id || ''}>
                          {species.name || 'Unknown Species'}
                          {species.is_free_range && " (Free Range)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Breed</Label>
                  <Select value={formData.breed_id} onValueChange={(value) => setFormData({...formData, breed_id: value})} disabled={!formData.species_id}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select breed (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific breed</SelectItem>
                      {(filteredBreeds || []).filter(breed => breed && breed.id && breed.id !== "").map(breed => (
                        <SelectItem key={breed.id} value={breed.id}>
                          {breed.name}
                          {breed.purpose_hint && ` (${breed.purpose_hint})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-emerald-800">Product Type *</Label>
                  <Select value={formData.product_type_id} onValueChange={(value) => setFormData({...formData, product_type_id: value})} disabled={!formData.category_group_id}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(filteredProductTypes || []).filter(type => type && type.id && type.id !== "").map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <Label className="text-emerald-800">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Premium Ross 308 Day-Old Chicks"
                  className="border-emerald-200"
                  required
                />
              </div>

              <div>
                <Label className="text-emerald-800">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of your livestock..."
                  className="border-emerald-200"
                  rows={4}
                />
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-emerald-800">Quantity *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  min="1"
                  className="border-emerald-200"
                  required
                />
              </div>

              {/* Pricing & Listing Type */}
              <div className="space-y-6">
                <div>
                  <Label className="text-emerald-800 text-lg font-semibold">Listing Type *</Label>
                  <p className="text-sm text-emerald-600 mb-4">Choose how you want to sell your livestock</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${formData.listing_type === 'buy_now' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => setFormData({...formData, listing_type: 'buy_now'})}
                    >
                      <CardContent className="p-4 text-center">
                        <ShoppingCart className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900">Buy Now</h3>
                        <p className="text-xs text-emerald-600 mt-1">Fixed price, instant sale</p>
                        <p className="text-xs text-emerald-500 mt-2">Best for: Daily items, eggs, chicks, market-ready livestock</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all ${formData.listing_type === 'auction' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => setFormData({...formData, listing_type: 'auction'})}
                    >
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900">Auction</h3>
                        <p className="text-xs text-emerald-600 mt-1">Competitive bidding</p>
                        <p className="text-xs text-emerald-500 mt-2">Best for: Rare breeds, breeding stock, bulk lots</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all ${formData.listing_type === 'hybrid' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => setFormData({...formData, listing_type: 'hybrid'})}
                    >
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900">Hybrid</h3>
                        <p className="text-xs text-emerald-600 mt-1">Auction + Buy Now</p>
                        <p className="text-xs text-emerald-500 mt-2">Best for: Premium livestock with flexibility</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Buy Now Pricing */}
                {formData.listing_type === 'buy_now' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-emerald-800">Unit Type *</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head">Per Head</SelectItem>
                          <SelectItem value="dozen">Per Dozen</SelectItem>
                          <SelectItem value="kg">Per Kg</SelectItem>
                          <SelectItem value="box">Per Box</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-emerald-800">Price per Unit (R) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                        placeholder="0.00"
                        className="border-emerald-200"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Auction Pricing */}
                {formData.listing_type === 'auction' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-emerald-800">Unit Type *</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                          <SelectTrigger className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Per Head</SelectItem>
                            <SelectItem value="dozen">Per Dozen</SelectItem>
                            <SelectItem value="kg">Per Kg</SelectItem>
                            <SelectItem value="box">Per Box</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-emerald-800">Starting Price (R) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.starting_price}
                          onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                          placeholder="0.00"
                          className="border-emerald-200"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-800">Reserve Price (R)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.reserve_price}
                          onChange={(e) => setFormData({...formData, reserve_price: e.target.value})}
                          placeholder="Optional minimum"
                          className="border-emerald-200"
                        />
                        <p className="text-xs text-emerald-500 mt-1">Hidden minimum you'll accept</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-emerald-800">Auction Duration *</Label>
                      <Select value={formData.auction_duration} onValueChange={(value) => setFormData({...formData, auction_duration: value})}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="48">48 Hours (2 Days)</SelectItem>
                          <SelectItem value="168">7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Hybrid Pricing */}
                {formData.listing_type === 'hybrid' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-4 gap-6">
                      <div>
                        <Label className="text-emerald-800">Unit Type *</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                          <SelectTrigger className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Per Head</SelectItem>
                            <SelectItem value="dozen">Per Dozen</SelectItem>
                            <SelectItem value="kg">Per Kg</SelectItem>
                            <SelectItem value="box">Per Box</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-emerald-800">Starting Bid (R) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.starting_price}
                          onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                          placeholder="0.00"
                          className="border-emerald-200"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-800">Reserve Price (R)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.reserve_price}
                          onChange={(e) => setFormData({...formData, reserve_price: e.target.value})}
                          placeholder="Optional"
                          className="border-emerald-200"
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-800">Buy Now Price (R) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.buy_now_price}
                          onChange={(e) => setFormData({...formData, buy_now_price: e.target.value})}
                          placeholder="0.00"
                          className="border-emerald-200"
                          required
                        />
                        <p className="text-xs text-emerald-500 mt-1">Skip auction price</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-emerald-800">Auction Duration *</Label>
                      <Select value={formData.auction_duration} onValueChange={(value) => setFormData({...formData, auction_duration: value})}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="48">48 Hours (2 Days)</SelectItem>
                          <SelectItem value="168">7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-emerald-900 mb-2">How Hybrid Works:</h4>
                        <ul className="text-sm text-emerald-700 space-y-1">
                          <li>• Buyers can either <strong>place bids</strong> starting at R{formData.starting_price || '0'}</li>
                          <li>• Or <strong>buy instantly</strong> for R{formData.buy_now_price || '0'}</li>
                          <li>• If someone buys instantly, auction ends immediately</li>
                          <li>• Otherwise, highest bidder wins at auction end</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Animal Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-900 border-b border-emerald-200 pb-2">
                  Animal Statistics & Health Information
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-emerald-800">Age</Label>
                    <Input
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      placeholder="e.g., 6 months, 2 years"
                      className="border-emerald-200"
                    />
                  </div>

                  <div>
                    <Label className="text-emerald-800">Sex</Label>
                    <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed (for groups)</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-emerald-800">Weight</Label>
                    <Input
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="e.g., 50kg, 2.5kg per bird"
                      className="border-emerald-200"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-emerald-800">Vaccination Status</Label>
                    <Select value={formData.vaccination_status} onValueChange={(value) => setFormData({...formData, vaccination_status: value})}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue placeholder="Select vaccination status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fully_vaccinated">Fully Vaccinated</SelectItem>
                        <SelectItem value="partially_vaccinated">Partially Vaccinated</SelectItem>
                        <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
                        <SelectItem value="scheduled">Vaccination Scheduled</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-emerald-800">Health Status</Label>
                    <Select value={formData.health_status} onValueChange={(value) => setFormData({...formData, health_status: value})}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="recovering">Recovering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-emerald-800">Animal Type</Label>
                    <Input
                      value={formData.animal_type}
                      onChange={(e) => setFormData({...formData, animal_type: e.target.value})}
                      placeholder="e.g., Breeding stock, Commercial, Show quality"
                      className="border-emerald-200"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-emerald-800">Survival Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.survival_rate}
                      onChange={(e) => setFormData({...formData, survival_rate: e.target.value})}
                      placeholder="e.g., 95"
                      className="border-emerald-200"
                    />
                    <p className="text-xs text-emerald-600 mt-1">Expected survival rate (for young animals)</p>
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="veterinary_certificate"
                      checked={formData.veterinary_certificate}
                      onChange={(e) => setFormData({...formData, veterinary_certificate: e.target.checked})}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <Label htmlFor="veterinary_certificate" className="text-emerald-800">
                      Has Veterinary Certificate
                    </Label>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Province/Region *</Label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    placeholder="e.g., Gauteng"
                    className="border-emerald-200"
                    required
                  />
                </div>

                <div>
                  <Label className="text-emerald-800">City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="e.g., Pretoria"
                    className="border-emerald-200"
                    required
                  />
                </div>
              </div>

              {/* Health and Delivery */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vet_certificate"
                    checked={formData.has_vet_certificate}
                    onChange={(e) => setFormData({...formData, has_vet_certificate: e.target.checked})}
                    className="rounded border-emerald-300"
                  />
                  <Label htmlFor="vet_certificate" className="text-emerald-800">
                    Has Veterinary Certificate
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={formData.delivery_available}
                    onChange={(e) => setFormData({...formData, delivery_available: e.target.checked})}
                    className="rounded border-emerald-300"
                  />
                  <Label htmlFor="delivery" className="text-emerald-800">
                    Delivery Available
                  </Label>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <Label className="text-emerald-800">Animal Photos *</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="animal_images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-emerald-300 border-dashed rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-emerald-500" />
                        <p className="mb-2 text-sm text-emerald-700">
                          <span className="font-semibold">Click to upload</span> animal photos
                        </p>
                        <p className="text-xs text-emerald-500">PNG, JPG, JPEG up to 5MB each (Max 5 photos)</p>
                      </div>
                      <input 
                        id="animal_images" 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-emerald-700 mb-2">Selected images: {imagePreviews.length}</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={preview.preview} 
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded border border-emerald-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate Upload Section */}
              <div>
                <Label className="text-emerald-800">Certificates (Optional)</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="certificates" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <FileText className="w-6 h-6 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Upload certificates</span>
                        </p>
                        <p className="text-xs text-gray-500">Vet certificates, health records (PDF, JPG, PNG) - Max 5 files</p>
                      </div>
                      <input 
                        id="certificates" 
                        type="file" 
                        multiple 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 5) {
                            setError('Maximum 5 certificates allowed');
                            return;
                          }
                          setFormData({...formData, certificates: files});
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {formData.certificates && formData.certificates.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 mb-2">Uploaded certificates: {formData.certificates.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(formData.certificates).map((file, index) => (
                          <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1">
                            <FileText className="w-4 h-4 mr-1 text-gray-600" />
                            <span className="text-xs text-gray-700">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Health Notes</Label>
                <Textarea
                  value={formData.health_notes}
                  onChange={(e) => setFormData({...formData, health_notes: e.target.value})}
                  placeholder="Vaccination status, health conditions, etc."
                  className="border-emerald-200"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="border-emerald-300 text-emerald-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || isCreating}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  {submitting || isCreating ? 'Creating Listing...' : 'Create Listing'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CreateListing;
