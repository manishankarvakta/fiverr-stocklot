import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Health check
    healthCheck: builder.query({
      query: () => '/health',
    }),

    // Registration & Login
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    registerEnhanced: builder.mutation({
      query: (userData) => ({
        url: '/auth/register-enhanced',
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

    loginEnhanced: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login-enhanced',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    refreshToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    socialAuth: builder.mutation({
      query: (data) => ({
        url: '/auth/social',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
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

    getResetToken: builder.query({
      query: (token) => `/auth/reset-token/${token}`,
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    passwordReset: builder.mutation({
      query: (data) => ({
        url: '/auth/password-reset',
        method: 'POST',
        body: data,
      }),
    }),

    passwordResetConfirm: builder.mutation({
      query: (data) => ({
        url: '/auth/password-reset/confirm',
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
  }),
  overrideExisting: false,
});

export const {
  useHealthCheckQuery,
  useRegisterMutation,
  useRegisterEnhancedMutation,
  useLoginMutation,
  useLoginEnhancedMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  useSocialAuthMutation,
  useUpdateRoleMutation,
  useForgotPasswordMutation,
  useGetResetTokenQuery,
  useResetPasswordMutation,
  usePasswordResetMutation,
  usePasswordResetConfirmMutation,
  useSetup2FAMutation,
  useVerify2FASetupMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useRegenerateBackupCodesMutation,
  useGet2FAStatusQuery,
} = authApi;

