import { baseApi } from './baseApi';

export const referralsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyReferralCode: builder.query({
      query: () => '/referrals/my-code',
      providesTags: ['Referral'],
    }),

    getReferralCode: builder.query({
      query: () => '/referrals/code',
      providesTags: ['Referral'],
    }),

    getReferralStats: builder.query({
      query: () => '/referrals/stats',
      providesTags: ['Referral'],
    }),

    getReferralSummary: builder.query({
      query: () => '/referrals/summary',
      providesTags: ['Referral'],
    }),

    getReferralWallet: builder.query({
      query: () => '/referrals/wallet',
      providesTags: ['Referral'],
    }),

    trackReferralClick: builder.query({
      query: (params = {}) => ({
        url: '/referrals/click',
        params,
      }),
    }),

    getReferralClick: builder.query({
      query: (params = {}) => ({
        url: '/referrals/click',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyReferralCodeQuery,
  useLazyGetMyReferralCodeQuery,
  useGetReferralCodeQuery,
  useLazyGetReferralCodeQuery,
  useGetReferralStatsQuery,
  useLazyGetReferralStatsQuery,
  useGetReferralSummaryQuery,
  useLazyGetReferralSummaryQuery,
  useGetReferralWalletQuery,
  useLazyGetReferralWalletQuery,
  useTrackReferralClickQuery,
  useLazyTrackReferralClickQuery,
  useGetReferralClickQuery,
  useLazyGetReferralClickQuery,
} = referralsApi;


