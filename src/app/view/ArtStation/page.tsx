'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useIntersectionObserverForRef } from '@/hooks/useInfiniteGenerations';
import { OptimizedImage } from '@/components/media/OptimizedImage'
// Nav and SidePannelFeatures are provided by the persistent root layout
import { API_BASE } from '../HomePage/routes'
import CustomAudioPlayer from '../Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import RemoveBgPopup from '../Generation/ImageGeneration/TextToImage/compo/RemoveBgPopup'
import { Trash2 } from 'lucide-react'
import ArtStationPreview from '@/components/ArtStationPreview'
import { toMediaProxy, toResourceProxy, toDirectUrl } from '@/lib/thumb'
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
  isPublic?: boolean;
  isDeleted?: boolean;
  createdBy?: { uid?: string; username?: string; displayName?: string; photoURL?: string };
  images?: { 
    id: string; 
    url: string; 
    originalUrl?: string; 
    storagePath?: string;
    webpUrl?: string;
    thumbnailUrl?: string;
    avifUrl?: string;
    blurDataUrl?: string;
    optimized?: boolean;
  }[];
  videos?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
  audios?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
};

type Category = 'All' | 'Images' | 'Videos' | 'Logos' | 'Products';

const normalizeGenerationType = (type?: string) =>
  type ? type.replace(/[_\s]/g, '-').toLowerCase() : '';

const allowedEditTypes = new Set(['image-upscale', 'image_upscale', 'upscale']);
const disallowedExactTypes = new Set([
  'text-to-music',
  'music',
  'music-generation',
  'audio',
  'audio-generation',
  'sticker-generation',
  'sticker',
  'text-to-sticker',
  'text-to-speech',
  'text_to_speech',
  'sound-effects',
  'sound-effect',
  'sound_effect',
  'live-audio',
  'video-remove-bg',
  'video_remove_bg',
  'image-edit',
  'image_edit',
  'edit-image',
  'edit_image',
]);
const disallowedFeatureTokens = [
  'remove-bg',
  'removebg',
  'background-remover',
  'resize',
  'replace',
  'fill',
  'erase',
  'expand',
  'reimagine',
  'vectorize',
  'image-to-svg',
];

const shouldHideGenerationType = (type?: string) => {
  const normalized = normalizeGenerationType(type);
  if (!normalized) return false;
  if (allowedEditTypes.has(normalized)) return false;
  if (disallowedExactTypes.has(normalized)) return true;
  if (normalized.startsWith('image-edit') || normalized.startsWith('edit-image')) return true;
  return disallowedFeatureTokens.some((token) => normalized.includes(token));
};

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
  // CRITICAL: Initialize loading to true to prevent "no generations" blink on initial mount
  // The loading state will be set to false after the first fetch completes
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [preview, setPreview] = useState<{ kind: 'image' | 'video' | 'audio'; url: string; item: PublicItem } | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0)
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0)
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set())
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null)
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ uid?: string; username?: string; displayName?: string; photoURL?: string } | null>(null)

  // Reset media dimensions when preview or selected index changes
  useEffect(() => {
    setMediaDimensions(null)
  }, [preview, selectedImageIndex, selectedVideoIndex])
  // layout fixed to masonry (no toggle)
  // Track which media tiles have finished loading so we can fade them in
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set())
  // Cache measured aspect ratios to reserve space and prevent column jumps
  const [measuredRatios, setMeasuredRatios] = useState<Record<string, string>>({})
  // Fancy reveal observer state
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set())
  const revealRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const initialLoadDoneRef = useRef(false)
  // Masonry-like grid spans while preserving left-to-right order
  const [tileSpans, setTileSpans] = useState<Record<string, number>>({})
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const prefetchedRef = useRef<Set<string>>(new Set())
  // (deduped) measuredRatios declared above
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const [showRemoveBg, setShowRemoveBg] = useState(false)
  // Control concurrent fetches with sequencing (no manual aborts to avoid canceled requests)
  const requestSeqRef = useRef(0)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const queuedNextRef = useRef<{ reset: boolean } | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
const mapCategoryToQuery = (category: Category): { mode?: 'video' | 'image' | 'all'; generationType?: string } => {
    switch (category) {
      case 'Videos':
        // use mode=video; backend maps to multiple generationTypes
        return { mode: 'video' };
      case 'Images':
        return { mode: 'image' };
      case 'Logos':
        return { generationType: 'logo' };
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
      // CRITICAL: Set loading state IMMEDIATELY for initial load or reset
      // This ensures loading shows right away when page loads or category changes
      const isInitialLoad = reset || items.length === 0
      if (isInitialLoad) {
        setLoading(true)
      } else if (!loading) {
        // For pagination, only set loading if not already loading
        setLoading(true)
      } else {
        // Already loading, skip
        return
      }
      const seq = ++requestSeqRef.current
      const categoryAtStart = activeCategory
      const searchAtStart = searchQuery
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      const url = new URL(`${baseUrl}/api/feed`)
      
      // Use same limit for both search and normal browsing - proper pagination
      const hasSearch = searchQuery.trim().length > 0
      url.searchParams.set('limit', '50') // Increased limit for better pagination
      // Sort by aesthetic score first (highest first), then by createdAt as tiebreaker
      url.searchParams.set('sortBy', 'aestheticScore')
      url.searchParams.set('sortOrder', 'desc')
      // Don't filter by minScore - show all generations, just prioritize high-scoring ones
      // Apply server-side filtering based on active tab
      const q = mapCategoryToQuery(activeCategory)
      if (q.mode) url.searchParams.set('mode', q.mode)
      if (q.generationType) url.searchParams.set('generationType', q.generationType)
      // Add search query parameter - ALWAYS include it if there's a search query
      if (hasSearch) {
        url.searchParams.set('search', searchQuery.trim())
      }
      // Use cursor for pagination (works for both search and normal browsing)
      if (!reset && cursor) {
        url.searchParams.set('cursor', cursor)
      }

      // Log the full URL to verify search parameter is included
      const fullUrlString = url.toString()
      console.log('[ArtStation] Fetching feed:', { 
        reset, 
        cursor, 
        searchQuery, 
        hasSearch: hasSearch,
        hasSearchParam: url.searchParams.has('search'),
        searchParamValue: url.searchParams.get('search'),
        fullUrl: fullUrlString 
      })
      
      // Double-check search parameter is in URL
      if (hasSearch && !fullUrlString.includes('search=')) {
        console.error('[ArtStation] ERROR: Search query present but not in URL!', { searchQuery, fullUrl: fullUrlString })
      }

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
      // Also ignore if the search query changed mid-flight
      if (searchAtStart !== searchQuery) {
        console.log('[ArtStation] Search query changed from', searchAtStart, 'to', searchQuery, '— ignoring response')
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
      // Use same page limit for both search and normal browsing
      const pageLimit = 50
      // Enable pagination for both search and normal browsing
      const inferredHasMore = typeof meta?.hasMore === 'boolean'
        ? meta.hasMore
        : (newItems.length >= pageLimit && Boolean(newCursor))
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
      // mark initial load for this tab as complete so infinite scroll can activate
      initialLoadDoneRef.current = true
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
    // scroll to top for a clean start of the new category
    try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch {}
    // block infinite scroll until first page for this tab finishes
    initialLoadDoneRef.current = false
    setItems([])
    setCursor(undefined)
    setHasMore(true)
    // Note: fetchFeed will include searchQuery if present
    fetchFeed(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  // Refetch when search query changes (with debouncing)
  useEffect(() => {
    // Don't trigger on initial mount if search is empty
    const isInitialMount = didFetchForCategoryRef.current === null;
    if (isInitialMount && !searchQuery.trim()) {
      return;
    }
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search to avoid too many API calls
    // Shorter delay when searching (300ms) vs clearing (0ms)
    const delay = searchQuery.trim() ? 300 : 0; // Reduced delay for better UX
    searchTimeoutRef.current = setTimeout(() => {
      // Reset and refetch when search changes
      loadingMoreRef.current = false
      try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch {}
      initialLoadDoneRef.current = false
      setItems([])
      setCursor(undefined)
      setHasMore(true)
      console.log('[ArtStation] Search changed, refetching with query:', searchQuery)
      fetchFeed(true)
    }, delay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Infinite scroll observer — use the shared helper to ensure hasMore-first and local busy guards
  // Use EXACT same settings for both search and normal browsing (same as original Art Station)
  useIntersectionObserverForRef(
    sentinelRef,
    async () => {
      try {
        await fetchFeed(false)
      } catch (err) {
        console.error('[ArtStation] Error loading more:', err)
      }
    },
    hasMore,
    loading,
    { 
      root: null, 
      rootMargin: '600px', // Same as normal Art Station
      threshold: 0.01, // Same as normal Art Station
      requireUserScrollRef: initialLoadDoneRef 
    }
  )

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
    // Filter out deleted and non-public items (in case they slip through from backend)
    const validItems = items.filter(item => {
      // Must be public and not deleted
      if (item.isDeleted === true) return false;
      if (item.isPublic === false) return false;
      return true;
    });

    // Apply category filter
    let categoryFiltered = validItems;
    if (activeCategory !== 'All') {
      const typeIn = (t?: string, arr?: string[]) => (t ? arr?.includes(t.toLowerCase()) : false)
      categoryFiltered = validItems.filter(item => {
        const type = item.generationType?.toLowerCase();
        switch (activeCategory) {
          case 'Images':
            return (Array.isArray(item.images) && item.images.length > 0) || typeIn(type, ['text-to-image', 'logo', 'product-generation', 'ad-generation']);
          case 'Videos':
            return (Array.isArray(item.videos) && item.videos.length > 0) || typeIn(type, ['text-to-video', 'image-to-video', 'video-to-video']);
          case 'Logos':
            return type === 'logo';
          case 'Products':
            return type === 'product-generation';
          default:
            return true;
        }
      });
    }

    const sanitized = categoryFiltered.filter((item) => !shouldHideGenerationType(item.generationType));
    
    return sanitized;
  }, [items, activeCategory, searchQuery]);

  const normalizeMediaUrl = (url?: string): string | undefined => {
    if (!url) return undefined
    const trimmed = url.trim()
    if (!trimmed) return undefined
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (trimmed.startsWith('/api/')) return trimmed
    const proxied = toResourceProxy(trimmed)
    if (proxied) return proxied
    return toDirectUrl(trimmed)
  }

  const resolveMediaUrl = (m: any): string | undefined => {
    if (!m) return undefined
    // Try multiple URL properties in order of preference
    const candidates = [
      m.url,
      m.originalUrl,
      m.webpUrl,
      m.avifUrl,
      (m.firebaseUrl as string | undefined),
      m.thumbnailUrl,
      m.thumbUrl,
      m.storagePath,
    ]
    for (const candidate of candidates) {
      const normalized = normalizeMediaUrl(candidate)
      if (normalized) return normalized
    }
    return undefined
  }

  // Resolve image URL with fallback chain: thumbnailUrl → optimized (avif/webp) → url (Zata) → originalUrl
  const resolveImageUrl = (m: any): { url: string; fallbacks: string[] } => {
    if (!m) return { url: '', fallbacks: [] }
    
    const thumbnailUrl = normalizeMediaUrl(m.thumbnailUrl) || normalizeMediaUrl(m.thumbUrl)
    const avifUrl = normalizeMediaUrl(m.avifUrl)
    const webpUrl = normalizeMediaUrl(m.webpUrl)
    const zataUrl = normalizeMediaUrl(m.url) // Zata URL (e.g., https://idr01.zata.ai/devstoragev1/...)
    const originalUrl = normalizeMediaUrl(m.originalUrl) // Original source URL (e.g., Azure blob)
    
    // Priority: thumbnailUrl → avifUrl → webpUrl → url (Zata) → originalUrl
    if (thumbnailUrl) {
      return {
        url: thumbnailUrl,
        fallbacks: [avifUrl, webpUrl, zataUrl, originalUrl].filter(Boolean) as string[]
      }
    }
    
    if (avifUrl) {
      return {
        url: avifUrl,
        fallbacks: [webpUrl, zataUrl, originalUrl].filter(Boolean) as string[]
      }
    }
    
    if (webpUrl) {
      return {
        url: webpUrl,
        fallbacks: [zataUrl, originalUrl].filter(Boolean) as string[]
      }
    }
    
    if (zataUrl) {
      return {
        url: zataUrl,
        fallbacks: [originalUrl].filter(Boolean) as string[]
      }
    }
    
    return {
      url: originalUrl || '',
      fallbacks: []
    }
  }

  // Component to handle image fallback chain: thumbnail → optimized → original
  const ImageWithFallback = ({ 
    media, 
    alt, 
    fill, 
    sizes, 
    blurDataURL, 
    className, 
    priority, 
    fetchPriority, 
    onLoadingComplete 
  }: {
    media: any;
    alt: string;
    fill: boolean;
    sizes: string;
    blurDataURL?: string;
    className: string;
    priority: boolean;
    fetchPriority: 'high' | 'low' | 'auto';
    onLoadingComplete: (img: any) => void;
  }) => {
    const { url: primaryUrl, fallbacks } = resolveImageUrl(media);
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const allUrls = [primaryUrl, ...fallbacks].filter(Boolean);
    const currentUrl = allUrls[currentUrlIndex] || allUrls[0] || '';

    const markCompleteFallback = () => {
      try {
        onLoadingComplete?.({ naturalWidth: 1, naturalHeight: 1 } as HTMLImageElement)
      } catch {}
    }

    const handleError = () => {
      if (currentUrlIndex < allUrls.length - 1) {
        // Try next fallback URL
        setCurrentUrlIndex(prev => prev + 1);
      } else {
        markCompleteFallback()
      }
    };

    useEffect(() => {
      if (!currentUrl) {
        markCompleteFallback()
      }
    }, [currentUrl])

    if (!currentUrl) {
      return (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
          No preview
        </div>
      )
    }

    // Use direct img tag for Zata URLs (bypass Next.js Image optimization)
    return (
      <img
        key={`${currentUrl}-${currentUrlIndex}`}
        src={currentUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={fetchPriority}
        className={className}
        style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : {}}
        onError={handleError}
        onLoad={(e) => {
          try {
            onLoadingComplete?.(e.currentTarget as HTMLImageElement);
          } catch {}
        }}
      />
    );
  }



  const cards = useMemo(() => {
    // Show a single representative media per generation item to avoid multiple tiles
    const seenItem = new Set<string>()
    const out: { item: PublicItem; media: any; kind: 'image' | 'video' | 'audio' }[] = []

    if (process.env.NODE_ENV !== 'production') {
      console.log('[ArtStation] Building cards from filteredItems:', filteredItems.length)
    }

    for (const it of filteredItems) {
      // Only skip if we've already processed this exact item ID
      if (seenItem.has(it.id)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ArtStation] Skipping duplicate item:', it.id)
        }
        continue
      }

      // Prefer videos, then images, then audios for the tile
      const candidate = (it.videos && it.videos[0]) || (it.images && it.images[0]) || (it.audios && it.audios[0])
      const kind: 'image' | 'video' | 'audio' = (it.videos && it.videos[0]) ? 'video' : (it.images && it.images[0]) ? 'image' : 'audio'
      const candidateUrl = resolveMediaUrl(candidate)

      // Only skip if there's truly no media at all - try multiple fallbacks
      if (!candidateUrl) {
        // Try to find any media URL from the item
        const fallbackUrl = 
          (it.videos && it.videos.length > 0 && (it.videos[0].url || it.videos[0].originalUrl)) ||
          (it.images && it.images.length > 0 && (it.images[0].url || it.images[0].originalUrl)) ||
          (it.audios && it.audios.length > 0 && (it.audios[0].url || it.audios[0].originalUrl))
        
        if (!fallbackUrl) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[ArtStation] Item has no media URL:', {
              id: it.id,
              hasVideos: !!it.videos?.length,
              hasImages: !!it.images?.length,
              hasAudios: !!(it as any).audios?.length,
              candidate
            })
          }
          continue
        }
        // Use fallback URL if candidate URL resolution failed
        const fallbackCandidate = candidate || (it.videos && it.videos[0]) || (it.images && it.images[0]) || (it.audios && it.audios[0])
        seenItem.add(it.id)
        out.push({ 
          item: it, 
          media: { 
            ...fallbackCandidate, 
            url: fallbackUrl,
            blurDataUrl: (fallbackCandidate as any)?.blurDataUrl,
          }, 
          kind 
        })
        continue
      }

      // Add item to seen set and include in output
      seenItem.add(it.id)
      out.push({ 
        item: it, 
        media: { 
          ...candidate, 
          url: candidateUrl,
          blurDataUrl: (candidate as any)?.blurDataUrl,
        }, 
        kind 
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[ArtStation] Final cards count:', out.length, 'from', filteredItems.length, 'filtered items')
    }
    return out
  }, [filteredItems])

  const markTileLoaded = (tileId: string) => {
    setLoadedTiles(prev => {
      if (prev.has(tileId)) return prev
      const next = new Set(prev)
      next.add(tileId)
      return next
    })
    // Recompute span on load complete for accurate height
    requestAnimationFrame(() => measureTileSpan(tileId))
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
  // Preconnect to media hosts on mount for faster TLS handshakes
  useEffect(() => {
    try {
      const head = document.head
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')
      const zata = (process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/').replace(/\/$/, '/')
      const hosts = [apiBase, new URL(zata).origin]
      hosts.forEach(href => {
        if (!head.querySelector(`link[data-preconnect='${href}']`)) {
          const l = document.createElement('link')
          l.rel = 'preconnect'
          l.href = href
          l.setAttribute('data-preconnect', href)
          head.appendChild(l)
        }
      })
    } catch {}
  }, [])

  const prefetchMedia = (kind: 'image'|'video'|'audio', url: string) => {
    try {
      const key = `${kind}:${url}`
      if (prefetchedRef.current.has(key)) return
      prefetchedRef.current.add(key)
      if (kind === 'image') {
        const img = document.createElement('img')
        const src = toDirectUrl(url) || url
        img.decoding = 'async'
        ;(img as any).loading = 'eager'
        img.src = src
      } else if (kind === 'video') {
        const href = toDirectUrl(url) || url
        const l = document.createElement('link')
        l.rel = 'preload'
        l.as = 'video'
        l.href = href
        document.head.appendChild(l)
      } else if (kind === 'audio') {
        const href = toDirectUrl(url) || url
        const l = document.createElement('link')
        l.rel = 'preload'
        l.as = 'audio'
        l.href = href
        document.head.appendChild(l)
      }
    } catch {}
  }

  // (columns masonry) no measurement needed

  // Compute and apply grid-row span for a tile to achieve masonry look while preserving DOM order
  const measureTileSpan = (tileId: string) => {
    try {
      const el = tileRefs.current[tileId]
      if (!el) return
      // Measure inner content if available for more stable height
      const inner = el.querySelector('.masonry-item-inner') as HTMLElement | null
      const rect = (inner || el).getBoundingClientRect()
      const height = rect.height
      // Keep rowHeight small; gap must match grid gap (Tailwind gap-2 = 8px)
      const rowHeight = 6 // px
      const rowGap = 8 // px
      const span = Math.max(10, Math.ceil((height + rowGap) / (rowHeight + rowGap)))
      setTileSpans(prev => (prev[tileId] === span ? prev : { ...prev, [tileId]: span }))
    } catch { }
  }

  // Setup a ResizeObserver to recompute spans when tiles or container resize
  useEffect(() => {
    try {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect()
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement
          const id = target.dataset.tileId
          if (id) measureTileSpan(id)
        }
      })
      resizeObserverRef.current = ro
      // Observe current tile elements
      Object.entries(tileRefs.current).forEach(([id, el]) => {
        if (el) {
          el.dataset.tileId = id
          try { ro.observe(el) } catch { }
        }
      })
      return () => { try { ro.disconnect() } catch { } }
    } catch {
      return () => { }
    }
  }, [cards])

  // duplicate removed

  return (
    <div className="min-h-screen bg-[#07070B]">
      {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
      <div className="flex ml-[68px]">
        <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 lg:px-12 ">
          {/* Sticky header + filters (pinned under navbar) */}
          <div className="sticky top-0 z-20 bg-[#07070B] pt-10 ">
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
                {(['All', 'Images', 'Videos', 'Logos', 'Products'] as Category[]).map((category) => (
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

                {/* Search Input and Buttons */}
                <div className="ml-auto flex items-center gap-2 flex-shrink-0 p-1">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Search is already applied via filteredItems useMemo
                        }
                      }}
                      placeholder="Search by prompt..."
                      className={`px-4 py-2 rounded-lg text-sm bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 text-white placeholder-white/90 w-48 md:w-64 ${searchQuery ? 'pr-10' : ''}`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

          {/* Feed container uses main page scrollbar */}
          <div ref={scrollContainerRef}>
          {/* Masonry grid with preserved order */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 [overflow-anchor:none]"
            style={{ gridAutoRows: '2px' }}
          >
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
                  className={`cursor-pointer group relative [content-visibility:auto] [overflow-anchor:none] w-full ${visibleTiles.has(cardId) ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'} transition-all duration-700 ease-out`}
                  onMouseEnter={() => { setHoveredCard(cardId); prefetchMedia(kind, media.url) }}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => {
                    setSelectedImageIndex(0)
                    setSelectedVideoIndex(0)
                    setSelectedAudioIndex(0)
                    setPreview({ kind, url: media.url, item })
                  }}
                  ref={(el) => { revealRefs.current[cardId] = el; tileRefs.current[cardId] = el }}
                  style={{
                    transitionDelay: `${(idx % 12) * 35}ms`,
                    gridRowEnd: `span ${tileSpans[cardId] || 30}`,
                  }}
                >
                  <div className="masonry-item-inner relative w-full rounded-lg overflow-hidden bg-transparent group" style={{ contain: 'paint' }}>
                    <div
                      style={{ aspectRatio: tileRatio, minHeight: 160 }}
                      className={`relative transition-opacity duration-300 ease-out will-change-[opacity] opacity-100`}
                    >
                      {kind !== 'audio' && !loadedTiles.has(cardId) && (
                        <div className="absolute inset-0 bg-white/5" />
                      )}
                      {(() => {
                        const isPriority = idx < 4
                        const sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'
                        const blur = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPTEgaGVpZ2h0PTEgZmlsbD0nI2ZmZicgZmlsbC1vcGFjaXR5PScwLjA1Jy8+PC9zdmc+' // very light placeholder
                        return kind === 'video' ? (
                          (() => {
                            const proxied = toMediaProxy(media.url)
                            const original = toDirectUrl(media.url) || media.url
                            
                            return (
                              <video
                                src={proxied}
                                className="absolute inset-0 w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                data-fallback-src={original}
                                onMouseEnter={async (e) => {
                                  const v = e.currentTarget as HTMLVideoElement
                                  if (v.paused) {
                                    try { 
                                      await v.play()
                                    } catch (err) {
                                      // If proxy fails, try fallback
                                      const fallback = v.getAttribute('data-fallback-src')
                                      if (fallback && v.src !== fallback) {
                                        v.src = fallback
                                        v.load()
                                        try { await v.play() } catch { }
                                      }
                                    }
                                  }
                                }}
                                onMouseLeave={(e) => { 
                                  const v = e.currentTarget as HTMLVideoElement
                                  try { v.pause(); v.currentTime = 0 } catch { }
                                }}
                                onLoadedMetadata={(e) => {
                                  const v = e.currentTarget as HTMLVideoElement
                                  try { if (v && v.videoWidth && v.videoHeight) noteMeasuredRatio(ratioKey, v.videoWidth, v.videoHeight) } catch { }
                                  markTileLoaded(cardId)
                                }}
                                onError={(e) => {
                                  const v = e.currentTarget as HTMLVideoElement
                                  const fallback = v.getAttribute('data-fallback-src')
                                  if (fallback && v.src !== fallback) {
                                    v.src = fallback
                                    v.load()
                                  } else {
                                    markTileLoaded(cardId)
                                  }
                                }}
                              />
                            )
                          })()
                        ) : kind === 'audio' ? (
                          <>
                            {/* Use a simple music logo image to avoid prompt alt text showing */}
                            <img
                              src="/icons/musicgenerationwhite.svg"
                              alt=""
                              loading={isPriority ? 'eager' : 'lazy'}
                              fetchPriority={isPriority ? 'high' : 'auto'}
                              className="absolute inset-0 w-full h-full object-contain p-8 bg-gradient-to-br from-[#0B0F1A] to-[#111827] transition-transform duration-300 ease-out group-hover:scale-[1.01]"
                              onLoad={() => { markTileLoaded(cardId) }}
                            />
                          </>
                        ) : (
                          <ImageWithFallback
                            media={media}
                            alt={item.prompt || ''}
                            fill={true}
                            sizes={sizes}
                            blurDataURL={media.blurDataUrl || blur}
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.01]"
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
                        <div className="absolute bottom-2 right-2 opacity-80">
                          <div className="bg-black/40 rounded-md p-1">
                            <img src="/icons/videoGenerationiconwhite.svg" alt="Video" className="w-5 h-5" />
                          </div>
                        </div>
                      )}

                      {/* Music overlay if the item contains audio tracks (show even when tile is an image/video) */}
                      {(item as any).audios && (item as any).audios.length > 0 && (
                        <div className="absolute bottom-2 left-2 opacity-80">
                          <div className="bg-black/40 rounded-md p-1">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-white">
                              <path d="M9 17a4 4 0 1 0 0-8v8z" />
                              <path d="M9 9v8" />
                              <path d="M9 9l10-3v8" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Hover overlay: user profile + actions */}
                    <div className="absolute inset-x-0 bottom-0 p-2 md:p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                      <div className="rounded-lg px-2 py-2 md:px-3 md:py-2 flex items-center justify-between gap-2 pointer-events-auto">
                        {/* User */}
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const cb = item.createdBy || ({} as any)
                            console.log('cb', cb)
                            const photo = cb.photoURL || cb.photoUrl || cb.avatarUrl || cb.avatarURL || cb.profileImageUrl || ''
                            if (photo) {
                              const proxied = `/api/proxy/external?url=${encodeURIComponent(photo)}`
                              return <img src={proxied} alt={cb.username || cb.displayName || ''} className="w-7 h-7 rounded-full object-cover" />
                            }
                            return (
                              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white/90">
                                {(cb.username || cb.displayName || 'U').slice(0,1).toUpperCase()}
                              </div>
                            )
                          })()}
                          <div className="flex-1 min-w-0">
                            <div className="text-white/90 text-[12px] truncate">
                              {item.createdBy?.username || item.createdBy?.displayName || 'User'}
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(cardId) }}
                            className={`p-1.5 rounded-md transition-colors ${isLiked ? 'bg-white text-black' : 'bg-white/5 backdrop-blur-3xl hover:bg-white/20 text-white'}`}
                            aria-label={isLiked ? 'Unlike' : 'Like'}
                            title={isLiked ? 'Unlike' : 'Like'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'red' : 'none'} stroke={ isLiked ?"red":"currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </button>
                          {currentUid && item.createdBy?.uid === currentUid && (
                            <button
                              onClick={(e) => { e.stopPropagation(); confirmDelete(item) }}
                              className="p-1.5 rounded-md bg-white/5 backdrop-blur-3xl hover:bg-white/20 text-red transition-colors"
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

          {/* Loading indicator for pagination */}
          {loading && items.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2">Loading more...</p>
            </div>
          )}

          {/* Initial loading - unified logo across tabs */}
          {loading && items.length === 0 && (
            <div className="flex items-center justify-center py-28">
              <div className="flex flex-col items-center gap-4">
                {/* Using lightweight spinner instead of 604.6 KiB Logo.gif */}
                <div className="w-28 h-28 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
                <div className="text-white text-lg">
                  Loading Art Station...
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

          {/* Preview Modal */}
          <ArtStationPreview
            preview={preview}
            onClose={() => setPreview(null)}
            onConfirmDelete={confirmDelete}
            currentUid={currentUid}
            currentUser={currentUser}
            cards={cards}
            likedCards={likedCards}
            toggleLike={toggleLike}
          />
        </div>
      </div>

    </div>
  )
}


