import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { updateHistoryEntry } from '@/lib/historyService';
// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('requestId');
    const isEdit = request.nextUrl.searchParams.get('isEdit') === 'true';
    const isUpscale = request.nextUrl.searchParams.get('isUpscale') === 'true';
    const historyId = request.nextUrl.searchParams.get('historyId');
    
    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
    }
    fal.config({ credentials: falKey });

    let endpoint;
    if (isUpscale) {
      endpoint = 'fal-ai/topaz/upscale/image';
    } else {
      endpoint = isEdit ? 'fal-ai/gemini-25-flash-image/edit' : 'fal-ai/gemini-25-flash-image';
    }
    
    const result = await fal.queue.result(endpoint, { requestId });

    if (isUpscale) {
      // Handle upscale result
      return NextResponse.json({ 
        image: result.data.image,
        requestId,
        status: 'completed' 
      });
    } else {
      // Handle image generation result (existing logic)
      const images = (result?.data?.images || []).map((f: any, idx: number) => ({
        id: `${requestId}-${idx}`,
        url: f.url,
        originalUrl: f.url,
      }));

      const uploadedImages = await uploadGeneratedImages(images);

      if (historyId) {
        await updateHistoryEntry(historyId, {
          images: uploadedImages,
          status: 'completed',
        });
      }

      return NextResponse.json({
        images: uploadedImages,
        requestId,
        status: 'completed',
      });
    }
  } catch (error) {
    console.error('Error fetching FAL result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


