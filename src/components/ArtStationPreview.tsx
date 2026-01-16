'use client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import CustomAudioPlayer from '@/app/view/Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import RemoveBgPopup from '@/app/view/Generation/ImageGeneration/TextToImage/compo/RemoveBgPopup'
import { Trash2 } from 'lucide-react'
import { toDirectUrl, toMediaProxy } from '@/lib/thumb'
import { downloadFileWithNaming } from '@/utils/downloadUtils'
import { getModelDisplayName } from '@/utils/modelDisplayNames'
import { useRouter } from 'next/navigation'

export type PublicItem = {
  id: string;
  aestheticScore?: number;
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
  createdBy?: { uid?: string; username?: string; displayName?: string; photoURL?: string };
  images?: {
    aestheticScore?: number;
    id: string;
    url: string;
    originalUrl?: string;
    storagePath?: string;
    webpUrl?: string;
    thumbnailUrl?: string;
    blurDataUrl?: string;
    optimized?: boolean;
    avifUrl?: string;
  }[];
  videos?: { id: string; url: string; originalUrl?: string; storagePath?: string; thumbnailUrl?: string; avifUrl?: string }[];
  audios?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
}

export type PreviewState = { kind: 'image' | 'video' | 'audio'; url: string; item: PublicItem } | null

type CardEntry = { item: PublicItem; media: any; kind: 'image' | 'video' | 'audio' }

type EngagementState = {
  likesCount: number
  bookmarksCount: number
  likedByMe: boolean
  bookmarkedByMe: boolean
}

type Props = {
  preview: PreviewState
  onClose: () => void
  onConfirmDelete: (item: PublicItem, imageId?: string) => void | Promise<void>
  currentUid: string | null
  currentUser: { uid?: string; username?: string; displayName?: string; photoURL?: string } | null
  cards: CardEntry[]
  likedCards?: Set<string>
  toggleLike: (generationId: string) => void
  toggleBookmark?: (generationId: string) => void
  engagement?: Record<string, EngagementState>
  // NEW: Callback for cross-item navigation
  onNavigate?: (preview: PublicItem | any, mediaIndex: number) => void
  selectedIndex?: number // Added prop to control index from parent
}

export default function ArtStationPreview({
  preview,
  onClose,
  onConfirmDelete,
  currentUid,
  currentUser,
  cards,
  toggleLike,
  toggleBookmark,
  engagement,
  onNavigate,
  selectedIndex = 0
}: Props) {
  const router = useRouter()
  // Local state for tracking current media index within the current item
  const [selectedImageIndex, setSelectedImageIndex] = useState(selectedIndex)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(selectedIndex)
  const [selectedAudioIndex, setSelectedAudioIndex] = useState(selectedIndex)

  // Sync with parent selectedIndex prop changes
  useEffect(() => {
    if (preview?.kind === 'image') setSelectedImageIndex(selectedIndex)
    else if (preview?.kind === 'video') setSelectedVideoIndex(selectedIndex)
    else if (preview?.kind === 'audio') setSelectedAudioIndex(selectedIndex)
  }, [selectedIndex, preview?.kind])

  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null)
  const [showRemoveBg, setShowRemoveBg] = useState(false)
  const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/')

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fsScale, setFsScale] = useState(1)
  const [fsFitScale, setFsFitScale] = useState(1)
  const [fsOffset, setFsOffset] = useState({ x: 0, y: 0 })
  const [fsIsPanning, setFsIsPanning] = useState(false)
  const [fsLastPoint, setFsLastPoint] = useState({ x: 0, y: 0 })
  const [fsNaturalSize, setFsNaturalSize] = useState({ width: 0, height: 0 })
  const fsContainerRef = useRef<HTMLDivElement>(null)

  // CONTINUOUS NAVIGATION: Build flattened sequence of ALL media from ALL cards
  type FlatMedia = {
    itemId: string
    item: PublicItem
    mediaType: 'image' | 'video' | 'audio'
    mediaIndex: number
    media: any
    url: string
  }

  const flattenedMediaSequence = useMemo(() => {
    const flattened: FlatMedia[] = []

    cards.forEach((card) => {
      const item = card.item

      // Add all images from this item
      if (card.kind === 'image' && item.images) {
        item.images.forEach((img, imgIdx) => {
          flattened.push({
            itemId: item.id,
            item,
            mediaType: 'image',
            mediaIndex: imgIdx,
            media: img,
            url: img.url
          })
        })
      }

      // Add all videos from this item
      if (card.kind === 'video' && item.videos) {
        item.videos.forEach((vid, vidIdx) => {
          flattened.push({
            itemId: item.id,
            item,
            mediaType: 'video',
            mediaIndex: vidIdx,
            media: vid,
            url: vid.url
          })
        })
      }

      // Add all audios from this item
      if (card.kind === 'audio' && (item as any).audios) {
        ((item as any).audios || []).forEach((aud: any, audIdx: number) => {
          flattened.push({
            itemId: item.id,
            item,
            mediaType: 'audio',
            mediaIndex: audIdx,
            media: aud,
            url: aud.url
          })
        })
      }
    })

    return flattened
  }, [cards])

  // Find current position in flattened sequence
  const currentFlatIndex = useMemo(() => {
    if (!preview) return 0

    const currentMediaIndex = preview.kind === 'image' ? selectedImageIndex
      : preview.kind === 'video' ? selectedVideoIndex
        : selectedAudioIndex

    const idx = flattenedMediaSequence.findIndex((media) => {
      return media.itemId === preview.item.id &&
        media.mediaType === preview.kind &&
        media.mediaIndex === currentMediaIndex
    })

    return idx >= 0 ? idx : 0
  }, [flattenedMediaSequence, preview, selectedImageIndex, selectedVideoIndex, selectedAudioIndex])

  // CROSS-ITEM NAVIGATION: Navigate through global flattened sequence
  const goPrevMedia = useCallback(() => {
    console.log('[ArtStation] goPrevMedia called', { currentFlatIndex, sequenceLength: flattenedMediaSequence.length })

    if (currentFlatIndex <= 0) {
      console.log('[ArtStation] At first media, cannot go prev')
      return // At first media
    }

    const prevMedia = flattenedMediaSequence[currentFlatIndex - 1]
    if (!prevMedia) return

    console.log('[ArtStation] Navigating to previous media:', prevMedia)

    // Call parent callback to update preview
    if (onNavigate) {
      onNavigate({
        kind: prevMedia.mediaType,
        url: prevMedia.url,
        item: prevMedia.item
      }, prevMedia.mediaIndex)
    }
  }, [currentFlatIndex, flattenedMediaSequence, onNavigate])

  const goNextMedia = useCallback(() => {
    console.log('[ArtStation] goNextMedia called', { currentFlatIndex, sequenceLength: flattenedMediaSequence.length })

    if (currentFlatIndex >= flattenedMediaSequence.length - 1) {
      console.log('[ArtStation] At last media, cannot go next')
      return // At last media
    }

    const nextMedia = flattenedMediaSequence[currentFlatIndex + 1]
    if (!nextMedia) return

    console.log('[ArtStation] Navigating to next media:', nextMedia)
    console.log('[ArtStation] onNavigate exists?', !!onNavigate)

    // Call parent callback to update preview
    if (onNavigate) {
      console.log('[ArtStation] Calling onNavigate callback...')
      onNavigate({
        kind: nextMedia.mediaType,
        url: nextMedia.url,
        item: nextMedia.item
      }, nextMedia.mediaIndex)
    } else {
      console.warn('[ArtStation] No onNavigate callback provided! Using fallback...')
      // Fallback: directly update local indices (won't change item)
      if (nextMedia.mediaType === 'image') {
        setSelectedImageIndex(nextMedia.mediaIndex)
      } else if (nextMedia.mediaType === 'video') {
        setSelectedVideoIndex(nextMedia.mediaIndex)
      } else {
        setSelectedAudioIndex(nextMedia.mediaIndex)
      }
    }
  }, [currentFlatIndex, flattenedMediaSequence, onNavigate])

  // Fullscreen zoom helpers
  const fsClampOffset = useCallback((newOffset: { x: number; y: number }, currentScale: number) => {
    if (!fsContainerRef.current) return newOffset
    const rect = fsContainerRef.current.getBoundingClientRect()
    const imgW = fsNaturalSize.width * currentScale
    const imgH = fsNaturalSize.height * currentScale
    const maxX = Math.max(0, (imgW - rect.width) / 2)
    const maxY = Math.max(0, (imgH - rect.height) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, newOffset.y))
    }
  }, [fsNaturalSize])

  const fsZoomToPoint = useCallback((cursorPos: { x: number; y: number }, newScale: number) => {
    if (!fsContainerRef.current) return

    const currentScale = fsScale
    const currentOffset = fsOffset

    // Convert cursor from viewport to image space
    const imageX = (cursorPos.x - currentOffset.x) / currentScale
    const imageY = (cursorPos.y - currentOffset.y) / currentScale

    // Keep same image point under cursor at new scale
    const newOffsetX = cursorPos.x - (imageX * newScale)
    const newOffsetY = cursorPos.y - (imageY * newScale)

    const clamped = fsClampOffset({ x: newOffsetX, y: newOffsetY }, newScale)
    setFsScale(newScale)
    setFsOffset(clamped)
  }, [fsScale, fsOffset, fsClampOffset])

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true)
  }, [])

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false)
    setFsIsPanning(false)
  }, [])

  // Compute fit scale on fullscreen open - FIT TO HEIGHT
  useEffect(() => {
    if (!isFullscreen) return
    const computeFit = () => {
      if (!fsContainerRef.current || !fsNaturalSize.width || !fsNaturalSize.height) return
      const rect = fsContainerRef.current.getBoundingClientRect()

      // Fit to height - allows wide images to extend beyond width
      const heightFit = rect.height / fsNaturalSize.height
      const fit = heightFit || 1

      const base = fit // Allow upscaling to fit height
      setFsFitScale(base)
      setFsScale(base)
      setFsOffset({ x: 0, y: 0 })
    }
    computeFit()
    const onResize = () => computeFit()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isFullscreen, fsNaturalSize])

  // Use refs to access latest state in stable event listener
  // Fix: use onClose directly instead of handleClose which is defined later
  const stateRef = useRef({ preview, isFullscreen, goPrevMedia, goNextMedia, closeFullscreen, openFullscreen, onClose });
  useEffect(() => {
    stateRef.current = { preview, isFullscreen, goPrevMedia, goNextMedia, closeFullscreen, openFullscreen, onClose };
  }, [preview, isFullscreen, goPrevMedia, goNextMedia, closeFullscreen, openFullscreen, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { preview, isFullscreen, goPrevMedia, goNextMedia, closeFullscreen, openFullscreen, onClose } = stateRef.current;
      if (!preview) return;

      console.log('[ArtStation] Key pressed:', e.key, 'isFullscreen:', isFullscreen)

      // In fullscreen mode
      if (isFullscreen) {
        if (e.key === 'Escape') {
          e.preventDefault()
          closeFullscreen()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          console.log('[ArtStation] Left arrow in fullscreen')
          goPrevMedia()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          console.log('[ArtStation] Right arrow in fullscreen')
          goNextMedia()
        }
        return
      }

      // In modal (not fullscreen)
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        openFullscreen()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        console.log('[ArtStation] Left arrow in modal')
        goPrevMedia()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        console.log('[ArtStation] Right arrow in modal')
        goNextMedia()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // Empty dependency array for stable listener

  // Mouse handlers for fullscreen zoom and pan
  const fsOnWheel = useCallback((e: React.WheelEvent) => {
    if (!fsContainerRef.current) return
    e.preventDefault()

    const rect = fsContainerRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const zoomFactor = e.deltaY > 0 ? 1 / 1.15 : 1.15
    const next = Math.max(0.4, Math.min(6, fsScale * zoomFactor))
    if (Math.abs(next - fsScale) < 0.001) return
    fsZoomToPoint({ x: mx, y: my }, next)
  }, [fsScale, fsZoomToPoint])

  const fsOnMouseDown = useCallback((e: React.MouseEvent) => {
    if (fsScale <= fsFitScale) return // Only pan when zoomed
    e.preventDefault()
    setFsIsPanning(true)
    setFsLastPoint({ x: e.clientX, y: e.clientY })
  }, [fsScale, fsFitScale])

  const fsOnMouseMove = useCallback((e: React.MouseEvent) => {
    if (!fsIsPanning) return
    e.preventDefault()

    const dx = e.clientX - fsLastPoint.x
    const dy = e.clientY - fsLastPoint.y
    const newOffset = {
      x: fsOffset.x + dx,
      y: fsOffset.y + dy
    }

    const clamped = fsClampOffset(newOffset, fsScale)
    setFsOffset(clamped)
    setFsLastPoint({ x: e.clientX, y: e.clientY })
  }, [fsIsPanning, fsLastPoint, fsOffset, fsScale, fsClampOffset])

  const fsOnMouseUp = useCallback(() => {
    setFsIsPanning(false)
  }, [])

  // Update fsNaturalSize when image loads in fullscreen
  useEffect(() => {
    if (!isFullscreen || !preview || preview.kind !== 'image') return
    const images = (preview.item.images || []) as any[]
    const img = images[selectedImageIndex] || images[0] || { url: preview.url }
    const imgUrl = img?.url || preview.url

    if (!imgUrl) return
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') return

    let cancelled = false
    const imgEl = new window.Image()
    imgEl.decoding = 'async'
    imgEl.onload = () => {
      if (cancelled) return
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        setFsNaturalSize({ width: imgEl.naturalWidth, height: imgEl.naturalHeight })
      }
    }
    imgEl.onerror = () => {
      if (!cancelled) {
        console.warn('[ArtStationPreview] Failed to load image for fullscreen')
      }
    }
    imgEl.src = toMediaProxy(imgUrl) || toDirectUrl(imgUrl) || imgUrl

    return () => {
      cancelled = true
      imgEl.onload = null
      imgEl.onerror = null
    }
  }, [isFullscreen, preview, selectedImageIndex])

  useEffect(() => {
    setMediaDimensions(null)
    setIsPromptExpanded(false)
    setSelectedImageIndex(0)
    setSelectedVideoIndex(0)
    setSelectedAudioIndex(0)
  }, [preview?.item?.id, preview?.kind])

  // Prevent background scrolling when preview is open
  useEffect(() => {
    if (preview) {
      // Save the current scroll position
      const scrollY = window.scrollY
      // Apply overflow hidden to body
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        // Restore scrolling when preview closes
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [preview])

  useEffect(() => {
    if (!preview || preview.kind !== 'image') return
    const images = (preview.item.images || []) as any[]
    const img = images[selectedImageIndex] || images[0] || { url: preview.url }
    const measurementSource =
      img?.storagePath ||
      img?.url ||
      ''

    if (!measurementSource) return

    const proxiedMeasurementUrl =
      toMediaProxy(measurementSource) ||
      (String(measurementSource).startsWith('http')
        ? measurementSource
        : `${ZATA_PREFIX}${String(measurementSource).replace(/^\/+/, '')}`)

    if (!proxiedMeasurementUrl) return
    if (typeof window === 'undefined' || typeof window.Image === 'undefined') return

    let cancelled = false
    const imgEl = new window.Image()
    imgEl.decoding = 'async'
    imgEl.onload = () => {
      if (cancelled) return
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        setMediaDimensions({ width: imgEl.naturalWidth, height: imgEl.naturalHeight })
      }
    }
    imgEl.onerror = (err: Event | string | null) => {
      if (!cancelled) {
        console.warn('[ArtStationPreview] Failed to measure image dimensions from source:', measurementSource, err)
      }
    }
    imgEl.src = proxiedMeasurementUrl

    return () => {
      cancelled = true
      imgEl.onload = null
      imgEl.onerror = null
    }
  }, [preview?.item?.id, preview?.kind, selectedImageIndex])

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

  const copyPrompt = async (prompt: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedButtonId(buttonId)
      setTimeout(() => setCopiedButtonId(null), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const extractStyleFromPrompt = (prompt?: string): string | undefined => {
    if (!prompt) return undefined
    const match = String(prompt).match(/\[\s*Style:\s*([^\]]+)\]/i)
    return match?.[1]?.trim()
  }

  const cleanPromptByType = (prompt?: string, type?: string) => {
    if (!prompt) return ''
    let p = prompt.replace(/\r\n/g, '\n').trim()
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
    return p
  }

  const previewCardId = useMemo(() => {
    if (!preview) return null
    const matchingCard = cards.find(({ item }) => item.id === preview.item.id)
    if (!matchingCard) return `${preview.item.id}-${preview.item.images?.[0]?.id || preview.item.videos?.[0]?.id || (preview.item as any).audios?.[0]?.id || '0'}-0`
    return `${preview.item.id}-${matchingCard.media?.id || '0'}-${cards.indexOf(matchingCard)}`
  }, [preview, cards])

  const engagementState: EngagementState | null = useMemo(() => {
    if (!preview || !engagement) return null
    return engagement[preview.item.id] || null
  }, [preview, engagement])

  const isLiked = engagementState?.likedByMe ?? false
  const likesCount = engagementState?.likesCount ?? 0
  const isBookmarked = engagementState?.bookmarkedByMe ?? false
  const bookmarksCount = engagementState?.bookmarksCount ?? 0

  if (!preview) return null

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    console.log('[ArtStationPreview] Close button clicked')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20" onClick={handleClose}>
      <button
        aria-label="Close"
        className="text-white hover:text-white text-lg absolute md:top-8 top-2 md:right-10 right-0 z-[100]  hover:bg-black/70 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-colors pointer-events-auto"
        onClick={handleClose}
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
        }}
      >✕</button>

      {/* Navigation Arrows at Screen Edges */}
      {flattenedMediaSequence.length > 1 && currentFlatIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goPrevMedia()
          }}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-[100] w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 pointer-events-auto"
          aria-label="Previous media"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {flattenedMediaSequence.length > 1 && currentFlatIndex < flattenedMediaSequence.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goNextMedia()
          }}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-[100] w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 pointer-events-auto"
          aria-label="Next media"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      <div className="relative  md:h-full h-full  md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent  border border-white/10 md:rounded-lg rounded-3xl overflow-hidden shadow-3xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Action buttons */}
        <div className="absolute md:top-6 top-2 md:right-8 md:ml-0 ml-3  z-20">
          <div className="grid grid-cols-4 gap-2">
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
                    let downloadUrl = currentMedia.url
                    if (downloadUrl.startsWith('/api/proxy/resource/')) {
                      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
                      downloadUrl = `${API_BASE}${downloadUrl}`
                    }
                    const fileType = preview.kind as 'image' | 'video' | 'audio'
                    const creatorUsername = preview.item.createdBy?.username || preview.item.createdBy?.displayName || 'user'
                    await downloadFileWithNaming(downloadUrl, creatorUsername, fileType)
                  } catch (e) {
                    console.error('Download failed:', e)
                  }
                }}
                className="md:w-20 w-16 h-8 md:h-10 flex  items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors "
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 3v12" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M5 19h14" />
                </svg>
              </button>
              <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 backdrop-blur-3xl shadow-2xl">Download</div>
            </div>

            <div className="relative group">
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
                className="md:w-20 w-16 h-8 md:h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16,6 12,2 8,6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
              <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Share</div>
            </div>

            <div className="relative group">
              <button
                onClick={() => { toggleLike(preview.item.id) }}
                className="md:w-20 w-16 h-8 md:h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'red' : 'none'} stroke={isLiked ? 'red' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likesCount > 0 && (
                  <span className="ml-1 text-xs font-medium">{likesCount}</span>
                )}
              </button>
              <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Like</div>
            </div>

            {toggleBookmark && (
              <div className="relative group">
                <button
                  onClick={() => { toggleBookmark(preview.item.id) }}
                  className="md:w-20 w-16 h-8 md:h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke={isBookmarked ? 'currentColor' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {bookmarksCount > 0 && (
                    <span className="ml-1 text-xs font-medium">{bookmarksCount}</span>
                  )}
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Save</div>
              </div>
            )}

            {/* Delete button (owner only) - on same row as Like button */}
            {/* Delete button (owner only) - on same row as Like button */}

          </div>
        </div>

        {/* Content */}
        <div className="pt-0 md:h-full h-full md:mr-4 md:mt-0 mt-0  md:w-auto w-full flex flex-col md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative   h-full pt-12 md:pt-0 md:flex-1">
            {(() => {
              const images = (preview.item.images || []) as any[]
              const videos = (preview.item.videos || []) as any[]
              const audios = (preview.item as any).audios || []
              if (preview.kind === 'image') {
                const img = images[selectedImageIndex] || images[0] || { url: preview.url }
                // Use full image URL for popup: url -> storagePath (NO originalUrl to avoid 404s)
                // Don't use thumbnailUrl in popup - use full resolution
                const fullImageUrl = img?.url || (img?.storagePath ? toMediaProxy(img.storagePath) : null) || preview.url
                // Use proxy endpoint for storage paths, direct URL for full URLs
                const src = fullImageUrl
                  ? (fullImageUrl.startsWith('http')
                    ? fullImageUrl
                    : (toMediaProxy(fullImageUrl) || toDirectUrl(fullImageUrl) || fullImageUrl))
                  : preview.url;

                if (!src) return <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 text-white/50 text-xs">No image available</div>;
                return (
                  <div className="relative w-full h-full group">
                    <img
                      src={src || undefined}
                      alt={preview.item.prompt || ''}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      className="absolute inset-0 w-full h-full object-contain"
                      onLoad={(e) => {
                        const el = e.currentTarget
                        if (el.naturalWidth && el.naturalHeight) {
                          setMediaDimensions({ width: el.naturalWidth, height: el.naturalHeight })
                        }
                      }}
                    />
                    {/* Fullscreen button overlay - TOP LEFT */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openFullscreen()
                      }}
                      className="absolute top-2 left-2 md:top-4 md:left-4 z-10 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 opacity-0 group-hover:opacity-100 duration-200"
                      title="Fullscreen (F)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                    </button>

                    {/* Delete button (owner only) - TOP LEFT (Next to Fullscreen) */}
                    {currentUid && preview.item.createdBy?.uid === currentUid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const images = (preview.item.images || []) as any[];
                          const currentImg = images[selectedImageIndex] || images[0];
                          const imageId = currentImg?.id;
                          onConfirmDelete(preview.item, imageId);
                        }}
                        className="absolute top-2 left-12 md:top-4 md:left-16 z-10 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-red-500/40 opacity-0 group-hover:opacity-100 duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    )}
                  </div>
                )
              }
              if (preview.kind === 'video') {
                const vid = videos[selectedVideoIndex] || videos[0] || { url: preview.url }
                const proxied = toDirectUrl(vid.url) || vid.url
                const poster = (vid as any).thumbnailUrl || (vid as any).avifUrl || undefined
                return (
                  <div className="relative w-full h-full group">
                    {proxied && (
                      <video
                        src={proxied || undefined}
                        className="w-full h-full"
                        controls
                        autoPlay
                        playsInline
                        preload="auto"
                        poster={poster}
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget
                          if (v.videoWidth && v.videoHeight) setMediaDimensions({ width: v.videoWidth, height: v.videoHeight })
                        }}
                      />
                    )}
                    {/* Fullscreen button overlay - TOP LEFT */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openFullscreen()
                      }}
                      className="absolute top-2 left-2 md:top-4 md:left-4 z-10 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-white/40 opacity-0 group-hover:opacity-100 duration-200"
                      title="Fullscreen (F)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 md:h-5 md:w-5">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                    </button>

                    {/* Delete button (owner only) - TOP LEFT (Next to Fullscreen) */}
                    {currentUid && preview.item.createdBy?.uid === currentUid && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // For video, we usually delete the whole item or just pass item
                          onConfirmDelete(preview.item);
                        }}
                        className="absolute top-2 left-12 md:top-4 md:left-16 z-10 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/20 hover:border-red-500/40 opacity-0 group-hover:opacity-100 duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    )}
                  </div>
                )
              }
              const au = audios[selectedAudioIndex] || audios[0] || { url: preview.url }
              const audioUrl = toDirectUrl(au.url) || au.url
              return (
                <div className="p-6">
                  <CustomAudioPlayer
                    audioUrl={audioUrl}
                    prompt={preview.item.prompt || ''}
                    model={preview.item.model || ''}
                    lyrics={preview.item.lyrics || ''}
                    generationType={preview.item.generationType}
                    autoPlay={true}
                  />
                </div>
              )
            })()}
          </div>

          {/* Sidebar */}
          <div className="p-4 md:p-5 text-white bg-transparent  h-full md:h-full md:w-[34%] overflow-y-auto custom-scrollbar">
            {/* Creator */}
            <div className="mb-4">
              <div className="text-white/60 md:text-xs text-xs uppercase tracking-wider md:mt-18 mt-0 mb-2">Creator</div>
              <div className="flex items-center md:gap-2 gap-1">
                {(() => {
                  const cb = preview.item.createdBy || ({} as any)
                  const isSelf = (cb?.uid && currentUid && cb.uid === currentUid) || (!cb?.uid && currentUser?.username && cb?.username === currentUser.username)
                  const photo = cb?.photoURL || cb?.photoUrl || cb?.avatarUrl || cb?.avatarURL || cb?.profileImageUrl || (isSelf ? currentUser?.photoURL : '')
                  if (photo) return <img src={`/api/proxy/external?url=${encodeURIComponent(photo)}` || undefined} alt={cb?.username || currentUser?.username || ''} className="w-6 h-6 rounded-full" />
                  return <div className="w-6 h-6 rounded-full bg-white/20" />
                })()}
                <span className="text-white md:text-sm text-xs font-medium">{(preview.item.createdBy?.username) || (isNaN(0 as any) && preview.item.createdBy?.displayName) || (currentUser?.username) || 'User'}</span>
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
                  className={`flex items-center gap-2 px-2 py-1.5 text-white/80 text-xs rounded-lg transition-colors ${copiedButtonId === `preview-${preview.item.id}` ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20'}`}
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
                      {(() => {
                        const thumbUrl = im.thumbnailUrl || im.avifUrl || im.url
                        const normalizedThumb = thumbUrl
                          ? (thumbUrl.startsWith('http') || thumbUrl.startsWith('/api/')
                            ? thumbUrl
                            : (toMediaProxy(thumbUrl) || toDirectUrl(thumbUrl) || thumbUrl))
                          : ''
                        if (!normalizedThumb) return <div className="w-full h-full bg-gray-900" />;
                        return <img src={normalizedThumb || undefined} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                      })()}
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
                        const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/'
                        const path = vd.url?.startsWith(ZATA_PREFIX) ? vd.url.substring(ZATA_PREFIX.length) : vd.url
                        const proxied = `/api/proxy/media/${encodeURIComponent(path)}`
                        return <video src={proxied || undefined} className="w-full h-full object-cover" muted preload="metadata" poster={vd.thumbnailUrl || vd.avifUrl || undefined} />
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
              <div className="text-white/80 md:text-sm text-xs uppercase tracking-wider mb-1">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 md:text-sm text-xs">Type:</span>
                  <span className="text-white/80 md:text-sm text-xs">{preview.item.generationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 md:text-sm text-xs">Model:</span>
                  <span className="text-white/80 md:text-sm text-xs">{getModelDisplayName(preview.item.model)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 md:text-sm text-xs">Aspect ratio:</span>
                  <span className="text-white/80 text-sm">{(() => {
                    const ar = preview.item.aspectRatio || preview.item.frameSize || preview.item.aspect_ratio
                    if (ar && typeof ar === 'string') return ar
                    if (mediaDimensions && mediaDimensions.width && mediaDimensions.height) {
                      const w = Math.max(1, Math.round(mediaDimensions.width))
                      const h = Math.max(1, Math.round(mediaDimensions.height))
                      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
                      const g = gcd(w, h)
                      return `${Math.round(w / g)}:${Math.round(h / g)}`
                    }
                    return '—'
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 md:text-sm text-xs">Format:</span>
                  <span className="text-white/80 md:text-sm text-xs">{preview.kind}</span>
                </div>
                {mediaDimensions && (
                  <div className="flex justify-between">
                    <span className="text-white/60 md:text-sm text-xs">Resolution:</span>
                    <span className="text-white/80 md:text-sm text-xs">{mediaDimensions.width} × {mediaDimensions.height}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Open in generator button */}
            {(() => {
              // Check if this is a vectorize generation (should hide Remix button)
              const generationType = preview.item.generationType || ''
              const normalizedGenType = String(generationType).toLowerCase().replace(/[_-]/g, '-')
              const isVectorizeGeneration = normalizedGenType === 'vectorize' ||
                normalizedGenType === 'image-vectorize' ||
                normalizedGenType === 'image-to-svg' ||
                normalizedGenType === 'image_to_svg' ||
                normalizedGenType.includes('vector')

              // Hide Remix button for vectorize generations
              if (isVectorizeGeneration) return null

              return (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      onClose()
                      const genType = String(preview.item.generationType || '').replace(/[_-]/g, '-').toLowerCase()
                      const isVideo = preview.kind === 'video' || genType.includes('video')

                      const rawPrompt = String(preview.item.prompt || '')
                      const style = extractStyleFromPrompt(rawPrompt)
                      const cleanPrompt = style ? rawPrompt.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim() : cleanPromptByType(rawPrompt, preview.item.generationType)
                      const model = preview.item.model ? String(preview.item.model) : ''
                      const frame = (preview.item.aspectRatio || preview.item.frameSize || preview.item.aspect_ratio) ? String(preview.item.aspectRatio || preview.item.frameSize || preview.item.aspect_ratio) : ''

                      const qs = new URLSearchParams()
                      // Force unique navigation even when staying on the same generator route,
                      // so the generator page reliably re-consumes Remix params on every click.
                      qs.set('remixNonce', String(Date.now()))
                      if (cleanPrompt) qs.set('prompt', cleanPrompt)
                      if (model) qs.set('model', model)
                      if (frame) qs.set('frame', frame)
                      if (style) qs.set('style', style)

                      // Also pass common video params if present
                      const anyItem: any = preview.item as any
                      if (isVideo) {
                        if (anyItem?.duration) qs.set('duration', String(anyItem.duration))
                        if (anyItem?.quality) qs.set('quality', String(anyItem.quality))
                        if (anyItem?.resolution) qs.set('resolution', String(anyItem.resolution))
                        // IMPORTANT: for video remix, do NOT redirect to image generation
                        router.push(`/text-to-video?${qs.toString()}`)
                      } else {
                        // IMPORTANT: for image remix from ArtStation, do NOT pass generated image as input
                        router.push(`/text-to-image?${qs.toString()}`)
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-[#2D6CFF] text-white rounded-lg hover:bg-[#255fe6] transition-colors text-sm font-medium"
                  >
                    Recreate
                  </button>
                </div>
              )
            })()}
          </div>
        </div>

      </div>
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


      {/* Fullscreen Mode Overlay */}
      {isFullscreen && preview && (() => {
        const isImage = preview.kind === 'image'
        const isVideo = preview.kind === 'video'

        // For images
        const images = (preview.item.images || []) as any[]
        const img = images[selectedImageIndex] || images[0] || { url: preview.url }

        // For videos
        const videos = (preview.item.videos || []) as any[]
        const vid = videos[selectedVideoIndex] || videos[0]

        let src = preview.url
        if (isImage) {
          const fullImageUrl = img?.url || (img?.storagePath ? toMediaProxy(img.storagePath) : null) || preview.url
          src = fullImageUrl
            ? (fullImageUrl.startsWith('http')
              ? fullImageUrl
              : (toMediaProxy(fullImageUrl) || toDirectUrl(fullImageUrl) || fullImageUrl))
            : (preview.url || '');
        } else if (isVideo && vid) {
          src = toDirectUrl(vid.url) || vid.url
        }

        // Use GLOBAL sequence for boundaries (cross-item navigation)
        const isFirstMedia = currentFlatIndex <= 0
        const isLastMedia = currentFlatIndex >= flattenedMediaSequence.length - 1
        const hasMultipleMedia = flattenedMediaSequence.length > 1

        return (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-[110] w-12 h-12 rounded-full bg-black/80 hover:bg-black/95 text-white flex items-center justify-center transition-colors"
              aria-label="Close fullscreen"
            >
              ✕
            </button>

            {/* Navigation arrows - only for images with multiple items */}
            {isImage && hasMultipleMedia && !isFirstMedia && (
              <button
                onClick={() => goPrevMedia()}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[110] w-16 h-16 rounded-r-full bg-black/80 hover:bg-black/95 text-white flex items-center justify-center transition-all border-r border-y border-white/30 hover:border-white/50"
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {isImage && hasMultipleMedia && !isLastMedia && (
              <button
                onClick={() => goNextMedia()}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-[110] w-16 h-16 rounded-l-full bg-black/80 hover:bg-black/95 text-white flex items-center justify-center transition-all border-l border-y border-white/30 hover:border-white/50"
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* Media container */}
            {isImage ? (
              // Image with zoom/pan
              <div
                ref={fsContainerRef}
                className="relative w-full h-full cursor-zoom-in"
                onMouseDown={fsOnMouseDown}
                onMouseMove={fsOnMouseMove}
                onMouseUp={fsOnMouseUp}
                onMouseLeave={fsOnMouseUp}
                onWheel={fsOnWheel}
                style={{ cursor: fsScale > fsFitScale ? (fsIsPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`,
                    transformOrigin: 'center center',
                    transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                  <img
                    src={src || undefined}
                    alt={preview.item.prompt || ''}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onLoad={(e) => {
                      const el = e.currentTarget
                      if (el.naturalWidth && el.naturalHeight) {
                        setFsNaturalSize({ width: el.naturalWidth, height: el.naturalHeight })
                      }
                    }}
                    style={{
                      width: `${fsNaturalSize.width}px`,
                      height: `${fsNaturalSize.height}px`,
                      display: fsNaturalSize.width ? 'block' : 'none'
                    }}
                    className="object-contain select-none"
                    draggable={false}
                  />
                </div>
              </div>
            ) : isVideo ? (
              // Video player
              <div className="relative w-full h-full flex items-center justify-center p-8">
                {src && (
                  <video
                    src={src || undefined}
                    className="max-w-full max-h-full"
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    poster={(vid as any)?.thumbnailUrl || (vid as any)?.avifUrl || undefined}
                  />
                )}
              </div>
            ) : null}

            {/* Instructions - only for images */}
            {isImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-black/80 text-white/80 text-sm px-4 py-2 rounded-lg backdrop-blur-sm pointer-events-none">
                <span className="">
                  Scroll to zoom • Drag to pan • ← → to navigate • ESC to exit
                </span>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
