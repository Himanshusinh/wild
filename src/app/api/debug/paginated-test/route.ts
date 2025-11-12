export const dynamic = 'force-dynamic'

function makeItem(id: number) {
  return {
    id: `item-${id}`,
    prompt: `Sample prompt ${id}`,
    status: 'completed',
    generationType: 'text-to-image',
    createdAt: new Date().toISOString(),
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const qp = url.searchParams
    const limit = Math.max(1, Math.min(100, Number(qp.get('limit') || '5')))
    const cursor = qp.get('cursor') || null
    const broken = qp.get('broken') === 'true'

    // Simple deterministic pagination: page tokens are cursor-1, cursor-2 etc
    // If no cursor => page 1, cursor='page-1'
    let page = 1
    if (cursor && cursor.startsWith('page-')) {
      const n = Number(cursor.split('-')[1])
      if (!Number.isNaN(n)) page = n
    }

    // Simulate three pages total. Pages 1 and 2 return `limit` items and a nextCursor.
    // Page 3 returns fewer items (2) and normally no nextCursor (hasMore=false).
    let items = []
    let nextCursor: string | undefined = undefined
    let hasMore: boolean | undefined = undefined

    if (page <= 2) {
      const start = (page - 1) * limit + 1
      for (let i = 0; i < limit; i++) items.push(makeItem(start + i))
      nextCursor = `page-${page + 1}`
      // Intentionally do not set hasMore here to simulate older backend behavior
    } else {
      // last page - fewer items
      const start = (page - 1) * limit + 1
      for (let i = 0; i < Math.min(2, limit); i++) items.push(makeItem(start + i))
      // By default no nextCursor and hasMore=false
      if (broken) {
        // Broken backend: still returns a nextCursor even on last page
        nextCursor = `page-${page + 1}`
      }
      hasMore = false
    }

    const payload: any = {
      data: {
        items,
      },
    }
    if (typeof nextCursor !== 'undefined') payload.data.nextCursor = nextCursor
    if (typeof hasMore !== 'undefined') payload.data.hasMore = hasMore

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'debug route failed' }), { status: 500 })
  }
}
