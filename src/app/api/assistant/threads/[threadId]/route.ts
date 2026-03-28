import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBackendBaseUrl() {
    return (
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE ||
        ''
    ).replace(/\/$/, '');
}

export async function GET(req: NextRequest, context: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await context.params;
        const base = getBackendBaseUrl();
        const url = new URL(`${base}/api/chat/assistant/threads/${threadId}`);
        const limit = req.nextUrl.searchParams.get('limit');
        if (limit) url.searchParams.set('limit', limit);

        const resp = await fetch(url.toString(), {
            headers: {
                cookie: req.headers.get('cookie') || '',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (err: any) {
        return NextResponse.json({ responseStatus: 'error', message: err?.message || 'Failed to load assistant thread' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ threadId: string }> }) {
    try {
        const { threadId } = await context.params;
        const base = getBackendBaseUrl();
        const resp = await fetch(`${base}/api/chat/assistant/threads/${threadId}`, {
            method: 'DELETE',
            headers: {
                cookie: req.headers.get('cookie') || '',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (err: any) {
        return NextResponse.json({ responseStatus: 'error', message: err?.message || 'Failed to delete assistant thread' }, { status: 500 });
    }
}
