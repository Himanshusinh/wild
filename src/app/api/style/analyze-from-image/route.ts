import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageDataUrl = body?.imageDataUrl as string | undefined;
    if (
      !imageDataUrl ||
      typeof imageDataUrl !== "string" ||
      !imageDataUrl.startsWith("data:image/")
    ) {
      return NextResponse.json(
        { ok: false, error: "imageDataUrl must be a data:image/... URL" },
        { status: 400 },
      );
    }

    const base = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE ||
      ""
    ).replace(/\/$/, "");
    if (!base) {
      return NextResponse.json(
        { ok: false, error: "NEXT_PUBLIC_API_BASE_URL is not configured" },
        { status: 500 },
      );
    }

    const url = `${base}/api/style/analyze-from-image`;
    const cookie = req.headers.get("cookie") || "";
    const authorization = req.headers.get("authorization");
    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      cookie,
      "ngrok-skip-browser-warning": "true",
    };
    if (authorization) upstreamHeaders.Authorization = authorization;

    const upstream = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify({ imageDataUrl }),
    });

    const text = await upstream.text();
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Bad response from style analysis service",
          detail: text.slice(0, 200),
        },
        { status: 502 },
      );
    }

    if (!upstream.ok) {
      const msg =
        payload?.message ||
        payload?.data?.message ||
        payload?.error ||
        `upstream ${upstream.status}`;
      return NextResponse.json(
        { ok: false, error: String(msg) },
        { status: upstream.status },
      );
    }

    const inner = payload?.data;
    const styleName =
      typeof inner?.styleName === "string" ? inner.styleName.trim() : "";
    const styleDirective =
      typeof inner?.styleDirective === "string"
        ? inner.styleDirective.trim()
        : "";

    if (!styleName || !styleDirective) {
      return NextResponse.json(
        { ok: false, error: "Incomplete style analysis response" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, styleName, styleDirective });
  } catch (err: any) {
    console.error("[analyze-from-image]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "analyze_failed" },
      { status: 500 },
    );
  }
}
