import { baseApi } from './baseApi';

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Seller Analytics
    getSellerAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics',
        params: {
          period: params.period || '30days',
        },
      }),
      providesTags: ['SellerAnalytics'],
    }),
    
    // Seller Campaigns
    getSellerCampaigns: builder.query({
      query: (params = {}) => ({
        url: '/seller/promotion/campaigns',
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    createSellerCampaign: builder.mutation({
      query: (data) => ({
        url: '/seller/promotion/campaigns',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),
    
    updateSellerCampaign: builder.mutation({
      query: ({ campaignId, ...data }) => ({
        url: `/seller/promotion/campaigns/${campaignId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),
    
    getSellerCampaignStats: builder.query({
      query: () => '/seller/promotion/stats',
      providesTags: ['Admin'],
    }),
    
    // Seller Offers
    getSellerOffers: builder.query({
      query: (params = {}) => ({
        url: '/seller/offers',
        params,
      }),
      providesTags: ['Admin'],
    }),
    
    getSellerOfferStats: builder.query({
      query: () => '/seller/offers/stats',
      providesTags: ['Admin'],
    }),
    
    respondToOffer: builder.mutation({
      query: ({ offerId, ...data }) => ({
        url: `/seller/offers/${offerId}/respond`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),
    
    createCounterOffer: builder.mutation({
      query: ({ offerId, ...data }) => ({
        url: `/seller/offers/${offerId}/counter`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),
    
    // Shipping Rates
    getShippingRates: builder.query({
      query: () => '/seller/delivery-rate',
      providesTags: ['Admin'],
    }),
    
    updateShippingRates: builder.mutation({
      query: (data) => ({
        url: '/seller/delivery-rate',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Admin'],
    }),
    
    // Inventory Bulk Operations
    bulkUpdateInventory: builder.mutation({
      query: (data) => ({
        url: '/seller/inventory/bulk-update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Listing'],
    }),
    
    getInventoryTemplate: builder.query({
      query: () => ({
        url: '/seller/inventory/bulk-update/template',
        responseHandler: (response) => response.blob(),
      }),
    }),
    
    exportInventory: builder.query({
      query: (params = {}) => ({
        url: '/seller/inventory/export',
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),
    
    // Seller Profile
    getSellerProfile: builder.query({
      query: (handle) => `/sellers/${handle}`,
      providesTags: (result, error, handle) => [{ type: 'User', id: handle }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSellerAnalyticsQuery,
  useLazyGetSellerAnalyticsQuery,
  useGetSellerCampaignsQuery,
  useLazyGetSellerCampaignsQuery,
  useCreateSellerCampaignMutation,
  useUpdateSellerCampaignMutation,
  useGetSellerCampaignStatsQuery,
  useLazyGetSellerCampaignStatsQuery,
  useGetSellerOffersQuery,
  useLazyGetSellerOffersQuery,
  useGetSellerOfferStatsQuery,
  useLazyGetSellerOfferStatsQuery,
  useRespondToOfferMutation,
  useCreateCounterOfferMutation,
  useGetShippingRatesQuery,
  useLazyGetShippingRatesQuery,
  useUpdateShippingRatesMutation,
  useBulkUpdateInventoryMutation,
  useGetInventoryTemplateQuery,
  useLazyGetInventoryTemplateQuery,
  useExportInventoryQuery,
  useLazyExportInventoryQuery,
  useGetSellerProfileQuery,
  useLazyGetSellerProfileQuery,
} = sellerApi;

