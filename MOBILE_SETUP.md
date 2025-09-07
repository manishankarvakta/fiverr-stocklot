# 📱 StockLot Mobile App Setup Guide

## Prerequisites
- Node.js 16+ installed
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- Java Development Kit (JDK) 11+

## Setup Instructions

### 1. Install Capacitor CLI
```bash
npm install -g @capacitor/cli
```

### 2. Initialize Mobile Project
```bash
# From the /app directory
npm install --save-dev @capacitor/cli
cp mobile-package.json package.json
npm install

# Initialize Capacitor
cap init StockLot com.stocklot.app
```

### 3. Build Web App
```bash
cd frontend
npm run build
cd ..
```

### 4. Add Mobile Platforms
```bash
# Add Android platform
cap add android

# Add iOS platform (macOS only)
cap add ios
```

### 5. Sync Web Code to Mobile
```bash
cap sync
```

### 6. Open in Native IDEs
```bash
# Open Android Studio
cap open android

# Open Xcode (macOS only)
cap open ios
```

## Mobile-Specific Features

### Admin Dashboard Mobile Optimization
- ✅ Responsive grid layout (1 column on mobile, 2 on tablet, 4 on desktop)
- ✅ Scrollable tab navigation for mobile
- ✅ Touch-friendly interface
- ✅ Mobile-specific admin component available

### Admin Access
- **URL**: `https://your-domain.com/admin`
- **Mobile URL**: Same URL works on mobile
- **Credentials**: Admin user login required

### Mobile App Features
- Native splash screen with StockLot branding
- Push notifications for new buy requests
- Local storage for offline data
- Native device features (camera, location, etc.)

## Development Commands
```bash
# Run on iOS simulator
cap run ios

# Run on Android emulator
cap run android

# Live reload development
cap run ios --livereload --external
cap run android --livereload --external
```

## Production Build
```bash
# Build web app
cd frontend && npm run build && cd ..

# Sync to mobile
cap sync

# Build for production
cap build ios
cap build android
```

## Troubleshooting

### Common Issues
1. **Build fails**: Ensure frontend build succeeds first
2. **Platform not found**: Run `cap add android/ios` first
3. **Sync errors**: Check capacitor.config.ts file

### Admin Dashboard Mobile Issues
- If tabs are cut off, they will scroll horizontally on mobile
- Stats cards stack vertically on mobile for better readability
- Use the mobile admin component for touch-optimized interface

## Platform Owner Admin Access

### Desktop
1. Navigate to `https://email-system-test.preview.emergentagent.com/admin`
2. Login with admin credentials
3. Full desktop admin interface with all tabs

### Mobile Web
1. Same URL works on mobile browsers
2. Responsive design adapts to mobile screens
3. Touch-friendly interface

### Mobile App
1. Install mobile app on device
2. Navigate to Admin section (requires admin login)
3. Optimized mobile admin dashboard interface