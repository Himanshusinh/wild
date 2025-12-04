import React, { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getImageUrl } from '../routes'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { loadHistory } from '@/store/slices/historySlice'
import { HistoryEntry } from '@/types/history'
import ImagePreviewModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ImagePreviewModal'
import VideoPreviewModal from '@/app/view/Generation/VideoGeneration/TextToVideo/compo/VideoPreviewModal'
import CustomAudioPlayer from '@/app/view/Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import StickerImagePreview from '@/app/view/Generation/ImageGeneration/StickerGeneration/compo/StickerImagePreview'
import LogoImagePreview from '@/app/view/Generation/ImageGeneration/LogoGeneration/compo/LogoImagePreview'
import ProductImagePreview from '@/app/view/Generation/ProductGeneration/compo/ProductImagePreview'
import { toMediaProxy, toThumbUrl, toDirectUrl } from '@/lib/thumb'
import SmartImage from '@/components/media/SmartImage'
import { isUserAuthenticated } from '@/lib/axiosInstance'

// Types for items and categories
type CreationItem = {
  id: string
  src: string
  title: string
  date: string
  category: 'All' | 'Images' | 'Videos' | 'Music' | 'Logo' | 'Stickers' | 'Products'
  entry: HistoryEntry
  isVideo?: boolean // Flag to identify video items
  isMusic?: boolean // Flag to identify music items
}

const CATEGORIES: Array<CreationItem['category']> = [
  'All',
  'Images',
  'Videos',
  // 'Music', // Commented out for now
  // 'Logo',
  // 'Stickers',
  // 'Products',
]

// Helper function to normalize image URLs
const normalizeImageUrl = (image: any): string => {
  if (!image) return '';

  // Priority 1: Use storagePath if available (most reliable)
  if (image.storagePath) {
    const directUrl = toDirectUrl(image.storagePath);
    if (directUrl) return directUrl;
  }

  // Priority 2: Use url or firebaseUrl (prefer regular url over avifUrl for display)
  // Prefer non-AVIF URLs for main display, but fallback to AVIF if that's all we have
  let url = image.url || image.firebaseUrl || image.originalUrl || '';

  // If the url is an AVIF URL, try to find a non-AVIF alternative
  if (url && (url.includes('.avif') || url.includes('_optimized') || url.includes('_thumb'))) {
    // Try to find a non-AVIF URL first
    if (image.originalUrl && !image.originalUrl.includes('.avif') && !image.originalUrl.includes('_optimized') && !image.originalUrl.includes('_thumb')) {
      url = image.originalUrl;
    } else if (image.firebaseUrl && !image.firebaseUrl.includes('.avif') && !image.firebaseUrl.includes('_optimized') && !image.firebaseUrl.includes('_thumb')) {
      url = image.firebaseUrl;
    } else {
      // If we only have AVIF URLs, try to construct the base URL
      // Remove AVIF-specific suffixes
      url = url.replace(/_optimized\.avif$/, '').replace(/_thumb\.avif$/, '').replace(/\.avif$/, '');
      // If we still have an AVIF URL, keep it as fallback
      if (!url || url.includes('.avif')) {
        url = image.url || image.firebaseUrl || image.originalUrl || '';
      }
    }
  }

  // If still no url, try avifUrl or thumbnailUrl as last resort (better than nothing)
  if (!url || url.trim() === '') {
    url = image.avifUrl || image.thumbnailUrl || '';
  }

  if (!url || url.trim() === '') return '';

  // If it's already a full URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a storage path, convert to direct URL
  if (url.startsWith('users/')) {
    const directUrl = toDirectUrl(url);
    if (directUrl) return directUrl;
  }

  return url;
}

const Recentcreation: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [active, setActive] = useState<CreationItem['category']>('All')
  const [gridSize, setGridSize] = useState<'large' | 'medium' | 'small'>('large')
  const [ratios, setRatios] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hasCheckedForGenerations, setHasCheckedForGenerations] = useState(false)

  // Preview modal states
  const [preview, setPreview] = useState<{ entry: HistoryEntry; image: any } | null>(null)
  const [videoPreview, setVideoPreview] = useState<{ entry: HistoryEntry; video: any } | null>(null)
  const [audioPreview, setAudioPreview] = useState<{ entry: HistoryEntry; audioUrl: string } | null>(null)
  const [logoPreviewEntry, setLogoPreviewEntry] = useState<HistoryEntry | null>(null)
  const [stickerPreviewEntry, setStickerPreviewEntry] = useState<HistoryEntry | null>(null)
  const [productPreviewEntry, setProductPreviewEntry] = useState<HistoryEntry | null>(null)

  // Get history entries from Redux store
  const historyEntries = useAppSelector((state: any) => state.history?.entries || [])
  const isHistoryLoading = useAppSelector((state: any) => state.history?.loading || false)
  const hasRetriedRef = React.useRef(false)
  const fetchInFlightRef = React.useRef(false)

  // Reset retry guard on category change
  useEffect(() => { hasRetriedRef.current = false }, [active])

  // Check if there are existing generations for the current category
  // We no longer reuse existing results on tab switch; always fetch fresh for each category
  const checkForExistingGenerations = () => false

  // Fetch recent creations for the active category
  useEffect(() => {

    // Local guard to prevent duplicate calls (StrictMode double-mount or quick re-renders)
    if (fetchInFlightRef.current) {
      return
    }

    // Map category to request filters
    const computeFiltersForCategory = (category: string): { generationType?: string; mode?: string } => {
      switch (category) {
        case 'Images':
          return { generationType: 'text-to-image' }
        case 'Videos':
          return { mode: 'video' } // groups t2v, i2v, v2v on backend
        case 'Logo':
          return { generationType: 'logo' }
        case 'Stickers':
          return { generationType: 'sticker-generation' }
        case 'Products':
          return { generationType: 'product-generation' }
        default:
          return {}
      }
    }
    const baseFilters = computeFiltersForCategory(active)


    const fetchRecentCreations = async () => {
      fetchInFlightRef.current = true

      // Always fetch on category change
      setLoading(true)
      setIsInitialLoad(false)
      setHasCheckedForGenerations(false)

      // Set a minimum loading time to prevent flash of "No generations found"
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200))

      try {
        const filters: any = { sortOrder: 'desc', status: 'completed', ...baseFilters }

        // Wait for both the API call and minimum loading time
        const cols = gridSize === 'small' ? 10 : gridSize === 'medium' ? 8 : 6
        const [result] = await Promise.all([
          dispatch(loadHistory({
            filters,
            paginationParams: {
              limit: active === 'All' ? cols : 12
            },
            debugTag: `recent:${active}:${Date.now()}`
          })),
          minLoadingTime
        ])

        // Check if the action was aborted
        if (loadHistory.fulfilled.match(result)) {
          // If we got zero items (likely due to auth race) and we haven't retried, retry once
          const items = (result as any)?.payload?.entries || []
          if (!hasRetriedRef.current && Array.isArray(items) && items.length === 0) {
            try {
              const authed = isUserAuthenticated()
              if (authed) {
                hasRetriedRef.current = true
                setTimeout(async () => {
                  dispatch(loadHistory({
                    filters,
                    paginationParams: { limit: active === 'All' ? cols : 12 },
                    debugTag: `recent:${active}:retry:${Date.now()}`
                  }))
                }, 800)
              }
            } catch { }
          }
        } else if (loadHistory.rejected.match(result)) {
          // Handle rejection (including condition aborts)
          if (result.error.message?.includes('condition callback returning false')) {
            // This is expected - another request is already in progress
          } else {

            // Retry once after a brief delay if user is authenticated (handles early 401)
            try {
              const authed = isUserAuthenticated()
              if (authed && !hasRetriedRef.current) {
                hasRetriedRef.current = true
                setTimeout(async () => {
                  dispatch(loadHistory({
                    filters,
                    paginationParams: { limit: active === 'All' ? cols : 12 },
                    debugTag: `recent:${active}:retry:${Date.now()}`
                  }))
                }, 800)
              }
            } catch { }
          }
        }
      } catch (error) {

      } finally {
        setLoading(false)
        setHasCheckedForGenerations(true)
        fetchInFlightRef.current = false
      }
    }

    fetchRecentCreations()
  }, [dispatch, active, gridSize])

  // Convert history entries to creation items
  const creationItems: CreationItem[] = useMemo(() => {
    const items: CreationItem[] = []

    historyEntries.forEach((entry: HistoryEntry) => {

      // Map generation type to category
      const getCategory = (type: string): CreationItem['category'] => {
        switch (type) {
          case 'text-to-image':
          case 'ad-generation':
          case 'mockup-generation':
            return 'Images'
          case 'text-to-video':
          case 'image-to-video':
          case 'video-to-video':
            return 'Videos'
          case 'text-to-music':
            return 'Music'
          case 'logo':
            return 'Logo'
          case 'sticker-generation':
            return 'Stickers'
          case 'product-generation':
            return 'Products'
          default:
            return 'Images'
        }
      }

      // Process images (for text-to-image, ad-generation, mockup-generation, etc.)
      if (entry.images && entry.images.length > 0 &&
        !['logo', 'sticker-generation', 'product-generation'].includes(entry.generationType)) {
        entry.images.forEach((image, index) => {
          const normalizedUrl = normalizeImageUrl(image);
          if (!normalizedUrl) return; // Skip if no valid URL
          items.push({
            id: `${entry.id}-image-${index}`,
            src: normalizedUrl,
            title: (entry.prompt || '').length > 50 ? (entry.prompt || '').substring(0, 50) + '...' : (entry.prompt || ''),
            date: new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            category: getCategory(entry.generationType),
            entry
          })
        })
      }

      // Process videos (for text-to-video, image-to-video, etc.)
      if (entry.videos && entry.videos.length > 0) {
        entry.videos.forEach((video, index) => {
          items.push({
            id: `${entry.id}-video-${index}`,
            src: video.url || video.firebaseUrl || '',
            title: (entry.prompt || '').length > 50 ? (entry.prompt || '').substring(0, 50) + '...' : (entry.prompt || ''),
            date: new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            category: 'Videos',
            entry,
            isVideo: true // Add flag to identify videos
          })
        })
      }

      // Process music (text-to-music entries)
      if (entry.generationType === 'text-to-music') {
        // Prefer audios[] from backend; fallback to images[0] if older format
        const audioFromAudios = (entry as any)?.audios && (entry as any).audios.length > 0
          ? ((entry as any).audios[0].url || (entry as any).audios[0].firebaseUrl || '')
          : ''
        const audioFromImages = entry.images && entry.images.length > 0
          ? (entry.images[0].url || entry.images[0].firebaseUrl || '')
          : ''
        const audioUrl = audioFromAudios || audioFromImages

        if (audioUrl) {
          items.push({
            id: `${entry.id}-music`,
            src: audioUrl,
            title: (entry.prompt || '').length > 50 ? (entry.prompt || '').substring(0, 50) + '...' : (entry.prompt || ''),
            date: new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            category: 'Music',
            entry,
            isMusic: true
          })
        }
      }

      // Do not add placeholders; Recent Creations should show completed items with media only

      // Process logos (if they have images)
      if (entry.generationType === 'logo' && entry.images && entry.images.length > 0) {
        entry.images.forEach((image, index) => {
          const normalizedUrl = normalizeImageUrl(image);
          if (!normalizedUrl) return; // Skip if no valid URL
          items.push({
            id: `${entry.id}-logo-${index}`,
            src: normalizedUrl,
            title: (entry.prompt || '').length > 50 ? (entry.prompt || '').substring(0, 50) + '...' : (entry.prompt || ''),
            date: new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            category: 'Logo',
            entry
          })
        })
      }

      // Process stickers (if they have images)
      if (entry.generationType === 'sticker-generation' && entry.images && entry.images.length > 0) {
        entry.images.forEach((image, index) => {
          const normalizedUrl = normalizeImageUrl(image);
          if (!normalizedUrl) return; // Skip if no valid URL
          items.push({
            id: `${entry.id}-sticker-${index}`,
            src: normalizedUrl,
            title: (entry.prompt || '').length > 50 ? (entry.prompt || '').substring(0, 50) + '...' : (entry.prompt || ''),
            date: new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            category: 'Stickers',
            entry
          })
        })
      }

      // Process products (if they have images)
      if (entry.generationType === 'product-generation' && entry.images && entry.images.length > 0) {
        entry.images.forEach((image, index) => {
          const normalizedUrl = normalizeImageUrl(image);
          if (!normalizedUrl) return; // Skip if no valid URL
          items.push({
            id: `${entry.id}-product-${index}`,
            src: normalizedUrl,
            title: (entry.prompt || '').length > 50 ? (entry.prompt || '').substring(0, 50) + '...' : (entry.prompt || ''),
            date: new Date(entry.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            category: 'Products',
            entry
          })
        })
      }
    })

    // Sort by date (most recent first) and limit to 5 items
    const colsLocal = gridSize === 'small' ? 10 : gridSize === 'medium' ? 8 : 6
    const result = items
      .sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime())
      .slice(0, colsLocal)

    return result
  }, [historyEntries, gridSize])

  const filtered = useMemo(() => {
    const result = active === 'All' ? creationItems : creationItems.filter((i) => i.category === active)
    // Removed console.log for production performance
    return result
  }, [active, creationItems])

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

  const handleMyCreationsClick = () => {
    router.push('/history')
  }

  // Helper functions to detect media types (copied from History.tsx)
  const isVideoUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|$)/i.test(url);
  };

  const isAudioUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('data:audio') || /\.(mp3|wav|m4a|ogg|aac|flac)(\?|$)/i.test(url);
  };

  const handleItemClick = (item: CreationItem) => {
    const { entry } = item

    // Check if this is a video, audio, or image based on the URL
    const mediaUrl = item.src;
    const video = isVideoUrl(mediaUrl);
    const audio = isAudioUrl(mediaUrl);

    if (video) {
      // Video preview
      const videoItem = entry.videos?.find(v => v.url === item.src || v.firebaseUrl === item.src)
      if (videoItem) {
        setVideoPreview({ entry, video: videoItem })
      }
    } else if (audio || entry.generationType === 'text-to-music') {
      // Audio preview - use the audio URL
      const audioUrl = item.src || (entry.images && entry.images.length > 0
        ? (entry.images[0].url || entry.images[0].firebaseUrl || '')
        : '')

      // Removed console.log for production performance

      setAudioPreview({ entry, audioUrl })
    } else if (entry.generationType === 'logo') {
      // Logo preview
      setLogoPreviewEntry(entry)
    } else if (entry.generationType === 'sticker-generation') {
      // Sticker preview
      setStickerPreviewEntry(entry)
    } else if (entry.generationType === 'product-generation') {
      // Product preview
      setProductPreviewEntry(entry)
    } else {
      // Default image preview (text-to-image, ad-generation, etc.)
      const image = entry.images.find(img => img.url === item.src || img.firebaseUrl === item.src)
      if (image) {
        setPreview({ entry, image })
      }
    }
  }

  const cols = gridSize === 'small' ? 10 : gridSize === 'medium' ? 8 : 6
  // Mobile heights (1:1 aspect ratio - square) and desktop heights (1:1 aspect ratio - square)
  const cardHeightMobile = gridSize === 'small' ? 80 : gridSize === 'medium' ? 100 : 140
  const cardHeightDesktop = gridSize === 'small' ? 170 : gridSize === 'medium' ? 220 : 320

  const gridColsClass = (base: string) => {
    // Mobile-specific grid columns
    // Small: 5 columns (5 per row, 10 items = 2 rows)
    // Medium: 4 columns (4 per row, 8 items = 2 rows)
    // Large: 3 columns (3 per row, 6 items = 2 rows)
    const mobile = gridSize === 'small' ? 'grid-cols-5' : gridSize === 'medium' ? 'grid-cols-4' : 'grid-cols-3'
    // Desktop grid columns (xl breakpoint)
    const xl = gridSize === 'small' ? 'xl:grid-cols-10' : gridSize === 'medium' ? 'xl:grid-cols-8' : 'xl:grid-cols-6'
    // Remove grid-cols-1 from base and use mobile class, keep sm/md/lg for intermediate breakpoints
    const baseWithoutMobile = base.replace('grid-cols-1', '').trim()
    return `grid ${mobile} ${baseWithoutMobile} ${xl}`.trim()
  }

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 mt-6 md:mt-32">
      {/* Heading */}
      <h3 className="text-white text-xl md:text-4xl font-medium md:mb-4 mb-2">Recent Creations</h3>

      {/* Filters + My creations aligned */}
      <div className="flex items-center justify-between md:mb-6 mb-2">
        <div className="flex items-center md:gap-2 gap-1 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = cat === active
            return (
              <button
                key={cat}
                onClick={() => {
                  if (cat === active) return // Don't switch if already active
                  setActive(cat)
                  setHasCheckedForGenerations(false) // Reset checked state when switching
                }}
                className={
                  `md:px-4 px-2 md:py-2 py-1 rounded-lg md:text-sm text-xs transition ` +
                  (isActive
                    ? 'bg-white text-[#0b0f17]'
                    : 'bg-white/10 text-white/80 hover:bg-white/15')
                }
              >
                {cat}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 bg-white/5 rounded-full md:px-2 px-1 md:py-1 py-0.5 ring-1 ring-white/10">
            <button
              aria-label="Small thumbnails"
              onClick={() => setGridSize('small')}
              className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${gridSize === 'small' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
            >
              <span className="block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-current"></span>
            </button>
            <button
              aria-label="Medium thumbnails"
              onClick={() => setGridSize('medium')}
              className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center ${gridSize === 'medium' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
            >
              <span className="block w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-current"></span>
            </button>
            <button
              aria-label="Large thumbnails"
              onClick={() => setGridSize('large')}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center ${gridSize === 'large' ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
            >
              <span className="block w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-current"></span>
            </button>
          </div>

        </div>
      </div>

      {/* Cards grid */}
      {loading || isInitialLoad || !hasCheckedForGenerations ? (
        <div className={gridColsClass('sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-2 gap-1')}>
          {[...Array(cols)].map((_, i) => (
            <div key={i} className="rounded-lg bg-white/5 ring-1 ring-white/10 p-0.5 animate-pulse">
              <div className="bg-white/10 rounded-xl mb-0 md:hidden" style={{ height: cardHeightMobile }}></div>
              <div className="bg-white/10 rounded-xl mb-0 hidden md:block" style={{ height: cardHeightDesktop }}></div>
              {/* <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div> */}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && hasCheckedForGenerations && !loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-white/20">
            {active === 'All' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : active === 'Images' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            ) : active === 'Videos' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            ) : active === 'Music' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            ) : active === 'Logo' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            ) : active === 'Stickers' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            ) : active === 'Products' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-2">
            {active === 'All'
              ? "No recent creations"
              : `No ${active.toLowerCase()} yet`
            }
          </h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            {active === 'All'
              ? "Start creating amazing content to see your recent generations here. Generate images, videos, music, logos, stickers, and more!"
              : active === 'Images'
                ? "Create stunning images with AI. Try text-to-image generation, edit existing photos, or generate product mockups."
                : active === 'Videos'
                  ? "Bring your ideas to life with AI video generation. Create videos from text prompts or transform images into videos."
                  : active === 'Music'
                    ? "Generate unique music tracks with AI. Create background music, sound effects, or full compositions from text descriptions."
                    : "Start creating to see your recent generations here."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {active === 'All' ? (
              <>
                <button
                  onClick={() => router.push('/text-to-image')}
                  className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
                >
                  Generate Images
                </button>
                <button
                  onClick={() => router.push('/text-to-video')}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Create Videos
                </button>
              </>
            ) : active === 'Images' ? (
              <button
                onClick={() => router.push('/text-to-image')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating Images
              </button>
            ) : active === 'Videos' ? (
              <button
                onClick={() => router.push('/text-to-video')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating Videos
              </button>
            ) : active === 'Music' ? (
              <button
                onClick={() => router.push('/text-to-music')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating Music
              </button>
            ) : active === 'Logo' ? (
              <button
                onClick={() => router.push('/logo-generation')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating Logos
              </button>
            ) : active === 'Stickers' ? (
              <button
                onClick={() => router.push('/sticker-generation')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating Stickers
              </button>
            ) : active === 'Products' ? (
              <button
                onClick={() => router.push('/product-generation')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating Products
              </button>
            ) : (
              <button
                onClick={() => router.push('/text-to-image')}
                className="px-6 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-full text-sm font-medium transition-colors"
              >
                Start Creating
              </button>
            )}
          </div>
        </div>
      ) : filtered.length === 0 && (loading || !hasCheckedForGenerations) ? (
        // Show loading when no items but still loading
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
            <div className="text-white text-lg">Loading generations...</div>
          </div>
        </div>
      ) : (
        <div className={gridColsClass('sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-2 gap-1')}>
          {filtered.map((item, index) => {

            return (
              <article
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`rounded-lg bg-white/5 ring-1 ring-white/10 hover:ring-white/20 transition p-0.5 flex flex-col gap-0 cursor-pointer`}
              >
                <div className="relative rounded-lg overflow-hidden">
                  {/* Mobile height */}
                  <div className="md:hidden" style={{ height: cardHeightMobile }}>
                    <div className="w-full h-full">
                      {item.isVideo ? (
                        item.src && item.src.trim() !== '' ? (
                          (() => {
                            const Z = process.env.NEXT_PUBLIC_ZATA_PREFIX || ''
                            const proxied = item.src.startsWith(Z) ? toMediaProxy(item.src) : ''
                            const vsrc = proxied || item.src
                            return (
                              <video
                                src={vsrc}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                poster={toThumbUrl(item.src, { w: 640, q: 60, fmt: 'avif' }) || undefined}
                                onLoadedMetadata={(e) => {
                                  const video = e.target as HTMLVideoElement
                                  const w = video.videoWidth || 1
                                  const h = video.videoHeight || 1
                                  const g = gcd(w, h)
                                  const rw = Math.round(w / g)
                                  const rh = Math.round(h / g)
                                  setRatios((prev) => ({ ...prev, [item.id]: `${rw}:${rh}` }))
                                }}
                              />
                            );
                          })()
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                              </div>
                              <div className="text-white/80 text-sm font-medium">Video</div>
                              <div className="text-white/60 text-xs mt-1">No preview available</div>
                            </div>
                          </div>
                        )
                      ) : item.isMusic ? (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center relative">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                              </svg>
                            </div>
                            <div className="text-white/80 text-sm font-medium">Music Track</div>
                            <div className="text-white/60 text-xs mt-1">Click to play</div>
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : item.src && item.src.trim() !== '' ? (
                        (() => {
                          // Find the matching image object in the entry to get thumbnail/avif/blur metadata if present
                          // Match by comparing normalized URLs or original URLs
                          const imgObj: any = ((item.entry.images || []) as any).find((im: any) => {
                            const imUrl = normalizeImageUrl(im);
                            const imOriginalUrl = im.url || im.firebaseUrl || im.originalUrl || '';
                            const imAvifUrl = im.avifUrl || '';
                            const imStoragePath = im.storagePath ? toDirectUrl(im.storagePath) : '';
                            // Match by normalized URL, original URL, AVIF URL, or storage path
                            return imUrl === item.src ||
                              imOriginalUrl === item.src ||
                              imAvifUrl === item.src ||
                              imStoragePath === item.src ||
                              (im.storagePath && toDirectUrl(im.storagePath) === item.src) ||
                              // Also match if the base URL (without AVIF suffix) matches
                              (item.src && imOriginalUrl && item.src.replace(/\.(avif|jpg|jpeg|png)$/i, '') === imOriginalUrl.replace(/\.(avif|jpg|jpeg|png)$/i, ''));
                          }) || ({} as any);
                          const thumb: string | undefined = imgObj?.thumbnailUrl || toThumbUrl(item.src, { w: 480, q: 60 }) || undefined;
                          const avif: string | undefined = imgObj?.avifUrl || undefined;
                          const blur: string | undefined = imgObj?.blurDataUrl || undefined;
                          // Replace SmartImage with plain <img> to avoid AVIF compatibility issues on some devices
                          // Prefer thumbnailUrl, then avif, then original src
                          const displaySrc = thumb || avif || item.src;
                          return (
                            <div className="absolute inset-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={displaySrc}
                                alt={item.title || ''}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 w-full h-full object-cover"
                                // Optimize: Use fetchPriority for first few items
                                fetchPriority="auto"
                                onLoad={(e) => {
                                  try {
                                    const img = e.currentTarget as HTMLImageElement;
                                    const w = img.naturalWidth || 1;
                                    const h = img.naturalHeight || 1;
                                    const g = gcd(w, h);
                                    const rw = Math.round(w / g);
                                    const rh = Math.round(h / g);
                                    setRatios((prev) => ({ ...prev, [item.id]: `${rw}:${rh}` }));
                                  } catch { }
                                }}
                                onError={(e) => {
                                  // If thumbnail fails, fallback to original src
                                  const img = e.currentTarget as HTMLImageElement;
                                  if (displaySrc !== item.src) {
                                    img.src = item.src;
                                  }
                                }}
                              />
                            </div>
                          )
                        })()
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21,15 16,10 5,21" />
                              </svg>
                            </div>
                            <div className="text-white/80 text-sm font-medium">No Preview</div>
                            <div className="text-white/60 text-xs mt-1">Click to view</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Desktop height */}
                  <div className="hidden md:block" style={{ height: cardHeightDesktop }}>
                    <div className="w-full h-full">
                      {item.isVideo ? (
                        item.src && item.src.trim() !== '' ? (
                          (() => {
                            const Z = process.env.NEXT_PUBLIC_ZATA_PREFIX || ''
                            const proxied = item.src.startsWith(Z) ? toMediaProxy(item.src) : ''
                            const vsrc = proxied || item.src
                            return (
                              <video
                                src={vsrc}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                poster={toThumbUrl(item.src, { w: 640, q: 60, fmt: 'avif' }) || undefined}
                                onLoadedMetadata={(e) => {
                                  const video = e.target as HTMLVideoElement
                                  const w = video.videoWidth || 1
                                  const h = video.videoHeight || 1
                                  const g = gcd(w, h)
                                  const rw = Math.round(w / g)
                                  const rh = Math.round(h / g)
                                  setRatios((prev) => ({ ...prev, [item.id]: `${rw}:${rh}` }))
                                }}
                              />
                            );
                          })()
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                              </div>
                              <div className="text-white/80 text-sm font-medium">Video</div>
                              <div className="text-white/60 text-xs mt-1">No preview available</div>
                            </div>
                          </div>
                        )
                      ) : item.isMusic ? (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center relative">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                              </svg>
                            </div>
                            <div className="text-white/80 text-sm font-medium">Music Track</div>
                            <div className="text-white/60 text-xs mt-1">Click to play</div>
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : item.src && item.src.trim() !== '' ? (
                        (() => {
                          // Find the matching image object in the entry to get thumbnail/avif/blur metadata if present
                          // Match by comparing normalized URLs or original URLs
                          const imgObj: any = ((item.entry.images || []) as any).find((im: any) => {
                            const imUrl = normalizeImageUrl(im);
                            const imOriginalUrl = im.url || im.firebaseUrl || im.originalUrl || '';
                            const imAvifUrl = im.avifUrl || '';
                            const imStoragePath = im.storagePath ? toDirectUrl(im.storagePath) : '';
                            // Match by normalized URL, original URL, AVIF URL, or storage path
                            return imUrl === item.src ||
                              imOriginalUrl === item.src ||
                              imAvifUrl === item.src ||
                              imStoragePath === item.src ||
                              (im.storagePath && toDirectUrl(im.storagePath) === item.src) ||
                              // Also match if the base URL (without AVIF suffix) matches
                              (item.src && imOriginalUrl && item.src.replace(/\.(avif|jpg|jpeg|png)$/i, '') === imOriginalUrl.replace(/\.(avif|jpg|jpeg|png)$/i, ''));
                          }) || ({} as any);
                          const thumb: string | undefined = imgObj?.thumbnailUrl || toThumbUrl(item.src, { w: 480, q: 60 }) || undefined;
                          const avif: string | undefined = imgObj?.avifUrl || undefined;
                          const blur: string | undefined = imgObj?.blurDataUrl || undefined;
                          // Replace SmartImage with plain <img> to avoid AVIF compatibility issues on some devices
                          // Prefer thumbnailUrl, then avif, then original src
                          const displaySrc = thumb || avif || item.src;
                          return (
                            <div className="absolute inset-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={displaySrc}
                                alt={item.title || ''}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 w-full h-full object-cover"
                                // Optimize: Use fetchPriority for first few items
                                fetchPriority="auto"
                                onLoad={(e) => {
                                  try {
                                    const img = e.currentTarget as HTMLImageElement;
                                    const w = img.naturalWidth || 1;
                                    const h = img.naturalHeight || 1;
                                    const g = gcd(w, h);
                                    const rw = Math.round(w / g);
                                    const rh = Math.round(h / g);
                                    setRatios((prev) => ({ ...prev, [item.id]: `${rw}:${rh}` }));
                                  } catch { }
                                }}
                                onError={(e) => {
                                  // If thumbnail fails, fallback to original src
                                  const img = e.currentTarget as HTMLImageElement;
                                  if (displaySrc !== item.src) {
                                    img.src = item.src;
                                  }
                                }}
                              />
                            </div>
                          )
                        })()
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21,15 16,10 5,21" />
                              </svg>
                            </div>
                            <div className="text-white/80 text-sm font-medium">No Preview</div>
                            <div className="text-white/60 text-xs mt-1">Click to view</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title and aspect ratio in one row */}
                {/* <div className="flex items-baseline justify-between gap-1 p-0.5">
                <div className="text-white text-xs truncate">{item.title}</div>
                <div className="text-white/70 text-xs flex-shrink-0">{ratios[item.id] ?? ''}</div>
              </div>
              <div className="text-white/60 text-xs p-0.5">{item.date}</div> */}
              </article>
            )
          })}

        </div>

      )}
      <div className="flex items-center justify-between">

        <div></div>
        <div><button
          onClick={handleMyCreationsClick}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm ml-2 pt-4 mr-0 transition-colors"
        >
          <span>More Creations</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button></div>
      </div>


      {/* Preview Modals */}
      {preview && (
        <ImagePreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}

      {videoPreview && (
        <VideoPreviewModal
          preview={videoPreview}
          onClose={() => setVideoPreview(null)}
        />
      )}

      {audioPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full ring-1 ring-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Music Track</h3>
              <button
                onClick={() => setAudioPreview(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CustomAudioPlayer
              audioUrl={audioPreview.audioUrl}
              prompt={audioPreview.entry.prompt}
              model={audioPreview.entry.model}
              // HistoryEntry type doesn't carry lyrics yet; frontend only has prompt.
              // Pass prompt as a fallback, and let CustomAudioPlayer decide whether to
              // show a Lyrics box based on generationType.
              lyrics={audioPreview.entry.prompt}
              generationType={audioPreview.entry.generationType}
              autoPlay={true}
            />
            {/* Debug info */}
            <div className="mt-4 p-2 bg-black/50 rounded text-xs text-white/60">
              <div>Audio URL: {audioPreview.audioUrl ? 'Present' : 'Missing'}</div>
              <div>Prompt: {audioPreview.entry.prompt ? 'Present' : 'Missing'}</div>
              <div>Model: {audioPreview.entry.model || 'Unknown'}</div>
            </div>
          </div>
        </div>
      )}

      {logoPreviewEntry && (
        <LogoImagePreview
          isOpen={!!logoPreviewEntry}
          onClose={() => setLogoPreviewEntry(null)}
          entry={logoPreviewEntry}
        />
      )}

      {stickerPreviewEntry && (
        <StickerImagePreview
          isOpen={!!stickerPreviewEntry}
          onClose={() => setStickerPreviewEntry(null)}
          entry={stickerPreviewEntry}
        />
      )}

      {productPreviewEntry && (
        <ProductImagePreview
          isOpen={!!productPreviewEntry}
          onClose={() => setProductPreviewEntry(null)}
          entry={productPreviewEntry}
        />
      )}
    </section>
  )
}

export default Recentcreation
