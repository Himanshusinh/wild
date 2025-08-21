import { NextRequest, NextResponse } from 'next/server';
import { buildImageToVideoBody, buildVideoToVideoBody } from '../../../../lib/videoGenerationBuilders';
import { ImageToVideoState, VideoToVideoState } from '../../../../types/videoGeneration';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
const RUNWAY_BASE_URL = 'https://api.dev.runwayml.com';

export async function POST(request: NextRequest) {
  try {
    if (!RUNWAY_API_KEY) {
      return NextResponse.json({ error: 'Runway API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { mode, imageToVideo, videoToVideo } = body;

    let requestBody: any;
    let endpoint: string;

    if (mode === 'image_to_video') {
      // Validate and build image-to-video request
      try {
        requestBody = buildImageToVideoBody(imageToVideo as ImageToVideoState);
        endpoint = '/v1/image_to_video';
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else if (mode === 'video_to_video') {
      // Validate and build video-to-video request
      try {
        requestBody = buildVideoToVideoBody(videoToVideo as VideoToVideoState);
        endpoint = '/v1/video_to_video';
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid mode. Must be "image_to_video" or "video_to_video"' }, { status: 400 });
    }

    console.log('=== RUNWAY VIDEO GENERATION REQUEST ===');
    console.log('Mode:', mode);
    console.log('Endpoint:', endpoint);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${RUNWAY_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Runway API error:', responseData);
      return NextResponse.json({ 
        error: 'Runway API error', 
        details: responseData 
      }, { status: response.status });
    }

    console.log('=== RUNWAY VIDEO GENERATION RESPONSE ===');
    console.log('Response:', responseData);

    return NextResponse.json({
      success: true,
      taskId: responseData.id,
      mode,
      endpoint
    });

  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
