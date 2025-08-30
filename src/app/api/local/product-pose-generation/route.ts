import { NextRequest, NextResponse } from 'next/server';
import { uploadGeneratedImages } from '@/lib/imageUpload';

function getEnv(name: string, fallback?: string) {
  const val = process.env[name];
  if (!val && !fallback) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return val || fallback!;
}

export const runtime = 'nodejs';

// Function to calculate proper dimensions for product pose generation
// Local models only support 1:1 aspect ratio to avoid dimension errors
function calculateProductPoseDimensions(aspectRatio: string, model: string): { width: number; height: number } {
  // Local models only support 1:1 aspect ratio for product pose generation
  // This ensures compatibility and prevents dimension adjustment errors
  const base = 1024; // Fixed resolution for local models
  
  console.log(`[calculateProductPoseDimensions] Model: ${model}, Aspect: ${aspectRatio}, Base: ${base}`);
  console.log(`[calculateProductPoseDimensions] Local models only support 1:1 aspect ratio for product pose`);
  
  // Always return 1024x1024 for local models regardless of requested aspect ratio
  const result = { width: base, height: base };
  console.log(`[calculateProductPoseDimensions] Fixed dimensions for local model: ${result.width}x${result.height}`);
  console.log(`[calculateProductPoseDimensions] Final result: ${result.width}x${result.height} (divisible by 16: ${result.width % 16 === 0 && result.height % 16 === 0})`);
  
  return result;
}

export async function POST(req: Request) {
  try {
    const localBaseUrl = getEnv('LOCAL_PRODUCT_GENERATION_URL', 'http://localhost:8000');

    console.log('🚀 Product pose generation started');
    console.log('📍 Local API URL:', localBaseUrl);

    // Handle both FormData and JSON requests for backward compatibility
    let productImage: string | null = null;
    let modelImage: string | null = null;
    let sceneDesc: string = '';
    let aspectRatio: string = '1:1';
    let model: string = 'stable-turbo';
    let width: number, height: number;

    // Check content type to determine how to parse the request
    const contentType = req.headers.get('content-type') || '';
    console.log(`[product-pose-generation] Content-Type header: ${contentType}`);
    
    if (contentType.includes('application/json')) {
      // Handle JSON request
      try {
        const body = await req.json();
        productImage = body.product_image || null;
        modelImage = body.model_image || null;
        sceneDesc = body.scene_desc || '';
        aspectRatio = body.aspect_ratio || '1:1';
        model = body.model || 'stable-turbo';
        
        // Calculate dimensions from aspect ratio
        const dimensions = calculateProductPoseDimensions(aspectRatio, model);
        width = dimensions.width;
        height = dimensions.height;
        
        console.log(`[product-pose-generation] JSON request - Aspect ratio: ${aspectRatio}, Model: ${model}`);
        
      } catch (jsonError) {
        console.error('[product-pose-generation] JSON parsing failed:', jsonError);
        throw new Error('Invalid JSON request body');
      }
    } else {
      // Handle FormData request (multipart/form-data)
      try {
        const formData = await req.formData();
        productImage = formData.get('product_image') as string | null;
        modelImage = formData.get('model_image') as string | null;
        sceneDesc = (formData.get('scene_desc') as string) || '';
        
        // Get dimensions from FormData or calculate from aspect ratio
        const formWidth = formData.get('width') as string;
        const formHeight = formData.get('height') as string;
        const formAspectRatio = formData.get('aspect_ratio') as string;
        
        if (formWidth && formHeight) {
          // Use provided dimensions
          width = parseInt(formWidth);
          height = parseInt(formHeight);
          
          // Validate parsed dimensions
          if (isNaN(width) || isNaN(height)) {
            throw new Error(`Invalid dimensions: width=${formWidth}, height=${formHeight}`);
          }
          
          console.log(`[product-pose-generation] FormData request - Using provided dimensions: ${width}x${height}`);
        } else if (formAspectRatio) {
          // Calculate from aspect ratio
          const dimensions = calculateProductPoseDimensions(formAspectRatio, model);
          width = dimensions.width;
          height = dimensions.height;
          console.log(`[product-pose-generation] FormData request - Calculated from aspect ratio: ${formAspectRatio} -> ${width}x${height}`);
        } else {
          // Default dimensions
          const dimensions = calculateProductPoseDimensions('1:1', model);
          width = dimensions.width;
          height = dimensions.height;
          console.log(`[product-pose-generation] FormData request - Using default dimensions: ${width}x${height}`);
        }
        
        console.log(`[product-pose-generation] FormData request processed successfully`);
        
      } catch (formDataError) {
        console.error('[product-pose-generation] FormData parsing failed:', formDataError);
        throw new Error('Invalid FormData request body');
      }
    }
    
    // Local models only support 1:1 aspect ratio (1024x1024) to prevent dimension errors
    console.log(`[product-pose-generation] Final dimensions: ${width}x${height} (1:1 aspect ratio enforced)`);
    console.log(`[product-pose-generation] Validation: width divisible by 16: ${width % 16 === 0}, height divisible by 16: ${height % 16 === 0}`);

    if (!productImage || !modelImage) {
      return NextResponse.json({ error: 'Both product_image and model_image are required' }, { status: 400 });
    }

    console.log('📁 Product image received:', productImage);
    console.log('📁 Model image received:', modelImage);
    console.log('💬 Scene description:', sceneDesc);
    console.log('📐 Calculated dimensions:', `${width}x${height}`);
    console.log('📐 Aspect ratio:', aspectRatio);
    console.log('🤖 Model:', model);

    // Validate dimensions are divisible by 16
    if (width % 16 !== 0 || height % 16 !== 0) {
      console.error(`[product-pose-generation] Invalid dimensions: ${width}x${height} - not divisible by 16`);
      return NextResponse.json({ 
        error: `Invalid dimensions: ${width}x${height}. Dimensions must be divisible by 16.` 
      }, { status: 400 });
    }

    // Create FormData for the local API
    const forwardForm = new FormData();
    forwardForm.append('product_image', productImage);
    forwardForm.append('model_image', modelImage);
    forwardForm.append('scene_desc', sceneDesc);
    forwardForm.append('width', width.toString());
    forwardForm.append('height', height.toString());
    
    console.log(`[product-pose-generation] Forwarding to local API with dimensions: ${width}x${height}`);

    console.log('🔄 Forwarding request to local API...');
    const response = await fetch(`${localBaseUrl}/generate-product-pose`, {
      method: 'POST',
      body: forwardForm,
    });

    if (!response.ok) {
      throw new Error(`Local API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📄 Response data:', data);

    if (!data.image_url) {
      throw new Error('No image URL received from local API');
    }

    // Convert relative URL to absolute
    const imageUrl = data.image_url.startsWith('http') ? data.imageUrl : `${localBaseUrl}${data.image_url}`;
    console.log('🖼️ Final image URL:', imageUrl);

    // Upload image to Firebase
    console.log('🔥 Starting Firebase upload...');
    const generated = await uploadGeneratedImages([
      {
        id: `product-pose-${Date.now()}`,
        url: imageUrl,
        originalUrl: imageUrl
      }
    ]);

    console.log('✅ Firebase upload completed');
    console.log('🖼️ Generated image:', generated[0]);

    return NextResponse.json({ 
      success: true, 
      images: generated,
      count: generated.length 
    });

  } catch (error: any) {
    console.error('❌ Product pose generation failed:', error);
    return NextResponse.json({ 
      error: error?.message || 'Product pose generation failed',
      details: error?.stack || 'No stack trace'
    }, { status: 500 });
  }
}
