import { baseApi } from './baseApi';

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrganization: builder.mutation({
      query: (data) => ({
        url: '/orgs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    getMyContexts: builder.query({
      query: () => '/orgs/my-contexts',
      providesTags: ['User'],
    }),

    switchOrganization: builder.mutation({
      query: (data) => ({
        url: '/orgs/switch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    inviteToOrganization: builder.mutation({
      query: ({ orgId, ...data }) => ({
        url: `/orgs/${orgId}/invite`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    getOrganization: builder.query({
      query: (identifier) => `/orgs/${identifier}`,
      providesTags: (result, error, identifier) => [{ type: 'User', id: identifier }],
    }),

    getOrganizationMembers: builder.query({
      query: (orgId) => `/orgs/${orgId}/members`,
      providesTags: (result, error, orgId) => [{ type: 'User', id: orgId }],
    }),

    getStorefront: builder.query({
      query: (handle) => `/orgs/storefront/${handle}`,
      providesTags: (result, error, handle) => [{ type: 'User', id: handle }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrganizationMutation,
  useGetMyContextsQuery,
  useLazyGetMyContextsQuery,
  useSwitchOrganizationMutation,
  useInviteToOrganizationMutation,
  useGetOrganizationQuery,
  useLazyGetOrganizationQuery,
  useGetOrganizationMembersQuery,
  useLazyGetOrganizationMembersQuery,
  useGetStorefrontQuery,
  useLazyGetStorefrontQuery,
} = organizationsApi;


