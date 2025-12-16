import { baseApi } from './baseApi';

export const marketingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    subscribeMarketing: builder.mutation({
      query: (data) => ({
        url: '/marketing/subscribe',
        method: 'POST',
        body: data,
      }),
    }),

    trackMarketing: builder.mutation({
      query: (data) => ({
        url: '/track',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubscribeMarketingMutation,
  useTrackMarketingMutation,
} = marketingApi;


