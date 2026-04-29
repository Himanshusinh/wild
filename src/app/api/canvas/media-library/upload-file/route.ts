import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBackendBaseUrl() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    ''
  ).replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const base = getBackendBaseUrl();
    if (!base) {
      return NextResponse.json(
        {
          responseStatus: 'error',
          message: 'Backend API base URL is not configured',
        },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const authHeader = req.headers.get('authorization');
    const cookieHeader = req.headers.get('cookie') || '';

    const resp = await fetch(`${base}/api/canvas/media-library/upload-file`, {
      method: 'POST',
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    });

    const text = await resp.text();
    const contentType = resp.headers.get('content-type') || 'application/json';
    return new Response(text, {
      status: resp.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        responseStatus: 'error',
        message: err?.message || 'Failed to upload media file',
      },
      { status: 500 },
    );
  }
}

