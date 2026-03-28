'use client';

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import ArtStationPreview, { PublicItem } from '@/components/ArtStationPreview'
import { API_BASE } from '../routes'
import { toMediaProxy, toDirectUrl } from '@/lib/thumb'

type ResolveOptions = {
  allowReplicate?: boolean
}

// Helper to normalize media URL (same as ArtStation) - moved outside component for stability
const normalizeMediaUrl = (url?: string, options?: ResolveOptions): string | undefined => {
  if (!url || typeof url !== 'string') return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  // Reject replicate URLs to prevent 404s - only use Zata URLs
  if (!options?.allowReplicate && (trimmed.includes('replicate.delivery') || trimmed.includes('replicate.com'))) {
    return undefined
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/api/')) return trimmed
  // If it's a relative path, assume it's a Zata path and proxy it
  if (!trimmed.startsWith('/')) return toMediaProxy(trimmed)
  return toDirectUrl(trimmed)
}

// Resolve media URL with fallbacks (same as ArtStation) - moved outside component for stability
const resolveMediaUrl = (m: any, options?: ResolveOptions): string | undefined => {
  if (!m) return undefined
  // Try multiple URL properties in order of preference
  const candidates = [
    m.url,
    m.webpUrl,
    m.avifUrl,
    m.thumbnailUrl,
    m.storagePath,
  ]
  for (const candidate of candidates) {
    const normalized = normalizeMediaUrl(candidate, options)
    if (normalized) return normalized
  }
  return undefined
}

export default function CommunityCreations({
  className = "",
  mode = "image",
}: {
  className?: string;
  mode?: "image" | "video";
}) {
  const router = useRouter();
  const [items, setItems] = useState<PublicItem[]>([])
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PublicItem | null>(null)

  // Fetch directly from backend to bypass Cloudflare/Vercel proxy bolcks
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setError(null)
        // Hardcoded fallback for now to ensure it works
        const apiBase = API_BASE || 'https://wildmindai.com'
        // Direct fetch to backend
        const res = await fetch(`${apiBase}/api/feed?mode=${mode}&limit=50`, {
           method: 'GET',
           headers: {
             'Content-Type': 'application/json'
           }
        })
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        
        const json = await res.json()
        const itemsList = json?.data?.items || json?.items || []
        
        if (Array.isArray(itemsList)) {
          // Validate and filter items locally since we are bypassing the proxy cache
          const validItems = itemsList.filter((item: any) => {
            // Basic validation
            if (!item?.id) return false
            
            // Filter non-images
            const type = (item.generationType || '').toLowerCase()
            const isImage = type === 'text-to-image' || type === 'image-upscale' || type === 'logo' || type === 'product-generation' || type === 'sticker-generation'
            const isVideo = type === 'text-to-video' || type === 'image-to-video' || type === 'video-to-video' || type === 'lipsync'
            if (mode === 'image' && !isImage) return false
            if (mode === 'video' && !isVideo) return false

            // Exclude video/audio
            if (mode === 'image' && (item.videos?.length > 0 || item.audios?.length > 0)) return false
            if (mode === 'video' && (!item.videos || item.videos.length === 0)) return false
            
            // Check for valid media URL based on current mode
            const hasValidMedia = mode === 'video'
              ? (
                  resolveMediaUrl(item, { allowReplicate: true }) ||
                  (Array.isArray(item.videos) && item.videos.some((vid: any) => resolveMediaUrl(vid, { allowReplicate: true })))
                )
              : (
                  resolveMediaUrl(item) ||
                  (Array.isArray(item.images) && item.images.some((img: any) => resolveMediaUrl(img)))
                )

            return !!hasValidMedia
          }).map((item: any) => {
              // Normalize structure to PublicItem if needed
              return {
                  ...item,
                  // Ensure basic fields exists
                  images: Array.isArray(item.images) ? item.images : []
              } as PublicItem
          })
          
          setItems(validItems)
        } else {
          console.warn('[CommunityCreations] Invalid data format from backend', json)
          setItems([])
        }
      } catch (e: any) {
        console.error('[CommunityCreations] Failed to load community creations', e)
        setError(e?.message || 'Failed to load community creations')
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [mode])

  // Prepare cards for Masonry with validation
  const cards = useMemo(() => {
    return items
      .map(item => {
        if (mode === 'video') {
          let vid = item.videos?.[0]
          let mediaUrl = resolveMediaUrl(vid, { allowReplicate: true })

          if (!mediaUrl) {
            mediaUrl = resolveMediaUrl(item, { allowReplicate: true })
            if (mediaUrl) {
              vid = { id: item.id || '0', url: mediaUrl }
            }
          }

          if (!mediaUrl || !vid) return null

          return {
            item,
            media: {
              ...vid,
              url: mediaUrl,
            },
            kind: 'video' as const
          }
        }

        // Image mode
        let img = item.images?.[0]
        let mediaUrl = resolveMediaUrl(img)

        if (!mediaUrl) {
          mediaUrl = resolveMediaUrl(item)
          if (mediaUrl) {
            img = { id: item.id || '0', url: mediaUrl }
          }
        }

        if (!mediaUrl || !img) return null

        return {
          item,
          media: {
            ...img,
            url: mediaUrl, // Ensure we use the resolved URL
          },
          kind: 'image' as const
        }
      })
      .filter((card): card is NonNullable<typeof card> => card !== null) // Remove null entries
  }, [items, mode])

  // Limit to 20 items for the homepage
  const limitedCards = useMemo(() => cards.slice(0, 20), [cards])

  return (
    <section className={`w-full ${className}`}>

      <div className=" px-4 sm:px-6 lg:px-8">
          <div
            className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px] "
            style={{ color: "#3B82F6" }}
          >
            <span className="inline-block h-[1.5px] w-3.5 sm:w-4" style={{ background: "#3B82F6" }} />
            Wild  Creations
          </div>
          <h2
            className="text-[24px] leading-none tracking-[0.02em] text-white sm:text-[20px] md:text-[28px] lg:text-[36px]"
            style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}
          >
            {mode === 'video'
              ? 'See what our community is creating with Wild Mind AI Video'
              : 'See what our community is creating with Wild Mind AI'}
          </h2>
        </div>

      {/* Masonry Grid */}
      <div className="relative min-h-[300px] px-4 sm:px-6 lg:px-8 pb-4">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2">Loading creations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg mb-2">Error loading creations</p>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        ) : limitedCards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No community creations to display</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-4 lg:columns-5 gap-2 space-y-2">
            {limitedCards.map((card, idx) => {
              const { item, media, kind } = card
              // Double-check we have a valid URL before rendering
              if (!media?.url || typeof media.url !== 'string' || media.url.length === 0) {
                return null
              }
              
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="break-inside-avoid relative w-full mb-2 cursor-pointer group"
                  onClick={() => setPreview(item)}
                >
                  {kind === 'video' ? (
                    <video
                      src={media.url}
                      className="w-full h-auto object-cover block rounded-xl"
                      muted
                      loop
                      autoPlay
                      playsInline
                      onError={() => {
                        console.warn('[CommunityCreations] Video failed to load:', media.url)
                      }}
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={item.prompt || 'Community creation'}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto object-contain block rounded-xl"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        console.warn('[CommunityCreations] Image failed to load:', media.url)
                      }}
                    />
                  )}
                  
                  {/* Hover Overlay (ArtStation style) */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl" />
                </div>
              )
            })}
          </div>
        )}

        {/* Explore Overlay */}
        {!loading && limitedCards.length > 0 && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-[200px] z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[150px] flex items-center justify-center z-20 pointer-events-auto">
              <button
                onClick={() => router.push(`/view/ArtStation?mode=${mode}`)}
                className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg"
              >
                Explore Art Station
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (() => {
        // Resolve preview URL safely
        const previewMedia = mode === 'video' ? preview.videos?.[0] : preview.images?.[0]
        const previewUrl = previewMedia
          ? resolveMediaUrl(previewMedia, mode === 'video' ? { allowReplicate: true } : undefined)
          : resolveMediaUrl(preview, mode === 'video' ? { allowReplicate: true } : undefined)
        
        // Only render if we have a valid URL
        if (!previewUrl) {
          console.warn('[CommunityCreations] Preview item has no valid media URL:', preview.id)
          return null
        }
        
        return (
          <ArtStationPreview
            preview={{ kind: mode === 'video' ? 'video' : 'image', url: previewUrl, item: preview }}
            onClose={() => setPreview(null)}
            onConfirmDelete={async () => {}} // Read-only view
            currentUid={null} // Read-only view
            currentUser={null}
            cards={cards} // Allow navigation through the set
            likedCards={new Set()} // No interaction in this view
            toggleLike={() => {}}
          />
        )
      })()}
    </section>
  );
}
