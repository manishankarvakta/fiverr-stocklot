import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea, Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  Lightbulb, Eye, Edit, ThumbsUp, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, TrendingUp, Users, Filter, MessageSquare
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  'NEW': 'bg-blue-100 text-blue-800',
  'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800', 
  'PLANNED': 'bg-green-100 text-green-800',
  'DONE': 'bg-emerald-100 text-emerald-800',
  'DECLINED': 'bg-red-100 text-red-800'
};

const KIND_ICONS = {
  'ANIMAL': '🐄',
  'FEATURE': '✨',
  'BUG': '🐛',
  'OTHER': '💡'
};

export default function AdminSuggestionsManagement() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    by_status: {},
    by_kind: {}
  });

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter, kindFilter]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (kindFilter) params.append('kind', kindFilter);
      
      const response = await fetch(`${API}/admin/suggestions?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        
        // Calculate stats
        const total = data.suggestions.length;
        const by_status = {};
        const by_kind = {};
        
        data.suggestions.forEach(s => {
          by_status[s.status] = (by_status[s.status] || 0) + 1;
          by_kind[s.kind] = (by_kind[s.kind] || 0) + 1;
        });
        
        setStats({ total, by_status, by_kind });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestionStatus = async (suggestionId, status, adminNotes = '') => {
    setUpdating(true);
    try {
      const response = await fetch(`${API}/admin/suggestions/${suggestionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status,
          admin_notes: adminNotes || undefined
        })
      });

      if (response.ok) {
        await fetchSuggestions();
        if (selectedSuggestion && selectedSuggestion.id === suggestionId) {
          setSelectedSuggestion({
            ...selectedSuggestion,
            status,
            admin_notes: adminNotes
          });
        }
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    } finally {
      setUpdating(false);
    }
  };

  const voteSuggestion = async (suggestionId) => {
    try {
      const response = await fetch(`${API}/admin/suggestions/${suggestionId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        await fetchSuggestions();
        if (selectedSuggestion && selectedSuggestion.id === suggestionId) {
          setSelectedSuggestion({
            ...selectedSuggestion,
            votes: selectedSuggestion.votes + 1
          });
        }
      }
    } catch (error) {
      console.error('Error voting on suggestion:', error);
    }
  };

  const openDetail = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suggestions Management</h1>
          <p className="text-gray-600">Manage user suggestions for new features, animals, and improvements</p>
        </div>
        <Button onClick={fetchSuggestions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Suggestions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.by_status.NEW || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-green-600">{stats.by_status.PLANNED || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.by_status.DONE || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
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
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter || ""} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={kindFilter || ""} onValueChange={setKindFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="ANIMAL">Animals</SelectItem>
                  <SelectItem value="FEATURE">Features</SelectItem>
                  <SelectItem value="BUG">Bugs</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading suggestions...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No suggestions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Species/Breed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow key={suggestion.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="mr-2">{KIND_ICONS[suggestion.kind]}</span>
                        <span className="text-sm">{suggestion.kind}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{suggestion.title}</p>
                        {suggestion.details && (
                          <p className="text-sm text-gray-500 truncate">{suggestion.details}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {suggestion.species && <div>{suggestion.species}</div>}
                        {suggestion.breed && <div className="text-gray-500">{suggestion.breed}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[suggestion.status]}>
                        {suggestion.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1 text-gray-400" />
                        {suggestion.votes}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(suggestion.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openDetail(suggestion)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => voteSuggestion(suggestion.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedSuggestion && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <span className="mr-2">{KIND_ICONS[selectedSuggestion.kind]}</span>
                {selectedSuggestion.title}
              </DialogTitle>
              <DialogDescription>
                {selectedSuggestion.kind} suggestion • Created {formatDate(selectedSuggestion.created_at)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="flex items-center space-x-4">
                <Badge className={STATUS_COLORS[selectedSuggestion.status]}>
                  {selectedSuggestion.status.replace('_', ' ')}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {selectedSuggestion.votes} votes
                </div>
              </div>

              {/* Species and Breed */}
              {(selectedSuggestion.species || selectedSuggestion.breed) && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700">Animal Details:</p>
                  {selectedSuggestion.species && <p className="text-sm">Species: {selectedSuggestion.species}</p>}
                  {selectedSuggestion.breed && <p className="text-sm">Breed: {selectedSuggestion.breed}</p>}
                </div>
              )}

              {/* Details */}
              {selectedSuggestion.details && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                    {selectedSuggestion.details}
                  </p>
                </div>
              )}

              {/* Contact Info */}
              {selectedSuggestion.contact_email && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-700">Contact:</p>
                  <p className="text-sm text-blue-600">{selectedSuggestion.contact_email}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedSuggestion.admin_notes && (
                <div className="bg-yellow-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-yellow-700">Admin Notes:</p>
                  <p className="text-sm text-yellow-600">{selectedSuggestion.admin_notes}</p>
                </div>
              )}

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSuggestionStatus(selectedSuggestion.id, 'UNDER_REVIEW')}
                  disabled={updating || selectedSuggestion.status === 'UNDER_REVIEW'}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Under Review
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSuggestionStatus(selectedSuggestion.id, 'PLANNED')}
                  disabled={updating || selectedSuggestion.status === 'PLANNED'}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Plan
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSuggestionStatus(selectedSuggestion.id, 'DONE')}
                  disabled={updating || selectedSuggestion.status === 'DONE'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Done
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateSuggestionStatus(selectedSuggestion.id, 'DECLINED')}
                  disabled={updating || selectedSuggestion.status === 'DECLINED'}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}