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
  'Logo',
  'Stickers',
  'Products',
]

const Recentcreation: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [active, setActive] = useState<CreationItem['category']>('All')
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
  
  // Check if there are existing generations for the current category
  const checkForExistingGenerations = (category: string, entries: HistoryEntry[]): boolean => {
    if (category === 'All') {
      return entries.length > 0
    }
    
    const getGenerationTypeForCategory = (cat: string): string | undefined => {
      switch (cat) {
        case 'Images':
          return 'text-to-image'
        case 'Videos':
          return 'text-to-video'
        case 'Music':
          return 'text-to-music'
        case 'Logo':
          return 'logo'
        case 'Stickers':
          return 'sticker-generation'
        case 'Products':
          return 'product-generation'
        default:
          return undefined
      }
    }
    
    const generationType = getGenerationTypeForCategory(category)
    
    if (generationType) {
      return entries.some(entry => entry.generationType === generationType)
    }
    
    return false
  }

  // Fetch recent creations for the active category
  useEffect(() => {
    console.log('Recentcreation useEffect triggered:', { 
      isHistoryLoading, 
      historyEntriesLength: historyEntries.length, 
      activeCategory: active 
    })
    
    // Skip if history is already loading
    if (isHistoryLoading) {
      console.log('Skipping fetch - already loading')
      return
    }

    // Map category to generation type
    const getGenerationTypeForCategory = (category: string): string | undefined => {
      switch (category) {
        case 'Images':
          return 'text-to-image' // Fetch text-to-image for Images category
        case 'Videos':
          return 'text-to-video'
        case 'Music':
          return 'text-to-music'
        case 'Logo':
          return 'logo'
        case 'Stickers':
          return 'sticker-generation'
        case 'Products':
          return 'product-generation'
        default:
          return undefined // Fetch all for 'All' category
      }
    }

    const generationType = getGenerationTypeForCategory(active)
    console.log('Fetching for category:', active, 'generationType:', generationType)

    const fetchRecentCreations = async () => {
      console.log('Starting to fetch recent creations for category:', active)
      
      // Check if we have existing generations for this category
      const hasExistingGenerations = checkForExistingGenerations(active, historyEntries)
      console.log('Has existing generations for', active, ':', hasExistingGenerations)
      
      // For "All" category, use existing generations if available (like other categories)
      // For other categories, use existing generations if available
      if (active === 'All' && hasExistingGenerations && historyEntries.length > 0) {
        console.log('Using existing generations for All category')
        setHasCheckedForGenerations(true)
        setIsInitialLoad(false)
        return
      } else if (hasExistingGenerations && historyEntries.length > 0) {
        console.log('Using existing generations for', active)
        setHasCheckedForGenerations(true)
        setIsInitialLoad(false)
        return
      } else {
        // Only show loading if we don't have existing generations
        setLoading(true)
        setIsInitialLoad(false)
        setHasCheckedForGenerations(false)
      }
      
      // Set a minimum loading time to prevent flash of "No generations found"
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500)) // 500ms minimum
      
      try {
        const filters: any = { sortOrder: 'desc' }
        
        // Handle special cases for categories
        if (active === 'All') {
          // For "All" category, fetch only 5 recent generations across all types
          filters.generationType = undefined // Fetch all types but limit to 5
         } else if (active === 'Images') {
          // For Images category, we need to fetch multiple types
          // We'll fetch all and filter on frontend since backend might not support multiple types
          filters.generationType = undefined // Fetch all
        } else if (generationType) {
          filters.generationType = generationType
        }
        
        // Wait for both the API call and minimum loading time
        const [result] = await Promise.all([
          dispatch(loadHistory({ 
            filters, 
            paginationParams: { 
              limit: active === 'All' ? 5 : 12 // Only fetch 5 for "All" category to reduce load
            }
          })),
          minLoadingTime
        ])
        
        console.log('LoadHistory result for', active, ':', result)
        
        // Check if the action was aborted
        if (loadHistory.fulfilled.match(result)) {
          console.log('History fetch successful for', active, ':', result.payload)
        } else if (loadHistory.rejected.match(result)) {
          // Handle rejection (including condition aborts)
          if (result.error.message?.includes('condition callback returning false')) {
            // This is expected - another request is already in progress
            console.log('History fetch aborted - another request in progress')
          } else {
            console.error('Failed to fetch recent creations for', active, ':', result.error)
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent creations for', active, ':', error)
      } finally {
        setLoading(false)
        setHasCheckedForGenerations(true)
      }
    }
    
    fetchRecentCreations()
  }, [dispatch, isHistoryLoading, active])

  // Convert history entries to creation items
  const creationItems: CreationItem[] = useMemo(() => {
    console.log('Processing history entries:', historyEntries.length, historyEntries)
    const items: CreationItem[] = []
    
    historyEntries.forEach((entry: HistoryEntry) => {
      console.log('Processing entry:', entry.id, entry.generationType, entry.images?.length, entry.videos?.length)
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
          items.push({
            id: `${entry.id}-image-${index}`,
            src: image.url || image.firebaseUrl || '',
            title: entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt,
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
            title: entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt,
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
        // For music, get the audio URL from images field (where it's stored)
        const audioUrl = entry.images && entry.images.length > 0 
          ? (entry.images[0].url || entry.images[0].firebaseUrl || '')
          : ''
        
        items.push({
          id: `${entry.id}-music`,
          src: audioUrl, // Use the actual audio URL
          title: entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt,
          date: new Date(entry.timestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          category: 'Music',
          entry,
          isMusic: true // Add flag to identify music items
        })
      }

      // Process logos (if they have images)
      if (entry.generationType === 'logo' && entry.images && entry.images.length > 0) {
        entry.images.forEach((image, index) => {
          items.push({
            id: `${entry.id}-logo-${index}`,
            src: image.url || image.firebaseUrl || '',
            title: entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt,
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
          items.push({
            id: `${entry.id}-sticker-${index}`,
            src: image.url || image.firebaseUrl || '',
            title: entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt,
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
          items.push({
            id: `${entry.id}-product-${index}`,
            src: image.url || image.firebaseUrl || '',
            title: entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt,
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
    const result = items
      .sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime())
      .slice(0, 5)
    
    console.log('Final creation items:', result.length, result)
    return result
  }, [historyEntries])

  const filtered = useMemo(() => {
    const result = active === 'All' ? creationItems : creationItems.filter((i) => i.category === active)
    console.log('Filtered items:', result.length, 'for category:', active)
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
      
      console.log('Music click debug:', {
        entry: entry.generationType,
        itemSrc: item.src,
        audioUrl,
        images: entry.images,
        isAudio: audio,
        isMusic: item.isMusic
      })
      
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

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 mt-32">
      {/* Heading */}
      <h3 className="text-white text-4xl md:text-4xl font-medium mb-4">Recent Creations</h3>

      {/* Filters + My creations aligned */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
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
                  `px-4 py-2 rounded-full text-sm transition ` +
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
        <button 
          onClick={handleMyCreationsClick}
          className="text-white/80 hover:text-white text-sm ml-4 mr-4 transition-colors"
        >
          My Creations <span className="opacity-70"></span>
        </button>
      </div>

      {/* Cards grid */}
      {loading || isInitialLoad || !hasCheckedForGenerations ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 animate-pulse">
              <div className="h-[250px] bg-white/10 rounded-xl mb-3"></div>
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            ) : active === 'Videos' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : active === 'Music' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            ) : active === 'Logo' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            ) : active === 'Stickers' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            ) : active === 'Products' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
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
              : active === 'Logo'
              ? "Design professional logos with AI. Generate brand identities, business logos, and creative designs for your projects."
              : active === 'Stickers'
              ? "Create fun and expressive stickers with AI. Generate custom stickers for messaging apps, social media, or personal use."
              : active === 'Products'
              ? "Generate product images and mockups with AI. Create professional product photos, lifestyle shots, and marketing materials."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="rounded-2xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 transition p-4 flex flex-col gap-3 cursor-pointer"
            >
              <div className="relative h-[250px] rounded-xl overflow-hidden">
                {item.isVideo ? (
                  item.src && item.src.trim() !== '' ? (
                    <video
                      src={item.src}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
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
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
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
                          <path d="M9 18V5l12-2v13"/>
                          <circle cx="6" cy="18" r="3"/>
                          <circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                      <div className="text-white/80 text-sm font-medium">Music Track</div>
                      <div className="text-white/60 text-xs mt-1">Click to play</div>
                    </div>
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : item.src && item.src.trim() !== '' ? (
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className="object-cover"
                    onLoadingComplete={(img) => {
                      const w = img.naturalWidth || 1
                      const h = img.naturalHeight || 1
                      const g = gcd(w, h)
                      const rw = Math.round(w / g)
                      const rh = Math.round(h / g)
                      setRatios((prev) => ({ ...prev, [item.id]: `${rw}:${rh}` }))
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 text-white/60">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </div>
                      <div className="text-white/80 text-sm font-medium">No Preview</div>
                      <div className="text-white/60 text-xs mt-1">Click to view</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Title and aspect ratio in one row */}
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-white text-sm truncate">{item.title}</div>
                <div className="text-white/70 text-sm flex-shrink-0">{ratios[item.id] ?? ''}</div>
              </div>
              <div className="text-white/60 text-xs">{item.date}</div>
            </article>
          ))}
        </div>
      )}

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
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <CustomAudioPlayer
              audioUrl={audioPreview.audioUrl}
              prompt={audioPreview.entry.prompt}
              model={audioPreview.entry.model}
              lyrics={audioPreview.entry.prompt}
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
