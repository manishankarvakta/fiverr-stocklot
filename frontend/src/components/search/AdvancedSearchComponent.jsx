// Advanced Search Component with AI-powered features
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Camera, Mic, Filter, TrendingUp, Brain, MapPin, Clock, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

const AdvancedSearchComponent = ({ onResults, onInsights }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('semantic'); // semantic, visual, predictive
  const [intelligentFilters, setIntelligentFilters] = useState(null);
  const [searchInsights, setSearchInsights] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const searchTimeout = useRef(null);
  const fileInputRef = useRef(null);
  
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Debounced autocomplete
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(() => {
        fetchAutocompleteSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // Load predictive search on component mount
  useEffect(() => {
    loadPredictiveSearch();
  }, [currentUser]);

  const fetchAutocompleteSuggestions = async (query) => {
    try {
      const response = await fetch(`${API_BASE}/api/search/autocomplete?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const performSemanticSearch = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/search/semantic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          query,
          location: currentUser?.province,
          preferences: {
            maxPrice: 50000,
            preferredSpecies: ['Cattle', 'Sheep', 'Goats']
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setSearchInsights(data.insights);
        
        // Get intelligent filters for results
        await generateIntelligentFilters(query, data.results);
        
        // Get search analytics
        await getSearchAnalytics(query);
        
        if (onResults) onResults(data.results);
        if (onInsights) onInsights(data.insights);
        
        toast({
          title: "Search Completed",
          description: `Found ${data.total_count} results using AI semantic search`,
        });
      }
    } catch (error) {
      console.error('Error performing semantic search:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performVisualSearch = async (imageFile) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('similarity_threshold', '0.7');

      const response = await fetch(`${API_BASE}/api/search/visual`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        
        if (onResults) onResults(data.results);
        
        toast({
          title: "Visual Search Completed",
          description: `Found ${data.results?.length || 0} similar livestock`,
        });
      }
    } catch (error) {
      console.error('Error performing visual search:', error);
      toast({
        title: "Visual Search Error",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateIntelligentFilters = async (query, results) => {
    try {
      const response = await fetch(`${API_BASE}/api/search/intelligent-filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          query,
          results
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIntelligentFilters(data);
      }
    } catch (error) {
      console.error('Error generating intelligent filters:', error);
    }
  };

  const getSearchAnalytics = async (query) => {
    try {
      const response = await fetch(`${API_BASE}/api/search/analytics?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSearchInsights(data.insights);
      }
    } catch (error) {
      console.error('Error getting search analytics:', error);
    }
  };

  const loadPredictiveSearch = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/search/predictive`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (error) {
      console.error('Error loading predictive search:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchMode === 'semantic') {
      performSemanticSearch(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text);
    setSuggestions([]);
    if (searchMode === 'semantic') {
      performSemanticSearch(suggestion.text);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      performVisualSearch(file);
    }
  };

  const handlePredictionClick = (prediction) => {
    setSearchQuery(prediction);
    setActiveTab('search');
    performSemanticSearch(prediction);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-emerald-600" />
            <span>AI-Powered Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Smart Search</span>
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Visual Search</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Predictions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              {/* Semantic Search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Try: 'young dairy cows near johannesburg under R5000'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-20"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    size="sm"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Autocomplete Suggestions */}
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <span className="mr-2">{suggestion.icon}</span>
                        <span className="flex-1">{suggestion.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* Search Mode Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search Mode:</span>
                <Badge 
                  variant={searchMode === 'semantic' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSearchMode('semantic')}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Semantic
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="visual" className="space-y-4">
              {/* Visual Search */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Search by Image
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload a photo of livestock to find similar animals in our marketplace
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? 'Analyzing...' : 'Upload Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              {/* Predictive Search */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">What you might be looking for</h3>
                
                {predictions ? (
                  <div className="space-y-4">
                    {/* Seasonal Predictions */}
                    {predictions.predictions?.seasonal && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Seasonal Trends
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {predictions.predictions.seasonal.map((item, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-emerald-50"
                              onClick={() => handlePredictionClick(item)}
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Personalized Predictions */}
                    {predictions.predictions?.personalized && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Star className="h-4 w-4 mr-2" />
                          For You
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {predictions.predictions.personalized.map((item, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50"
                              onClick={() => handlePredictionClick(item)}
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local Predictions */}
                    {predictions.predictions?.local && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Popular in Your Area
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {predictions.predictions.local.map((item, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-green-50"
                              onClick={() => handlePredictionClick(item)}
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Loading personalized predictions...</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((result, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{result.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {result.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-600">
                          R{result.price_per_unit?.toLocaleString()}
                        </span>
                        {result.ai_relevance_score && (
                          <Badge variant="outline">
                            {Math.round(result.ai_relevance_score * 100)}% match
                          </Badge>
                        )}
                      </div>
                      {result.ranking_factors && (
                        <div className="text-xs text-gray-500">
                          {result.ranking_factors.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intelligent Filters */}
      {intelligentFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Smart Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(intelligentFilters.suggested_filters || {}).map(([filterType, options]) => (
                <div key={filterType}>
                  <h4 className="font-medium capitalize mb-2">{filterType.replace('_', ' ')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.slice(0, 5).map((option, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        {typeof option === 'object' ? option.label : option}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Insights */}
      {searchInsights && (
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchInsights.price_analysis && (
                <div className="space-y-2">
                  <h4 className="font-medium">Price Analysis</h4>
                  <div className="text-sm space-y-1">
                    <div>Average: R{searchInsights.price_analysis.average?.toLocaleString()}</div>
                    <div>Range: R{searchInsights.price_analysis.min?.toLocaleString()} - R{searchInsights.price_analysis.max?.toLocaleString()}</div>
                  </div>
                </div>
              )}
              
              {searchInsights.availability && (
                <div className="space-y-2">
                  <h4 className="font-medium">Availability</h4>
                  <div className="text-sm space-y-1">
                    <div>Total Listings: {searchInsights.availability.total_listings}</div>
                    <div>Immediately Available: {searchInsights.availability.immediate_availability}</div>
                  </div>
                </div>
              )}
              
              {searchInsights.location_distribution && (
                <div className="space-y-2">
                  <h4 className="font-medium">Locations</h4>
                  <div className="text-sm space-y-1">
                    {Object.entries(searchInsights.location_distribution).slice(0, 3).map(([location, count]) => (
                      <div key={location}>{location}: {count} listings</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearchComponent;