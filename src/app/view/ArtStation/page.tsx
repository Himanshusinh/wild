'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import SmartImage from '@/components/media/SmartImage'
import Nav from '../Generation/Core/Nav'
import SidePannelFeatures from '../Generation/Core/SidePannelFeatures'
import { API_BASE } from '../HomePage/routes'
import CustomAudioPlayer from '../Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import RemoveBgPopup from '../Generation/ImageGeneration/TextToImage/compo/RemoveBgPopup'
import { Trash2 } from 'lucide-react'
import { toThumbUrl, toMediaProxy } from '@/lib/thumb'
import { downloadFileWithNaming, getFileType } from '@/utils/downloadUtils'
import { getModelDisplayName } from '@/utils/modelDisplayNames'

type PublicItem = {
  id: string;
  prompt?: string;
  generationType?: string;
  model?: string;
  aspectRatio?: string;
  frameSize?: string;
  aspect_ratio?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { uid?: string; username?: string; displayName?: string; photoURL?: string };
  images?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
  videos?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
  audios?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
};

type Category = 'All' | 'Images' | 'Videos' | 'Music' | 'Logos' | 'Stickers' | 'Products';

export default function ArtStationPage() {
  const formatDate = (input?: string) => {
    if (!input) return ''
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return ''
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const time = d.toLocaleTimeString()
    return `${dd}-${mm}-${yyyy} ${time}`
  }
  const [items, setItems] = useState<PublicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [preview, setPreview] = useState<{ kind: 'image' | 'video' | 'audio'; url: string; item: PublicItem } | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0)
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0)
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set())
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null)
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ uid?: string; username?: string; displayName?: string; photoURL?: string } | null>(null)
  // layout fixed to masonry (no toggle)
  // Track which media tiles have finished loading so we can fade them in
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set())
  // Cache measured aspect ratios to reserve space and prevent column jumps
  const [measuredRatios, setMeasuredRatios] = useState<Record<string, string>>({})
  // Fancy reveal observer state
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set())
  const revealRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // (deduped) measuredRatios declared above
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const [showRemoveBg, setShowRemoveBg] = useState(false)
  // Control concurrent fetches with sequencing (no manual aborts to avoid canceled requests)
  const requestSeqRef = useRef(0)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const queuedNextRef = useRef<{ reset: boolean } | null>(null)
  const navigateForType = (type?: string) => {
    const t = (type || '').toLowerCase()
    if (t === 'text-to-image' || t === 'logo' || t === 'sticker-generation') {
      window.location.href = '/text-to-image'
      return
    }
    if (t === 'text-to-video') {
      window.location.href = '/text-to-video'
      return
    }
    if (t === 'product-generation' || t === 'mockup-generation') {
      window.location.href = '/product-generation'
      return
    }
    if (t === 'text-to-music') {
      window.location.href = '/text-to-music'
      return
    }
  }

  const copyPrompt = async (prompt: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedButtonId(buttonId)
      setTimeout(() => {
        setCopiedButtonId(null)
      }, 2000) // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const confirmDelete = async (item: PublicItem) => {
    try {
      const who = item?.createdBy?.uid || ''
      const currentUid = (typeof window !== 'undefined' && (localStorage.getItem('user') && (() => { try { return JSON.parse(localStorage.getItem('user') as string)?.uid } catch { return null } })())) as string | null
      if (!currentUid || who !== currentUid) {
        alert('You can delete only your own generation')
        return
      }
      const ok = confirm('Delete this generation permanently? This cannot be undone.')
      if (!ok) return
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      const res = await fetch(`${baseUrl}/api/generations/${item.id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Delete failed')
      }
      setItems(prev => prev.filter(i => i.id !== item.id))
      if (preview?.item?.id === item.id) setPreview(null)
    } catch (e) {
      console.error('Delete error', e)
      alert('Failed to delete generation')
    }
  }

  const toggleLike = (cardId: string) => {
    setLikedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }


  // Map UI categories to backend query params
  const mapCategoryToQuery = (category: Category): { mode?: 'video' | 'image' | 'music' | 'all'; generationType?: string } => {
    switch (category) {
      case 'Videos':
        // use mode=video; backend maps to multiple generationTypes
        return { mode: 'video' };
      case 'Images':
        return { mode: 'image' };
      case 'Music':
        return { mode: 'music' };
      case 'Logos':
        return { generationType: 'logo' };
      case 'Stickers':
        return { generationType: 'sticker-generation' };
      case 'Products':
        return { generationType: 'product-generation' };
      case 'All':
      default:
        return { mode: 'all' };
    }
  };

  const fetchFeed = async (reset = false) => {
    try {
      // prevent overlapping fetches (including reset)
      if (inFlightRef.current) {
        // queue latest intent; we coalesce to the most recent requested reset flag
        queuedNextRef.current = { reset }
        return
      }
      if (loading) return
      setLoading(true)
      const seq = ++requestSeqRef.current
      const categoryAtStart = activeCategory
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      const url = new URL(`${baseUrl}/api/feed`)
      url.searchParams.set('limit', '20')
      // Always request latest-first
      url.searchParams.set('sortBy', 'createdAt')
      url.searchParams.set('sortOrder', 'desc')
      // Apply server-side filtering based on active tab
      const q = mapCategoryToQuery(activeCategory)
      if (q.mode) url.searchParams.set('mode', q.mode)
      if (q.generationType) url.searchParams.set('generationType', q.generationType)
      if (!reset && cursor) {
        url.searchParams.set('cursor', cursor)
      }

      console.log('[ArtStation] Fetching feed:', { reset, cursor, url: url.toString() })

      const doFetch = async () => {
        const res = await fetch(url.toString(), { credentials: 'include' })
        return res
      }
      const p = doFetch()
      inFlightRef.current = p.then(() => undefined, () => undefined)
      const res = await p

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[ArtStation] Fetch failed:', { status: res.status, statusText: res.statusText, errorText })
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('[ArtStation] Raw response:', data)

      // Ignore stale responses if a newer request started after this one
      if (seq !== requestSeqRef.current) {
        console.log('[ArtStation] Stale response ignored for seq', seq)
        return
      }
      // Also ignore if the category changed mid-flight
      if (categoryAtStart !== activeCategory) {
        console.log('[ArtStation] Category changed from', categoryAtStart, 'to', activeCategory, '— ignoring response')
        return
      }

      const payload = data?.data || data
      const meta = payload?.meta || {}
      const normalizeDate = (d: any) => typeof d === 'string' ? d : (d && typeof d === 'object' && typeof d._seconds === 'number' ? new Date(d._seconds * 1000).toISOString() : undefined)
      const newItems: PublicItem[] = (payload?.items || []).map((it: any) => ({
        ...it,
        createdAt: normalizeDate(it?.createdAt) || it?.createdAt,
        updatedAt: normalizeDate(it?.updatedAt) || it?.updatedAt,
        aspectRatio: it?.aspect_ratio || it?.aspectRatio || it?.frameSize,
        frameSize: it?.frameSize || it?.aspect_ratio || it?.aspectRatio,
      }))
      const newCursor = meta?.nextCursor || payload?.nextCursor

      console.log('[ArtStation] Parsed feed response:', {
        itemsCount: newItems.length,
        newCursor,
        hasMore: payload?.meta?.hasMore,
        totalItemsSoFar: reset ? newItems.length : items.length + newItems.length
      })

      // Log sample items to verify data structure
      if (newItems.length > 0) {
        console.log('[ArtStation] Sample item:', newItems[0])
        console.log('[ArtStation] Sample item aspect ratio fields:', {
          aspectRatio: newItems[0].aspectRatio,
          frameSize: newItems[0].frameSize,
          aspect_ratio: newItems[0].aspect_ratio
        })
      }

      setItems(prev => {
        if (reset) return newItems
        const map = new Map<string, PublicItem>()
        prev.forEach(it => map.set(it.id, it))
        newItems.forEach(it => map.set(it.id, it))
        return Array.from(map.values())
      })
      setCursor(newCursor)
      const inferredHasMore = typeof meta?.hasMore === 'boolean' ? meta.hasMore : Boolean(newCursor)
      setHasMore(inferredHasMore)
      setError(null)

      // Deep link will be handled by a separate effect without recursive fetches
    } catch (e: any) {
      // Ignore benign cancellation-like errors
      const msg = String(e?.message || '')
      if (/abort|cancell?ed|signal/i.test(msg)) {
        console.log('[ArtStation] Ignored canceled fetch')
      } else {
        console.error('[ArtStation] Feed fetch error:', e)
        setError(e?.message || 'Failed to load feed')
        // Prevent infinite retry storms by marking no more items on error for this cycle
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      inFlightRef.current = null
      // If another fetch was queued while we were in flight, run it now (coalesced)
      const next = queuedNextRef.current
      queuedNextRef.current = null
      if (next) {
        // avoid tight loop: yield microtask
        Promise.resolve().then(() => fetchFeed(next.reset))
      }
    }
  }

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setCurrentUid(u?.uid || null)
        setCurrentUser({ uid: u?.uid, username: u?.username || u?.displayName, displayName: u?.displayName || u?.username, photoURL: u?.photoURL || u?.photoUrl })
      }
    } catch { }
  }, [])

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const gen = params.get('gen')
      if (gen) setDeepLinkId(gen)
    } catch { }
    // initial fetch happens via activeCategory effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when active tab changes; cancel in-flight, reset guards
  const didFetchForCategoryRef = useRef<string | null>(null)
  useEffect(() => {
    if (didFetchForCategoryRef.current === activeCategory) {
      return
    }
    didFetchForCategoryRef.current = activeCategory
    // reset concurrency guards
    loadingMoreRef.current = false
    setItems([])
    setCursor(undefined)
    setHasMore(true)
    fetchFeed(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    // Disconnect any prior observer before creating a new one for this tab/state
    let observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0]
      if (!entry.isIntersecting) return
      // Serialize loads
      if (loading || loadingMoreRef.current || !hasMore) {
        return
      }
      loadingMoreRef.current = true
      try {
        await fetchFeed(false)
      } catch (err) {
        console.error('[ArtStation] Error loading more:', err)
      } finally {
        loadingMoreRef.current = false
      }
    }, {
      root: scrollContainerRef.current || null,
      rootMargin: '600px',
      threshold: 0.01
    })
    observer.observe(el)
    return () => {
      try { observer.disconnect() } catch { }
    }
  }, [hasMore, loading, cursor, activeCategory])

  // Removed auto-fill loop to avoid duplicate overlapping fetches; rely on infinite scroll only

  // Resolve deep link after data loads; do not recursively fetch
  useEffect(() => {
    if (!deepLinkId) return
    // try to find in current items
    const found = items.find(i => i.id === deepLinkId)
    if (found) {
      const media = (found.videos && found.videos[0]) || (found.images && found.images[0]) || (found.audios && found.audios[0])
      const kind: any = (found.videos && found.videos[0]) ? 'video' : (found.images && found.images[0]) ? 'image' : 'audio'
      if (media?.url) {
        setSelectedImageIndex(0)
        setSelectedVideoIndex(0)
        setSelectedAudioIndex(0)
        setPreview({ kind, url: media.url, item: found })
        setDeepLinkId(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, deepLinkId])

  // Reset prompt expansion when preview item changes
  useEffect(() => {
    setIsPromptExpanded(false)
  }, [preview?.item?.id])

  // Debug: track items state changes
  useEffect(() => {
    console.log('[ArtStation] items state updated:', items.length)
  }, [items])

  const cleanPromptByType = (prompt?: string, type?: string) => {
    if (!prompt) return ''
    let p = prompt.replace(/\r\n/g, '\n').trim()
    // Strip trailing [Style: ...] blocks
    p = p.replace(/\s*\[[^\]]*\]\s*$/i, '').trim()
    const g = (type || '').toLowerCase()
    if (g === 'logo') {
      const m = p.match(/Create\s+a\s+professional\s+modern\s+logo\s+for:\s*([^\n\.]+)(?:\.|\n|$)/i) ||
        p.match(/Create\s+a\s+professional\s+\w*\s*logo\s+for:\s*([^\n\.]+)(?:\.|\n|$)/i)
      if (m && m[1]) return m[1].trim()
      return p.replace(/^Logo:\s*/i, '').trim()
    }
    if (g === 'product-generation') {
      const m = p.match(/Create\s+a\s+professional\s+studio\s+product\s+photograph\s+of:\s*([^\n\.]+)(?:\.|\n|$)/i)
      if (m && m[1]) return m[1].trim()
      return p.replace(/^Product:\s*/i, '').trim()
    }
    if (g === 'sticker-generation') {
      const m = p.match(/Create\s+a\s+fun\s+and\s+engaging\s+sticker\s+design\s+of:\s*([^\n\.]+)(?:\.|\n|$)/i)
      if (m && m[1]) return m[1].trim()
      return p.replace(/^Sticker:\s*/i, '').trim()
    }
    // Default: show cleaned prompt (e.g., text-to-image without style suffix)
    return p
  }

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    const typeIn = (t?: string, arr?: string[]) => (t ? arr?.includes(t.toLowerCase()) : false)
    return items.filter(item => {
      const type = item.generationType?.toLowerCase();
      switch (activeCategory) {
        case 'Images':
          return (Array.isArray(item.images) && item.images.length > 0) || typeIn(type, ['text-to-image', 'logo', 'sticker-generation', 'product-generation', 'ad-generation']);
        case 'Videos':
          return (Array.isArray(item.videos) && item.videos.length > 0) || typeIn(type, ['text-to-video', 'image-to-video', 'video-to-video']);
        case 'Music':
          return (Array.isArray((item as any).audios) && (item as any).audios.length > 0) || type === 'text-to-music';
        case 'Logos':
          return type === 'logo';
        case 'Stickers':
          return type === 'sticker-generation';
        case 'Products':
          return type === 'product-generation';
        default:
          return true;
      }
    });
  }, [items, activeCategory]);

  const resolveMediaUrl = (m: any): string | undefined => {
    if (!m) return undefined
    return m.url || m.originalUrl || (m.firebaseUrl as string | undefined)
  }

  const cards = useMemo(() => {
    // Show a single representative media per generation item to avoid multiple tiles
    const seenMedia = new Set<string>()
    const seenItem = new Set<string>()
    const out: { item: PublicItem; media: any; kind: 'image' | 'video' | 'audio' }[] = []

    console.log('[ArtStation] Building cards from filteredItems:', filteredItems.length)

    for (const it of filteredItems) {
      if (seenItem.has(it.id)) {
        console.log('[ArtStation] Skipping duplicate item:', it.id)
        continue
      }

      // Prefer videos, then images, then audios for the tile
      const candidate = (it.videos && it.videos[0]) || (it.images && it.images[0]) || (it.audios && it.audios[0])
      const kind: 'image' | 'video' | 'audio' = (it.videos && it.videos[0]) ? 'video' : (it.images && it.images[0]) ? 'image' : 'audio'
      const candidateUrl = resolveMediaUrl(candidate)

      if (!candidateUrl) {
        console.log('[ArtStation] Item has no media URL:', {
          id: it.id,
          hasVideos: !!it.videos?.length,
          hasImages: !!it.images?.length,
          hasAudios: !!it.audios?.length,
          candidate
        })
        continue
      }

      const key = (candidate && candidate.storagePath) || candidateUrl
      if (seenMedia.has(key)) {
        console.log('[ArtStation] Skipping duplicate media:', key)
        continue
      }

      seenMedia.add(key)
      seenItem.add(it.id)
      out.push({ item: it, media: { ...candidate, url: candidateUrl }, kind })
    }

    console.log('[ArtStation] Final cards count:', out.length)
    return out
  }, [filteredItems])

  const markTileLoaded = (tileId: string) => {
    setLoadedTiles(prev => {
      if (prev.has(tileId)) return prev
      const next = new Set(prev)
      next.add(tileId)
      return next
    })
  }

  const noteMeasuredRatio = (key: string, width: number, height: number) => {
    if (!width || !height) return
    setMeasuredRatios(prev => {
      if (prev[key]) return prev
      const w = Math.max(1, Math.round(width))
      const h = Math.max(1, Math.round(height))
      return { ...prev, [key]: `${w}/${h}` }
    })
  }

  // Observe tiles for smooth reveal (staggered)
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      setVisibleTiles(prev => {
        const next = new Set(prev)
        entries.forEach(e => {
          const id = (e.target as HTMLElement).dataset.revealId
          if (!id) return
          if (e.isIntersecting) next.add(id)
        })
        return next
      })
    }, { root: null, rootMargin: '200px 0px', threshold: 0.1 })

    Object.entries(revealRefs.current).forEach(([id, el]) => {
      if (el) {
        el.dataset.revealId = id
        io.observe(el)
      }
    })
    return () => io.disconnect()
  }, [cards])

  // (columns masonry) no measurement needed

  // duplicate removed

  return (
    <div className="min-h-screen bg-[#07070B]">
      <div className="fixed top-0 left-0 right-0 z-30"><Nav /></div>
      <div className="flex pt-0">
        <div className="w-[68px] flex-shrink-0"><SidePannelFeatures currentView={'home' as any} onViewChange={() => { }} onGenerationTypeChange={() => { }} onWildmindSkitClick={() => { }} /></div>
        <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
          {/* Sticky header + filters */}
          <div className="sticky top-4 z-20 bg-[#07070B] pt-2">
            <div className=" mb-2 md:mb-3">
              <h3 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-2 sm:mb-3">
                Art Station
              </h3>
              <p className="text-white/80 text-base sm:text-lg md:text-xl">
                Discover amazing AI-generated content from our creative community
              </p>
            </div>

            {/* Category Filter Bar */}
            <div className="mb-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {(['All', 'Images', 'Videos', 'Music', 'Logos', 'Stickers', 'Products'] as Category[]).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all border ${activeCategory === category
                        ? 'bg-white border-white/5 text-black shadow-sm'
                        : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {category}
                  </button>
                ))}

              </div>
            </div>
          </div>

          {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

          {/* Scrollable feed container */}
          <div ref={scrollContainerRef} className="overflow-y-auto custom-scrollbar " style={{maxHeight: 'calc(100vh - 210px)'}}>
          <div className="columns-1 sm:columns-2 md:columns-5 gap-1 [overflow-anchor:none]">
            {cards.map(({ item, media, kind }, idx) => {
              // Prefer server-provided aspect ratio; otherwise cycle through a set for visual variety
              const rawRatio = (item.aspectRatio || item.frameSize || item.aspect_ratio || '').replace('x', ':')
              const m = (rawRatio || '').match(/^(\d+)\s*[:/]\s*(\d+)$/)
              const fallbackRatios = ['1/1', '4/3', '3/4', '16/9', '9/16', '3/2', '2/3']
              const ratioKey = (media && (media.storagePath || media.url)) || `${item.id}-${idx}`
              const tileRatio = m ? `${m[1]}/${m[2]}` : (measuredRatios[ratioKey] || fallbackRatios[idx % fallbackRatios.length])

              const cardId = `${item.id}-${media.id}-${idx}`
              const isHovered = hoveredCard === cardId
              const isLiked = likedCards.has(cardId)

              return (
                <div
                  key={cardId}
                  className={`break-inside-avoid mb-1 cursor-pointer group relative [content-visibility:auto] [overflow-anchor:none] inline-block w-full align-top ${visibleTiles.has(cardId) ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'} transition-all duration-700 ease-out`}
                  style={{ transitionDelay: `${(idx % 12) * 35}ms` }}
                  onMouseEnter={() => setHoveredCard(cardId)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => {
                    setSelectedImageIndex(0)
                    setSelectedVideoIndex(0)
                    setSelectedAudioIndex(0)
                    setPreview({ kind, url: media.url, item })
                  }}
                  ref={(el) => { revealRefs.current[cardId] = el }}
                >
                  <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5 group" style={{ contain: 'paint' }}>
                    <div
                      style={{ aspectRatio: tileRatio, minHeight: 200 }}
                      className={`relative transition-opacity duration-300 ease-out will-change-[opacity] opacity-100`}
                    >
                      {!loadedTiles.has(cardId) && (
                        <div className="absolute inset-0 bg-white/10" />
                      )}
                      {(() => {
                        const isPriority = idx < 8
                        const sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'
                        const blur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPTEgaGVpZ2h0PTEgZmlsbD0nI2ZmZicgZmlsbC1vcGFjaXR5PScwLjA1Jy8+PC9zdmc+' // very light placeholder
                        return kind === 'video' ? (
                          (() => {
                            const proxied = toMediaProxy(media.url)
                            return (
                              <video
                                src={proxied}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                // play on hover
                                onMouseEnter={async (e) => { try { await (e.currentTarget as HTMLVideoElement).play() } catch { } }}
                                onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; try { v.pause(); v.currentTime = 0 } catch { } }}
                                onLoadedMetadata={(e) => {
                                  const v = e.currentTarget as HTMLVideoElement
                                  try { if (v && v.videoWidth && v.videoHeight) noteMeasuredRatio(ratioKey, v.videoWidth, v.videoHeight) } catch { }
                                  markTileLoaded(cardId)
                                }}
                                onError={() => { markTileLoaded(cardId) }}
                              />
                            )
                          })()
                        ) : (
                          <Image
                            src={toThumbUrl(media.url, { w: 640, q: 60 }) || media.url}
                            alt={item.prompt || ''}
                            fill
                            sizes={sizes}
                            className="object-cover"
                            placeholder="blur"
                            blurDataURL={blur}
                            priority={isPriority}
                            fetchPriority={isPriority ? 'high' : 'auto'}
                            onLoadingComplete={(img) => {
                              try {
                                const el = img as unknown as HTMLImageElement
                                if (el && el.naturalWidth && el.naturalHeight) noteMeasuredRatio(ratioKey, el.naturalWidth, el.naturalHeight)
                              } catch { }
                              markTileLoaded(cardId)
                            }}
                          />
                        )
                      })()}
                      {kind === 'video' && (
                        <div className={`absolute bottom-2 right-6 transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                          <div className="bg-white/10 backdrop-blur-3xl shadow-2xl rounded-md p-1">
                            <img src="/icons/videoGenerationiconwhite.svg" alt="Video" className="w-6 h-6 opacity-90" />
                          </div>
                        </div>
                      )}

                      {/* Music overlay if the item contains audio tracks (show even when tile is an image/video) */}
                      {(item as any).audios && (item as any).audios.length > 0 && (
                        <div className={`absolute bottom-2 left-6 transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                          <div className="bg-white/10 backdrop-blur-3xl shadow-2xl rounded-md p-1">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-white opacity-90">
                              <path d="M9 17a4 4 0 1 0 0-8v8z" />
                              <path d="M9 9v8" />
                              <path d="M9 9l10-3v8" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover Overlay - Profile and Like Button */}
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-center justify-between">
                        {/* Profile Section */}
                        <div className="flex items-center gap-2">
                          {(() => {
                            const isSelf = item.createdBy?.uid && currentUid && item.createdBy.uid === currentUid
                            const photo = item.createdBy?.photoURL || (isSelf ? currentUser?.photoURL : '')
                            if (photo) {
                              return <img src={`/api/proxy/external?url=${encodeURIComponent(photo)}`} alt={item.createdBy?.username || currentUser?.username || ''} className="w-8 h-8 rounded-full" />
                            }
                            return <div className="w-8 h-8 rounded-full bg-white/20" />
                          })()}
                          <div className="text-white text-sm font-medium">
                            {item.createdBy?.username || item.createdBy?.displayName || (item.createdBy?.uid === currentUid ? (currentUser?.username || currentUser?.displayName || 'User') : 'User')}
                          </div>
                        </div>

                        {/* Like + Delete action group (tight spacing) */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleLike(cardId); }}
                              className="peer p-2 rounded-lg backdrop-blur-3xl shadow-2xl bg-white/10 text-white/80 hover:bg-white/30 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? '#ef4444' : 'none'} stroke={isLiked ? '#ef4444' : 'currentColor'} strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                            </button>
                            <div className="pointer-events-none absolute -top-5 left-1/2 backdrop-blur-3xl shadow-2xl -translate-x-1/2 bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 peer-hover:opacity-100 whitespace-nowrap">Like</div>
                          </div>
                          {currentUid && item.createdBy?.uid === currentUid && (
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); confirmDelete(item); }}
                                className="peer p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white transition-colors"
                              // title="Delete"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                              <div className="pointer-events-none absolute -top-5 left-1/2 backdrop-blur-3xl shadow-2xl -translate-x-1/2 bg-black/60 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 peer-hover:opacity-100 whitespace-nowrap">Delete</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-white/20 rounded-xl pointer-events-none transition" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Loading indicator */}
          {loading && items.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2">{activeCategory === 'All' ? 'Loading more...' : `Loading ${activeCategory}...`}</p>
            </div>
          )}

          {/* Initial loading */}
          {loading && items.length === 0 && (
            <div className="flex items-center justify-center py-28">
              <div className="flex flex-col items-center gap-4">
                <Image src="/styles/Logo.gif" alt="Loading" width={112} height={112} className="w-28 h-28" />
                <div className="text-white text-lg">
                  {activeCategory === 'All' ? 'Loading Art Station...' : `Loading ${activeCategory}...`}
                </div>
              </div>
            </div>
          )}

          {/* No items message (based on filtered cards) */}
          {!loading && cards.length === 0 && !error && (
            <div className="text-center py-16">
              <p className="text-white/60 text-lg">No public generations available yet.</p>
              <p className="text-white/40 text-sm mt-2">Be the first to share your creations!</p>
            </div>
          )}

          {/* End message */}
          {!loading && !hasMore && items.length > 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">You've reached the end</p>
            </div>
          )}

          <div ref={sentinelRef} style={{ height: 1 }} />
          </div>

          {/* Preview Modals */}
          {preview && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20" onClick={() => setPreview(null)}>
              <div className="relative  h-full  md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent  border border-white/10 rounded-3xl overflow-hidden shadow-3xl"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent">
                  <div className="text-white/70 text-sm"></div>
                  <div className="flex items-center gap-2">
                    {/* Delete (owner only) */}
                    {currentUid && preview.item.createdBy?.uid === currentUid && (
                      <div className="relative group">
                        <button
                          title="Delete"
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                          onClick={() => confirmDelete(preview.item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Delete</div>
                      </div>
                    )}

                    <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={() => setPreview(null)}>✕</button>
                  </div>
                </div>

                {/* Action buttons below close button */}
                <div className="absolute top-12 right-8 z-20 flex items-center justify-between w-auto gap-2">
                  <div className="relative group">
                    <button
                      onClick={async () => {
                        const currentMedia = (() => {
                          if (preview.kind === 'image') {
                            const images = (preview.item.images || []) as any[]
                            return images[selectedImageIndex] || images[0] || { url: preview.url }
                          } else if (preview.kind === 'video') {
                            const videos = (preview.item.videos || []) as any[]
                            return videos[selectedVideoIndex] || videos[0] || { url: preview.url }
                          } else {
                            const audios = (preview.item as any).audios || []
                            return audios[selectedAudioIndex] || audios[0] || { url: preview.url }
                          }
                        })()

                        try {
                          // Convert relative URLs to absolute URLs for download
                          let downloadUrl = currentMedia.url;
                          if (downloadUrl.startsWith('/api/proxy/resource/')) {
                            const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
                            downloadUrl = `${API_BASE}${downloadUrl}`;
                          }

                          // Determine file type based on preview kind
                          const fileType = preview.kind as 'image' | 'video' | 'audio';

                          // Get the creator's username from the ArtStation item
                          const creatorUsername = preview.item.createdBy?.username ||
                            preview.item.createdBy?.displayName ||
                            'user';

                          // Use the same download utility as image and video generation
                          await downloadFileWithNaming(downloadUrl, creatorUsername, fileType);
                        } catch (e) {
                          console.error('Download failed:', e);
                        }
                      }}
                      className="w-[9vw] flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M12 3v12" />
                        <path d="M7 10l5 5 5-5" />
                        <path d="M5 19h14" />
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2  bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 backdrop-blur-3xl shadow-2xl">Download</div>
                  </div>

                  <div className="relative group ">
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/view/ArtStation?gen=${preview.item.id}`
                        if (navigator.share) {
                          navigator.share({
                            title: 'Check out this AI generation',
                            text: preview.item.prompt || 'Amazing AI-generated content',
                            url: shareUrl
                          })
                        } else {
                          navigator.clipboard.writeText(shareUrl)
                          alert('Link copied to clipboard!')
                        }
                      }}
                      className="w-[9vw] flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16,6 12,2 8,6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Share</div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-0 h-full mr-4 w-auto md:flex md:flex-row md:gap-0">
                  {/* Media */}
                  <div className="relative bg-black/20 h-full md:h-full md:flex-1">
                    {(() => {
                      const images = (preview.item.images || []) as any[]
                      const videos = (preview.item.videos || []) as any[]
                      const audios = (preview.item as any).audios || []
                      if (preview.kind === 'image') {
                        const img = images[selectedImageIndex] || images[0] || { url: preview.url }
                        return (
                          <div className="relative w-full h-full">
                            <Image src={img.url} alt={preview.item.prompt || ''} fill className="object-contain" />
                          </div>
                        )
                      }
                      if (preview.kind === 'video') {
                        const vid = videos[selectedVideoIndex] || videos[0] || { url: preview.url }
                        return (
                          <div className="relative w-full h-full">
                            <video src={toMediaProxy(vid.url)} className="w-full h-full" controls autoPlay />
                          </div>
                        )
                      }
                      const au = audios[selectedAudioIndex] || audios[0] || { url: preview.url }
                      return (
                        <div className="p-6">
                          <CustomAudioPlayer audioUrl={au.url} prompt={preview.item.prompt || ''} model={preview.item.model || ''} lyrics={''} autoPlay={true} />
                        </div>
                      )
                    })()}
                  </div>

                  {/* Sidebar */}
                  <div className="p-4 md:p-5 text-white  bg-black/10 h-[52vh] md:h-full md:w-[34%] overflow-y-auto custom-scrollbar">
                    {/* Creator */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mt-18 mb-2">Creator</div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const cb = preview.item.createdBy || {} as any;
                          const isSelf = (cb?.uid && currentUid && cb.uid === currentUid) || (!cb?.uid && currentUser?.username && cb?.username === currentUser.username);
                          const photo = cb?.photoURL || (isSelf ? currentUser?.photoURL : '');
                          if (photo) return <img src={`/api/proxy/external?url=${encodeURIComponent(photo)}`} alt={cb?.username || currentUser?.username || ''} className="w-6 h-6 rounded-full" />;
                          return <div className="w-6 h-6 rounded-full bg-white/20" />;
                        })()}
                        <span className="text-white text-sm font-medium">{(preview.item.createdBy?.username) || (isNaN(0 as any) && preview.item.createdBy?.displayName) || (currentUser?.username) || 'User'}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
                      <div className="text-white text-sm">{formatDate(preview.item.createdAt || preview.item.updatedAt || '')}</div>
                    </div>

                    {/* Prompt */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-0">
                        <span>Prompt</span>
                        <button
                          onClick={() => copyPrompt(preview.item.prompt || '', `preview-${preview.item.id}`)}
                          className={`flex items-center gap-2 px-2 py-1.5 text-white/80 text-xs rounded-lg transition-colors ${copiedButtonId === `preview-${preview.item.id}`
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/10 hover:bg-white/20'
                            }`}
                        >
                          {copiedButtonId === `preview-${preview.item.id}` ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                      {(() => {
                        const cleaned = cleanPromptByType(preview.item.prompt, preview.item.generationType)
                        const isLong = (cleaned || '').length > 280
                        return (
                          <>
                            <div className={`text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words ${!isPromptExpanded && isLong ? 'line-clamp-4' : ''}`}>
                              {cleaned}
                            </div>
                            {isLong && (
                              <button
                                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                className="mt-2 text-xs text-white/70 hover:text-white underline"
                              >
                                Read {isPromptExpanded ? 'less' : 'more'}
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Images Thumbnails */}
                    {preview.item.images && preview.item.images.length > 1 && (
                      <div className="mb-4">
                        <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Images ({preview.item.images.length})</div>
                        <div className="grid grid-cols-3 gap-2">
                          {preview.item.images.map((im: any, idx: number) => (
                            <button
                              key={im.id || idx}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`relative aspect-square rounded-md overflow-hidden border ${selectedImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/20 hover:border-white/40'}`}
                            >
                              <img src={im.url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos Thumbnails */}
                    {preview.item.videos && preview.item.videos.length > 1 && (
                      <div className="mb-4">
                        <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Videos ({preview.item.videos.length})</div>
                        <div className="grid grid-cols-3 gap-2">
                          {preview.item.videos.map((vd: any, idx: number) => (
                            <button
                              key={vd.id || idx}
                              onClick={() => setSelectedVideoIndex(idx)}
                              className={`relative aspect-square rounded-md overflow-hidden border ${selectedVideoIndex === idx ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/20 hover:border-white/40'}`}
                            >
                              {(() => {
                                const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
                                const path = vd.url?.startsWith(ZATA_PREFIX) ? vd.url.substring(ZATA_PREFIX.length) : vd.url;
                                const proxied = `/api/proxy/media/${encodeURIComponent(path)}`;
                                return <video src={proxied} className="w-full h-full object-cover" muted preload="metadata" />
                              })()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audios List */}
                    {(preview.item as any).audios && (preview.item as any).audios.length > 1 && (
                      <div className="mb-4">
                        <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Tracks ({(preview.item as any).audios.length})</div>
                        <div className="space-y-2">
                          {((preview.item as any).audios as any[]).map((au: any, idx: number) => (
                            <button
                              key={au.id || idx}
                              onClick={() => setSelectedAudioIndex(idx)}
                              className={`w-full text-left px-3 py-2 rounded-md border ${selectedAudioIndex === idx ? 'border-blue-500 bg-white/10' : 'border-white/20 hover:border-white/30'}`}
                            >
                              <div className="flex items-center gap-2 text-sm text-white/90">
                                <span className="flex w-6 h-6 rounded-full bg-white/10 items-center justify-center">{idx + 1}</span>
                                <span>Track {idx + 1}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="mb-4">
                      <div className="text-white/80 text-sm uppercase tracking-wider mb-1">Details</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Type:</span>
                          <span className="text-white/80 text-sm">{preview.item.generationType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Model:</span>
                          <span className="text-white/80 text-sm">{getModelDisplayName(preview.item.model)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Aspect ratio:</span>
                          <span className="text-white/80 text-sm">{preview.item.aspectRatio || preview.item.frameSize || preview.item.aspect_ratio || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Format:</span>
                          <span className="text-white/80 text-sm">{preview.kind}</span>
                        </div>
                      </div>
                    </div>

                    {/* Open in generator button */}
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setPreview(null);
                          const img = ((preview.item.images || []) as any[])[selectedImageIndex] || (preview.item.images || [])[0] || { url: preview.url };
                          const url = img?.url || preview.url;
                          const dest = new URL(window.location.origin + '/text-to-image');
                          dest.searchParams.set('image', url);
                          window.location.href = dest.toString();
                        }}
                        className="w-full px-4 py-2.5 bg-[#2D6CFF] text-white rounded-lg hover:bg-[#255fe6] transition-colors text-sm font-medium"
                      >
                        Remix
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {preview && preview.kind === 'image' && preview.item.generationType === 'text-to-image' && showRemoveBg && (
            <RemoveBgPopup
              isOpen={showRemoveBg}
              onClose={() => setShowRemoveBg(false)}
              defaultImage={(() => {
                const images = (preview.item.images || []) as any[]
                const img = images[selectedImageIndex] || images[0] || { url: preview.url }
                return img.url
              })()}
            />
          )}
        </div>
      </div>

    </div>
  )
}


