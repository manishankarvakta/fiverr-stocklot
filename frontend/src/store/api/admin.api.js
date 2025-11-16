import { baseApi } from './baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // User Management
    getAllUsers: builder.query({
      query: (params = {}) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['Admin', 'User'],
    }),
    
    getUserDetails: builder.query({
      query: (userId) => `/admin/users/${userId}`,
      providesTags: (result, error, userId) => [
        { type: 'User', id: userId },
        'Admin',
      ],
    }),
    
    updateUserStatus: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'User',
        'Admin',
      ],
    }),
    
    suspendUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}/suspend`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'User',
        'Admin',
      ],
    }),
    
    banUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}/ban`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'User',
        'Admin',
      ],
    }),
    
    // Moderation
    getModerationStats: builder.query({
      query: () => '/admin/moderation/stats',
      providesTags: ['Admin'],
    }),
    
    getPendingModeration: builder.query({
      query: (params = {}) => ({
        url: '/admin/moderation/pending',
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    approveModerationItem: builder.mutation({
      query: (itemId) => ({
        url: `/admin/moderation/${itemId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Admin'],
    }),
    
    rejectModerationItem: builder.mutation({
      query: (itemId) => ({
        url: `/admin/moderation/${itemId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['Admin'],
    }),
    
    // KYC Management
    getKYCStats: builder.query({
      query: () => '/admin/kyc/stats',
      providesTags: ['Admin', 'KYC'],
    }),
    
    getPendingKYC: builder.query({
      query: (params = {}) => ({
        url: '/admin/kyc/pending',
        params,
      }),
      providesTags: ['Admin', 'KYC'],
    }),
    
    approveKYC: builder.mutation({
      query: (verificationId) => ({
        url: `/admin/kyc/${verificationId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Admin', 'KYC'],
    }),
    
    rejectKYC: builder.mutation({
      query: (verificationId) => ({
        url: `/admin/kyc/${verificationId}/reject`,
        method: 'POST',
      }),
      invalidatesTags: ['Admin', 'KYC'],
    }),
    
    // Reports & Analytics
    getRevenueReport: builder.query({
      query: (params = {}) => ({
        url: '/admin/reports/revenue',
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    exportAnalyticsData: builder.mutation({
      query: (data) => ({
        url: '/admin/reports/export',
        method: 'POST',
        body: data,
      }),
    }),
    
    get2FAStats: builder.query({
      query: () => '/admin/2fa/stats',
      providesTags: ['Admin'],
    }),
    
    getPasswordResetStats: builder.query({
      query: () => '/admin/password-reset/stats',
      providesTags: ['Admin'],
    }),
    
    // Analytics
    getPlatformOverview: builder.query({
      query: (params = {}) => ({
        url: '/analytics/platform-overview',
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    getSellerAnalytics: builder.query({
      query: ({ sellerId, ...params }) => ({
        url: `/analytics/seller/${sellerId}`,
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    getBuyerInsights: builder.query({
      query: ({ buyerId, ...params }) => ({
        url: `/analytics/buyer/${buyerId}`,
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    getMarketIntelligence: builder.query({
      query: (params = {}) => ({
        url: '/analytics/market-intelligence',
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    getRealTimeMetrics: builder.query({
      query: () => '/analytics/real-time',
      providesTags: ['Admin'],
    }),
    
    generateCustomReport: builder.mutation({
      query: (data) => ({
        url: '/analytics/custom-report',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllUsersQuery,
  useLazyGetAllUsersQuery,
  useGetUserDetailsQuery,
  useLazyGetUserDetailsQuery,
  useUpdateUserStatusMutation,
  useSuspendUserMutation,
  useBanUserMutation,
  useGetModerationStatsQuery,
  useLazyGetModerationStatsQuery,
  useGetPendingModerationQuery,
  useLazyGetPendingModerationQuery,
  useApproveModerationItemMutation,
  useRejectModerationItemMutation,
  useGetKYCStatsQuery,
  useLazyGetKYCStatsQuery,
  useGetPendingKYCQuery,
  useLazyGetPendingKYCQuery,
  useApproveKYCMutation,
  useRejectKYCMutation,
  useGetRevenueReportQuery,
  useLazyGetRevenueReportQuery,
  useExportAnalyticsDataMutation,
  useGet2FAStatsQuery,
  useLazyGet2FAStatsQuery,
  useGetPasswordResetStatsQuery,
  useLazyGetPasswordResetStatsQuery,
  useGetPlatformOverviewQuery,
  useLazyGetPlatformOverviewQuery,
  useGetSellerAnalyticsQuery,
  useLazyGetSellerAnalyticsQuery,
  useGetBuyerInsightsQuery,
  useLazyGetBuyerInsightsQuery,
  useGetMarketIntelligenceQuery,
  useLazyGetMarketIntelligenceQuery,
  useGetRealTimeMetricsQuery,
  useLazyGetRealTimeMetricsQuery,
  useGenerateCustomReportMutation,
} = adminApi;

