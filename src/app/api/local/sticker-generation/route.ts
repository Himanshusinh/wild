import { NextResponse } from 'next/server';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { GeneratedImage } from '@/types/history';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Custom function to upload sticker images to Firebase Storage
async function uploadStickerToFirebase(blob: Blob, fileName: string): Promise<string> {
  try {
    const imageRef = ref(storage, `generated-stickers/${fileName}`);
    const snapshot = await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Sticker uploaded successfully to Firebase: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading sticker to Firebase: ${fileName}:`, error);
    throw error;
  }
}

// Custom function to download and upload sticker images
async function uploadStickerImages(imageUrls: string[]): Promise<GeneratedImage[]> {
  console.log(`=== UPLOADING ${imageUrls.length} STICKER IMAGES TO FIREBASE ===`);
  
  const uploadPromises = imageUrls.map(async (url: string, index: number) => {
    try {
      console.log(`Downloading sticker from URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download sticker: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = `sticker_${Date.now()}_${index}.png`;
      const firebaseUrl = await uploadStickerToFirebase(blob, fileName);
      
      return {
        id: `local-sticker-${Date.now()}-${index}`,
        url: firebaseUrl,
        originalUrl: url,
        firebaseUrl: firebaseUrl
      };
    } catch (error) {
      console.error(`Error processing sticker ${index}:`, error);
      throw error;
    }
  });
  
  const results = await Promise.all(uploadPromises);
  console.log(`All ${imageUrls.length} sticker images uploaded successfully`);
  return results;
}

export async function POST(request: Request) {
  let historyId: string | null = null;

  try {
    const { prompt, model, imageCount = 1, generationType = 'sticker-generation' } = await request.json();
    const localBaseUrl = process.env.LOCAL_STICKER_GENERATION_URL || 'http://localhost:8000';

    console.log('Local API Base URL:', localBaseUrl);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Create initial history entry
    historyId = await saveHistoryEntry({
      prompt: `Sticker: ${prompt}`,
      model: model || 'local-sticker-model',
      generationType,
      images: [],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount,
      status: 'generating'
    });

    // Call local sticker generation API
    const response = await fetch(`${localBaseUrl}/generate-sticker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_images: imageCount
      })
    });

    console.log('response from local api', response);

    if (!response.ok) {
      throw new Error(`Local API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('data from local api', data);
    
    // Check for both 'images' and 'image_urls' fields
    const imageUrls = data.images || data.image_urls;
    console.log('Extracted image URLs:', imageUrls);
    
    if (!imageUrls || !Array.isArray(imageUrls)) {
      throw new Error('Invalid response format from local API - missing images or image_urls array');
    }

    // Handle case where images is an array of URLs (strings)
    const processedUrls = imageUrls.map((img: any) => {
      if (typeof img === 'string') {
        return img; // Already a full URL or relative path
      } else if (img && typeof img === 'object' && img.url) {
        return img.url; // Extract URL from object
      } else {
        throw new Error('Invalid image format in response');
      }
    });
    console.log('Processed URLs:', processedUrls);
    
    // Convert relative URLs to full URLs if needed
    const fullUrls = processedUrls.map((url: string) => {
      if (url.startsWith('http')) {
        return url; // Already a full URL
      } else {
        const fullUrl = `${localBaseUrl}${url}`;
        console.log(`Converting relative URL: ${url} -> ${fullUrl}`);
        return fullUrl;
      }
    });
    console.log('Full URLs for download:', fullUrls);
    
    // Download and upload images to Firebase Storage
    const imagesForUpload = await uploadStickerImages(fullUrls);

    // Create the completed entry
    const completedEntry = {
      prompt: `Sticker: ${prompt}`,
      model: model || 'local-sticker-model',
      generationType,
      images: imagesForUpload,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount,
      status: 'completed' as const
    };

    // Update the history entry with completed data
    await updateHistoryEntry(historyId, completedEntry);

    return NextResponse.json({
      success: true,
      historyId,
      images: imagesForUpload,
      message: `Successfully generated ${imageCount} sticker${imageCount > 1 ? 's' : ''}`
    });

  } catch (error: any) {
    console.error('Local sticker generation failed:', error);

    // Update history entry to show error if we have an ID
    if (historyId) {
      await updateHistoryEntry(historyId, {
        status: 'failed',
        error: error.message || 'Generation failed'
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Sticker generation failed',
      historyId
    }, { status: 500 });
  }
}
