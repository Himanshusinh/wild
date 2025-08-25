import { NextRequest, NextResponse } from 'next/server';
import { createMiniMaxService } from '@/lib/minimaxService';
import { MiniMaxVideoGenerationRequest } from '@/lib/minimaxTypes';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === MINIMAX VIDEO GENERATION API CALLED ===');
    console.log('📥 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const body: MiniMaxVideoGenerationRequest = await request.json();
    console.log('📥 Request body received:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.model) {
      console.error('❌ Model validation failed: model is missing');
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

    console.log('🚀 MiniMax video generation request details:', {
      model: body.model,
      duration: body.duration,
      resolution: body.resolution,
      hasPrompt: !!body.prompt,
      promptLength: body.prompt?.length || 0,
      hasFirstFrame: !!body.first_frame_image,
      hasSubjectReference: !!body.subject_reference,
      subjectReferenceType: body.subject_reference ? typeof body.subject_reference : 'undefined'
    });

    // Start video generation - only get task_id
    console.log('🔄 Calling MiniMax service...');
    const result = await minimaxService.generateVideo(body);
    console.log('📤 MiniMax service response:', JSON.stringify(result, null, 2));

    console.log('✅ MiniMax video generation task created, taskId:', result.taskId);
    console.log('✅ TaskId type:', typeof result.taskId);
    console.log('✅ TaskId length:', result.taskId ? result.taskId.length : 'undefined');
    console.log("result : ",result)
    

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
