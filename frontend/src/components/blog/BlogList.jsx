import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge, 
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../ui';
import { 
  Calendar, User, Eye, Search, Filter, ChevronRight, Clock,
  BookOpen, Tag, TrendingUp
} from 'lucide-react';
import Header from '@/components/ui/common/Header';
import Footer from '@/components/ui/common/Footer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BlogList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Mock data for demo purposes
  const mockArticles = [
    {
      id: 'article_1',
      title: 'Best Practices for Cattle Breeding in South Africa',
      slug: 'cattle-breeding-best-practices-sa',
      excerpt: 'Learn about the latest techniques and best practices for successful cattle breeding in the South African climate and conditions.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Dr. Johan Pretorius',
      featured_image: 'https://images.unsplash.com/photo-1596222575694-51631272d94a?w=800&h=400&fit=crop&crop=center',
      category: 'Cattle',
      tags: ['breeding', 'cattle', 'south africa', 'farming'],
      views: 2847,
      published_at: '2024-12-25T10:00:00Z',
      created_at: '2024-12-20T14:30:00Z',
      updated_at: '2024-12-25T09:45:00Z',
      seo_title: 'Cattle Breeding Best Practices - South African Farmers Guide',
      seo_description: 'Complete guide to cattle breeding in South Africa. Learn techniques, best practices, and tips for successful livestock farming.',
      reading_time: 8
    },
    {
      id: 'article_2',
      title: 'Understanding Poultry Disease Prevention',
      slug: 'poultry-disease-prevention-guide',
      excerpt: 'Essential guide to preventing common diseases in poultry farming and maintaining healthy flocks.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Dr. Sarah Williams',
      featured_image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=400&fit=crop&crop=center',
      category: 'Poultry',
      tags: ['poultry', 'disease prevention', 'health', 'chickens'],
      views: 1923,
      published_at: '2024-12-28T09:00:00Z',
      created_at: '2024-12-26T11:15:00Z',
      updated_at: '2024-12-28T08:30:00Z',
      seo_title: 'Poultry Disease Prevention Guide for Farmers',
      seo_description: 'Learn how to prevent diseases in poultry farming. Expert tips and strategies for healthy chicken farming.',
      reading_time: 6
    },
    {
      id: 'article_3',
      title: 'Market Trends: Livestock Prices Q4 2024',
      slug: 'livestock-market-trends-q4-2024',
      excerpt: 'Analysis of current livestock market trends and price predictions for the fourth quarter of 2024.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Michael Thompson',
      featured_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=center',
      category: 'Market Analysis',
      tags: ['market trends', 'prices', 'livestock', '2024'],
      views: 3456,
      published_at: '2024-12-29T13:20:00Z',
      created_at: '2024-12-29T13:20:00Z',
      updated_at: '2024-12-29T15:45:00Z',
      seo_title: 'Livestock Market Trends Q4 2024 - Price Analysis',
      seo_description: 'Latest livestock market trends and price analysis for Q4 2024. Expert insights for farmers and buyers.',
      reading_time: 12
    },
    {
      id: 'article_4',
      title: 'Sustainable Farming Practices for Small Holders',
      slug: 'sustainable-farming-small-holders',
      excerpt: 'How small-scale farmers can implement sustainable practices to improve productivity and environmental impact.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Emma van der Merwe',
      featured_image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=400&fit=crop&crop=center',
      category: 'Sustainability',
      tags: ['sustainable farming', 'small holders', 'environment', 'productivity'],
      views: 2134,
      published_at: '2024-12-30T06:00:00Z',
      created_at: '2024-12-27T16:00:00Z',
      updated_at: '2024-12-29T10:15:00Z',
      seo_title: 'Sustainable Farming for Small Holders - Practical Guide',
      seo_description: 'Practical sustainable farming practices for small-scale farmers. Improve productivity while protecting the environment.',
      reading_time: 10
    },
    {
      id: 'article_5',
      title: 'Digital Marketing for Livestock Farmers',
      slug: 'digital-marketing-livestock-farmers',
      excerpt: 'Learn how to use digital marketing to reach more buyers and grow your livestock farming business.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Thabo Mthembu',
      featured_image: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800&h=400&fit=crop&crop=center',
      category: 'Business',
      tags: ['digital marketing', 'livestock', 'business', 'farmers'],
      views: 1567,
      published_at: '2024-12-31T08:30:00Z',
      created_at: '2024-12-28T14:00:00Z',
      updated_at: '2024-12-31T08:00:00Z',
      seo_title: 'Digital Marketing Guide for Livestock Farmers',
      seo_description: 'Complete digital marketing guide for livestock farmers. Learn to reach more buyers and grow your business online.',
      reading_time: 9
    },
    {
      id: 'article_6',
      title: 'Feed Management and Nutrition for Cattle',
      slug: 'feed-management-nutrition-cattle',
      excerpt: 'Comprehensive guide to proper feed management and nutrition requirements for healthy cattle.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Dr. Lisa Mbeki',
      featured_image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=400&fit=crop&crop=center',
      category: 'Cattle',
      tags: ['feed management', 'nutrition', 'cattle', 'health'],
      views: 2890,
      published_at: '2025-01-01T10:00:00Z',
      created_at: '2024-12-30T09:15:00Z',
      updated_at: '2025-01-01T09:30:00Z',
      seo_title: 'Cattle Feed Management and Nutrition Guide',
      seo_description: 'Learn proper feed management and nutrition for cattle. Expert advice for healthy livestock and improved productivity.',
      reading_time: 11
    }
  ];

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/blog/posts`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.posts || []);
      } else {
        // Use mock data if API fails
        setArticles(mockArticles);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      // Use mock data as fallback
      setArticles(mockArticles);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.published_at) - new Date(a.published_at);
      case 'oldest':
        return new Date(a.published_at) - new Date(b.published_at);
      case 'popular':
        return b.views - a.views;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const categories = [...new Set(articles.map(article => article.category))];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Header />
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">StockLot Blog</h1>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Expert insights, farming tips, and industry news for livestock farmers and traders
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <BookOpen className="h-4 w-4 mr-2" />
              {sortedArticles.length} articles found
            </div>
          </div>
        </div>

        {/* Featured Article */}
        {sortedArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-emerald-600" />
              Featured Article
            </h2>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-md">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={sortedArticles[0].featured_image} 
                    alt={sortedArticles[0].title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      {sortedArticles[0].category}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(sortedArticles[0].published_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="h-4 w-4 mr-1" />
                      {sortedArticles[0].views.toLocaleString()} views
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {sortedArticles[0].title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {sortedArticles[0].excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      {sortedArticles[0].author}
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-1" />
                      {sortedArticles[0].reading_time} min read
                    </div>
                    
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Read More
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedArticles.slice(1).map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:scale-105">
              <div className="relative">
                <img 
                  src={article.featured_image} 
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-gray-800 hover:bg-white/90">
                    {article.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(article.published_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {article.views.toLocaleString()}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-emerald-600 transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  {article.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    {article.author}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {article.reading_time} min
                  </div>
                </div>
                
                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
                  Read Article
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Articles Found */}
        {sortedArticles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Stay Updated with StockLot</h3>
          <p className="text-emerald-100 mb-6">Get the latest farming insights and market updates delivered to your inbox</p>
          <div className="flex max-w-md mx-auto gap-4">
            <Input 
              placeholder="Enter your email" 
              className="bg-white/10 border-white/20 placeholder:text-white/70 text-white"
            />
            <Button className="bg-white text-emerald-600 hover:bg-white/90 px-8">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogList;