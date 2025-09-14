import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, Bell, Trash2, Edit, Play, Plus, Calendar,
  Filter, DollarSign, MapPin, Package
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const SavedSearches = () => {
  const { user } = useAuth();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSearch, setNewSearch] = useState({
    name: '',
    keywords: '',
    category: '',
    species: '',
    min_price: '',
    max_price: '',
    location: '',
    alerts_enabled: true
  });

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/buyer/saved-searches`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearches(data.searches || []);
      } else {
        // Mock data for demo
        setSearches([
          {
            id: 1,
            name: "Premium Cattle Under R30k",
            keywords: "angus, holstein",
            category: "Cattle",
            species: "Cattle",
            min_price: 1500000,
            max_price: 3000000,
            location: "Gauteng",
            alerts_enabled: true,
            created_at: "2024-11-15",
            last_run: "2024-11-22",
            results_count: 12,
            new_results: 3
          },
          {
            id: 2,
            name: "Boer Goats - Western Cape",
            keywords: "boer, purebred",
            category: "Goats",
            species: "Goats",
            min_price: 200000,
            max_price: 500000,
            location: "Western Cape",
            alerts_enabled: true,
            created_at: "2024-11-10",
            last_run: "2024-11-21",
            results_count: 8,
            new_results: 1
          },
          {
            id: 3,
            name: "Layer Chickens Bulk",
            keywords: "layer, brown, white",
            category: "Poultry",
            species: "Chickens",
            min_price: 1000,
            max_price: 5000,
            location: "Any",
            alerts_enabled: false,
            created_at: "2024-11-08",
            last_run: "2024-11-20",
            results_count: 25,
            new_results: 0
          },
          {
            id: 4,
            name: "Dairy Cows - KZN",
            keywords: "dairy, holstein, jersey",
            category: "Cattle",
            species: "Cattle",
            min_price: 2000000,
            max_price: 5000000,
            location: "KwaZulu-Natal",
            alerts_enabled: true,
            created_at: "2024-11-05",
            last_run: "2024-11-22",
            results_count: 6,
            new_results: 2
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSearch = async () => {
    if (!newSearch.name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/buyer/saved-searches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...newSearch,
            min_price: newSearch.min_price ? parseInt(newSearch.min_price) * 100 : null,
            max_price: newSearch.max_price ? parseInt(newSearch.max_price) * 100 : null
          })
        }
      );

      if (response.ok) {
        fetchSavedSearches();
        setShowCreateForm(false);
        setNewSearch({
          name: '', keywords: '', category: '', species: '',
          min_price: '', max_price: '', location: '', alerts_enabled: true
        });
      }
    } catch (error) {
      console.error('Error creating search:', error);
    }
  };

  const deleteSearch = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/buyer/saved-searches/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setSearches(searches.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const runSearch = (search) => {
    const params = new URLSearchParams();
    if (search.keywords) params.append('q', search.keywords);
    if (search.category) params.append('category', search.category);
    if (search.species) params.append('species', search.species);
    if (search.min_price) params.append('min_price', search.min_price / 100);
    if (search.max_price) params.append('max_price', search.max_price / 100);
    if (search.location && search.location !== 'Any') params.append('location', search.location);
    
    window.location.href = `/marketplace?${params.toString()}`;
  };

  const toggleAlerts = async (id, enabled) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/buyer/saved-searches/${id}/alerts`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ alerts_enabled: enabled })
        }
      );

      setSearches(searches.map(s => 
        s.id === id ? { ...s, alerts_enabled: enabled } : s
      ));
    } catch (error) {
      console.error('Error updating alerts:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading saved searches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Saved Searches</h1>
          <p className="text-emerald-700">Quick access to your frequent livestock searches</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Search
        </Button>
      </div>

      {/* Create Search Form */}
      {showCreateForm && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle>Create New Saved Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name *
                </label>
                <Input
                  value={newSearch.name}
                  onChange={(e) => setNewSearch({...newSearch, name: e.target.value})}
                  placeholder="e.g., Premium Cattle Under R30k"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <Input
                  value={newSearch.keywords}
                  onChange={(e) => setNewSearch({...newSearch, keywords: e.target.value})}
                  placeholder="e.g., angus, holstein, premium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newSearch.category}
                  onChange={(e) => setNewSearch({...newSearch, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Any Category</option>
                  <option value="Cattle">Cattle</option>
                  <option value="Goats">Goats</option>
                  <option value="Sheep">Sheep</option>
                  <option value="Poultry">Poultry</option>
                  <option value="Pigs">Pigs</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species
                </label>
                <Input
                  value={newSearch.species}
                  onChange={(e) => setNewSearch({...newSearch, species: e.target.value})}
                  placeholder="e.g., Holstein, Boer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={newSearch.location}
                  onChange={(e) => setNewSearch({...newSearch, location: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Any Location</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="North West">North West</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price (R)
                </label>
                <Input
                  type="number"
                  value={newSearch.min_price}
                  onChange={(e) => setNewSearch({...newSearch, min_price: e.target.value})}
                  placeholder="e.g., 15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price (R)
                </label>
                <Input
                  type="number"
                  value={newSearch.max_price}
                  onChange={(e) => setNewSearch({...newSearch, max_price: e.target.value})}
                  placeholder="e.g., 30000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newSearch.alerts_enabled}
                onChange={(e) => setNewSearch({...newSearch, alerts_enabled: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable email alerts for new matches
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={createSearch} className="bg-emerald-600 hover:bg-emerald-700">
                Save Search
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches List */}
      {searches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Saved Searches</h3>
            <p className="text-gray-600 mb-4">Create your first saved search to get quick access to your favorite livestock searches.</p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searches.map((search) => (
            <Card key={search.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{search.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {search.alerts_enabled ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Alerts On
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-600">
                          Alerts Off
                        </Badge>
                      )}
                      {search.new_results > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                          {search.new_results} New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 mb-4">
                  {search.keywords && (
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{search.keywords}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {search.category || 'Any Category'} 
                      {search.species && ` • ${search.species}`}
                    </span>
                  </div>
                  
                  {(search.min_price || search.max_price) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {search.min_price ? formatCurrency(search.min_price) : 'Any'} - {search.max_price ? formatCurrency(search.max_price) : 'Any'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{search.location || 'Any Location'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Last run: {new Date(search.last_run).toLocaleDateString()} • {search.results_count} results
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => runSearch(search)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
                    size="sm"
                  >
                    <Play className="h-3 w-3" />
                    Run Search
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAlerts(search.id, !search.alerts_enabled)}
                  >
                    <Bell className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSearch(search.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedSearches;