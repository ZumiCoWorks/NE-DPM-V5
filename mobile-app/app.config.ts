import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NavEaze AR Wayfinding',
  slug: 'naveaze-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.naveaze.mobile',
    infoPlist: {
      NSCameraUsageDescription: 'NavEaze uses your camera for AR wayfinding to help you navigate to booths.',
      NSLocationWhenInUseUsageDescription: 'NavEaze uses your location to show you nearby booths and provide navigation.',
      NSMotionUsageDescription: 'NavEaze uses motion sensors for AR navigation'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.naveaze.mobile',
    permissions: [
      'CAMERA',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'BODY_SENSORS'
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-camera',
    'expo-barcode-scanner',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow NavEaze to use your location for AR wayfinding.'
      }
    ]
  ],
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || 'http://192.168.8.153:3001/api',
    quicketMode: process.env.QUICKET_MODE || 'mock',
    quicketApiKey: process.env.QUICKET_API_KEY || ''
  }
})

