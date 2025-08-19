import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GeneratedImage } from '@/types/history';

/**
 * Downloads an image from a URL and returns it as a Blob
 */
async function downloadImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Uploads an image blob to Firebase Storage
 */
async function uploadImageToFirebase(blob: Blob, fileName: string): Promise<string> {
  const imageRef = ref(storage, `generated-images/${fileName}`);
  const snapshot = await uploadBytes(imageRef, blob);
  return getDownloadURL(snapshot.ref);
}

/**
 * Uploads a single generated image to Firebase Storage
 */
export async function uploadGeneratedImage(image: GeneratedImage): Promise<GeneratedImage> {
  try {
    // Download the image from the original URL
    const blob = await downloadImageAsBlob(image.originalUrl);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${image.id}_${timestamp}.jpg`;
    
    // Upload to Firebase Storage
    const firebaseUrl = await uploadImageToFirebase(blob, fileName);
    
    return {
      ...image,
      firebaseUrl,
      url: firebaseUrl, // Use Firebase URL as the main URL
    };
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    // Return original image if upload fails
    return image;
  }
}

/**
 * Uploads multiple generated images to Firebase Storage
 */
export async function uploadGeneratedImages(images: GeneratedImage[]): Promise<GeneratedImage[]> {
  const uploadPromises = images.map(image => uploadGeneratedImage(image));
  return Promise.all(uploadPromises);
}

/**
 * Generates a unique filename for an image
 */
export function generateImageFileName(imageId: string, prompt: string): string {
  const timestamp = Date.now();
  const sanitizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 50);
  return `${imageId}_${sanitizedPrompt}_${timestamp}.jpg`;
}
