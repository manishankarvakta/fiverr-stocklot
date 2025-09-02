import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger, Checkbox
} from '../ui';
import { 
  Megaphone, Send, Users, Calendar, Eye, MessageCircle, Target,
  Mail, Bell, RefreshCw, Plus, BarChart3, Filter, Download
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminBroadcastMessaging() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchAudiences();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/broadcast-campaigns`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API}/admin/message-templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAudiences = async () => {
    try {
      const response = await fetch(`${API}/admin/broadcast-audiences`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAudiences(data.audiences || []);
      }
    } catch (error) {
      console.error('Error fetching audiences:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'sending': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data
  const mockCampaigns = [
    {
      id: 'campaign_1',
      title: 'New Livestock Auction Announcement',
      subject: 'Premium Cattle Auction - This Weekend!',
      message: 'Join us for our biggest cattle auction of the year...',
      type: 'email',
      status: 'sent',
      audience: 'cattle_buyers',
      audience_name: 'Cattle Buyers',
      recipients_count: 1247,
      opened_count: 892,
      clicked_count: 234,
      scheduled_at: null,
      sent_at: '2025-08-29T10:00:00Z',
      created_at: '2025-08-28T15:30:00Z'
    },
    {
      id: 'campaign_2',
      title: 'Weekly Market Report',
      subject: 'StockLot Weekly Market Update - August 2025',
      message: 'This week in livestock markets...',
      type: 'newsletter',
      status: 'scheduled',
      audience: 'all_users',
      audience_name: 'All Users',
      recipients_count: 3456,
      opened_count: 0,
      clicked_count: 0,
      scheduled_at: '2025-08-30T08:00:00Z',
      sent_at: null,
      created_at: '2025-08-29T14:20:00Z'
    },
    {
      id: 'campaign_3',
      title: 'Platform Maintenance Notification',
      subject: 'Scheduled Platform Maintenance',
      message: 'We will be performing scheduled maintenance...',
      type: 'system',
      status: 'draft',
      audience: 'active_sellers',
      audience_name: 'Active Sellers',
      recipients_count: 789,
      opened_count: 0,
      clicked_count: 0,
      scheduled_at: null,
      sent_at: null,
      created_at: '2025-08-29T16:45:00Z'
    }
  ];

  const mockTemplates = [
    {
      id: 'template_1',
      name: 'Auction Announcement',
      subject: 'New Livestock Auction - {{auction_title}}',
      content: 'Dear {{user_name}}, we are excited to announce...',
      type: 'auction',
      usage_count: 15,
      created_at: '2025-08-15T10:00:00Z'
    },
    {
      id: 'template_2',
      name: 'Payment Confirmation',
      subject: 'Payment Received - Order #{{order_id}}',
      content: 'Thank you {{user_name}}, your payment has been received...',
      type: 'payment',
      usage_count: 234,
      created_at: '2025-08-10T14:30:00Z'
    },
    {
      id: 'template_3',
      name: 'Welcome New User',
      subject: 'Welcome to StockLot, {{user_name}}!',
      content: 'Welcome to South Africa\'s premier livestock marketplace...',
      type: 'welcome',
      usage_count: 89,
      created_at: '2025-08-20T09:15:00Z'
    }
  ];

  const mockAudiences = [
    {
      id: 'audience_1',
      name: 'All Users',
      slug: 'all_users',
      description: 'All registered platform users',
      count: 3456,
      criteria: ['status=active'],
      created_at: '2025-08-01T12:00:00Z'
    },
    {
      id: 'audience_2',
      name: 'Active Sellers',
      slug: 'active_sellers',
      description: 'Users with active livestock listings',
      count: 789,
      criteria: ['role=seller', 'has_active_listings=true'],
      created_at: '2025-08-01T12:00:00Z'
    },
    {
      id: 'audience_3',
      name: 'Cattle Buyers',
      slug: 'cattle_buyers',
      description: 'Users interested in cattle purchases',
      count: 1247,
      criteria: ['interested_in=cattle', 'role=buyer'],
      created_at: '2025-08-01T12:00:00Z'
    },
    {
      id: 'audience_4',
      name: 'Premium Members',
      slug: 'premium_members',
      description: 'Users with premium subscriptions',
      count: 234,
      criteria: ['subscription=premium'],
      created_at: '2025-08-15T10:30:00Z'
    }
  ];

  const displayCampaigns = campaigns.length > 0 ? campaigns : mockCampaigns;
  const displayTemplates = templates.length > 0 ? templates : mockTemplates;
  const displayAudiences = audiences.length > 0 ? audiences : mockAudiences;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Broadcast Messaging</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Broadcast Messaging</h2>
          <p className="text-gray-600">Send targeted messages and notifications to platform users</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-600">{displayCampaigns.length}</p>
              </div>
              <Megaphone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Recipients</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayCampaigns.reduce((sum, c) => sum + c.recipients_count, 0).toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {displayCampaigns.length > 0 ? 
                    Math.round((displayCampaigns.reduce((sum, c) => sum + c.opened_count, 0) / 
                    displayCampaigns.reduce((sum, c) => sum + c.recipients_count, 1)) * 100) : 0}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Message Templates</p>
                <p className="text-2xl font-bold text-orange-600">{displayTemplates.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.title}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.audience_name}</div>
                          <div className="text-sm text-gray-500">{campaign.recipients_count} users</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {campaign.recipients_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {campaign.status === 'sent' ? (
                          <div className="text-sm">
                            <div>Opened: {campaign.opened_count} ({Math.round((campaign.opened_count/campaign.recipients_count)*100)}%)</div>
                            <div>Clicked: {campaign.clicked_count} ({Math.round((campaign.clicked_count/campaign.recipients_count)*100)}%)</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {campaign.status === 'draft' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-4 w-4" />
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

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="font-medium">{template.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {template.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{template.usage_count}</TableCell>
                      <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            Use Template
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

        <TabsContent value="audiences">
          <Card>
            <CardHeader>
              <CardTitle>Target Audiences</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audience Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User Count</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAudiences.map((audience) => (
                    <TableRow key={audience.id}>
                      <TableCell>
                        <div className="font-medium">{audience.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{audience.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-blue-600">{audience.count.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {audience.criteria.slice(0, 2).map((criteria, index) => (
                            <Badge key={index} variant="outline" className="text-xs mr-1">
                              {criteria}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(audience.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Target className="h-4 w-4" />
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

        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Average Open Rate</span>
                    <span className="text-2xl font-bold text-green-600">67.3%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Average Click Rate</span>
                    <span className="text-2xl font-bold text-blue-600">23.8%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Total Messages Sent</span>
                    <span className="text-2xl font-bold text-purple-600">5,492</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayAudiences.map((audience, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{audience.name}</div>
                        <div className="text-sm text-gray-500">{audience.count} users</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">85%</div>
                        <div className="text-xs text-gray-500">engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Broadcast Campaign</DialogTitle>
            <DialogDescription>
              Send targeted messages to platform users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Campaign Title</Label>
              <Input placeholder="e.g., Weekly Market Update" />
            </div>

            <div>
              <Label>Message Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="notification">Push Notification</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="system">System Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Audience</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {displayAudiences.map((audience) => (
                    <SelectItem key={audience.id} value={audience.slug}>
                      {audience.name} ({audience.count} users)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject Line</Label>
              <Input placeholder="Email subject or notification title" />
            </div>

            <div>
              <Label>Message Content</Label>
              <Textarea 
                placeholder="Write your message content here..."
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox />
              <Label>Schedule for later</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}