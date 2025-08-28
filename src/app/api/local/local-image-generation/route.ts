import { NextRequest, NextResponse } from 'next/server';
import { uploadGeneratedImages } from '@/lib/imageUpload';
import { updateHistoryEntry as updateFirebaseHistory } from '@/lib/historyService';
import { GeneratedImage } from '@/types/history';

export const runtime = 'nodejs';

type LocalModel = 'flux-schnell' | 'stable-medium' | 'stable-large' | 'stable-turbo' | 'stable-xl' | 'flux-krea' | 'playground';

function mapAspectToSize(aspect: string, model: LocalModel): { width: number; height: number } {
  const isSchnell = model === 'flux-schnell';
  const isTurbo = model === 'stable-turbo';
  const isXL = model === 'stable-xl';
  const isMediumOrLarge = model === 'stable-medium' || model === 'stable-large';
  const isKreaOrPlayground = model === 'flux-krea' || model === 'playground';

  // Recommended defaults per model
  const defaultSquare = (isSchnell || isTurbo) ? 768 : 1024;
  const portrait = (isSchnell || isTurbo) ? 768 : 1024;
  const landscape = (isSchnell || isTurbo) ? 768 : 1024;

  switch (aspect) {
    case '1:1':
      return { width: defaultSquare, height: defaultSquare };
    case '3:4': // portrait
      return { width: Math.round(portrait * 0.75), height: portrait };
    case '4:3': // landscape
      return { width: landscape, height: Math.round(landscape * 0.75) };
    case '16:9':
      return { width: (isXL || isMediumOrLarge || isKreaOrPlayground) ? 1280 : 896, height: (isXL || isMediumOrLarge || isKreaOrPlayground) ? 720 : 504 };
    case '21:9':
      return { width: (isXL || isMediumOrLarge || isKreaOrPlayground) ? 1344 : 896, height: (isXL || isMediumOrLarge || isKreaOrPlayground) ? 576 : 384 };
    default:
      return { width: defaultSquare, height: defaultSquare };
  }
}

function modelToEndpoint(model: LocalModel): string {
  switch (model) {
    case 'flux-schnell':
      return 'flux-schnell/generate';
    case 'stable-medium':
      return 'stable-medium/generate';
    case 'stable-large':
      return 'stable-large/generate';
    case 'stable-turbo':
      return 'stable-turbo/generate';
    case 'stable-xl':
      return 'stable-xl/generate';
    case 'flux-krea':
      // Flux Krea image generation
      return 'generate/kreaimage';
    case 'playground':
      // Playground SDXL
      return 'generate/playground';
    default:
      return 'flux-schnell/generate';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body?.prompt ?? '';
    const model: LocalModel = (body?.model as LocalModel) ?? 'flux-schnell';
    const n: number = Number(body?.n ?? body?.num_images ?? 1);
    const aspectRatio: string = body?.aspect_ratio ?? '1:1';
    const historyId: string | undefined = body?.historyId;
    const style: string | undefined = body?.style;

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Choose base URL by model: kreaimage/Playground use LOCAL_IMAGE_GENERATION_MODEL_P, others use LOCAL_IMAGE_GENERATION_URL
    const isKreaOrPlayground = model === 'flux-krea' || model === 'playground';
    const BASE = isKreaOrPlayground
      ? (process.env.LOCAL_IMAGE_GENERATION_MODEL_P || (process as any).env?.LOCAL_IMAGE_GENERATION_MODEL_P)
      : (process.env.LOCAL_IMAGE_GENERATION_URL || (process as any).env?.LOCAL_IMAGE_GENERATION_URL);
    const KEY = process.env.LOCAL_IMAGE_GENERATION_KEY; // optional

    if (!BASE) {
      return NextResponse.json({ error: 'LOCAL_IMAGE_GENERATION_URL not configured' }, { status: 500 });
    }

    const endpoint = `${BASE.replace(/\/$/, '')}/${modelToEndpoint(model)}`;
    const { width, height } = mapAspectToSize(aspectRatio, model);

    // Build request payload – do not send inference steps/guidance from frontend
    const payload: any = {
      prompt,
      width,
      height,
      num_images: n,
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (KEY) headers['Authorization'] = `Bearer ${KEY}`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[local-image-generation:error] upstream_failed', { status: resp.status, body: text?.slice?.(0, 500) });
      return NextResponse.json({ error: `Local API error ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json();
    let imageUrls: string[] = data?.image_urls || data?.images || [];
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'Invalid response: missing image_urls' }, { status: 502 });
    }

    // Normalize to absolute URLs when backend returns relative paths (e.g., /download/...)
    const baseForAbsolute = (typeof BASE === 'string') ? BASE.replace(/\/$/, '') : '';
    imageUrls = imageUrls.map((u: string) => {
      if (typeof u !== 'string') return '';
      if (/^https?:\/\//i.test(u) || /^data:/i.test(u)) return u;
      const path = u.startsWith('/') ? u : `/${u}`;
      return `${baseForAbsolute}${path}`;
    }).filter(Boolean);

    // Create GeneratedImage objects
    const images: GeneratedImage[] = imageUrls.map((u: string, idx: number) => ({
      id: `${model}-${Date.now()}-${idx}`,
      url: u,
      originalUrl: u,
    }));

    // Upload to Firebase for consistency
    const uploaded = await uploadGeneratedImages(images);

    // Firestore cannot store undefined values inside arrays. Sanitize images.
    const sanitizedImages: GeneratedImage[] = uploaded.map((img: any) => {
      const hasHttpOriginal = typeof img?.originalUrl === 'string' && /^https?:\/\//i.test(img.originalUrl);
      const base: any = {
        id: String(img?.id ?? ''),
        url: String(img?.url ?? ''), // already Firebase URL from uploader
      };
      // Keep originalUrl only if it's http(s). If it's a massive data URL, replace with firebase URL to keep doc small/valid
      base.originalUrl = hasHttpOriginal ? String(img.originalUrl) : String(img?.firebaseUrl || img?.url || '');
      return base;
    });

    // If a historyId is provided, finalize the Firebase document on the server
    if (historyId) {
      try {
        // Only log minimal info when error occurs – show exactly what we tried to write
        const updatePayload: any = {
          images: sanitizedImages,
          imageCount: sanitizedImages.length,
          status: 'completed',
          frameSize: aspectRatio,
          timestamp: new Date().toISOString(),
        };
        if (typeof style === 'string') updatePayload.style = style;
        await updateFirebaseHistory(historyId, updatePayload);
      } catch (e) {
        // Print the exact offending object (first image) and payload field types
        const offending = Array.isArray(sanitizedImages) && sanitizedImages.length > 0 ? sanitizedImages[0] : null;
        const typeMap: Record<string, string> = {};
        Object.entries(offending || {}).forEach(([k, v]) => { typeMap[k] = typeof v; });
        console.error('[history-finalize-invalid]', {
          historyId,
          imageSample: offending,
          imageSampleTypes: typeMap,
          imageCount: sanitizedImages?.length,
          hasUndefined: JSON.stringify(offending || {}).includes(':undefined'),
        });
      }
    }

    return NextResponse.json({
      images: sanitizedImages,
      model,
      success: true,
      historyId: historyId || null,
    });
  } catch (err: any) {
    console.error('[local-image-generation] POST failed:', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}


