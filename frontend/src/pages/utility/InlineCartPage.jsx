import React from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { ShoppingCart } from 'lucide-react';

function InlineCartPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="border-emerald-200 max-w-md">
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-16 w-16 text-emerald-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
          <p className="text-gray-600 mb-6">Your cart is empty</p>
          <Button 
            onClick={() => window.location.href = '/marketplace'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Browse Marketplace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default InlineCartPage;

