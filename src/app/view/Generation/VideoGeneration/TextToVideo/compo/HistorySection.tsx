"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from "@/types/history";
import { Trash2 } from "lucide-react";
import { getCleanPrompt, copyPrompt, isVideoUrl, normalizeGenerationType, isVideoType } from "../utils/videoUtils";
import VideoGenerationGuide from "./VideoGenerationGuide";
import HistoryControls from "./HistoryControls";
import { useAppSelector } from "@/store/hooks";

const GifLoader: React.FC<{ size?: number; alt?: string; className?: string }> = ({ size = 64, alt = 'Loading', className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/styles/Logo.gif"
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        unoptimized
      />
    </div>
  );
};

interface HistorySectionProps {
  loading: boolean;
  showHistory: boolean;
  historyEntries: HistoryEntry[];
  hasMore: boolean;
  loadMore: () => void;
  // External handlers
  onDeleteVideo?: (e: React.MouseEvent, entry: HistoryEntry) => void;
  onVideoClick?: (entry: HistoryEntry, video: any) => void;
  // Local state/ref passed down if strictly necessary, or internalize
  // We'll internalize scrolling refs as much as possible, or accept props if parent controls scroll
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  // Used for "today's video" preview logic
  localVideoPreview?: {
    id: string;
    firebaseHistoryId?: string;
    status: string; // Added status for types
    images?: any[];
  } | null;
  // Multiple active generations from Redux
  activeGenerations?: any[];
  onSearch: (query: string) => void;
  onSortChange: (sort: any) => void;
  onDateChange: (range: any) => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  loading,
  showHistory,
  historyEntries,
  hasMore,
  loadMore,
  onDeleteVideo,
  onVideoClick,
  localVideoPreview,
  activeGenerations = [],
  onSearch,
  onSortChange,
  onDateChange
}) => {
  // Intersection Observer for Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-grouping logic
  const todayKey = new Date().toDateString();
  const sortOrder = useAppSelector((state: any) => state.history?.filters?.sortOrder || "desc");

  console.log('[HistorySection DEBUG] Render:', {
    activeGenerationsLength: activeGenerations?.length,
    activeGenerations: activeGenerations,
    todayKey
  });

  const { groupedByDate, sortedDates } = useMemo(() => {
    const groups: Record<string, Array<{ entry: HistoryEntry; video: any }>> = {};

    console.log('[HistorySection DEBUG] useMemo start:', {
      historyEntriesCount: historyEntries.length,
      activeGenerationsCount: activeGenerations?.length
    });

    // 1. Process History Entries
    historyEntries.forEach((entry) => {
      const date = new Date(entry.timestamp || entry.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }

      let mediaItems: any[] = [];
      if (Array.isArray(entry.videos) && entry.videos.length > 0) {
        mediaItems = entry.videos;
      } else if (Array.isArray(entry.images) && entry.images.length > 0) {
        mediaItems = entry.images.filter(m => isVideoUrl(m?.firebaseUrl || m?.url || m?.originalUrl));
      }

      if (mediaItems.length === 0) {
        // If it's a "generating" history entry with no media yet, add it as a placeholder
        if (entry.status === 'generating') {
          groups[date].push({ entry, video: null });
        }
      } else {
        mediaItems.forEach(video => {
          groups[date].push({ entry, video });
        });
      }
    });

    // 2. Process Active Generations (Deduplicate against History)
    activeGenerations?.forEach(gen => {
      // Keep only pending/generating
      if (gen.status !== 'pending' && gen.status !== 'generating') return;

      // Type-Safety: Only show video types on this page
      if (!isVideoType(gen)) return;

      const genId = String(gen.id);
      const historyId = String(gen.historyId || '');
      const idsToMatch = [genId, historyId].filter(id => id && id !== 'undefined');

      // Skip if already represented in history
      const alreadyInHistory = historyEntries.some(e =>
        idsToMatch.includes(String(e.id)) ||
        (e as any).firebaseHistoryId && idsToMatch.includes(String((e as any).firebaseHistoryId))
      );

      if (alreadyInHistory) return;

      const genDate = new Date(gen.createdAt || Date.now()).toDateString();
      if (!groups[genDate]) {
        groups[genDate] = [];
      }

      // Create a dummy HistoryEntry for the placeholder card
      const placeholderEntry: HistoryEntry = {
        id: genId,
        prompt: gen.prompt,
        model: gen.model,
        status: 'generating',
        timestamp: new Date(gen.createdAt || Date.now()).toISOString(),
        createdAt: new Date(gen.createdAt || Date.now()).toISOString(),
        generationType: 'text-to-video' as any,
        images: [],
        videos: [],
        imageCount: 1,
        generationProgress: gen.progress ? {
          current: Math.round(gen.progress * 100),
          total: 100,
          status: gen.status
        } : undefined
      };

      groups[genDate].unshift({ entry: placeholderEntry, video: null });
      console.log('[HistorySection DEBUG] Added active gen placeholder (unshifted):', genId);
    });

    const sorted = Object.keys(groups).sort((a, b) => {
      const diff = new Date(a).getTime() - new Date(b).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });

    console.log('[HistorySection DEBUG] Final sortedDates:', sorted);

    return { groupedByDate: groups, sortedDates: sorted };
  }, [historyEntries, sortOrder, activeGenerations]);

  // Infinite Scroll Observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]); // Re-attach when data changes/state changes

  if (!showHistory) return null;

  return (
    <div
      ref={scrollRef}
      className="relative inset-0 pl-[0] pr-0 overflow-y-auto no-scrollbar z-0"
      style={{ height: 'calc(100vh - 80px)' }} // Adjust height as needed or let parent control layout
    >
      {/* Desktop: Search, Sort, and Date controls (Fixed Header) */}
      {/* <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/90">Generation History</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">
                {historyEntries.length} items
              </span>
            </div>
          </div>
          <HistoryControls
            mode="video"
            onSearchChange={onSearch}
            onSortChange={onSortChange}
            onDateChange={onDateChange}
          />
        </div>
      </div> */}

      {/* Guide when empty */}
      {!loading && historyEntries.length === 0 && sortedDates.length === 0 && activeGenerations.length === 0 && (
        <VideoGenerationGuide />
      )}

      {sortedDates.map((date) => (
        <div key={date} className="md:space-y-4 space-y-2 mb-8">
          {/* Date Header */}
          <div className="flex items-center md:gap-3 gap-2 px-0 pt-0">
            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white/60"
              >
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-white/70">
              {(() => {
                const dateObj = new Date(date);
                const isToday = dateObj.toDateString() === new Date().toDateString();
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                return isToday ? `Today, ${formattedDate}` : `${dateObj.toLocaleDateString("en-US", { weekday: 'short' })}, ${formattedDate}`;
              })()}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 pl-1">
            {/* Combined History Items and Active Placeholders */}
            {groupedByDate[date].map(({ entry, video }, videoIdx) => {
              const uniqueVideoKey = video?.id
                ? `${entry.id}-${video.id}`
                : `${entry.id}-item-${videoIdx}`;

              // Handle Placeholder (Generating/Pending)
              if (!video) {
                console.log('[HistorySection DEBUG] Rendering placeholder card in grid:', entry.id);
                return (
                  <div
                    key={uniqueVideoKey}
                    className="aspect-square relative rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-blue-500/50 flex flex-col items-center justify-center p-4 group transition-all duration-300"
                  >
                    <div className="shimmer absolute inset-0 opacity-30" />
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                      <GifLoader size={64} alt="Generating" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">
                            {entry.model || 'Generating'}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/60 line-clamp-2 px-2 italic font-medium">
                          {entry.prompt}
                        </p>
                      </div>
                      {entry.status === 'generating' && entry.generationProgress && (
                        <div className="w-20 bg-white/10 rounded-full h-1 mt-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${entry.generationProgress.current}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Handle Completed Video
              const videoUrl = video.firebaseUrl || video.url || video.originalUrl;
              if (!videoUrl) return null;

              return (
                <div
                  key={uniqueVideoKey}
                  onClick={() => onVideoClick?.(entry, video)}
                  className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
                >
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => { })}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                  {/* Controls Overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => copyPrompt(e, getCleanPrompt(entry.prompt))}
                      className="p-1.5 bg-black/60 rounded-md hover:bg-black/80 text-white"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                    </button>
                    <button
                      onClick={(e) => onDeleteVideo?.(e, entry)}
                      className="p-1.5 bg-red-500/80 rounded-md hover:bg-red-600 text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Prompt overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-[10px] text-white/90 line-clamp-2">{entry.prompt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}


      {/* Loader for scroll loading - centered in viewport */}
      {hasMore && loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/styles/Logo.gif"
              alt="Generating"
              width={80}
              height={80}
              className="mx-auto"
              unoptimized
            />
            <div className="text-xl text-white/80 font-medium">
              Loading more generations...
            </div>
          </div>
        </div>
      )}
      {/* Sentinel for IO-based infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
};

export default HistorySection;
