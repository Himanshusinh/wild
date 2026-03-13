import { NextResponse } from 'next/server'
import { getSignupImages } from '@/lib/showcase-cache'

export const revalidate = 3600

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
        responseStatus: 'error',
        message: error?.message || 'Failed to load signup showcase',
        data: [],
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
