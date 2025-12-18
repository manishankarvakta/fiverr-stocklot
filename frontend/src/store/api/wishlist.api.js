import { baseApi } from './baseApi';

export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: (params = {}) => ({
        url: '/wishlist',
        params,
      }),
      providesTags: ['Wishlist'],
    }),

    addToWishlist: builder.mutation({
      query: (data) => ({
        url: '/wishlist/add',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wishlist'],
    }),

    removeFromWishlist: builder.mutation({
      query: (itemId) => ({
        url: `/wishlist/remove/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),

    updateWishlist: builder.mutation({
      query: ({ wishlistId, ...data }) => ({
        url: `/wishlist/${wishlistId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Wishlist'],
    }),

    checkWishlistItem: builder.query({
      query: (itemId) => `/wishlist/check/${itemId}`,
      providesTags: (result, error, itemId) => [{ type: 'Wishlist', id: itemId }],
    }),

    getWishlistStats: builder.query({
      query: () => '/wishlist/stats',
      providesTags: ['Wishlist'],
    }),

    // Price Alerts
    createPriceAlert: builder.mutation({
      query: (data) => ({
        url: '/price-alerts/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PriceAlert'],
    }),

    getPriceAlerts: builder.query({
      query: (params = {}) => ({
        url: '/price-alerts',
        params,
      }),
      providesTags: ['PriceAlert'],
    }),

    updatePriceAlert: builder.mutation({
      query: ({ alertId, ...data }) => ({
        url: `/price-alerts/${alertId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PriceAlert'],
    }),

    deletePriceAlert: builder.mutation({
      query: (alertId) => ({
        url: `/price-alerts/${alertId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PriceAlert'],
    }),

    checkPriceAlerts: builder.mutation({
      query: (data) => ({
        url: '/price-alerts/check',
        method: 'POST',
        body: data,
      }),
    }),

    getPriceAlertStats: builder.query({
      query: () => '/price-alerts/stats',
      providesTags: ['PriceAlert'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWishlistQuery,
  useLazyGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useUpdateWishlistMutation,
  useCheckWishlistItemQuery,
  useLazyCheckWishlistItemQuery,
  useGetWishlistStatsQuery,
  useLazyGetWishlistStatsQuery,
  useCreatePriceAlertMutation,
  useGetPriceAlertsQuery,
  useLazyGetPriceAlertsQuery,
  useUpdatePriceAlertMutation,
  useDeletePriceAlertMutation,
  useCheckPriceAlertsMutation,
  useGetPriceAlertStatsQuery,
  useLazyGetPriceAlertStatsQuery,
} = wishlistApi;


