import { NextRequest, NextResponse } from 'next/server';
import { saveHistoryEntry, updateHistoryEntry } from '@/lib/historyService';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { GeneratedImage } from '@/types/history';

// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

export async function POST(request: NextRequest) {
  let historyId: string | null = null;

  try {
    const { 
      prompt, 
      userPrompt, 
      model, 
      n = 1, 
      frameSize = '1:1', 
      style = 'realistic', 
      generationType = 'text-to-image', 
      uploadedImages = [],
      historyId: providedHistoryId,
      output_format = 'jpeg'
    } = await request.json();

    console.log('FAL API route called with:', { model, prompt: prompt?.substring(0, 50) + '...', n, frameSize, style });

    const falKey = process.env.FAL_KEY;
    const promptForHistory = typeof userPrompt === 'string' && userPrompt.trim().length > 0 ? userPrompt : prompt;

    if (!promptForHistory) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!falKey) {
      console.error('FAL_KEY environment variable not set');
      return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
    }

    // Configure FAL client
    fal.config({ credentials: falKey });

    // Use existing history if provided, otherwise create a new one
    if (typeof providedHistoryId === 'string' && providedHistoryId.trim().length > 0) {
      historyId = providedHistoryId;
      console.log('Reusing provided historyId for FAL generation:', historyId);
    } else {
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
      console.log('Created Firebase history entry:', historyId);
    }

    // Resolve model endpoint (edit variant when images provided)
    let modelEndpoint = '';
    if (model === 'gemini-25-flash-image') {
      modelEndpoint = uploadedImages && uploadedImages.length > 0
        ? 'fal-ai/gemini-25-flash-image/edit'
        : 'fal-ai/gemini-25-flash-image';
    } else {
      throw new Error(`Unsupported FAL model: ${model}`);
    }
    console.log('Using FAL model endpoint:', modelEndpoint, 'uploadedImages:', uploadedImages?.length || 0);

    // Generate images using FAL API
    const imagePromises = Array.from({ length: n }, async (_, index) => {
      console.log(`Generating image ${index + 1}/${n} using FAL model: ${modelEndpoint}`);
      
      // Prepare input payload for FAL API
      const input: any = {
        prompt: prompt,
        output_format: output_format
      };

      // Handle t2i and i2i/edit variants
      if (modelEndpoint === 'fal-ai/gemini-25-flash-image') {
        input.num_images = 1; // Generate one image per call
      } else if (modelEndpoint === 'fal-ai/gemini-25-flash-image/edit') {
        input.num_images = 1;
        // Pass up to 4 images; can be URLs or Data URIs
        input.image_urls = (uploadedImages || []).slice(0, 4);
      }

      try {
        const result = await fal.subscribe(modelEndpoint, {
          input: input,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log(`FAL generation progress for image ${index + 1}:`, update.status);
              if (update.logs) {
                update.logs.map((log) => log.message).forEach(console.log);
              }
            }
          },
        });

        console.log(`FAL generation completed for image ${index + 1}:`, result.requestId);
        console.log('FAL result data:', result.data);

        // Extract image URL from result
        let imageUrl = '';
        if (result.data && result.data.images && result.data.images.length > 0) {
          imageUrl = result.data.images[0].url;
        }

        if (!imageUrl) {
          throw new Error('No image URL returned from FAL API');
        }

        return {
          url: imageUrl,
          originalUrl: imageUrl,
          id: result.requestId || `fal-${Date.now()}-${index}`
        } as GeneratedImage;

      } catch (error) {
        console.error(`FAL generation failed for image ${index + 1}:`, error);
        throw error;
      }
    });

    // Wait for all images to be generated
    console.log('Waiting for all FAL generations to complete...');
    const images = await Promise.all(imagePromises);
    console.log('All FAL generations completed:', images.length, 'images');

    // Upload images to Firebase Storage
    console.log('Uploading images to Firebase Storage...');
    const uploadedImagesResult = await uploadGeneratedImages(images);
    console.log('Images uploaded to Firebase Storage:', uploadedImagesResult.length);

    // Update history entry with completed images
    if (historyId) {
      await updateHistoryEntry(historyId, {
        images: uploadedImagesResult,
        status: 'completed',
        frameSize,
        style
      });
      console.log('Updated Firebase history entry with completed status');
    }

    // Return the image URLs to the client
    return NextResponse.json({
      images: uploadedImagesResult,
      historyId,
      model: model,
      status: 'completed'
    });

  } catch (error) {
    console.error('FAL API route error:', error);

    // Update history entry with error status
    if (historyId) {
      try {
        await updateHistoryEntry(historyId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Failed to generate images with FAL API'
        });
        console.log('Updated Firebase history entry with failed status');
      } catch (historyError) {
        console.error('Error updating history entry:', historyError);
      }
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate images with FAL API'
      },
      { status: 500 }
    );
  }
}
