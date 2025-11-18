import { baseApi } from './baseApi';

export const listingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public endpoints
    getListings: builder.query({
      query: (params = {}) => ({
        url: '/listings',
        params,
      }),
      providesTags: ['Listing'],
    }),
    
    getListingById: builder.query({
      query: (listingId) => `/listings/${listingId}`,
      providesTags: (result, error, listingId) => [{ type: 'Listing', id: listingId }],
    }),
    
    searchListings: builder.query({
      query: (params = {}) => ({
        url: '/listings/search',
        params,
      }),
      providesTags: ['Listing'],
    }),
    
    // Seller endpoints
    createListing: builder.mutation({
      query: (data) => ({
        url: '/listings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Listing'],
    }),
    
    updateListing: builder.mutation({
      query: ({ listingId, ...data }) => ({
        url: `/listings/${listingId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'Listing', id: listingId },
        'Listing',
      ],
    }),
    
    deleteListing: builder.mutation({
      query: (listingId) => ({
        url: `/listings/${listingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Listing'],
    }),
    
    getMyListings: builder.query({
      query: (params = {}) => ({
        url: '/listings/my',
        params,
      }),
      providesTags: ['Listing'],
    }),
    
    enhanceListing: builder.mutation({
      query: ({ listingId, ...data }) => ({
        url: `/listings/${listingId}/enhance`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'Listing', id: listingId },
        'Listing',
      ],
    }),
    
    // PDP endpoint
    getListingPDP: builder.query({
      query: (listingId) => `/listings/${listingId}/pdp`,
      providesTags: (result, error, listingId) => [{ type: 'Listing', id: listingId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetListingsQuery,
  useLazyGetListingsQuery,
  useGetListingByIdQuery,
  useLazyGetListingByIdQuery,
  useSearchListingsQuery,
  useLazySearchListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useGetMyListingsQuery,
  useLazyGetMyListingsQuery,
  useEnhanceListingMutation,
  useGetListingPDPQuery,
  useLazyGetListingPDPQuery,
} = listingsApi;

