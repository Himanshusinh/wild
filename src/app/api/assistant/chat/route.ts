import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, history } = body as {
            message: string;
            history?: Array<{ role: 'user' | 'assistant'; content: string }>;
        };

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'message is required' }, { status: 400 });
        }

        const base = (
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            process.env.NEXT_PUBLIC_API_BASE ||
            ''
        ).replace(/\/$/, '');

        // Call the new /api/chat/assistant endpoint on the backend
        const url = `${base}/api/chat/assistant`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward cookies for any session context
                cookie: req.headers.get('cookie') || '',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({ message: message.trim(), history: history ?? [] }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            console.error('[AssistantChatProxy] Backend error:', resp.status, errText);
            return NextResponse.json({
                reply: "I'm having a moment — please try again!",
                fallback: true,
            });
        }

        // Backend returns: { responseStatus, message, data: { reply } }
        const data = await resp.json();
        const reply =
            data?.data?.reply ||
            data?.reply ||
            data?.data?.response ||
            "I'm ready to help you create something amazing!";

        return NextResponse.json({ reply: reply.trim() });
    } catch (err: any) {
        console.error('[AssistantChatProxy] Error:', err?.message);
        return NextResponse.json({
            reply: "I'm here to help! Describe what you'd like to create.",
            fallback: true,
        });
    }
}
