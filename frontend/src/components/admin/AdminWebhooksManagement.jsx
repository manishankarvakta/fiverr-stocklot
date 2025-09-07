import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  Webhook, Activity, AlertTriangle, CheckCircle, Clock, RefreshCw,
  Eye, Edit, Plus, Settings, Globe, Lock, Zap, Shield
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminWebhooksManagement() {
  const [webhooks, setWebhooks] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [],
    secret: '',
    description: ''
  });

  useEffect(() => {
    fetchWebhooks();
    fetchWebhookLogs();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/webhooks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const response = await fetch(`${API}/admin/webhook-logs?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhookLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      alert('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    try {
      const response = await fetch(`${API}/admin/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newWebhook)
      });

      if (response.ok) {
        const webhook = await response.json();
        setWebhooks([...webhooks, webhook]);
        setShowCreateDialog(false);
        setNewWebhook({
          name: '',
          url: '',
          events: [],
          secret: '',
          description: ''
        });
        alert('Webhook created successfully!');
      } else {
        const error = await response.json();
        alert(`Error creating webhook: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Error creating webhook. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`${API}/admin/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setWebhooks(webhooks.filter(w => w.id !== webhookId));
        alert('Webhook deleted successfully!');
      } else {
        alert('Error deleting webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Error deleting webhook. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'retrying': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Mock data for demo
  const mockWebhooks = [
    {
      id: 'webhook_1',
      name: 'Paystack Payment Webhook',
      url: `${process.env.REACT_APP_BACKEND_URL || '/api'}/payments/paystack/webhook`,
      events: ['payment.success', 'payment.failed', 'transfer.success'],
      status: 'active',
      secret: 'sk_live_...abc123',
      created_at: '2025-08-15T10:30:00Z',
      last_delivery: '2025-08-29T14:20:00Z',
      success_rate: 98.5,
      total_deliveries: 247,
      failed_deliveries: 4
    },
    {
      id: 'webhook_2',
      name: 'Internal Order Updates',
      url: 'https://internal-system.example.com/webhooks/orders',
      events: ['order.created', 'order.completed', 'order.cancelled'],
      status: 'active',
      secret: 'whsec_...xyz789',
      created_at: '2025-08-10T16:45:00Z',
      last_delivery: '2025-08-29T12:15:00Z',
      success_rate: 95.2,
      total_deliveries: 156,
      failed_deliveries: 8
    },
    {
      id: 'webhook_3',
      name: 'SMS Notification Service',
      url: 'https://sms-service.example.com/webhooks/livestock',
      events: ['listing.approved', 'user.verified'],
      status: 'failed',
      secret: 'whsec_...def456',
      created_at: '2025-08-20T11:00:00Z',
      last_delivery: '2025-08-28T09:30:00Z',
      success_rate: 72.3,
      total_deliveries: 89,
      failed_deliveries: 25
    },
    {
      id: 'webhook_4',
      name: 'Analytics Dashboard',
      url: 'https://analytics.farmstock.co.za/webhooks/events',
      events: ['*'],
      status: 'inactive',
      secret: 'whsec_...ghi789',
      created_at: '2025-08-25T08:15:00Z',
      last_delivery: null,
      success_rate: 0,
      total_deliveries: 0,
      failed_deliveries: 0
    }
  ];

  const mockWebhookLogs = [
    {
      id: 'log_1',
      webhook_id: 'webhook_1',
      webhook_name: 'Paystack Payment Webhook',
      event_type: 'payment.success',
      url: `${process.env.REACT_APP_BACKEND_URL || '/api'}/payments/paystack/webhook`,
      status_code: 200,
      response_time: 156,
      delivered_at: '2025-08-29T14:20:15Z',
      payload: '{"event": "payment.success", "data": {"reference": "TXN_123"}}',
      response: '{"status": "success", "message": "Payment processed"}'
    },
    {
      id: 'log_2',
      webhook_id: 'webhook_2',
      webhook_name: 'Internal Order Updates',
      event_type: 'order.created',
      url: 'https://internal-system.example.com/webhooks/orders',
      status_code: 404,
      response_time: 5000,
      delivered_at: '2025-08-29T13:45:32Z',
      payload: '{"event": "order.created", "data": {"order_id": "order_456"}}',
      response: '{"error": "Endpoint not found"}',
      retry_count: 3
    },
    {
      id: 'log_3',
      webhook_id: 'webhook_3',
      webhook_name: 'SMS Notification Service',
      event_type: 'listing.approved',
      url: 'https://sms-service.example.com/webhooks/livestock',
      status_code: 500,
      response_time: 2500,
      delivered_at: '2025-08-29T12:30:21Z',
      payload: '{"event": "listing.approved", "data": {"listing_id": "listing_789"}}',
      response: '{"error": "Internal server error"}',
      retry_count: 5
    },
    {
      id: 'log_4',
      webhook_id: 'webhook_1',
      webhook_name: 'Paystack Payment Webhook',
      event_type: 'payment.failed',
      url: 'https://easy-signin-1.preview.emergentagent.com/api/payments/paystack/webhook',
      status_code: 200,
      response_time: 203,
      delivered_at: '2025-08-29T11:15:44Z',
      payload: '{"event": "payment.failed", "data": {"reference": "TXN_124"}}',
      response: '{"status": "success", "message": "Failure processed"}'
    }
  ];

  const displayWebhooks = webhooks.length > 0 ? webhooks : mockWebhooks;
  const displayLogs = webhookLogs.length > 0 ? webhookLogs : mockWebhookLogs;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Webhooks Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhooks Management</h2>
          <p className="text-gray-600">Monitor and manage webhook endpoints and deliveries</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchWebhooks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Webhooks</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayWebhooks.filter(w => w.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayWebhooks.reduce((sum, w) => sum + w.total_deliveries, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed Deliveries</p>
                <p className="text-2xl font-bold text-red-600">
                  {displayWebhooks.reduce((sum, w) => sum + w.failed_deliveries, 0).toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Success Rate</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {displayWebhooks.length > 0 
                    ? Math.round(displayWebhooks.reduce((sum, w) => sum + w.success_rate, 0) / displayWebhooks.length)
                    : 0
                  }%
                </p>
              </div>
              <Zap className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhook Endpoints</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="events">Event Types</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayWebhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{webhook.name}</p>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(webhook.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded max-w-xs truncate">
                          {webhook.url}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(webhook.status)}>
                          {webhook.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{webhook.success_rate}%</p>
                          <p className="text-sm text-gray-500">
                            {webhook.total_deliveries} total
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedWebhook(webhook); setShowWebhookDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <p className="font-medium">{log.webhook_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getResponseStatusColor(log.status_code)}>
                          {log.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={log.response_time > 1000 ? 'text-red-600' : 'text-green-600'}>
                          {log.response_time}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(log.delivered_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Available Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Payment Events</h4>
                  <div className="space-y-1">
                    <Badge variant="outline">payment.success</Badge>
                    <Badge variant="outline">payment.failed</Badge>
                    <Badge variant="outline">transfer.success</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Events</h4>
                  <div className="space-y-1">
                    <Badge variant="outline">order.created</Badge>
                    <Badge variant="outline">order.completed</Badge>
                    <Badge variant="outline">order.cancelled</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Listing Events</h4>
                  <div className="space-y-1">
                    <Badge variant="outline">listing.approved</Badge>
                    <Badge variant="outline">listing.rejected</Badge>
                    <Badge variant="outline">listing.expired</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">User Events</h4>
                  <div className="space-y-1">
                    <Badge variant="outline">user.verified</Badge>
                    <Badge variant="outline">user.suspended</Badge>
                    <Badge variant="outline">user.created</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Webhook</DialogTitle>
            <DialogDescription>
              Add a new webhook endpoint to receive event notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Webhook Name *</Label>
              <Input
                id="name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})}
                placeholder="e.g., Payment Processor Webhook"
              />
            </div>
            
            <div>
              <Label htmlFor="url">Webhook URL *</Label>
              <Input
                id="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                placeholder="https://your-domain.com/webhooks/endpoint"
              />
            </div>
            
            <div>
              <Label htmlFor="events">Event Types (comma separated)</Label>
              <Input
                id="events"
                value={newWebhook.events.join(', ')}
                onChange={(e) => setNewWebhook({
                  ...newWebhook, 
                  events: e.target.value.split(',').map(e => e.trim()).filter(e => e)
                })}
                placeholder="payment.success, order.created"
              />
            </div>
            
            <div>
              <Label htmlFor="secret">Webhook Secret</Label>
              <Input
                id="secret"
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook({...newWebhook, secret: e.target.value})}
                placeholder="Optional security secret"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newWebhook.description}
                onChange={(e) => setNewWebhook({...newWebhook, description: e.target.value})}
                placeholder="Brief description of this webhook's purpose"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWebhook}
              disabled={createLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {createLoading ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Details Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook Details</DialogTitle>
            <DialogDescription>
              View webhook configuration and delivery statistics
            </DialogDescription>
          </DialogHeader>
          
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Webhook Name</Label>
                  <p className="text-sm">{selectedWebhook.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedWebhook.status)}>
                    {selectedWebhook.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Webhook URL</Label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                  {selectedWebhook.url}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Success Rate</Label>
                  <p className="text-2xl font-bold text-green-600">{selectedWebhook.success_rate}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Deliveries</Label>
                  <p className="text-2xl font-bold text-blue-600">{selectedWebhook.total_deliveries}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Failed Deliveries</Label>
                  <p className="text-2xl font-bold text-red-600">{selectedWebhook.failed_deliveries}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Event Types</Label>
                <div className="space-y-1 mt-1">
                  {selectedWebhook.events.map((event, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Webhook Secret</Label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {selectedWebhook.secret}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Test Webhook
            </Button>
            <Button variant="outline">
              Edit Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}