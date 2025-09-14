import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('form'); // 'form', 'sending', 'success', 'error'
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!email) {
      setErrors({ email: 'Email address is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setStatus('sending');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        const data = await response.json();
        setStatus('error');
        setErrors({ submit: data.detail || 'Failed to send reset email. Please try again.' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setStatus('error');
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-green-600">
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">
                  Reset instructions sent!
                </p>
                <p className="text-sm text-green-600">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  If you don't see the email, check your spam folder or try again with a different email address.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={() => {
                      setStatus('form');
                      setEmail('');
                      setErrors({});
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Try Different Email
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
            <p className="text-gray-600">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={status === 'sending'}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {errors.submit && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Reset Email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Reset Instructions
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium text-gray-900 mb-2">Need more help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you're still having trouble accessing your account, our support team is here to help.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('mailto:support@stocklot.co.za?subject=Account Access Help', '_blank')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;