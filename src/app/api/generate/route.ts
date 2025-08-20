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

async function pollMinimaxResults(taskId: string, apiKey: string, baseUrl: string) {
  const pollUrl = `${baseUrl}/query/video_generation`;

  for (let i = 0; i < 120; i++) { // Poll for up to 60 seconds
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between polls

    const pollResponse = await fetch(pollUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ task_id: taskId })
    });

    if (!pollResponse.ok) {
      console.error('MiniMax polling error:', pollResponse.status);
      continue;
    }

    const result = await pollResponse.json();
    console.log('MiniMax poll result:', result);

    if (result.status === 'Success' && result.file_id) {
      return result.file_id;
    } else if (result.status === 'Failed') {
      throw new Error(`MiniMax generation failed: ${JSON.stringify(result)}`);
    }
  }
  throw new Error('Timeout waiting for MiniMax generation');
}

export async function POST(request: Request) {
  let historyId: string | null = null;
  let isMinimaxAudioModel = false;
  let isMinimaxVideoModel = false;
  let model = '';

  try {
    const { prompt, model: requestModel, n = 1, frameSize = '1:1', style = 'realistic' } = await request.json();
    model = requestModel;

    // Get API keys from environment variables
    const fluxApiKey = process.env.FLUX_API_KEY || process.env.BFL_API_KEY; // Support both names
    const minimaxApiKey = process.env.MINIMAX_API_KEY || process.env.MINMAX_API_KEY || process.env.MIN_MAX_API_KEY; // Support multiple names
    const fluxBaseUrl = process.env.FLUX_API_BASE_URL || 'https://api.bfl.ai/v1';
    const minimaxBaseUrl = process.env.MINIMAX_API_BASE_URL || 'https://api.minimax.io/v1';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Determine which API to use based on model
    const isFluxModel = model.includes('flux') || model.includes('logo') || model.includes('sticker') || model.includes('Flux');
    isMinimaxAudioModel = model.startsWith('speech-');
    isMinimaxVideoModel = model.startsWith('MiniMax-') || model.includes('Director') || model === 'S2V-01';

    // Debug: Log environment variables (without showing the actual keys)
    console.log('Environment check:', {
      hasFluxKey: !!fluxApiKey,
      hasMinimaxKey: !!minimaxApiKey,
      fluxKeyLength: fluxApiKey?.length || 0,
      minimaxKeyLength: minimaxApiKey?.length || 0,
      model: model,
      isMinimaxVideo: isMinimaxVideoModel,
      isMinimaxAudio: isMinimaxAudioModel
    });

    let apiKey: string;
    if (isMinimaxAudioModel || isMinimaxVideoModel) {
      if (!minimaxApiKey) {
        console.error('MiniMax API key not found. Check your .env.local file for MINIMAX_API_KEY, MINMAX_API_KEY, or MIN_MAX_API_KEY');
        return NextResponse.json({
          error: 'MiniMax API key not configured. Please check your .env.local file.',
          debug: 'Looking for MINIMAX_API_KEY, MINMAX_API_KEY, or MIN_MAX_API_KEY'
        }, { status: 500 });
      }
      apiKey = minimaxApiKey;
    } else {
      if (!fluxApiKey) {
        return NextResponse.json({ error: 'Flux API key not configured' }, { status: 500 });
      }
      apiKey = fluxApiKey;
    }

    // Create initial history entry
    historyId = await saveHistoryEntry({
      prompt,
      model,
      images: [],
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      imageCount: n,
      status: 'generating'
    });

    // Handle MiniMax API calls (video/audio)
    if (isMinimaxAudioModel || isMinimaxVideoModel) {
      let endpoint = '';
      let requestBody = {};

      if (isMinimaxAudioModel) {
        // Audio generation
        endpoint = `${minimaxBaseUrl}/text_to_speech`;
        requestBody = {
          model: model,
          text: prompt,
          voice_setting: {
            voice_id: style || 'english-neutral',
            speed: 1.0,
            vol: 1.0,
            pitch: 0
          }
        };
      } else if (isMinimaxVideoModel) {
        // Video generation
        endpoint = `${minimaxBaseUrl}/video_generation`;

        // Handle separate duration and resolution values
        // Duration comes from style field (e.g., "6s" -> 6)
        let duration = 6; // default
        if (style && style.includes('s')) {
          const durationStr = style.replace('s', '');
          duration = parseInt(durationStr) || 6;
        }

        // Resolution comes from frameSize field
        let resolution = '1080P'; // default
        if (frameSize) {
          if (frameSize === '1080p' || frameSize.includes('1080')) resolution = '1080P';
          else if (frameSize === '768p' || frameSize.includes('768')) resolution = '768P';
          else if (frameSize === '720p' || frameSize.includes('720')) resolution = '720P';
          else if (frameSize === '512p' || frameSize.includes('512')) resolution = '512P';
          else resolution = '1080P'; // fallback
        }

        requestBody = {
          model: model,
          prompt: prompt,
          duration: duration,
          resolution: resolution
        };

        console.log('Video generation request:', {
          model,
          prompt: prompt.substring(0, 50) + '...',
          duration,
          resolution,
          endpoint,
          originalStyle: style,
          originalFrameSize: frameSize
        });
      }

      console.log('MiniMax API Request:', {
        endpoint,
        model,
        requestBody: JSON.stringify(requestBody, null, 2)
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('MiniMax API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MiniMax API Error Response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(`MiniMax API error (${response.status}): ${errorData.message || errorData.base_resp?.status_msg || response.statusText}`);
      }

      const data = await response.json();
      console.log('MiniMax API Success Response:', JSON.stringify(data, null, 2));

      // Check if MiniMax API returned success
      if (data.base_resp && data.base_resp.status_code !== 0) {
        throw new Error(`MiniMax API error: ${data.base_resp.status_msg || 'Unknown error'}`);
      }

      // For MiniMax, we get a task_id and need to poll for results
      // For now, return the task info with placeholder
      const taskId = data.task_id;
      if (!taskId) {
        throw new Error('No task_id received from MiniMax API');
      }

      const generatedImages: GeneratedImage[] = [{
        id: taskId,
        url: `https://picsum.photos/400/400?random=${Date.now()}`,
        originalUrl: `https://picsum.photos/800/800?random=${Date.now()}`
      }];

      // Update history entry with generating status
      if (historyId) {
        await updateHistoryEntry(historyId, {
          images: generatedImages,
          status: 'generating'
        });
      }

      return NextResponse.json({
        images: generatedImages,
        historyId,
        taskId: taskId,
        message: `${isMinimaxAudioModel ? 'Audio' : 'Video'} generation started. Task ID: ${taskId}`
      });
    }

    // Handle Flux API calls (images) - existing logic
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

    // For development: If MiniMax API fails, provide a mock response for video/audio
    if ((isMinimaxAudioModel || isMinimaxVideoModel) && error instanceof Error && error.message.includes('MiniMax')) {
      console.log('MiniMax API failed, providing mock response for development');

      const mockImages: GeneratedImage[] = [{
        id: `mock-${Date.now()}`,
        url: `https://picsum.photos/400/400?random=${Date.now()}`,
        originalUrl: `https://picsum.photos/800/800?random=${Date.now()}`
      }];

      if (historyId) {
        await updateHistoryEntry(historyId, {
          images: mockImages,
          status: 'completed'
        });
      }

      return NextResponse.json({
        images: mockImages,
        historyId,
        message: `Mock ${isMinimaxAudioModel ? 'audio' : 'video'} generated (API error: ${error.message})`
      });
    }

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
      {
        error: error instanceof Error ? error.message : 'Failed to generate images',
        debug: {
          model,
          isMinimaxVideo: isMinimaxVideoModel,
          isMinimaxAudio: isMinimaxAudioModel
        }
      },
      { status: 500 }
    );
  }
}
