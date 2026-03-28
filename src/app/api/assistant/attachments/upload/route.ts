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

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const base = getBackendBaseUrl();
        const resp = await fetch(`${base}/api/chat/assistant/attachments/upload`, {
            method: 'POST',
            headers: {
                cookie: req.headers.get('cookie') || '',
                'ngrok-skip-browser-warning': 'true',
            },
            body: formData,
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (err: any) {
        return NextResponse.json({ responseStatus: 'error', message: err?.message || 'Failed to upload assistant attachment' }, { status: 500 });
    }
}
