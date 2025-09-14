import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Lightbulb, Search, Eye, Check, X, Clock, Filter, User, Calendar, MessageSquare } from 'lucide-react';

const AdminSuggestionsManagement = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [filters]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('q', filters.search);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/suggestions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : data.suggestions || []);
      } else {
        console.error('Failed to load suggestions:', response.status);
        alert('Failed to load suggestions. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      alert('Error loading suggestions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = async (suggestionId, action, response = null) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const body = {
        action: action,
        admin_response: response || adminResponse,
        admin_notes: `${action} by admin`
      };

      const apiResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/suggestions/${suggestionId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        if (result.success || result.message) {
          alert(`Suggestion ${action} successful!`);
          setShowResponseDialog(false);
          setAdminResponse('');
          setSelectedSuggestion(null);
          loadSuggestions(); // Refresh list
        } else {
          alert(`Failed to ${action} suggestion: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await apiResponse.json();
        alert(`Failed to ${action} suggestion: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} suggestion:`, error);
      alert(`Error ${action} suggestion: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'implemented': return <Badge className="bg-blue-100 text-blue-800"><Check className="h-3 w-3 mr-1" />Implemented</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      'feature': 'bg-blue-100 text-blue-800',
      'bug': 'bg-red-100 text-red-800',
      'improvement': 'bg-green-100 text-green-800',
      'ui': 'bg-purple-100 text-purple-800',
      'content': 'bg-orange-100 text-orange-800'
    };
    return <Badge className={categoryColors[category] || 'bg-gray-100 text-gray-800'}>{category || 'general'}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Suggestions</h2>
          <p className="text-gray-600">Review and respond to user feedback and suggestions</p>
        </div>
        <Button onClick={loadSuggestions} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Lightbulb className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh Suggestions'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Suggestions</p>
                <p className="text-2xl font-bold text-blue-600">{suggestions.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{suggestions.filter(s => s.status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{suggestions.filter(s => s.status === 'approved').length}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Implemented</p>
                <p className="text-2xl font-bold text-purple-600">{suggestions.filter(s => s.status === 'implemented').length}</p>
              </div>
              <Check className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Suggestions</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  <SelectItem value="feature">New Feature</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="ui">UI/UX</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <Card>
        <CardHeader>
          <CardTitle>User Suggestions ({suggestions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading suggestions...</p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No suggestions found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <p className="text-sm text-gray-600">{suggestion.description?.substring(0, 200)}...</p>
                        </div>
                        {getStatusBadge(suggestion.status)}
                        {getCategoryBadge(suggestion.category)}
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {suggestion.user_name || 'Anonymous'}
                        </p>
                        <p className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {suggestion.created_at ? new Date(suggestion.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                        <p>Priority: {suggestion.priority || 'Medium'}</p>
                        <p>Votes: {suggestion.votes || 0} upvotes</p>
                      </div>
                      {suggestion.admin_response && (
                        <div className="mt-2 p-3 bg-blue-50 rounded">
                          <p className="text-sm"><strong>Admin Response:</strong> {suggestion.admin_response}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setShowResponseDialog(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {suggestion.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleSuggestionAction(suggestion.id, 'approve')}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleSuggestionAction(suggestion.id, 'reject')}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {suggestion.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleSuggestionAction(suggestion.id, 'implement')}
                          disabled={actionLoading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Response Dialog */}
      {showResponseDialog && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Respond to Suggestion</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Suggestion</label>
                <div className="p-3 bg-gray-50 rounded">
                  <h4 className="font-medium">{selectedSuggestion.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedSuggestion.description}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Response</label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write your response to the user..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowResponseDialog(false);
                setAdminResponse('');
                setSelectedSuggestion(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleSuggestionAction(selectedSuggestion.id, 'approve', adminResponse)}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Approving...' : 'Approve with Response'}
              </Button>
              <Button 
                onClick={() => handleSuggestionAction(selectedSuggestion.id, 'reject', adminResponse)}
                disabled={actionLoading}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                {actionLoading ? 'Rejecting...' : 'Reject with Response'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuggestionsManagement;