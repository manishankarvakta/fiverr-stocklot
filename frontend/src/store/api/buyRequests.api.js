import { baseApi } from './baseApi';

export const buyRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Buy Requests
    getBuyRequests: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getPublicBuyRequests: builder.query({
      query: (params = {}) => ({
        url: '/public/buy-requests',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getMyBuyRequests: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/my',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getMyRequests: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/my-requests',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getBuyRequestById: builder.query({
      query: (requestId) => `/buy-requests/${requestId}`,
      providesTags: (result, error, requestId) => [{ type: 'BuyRequest', id: requestId }],
    }),

    getPublicBuyRequestById: builder.query({
      query: (requestId) => `/public/buy-requests/${requestId}`,
      providesTags: (result, error, requestId) => [{ type: 'BuyRequest', id: requestId }],
    }),

    createBuyRequest: builder.mutation({
      query: (data) => ({
        url: '/buy-requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BuyRequest'],
    }),

    createBuyRequestEnhanced: builder.mutation({
      query: (data) => ({
        url: '/buy-requests/enhanced',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BuyRequest'],
    }),

    // Seller inbox
    getSellerInbox: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/seller-inbox',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getSellerRequestsInRange: builder.query({
      query: (params = {}) => ({
        url: '/seller/requests/in-range',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getSellerBuyRequestsInRange: builder.query({
      query: (params = {}) => ({
        url: '/seller/buy-requests/in-range',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    // Offers
    getMyOffers: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/my-offers',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getBuyerOffers: builder.query({
      query: (params = {}) => ({
        url: '/buyers/offers',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getSellerOffers: builder.query({
      query: (params = {}) => ({
        url: '/seller/offers',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getOffers: builder.query({
      query: ({ requestId, ...params }) => ({
        url: `/buy-requests/${requestId}/offers`,
        params,
      }),
      providesTags: (result, error, { requestId }) => [{ type: 'BuyRequest', id: requestId }],
    }),

    createOffer: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/buy-requests/${requestId}/offers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'BuyRequest', id: requestId }, 'BuyRequest'],
    }),

    createOfferEnhanced: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/buy-requests/${requestId}/offers/enhanced`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'BuyRequest', id: requestId }, 'BuyRequest'],
    }),

    updateOffer: builder.mutation({
      query: ({ buyRequestId, offerId, ...data }) => ({
        url: `/buy-requests/${buyRequestId}/offers/${offerId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { buyRequestId }) => [{ type: 'BuyRequest', id: buyRequestId }, 'BuyRequest'],
    }),

    acceptOffer: builder.mutation({
      query: ({ requestId, offerId }) => ({
        url: `/buy-requests/${requestId}/offers/${offerId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'BuyRequest', id: requestId }, 'BuyRequest'],
    }),

    declineOffer: builder.mutation({
      query: ({ requestId, offerId }) => ({
        url: `/buy-requests/${requestId}/offers/${offerId}/decline`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'BuyRequest', id: requestId }, 'BuyRequest'],
    }),

    // Price suggestions
    getPriceSuggestions: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/price-suggestions',
        params,
      }),
    }),

    // Auto description
    generateAutoDescription: builder.mutation({
      query: (data) => ({
        url: '/buy-requests/auto-description',
        method: 'POST',
        body: data,
      }),
    }),

    // Intelligent matching
    getIntelligentMatches: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/intelligent-matches',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),

    getSmartRequests: builder.query({
      query: (params = {}) => ({
        url: '/ml/matching/smart-requests',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBuyRequestsQuery,
  useLazyGetBuyRequestsQuery,
  useGetPublicBuyRequestsQuery,
  useLazyGetPublicBuyRequestsQuery,
  useGetMyBuyRequestsQuery,
  useLazyGetMyBuyRequestsQuery,
  useGetMyRequestsQuery,
  useLazyGetMyRequestsQuery,
  useGetBuyRequestByIdQuery,
  useLazyGetBuyRequestByIdQuery,
  useGetPublicBuyRequestByIdQuery,
  useLazyGetPublicBuyRequestByIdQuery,
  useCreateBuyRequestMutation,
  useCreateBuyRequestEnhancedMutation,
  useGetSellerInboxQuery,
  useLazyGetSellerInboxQuery,
  useGetSellerRequestsInRangeQuery,
  useLazyGetSellerRequestsInRangeQuery,
  useGetSellerBuyRequestsInRangeQuery,
  useLazyGetSellerBuyRequestsInRangeQuery,
  useGetMyOffersQuery,
  useLazyGetMyOffersQuery,
  useGetBuyerOffersQuery,
  useLazyGetBuyerOffersQuery,
  useGetSellerOffersQuery,
  useLazyGetSellerOffersQuery,
  useGetOffersQuery,
  useLazyGetOffersQuery,
  useCreateOfferMutation,
  useCreateOfferEnhancedMutation,
  useUpdateOfferMutation,
  useAcceptOfferMutation,
  useDeclineOfferMutation,
  useGetPriceSuggestionsQuery,
  useLazyGetPriceSuggestionsQuery,
  useGenerateAutoDescriptionMutation,
  useGetIntelligentMatchesQuery,
  useLazyGetIntelligentMatchesQuery,
  useGetSmartRequestsQuery,
  useLazyGetSmartRequestsQuery,
} = buyRequestsApi;

// Alias for backward compatibility
export const useSubmitOfferMutation = useCreateOfferMutation;
