/**
 * File Upload Utility
 * Handles file uploads with proper authentication and error handling
 */

export const uploadFile = async (endpoint, file, additionalData = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `HTTP ${response.status}: Upload failed`);
    }

    return await response.json();
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

export const uploadMultipleFiles = async (endpoint, files, fileFieldName = 'files', additionalData = {}) => {
  try {
    const formData = new FormData();
    
    // Add files
    if (Array.isArray(files)) {
      files.forEach(file => formData.append(fileFieldName, file));
    } else {
      formData.append(fileFieldName, files);
    }
    
    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || `HTTP ${response.status}: Upload failed`);
    }

    return await response.json();
  } catch (error) {
    console.error('Multiple files upload error:', error);
    throw error;
  }
};

export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }
};

export const validateImageFile = (file, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']) => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
};

export const validateDocumentFile = (file, allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']) => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
};