import { NextRequest, NextResponse } from 'next/server';
import { uploadGeneratedImages } from '@/lib/imageUpload';

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();
    
    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Images array is required' }, { status: 400 });
    }

    console.log('🔥 Starting Firebase upload for mockup images...');
    console.log('📊 Images to upload:', images.length);
    
    // Upload all images to Firebase
    const uploadedImages = await uploadGeneratedImages(images);
    
    console.log('✅ Firebase upload completed for mockup images');
    console.log('🖼️ Uploaded images:', uploadedImages.map(img => ({ id: img.id, url: img.url })));
    
    return NextResponse.json({ 
      success: true, 
      images: uploadedImages,
      count: uploadedImages.length 
    });
    
  } catch (error: any) {
    console.error('❌ Firebase upload failed:', error);
    return NextResponse.json({ 
      error: error?.message || 'Firebase upload failed',
      details: error?.stack || 'No stack trace'
    }, { status: 500 });
  }
}
