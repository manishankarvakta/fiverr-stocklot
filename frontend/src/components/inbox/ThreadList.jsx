import React, { useEffect } from 'react';
import useSWR from 'swr';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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

export function ThreadList({ bucket, onSelect, selectedId }) {
  const { data: conversations, mutate } = useSWR(
    `${BACKEND_URL}/api/inbox?bucket=${bucket}&page=1`,
    fetcher
  );

  // Set up SSE for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`${BACKEND_URL}/api/inbox/events`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    eventSource.addEventListener('message:new', () => {
      mutate();
    });

    eventSource.addEventListener('conversation:created', () => {
      mutate();
    });

    eventSource.addEventListener('conversation:updated', () => {
      mutate();
    });

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  if (!conversations) {
    return (
      <div className="flex flex-col divide-y border-r h-full">
        <div className="p-4 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y border-r h-full overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No conversations found
        </div>
      ) : (
        conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`px-3 py-3 text-left hover:bg-gray-50 transition-colors ${
              selectedId === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-medium truncate text-sm">
                    {conversation.subject}
                  </div>
                  {conversation.linked && (
                    <Badge variant="outline" className="text-xs">
                      {conversation.linked.kind}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 truncate">
                  {conversation.last_message_preview || 'No messages yet'}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex -space-x-1">
                    {conversation.participants.slice(0, 3).map((participant, index) => (
                      <Avatar key={participant.id} className="w-5 h-5 border-2 border-white">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-xs">
                          {participant.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {conversation.participants.length > 3 && (
                      <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                        +{conversation.participants.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {conversation.last_message_at && 
                      formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Unread badge */}
            {conversation.unread_count > 0 && (
              <div className="flex justify-end mt-1">
                <Badge className="bg-blue-600 text-white text-xs">
                  {conversation.unread_count}
                </Badge>
              </div>
            )}
            
            {/* Status indicators */}
            <div className="flex items-center space-x-1 mt-1">
              {conversation.muted && (
                <Badge variant="outline" className="text-xs">
                  Muted
                </Badge>
              )}
              {conversation.archived && (
                <Badge variant="outline" className="text-xs">
                  Archived
                </Badge>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}