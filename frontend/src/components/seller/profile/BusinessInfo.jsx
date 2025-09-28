import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building, FileText, Calendar, DollarSign, Scale, Users, Award } from 'lucide-react';

const BusinessInfo = () => {
  const { setHasUnsavedChanges } = useOutletContext();
  const [formData, setFormData] = useState({
    businessName: 'Heritage Livestock Farm',
    businessType: 'sole_proprietorship',
    registrationNumber: 'CK2019/123456/23',
    taxNumber: '9876543210',
    vatNumber: '4567890123',
    establishedYear: '2010',
    numberOfEmployees: '15',
    annualTurnover: '2500000',
    farmSize: '500',
    primaryActivities: ['cattle_breeding', 'poultry_farming'],
    certifications: ['red_meat_producer', 'organic_certified'],
    bankName: 'First National Bank',
    accountHolder: 'Heritage Livestock Farm',
    accountNumber: '1234567890',
    branchCode: '250655',
    businessDescription: 'A family-owned livestock farm specializing in high-quality cattle breeding and free-range poultry farming. We pride ourselves on sustainable farming practices and animal welfare.'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
    setHasUnsavedChanges(true);
  };

  const businessTypes = [
    { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_company', label: 'Private Company (Pty Ltd)' },
    { value: 'public_company', label: 'Public Company' },
    { value: 'cooperative', label: 'Cooperative' }
  ];

  const primaryActivitiesOptions = [
    { value: 'cattle_breeding', label: 'Cattle Breeding' },
    { value: 'dairy_farming', label: 'Dairy Farming' },
    { value: 'poultry_farming', label: 'Poultry Farming' },
    { value: 'pig_farming', label: 'Pig Farming' },
    { value: 'goat_farming', label: 'Goat Farming' },
    { value: 'sheep_farming', label: 'Sheep Farming' },
    { value: 'feed_production', label: 'Feed Production' },
    { value: 'livestock_trading', label: 'Livestock Trading' }
  ];

  const certificationsOptions = [
    { value: 'red_meat_producer', label: 'Red Meat Producer Organization' },
    { value: 'organic_certified', label: 'Organic Certification' },
    { value: 'iso_certified', label: 'ISO Certification' },
    { value: 'haccp', label: 'HACCP Certification' },
    { value: 'animal_welfare', label: 'Animal Welfare Approved' },
    { value: 'halal_certified', label: 'Halal Certification' }
  ];

  return (
    <div className="space-y-8">
      {/* Business Registration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Registration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="inline h-4 w-4 mr-2" />
              Business Name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {businessTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-2" />
              Registration Number
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Number
            </label>
            <input
              type="text"
              value={formData.taxNumber}
              onChange={(e) => handleInputChange('taxNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VAT Number
            </label>
            <input
              type="text"
              value={formData.vatNumber}
              onChange={(e) => handleInputChange('vatNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-2" />
              Year Established
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.establishedYear}
              onChange={(e) => handleInputChange('establishedYear', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-2" />
              Number of Employees
            </label>
            <select
              value={formData.numberOfEmployees}
              onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="1">1 (Just me)</option>
              <option value="2-5">2-5</option>
              <option value="6-10">6-10</option>
              <option value="11-25">11-25</option>
              <option value="26-50">26-50</option>
              <option value="50+">50+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline h-4 w-4 mr-2" />
              Annual Turnover (R)
            </label>
            <select
              value={formData.annualTurnover}
              onChange={(e) => handleInputChange('annualTurnover', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="0-100000">R0 - R100,000</option>
              <option value="100000-500000">R100,000 - R500,000</option>
              <option value="500000-1000000">R500,000 - R1,000,000</option>
              <option value="1000000-5000000">R1,000,000 - R5,000,000</option>
              <option value="5000000+">R5,000,000+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Scale className="inline h-4 w-4 mr-2" />
              Farm Size (Hectares)
            </label>
            <input
              type="number"
              value={formData.farmSize}
              onChange={(e) => handleInputChange('farmSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter farm size in hectares"
            />
          </div>
        </div>
      </div>

      {/* Primary Activities */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Activities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {primaryActivitiesOptions.map(activity => (
            <label key={activity.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.primaryActivities.includes(activity.value)}
                onChange={(e) => handleArrayChange('primaryActivities', activity.value, e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{activity.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <Award className="inline h-5 w-5 mr-2" />
          Certifications & Accreditations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificationsOptions.map(cert => (
            <label key={cert.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.certifications.includes(cert.value)}
                onChange={(e) => handleArrayChange('certifications', cert.value, e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{cert.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Banking Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Banking Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name *
            </label>
            <select
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="all-default">Select Bank</option>
              <option value="ABSA">ABSA</option>
              <option value="First National Bank">First National Bank</option>
              <option value="Nedbank">Nedbank</option>
              <option value="Standard Bank">Standard Bank</option>
              <option value="Capitec Bank">Capitec Bank</option>
              <option value="African Bank">African Bank</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={formData.accountHolder}
              onChange={(e) => handleInputChange('accountHolder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Code *
            </label>
            <input
              type="text"
              value={formData.branchCode}
              onChange={(e) => handleInputChange('branchCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Business Description */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Description</h3>
        <textarea
          value={formData.businessDescription}
          onChange={(e) => handleInputChange('businessDescription', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Describe your business, specializations, and what sets you apart..."
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.businessDescription.length}/1000 characters
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={() => {
            console.log('Saving business info:', formData);
            setHasUnsavedChanges(false);
          }}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Save Business Information
        </button>
      </div>
    </div>
  );
};

export default BusinessInfo;