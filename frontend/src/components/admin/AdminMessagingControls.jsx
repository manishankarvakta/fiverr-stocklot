import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription, Switch, Label
} from '../ui';
import { 
  MessageCircle, Search, Filter, Download, Eye, Ban, AlertTriangle, 
  CheckCircle, Flag, Shield, Settings
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminMessagingControls() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('flagged');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [messagingSettings, setMessagingSettings] = useState({
    prePaymentMessaging: false,
    autoModeration: true,
    contactRedaction: true
  });

  useEffect(() => {
    fetchMessages();
    fetchMessagingSettings();
  }, [filterType]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const endpoint = filterType === 'flagged' 
        ? `${API}/admin/messages/flagged`
        : `${API}/admin/messages/all`;
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagingSettings = async () => {
    try {
      const response = await fetch(`${API}/admin/messaging/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessagingSettings(data);
      }
    } catch (error) {
      console.error('Error fetching messaging settings:', error);
    }
  };

  const handleUserAction = async (userId, action) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/admin/users/${userId}/messaging/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: action === 'ban' ? 'Violation of messaging policy' : 'Policy compliance'
        })
      });
      
      if (response.ok) {
        fetchMessages();
        setShowDialog(false);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const updateMessagingSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API}/admin/messaging/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        setMessagingSettings(newSettings);
      }
    } catch (error) {
      console.error('Error updating messaging settings:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (!message) return false;
    
    const matchesSearch = !searchTerm || 
      message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getModerationBadge = (redacted, flagged) => {
    if (flagged) {
      return <Badge variant="destructive">Flagged</Badge>;
    }
    if (redacted) {
      return <Badge className="bg-amber-100 text-amber-800">Contact Redacted</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Clean</Badge>;
  };

  const getMessageStats = () => {
    return {
      total: messages.length,
      flagged: messages.filter(m => m.flagged).length,
      redacted: messages.filter(m => m.redacted).length,
      clean: messages.filter(m => !m.flagged && !m.redacted).length,
      bannedUsers: messages.filter(m => m.user_banned).length
    };
  };

  const stats = getMessageStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Messaging & Anti-Bypass Controls</h2>
          <p className="text-gray-600">
            {stats.total} messages reviewed • {stats.flagged} flagged for moderation
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchMessages}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Messaging Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Messaging Policy Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Pre-Payment Messaging</Label>
                <p className="text-xs text-gray-500">Allow messaging before payment</p>
              </div>
              <Switch
                checked={messagingSettings.prePaymentMessaging}
                onCheckedChange={(checked) => 
                  updateMessagingSettings({...messagingSettings, prePaymentMessaging: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto Moderation</Label>
                <p className="text-xs text-gray-500">Automatically detect violations</p>
              </div>
              <Switch
                checked={messagingSettings.autoModeration}
                onCheckedChange={(checked) => 
                  updateMessagingSettings({...messagingSettings, autoModeration: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Contact Redaction</Label>
                <p className="text-xs text-gray-500">Auto-hide phone/email/URLs</p>
              </div>
              <Switch
                checked={messagingSettings.contactRedaction}
                onCheckedChange={(checked) => 
                  updateMessagingSettings({...messagingSettings, contactRedaction: checked})
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Messages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
            <div className="text-sm text-gray-500">Flagged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.redacted}</div>
            <div className="text-sm text-gray-500">Contact Redacted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.clean}</div>
            <div className="text-sm text-gray-500">Clean</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.bannedUsers}</div>
            <div className="text-sm text-gray-500">Banned Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search messages by content or sender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter messages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flagged">Flagged Messages</SelectItem>
            <SelectItem value="redacted">Contact Redacted</SelectItem>
            <SelectItem value="all">All Messages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages ({filteredMessages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-500">No messages match your current filter criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message Content</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Thread</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="max-w-md">
                        <div className="text-sm line-clamp-2">
                          {message.content || message.body || 'No content'}
                        </div>
                        {message.redacted && (
                          <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Contact information removed
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {message.sender_email || 'Unknown sender'}
                        <div className="text-xs text-gray-500">
                          ID: {message.sender_id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getModerationBadge(message.redacted, message.flagged)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500 font-mono">
                        {message.thread_id?.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {message.created_at 
                          ? new Date(message.created_at).toLocaleDateString()
                          : 'Unknown'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMessage(message);
                            setShowDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                          onClick={() => handleUserAction(message.sender_id, 'warn')}
                          disabled={actionLoading}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUserAction(message.sender_id, 'ban')}
                          disabled={actionLoading}
                        >
                          <Ban className="h-4 w-4" />
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

      {/* Message Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Moderation</DialogTitle>
            <DialogDescription>
              Review message and take moderation action
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sender</label>
                  <p className="text-sm text-gray-900">{selectedMessage.sender_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getModerationBadge(selectedMessage.redacted, selectedMessage.flagged)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Thread ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedMessage.thread_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <p className="text-sm text-gray-900">
                    {selectedMessage.created_at 
                      ? new Date(selectedMessage.created_at).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Message Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-900">
                    {selectedMessage.content || selectedMessage.body || 'No content available'}
                  </p>
                </div>
              </div>

              {selectedMessage.redacted && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This message contained contact information (phone, email, or URL) that was automatically redacted.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedMessage && (
              <div className="flex gap-2">
                <Button
                  className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                  onClick={() => handleUserAction(selectedMessage.sender_id, 'warn')}
                  disabled={actionLoading}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Warn User
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUserAction(selectedMessage.sender_id, 'ban')}
                  disabled={actionLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}