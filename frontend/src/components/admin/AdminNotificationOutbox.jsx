import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { toast } from '../ui/toast';
import { 
  Loader2, 
  Inbox, 
  RefreshCw, 
  Play, 
  RotateCcw,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';

const AdminNotificationOutbox = () => {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [retrying, setRetrying] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadItems();
    loadStats();
  }, [statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/outbox?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load outbox');
      
      const data = await response.json();
      setItems(data.rows || []);
    } catch (error) {
      console.error('Error loading outbox:', error);
      toast({
        title: "Error",
        description: "Failed to load notification outbox",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const runWorkerOnce = async () => {
    setRunning(true);
    try {
      const response = await fetch('/api/admin/outbox/run-once', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Worker execution failed');

      const result = await response.json();
      toast({
        title: "Worker Executed",
        description: `Processed ${result.processed || 0} notifications, ${result.errors || 0} errors`,
      });
      
      // Reload items and stats
      loadItems();
      loadStats();
    } catch (error) {
      console.error('Error running worker:', error);
      toast({
        title: "Error",
        description: "Failed to run notification worker",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const retryNotification = async (id) => {
    setRetrying(id);
    try {
      const response = await fetch(`/api/admin/outbox/${id}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Retry failed');

      toast({
        title: "Notification Retried",
        description: "Notification has been queued for retry",
      });
      
      // Reload items
      loadItems();
    } catch (error) {
      console.error('Error retrying notification:', error);
      toast({
        title: "Error",
        description: "Failed to retry notification",
        variant: "destructive",
      });
    } finally {
      setRetrying('');
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'INAPP':
        return <MessageSquare className="h-4 w-4" />;
      case 'PUSH':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Inbox className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status, attempts = 0) => {
    const maxAttempts = 5;
    
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending {attempts > 0 ? `(${attempts}/${maxAttempts})` : ''}
          </Badge>
        );
      case 'SENT':
        return (
          <Badge variant="success" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed ({attempts}/{maxAttempts})
          </Badge>
        );
      case 'SKIPPED':
        return (
          <Badge variant="outline">
            <Minus className="h-3 w-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTemplateDisplay = (templateKey) => {
    const labels = {
      'buy_request.posted': 'Buy Request Posted',
      'listing.posted': 'Listing Posted'
    };
    return labels[templateKey] || templateKey;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Notification Outbox</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending ({stats.pending || 0})</SelectItem>
              <SelectItem value="SENT">Sent ({stats.sent || 0})</SelectItem>
              <SelectItem value="FAILED">Failed ({stats.failed || 0})</SelectItem>
              <SelectItem value="SKIPPED">Skipped</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={runWorkerOnce} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Worker Once
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.pending || 0}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sent || 0}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed || 0}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Outbox Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter} Notifications ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Channel</th>
                  <th className="text-left p-3 font-medium">Template</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Scheduled</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-6 text-center" colSpan={7}>
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={7}>
                      No notifications found for status: {statusFilter}
                    </td>
                  </tr>
                ) : items.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-muted/50">
                    <td className="p-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {(item._id || '').slice(-8)}
                      </code>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(item.channel)}
                        <span className="font-medium">{item.channel}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {getTemplateDisplay(item.template_key)}
                      </span>
                    </td>
                    <td className="p-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {(item.user_id || '').slice(-8)}
                      </code>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(item.scheduled_at)}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(item.status, item.attempts)}
                    </td>
                    <td className="p-3">
                      {item.status === 'FAILED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryNotification(item._id)}
                          disabled={retrying === item._id}
                        >
                          {retrying === item._id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationOutbox;