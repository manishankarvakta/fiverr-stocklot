import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft,
  User,
  FileText,
  Camera,
  Building
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';

const KYCWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationLevel, setVerificationLevel] = useState('standard');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState({});

  const verificationLevels = {
    'basic': {
      title: 'Basic Verification',
      description: 'Email and phone verification only',
      icon: User,
      color: 'bg-green-100 text-green-800',
      steps: 1,
      documents: []
    },
    'standard': {
      title: 'Standard Verification',
      description: 'Government ID required',
      icon: FileText,
      color: 'bg-blue-100 text-blue-800',
      steps: 3,
      documents: ['id_card', 'passport', 'drivers_license'] // Choose one
    },
    'enhanced': {
      title: 'Enhanced Verification',
      description: 'ID + proof of address',
      icon: Shield,
      color: 'bg-purple-100 text-purple-800',
      steps: 4,
      documents: ['id_card', 'utility_bill', 'bank_statement']
    },
    'premium': {
      title: 'Premium Verification',
      description: 'Full verification with photo',
      icon: Camera,
      color: 'bg-orange-100 text-orange-800',
      steps: 5,
      documents: ['id_card', 'utility_bill', 'business_registration', 'selfie_with_id']
    }
  };

  const steps = [
    { id: 1, title: 'Choose Level', description: 'Select verification level' },
    { id: 2, title: 'Identity Document', description: 'Upload government ID' },
    { id: 3, title: 'Address Proof', description: 'Proof of residence' },
    { id: 4, title: 'Business Info', description: 'Business documents' },
    { id: 5, title: 'Photo Verification', description: 'Selfie with ID' },
    { id: 6, title: 'Review & Submit', description: 'Final review' }
  ];

  useEffect(() => {
    checkExistingVerification();
  }, []);

  const checkExistingVerification = async () => {
    try {
      const response = await fetch('/api/kyc/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.has_verification) {
          setVerificationStatus(data);
          if (data.current_status === 'approved') {
            setCurrentStep(7); // Show completion
          } else if (data.current_status === 'under_review') {
            setCurrentStep(6); // Show waiting
          }
        }
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  };

  const startVerification = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verification_level: verificationLevel
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Verification started successfully!');
        setCurrentStep(2);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start verification');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (docType, fileCount) => {
    setUploadedDocs(prev => ({
      ...prev,
      [docType]: fileCount
    }));
    setSuccess(`${docType.replace('_', ' ')} uploaded successfully!`);
  };

  const submitForReview = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('KYC verification submitted for review!');
        setCurrentStep(6);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to submit verification');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    const maxSteps = verificationLevels[verificationLevel].steps + 1;
    return Math.round((currentStep / maxSteps) * 100);
  };

  const canProceedToNextStep = () => {
    if (currentStep === 2) {
      // Check if identity document uploaded
      return uploadedDocs['id_card'] || uploadedDocs['passport'] || uploadedDocs['drivers_license'];
    }
    if (currentStep === 3) {
      // Check if address proof uploaded
      return uploadedDocs['utility_bill'] || uploadedDocs['bank_statement'];
    }
    if (currentStep === 4) {
      // Check if business doc uploaded (for enhanced/premium)
      return verificationLevel !== 'enhanced' && verificationLevel !== 'premium' 
        ? true 
        : uploadedDocs['business_registration'];
    }
    if (currentStep === 5) {
      // Check if selfie uploaded (for premium)
      return verificationLevel !== 'premium' ? true : uploadedDocs['selfie_with_id'];
    }
    return true;
  };

  const LevelIcon = verificationLevels[verificationLevel].icon;

  // Step 1: Choose Verification Level
  if (currentStep === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-gray-600 mt-2">Choose your verification level to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(verificationLevels).map(([level, info]) => {
            const IconComponent = info.icon;
            return (
              <Card 
                key={level}
                className={`cursor-pointer transition-all ${
                  verificationLevel === level 
                    ? 'ring-2 ring-blue-500 border-blue-500' 
                    : 'hover:border-gray-400'
                }`}
                onClick={() => setVerificationLevel(level)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-8 w-8 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{info.title}</CardTitle>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    <Badge className={info.color}>{level.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {level === 'basic' && (
                        <li>• Email verification only</li>
                      )}
                      {level === 'standard' && (
                        <>
                          <li>• Government-issued ID</li>
                          <li>• Basic identity verification</li>
                        </>
                      )}
                      {level === 'enhanced' && (
                        <>
                          <li>• Government-issued ID</li>
                          <li>• Proof of address</li>
                          <li>• Enhanced features access</li>
                        </>
                      )}
                      {level === 'premium' && (
                        <>
                          <li>• Government-issued ID</li>
                          <li>• Proof of address</li>
                          <li>• Business documentation</li>
                          <li>• Photo verification</li>
                          <li>• Maximum trading limits</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <Button 
            onClick={startVerification}
            disabled={loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Starting...' : `Start ${verificationLevels[verificationLevel].title}`}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Steps 2-5: Document Upload Steps
  if (currentStep >= 2 && currentStep <= 5) {
    const currentStepInfo = steps[currentStep - 1];
    const maxSteps = verificationLevels[verificationLevel].steps + 1;

    return (
      <div className="max-w-2xl mx-auto p-6">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <LevelIcon className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-bold">{verificationLevels[verificationLevel].title}</h1>
            </div>
            <Badge className={verificationLevels[verificationLevel].color}>
              Step {currentStep - 1} of {maxSteps - 1}
            </Badge>
          </div>
          
          <Progress value={getProgressPercentage()} className="mb-4" />
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">{currentStepInfo.title}</h2>
            <p className="text-gray-600">{currentStepInfo.description}</p>
          </div>
        </div>

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Document Upload Components */}
        <div className="space-y-6">
          {currentStep === 2 && (
            <div className="space-y-6">
              <DocumentUpload 
                documentType="id_card"
                onUploadComplete={handleDocumentUpload}
                required={true}
              />
              <div className="text-center text-sm text-gray-500">
                <p>OR upload one of these alternatives:</p>
              </div>
              <DocumentUpload 
                documentType="passport"
                onUploadComplete={handleDocumentUpload}
                required={false}
              />
              <DocumentUpload 
                documentType="drivers_license"
                onUploadComplete={handleDocumentUpload}
                required={false}
              />
            </div>
          )}

          {currentStep === 3 && verificationLevel !== 'standard' && (
            <div className="space-y-6">
              <DocumentUpload 
                documentType="utility_bill"
                onUploadComplete={handleDocumentUpload}
                required={true}
              />
              <div className="text-center text-sm text-gray-500">
                <p>OR</p>
              </div>
              <DocumentUpload 
                documentType="bank_statement"
                onUploadComplete={handleDocumentUpload}
                required={false}
              />
            </div>
          )}

          {currentStep === 4 && (verificationLevel === 'enhanced' || verificationLevel === 'premium') && (
            <DocumentUpload 
              documentType="business_registration"
              onUploadComplete={handleDocumentUpload}
              required={true}
            />
          )}

          {currentStep === 5 && verificationLevel === 'premium' && (
            <DocumentUpload 
              documentType="selfie_with_id"
              onUploadComplete={handleDocumentUpload}
              required={true}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={() => {
              const maxSteps = verificationLevels[verificationLevel].steps + 1;
              if (currentStep < maxSteps) {
                setCurrentStep(prev => prev + 1);
              }
            }}
            disabled={loading || !canProceedToNextStep()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === verificationLevels[verificationLevel].steps + 1 ? 'Review' : 'Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 6: Review and Submit
  if (currentStep === 6 && !verificationStatus?.current_status) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Review Your Submission</h1>
          <p className="text-gray-600 mt-2">Please review your documents before submitting</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verification Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Level:</strong> {verificationLevels[verificationLevel].title}
              </div>
              <div>
                <strong>Documents Uploaded:</strong>
                <ul className="mt-2 space-y-1">
                  {Object.entries(uploadedDocs).map(([docType, count]) => (
                    <li key={docType} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {docType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {count} file{count > 1 ? 's' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By submitting, you confirm that all documents are authentic and belong to you. 
              False information may result in account suspension.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              disabled={loading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>

            <Button
              onClick={submitForReview}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verification Status Display
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        {verificationStatus?.current_status === 'under_review' && (
          <>
            <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold">Under Review</h1>
            <p className="text-gray-600 mt-2">
              Your documents are being reviewed by our team. This typically takes 2-5 business days.
            </p>
          </>
        )}

        {verificationStatus?.current_status === 'approved' && (
          <>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600">Verification Approved!</h1>
            <p className="text-gray-600 mt-2">
              Congratulations! Your identity has been verified successfully.
            </p>
          </>
        )}

        {verificationStatus?.current_status === 'rejected' && (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-600">Action Required</h1>
            <p className="text-gray-600 mt-2">
              Additional information is needed to complete your verification.
            </p>
          </>
        )}
      </div>

      {verificationStatus && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Verification Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>ID:</strong> {verificationStatus.verification_id}</p>
              <p><strong>Level:</strong> {verificationStatus.verification_level}</p>
              <p><strong>Status:</strong> 
                <Badge className="ml-2" variant={
                  verificationStatus.current_status === 'approved' ? 'success' :
                  verificationStatus.current_status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {verificationStatus.current_status}
                </Badge>
              </p>
              {verificationStatus.reviewer_notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="mt-1 text-sm text-gray-600">{verificationStatus.reviewer_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KYCWizard;