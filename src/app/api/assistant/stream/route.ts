import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body as { message?: string; sessionId?: string };

    if (!message || typeof message !== "string" || !message.trim() || !sessionId) {
      return new Response(JSON.stringify({ ok: false, error: "MISSING_PARAMS" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const base = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "http://127.0.0.1:5000"
    ).replace(/\/$/, "");

    const url = `${base}/api/assistant/stream`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward cookies for auth/session
        cookie: req.headers.get("cookie") || "",
        // Forward Authorization if present (e.g. bearer token auth)
        authorization: req.headers.get("authorization") || "",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ message: message.trim(), sessionId }),
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      return new Response(
        JSON.stringify({
          ok: false,
          error: "UPSTREAM_ERROR",
          status: upstream.status,
          message: errText || "Upstream /api/assistant/stream failed",
        }),
        { status: upstream.status || 502, headers: { "Content-Type": "application/json" } },
      );
    }

    // Pass through SSE headers
    const headers = new Headers();
    headers.set("Content-Type", "text/event-stream; charset=utf-8");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");

    return new Response(upstream.body, { status: 200, headers });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: "STREAM_PROXY_FAILED", message: e?.message || "Failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

