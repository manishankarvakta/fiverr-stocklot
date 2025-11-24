import { baseApi } from './baseApi';

export const taxonomyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get taxonomy categories (with mode: core, exotic, or all)
    getTaxonomyCategories: builder.query({
      query: (params = {}) => ({
        url: '/taxonomy/categories',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),
    
    // Get all species (optionally filtered by category_group_id)
    getSpecies: builder.query({
      query: (params = {}) => ({
        url: '/species',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),
    
    // Get breeds by species
    getBreedsBySpecies: builder.query({
      query: (speciesId) => `/species/${speciesId}/breeds`,
      providesTags: (result, error, speciesId) => [
        { type: 'Taxonomy', id: `breeds-${speciesId}` },
      ],
    }),
    
    // Get product types (optionally filtered by category_group or species)
    getProductTypes: builder.query({
      query: (params = {}) => ({
        url: '/product-types',
        params,
      }),
      providesTags: ['Taxonomy'],
    }),
    
    // Get full taxonomy structure
    getFullTaxonomy: builder.query({
      query: () => '/taxonomy/full',
      providesTags: ['Taxonomy'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTaxonomyCategoriesQuery,
  useLazyGetTaxonomyCategoriesQuery,
  useGetSpeciesQuery,
  useLazyGetSpeciesQuery,
  useGetBreedsBySpeciesQuery,
  useLazyGetBreedsBySpeciesQuery,
  useGetProductTypesQuery,
  useLazyGetProductTypesQuery,
  useGetFullTaxonomyQuery,
  useLazyGetFullTaxonomyQuery,
} = taxonomyApi;

