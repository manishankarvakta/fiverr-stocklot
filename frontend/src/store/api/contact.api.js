import { baseApi } from './baseApi';

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitContactForm: builder.mutation({
      query: (data) => ({
        url: '/contact',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSubmitContactFormMutation,
} = contactApi;


