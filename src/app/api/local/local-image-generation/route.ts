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

  // Helper function to ensure dimensions are divisible by 16
  const makeDivisibleBy16 = (value: number): number => {
    return Math.round(value / 16) * 16;
  };

  // Helper function to clamp dimensions to reasonable ranges
  const clampDimension = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  };

  // Base dimensions per model (all divisible by 16)
  const getBaseDimensions = () => {
    if (isSchnell || isTurbo) {
      return { base: 768, min: 512, max: 1024 }; // Smaller models
    } else if (isXL || isMediumOrLarge || isKreaOrPlayground) {
      return { base: 1024, min: 512, max: 1280 }; // Larger models
    } else {
      return { base: 1024, min: 512, max: 1024 }; // Default
    }
  };

  const { base, min, max } = getBaseDimensions();
  
  console.log(`[mapAspectToSize] Model: ${model}, Aspect: ${aspect}, Base: ${base}, Min: ${min}, Max: ${max}`);

  switch (aspect) {
    case '1:1':
      return { width: base, height: base };
      
    case '3:4': // portrait
      const portraitWidth = makeDivisibleBy16(base * 0.75);
      return { 
        width: clampDimension(portraitWidth, min, max), 
        height: base 
      };
      
    case '4:3': // landscape
      const landscapeHeight = makeDivisibleBy16(base * 0.75);
      return { 
        width: base, 
        height: clampDimension(landscapeHeight, min, max) 
      };
      
    case '16:9':
      const widescreenHeight = makeDivisibleBy16(base * (9/16));
      return { 
        width: base, 
        height: clampDimension(widescreenHeight, min, max) 
      };
      
    case '9:16': // portrait widescreen
      const portraitWidescreenWidth = makeDivisibleBy16(base * (9/16));
      return { 
        width: clampDimension(portraitWidescreenWidth, min, max), 
        height: base 
      };
      
    case '3:2':
      const threeTwoHeight = makeDivisibleBy16(base * (2/3));
      return { 
        width: base, 
        height: clampDimension(threeTwoHeight, min, max) 
      };
      
    case '2:3': // portrait 3:2
      const twoThreeWidth = makeDivisibleBy16(base * (2/3));
      return { 
        width: clampDimension(twoThreeWidth, min, max), 
        height: base 
      };
      
    case '21:9':
      const ultrawideHeight = makeDivisibleBy16(base * (9/21));
      return { 
        width: base, 
        height: clampDimension(ultrawideHeight, min, max) 
      };
      
    case '9:21': // portrait ultrawide
      const portraitUltrawideWidth = makeDivisibleBy16(base * (9/21));
      return { 
        width: clampDimension(portraitUltrawideWidth, min, max), 
        height: base 
      };
      
    case '16:10':
      const sixteenTenHeight = makeDivisibleBy16(base * (10/16));
      return { 
        width: base, 
        height: clampDimension(sixteenTenHeight, min, max) 
      };
      
    case '10:16': // portrait 16:10
      const tenSixteenWidth = makeDivisibleBy16(base * (10/16));
      return { 
        width: clampDimension(tenSixteenWidth, min, max), 
        height: base 
      };
      
    default:
      // For unknown aspect ratios, return square
      const result = { width: base, height: base };
      console.log(`[mapAspectToSize] Default case for ${aspect}: ${result.width}x${result.height}`);
      return result;
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
    
    // Log dimension calculations for debugging
    console.log(`[local-image-generation] Model: ${model}, Aspect: ${aspectRatio}`);
    console.log(`[local-image-generation] Calculated dimensions: ${width}x${height}`);
    console.log(`[local-image-generation] Validation: width divisible by 16: ${width % 16 === 0}, height divisible by 16: ${height % 16 === 0}`);
    console.log(`[local-image-generation] Endpoint: ${endpoint}`);

    // Validate dimensions are divisible by 16
    if (width % 16 !== 0 || height % 16 !== 0) {
      console.error(`[local-image-generation] Invalid dimensions: ${width}x${height} - not divisible by 16`);
      return NextResponse.json({ 
        error: `Invalid dimensions: ${width}x${height}. Dimensions must be divisible by 16.` 
      }, { status: 400 });
    }

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


