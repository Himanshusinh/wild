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
    const { prompt, model, n = 1, frameSize = '1:1', style = 'realistic', generationType = 'text-to-image' } = await request.json();
    const apiKey = process.env.BFL_API_KEY;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Create initial history entry
    historyId = await saveHistoryEntry({
      prompt,
      model,
      generationType,
      images: [],
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      imageCount: n,
      status: 'generating'
    });

    // Generate multiple images if requested
    const imagePromises = Array.from({ length: n }, async () => {
      const response = await fetch(`https://api.bfl.ai/v1/${model.toLowerCase().replace(' ', '-')}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspect_ratio: frameSize,
        }),
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
    const uploadedImages = await uploadGeneratedImages(images);

    // Update history entry with completed images
    if (historyId) {
      await updateHistoryEntry(historyId, {
        images: uploadedImages,
        status: 'completed'
      });
    }

    // Return the image URLs to the client
    return NextResponse.json({
      images: uploadedImages,
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
