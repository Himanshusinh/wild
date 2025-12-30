import { NextResponse } from 'next/server'
import { getShowcaseImages } from '@/lib/showcase-cache'

// Allow caching of this route itself for a short period, 
// but the underlying data is cached for 24h by getShowcaseImages
export const revalidate = 3600 // Revalidate this API response every hour

export async function GET() {
  try {
    const items = await getShowcaseImages()
    
    // Validate that items is an array
    if (!Array.isArray(items)) {
      console.error('[CommunityShowcase] Invalid response: items is not an array', typeof items)
      return NextResponse.json({
        responseStatus: 'error',
        message: 'Invalid data format',
        data: []
      }, { status: 500 })
    }
    
    // Filter out any invalid items before returning
    const validItems = items.filter(item => {
      // Must have an ID
      if (!item || !item.id || typeof item.id !== 'string') return false
      
      // Must have at least one image with a URL
      if (Array.isArray(item.images) && item.images.length > 0) {
        const hasValidImage = item.images.some((img: any) => {
          return img && (img.url || img.webpUrl || img.avifUrl || img.thumbnailUrl)
        })
        return hasValidImage
      }
      
      return false
    })
    
    // DEBUG: Perform a raw fetch to see what the server sees
    // FALLBACK: If env vars are missing, default to production URL
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://wildmindai.com';
    let debugInfo: any = {
      apiBase,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    };

    try {
      const debugUrl = `${apiBase.replace(/\/$/, '')}/api/feed?mode=image&limit=5`;
      const debugRes = await fetch(debugUrl);
      const debugText = await debugRes.text();
      
      debugInfo.rawFetchStatus = debugRes.status;
      debugInfo.rawFetchOk = debugRes.ok;
      debugInfo.rawResponseExcerpt = debugText.substring(0, 200); // See what the HTML says!
      
      try {
          const debugJson = JSON.parse(debugText);
          debugInfo.rawItemsCount = (debugJson?.data?.items || []).length;
          debugInfo.firstRawItem = (debugJson?.data?.items || [])[0] ? {
            id: debugJson.data.items[0].id,
            url: debugJson.data.items[0].url,
            images: debugJson.data.items[0].images,
            type: debugJson.data.items[0].generationType
          } : 'No items';
      } catch (jsonErr) {
          debugInfo.jsonParseError = String(jsonErr);
      }
    } catch (debugErr: any) {
      debugInfo.rawFetchError = String(debugErr);
    }

    return NextResponse.json({
      responseStatus: 'success',
      data: validItems,
      debug: debugInfo
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  } catch (e: any) {
    console.error('[CommunityShowcase] Critical Error:', e)
    return NextResponse.json({
      responseStatus: 'error',
      message: e?.message || 'Failed to load showcase',
      debug: process.env.NODE_ENV === 'development' ? String(e) : undefined,
      data: []
    }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
