import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  QrCode,
  Key
} from 'lucide-react';

const TwoFactorSetup = () => {
  const [step, setStep] = useState('check'); // check, setup, verify, complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Setup data
  const [setupData, setSetupData] = useState({
    secret_key: '',
    qr_code: '',
    backup_codes: [],
    app_name: '',
    username: ''
  });
  
  // Verification data
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/2fa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const status = await response.json();
        if (status.enabled) {
          setStep('complete');
          setSuccess('Two-factor authentication is already enabled for your account.');
        } else {
          setStep('setup');
        }
      } else {
        setError('Failed to check 2FA status. Please refresh the page.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setStep('verify');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to setup 2FA. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationCode || verificationCode.length !== 6) {
        setError('Please enter a valid 6-digit code.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: verificationCode
        })
      });

      if (response.ok) {
        setStep('complete');
        setSuccess('Two-factor authentication has been enabled successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else if (type === 'backup') {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const downloadBackupCodes = () => {
    const content = `StockLot 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backup_codes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stocklot-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && step === 'check') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking 2FA status...</span>
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <CardTitle>Enable Two-Factor Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🛡️ Enhanced Security</h3>
            <p className="text-blue-800 text-sm">
              Two-factor authentication adds an extra layer of security to your account. 
              You'll need your phone and a code from an authenticator app to log in.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">What you'll need:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-green-500" />
                A smartphone with an authenticator app
              </li>
              <li className="flex items-center">
                <QrCode className="h-4 w-4 mr-2 text-green-500" />
                Ability to scan QR codes
              </li>
            </ul>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={startSetup} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Start 2FA Setup
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Recommended authenticator apps: Google Authenticator, Microsoft Authenticator, Authy
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="bg-white p-4 border rounded-lg inline-block">
                <img 
                  src={setupData.qr_code} 
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Scan this QR code with your authenticator app
              </p>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Manual Entry (if needed):</Label>
              <div className="mt-1 flex items-center space-x-2">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={setupData.secret_key}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupData.secret_key, 'secret')}
                >
                  {copiedSecret ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Backup Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Save These Backup Codes</h4>
              <p className="text-yellow-700 text-sm">
                If you lose access to your authenticator app, you can use these codes to log in. 
                Each code can only be used once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded font-mono text-sm">
              {setupData.backup_codes.map((code, index) => (
                <div key={index} className="text-center py-1 px-2 bg-white rounded border">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(setupData.backup_codes.join('\n'), 'backup')}
                className="flex-1"
              >
                {copiedBackupCodes ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Codes
              </Button>
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verify Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="verification">Enter 6-digit code from your app:</Label>
              <Input
                id="verification"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-wider font-mono"
                maxLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={verifySetup}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enable 2FA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">2FA Enabled Successfully!</h3>
              <p className="text-green-600 mt-2">
                {success || "Your account is now protected with two-factor authentication."}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                🛡️ Your account security has been enhanced. You'll need your authenticator app for future logins.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default TwoFactorSetup;