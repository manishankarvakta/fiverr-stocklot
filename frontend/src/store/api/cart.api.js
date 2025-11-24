import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: (params = {}) => ({
        url: '/cart',
        params,
      }),
      providesTags: ['Cart'],
    }),
    
    addToCart: builder.mutation({
      query: (item) => ({
        url: '/cart/add',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Cart'],
    }),
    
    updateCartItem: builder.mutation({
      query: (data) => ({
        url: '/cart/update',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),
    
    removeFromCart: builder.mutation({
      query: (itemId) => ({
        url: `/cart/item/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    
    // Checkout
    createCheckout: builder.mutation({
      query: (data) => ({
        url: '/checkout/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),
    
    getCheckoutPreview: builder.query({
      query: (params = {}) => ({
        url: '/checkout/preview',
        params,
      }),
      providesTags: ['Cart'],
    }),
    
    completeCheckout: builder.mutation({
      query: ({ sessionId, ...data }) => ({
        url: `/checkout/${sessionId}/complete`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart', 'Order'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useLazyGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useCreateCheckoutMutation,
  useGetCheckoutPreviewQuery,
  useLazyGetCheckoutPreviewQuery,
  useCompleteCheckoutMutation,
} = cartApi;

