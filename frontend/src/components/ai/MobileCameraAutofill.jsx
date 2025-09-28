// Mobile-Optimized Camera Autofill Component with Capacitor
import React, { useState, useCallback } from 'react';
import { Camera as CameraIcon, Upload, Zap, Brain, TrendingUp, CheckCircle, XCircle, Loader2, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/auth/AuthProvider';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource, ImageFormat } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const MobileCameraAutofill = ({ 
  province, 
  hints = {}, 
  onApply, 
  disabled = false 
}) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const isNative = Capacitor.isNativePlatform();

  const capturePhoto = useCallback(async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        format: ImageFormat.Jpeg,
        saveToGallery: true,
        correctOrientation: true,
        width: 1024,
        height: 1024
      });

      if (image.dataUrl) {
        setCapturedImage({
          dataUrl: image.dataUrl,
          format: image.format
        });
        setResult(null);
        
        toast({
          title: "Photo Captured!",
          description: "Ready for AI analysis",
        });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      
      if (error.message.includes('User cancelled')) {
        return; // User cancelled, don't show error
      }
      
      toast({
        title: "Camera Error",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const selectFromGallery = useCallback(async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        format: ImageFormat.Jpeg,
        correctOrientation: true,
        width: 1024,
        height: 1024
      });

      if (image.dataUrl) {
        setCapturedImage({
          dataUrl: image.dataUrl,
          format: image.format
        });
        setResult(null);
        
        toast({
          title: "Photo Selected!",
          description: "Ready for AI analysis",
        });
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      
      if (error.message.includes('User cancelled')) {
        return;
      }
      
      toast({
        title: "Gallery Error", 
        description: "Unable to select photo. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const simulateProgress = useCallback(() => {
    const steps = [
      { progress: 15, message: "📱 Optimizing mobile image..." },
      { progress: 30, message: "🤖 Initializing AI analysis..." },
      { progress: 50, message: "👁️ Analyzing livestock features..." },
      { progress: 70, message: "🔍 Identifying species and breed..." },
      { progress: 85, message: "💰 Calculating mobile-optimized pricing..." },
      { progress: 95, message: "✨ Finalizing mobile listing..." },
      { progress: 100, message: "✅ Mobile analysis complete!" }
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
    }, 600);
    
    return interval;
  }, []);

  const analyzeImage = async () => {
    if (!capturedImage?.dataUrl) {
      toast({
        title: "No Image Captured",
        description: "Please capture or select an image first",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep("🚀 Starting mobile AI analysis...");
    
    const progressInterval = simulateProgress();
    
    try {
      // Convert data URL to blob for mobile upload
      const response = await fetch(capturedImage.dataUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'mobile_capture.jpg');
      if (province) formData.append('province', province);
      if (hints && Object.keys(hints).length > 0) {
        formData.append('hints', JSON.stringify(hints));
      }
      
      const analysisResponse = await fetch(`${API_BASE}/api/ai/listing-suggest`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await analysisResponse.json();
      
      if (data.success) {
        setResult(data);
        setCurrentStep("🎉 Mobile analysis successful!");
        
        // Haptic feedback on native devices
        if (isNative) {
          const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
        
        toast({
          title: "🤖 AI Analysis Complete!",
          description: "Livestock information extracted successfully on mobile",
        });
      } else {
        throw new Error(data.error || 'Mobile analysis failed');
      }
      
    } catch (error) {
      console.error('Mobile AI analysis error:', error);
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setCurrentStep("");
      
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image on mobile. Please try again.",
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

  const applyResults = async () => {
    if (!result || !onApply) return;
    
    const fields = result.fields || {};
    const pricing = result.pricing;
    
    // Apply AI suggestions to form
    onApply({
      species: fields.species?.value || '',
      breed: fields.breed?.value || '',
      age_class: fields.age_class?.value || '',
      sex: fields.sex?.value || '',
      quantity: fields.quantity?.value || 1,
      weight_est_kg: fields.weight_est_kg?.value || '',
      title: fields.title?.value || '',
      description: fields.description?.value || '',
      pricing_guidance: pricing ? {
        p25: pricing.p25,
        median: pricing.median, 
        p75: pricing.p75,
        note: pricing.note
      } : null,
      ai_analyzed: true,
      ai_confidence_scores: Object.fromEntries(
        Object.entries(fields).map(([key, data]) => [key, data.confidence])
      ),
      analyzed_image_url: result.image_url
    });
    
    // Store feedback for learning
    if (result.suggestion_id && currentUser) {
      try {
        await fetch(`${API_BASE}/api/ai/listing-feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            suggestion_id: result.suggestion_id,
            accepted_fields: fields,
            rejected_fields: {},
            platform: 'mobile'
          })
        });
      } catch (error) {
        console.error('Error storing mobile feedback:', error);
      }
    }
    
    // Haptic feedback on success
    if (isNative) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    
    toast({
      title: "📱 Mobile AI Applied!",
      description: "Form populated with mobile AI analysis",
    });
    
    // Clear the analysis result
    setResult(null);
    setCapturedImage(null);
  };

  const discardResults = () => {
    setResult(null);
    toast({
      title: "Results Discarded",
      description: "AI analysis cleared on mobile",
    });
  };

  const resetCapture = () => {
    setCapturedImage(null);
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
          <span>📱 Mobile AI Camera</span>
          {isNative && (
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
              <Smartphone className="h-3 w-3 mr-1" />
              Native
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Capture livestock photos for instant mobile listing generation
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mobile Camera Capture Section */}
        {!capturedImage && (
          <div className="grid gap-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={capturePhoto}
                disabled={disabled || isAnalyzing}
                className="flex-1 h-12"
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                {isNative ? 'Native Camera' : 'Take Photo'}
              </Button>
              
              <Button
                variant="outline"
                onClick={selectFromGallery}
                disabled={disabled || isAnalyzing}
                className="flex-1 h-12"
              >
                <Upload className="h-5 w-5 mr-2" />
                {isNative ? 'Gallery' : 'Upload'}
              </Button>
            </div>
            
            {isNative && (
              <div className="text-center text-sm text-green-600 bg-green-50 p-2 rounded">
                📱 Using native mobile camera for best quality
              </div>
            )}
          </div>
        )}

        {/* Image Preview Section */}
        {capturedImage && (
          <div className="space-y-3">
            <div className="relative">
              <img 
                src={capturedImage.dataUrl} 
                alt="Captured livestock" 
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
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
              >
                <Zap className="h-5 w-5 mr-2" />
                📱 Analyze with Mobile AI
              </Button>
            )}
          </div>
        )}

        {/* Mobile Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">📱 Mobile AI Analysis</span>
                <span className="text-sm text-gray-500">{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full h-3" />
            </div>
            
            {currentStep && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{currentStep}</span>
              </div>
            )}
          </div>
        )}

        {/* Mobile AI Results */}
        {result && result.fields && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-green-700">📱 Mobile AI Results</h4>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            </div>
            
            {/* Compact Mobile Field Display */}
            <div className="space-y-2">
              {[
                { key: 'species', label: '🐄', name: 'Species' },
                { key: 'breed', label: '🧬', name: 'Breed' },
                { key: 'age_class', label: '⏳', name: 'Age' },
                { key: 'sex', label: '♂♀', name: 'Sex' },
                { key: 'quantity', label: '🔢', name: 'Qty' },
              ].map(({ key, label, name }) => {
                const field = result.fields[key];
                if (!field?.value) return null;
                
                const confidence = Math.round((field.confidence || 0) * 100);
                
                return (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{label}</span>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-gray-600">{field.value}</div>
                      </div>
                    </div>
                    <Badge className={getConfidenceBadgeColor(field.confidence)} size="sm">
                      {confidence}%
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Mobile Title Preview */}
            {result.fields.title?.value && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-sm mb-1">📝 Generated Title</div>
                <p className="text-sm text-gray-700">{result.fields.title.value}</p>
              </div>
            )}

            {/* Mobile Pricing Grid */}
            {result.pricing && result.pricing.count > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800 text-sm">💰 Mobile Pricing</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-600">Low</div>
                    <div className="font-bold text-emerald-700 text-sm">{formatPricing(result.pricing.p25)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Market</div>
                    <div className="font-bold text-emerald-700 text-sm">{formatPricing(result.pricing.median)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">High</div>
                    <div className="font-bold text-emerald-700 text-sm">{formatPricing(result.pricing.p75)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={discardResults}
                className="h-12"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Discard
              </Button>
              
              <Button
                onClick={applyResults}
                className="bg-emerald-600 hover:bg-emerald-700 h-12"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply AI
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileCameraAutofill;