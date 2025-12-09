import { baseApi } from './baseApi';

export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    calculateDelivery: builder.mutation({
      query: (data) => ({
        url: '/delivery/calculate',
        method: 'POST',
        body: data,
      }),
    }),

    getDeliveryQuote: builder.mutation({
      query: (data) => ({
        url: '/delivery/quote',
        method: 'POST',
        body: data,
      }),
    }),

    getDeliveryProvinces: builder.query({
      query: () => '/delivery/provinces',
    }),

    getDeliveryRate: builder.query({
      query: (params = {}) => ({
        url: '/seller/delivery-rate',
        params,
      }),
    }),

    updateDeliveryRate: builder.mutation({
      query: (data) => ({
        url: '/seller/delivery-rate',
        method: 'POST',
        body: data,
      }),
    }),

    // Mapping
    geocode: builder.mutation({
      query: (data) => ({
        url: '/mapping/geocode',
        method: 'POST',
        body: data,
      }),
    }),

    calculateDistance: builder.mutation({
      query: (data) => ({
        url: '/mapping/distance',
        method: 'POST',
        body: data,
      }),
    }),

    optimizeRoute: builder.mutation({
      query: (data) => ({
        url: '/mapping/route-optimization',
        method: 'POST',
        body: data,
      }),
    }),

    getNearbyRequests: builder.query({
      query: (params = {}) => ({
        url: '/mapping/nearby-requests',
        params,
      }),
    }),

    // AI Shipping
    getShippingRateSuggestions: builder.query({
      query: (params = {}) => ({
        url: '/ai/shipping/rate-suggestions',
        params,
      }),
    }),

    getShippingPerformanceAnalysis: builder.query({
      query: (params = {}) => ({
        url: '/ai/shipping/performance-analysis',
        params,
      }),
    }),

    getShippingDemandPrediction: builder.query({
      query: (params = {}) => ({
        url: '/ai/shipping/demand-prediction',
        params,
      }),
    }),

    // AI Payments
    getPaymentsAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/ai/payments/analytics',
        params,
      }),
    }),

    predictPaymentSuccess: builder.mutation({
      query: (data) => ({
        url: '/ai/payments/predict-success',
        method: 'POST',
        body: data,
      }),
    }),

    optimizeMobilePayments: builder.mutation({
      query: (data) => ({
        url: '/ai/payments/optimize-mobile',
        method: 'POST',
        body: data,
      }),
    }),

    configureDeepLink: builder.mutation({
      query: (data) => ({
        url: '/ai/payments/deep-link-config',
        method: 'POST',
        body: data,
      }),
    }),

    trackPaymentAnalytics: builder.mutation({
      query: (data) => ({
        url: '/ai/payments/track-analytics',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCalculateDeliveryMutation,
  useGetDeliveryQuoteMutation,
  useGetDeliveryProvincesQuery,
  useLazyGetDeliveryProvincesQuery,
  useGetDeliveryRateQuery,
  useLazyGetDeliveryRateQuery,
  useUpdateDeliveryRateMutation,
  useGeocodeMutation,
  useCalculateDistanceMutation,
  useOptimizeRouteMutation,
  useGetNearbyRequestsQuery,
  useLazyGetNearbyRequestsQuery,
  useGetShippingRateSuggestionsQuery,
  useLazyGetShippingRateSuggestionsQuery,
  useGetShippingPerformanceAnalysisQuery,
  useLazyGetShippingPerformanceAnalysisQuery,
  useGetShippingDemandPredictionQuery,
  useLazyGetShippingDemandPredictionQuery,
  useGetPaymentsAnalyticsQuery,
  useLazyGetPaymentsAnalyticsQuery,
  usePredictPaymentSuccessMutation,
  useOptimizeMobilePaymentsMutation,
  useConfigureDeepLinkMutation,
  useTrackPaymentAnalyticsMutation,
} = deliveryApi;

