import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),

    addToCart: builder.mutation({
      query: (data) => ({
        url: '/cart/add',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation({
      query: (itemId) => ({
        url: `/cart/item/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    updateCart: builder.mutation({
      query: (data) => ({
        url: '/cart/update',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Cart'],
    }),

    createCartSnapshot: builder.mutation({
      query: (data) => ({
        url: '/cart/snapshot',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useLazyGetCartQuery,
  useAddToCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartMutation,
  useCreateCartSnapshotMutation,
} = cartApi;

// Aliases for backward compatibility
export const useRemoveFromCartMutation = useRemoveCartItemMutation;

// Wrapper hook for updateCartItem that accepts { itemId, quantity }
// Backend expects: { item_id, quantity }
export const useUpdateCartItemMutation = () => {
  const [updateCart, mutationResult] = useUpdateCartMutation();
  
  const updateCartItem = async ({ itemId, quantity, ...otherData }) => {
    // Backend expects { item_id, quantity } format
    return updateCart({
      item_id: itemId,
      quantity,
      ...otherData
    });
  };
  
  return [updateCartItem, mutationResult];
};
