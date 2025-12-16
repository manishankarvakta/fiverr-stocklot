import React, { useState, useEffect } from 'react';
import { ThreadList } from '../components/inbox/ThreadList';
import { MessagePane } from '../components/inbox/MessagePane';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useGetInboxSummaryQuery } from '@/store/api/messaging.api';
import { useSearchParams } from 'react-router-dom';

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

export default function InboxPage() {
  const [selectedBucket, setSelectedBucket] = useState('ALL');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchParams] = useSearchParams();

  // Handle direct navigation to specific conversation
  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [searchParams]);

  // Get inbox summary for unread counts using RTK Query
  const { data: summaryData } = useGetInboxSummaryQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });
  
  const summary = summaryData || {};

  const buckets = [
    { id: 'ALL', label: 'All', count: summary?.total_unread || 0 },
    { id: 'ORDERS', label: 'Orders', count: summary?.orders_unread || 0 },
    { id: 'OFFERS', label: 'Offers', count: summary?.offers_unread || 0 },
    { id: 'REQUESTS', label: 'Buy Requests', count: summary?.requests_unread || 0 },
    { id: 'LOGISTICS', label: 'Logistics', count: summary?.logistics_unread || 0 },
    { id: 'SYSTEM', label: 'System', count: summary?.system_unread || 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage all your conversations in one place
              </p>
            </div>
            
            {summary && summary.total_unread > 0 && (
              <Badge className="bg-blue-600 text-white">
                {summary.total_unread} unread
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-12rem)]">
          <div className="flex h-full">
            {/* Left sidebar with bucket tabs and thread list */}
            <div className="w-1/3 border-r flex flex-col">
              {/* Bucket tabs */}
              <div className="p-4 border-b bg-gray-50">
                <Tabs value={selectedBucket} onValueChange={setSelectedBucket}>
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                    {buckets.map((bucket) => (
                      <TabsTrigger 
                        key={bucket.id} 
                        value={bucket.id}
                        className="text-xs relative"
                      >
                        {bucket.label}
                        {bucket.count > 0 && (
                          <Badge 
                            className="ml-1 bg-blue-600 text-white text-xs px-1 py-0 min-w-[1rem] h-4"
                          >
                            {bucket.count}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-hidden">
                <ThreadList
                  bucket={selectedBucket}
                  onSelect={setSelectedConversationId}
                  selectedId={selectedConversationId}
                />
              </div>
            </div>

            {/* Right side - Message pane */}
            <div className="flex-1 flex flex-col">
              <MessagePane conversationId={selectedConversationId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}