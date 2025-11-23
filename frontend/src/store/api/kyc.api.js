import { baseApi } from './baseApi';

export const kycApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startKYC: builder.mutation({
      query: (data) => ({
        url: '/kyc/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['KYC'],
    }),
    
    uploadKYCDocument: builder.mutation({
      query: (formData) => ({
        url: '/kyc/upload-document',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['KYC'],
    }),
    
    submitKYC: builder.mutation({
      query: (data) => ({
        url: '/kyc/submit',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['KYC'],
    }),
    
    getKYCStatus: builder.query({
      query: () => '/kyc/status',
      providesTags: ['KYC'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useStartKYCMutation,
  useUploadKYCDocumentMutation,
  useSubmitKYCMutation,
  useGetKYCStatusQuery,
  useLazyGetKYCStatusQuery,
} = kycApi;

