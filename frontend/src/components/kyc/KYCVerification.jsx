import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Shield, Upload, CheckCircle, Clock, AlertTriangle,
  User, FileText, Camera, MapPin, Phone, Mail,
  Building, CreditCard, Award, Eye
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const KYCVerification = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState('not_started'); // not_started, pending, approved, rejected
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    id_number: '',
    date_of_birth: '',
    nationality: 'South African',
    
    // Address Information
    street_address: '',
    city: '',
    province: '',
    postal_code: '',
    
    // Contact Information
    phone_number: '',
    email: '',
    
    // Business Information (for sellers)
    business_name: '',
    business_registration: '',
    tax_number: '',
    business_type: 'individual',
    
    // Farm Information
    farm_name: '',
    farm_location: '',
    livestock_types: '',
    years_experience: '',
    
    // Additional Information
    purpose: 'livestock_trading',
    monthly_volume: '',
    source_of_funds: '',
    
    // Documents
    id_document: null,
    proof_of_address: null,
    bank_statement: null,
    business_license: null,
    farm_photos: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/kyc/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.status || 'not_started');
        if (data.form_data) {
          setFormData(prev => ({ ...prev, ...data.form_data }));
        }
      } else {
        console.error('Failed to fetch KYC status');
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [field]: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', field);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/kyc/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          [field]: data.file_url
        }));
        setUploadProgress(prev => ({ ...prev, [field]: 100 }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
      setUploadProgress(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const submitKYC = async () => {
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/kyc/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setKycStatus('pending');
        alert('KYC verification submitted successfully! We will review your information within 2-3 business days.');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('Failed to submit KYC verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = () => {
    switch (kycStatus) {
      case 'not_started':
        return {
          icon: <Shield className="h-8 w-8 text-gray-500" />,
          title: 'KYC Verification Required',
          description: 'Complete your identity verification to unlock full platform features',
          color: 'bg-gray-100 text-gray-800'
        };
      case 'pending':
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          title: 'Verification Pending',
          description: 'Your documents are under review. We\'ll notify you once complete.',
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Verification Complete',
          description: 'Your account is fully verified and ready for all features',
          color: 'bg-green-100 text-green-800'
        };
      case 'rejected':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          title: 'Verification Failed',
          description: 'Please review and resubmit your documents',
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <Shield className="h-8 w-8 text-gray-500" />,
          title: 'KYC Verification',
          description: 'Identity verification status unknown',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  if (!user) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access KYC verification.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading KYC status...</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  // If already approved, show status only
  if (kycStatus === 'approved') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">Verification Complete!</h2>
            <p className="text-green-700 mb-6">
              Your account is fully verified. You can now access all platform features including:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Higher transaction limits</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Premium seller features</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Bulk livestock trading</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Export/import capabilities</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Enhanced trust badge</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Priority customer support</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If pending, show status info
  if (kycStatus === 'pending') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-12">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">Verification Under Review</h2>
            <p className="text-yellow-700 mb-6">
              Thank you for submitting your KYC documents. Our team is reviewing your information.
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-yellow-900 mb-2">What happens next?</h3>
              <ul className="space-y-1 text-yellow-800 text-sm">
                <li>• Our compliance team will review your documents within 2-3 business days</li>
                <li>• You'll receive an email notification once the review is complete</li>
                <li>• If additional information is needed, we'll contact you directly</li>
                <li>• Once approved, you'll gain access to all premium features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show KYC form for not_started or rejected status
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {statusInfo.icon}
        </div>
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">{statusInfo.title}</h1>
        <p className="text-emerald-700">{statusInfo.description}</p>
        <Badge className={statusInfo.color + " mt-2"}>
          {kycStatus.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* KYC Benefits */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="text-emerald-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Benefits of KYC Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-semibold text-emerald-900">Enhanced Security</h4>
              <p className="text-emerald-700">Verified accounts provide additional trust and security</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-semibold text-emerald-900">Higher Limits</h4>
              <p className="text-emerald-700">Access higher transaction and trading limits</p>
            </div>
            <div className="text-center">
              <Award className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-semibold text-emerald-900">Premium Features</h4>
              <p className="text-emerald-700">Unlock advanced seller tools and analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Form */}
      <form onSubmit={(e) => { e.preventDefault(); submitKYC(); }} className="space-y-6">
        {/* Personal Information */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-emerald-700">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="John van der Merwe"
                  className="border-emerald-200"
                  required
                />
              </div>
              <div>
                <Label className="text-emerald-700">ID Number *</Label>
                <Input
                  value={formData.id_number}
                  onChange={(e) => handleInputChange('id_number', e.target.value)}
                  placeholder="9001015800080"
                  className="border-emerald-200"
                  required
                />
              </div>
              <div>
                <Label className="text-emerald-700">Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="border-emerald-200"
                  required
                />
              </div>
              <div>
                <Label className="text-emerald-700">Nationality</Label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                >
                  <option value="South African">South African</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Address Information */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Contact & Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-emerald-700">Phone Number *</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+27 12 345 6789"
                  className="border-emerald-200"
                  required
                />
              </div>
              <div>
                <Label className="text-emerald-700">Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="border-emerald-200"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-emerald-700">Street Address *</Label>
                <Input
                  value={formData.street_address}
                  onChange={(e) => handleInputChange('street_address', e.target.value)}
                  placeholder="123 Farm Road, Rural Area"
                  className="border-emerald-200"
                  required
                />
              </div>
              <div>
                <Label className="text-emerald-700">City *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Potchefstroom"
                  className="border-emerald-200"
                  required
                />
              </div>
              <div>
                <Label className="text-emerald-700">Province *</Label>
                <select
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                  required
                >
                  <option value="">Select Province</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="North West">North West</option>
                  <option value="Free State">Free State</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-emerald-700">ID Document (front & back) *</Label>
                <div className="mt-2 border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('id_document', e.target.files[0])}
                    className="hidden"
                    id="id_document"
                  />
                  <label htmlFor="id_document" className="cursor-pointer text-emerald-700 hover:text-emerald-800">
                    Click to upload ID document
                  </label>
                  {uploadProgress.id_document !== undefined && (
                    <div className="mt-2 text-sm text-emerald-600">
                      {uploadProgress.id_document === 100 ? 'Uploaded!' : `Uploading... ${uploadProgress.id_document}%`}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-emerald-700">Proof of Address *</Label>
                <div className="mt-2 border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload('proof_of_address', e.target.files[0])}
                    className="hidden"
                    id="proof_of_address"
                  />
                  <label htmlFor="proof_of_address" className="cursor-pointer text-emerald-700 hover:text-emerald-800">
                    Click to upload proof of address
                  </label>
                  {uploadProgress.proof_of_address !== undefined && (
                    <div className="mt-2 text-sm text-emerald-600">
                      {uploadProgress.proof_of_address === 100 ? 'Uploaded!' : `Uploading... ${uploadProgress.proof_of_address}%`}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-emerald-600">
              Accepted formats: JPG, PNG, PDF. Maximum file size: 10MB per document.
            </p>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="text-center">
          <Button
            type="submit"
            disabled={submitting || !formData.full_name || !formData.id_number || !formData.email}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
          >
            {submitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting for Review...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Submit for Verification
              </>
            )}
          </Button>
          
          <p className="text-xs text-emerald-600 mt-2">
            By submitting, you agree to our privacy policy and terms of service.
          </p>
        </div>
      </form>
    </div>
  );
};

export default KYCVerification;