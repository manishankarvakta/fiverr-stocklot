import React, { useState } from 'react';
import GoogleLogin from 'react-google-login';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import RoleSelectionModal from './RoleSelectionModal';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;

const SocialLoginButtons = ({ onSuccess, onError, className = "" }) => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUserInfo, setPendingUserInfo] = useState(null);
  const { authenticateWithSocial, loading, error } = useSocialAuth();

  const handleGoogleSuccess = async (response) => {
    try {
      const result = await authenticateWithSocial('google', response.tokenId, null);
      
      if (result.success) {
        if (result.data.needs_role_selection) {
          setPendingUserInfo(result.data.user);
          setShowRoleModal(true);
        } else {
          onSuccess && onSuccess(result.data);
        }
      } else {
        onError && onError(result.error);
      }
    } catch (error) {
      onError && onError('Google login failed');
    }
  };

  const handleGoogleFailure = (response) => {
    console.error('Google login failed:', response);
    onError && onError('Google login failed');
  };

  const handleFacebookSuccess = async (response) => {
    try {
      if (response.accessToken) {
        const result = await authenticateWithSocial('facebook', response.accessToken, null);
        
        if (result.success) {
          if (result.data.needs_role_selection) {
            setPendingUserInfo(result.data.user);
            setShowRoleModal(true);
          } else {
            onSuccess && onSuccess(result.data);
          }
        } else {
          onError && onError(result.error);
        }
      }
    } catch (error) {
      onError && onError('Facebook login failed');
    }
  };

  const handleRoleSelection = (userInfo) => {
    setShowRoleModal(false);
    setPendingUserInfo(null);
    onSuccess && onSuccess({ user: userInfo });
  };

  const handleRoleModalClose = () => {
    setShowRoleModal(false);
    setPendingUserInfo(null);
  };

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          Social login is not configured. Please set up OAuth credentials.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center text-sm text-gray-500 mb-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
      </div>

      {GOOGLE_CLIENT_ID && (
        <GoogleLogin
          clientId={GOOGLE_CLIENT_ID}
          onSuccess={handleGoogleSuccess}
          onFailure={handleGoogleFailure}
          cookiePolicy={'single_host_origin'}
          render={(renderProps) => (
            <Button
              onClick={renderProps.onClick}
              disabled={renderProps.disabled || loading}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
          )}
        />
      )}

      {FACEBOOK_APP_ID && (
        <FacebookLogin
          appId={FACEBOOK_APP_ID}
          fields="name,email,picture"
          callback={handleFacebookSuccess}
          render={(renderProps) => (
            <Button
              onClick={renderProps.onClick}
              disabled={loading}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
              aria-label="Continue with Facebook"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </Button>
          )}
        />
      )}

      <RoleSelectionModal
        open={showRoleModal}
        onClose={handleRoleModalClose}
        onComplete={handleRoleSelection}
        userInfo={pendingUserInfo}
      />
    </div>
  );
};

export default SocialLoginButtons;