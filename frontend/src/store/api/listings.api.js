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
    // createListing: builder.mutation({
    //   query: (args) => {
    //     // Handle both direct data and object with data/headers
    //     const data = args?.data || args;
    //     const customHeaders = args?.headers || {};
        
    //     // Get organization context from headers or localStorage
    //     const orgContext = customHeaders['X-Org-Context'] || localStorage.getItem('currentContext') || 'user';
        
    //     // Build headers object (don't include Content-Type for FormData - browser sets it)
    //     const headers = {
    //       'X-Org-Context': orgContext,
    //       ...customHeaders
    //     };
        
    //     // Remove Content-Type if data is FormData (browser will set it with boundary)
    //     if (data instanceof FormData && headers['Content-Type']) {
    //       delete headers['Content-Type'];
    //     }
        
    //     return {
    //       url: '/listings',
    //       method: 'POST',
    //       body: data,
    //       credentials: 'include',
    //       headers
    //     };
    //   },
    //   invalidatesTags: ['Listing'],
    // }),

    createListing: builder.mutation({
      query: (args) => {
        const data = args?.data || args;
        // Only pass X-Org-Context; let baseApi's prepareHeaders inject Authorization
        const customHeaders = args?.headers || {};
        
        return {
          url: '/listings',
          method: 'POST',
          body: data,
          credentials: 'include',
          // Spread custom headers and let baseApi's prepareHeaders merge them properly
          headers: {
            'X-Org-Context': customHeaders['X-Org-Context'] || localStorage.getItem('currentContext') || 'user'
          }
        };
      },
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

