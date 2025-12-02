import { NextResponse } from 'next/server'
import { getShowcaseImages } from '@/lib/showcase-cache'

// Allow caching of this route itself for a short period, 
// but the underlying data is cached for 24h by getShowcaseImages
export const revalidate = 3600 // Revalidate this API response every hour

export async function GET() {
  try {
    const items = await getShowcaseImages()
    return NextResponse.json({
      responseStatus: 'success',
      data: items
    })
  } catch (e: any) {
    console.error('[CommunityShowcase] Error:', e)
    return NextResponse.json({
      responseStatus: 'error',
      message: e.message || 'Failed to load showcase'
    }, { status: 500 })
  }
}
