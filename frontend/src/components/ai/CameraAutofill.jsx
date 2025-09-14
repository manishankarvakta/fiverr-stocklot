// Camera Autofill Component for AI-Powered Livestock Listing
import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Zap, Brain, TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthProvider';

const CameraAutofill = ({ 
  province, 
  hints = {}, 
  onApply, 
  disabled = false 
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (8MB limit)
    if (selectedFile.size > 8 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be smaller than 8MB",
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
    
    // Clear previous results
    setResult(null);
  }, [toast]);

  const handleCameraCapture = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile);
  };

  const simulateProgress = useCallback(() => {
    const steps = [
      { progress: 20, message: "🤖 Initializing AI analysis..." },
      { progress: 40, message: "👁️ Analyzing livestock image..." },
      { progress: 60, message: "🔍 Identifying species and breed..." },
      { progress: 80, message: "💰 Calculating pricing guidance..." },
      { progress: 95, message: "✨ Polishing listing content..." },
      { progress: 100, message: "✅ Analysis complete!" }
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setAnalysisProgress(step.progress);
        setCurrentStep(step.message);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    
    return interval;
  }, []);

  const analyzeImage = async () => {
    if (!file) {
      toast({
        title: "No Image Selected",
        description: "Please select or capture an image first",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep("🚀 Starting AI analysis...");
    
    // Start progress simulation
    const progressInterval = simulateProgress();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (province) formData.append('province', province);
      if (hints && Object.keys(hints).length > 0) {
        formData.append('hints', JSON.stringify(hints));
      }
      
      const response = await fetch(`${API_BASE}/api/ai/listing-suggest`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setCurrentStep("🎉 Analysis successful!");
        
        toast({
          title: "AI Analysis Complete!",
          description: "Livestock information extracted successfully",
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('AI analysis error:', error);
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setCurrentStep("");
      
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        setAnalysisProgress(0);
        setCurrentStep("");
      }, 3000);
    }
  };

  const applyResults = () => {
    if (!result || !onApply) return;
    
    const fields = result.fields || {};
    const pricing = result.pricing;
    
    // Apply AI suggestions to form
    onApply({
      // Basic livestock info
      species: fields.species?.value || '',
      breed: fields.breed?.value || '',
      age_class: fields.age_class?.value || '',
      sex: fields.sex?.value || '',
      quantity: fields.quantity?.value || 1,
      weight_est_kg: fields.weight_est_kg?.value || '',
      
      // Listing content
      title: fields.title?.value || '',
      description: fields.description?.value || '',
      
      // Pricing guidance
      pricing_guidance: pricing ? {
        p25: pricing.p25,
        median: pricing.median,
        p75: pricing.p75,
        note: pricing.note
      } : null,
      
      // AI metadata
      ai_analyzed: true,
      ai_confidence_scores: Object.fromEntries(
        Object.entries(fields).map(([key, data]) => [key, data.confidence])
      ),
      analyzed_image_url: result.image_url
    });
    
    // Store feedback for learning
    if (result.suggestion_id && currentUser) {
      storeFeedback(result.suggestion_id, fields);
    }
    
    toast({
      title: "AI Suggestions Applied!",
      description: "Form has been populated with AI analysis",
    });
    
    // Clear the analysis result
    setResult(null);
    setFile(null);
    setPreview('');
  };

  const storeFeedback = async (suggestionId, acceptedFields) => {
    try {
      await fetch(`${API_BASE}/api/ai/listing-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          suggestion_id: suggestionId,
          accepted_fields: acceptedFields,
          rejected_fields: {}
        })
      });
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  };

  const discardResults = () => {
    setResult(null);
    
    toast({
      title: "Results Discarded",
      description: "AI analysis results have been cleared",
    });
  };

  const resetCapture = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setAnalysisProgress(0);
    setCurrentStep('');
  };

  const getConfidenceBadgeColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatPricing = (amount) => {
    if (!amount) return 'N/A';
    return `R${amount.toLocaleString()}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>🤖 AI Camera Autofill</span>
          <Badge variant="outline" className="ml-2">
            Beta
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Capture or upload livestock photos for instant listing generation
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image Capture/Upload Section */}
        {!preview && (
          <div className="grid gap-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || isAnalyzing}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isAnalyzing}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>
            
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview Section */}
        {preview && (
          <div className="space-y-3">
            <div className="relative">
              <img 
                src={preview} 
                alt="Livestock preview" 
                className="w-full h-64 object-cover rounded-lg border"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={resetCapture}
                className="absolute top-2 right-2"
                disabled={isAnalyzing}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            {!isAnalyzing && !result && (
              <Button
                onClick={analyzeImage}
                disabled={disabled}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Analyze with AI
              </Button>
            )}
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Analysis Progress</span>
                <span className="text-sm text-gray-500">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
            
            {currentStep && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{currentStep}</span>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Results */}
        {result && result.fields && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-700">🎉 AI Analysis Results</h4>
              <Badge className="bg-green-100 text-green-800">
                Analysis Complete
              </Badge>
            </div>
            
            {/* Field Results */}
            <div className="grid gap-3">
              {[
                { key: 'species', label: '🐄 Species' },
                { key: 'breed', label: '🧬 Breed' },
                { key: 'age_class', label: '⏳ Age Class' },
                { key: 'sex', label: '♂♀ Sex' },
                { key: 'quantity', label: '🔢 Quantity' },
                { key: 'weight_est_kg', label: '⚖️ Est. Weight (kg)' },
                { key: 'title', label: '📝 Title' },
              ].map(({ key, label }) => {
                const field = result.fields[key];
                if (!field?.value) return null;
                
                const confidence = Math.round((field.confidence || 0) * 100);
                
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-gray-700">
                        {key === 'title' ? (
                          <span className="line-clamp-2">{field.value}</span>
                        ) : (
                          <span>{field.value}</span>
                        )}
                      </div>
                    </div>
                    <Badge className={getConfidenceBadgeColor(field.confidence)}>
                      {confidence}%
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Description Preview */}
            {result.fields.description?.value && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-sm mb-2">📄 AI-Generated Description</div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {result.fields.description.value}
                </p>
              </div>
            )}

            {/* Pricing Guidance */}
            {result.pricing && result.pricing.count > 0 && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800">💰 Market Pricing Guidance</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Low</div>
                    <div className="font-bold text-emerald-700">{formatPricing(result.pricing.p25)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Market</div>
                    <div className="font-bold text-emerald-700">{formatPricing(result.pricing.median)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">High</div>
                    <div className="font-bold text-emerald-700">{formatPricing(result.pricing.p75)}</div>
                  </div>
                </div>
                
                <p className="text-xs text-emerald-600">{result.pricing.note}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={discardResults}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Discard
              </Button>
              
              <Button
                onClick={applyResults}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Use AI Suggestions
              </Button>
            </div>
          </div>
        )}

        {/* Error States */}
        {result && !result.success && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Analysis Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {result.error || 'Unable to analyze image. Please try again.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CameraAutofill;