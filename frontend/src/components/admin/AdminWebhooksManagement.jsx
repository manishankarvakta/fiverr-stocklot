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
      url: 'https://procurement-hub-10.preview.emergentagent.com/api/payments/paystack/webhook',
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
      url: 'https://procurement-hub-10.preview.emergentagent.com/api/payments/paystack/webhook',
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
      url: 'https://procurement-hub-10.preview.emergentagent.com/api/payments/paystack/webhook',
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
          <Button className="bg-green-600 hover:bg-green-700">
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
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Last Delivery</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayWebhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{webhook.name}</div>
                          <div className="text-sm text-gray-500">
                            {webhook.total_deliveries} total deliveries
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={webhook.url}>
                          <Globe className="h-4 w-4 inline mr-1" />
                          {webhook.url}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {webhook.events.slice(0, 2).map((event, index) => (
                            <Badge key={index} variant="outline" className="text-xs mr-1">
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
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                webhook.success_rate >= 95 ? 'bg-green-600' :
                                webhook.success_rate >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${webhook.success_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{webhook.success_rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.last_delivery ? 
                          new Date(webhook.last_delivery).toLocaleDateString() : 
                          'Never'
                        }
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
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
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
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.webhook_name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {log.url}
                          </div>
                        </div>
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
                        <span className={`text-sm ${
                          log.response_time > 2000 ? 'text-red-600' :
                          log.response_time > 1000 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {log.response_time}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.retry_count || 0}
                      </TableCell>
                      <TableCell>{new Date(log.delivered_at).toLocaleTimeString()}</TableCell>
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
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: 'Payment Events', events: ['payment.success', 'payment.failed', 'payment.pending'] },
                    { category: 'Order Events', events: ['order.created', 'order.completed', 'order.cancelled'] },
                    { category: 'User Events', events: ['user.registered', 'user.verified', 'user.suspended'] },
                    { category: 'Listing Events', events: ['listing.created', 'listing.approved', 'listing.rejected'] }
                  ].map((category, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h4 className="font-medium mb-2">{category.category}</h4>
                      <div className="space-y-1">
                        {category.events.map((event, eventIndex) => (
                          <Badge key={eventIndex} variant="outline" className="mr-2 text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Security</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Lock className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">HMAC Signature Verification</h4>
                      <p className="text-sm text-gray-500">All webhooks include cryptographic signatures</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">HTTPS Only</h4>
                      <p className="text-sm text-gray-500">Webhook URLs must use HTTPS encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Automatic Retries</h4>
                      <p className="text-sm text-gray-500">Failed deliveries retry with exponential backoff</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm">{selectedWebhook.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedWebhook.status)}>
                    {selectedWebhook.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">URL</Label>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedWebhook.url}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Deliveries</Label>
                  <p className="text-sm font-semibold">{selectedWebhook.total_deliveries}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Failed Deliveries</Label>
                  <p className="text-sm font-semibold text-red-600">{selectedWebhook.failed_deliveries}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Success Rate</Label>
                  <p className="text-sm font-semibold">{selectedWebhook.success_rate}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Delivery</Label>
                  <p className="text-sm">
                    {selectedWebhook.last_delivery ? 
                      new Date(selectedWebhook.last_delivery).toLocaleString() : 
                      'Never'
                    }
                  </p>
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