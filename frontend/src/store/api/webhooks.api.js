import { baseApi } from './baseApi';

export const webhooksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    mailgunWebhook: builder.mutation({
      query: (data) => ({
        url: '/webhooks/mailgun/events',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useMailgunWebhookMutation,
} = webhooksApi;


