import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { 
  Filter, X, Search, MapPin, Calendar, Package, 
  DollarSign, Shield, FileText, Truck, Eye, Target
} from 'lucide-react';

const AdvancedFiltersPanel = ({ onFiltersChange, isOpen, onClose }) => {
  const [filters, setFilters] = useState({
    // Basic filters
    species: '',
    productType: '',
    breed: '',
    province: '',
    
    // Quantity filters
    minQuantity: '',
    maxQuantity: '',
    units: [],
    
    // Price filters
    hasBudget: null,
    minPrice: '',
    maxPrice: '',
    
    // Enhanced features filters
    hasImages: null,
    hasVetCertificates: null,
    hasWeightRequirements: null,
    hasAgeRequirements: null,
    requiresVaccinations: null,
    allowsInspection: null,
    
    // Delivery filters
    deliveryPreferences: [],
    
    // Time filters
    createdWithin: '',
    expiresWithin: '',
    
    // Location filters
    nearMe: false,
    
    // Sorting
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [breedOptions, setBreedOptions] = useState([]);
  
  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  const units = ['head', 'dozen', 'kg', 'litres', 'boxes'];
  const deliveryOptions = ['pickup', 'delivery', 'both'];
  const timeRanges = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '3d', label: 'Last 3 days' },
    { value: '7d', label: 'Last week' },
    { value: '14d', label: 'Last 2 weeks' },
    { value: '30d', label: 'Last month' }
  ];

  const sortOptions = [
    { value: 'created_at:desc', label: 'Newest first' },
    { value: 'created_at:asc', label: 'Oldest first' },
    { value: 'expires_at:asc', label: 'Expiring soon' },
    { value: 'expires_at:desc', label: 'Expiring later' },
    { value: 'target_price:asc', label: 'Lowest budget first' },
    { value: 'target_price:desc', label: 'Highest budget first' },
    { value: 'qty:asc', label: 'Smallest quantity' },
    { value: 'qty:desc', label: 'Largest quantity' }
  ];

  // Load options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(buildQueryParams());
    }
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      // Load species
      const speciesRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species`);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        setSpeciesOptions(speciesData.species || speciesData || []);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadProductTypes = async (species) => {
    if (!species) {
      setProductTypeOptions([]);
      return;
    }
    
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/product-types?species=${encodeURIComponent(species)}`);
      if (res.ok) {
        const data = await res.json();
        setProductTypeOptions(data.product_types || data || []);
      }
    } catch (error) {
      console.error('Error loading product types:', error);
    }
  };

  const loadBreeds = async (species) => {
    if (!species) {
      setBreedOptions([]);
      return;
    }
    
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species/${encodeURIComponent(species)}/breeds`);
      if (res.ok) {
        const data = await res.json();
        setBreedOptions(data.breeds || data || []);
      }
    } catch (error) {
      console.error('Error loading breeds:', error);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Handle cascading filters
      if (key === 'species') {
        newFilters.productType = '';
        newFilters.breed = '';
        loadProductTypes(value);
        loadBreeds(value);
      }
      
      return newFilters;
    });
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    // Basic filters
    if (filters.species) params.append('species', filters.species);
    if (filters.productType) params.append('product_type', filters.productType);
    if (filters.breed) params.append('breed', filters.breed);
    if (filters.province) params.append('province', filters.province);
    
    // Quantity filters
    if (filters.minQuantity) params.append('min_qty', filters.minQuantity);
    if (filters.maxQuantity) params.append('max_qty', filters.maxQuantity);
    if (filters.units.length > 0) params.append('units', filters.units.join(','));
    
    // Price filters
    if (filters.hasBudget !== null) params.append('has_budget', filters.hasBudget);
    if (filters.minPrice) params.append('min_price', filters.minPrice);
    if (filters.maxPrice) params.append('max_price', filters.maxPrice);
    
    // Enhanced features
    if (filters.hasImages !== null) params.append('has_images', filters.hasImages);
    if (filters.hasVetCertificates !== null) params.append('has_vet_certificates', filters.hasVetCertificates);
    if (filters.hasWeightRequirements !== null) params.append('has_weight_requirements', filters.hasWeightRequirements);
    if (filters.hasAgeRequirements !== null) params.append('has_age_requirements', filters.hasAgeRequirements);
    if (filters.requiresVaccinations !== null) params.append('requires_vaccinations', filters.requiresVaccinations);
    if (filters.allowsInspection !== null) params.append('allows_inspection', filters.allowsInspection);
    
    // Delivery preferences
    if (filters.deliveryPreferences.length > 0) {
      params.append('delivery_preferences', filters.deliveryPreferences.join(','));
    }
    
    // Time filters
    if (filters.createdWithin) params.append('created_within', filters.createdWithin);
    if (filters.expiresWithin) params.append('expires_within', filters.expiresWithin);
    
    // Sorting
    const [sortField, sortDirection] = filters.sortBy.split(':');
    params.append('sort', sortField);
    params.append('order', sortDirection || 'desc');
    
    return params.toString();
  };

  const clearAllFilters = () => {
    setFilters({
      species: '',
      productType: '',
      breed: '',
      province: '',
      minQuantity: '',
      maxQuantity: '',
      units: [],
      hasBudget: null,
      minPrice: '',
      maxPrice: '',
      hasImages: null,
      hasVetCertificates: null,
      hasWeightRequirements: null,
      hasAgeRequirements: null,
      requiresVaccinations: null,
      allowsInspection: null,
      deliveryPreferences: [],
      createdWithin: '',
      expiresWithin: '',
      nearMe: false,
      sortBy: 'created_at:desc',
      sortOrder: 'desc'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.species) count++;
    if (filters.productType) count++;
    if (filters.breed) count++;
    if (filters.province) count++;
    if (filters.minQuantity || filters.maxQuantity) count++;
    if (filters.units.length > 0) count++;
    if (filters.hasBudget !== null) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.hasImages !== null) count++;
    if (filters.hasVetCertificates !== null) count++;
    if (filters.hasWeightRequirements !== null) count++;
    if (filters.hasAgeRequirements !== null) count++;
    if (filters.requiresVaccinations !== null) count++;
    if (filters.allowsInspection !== null) count++;
    if (filters.deliveryPreferences.length > 0) count++;
    if (filters.createdWithin) count++;
    if (filters.expiresWithin) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Advanced Filters</h2>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Basic Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Species</Label>
                <Select value={filters.species} onValueChange={(value) => updateFilter('species', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any species</SelectItem>
                    {speciesOptions.map(species => (
                      <SelectItem key={species.code || species.name} value={species.code || species.name}>
                        {species.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product Type</Label>
                <Select value={filters.productType} onValueChange={(value) => updateFilter('productType', value)} disabled={!filters.species}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any product type</SelectItem>
                    {productTypeOptions.map(type => (
                      <SelectItem key={type.code || type.name} value={type.code || type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Province</Label>
                <Select value={filters.province} onValueChange={(value) => updateFilter('province', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any province</SelectItem>
                    {provinces.map(province => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quantity & Price Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quantity & Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Min Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minQuantity}
                    onChange={(e) => updateFilter('minQuantity', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxQuantity}
                    onChange={(e) => updateFilter('maxQuantity', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Units</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {units.map(unit => (
                    <label key={unit} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.units.includes(unit)}
                        onCheckedChange={() => toggleArrayFilter('units', unit)}
                      />
                      <span className="text-sm">{unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Min Budget</Label>
                  <Input
                    type="number"
                    placeholder="Min R"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Budget</Label>
                  <Input
                    type="number"
                    placeholder="Max R"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enhanced Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Has Images</span>
                <Select value={filters.hasImages?.toString() || ''} onValueChange={(value) => updateFilter('hasImages', value === '' ? null : value === 'true')}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Has Vet Certificates</span>
                <Select value={filters.hasVetCertificates?.toString() || ''} onValueChange={(value) => updateFilter('hasVetCertificates', value === '' ? null : value === 'true')}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Weight Requirements</span>
                <Select value={filters.hasWeightRequirements?.toString() || ''} onValueChange={(value) => updateFilter('hasWeightRequirements', value === '' ? null : value === 'true')}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Vaccination Requirements</span>
                <Select value={filters.requiresVaccinations?.toString() || ''} onValueChange={(value) => updateFilter('requiresVaccinations', value === '' ? null : value === 'true')}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Allows Inspection</span>
                <Select value={filters.allowsInspection?.toString() || ''} onValueChange={(value) => updateFilter('allowsInspection', value === '' ? null : value === 'true')}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Time Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery & Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Delivery Preferences</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {deliveryOptions.map(option => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={filters.deliveryPreferences.includes(option)}
                        onCheckedChange={() => toggleArrayFilter('deliveryPreferences', option)}
                      />
                      <span className="text-sm capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Created Within</Label>
                <Select value={filters.createdWithin} onValueChange={(value) => updateFilter('createdWithin', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-default">Any time</SelectItem>
                    {timeRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sorting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sort Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearAllFilters} className="flex-1">
              Clear All
            </Button>
            <Button onClick={onClose} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFiltersPanel;