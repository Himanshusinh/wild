import { NextResponse } from 'next/server';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { GeneratedImage } from '@/types/history';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Custom function to upload product images to Firebase Storage
async function uploadProductToFirebase(blob: Blob, fileName: string): Promise<string> {
  try {
    const imageRef = ref(storage, `generated-products/${fileName}`);
    const snapshot = await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`Product uploaded successfully to Firebase: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error(`Error uploading product to Firebase: ${fileName}:`, error);
    throw error;
  }
}

// Custom function to download and upload product images
async function uploadProductImages(imageUrls: string[]): Promise<GeneratedImage[]> {
  console.log(`=== UPLOADING ${imageUrls.length} PRODUCT IMAGES TO FIREBASE ===`);
  
  const uploadPromises = imageUrls.map(async (url: string, index: number) => {
    try {
      console.log(`Downloading product from URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download product: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = `product_${Date.now()}_${index}.png`;
      const firebaseUrl = await uploadProductToFirebase(blob, fileName);
      
      return {
        id: `local-product-${Date.now()}-${index}`,
        url: firebaseUrl,
        originalUrl: url,
        firebaseUrl: firebaseUrl
      };
    } catch (error) {
      console.error(`Error processing product ${index}:`, error);
      throw error;
    }
  });
  
  const results = await Promise.all(uploadPromises);
  console.log(`All ${imageUrls.length} product images uploaded successfully`);
  return results;
}

export async function POST(request: Request) {
  let historyId: string | null = null;

  try {
    const { prompt, model, imageCount = 1, generationType = 'product-generation', productImage, modelImage } = await request.json();
    const localBaseUrl = process.env.LOCAL_PRODUCT_GENERATION_URL || 'http://localhost:8000';

    console.log('Local API Base URL:', localBaseUrl);
    console.log('Product Image:', !!productImage);
    console.log('Model Image:', !!modelImage);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Only require product image for non-local models
    // if (!productImage && model !== 'flux-kontext-dev') {
    //   return NextResponse.json({ error: 'Product image is required for this model' }, { status: 400 });
    // }

    // Create initial history entry
    historyId = await saveHistoryEntry({
      prompt: `Product: ${prompt}`,
      model: model || 'flux-kontext-dev',
      generationType,
      images: [],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount,
      status: 'generating'
    });

    // Prepare request body for local API
    const requestBody: any = {
      prompt: prompt,
      num_images: imageCount
    };

    // Add product image if provided (for Flux models or when available)
    if (productImage) {
      requestBody.product_image = productImage;
    }

    // Add model image if provided (product with model pose case)
    if (modelImage) {
      requestBody.model_image = modelImage;
      console.log('Including model image for product with model pose');
    }

    // Call local product generation API
    const response = await fetch(`${localBaseUrl}/generate-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
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
    const imagesForUpload = await uploadProductImages(fullUrls);

    // Create the completed entry
    const completedEntry = {
      prompt: `Product: ${prompt}`,
      model: model === 'flux-kontext-dev' ? 'Flux Kontext [DEV]' : (model || 'flux-kontext-dev'),
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
      message: `Successfully generated ${imageCount} product image${imageCount > 1 ? 's' : ''}`
    });

  } catch (error: any) {
    console.error('Local product generation failed:', error);

    // Update history entry to show error if we have an ID
    if (historyId) {
      await updateHistoryEntry(historyId, {
        status: 'failed',
        error: error.message || 'Generation failed'
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Product generation failed',
      historyId
    }, { status: 500 });
  }
}

