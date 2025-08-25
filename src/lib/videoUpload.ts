import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Downloads a video from a URL and returns it as a Blob
 * Uses backend proxy to avoid CORS issues
 */
async function downloadVideoAsBlob(videoUrl: string): Promise<Blob> {
  console.log(`Downloading video from URL: ${videoUrl}`);
  try {
    // Use our backend API to proxy the download and avoid CORS
    const response = await fetch('/api/download-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to download video: ${response.statusText}`, errorData);
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log(`Video downloaded successfully, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error(`Error downloading video from ${videoUrl}:`, error);
    throw error;
  }
}

/**
 * Uploads a video blob to Firebase Storage
 */
async function uploadVideoToFirebase(blob: Blob, fileName: string): Promise<string> {
  console.log(`🎬 Uploading video to Firebase Storage: ${fileName}`);
  console.log(`🎬 Blob size: ${blob.size} bytes, type: ${blob.type}`);
  
  try {
    const videoRef = ref(storage, `generated-videos/${fileName}`);
    console.log(`🎬 Firebase storage reference created: generated-videos/${fileName}`);
    
    const snapshot = await uploadBytes(videoRef, blob);
    console.log(`🎬 Video bytes uploaded, snapshot:`, snapshot);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`🎬 Firebase download URL generated: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading video to Firebase: ${fileName}:`, error);
    throw error;
  }
}

/**
 * Uploads a single generated video to Firebase Storage
 */
export async function uploadGeneratedVideo(video: { id: string; url: string; originalUrl?: string }): Promise<{ id: string; url: string; originalUrl: string; firebaseUrl: string }> {
  console.log(`=== UPLOADING SINGLE VIDEO TO FIREBASE ===`);
  console.log('Video ID:', video.id);
  console.log('Original URL:', video.url);
  
  try {
    // Download the video from the original URL using our proxy
    console.log('🎬 Step 1: Downloading video via proxy...');
    const blob = await downloadVideoAsBlob(video.url);
    console.log('✅ Video download completed, blob size:', blob.size, 'bytes');
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${video.id}_${timestamp}.mp4`;
    console.log('🎬 Step 2: Generated filename:', fileName);
    
    // Upload to Firebase Storage
    console.log('🎬 Step 3: Uploading to Firebase Storage...');
    const firebaseUrl = await uploadVideoToFirebase(blob, fileName);
    console.log('✅ Firebase upload completed, URL:', firebaseUrl);
    
    const result = {
      id: video.id,
      url: firebaseUrl, // Use Firebase URL as the main URL
      originalUrl: video.originalUrl || video.url, // Keep original URL for reference
      firebaseUrl,
    };
    
    console.log('🎬 Video upload completed successfully');
    console.log('🎬 Final video object:', result);
    console.log('=== SINGLE VIDEO UPLOAD COMPLETED ===');
    
    return result;
  } catch (error) {
    console.error('❌ Error uploading video to Firebase:', error);
    console.log('🔄 Falling back to original URL due to upload failure');
    
    // Return original video if upload fails
    return {
      id: video.id,
      url: video.url,
      originalUrl: video.originalUrl || video.url,
      firebaseUrl: video.url, // Fallback to original URL
    };
  }
}

/**
 * Generates a unique filename for a video
 */
export function generateVideoFileName(videoId: string, prompt: string): string {
  const timestamp = Date.now();
  const sanitizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 50);
  return `${videoId}_${sanitizedPrompt}_${timestamp}.mp4`;
}
