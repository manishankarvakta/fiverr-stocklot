import { baseApi } from './baseApi';

export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCheckout: builder.mutation({
      query: (data) => ({
        url: '/checkout/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),

    createGuestCheckout: builder.mutation({
      query: (data) => ({
        url: '/checkout/guest/create',
        method: 'POST',
        body: data,
      }),
    }),

    createOrder: builder.mutation({
      query: (data) => ({
        url: '/checkout/order',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),

    completeCheckout: builder.mutation({
      query: ({ sessionId, ...data }) => ({
        url: `/checkout/${sessionId}/complete`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),

    getQuote: builder.mutation({
      query: (data) => ({
        url: '/checkout/quote',
        method: 'POST',
        body: data,
      }),
    }),

    getGuestQuote: builder.mutation({
      query: (data) => ({
        url: '/checkout/guest/quote',
        method: 'POST',
        body: data,
      }),
    }),

    previewCheckout: builder.mutation({
      query: (data) => ({
        url: '/checkout/preview',
        method: 'POST',
        body: data,
      }),
    }),

    getFeeBreakdown: builder.query({
      query: (params) => ({
        url: '/fees/breakdown',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateCheckoutMutation,
  useCreateGuestCheckoutMutation,
  useCreateOrderMutation,
  useCompleteCheckoutMutation,
  useGetQuoteMutation,
  useGetGuestQuoteMutation,
  usePreviewCheckoutMutation,
  useGetFeeBreakdownQuery,
  useLazyGetFeeBreakdownQuery,
} = checkoutApi;


