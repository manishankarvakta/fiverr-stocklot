import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Brain, 
  MapPin, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Star, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Zap,
  Filter,
  RefreshCw
} from 'lucide-react';

const IntelligentMatchingDashboard = ({
  userRole = 'SELLER'
}) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 200,
    minMatchingScore: 60,
    limit: 20
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load intelligent matches
  const loadMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        max_distance_km: filters.maxDistance,
        min_matching_score: filters.minMatchingScore,
        limit: filters.limit
      });

      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/buy-requests/intelligent-matches?${params}`,
        {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );

      if (!res.ok) {
        throw new Error('Failed to load intelligent matches');
      }

      const data = await res.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh matches
  const refreshMatches = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
    showToast('Matches refreshed successfully!', 'success');
  };

  // Load matches on mount and filter changes
  useEffect(() => {
    loadMatches();
  }, [filters]);

  // Utility functions
  const getMatchingScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMatchingScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        ${type === 'success' ? '<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
        <span class="text-sm">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 4000);
  };

  const handleCreateOffer = (requestId) => {
    // This would typically open a modal or navigate to offer creation
    showToast('Opening offer creation form...', 'info');
    // Implementation would depend on your routing setup
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Intelligent Matching Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered buyer-seller matching based on location, preferences, and compatibility
          </p>
        </div>
        <Button
          onClick={refreshMatches}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Smart Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Maximum Distance</Label>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">0km</span>
                  <span className="text-sm font-semibold">{filters.maxDistance}km</span>
                  <span className="text-sm text-gray-600">500km</span>
                </div>
                <Slider
                  value={[filters.maxDistance]}
                  onValueChange={(value) => setFilters(prev => ({...prev, maxDistance: value[0]}))}
                  max={500}
                  min={10}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Minimum Matching Score</Label>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">0%</span>
                  <span className="text-sm font-semibold">{filters.minMatchingScore}%</span>
                  <span className="text-sm text-gray-600">100%</span>
                </div>
                <Slider
                  value={[filters.minMatchingScore]}
                  onValueChange={(value) => setFilters(prev => ({...prev, minMatchingScore: value[0]}))}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Results Limit</Label>
              <Input
                type="number"
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({...prev, limit: parseInt(e.target.value) || 20}))}
                min={5}
                max={50}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding your perfect matches...</p>
          <p className="text-sm text-gray-500 mt-1">AI is analyzing compatibility factors</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold">{matches.length}</div>
                    <div className="text-sm text-gray-600">Total Matches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-semibold">
                      {matches.filter(m => m.match_score >= 90).length}
                    </div>
                    <div className="text-sm text-gray-600">Excellent Matches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold">
                      {matches.filter(m => m.distance_analysis?.distance_km <= 50).length}
                    </div>
                    <div className="text-sm text-gray-600">Nearby (≤50km)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-semibold">
                      {matches.length > 0 ? Math.round(matches.reduce((acc, m) => acc + (m.match_score || 0), 0) / matches.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Avg. Match Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {matches.map((match, index) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {match.species} • {match.product_type}
                        <Badge className={getMatchingScoreColor(match.match_score || 0)}>
                          <Zap className="h-3 w-3 mr-1" />
                          {getMatchingScoreLabel(match.match_score || 0)} ({match.match_score || 0}%)
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.province}
                          {match.distance_analysis?.distance_km && (
                            <span className="text-blue-600 font-medium">
                              ({match.distance_analysis.distance_km}km away)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Posted {formatDate(match.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(match.target_price)} / {match.unit}
                      </div>
                      <div className="text-sm text-gray-500">
                        {match.qty} {match.unit} needed
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* AI Matching Analysis */}
                  {match.ai_matching && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        AI Matching Analysis
                      </h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Matching Factors */}
                        <div>
                          <div className="text-xs font-medium mb-2">Compatibility Factors:</div>
                          <div className="space-y-1">
                            {match.ai_matching.factors && Object.entries(match.ai_matching.factors).map(([factor, score]) => (
                              <div key={factor} className="flex items-center gap-2">
                                <div className="flex-1 text-xs capitalize">
                                  {factor.replace('_', ' ')}:
                                </div>
                                <div className="w-16">
                                  <Progress value={score} className="h-1" />
                                </div>
                                <div className="text-xs font-medium w-8">
                                  {score}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strengths & Concerns */}
                        <div className="space-y-2">
                          {match.ai_matching.strengths && match.ai_matching.strengths.length > 0 && (
                            <div>
                              <div className="text-xs font-medium mb-1 text-green-700">Strengths:</div>
                              <ul className="text-xs space-y-1">
                                {match.ai_matching.strengths.slice(0, 3).map((strength, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {match.ai_matching.concerns && match.ai_matching.concerns.length > 0 && (
                            <div>
                              <div className="text-xs font-medium mb-1 text-yellow-700">Considerations:</div>
                              <ul className="text-xs space-y-1">
                                {match.ai_matching.concerns.slice(0, 2).map((concern, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertCircle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      {match.ai_matching.recommendation && (
                        <div className="mt-3 p-2 bg-white rounded border-l-4 border-purple-400">
                          <div className="text-xs font-medium text-purple-800 mb-1">AI Recommendation:</div>
                          <div className="text-xs text-purple-700">
                            {match.ai_matching.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Distance & Delivery Analysis */}
                  {match.distance_analysis && match.distance_analysis.success && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        Delivery Analysis
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Distance:</span> {match.distance_analysis.distance_km}km
                        </div>
                        <div>
                          <span className="font-medium">Drive Time:</span> {match.distance_analysis.duration_minutes}min
                        </div>
                        <div>
                          <span className="font-medium">Est. Delivery Cost:</span> 
                          {match.distance_analysis.estimated_cost ? 
                            ` R${match.distance_analysis.estimated_cost.estimated_cost}` : 
                            ' Contact for quote'
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Request Details */}
                  <div className="space-y-2">
                    {match.breed && (
                      <div className="text-sm">
                        <span className="font-medium">Breed:</span> {match.breed}
                      </div>
                    )}

                    {match.notes && (
                      <div className="text-sm">
                        <span className="font-medium">Requirements:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                          {match.notes}
                        </div>
                      </div>
                    )}

                    {match.expires_at && (
                      <div className="text-sm text-gray-600">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Expires: {formatDate(match.expires_at)}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Match #{index + 1} • Score based on AI analysis
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/buy-requests/${match.id}`, '_blank')}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCreateOffer(match.id)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Create Offer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {matches.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filters to find more opportunities.
                  </p>
                  <div className="text-sm text-gray-400">
                    The AI needs more data to find better matches. Check back later or expand your search radius.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentMatchingDashboard;