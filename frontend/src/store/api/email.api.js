import { baseApi } from './baseApi';

export const emailApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmailPreferences: builder.query({
      query: () => '/email/preferences',
      providesTags: ['User'],
    }),

    updateEmailPreferences: builder.mutation({
      query: (data) => ({
        url: '/email/preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    getEmailTemplates: builder.query({
      query: () => '/email/templates',
      providesTags: ['Email'],
    }),

    sendTestEmail: builder.mutation({
      query: (data) => ({
        url: '/email/test',
        method: 'POST',
        body: data,
      }),
    }),

    getUserEmailPreferences: builder.query({
      query: (userId) => `/email-preferences/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    updateUserEmailPreferences: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/email-preferences/${userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    unsubscribeEmail: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/email-preferences/${userId}/unsubscribe`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    getEmailTemplatesCatalog: builder.query({
      query: () => '/email-templates/catalog',
      providesTags: ['Email'],
    }),

    sendEmailNotification: builder.mutation({
      query: (data) => ({
        url: '/email-notifications/send',
        method: 'POST',
        body: data,
      }),
    }),

    subscribeNotifications: builder.mutation({
      query: (data) => ({
        url: '/notifications/subscribe',
        method: 'POST',
        body: data,
      }),
    }),

    unsubscribeNotifications: builder.mutation({
      query: (data) => ({
        url: '/notifications/unsubscribe',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEmailPreferencesQuery,
  useLazyGetEmailPreferencesQuery,
  useUpdateEmailPreferencesMutation,
  useGetEmailTemplatesQuery,
  useLazyGetEmailTemplatesQuery,
  useSendTestEmailMutation,
  useGetUserEmailPreferencesQuery,
  useLazyGetUserEmailPreferencesQuery,
  useUpdateUserEmailPreferencesMutation,
  useUnsubscribeEmailMutation,
  useGetEmailTemplatesCatalogQuery,
  useLazyGetEmailTemplatesCatalogQuery,
  useSendEmailNotificationMutation,
  useSubscribeNotificationsMutation,
  useUnsubscribeNotificationsMutation,
} = emailApi;


