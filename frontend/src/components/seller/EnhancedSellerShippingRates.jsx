// Enhanced Seller Shipping Rate Management with AI-Powered Suggestions
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Truck, MapPin, DollarSign, Brain, TrendingUp, BarChart3, 
  Lightbulb, Target, Route, Clock, AlertCircle, CheckCircle,
  Sparkles, Zap, Calculator, Settings, Info, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthContext';

const EnhancedSellerShippingRates = () => {
  const [currentRates, setCurrentRates] = useState({
    base_fee_cents: 0,
    per_km_cents: 0,
    min_km: 0,
    max_km: 200,
    province_whitelist: null,
    is_active: true
  });
  
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [demandPrediction, setDemandPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState('competitive');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCurrentRates();
    loadAISuggestions();
    loadPerformanceAnalysis();
    loadDemandPrediction();
  }, []);

  const loadCurrentRates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/seller/delivery-rate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRates(data);
      }
    } catch (error) {
      console.error('Error loading current rates:', error);
    }
  };

  const loadAISuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/ai/shipping/rate-suggestions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiSuggestions(data);
        }
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    }
  };

  const loadPerformanceAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/ai/shipping/performance-analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPerformanceAnalysis(data);
        }
      }
    } catch (error) {
      console.error('Error loading performance analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDemandPrediction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/ai/shipping/demand-prediction`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDemandPrediction(data);
        }
      }
    } catch (error) {
      console.error('Error loading demand prediction:', error);
    }
  };

  const saveRates = async (rates) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/seller/delivery-rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rates)
      });

      if (response.ok) {
        setCurrentRates(rates);
        toast({
          title: "Success",
          description: "Shipping rates updated successfully!",
          variant: "default"
        });
      } else {
        throw new Error('Failed to save rates');
      }
    } catch (error) {
      console.error('Error saving rates:', error);
      toast({
        title: "Error",
        description: "Failed to save shipping rates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const applySuggestion = (suggestionType) => {
    if (!aiSuggestions?.suggestions?.recommended_rates?.[suggestionType]) return;
    
    const suggestion = aiSuggestions.suggestions.recommended_rates[suggestionType];
    const newRates = {
      ...currentRates,
      base_fee_cents: suggestion.base_fee_cents,
      per_km_cents: suggestion.per_km_cents,
      min_km: suggestion.min_km,
      max_km: suggestion.max_km
    };
    
    setCurrentRates(newRates);
    setSelectedSuggestion(suggestionType);
    
    toast({
      title: "AI Suggestion Applied",
      description: `Applied ${suggestionType} pricing strategy`,
      variant: "default"
    });
  };

  const handleInputChange = (field, value) => {
    setCurrentRates(prev => ({
      ...prev,
      [field]: field.includes('cents') || field.includes('km') ? parseInt(value) || 0 : value
    }));
  };

  const formatCurrency = (cents) => `R${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Loading AI-powered shipping insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Rate Management</h1>
          <p className="text-gray-600">AI-powered rate optimization for your livestock deliveries</p>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Enhanced
        </Badge>
      </div>

      <Tabs defaultValue="current-rates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current-rates">Current Rates</TabsTrigger>
          <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Demand Forecast</TabsTrigger>
        </TabsList>

        {/* Current Rates Tab */}
        <TabsContent value="current-rates" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Rate Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Rate Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base-fee">Base Fee</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-1">R</span>
                      <Input
                        id="base-fee"
                        type="number"
                        value={currentRates.base_fee_cents / 100}
                        onChange={(e) => handleInputChange('base_fee_cents', e.target.value * 100)}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="per-km">Per Kilometer</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-1">R</span>
                      <Input
                        id="per-km"
                        type="number"
                        value={currentRates.per_km_cents / 100}
                        onChange={(e) => handleInputChange('per_km_cents', e.target.value * 100)}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-km">Free Delivery (km)</Label>
                    <Input
                      id="min-km"
                      type="number"
                      value={currentRates.min_km}
                      onChange={(e) => handleInputChange('min_km', e.target.value)}
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max-km">Max Range (km)</Label>
                    <Input
                      id="max-km"
                      type="number"
                      value={currentRates.max_km}
                      onChange={(e) => handleInputChange('max_km', e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => saveRates(currentRates)}
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Rates
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Rate Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Rate Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base delivery fee:</span>
                    <span className="font-medium">{formatCurrency(currentRates.base_fee_cents)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Per kilometer rate:</span>
                    <span className="font-medium">{formatCurrency(currentRates.per_km_cents)}/km</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Free delivery range:</span>
                    <span className="font-medium">{currentRates.min_km}km</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Maximum range:</span>
                    <span className="font-medium">{currentRates.max_km}km</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Example Calculations:</h4>
                  {[25, 50, 100].map(distance => {
                    const chargeable = Math.max(0, distance - currentRates.min_km);
                    const total = currentRates.base_fee_cents + (chargeable * currentRates.per_km_cents);
                    return (
                      <div key={distance} className="flex justify-between text-sm">
                        <span className="text-gray-600">{distance}km delivery:</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai-suggestions" className="space-y-6">
          {aiSuggestions?.success ? (
            <div className="space-y-6">
              {/* AI Confidence Score */}
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Brain className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-900">AI Analysis Complete</h3>
                        <p className="text-sm text-emerald-700">
                          Confidence: {(aiSuggestions.confidence_score * 100).toFixed(1)}% • 
                          Market positioning: {aiSuggestions.suggestions?.market_positioning}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 text-white">
                      {aiSuggestions.market_data?.sample_size || 0} data points
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Suggestions */}
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(aiSuggestions.suggestions?.recommended_rates || {}).map(([type, rates]) => (
                  <Card 
                    key={type}
                    className={`cursor-pointer transition-all ${
                      selectedSuggestion === type 
                        ? 'ring-2 ring-emerald-500 bg-emerald-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedSuggestion(type)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        {type === 'competitive' && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            Recommended
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base fee:</span>
                          <span className="font-medium">{formatCurrency(rates.base_fee_cents)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Per km:</span>
                          <span className="font-medium">{formatCurrency(rates.per_km_cents)}/km</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Max range:</span>
                          <span className="font-medium">{rates.max_km}km</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-600">{rates.reasoning}</p>
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(type);
                        }}
                        variant={selectedSuggestion === type ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                      >
                        {selectedSuggestion === type ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Applied
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            Apply
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Key Insights */}
              {aiSuggestions.suggestions?.key_insights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiSuggestions.suggestions.key_insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Optimization Tips */}
              {aiSuggestions.suggestions?.optimization_tips && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Optimization Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiSuggestions.suggestions.optimization_tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Suggestions Unavailable</h3>
                <p className="text-gray-500">
                  AI-powered rate suggestions are currently unavailable. You can still configure rates manually.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performanceAnalysis?.success ? (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">On-Time Delivery</p>
                        <p className="text-2xl font-bold text-green-600">
                          {(performanceAnalysis.metrics?.on_time_delivery_rate * 100 || 85).toFixed(1)}%
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Customer Satisfaction</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {performanceAnalysis.metrics?.customer_satisfaction || 4.2}/5.0
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Improvement Score</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {(performanceAnalysis.improvement_score * 100 || 75).toFixed(0)}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {performanceAnalysis.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-1 rounded text-white text-xs font-semibold ${
                            rec.impact === 'high' ? 'bg-red-500' :
                            rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            {rec.impact?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-sm text-gray-600">Effort: {rec.effort}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Performance Analysis Unavailable</h3>
                <p className="text-gray-500">
                  Start making deliveries to see AI-powered performance insights.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          {demandPrediction?.success ? (
            <div className="space-y-6">
              {/* Demand Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Delivery Demand Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Next 30 Days</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expected daily average:</span>
                          <span className="font-medium">
                            {demandPrediction.demand_predictions?.daily_demand?.[0] || 12} deliveries
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Peak demand days:</span>
                          <span className="font-medium">
                            {demandPrediction.demand_predictions?.daily_demand?.[4] || 20} deliveries
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Confidence level:</span>
                          <span className="font-medium">
                            {(demandPrediction.confidence_level * 100 || 80).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Capacity Recommendations</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Recommended capacity:</span>
                          <span className="font-medium">
                            {demandPrediction.capacity_recommendations?.recommended_capacity || 20} deliveries/day
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Peak capacity needed:</span>
                          <span className="font-medium">
                            {demandPrediction.capacity_recommendations?.peak_capacity_needed || 30} deliveries/day
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seasonal Insights */}
              {demandPrediction.seasonal_insights && (
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Peak Months</h4>
                        <div className="flex flex-wrap gap-2">
                          {demandPrediction.seasonal_insights.peak_months?.map(month => (
                            <Badge key={month} className="bg-green-100 text-green-800">
                              {month}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">Low Demand Months</h4>
                        <div className="flex flex-wrap gap-2">
                          {demandPrediction.seasonal_insights.low_months?.map(month => (
                            <Badge key={month} variant="outline" className="text-blue-600 border-blue-300">
                              {month}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Demand Predictions Unavailable</h3>
                <p className="text-gray-500">
                  AI demand forecasting requires historical delivery data.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSellerShippingRates;