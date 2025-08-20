import { NextRequest, NextResponse } from 'next/server';
import { createVideoTask, type CreateVideoTaskRequest } from '@/lib/minimax';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateVideoTaskRequest;
    if (!body?.model) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 });
    }

    if (process.env.MINIMAX_MOCK === 'true') {
      const taskId = `mock-${Date.now()}`;
      return NextResponse.json({
        task_id: taskId,
        base_resp: { status_code: 0, status_msg: 'success' },
      });
    }

    const response = await createVideoTask(body);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create video generation task' },
      { status: 500 }
    );
  }
}


