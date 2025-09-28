import React from 'react';

const CertificateBadge = ({ label, status, url, expiresAt }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NA':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'PENDING':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'EXPIRED':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const badge = (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {label}: {status}
    </span>
  );

  if (url && status === 'VERIFIED') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
        {badge}
      </a>
    );
  }

  return badge;
};

const Certificates = ({ certs }) => {
  if (!certs) return null;

  const certificates = [];
  
  if (certs.vet) {
    certificates.push(
      <CertificateBadge 
        key="vet"
        label="Veterinary"
        status={certs.vet.status}
        url={certs.vet.url}
        expiresAt={certs.vet.expires_at}
      />
    );
  }

  if (certs.movement) {
    certificates.push(
      <CertificateBadge 
        key="movement"
        label="Movement Permit"
        status={certs.movement.status}
        url={certs.movement.url}
        expiresAt={certs.movement.expires_at}
      />
    );
  }

  if (certs.halal) {
    certificates.push(
      <CertificateBadge 
        key="halal"
        label="Halal"
        status={certs.halal.status}
        url={certs.halal.url}
        expiresAt={certs.halal.expires_at}
      />
    );
  }

  if (certificates.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Certificates & Documentation</h3>
      <div className="flex flex-wrap gap-2">
        {certificates}
      </div>
    </div>
  );
};

export default Certificates;