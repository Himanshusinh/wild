import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is an upscale request
    if (body.image_url && body.model && body.upscale_factor !== undefined) {
      // Handle upscale request
      const { 
        image_url, 
        model = 'Standard V2',
        upscale_factor = 2,
        output_format = 'jpeg',
        subject_detection = 'All',
        face_enhancement = true,
        face_enhancement_creativity = 0,
        face_enhancement_strength = 0.8
      } = body;

      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
      }
      fal.config({ credentials: falKey });

      const input = {
        image_url,
        model,
        upscale_factor,
        output_format,
        subject_detection,
        face_enhancement,
        face_enhancement_creativity,
        face_enhancement_strength
      };

      const submitRes = await fal.queue.submit('fal-ai/topaz/upscale/image', { input });
      
      return NextResponse.json({
        status: 'submitted',
        requestId: submitRes.request_id,
        endpoint: 'fal-ai/topaz/upscale/image',
        isUpscale: true
      });
    } else {
      // Handle image generation request (existing logic)
      const {
        prompt,
        model = 'gemini-25-flash-image',
        n = 1,
        uploadedImages = [],
        output_format = 'jpeg',
        historyId,
      } = body;

      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
      }
      fal.config({ credentials: falKey });

      if (!prompt || typeof prompt !== 'string') {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      }

      if (model !== 'gemini-25-flash-image') {
        return NextResponse.json({ error: `Unsupported FAL model: ${model}` }, { status: 400 });
      }

      const isEdit = Array.isArray(uploadedImages) && uploadedImages.length > 0;
      const endpoint = isEdit ? 'fal-ai/gemini-25-flash-image/edit' : 'fal-ai/gemini-25-flash-image';

      const makeInput = (): any => {
        const input: any = { prompt, output_format };
        if (isEdit) {
          input.image_urls = uploadedImages.slice(0, 4);
          input.num_images = 1;
        } else {
          input.num_images = 1;
        }
        return input;
      };

      // Submit N tasks and return their requestIds
      const tasks = await Promise.all(
        Array.from({ length: Math.max(1, Number(n)) }).map(async () => {
          const submitRes = await fal.queue.submit(endpoint, {
            input: makeInput(),
          });
          return submitRes?.request_id as string;
        })
      );

      return NextResponse.json({
        status: 'submitted',
        requestIds: tasks.filter(Boolean),
        endpoint,
        isEdit,
        historyId: historyId || null,
        isUpscale: false
      });
    }
  } catch (error) {
    console.error('Error submitting FAL request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit FAL request' },
      { status: 500 }
    );
  }
}


