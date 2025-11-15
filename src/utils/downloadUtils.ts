/**
 * Utility functions for handling downloads with proper naming conventions
 */

/**
 * Gets the current username from multiple sources
 * @returns The username or null if not found
 */
export function getCurrentUsername(): string | null {
  try {
    console.log('[DownloadUtils] Checking localStorage for user data...');
    
    // Try to get from localStorage first (most reliable) if user is logged in
    const storedUser = localStorage.getItem('user');
    console.log('[DownloadUtils] Stored user data:', storedUser);
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('[DownloadUtils] Parsed user data:', userData);
      const username = userData.username || userData.displayName || userData.email?.split('@')[0] || null;
      console.log('[DownloadUtils] Found username from localStorage:', username);
      return username;
    }
    
    // Try to get from authToken
    const authToken = localStorage.getItem('authToken');
    console.log('[DownloadUtils] Auth token exists:', !!authToken);
    
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        console.log('[DownloadUtils] Parsed token data:', tokenData);
        const userData = tokenData.user || tokenData;
        const username = userData.username || userData.displayName || userData.email?.split('@')[0] || null;
        console.log('[DownloadUtils] Found username from authToken:', username);
        return username;
      } catch (e) {
        console.log('[DownloadUtils] Error parsing authToken:', e);
      }
    }
    
    console.log('[DownloadUtils] No username found in localStorage');
    return null;
  } catch (e) {
    console.log('[DownloadUtils] Error getting username:', e);
    return null;
  }
}

/**
 * Generates a filename with the format: username_date_time.extension
 * @param username - The user's username
 * @param fileType - The type of file (image, video, audio)
 * @param extension - The file extension (jpg, png, mp4, mp3, etc.)
 * @param customPrefix - Optional custom prefix to add before username
 * @returns Formatted filename string
 */
export function generateDownloadFilename(
  username: string | undefined | null,
  fileType: 'image' | 'video' | 'audio',
  extension: string,
  customPrefix?: string
): string {
  // Clean username - remove special characters and limit length
  const cleanUsername = username 
    ? username.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20)
    : 'user';
  
  // Get current date and time
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '_'); // YYYY_MM_DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '_'); // HH_MM_SS
  
  // Only add prefix if customPrefix is explicitly provided
  const prefix = customPrefix ? `${customPrefix}_` : '';
  
  // Ensure extension starts with a dot
  const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;
  
  return `${prefix}${cleanUsername}_${date}_${time}${cleanExtension}`;
}

/**
 * Extracts file extension from a URL
 * @param url - The file URL
 * @returns File extension without the dot
 */
export function getExtensionFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    
    // Common extensions mapping
    const extensionMap: Record<string, string> = {
      'jpg': 'jpg',
      'jpeg': 'jpg',
      'png': 'png',
      'gif': 'gif',
      'svg': 'svg',
      'webp': 'webp',
      'mp4': 'mp4',
      'mov': 'mov',
      'avi': 'avi',
      'webm': 'webm',
      'mp3': 'mp3',
      'wav': 'wav',
      'm4a': 'm4a',
      'aac': 'aac',
      'ogg': 'ogg'
    };
    
    // If we found a valid extension, return it
    if (extension && extensionMap[extension]) {
      return extensionMap[extension];
    }
    
    // If no extension found, try to detect from URL patterns
    if (url.includes('video') || url.includes('mp4')) return 'mp4';
    if (url.includes('webm')) return 'webm';
    if (url.includes('mov')) return 'mov';
    if (url.includes('avi')) return 'avi';
    if (url.includes('image') || url.includes('jpg') || url.includes('jpeg')) return 'jpg';
    if (url.includes('png')) return 'png';
    if (url.includes('gif')) return 'gif';
    if (url.includes('webp')) return 'webp';
    if (url.includes('audio') || url.includes('mp3')) return 'mp3';
    if (url.includes('wav')) return 'wav';
    
    // Return the original extension or 'file' as fallback
    return extension || 'file';
  } catch {
    return 'file';
  }
}

/**
 * Determines file type from media object or URL
 * @param media - Media object with type or URL
 * @param url - URL string
 * @returns File type
 */
export function getFileType(media: any, url: string): 'image' | 'video' | 'audio' {
  // Check if media object has type property
  if (media?.type) {
    if (media.type.includes('image')) return 'image';
    if (media.type.includes('video')) return 'video';
    if (media.type.includes('audio')) return 'audio';
  }
  
  // Check URL extension
  const extension = getExtensionFromUrl(url);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
  const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  
  // Default fallback
  return 'image';
}

import { toResourceProxy } from '@/lib/thumb';

/**
 * Downloads a file with proper naming convention
 * @param url - The file URL to download
 * @param username - User's username
 * @param fileType - Type of file being downloaded
 * @param customPrefix - Optional custom prefix
 * @returns Promise<boolean> - Success status
 */
export async function downloadFileWithNaming(
  url: string,
  username: string | undefined | null,
  fileType: 'image' | 'video' | 'audio',
  customPrefix?: string
): Promise<boolean> {
  try {
    // Try to get username from multiple sources if not provided
    const actualUsername = username || getCurrentUsername();
    console.log('[DownloadUtils] Using username:', actualUsername);
    
    let extension = getExtensionFromUrl(url);
    
    // Enhanced video extension detection
    if (fileType === 'video') {
      // Check if URL contains video indicators
      if (url.includes('video') || url.includes('mp4') || url.includes('webm') || url.includes('mov')) {
        if (!extension || extension === 'file') {
          // Try to detect from URL patterns
          if (url.includes('mp4')) extension = 'mp4';
          else if (url.includes('webm')) extension = 'webm';
          else if (url.includes('mov')) extension = 'mov';
          else if (url.includes('avi')) extension = 'avi';
          else extension = 'mp4'; // Default to mp4 for videos
        }
      } else if (!extension || extension === 'file') {
        // Try to detect from Content-Type header
        try {
          const response = await fetch(url, { method: 'HEAD' });
          const contentType = response.headers.get('content-type');
          console.log('[DownloadUtils] Content-Type:', contentType);
          
          if (contentType) {
            if (contentType.includes('video/mp4')) extension = 'mp4';
            else if (contentType.includes('video/webm')) extension = 'webm';
            else if (contentType.includes('video/quicktime')) extension = 'mov';
            else if (contentType.includes('video/x-msvideo')) extension = 'avi';
            else extension = 'mp4'; // Default to mp4 for videos
          } else {
            extension = 'mp4'; // Default to mp4 for videos
          }
        } catch (e) {
          console.log('[DownloadUtils] Could not fetch headers, using default mp4');
          extension = 'mp4'; // Default to mp4 for videos
        }
      }
    }
    
    console.log('[DownloadUtils] Detected extension:', extension, 'for fileType:', fileType);
    console.log('[DownloadUtils] Original URL:', url);
    
    // For images, try to detect better extension if we got 'file'
    if (fileType === 'image' && (extension === 'file' || !extension)) {
      console.log('[DownloadUtils] Trying to detect image extension from URL patterns...');
      if (url.includes('png')) extension = 'png';
      else if (url.includes('jpg') || url.includes('jpeg')) extension = 'jpg';
      else if (url.includes('webp')) extension = 'webp';
      else if (url.includes('gif')) extension = 'gif';
      else extension = 'png'; // Default to png for images
      console.log('[DownloadUtils] Updated extension for image:', extension);
    }
    
    // Convert to proxy URL to avoid CORS issues. Use resource proxy (original file)
    const proxyUrl = toResourceProxy(url) || url;
    
    console.log(`Downloading: ${proxyUrl} (original: ${url})`);
    
    const response = await fetch(proxyUrl, { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Override extension based on server content-type when available
    const respContentType = response.headers.get('content-type') || '';
    if (fileType === 'image') {
      if (respContentType.includes('image/svg')) extension = 'svg';
      else if (respContentType.includes('image/png')) extension = 'png';
      else if (respContentType.includes('image/webp')) extension = 'webp';
      else if (respContentType.includes('image/jpeg')) extension = 'jpg';
      else if (respContentType.includes('image/gif')) extension = 'gif';
    }

    const filename = generateDownloadFilename(actualUsername, fileType, extension, customPrefix);
    console.log('[DownloadUtils] Generated filename:', filename, 'content-type:', respContentType);

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.URL.revokeObjectURL(objectUrl);
    
    console.log(`Downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error('Download failed, falling back to direct link:', error);
    try {
      // Fallback: open the original URL in a new tab
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.download = generateDownloadFilename(username, fileType, getExtensionFromUrl(url), customPrefix);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (e) {
      console.error('Direct open fallback failed:', e);
      return false;
    }
  }
}

