import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge, 
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  Save, Eye, Calendar, Image, Tag, Settings, Upload, Link2, 
  Bold, Italic, List, Quote, Code, Heading1, Heading2, Heading3,
  Undo, Redo, FileText, Globe, Clock, User, Sparkles, Wand2
} from 'lucide-react';

// Import auth context
const AuthContext = React.createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BlogEditor = ({ articleId, onSave, onCancel }) => {
  const user = useContext(AuthContext); // Get user from context
  
  const [article, setArticle] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featured_image: '',
    status: 'draft',
    author: '',
    seo_title: '',
    seo_description: '',
    scheduled_date: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Available categories
  const categories = [
    'Cattle', 'Poultry', 'Sheep & Goats', 'Market Analysis', 
    'Sustainability', 'Business', 'Health & Nutrition', 'Technology'
  ];

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
    
    // Auto-save functionality
    const autoSaveInterval = setInterval(() => {
      if (unsavedChanges) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [articleId, unsavedChanges]);

  useEffect(() => {
    // Generate slug from title
    if (article.title && !articleId) {
      const slug = article.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      setArticle(prev => ({ ...prev, slug }));
    }
  }, [article.title, articleId]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/blog/posts/${articleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setArticle(data.article);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setArticle(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleAutoSave = async () => {
    if (!article.title || !article.content) return;
    
    try {
      const response = await fetch(`${API}/admin/blog/posts/${articleId || 'new'}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(article)
      });
      
      if (response.ok) {
        setUnsavedChanges(false);
        console.log('Auto-saved successfully');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    try {
      const articleData = { ...article, status };
      
      // Choose endpoint based on whether user is admin
      const endpoint = user?.roles?.includes('admin') ? `${API}/admin/blog/posts` : `${API}/blog/posts`;
      
      const response = await fetch(endpoint, {
        method: 'POST', // Always POST for new articles
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(articleData)
      });

      if (response.ok) {
        const data = await response.json();
        setUnsavedChanges(false);
        onSave && onSave(data.post || data.article);
        
        // Show appropriate success message
        const message = data.message || `Article ${status === 'published' ? 'published' : 'saved'} successfully!`;
        alert(message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save article');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert(`Failed to save article: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !article.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...article.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleInputChange('tags', article.tags.filter(tag => tag !== tagToRemove));
  };

  const insertTextFormat = (format) => {
    const textarea = document.querySelector('textarea[name="content"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = article.content.substring(start, end);
    
    let newText;
    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'heading1':
        newText = `# ${selectedText}`;
        break;
      case 'heading2':
        newText = `## ${selectedText}`;
        break;
      case 'heading3':
        newText = `### ${selectedText}`;
        break;
      case 'quote':
        newText = `> ${selectedText}`;
        break;
      case 'code':
        newText = `\`${selectedText}\``;
        break;
      case 'list':
        newText = `- ${selectedText}`;
        break;
      default:
        newText = selectedText;
    }

    const newContent = article.content.substring(0, start) + newText + article.content.substring(end);
    handleInputChange('content', newContent);
  };

  // AI Content Generation Functions
  const generateAIContent = async (type, prompt) => {
    setAiGenerating(true);
    try {
      const response = await fetch(`${API}/ai/generate-blog-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          type, 
          prompt,
          category: article.category,
          context: {
            title: article.title,
            excerpt: article.excerpt,
            existing_content: article.content
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content;
      } else {
        throw new Error('Failed to generate AI content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate AI content. Please try again.');
      return null;
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAIGeneration = async (type) => {
    if (type === 'custom') {
      setShowAiDialog(true);
      return;
    }

    let prompt = '';
    let targetField = '';

    switch (type) {
      case 'title':
        prompt = `Generate a compelling blog post title about ${article.category || 'livestock farming'} that would attract readers interested in agriculture and livestock.`;
        targetField = 'title';
        break;
      case 'excerpt':
        prompt = `Generate a brief, engaging excerpt (2-3 sentences) for a blog post titled "${article.title}" about ${article.category || 'livestock farming'}.`;
        targetField = 'excerpt';
        break;
      case 'content':
        prompt = `Write a comprehensive blog post about "${article.title}" for livestock farmers. Include practical advice, industry insights, and actionable tips. Make it informative yet engaging.`;
        targetField = 'content';
        break;
      case 'seo_description':
        prompt = `Generate an SEO-optimized meta description (150-160 characters) for a blog post titled "${article.title}" about ${article.category || 'livestock farming'}.`;
        targetField = 'seo_description';
        break;
    }

    const generatedContent = await generateAIContent(type, prompt);
    if (generatedContent) {
      handleInputChange(targetField, generatedContent);
    }
  };

  const handleCustomAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt for AI generation');
      return;
    }

    const generatedContent = await generateAIContent('custom', aiPrompt);
    if (generatedContent) {
      // Append to existing content
      const newContent = article.content + '\n\n' + generatedContent;
      handleInputChange('content', newContent);
      setShowAiDialog(false);
      setAiPrompt('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-2">Loading article...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {articleId ? 'Edit Article' : 'Create New Article'}
          </h2>
          {unsavedChanges && (
            <p className="text-sm text-amber-600 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Unsaved changes
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSave('draft')} 
            disabled={saving}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => handleSave('published')} 
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Globe className="h-4 w-4 mr-2" />
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Title *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIGeneration('title')}
                    disabled={aiGenerating}
                    className="text-xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {aiGenerating ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <Input
                  id="title"
                  value={article.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter article title..."
                  className="text-lg font-semibold"
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={article.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="article-url-slug"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL: /blog/{article.slug}
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={article.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Brief description of the article..."
                  rows={3}
                />
              </div>

              {/* Content Editor Toolbar */}
              <div>
                <Label>Content *</Label>
                <div className="border rounded-t-md p-2 bg-gray-50 flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('bold')}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('italic')}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('heading1')}
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('heading2')}
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('heading3')}
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('quote')}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => insertTextFormat('code')}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMediaDialog(true)}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  name="content"
                  value={article.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Write your article content here... (Markdown supported)"
                  rows={20}
                  className="rounded-t-none border-t-0 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select 
                  value={article.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
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

              <div>
                <Label>Category</Label>
                <Select 
                  value={article.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Author</Label>
                <Input
                  value={article.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>

              {article.status === 'scheduled' && (
                <div>
                  <Label>Scheduled Date</Label>
                  <Input
                    type="datetime-local"
                    value={article.scheduled_date}
                    onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {article.featured_image && (
                <div className="relative">
                  <img 
                    src={article.featured_image} 
                    alt="Featured" 
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => handleInputChange('featured_image', '')}
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              <Input
                placeholder="Image URL"
                value={article.featured_image}
                onChange={(e) => handleInputChange('featured_image', e.target.value)}
              />
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowMediaDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={article.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="SEO optimized title"
                />
                <p className="text-xs text-gray-500">{article.seo_title.length}/60 characters</p>
              </div>

              <div>
                <Label>SEO Description</Label>
                <Textarea
                  value={article.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  placeholder="SEO meta description"
                  rows={3}
                />
                <p className="text-xs text-gray-500">{article.seo_description.length}/160 characters</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Article Preview</DialogTitle>
          </DialogHeader>
          
          <div className="prose max-w-none">
            <h1>{article.title}</h1>
            <div className="text-sm text-gray-500 mb-4">
              By {article.author} • {article.category} • {new Date().toLocaleDateString()}
            </div>
            {article.featured_image && (
              <img src={article.featured_image} alt="Featured" className="w-full h-64 object-cover rounded" />
            )}
            <p className="lead">{article.excerpt}</p>
            <div className="whitespace-pre-wrap">{article.content}</div>
            
            {article.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <strong>Tags: </strong>
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="mr-2">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Upload Dialog */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload images and media files for your article
            </DialogDescription>
          </DialogHeader>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
            <Button variant="outline">
              Choose Files
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMediaDialog(false)}>
              Cancel
            </Button>
            <Button>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogEditor;