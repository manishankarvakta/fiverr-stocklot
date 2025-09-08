import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Label, Textarea
} from '@/components/ui';
import { 
  FlaskConical, Play, Pause, BarChart3, TrendingUp, Users, Target,
  Plus, Eye, Settings, CheckCircle, XCircle, Clock
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || '/api';

export default function AdminABTesting() {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [experimentResults, setExperimentResults] = useState(null);

  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    variants: [
      { id: 'control', name: 'Control (Original)', config: {} },
      { id: 'variant_a', name: 'Variant A', config: {} }
    ],
    traffic_split: { control: 50, variant_a: 50 },
    duration_days: 30
  });

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/admin/ab-tests`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExperiments(data.experiments || []);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async () => {
    try {
      const response = await fetch(`${API}/admin/ab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newExperiment)
      });

      if (response.ok) {
        setShowCreateDialog(false);
        fetchExperiments();
        setNewExperiment({
          name: '',
          description: '',
          variants: [
            { id: 'control', name: 'Control (Original)', config: {} },
            { id: 'variant_a', name: 'Variant A', config: {} }
          ],
          traffic_split: { control: 50, variant_a: 50 },
          duration_days: 30
        });
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
    }
  };

  const fetchExperimentResults = async (experimentId) => {
    try {
      const response = await fetch(`${API}/admin/ab-tests/${experimentId}/results`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExperimentResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { color: 'gray', icon: Clock, text: 'Draft' },
      active: { color: 'green', icon: Play, text: 'Active' },
      completed: { color: 'blue', icon: CheckCircle, text: 'Completed' },
      paused: { color: 'yellow', icon: Pause, text: 'Paused' }
    };
    
    const config = configs[status] || configs.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.color} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const predefinedExperiments = [
    {
      name: "PDP Gallery Layout Test",
      description: "Test thumbnail vs carousel gallery styles",
      variants: [
        { id: 'control', name: 'Thumbnail Gallery', config: { gallery_style: 'thumbnails' } },
        { id: 'variant_a', name: 'Carousel Gallery', config: { gallery_style: 'carousel' } }
      ]
    },
    {
      name: "CTA Button Placement Test", 
      description: "Test button placement and styling",
      variants: [
        { id: 'control', name: 'Right Side', config: { cta_placement: 'right', cta_style: 'primary' } },
        { id: 'variant_a', name: 'Below Description', config: { cta_placement: 'bottom', cta_style: 'large' } }
      ]
    },
    {
      name: "Seller Contact Display Test",
      description: "Test hiding vs showing seller contact info",
      variants: [
        { id: 'control', name: 'Hidden Contact', config: { show_seller_contact: false } },
        { id: 'variant_a', name: 'Visible Contact', config: { show_seller_contact: true } }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">A/B Testing</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <FlaskConical className="h-6 w-6 mr-2" />
            A/B Testing Dashboard
          </h1>
          <p className="text-gray-600">Optimize PDP performance with controlled experiments</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create A/B Test Experiment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Experiment Name</Label>
                  <Input
                    id="name"
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment({...newExperiment, name: e.target.value})}
                    placeholder="e.g., PDP Gallery Test"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newExperiment.duration_days}
                    onChange={(e) => setNewExperiment({...newExperiment, duration_days: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment({...newExperiment, description: e.target.value})}
                  placeholder="Describe what you're testing..."
                />
              </div>

              <div>
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {predefinedExperiments.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => setNewExperiment({
                        ...newExperiment,
                        name: template.name,
                        description: template.description,
                        variants: template.variants
                      })}
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createExperiment}>
                  Create Experiment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Experiments</p>
                <p className="text-3xl font-bold text-blue-600">{experiments.length}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-3xl font-bold text-green-600">
                  {experiments.filter(e => e.status === 'active').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-purple-600">
                  {experiments.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Conversion</p>
                <p className="text-3xl font-bold text-orange-600">12.4%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Experiments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Traffic Split</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((experiment) => (
                <TableRow key={experiment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{experiment.name}</div>
                      <div className="text-sm text-gray-500">{experiment.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(experiment.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {experiment.variants?.map((v, i) => (
                        <div key={i}>{v.name}</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {Object.entries(experiment.traffic_split || {}).map(([variant, split]) => (
                        <div key={variant}>{variant}: {split}%</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{experiment.duration_days} days</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedExperiment(experiment);
                          fetchExperimentResults(experiment.id);
                        }}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {experiments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No experiments yet. Create your first A/B test to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      {selectedExperiment && (
        <Dialog 
          open={!!selectedExperiment} 
          onOpenChange={() => setSelectedExperiment(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedExperiment.name} - Results</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {experimentResults ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Participants</p>
                          <p className="text-2xl font-bold">{experimentResults.total_participants}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {Object.entries(experimentResults.results || {}).map(([variant, data]) => (
                      <Card key={variant}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">{variant} Conversion</p>
                            <p className="text-2xl font-bold">
                              {data.conversion_rate?.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {data.conversion?.count || 0} / {data.view?.count || 0}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Detailed Results</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variant</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Conversions</TableHead>
                          <TableHead>Conversion Rate</TableHead>
                          <TableHead>Unique Users</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(experimentResults.results || {}).map(([variant, data]) => (
                          <TableRow key={variant}>
                            <TableCell className="font-medium">{variant}</TableCell>
                            <TableCell>{data.view?.count || 0}</TableCell>
                            <TableCell>{data.conversion?.count || 0}</TableCell>
                            <TableCell>
                              <span className={`font-semibold ${
                                (data.conversion_rate || 0) > 10 ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {data.conversion_rate?.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>{data.view?.unique_users || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}