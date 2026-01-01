import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Plus, Play, Pause, BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import { useGetABTestsQuery } from '@/store/api/analytics.api';
// import adminApi from '../../api/adminClient';

const AdminExperiments = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    target_url: '',
    traffic_split: 50,
    metrics: ['conversion_rate', 'engagement']
  });

const {data, isLoading, isError, refetch} = useGetABTestsQuery();
console.log("Experiments Data:", data, isLoading, isError);
  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      
      const response = await adminApi.get('/admin/ab-tests');
      setExperiments(response.data.experiments || []);
      
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async () => {
    try {
      await adminApi.post('/admin/ab-tests', newExperiment);
      
      setShowCreateModal(false);
      setNewExperiment({
        name: '',
        description: '',
        target_url: '',
        traffic_split: 50,
        metrics: ['conversion_rate', 'engagement']
      });
      
      await loadExperiments();
      
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Failed to create experiment');
    }
  };

  const toggleExperiment = async (experimentId, isActive) => {
    try {
      const action = isActive ? 'pause' : 'start';
      await adminApi.post(`/admin/ab-tests/${experimentId}/${action}`);
      
      await loadExperiments();
      
    } catch (error) {
      console.error('Error toggling experiment:', error);
      alert('Failed to update experiment status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">A/B Testing Experiments</h1>
          <p className="text-gray-600 mt-1">Create and manage conversion optimization tests</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Experiment
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {experiments.filter(exp => exp.status === 'active').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Play className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{experiments.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Improvement</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">+12.3%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">24,891</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <Card>
        <CardHeader>
          <CardTitle>Experiments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {experiments.map((experiment) => (
              <div key={experiment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{experiment.name}</h3>
                      {getStatusBadge(experiment.status)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{experiment.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{(experiment.visitors || 0).toLocaleString()} visitors</span>
                      </div>
                      
                      <div>
                        <span>Traffic Split: {experiment.traffic_split}% / {100 - experiment.traffic_split}%</span>
                      </div>
                      
                      <div>
                        <span>Duration: {experiment.duration_days || 30} days</span>
                      </div>
                      
                      {experiment.improvement && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">
                            +{(experiment.improvement * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExperiment(experiment.id, experiment.status === 'active')}
                      className={`p-2 rounded-lg ${
                        experiment.status === 'active' 
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={experiment.status === 'active' ? 'Pause Experiment' : 'Start Experiment'}
                    >
                      {experiment.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    
                    <Link
                      to={`/admin/experiments/${experiment.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {experiments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No experiments yet</p>
                <p className="text-sm">Create your first A/B test to start optimizing conversions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Create New Experiment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Experiment Name</label>
                <input
                  type="text"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g., PDP Buy Button Color Test"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  placeholder="Describe what you're testing..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Target URL Pattern</label>
                <input
                  type="text"
                  value={newExperiment.target_url}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, target_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="/listing/:id"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Traffic Split (%)</label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={newExperiment.traffic_split}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, traffic_split: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Control: {100 - newExperiment.traffic_split}%</span>
                  <span>Variant: {newExperiment.traffic_split}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createExperiment}
                className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
              >
                Create Experiment
              </button>
              
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExperiments;