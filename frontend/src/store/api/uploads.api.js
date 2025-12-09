import { baseApi } from './baseApi';

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadListingImage: builder.mutation({
      query: (formData) => ({
        url: '/upload/listing-image',
        method: 'POST',
        body: formData,
      }),
    }),
    
    uploadProfileImage: builder.mutation({
      query: (formData) => ({
        url: '/upload/profile-image',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
    
    uploadLivestockImage: builder.mutation({
      query: (formData) => ({
        url: '/upload/livestock-image',
        method: 'POST',
        body: formData,
      }),
    }),
    
    uploadBuyRequestImage: builder.mutation({
      query: (formData) => ({
        url: '/upload/buy-request-image',
        method: 'POST',
        body: formData,
      }),
    }),
    
    uploadVetCertificate: builder.mutation({
      query: (formData) => ({
        url: '/upload/vet-certificate',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['KYC'],
    }),

    getUpload: builder.query({
      query: ({ folder, filename }) => `/uploads/${folder}/${filename}`,
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadListingImageMutation,
  useUploadProfileImageMutation,
  useUploadLivestockImageMutation,
  useUploadBuyRequestImageMutation,
  useUploadVetCertificateMutation,
  useGetUploadQuery,
  useLazyGetUploadQuery,
} = uploadsApi;

