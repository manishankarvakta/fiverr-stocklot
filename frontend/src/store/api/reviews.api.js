import { baseApi } from './baseApi';

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: (params = {}) => ({
        url: '/reviews',
        params,
      }),
      providesTags: ['Review'],
    }),

    getSellerReviews: builder.query({
      query: (sellerId) => `/public/sellers/${sellerId}/reviews`,
      providesTags: (result, error, sellerId) => [{ type: 'Review', id: sellerId }],
    }),

    createReview: builder.mutation({
      query: (data) => ({
        url: '/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review'],
    }),

    updateReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url: `/reviews/${reviewId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { reviewId }) => [{ type: 'Review', id: reviewId }, 'Review'],
    }),

    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),

    replyToReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url: `/reviews/${reviewId}/reply`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { reviewId }) => [{ type: 'Review', id: reviewId }, 'Review'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReviewsQuery,
  useLazyGetReviewsQuery,
  useGetSellerReviewsQuery,
  useLazyGetSellerReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useReplyToReviewMutation,
} = reviewsApi;


