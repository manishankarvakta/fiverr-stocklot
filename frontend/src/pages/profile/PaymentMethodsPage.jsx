import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { CreditCard } from 'lucide-react';

function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-emerald-900 mb-8">Payment Methods</h1>
          <Card className="border-emerald-200">
            <CardContent className="p-8">
              <CreditCard className="h-12 w-12 text-emerald-600 mb-6" />
              <p className="text-emerald-700 mb-6">
                Payment methods management. Please use the main App.js version for full features.
              </p>
              <Button 
                onClick={() => window.location.href = '/profile'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodsPage;

