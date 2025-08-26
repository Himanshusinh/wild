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

export async function POST(req: NextRequest) {
  try {
    const localBaseUrl = getEnv('LOCAL_PRODUCT_GENERATION_URL', 'http://localhost:8000');

    console.log('🚀 Product pose generation started');
    console.log('📍 Local API URL:', localBaseUrl);

    // Expect multipart/form-data
    const formData = await req.formData();
    const productImage = formData.get('product_image') as File | null;
    const modelImage = formData.get('model_image') as File | null;
    const sceneDesc = (formData.get('scene_desc') as string) || '';
    const width = (formData.get('width') as string) || '768';
    const height = (formData.get('height') as string) || '768';

    if (!productImage || !modelImage) {
      return NextResponse.json({ error: 'Both product_image and model_image are required' }, { status: 400 });
    }

    console.log('📁 Product image received:', productImage.name, 'Size:', productImage.size);
    console.log('📁 Model image received:', modelImage.name, 'Size:', modelImage.size);
    console.log('💬 Scene description:', sceneDesc);
    console.log('📐 Dimensions:', `${width}x${height}`);

    const forwardForm = new FormData();
    forwardForm.append('product_image', productImage, productImage.name || 'product.png');
    forwardForm.append('model_image', modelImage, modelImage.name || 'model.png');
    forwardForm.append('scene_desc', sceneDesc);
    forwardForm.append('width', width);
    forwardForm.append('height', height);

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
