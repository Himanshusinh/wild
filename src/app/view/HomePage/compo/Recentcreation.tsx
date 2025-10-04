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
}

const CATEGORIES: Array<CreationItem['category']> = [
  'All',
  'Images',
  'Videos',
  'Music',
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
  
  // Fetch recent creations on component mount
  useEffect(() => {
    // Skip if history is already loading or if we already have entries
    if (isHistoryLoading || historyEntries.length > 0) {
      return
    }

    const fetchRecentCreations = async () => {
      setLoading(true)
      try {
        const result = await dispatch(loadHistory({ 
          filters: { sortOrder: 'desc' } as any, 
          paginationParams: { limit: 10 } 
        }))
        
        // Check if the action was aborted
        if (loadHistory.fulfilled.match(result)) {
          // Success - data loaded
        } else if (loadHistory.rejected.match(result)) {
          // Handle rejection (including condition aborts)
          if (result.error.message?.includes('condition callback returning false')) {
            // This is expected - another request is already in progress
            console.log('History fetch aborted - another request in progress')
          } else {
            console.error('Failed to fetch recent creations:', result.error)
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent creations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecentCreations()
  }, [dispatch, isHistoryLoading, historyEntries.length])

  // Convert history entries to creation items
  const creationItems: CreationItem[] = useMemo(() => {
    const items: CreationItem[] = []
    
    historyEntries.forEach((entry: HistoryEntry) => {
      // Map generation type to category
      const getCategory = (type: string): CreationItem['category'] => {
        switch (type) {
          case 'text-to-image':
          case 'ad-generation':
            return 'Images'
          case 'text-to-video':
            return 'Videos'
          case 'text-to-music':
            return 'Music'
          case 'logo':
            return 'Logo'
          case 'sticker-generation':
            return 'Stickers'
          case 'product-generation':
            return 'Products'
          case 'mockup-generation':
            return 'Images' // Mockup generation falls under Images
          default:
            return 'Images'
        }
      }

      // Process images
      if (entry.images && entry.images.length > 0) {
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

      // Process videos
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
            entry
          })
        })
      }
    })

    // Sort by date (most recent first) and limit to 5 items
    return items
      .sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime())
      .slice(0, 5)
  }, [historyEntries])

  const filtered = useMemo(() => {
    if (active === 'All') return creationItems
    return creationItems.filter((i) => i.category === active)
  }, [active, creationItems])

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

  const handleMyCreationsClick = () => {
    router.push('/history')
  }

  const handleItemClick = (item: CreationItem) => {
    const { entry } = item
    
    // Determine which preview modal to open based on generation type and content
    if (entry.generationType === 'text-to-video' && entry.videos && entry.videos.length > 0) {
      // Video preview
      const video = entry.videos.find(v => v.url === item.src || v.firebaseUrl === item.src)
      if (video) {
        setVideoPreview({ entry, video })
      }
    } else if (entry.generationType === 'text-to-music') {
      // Audio preview - find the audio file
      const audioUrl = item.src // For music, the src should be the audio URL
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
                onClick={() => setActive(cat)}
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
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 animate-pulse">
              <div className="h-[250px] bg-white/10 rounded-xl mb-3"></div>
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-white/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-2">No recent creations</h3>
          <p className="text-white/50 mb-4">
            {active === 'All' 
              ? "Start creating to see your recent generations here."
              : `No ${active.toLowerCase()} found. Try a different category or create some new content.`
            }
          </p>
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
        <CustomAudioPlayer
          audioUrl={audioPreview.audioUrl}
          prompt={audioPreview.entry.prompt}
          model={audioPreview.entry.model}
        />
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
