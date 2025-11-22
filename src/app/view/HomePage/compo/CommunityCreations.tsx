'use client';

// components/CommunityCreations.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { toThumbUrl, toMediaProxy } from '@/lib/thumb'
import ArtStationPreview, { PublicItem } from '@/components/ArtStationPreview'
import { API_BASE } from '../routes'
// Removed SmartImage to avoid blocked thumbnail (403) and delayed preview; using plain <img>

/* ---------- Types ---------- */
type Category = 'All' | 'Images' | 'Videos' | 'Music' | 'Logos' | 'Stickers' | 'Products';

export interface Creation {
  id: string;
  src: string;
  prompt?: string;
  categories: Category[];
  width?: number;
  height?: number;
  createdBy?: string;
}

/* ---------- Small inline icons (no extra deps) ---------- */
const Icon = {
  fire: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 2.6s.4 2.3-1.1 3.8c-1.6 1.6-3.7 1.6-3.7 1.6s.2-1.9-1.2-3.5C5 3 4 2.5 4 2.5s-.5 3.1 1 5.6c1.3 2.1 3.2 2.9 3.2 2.9s-3.2 1.2-3.2 4.6A6 6 0 0 0 11 22a6 6 0 0 0 6-6c0-3.9-2.6-5.9-3.5-6.8-.8-.8-0-2.6 0-5.6z" />
    </svg>
  ),
  grid: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  ),
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 3.5V7l-5 3.5z" />
    </svg>
  ),
  camera: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3l-2 2H4a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-3l-2-2H9z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  paw: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5.5" cy="9" r="2.2" /><circle cx="9.5" cy="6" r="2.2" />
      <circle cx="14.5" cy="6" r="2.2" /><circle cx="18.5" cy="9" r="2.2" />
      <path d="M7 16c0-2.2 2.2-4 5-4s5 1.8 5 4-2.2 4-5 4-5-1.8-5-4z" />
    </svg>
  ),
  burger: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 11h18v2H3zM3 7h18a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3zM3 15h18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

/* ---------- Chip meta aligned with ArtStation categories ---------- */
const CHIPS: { key: Category; label: string; icon: React.ReactElement }[] = [
  { key: 'All', label: 'All', icon: Icon.grid },
  { key: 'Images', label: 'Images', icon: Icon.camera },
  { key: 'Videos', label: 'Videos', icon: Icon.video },
  { key: 'Music', label: 'Music', icon: Icon.grid },
  { key: 'Logos', label: 'Logos', icon: Icon.grid },
  { key: 'Stickers', label: 'Stickers', icon: Icon.grid },
  { key: 'Products', label: 'Products', icon: Icon.grid },
];

/* ---------- Pill Button ---------- */
function Chip({
  active,
  children,
  onClick,
  leftIcon,
  rightIcon,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-2.5 rounded-lg md:rounded-full text-xs md:text-sm font-medium transition-all border-0 md:border ${
        active
          ? 'bg-white text-[#0b0f17] md:text-black md:shadow-sm'
          : 'bg-white/10 text-white/80 hover:bg-white/15 md:bg-gradient-to-b md:from-white/5 md:to-white/5 md:border-white/10 md:hover:text-white md:hover:bg-white/10'
      }`}
    >
      {leftIcon && <span className="text-white/90">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="text-white/90">{rightIcon}</span>}
    </button>
  );
}

/* ---------- Card (unchanged) ---------- */
function Card({ item, isVisible, setRef, onClick }: { item: Creation; isVisible: boolean; setRef: (el: HTMLDivElement | null) => void; onClick?: () => void }) {
  const ratio = item.width && item.height ? item.height / item.width : 4 / 5;
  const src = item.src || ''
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)
  const isAudio = /\.(mp3|wav|m4a|flac|aac|ogg|pcm)(\?|$)/i.test(src)

  return (
    <div ref={setRef} className={`break-inside-avoid mb-1 inline-block w-full align-top transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-[2px]'}`}>
      <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5 cursor-pointer" onClick={onClick}>
        <div style={{ aspectRatio: `${1 / ratio}` }} className="relative w-full">
          {isAudio ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0f1a] to-[#1a2a3d]">
              <div className="flex flex-col items-center text-white/80">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
                <span className="text-xs mt-2">Audio</span>
              </div>
            </div>
          ) : isVideo ? (
            (() => {
              const proxied = toMediaProxy(src)
              const videoSrc = proxied || src
              return (
                <video
                  src={videoSrc}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  poster={toThumbUrl(src, { w: 640, q: 60 }) || undefined}
                />
              );
            })()
          ) : (
            (() => {
              // Attempt AVIF thumbnail first, then WEBP, then original
              let avifThumb: string | undefined
              let webpThumb: string | undefined
              const Z = process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/'
              if (src.startsWith(Z)) {
                try { avifThumb = toThumbUrl(src, { w: 640, q: 60, fmt: 'avif' }) || undefined } catch {}
                if (!avifThumb) { try { webpThumb = toThumbUrl(src, { w: 640, q: 60, fmt: 'webp' }) || undefined } catch {} }
                else { try { webpThumb = toThumbUrl(src, { w: 640, q: 60, fmt: 'webp' }) || undefined } catch {} }
              }
              const displaySrc = avifThumb || webpThumb || src
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displaySrc}
                  alt={item.prompt ?? ''}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    // Fallback chain: avif -> webp -> original
                    if (img.src === avifThumb && webpThumb && webpThumb !== avifThumb) {
                      img.src = webpThumb
                      return
                    }
                    if (img.src === webpThumb && src !== webpThumb) {
                      img.src = src
                      return
                    }
                  }}
                />
              )
            })()
          )}
        </div>
        {/* Hover overlay and hover ring removed to prevent showing prompt/credit on hover */}
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */
export default function CommunityCreations({
  items,
  initialFilter = "All",
  className = "",
}: {
  items: Creation[];
  initialFilter?: Category;
  className?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [active, setActive] = useState<Category>(initialFilter);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<Creation | null>(null)
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set())
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ uid?: string; username?: string; displayName?: string; photoURL?: string } | null>(null)
  const [previewFullItem, setPreviewFullItem] = useState<PublicItem | null>(null)

  const toggleLike = (cardId: string) => {
    setLikedCards(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId); else next.add(cardId)
      return next
    })
  }

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setCurrentUid(u?.uid || null)
        setCurrentUser({ uid: u?.uid, username: u?.username || u?.displayName, displayName: u?.displayName || u?.username, photoURL: u?.photoURL || u?.photoUrl })
      }
    } catch {}
  }, [])

  // Enrich preview with full generation details (model, creator profile, aspect ratio)
  useEffect(() => {
    let cancelled = false
    const fetchDetails = async (id: string) => {
      try {
        const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
        const res = await fetch(`${baseUrl}/api/generations/${id}`, { credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const it = (data?.data || data)
        const normalizeDate = (d: any) => typeof d === 'string' ? d : (d && typeof d === 'object' && typeof d._seconds === 'number' ? new Date(d._seconds * 1000).toISOString() : undefined)
        const normalized: PublicItem = {
          id: it?.id || id,
          prompt: it?.prompt,
          generationType: it?.generationType,
          model: it?.model,
          aspectRatio: it?.aspect_ratio || it?.aspectRatio || it?.frameSize,
          frameSize: it?.frameSize || it?.aspect_ratio || it?.aspectRatio,
          aspect_ratio: it?.aspect_ratio,
          createdAt: normalizeDate(it?.createdAt) || it?.createdAt,
          updatedAt: normalizeDate(it?.updatedAt) || it?.updatedAt,
          isPublic: it?.isPublic !== false,
          isDeleted: it?.isDeleted === true,
          createdBy: it?.createdBy || it?.user || undefined,
          images: Array.isArray(it?.images) ? it.images : undefined,
          videos: Array.isArray(it?.videos) ? it.videos : undefined,
          audios: Array.isArray(it?.audios) ? it.audios : undefined,
        }
        if (!cancelled) setPreviewFullItem(normalized)
      } catch (e) {
        if (!cancelled) setPreviewFullItem(null)
      }
    }
    if (preview?.id) {
      setPreviewFullItem(null)
      fetchDetails(preview.id)
    } else {
      setPreviewFullItem(null)
    }
    return () => { cancelled = true }
  }, [preview?.id])

  const filtered = useMemo(() => {
    if (active === 'All') return items;
    return items.filter((i) => i.categories.includes(active));
  }, [active, items]);

  // Mobile: show only first 10 images; other screens keep existing limit (20)
  const limited = useMemo(() => filtered.slice(0, isMobile ? 10 : 20), [filtered, isMobile]);
  // Ensure overlay remains on mobile; desktop/tablet follow previous rule
  const showOverlay = useMemo(() => isMobile ? true : (active === 'All' && limited.length >= 12), [isMobile, active, limited]);

  // Staggered reveal like ArtStation
  const [visibleTiles, setVisibleTiles] = useState<Set<string>>(new Set());
  const revealRefs = useRef<Record<string, HTMLDivElement | null>>({});
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
  }, [limited])

  // Mimic category-wise loading like ArtStation when switching categories
  useEffect(() => {
    setLoading(true)
    const id = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(id)
  }, [active])

  return (
    <section className={`w-full md:-pt-10 md:-mb-10 ${className}`}>
      <h2 className="text-2xl md:text-4xl font-medium text-white md:mb-5">
        Community Creations
      </h2>

       {/* Filter bar + Explore link */}
       <div className="md:mb-6">
         <div className="flex items-center gap-2 flex-nowrap md:flex-wrap overflow-x-auto md:overflow-x-visible scrollbar-none pb-1.5 md:pb-2 md:gap-3">
          {CHIPS.map((chip, idx) => {
            const isActive = chip.key === active;
            return (
              <Chip
                key={`${chip.label}-${idx}`}
                active={isActive}
                onClick={() => setActive(chip.key)}
              >
                {chip.label}
              </Chip>
            );
          })}
          <div className="ml-auto">
            <button
              onClick={() => router.push('/view/ArtStation')}
              className="shrink-0 text-white/80 hover:text-white text-xs md:text-sm font-medium transition-colors"
              title="Explore Art Station"
            >
              Explore Art Station →
            </button>
          </div>
        </div>
      </div>

      {/* Masonry grid with conditional overlay */}
        <div className="relative">
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-4 gap-2 sm:gap-1 [overflow-anchor:none]">
          {limited.map((item, idx) => (
            <Card
              key={item.id}
              item={item}
              isVisible={visibleTiles.has(item.id)}
              setRef={(el) => { if (el) { el.style.transitionDelay = `${(idx % 12) * 35}ms`; el.dataset.revealId = item.id; revealRefs.current[item.id] = el } }}
              onClick={() => setPreview(item)}
            />
          ))}
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center py-6 md:py-8">
              <div className="inline-block animate-spin rounded-full h-7 w-7 md:h-8 md:w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2 text-sm md:text-base">{active === 'All' ? 'Loading...' : `Loading ${active}...`}</p>
            </div>
          </div>
        )}
        {showOverlay && (
          <>
            {/* Explore Art Station Overlay - positioned over the images */}
            <div className="absolute bottom-0 left-0 right-0 h-[18rem] md:h-[32rem] bg-gradient-to-t from-black/70 via-black/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-48 md:h-80 bg-gradient-to-t from-black/40 via-black/60 to-transparent z-10 pointer-events-none" />
            {/* Clickable text overlay - centered in the gradient */}
            <div onClick={() => router.push('/view/ArtStation')} className="absolute bottom-0 left-0 right-0 h-[18rem] md:h-[32rem] flex items-center justify-center z-20 cursor-pointer group pointer-events-auto px-4">
              <div className="text-center">
                <h3 className="text-xl md:text-4xl lg:text-5xl font-bold text-white mb-1 md:mb-2">
                  Explore Art Station
                </h3>
                <p className="text-white/80 text-xs md:text-lg font-medium">
                  Discover more amazing creations
                </p>
                <button className="mt-3 md:mt-4 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-white/90 transition-colors">
                  Explore Now
                </button>
              </div>
            </div>
          </>
        )}
        {/* Preview Modal */}
        {preview && (() => {
          const src = preview.src || ''
          const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)
          const isAudio = /\.(mp3|wav|m4a|flac|aac|ogg|pcm)(\?|$)/i.test(src)
          const kind: 'image' | 'video' | 'audio' = isAudio ? 'audio' : isVideo ? 'video' : 'image'

          const isSelf = Boolean(preview.createdBy) && Boolean(currentUser?.username) && (preview.createdBy === currentUser?.username || preview.createdBy === currentUser?.displayName)

          const bridgeItem: PublicItem = {
            id: preview.id,
            prompt: preview.prompt,
            generationType: kind === 'image' ? 'text-to-image' : kind === 'video' ? 'text-to-video' : 'text-to-music',
            model: previewFullItem?.model,
            createdAt: previewFullItem?.createdAt,
            updatedAt: previewFullItem?.updatedAt,
            isPublic: true,
            isDeleted: false,
            createdBy: { 
              username: previewFullItem?.createdBy?.username || preview.createdBy || currentUser?.username || 'User',
              displayName: previewFullItem?.createdBy?.displayName || preview.createdBy || currentUser?.displayName,
              uid: previewFullItem?.createdBy?.uid || (isSelf ? currentUid || undefined : undefined),
              photoURL: previewFullItem?.createdBy?.photoURL || (isSelf ? currentUser?.photoURL : undefined),
            },
            aspectRatio: previewFullItem?.aspectRatio,
            frameSize: previewFullItem?.frameSize,
            aspect_ratio: previewFullItem?.aspect_ratio,
            images: (previewFullItem?.images && previewFullItem.images.length > 0) ? previewFullItem.images : (kind === 'image' ? [{ id: '0', url: src }] : []),
            videos: (previewFullItem?.videos && previewFullItem.videos.length > 0) ? previewFullItem.videos : (kind === 'video' ? [{ id: '0', url: src }] : []),
            audios: (previewFullItem?.audios && previewFullItem.audios.length > 0) ? previewFullItem.audios : (kind === 'audio' ? [{ id: '0', url: src }] : []),
          }

          // Prefer type based on enriched item if available
          const resolvedKind: 'image' | 'video' | 'audio' = (bridgeItem.videos && bridgeItem.videos.length) ? 'video' : (bridgeItem.images && bridgeItem.images.length) ? 'image' : 'audio'
          const firstMedia = (resolvedKind === 'video') ? bridgeItem.videos?.[0] : (resolvedKind === 'image') ? bridgeItem.images?.[0] : (bridgeItem as any).audios?.[0]
          const cards = [{ item: bridgeItem, media: firstMedia || { id: '0', url: src }, kind: resolvedKind }]

          const confirmDelete = async (item: PublicItem) => {
            try {
              const who = item?.createdBy?.uid || ''
              const me = currentUid
              if (!me || who !== me) {
                alert('You can delete only your own generation')
                return
              }
              const ok = confirm('Delete this generation permanently? This cannot be undone.')
              if (!ok) return
              const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
              const res = await fetch(`${baseUrl}/api/generations/${item.id}`, { method: 'DELETE', credentials: 'include' })
              if (!res.ok) {
                const t = await res.text()
                throw new Error(t || 'Delete failed')
              }
              setPreview(null)
              alert('Deleted successfully')
            } catch (e) {
              console.error('Delete error', e)
              alert('Failed to delete generation')
            }
          }

          return (
            <ArtStationPreview
              preview={{ kind: resolvedKind, url: (firstMedia as any)?.url || src, item: bridgeItem }}
              onClose={() => setPreview(null)}
              onConfirmDelete={confirmDelete}
              currentUid={currentUid}
              currentUser={currentUser}
              cards={cards}
              likedCards={likedCards}
              toggleLike={toggleLike}
            />
          )
        })()}
      </div>
    </section>
  );
}
