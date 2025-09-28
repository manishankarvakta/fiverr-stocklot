import React, { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PreEscrowSafetyBanner } from './PreEscrowSafetyBanner';
import { Send, Paperclip, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const fetcher = async (url) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  
  return response.json();
};

export function MessagePane({ conversationId }) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { data: conversation } = useSWR(
    conversationId ? `${BACKEND_URL}/api/inbox/conversations/${conversationId}` : null,
    fetcher
  );
  
  const { data: messages, mutate: mutateMessages } = useSWR(
    conversationId ? `${BACKEND_URL}/api/inbox/conversations/${conversationId}/messages?page=1` : null,
    fetcher
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up SSE for real-time message updates
  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`${BACKEND_URL}/api/inbox/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    eventSource.addEventListener('message:new', (event) => {
      const data = JSON.parse(event.data);
      if (data.conversation_id === conversationId) {
        mutateMessages();
      }
    });

    return () => {
      eventSource.close();
    };
  }, [conversationId, mutateMessages]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId) {
      const markAsRead = async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${BACKEND_URL}/api/inbox/conversations/${conversationId}/read`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      };

      markAsRead();
    }
  }, [conversationId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/inbox/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: messageText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setMessageText('');
      mutateMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">Select a conversation</div>
          <div className="text-sm">Choose a conversation from the list to start messaging</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">
              {conversation?.subject || 'Conversation'}
            </div>
            {conversation?.linked && (
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {conversation.linked.kind}
                </Badge>
                {conversation.linked.code && (
                  <span className="text-sm text-gray-600">
                    #{conversation.linked.code}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Conversation type badge */}
          <Badge className="bg-emerald-100 text-emerald-800">
            {conversation?.type || 'DIRECT'}
          </Badge>
        </div>

        {/* Pre-escrow safety banner */}
        {conversation?.type === 'ORDER' && (
          <div className="mt-3">
            <PreEscrowSafetyBanner />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!messages ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">No messages yet</div>
            <div className="text-sm">Start the conversation by sending a message below</div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.isMine ? 'order-2' : 'order-1'}`}>
                {/* System message rendering */}
                {message.system_type ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-sm text-blue-800">
                      {message.body}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      System message
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.isMine
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    {/* Redaction notice */}
                    {message.visibility === 'REDACTED' && (
                      <div className="flex items-center space-x-1 mb-2 opacity-75">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">
                          Some content was redacted for safety
                        </span>
                      </div>
                    )}

                    {/* Message body */}
                    <div className="whitespace-pre-wrap text-sm">
                      {message.body}
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs">
                            <Paperclip className="h-3 w-3" />
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="underline hover:no-underline"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message timestamp */}
                <div className={`text-xs text-gray-500 mt-1 ${message.isMine ? 'text-right' : 'text-left'}`}>
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </div>
              </div>

              {/* Avatar for other users */}
              {!message.isMine && !message.system_type && (
                <div className="order-1 mr-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      U
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message composer */}
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
        <div className="flex space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button 
            type="submit" 
            disabled={!messageText.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}