import { baseApi } from './baseApi';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    trackEvent: builder.mutation({
      query: (data) => ({
        url: '/analytics/track',
        method: 'POST',
        body: data,
      }),
    }),

    trackABTestEvent: builder.mutation({
      query: (data) => ({
        url: '/ab-test/track-event',
        method: 'POST',
        body: data,
      }),
    }),

    getMarketAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/analytics/market',
        params,
      }),
    }),

    getSellerAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics',
        params,
      }),
    }),

    getAdminSellerAnalytics: builder.query({
      query: (sellerId) => `/admin/analytics/seller/${sellerId}`,
    }),

    getAdminDailyAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/admin/analytics/daily',
        params,
      }),
    }),

    getPDPAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/admin/analytics/pdp',
        params,
      }),
    }),

    getABTestConfig: builder.query({
      query: (listingId) => `/ab-test/pdp-config/${listingId}`,
    }),

    getABTests: builder.query({
      query: (params = {}) => ({
        url: '/admin/ab-tests',
        params,
      }),
    }),

    createABTest: builder.mutation({
      query: (data) => ({
        url: '/admin/ab-tests',
        method: 'POST',
        body: data,
      }),
    }),

    getABTestResults: builder.query({
      query: (experimentId) => `/admin/ab-tests/${experimentId}/results`,
    }),

    getTradingStatementSeller: builder.query({
      query: ({ year, month }) => `/trading-statements/seller/${year}/${month}`,
    }),

    getTradingStatementBuyer: builder.query({
      query: ({ year, month }) => `/trading-statements/buyer/${year}/${month}`,
    }),

    getTradingStatementPeriods: builder.query({
      query: () => '/trading-statements/periods',
    }),
  }),
  overrideExisting: false,
});

export const {
  useTrackEventMutation,
  useTrackABTestEventMutation,
  useGetMarketAnalyticsQuery,
  useLazyGetMarketAnalyticsQuery,
  useGetSellerAnalyticsQuery,
  useLazyGetSellerAnalyticsQuery,
  useGetAdminSellerAnalyticsQuery,
  useLazyGetAdminSellerAnalyticsQuery,
  useGetAdminDailyAnalyticsQuery,
  useLazyGetAdminDailyAnalyticsQuery,
  useGetPDPAnalyticsQuery,
  useLazyGetPDPAnalyticsQuery,
  useGetABTestConfigQuery,
  useLazyGetABTestConfigQuery,
  useGetABTestsQuery,
  useLazyGetABTestsQuery,
  useCreateABTestMutation,
  useGetABTestResultsQuery,
  useLazyGetABTestResultsQuery,
  useGetTradingStatementSellerQuery,
  useLazyGetTradingStatementSellerQuery,
  useGetTradingStatementBuyerQuery,
  useLazyGetTradingStatementBuyerQuery,
  useGetTradingStatementPeriodsQuery,
  useLazyGetTradingStatementPeriodsQuery,
} = analyticsApi;

