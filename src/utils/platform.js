/**
 * Platform Detection & Native Feature Utilities
 * 
 * Provides helpers to detect whether the app is running on native mobile
 * (via Capacitor) or in a web browser, and exposes platform-specific
 * functionality with graceful web fallbacks.
 */
import { Capacitor } from '@capacitor/core'

/**
 * Returns true when running inside a native Capacitor shell (Android/iOS).
 */
export const isNative = () => Capacitor.isNativePlatform()

/**
 * Returns the current platform: 'android' | 'ios' | 'web'
 */
export const getPlatform = () => Capacitor.getPlatform()

/**
 * Returns true when running on Android
 */
export const isAndroid = () => Capacitor.getPlatform() === 'android'

/**
 * Returns true when running on iOS
 */
export const isIOS = () => Capacitor.getPlatform() === 'ios'

/**
 * Returns true when running in a web browser (not in a native shell)
 */
export const isWeb = () => Capacitor.getPlatform() === 'web'

/**
 * Check if a specific Capacitor plugin is available on the current platform.
 * Useful before calling native-only APIs.
 */
export const isPluginAvailable = (pluginName) => {
  return Capacitor.isPluginAvailable(pluginName)
}

/**
 * Get the base URL for API calls.
 * - On web (dev), the Vite proxy handles /api → localhost:5000
 * - On native, we need the full server URL since there's no proxy
 */
export const getApiBaseUrl = () => {
  if (isNative()) {
    // On native mobile, use the configured server URL
    // This MUST point to your deployed backend (e.g., Railway, Render)
    const apiUrl = import.meta.env.VITE_API_URL
    if (!apiUrl) {
      console.warn('VITE_API_URL not set! Native API calls will fail.')
    }
    return apiUrl || 'https://your-backend.example.com/api'
  }
  // On web, use relative path (Vite proxy or production reverse proxy)
  return '/api'
}
