import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the LOCAL_UPSCALE_GENERATION_MODEL environment variable
    const localApiBase = process.env.LOCAL_UPSCALE_GENERATION_MODEL;
    
    if (!localApiBase) {
      return NextResponse.json(
        { error: 'LOCAL_UPSCALE_GENERATION_MODEL environment variable not configured' },
        { status: 500 }
      );
    }

    // Get the FormData from the request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const prompt = (formData.get('prompt') as string) || '';
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Create a new FormData to forward to the local API
    const localFormData = new FormData();
    localFormData.append('image', imageFile);
    if (prompt && prompt.trim().length > 0) {
      localFormData.append('prompt', prompt.trim());
    }

    // Make request to local upscale API
    const response = await fetch(`${localApiBase}/generate/upscale`, {
      method: 'POST',
      body: localFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Local upscale API error:', errorText);
      return NextResponse.json(
        { error: `Local upscale API failed: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Return the result with both image_url and absolute_url
    return NextResponse.json({
      image_url: result.image_url,
      absolute_url: result.absolute_url,
    });

  } catch (error) {
    console.error('Upscale generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate upscaled image',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
