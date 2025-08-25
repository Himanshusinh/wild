import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 === MINIMAX STATUS CHECK API CALLED ===');
    console.log('📥 Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    console.log('🔍 Task ID from query params:', taskId);
    console.log('🔍 Task ID type:', typeof taskId);
    console.log('🔍 Task ID length:', taskId ? taskId.length : 'undefined');

    if (!taskId) {
      console.error('❌ Task ID validation failed: task_id is missing');
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;

    if (!apiKey || !groupId) {
      return NextResponse.json({ error: 'MiniMax API configuration missing' }, { status: 500 });
    }

    const response = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax status API error:', response.status, errorText);
      return NextResponse.json({ error: `MiniMax API error: ${response.status}` }, { status: response.status });
    }

    const result = await response.json();
    console.log('MiniMax status API response:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('MiniMax status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
