import { baseApi } from './baseApi';

export const taxonomyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategoryGroups: builder.query({
      query: () => '/category-groups',
      providesTags: ['Taxonomy'],
    }),

    getCategories: builder.query({
      query: (params = {}) => ({
        url: '/categories',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),

    getTaxonomyCategories: builder.query({
      query: (params = {}) => ({
        url: '/taxonomy/categories',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),

    getFullTaxonomy: builder.query({
      query: () => '/taxonomy/full',
      providesTags: ['Taxonomy'],
    }),

    getSpecies: builder.query({
      query: (params = {}) => ({
        url: '/species',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),

    getBreeds: builder.query({
      query: (params = {}) => ({
        url: '/breeds',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),

    getBreedsBySpecies: builder.query({
      query: (speciesId) => `/species/${speciesId}/breeds`,
      providesTags: (result, error, speciesId) => [{ type: 'Taxonomy', id: speciesId }],
    }),

    getProductTypes: builder.query({
      query: (params = {}) => ({
        url: '/product-types',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),

    // Exotic Livestock
    getExoticCategories: builder.query({
      query: () => '/exotic-livestock/categories',
      providesTags: ['Taxonomy'],
    }),

    getExoticSpecies: builder.query({
      query: () => '/exotic-livestock/species',
      providesTags: ['Taxonomy'],
    }),

    getExoticProductTypes: builder.query({
      query: (speciesName) => `/exotic-livestock/species/${speciesName}/product-types`,
      providesTags: (result, error, speciesName) => [{ type: 'Taxonomy', id: speciesName }],
    }),

    getExoticCompliance: builder.query({
      query: (speciesId) => `/exotic-livestock/species/${speciesId}/compliance`,
      providesTags: (result, error, speciesId) => [{ type: 'Taxonomy', id: speciesId }],
    }),

    validateExoticListing: builder.mutation({
      query: (data) => ({
        url: '/exotic-livestock/validate-listing',
        method: 'POST',
        body: data,
      }),
    }),

    getExoticStatistics: builder.query({
      query: (params = {}) => ({
        url: '/exotic-livestock/statistics',
        params,
      }),
    }),

    getExoticSearch: builder.query({
      query: (params = {}) => ({
        url: '/exotic-livestock/search',
        params,
      }),
    }),

    getBreedingRecommendations: builder.query({
      query: (speciesName) => `/exotic-livestock/species/${speciesName}/breeding-recommendations`,
      providesTags: (result, error, speciesName) => [{ type: 'Taxonomy', id: speciesName }],
    }),

    getComplianceRequirements: builder.query({
      query: (params = {}) => ({
        url: '/compliance/requirements',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoryGroupsQuery,
  useLazyGetCategoryGroupsQuery,
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetTaxonomyCategoriesQuery,
  useLazyGetTaxonomyCategoriesQuery,
  useGetFullTaxonomyQuery,
  useLazyGetFullTaxonomyQuery,
  useGetSpeciesQuery,
  useLazyGetSpeciesQuery,
  useGetBreedsQuery,
  useLazyGetBreedsQuery,
  useGetBreedsBySpeciesQuery,
  useLazyGetBreedsBySpeciesQuery,
  useGetProductTypesQuery,
  useLazyGetProductTypesQuery,
  useGetExoticCategoriesQuery,
  useLazyGetExoticCategoriesQuery,
  useGetExoticSpeciesQuery,
  useLazyGetExoticSpeciesQuery,
  useGetExoticProductTypesQuery,
  useLazyGetExoticProductTypesQuery,
  useGetExoticComplianceQuery,
  useLazyGetExoticComplianceQuery,
  useValidateExoticListingMutation,
  useGetExoticStatisticsQuery,
  useLazyGetExoticStatisticsQuery,
  useGetExoticSearchQuery,
  useLazyGetExoticSearchQuery,
  useGetBreedingRecommendationsQuery,
  useLazyGetBreedingRecommendationsQuery,
  useGetComplianceRequirementsQuery,
  useLazyGetComplianceRequirementsQuery,
} = taxonomyApi;
