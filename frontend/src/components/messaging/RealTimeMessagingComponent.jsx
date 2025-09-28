// Real-Time Messaging Component
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, Image, Mic, Users, Phone, Video, MoreVertical, Search, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import io from 'socket.io-client';

const RealTimeMessagingComponent = ({ listingId, sellerId, conversationId: initialConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Initialize Socket.IO connection
  useEffect(() => {
    if (currentUser) {
      initializeSocket();
      loadConversations();
      loadMessageTemplates();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser]);

  // Handle initial conversation setup
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    } else if (listingId && sellerId) {
      createListingInquiry();
    }
  }, [initialConversationId, listingId, sellerId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    socketRef.current = io(API_BASE, {
      withCredentials: true,
      query: {
        userId: currentUser._id
      }
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to messaging service');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from messaging service');
    });

    socketRef.current.on('new_message', (data) => {
      handleNewMessage(data);
    });

    socketRef.current.on('conversation_created', (data) => {
      setConversations(prev => [data.conversation, ...prev]);
    });

    socketRef.current.on('typing_indicator', (data) => {
      handleTypingIndicator(data);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to messaging service",
        variant: "destructive"
      });
    });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messaging/conversations`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/messaging/conversations/${conversationId}/messages`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const createListingInquiry = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          participants: [sellerId],
          type: 'listing_inquiry',
          listing_id: listingId,
          metadata: {
            source: 'marketplace'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveConversation(data.conversation);
        loadConversation(data.conversation_id);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const loadMessageTemplates = async () => {
    try {
      const userType = currentUser?.roles?.includes('seller') ? 'seller' : 'buyer';
      const response = await fetch(`${API_BASE}/api/messaging/templates?user_type=${userType}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMessageTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const sendMessage = async (content, type = 'text', mediaId = null) => {
    if (!activeConversation || (!content.trim() && !mediaId)) return;

    try {
      const messageData = {
        content,
        type,
        media_id: mediaId
      };

      const response = await fetch(`${API_BASE}/api/messaging/conversations/${activeConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Stop typing indicator
        handleTypingChange(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleNewMessage = (data) => {
    if (data.conversation_id === activeConversation?._id) {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg._id === data.message._id)) {
          return prev;
        }
        return [...prev, data.message];
      });
    }

    // Update conversation list
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv._id === data.conversation_id) {
          return {
            ...conv,
            last_message: data.message,
            unread_count: conv._id === activeConversation?._id ? 0 : (conv.unread_count || 0) + 1
          };
        }
        return conv;
      });
      return updated;
    });
  };

  const handleTypingChange = (typing) => {
    if (!activeConversation) return;

    setIsTyping(typing);
    
    if (socketRef.current) {
      socketRef.current.emit('typing_indicator', {
        conversation_id: activeConversation._id,
        user_id: currentUser._id,
        is_typing: typing
      });
    }

    if (typing) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingChange(false);
      }, 3000);
    }
  };

  const handleTypingIndicator = (data) => {
    if (data.conversation_id === activeConversation?._id && data.user_id !== currentUser._id) {
      setTypingUsers(data.typing_users.filter(id => id !== currentUser._id));
    }
  };

  const handleFileUpload = async (file) => {
    if (!activeConversation) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', activeConversation._id);

      const response = await fetch(`${API_BASE}/api/messaging/upload-media`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Send message with media
        const messageType = file.type.startsWith('image/') ? 'image' : 'file';
        await sendMessage(file.name, messageType, data.media_id);
        
        toast({
          title: "File Uploaded",
          description: "File uploaded and sent successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTypingChange(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderMessage = (message) => {
    const isOwn = message.sender_id === currentUser._id;
    
    return (
      <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-emerald-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {message.type === 'text' && (
            <p className="text-sm">{message.content.text || message.content}</p>
          )}
          
          {message.type === 'image' && (
            <div className="space-y-2">
              <img 
                src={message.content.thumbnail_url || message.content.file_url} 
                alt="Shared image" 
                className="rounded max-w-full h-auto"
              />
              {message.content.caption && (
                <p className="text-sm">{message.content.caption}</p>
              )}
            </div>
          )}
          
          {message.type === 'template' && (
            <p className="text-sm">{message.content.filled_content}</p>
          )}
          
          <div className={`text-xs mt-1 ${isOwn ? 'text-emerald-100' : 'text-gray-500'}`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-96 bg-white border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Messages
            {!isConnected && (
              <Badge variant="outline" className="ml-2 text-xs">
                Offline
              </Badge>
            )}
          </h3>
        </div>
        
        <ScrollArea className="h-full">
          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                activeConversation?._id === conversation._id ? 'bg-emerald-50' : ''
              }`}
              onClick={() => loadConversation(conversation._id)}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={conversation.participant_details?.[0]?.profile_image} />
                  <AvatarFallback>
                    {conversation.participant_details?.[0]?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate">
                      {conversation.participant_details?.[0]?.first_name} {conversation.participant_details?.[0]?.last_name}
                    </h4>
                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  {conversation.last_message && (
                    <p className="text-xs text-gray-600 truncate">
                      {conversation.last_message.content?.text || conversation.last_message.content || 'Media'}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(conversation.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeConversation.participant_details?.[0]?.profile_image} />
                  <AvatarFallback>
                    {activeConversation.participant_details?.[0]?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {activeConversation.participant_details?.[0]?.first_name} {activeConversation.participant_details?.[0]?.last_name}
                  </h4>
                  {typingUsers.length > 0 && (
                    <p className="text-xs text-gray-500">typing...</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Templates */}
            {showTemplates && messageTemplates.length > 0 && (
              <div className="p-2 border-t bg-gray-50">
                <div className="flex flex-wrap gap-1">
                  {messageTemplates.slice(0, 4).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setNewMessage(template.content);
                        setShowTemplates(false);
                      }}
                    >
                      {template.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-gray-500"
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="text-gray-500"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="text-gray-500"
                >
                  <Image className="h-4 w-4" />
                </Button>
                
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                
                <Button
                  onClick={() => sendMessage(newMessage)}
                  disabled={!newMessage.trim() || uploadingMedia}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMessagingComponent;