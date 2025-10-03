'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Nav from '../Generation/Core/Nav'
import SidePannelFeatures from '../Generation/Core/SidePannelFeatures'
import { API_BASE } from '../HomePage/routes'
import CustomAudioPlayer from '../Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'

type PublicItem = {
  id: string;
  prompt?: string;
  generationType?: string;
  model?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { uid?: string; username?: string; displayName?: string; photoURL?: string };
  images?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
  videos?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
  audios?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
};

type Category = 'All' | 'Images' | 'Videos' | 'Music' | 'Logos' | 'Stickers' | 'Products';

export default function ArtStationPage() {
  const [items, setItems] = useState<PublicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [preview, setPreview] = useState<{ kind: 'image' | 'video' | 'audio'; url: string; item: PublicItem } | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set())
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
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
      const url = new URL(`${API_BASE}/api/feed`)
      url.searchParams.set('limit', '50') // Increased limit to get more items
      if (!reset && cursor) {
        url.searchParams.set('cursor', cursor)
      }
      
      console.log('[ArtStation] Fetching feed:', { reset, cursor, url: url.toString() })
      
      const res = await fetch(url.toString(), { 
        credentials: 'omit',
        headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[ArtStation] Fetch failed:', { status: res.status, statusText: res.statusText, errorText })
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log('[ArtStation] Raw response:', data)
      
      const payload = data?.data || data
      const newItems: PublicItem[] = payload?.items || []
      const newCursor = payload?.nextCursor || payload?.meta?.nextCursor
      
      console.log('[ArtStation] Parsed feed response:', { 
        itemsCount: newItems.length, 
        newCursor, 
        hasMore: payload?.meta?.hasMore,
        totalItemsSoFar: reset ? newItems.length : items.length + newItems.length
      })
      
      // Log sample items to verify data structure
      if (newItems.length > 0) {
        console.log('[ArtStation] Sample item:', newItems[0])
      }
      
      setItems(prev => reset ? newItems : [...prev, ...newItems])
      setCursor(newCursor)
      setError(null)
    } catch (e: any) {
      console.error('[ArtStation] Feed fetch error:', e)
      setError(e?.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeed(true) }, [])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0]
      if (!entry.isIntersecting) return
      
      // Don't load if already loading, no cursor, or already loading more
      if (loading || loadingMoreRef.current || !cursor) {
        console.log('[ArtStation] Skipping load:', { loading, loadingMore: loadingMoreRef.current, cursor })
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
  }, [cursor, loading])

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
    for (const it of filteredItems) {
      if (seenItem.has(it.id)) continue
      // Prefer videos, then images, then audios for the tile
      const candidate = (it.videos && it.videos[0]) || (it.images && it.images[0]) || (it.audios && it.audios[0])
      const kind: 'image'|'video'|'audio' = (it.videos && it.videos[0]) ? 'video' : (it.images && it.images[0]) ? 'image' : 'audio'
      if (!candidate?.url) continue
      const key = candidate.storagePath || candidate.url
      if (seenMedia.has(key)) continue
      seenMedia.add(key)
      seenItem.add(it.id)
      out.push({ item: it, media: candidate, kind })
    }
    return out
  }, [filteredItems])

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-50"><Nav /></div>
      <div className="flex pt-[80px]">
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
                      ? 'bg-[#2D6CFF] border-[#2D6CFF] text-white shadow-sm'
                      : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

          <div className="columns-1 sm:columns-2 md:columns-4 lg:columns-4 xl:columns-4 gap-2">
            {cards.map(({ item, media, kind }, idx) => {
              // Clean aspect ratios for organized grid
              const ratios = ['1/1', '4/3', '3/4', '16/9', '9/16', '2/1', '1/2', '3/2', '2/3']
              const randomRatio = ratios[idx % ratios.length]
              
              const cardId = `${item.id}-${media.id}-${idx}`
              const isHovered = hoveredCard === cardId
              const isLiked = likedCards.has(cardId)
              
              return (
                <div
                  key={cardId}
                  className="break-inside-avoid mb-2 cursor-pointer group relative"
                  onMouseEnter={() => setHoveredCard(cardId)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setPreview({ kind, url: media.url, item })}
                >
                  <div className="relative w-full rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 group">
                    <div style={{ aspectRatio: randomRatio }}>
                      {kind === 'video' ? (
                        <video src={media.url} className="w-full h-full object-cover" controls muted />
                      ) : (
                        <Image src={media.url} alt={item.prompt || ''} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                      )}
                    </div>
                    
                    {/* Hover Overlay - Profile and Like Button */}
                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-center justify-between">
                        {/* Profile Section */}
                        <div className="flex items-center gap-2">
                          {item.createdBy?.photoURL ? (
                            <img src={item.createdBy.photoURL} alt={item.createdBy.username || ''} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20" />
                          )}
                          <div className="text-white text-sm font-medium">{item.createdBy?.displayName || item.createdBy?.username || 'User'}</div>
                        </div>
                        
                        {/* Like Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(cardId); }}
                          className="p-2 rounded-full bg-white/20 text-white/80 hover:bg-white/30 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? '#ef4444' : 'none'} stroke={isLiked ? '#ef4444' : 'currentColor'} strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-white/20 rounded-2xl pointer-events-none transition" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Loading indicator */}
          {loading && items.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2">Loading more...</p>
            </div>
          )}

          {/* Initial loading */}
          {loading && items.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white/60 mt-4">Loading Art Station...</p>
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
          {!loading && !cursor && items.length > 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">You've reached the end</p>
            </div>
          )}

          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Preview Modals */}
          {preview && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
              <div className="relative w-full max-w-6xl bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
                  <button aria-label="Close" className="text-white/80 hover:text-white text-lg" onClick={() => setPreview(null)}>✕</button>
                </div>

                {/* Content */}
                <div className="pt-[52px] h-[calc(92vh-52px)] md:flex md:flex-row md:gap-0">
                  {/* Media */}
                  <div className="relative bg-black/30 h-[40vh] md:h-full md:flex-1">
                    {preview.kind === 'image' && (
                      <div className="relative w-full h-full">
                        <Image src={preview.url} alt={preview.item.prompt || ''} fill className="object-contain" />
                      </div>
                    )}
                    {preview.kind === 'video' && (
                      <div className="relative w-full h-full">
                        <video src={preview.url} className="w-full h-full" controls autoPlay />
                      </div>
                    )}
                    {preview.kind === 'audio' && (
                      <div className="p-6">
                        <CustomAudioPlayer audioUrl={preview.url} prompt={preview.item.prompt || ''} model={preview.item.model || ''} lyrics={''} autoPlay={true} />
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="p-4 md:p-5 text-white border-t md:border-t-0 md:border-l border-white/10 bg-black/30 h-[52vh] md:h-full md:w-[34%] overflow-y-auto">
                    {/* Creator */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Creator</div>
                      <div className="flex items-center gap-2">
                        {preview.item.createdBy?.photoURL ? (
                          <img src={preview.item.createdBy.photoURL} alt={preview.item.createdBy.username || ''} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/20" />
                        )}
                        <span className="text-white text-sm font-medium">{preview.item.createdBy?.displayName || preview.item.createdBy?.username || 'User'}</span>
                      </div>
                    </div>
                    
                    {/* Date */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
                      <div className="text-white text-sm">{new Date(preview.item.createdAt || preview.item.updatedAt || '').toLocaleString()}</div>
                    </div>
                    
                    {/* Prompt */}
                    <div className="mb-4">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Prompt</div>
                      <div className="text-white/90 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                        {cleanPromptByType(preview.item.prompt, preview.item.generationType)}
                      </div>
                      <button 
                        onClick={() => copyPrompt(preview.item.prompt || '', `preview-${preview.item.id}`)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs rounded-lg transition-colors ${
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
                            Copy Prompt
                          </>
                        )}
                      </button>
                    </div>
                    
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
                    
                    {/* Action Button */}
                    <div className="mt-6">
                      <button 
                        onClick={() => { setPreview(null); navigateForType(preview.item.generationType); }}
                        className="w-full px-4 py-2.5 bg-[#2D6CFF] text-white rounded-lg hover:bg-[#255fe6] transition-colors text-sm font-medium"
                      >
                        Open in generator
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}


