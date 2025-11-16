import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { User } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-emerald-900 mb-8">Profile</h1>
          <Card className="border-emerald-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <User className="h-12 w-12 text-emerald-600" />
                <div>
                  <h2 className="text-2xl font-semibold text-emerald-900">
                    {user?.full_name || user?.email || 'User'}
                  </h2>
                  <p className="text-emerald-700">{user?.email}</p>
                </div>
              </div>
              <p className="text-emerald-700 mb-6">
                Profile management functionality. Please use the main App.js version for full features.
              </p>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

