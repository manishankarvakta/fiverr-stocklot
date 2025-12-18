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
    
    // Admin Stats
    adminStats: builder.query({
      query: (params = {}) => ({
        url: '/admin/stats',
        params,
      }),
      providesTags: ['Admin'],
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
    
    // Analytics tracking
    trackAnalytics: builder.mutation({
      query: (data) => ({
        url: '/analytics/track',
        method: 'POST',
        body: data,
      }),
    }),
    
    // AB Testing
    getABTestConfig: builder.query({
      query: (listingId) => `/ab-test/pdp-config/${listingId}`,
    }),
    
    trackABEvent: builder.mutation({
      query: (data) => ({
        url: '/ab-test/track-event',
        method: 'POST',
        body: data,
      }),
    }),

    // Listings Management
    getPendingListings: builder.query({
      query: (params = {}) => ({
        url: '/admin/listings/pending',
        params,
      }),
      providesTags: ['Admin', 'Listing'],
    }),

    approveListing: builder.mutation({
      query: ({ listingId, ...data }) => ({
        url: `/admin/listings/${listingId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Listing'],
    }),

    rejectListing: builder.mutation({
      query: ({ listingId, ...data }) => ({
        url: `/admin/listings/${listingId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Listing'],
    }),

    getAdminListings: builder.query({
      query: (params = {}) => ({
        url: '/admin/listings',
        params,
      }),
      providesTags: ['Admin', 'Listing'],
    }),

    // Orders Management
    getAdminOrders: builder.query({
      query: (params = {}) => ({
        url: '/admin/orders',
        params,
      }),
      providesTags: ['Admin', 'Order'],
    }),

    releaseEscrow: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/admin/orders/${orderId}/escrow/release`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Order'],
    }),

    refundEscrow: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/admin/orders/${orderId}/escrow/refund`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Order'],
    }),

    // Buy Requests Management
    getAdminBuyRequests: builder.query({
      query: (params = {}) => ({
        url: '/admin/buy-requests',
        params,
      }),
      providesTags: ['Admin', 'BuyRequest'],
    }),

    getAdminBuyRequestsModeration: builder.query({
      query: (params = {}) => ({
        url: '/admin/buy-requests/moderation',
        params,
      }),
      providesTags: ['Admin', 'BuyRequest'],
    }),

    moderateBuyRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/admin/buy-requests/${requestId}/moderate`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'BuyRequest'],
    }),

    approveBuyRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/admin/buy-requests/${requestId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'BuyRequest'],
    }),

    rejectBuyRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/admin/buy-requests/${requestId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'BuyRequest'],
    }),

    closeBuyRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/admin/buy-requests/${requestId}/close`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'BuyRequest'],
    }),

    // Documents Management
    verifyDocument: builder.mutation({
      query: ({ docId, ...data }) => ({
        url: `/admin/docs/${docId}/verify`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    rejectDocument: builder.mutation({
      query: ({ docId, ...data }) => ({
        url: `/admin/docs/${docId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    getAdminDocuments: builder.query({
      query: (params = {}) => ({
        url: '/admin/documents',
        params,
      }),
      providesTags: ['Admin'],
    }),

    // Organizations Management
    getAdminOrganizations: builder.query({
      query: (params = {}) => ({
        url: '/admin/organizations',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminOrganization: builder.query({
      query: (orgId) => `/admin/organizations/${orgId}`,
      providesTags: (result, error, orgId) => [{ type: 'Admin', id: orgId }],
    }),

    verifyOrganizationKYC: builder.mutation({
      query: ({ orgId, ...data }) => ({
        url: `/admin/organizations/${orgId}/verify-kyc`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    suspendOrganization: builder.mutation({
      query: ({ orgId, ...data }) => ({
        url: `/admin/organizations/${orgId}/suspend`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    // Roles Management
    getAdminRoles: builder.query({
      query: () => '/admin/roles',
      providesTags: ['Admin'],
    }),

    createAdminRole: builder.mutation({
      query: (data) => ({
        url: '/admin/roles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    updateAdminRole: builder.mutation({
      query: ({ roleId, ...data }) => ({
        url: `/admin/roles/${roleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    deleteAdminRole: builder.mutation({
      query: (roleId) => ({
        url: `/admin/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Admin'],
    }),

    getRoleRequests: builder.query({
      query: (params = {}) => ({
        url: '/admin/roles/requests',
        params,
      }),
      providesTags: ['Admin'],
    }),

    approveRoleRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/admin/roles/requests/${requestId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    rejectRoleRequest: builder.mutation({
      query: ({ requestId, ...data }) => ({
        url: `/admin/roles/requests/${requestId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    getAdminPermissions: builder.query({
      query: () => '/admin/permissions',
      providesTags: ['Admin'],
    }),

    getAdminUsers: builder.query({
      query: (params = {}) => ({
        url: '/admin/admin-users',
        params,
      }),
      providesTags: ['Admin'],
    }),

    activateUser: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}/activate`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }, 'User', 'Admin'],
    }),

    // Messaging Ban
    banUserMessaging: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}/messaging-ban`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }, 'User', 'Admin'],
    }),

    getAdminMessagesThreads: builder.query({
      query: (params = {}) => ({
        url: '/admin/messages/threads',
        params,
      }),
      providesTags: ['Admin', 'Conversation'],
    }),

    getAdminMessagesModeration: builder.query({
      query: (params = {}) => ({
        url: '/admin/messages/moderation',
        params,
      }),
      providesTags: ['Admin', 'Conversation'],
    }),

    // Referrals Management
    getAdminReferrals: builder.query({
      query: (params = {}) => ({
        url: '/admin/referrals',
        params,
      }),
      providesTags: ['Admin', 'Referral'],
    }),

    approveReferralReward: builder.mutation({
      query: ({ rewardId, ...data }) => ({
        url: `/admin/referrals/${rewardId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Referral'],
    }),

    rejectReferralReward: builder.mutation({
      query: ({ rewardId, ...data }) => ({
        url: `/admin/referrals/${rewardId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Referral'],
    }),

    flagReferralFraud: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/admin/referrals/${userId}/flag-fraud`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Referral'],
    }),

    // Payments Management
    getAdminPaymentsTransactions: builder.query({
      query: (params = {}) => ({
        url: '/admin/payments/transactions',
        params,
      }),
      providesTags: ['Admin', 'Order'],
    }),

    getAdminPaymentsEscrows: builder.query({
      query: (params = {}) => ({
        url: '/admin/payments/escrows',
        params,
      }),
      providesTags: ['Admin', 'Order'],
    }),

    releaseAdminEscrow: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/admin/payments/escrow/${orderId}/release`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Order'],
    }),

    refundAdminEscrow: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/admin/payments/escrow/${orderId}/refund`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Order'],
    }),

    // Payouts Management
    getAdminPayouts: builder.query({
      query: (params = {}) => ({
        url: '/admin/payouts',
        params,
      }),
      providesTags: ['Admin', 'Order'],
    }),

    getAdminPayoutRequests: builder.query({
      query: (params = {}) => ({
        url: '/admin/payout-requests',
        params,
      }),
      providesTags: ['Admin', 'Order'],
    }),

    processPayout: builder.mutation({
      query: ({ payoutId, action, ...data }) => ({
        url: `/admin/payouts/${payoutId}/${action}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Order'],
    }),

    releasePaystackPayout: builder.mutation({
      query: ({ payoutId, ...data }) => ({
        url: `/admin/payouts/${payoutId}/release-paystack`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Order'],
    }),

    // Payment Methods Management
    getAdminPaymentMethods: builder.query({
      query: (params = {}) => ({
        url: '/admin/payment-methods',
        params,
      }),
      providesTags: ['Admin'],
    }),

    processPaymentMethod: builder.mutation({
      query: ({ methodId, action, ...data }) => ({
        url: `/admin/payment-methods/${methodId}/${action}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    // Webhooks Management
    getAdminWebhooks: builder.query({
      query: (params = {}) => ({
        url: '/admin/webhooks',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminWebhookLogs: builder.query({
      query: (params = {}) => ({
        url: '/admin/webhook-logs',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminWebhooksStats: builder.query({
      query: (params = {}) => ({
        url: '/admin/webhooks/stats',
        params,
      }),
      providesTags: ['Admin'],
    }),

    // Disease Zones Management
    getAdminDiseaseZones: builder.query({
      query: (params = {}) => ({
        url: '/admin/disease/zones',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminDiseaseChanges: builder.query({
      query: (params = {}) => ({
        url: '/admin/disease/changes',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminDiseaseChange: builder.query({
      query: (changeId) => `/admin/disease/changes/${changeId}`,
      providesTags: (result, error, changeId) => [{ type: 'Admin', id: changeId }],
    }),

    approveDiseaseChange: builder.mutation({
      query: ({ changeId, ...data }) => ({
        url: `/admin/disease/changes/${changeId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    rejectDiseaseChange: builder.mutation({
      query: ({ changeId, ...data }) => ({
        url: `/admin/disease/changes/${changeId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    getAdminMovementRestrictions: builder.query({
      query: (params = {}) => ({
        url: '/admin/movement-restrictions',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminTransporters: builder.query({
      query: (params = {}) => ({
        url: '/admin/transporters',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminAbattoirs: builder.query({
      query: (params = {}) => ({
        url: '/admin/abattoirs',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminAuctions: builder.query({
      query: (params = {}) => ({
        url: '/admin/auctions',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminAuctionBids: builder.query({
      query: (params = {}) => ({
        url: '/admin/auction-bids',
        params,
      }),
      providesTags: ['Admin'],
    }),

    // CMS Management
    getAdminCMSArticles: builder.query({
      query: (params = {}) => ({
        url: '/admin/cms/articles',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminCMSPages: builder.query({
      query: (params = {}) => ({
        url: '/admin/cms/pages',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminCMSMedia: builder.query({
      query: (params = {}) => ({
        url: '/admin/cms/media',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminCMSPosts: builder.query({
      query: (params = {}) => ({
        url: '/admin/cms/posts',
        params,
      }),
      providesTags: ['Admin'],
    }),

    createAdminCMSPost: builder.mutation({
      query: (data) => ({
        url: '/admin/cms/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    processCMSPost: builder.mutation({
      query: ({ postId, action, ...data }) => ({
        url: `/admin/cms/posts/${postId}/${action}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    // Compliance Management
    getAdminComplianceDocuments: builder.query({
      query: (params = {}) => ({
        url: '/admin/compliance/documents',
        params,
      }),
      providesTags: ['Admin'],
    }),

    processComplianceDocument: builder.mutation({
      query: ({ documentId, action, ...data }) => ({
        url: `/admin/compliance/documents/${documentId}/${action}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    downloadComplianceDocument: builder.query({
      query: (documentId) => `/admin/compliance/documents/${documentId}/download`,
    }),

    // Email Management
    getAdminEmailStats: builder.query({
      query: (params = {}) => ({
        url: '/admin/email-stats',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminEmailAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/admin/email-analytics',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminEmailSuppressions: builder.query({
      query: (params = {}) => ({
        url: '/admin/email-suppressions',
        params,
      }),
      providesTags: ['Admin'],
    }),

    reactivateEmailSuppression: builder.mutation({
      query: ({ email, ...data }) => ({
        url: `/admin/email-suppressions/${email}/reactivate`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),

    // Broadcast Campaigns
    getAdminBroadcastCampaigns: builder.query({
      query: (params = {}) => ({
        url: '/admin/broadcast-campaigns',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminMessageTemplates: builder.query({
      query: (params = {}) => ({
        url: '/admin/message-templates',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminBroadcastAudiences: builder.query({
      query: (params = {}) => ({
        url: '/admin/broadcast-audiences',
        params,
      }),
      providesTags: ['Admin'],
    }),

    // Influencers
    getAdminInfluencers: builder.query({
      query: (params = {}) => ({
        url: '/admin/influencers',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminInfluencerPayouts: builder.query({
      query: (params = {}) => ({
        url: '/admin/influencer-payouts',
        params,
      }),
      providesTags: ['Admin'],
    }),

    // Reviews Management
    getAdminReviews: builder.query({
      query: (params = {}) => ({
        url: '/admin/reviews',
        params,
      }),
      providesTags: ['Admin', 'Review'],
    }),

    approveReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url: `/admin/reviews/${reviewId}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Review'],
    }),

    rejectReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url: `/admin/reviews/${reviewId}/reject`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Review'],
    }),

    flagReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url: `/admin/reviews/${reviewId}/flag`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Review'],
    }),

    recomputeRatings: builder.mutation({
      query: (data) => ({
        url: '/admin/ratings/recompute',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin', 'Review'],
    }),

    // Events Management
    getAdminEventsStream: builder.query({
      query: (params = {}) => ({
        url: '/admin/events/stream',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminEventsRecent: builder.query({
      query: (params = {}) => ({
        url: '/admin/events/recent',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminEventsStats: builder.query({
      query: (params = {}) => ({
        url: '/admin/events/stats',
        params,
      }),
      providesTags: ['Admin'],
    }),

    emitAdminEvent: builder.mutation({
      query: (data) => ({
        url: '/admin/events/emit',
        method: 'POST',
        body: data,
      }),
    }),

    // Dashboard Stats
    getDashboardStats: builder.query({
      query: (params = {}) => ({
        url: '/dashboard/stats',
        params,
      }),
      providesTags: ['Admin'],
    }),

    getAdminDashboardStats: builder.query({
      query: (params = {}) => ({
        url: '/admin/dashboard/stats',
        params,
      }),
      providesTags: ['Admin'],
    }),

    // Moderation Recent
    getAdminModerationRecent: builder.query({
      query: (params = {}) => ({
        url: '/admin/moderation/recent',
        params,
      }),
      providesTags: ['Admin'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllUsersQuery,
  useAdminStatsQuery,
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
  useTrackAnalyticsMutation,
  useGetABTestConfigQuery,
  useLazyGetABTestConfigQuery,
  useTrackABEventMutation,
  useGetPendingListingsQuery,
  useLazyGetPendingListingsQuery,
  useApproveListingMutation,
  useRejectListingMutation,
  useGetAdminListingsQuery,
  useLazyGetAdminListingsQuery,
  useGetAdminOrdersQuery,
  useLazyGetAdminOrdersQuery,
  useReleaseEscrowMutation,
  useRefundEscrowMutation,
  useGetAdminBuyRequestsQuery,
  useLazyGetAdminBuyRequestsQuery,
  useGetAdminBuyRequestsModerationQuery,
  useLazyGetAdminBuyRequestsModerationQuery,
  useModerateBuyRequestMutation,
  useApproveBuyRequestMutation,
  useRejectBuyRequestMutation,
  useCloseBuyRequestMutation,
  useVerifyDocumentMutation,
  useRejectDocumentMutation,
  useGetAdminDocumentsQuery,
  useLazyGetAdminDocumentsQuery,
  useGetAdminOrganizationsQuery,
  useLazyGetAdminOrganizationsQuery,
  useGetAdminOrganizationQuery,
  useLazyGetAdminOrganizationQuery,
  useVerifyOrganizationKYCMutation,
  useSuspendOrganizationMutation,
  useGetAdminRolesQuery,
  useLazyGetAdminRolesQuery,
  useCreateAdminRoleMutation,
  useUpdateAdminRoleMutation,
  useDeleteAdminRoleMutation,
  useGetRoleRequestsQuery,
  useLazyGetRoleRequestsQuery,
  useApproveRoleRequestMutation,
  useRejectRoleRequestMutation,
  useGetAdminPermissionsQuery,
  useLazyGetAdminPermissionsQuery,
  useGetAdminUsersQuery,
  useLazyGetAdminUsersQuery,
  useActivateUserMutation,
  useBanUserMessagingMutation,
  useGetAdminMessagesThreadsQuery,
  useLazyGetAdminMessagesThreadsQuery,
  useGetAdminMessagesModerationQuery,
  useLazyGetAdminMessagesModerationQuery,
  useGetAdminReferralsQuery,
  useLazyGetAdminReferralsQuery,
  useApproveReferralRewardMutation,
  useRejectReferralRewardMutation,
  useFlagReferralFraudMutation,
  useGetAdminPaymentsTransactionsQuery,
  useLazyGetAdminPaymentsTransactionsQuery,
  useGetAdminPaymentsEscrowsQuery,
  useLazyGetAdminPaymentsEscrowsQuery,
  useReleaseAdminEscrowMutation,
  useRefundAdminEscrowMutation,
  useGetAdminPayoutsQuery,
  useLazyGetAdminPayoutsQuery,
  useGetAdminPayoutRequestsQuery,
  useLazyGetAdminPayoutRequestsQuery,
  useProcessPayoutMutation,
  useReleasePaystackPayoutMutation,
  useGetAdminPaymentMethodsQuery,
  useLazyGetAdminPaymentMethodsQuery,
  useProcessPaymentMethodMutation,
  useGetAdminWebhooksQuery,
  useLazyGetAdminWebhooksQuery,
  useGetAdminWebhookLogsQuery,
  useLazyGetAdminWebhookLogsQuery,
  useGetAdminWebhooksStatsQuery,
  useLazyGetAdminWebhooksStatsQuery,
  useGetAdminDiseaseZonesQuery,
  useLazyGetAdminDiseaseZonesQuery,
  useGetAdminDiseaseChangesQuery,
  useLazyGetAdminDiseaseChangesQuery,
  useGetAdminDiseaseChangeQuery,
  useLazyGetAdminDiseaseChangeQuery,
  useApproveDiseaseChangeMutation,
  useRejectDiseaseChangeMutation,
  useGetAdminMovementRestrictionsQuery,
  useLazyGetAdminMovementRestrictionsQuery,
  useGetAdminTransportersQuery,
  useLazyGetAdminTransportersQuery,
  useGetAdminAbattoirsQuery,
  useLazyGetAdminAbattoirsQuery,
  useGetAdminAuctionsQuery,
  useLazyGetAdminAuctionsQuery,
  useGetAdminAuctionBidsQuery,
  useLazyGetAdminAuctionBidsQuery,
  useGetAdminCMSArticlesQuery,
  useLazyGetAdminCMSArticlesQuery,
  useGetAdminCMSPagesQuery,
  useLazyGetAdminCMSPagesQuery,
  useGetAdminCMSMediaQuery,
  useLazyGetAdminCMSMediaQuery,
  useGetAdminCMSPostsQuery,
  useLazyGetAdminCMSPostsQuery,
  useCreateAdminCMSPostMutation,
  useProcessCMSPostMutation,
  useGetAdminComplianceDocumentsQuery,
  useLazyGetAdminComplianceDocumentsQuery,
  useProcessComplianceDocumentMutation,
  useDownloadComplianceDocumentQuery,
  useLazyDownloadComplianceDocumentQuery,
  useGetAdminEmailStatsQuery,
  useLazyGetAdminEmailStatsQuery,
  useGetAdminEmailAnalyticsQuery,
  useLazyGetAdminEmailAnalyticsQuery,
  useGetAdminEmailSuppressionsQuery,
  useLazyGetAdminEmailSuppressionsQuery,
  useReactivateEmailSuppressionMutation,
  useGetAdminBroadcastCampaignsQuery,
  useLazyGetAdminBroadcastCampaignsQuery,
  useGetAdminMessageTemplatesQuery,
  useLazyGetAdminMessageTemplatesQuery,
  useGetAdminBroadcastAudiencesQuery,
  useLazyGetAdminBroadcastAudiencesQuery,
  useGetAdminInfluencersQuery,
  useLazyGetAdminInfluencersQuery,
  useGetAdminInfluencerPayoutsQuery,
  useLazyGetAdminInfluencerPayoutsQuery,
  useGetAdminReviewsQuery,
  useLazyGetAdminReviewsQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
  useFlagReviewMutation,
  useRecomputeRatingsMutation,
  useGetAdminEventsStreamQuery,
  useLazyGetAdminEventsStreamQuery,
  useGetAdminEventsRecentQuery,
  useLazyGetAdminEventsRecentQuery,
  useGetAdminEventsStatsQuery,
  useLazyGetAdminEventsStatsQuery,
  useEmitAdminEventMutation,
  useGetDashboardStatsQuery,
  useLazyGetDashboardStatsQuery,
  useGetAdminDashboardStatsQuery,
  useLazyGetAdminDashboardStatsQuery,
  useGetAdminModerationRecentQuery,
  useLazyGetAdminModerationRecentQuery,
} = adminApi;

