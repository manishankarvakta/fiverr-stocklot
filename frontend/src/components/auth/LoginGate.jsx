import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Input, Label, Alert, AlertDescription,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import {
  LogIn, UserPlus, AlertCircle, Mail, Lock, User, Phone
} from 'lucide-react';
import SocialLoginButtons from './SocialLoginButtons';
import { useLoginMutation, useRegisterMutation } from '../../store/api/user.api';
import { setUser, loadUserProfile } from '../../store/authSlice';

const LoginGate = ({ open, onClose, onLogin, returnTo }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Redux RTK Query hooks
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'buyer'
  });

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginMutation({
        email: loginData.email.trim(),
        password: loginData.password
      }).unwrap();
      
      // Store token and user data
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update Redux immediately
        dispatch(setUser(data.user));
      }
      
      // Refresh auth state to get latest user data
      await dispatch(loadUserProfile(true));
      
      // Call parent login handler
      if (onLogin) {
        onLogin(data);
      }
      
      // Handle return URL
      if (returnTo) {
        window.location.href = returnTo;
      } else {
        onClose();
      }

    } catch (error) {
      console.error('Login error:', error);
      setError(error?.data?.detail || error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate passwords match
      if (registerData.password !== registerData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (registerData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const registrationPayload = {
        email: registerData.email,
        password: registerData.password,
        full_name: registerData.full_name,
        role: registerData.role,
        user_type: registerData.role
      };

      const data = await registerMutation(registrationPayload).unwrap();
      
      // Auto-login after registration
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          // Update Redux immediately
          dispatch(setUser(data.user));
        }
        
        // Refresh auth state to get latest user data
        await dispatch(loadUserProfile(true));
        
        if (onLogin) {
          onLogin(data);
        }
        
        if (returnTo) {
          window.location.href = returnTo;
        } else {
          onClose();
        }
      } else {
        // Switch to login tab if no auto-login
        setActiveTab('login');
        setError('Registration successful! Please log in.');
      }

    } catch (error) {
      console.error('Registration error:', error);
      setError(error?.data?.detail || error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle social login success
  const handleSocialSuccess = async (data) => {
    try {
      // Store token and user data if not already stored by social auth hook
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Update Redux immediately
        dispatch(setUser(data.user));
      }
      
      // Refresh auth state to get latest user data
      await dispatch(loadUserProfile(true));
      
      // Call parent login handler
      if (onLogin) {
        onLogin(data);
      }
      
      // Handle return URL
      if (returnTo) {
        window.location.href = returnTo;
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Social login success handler error:', error);
      setError('Login successful but there was an error. Please try again.');
    }
  };

  // Handle social login error
  const handleSocialError = (errorMessage) => {
    setError(errorMessage || 'Social login failed');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Welcome to StockLot
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({...prev, email: e.target.value}))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type="password"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <SocialLoginButtons
                onSuccess={handleSocialSuccess}
                onError={handleSocialError}
              />

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setActiveTab('register')}
                >
                  Sign up here
                </button>
              </p>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-name"
                    type="text"
                    className="pl-10"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData(prev => ({...prev, full_name: e.target.value}))}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-email"
                    type="email"
                    className="pl-10"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({...prev, email: e.target.value}))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-role">I want to</Label>
                <select
                  id="register-role"
                  className="w-full p-2 border rounded-md"
                  value={registerData.role}
                  onChange={(e) => setRegisterData(prev => ({...prev, role: e.target.value}))}
                >
                  <option value="buyer">Buy livestock</option>
                  <option value="seller">Sell livestock</option>
                </select>
              </div>

              <div>
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-password"
                    type="password"
                    className="pl-10"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({...prev, password: e.target.value}))}
                    placeholder="Choose a password"
                    minLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              </div>

              <div>
                <Label htmlFor="register-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-confirm"
                    type="password"
                    className="pl-10"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({...prev, confirmPassword: e.target.value}))}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <SocialLoginButtons
                onSuccess={handleSocialSuccess}
                onError={handleSocialError}
              />

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setActiveTab('login')}
                >
                  Sign in here
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-gray-500 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginGate;