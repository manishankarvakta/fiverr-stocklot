import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { 
  Shield, 
  Smartphone, 
  Key, 
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';

const TwoFactorLogin = ({ onSuccess, onBack, userEmail }) => {
  const [activeTab, setActiveTab] = useState('authenticator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [authCode, setAuthCode] = useState('');
  const [backupCode, setBackupCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = activeTab === 'authenticator' 
        ? { token: authCode }
        : { backup_code: backupCode };

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setAuthCode(cleanValue);
    setError(''); // Clear error when user starts typing
  };

  const handleBackupCodeChange = (value) => {
    // Remove spaces and convert to uppercase
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    setBackupCode(cleanValue);
    setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
            <p className="text-gray-600">
              Complete login for <strong>{userEmail}</strong>
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="authenticator" className="flex items-center text-sm">
                  <Smartphone className="h-4 w-4 mr-1" />
                  Authenticator
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center text-sm">
                  <Key className="h-4 w-4 mr-1" />
                  Backup Code
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <TabsContent value="authenticator" className="space-y-4">
                  <div>
                    <Label htmlFor="authCode">Enter 6-digit code from your authenticator app:</Label>
                    <Input
                      id="authCode"
                      type="text"
                      value={authCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="000000"
                      className="text-center text-lg tracking-wider font-mono mt-1"
                      maxLength={6}
                      autoFocus
                      required={activeTab === 'authenticator'}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Open your authenticator app to get the current code
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="backup" className="space-y-4">
                  <div>
                    <Label htmlFor="backupCode">Enter one of your backup codes:</Label>
                    <Input
                      id="backupCode"
                      type="text"
                      value={backupCode}
                      onChange={(e) => handleBackupCodeChange(e.target.value)}
                      placeholder="XXXXXXXX"
                      className="text-center text-lg tracking-wider font-mono mt-1"
                      autoFocus={activeTab === 'backup'}
                      required={activeTab === 'backup'}
                    />
                    <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                      <div className="flex items-start">
                        <HelpCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-yellow-700">
                          <p className="font-medium">Can't access your authenticator app?</p>
                          <p>Use one of the backup codes you saved when setting up 2FA. Each code can only be used once.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading || 
                      (activeTab === 'authenticator' && authCode.length !== 6) ||
                      (activeTab === 'backup' && !backupCode)
                    }
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Complete Login
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={onBack}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Password
                    </Button>
                  </div>
                </div>
              </form>
            </Tabs>

            {/* Help Section */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Need help?</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Make sure your device's time is correct</p>
                <p>• Try refreshing your authenticator app</p>
                <p>• Use a backup code if you can't access your app</p>
                <p>• Contact support: <a href="mailto:security@stocklot.co.za" className="text-blue-600 hover:underline">security@stocklot.co.za</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorLogin;