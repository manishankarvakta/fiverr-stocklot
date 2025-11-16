import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Sparkles } from 'lucide-react';

function ExoticsPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-emerald-900 mb-4">Exotic Livestock</h1>
          <Card className="border-emerald-200">
            <CardContent className="p-12">
              <Sparkles className="h-16 w-16 text-emerald-600 mx-auto mb-6" />
              <p className="text-emerald-700 mb-6">
                Exotic livestock marketplace. Please use the main App.js version for full features.
              </p>
              <Button 
                onClick={() => navigate('/marketplace')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Back to Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ExoticsPage;

