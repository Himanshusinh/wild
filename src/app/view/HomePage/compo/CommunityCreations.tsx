'use client';

// components/CommunityCreations.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from "next/image";

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
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
        active
          ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
          : 'bg-gradient-to-b from-black/5 dark:from-white/5 to-black/5 dark:to-white/5 border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
      }`}
    >
      {leftIcon && <span className="text-white/90">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="text-white/90">{rightIcon}</span>}
    </button>
  );
}

/* ---------- Card (unchanged) ---------- */
function Card({ item, isVisible, setRef }: { item: Creation; isVisible: boolean; setRef: (el: HTMLDivElement | null) => void }) {
  const ratio = item.width && item.height ? item.height / item.width : 4 / 5;
  const src = item.src || ''
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)
  const isAudio = /\.(mp3|wav|m4a|flac|aac|ogg|pcm)(\?|$)/i.test(src)

  return (
    <div className="break-inside-avoid mb-5">
      <div className="relative w-full rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-black/5 dark:bg-white/5 group transition-colors duration-300">
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
              const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/';
              const path = src.startsWith(ZATA_PREFIX) ? src.substring(ZATA_PREFIX.length) : src;
              const proxied = `/api/proxy/media/${encodeURIComponent(path)}`;
              return (
                <video src={proxied} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay loop />
              );
            })()
          ) : (
            <Image
              src={src}
              alt={item.prompt ?? "creation"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-xl bg-black/40 backdrop-blur-sm p-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
            <div className="flex items-center justify-between">
              <p className="text-[13px] leading-snug text-white/90 line-clamp-2">
                {item.prompt ?? "—"}
              </p>
            </div>
            {item.createdBy && (
              <div className="mt-2 text-white/80 text-xs">By {item.createdBy}</div>
            )}
          </div>
        </div>
        <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-white/20 rounded-2xl pointer-events-none transition" />
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
  const [active, setActive] = useState<Category>(initialFilter);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const filtered = useMemo(() => {
    if (active === 'All') return items;
    return items.filter((i) => i.categories.includes(active));
  }, [active, items]);

  // Limit to ~4-5 rows (with 4 columns ≈ 16-20 items)
  const limited = useMemo(() => filtered.slice(0, 20), [filtered]);
  const showOverlay = useMemo(() => active === 'All' && limited.length >= 12, [active, limited]);

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
    <section className={`w-full ${className}`}>
      <h2 className="text-4xl md:text-4xl font-medium text-black dark:text-white mb-5">
        Community Creations
      </h2>

      {/* Filter bar + Explore link */}
      <div className="mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
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
              className="shrink-0 text-white/80 hover:text-white text-sm font-medium transition-colors"
              title="Explore Art Station"
            >
              Explore Art Station →
            </button>
          </div>
        </div>
      </div>

      {/* Masonry grid with conditional overlay */}
      <div className="relative">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-4 gap-1 [overflow-anchor:none]">
          {limited.map((item, idx) => (
            <Card
              key={item.id}
              item={item}
              isVisible={visibleTiles.has(item.id)}
              setRef={(el) => { if (el) { el.style.transitionDelay = `${(idx % 12) * 35}ms`; el.dataset.revealId = item.id; revealRefs.current[item.id] = el } }}
            />
          ))}
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2">{active === 'All' ? 'Loading...' : `Loading ${active}...`}</p>
            </div>
          </div>
        )}
        {showOverlay && (
          <>
            {/* Explore Art Station Overlay - positioned over the images */}
            <div className="absolute bottom-0 left-0 right-0 h-[28rem] md:h-[32rem] bg-gradient-to-t from-black/70 via-black/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-64 md:h-80 bg-gradient-to-t from-black/40 via-black/60 to-transparent z-10 pointer-events-none" />
            {/* Clickable text overlay - centered in the gradient */}
            <div onClick={() => router.push('/view/ArtStation')} className="absolute bottom-0 left-0 right-0 h-[28rem] md:h-[32rem] flex items-center justify-center z-20 cursor-pointer group pointer-events-auto">
              <div className="text-center">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                  Explore Art Station
                </h3>
                <p className="text-white/80 text-lg font-medium">
                  Discover more amazing creations
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
