import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stocklot.app',
  appName: 'StockLot',
  webDir: 'frontend/build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL, // For development
    cleartext: true // Allow HTTP in development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#059669",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#059669"
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    Geolocation: {
      permissions: ["location"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // Enhanced Browser plugin for payment deep-linking
    Browser: {
      windowName: "_self",
      toolbarColor: "#059669",
      showTitle: true,
      hideUrlBar: false,
      hideNavigationButtons: false,
      hideShare: true,
      animated: true,
      enableViewportScale: true,
      allowOverScroll: true,
      presentationStyle: "automatic",
      showInRecents: true
    },
    // Haptics for payment feedback
    Haptics: {
      impact: true,
      notification: true,
      selection: true
    },
    // App Launcher for URL schemes
    App: {
      urlScheme: "stocklot"
    }
  },
  // Enhanced iOS configuration for deep-linking
  ios: {
    scheme: "StockLot",
    path: "ios"
  },
  // Enhanced Android configuration for deep-linking  
  android: {
    scheme: "stocklot",
    path: "android",
    allowMixedContent: true
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000',
      // Payment and URL handling preferences
      AllowInlineMediaPlayback: 'true',
      MediaPlaybackRequiresUserAction: 'false',
      AllowUntrustedCerts: 'false',
      DisallowOverscroll: 'false',
      // iOS specific for payment handling
      'deployment-target': '11.0',
      'target-device': 'universal',
      // Android specific for payment handling
      'android-minSdkVersion': '22',
      'android-targetSdkVersion': '33'
    }
  }
};

export default config;
