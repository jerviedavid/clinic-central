/**
 * Native Camera Utility
 * 
 * Uses Capacitor Camera plugin on native mobile,
 * falls back to HTML file input on web.
 * 
 * Usage:
 *   import { takePhoto, pickImage } from '../utils/camera'
 *   const dataUrl = await takePhoto()          // open native camera
 *   const dataUrl = await pickImage()           // open gallery/file picker
 *   const dataUrl = await captureOrPick()       // camera first, gallery fallback
 */
import { isNative, isPluginAvailable } from './platform'

/**
 * Take a photo using the native camera (mobile) or return null on web.
 * Returns a base64 data URL string or null if cancelled/unavailable.
 */
export async function takePhoto(options = {}) {
  if (!isNative() || !isPluginAvailable('Camera')) {
    return null // Caller should fall back to HTML file input
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: options.saveToGallery || false,
      width: options.width || undefined,
      height: options.height || undefined,
      ...options,
    })
    return image.dataUrl
  } catch (error) {
    // User cancelled or permission denied
    if (error.message?.includes('cancelled') || error.message?.includes('User')) {
      return null
    }
    console.error('Camera error:', error)
    return null
  }
}

/**
 * Pick an image from the device gallery (mobile) or return null on web.
 * Returns a base64 data URL string or null if cancelled/unavailable.
 */
export async function pickImage(options = {}) {
  if (!isNative() || !isPluginAvailable('Camera')) {
    return null // Caller should fall back to HTML file input
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: options.width || undefined,
      height: options.height || undefined,
      ...options,
    })
    return image.dataUrl
  } catch (error) {
    if (error.message?.includes('cancelled') || error.message?.includes('User')) {
      return null
    }
    console.error('Gallery picker error:', error)
    return null
  }
}

/**
 * Show native camera/gallery prompt on mobile. Falls back to null on web.
 * Lets the user choose between camera and gallery on native.
 */
export async function captureOrPick(options = {}) {
  if (!isNative() || !isPluginAvailable('Camera')) {
    return null
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Shows "Camera or Gallery" chooser
      promptLabelHeader: options.promptLabel || 'Select Image Source',
      promptLabelPhoto: 'From Gallery',
      promptLabelPicture: 'Take Photo',
      saveToGallery: options.saveToGallery || false,
      ...options,
    })
    return image.dataUrl
  } catch (error) {
    if (error.message?.includes('cancelled') || error.message?.includes('User')) {
      return null
    }
    console.error('Camera/Gallery error:', error)
    return null
  }
}

/**
 * Check if native camera is available on this platform.
 */
export function hasNativeCamera() {
  return isNative() && isPluginAvailable('Camera')
}
