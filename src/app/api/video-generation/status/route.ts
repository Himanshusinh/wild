import { NextRequest, NextResponse } from 'next/server';
import { queryVideoTaskStatus } from '@/lib/minimax';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    if (process.env.MINIMAX_MOCK === 'true') {
      // After ~15 seconds, mock Success; otherwise Processing
      const createdAt = Number(taskId.replace('mock-', '')) || Date.now();
      const elapsed = Date.now() - createdAt;
      if (elapsed > 15000) {
        return NextResponse.json({
          task_id: taskId,
          status: 'Success',
          file_id: 'mock-file-123',
          base_resp: { status_code: 0, status_msg: 'success' },
        });
      }
      return NextResponse.json({
        task_id: taskId,
        status: 'Processing',
        base_resp: { status_code: 0, status_msg: 'processing' },
      });
    }

    const response = await queryVideoTaskStatus(taskId);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to query video generation status' },
      { status: 500 }
    );
  }
}


