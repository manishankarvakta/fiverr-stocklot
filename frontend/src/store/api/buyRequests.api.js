import { baseApi } from './baseApi';

export const buyRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public endpoints
    getPublicBuyRequests: builder.query({
      query: (params = {}) => ({
        url: '/public/buy-requests',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),
    
    // Buyer endpoints
    createBuyRequest: builder.mutation({
      query: (data) => ({
        url: '/buy-requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BuyRequest'],
    }),
    
    getMyBuyRequests: builder.query({
      query: (params = {}) => ({
        url: '/buy-requests/my',
        params,
      }),
      providesTags: ['BuyRequest'],
    }),
    
    updateBuyRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/buy-requests/${requestId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { requestId }) => [
        { type: 'BuyRequest', id: requestId },
        'BuyRequest',
      ],
    }),
    
    deleteBuyRequest: builder.mutation({
      query: (requestId) => ({
        url: `/buy-requests/${requestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuyRequest'],
    }),
    
    // Offers
    submitOffer: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/buy-requests/${requestId}/offers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { requestId }) => [
        { type: 'BuyRequest', id: requestId },
        'BuyRequest',
      ],
    }),
    
    getOffers: builder.query({
      query: (requestId) => `/buy-requests/${requestId}/offers`,
      providesTags: (result, error, requestId) => [
        { type: 'BuyRequest', id: requestId },
      ],
    }),
    
    acceptOffer: builder.mutation({
      query: (offerId) => ({
        url: `/offers/${offerId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: ['BuyRequest', 'Order'],
    }),
    
    rejectOffer: builder.mutation({
      query: (offerId) => ({
        url: `/offers/${offerId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, offerId) => ['BuyRequest'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicBuyRequestsQuery,
  useLazyGetPublicBuyRequestsQuery,
  useCreateBuyRequestMutation,
  useGetMyBuyRequestsQuery,
  useLazyGetMyBuyRequestsQuery,
  useUpdateBuyRequestMutation,
  useDeleteBuyRequestMutation,
  useSubmitOfferMutation,
  useGetOffersQuery,
  useLazyGetOffersQuery,
  useAcceptOfferMutation,
  useRejectOfferMutation,
} = buyRequestsApi;

