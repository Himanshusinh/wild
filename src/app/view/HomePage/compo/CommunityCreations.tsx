'use client';

// components/CommunityCreations.tsx
import React, { useMemo, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from "next/image";

/* ---------- Types ---------- */
type Category =
  | "Trending"
  | "All"
  | "Upscaled"
  | "Video"
  | "Photography"
  | "Animals"
  | "Food"
  | "Character";

export interface Creation {
  id: string;
  src: string;
  prompt?: string;
  categories: Category[];
  width?: number;
  height?: number;
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

/* ---------- Chip meta for ordering & separators ---------- */
const CHIPS: { key: Category; label: string; icon: React.ReactElement; group?: string }[] = [
  { key: "Trending", label: "Trending", icon: Icon.fire, group: "A" },
  { key: "All", label: "All", icon: Icon.grid, group: "B" },
  { key: "Upscaled", label: "Upscaled", icon: Icon.grid, group: "B" },
  { key: "Video", label: "Video", icon: Icon.video, group: "B" },
  { key: "All", label: "All", icon: Icon.grid, group: "C" }, // if you want a second "All" like the screenshot; remove if not needed
  { key: "Photography", label: "Photography", icon: Icon.camera, group: "C" },
  { key: "Animals", label: "Animals", icon: Icon.paw, group: "C" },
  { key: "Food", label: "Food", icon: Icon.burger, group: "C" },
  { key: "Character", label: "Character", icon: Icon.user, group: "C" },
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
      className={[
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all",
        "border border-white/10",
        active
          ? "bg-[#2D6CFF] border-[#2D6CFF] text-white shadow-sm"
          : "bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10",
      ].join(" ")}
    >
      {leftIcon && <span className="text-white/90">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="text-white/90">{rightIcon}</span>}
    </button>
  );
}

/* ---------- Card (unchanged) ---------- */
function Card({ item }: { item: Creation }) {
  const ratio = item.width && item.height ? item.height / item.width : 4 / 5;
  return (
    <div className="break-inside-avoid mb-5">
      <div className="relative w-full rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5 group">
        <div style={{ aspectRatio: `${1 / ratio}` }}>
          <Image
            src={item.src}
            alt={item.prompt ?? "creation"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-xl bg-black/40 backdrop-blur-sm p-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
            <p className="text-[13px] leading-snug text-white/90 line-clamp-2">
              {item.prompt ?? "—"}
            </p>
            <div className="mt-3">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D6CFF] hover:bg-[#255fe6] text-white text-sm font-medium py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9" />
                  <path d="M3 3v6h6" />
                </svg>
                Remix
              </button>
            </div>
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
  initialFilter = "Trending",
  className = "",
}: {
  items: Creation[];
  initialFilter?: Category;
  className?: string;
}) {
  const [active, setActive] = useState<Category>(initialFilter);
  const router = useRouter();

  const filtered = useMemo(() => {
    if (active === "All") return items;
    if (active === "Trending") {
      return items.filter(
        (i) =>
          i.categories.includes("Trending") ||
          i.categories.includes("Character") ||
          i.categories.includes("Photography")
      );
    }
    return items.filter((i) => i.categories.includes(active));
  }, [active, items]);

  return (
    <section className={`w-full ${className}`}>
      <h2 className="text-4xl md:text-4xl font-medium text-white mb-5">
        Community Creations
      </h2>

      {/* Filter bar — visually matches screenshot */}
      <div className="relative mb-6 -mx-2">
        <div className="flex items-center gap-3 overflow-x-auto px-2 pb-2 pt-2 scrollbar-none">
          {CHIPS.map((chip, idx) => {
            const isActive = chip.key === active;
            const next = CHIPS[idx + 1];
            const needsDivider = next && chip.group !== next.group;

            return (
              <React.Fragment key={`${chip.label}-${idx}`}>
                <Chip
                  active={isActive}
                  onClick={() => setActive(chip.key)}
                  leftIcon={chip.icon}
                  rightIcon={chip.key === "Trending" ? Icon.chevronDown : undefined}
                >
                  {chip.label}
                </Chip>

                {needsDivider && (
                  <span className="h-6 w-px bg-white/10 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Masonry grid with overlay */}
      <div className="relative">
        <div className="columns-1 sm:columns-2 md:columns-4 lg:columns-4 xl:columns-4 gap-5 ">
          {filtered.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
        
        {/* Explore Art Station Overlay - positioned over the images */}
        <div className="absolute bottom-0 left-0 right-0 h-[40rem] bg-gradient-to-t from-black/70 via-black/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-black/40 via-black/60 to-transparent z-10 pointer-events-none" />
        
        {/* Clickable text overlay - centered in the gradient */}
        <div onClick={() => router.push('/view/ArtStation')} className="absolute bottom-0 left-0 right-0 h-[40rem] flex items-center justify-center z-20 cursor-pointer group pointer-events-auto">
          <div className="text-center">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
              Explore Art Station
            </h3>
            <p className="text-white/80 text-lg font-medium">
              Discover more amazing creations
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
