import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, Target, TrendingUp, MapPin, DollarSign, Clock, 
  Star, Eye, Send, ThumbsUp, AlertCircle, Zap, Activity,
  BarChart3, Users, RefreshCw, Settings, Info
} from 'lucide-react';

const MLEnhancedSellerDashboard = ({ sellerId }) => {
  const [smartRequests, setSmartRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mlEnabled, setMlEnabled] = useState(true);
  const [modelPerformance, setModelPerformance] = useState(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    offersSent: 0,
    acceptanceRate: 0,
    avgMatchScore: 0
  });

  useEffect(() => {
    loadSmartRequests();
    loadModelPerformance();
  }, [sellerId, mlEnabled]);

  const loadSmartRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = mlEnabled 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/ml/matching/smart-requests`
        : `${process.env.REACT_APP_BACKEND_URL}/api/seller/requests/in-range`;

      const res = await fetch(endpoint, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSmartRequests(data.requests || []);
        
        // Calculate stats
        const totalRequests = data.requests?.length || 0;
        const avgScore = totalRequests > 0 
          ? data.requests.reduce((sum, req) => sum + (req.ml_score || 0), 0) / totalRequests
          : 0;

        setStats(prev => ({
          ...prev,
          avgMatchScore: Math.round(avgScore * 100)
        }));
      }
    } catch (error) {
      console.error('Error loading smart requests:', error);
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadModelPerformance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ml/matching/performance`,
        {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        setModelPerformance(data);
      }
    } catch (error) {
      console.error('Error loading model performance:', error);
    }
  };

  const recordInteraction = async (requestId, interactionType, features = null) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ml/matching/record-interaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            request_id: requestId,
            interaction_type: interactionType,
            features
          })
        }
      );
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const handleViewRequest = async (request) => {
    await recordInteraction(request.id, 'view', request.ranking_features);
    // Open request details
    console.log('Viewing request:', request.id);
  };

  const handleSendOffer = async (request) => {
    await recordInteraction(request.id, 'offer_sent', request.ranking_features);
    // Open offer modal
    console.log('Sending offer for request:', request.id);
    showToast('Opening offer form...', 'info');
  };

  const handleSkipRequest = async (request) => {
    await recordInteraction(request.id, 'skipped', request.ranking_features);
    
    // Remove from current list
    setSmartRequests(prev => prev.filter(r => r.id !== request.id));
    showToast('Request skipped', 'info');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'Negotiable';
    return `R${Number(price).toFixed(2)}`;
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === 'error' ? 'bg-red-500' : 
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            ML-Enhanced Seller Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered request ranking and intelligent matching
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">ML Ranking:</span>
            <button
              onClick={() => setMlEnabled(!mlEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mlEnabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                mlEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <Button
            onClick={loadSmartRequests}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ML Performance Indicator */}
      {modelPerformance && modelPerformance.model_available && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-purple-800">ML Model Active</div>
                  <div className="text-sm text-purple-600">
                    Accuracy: {Math.round(modelPerformance.performance?.r2 * 100 || 0)}% • 
                    Trained on {modelPerformance.performance?.samples_used || 0} interactions
                  </div>
                </div>
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{smartRequests.length}</div>
                <div className="text-sm text-gray-600">Smart Matches</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.avgMatchScore}%</div>
                <div className="text-sm text-gray-600">Avg Match Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.offersSent}</div>
                <div className="text-sm text-gray-600">Offers Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
                <div className="text-sm text-gray-600">Acceptance Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {mlEnabled ? 'AI-Ranked Buy Requests' : 'Recent Buy Requests'}
            </div>
            <Badge variant="outline">
              {smartRequests.length} requests
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {mlEnabled ? 'AI is analyzing the best matches for you...' : 'Loading requests...'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {smartRequests.map((request, index) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                              #{index + 1}
                            </div>
                            <h3 className="font-semibold text-lg">
                              {request.species} • {request.product_type}
                            </h3>
                          </div>
                          
                          {mlEnabled && request.ml_score && (
                            <Badge className={getScoreColor(Math.round(request.ml_score * 100))}>
                              <Zap className="h-3 w-3 mr-1" />
                              {Math.round(request.ml_score * 100)}% • {getScoreLabel(Math.round(request.ml_score * 100))}
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-gray-500" />
                            <span>{request.qty} {request.unit}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span>{request.province}</span>
                            {request.distance_analysis?.distance_km && (
                              <span className="text-blue-600 font-medium">
                                ({request.distance_analysis.distance_km}km)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span>{formatPrice(request.target_price)} / {request.unit}</span>
                          </div>
                        </div>

                        {/* ML Ranking Factors */}
                        {mlEnabled && request.ranking_features && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium mb-2 text-gray-700">AI Ranking Factors:</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <div className="text-gray-600">Distance</div>
                                <Progress 
                                  value={Math.max(0, 100 - (request.ranking_features.distance_km / 5))} 
                                  className="h-1 mt-1" 
                                />
                              </div>
                              <div>
                                <div className="text-gray-600">Species Match</div>
                                <Progress 
                                  value={request.ranking_features.species_match_score * 100} 
                                  className="h-1 mt-1" 
                                />
                              </div>
                              <div>
                                <div className="text-gray-600">Price Appeal</div>
                                <Progress 
                                  value={request.ranking_features.price_competitiveness * 100} 
                                  className="h-1 mt-1" 
                                />
                              </div>
                              <div>
                                <div className="text-gray-600">Freshness</div>
                                <Progress 
                                  value={request.ranking_features.freshness_score * 100} 
                                  className="h-1 mt-1" 
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {request.notes && (
                          <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded mb-3">
                            {request.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          Posted: {formatDate(request.created_at)}
                          {request.expires_at && (
                            <span className="ml-4">
                              Expires: {formatDate(request.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleSendOffer(request)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Offer
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleSkipRequest(request)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {smartRequests.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {mlEnabled 
                      ? "The AI couldn't find any good matches right now. Try expanding your service area or check back later."
                      : "No buy requests available in your service area right now."
                    }
                  </p>
                  {!mlEnabled && (
                    <Button onClick={() => setMlEnabled(true)} variant="outline">
                      <Brain className="h-4 w-4 mr-2" />
                      Enable Smart Matching
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ML Insights */}
      {mlEnabled && modelPerformance?.feature_importance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              ML Ranking Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Most Important Factors</h4>
                <div className="space-y-2">
                  {Object.entries(modelPerformance.feature_importance)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([feature, importance]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {feature.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={importance * 100} className="w-20 h-2" />
                          <span className="text-xs text-gray-600 w-10">
                            {Math.round(importance * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Recommendations</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Focus on requests within 50km for better success rates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Fresh requests (under 6 hours) have higher acceptance rates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Species specialization significantly improves match scores</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MLEnhancedSellerDashboard;