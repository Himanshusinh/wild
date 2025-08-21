import { NextRequest, NextResponse } from 'next/server';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { GeneratedImage } from '@/types/history';

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

export async function POST(request: NextRequest) {
  let historyId: string | null = null;

  try {
    console.log('=== RUNWAY API ROUTE STARTED ===');
    const body = await request.json();
    const { promptText, ratio, model, seed, uploadedImages, contentModeration, generationType = 'text-to-image', style = 'realistic', existingHistoryId } = body;

    console.log('Request body:', {
      promptText,
      ratio,
      model,
      generationType,
      style,
      uploadedImagesCount: uploadedImages?.length || 0,
      existingHistoryId
    });

    // Validate required fields
    if (!promptText || !ratio || !model) {
      console.error('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: promptText, ratio, and model are required' },
        { status: 400 }
      );
    }

    // Validate model
    if (!['gen4_image', 'gen4_image_turbo'].includes(model)) {
      console.error('Validation failed: Invalid model:', model);
      return NextResponse.json(
        { error: 'Invalid model. Must be either "gen4_image" or "gen4_image_turbo"' },
        { status: 400 }
      );
    }

    // Validate ratio
    const validRatios = [
      "1920:1080", "1080:1920", "1024:1024", "1360:768", "1080:1080",
      "1168:880", "1440:1080", "1080:1440", "1808:768", "2112:912",
      "1280:720", "720:1280", "720:720", "960:720", "720:960", "1680:720"
    ];
    
    if (!validRatios.includes(ratio)) {
      console.error('Validation failed: Invalid ratio:', ratio);
      return NextResponse.json(
        { error: 'Invalid ratio. Must be one of the accepted values' },
        { status: 400 }
      );
    }

    // For gen4_image_turbo, at least one reference image is required
    console.log('=== VALIDATING REFERENCE IMAGES ===');
    console.log('Model:', model);
    console.log('Uploaded images received:', uploadedImages);
    console.log('Uploaded images length:', uploadedImages?.length || 0);
    console.log('Validation condition:', model === 'gen4_image_turbo' && (!uploadedImages || uploadedImages.length === 0));
    
    if (model === 'gen4_image_turbo' && (!uploadedImages || uploadedImages.length === 0)) {
      console.error('Validation failed: gen4_image_turbo requires reference image');
      return NextResponse.json(
        { error: 'gen4_image_turbo requires at least one reference image' },
        { status: 400 }
      );
    }
    
    console.log('✅ Reference image validation passed');

    // Get API key from environment
    const apiKey = process.env.RUNWAY_API_KEY;
    console.log('Runway API key configured:', !!apiKey);
    if (!apiKey) {
      console.error('Runway API key not configured');
      return NextResponse.json(
        { error: 'Runway API key not configured' },
        { status: 500 }
      );
    }

    // Use existing history ID if provided, otherwise create new one
    if (existingHistoryId) {
      historyId = existingHistoryId;
      console.log('Using existing history ID:', historyId);
    } else {
      // Create initial history entry
      console.log('Creating new history entry...');
      historyId = await saveHistoryEntry({
        prompt: promptText,
        model,
        generationType,
        images: [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1, // Runway generates one image per request
        status: 'generating',
        frameSize: ratio,
        style
      });
      console.log('New history entry created with ID:', historyId);
    }

    // Prepare request payload
    const payload: any = {
      promptText,
      ratio,
      model,
      contentModeration: contentModeration || { publicFigureThreshold: "auto" }
    };

    if (seed !== undefined) {
      payload.seed = seed;
    }

    if (uploadedImages && uploadedImages.length > 0) {
      // Transform uploadedImages (base64 strings) to referenceImages format expected by Runway
      payload.referenceImages = uploadedImages.map((imageData: string, index: number) => ({
        uri: imageData,
        tag: `ref_${index + 1}`
      }));
      
      console.log('Transformed referenceImages for Runway API:', payload.referenceImages);
    }

    console.log('Runway API payload:', payload);
    console.log('Reference images structure:', payload.referenceImages);
    console.log('Making request to Runway API...');

    // Make request to Runway API
    const response = await fetch(`${RUNWAY_API_BASE}/text_to_image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': RUNWAY_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Runway API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Runway API request failed:', errorData);
      return NextResponse.json(
        { 
          error: 'Runway API request failed', 
          details: errorData,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Runway API response data:', data);
    
    // Return the task ID for polling (the client will handle the completion)
    console.log('Returning taskId and historyId for client polling');
    console.log('=== RUNWAY API ROUTE COMPLETED ===');
    
    return NextResponse.json({
      taskId: data.id,
      historyId,
      status: 'pending',
      isExistingHistory: !!existingHistoryId
    });

  } catch (error) {
    console.error('=== RUNWAY API ROUTE ERROR ===');
    console.error('Runway API error:', error);

    // Update history entry with error status
    if (historyId) {
      try {
        console.log('Updating history entry to failed status...');
        await updateHistoryEntry(historyId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to start Runway generation'
        });
        console.log('History entry updated to failed status');
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
