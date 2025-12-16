import { baseApi } from './baseApi';

export const suggestionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSuggestion: builder.mutation({
      query: (data) => ({
        url: '/suggestions',
        method: 'POST',
        body: data,
      }),
    }),

    getAdminSuggestions: builder.query({
      query: (params = {}) => ({
        url: '/admin/suggestions',
        params,
      }),
    }),

    updateSuggestion: builder.mutation({
      query: ({ suggestionId, ...data }) => ({
        url: `/admin/suggestions/${suggestionId}`,
        method: 'PUT',
        body: data,
      }),
    }),

    voteOnSuggestion: builder.mutation({
      query: ({ suggestionId, ...data }) => ({
        url: `/admin/suggestions/${suggestionId}/vote`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateSuggestionMutation,
  useGetAdminSuggestionsQuery,
  useLazyGetAdminSuggestionsQuery,
  useUpdateSuggestionMutation,
  useVoteOnSuggestionMutation,
} = suggestionsApi;


