import { NextRequest, NextResponse } from 'next/server';
import { BackendPromptV1 } from '@/types/backendPrompt';
import { compileToFalI2V, validateBackendPrompt } from '@/lib/promptCompiler';
// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

export async function POST(request: NextRequest) {
  try {
    const backendPrompt: BackendPromptV1 = await request.json();

    const validation = validateBackendPrompt(backendPrompt);
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Invalid backend prompt', details: validation.errors }, { status: 400 });
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
    }

    const falRequest = compileToFalI2V(backendPrompt);
    fal.config({ credentials: falKey });

    const modelPath = backendPrompt.delivery.engine === 'veo3'
      ? 'fal-ai/veo3/image-to-video'
      : 'fal-ai/veo3/fast/image-to-video';

    const submitRes = await fal.queue.submit(modelPath, {
      input: {
        prompt: falRequest.prompt,
        image_url: falRequest.image_url,
        duration: falRequest.duration,
        generate_audio: falRequest.generate_audio,
        resolution: falRequest.resolution,
      },
    });

    if (!submitRes?.request_id) {
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 502 });
    }

    return NextResponse.json({ status: 'submitted', requestId: submitRes.request_id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


