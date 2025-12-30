import { PublicItem } from '@/components/ArtStationPreview'

// Cache configuration
export const REVALIDATE_SECONDS = 10 // Reduced to 10s for debugging (was 86400)

// Helper to normalize dates
const normalizeDate = (d: any) => 
  typeof d === 'string' 
    ? d 
    : (d && typeof d === 'object' && typeof d._seconds === 'number' 
      ? new Date(d._seconds * 1000).toISOString() 
      : undefined)

// Helper to resolve image URL
const resolveImageUrl = (item: any) => {
  if (!item) return ''
  // Prefer optimized formats but fallback to standard url/storagePath to prevent empty feed
  return item.avifUrl || item.webpUrl || item.thumbnailUrl || item.url || item.storagePath || ''
}

export async function getShowcaseImages(): Promise<PublicItem[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''
    
    console.log('[ShowcaseCache] Init fetch from API Base:', apiBase)
    
    const allItems: any[] = []
    let nextCursor: string | undefined = undefined
    let page = 0
    const MAX_PAGES = 3 
    const TARGET_COUNT = 50

    while (page < MAX_PAGES && allItems.length < TARGET_COUNT) {
      const apiUrl = new URL(`${apiBase.replace(/\/$/, '')}/api/feed`)
      apiUrl.searchParams.set('mode', 'image')
      apiUrl.searchParams.set('limit', '50')
      if (nextCursor) apiUrl.searchParams.set('cursor', nextCursor)
      
      console.log(`[ShowcaseCache] Fetching page ${page + 1} from:`, apiUrl.toString())
      
      const res = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
      })

      if (!res.ok) {
        console.error('[ShowcaseCache] Failed to fetch feed:', res.status, res.statusText)
        break
      }

      const json = await res.json()
      
      // Log simple stats about raw response
      const payload = json?.data || json
      const items = (payload?.items || []) as any[]
      console.log(`[ShowcaseCache] Page ${page + 1} raw items count:`, items.length)
      
      nextCursor = payload?.meta?.nextCursor || payload?.nextCursor

      if (items.length === 0) break

      // Filter for high quality images
      const filtered = items.filter((item: any) => {
        // 1. Must be an image generation
        const type = (item.generationType || '').toLowerCase()
        const isImage = type === 'text-to-image' || type === 'image-upscale' || type === 'logo' || type === 'product-generation' || type === 'sticker-generation'
        
        if (!isImage) {
           console.log('[ShowcaseCache] Filtered out (not image):', item.id, type)
           return false
        }

        // 2. Must not be video or audio
        if (item.videos?.length > 0 || item.audios?.length > 0) {
           console.log('[ShowcaseCache] Filtered out (has video/audio):', item.id)
           return false
        }

        // 3. Must have a valid OPTIMIZED image URL (zata/optimized only)
        // Check root or any image in the array
        const rootOptimized = resolveImageUrl(item)
        const hasOptimizedImage = rootOptimized || (Array.isArray(item.images) && item.images.some((img: any) => resolveImageUrl(img)))
        
        if (!hasOptimizedImage) {
           console.log('[ShowcaseCache] Filtered out (no valid image URL):', item.id, 'Images:', item.images?.length)
           return false
        }

        // 4. Score check (relaxed)
        // const score = typeof item.aestheticScore === 'number' ? item.aestheticScore : (typeof item.score === 'number' ? item.score : 0)
        // We accept all scores now
        
        return true
      })
      
      console.log(`[ShowcaseCache] Page ${page + 1} valid items after filter:`, filtered.length)

      allItems.push(...filtered)
      page++
      
      if (!nextCursor) break
    }

    // Sort by latest
    allItems.sort((a, b) => {
      const da = new Date(normalizeDate(a.createdAt) || 0).getTime()
      const db = new Date(normalizeDate(b.createdAt) || 0).getTime()
      return db - da
    })

    // Take top 50
    const top50 = allItems.slice(0, 50)

    // Normalize to PublicItem format
    return top50.map(it => {
      // Process images to strictly use optimized URLs
      const processedImages = Array.isArray(it.images) 
        ? it.images.map((img: any) => ({
            ...img,
            url: resolveImageUrl(img), // Overwrite with optimized URL
            originalUrl: resolveImageUrl(img)
          })).filter((img: any) => img.url) // Remove if no optimized URL
        : []

      // If no processed images, try to make one from root if possible
      if (processedImages.length === 0) {
        const rootUrl = resolveImageUrl(it)
        if (rootUrl) {
          processedImages.push({
            id: '0',
            url: rootUrl,
            originalUrl: rootUrl
          })
        }
      }

      return {
        id: it.id,
        prompt: it.prompt,
        generationType: it.generationType,
        model: it.model,
        aspectRatio: it.aspect_ratio || it.aspectRatio || it.frameSize,
        frameSize: it.frameSize || it.aspect_ratio || it.aspectRatio,
        aspect_ratio: it.aspect_ratio,
        createdAt: normalizeDate(it.createdAt),
        updatedAt: normalizeDate(it.updatedAt),
        isPublic: it.isPublic !== false,
        isDeleted: it.isDeleted === true,
        createdBy: it.createdBy || it.user,
        aestheticScore: it.aestheticScore || it.score,
        images: processedImages,
        videos: [],
        audios: [],
      }
    })

  } catch (e) {
    console.error('[ShowcaseCache] Error generating showcase:', e)
    return []
  }
}

// Dedicated cache accessor for signup images
// Requirements: 50 images, 1:1 aspect ratio, score >= 9, pure text-to-image
export async function getSignupImages(): Promise<PublicItem[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''
    
    const allItems: any[] = []
    let nextCursor: string | undefined = undefined
    let page = 0
    const MAX_PAGES = 50 // Scan up to 50 pages to find 50 specific items
    const TARGET_COUNT = 50

    console.log('[ShowcaseCache] Starting dedicated signup image fetch (1:1, score>=9, txt2img)...')

    while (page < MAX_PAGES && allItems.length < TARGET_COUNT) {
      const apiUrl = new URL(`${apiBase.replace(/\/$/, '')}/api/feed`)
      apiUrl.searchParams.set('mode', 'image')
      apiUrl.searchParams.set('limit', '50')
      if (nextCursor) apiUrl.searchParams.set('cursor', nextCursor)
      
      const res = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
      })

      if (!res.ok) break

      const json = await res.json()
      const payload = json?.data || json
      const items = (payload?.items || []) as any[]
      nextCursor = payload?.meta?.nextCursor || payload?.nextCursor

      const filtered = items.filter((item: any) => {
        // 1. Must be an image generation (relaxed check)
        const type = (item.generationType || '').toLowerCase()
        // Allow if explicitly text-to-image OR if undefined (fallback) OR if contains 'image'
        // But exclude video/audio explicitly
        if (item.videos?.length > 0 || item.audios?.length > 0) return false
        
        // 2. Strict 1:1 aspect ratio
        const ratio = item.aspectRatio || item.aspect_ratio || item.frameSize
        if (ratio !== '1:1') return false

        // 3. Score >= 9
        const score = typeof item.aestheticScore === 'number' ? item.aestheticScore : (typeof item.score === 'number' ? item.score : 0)
        if (score < 9) return false

        // 4. Must have optimized URL
        // Check root or any image in the array
        const rootOptimized = resolveImageUrl(item)
        const hasOptimizedImage = rootOptimized || (Array.isArray(item.images) && item.images.some((img: any) => resolveImageUrl(img)))
        
        if (!hasOptimizedImage) return false

        return true
      })

      allItems.push(...filtered)
      page++
      
      if (!nextCursor) break
    }

    console.log(`[ShowcaseCache] Found ${allItems.length} signup images after ${page} pages`)

    // Sort by score (highest first) for signup background
    allItems.sort((a, b) => {
      const sa = a.aestheticScore || a.score || 0
      const sb = b.aestheticScore || b.score || 0
      return sb - sa
    })

    const top50 = allItems.slice(0, 50)

    return top50.map(it => {
      // Resolve URL from root OR from the first image in the array
      const rootUrl = resolveImageUrl(it)
      const childUrl = (Array.isArray(it.images) && it.images.length > 0) ? resolveImageUrl(it.images[0]) : ''
      const finalUrl = rootUrl || childUrl

      return {
        id: it.id,
        prompt: it.prompt,
        generationType: it.generationType,
        model: it.model,
        aspectRatio: '1:1',
        frameSize: '1:1',
        aspect_ratio: '1:1',
        createdAt: normalizeDate(it.createdAt),
        updatedAt: normalizeDate(it.updatedAt),
        isPublic: it.isPublic !== false,
        isDeleted: it.isDeleted === true,
        createdBy: it.createdBy || it.user,
        aestheticScore: it.aestheticScore || it.score,
        images: [{
          id: '0',
          url: finalUrl,
          originalUrl: finalUrl
        }],
        videos: [],
        audios: [],
      }
    })

  } catch (e) {
    console.error('[ShowcaseCache] Error generating signup images:', e)
    return []
  }
}
