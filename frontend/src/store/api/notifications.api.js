import { baseApi } from './baseApi';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, notificationId) => [
        { type: 'Notification', id: notificationId },
        'Notification',
      ],
    }),
    
    getNotificationPreferences: builder.query({
      query: () => '/me/notifications',
      providesTags: ['Notification'],
    }),
    
    updateNotificationPreferences: builder.mutation({
      query: (data) => ({
        url: '/me/notifications',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),
    
    // Email Management
    getEmailPreferences: builder.query({
      query: () => '/email/preferences',
      providesTags: ['Notification'],
    }),
    
    updateEmailPreferences: builder.mutation({
      query: (data) => ({
        url: '/email/preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),
    
    getEmailTemplates: builder.query({
      query: () => '/email/templates',
      providesTags: ['Notification'],
    }),
    
    sendTestEmail: builder.mutation({
      query: (data) => ({
        url: '/email/test',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Wishlist
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
    
    getWishlist: builder.query({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
    
    updateWishlistItem: builder.mutation({
      query: ({ wishlistId, ...data }) => ({
        url: `/wishlist/${wishlistId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Wishlist'],
    }),
    
    checkWishlistStatus: builder.query({
      query: (itemId) => `/wishlist/check/${itemId}`,
      providesTags: ['Wishlist'],
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
      query: () => '/price-alerts',
      providesTags: ['PriceAlert'],
    }),
    
    updatePriceAlert: builder.mutation({
      query: ({ alertId, ...data }) => ({
        url: `/price-alerts/${alertId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { alertId }) => [
        { type: 'PriceAlert', id: alertId },
        'PriceAlert',
      ],
    }),
    
    deletePriceAlert: builder.mutation({
      query: (alertId) => ({
        url: `/price-alerts/${alertId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PriceAlert'],
    }),
    
    getPriceAlertStats: builder.query({
      query: () => '/price-alerts/stats',
      providesTags: ['PriceAlert'],
    }),

    getUnreadCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    markNotificationsRead: builder.mutation({
      query: (notificationIds) => ({
        url: '/notifications/mark-read',
        method: 'POST',
        body: notificationIds,
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    getAdminNotifications: builder.query({
      query: (params = {}) => ({
        url: '/admin/notifications',
        params,
      }),
      providesTags: ['Notification', 'Admin'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetNotificationPreferencesQuery,
  useLazyGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetEmailPreferencesQuery,
  useLazyGetEmailPreferencesQuery,
  useUpdateEmailPreferencesMutation,
  useGetEmailTemplatesQuery,
  useLazyGetEmailTemplatesQuery,
  useSendTestEmailMutation,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useGetWishlistQuery,
  useLazyGetWishlistQuery,
  useUpdateWishlistItemMutation,
  useCheckWishlistStatusQuery,
  useLazyCheckWishlistStatusQuery,
  useGetWishlistStatsQuery,
  useLazyGetWishlistStatsQuery,
  useCreatePriceAlertMutation,
  useGetPriceAlertsQuery,
  useLazyGetPriceAlertsQuery,
  useUpdatePriceAlertMutation,
  useDeletePriceAlertMutation,
  useGetPriceAlertStatsQuery,
  useLazyGetPriceAlertStatsQuery,
  useGetUnreadCountQuery,
  useLazyGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
  useMarkAllReadMutation,
  useGetAdminNotificationsQuery,
  useLazyGetAdminNotificationsQuery,
} = notificationsApi;

