import { baseApi } from './baseApi';

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    semanticSearch: builder.mutation({
      query: (data) => ({
        url: '/search/semantic',
        method: 'POST',
        body: data,
      }),
    }),
    
    visualSearch: builder.mutation({
      query: (formData) => ({
        url: '/search/visual',
        method: 'POST',
        body: formData,
      }),
    }),
    
    getAutocomplete: builder.query({
      query: (params = {}) => ({
        url: '/search/autocomplete',
        params,
      }),
    }),
    
    getIntelligentFilters: builder.mutation({
      query: (data) => ({
        url: '/search/intelligent-filters',
        method: 'POST',
        body: data,
      }),
    }),
    
    getPredictiveSearch: builder.query({
      query: (params = {}) => ({
        url: '/search/predictive',
        params,
      }),
    }),
    
    getSearchAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/search/analytics',
        params,
      }),
    }),
    
    // AI Services
    getListingSuggestions: builder.mutation({
      query: (data) => ({
        url: '/ai/listing-suggest',
        method: 'POST',
        body: data,
      }),
    }),
    
    submitAIFeedback: builder.mutation({
      query: (data) => ({
        url: '/ai/listing-feedback',
        method: 'POST',
        body: data,
      }),
    }),
    
    getUserAISuggestions: builder.query({
      query: (userId) => `/ai/listing-suggestions/${userId}`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useSemanticSearchMutation,
  useVisualSearchMutation,
  useGetAutocompleteQuery,
  useLazyGetAutocompleteQuery,
  useGetIntelligentFiltersMutation,
  useGetPredictiveSearchQuery,
  useLazyGetPredictiveSearchQuery,
  useGetSearchAnalyticsQuery,
  useLazyGetSearchAnalyticsQuery,
  useGetListingSuggestionsMutation,
  useSubmitAIFeedbackMutation,
  useGetUserAISuggestionsQuery,
  useLazyGetUserAISuggestionsQuery,
} = searchApi;

