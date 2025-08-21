import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GeneratedImage } from '@/types/history';

/**
 * Downloads an image from a URL and returns it as a Blob
 */
async function downloadImageAsBlob(imageUrl: string): Promise<Blob> {
  console.log(`Downloading image from URL: ${imageUrl}`);
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.statusText}`);
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const blob = await response.blob();
    console.log(`Image downloaded successfully, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error);
    throw error;
  }
}

/**
 * Uploads an image blob to Firebase Storage
 */
async function uploadImageToFirebase(blob: Blob, fileName: string): Promise<string> {
  console.log(`Uploading image to Firebase Storage: ${fileName}`);
  try {
    const imageRef = ref(storage, `generated-images/${fileName}`);
    const snapshot = await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Image uploaded successfully to Firebase: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading image to Firebase: ${fileName}:`, error);
    throw error;
  }
}

/**
 * Uploads a single generated image to Firebase Storage
 */
export async function uploadGeneratedImage(image: GeneratedImage): Promise<GeneratedImage> {
  console.log(`=== UPLOADING SINGLE IMAGE TO FIREBASE ===`);
  console.log('Image ID:', image.id);
  console.log('Original URL:', image.originalUrl);
  
  try {
    // Download the image from the original URL
    const blob = await downloadImageAsBlob(image.originalUrl);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${image.id}_${timestamp}.jpg`;
    console.log('Generated filename:', fileName);
    
    // Upload to Firebase Storage
    const firebaseUrl = await uploadImageToFirebase(blob, fileName);
    
    const result = {
      ...image,
      firebaseUrl,
      url: firebaseUrl, // Use Firebase URL as the main URL
    };
    
    console.log('Image upload completed successfully');
    console.log('Final image object:', result);
    console.log('=== SINGLE IMAGE UPLOAD COMPLETED ===');
    
    return result;
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
  console.log(`=== UPLOADING ${images.length} IMAGES TO FIREBASE ===`);
  
  const uploadPromises = images.map(image => uploadGeneratedImage(image));
  const results = await Promise.all(uploadPromises);
  
  console.log(`All ${images.length} images uploaded successfully`);
  console.log('=== MULTIPLE IMAGES UPLOAD COMPLETED ===');
  
  return results;
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
