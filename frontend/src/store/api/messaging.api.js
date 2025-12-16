import { baseApi } from './baseApi';

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Inbox
    getInboxEvents: builder.query({
      query: () => '/inbox/events',
      providesTags: ['Conversation'],
    }),

    getInboxSummary: builder.query({
      query: () => '/inbox/summary',
      providesTags: ['Conversation'],
    }),

    getInbox: builder.query({
      query: (params = {}) => ({
        url: '/inbox',
        params,
      }),
      providesTags: ['Conversation'],
    }),

    createConversation: builder.mutation({
      query: (data) => ({
        url: '/inbox/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),

    getConversation: builder.query({
      query: (conversationId) => `/inbox/conversations/${conversationId}`,
      providesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }],
    }),

    getConversationMessages: builder.query({
      query: (conversationId) => `/inbox/conversations/${conversationId}/messages`,
      providesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }, 'Message'],
    }),

    sendMessage: builder.mutation({
      query: ({ conversationId, ...data }) => ({
        url: `/inbox/conversations/${conversationId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Conversation', id: conversationId }, 'Message'],
    }),

    markConversationRead: builder.mutation({
      query: (conversationId) => ({
        url: `/inbox/conversations/${conversationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, conversationId) => [{ type: 'Conversation', id: conversationId }],
    }),

    updateConversation: builder.mutation({
      query: ({ conversationId, ...data }) => ({
        url: `/inbox/conversations/${conversationId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [{ type: 'Conversation', id: conversationId }],
    }),

    // Messages
    getMessageThreads: builder.query({
      query: (params = {}) => ({
        url: '/messages/threads',
        params,
      }),
      providesTags: ['Conversation'],
    }),

    createMessageThread: builder.mutation({
      query: (data) => ({
        url: '/messages/threads',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),

    getThreadMessages: builder.query({
      query: (threadId) => `/messages/threads/${threadId}/messages`,
      providesTags: (result, error, threadId) => [{ type: 'Conversation', id: threadId }, 'Message'],
    }),

    sendThreadMessage: builder.mutation({
      query: ({ threadId, ...data }) => ({
        url: `/messages/threads/${threadId}/messages`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { threadId }) => [{ type: 'Conversation', id: threadId }, 'Message'],
    }),

    markThreadRead: builder.mutation({
      query: (threadId) => ({
        url: `/messages/threads/${threadId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, threadId) => [{ type: 'Conversation', id: threadId }],
    }),

    // Ask
    askQuestion: builder.mutation({
      query: (data) => ({
        url: '/inbox/ask',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInboxEventsQuery,
  useLazyGetInboxEventsQuery,
  useGetInboxSummaryQuery,
  useLazyGetInboxSummaryQuery,
  useGetInboxQuery,
  useLazyGetInboxQuery,
  useCreateConversationMutation,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useGetConversationMessagesQuery,
  useLazyGetConversationMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
  useUpdateConversationMutation,
  useGetMessageThreadsQuery,
  useLazyGetMessageThreadsQuery,
  useCreateMessageThreadMutation,
  useGetThreadMessagesQuery,
  useLazyGetThreadMessagesQuery,
  useSendThreadMessageMutation,
  useMarkThreadReadMutation,
  useAskQuestionMutation,
} = messagingApi;
