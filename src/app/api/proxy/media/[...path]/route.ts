export const dynamic = 'force-dynamic';

const FORWARD_HEADERS = ['content-type','content-length','accept-ranges','content-range','cache-control','etag','last-modified','content-disposition'];

export async function GET(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path } = await context.params;
    const encodedPath = (path || []).join('/');
    if (!encodedPath) {
      return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400 });
    }

    // Decode the path to get the actual storage path
    const decodedPath = decodeURIComponent(encodedPath);
    
    // Construct Zata URL directly
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    const targetUrl = `${ZATA_PREFIX}${decodedPath}`;

    const forwardHeaders: Record<string, string> = {};
    const range = req.headers.get('range');
    if (range) forwardHeaders['range'] = range;
    const cookie = req.headers.get('cookie');
    if (cookie) forwardHeaders['cookie'] = cookie;

    // Add CORS headers for video streaming
    forwardHeaders['Accept'] = '*/*';
    
    const resp = await fetch(targetUrl, { 
      method: 'GET', 
      headers: forwardHeaders,
      // Important: Don't follow redirects automatically for video files
      redirect: 'follow'
    });

    // If the backend proxy doesn't exist, try direct Zata access
    if (!resp.ok && resp.status === 404) {
      // Try direct fetch from Zata
      const directResp = await fetch(targetUrl, { 
        method: 'GET', 
        headers: { 'Range': range || '' }
      });
      
      if (directResp.ok) {
        const outHeaders = new Headers();
        FORWARD_HEADERS.forEach((h) => {
          const v = directResp.headers.get(h);
          if (v) outHeaders.set(h, v);
        });
        // Ensure video content-type is set
        if (!outHeaders.has('content-type')) {
          const ext = decodedPath.split('.').pop()?.toLowerCase();
          if (ext === 'mp4') outHeaders.set('content-type', 'video/mp4');
          else if (ext === 'webm') outHeaders.set('content-type', 'video/webm');
          else if (ext === 'mov') outHeaders.set('content-type', 'video/quicktime');
          else outHeaders.set('content-type', 'video/mp4');
        }
        // Add CORS headers
        outHeaders.set('Access-Control-Allow-Origin', '*');
        outHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        outHeaders.set('Access-Control-Allow-Headers', 'Range');
        outHeaders.set('Accept-Ranges', 'bytes');
        
        return new Response(directResp.body, { status: directResp.status, headers: outHeaders });
      }
    }

    const outHeaders = new Headers();
    FORWARD_HEADERS.forEach((h) => {
      const v = resp.headers.get(h);
      if (v) outHeaders.set(h, v);
    });
    
    // Ensure video content-type is set if missing
    if (!outHeaders.has('content-type')) {
      const ext = decodedPath.split('.').pop()?.toLowerCase();
      if (ext === 'mp4') outHeaders.set('content-type', 'video/mp4');
      else if (ext === 'webm') outHeaders.set('content-type', 'video/webm');
      else if (ext === 'mov') outHeaders.set('content-type', 'video/quicktime');
      else outHeaders.set('content-type', 'video/mp4');
    }
    
    // Add CORS headers for video streaming
    outHeaders.set('Access-Control-Allow-Origin', '*');
    outHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    outHeaders.set('Access-Control-Allow-Headers', 'Range');
    outHeaders.set('Accept-Ranges', 'bytes');

    return new Response(resp.body, { status: resp.status, headers: outHeaders });
  } catch (err: any) {
    console.error('[Proxy Media] Error:', err?.message || err);
    return new Response(JSON.stringify({ error: 'Proxy failed', details: err?.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


