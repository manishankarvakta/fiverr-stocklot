import { baseApi } from './baseApi';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserOrders: builder.query({
      query: (params = {}) => ({
        url: '/orders/user',
        params,
      }),
      providesTags: ['Order'],
    }),

    getOrders: builder.query({
      query: (params = {}) => ({
        url: params.isAuth ? '/orders' : '/checkout/guest/order',
        params,
      }),
      providesTags: ['Order'],
    }),

    getOrderById: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    getOrderGroup: builder.query({
      query: (orderGroupId) => `/orders/${orderGroupId}`,
      providesTags: (result, error, orderGroupId) => [{ type: 'Order', id: orderGroupId }],
    }),

    getOrderStatus: builder.query({
      query: (orderGroupId) => `/orders/${orderGroupId}/status`,
      providesTags: (result, error, orderGroupId) => [{ type: 'Order', id: orderGroupId }],
    }),

    updateOrderStatus: builder.mutation({
      query: ({ orderId, ...data }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Order', id: orderId }, 'Order'],
    }),

    confirmDelivery: builder.mutation({
      query: (orderId) => ({
        url: `/orders/${orderId}/confirm-delivery`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }, 'Order'],
    }),

    cancelOrder: builder.mutation({
      query: (orderGroupId) => ({
        url: `/orders/${orderGroupId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderGroupId) => [{ type: 'Order', id: orderGroupId }, 'Order'],
    }),

    refreshOrderLock: builder.mutation({
      query: (orderGroupId) => ({
        url: `/orders/${orderGroupId}/refresh-lock`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, orderGroupId) => [{ type: 'Order', id: orderGroupId }, 'Order'],
    }),

    finalizeOrderFees: builder.mutation({
      query: ({ orderGroupId, ...data }) => ({
        url: `/orders/${orderGroupId}/fees/finalize`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { orderGroupId }) => [{ type: 'Order', id: orderGroupId }, 'Order'],
    }),

    createOrder: builder.mutation({
     query: (args) => {
      const body = args?.data || args;
      const customHeaders = args?.header || {};
      "user";
      const token = localStorage.getItem('token');// auth provider
      return {
        url: '/checkout/order',
        method: 'POST',
        body: body,
        headers:{
          'X-org-context': orgContext,
          ...(token? {Authorization: `Bearer ${token}`}:{}),
          ...customHeaders,
        },

      };
     },
     invalidatesTag: ['Order', 'Cart']
    }),

    getOrderTracking: builder.query({
      query: (orderId) => `/orders/${orderId}/tracking`,
      providesTags: (result, error, orderId) => [{ type: 'Order', id: orderId }],
    }),

    getOrderHistory: builder.query({
      query: (params = {}) => ({
        url: '/orders/history',
        params,
      }),
      providesTags: ['Order'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserOrdersQuery,
  useLazyGetUserOrdersQuery,
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useGetOrderByIdQuery,
  useLazyGetOrderByIdQuery,
  useGetOrderGroupQuery,
  useLazyGetOrderGroupQuery,
  useGetOrderStatusQuery,
  useLazyGetOrderStatusQuery,
  useUpdateOrderStatusMutation,
  useConfirmDeliveryMutation,
  useCancelOrderMutation,
  useRefreshOrderLockMutation,
  useFinalizeOrderFeesMutation,
  useCreateOrderMutation,
  useGetOrderTrackingQuery,
  useLazyGetOrderTrackingQuery,
  useGetOrderHistoryQuery,
  useLazyGetOrderHistoryQuery,
} = ordersApi;
