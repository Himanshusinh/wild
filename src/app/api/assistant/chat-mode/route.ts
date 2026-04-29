import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, history = [], modelId, modelInput, threadId, attachments = [] } = body as {
            message: string;
            history?: Array<{ role: 'user' | 'assistant'; content: string }>;
            modelId?: string;
            modelInput?: Record<string, unknown>;
            threadId?: string;
            attachments?: Array<Record<string, unknown>>;
        };

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json({ error: 'message is required' }, { status: 400 });
        }

        if (!modelId || typeof modelId !== 'string') {
            return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
        }

        const base = (
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            process.env.NEXT_PUBLIC_API_BASE ||
            ''
        ).replace(/\/$/, '');

        const url = `${base}/api/chat/assistant/models`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                cookie: req.headers.get('cookie') || '',
                'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
                message: message.trim(),
                history,
                modelId,
                modelInput,
                threadId,
                attachments,
            }),
        });

        if (!resp.ok) {
            const errText = await resp.text();
            console.error('[AssistantChatModeProxy] Backend error:', resp.status, errText);
            return NextResponse.json({
                reply: "I'm having a moment — please try again!",
                fallback: true,
            });
        }

        const data = await resp.json();
        const reply =
            data?.data?.reply ||
            data?.reply ||
            data?.data?.response ||
            "I'm ready to help you create something amazing!";

        return NextResponse.json({
            reply: reply.trim(),
            thread: data?.data?.thread || null,
            threadId: data?.data?.threadId || data?.data?.thread?.id || null,
        });
    } catch (err: any) {
        console.error('[AssistantChatModeProxy] Error:', err?.message);
        return NextResponse.json({
            reply: "I'm here to help! Describe what you'd like to create.",
            fallback: true,
        });
    }
}
