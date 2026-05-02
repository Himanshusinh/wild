import { NextResponse } from 'next/server'
import { getSignupImages } from '@/lib/showcase-cache'

// Avoid running heavy feed fetches during `next build` (CI hits staging API; can exceed 60s worker timeout).
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await getSignupImages()

    const validItems = (Array.isArray(items) ? items : []).filter((item) => {
      const url = item?.images?.[0]?.url || item?.images?.[0]?.originalUrl
      return !!item?.id && !!url
    })

    return NextResponse.json(
      {
        responseStatus: 'success',
        data: validItems,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        },
      },
    )
  } catch (error: any) {
    console.error('[signup-showcase] Error:', error)
    return NextResponse.json(
      {
        // Keep endpoint resilient when upstream API is temporarily unavailable.
        responseStatus: 'success',
        message: error?.message || 'Signup showcase temporarily unavailable',
        data: [],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    )
  }
}
