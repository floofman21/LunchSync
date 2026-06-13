import { Platform } from 'react-native';

// Point this at your deployed backend URL in production.
// For local dev: Android emulator uses 10.0.2.2; iOS sim uses localhost.
export const API_BASE = __DEV__
  ? Platform.select({ android: 'http://10.0.2.2:3000', default: 'http://localhost:3000' })
  : 'https://your-production-url.com';
