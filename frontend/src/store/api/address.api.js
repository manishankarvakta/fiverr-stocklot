// store/api/address.api.js
import { baseApi } from './baseApi';

export const addressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddresses: builder.query({
      query: () => '/addresses',
    }),
    addAddress: builder.mutation({
      query: (newAddress) => ({
        url: '/addresses',
        method: 'POST',
        body: newAddress,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetAddressesQuery, useAddAddressMutation } = addressApi;
