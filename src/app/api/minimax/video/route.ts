import { NextRequest, NextResponse } from 'next/server';
import { createMiniMaxService } from '@/lib/minimaxService';
import { MiniMaxVideoGenerationRequest } from '@/lib/minimaxTypes';

export async function POST(request: NextRequest) {
  try {
    const body: MiniMaxVideoGenerationRequest = await request.json();
    
    // Validate required fields
    if (!body.model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    // Get API credentials from environment variables
    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;

    if (!apiKey || !groupId) {
      console.error('❌ MiniMax API credentials not configured');
      return NextResponse.json(
        { error: 'MiniMax API not configured' },
        { status: 500 }
      );
    }

    // Create MiniMax service instance
    const minimaxService = createMiniMaxService(apiKey, groupId);

    console.log('🚀 MiniMax video generation request:', {
      model: body.model,
      duration: body.duration,
      resolution: body.resolution,
      hasPrompt: !!body.prompt,
      hasFirstFrame: !!body.first_frame_image,
      hasSubjectReference: !!body.subject_reference
    });

    // Start video generation - only get task_id
    const result = await minimaxService.generateVideo(body);

    console.log('✅ MiniMax video generation task created:', result.taskId);

    // Only return task_id according to documentation
    return NextResponse.json({
      success: true,
      taskId: result.taskId
    });

  } catch (error) {
    console.error('❌ MiniMax video generation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Video generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
