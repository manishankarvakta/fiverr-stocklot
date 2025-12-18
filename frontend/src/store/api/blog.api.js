import { baseApi } from './baseApi';

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBlogPosts: builder.query({
      query: (params = {}) => ({
        url: '/blog/posts',
        params,
      }),
      providesTags: ['Blog'],
    }),

    getBlogPostBySlug: builder.query({
      query: (slug) => `/blog/posts/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Blog', id: slug }],
    }),

    createBlogPost: builder.mutation({
      query: (data) => ({
        url: '/blog/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Blog'],
    }),

    generateBlogContent: builder.mutation({
      query: (data) => ({
        url: '/ai/generate-blog-content',
        method: 'POST',
        body: data,
      }),
    }),

    generateBlog: builder.mutation({
      query: (data) => ({
        url: '/admin/blog/generate',
        method: 'POST',
        body: data,
      }),
    }),

    weeklyGenerateBlog: builder.mutation({
      query: (data) => ({
        url: '/admin/blog/weekly-generate',
        method: 'POST',
        body: data,
      }),
    }),

    publishBlogPost: builder.mutation({
      query: ({ postId, ...data }) => ({
        url: `/admin/blog/posts/${postId}/publish`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Blog'],
    }),

    getAdminBlog: builder.query({
      query: (params = {}) => ({
        url: '/admin/blog',
        params,
      }),
      providesTags: ['Blog'],
    }),

    createAdminBlogPost: builder.mutation({
      query: (data) => ({
        url: '/admin/blog/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Blog'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBlogPostsQuery,
  useLazyGetBlogPostsQuery,
  useGetBlogPostBySlugQuery,
  useLazyGetBlogPostBySlugQuery,
  useCreateBlogPostMutation,
  useGenerateBlogContentMutation,
  useGenerateBlogMutation,
  useWeeklyGenerateBlogMutation,
  usePublishBlogPostMutation,
  useGetAdminBlogQuery,
  useLazyGetAdminBlogQuery,
  useCreateAdminBlogPostMutation,
} = blogApi;

