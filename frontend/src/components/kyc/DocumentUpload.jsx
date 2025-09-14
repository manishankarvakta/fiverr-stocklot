import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Upload, 
  File, 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Camera,
  FileText,
  CreditCard,
  Home,
  Building
} from 'lucide-react';

const DocumentUpload = ({ documentType, onUploadComplete, maxFiles = 1, required = true }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const getDocumentInfo = (type) => {
    const docTypes = {
      'id_card': {
        title: 'National ID Card',
        icon: CreditCard,
        description: 'Clear photo of your South African ID card (front and back)',
        accept: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: '5MB'
      },
      'passport': {
        title: 'Passport',
        icon: FileText,
        description: 'Photo page of your valid passport',
        accept: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: '5MB'
      },
      'drivers_license': {
        title: 'Driver\'s License',
        icon: CreditCard,
        description: 'Clear photo of your driver\'s license (front and back)',
        accept: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: '5MB'
      },
      'utility_bill': {
        title: 'Utility Bill',
        icon: Home,
        description: 'Recent utility bill (water, electricity, or gas) - not older than 3 months',
        accept: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        maxSize: '10MB'
      },
      'bank_statement': {
        title: 'Bank Statement',
        icon: Building,
        description: 'Recent bank statement - not older than 3 months',
        accept: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        maxSize: '10MB'
      },
      'business_registration': {
        title: 'Business Registration',
        icon: Building,
        description: 'Certificate of incorporation or business registration document',
        accept: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        maxSize: '10MB'
      },
      'selfie_with_id': {
        title: 'Selfie with ID',
        icon: Camera,
        description: 'Clear selfie holding your ID card next to your face',
        accept: ['image/jpeg', 'image/png', 'image/jpg'],
        maxSize: '5MB'
      }
    };
    
    return docTypes[type] || {
      title: 'Document',
      icon: File,
      description: 'Upload your document',
      accept: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      maxSize: '10MB'
    };
  };

  const docInfo = getDocumentInfo(documentType);
  const DocIcon = docInfo.icon;

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setError(`File is too large. Maximum size is ${docInfo.maxSize}.`);
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload JPG, PNG, or PDF files only.');
      } else {
        setError('File rejected. Please check file requirements.');
      }
      return;
    }

    // Check file limit
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed.`);
      return;
    }

    // Add new files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'ready',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, docInfo.maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: docInfo.accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: docInfo.maxSize === '5MB' ? 5 * 1024 * 1024 : 10 * 1024 * 1024,
    maxFiles: maxFiles - files.length,
    disabled: uploading || files.length >= maxFiles
  });

  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URLs to prevent memory leaks
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile && removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
    setError('');
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('document_type', documentType);

        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading' } : f
        ));

        const response = await fetch('/api/kyc/upload-document', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Upload failed');
        }

        const result = await response.json();
        
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'completed', documentId: result.document_id } : f
        ));

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(documentType, files.length);
      }

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      // Mark files as failed
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'error' } : f
      ));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DocIcon className="h-5 w-5 mr-2 text-blue-500" />
          {docInfo.title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </CardTitle>
        <p className="text-sm text-gray-600">{docInfo.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {files.length < maxFiles && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Max {docInfo.maxSize} • {docInfo.accept.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Files:</h4>
            {files.map((fileData) => (
              <div key={fileData.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {fileData.preview ? (
                  <img 
                    src={fileData.preview} 
                    alt="Preview" 
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <File className="h-10 w-10 text-gray-400" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileData.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(fileData.size)}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {fileData.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {fileData.status === 'error' && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {fileData.status === 'ready' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading files...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        {files.length > 0 && files.some(f => f.status === 'ready') && (
          <Button 
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading... ({uploadProgress}%)
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.filter(f => f.status === 'ready').length} File{files.filter(f => f.status === 'ready').length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}

        {/* Upload Requirements */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>File must be clear and readable</li>
            <li>No screenshots or photocopies</li>
            <li>Document must be valid and not expired</li>
            <li>Personal information must be visible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;