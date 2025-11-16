import { baseApi } from './baseApi';

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Inbox System
    getInboxSummary: builder.query({
      query: () => '/inbox/summary',
      providesTags: ['Conversation'],
    }),
    
    getInboxConversations: builder.query({
      query: (params = {}) => ({
        url: '/inbox',
        params,
      }),
      providesTags: ['Conversation'],
    }),
    
    createInboxConversation: builder.mutation({
      query: (data) => ({
        url: '/inbox/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),
    
    getInboxConversation: builder.query({
      query: (conversationId) => `/inbox/conversations/${conversationId}`,
      providesTags: (result, error, conversationId) => [
        { type: 'Conversation', id: conversationId },
      ],
    }),
    
    sendInboxMessage: builder.mutation({
      query: ({ conversationId, ...data }) => ({
        url: `/inbox/conversations/${conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        'Message',
      ],
    }),
    
    getInboxMessages: builder.query({
      query: ({ conversationId, ...params }) => ({
        url: `/inbox/conversations/${conversationId}/messages`,
        params,
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        'Message',
      ],
    }),
    
    // Messaging System
    createConversation: builder.mutation({
      query: (data) => ({
        url: '/messaging/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),
    
    getConversations: builder.query({
      query: (params = {}) => ({
        url: '/messaging/conversations',
        params,
      }),
      providesTags: ['Conversation'],
    }),
    
    sendMessage: builder.mutation({
      query: ({ conversationId, ...data }) => ({
        url: `/messaging/conversations/${conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        'Message',
      ],
    }),
    
    getMessages: builder.query({
      query: ({ conversationId, ...params }) => ({
        url: `/messaging/conversations/${conversationId}/messages`,
        params,
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        'Message',
      ],
    }),
    
    uploadMedia: builder.mutation({
      query: (formData) => ({
        url: '/messaging/upload-media',
        method: 'POST',
        body: formData,
      }),
    }),
    
    getMessageTemplates: builder.query({
      query: () => '/messaging/templates',
      providesTags: ['Message'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInboxSummaryQuery,
  useLazyGetInboxSummaryQuery,
  useGetInboxConversationsQuery,
  useLazyGetInboxConversationsQuery,
  useCreateInboxConversationMutation,
  useGetInboxConversationQuery,
  useLazyGetInboxConversationQuery,
  useSendInboxMessageMutation,
  useGetInboxMessagesQuery,
  useLazyGetInboxMessagesQuery,
  useCreateConversationMutation,
  useGetConversationsQuery,
  useLazyGetConversationsQuery,
  useSendMessageMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useUploadMediaMutation,
  useGetMessageTemplatesQuery,
  useLazyGetMessageTemplatesQuery,
} = messagingApi;

