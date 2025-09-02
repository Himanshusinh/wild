import { NextResponse } from 'next/server';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { GeneratedImage } from '@/types/history';
// @ts-ignore - runtime dependency provided in production
import { fal } from '@fal-ai/client';

function addCacheBuster(urlString: string): string {
  try {
    const u = new URL(urlString);
    u.searchParams.set('_', Date.now().toString());
    return u.toString();
  } catch {
    const sep = urlString.includes('?') ? '&' : '?';
    return `${urlString}${sep}_=${Date.now()}`;
  }
}

async function pollKontext(pollingUrl: string, apiKey: string, reqId?: string) {
  let lastStatus: any = null;
  for (let i = 0; i < 240; i++) { // ~120s
    const pollUrl = addCacheBuster(pollingUrl);
    const res = await fetch(pollUrl, {
      headers: { 'accept': 'application/json', 'x-key': apiKey },
      cache: 'no-store'
    });
    // Debug: log raw response text for troubleshooting provider errors
    const rawClone = res.clone();
    const rawText = await rawClone.text().catch(() => '');
    let data: any = {};
    try {
      data = await res.json();
    } catch {
      // fall back to parsing rawText if possible
      try { data = JSON.parse(rawText); } catch {}
    }
    lastStatus = data;
    const status = (data?.status || '').toString().toLowerCase();
    if (i % 6 === 0) {
      console.log('[live-chat] poll', { reqId, i, httpStatus: res.status, providerStatus: status, hasResult: !!data?.result, pollUrl, rawText });
    }
    if (status === 'ready' || status === 'completed' || status === 'success') return data?.result?.sample || data?.result?.output || data?.output;
    if (!res.ok || status === 'error' || status === 'failed') throw new Error(JSON.stringify(data));

    // honor Retry-After header if provided
    const retryAfterHeader = res.headers.get('retry-after');
    const retryMs = retryAfterHeader ? Math.max(0, Math.min(5000, Math.floor(parseFloat(retryAfterHeader) * 1000))) : 500;
    await new Promise((r) => setTimeout(r, isNaN(retryMs) ? 500 : retryMs));
  }
  throw new Error(`Timeout waiting for live-chat image. lastStatus=${JSON.stringify(lastStatus)}`);
}

export async function POST(request: Request) {
  try {
    const {
      prompt,
      model,
      frameSize = '1:1',
      uploadedImages = [],
      seed,
      prompt_upsampling,
      safety_tolerance,
      webhook_url,
      webhook_secret,
    } = await request.json();
    const reqId = `lc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const normalizedModel = (model as string).toLowerCase().replace(/\s+/g, '-');
    
    // Branch: flux-kontext flow (existing)
    if (normalizedModel.includes('kontext')) {
      const endpoint = `https://api.bfl.ai/v1/${normalizedModel}`;
    // Normalize/validate aspect ratio; fall back to '1:1' if malformed
    const normalizedRatio = typeof frameSize === 'string' && /^(\d{1,2}:\d{1,2})$/.test(frameSize) ? frameSize : '1:1';
    const body: any = { prompt, aspect_ratio: normalizedRatio, output_format: 'jpeg' };
    if (typeof seed === 'number') body.seed = seed;
    body.prompt_upsampling = typeof prompt_upsampling === 'boolean' ? prompt_upsampling : false;
    if (typeof safety_tolerance === 'number') {
      body.safety_tolerance = Math.max(0, Math.min(6, Math.floor(safety_tolerance)));
    } else {
      body.safety_tolerance = 2;
    }
    if (typeof webhook_url === 'string') body.webhook_url = webhook_url;
    if (typeof webhook_secret === 'string') body.webhook_secret = webhook_secret;
    // Ensure references are base64 data URLs to avoid provider access issues to signed URLs
    if (Array.isArray(uploadedImages) && uploadedImages.length > 0) {
      const toDataUrl = async (u: string): Promise<string> => {
        if (typeof u === 'string' && u.startsWith('data:')) return u;
        try {
          const r = await fetch(u, { cache: 'no-store' });
          const contentType = r.headers.get('content-type') || 'image/jpeg';
          const ab = await r.arrayBuffer();
          const b64 = Buffer.from(ab).toString('base64');
          return `data:${contentType};base64,${b64}`;
        } catch (e) {
          console.warn('[live-chat] ref fetch failed, falling back to URL', { reqId, preview: typeof u === 'string' ? u.slice(0, 64) : '' });
          return u;
        }
      };
      const refs = await Promise.all(uploadedImages.slice(0,4).map(toDataUrl));
      const [img1, img2, img3, img4] = refs;
      if (img1) body.input_image = img1;
      if (img2) body.input_image_2 = img2;
      if (img3) body.input_image_3 = img3;
      if (img4) body.input_image_4 = img4;
      console.log('[live-chat] refs normalized', { reqId, ref1IsData: img1?.startsWith('data:'), ref2IsData: !!img2 && img2.startsWith?.('data:'), refCount: refs.length });
    }

    try {
      const refsInfo = (uploadedImages || []).map((u: string, i: number) => ({
        i,
        isDataUrl: typeof u === 'string' && u.startsWith('data:'),
        length: typeof u === 'string' ? u.length : 0,
        preview: typeof u === 'string' ? u.slice(0, 64) : undefined,
      }));
      console.log('[live-chat] incoming', { reqId, model, frameSize, refsCount: uploadedImages.length, seed, prompt_upsampling, safety_tolerance });
      console.log('[live-chat] init request', { reqId, endpoint, bodyKeys: Object.keys(body) });
    } catch {}

      const initRes = await fetch(addCacheBuster(endpoint), {
        method: 'POST',
        headers: { 'accept': 'application/json', 'x-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      console.log("initRes",initRes);
      const initData = await initRes.json();
      console.log('[live-chat] init response', { reqId, status: initRes.status, id: initData?.id, hasPolling: !!initData?.polling_url });
      if (!initRes.ok || !initData.polling_url) {
        return NextResponse.json({ error: initData?.error || 'Failed to start live-chat generation' }, { status: 500 });
      }

      const imageUrl = await pollKontext(initData.polling_url, apiKey, reqId);
      console.log('[live-chat] poll completed', { reqId, imageUrl });
      const uploaded = await uploadGeneratedImages([{ id: initData.id, url: imageUrl, originalUrl: imageUrl } as GeneratedImage]);
      console.log('[live-chat] uploaded firebase', { reqId, count: uploaded.length });
      return NextResponse.json({ images: uploaded, requestId: initData.id, reqId });
    }

    // Branch: Google Nano Banana via FAL (gemini-25-flash-image)
    if (normalizedModel === 'gemini-25-flash-image') {
      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return NextResponse.json({ error: 'FAL AI API key not configured' }, { status: 500 });
      }
      fal.config({ credentials: falKey });

      const isEdit = Array.isArray(uploadedImages) && uploadedImages.length > 0;
      const endpoint = isEdit ? 'fal-ai/gemini-25-flash-image/edit' : 'fal-ai/gemini-25-flash-image';
      const input: any = { prompt, output_format: 'jpeg' };
      if (isEdit) {
        try {
          console.log('[live-chat][fal] refs incoming', {
            reqId,
            count: uploadedImages.length,
            previews: uploadedImages.slice(0,4).map((u: string) => (typeof u === 'string' ? u.slice(0, 64) : '')),
          });
        } catch {}
        // Upload references to FAL storage to avoid payload limits and ensure accessibility
        const refs = await Promise.all(uploadedImages.slice(0,4).map(async (u: string, i: number) => {
          try {
            let blob: Blob;
            let filename = `livechat_ref_${i + 1}.jpg`;
            if (typeof u === 'string' && u.startsWith('data:')) {
              const resp = await fetch(u);
              blob = await resp.blob();
            } else {
              const r = await fetch(u, { cache: 'no-store' });
              blob = await r.blob();
              const ct = r.headers.get('content-type') || 'image/jpeg';
              const ext = ct.includes('png') ? 'png' : 'jpg';
              filename = `livechat_ref_${i + 1}.${ext}`;
            }
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            const url = await fal.storage.upload(file);
            return url;
          } catch {
            // Fall back to original string if upload fails
            return u;
          }
        }));
        try {
          console.log('[live-chat][fal] refs uploaded', { reqId, refsCount: refs.length, refsPreview: refs.map((r: string) => r?.slice(0, 64)) });
        } catch {}
        input.image_urls = refs;
        input.num_images = 1;
      } else {
        input.num_images = 1;
      }

      try {
        console.log('[live-chat][fal] submitting', { reqId, endpoint });
        const submit = await fal.queue.submit(endpoint, { input });
        const requestId = submit?.request_id as string;
        if (!requestId) {
          return NextResponse.json({ error: 'Failed to submit Nano Banana request' }, { status: 500 });
        }
        console.log('[live-chat][fal] submitted', { reqId, requestId });

        // Poll status until ready to avoid 400 "Request is still in progress"
        for (let i = 0; i < 240; i++) {
          const status = await fal.queue.status(endpoint, { requestId, logs: true });
          const s = (status?.status || '').toString();
          if (i % 4 === 0) console.log('[live-chat][fal] status', { reqId, requestId, i, status: s });
          if (s === 'COMPLETED' || s === 'READY' || s === 'SUCCESS' || s === 'FINISHED') break;
          await new Promise((r) => setTimeout(r, 500));
        }

        // Get result after polling loop
        const result = await fal.queue.result(endpoint, { requestId });
        const files = (result?.data?.images || []) as Array<{ url: string }>;
        const images: GeneratedImage[] = files.map((f, idx) => ({ id: `${requestId}-${idx}`, url: f.url, originalUrl: f.url }));
        console.log('[live-chat][fal] result files', { reqId, requestId, count: files.length, first: files[0]?.url?.slice(0, 96) });
        const uploaded = await uploadGeneratedImages(images);
        console.log('[live-chat][fal] uploaded to firebase', { reqId, requestId, count: uploaded.length });
        return NextResponse.json({ images: uploaded, requestId, reqId });
      } catch (err: any) {
        console.error('[live-chat] fal nano banana error', err?.status, err?.body || err?.message);
        return NextResponse.json({ error: err?.body?.message || err?.message || 'Nano Banana request failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: `Unsupported live chat model: ${model}` }, { status: 400 });
  } catch (e: any) {
    console.error('[live-chat] error', e);
    return NextResponse.json({ error: e?.message || 'Live chat generation failed' }, { status: 500 });
  }
}


