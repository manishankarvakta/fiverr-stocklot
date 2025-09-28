import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { toast } from '../ui/toast';
import { Loader2, Mail, Eye, Save, FileText, Sparkles } from 'lucide-react';

const AdminNotificationTemplates = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [previewing, setPreviewing] = useState('');
  const [activeTab, setActiveTab] = useState('buy_request.posted');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const [templates, setTemplates] = useState({
    'buy_request.posted': {
      key: 'buy_request.posted',
      subject: '',
      html: '',
      text: '',
    },
    'listing.posted': {
      key: 'listing.posted', 
      subject: '',
      html: '',
      text: '',
    }
  });

  const templateKeys = ['buy_request.posted', 'listing.posted'];
  
  const templateLabels = {
    'buy_request.posted': 'Buy Request Posted',
    'listing.posted': 'Listing Posted'
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load templates');
      
      const data = await response.json();
      
      // Convert array to object indexed by key
      const templateMap = {};
      data.forEach(template => {
        templateMap[template.key] = template;
      });
      
      // Merge with defaults
      setTemplates(prev => ({
        ...prev,
        ...templateMap
      }));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load notification templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (key) => {
    setSaving(key);
    try {
      const template = templates[key];
      
      const response = await fetch(`/api/admin/templates/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });

      if (!response.ok) throw new Error('Failed to save template');

      toast({
        title: "Success",
        description: "Template saved successfully",
      });
      
      // Reload templates to get updated data
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving('');
    }
  };

  const previewTemplate = async (key) => {
    setPreviewing(key);
    try {
      const template = templates[key];
      
      const samplePayload = {
        species: 'Cattle',
        province: 'Gauteng', 
        title: key.includes('buy_request') ? '100 Weaner Calves Needed' : 'Angus Heifers x10 Available',
        url: key.includes('buy_request') ? '/buy-requests/123' : '/listing/456'
      };

      const response = await fetch(`/api/admin/templates/${encodeURIComponent(key)}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject: template.subject,
          html: template.html,
          text: template.text,
          payload: samplePayload
        })
      });

      if (!response.ok) throw new Error('Preview failed');

      const result = await response.json();
      setPreviewHtml(result.html || template.html);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: "Error",
        description: "Failed to preview template",
        variant: "destructive",
      });
    } finally {
      setPreviewing('');
    }
  };

  const updateTemplate = (key, field, value) => {
    setTemplates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Notification Templates</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          {templateKeys.map(key => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {templateLabels[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {templateKeys.map(key => {
          const template = templates[key] || { key, subject: '', html: '', text: '' };
          
          return (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Template Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Edit Template</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewTemplate(key)}
                          disabled={previewing === key}
                        >
                          {previewing === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveTemplate(key)}
                          disabled={saving === key}
                        >
                          {saving === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject Line</Label>
                      <Input
                        value={template.subject}
                        onChange={(e) => updateTemplate(key, 'subject', e.target.value)}
                        placeholder="Email subject (supports {{variables}})"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>HTML Template</Label>
                      <Textarea
                        rows={12}
                        value={template.html}
                        onChange={(e) => updateTemplate(key, 'html', e.target.value)}
                        placeholder="HTML email template (supports {{variables}})"
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Text Template</Label>
                      <Textarea
                        rows={8}
                        value={template.text}
                        onChange={(e) => updateTemplate(key, 'text', e.target.value)}
                        placeholder="Plain text version (supports {{variables}})"
                        className="font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Variables & Preview */}
                <div className="space-y-6">
                  {/* Available Variables */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Available Variables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <p className="font-medium">Use these variables in your templates:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li><code className="bg-muted px-1 rounded">{'{{species}}'}</code> - Animal species (e.g., Cattle)</li>
                          <li><code className="bg-muted px-1 rounded">{'{{province}}'}</code> - Location (e.g., Gauteng)</li>
                          <li><code className="bg-muted px-1 rounded">{'{{title}}'}</code> - Request/listing title</li>
                          <li><code className="bg-muted px-1 rounded">{'{{url}}'}</code> - Link to view details</li>
                          {key.includes('buy_request') && (
                            <li><code className="bg-muted px-1 rounded">{'{{quantity}}'}</code> - Requested quantity</li>
                          )}
                          {key.includes('listing') && (
                            <li><code className="bg-muted px-1 rounded">{'{{price}}'}</code> - Listing price</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Preview */}
                  {showPreview && previewHtml && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Live Preview</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowPreview(false)}
                          >
                            ✕
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <div 
                            className="p-4 max-h-96 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminNotificationTemplates;