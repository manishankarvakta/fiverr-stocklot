import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, Calendar, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
// import adminApi from '../../api/adminClient';

const AdminExperimentResults = () => {
  const { experimentId } = useParams();
  const [experiment, setExperiment] = useState(null);
  const [results, setResults] = useState({});
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (experimentId) {
      loadExperimentResults();
    }
  }, [experimentId, dateRange]);

  const loadExperimentResults = async () => {
    try {
      setLoading(true);
      
      const [experimentResponse, resultsResponse, timelineResponse] = await Promise.all([
        adminApi.get(`/admin/ab-tests/${experimentId}`),
        adminApi.get(`/admin/ab-tests/${experimentId}/results`, {
          params: { start_date: dateRange.start, end_date: dateRange.end }
        }),
        adminApi.get(`/admin/ab-tests/${experimentId}/timeline`, {
          params: { start_date: dateRange.start, end_date: dateRange.end }
        })
      ]);
      
      setExperiment(experimentResponse.data);
      setResults(resultsResponse.data);
      setTimelineData(timelineResponse.data.timeline || []);
      
    } catch (error) {
      console.error('Error loading experiment results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSignificance = (controlRate, treatmentRate, controlSample, treatmentSample) => {
    // Basic significance calculation (simplified z-test for proportions)
    const pooledRate = (controlRate * controlSample + treatmentRate * treatmentSample) / (controlSample + treatmentSample);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlSample + 1/treatmentSample));
    const zScore = Math.abs(controlRate - treatmentRate) / standardError;
    
    // Approximate p-value (simplified)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    return { zScore, pValue, isSignificant: pValue < 0.05 };
  };

  // Helper function for normal CDF approximation
  const normalCDF = (x) => {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  };

  const erf = (x) => {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  };

  const getExperimentStatus = (experiment) => {
    const now = new Date();
    const endDate = new Date(experiment.end_date);
    
    if (experiment.status === 'completed') {
      return { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (experiment.status === 'running' && now > endDate) {
      return { label: 'Ended', color: 'bg-blue-100 text-blue-800', icon: Calendar };
    } else if (experiment.status === 'running') {
      return { label: 'Running', color: 'bg-yellow-100 text-yellow-800', icon: Target };
    }
    return { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
  };

  const getVariantColor = (index) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Experiment Not Found</h3>
        <p className="text-gray-500">The requested experiment could not be found.</p>
      </div>
    );
  }

  const status = getExperimentStatus(experiment);
  const variants = results.variants || [];
  const controlVariant = variants.find(v => v.is_control) || variants[0];
  const treatmentVariants = variants.filter(v => !v.is_control);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{experiment.name}</h1>
          <p className="text-gray-600 mt-1">{experiment.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <status.icon className="h-4 w-4" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(experiment.start_date).toLocaleDateString()} - {new Date(experiment.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="border-none outline-none text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="border-none outline-none text-sm"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{results.total_participants || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((results.overall_conversion_rate || 0) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Performer</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.best_variant?.name || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Statistical Significance</p>
                <p className={`text-2xl font-bold ${results.is_significant ? 'text-green-600' : 'text-orange-600'}`}>
                  {results.is_significant ? 'Yes' : 'No'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${results.is_significant ? 'bg-green-100' : 'bg-orange-100'}`}>
                {results.is_significant ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3">Variant</th>
                  <th className="text-right py-3">Participants</th>
                  <th className="text-right py-3">Conversions</th>
                  <th className="text-right py-3">Conversion Rate</th>
                  <th className="text-right py-3">Improvement</th>
                  <th className="text-right py-3">Confidence</th>
                  <th className="text-right py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => {
                  const improvement = controlVariant && !variant.is_control 
                    ? ((variant.conversion_rate - controlVariant.conversion_rate) / controlVariant.conversion_rate * 100)
                    : 0;
                  
                  const significance = controlVariant && !variant.is_control
                    ? calculateSignificance(
                        controlVariant.conversion_rate,
                        variant.conversion_rate,
                        controlVariant.participants,
                        variant.participants
                      )
                    : { isSignificant: false, pValue: 1 };

                  return (
                    <tr key={variant.id} className="border-b hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: getVariantColor(index) }}
                          ></div>
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            {variant.is_control && (
                              <span className="text-xs text-gray-500">Control</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4">{variant.participants.toLocaleString()}</td>
                      <td className="text-right py-4">{variant.conversions.toLocaleString()}</td>
                      <td className="text-right py-4 font-medium">
                        {(variant.conversion_rate * 100).toFixed(2)}%
                      </td>
                      <td className="text-right py-4">
                        {variant.is_control ? (
                          <span className="text-gray-500">-</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {improvement >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {improvement.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="text-right py-4">
                        {variant.is_control ? (
                          <span className="text-gray-500">-</span>
                        ) : (
                          <span className={significance.isSignificant ? 'text-green-600' : 'text-orange-600'}>
                            {((1 - significance.pValue) * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="text-right py-4">
                        {variant.is_control ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Control</span>
                        ) : significance.isSignificant ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Significant</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inconclusive</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [`${(value * 100).toFixed(2)}%`, name]}
                />
                {variants.map((variant, index) => (
                  <Line
                    key={variant.id}
                    type="monotone"
                    dataKey={`${variant.name.toLowerCase().replace(/\s+/g, '_')}_rate`}
                    stroke={getVariantColor(index)}
                    strokeWidth={variant.is_control ? 3 : 2}
                    strokeDasharray={variant.is_control ? '0' : '5 5'}
                    name={variant.name}
                    dot={{ fill: getVariantColor(index), strokeWidth: 0, r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={variants.map((variant, index) => ({
                      name: variant.name,
                      value: variant.conversions,
                      color: getVariantColor(index)
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {variants.map((variant, index) => (
                      <Cell key={`cell-${index}`} fill={getVariantColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.insights?.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
              
              {!results.insights?.length && (
                <div className="text-sm text-gray-500">
                  <p>• Experiment is {results.is_significant ? 'statistically significant' : 'not yet statistically significant'}</p>
                  <p>• Best performing variant: {results.best_variant?.name || 'N/A'}</p>
                  <p>• Total sample size: {results.total_participants || 0} participants</p>
                  {!results.is_significant && (
                    <p>• Consider running longer to achieve statistical significance</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminExperimentResults;