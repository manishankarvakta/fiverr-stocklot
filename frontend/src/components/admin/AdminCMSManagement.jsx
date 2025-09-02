import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  FileText, Image, Video, Globe, Edit, Trash2, Eye, Plus, RefreshCw,
  Calendar, User, Settings, Upload, Link, BookOpen, Newspaper
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminCMSManagement() {
  const [articles, setArticles] = useState([]);
  const [pages, setPages] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch articles
      const articlesResponse = await fetch(`${API}/admin/cms/articles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData.articles || []);
      }

      // Fetch pages
      const pagesResponse = await fetch(`${API}/admin/cms/pages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPages(pagesData.pages || []);
      }

      // Fetch media
      const mediaResponse = await fetch(`${API}/admin/cms/media`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        setMedia(mediaData.media || []);
      }
    } catch (error) {
      console.error('Error fetching CMS content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data for demo
  const mockArticles = [
    {
      id: 'article_1',
      title: 'Best Practices for Cattle Breeding in South Africa',
      slug: 'cattle-breeding-best-practices-sa',
      excerpt: 'Learn about the latest techniques and best practices for successful cattle breeding in the South African climate and conditions.',
      content: 'Full article content here...',
      status: 'published',
      author: 'Dr. Johan Pretorius',
      featured_image: '/images/cattle-breeding.jpg',
      category: 'Cattle',
      tags: ['breeding', 'cattle', 'south africa', 'farming'],
      views: 2847,
      published_at: '2025-08-25T10:00:00Z',
      created_at: '2025-08-20T14:30:00Z',
      updated_at: '2025-08-25T09:45:00Z',
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
      featured_image: '/images/poultry-health.jpg',
      category: 'Poultry',
      tags: ['poultry', 'disease prevention', 'health', 'chickens'],
      views: 1923,
      published_at: '2025-08-28T09:00:00Z',
      created_at: '2025-08-26T11:15:00Z',
      updated_at: '2025-08-28T08:30:00Z',
      seo_title: 'Poultry Disease Prevention Guide for Farmers',
      seo_description: 'Learn how to prevent diseases in poultry farming. Expert tips and strategies for healthy chicken farming.',
      reading_time: 6
    },
    {
      id: 'article_3',
      title: 'Market Trends: Livestock Prices Q3 2025',
      slug: 'livestock-market-trends-q3-2025',
      excerpt: 'Analysis of current livestock market trends and price predictions for the third quarter of 2025.',
      content: 'Full article content here...',
      status: 'draft',
      author: 'Michael Thompson',
      featured_image: '/images/market-trends.jpg',
      category: 'Market Analysis',
      tags: ['market trends', 'prices', 'livestock', '2025'],
      views: 0,
      published_at: null,
      created_at: '2025-08-29T13:20:00Z',
      updated_at: '2025-08-29T15:45:00Z',
      seo_title: 'Livestock Market Trends Q3 2025 - Price Analysis',
      seo_description: 'Latest livestock market trends and price analysis for Q3 2025. Expert insights for farmers and buyers.',
      reading_time: 12
    },
    {
      id: 'article_4',
      title: 'Sustainable Farming Practices for Small Holders',
      slug: 'sustainable-farming-small-holders',
      excerpt: 'How small-scale farmers can implement sustainable practices to improve productivity and environmental impact.',
      content: 'Full article content here...',
      status: 'scheduled',
      author: 'Emma van der Merwe',
      featured_image: '/images/sustainable-farming.jpg',
      category: 'Sustainability',
      tags: ['sustainable farming', 'small holders', 'environment', 'productivity'],
      views: 0,
      published_at: '2025-09-01T06:00:00Z',
      created_at: '2025-08-27T16:00:00Z',
      updated_at: '2025-08-29T10:15:00Z',
      seo_title: 'Sustainable Farming for Small Holders - Practical Guide',
      seo_description: 'Practical sustainable farming practices for small-scale farmers. Improve productivity while protecting the environment.',
      reading_time: 10
    }
  ];

  const mockPages = [
    {
      id: 'page_1',
      title: 'About StockLot',
      slug: 'about',
      content: 'About page content...',
      status: 'published',
      template: 'default',
      created_at: '2025-08-01T12:00:00Z',
      updated_at: '2025-08-15T14:30:00Z',
      seo_title: 'About StockLot - South Africa\'s Livestock Marketplace',
      seo_description: 'Learn about StockLot, the leading livestock marketplace connecting farmers, buyers, and sellers across South Africa.'
    },
    {
      id: 'page_2',
      title: 'Terms of Service',
      slug: 'terms',
      content: 'Terms of service content...',
      status: 'published',
      template: 'legal',
      created_at: '2025-08-01T12:00:00Z',
      updated_at: '2025-08-20T16:45:00Z',
      seo_title: 'Terms of Service - StockLot',
      seo_description: 'Terms of service and user agreement for StockLot livestock marketplace platform.'
    },
    {
      id: 'page_3',
      title: 'Privacy Policy',
      slug: 'privacy',
      content: 'Privacy policy content...',
      status: 'published',
      template: 'legal',
      created_at: '2025-08-01T12:00:00Z',
      updated_at: '2025-08-25T11:20:00Z',
      seo_title: 'Privacy Policy - StockLot',
      seo_description: 'Privacy policy and data protection information for StockLot users.'
    },
    {
      id: 'page_4',
      title: 'Seller Guide',
      slug: 'seller-guide',
      content: 'Comprehensive seller guide content...',
      status: 'draft',
      template: 'guide',
      created_at: '2025-08-28T09:30:00Z',
      updated_at: '2025-08-29T14:15:00Z',
      seo_title: 'Seller Guide - How to Sell Livestock on StockLot',
      seo_description: 'Complete guide for sellers on StockLot. Learn how to list livestock, manage sales, and maximize your profits.'
    }
  ];

  const mockMedia = [
    {
      id: 'media_1',
      filename: 'cattle-breeding.jpg',
      original_name: 'premium-cattle-breeding-facility.jpg',
      type: 'image',
      mime_type: 'image/jpeg',
      size: 245760,
      url: '/uploads/images/cattle-breeding.jpg',
      alt_text: 'Modern cattle breeding facility with premium livestock',
      caption: 'State-of-the-art cattle breeding facility',
      uploaded_by: 'Admin',
      uploaded_at: '2025-08-20T10:30:00Z',
      used_in: ['article_1', 'page_home']
    },
    {
      id: 'media_2',
      filename: 'poultry-health.jpg',
      original_name: 'healthy-chickens-farm.jpg',
      type: 'image',
      mime_type: 'image/jpeg',
      size: 189440,
      url: '/uploads/images/poultry-health.jpg',
      alt_text: 'Healthy chickens in free-range farming environment',
      caption: 'Free-range chickens in optimal health conditions',
      uploaded_by: 'Content Team',
      uploaded_at: '2025-08-26T15:20:00Z',
      used_in: ['article_2']
    },
    {
      id: 'media_3',
      filename: 'farming-video-guide.mp4',
      original_name: 'sustainable-farming-techniques.mp4',
      type: 'video',
      mime_type: 'video/mp4',
      size: 15728640,
      url: '/uploads/videos/farming-video-guide.mp4',
      alt_text: 'Video guide to sustainable farming techniques',
      caption: 'Complete video guide to sustainable farming practices',
      uploaded_by: 'Video Team',
      uploaded_at: '2025-08-27T11:45:00Z',
      used_in: ['article_4'],
      duration: '8:32'
    },
    {
      id: 'media_4',
      filename: 'market-chart.png',
      original_name: 'livestock-price-chart-q3.png',
      type: 'image',
      mime_type: 'image/png',
      size: 67200,
      url: '/uploads/images/market-chart.png',
      alt_text: 'Livestock price trends chart for Q3 2025',
      caption: 'Market analysis chart showing livestock price trends',
      uploaded_by: 'Analytics Team',
      uploaded_at: '2025-08-29T14:00:00Z',
      used_in: ['article_3']
    }
  ];

  const displayArticles = articles.length > 0 ? articles : mockArticles;
  const displayPages = pages.length > 0 ? pages : mockPages;
  const displayMedia = media.length > 0 ? media : mockMedia;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Content Management System</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Management System</h2>
          <p className="text-gray-600">Manage blog articles, pages, and media content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchContent}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 h-12 justify-start"
            onClick={() => window.location.href = '/admin/blog/create'}
          >
            <BookOpen className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Create Blog Article</div>
              <div className="text-xs opacity-90">Write and publish blog posts</div>
            </div>
          </Button>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 h-12 justify-start"
            onClick={() => setShowCreateDialog(true)}
          >
            <FileText className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Create Static Page</div>
              <div className="text-xs opacity-90">Add new pages to the site</div>
            </div>
          </Button>
          
          <Button 
            className="bg-purple-600 hover:bg-purple-700 h-12 justify-start"
            onClick={() => setShowCreateDialog(true)}
          >
            <Upload className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Upload Media</div>
              <div className="text-xs opacity-90">Images, videos, documents</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Published Articles</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayArticles.filter(a => a.status === 'published').length}
                </p>
              </div>
              <Newspaper className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pages</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayPages.length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Media Files</p>
                <p className="text-2xl font-bold text-purple-600">
                  {displayMedia.length}
                </p>
              </div>
              <Image className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {displayArticles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Blog Articles</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
          <TabsTrigger value="settings">CMS Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>Blog Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{article.title}</div>
                          <div className="text-sm text-gray-500">{article.excerpt.substring(0, 80)}...</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Reading time: {article.reading_time} min
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {article.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(article.status)}>
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{article.views.toLocaleString()}</TableCell>
                      <TableCell>
                        {article.published_at ? 
                          new Date(article.published_at).toLocaleDateString() : 
                          'Not published'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedContent(article); setShowContentDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Website Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="font-medium">{page.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link className="h-4 w-4" />
                          /{page.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{page.template}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(page.status)}>
                          {page.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(page.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedContent(page); setShowContentDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Media Library</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Used In</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMedia.map((mediaItem) => (
                    <TableRow key={mediaItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {mediaItem.type === 'image' ? (
                            <Image className="h-8 w-8 text-blue-500" />
                          ) : (
                            <Video className="h-8 w-8 text-purple-500" />
                          )}
                          <div>
                            <div className="font-medium">{mediaItem.filename}</div>
                            <div className="text-sm text-gray-500">{mediaItem.alt_text}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {mediaItem.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {mediaItem.type === 'video' && mediaItem.duration && (
                          <div className="text-sm text-gray-500">{mediaItem.duration}</div>
                        )}
                        <div className="text-sm">
                          {(mediaItem.size / 1024).toFixed(0)} KB
                        </div>
                      </TableCell>
                      <TableCell>{mediaItem.uploaded_by}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {mediaItem.used_in?.length || 0} references
                        </div>
                      </TableCell>
                      <TableCell>{new Date(mediaItem.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Author</Label>
                  <Input defaultValue="StockLot Editorial Team" />
                </div>
                <div>
                  <Label>Articles Per Page</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div>
                  <Label>Auto-Save Interval (minutes)</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div>
                  <Label>Default Article Status</Label>
                  <Select defaultValue="draft">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Site Meta Title</Label>
                  <Input defaultValue="StockLot - South Africa's Premier Livestock Marketplace" />
                </div>
                <div>
                  <Label>Site Meta Description</Label>
                  <Textarea defaultValue="Buy and sell livestock online in South Africa. Connect with farmers, breeders, and buyers on StockLot - the trusted livestock marketplace." />
                </div>
                <div>
                  <Label>Default Open Graph Image</Label>
                  <Input defaultValue="/images/stocklot-og-image.jpg" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <Label>Auto-generate article excerpts</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <Label>Enable XML sitemap generation</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Content Details Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
            <DialogDescription>
              Review content information and metadata
            </DialogDescription>
          </DialogHeader>
          
          {selectedContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm">{selectedContent.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Slug</Label>
                  <p className="text-sm">/{selectedContent.slug}</p>
                </div>
                {selectedContent.author && (
                  <div>
                    <Label className="text-sm font-medium">Author</Label>
                    <p className="text-sm">{selectedContent.author}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedContent.status)}>
                    {selectedContent.status}
                  </Badge>
                </div>
                {selectedContent.category && (
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedContent.category}</p>
                  </div>
                )}
                {selectedContent.views !== undefined && (
                  <div>
                    <Label className="text-sm font-medium">Views</Label>
                    <p className="text-sm font-semibold">{selectedContent.views.toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {selectedContent.excerpt && (
                <div>
                  <Label className="text-sm font-medium">Excerpt</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedContent.excerpt}</p>
                </div>
              )}

              {selectedContent.tags && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="space-y-1 mt-1">
                    {selectedContent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedContent.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedContent.updated_at).toLocaleString()}</p>
                </div>
                {selectedContent.published_at && (
                  <div>
                    <Label className="text-sm font-medium">Published</Label>
                    <p className="text-sm">{new Date(selectedContent.published_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedContent.reading_time && (
                  <div>
                    <Label className="text-sm font-medium">Reading Time</Label>
                    <p className="text-sm">{selectedContent.reading_time} minutes</p>
                  </div>
                )}
              </div>

              {selectedContent.seo_title && (
                <div>
                  <Label className="text-sm font-medium">SEO Title</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedContent.seo_title}</p>
                </div>
              )}

              {selectedContent.seo_description && (
                <div>
                  <Label className="text-sm font-medium">SEO Description</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedContent.seo_description}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContentDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              View Live
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Content Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
            <DialogDescription>
              Choose the type of content you want to create
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="cursor-pointer hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-blue-300 rounded-lg p-4 active:scale-95"
              onClick={() => {
                setShowCreateDialog(false);
                // Navigate to blog editor - use a more reliable navigation method
                setTimeout(() => {
                  window.location.replace('/admin/blog/create');
                }, 100);
              }}
            >
              <div className="text-center">
                <Newspaper className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2 text-gray-900">Blog Article</h3>
                <p className="text-sm text-gray-500">Create a new blog post or news article</p>
              </div>
            </div>

            <div 
              className="cursor-pointer hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-green-300 rounded-lg p-4 active:scale-95"
              onClick={() => {
                setShowCreateDialog(false);
                setTimeout(() => {
                  alert('🔧 Static Page Creation\n\nThis feature will be implemented in the next update. You will be able to:\n\n• Create custom pages\n• Design layouts\n• Add custom content\n• Manage navigation');
                }, 300);
              }}
            >
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2 text-gray-900">Static Page</h3>
                <p className="text-sm text-gray-500">Create a new website page</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}