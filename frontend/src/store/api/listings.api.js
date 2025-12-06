import { baseApi } from "./baseApi";

export const listingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // -----------------------------
    // PUBLIC ENDPOINTS
    // -----------------------------
    getListings: builder.query({
      query: (params = {}) => ({
        url: "/listings",
        params,
      }),
      providesTags: ["Listing"],
    }),

    getListingById: builder.query({
      query: (listingId) => `/listings/${listingId}`,
      providesTags: (result, error, listingId) => [
        { type: "Listing", id: listingId },
      ],
    }),

    searchListings: builder.query({
      query: (params = {}) => ({
        url: "/listings/search",
        params,
      }),
      providesTags: ["Listing"],
    }),

    // -----------------------------
    // SELLER PROTECTED ENDPOINTS
    // -----------------------------

    createListing: builder.mutation({
      query: (args) => {
        const data = args?.data || args;
        const customHeaders = args?.headers || {};

        // X-Org-Context always included
        const orgContext =
          customHeaders["X-Org-Context"] ||
          localStorage.getItem("currentContext") ||
          "user";

        return {
          url: "/listings",
          method: "POST",
          body: data,
          credentials: "include",
          headers: {
            "X-Org-Context": orgContext,
          },
        };
      },
      invalidatesTags: ["Listing"],
    }),

    updateListing: builder.mutation({
      query: ({ listingId, ...data }) => ({
        url: `/listings/${listingId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: "Listing", id: listingId },
        "Listing",
      ],
    }),

    deleteListing: builder.mutation({
      query: (listingId) => ({
        url: `/listings/${listingId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Listing"],
    }),

    // -----------------------------
    // MY LISTINGS (SELLER)
    // -----------------------------
    getMyListings: builder.query({
      query: (params = {}) => ({
        url: "/seller/listings",
        params,
      }),
      providesTags: ["Listing"],
    }),

    enhanceListing: builder.mutation({
      query: ({ listingId, ...data }) => ({
        url: `/listings/${listingId}/enhance`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: "Listing", id: listingId },
        "Listing",
      ],
    }),

    // -----------------------------
    // PDP ENDPOINT
    // -----------------------------
    getListingPDP: builder.query({
      query: (listingId) => `/listings/${listingId}/pdp`,
      providesTags: (result, error, listingId) => [
        { type: "Listing", id: listingId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetListingsQuery,
  useLazyGetListingsQuery,
  useGetListingByIdQuery,
  useLazyGetListingByIdQuery,
  useSearchListingsQuery,
  useLazySearchListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useGetMyListingsQuery,
  useLazyGetMyListingsQuery,
  useEnhanceListingMutation,
  useGetListingPDPQuery,
  useLazyGetListingPDPQuery,
} = listingsApi;
