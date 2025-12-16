import { baseApi } from './baseApi';

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Profile
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    uploadProfilePhoto: builder.mutation({
      query: (formData) => ({
        url: '/profile/photo',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    uploadFarmPhotos: builder.mutation({
      query: (formData) => ({
        url: '/profile/farm-photos',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    getProfileOptions: builder.query({
      query: () => '/profile/options',
      providesTags: ['User'],
    }),

    // Users
    getUsers: builder.query({
      query: (params = {}) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),

    // Sellers
    getSellerByHandle: builder.query({
      query: (handle) => `/sellers/${handle}`,
      providesTags: (result, error, handle) => [{ type: 'User', id: handle }],
    }),

    getBuyerSummary: builder.query({
      query: ({ sellerId, buyerId }) => `/seller/buyers/${buyerId}/summary`,
      providesTags: (result, error, { buyerId }) => [{ type: 'User', id: buyerId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
  useUploadFarmPhotosMutation,
  useGetProfileOptionsQuery,
  useLazyGetProfileOptionsQuery,
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetSellerByHandleQuery,
  useLazyGetSellerByHandleQuery,
  useGetBuyerSummaryQuery,
  useLazyGetBuyerSummaryQuery,
} = profileApi;


