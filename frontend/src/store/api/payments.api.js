import { baseApi } from './baseApi';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Paystack
    initializePaystack: builder.mutation({
      query: (data) => ({
        url: '/payments/paystack/init',
        method: 'POST',
        body: data,
      }),
    }),

    verifyPaystack: builder.query({
      query: (reference) => `/payments/paystack/verify/${reference}`,
    }),

    paystackWebhook: builder.mutation({
      query: (data) => ({
        url: '/payments/paystack/webhook',
        method: 'POST',
        body: data,
      }),
    }),

    // General Payments
    initializePayment: builder.mutation({
      query: (data) => ({
        url: '/payments/initialize',
        method: 'POST',
        body: data,
      }),
    }),

    verifyPayment: builder.query({
      query: (reference) => `/payments/verify/${reference}`,
    }),

    paymentWebhook: builder.mutation({
      query: (data) => ({
        url: '/payments/webhook',
        method: 'POST',
        body: data,
      }),
    }),

    paystackWebhookPayments: builder.mutation({
      query: (data) => ({
        url: '/payments/webhook/paystack',
        method: 'POST',
        body: data,
      }),
    }),

    // Escrow
    releaseEscrow: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/payments/escrow/${orderId}/release`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),

    // Paystack Transfers
    createPaystackTransfer: builder.mutation({
      query: (data) => ({
        url: '/payment/create-paystack',
        method: 'POST',
        body: data,
      }),
    }),

    // Recipients (Bank Accounts)
    getBanks: builder.query({
      query: () => '/recipients/banks',
    }),

    createBankAccount: builder.mutation({
      query: (data) => ({
        url: '/recipients/bank-account',
        method: 'POST',
        body: data,
      }),
    }),

    createAuthorization: builder.mutation({
      query: (data) => ({
        url: '/recipients/authorization',
        method: 'POST',
        body: data,
      }),
    }),

    getRecipients: builder.query({
      query: () => '/recipients',
    }),

    getRecipientById: builder.query({
      query: (recipientId) => `/recipients/${recipientId}`,
    }),

    deleteRecipient: builder.mutation({
      query: (recipientId) => ({
        url: `/recipients/${recipientId}`,
        method: 'DELETE',
      }),
    }),

    // Transfers
    createTransfer: builder.mutation({
      query: (data) => ({
        url: '/transfers',
        method: 'POST',
        body: data,
      }),
    }),

    getTransfers: builder.query({
      query: (params = {}) => ({
        url: '/transfers',
        params,
      }),
    }),

    getTransferById: builder.query({
      query: (transferId) => `/transfers/${transferId}`,
    }),

    releaseEscrowTransfer: builder.mutation({
      query: (data) => ({
        url: '/transfers/escrow/release',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),

    paystackTransfersWebhook: builder.mutation({
      query: (data) => ({
        url: '/webhooks/paystack/transfers',
        method: 'POST',
        body: data,
      }),
    }),

    // Payment Methods
    getUserPaymentMethods: builder.query({
      query: () => '/user/payment-methods',
    }),

    createUserPaymentMethod: builder.mutation({
      query: (data) => ({
        url: '/user/payment-methods',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    deleteUserPaymentMethod: builder.mutation({
      query: (methodId) => ({
        url: `/user/payment-methods/${methodId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Payouts
    releasePayout: builder.mutation({
      query: ({ sellerOrderId, ...data }) => ({
        url: `/payouts/${sellerOrderId}/release`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),

    getSellerPayouts: builder.query({
      query: (sellerId) => `/payouts/seller/${sellerId}`,
      providesTags: (result, error, sellerId) => [{ type: 'Order', id: sellerId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useInitializePaystackMutation,
  useVerifyPaystackQuery,
  useLazyVerifyPaystackQuery,
  usePaystackWebhookMutation,
  useInitializePaymentMutation,
  useVerifyPaymentQuery,
  useLazyVerifyPaymentQuery,
  usePaymentWebhookMutation,
  usePaystackWebhookPaymentsMutation,
  useReleaseEscrowMutation,
  useCreatePaystackTransferMutation,
  useGetBanksQuery,
  useLazyGetBanksQuery,
  useCreateBankAccountMutation,
  useCreateAuthorizationMutation,
  useGetRecipientsQuery,
  useLazyGetRecipientsQuery,
  useGetRecipientByIdQuery,
  useLazyGetRecipientByIdQuery,
  useDeleteRecipientMutation,
  useCreateTransferMutation,
  useGetTransfersQuery,
  useLazyGetTransfersQuery,
  useGetTransferByIdQuery,
  useLazyGetTransferByIdQuery,
  useReleaseEscrowTransferMutation,
  usePaystackTransfersWebhookMutation,
  useGetUserPaymentMethodsQuery,
  useLazyGetUserPaymentMethodsQuery,
  useCreateUserPaymentMethodMutation,
  useDeleteUserPaymentMethodMutation,
  useReleasePayoutMutation,
  useGetSellerPayoutsQuery,
  useLazyGetSellerPayoutsQuery,
} = paymentsApi;


