import { NextRequest, NextResponse } from 'next/server';
import { BackendPromptV1 } from '@/types/backendPrompt';
import { compileToFalI2V, validateBackendPrompt } from '@/lib/promptCompiler';

export async function POST(request: NextRequest) {
  try {
    const t0 = Date.now();
    const backendPrompt: BackendPromptV1 = await request.json();
    console.log('[generate-video] request received mode=', backendPrompt.mode, 'engine=', backendPrompt.delivery?.engine);

    // For auto mode, ensure mode is set to "auto"
    if (backendPrompt.mode !== 'auto') {
      return NextResponse.json(
        { error: 'This endpoint is for auto mode only. Set mode to "auto"' },
        { status: 400 }
      );
    }

    // Validate the backend prompt
    const validation = validateBackendPrompt(backendPrompt);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid backend prompt',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Compile the backend prompt to FAL API format
    const falRequest = compileToFalI2V(backendPrompt);
    console.log('[generate-video] compiled FAL request summary', {
      promptPreview: (falRequest.prompt || '').slice(0, 120) + '...',
      hasImage: !!falRequest.image_url,
      duration: falRequest.duration,
      generate_audio: falRequest.generate_audio,
      resolution: falRequest.resolution
    });

    // Get FAL API key from environment
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error('FAL_KEY environment variable not set');
      return NextResponse.json(
        { error: 'FAL AI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Calling FAL AI API with compiled payload:', {
      prompt: falRequest.prompt.substring(0, 100) + '...',
      image_url: falRequest.image_url ? 'provided' : 'not provided',
      duration: falRequest.duration,
      generate_audio: falRequest.generate_audio,
      resolution: falRequest.resolution,
      engine: backendPrompt.delivery.engine
    });

    // Call FAL AI API (supports both veo3 and veo3_fast)
    const endpoint = backendPrompt.delivery.engine === 'veo3' 
      ? 'https://fal.run/fal-ai/veo3/image-to-video'
      : 'https://fal.run/fal-ai/veo3/fast/image-to-video';

    const falResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(falRequest),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error('FAL AI API error:', falResponse.status, errorText);
      
      return NextResponse.json(
        { 
          error: `FAL AI API error: ${falResponse.status}`,
          details: errorText
        },
        { status: falResponse.status }
      );
    }

    const falResult = await falResponse.json();
    const ms = Date.now() - t0;
    console.log('[generate-video] success in', ms + 'ms');
    console.log('[generate-video] fal response summary', {
      hasVideo: !!falResult.video?.url,
      requestId: falResult.requestId,
      engine: backendPrompt.delivery.engine
    });

    // Return the video result
    return NextResponse.json({
      video: {
        url: falResult.video?.url,
        content_type: falResult.video?.content_type,
        file_name: falResult.video?.file_name,
        file_size: falResult.video?.file_size,
      },
      requestId: falResult.requestId,
      status: 'completed',
      compiled_prompt: falRequest.prompt, // For debugging
      mode: 'auto'
    });

  } catch (error) {
    console.error('Error in generate-video API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
