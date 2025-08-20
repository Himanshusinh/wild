import { NextRequest, NextResponse } from 'next/server';
import { retrieveFile } from '@/lib/minimax';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');
    const groupId = searchParams.get('group_id');
    if (!fileId) {
      return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
    }

    if (process.env.MINIMAX_MOCK === 'true') {
      return NextResponse.json({
        file: {
          file_id: fileId,
          bytes: 1234567,
          created_at: Math.floor(Date.now() / 1000),
          filename: 'mock-video.mp4',
          purpose: 'retrieval',
          download_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          backup_download_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        },
        base_resp: { status_code: 0, status_msg: 'success' },
      });
    }
    // Try GET then POST in lib
    const response = await retrieveFile({ groupId, fileId });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}


