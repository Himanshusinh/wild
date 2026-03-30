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

export async function GET(req: NextRequest) {
    try {
        const base = getBackendBaseUrl();
        const url = new URL(`${base}/api/chat/assistant/threads`);
        const mode = req.nextUrl.searchParams.get('mode');
        const limit = req.nextUrl.searchParams.get('limit');
        if (mode) url.searchParams.set('mode', mode);
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
        return NextResponse.json({ responseStatus: 'error', message: err?.message || 'Failed to load assistant threads' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const base = getBackendBaseUrl();
        const resp = await fetch(`${base}/api/chat/assistant/threads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                cookie: req.headers.get('cookie') || '',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify(body),
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (err: any) {
        return NextResponse.json({ responseStatus: 'error', message: err?.message || 'Failed to create assistant thread' }, { status: 500 });
    }
}
