import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertDescription
} from '@/components/ui';
import { 
  Send, Plus, Eye, Edit, Trash2, Users, MessageSquare, BarChart3, Clock,
  Target, Mail, Bell, CheckCircle, XCircle, Calendar, Filter
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'https://farm-admin.preview.emergentagent.com/api';

export default function AdminBroadcastMessaging() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateAudience, setShowCreateAudience] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    template_id: '',
    audience_id: '',
    send_type: 'immediate',
    scheduled_at: '',
    channel: 'email'
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'email',
    category: 'general'
  });
  const [newAudience, setNewAudience] = useState({
    name: '',
    description: '',
    criteria: {
      user_type: 'all',
      location: '',
      registration_date: '',
      activity_level: ''
    }
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchAudiences();
    fetchAnalytics();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${API}/admin/broadcast/campaigns`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API}/admin/broadcast/templates`, {
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
      const response = await fetch(`${API}/admin/broadcast/audiences`, {
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

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API}/admin/broadcast/analytics`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || {});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleCreateCampaign = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/broadcast/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCampaign)
      });

      if (response.ok) {
        setShowCreateCampaign(false);
        setNewCampaign({
          name: '', subject: '', content: '', template_id: '', audience_id: '',
          send_type: 'immediate', scheduled_at: '', channel: 'email'
        });
        fetchCampaigns();
        alert('Campaign created successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/broadcast/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        setShowCreateTemplate(false);
        setNewTemplate({
          name: '', subject: '', content: '', type: 'email', category: 'general'
        });
        fetchTemplates();
        alert('Template created successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudience = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/broadcast/audiences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAudience)
      });

      if (response.ok) {
        setShowCreateAudience(false);
        setNewAudience({
          name: '', description: '', 
          criteria: { user_type: 'all', location: '', registration_date: '', activity_level: '' }
        });
        fetchAudiences();
        alert('Audience created successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create audience');
      }
    } catch (error) {
      console.error('Error creating audience:', error);
      alert('Failed to create audience: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to send this campaign?')) {
      try {
        const response = await fetch(`${API}/admin/broadcast/campaigns/${campaignId}/send`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchCampaigns();
          alert('Campaign sent successfully!');
        } else {
          throw new Error('Failed to send campaign');
        }
      } catch (error) {
        console.error('Error sending campaign:', error);
        alert('Failed to send campaign');
      }
    }
  };

  const handleDeleteItem = async (type, itemId) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const response = await fetch(`${API}/admin/broadcast/${type}/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          if (type === 'campaigns') fetchCampaigns();
          else if (type === 'templates') fetchTemplates();
          else if (type === 'audiences') fetchAudiences();
          alert(`${type} deleted successfully!`);
        } else {
          throw new Error(`Failed to delete ${type}`);
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`Failed to delete ${type}`);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Broadcast Messages</h1>
        <Button onClick={() => setShowCreateCampaign(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Audiences</p>
                <p className="text-2xl font-bold">{audiences.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold">{analytics.open_rate || '0%'}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns ({campaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel)}
                          <span className="capitalize">{campaign.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {campaign.audience_name || 'All Users'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'Not sent'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('View campaign:', campaign.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem('campaigns', campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Templates ({templates.length})</CardTitle>
                <Button onClick={() => setShowCreateTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">{template.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('Edit template:', template.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem('templates', template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Audiences Tab */}
        <TabsContent value="audiences">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Audiences ({audiences.length})</CardTitle>
                <Button onClick={() => setShowCreateAudience(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Audience
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audience</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audiences.map((audience) => (
                    <TableRow key={audience.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{audience.name}</div>
                          <div className="text-sm text-gray-500">{audience.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Type: {audience.criteria?.user_type || 'All'}</div>
                          {audience.criteria?.location && <div>Location: {audience.criteria.location}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {audience.size || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {audience.created_at ? new Date(audience.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('Edit audience:', audience.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem('audiences', audience.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Sent:</span>
                    <span className="font-bold">{analytics.total_sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivered:</span>
                    <span className="font-bold text-green-600">{analytics.delivered || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opened:</span>
                    <span className="font-bold text-blue-600">{analytics.opened || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clicked:</span>  
                    <span className="font-bold text-purple-600">{analytics.clicked || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Open Rate:</span>
                    <span className="font-bold">{analytics.open_rate || '0%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Click Rate:</span>
                    <span className="font-bold">{analytics.click_rate || '0%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Rate:</span>
                    <span className="font-bold">{analytics.bounce_rate || '0%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unsubscribe Rate:</span>
                    <span className="font-bold">{analytics.unsubscribe_rate || '0%'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create a new broadcast messaging campaign
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Campaign Name *</Label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="Monthly Newsletter"
              />
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={newCampaign.channel} onValueChange={(value) => setNewCampaign({...newCampaign, channel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Subject *</Label>
              <Input
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                placeholder="Your monthly livestock market update"
              />
            </div>
            <div>
              <Label>Template</Label>
              <Select value={newCampaign.template_id} onValueChange={(value) => setNewCampaign({...newCampaign, template_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={newCampaign.audience_id} onValueChange={(value) => setNewCampaign({...newCampaign, audience_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {audiences.map(audience => (
                    <SelectItem key={audience.id} value={audience.id}>{audience.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Content *</Label>
              <Textarea
                value={newCampaign.content}
                onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                placeholder="Write your message content here..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign} 
              disabled={loading || !newCampaign.name || !newCampaign.subject}
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a reusable message template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="Welcome Email Template"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                placeholder="Welcome to StockLot!"
              />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                placeholder="Write your template content here..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTemplate} 
              disabled={loading || !newTemplate.name || !newTemplate.content}
            >
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Audience Dialog */}
      <Dialog open={showCreateAudience} onOpenChange={setShowCreateAudience}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Audience</DialogTitle>
            <DialogDescription>
              Define a target audience for your campaigns
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Audience Name *</Label>
              <Input
                value={newAudience.name}
                onChange={(e) => setNewAudience({...newAudience, name: e.target.value})}
                placeholder="Active Sellers"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newAudience.description}
                onChange={(e) => setNewAudience({...newAudience, description: e.target.value})}
                placeholder="Description of this audience segment"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>User Type</Label>
                <Select 
                  value={newAudience.criteria.user_type} 
                  onValueChange={(value) => setNewAudience({
                    ...newAudience, 
                    criteria: {...newAudience.criteria, user_type: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="buyers">Buyers Only</SelectItem>
                    <SelectItem value="sellers">Sellers Only</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Select 
                  value={newAudience.criteria.location} 
                  onValueChange={(value) => setNewAudience({
                    ...newAudience, 
                    criteria: {...newAudience.criteria, location: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Location</SelectItem>
                    <SelectItem value="Gauteng">Gauteng</SelectItem>
                    <SelectItem value="Western Cape">Western Cape</SelectItem>
                    <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAudience(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAudience} 
              disabled={loading || !newAudience.name}
            >
              {loading ? 'Creating...' : 'Create Audience'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}