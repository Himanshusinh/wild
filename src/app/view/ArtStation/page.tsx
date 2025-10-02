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

export default function ArtStationPage() {
  const [items, setItems] = useState<PublicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [preview, setPreview] = useState<{ kind: 'image' | 'video' | 'audio'; url: string; item: PublicItem } | null>(null)
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


  const fetchFeed = async (reset = false) => {
    try {
      setLoading(true)
      const url = new URL(`${API_BASE}/api/feed`)
      url.searchParams.set('limit', '10')
      if (!reset && cursor) url.searchParams.set('cursor', cursor)
      const res = await fetch(url.toString(), { 
        // Public endpoint: no credentials needed; avoid strict CORS with wildcard
        credentials: 'omit',
        headers: { 'ngrok-skip-browser-warning': 'true', 'Accept': 'application/json' }
      })
      const data = await res.json()
      const payload = data?.data || data
      const newItems: PublicItem[] = payload?.items || []
      setItems(prev => reset ? newItems : [...prev, ...newItems])
      setCursor(payload?.nextCursor)
      setError(null)
    } catch (e: any) {
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
      if (!cursor || loading || loadingMoreRef.current) return
      loadingMoreRef.current = true
      try {
        await fetchFeed(false)
      } finally {
        loadingMoreRef.current = false
      }
    }, { root: null, rootMargin: '200px', threshold: 0 })
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

  const cards = useMemo(() => {
    // Show a single representative media per generation item to avoid multiple tiles
    const seenMedia = new Set<string>()
    const seenItem = new Set<string>()
    const out: { item: PublicItem; media: any; kind: 'image'|'video'|'audio' }[] = []
    for (const it of items) {
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
  }, [items])

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-50"><Nav /></div>
      <div className="flex pt-[80px]">
        <div className="w-[68px] flex-shrink-0"><SidePannelFeatures currentView={'home' as any} onViewChange={() => {}} onGenerationTypeChange={() => {}} onWildmindSkitClick={() => {}} /></div>
        <div className="flex-1 min-w-0 px-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-white text-2xl font-semibold">Art Station</h1>
          </div>

          {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {cards.map(({ item, media, kind }, idx) => (
              <div
                key={`${item.id}-${media.id}-${idx}`}
                className="break-inside-avoid mb-4 cursor-pointer"
                onClick={() => setPreview({ kind, url: media.url, item })}
              >
                <div className="relative w-full rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 group">
                  <div className="relative" style={{ aspectRatio: '4 / 5' }}>
                    {kind === 'video' ? (
                      <video src={media.url} className="w-full h-full object-cover" controls muted />
                    ) : (
                      <Image src={media.url} alt={item.prompt || ''} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {item.createdBy?.photoURL ? (
                        <img src={item.createdBy.photoURL} alt={item.createdBy.username || ''} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/20" />
                      )}
                      <div className="text-white/90 text-sm font-medium">{item.createdBy?.displayName || item.createdBy?.username || 'User'}</div>
                    </div>
                    <div className="text-white/80 text-xs mb-1">{item.generationType} • {item.model}</div>
                    <div className="text-white/90 text-sm line-clamp-2">{cleanPromptByType(item.prompt, item.generationType)}</div>
                    <div className="text-white/50 text-xs mt-2">{new Date(item.createdAt || item.updatedAt || '').toLocaleString()}</div>
                    {/* CTA: Open generator for this item type (does not open preview) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigateForType(item.generationType); }}
                      className="mt-2 text-[11px] text-white/80 hover:text-white underline"
                    >
                      Open in generator
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Preview Modals */}
          {preview && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
              <div className="relative w-full max-w-6xl bg-black/40 ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '92vh' }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {preview.item.createdBy?.photoURL ? (
                      <img src={preview.item.createdBy.photoURL} alt={preview.item.createdBy.username || ''} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium leading-tight">{preview.item.createdBy?.displayName || preview.item.createdBy?.username || 'User'}</span>
                      <span className="text-white/60 text-[11px]">{new Date(preview.item.createdAt || preview.item.updatedAt || '').toLocaleString()}</span>
                    </div>
                  </div>
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
                    <div className="text-white/80 text-xs mb-1">{preview.item.generationType} • {preview.item.model}</div>
                    <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap pr-1">
                      {cleanPromptByType(preview.item.prompt, preview.item.generationType)}
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


