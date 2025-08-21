import { NextRequest, NextResponse } from 'next/server';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { GeneratedImage } from '@/types/history';

const MINIMAX_API_BASE = 'https://api.minimax.io/v1';
const MINIMAX_MODEL = 'image-01';

export async function POST(request: NextRequest) {
  let historyId: string | null = null;

  try {
    const body = await request.json();
    const { 
      prompt, 
      aspect_ratio, 
      width, 
      height, 
      response_format = 'url',
      seed, 
      n = 1, 
      prompt_optimizer = false,
      subject_reference,
      generationType = 'text-to-image',
      style = 'realistic'
    } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt is required' },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (prompt.length > 1500) {
      return NextResponse.json(
        { error: 'Prompt exceeds 1500 characters limit' },
        { status: 400 }
      );
    }

    // Validate n (number of images)
    if (n < 1 || n > 9) {
      return NextResponse.json(
        { error: 'n must be between 1 and 9' },
        { status: 400 }
      );
    }

    // Validate aspect ratio
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9'];
    if (aspect_ratio && !validAspectRatios.includes(aspect_ratio)) {
      return NextResponse.json(
        { error: 'Invalid aspect_ratio. Must be one of: ' + validAspectRatios.join(', ') },
        { status: 400 }
      );
    }

    // Validate width and height if provided
    if (width !== undefined || height !== undefined) {
      if (width === undefined || height === undefined) {
        return NextResponse.json(
          { error: 'Both width and height must be provided together' },
          { status: 400 }
        );
      }
      
      if (width < 512 || width > 2048 || height < 512 || height > 2048) {
        return NextResponse.json(
          { error: 'Width and height must be between 512 and 2048 pixels' },
          { status: 400 }
        );
      }
      
      if (width % 8 !== 0 || height % 8 !== 0) {
        return NextResponse.json(
          { error: 'Width and height must be multiples of 8' },
          { status: 400 }
        );
      }
    }

    // Validate subject_reference if provided
    if (subject_reference) {
      if (!Array.isArray(subject_reference) || subject_reference.length !== 1) {
        return NextResponse.json(
          { error: 'subject_reference must be an array with exactly 1 element' },
          { status: 400 }
        );
      }
      
      const ref = subject_reference[0];
      if (ref.type !== 'character') {
        return NextResponse.json(
          { error: 'subject_reference type must be "character"' },
          { status: 400 }
        );
      }
      
      if (!ref.image_file) {
        return NextResponse.json(
          { error: 'subject_reference image_file is required' },
          { status: 400 }
        );
      }
    }

    // Get API key from environment
    const apiKey = process.env.MINIMAX_API_KEY;
    console.log('MiniMax API key configured:', !!apiKey);
    console.log('MiniMax API key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MiniMax API key not configured' },
        { status: 500 }
      );
    }

    // Create initial history entry
    historyId = await saveHistoryEntry({
      prompt,
      model: MINIMAX_MODEL,
      generationType,
      images: [],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: n,
      status: 'generating',
      frameSize: aspect_ratio || `${width}:${height}`,
      style
    });

    // Prepare request payload
    const payload: any = {
      model: MINIMAX_MODEL,
      prompt,
      response_format,
      n,
      prompt_optimizer
    };

    if (aspect_ratio) {
      payload.aspect_ratio = aspect_ratio;
    }

    if (width !== undefined && height !== undefined) {
      payload.width = width;
      payload.height = height;
    }

    if (seed !== undefined) {
      payload.seed = seed;
    }

    if (subject_reference) {
      payload.subject_reference = subject_reference;
    }

    // Make request to MiniMax API
    console.log('MiniMax API request payload:', JSON.stringify(payload, null, 2));
    console.log('MiniMax API endpoint:', `${MINIMAX_API_BASE}/image_generation`);
    
    const response = await fetch(`${MINIMAX_API_BASE}/image_generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('MiniMax API response status:', response.status);
    console.log('MiniMax API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('MiniMax API error response:', errorData);
      return NextResponse.json(
        { 
          error: 'MiniMax API request failed', 
          details: errorData,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Debug: Log the response structure
    console.log('MiniMax API response:', JSON.stringify(data, null, 2));
    
    // Check MiniMax-specific status codes
    if (data.base_resp && data.base_resp.status_code !== 0) {
      return NextResponse.json(
        { 
          error: `MiniMax API error: ${data.base_resp.status_msg}`,
          status_code: data.base_resp.status_code,
          details: data
        },
        { status: 400 }
      );
    }

    // Check if we have the expected data structure
    if (!data.data) {
      console.error('MiniMax API response missing data field:', data);
      return NextResponse.json(
        { 
          error: 'MiniMax API response missing data field',
          details: data
        },
        { status: 400 }
      );
    }

    // Try different possible response structures
    let imageUrls: string[] = [];
    
    if (data.data.image_urls && Array.isArray(data.data.image_urls)) {
      imageUrls = data.data.image_urls;
    } else if (data.data.images && Array.isArray(data.data.images)) {
      imageUrls = data.data.images;
    } else if (data.data.urls && Array.isArray(data.data.urls)) {
      imageUrls = data.data.urls;
    } else if (Array.isArray(data.data)) {
      // If data itself is an array
      imageUrls = data.data;
    } else {
      console.error('MiniMax API response missing image URLs:', data.data);
      return NextResponse.json(
        { 
          error: 'MiniMax API response missing image URLs',
          details: data.data
        },
        { status: 400 }
      );
    }

    // Validate that we have URLs
    if (imageUrls.length === 0) {
      return NextResponse.json(
        { 
          error: 'No image URLs returned from MiniMax API',
          details: data.data
        },
        { status: 400 }
      );
    }

    // Convert MiniMax response to our format
    const images: GeneratedImage[] = imageUrls.map((url: string, index: number) => ({
      id: `${data.id || Date.now()}-${index}`,
      url,
      originalUrl: url
    }));

    // Upload images to Firebase Storage
    const uploadedImagesResult = await uploadGeneratedImages(images);

    // Update history entry with completed images
    if (historyId) {
      await updateHistoryEntry(historyId, {
        images: uploadedImagesResult,
        status: 'completed',
        frameSize: aspect_ratio || `${width}:${height}`,
        style
      });
    }

    // Return the image URLs to the client
    return NextResponse.json({
      images: uploadedImagesResult,
      historyId,
      id: data.id
    });

  } catch (error) {
    console.error('MiniMax API error:', error);

    // Update history entry with error status
    if (historyId) {
      try {
        await updateHistoryEntry(historyId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to generate images with MiniMax'
        });
      } catch (historyError) {
        console.error('Error updating history entry:', historyError);
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
