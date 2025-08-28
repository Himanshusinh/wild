import { NextResponse } from 'next/server';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { GeneratedImage } from '@/types/history';

async function pollForResults(pollingUrl: string, apiKey: string) {
  for (let i = 0; i < 60; i++) { // Poll for up to 30 seconds
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between polls
    
    const pollResponse = await fetch(pollingUrl, {
      headers: {
        'accept': 'application/json',
        'x-key': apiKey
      }
    });
    
    const result = await pollResponse.json();
    
    if (result.status === 'Ready') {
      return result.result.sample;
    } else if (result.status === 'Error' || result.status === 'Failed') {
      throw new Error(`Generation failed: ${JSON.stringify(result)}`);
    }
  }
  throw new Error('Timeout waiting for image generation');
}

export async function POST(request: Request) {
  let historyId: string | null = null;

  try {
    const { prompt, userPrompt, model, n = 1, frameSize = '1:1', style = 'realistic', generationType = 'text-to-image', uploadedImages = [] } = await request.json();
    const apiKey = process.env.BFL_API_KEY;

    const promptForHistory = typeof userPrompt === 'string' && userPrompt.trim().length > 0 ? userPrompt : prompt;

    if (!promptForHistory) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Create initial history entry
    historyId = await saveHistoryEntry({
      prompt: promptForHistory,
      model,
      generationType,
      images: [],
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: n,
      status: 'generating',
      frameSize,
      style
    });

    // Helper: map frame size to pixel dimensions (multiples of 32)
    const getDimensions = (ratio: string): { width: number; height: number } => {
      switch (ratio) {
        case '1:1':
          return { width: 1024, height: 1024 };
        case '3:4': // portrait
          return { width: 1024, height: 1344 };
        case '4:3': // landscape
          return { width: 1344, height: 1024 };
        case '16:9':
          return { width: 1280, height: 720 };
        case '21:9':
          return { width: 1344, height: 576 };
        default:
          return { width: 1024, height: 768 };
      }
    };

    // Generate multiple images if requested
    const imagePromises = Array.from({ length: n }, async () => {
      const normalizedModel = (model as string).toLowerCase().replace(/\s+/g, '-');
      const endpoint = `https://api.bfl.ai/v1/${normalizedModel}`;

      // Build payload per model
      let body: any = { prompt };
      if (normalizedModel.includes('kontext')) {
        // Kontext models accept aspect_ratio
        body.aspect_ratio = frameSize;
        body.output_format = 'jpeg';
        if (Array.isArray(uploadedImages) && uploadedImages.length > 0) {
          const [img1, img2, img3, img4] = uploadedImages;
          if (img1) body.input_image = img1;
          if (img2) body.input_image_2 = img2;
          if (img3) body.input_image_3 = img3;
          if (img4) body.input_image_4 = img4;
        }
      } else if (normalizedModel === 'flux-pro' || normalizedModel === 'flux-dev') {
        const { width, height } = getDimensions(frameSize);
        body.width = width;
        body.height = height;
        body.output_format = 'jpeg';
      } else {
        // Fallback to aspect_ratio for other variants
        body.aspect_ratio = frameSize;
        body.output_format = 'jpeg';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate image generation');
      }

      const data = await response.json();

      if (!data.polling_url) {
        throw new Error('No polling URL received');
      }

      // Poll for results
      const imageUrl = await pollForResults(data.polling_url, apiKey);

      return {
        url: imageUrl,
        originalUrl: imageUrl,
        id: data.id
      } as GeneratedImage;
    });

    // Wait for all images to be generated
    const images = await Promise.all(imagePromises);

    // Upload images to Firebase Storage
    const uploadedImagesResult = await uploadGeneratedImages(images);

    // Update history entry with completed images and persist frameSize/style
    if (historyId) {
      await updateHistoryEntry(historyId, {
        images: uploadedImagesResult,
        status: 'completed',
        frameSize,
        style
      });
    }

    // Return the image URLs to the client
    return NextResponse.json({
      images: uploadedImagesResult,
      historyId
    });

  } catch (error) {
    console.error('Error:', error);

    // Update history entry with error status
    if (historyId) {
      try {
        await updateHistoryEntry(historyId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to generate images'
        });
      } catch (historyError) {
        console.error('Error updating history entry:', historyError);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate images' },
      { status: 500 }
    );
  }
}
