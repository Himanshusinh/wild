import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('requestId');
    const isEdit = request.nextUrl.searchParams.get('isEdit') === 'true';
    const isUpscale = request.nextUrl.searchParams.get('isUpscale') === 'true';
    
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
    
    const status = await fal.queue.status(endpoint, { requestId, logs: true });
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error polling FAL status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


