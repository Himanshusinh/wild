'use client'
import React, { useEffect, useMemo, useState } from 'react'
import CustomAudioPlayer from '@/app/view/Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer'
import RemoveBgPopup from '@/app/view/Generation/ImageGeneration/TextToImage/compo/RemoveBgPopup'
import { Trash2 } from 'lucide-react'
import { toDirectUrl, toMediaProxy } from '@/lib/thumb'
import { downloadFileWithNaming } from '@/utils/downloadUtils'
import { getModelDisplayName } from '@/utils/modelDisplayNames'

export type PublicItem = {
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
    blurDataUrl?: string;
    optimized?: boolean;
    avifUrl?: string;
  }[];
  videos?: { id: string; url: string; originalUrl?: string; storagePath?: string; thumbnailUrl?: string; avifUrl?: string }[];
  audios?: { id: string; url: string; originalUrl?: string; storagePath?: string }[];
}

export type PreviewState = { kind: 'image' | 'video' | 'audio'; url: string; item: PublicItem } | null

type CardEntry = { item: PublicItem; media: any; kind: 'image' | 'video' | 'audio' }

type Props = {
  preview: PreviewState
  onClose: () => void
  onConfirmDelete: (item: PublicItem) => void | Promise<void>
  currentUid: string | null
  currentUser: { uid?: string; username?: string; displayName?: string; photoURL?: string } | null
  cards: CardEntry[]
  likedCards: Set<string>
  toggleLike: (cardId: string) => void
}

export default function ArtStationPreview({
  preview,
  onClose,
  onConfirmDelete,
  currentUid,
  currentUser,
  cards,
  likedCards,
  toggleLike,
}: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0)
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0)
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null)
  const [showRemoveBg, setShowRemoveBg] = useState(false)
  const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/').replace(/\/$/, '/')

  useEffect(() => {
    setMediaDimensions(null)
    setIsPromptExpanded(false)
    setSelectedImageIndex(0)
    setSelectedVideoIndex(0)
    setSelectedAudioIndex(0)
  }, [preview?.item?.id, preview?.kind])

  useEffect(() => {
    if (!preview || preview.kind !== 'image') return
    const images = (preview.item.images || []) as any[]
    const img = images[selectedImageIndex] || images[0] || { url: preview.url }
    const measurementSource =
      img?.storagePath ||
      img?.originalUrl ||
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

  if (!preview) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20" onClick={onClose}>
                  <button aria-label="Close" className="text-white hover:text-white text-lg absolute top-8 right-10 " onClick={onClose}>✕</button>

      <div className="relative  h-full  md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent  border border-white/10 rounded-3xl overflow-hidden shadow-3xl"
        onClick={(e) => e.stopPropagation()}>
          
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent">
          <div className="text-white/70 text-sm"></div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-6 right-8 z-20">
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
                      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
                      downloadUrl = `${API_BASE}${downloadUrl}`
                    }
                    const fileType = preview.kind as 'image' | 'video' | 'audio'
                    const creatorUsername = preview.item.createdBy?.username || preview.item.createdBy?.displayName || 'user'
                    await downloadFileWithNaming(downloadUrl, creatorUsername, fileType)
                  } catch (e) {
                    console.error('Download failed:', e)
                  }
                }}
                className="w-20 h-10 flex  items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors "
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
                className="w-20 h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors"
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
              {(() => {
                const isLiked = previewCardId ? likedCards.has(previewCardId) : false
                return (
                  <button
                    onClick={() => { if (previewCardId) toggleLike(previewCardId) }}
                    className="w-20 h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'red' : 'none'} stroke={isLiked ? 'red' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                )
              })()}
              <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Like</div>
            </div>

            {/* Delete button (owner only) - on same row as Like button */}
            {currentUid && preview.item.createdBy?.uid === currentUid ? (
              <div className="relative group">
                <button
                  title="Delete"
                  className="w-20 h-10 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm transition-colors"
                  onClick={() => onConfirmDelete(preview.item)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Delete</div>
              </div>
            ) : (
              <div className="w-10 h-10"></div>
            )}
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
                // Always prefer the original Zata asset for preview to avoid duplicate-looking thumbnails
                const originalSource =
                  img?.storagePath ||
                  img?.url ||
                  img?.originalUrl ||
                  img?.avifUrl ||
                  preview.url
                const src = originalSource ? (toDirectUrl(originalSource) || originalSource) : preview.url
                return (
                  <div className="relative w-full h-full">
                    <img
                      src={src}
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
                  </div>
                )
              }
              if (preview.kind === 'video') {
                const vid = videos[selectedVideoIndex] || videos[0] || { url: preview.url }
                const proxied = toDirectUrl(vid.url) || vid.url
                const poster = (vid as any).thumbnailUrl || (vid as any).avifUrl || undefined
                return (
                  <div className="relative w-full h-full">
                    <video
                      src={proxied}
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
                  </div>
                )
              }
              const au = audios[selectedAudioIndex] || audios[0] || { url: preview.url }
              const audioUrl = toDirectUrl(au.url) || au.url
              return (
                <div className="p-6">
                  <CustomAudioPlayer audioUrl={audioUrl} prompt={preview.item.prompt || ''} model={preview.item.model || ''} lyrics={''} autoPlay={true} />
                </div>
              )
            })()}
          </div>

          {/* Sidebar */}
          <div className="p-4 md:p-5 text-white bg-transparent  h-[52vh] md:h-full md:w-[34%] overflow-y-auto custom-scrollbar">
            {/* Creator */}
            <div className="mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider mt-18 mb-2">Creator</div>
              <div className="flex items-center gap-2">
                {(() => {
                  const cb = preview.item.createdBy || ({} as any)
                  const isSelf = (cb?.uid && currentUid && cb.uid === currentUid) || (!cb?.uid && currentUser?.username && cb?.username === currentUser.username)
                  const photo = cb?.photoURL || cb?.photoUrl || cb?.avatarUrl || cb?.avatarURL || cb?.profileImageUrl || (isSelf ? currentUser?.photoURL : '')
                  if (photo) return <img src={`/api/proxy/external?url=${encodeURIComponent(photo)}`} alt={cb?.username || currentUser?.username || ''} className="w-6 h-6 rounded-full" />
                  return <div className="w-6 h-6 rounded-full bg-white/20" />
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
                      <img src={im.thumbnailUrl || im.avifUrl || im.url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
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
                        return <video src={proxied} className="w-full h-full object-cover" muted preload="metadata" poster={vd.thumbnailUrl || vd.avifUrl || undefined} />
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
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white/80 text-sm">{preview.kind}</span>
                </div>
                {mediaDimensions && (
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Resolution:</span>
                    <span className="text-white/80 text-sm">{mediaDimensions.width} × {mediaDimensions.height}</span>
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
                      const images = (preview.item.images || []) as any[]
                      const img = images[selectedImageIndex] || images[0] || { url: preview.url }
                      const url = img?.url || preview.url
                      const dest = new URL(window.location.origin + '/text-to-image')
                      dest.searchParams.set('image', url)
                      window.location.href = dest.toString()
                    }}
                    className="w-full px-4 py-2.5 bg-[#2D6CFF] text-white rounded-lg hover:bg-[#255fe6] transition-colors text-sm font-medium"
                  >
                    Remix
                  </button>
                </div>
              )
            })()}
          </div>
        </div>

      </div>
      {preview.kind === 'image' && preview.item.generationType === 'text-to-image' && showRemoveBg && (
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
  )
}
