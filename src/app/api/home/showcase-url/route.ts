import { NextResponse } from "next/server";
import { DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL } from "@/config/homeShowcaseDefaults";

/**
 * Runtime config for the homepage studio iframe. Server env is read on each request, so Vercel
 * changes to `WILDMIND_CANVAS_SHOWCASE_URL` apply without a new client bundle (unlike
 * `NEXT_PUBLIC_*`, which is inlined at build time).
 *
 * If unset, uses {@link DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL} so every visitor sees the
 * public showcase without configuring env.
 */
export function GET() {
  const showcaseUrl = (
    process.env.WILDMIND_CANVAS_SHOWCASE_URL ||
    process.env.NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL ||
    DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL
  ).trim();
  const legacyEmbedUrl = (
    process.env.WILDMIND_STUDIO_EMBED_URL ||
    process.env.NEXT_PUBLIC_WILDMIND_STUDIO_EMBED_URL ||
    ""
  ).trim();
  const iframeEnv = process.env.NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_IFRAME;
  const useIframe = iframeEnv !== "false" && iframeEnv !== "0";

  return NextResponse.json({
    showcaseUrl,
    legacyEmbedUrl,
    useIframe,
  });
}
