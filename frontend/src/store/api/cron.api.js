import { baseApi } from './baseApi';

export const cronApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    triggerLifecycleEmails: builder.mutation({
      query: (data) => ({
        url: '/cron/lifecycle-emails',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useTriggerLifecycleEmailsMutation,
} = cronApi;


