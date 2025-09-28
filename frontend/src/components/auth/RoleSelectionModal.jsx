import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  Alert,
  AlertDescription,
} from '../ui';
import { 
  ShoppingCart, 
  Store, 
  AlertCircle, 
  CheckCircle,
  User,
  Building
} from 'lucide-react';
import { useSocialAuth } from '../../hooks/useSocialAuth';

const RoleSelectionModal = ({ open, onClose, onComplete, userInfo }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const { updateUserRole, loading, error } = useSocialAuth();

  const roles = [
    {
      id: 'buyer',
      title: 'Buyer',
      description: 'I want to buy livestock',
      details: 'Purchase cattle, poultry, goats, and other livestock from verified sellers',
      icon: ShoppingCart,
      color: 'blue',
      benefits: [
        'Browse all available livestock',
        'Access to verified sellers',
        'Secure escrow payments',
        'Quality guaranteed animals'
      ]
    },
    {
      id: 'seller',
      title: 'Seller',
      description: 'I want to sell livestock',
      details: 'Sell your livestock to buyers across South Africa',
      icon: Store,
      color: 'green',
      benefits: [
        'List your livestock for sale',
        'Reach thousands of buyers',
        'Secure payment processing',
        'Build your seller reputation'
      ]
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleComplete = async () => {
    if (!selectedRole) return;

    const result = await updateUserRole(selectedRole);
    
    if (result.success) {
      onComplete({
        ...userInfo,
        role: selectedRole
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <User className="h-6 w-6" />
            Welcome to StockLot!
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Hi {userInfo?.full_name}! To get started, please tell us what you'd like to do on our platform.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? `ring-2 ring-${role.color}-500 border-${role.color}-200 bg-${role.color}-50`
                      : 'hover:shadow-md border-gray-200'
                  }`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        isSelected 
                          ? `bg-${role.color}-100 text-${role.color}-600`
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{role.title}</h3>
                          {isSelected && (
                            <CheckCircle className={`h-5 w-5 text-${role.color}-600`} />
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{role.description}</p>
                        <p className="text-sm text-gray-500 mb-4">{role.details}</p>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">What you can do:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {role.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? `bg-${role.color}-500` : 'bg-gray-400'
                                }`} />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Building className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Can I do both?</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Yes! You can change your role or add the other role later from your profile settings. 
                  This selection just helps us personalize your experience.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleComplete}
              disabled={!selectedRole || loading}
              className={`${
                selectedRole 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-gray-300'
              }`}
            >
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionModal;