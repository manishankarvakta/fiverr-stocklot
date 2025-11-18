import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { NotificationService, handleAPIError } from '../../services/api';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);

  // Simple way to check if user is logged in
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up intelligent polling - only when component is visible and not too frequently
      const interval = setInterval(() => {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetch;
        
        // Only fetch if:
        // 1. More than 30 seconds since last fetch
        // 2. Page is visible (not in background)
        // 3. User is still logged in
        if (timeSinceLastFetch > 30000 && !document.hidden && localStorage.getItem('token')) {
          fetchNotifications();
        }
      }, 30000); // Check every 30 seconds, but with conditions

      // Clean up on unmount
      return () => clearInterval(interval);
    }
  }, [user, lastFetch]);

  // Listen for page visibility changes to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Page became visible, check for new notifications
        const now = Date.now();
        if (now - lastFetch > 10000) { // Only if it's been 10+ seconds
          fetchNotifications();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, lastFetch]);

  const fetchNotifications = async () => {
    // Prevent excessive calls
    const now = Date.now();
    if (now - lastFetch < 5000) { // Don't allow calls more frequent than 5 seconds
      return;
    }

    setLoading(true);
    setLastFetch(now);
    
    try {
      const notificationData = await NotificationService.getNotifications(20);
      setNotifications(notificationData.notifications || []);
      setUnreadCount(notificationData.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      handleAPIError(error, false);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead([notificationId]);
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      handleAPIError(error, false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      handleAPIError(error, false);
    }
  };

  // Refresh notifications when popup opens (but respect rate limiting)
  const handlePopoverOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && user) {
      const now = Date.now();
      if (now - lastFetch > 10000) { // Only if it's been 10+ seconds
        fetchNotifications();
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={handlePopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                  !notification.read_at ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => {
                  if (!notification.read_at) {
                    markAsRead(notification.id);
                  }
                  if (notification.action_url) {
                    window.location.href = notification.action_url;
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h5 className="font-medium text-sm line-clamp-2">
                      {notification.title}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.created_at)}
                    </span>
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;