import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Loader2, Upload, X, FileText, Image as ImageIcon, Plus } from 'lucide-react';

const EnhancedCreateBuyRequestForm = ({
  defaultCountry = 'ZA',
  provinces = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'],
  onCreated
}) => {
  // Basic fields
  const [species, setSpecies] = useState('');
  const [productType, setProductType] = useState('');
  const [breed, setBreed] = useState('');
  const [qty, setQty] = useState('100');
  const [unit, setUnit] = useState('head');
  const [targetPrice, setTargetPrice] = useState('');
  const [province, setProvince] = useState('');
  const [country] = useState(defaultCountry);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  // Enhanced fields
  const [images, setImages] = useState([]);
  const [vetCertificates, setVetCertificates] = useState([]);
  const [weightRange, setWeightRange] = useState({ min: '', max: '', unit: 'kg' });
  const [ageRequirements, setAgeRequirements] = useState({ min: '', max: '', unit: 'weeks' });
  const [vaccinationRequirements, setVaccinationRequirements] = useState([]);
  const [deliveryPreferences, setDeliveryPreferences] = useState('both');
  const [inspectionAllowed, setInspectionAllowed] = useState(true);
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Dynamic options from catalog
  const [speciesOpts, setSpeciesOpts] = useState([]);
  const [ptypeOpts, setPtypeOpts] = useState([]);
  const [breedOpts, setBreedOpts] = useState([]);
  const [unitOpts, setUnitOpts] = useState([
    { value: 'head', label: 'Head' },
    { value: 'dozen', label: 'Dozen (eggs)' },
    { value: 'kg', label: 'kg (meat/fish)' }
  ]);

  // Common vaccinations list
  const commonVaccinations = [
    'Newcastle Disease', 'Fowl Pox', 'Infectious Bronchitis', 'Marek\'s Disease',
    'Gumboro Disease', 'Avian Influenza', 'Infectious Coryza', 'Fowl Cholera',
    'Clostridial Vaccines', 'Rift Valley Fever', 'Anthrax', 'Blackleg'
  ];

  // Set default expiry date (14 days from now)
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setExpiresAt(defaultDate.toISOString().split('T')[0]);
  }, []);

  // Fetch species on mount
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species`);
        const data = await res.json();
        const opts = (data?.species || data || []).map(s => ({ 
          value: s.code || s.id || s.name, 
          label: s.name 
        }));
        setSpeciesOpts(opts);
      } catch (error) {
        console.error('Error fetching species:', error);
      }
    };
    
    fetchSpecies();
  }, []);

  // Fetch product types when species changes
  useEffect(() => {
    if (!species) { 
      setPtypeOpts([]); 
      setProductType(''); 
      return; 
    }
    
    const fetchProductTypes = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/product-types?species=${encodeURIComponent(species)}`);
        const data = await res.json();
        const opts = (data?.product_types || data || []).map(p => ({ 
          value: p.code || p.id || p.name, 
          label: p.name 
        }));
        setPtypeOpts(opts);
        
        // Update units based on product type
        if (data?.units_for_product_type) {
          setUnitOpts(data.units_for_product_type.map(u => ({ value: u.value, label: u.label })));
        }
      } catch (error) {
        console.error('Error fetching product types:', error);
      }
    };
    
    fetchProductTypes();
  }, [species]);

  // Fetch breeds when species changes
  useEffect(() => {
    if (!species) { 
      setBreedOpts([]); 
      setBreed(''); 
      return; 
    }
    
    const fetchBreeds = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species/${encodeURIComponent(species)}/breeds`);
        const data = await res.json();
        const opts = (data?.breeds || data || []).map(b => ({ 
          value: b.code || b.id || b.name, 
          label: b.name 
        }));
        setBreedOpts(opts);
      } catch (error) {
        console.error('Error fetching breeds:', error);
      }
    };
    
    fetchBreeds();
  }, [species]);

  // Update default unit based on product type
  useEffect(() => {
    if (!productType) return;
    if (/EGG/i.test(productType)) setUnit('dozen');
    else if (/MEAT|FISH/i.test(productType)) setUnit('kg');
    else setUnit('head');
  }, [productType]);

  const isValid = useMemo(() => {
    return species && productType && qty && unit && province && expiresAt;
  }, [species, productType, qty, unit, province, expiresAt]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', 'reference');

      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/upload/buy-request-image`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      setImages(prev => [...prev, result.image.secure_url]);
    } catch (error) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCertificateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/upload/vet-certificate`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload certificate');
      }

      setVetCertificates(prev => [...prev, result.certificate.secure_url]);
    } catch (error) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setUploadingCert(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeCertificate = (index) => {
    setVetCertificates(prev => prev.filter((_, i) => i !== index));
  };

  const addVaccination = (vaccination) => {
    if (!vaccinationRequirements.includes(vaccination)) {
      setVaccinationRequirements(prev => [...prev, vaccination]);
    }
  };

  const removeVaccination = (vaccination) => {
    setVaccinationRequirements(prev => prev.filter(v => v !== vaccination));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setLoading(true);
    try {
      const payload = {
        species,
        product_type: productType,
        breed: breed || null,
        qty: Number(qty),
        unit,
        target_price: targetPrice ? Number(targetPrice) : null,
        province,
        country,
        expires_at: new Date(expiresAt).toISOString(),
        notes: notes || null,
        // Enhanced fields
        images,
        vet_certificates: vetCertificates,
        weight_range: (weightRange.min || weightRange.max) ? {
          min: weightRange.min ? Number(weightRange.min) : null,
          max: weightRange.max ? Number(weightRange.max) : null,
          unit: weightRange.unit
        } : null,
        age_requirements: (ageRequirements.min || ageRequirements.max) ? {
          min: ageRequirements.min ? Number(ageRequirements.min) : null,
          max: ageRequirements.max ? Number(ageRequirements.max) : null,
          unit: ageRequirements.unit
        } : null,
        vaccination_requirements: vaccinationRequirements,
        delivery_preferences: deliveryPreferences,
        inspection_allowed: inspectionAllowed,
        additional_requirements: additionalRequirements || null
      };

      const token = localStorage.getItem('token');
      
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create request');
      }

      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md z-50';
      toast.textContent = 'Enhanced Buy Request posted successfully! Sellers will be notified with comprehensive details.';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);

      // Reset form
      setQty('100');
      setTargetPrice('');
      setNotes('');
      setImages([]);
      setVetCertificates([]);
      setWeightRange({ min: '', max: '', unit: 'kg' });
      setAgeRequirements({ min: '', max: '', unit: 'weeks' });
      setVaccinationRequirements([]);
      setAdditionalRequirements('');
      
      if (onCreated) {
        onCreated(result.id);
      }
      
    } catch (error) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Enhanced Buy Request
        </CardTitle>
        <p className="text-gray-600">Create a comprehensive buy request with images, requirements, and specifications</p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media & Docs</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Species, Product Type, Breed */}
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Species *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOpts.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product Type *</Label>
                <Select value={productType} onValueChange={setProductType} disabled={!species}>
                  <SelectTrigger>
                    <SelectValue placeholder="Live, Day-old, Eggs…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ptypeOpts.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed (optional)</Label>
                <Select value={breed} onValueChange={setBreed} disabled={!species || breedOpts.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={breedOpts.length ? 'Select breed' : 'No breeds'} />
                  </SelectTrigger>
                  <SelectContent>
                    {breedOpts.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity, Unit, Target Price, Expires */}
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  value={qty} 
                  onChange={(e) => setQty(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label>Unit *</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOpts.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Price (per unit)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 1800" 
                  value={targetPrice} 
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Expires *</Label>
                <Input 
                  type="date" 
                  value={expiresAt} 
                  onChange={(e) => setExpiresAt(e.target.value)} 
                />
              </div>
            </div>

            {/* Province, Country */}
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label>Province *</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Input value={country} disabled />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea 
                rows={4} 
                placeholder="Any specifications (weight range, sex, vaccination requirements)…" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            {/* Images */}
            <div>
              <Label className="text-base font-medium">Reference Images</Label>
              <p className="text-sm text-gray-600 mb-3">Upload images showing the type of livestock you're looking for</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Reference ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-600">Add Image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Vet Certificates */}
            <div>
              <Label className="text-base font-medium">Vet Certificates (Optional)</Label>
              <p className="text-sm text-gray-600 mb-3">Upload any veterinary certificates or health requirements</p>
              
              <div className="space-y-3">
                {vetCertificates.map((certUrl, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">Certificate {index + 1}</span>
                    </div>
                    <button
                      onClick={() => removeCertificate(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-emerald-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCertificateUpload}
                    className="hidden"
                    disabled={uploadingCert}
                  />
                  {uploadingCert ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Certificate</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            {/* Weight Range */}
            <div>
              <Label className="text-base font-medium">Weight Range (Optional)</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <Label className="text-sm">Minimum</Label>
                  <Input 
                    type="number" 
                    placeholder="Min weight"
                    value={weightRange.min} 
                    onChange={(e) => setWeightRange(prev => ({...prev, min: e.target.value}))}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Maximum</Label>
                  <Input 
                    type="number" 
                    placeholder="Max weight"
                    value={weightRange.max} 
                    onChange={(e) => setWeightRange(prev => ({...prev, max: e.target.value}))}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Unit</Label>
                  <Select value={weightRange.unit} onValueChange={(value) => setWeightRange(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Age Requirements */}
            <div>
              <Label className="text-base font-medium">Age Requirements (Optional)</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <Label className="text-sm">Minimum</Label>
                  <Input 
                    type="number" 
                    placeholder="Min age"
                    value={ageRequirements.min} 
                    onChange={(e) => setAgeRequirements(prev => ({...prev, min: e.target.value}))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Maximum</Label>
                  <Input 
                    type="number" 
                    placeholder="Max age"
                    value={ageRequirements.max} 
                    onChange={(e) => setAgeRequirements(prev => ({...prev, max: e.target.value}))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Unit</Label>
                  <Select value={ageRequirements.unit} onValueChange={(value) => setAgeRequirements(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vaccination Requirements */}
            <div>
              <Label className="text-base font-medium">Vaccination Requirements</Label>
              <p className="text-sm text-gray-600 mb-3">Select required vaccinations</p>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {vaccinationRequirements.map((vaccination, index) => (
                    <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {vaccination}
                      <button
                        onClick={() => removeVaccination(vaccination)}
                        className="ml-2 text-emerald-600 hover:text-emerald-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {commonVaccinations.map((vaccination, index) => (
                    <button
                      key={index}
                      onClick={() => addVaccination(vaccination)}
                      disabled={vaccinationRequirements.includes(vaccination)}
                      className={`text-xs p-2 rounded border transition-colors ${
                        vaccinationRequirements.includes(vaccination)
                          ? 'bg-gray-100 text-gray-400 border-gray-200'
                          : 'bg-white hover:bg-emerald-50 hover:border-emerald-300 border-gray-200'
                      }`}
                    >
                      {vaccination}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Requirements */}
            <div>
              <Label className="text-base font-medium">Additional Requirements</Label>
              <Textarea 
                rows={3} 
                placeholder="Any other specific requirements (feed type, housing conditions, etc.)"
                value={additionalRequirements} 
                onChange={(e) => setAdditionalRequirements(e.target.value)} 
              />
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            {/* Delivery Preferences */}
            <div>
              <Label className="text-base font-medium">Delivery Preferences</Label>
              <Select value={deliveryPreferences} onValueChange={setDeliveryPreferences}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both pickup and delivery</SelectItem>
                  <SelectItem value="pickup">Pickup only</SelectItem>
                  <SelectItem value="delivery">Delivery only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inspection Allowed */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Allow Inspection</Label>
                <p className="text-sm text-gray-600">Allow buyers to inspect livestock before purchase</p>
              </div>
              <Switch 
                checked={inspectionAllowed} 
                onCheckedChange={setInspectionAllowed} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-600">
          {activeTab !== 'preferences' && (
            <Button 
              variant="outline" 
              onClick={() => {
                const tabs = ['basic', 'media', 'requirements', 'preferences'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1]);
                }
              }}
            >
              Next Step
            </Button>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Enhanced Request…
            </>
          ) : (
            'Create Enhanced Request'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedCreateBuyRequestForm;