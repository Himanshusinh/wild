import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get('requestId');
    const engine = request.nextUrl.searchParams.get('engine') || 'veo3_fast';
    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
    }
    fal.config({ credentials: falKey });

    const modelPath = engine === 'veo3' ? 'fal-ai/veo3/image-to-video' : 'fal-ai/veo3/fast/image-to-video';
    const status = await fal.queue.status(modelPath, { requestId });
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


