import { NextRequest, NextResponse } from 'next/server';
import { getSignupImages } from '@/lib/showcase-cache';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

// No caching for the API response itself, so we get a random image each time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Avoid long-running remote fetches during `next build` prerender/export.
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return NextResponse.json(
      {
        responseStatus: 'success',
        data: null,
        debug: { skipped: true, reason: 'phase-production-build' },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  try {
    // Get the cached pool of 1:1 high-quality images
    const items = await getSignupImages();
    
    if (!items || items.length === 0) {
      throw new Error('No 1:1 signup images available');
    }

    // Pick a random one
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    // Extract image URL
    const imageUrl = randomItem.images?.[0]?.url || '';
    
    if (!imageUrl) {
      throw new Error('Selected item has no image URL');
    }

    const data = {
      imageUrl,
      prompt: randomItem.prompt,
      generationId: randomItem.id,
      creator: randomItem.createdBy
    };

    return NextResponse.json({
      responseStatus: 'success',
      data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error: any) {
    console.error('[signup-image] Error:', error?.message);
    return NextResponse.json(
      {
        responseStatus: 'error',
        message: error?.message || 'Failed to fetch signup image',
        data: null,
      },
      { status: 500 }
    );
  }
}
