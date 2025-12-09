import { baseApi } from './baseApi';

export const platformApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformConfig: builder.query({
      query: () => '/platform/config',
    }),

    getPublicConfig: builder.query({
      query: () => '/public/config',
    }),

    getPublicSettings: builder.query({
      query: () => '/public/settings',
    }),

    getAdminSettings: builder.query({
      query: () => '/admin/settings',
    }),

    updateAdminSettings: builder.mutation({
      query: (data) => ({
        url: '/admin/settings',
        method: 'PUT',
        body: data,
      }),
    }),

    getAdminSocialMedia: builder.query({
      query: () => '/admin/platform/social-media',
    }),

    updateAdminSocialMedia: builder.mutation({
      query: (data) => ({
        url: '/admin/platform/social-media',
        method: 'PUT',
        body: data,
      }),
    }),

    toggleFeatureFlag: builder.mutation({
      query: ({ flagKey, ...data }) => ({
        url: `/admin/feature-flags/${flagKey}/toggle`,
        method: 'POST',
        body: data,
      }),
    }),

    setFeatureFlag: builder.mutation({
      query: ({ flagKey, ...data }) => ({
        url: `/admin/flags/${flagKey}`,
        method: 'POST',
        body: data,
      }),
    }),

    setSetting: builder.mutation({
      query: ({ settingKey, ...data }) => ({
        url: `/admin/settings/${settingKey}`,
        method: 'POST',
        body: data,
      }),
    }),

    getAdminConfigFlags: builder.query({
      query: () => '/admin/config/flags',
    }),

    setAdminConfigFlag: builder.mutation({
      query: ({ key, ...data }) => ({
        url: `/admin/config/flags/${key}`,
        method: 'POST',
        body: data,
      }),
    }),

    getAdminConfigFees: builder.query({
      query: () => '/admin/config/fees',
    }),

    createAdminConfigFee: builder.mutation({
      query: (data) => ({
        url: '/admin/config/fees',
        method: 'POST',
        body: data,
      }),
    }),

    activateAdminConfigFee: builder.mutation({
      query: ({ configId, ...data }) => ({
        url: `/admin/config/fees/${configId}/activate`,
        method: 'POST',
        body: data,
      }),
    }),

    getAdminFeesConfigs: builder.query({
      query: () => '/admin/fees/configs',
    }),

    createAdminFeesConfig: builder.mutation({
      query: (data) => ({
        url: '/admin/fees/configs',
        method: 'POST',
        body: data,
      }),
    }),

    activateAdminFeesConfig: builder.mutation({
      query: ({ configId, ...data }) => ({
        url: `/admin/fees/configs/${configId}/activate`,
        method: 'POST',
        body: data,
      }),
    }),

    getAdminFeesRevenueSummary: builder.query({
      query: (params = {}) => ({
        url: '/admin/fees/revenue-summary',
        params,
      }),
    }),

    updateDeliveryConfig: builder.mutation({
      query: (data) => ({
        url: '/admin/delivery/config',
        method: 'POST',
        body: data,
      }),
    }),

    toggleDeliveryOnlyMode: builder.mutation({
      query: (data) => ({
        url: '/admin/delivery/toggle-only-mode',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPlatformConfigQuery,
  useLazyGetPlatformConfigQuery,
  useGetPublicConfigQuery,
  useLazyGetPublicConfigQuery,
  useGetPublicSettingsQuery,
  useLazyGetPublicSettingsQuery,
  useGetAdminSettingsQuery,
  useLazyGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetAdminSocialMediaQuery,
  useLazyGetAdminSocialMediaQuery,
  useUpdateAdminSocialMediaMutation,
  useToggleFeatureFlagMutation,
  useSetFeatureFlagMutation,
  useSetSettingMutation,
  useGetAdminConfigFlagsQuery,
  useLazyGetAdminConfigFlagsQuery,
  useSetAdminConfigFlagMutation,
  useGetAdminConfigFeesQuery,
  useLazyGetAdminConfigFeesQuery,
  useCreateAdminConfigFeeMutation,
  useActivateAdminConfigFeeMutation,
  useGetAdminFeesConfigsQuery,
  useLazyGetAdminFeesConfigsQuery,
  useCreateAdminFeesConfigMutation,
  useActivateAdminFeesConfigMutation,
  useGetAdminFeesRevenueSummaryQuery,
  useLazyGetAdminFeesRevenueSummaryQuery,
  useUpdateDeliveryConfigMutation,
  useToggleDeliveryOnlyModeMutation,
} = platformApi;


