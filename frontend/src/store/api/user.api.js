import { baseApi } from './baseApi';

console.log("baseApi", baseApi);
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Authentication
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    socialAuth: builder.mutation({
      query: (data) => ({
        url: '/auth/social',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    
    refreshToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    
    updateRole: builder.mutation({
      query: (roleData) => ({
        url: '/auth/update-role',
        method: 'PUT',
        body: roleData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Password Reset
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),
    
    verifyResetToken: builder.query({
      query: (token) => `/auth/reset-token/${token}`,
    }),
    
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    
    // 2FA
    setup2FA: builder.mutation({
      query: () => ({
        url: '/auth/2fa/setup',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    verify2FASetup: builder.mutation({
      query: (data) => ({
        url: '/auth/2fa/verify-setup',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    verify2FA: builder.mutation({
      query: (data) => ({
        url: '/auth/2fa/verify',
        method: 'POST',
        body: data,
      }),
    }),
    
    disable2FA: builder.mutation({
      query: (data) => ({
        url: '/auth/2fa/disable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    regenerateBackupCodes: builder.mutation({
      query: () => ({
        url: '/auth/2fa/regenerate-backup-codes',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    get2FAStatus: builder.query({
      query: () => '/auth/2fa/status',
      providesTags: ['User'],
    }),
    
    // KYC
    startKYC: builder.mutation({
      query: () => ({
        url: '/kyc/start',
        method: 'POST',
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
  useRegisterMutation,
  useLoginMutation,
  useSocialAuthMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useRefreshTokenMutation,
  useUpdateRoleMutation,
  useForgotPasswordMutation,
  useVerifyResetTokenQuery,
  useResetPasswordMutation,
  useSetup2FAMutation,
  useVerify2FASetupMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useRegenerateBackupCodesMutation,
  useGet2FAStatusQuery,
  useStartKYCMutation,
  useUploadKYCDocumentMutation,
  useSubmitKYCMutation,
  useGetKYCStatusQuery,
} = userApi;

