'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Nav from '../Generation/Core/Nav'
import SidePannelFeatures from '../Generation/Core/SidePannelFeatures'
import { API_BASE } from '../HomePage/routes'
import CustomAudioPlayer from '../Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import RemoveBgPopup from '../Generation/ImageGeneration/TextToImage/compo/RemoveBgPopup'
import { Trash2 } from 'lucide-react'

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
  const loadingMoreRef = useRef(false)
  const [showRemoveBg, setShowRemoveBg] = useState(false)
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


  const fetchFeed = async (reset = false) => {
    try {
      setLoading(true)
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      const url = new URL(`${baseUrl}/api/feed`)
      url.searchParams.set('limit', '20')
      if (!reset && cursor) {
        url.searchParams.set('cursor', cursor)
      }
      
      console.log('[ArtStation] Fetching feed:', { reset, cursor, url: url.toString() })
      
      const res = await fetch(url.toString(), { 
        credentials: 'include'
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[ArtStation] Fetch failed:', { status: res.status, statusText: res.statusText, errorText })
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log('[ArtStation] Raw response:', data)
      
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

      // Open deep-linked generation once when it appears
      if (deepLinkId) {
        const pool = reset ? newItems : [...items, ...newItems]
        const found = pool.find(i => i.id === deepLinkId)
        if (found) {
          const media = (found.videos && found.videos[0]) || (found.images && found.images[0]) || (found.audios && found.audios[0])
          const kind: any = (found.videos && found.videos[0]) ? 'video' : (found.images && found.images[0]) ? 'image' : 'audio'
          if (media?.url) {
            setSelectedImageIndex(0)
            setSelectedVideoIndex(0)
            setSelectedAudioIndex(0)
            setPreview({ kind, url: media.url, item: found })
            setDeepLinkId(null)
          } else if (inferredHasMore) {
            // keep fetching until we get the media
            await fetchFeed(false)
          }
        } else if (inferredHasMore) {
          await fetchFeed(false)
        }
      }
    } catch (e: any) {
      console.error('[ArtStation] Feed fetch error:', e)
      setError(e?.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setCurrentUid(u?.uid || null)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const gen = params.get('gen')
      if (gen) setDeepLinkId(gen)
    } catch {}
    fetchFeed(true)
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0]
      if (!entry.isIntersecting) return
      
      // Don't load if already loading, no more items, or already loading more
      if (loading || loadingMoreRef.current || !hasMore) {
        console.log('[ArtStation] Skipping load:', { loading, loadingMore: loadingMoreRef.current, hasMore })
        return
      }
      
      console.log('[ArtStation] Intersection observer triggered - Loading more items...')
      loadingMoreRef.current = true
      
      try {
        await fetchFeed(false)
      } catch (err) {
        console.error('[ArtStation] Error loading more:', err)
      } finally {
        loadingMoreRef.current = false
      }
    }, { 
      root: null, 
      rootMargin: '500px', // Trigger earlier
      threshold: 0.1 
    })
    
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, cursor])

  // Auto-fill viewport on initial loads so the page has enough content to scroll
  useEffect(() => {
    const needMore = () => (document.documentElement.scrollHeight - window.innerHeight) < 800
    const run = async () => {
      let guard = 0
      while (!loading && hasMore && needMore() && guard < 5) {
        await fetchFeed(false)
        guard += 1
      }
    }
    run()
  }, [items, hasMore, loading])

  // Resolve deep link after data loads; fetch more until found or no more
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
      return
    }
    // Not found; load more if available and not currently loading
    if (hasMore && !loading) {
      fetchFeed(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, deepLinkId, hasMore, loading])

  // Reset prompt expansion when preview item changes
  useEffect(() => {
    setIsPromptExpanded(false)
  }, [preview?.item?.id])

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
    
    return items.filter(item => {
      const type = item.generationType?.toLowerCase();
      switch (activeCategory) {
        case 'Images':
          return type === 'text-to-image';
        case 'Videos':
          return type === 'text-to-video';
        case 'Music':
          return type === 'text-to-music';
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

  const cards = useMemo(() => {
    // Show a single representative media per generation item to avoid multiple tiles
    const seenMedia = new Set<string>()
    const seenItem = new Set<string>()
    const out: { item: PublicItem; media: any; kind: 'image'|'video'|'audio' }[] = []
    
    console.log('[ArtStation] Building cards from filteredItems:', filteredItems.length)
    
    for (const it of filteredItems) {
      if (seenItem.has(it.id)) {
        console.log('[ArtStation] Skipping duplicate item:', it.id)
        continue
      }
      
      // Prefer videos, then images, then audios for the tile
      const candidate = (it.videos && it.videos[0]) || (it.images && it.images[0]) || (it.audios && it.audios[0])
      const kind: 'image'|'video'|'audio' = (it.videos && it.videos[0]) ? 'video' : (it.images && it.images[0]) ? 'image' : 'audio'
      
      if (!candidate?.url) {
        console.log('[ArtStation] Item has no media URL:', { 
          id: it.id, 
          hasVideos: !!it.videos?.length, 
          hasImages: !!it.images?.length, 
          hasAudios: !!it.audios?.length,
          candidate 
        })
        continue
      }
      
      const key = candidate.storagePath || candidate.url
      if (seenMedia.has(key)) {
        console.log('[ArtStation] Skipping duplicate media:', key)
        continue
      }
      
      seenMedia.add(key)
      seenItem.add(it.id)
      out.push({ item: it, media: candidate, kind })
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
      <div className="flex pt-10">
        <div className="w-[68px] flex-shrink-0"><SidePannelFeatures currentView={'home' as any} onViewChange={() => {}} onGenerationTypeChange={() => {}} onWildmindSkitClick={() => {}} /></div>
        <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-2 sm:mb-3">
              Art Station
            </h3>
            <p className="text-white/80 text-base sm:text-lg md:text-xl">
              Discover amazing AI-generated content from our creative community
            </p>
          </div>

          {/* Category Filter Bar */}
          <div className="mb-6">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {(['All', 'Images', 'Videos', 'Music', 'Logos', 'Stickers', 'Products'] as Category[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === category
                      ? 'bg-white border-white/5 text-black shadow-sm'
                      : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
              
            </div>
          </div>

          {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

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
                      style={{ aspectRatio: tileRatio, minHeight: 280 }}
                      className={`relative transition-opacity duration-300 ease-out will-change-[opacity] ${loadedTiles.has(cardId) ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {!loadedTiles.has(cardId) && (
                        <div className="absolute inset-0 bg-white/10" />
                      )}
                      {(() => {
                        const isPriority = idx < 8
                        const sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
                        const blur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPTEgaGVpZ2h0PTEgZmlsbD0nI2ZmZicgZmlsbC1vcGFjaXR5PScwLjA1Jy8+PC9zdmc+' // very light placeholder
                        return kind === 'video' ? (
                          (() => {
                            const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
                            const path = media.url?.startsWith(ZATA_PREFIX) ? media.url.substring(ZATA_PREFIX.length) : media.url;
                            const proxied = `/api/proxy/media/${encodeURIComponent(path)}`;
                            return (
                              <video
                                src={proxied}
                                className="w-full h-full object-cover"
                                controls
                                muted
                                preload="metadata"
                                onLoadedData={(e) => {
                                  const v = e.currentTarget as HTMLVideoElement
                                  try { if (v && v.videoWidth && v.videoHeight) noteMeasuredRatio(ratioKey, v.videoWidth, v.videoHeight) } catch {}
                                  markTileLoaded(cardId)
                                }}
                              />
                            )
                          })()
                        ) : (
                          <Image
                            src={media.url}
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
                              } catch {}
                              markTileLoaded(cardId)
                            }}
                          />
                        )
                      })()}
                    </div>
                    
                    {/* Hover Overlay - Profile and Like Button */}
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-center justify-between">
                        {/* Profile Section */}
                        <div className="flex items-center gap-2">
                          {item.createdBy?.photoURL ? (
                            <img src={`/api/proxy/external?url=${encodeURIComponent(item.createdBy.photoURL)}`} alt={item.createdBy.username || ''} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20" />
                          )}
                          <div className="text-white text-sm font-medium">{item.createdBy?.displayName || item.createdBy?.username || 'User'}</div>
                        </div>
                        
                        {/* Like Button and Delete (owner only) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(cardId); }}
                          className="p-2 rounded-full bg-white/20 text-white/80 hover:bg-white/30 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? '#ef4444' : 'none'} stroke={isLiked ? '#ef4444' : 'currentColor'} strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                        {currentUid && item.createdBy?.uid === currentUid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDelete(item); }}
                            className="p-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
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
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white/60 mt-4">{activeCategory === 'All' ? 'Loading Art Station...' : `Loading ${activeCategory}...`}</p>
            </div>
          )}

          {/* No items message */}
          {!loading && items.length === 0 && !error && (
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

          {/* Preview Modals */}
          {preview && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                <div className="relative w-full max-w-6xl bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <span>{preview.item.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Delete (owner only) */}
                    {currentUid && preview.item.createdBy?.uid === currentUid && (
                      <button
                        title="Delete"
                        className="px-3 py-1.5 rounded-full  text-white text-sm"
                        onClick={() => confirmDelete(preview.item)}
                      >
                                      <Trash2 className="w-5 h-5" />

                      </button>
                    )}
                    <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={() => setPreview(null)}>✕</button>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-[52px] h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
                  {/* Media */}
                  <div className="relative bg-black/30 h-[40vh] md:h-full md:flex-1">
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
                            {(() => {
                              const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
                              const path = vid.url?.startsWith(ZATA_PREFIX) ? vid.url.substring(ZATA_PREFIX.length) : vid.url;
                              const proxied = `/api/proxy/media/${encodeURIComponent(path)}`;
                              return <video src={proxied} className="w-full h-full" controls autoPlay />
                            })()}
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
                  <div className="p-4 md:p-5 text-white border-t md:border-t-0 md:border-l border-white/10 bg-black/30 h-[52vh] md:h-full md:w-[34%] overflow-y-auto custom-scrollbar">
                    {/* Creator */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Creator</div>
                      <div className="flex items-center gap-2">
                        {preview.item.createdBy?.photoURL ? (
                          <img src={`/api/proxy/external?url=${encodeURIComponent(preview.item.createdBy.photoURL)}`} alt={preview.item.createdBy.username || ''} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/20" />
                        )}
                        <span className="text-white text-sm font-medium">{preview.item.createdBy?.displayName || preview.item.createdBy?.username || 'User'}</span>
                      </div>
                    </div>
                    
                    {/* Date */}
                      <div className="mb-4">
                        <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
                        <div className="text-white text-sm">{formatDate(preview.item.createdAt || preview.item.updatedAt || '')}</div>
                      </div>
                    
                    {/* Prompt */}
                    <div className="pb-4 ">
                      <div className="flex items-center justify-between mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-0">Prompt</div>
                      <button 
                        onClick={() => copyPrompt(preview.item.prompt || '', `preview-${preview.item.id}`)}
                        className={`flex items-center gap-2 px-2 py-1.5 text-white text-xs rounded-lg transition-colors ${
                          copiedButtonId === `preview-${preview.item.id}` 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {copiedButtonId === `preview-${preview.item.id}` ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5"/>
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
                            <div className={`text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-words ${!isPromptExpanded && isLong ? 'line-clamp-4' : ''}`}>
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
                              <img src={im.url} alt={`Image ${idx+1}`} className="w-full h-full object-cover" />
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
                                return <video src={proxied} className="w-full h-full object-cover" muted />
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
                                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">{idx+1}</span>
                                <span>Track {idx + 1}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Details</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Type:</span>
                          <span className="text-white text-sm">{preview.item.generationType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Model:</span>
                          <span className="text-white text-sm">{preview.item.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Aspect ratio:</span>
                          <span className="text-white text-sm">{preview.item.aspectRatio || preview.item.frameSize || preview.item.aspect_ratio || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Format:</span>
                          <span className="text-white text-sm">{preview.kind}</span>
                        </div>
                        {/* Style field - commented out for now */}
                        {/* {preview.item.style && (
                          <div className="flex justify-between">
                            <span className="text-white/60 text-sm">Style:</span>
                            <span className="text-white text-sm">{preview.item.style}</span>
                          </div>
                        )} */}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mb-2 flex gap-2">
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
                            // Use the same logic as ImagePreviewModal
                            const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
                            const toProxyPath = (urlOrPath: string | undefined) => {
                              if (!urlOrPath) return '';
                              const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
                              if (urlOrPath.startsWith(ZATA_PREFIX)) {
                                return urlOrPath.substring(ZATA_PREFIX.length);
                              }
                              return urlOrPath;
                            };
                            
                            const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
                              const path = toProxyPath(urlOrPath);
                              return path ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}` : '';
                            };
                            
                            const downloadUrl = toProxyDownloadUrl(currentMedia.url);
                            if (!downloadUrl) return;
                            
                            const response = await fetch(downloadUrl, {
                              credentials: 'include',
                              headers: { 'ngrok-skip-browser-warning': 'true' }
                            });
                            
                            const blob = await response.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = objectUrl;
                            const baseName = (toProxyPath(currentMedia.url) || 'generated-image').split('/').pop() || 'generated-image.jpg';
                            a.download = /\.[a-zA-Z0-9]+$/.test(baseName) ? baseName : 'generated-image.jpg';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(objectUrl);
                          } catch (e) {
                            console.error('Download failed:', e);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M12 3v12" />
                          <path d="M7 10l5 5 5-5" />
                          <path d="M5 19h14" />
                        </svg>
                        Download
                      </button>
                      
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
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-sm"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16,6 12,2 8,6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        Share
                      </button>
                    </div>
                    
                    {/* Open in generator button */}
                    <div className="mt-0">
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


