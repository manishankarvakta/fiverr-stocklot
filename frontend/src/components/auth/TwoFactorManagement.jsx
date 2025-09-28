import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  ShieldCheck,
  ShieldX,
  Key, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Download,
  Copy,
  Clock
} from 'lucide-react';

const TwoFactorManagement = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Form data
  const [disableData, setDisableData] = useState({
    password: '',
    token: ''
  });
  const [backupCodesToken, setBackupCodesToken] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/2fa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('Failed to load 2FA status.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(disableData)
      });

      if (response.ok) {
        setSuccess('Two-factor authentication has been disabled.');
        setShowDisableForm(false);
        setDisableData({ password: '', token: '' });
        await fetchStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to disable 2FA.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/2fa/regenerate-backup-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: backupCodesToken })
      });

      if (response.ok) {
        const data = await response.json();
        setNewBackupCodes(data.backup_codes);
        setBackupCodesToken('');
        setSuccess('New backup codes generated successfully.');
        await fetchStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to regenerate backup codes.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = (codes) => {
    const content = `StockLot 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}\n\nKeep these codes safe! Each can only be used once.`;
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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Backup codes copied to clipboard!');
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccess('Backup codes copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' at ' + new Date(dateString).toLocaleTimeString();
  };

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading 2FA status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status?.enabled ? (
                <ShieldCheck className="h-6 w-6 text-green-500" />
              ) : (
                <ShieldX className="h-6 w-6 text-gray-400" />
              )}
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              status?.enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {status?.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">✅ Your account is secure</h3>
                <p className="text-green-700 text-sm">
                  Two-factor authentication is active and protecting your account from unauthorized access.
                </p>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Enabled: {formatDate(status.enabled_at)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Key className="h-4 w-4 mr-2" />
                  <span>Backup codes: {status.backup_codes_remaining} remaining</span>
                </div>
                <div className="flex items-center text-gray-600 md:col-span-2">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Last used: {formatDate(status.last_used_at)}</span>
                </div>
              </div>

              {/* Low backup codes warning */}
              {status.backup_codes_remaining <= 3 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have {status.backup_codes_remaining} backup codes remaining. 
                    Consider generating new backup codes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Account security recommendation</h3>
              <p className="text-yellow-700 text-sm mb-3">
                Your account is not protected by two-factor authentication. Enable 2FA to add an extra layer of security.
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/settings/2fa/setup'}
              >
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Management Actions - Only show if 2FA is enabled */}
      {status?.enabled && (
        <>
          {/* Backup Codes Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Backup Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Backup codes allow you to access your account if you lose your authenticator device. 
                Each code can only be used once.
              </p>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">
                  <strong>{status.backup_codes_remaining}</strong> of 10 backup codes remaining
                </span>
                <Button
                  variant="outline"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                >
                  {showBackupCodes ? 'Hide' : 'Regenerate'} Codes
                </Button>
              </div>

              {showBackupCodes && (
                <form onSubmit={handleRegenerateBackupCodes} className="space-y-3">
                  <div>
                    <Label htmlFor="backupToken">Enter current 2FA code to generate new backup codes:</Label>
                    <Input
                      id="backupToken"
                      type="text"
                      value={backupCodesToken}
                      onChange={(e) => setBackupCodesToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="text-center font-mono"
                      maxLength={6}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || backupCodesToken.length !== 6}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Generate New Backup Codes
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Show new backup codes */}
              {newBackupCodes.length > 0 && (
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Save these new backup codes immediately. Your old codes are no longer valid.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded font-mono text-sm">
                    {newBackupCodes.map((code, index) => (
                      <div key={index} className="text-center py-1 px-2 bg-white rounded border">
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newBackupCodes.join('\n'))}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Codes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => downloadBackupCodes(newBackupCodes)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disable 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <ShieldX className="h-5 w-5 mr-2" />
                Disable Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Security Warning</h4>
                <p className="text-red-700 text-sm">
                  Disabling 2FA will make your account less secure. Only disable if you're setting up a new device.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDisableForm(!showDisableForm)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {showDisableForm ? 'Cancel' : 'Disable 2FA'}
                </Button>
              </div>

              {showDisableForm && (
                <form onSubmit={handleDisable2FA} className="space-y-3">
                  <div>
                    <Label htmlFor="password">Current Password:</Label>
                    <Input
                      id="password"
                      type="password"
                      value={disableData.password}
                      onChange={(e) => setDisableData({...disableData, password: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="token">2FA Code (optional):</Label>
                    <Input
                      id="token"
                      type="text"
                      value={disableData.token}
                      onChange={(e) => setDisableData({...disableData, token: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                      placeholder="000000"
                      className="text-center font-mono"
                      maxLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={loading || !disableData.password}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      <>
                        <ShieldX className="h-4 w-4 mr-2" />
                        Confirm Disable 2FA
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TwoFactorManagement;