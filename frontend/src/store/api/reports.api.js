import { baseApi } from './baseApi';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Tax Reports
    getTaxReports: builder.query({
      query: (params = {}) => ({
        url: '/reports/tax',
        params,
      }),
      transformResponse: (response) => response.reports || [],
      providesTags: ['Reports'],
    }),

    generateTaxReport: builder.mutation({
      query: (data) => ({
        url: '/reports/tax/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reports'],
    }),

    downloadTaxReport: builder.query({
      query: (reportId) => ({
        url: `/reports/tax/${reportId}/download`,
        responseHandler: (response) => response.blob(),
      }),
      providesTags: ['Reports'],
    }),
  }),
});

export const {
  useGetTaxReportsQuery,
  useGenerateTaxReportMutation,
  useLazyDownloadTaxReportQuery,
} = reportsApi;
