import React, { useState } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
// import api from '../../api/client';
import { Button, Input, Label, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if redirecting from admin
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use new API client for login
      const response = await api.post('/auth/login', { 
        email: email, 
        password: password 
      });
      
      if (response.data.success) {
        // Refresh auth state to get user data
        await refetch();
        
        // Redirect to admin if that's where they came from, otherwise marketplace
        if (redirectTo === 'admin') {
          navigate('/admin');
        } else {
          navigate('/marketplace');
        }
      } else {
        setError('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-emerald-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📦</span>
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900">Welcome Back</CardTitle>
          <CardDescription className="text-emerald-600">
            Sign in to your StockLot account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-800">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-800">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <Link 
                to="/forgot-password" 
                className="text-sm text-emerald-600 hover:text-emerald-700 underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-emerald-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-800 hover:text-emerald-900 font-medium underline">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Login;
