import { baseApi } from './baseApi';

export const mlApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // FAQ & Chat
    faqChat: builder.mutation({
      query: (data) => ({
        url: '/faq/chat',
        method: 'POST',
        body: data,
      }),
    }),

    chatbotLearnWebsite: builder.mutation({
      query: (data) => ({
        url: '/chatbot/learn/website',
        method: 'POST',
        body: data,
      }),
    }),

    chatbotLearnBlog: builder.mutation({
      query: (data) => ({
        url: '/chatbot/learn/blog',
        method: 'POST',
        body: data,
      }),
    }),

    getChatbotLearningStatus: builder.query({
      query: () => '/chatbot/learning-status',
    }),

    // ML FAQ
    ingestFAQ: builder.mutation({
      query: (data) => ({
        url: '/ml/faq/ingest',
        method: 'POST',
        body: data,
      }),
    }),

    clusterFAQ: builder.mutation({
      query: ({ ingestionId, ...data }) => ({
        url: `/ml/faq/cluster/${ingestionId}`,
        method: 'POST',
        body: data,
      }),
    }),

    generateFAQAnswers: builder.mutation({
      query: ({ clusteringId, ...data }) => ({
        url: `/ml/faq/generate-answers/${clusteringId}`,
        method: 'POST',
        body: data,
      }),
    }),

    searchFAQ: builder.query({
      query: (params = {}) => ({
        url: '/faq/search',
        params,
      }),
    }),

    submitFAQFeedback: builder.mutation({
      query: ({ faqId, ...data }) => ({
        url: `/faq/${faqId}/feedback`,
        method: 'POST',
        body: data,
      }),
    }),

    // Knowledge Base
    scrapeKnowledge: builder.mutation({
      query: (data) => ({
        url: '/ml/knowledge/scrape',
        method: 'POST',
        body: data,
      }),
    }),

    learnFromInteractions: builder.mutation({
      query: (data) => ({
        url: '/ml/knowledge/learn-from-interactions',
        method: 'POST',
        body: data,
      }),
    }),

    getKnowledgeInsights: builder.query({
      query: (params = {}) => ({
        url: '/ml/knowledge/insights',
        params,
      }),
    }),

    // Matching
    recordMatchingInteraction: builder.mutation({
      query: (data) => ({
        url: '/ml/matching/record-interaction',
        method: 'POST',
        body: data,
      }),
    }),

    trainMatching: builder.mutation({
      query: (data) => ({
        url: '/ml/matching/train',
        method: 'POST',
        body: data,
      }),
    }),

    getMatchingPerformance: builder.query({
      query: (params = {}) => ({
        url: '/ml/matching/performance',
        params,
      }),
    }),

    // ML Engine
    smartPricing: builder.mutation({
      query: (data) => ({
        url: '/ml/engine/smart-pricing',
        method: 'POST',
        body: data,
      }),
    }),

    demandForecast: builder.mutation({
      query: (data) => ({
        url: '/ml/engine/demand-forecast',
        method: 'POST',
        body: data,
      }),
    }),

    marketIntelligence: builder.mutation({
      query: (data) => ({
        url: '/ml/engine/market-intelligence',
        method: 'POST',
        body: data,
      }),
    }),

    contentOptimization: builder.mutation({
      query: (data) => ({
        url: '/ml/engine/content-optimization',
        method: 'POST',
        body: data,
      }),
    }),

    // Photo Analysis
    analyzePhoto: builder.mutation({
      query: (formData) => ({
        url: '/ml/photo/analyze',
        method: 'POST',
        body: formData,
      }),
    }),

    bulkAnalyzePhotos: builder.mutation({
      query: (formData) => ({
        url: '/ml/photo/bulk-analyze',
        method: 'POST',
        body: formData,
      }),
    }),

    // Smart Search
    smartSearch: builder.mutation({
      query: (data) => ({
        url: '/search/smart',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFaqChatMutation,
  useChatbotLearnWebsiteMutation,
  useChatbotLearnBlogMutation,
  useGetChatbotLearningStatusQuery,
  useLazyGetChatbotLearningStatusQuery,
  useIngestFAQMutation,
  useClusterFAQMutation,
  useGenerateFAQAnswersMutation,
  useSearchFAQQuery,
  useLazySearchFAQQuery,
  useSubmitFAQFeedbackMutation,
  useScrapeKnowledgeMutation,
  useLearnFromInteractionsMutation,
  useGetKnowledgeInsightsQuery,
  useLazyGetKnowledgeInsightsQuery,
  useRecordMatchingInteractionMutation,
  useTrainMatchingMutation,
  useGetMatchingPerformanceQuery,
  useLazyGetMatchingPerformanceQuery,
  useSmartPricingMutation,
  useDemandForecastMutation,
  useMarketIntelligenceMutation,
  useContentOptimizationMutation,
  useAnalyzePhotoMutation,
  useBulkAnalyzePhotosMutation,
  useSmartSearchMutation,
} = mlApi;


