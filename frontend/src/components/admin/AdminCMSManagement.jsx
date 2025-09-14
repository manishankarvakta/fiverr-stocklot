import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { BookOpen, Plus, Edit, Trash2, Eye, Search, Calendar, User, Filter } from 'lucide-react';

const AdminCMSManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'news',
    status: 'draft',
    featured: false,
    tags: []
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filters]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('q', filters.search);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/cms/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : data.posts || []);
      } else {
        console.error('Failed to load posts:', response.status);
        alert('Failed to load posts. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      alert('Error loading posts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/cms/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.id) {
          alert('Blog post created successfully!');
          setShowCreateDialog(false);
          setNewPost({
            title: '',
            content: '',
            excerpt: '',
            category: 'news',
            status: 'draft',
            featured: false,
            tags: []
          });
          loadPosts();
        } else {
          alert('Failed to create post: ' + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert('Failed to create post: ' + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostAction = async (postId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/cms/posts/${postId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`Post ${action} successful!`);
          loadPosts();
        } else {
          alert(`Failed to ${action} post: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} post: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} post:`, error);
      alert(`Error ${action} post: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'archived': return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog & Content</h2>
          <p className="text-gray-600">Manage blog posts and website content</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPosts} disabled={loading} variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            New Blog Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Posts</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or content..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-items">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-items">All Categories</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="guides">Guides</SelectItem>
                  <SelectItem value="health">Animal Health</SelectItem>
                  <SelectItem value="market">Market Insights</SelectItem>
                  <SelectItem value="features">Platform Features</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading blog posts...</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No blog posts found</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Blog Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{post.title}</h3>
                          <p className="text-sm text-gray-600">{post.excerpt || post.content?.substring(0, 150) + '...'}</p>
                        </div>
                        {getStatusBadge(post.status)}
                        <Badge variant="outline">{post.category || 'news'}</Badge>
                        {post.featured && <Badge className="bg-purple-100 text-purple-800">Featured</Badge>}
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {post.author_name || 'Unknown Author'}
                        </p>
                        <p className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                        <p className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.views || 0} views
                        </p>
                        <p>
                          Tags: {post.tags?.length > 0 ? post.tags.join(', ') : 'No tags'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPost(post);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {post.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handlePostAction(post.id, 'publish')}
                          disabled={actionLoading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {post.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 hover:text-yellow-700"
                          onClick={() => handlePostAction(post.id, 'unpublish')}
                          disabled={actionLoading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this blog post?')) {
                            handlePostAction(post.id, 'delete');
                          }
                        }}
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Blog Post Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Blog Post</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="Enter blog post title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Excerpt</label>
                <Textarea
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                  placeholder="Brief description or excerpt..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  placeholder="Write your blog content..."
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={newPost.category} onValueChange={(value) => setNewPost({...newPost, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News & Updates</SelectItem>
                      <SelectItem value="guides">Farming Guides</SelectItem>
                      <SelectItem value="health">Animal Health</SelectItem>
                      <SelectItem value="market">Market Insights</SelectItem>
                      <SelectItem value="features">Platform Features</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={newPost.status} onValueChange={(value) => setNewPost({...newPost, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePost}
                disabled={actionLoading || !newPost.title || !newPost.content}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCMSManagement;