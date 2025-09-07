# Social Login Setup Guide

This guide will help you set up Google and Facebook OAuth integration for your livestock trading platform.

## 🔧 Setup Overview

I've implemented Google and Facebook login/signup functionality with the following features:
- ✅ Social authentication alongside existing email/password
- ✅ Role selection modal for new social users (buyer/seller)  
- ✅ Automatic account linking for existing users
- ✅ Secure backend OAuth token verification
- ✅ Integrated with existing authentication system

## 📋 Required OAuth Credentials

You need to obtain the following credentials:

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API (now called Google Identity API)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://your-domain.com` (for production)
6. Set authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://your-domain.com/auth/google/callback` (for production)

**You'll get:**
- `Client ID` (starts with numbers, ends with `.apps.googleusercontent.com`)
- `Client Secret` (starts with `GOCSPX-`)

### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → "Build Connected Experiences"
3. Add "Facebook Login" product
4. In Facebook Login settings, add valid OAuth redirect URIs:
   - `http://localhost:3000/auth/facebook/callback` (for development)
   - `https://your-domain.com/auth/facebook/callback` (for production)
5. In App Settings → Basic, add your domain to "App Domains"

**You'll get:**
- `App ID` (numeric string)
- `App Secret` (alphanumeric string)

## 🔐 Environment Configuration

### Backend (.env)
Update `/app/backend/.env` with your credentials:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# OAuth Redirect URLs
FRONTEND_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

### Frontend (.env)
Update `/app/frontend/.env` with your public credentials:

```env
# OAuth Configuration (Client-side keys only)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## 🚀 Implementation Details

### Backend Changes Made:
1. **New Service**: `SocialAuthService` (`/app/backend/services/social_auth_service.py`)
   - Google OAuth token verification
   - Facebook OAuth token verification
   - User creation/linking logic

2. **New API Endpoints**:
   - `POST /api/auth/social` - Social authentication
   - `PUT /api/auth/update-role` - Update user role after social signup

3. **Enhanced User Model**:
   - Added `social_providers` field to track linked accounts
   - Support for multiple authentication methods

### Frontend Changes Made:
1. **Social Login Components**:
   - `SocialLoginButtons.jsx` - Google & Facebook login buttons
   - `RoleSelectionModal.jsx` - Role selection for new users
   - `useSocialAuth.js` - Social authentication hook

2. **Updated Components**:
   - `LoginGate.jsx` - Added social login to login/register modal
   - `EnhancedRegister.jsx` - Added social login to registration page

## 🔒 Security Features

- ✅ Server-side token verification with Google/Facebook APIs
- ✅ CSRF protection through OAuth state parameters
- ✅ Secure credential storage in environment variables
- ✅ Automatic account linking prevention for security
- ✅ Role-based access control maintained

## 🎯 User Experience Flow

### New User Flow:
1. User clicks "Continue with Google/Facebook"
2. OAuth popup/redirect to social provider
3. User authorizes your app
4. Role selection modal appears
5. User selects buyer/seller role
6. Account created and logged in
7. Redirected to dashboard

### Existing User Flow:
1. User clicks "Continue with Google/Facebook"
2. OAuth popup/redirect to social provider
3. User authorizes your app
4. System links social account to existing account
5. Logged in immediately
6. Redirected to dashboard

## 🧪 Testing Setup

### Development Testing:
1. Set OAuth credentials in environment files
2. Start both backend and frontend servers
3. Navigate to login/register page
4. Test Google/Facebook login buttons

### Test URLs:
- Login Modal: Click any "Log in to offer" button on buy requests page
- Register Page: `/register` route
- Enhanced Register: Should have social login section

## 🚨 Important Notes

1. **OAuth Redirect URIs**: Must exactly match what you configure in Google/Facebook consoles
2. **HTTPS Required**: Social providers require HTTPS in production
3. **Domain Verification**: Add your domain to both Google and Facebook app settings
4. **Rate Limits**: Both providers have rate limits for OAuth requests
5. **User Privacy**: Inform users about data collection in your privacy policy

## 🔄 Next Steps

1. **Get OAuth Credentials**: Follow the setup guides above
2. **Update Environment Files**: Add your credentials to both backend and frontend .env files
3. **Restart Services**: Run `supervisorctl restart all` to reload configuration
4. **Test Integration**: Try logging in with both Google and Facebook
5. **Deploy to Production**: Update OAuth URLs for your production domain

## 📞 Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check backend logs for OAuth verification errors
3. Verify OAuth credentials are correctly set
4. Ensure redirect URIs match exactly
5. Test with different browsers/incognito mode

---

**Implementation Status**: ✅ Complete and Ready for Testing
**Social Providers**: Google ✅ | Facebook ✅
**Role Selection**: ✅ Implemented
**Account Linking**: ✅ Implemented
**Security**: ✅ Server-side verification