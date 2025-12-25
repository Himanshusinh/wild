'use client'
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useIntersectionObserverForRef } from '@/hooks/useInfiniteGenerations';
// Nav and SidePannelFeatures are provided by the persistent root layout
import { API_BASE } from '../HomePage/routes'
import CustomAudioPlayer from '../Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import RemoveBgPopup from '../Generation/ImageGeneration/TextToImage/compo/RemoveBgPopup'
import { Trash2 } from 'lucide-react'
import ArtStationPreview from '@/components/ArtStationPreview'
import axiosInstance from '@/lib/axiosInstance'
import { toMediaProxy, toDirectUrl } from '@/lib/thumb'
import { downloadFileWithNaming, getFileType } from '@/utils/downloadUtils'
import { getModelDisplayName } from '@/utils/modelDisplayNames'
import { Masonry } from '@/components/masonry'

type PublicItem = {
  id: string;
  prompt?: string;
  // Optional rich text fields for audio/music generations
  lyrics?: string;
  fileName?: string;
  generationType?: string;
  model?: string;
  aspectRatio?: string;
  frameSize?: string;
  aspect_ratio?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
  isDeleted?: boolean;
  aestheticScore?: number; // Added: aesthetic score field
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
    aestheticScore?: number; // Added: image-level score
  }[];
  videos?: { id: string; url: string; originalUrl?: string; storagePath?: string; aestheticScore?: number }[];
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

const canonicalMediaKey = (url?: string) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const noQuery = trimmed.split('?')[0];
  return noQuery.endsWith('/') ? noQuery.slice(0, -1) : noQuery;
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
  // Per-generation engagement state: likes/bookmarks + current user flags
  const [engagement, setEngagement] = useState<Record<string, {
    likesCount: number
    bookmarksCount: number
    likedByMe: boolean
    bookmarkedByMe: boolean
  }>>({})
  // Liked-only view state
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [likedIdsLoading, setLikedIdsLoading] = useState(false)
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

  const confirmDelete = async (item: PublicItem, imageId?: string) => {
    try {
      const who = item?.createdBy?.uid || ''
      const currentUid = (typeof window !== 'undefined' && (localStorage.getItem('user') && (() => { try { return JSON.parse(localStorage.getItem('user') as string)?.uid } catch { return null } })())) as string | null
      if (!currentUid || who !== currentUid) {
        alert('You can delete only your own generation')
        return
      }
      
      const isSingleImage = imageId && item.images && item.images.length > 0;
      const confirmMessage = isSingleImage 
        ? 'Delete this image permanently? This cannot be undone.'
        : 'Delete this generation permanently? This cannot be undone.';
        
      const ok = confirm(confirmMessage)
      if (!ok) return
      
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      const url = new URL(`${baseUrl}/api/generations/${item.id}`);
      if (imageId) {
        url.searchParams.set('imageId', imageId);
      }
      
      const res = await fetch(url.toString(), { method: 'DELETE', credentials: 'include' })
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Delete failed')
      }
      
      const json = await res.json();
      const updatedItem = json?.data?.item;
      
      if (updatedItem && !updatedItem.isDeleted) {
        // Partial deletion - update item in list
        setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
        
        // Update preview if open
        if (preview?.item?.id === item.id) {
          // If the deleted image was the currently viewed one, we might need to adjust view or close.
          // However, ArtStationPreview handles index updates via props if we passed them,
          // but here we are just updating the 'item'.
          // We should update the preview item reference.
          // If the currently viewed image was the one deleted, we rely on the fact that
          // the item's images array is now shorter.
          // We'll update the preview object.
          setPreview(prev => prev ? { ...prev, item: updatedItem } : null);
        }
      } else {
        // Full deletion
        setItems(prev => prev.filter(i => i.id !== item.id))
        // Close preview if it was this item
        if (preview?.item?.id === item.id) setPreview(null)
      }
    } catch (e) {
      console.error('Delete error', e)
      alert('Failed to delete generation')
    }
  }

  // Handle cross-item navigation from ArtStationPreview
  const handleNavigate = useCallback((newPreview: typeof preview, mediaIndex: number) => {
    if (!newPreview) return
    
    console.log('[ArtStation] handleNavigate called', { newPreview, mediaIndex })
    
    // Update preview to new item
    setPreview(newPreview)
    
    // Update appropriate index
    if (newPreview.kind === 'image') {
      setSelectedImageIndex(mediaIndex)
      setSelectedVideoIndex(0)
      setSelectedAudioIndex(0)
    } else if (newPreview.kind === 'video') {
      setSelectedVideoIndex(mediaIndex)
      setSelectedImageIndex(0)
      setSelectedAudioIndex(0)
    } else {
      setSelectedAudioIndex(mediaIndex)
      setSelectedImageIndex(0)
      setSelectedVideoIndex(0)
    }
  }, [])

  const toggleLike = async (generationId: string) => {
    // Determine previous state once so we can use it for optimistic update + API action
    const prevState = engagement[generationId] || {
      likesCount: 0,
      bookmarksCount: 0,
      likedByMe: false,
      bookmarkedByMe: false,
    }
    const wasLiked = !!prevState.likedByMe
    const willLike = !wasLiked

    // Optimistic update for engagement counts
    setEngagement(prev => {
      const current = prev[generationId] || prevState
      return {
        ...prev,
        [generationId]: {
          ...current,
          likedByMe: willLike,
          likesCount: Math.max(0, current.likesCount + (willLike ? 1 : -1)),
        },
      }
    })

    // Keep local likedIds set in sync so "Liked" filter works immediately
    setLikedIds(prev => {
      const next = new Set(prev)
      if (willLike) {
        next.add(generationId)
      } else {
        next.delete(generationId)
      }
      return next
    })

    const action = willLike ? 'like' : 'unlike'

    try {
      await axiosInstance.post('/api/engagement/like', { generationId, action })
    } catch (error) {
      console.error('[ArtStation] toggleLike failed, reverting', error)
      // Revert on failure
      setEngagement(prev => {
        const current = prev[generationId] || prevState
        return {
          ...prev,
          [generationId]: {
            ...current,
            likedByMe: wasLiked,
            likesCount: Math.max(0, current.likesCount + (wasLiked ? 1 : -1) - (willLike ? 1 : -1)),
          },
        }
      })
      // Also revert likedIds set
      setLikedIds(prev => {
        const next = new Set(prev)
        if (wasLiked) {
          next.add(generationId)
        } else {
          next.delete(generationId)
        }
        return next
      })
    }
  }

  const loadLikedIds = async () => {
    // Avoid duplicate loads
    if (likedIdsLoading) return
    try {
      setLikedIdsLoading(true)
      const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
      const url = new URL(`${baseUrl}/api/engagement/me/likes`)
      url.searchParams.set('limit', '200')

      const res = await fetch(url.toString(), { credentials: 'include' })
      if (!res.ok) {
        console.error('[ArtStation] Failed to load liked generations ids', res.status, res.statusText)
        return
      }
      const json = await res.json()
      const payload = json?.data || json
      const itemsArr = Array.isArray(payload?.items) ? payload.items : []
      const nextSet = new Set<string>()
      for (const it of itemsArr) {
        if (it?.generationId) {
          nextSet.add(String(it.generationId))
        }
      }
      setLikedIds(nextSet)
    } catch (err) {
      console.error('[ArtStation] Error loading liked generations ids', err)
    } finally {
      setLikedIdsLoading(false)
    }
  }

  const toggleBookmark = async (generationId: string) => {
    const prevState = engagement[generationId] || {
      likesCount: 0,
      bookmarksCount: 0,
      likedByMe: false,
      bookmarkedByMe: false,
    }
    const wasBookmarked = !!prevState.bookmarkedByMe
    const willBookmark = !wasBookmarked

    setEngagement(prev => {
      const current = prev[generationId] || prevState
      return {
        ...prev,
        [generationId]: {
          ...current,
          bookmarkedByMe: willBookmark,
          bookmarksCount: Math.max(0, current.bookmarksCount + (willBookmark ? 1 : -1)),
        },
      }
    })

    const action = willBookmark ? 'save' : 'unsave'

    try {
      await axiosInstance.post('/api/engagement/bookmark', { generationId, action })
    } catch (error) {
      console.error('[ArtStation] toggleBookmark failed, reverting', error)
      setEngagement(prev => {
        const current = prev[generationId] || prevState
        return {
          ...prev,
          [generationId]: {
            ...current,
            bookmarkedByMe: wasBookmarked,
            bookmarksCount: Math.max(0, current.bookmarksCount + (wasBookmarked ? 1 : -1) - (willBookmark ? 1 : -1)),
          },
        }
      })
    }
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
        aestheticScore: typeof it?.aestheticScore === 'number' ? it.aestheticScore : undefined, // Preserve aestheticScore
      }))

      // Shuffle only the newly fetched page so overall order feels organic,
      // without reordering items that were already rendered.
      for (let i = newItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = newItems[i]
        newItems[i] = newItems[j]!
        newItems[j] = tmp!
      }

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
    try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch { }
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
      try { window.scrollTo({ top: 0, behavior: 'auto' }) } catch { }
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

  // OPTIMIZATION: Prefetch next page when user scrolls past 50% of the page
  useEffect(() => {
    const handleScroll = () => {
      // Don't prefetch if already loading, no more items, or initial load not done
      if (loading || !hasMore || !initialLoadDoneRef.current || inFlightRef.current) return

      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Calculate scroll percentage
      const scrollPercentage = (scrollY + windowHeight) / documentHeight

      // Trigger fetch if scrolled past 25%
      if (scrollPercentage > 0.25) {
        // Debounce/Throttle check is implicitly handled by `loading` state in fetchFeed
        // but we add a small check here to avoid spamming the function call
        if (!loadingMoreRef.current) {
          console.log('[ArtStation] Prefetching next page at 25% scroll')
          fetchFeed(false)
        }
      }
    }

    // Throttled scroll listener
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, hasMore])

  // Removed auto-fill loop to avoid duplicate overlapping fetches; rely on infinite scroll only

  // Resolve deep link: try current feed items first, then fall back to direct fetch by id
  useEffect(() => {
    if (!deepLinkId) return

    const openPreviewForItem = (item: PublicItem) => {
      const media =
        (item.videos && item.videos[0]) ||
        (item.images && item.images[0]) ||
        (item.audios && item.audios[0])
      const kind: any =
        (item.videos && item.videos[0])
          ? 'video'
          : (item.images && item.images[0])
            ? 'image'
            : 'audio'

      if (!media || !media.url) return

      setSelectedImageIndex(0)
      setSelectedVideoIndex(0)
      setSelectedAudioIndex(0)

      const maybeStorage: any = (media as any).storagePath
      const normalizedUrl =
        normalizeMediaUrl(media.url) ||
        (maybeStorage ? normalizeMediaUrl(maybeStorage) : null) ||
        media.url

      setPreview({ kind, url: normalizedUrl || media.url, item })
      setDeepLinkId(null)
    }

    // 1) Try to find the item in the already-loaded feed
    const inFeed = items.find((i) => i.id === deepLinkId)
    if (inFeed) {
      openPreviewForItem(inFeed)
      return
    }

    // 2) Fallback: fetch that single public generation by id so deep links
    // from Bookmarks / Likes always work even if it's not on the first page
    ; (async () => {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
        if (!apiBase) {
          console.warn('[ArtStation] Missing NEXT_PUBLIC_API_BASE_URL; cannot resolve deep link by id')
          return
        }

        const res = await fetch(`${apiBase}/api/feed/${encodeURIComponent(deepLinkId)}`)
        if (!res.ok) {
          console.warn('[ArtStation] Failed to fetch deep-linked generation by id', deepLinkId, res.status)
          return
        }

        const json = await res.json()
        const payload = json?.data || json || {}
        const rawItem = payload.item || payload
        if (!rawItem) {
          console.warn('[ArtStation] Deep link fetch returned no item for id', deepLinkId)
          return
        }

        const normalizeDate = (d: any) =>
          typeof d === 'string'
            ? d
            : d && typeof d === 'object' && typeof d._seconds === 'number'
              ? new Date(d._seconds * 1000).toISOString()
              : undefined

        const normalizedItem: PublicItem = {
          ...rawItem,
          id: String(rawItem.id || deepLinkId),
          createdAt: normalizeDate(rawItem.createdAt) || rawItem.createdAt,
          updatedAt: normalizeDate(rawItem.updatedAt) || rawItem.updatedAt,
          aspectRatio: rawItem.aspect_ratio || rawItem.aspectRatio || rawItem.frameSize,
          frameSize: rawItem.frameSize || rawItem.aspect_ratio || rawItem.aspectRatio,
        }

        // Optionally merge into items so navigation still works
        setItems((prev) => {
          if (prev.some((it) => it.id === normalizedItem.id)) return prev
          return [normalizedItem, ...prev]
        })

        openPreviewForItem(normalizedItem)
      } catch (err) {
        console.error('[ArtStation] Error resolving deep link by id', deepLinkId, err)
      }
    })()
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



    let sanitized = categoryFiltered.filter((item) => !shouldHideGenerationType(item.generationType));

    // Apply "Liked only" filter when enabled
    if (showLikedOnly && likedIds.size > 0) {
      sanitized = sanitized.filter(item => likedIds.has(item.id))
    }

    return sanitized;
  }, [items, activeCategory, searchQuery, showLikedOnly, likedIds]);

  const normalizeMediaUrl = (url?: string): string | undefined => {
    if (!url) return undefined
    const trimmed = url.trim()
    if (!trimmed) return undefined
    // Reject replicate URLs to prevent 404s - only use Zata URLs
    if (trimmed.includes('replicate.delivery') || trimmed.includes('replicate.com')) {
      return undefined
    }
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    if (trimmed.startsWith('/api/')) return trimmed
    // If it's a relative path (not starting with / or http), assume it's a Zata path and proxy it
    if (!trimmed.startsWith('/')) return toMediaProxy(trimmed)
    return toDirectUrl(trimmed)
  }

  const resolveMediaUrl = (m: any): string | undefined => {
    if (!m) return undefined
    // Try multiple URL properties in order of preference (NO originalUrl to avoid 404s)
    const candidates = [
      m.url,
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

  // Resolve thumbnail URL with fallback: thumbnailUrl -> optimized formats -> proxied/original (never raw original first)
  const resolveThumbnailUrl = (m: any): { url: string; fallbacks: string[] } => {
    if (!m) return { url: '', fallbacks: [] }

    const thumbnailUrl = normalizeMediaUrl(m.thumbnailUrl)
    const webpUrl = normalizeMediaUrl(m.webpUrl)
    const avifUrl = normalizeMediaUrl(m.avifUrl)
    const firebaseUrl = normalizeMediaUrl((m.firebaseUrl as string | undefined))
    const directUrl = normalizeMediaUrl(m.url)
    const storageUrl = m.storagePath ? toMediaProxy(m.storagePath) : undefined

    // For thumbnails, prefer optimized/thumbnail URLs. If we only have a directUrl,
    // try to route it through our proxy; as a last resort, keep the direct URL so
    // the tile still renders (avoids blank/black gaps in masonry).
    let safeDirect: string | undefined
    if (directUrl) {
      if (directUrl.startsWith('/api/')) {
        safeDirect = directUrl
      } else {
        safeDirect = toMediaProxy(directUrl) || directUrl
      }
    }

    // Fallback chain: avifUrl -> webpUrl -> thumbnailUrl -> firebaseUrl -> safeDirect -> storagePath
    const ordered = [avifUrl, webpUrl, thumbnailUrl, firebaseUrl, safeDirect, storageUrl].filter(
      (u, idx, arr) => !!u && arr.indexOf(u) === idx
    ) as string[]

    return {
      url: ordered[0] || '',
      fallbacks: ordered.slice(1)
    }
  }

  // Resolve full image URL for popup: url -> storagePath (NO originalUrl to avoid 404s)
  const resolveFullImageUrl = (m: any): { url: string; fallbacks: string[] } => {
    if (!m) return { url: '', fallbacks: [] }

    const directUrl = normalizeMediaUrl(m.url)
    const storageUrl = m.storagePath ? toMediaProxy(m.storagePath) : undefined

    // Fallback chain: url -> storagePath (removed originalUrl to prevent 404 errors)
    const ordered = [directUrl, storageUrl].filter(
      (u, idx, arr) => !!u && arr.indexOf(u) === idx
    ) as string[]

    return {
      url: ordered[0] || '',
      fallbacks: ordered.slice(1)
    }
  }





  // Stabilize cards array to prevent glitches
  const cards = useMemo(() => {
    // Show a single representative media per generation item to avoid multiple tiles
    const seenItem = new Set<string>()
    const seenMediaUrls = new Set<string>()
    const out: { item: PublicItem; media: any; kind: 'image' | 'video' | 'audio' }[] = []

    // Use a stable reference - only recalculate if filteredItems actually changed
    const itemsKey = filteredItems.map(i => i.id).join(',')

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
      const candidateKey = canonicalMediaKey(candidateUrl)
      if (candidateKey && seenMediaUrls.has(candidateKey)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ArtStation] Skipping duplicate media URL:', candidateKey, 'from item', it.id)
        }
        continue
      }

      // Only skip if there's truly no media at all - try multiple fallbacks
      if (!candidateUrl) {
        // Try to find any media URL from the item
        const primaryVideo = it.videos?.[0]
        const primaryImage = it.images?.[0]
        const primaryAudio = (it as any).audios?.[0]
        const fallbackUrl =
          primaryVideo?.url || primaryVideo?.storagePath ||
          primaryImage?.url || primaryImage?.storagePath ||
          primaryAudio?.url || primaryAudio?.storagePath
        const fallbackKey = canonicalMediaKey(fallbackUrl)

        if (fallbackKey && seenMediaUrls.has(fallbackKey)) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[ArtStation] Skipping duplicate fallback media URL:', fallbackKey, 'from item', it.id)
          }
          continue
        }

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
        const fallbackCandidate = candidate || (it.videos && it.videos[0]) || (it.images && it.images[0]) || (it.audios && it.audios[0])
        seenItem.add(it.id)
        if (fallbackKey) seenMediaUrls.add(fallbackKey)
        // Remove originalUrl to prevent 404s - only use Zata URLs
        const { originalUrl, ...mediaWithoutOriginal } = fallbackCandidate || {}
        out.push({
          item: it,
          media: {
            ...mediaWithoutOriginal,
            url: fallbackUrl,
            blurDataUrl: (fallbackCandidate as any)?.blurDataUrl,
          },
          kind
        })
        continue
      }

      // Add item to seen set and include in output
      seenItem.add(it.id)
      if (candidateKey) seenMediaUrls.add(candidateKey)
      // Remove originalUrl to prevent 404s - only use Zata URLs
      const { originalUrl, ...mediaWithoutOriginal } = candidate || {}
      out.push({
        item: it,
        media: {
          ...mediaWithoutOriginal,
          url: candidateUrl,
          blurDataUrl: (candidate as any)?.blurDataUrl,
        },
        kind
      })
    }

    return out
  }, [filteredItems])

  // Fetch engagement status for the current cards (batched, after cards change)
  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        if (!currentUid || cards.length === 0) return
        const generationIds = Array.from(new Set(cards.map(c => c.item.id))).slice(0, 100)
        const res = await axiosInstance.post('/api/engagement/bulk-status', { generationIds })
        const data = res.data
        const items = data?.data?.items || data?.items || []
        setEngagement(prev => {
          const next = { ...prev }
          for (const it of items) {
            if (!it?.id) continue
            const genId = String(it.id)
            const current = next[genId] || { likesCount: 0, bookmarksCount: 0, likedByMe: false, bookmarkedByMe: false }
            next[genId] = {
              likesCount: typeof it.likesCount === 'number' ? it.likesCount : current.likesCount,
              bookmarksCount: typeof it.bookmarksCount === 'number' ? it.bookmarksCount : current.bookmarksCount,
              likedByMe: !!it.likedByCurrentUser,
              bookmarkedByMe: !!it.bookmarkedByCurrentUser,
            }
          }
          return next
        })
      } catch (e) {
        // Non-fatal
        console.warn('[ArtStation] Failed to fetch engagement status', e)
      }
    }
    fetchEngagement()
  }, [cards, currentUid])

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

  // Track tiles that failed to load media so we can hide them to prevent gaps
  const [failedTiles, setFailedTiles] = useState<Set<string>>(new Set())

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
    onLoadingComplete,
    useThumbnail = false,
    onFailure
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
    useThumbnail?: boolean;
    onFailure?: () => void;
  }) => {
    const { url: primaryUrl, fallbacks } = useThumbnail
      ? resolveThumbnailUrl(media)
      : resolveFullImageUrl(media);
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const allUrls = [primaryUrl, ...fallbacks].filter(
      (u, idx, arr) => !!u && arr.indexOf(u) === idx
    );
    const currentUrl = allUrls[currentUrlIndex] || allUrls[0] || '';

    const markCompleteFallback = () => {
      try {
        onLoadingComplete?.({ naturalWidth: 1, naturalHeight: 1 } as HTMLImageElement)
      } catch { }
    }

    const handleError = () => {
      if (currentUrlIndex < allUrls.length - 1) {
        // Try next fallback URL
        setCurrentUrlIndex(prev => prev + 1);
      } else {
        markCompleteFallback()
        onFailure?.()
      }
    };

    useEffect(() => {
      if (!currentUrl) {
        markCompleteFallback()
        onFailure?.()
      }
    }, [currentUrl])

    if (!currentUrl) {
      // If we couldn't resolve a valid URL (e.g. only replicate URLs), don't render anything
      return null
    }

    // Use direct img tag for Zata URLs (bypass Next.js Image optimization)
    return (
      <div className="relative w-full" style={{ backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 'auto' }}>
        <img
          key={`${currentUrl}-${currentUrlIndex}`}
          src={currentUrl}
          alt={alt}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className={className}
          style={{
            width: '100%',
            height: 'auto',
            position: 'relative',
            zIndex: 1,
            outline: 'none',
            border: 'none',
            display: 'block',
          }}
          onError={handleError}
          onLoad={(e) => {
            try {
              onLoadingComplete?.(e.currentTarget as HTMLImageElement);
            } catch { }
          }}
        />
      </div>
    );
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
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
      const zata = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/')
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
    } catch { }
  }, [])

  const prefetchMedia = (kind: 'image' | 'video' | 'audio', url: string) => {
    try {
      const key = `${kind}:${url}`
      if (prefetchedRef.current.has(key)) return
      prefetchedRef.current.add(key)
      if (kind === 'image') {
        const img = document.createElement('img')
        const src = toDirectUrl(url) || url
        img.decoding = 'async'
          ; (img as any).loading = 'eager'
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
    } catch { }
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

  // Determine if user is authenticated to adjust layout
  const isAuth = !!currentUid

  return (
    <div className="min-h-screen bg-[#07070B]">
      {/* Root layout renders Nav + SidePanel; add spacing here so content aligns */}
      {/* When authenticated: add margin for sidepanel, when not: full width */}
      <div className={`flex ${isAuth ? 'md:ml-[68px]' : 'ml-0'} ml-0`}>
        <div className="flex-1 min-w-0 px-4 sm:px-6 md:px-9 ">
          {/* Sticky header + filters (pinned under navbar) */}
          <div className="sticky top-0 z-20 bg-[#07070B] pt-3">
            <div className=" mb-0 md:mb-0">
              <div className='flex items-center gap-3 justify-between w-full'>

                <h3 className="text-white text-xl sm:text-xl md:text-2xl font-semibold md:mb-2 mb-0">
                  GEN-ART
                </h3>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between md:gap-3 gap-2 overflow-x-auto md:pb-2 pb-0 scrollbar-none">
                    <div className="flex md:gap-2 gap-1">

                      {(['All', 'Images', 'Videos'] as Category[]).map((category) => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className={`inline-flex items-center md:gap-2  md:px-3 px-2 md:py-1 py-1 rounded-lg md:text-sm text-[11px] font-medium transition-all border ${activeCategory === category
                            ? 'bg-white border-white/5 text-black shadow-sm'
                            : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <div className='flex items-center flex-nowrap justify-end md:gap-2 gap-1'>
                      {/* Liked filter + Search Input */}
                      <div className="flex items-center md:gap-2 gap-1 flex-shrink-0 md:p-0 p-0">
                        {/* Liked-only toggle button */}
                        <button
                          type="button"
                          onClick={async () => {
                            // When enabling liked-only for the first time, load IDs from backend
                            if (!showLikedOnly && likedIds.size === 0) {
                              await loadLikedIds()
                            }
                            setShowLikedOnly(prev => !prev)
                          }}
                          className={`md:p-1.5 p-1 rounded-lg border flex items-center justify-center transition-all ${showLikedOnly
                              ? 'bg-white text-black border-white'
                              : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            }`}
                          aria-pressed={showLikedOnly}
                          aria-label={showLikedOnly ? 'Show all creations' : 'Show liked creations'}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={showLikedOnly ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="flex-shrink-0"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>

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
                            className={`md:px-3 px-2 md:py-1 py-1 rounded-lg md:text-sm text-[11px] bg-white/5 border border-white/15 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 text-white placeholder-white/90 md:w-48 w-32 ${searchQuery ? 'pr-10' : ''}`}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute md:right-2 right-1 md:p-1.5 p-0.5 rounded-lg  hover:bg-white/20 text-white/80 hover:text-white transition-colors"
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
              </div>
              <p className="text-white/80 text-xs sm:text-lg md:text-sm pb-2">
                Discover amazing AI-generated content from our creative community
              </p>
            </div>

            {/* Category Filter Bar */}

          </div>

          {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

          {/* Feed container uses main page scrollbar */}
          <div ref={scrollContainerRef}>
            {/* Masonry grid */}
            <Masonry
              items={cards}
              config={useMemo(() => ({
                columns: [2, 3, 4, 5] as const,
                gap: [2, 2, 2, 2] as const, // uniform 2px spacing
                media: [640, 768, 1024, 1280] as const,
              }), [])}
              className="[overflow-anchor:none]"
              placeholder={undefined}
              render={(card: { item: PublicItem; media: any; kind: 'image' | 'video' | 'audio' }, idx: number) => {
                const { item, media, kind } = card
                const cardId = `${item.id}-${media.id}-${idx}`

                // Skip rendering if this tile has failed to load media
                if (failedTiles.has(cardId)) return null

                const isHovered = hoveredCard === cardId
                const engagementState = engagement[item.id] || { likesCount: 0, bookmarksCount: 0, likedByMe: false, bookmarkedByMe: false }
                const isLiked = engagementState.likedByMe

                // Use stable keys to prevent re-renders
                const ratioKey = `${item.id}-${media.id || media.url || idx}`

                // Calculate aspect ratio: prefer measured, then item aspect ratio
                const rawRatio = (item.aspectRatio || item.frameSize || item.aspect_ratio || '').replace('x', ':')
                const m = (rawRatio || '').match(/^(\d+)\s*[:/]\s*(\d+)$/)
                const measuredRatio = measuredRatios[ratioKey]
                // REMOVED: fallbackRatios - do not force arbitrary shapes
                const aspectRatio = measuredRatio || (m ? `${m[1]}/${m[2]}` : undefined)

                return (
                  <div
                    key={cardId}
                    className={`cursor-pointer group relative [content-visibility:auto] [overflow-anchor:none] w-full focus:outline-none opacity-100 translate-y-0 blur-0`}
                    onMouseEnter={() => { setHoveredCard(cardId); prefetchMedia(kind, media.url) }}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedImageIndex(0)
                      setSelectedVideoIndex(0)
                      setSelectedAudioIndex(0)
                      // Normalize the URL before setting preview to ensure it uses proxy endpoint
                      const normalizedUrl = normalizeMediaUrl(media.url) || normalizeMediaUrl(media.storagePath) || media.url
                      setPreview({ kind, url: normalizedUrl || media.url, item })
                    }}
                    ref={(el) => {
                      if (el) {
                        revealRefs.current[cardId] = el
                        tileRefs.current[cardId] = el
                      }
                    }}
                    style={{
                      transitionDelay: `${(idx % 12) * 35}ms`,
                      // REMOVED: aspectRatio style to allow natural height
                    }}
                    tabIndex={-1}
                  >
                    <div className="relative w-full bg-transparent group" style={{ contain: 'layout style paint' }}>
                      <div
                        className="relative w-full bg-gray-900/20 overflow-hidden flex items-center justify-center"
                      >
                        {kind !== 'audio' && (
                          <div
                            className={`absolute inset-0 z-0 bg-white/5 transition-opacity duration-500 ease-out pointer-events-none ${loadedTiles.has(cardId) ? 'opacity-0' : 'opacity-100'
                              }`}
                          />
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
                                  key={`video-${cardId}`}
                                  src={proxied}
                                  className="w-full h-auto object-contain"
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
                                      // Hide video tile on error if fallback also fails
                                      setFailedTiles(prev => {
                                        const next = new Set(prev)
                                        next.add(cardId)
                                        return next
                                      })
                                    }
                                  }}
                                />
                              )
                            })()
                          ) : kind === 'audio' ? (
                            <>
                              {/* Use a simple music logo image to avoid prompt alt text showing */}
                              <img
                                key={`audio-${cardId}`}
                                src="/icons/musicgenerationwhite.svg"
                                alt=""
                                loading={isPriority ? 'eager' : 'lazy'}
                                fetchPriority={isPriority ? 'high' : 'auto'}
                                className="w-full h-auto object-contain p-8 bg-gradient-to-br from-[#0B0F1A] to-[#111827] transition-transform duration-300 ease-out group-hover:scale-[1.01]"
                                onLoad={() => { markTileLoaded(cardId) }}
                                onError={() => {
                                  setFailedTiles(prev => {
                                    const next = new Set(prev)
                                    next.add(cardId)
                                    return next
                                  })
                                }}
                              />
                            </>
                          ) : (
                            <ImageWithFallback
                              key={`image-${cardId}`}
                              media={media}
                              alt={item.prompt || ''}
                              fill={false}
                              sizes={sizes}
                              blurDataURL={media.blurDataUrl}
                              className="w-full h-auto object-contain transition-transform duration-300 ease-out group-hover:scale-[1.01]"
                              priority={isPriority}
                              fetchPriority={isPriority ? 'high' : 'auto'}
                              useThumbnail={true}
                              onLoadingComplete={(img) => {
                                try {
                                  const el = img as unknown as HTMLImageElement
                                  if (el && el.naturalWidth && el.naturalHeight) noteMeasuredRatio(ratioKey, el.naturalWidth, el.naturalHeight)
                                } catch { }
                                markTileLoaded(cardId)
                              }}
                              onFailure={() => {
                                setFailedTiles(prev => {
                                  const next = new Set(prev)
                                  next.add(cardId)
                                  return next
                                })
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
                      {/* Dark gradient overlay from bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[5]" />

                      {/* Hover overlay: user profile + actions */}
                      <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[6]">
                        <div className="px-2.5 py-2.5 md:px-3 md:py-3">
                          <div className="rounded-lg px-3 py-2.5 md:px-4 md:py-3 flex items-center justify-between gap-3 pointer-events-auto">
                            {/* User Section */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
                              {(() => {
                                const cb = item.createdBy || ({} as any)
                                const photo = cb.photoURL || cb.photoUrl || cb.avatarUrl || cb.avatarURL || cb.profileImageUrl || ''
                                if (photo) {
                                  const proxied = `/api/proxy/external?url=${encodeURIComponent(photo)}`
                                  return (
                                    <div className="flex-shrink-0">
                                      <img
                                        src={proxied}
                                        alt={cb.username || cb.displayName || ''}
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border border-white/10"
                                      />
                                    </div>
                                  )
                                }
                                return (
                                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 flex items-center justify-center text-xs md:text-sm font-medium text-white/90 flex-shrink-0 border border-white/10">
                                    {(cb.username || cb.displayName || 'U').slice(0, 1).toUpperCase()}
                                  </div>
                                )
                              })()}
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm md:text-base font-medium truncate leading-tight">
                                  {item.createdBy?.username || item.createdBy?.displayName || 'User'}
                                </div>
                              </div>
                            </div>
                            {/* Actions Section */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleLike(item.id) }}
                                className={`p-2 rounded-lg transition-all duration-200 focus:outline-none flex-shrink-0 flex items-center justify-center bg-white/10 hover:bg-white/20 ${isLiked ? 'text-red-500' : 'text-white'}`}
                                aria-label={isLiked ? 'Unlike' : 'Like'}
                                title={isLiked ? 'Unlike' : 'Like'}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {engagementState.likesCount > 0 && (
                                  <span className="ml-1 text-xs font-medium">{engagementState.likesCount}</span>
                                )}
                              </button>
                              {/* Bookmark button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id) }}
                                className={`p-2 rounded-lg transition-all duration-200 focus:outline-none flex-shrink-0 flex items-center justify-center bg-white/10 hover:bg-white/20 ${engagementState.bookmarkedByMe ? 'text-blue-500' : 'text-white'}`}
                                aria-label={engagementState.bookmarkedByMe ? 'Unsave' : 'Save'}
                                title={engagementState.bookmarkedByMe ? 'Unsave' : 'Save'}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={engagementState.bookmarkedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                  <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                                {engagementState.bookmarksCount > 0 && (
                                  <span className="ml-1 text-xs font-medium">{engagementState.bookmarksCount}</span>
                                )}
                              </button>
                              {currentUid && item.createdBy?.uid === currentUid && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); confirmDelete(item) }}
                                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 flex-shrink-0 flex items-center justify-center focus:outline-none"
                                  aria-label="Delete"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 md:w-4.5 md:h-4.5 flex-shrink-0" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-white/20 pointer-events-none transition focus:outline-none z-[4]" />
                    </div>
                  </div>
                )
              }}
            />

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
          {preview && (
            <ArtStationPreview
              preview={preview}
              onClose={() => {
                setPreview(null)
                setSelectedImageIndex(0)
                setSelectedVideoIndex(0)
                setSelectedAudioIndex(0)
              }}
              onConfirmDelete={confirmDelete}
              currentUid={currentUid}
              currentUser={currentUser}
              cards={cards}
              toggleLike={toggleLike}
              toggleBookmark={toggleBookmark}
              engagement={engagement}
              onNavigate={handleNavigate}
              selectedIndex={
                preview.kind === 'image' ? selectedImageIndex :
                preview.kind === 'video' ? selectedVideoIndex :
                selectedAudioIndex
              }
            />
          )}
        </div>
      </div>

    </div>
  )
}


