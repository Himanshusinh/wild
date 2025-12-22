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
    
    return NextResponse.json({
      responseStatus: 'success',
      data: validItems
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (e: any) {
    console.error('[CommunityShowcase] Error:', e)
    return NextResponse.json({
      responseStatus: 'error',
      message: e?.message || 'Failed to load showcase',
      data: []
    }, { status: 500 })
  }
}
