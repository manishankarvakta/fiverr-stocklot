import { baseApi } from './baseApi';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
    query: ({ isAuthenticated, orderPayload }) => ({
      url: isAuthenticated ? '/checkout/order' : '/checkout/guest/create',
      method: 'POST',
      body: orderPayload,
    }),
    invalidatesTags: ['Order'],
  }),
    getUserOrders: builder.query({
      query: (params = {}) => ({
        url: '/orders/user',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),
    
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'Order',
      ],
    }),
    
    confirmDelivery: builder.mutation({
      query: (orderId) => ({
        url: `/orders/${orderId}/delivery-confirm`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [
        { type: 'Order', id: orderId },
        'Order',
      ],
    }),
    
    createDispute: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/orders/${orderId}/dispute`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        'Order',
      ],
    }),
    
    // Payments
    initializePayment: builder.mutation({
      query: (data) => ({
        url: '/payments/initialize',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),
    
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: '/payments/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),
    
    requestRefund: builder.mutation({
      query: (data) => ({
        url: '/payments/refund',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Order'],
    }),
    
    getPaymentHistory: builder.query({
      query: (params = {}) => ({
        url: '/payments/history',
        params,
      }),
      providesTags: ['Order'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrderMutation,
  useGetUserOrdersQuery,
  useLazyGetUserOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useConfirmDeliveryMutation,
  useCreateDisputeMutation,
  useInitializePaymentMutation,
  useVerifyPaymentMutation,
  useRequestRefundMutation,
  useGetPaymentHistoryQuery,
  useLazyGetPaymentHistoryQuery,
} = ordersApi;

