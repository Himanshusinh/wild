export const dynamic = 'force-dynamic';

// Save an uploaded image/video as a reusable "upload" in the media library.
// This proxies to the backend WildMind uploads endpoint (not canvas).
export async function POST(req: Request) {
  try {
    const apiBase =
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      '';

    const bodyText = await req.text();

    const resp = await fetch(`${apiBase}/api/uploads/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: bodyText,
      credentials: 'include',
    });

    const text = await resp.text();
    const contentType = resp.headers.get('content-type') || 'application/json';

    let data: any = text;
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { responseStatus: 'error', message: 'Invalid JSON from backend', raw: text };
      }
    }

    return new Response(
      typeof data === 'string' ? data : JSON.stringify(data),
      {
        status: resp.status,
        headers: {
          'Content-Type': contentType,
        },
      },
    );
  } catch (e: any) {
    console.error('[NEXT_API][uploads/save] Error:', e);
    return new Response(
      JSON.stringify({
        responseStatus: 'error',
        message: e?.message || 'Failed to save upload',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

