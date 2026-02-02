"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from "@/types/history";
import { Trash2 } from "lucide-react";
import { getCleanPrompt, copyPrompt } from "../utils/videoUtils";
import VideoGenerationGuide from "./VideoGenerationGuide";
import HistoryControls from "./HistoryControls";

// Local helper to normalize generation type
const normalizeGenerationType = (type: string | undefined): string => {
  if (!type) return "";
  return type.replace(/[_-]/g, "-").toLowerCase();
};

interface HistorySectionProps {
  loading: boolean;
  showHistory: boolean;
  historyEntries: HistoryEntry[];
  hasMore: boolean;
  loadMore: () => void;
  // External handlers
  onDeleteVideo: (e: React.MouseEvent, entry: HistoryEntry) => void;
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
  localVideoPreview,
  onSearch,
  onSortChange,
  onDateChange
}) => {
  // Intersection Observer for Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-grouping logic
  const todayKey = new Date().toDateString();

  const { groupedByDate, sortedDates } = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    historyEntries.forEach((entry) => {
      const date = new Date(entry.timestamp || entry.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });

    // Sort dates descending
    const sorted = Object.keys(groups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return { groupedByDate: { groups }, sortedDates: sorted };
  }, [historyEntries]);


  // Track loaded videos for metadata
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());

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
      className="inset-0 pl-[0] pr-0 overflow-y-auto no-scrollbar z-0"
      style={{ height: 'calc(100vh - 80px)' }} // Adjust height as needed or let parent control layout
    >
      {/* Initial loading overlay - show only when actually loading and no entries exist */}
      {loading && historyEntries.length === 0 && (
        <div className="fixed top-[64px] md:top-[0px] left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-2 md:px-4">
            <Image
              src="/styles/Logo.gif"
              alt="Loading"
              width={72}
              height={72}
              className="mx-auto"
              unoptimized
            />
            <div className="text-white text-lg text-center">
              Loading generations...
            </div>
          </div>
        </div>
      )}

      {/* Desktop: Search, Sort, and Date controls (Fixed Header) */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
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
      </div>

      {/* Guide when empty */}
      {/* We need a prop to know if initial load finished effectively */}
      {!loading && historyEntries.length === 0 && sortedDates.length === 0 && !localVideoPreview && (
        <VideoGenerationGuide />
      )}

      {sortedDates.map((date) => (
        <div key={date} className="md:space-y-4 space-y-1 mb-8">
          {/* Date Header */}
          <div className="flex items-center md:gap-3 gap-2 px-3 pt-4">
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
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </h3>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-1 md:mb-0 mb-4 pl-1">
            {/* Local Preview Logic (condensed) */}
            {date === todayKey &&
              localVideoPreview &&
              (() => {
                const localEntryId = localVideoPreview.id;
                const localFirebaseId = localVideoPreview.firebaseHistoryId;

                // Check duplicates against history
                const exists = historyEntries.some(
                    e => e.id === localEntryId || (e as any).firebaseHistoryId === localFirebaseId
                );

                if (exists) return null; // Don't show local if it's already in history

                return (
                 <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-800 animate-pulse ring-1 ring-blue-500/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-xs text-blue-200">Processing...</span>
                    </div>
                 </div>
                );
              })()}
            
            {/* History Items */}
            {(groupedByDate.groups[date] || []).map((entry) => {
                 let mediaItems: any[] = [];
                 if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
                   mediaItems = entry.images;
                 } else if (entry.videos && Array.isArray(entry.videos) && entry.videos.length > 0) {
                   mediaItems = entry.videos;
                 }

                 return mediaItems.map((video, videoIdx) => {
                     const uniqueVideoKey = video?.id ? `${entry.id}-${video.id}` : `${entry.id}-video-${videoIdx}`;
                     const videoUrl = video.firebaseUrl || video.url;
                     if (!videoUrl) return null;

                     return (
                         <div key={uniqueVideoKey} className="relative group aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/10">
                              <video 
                                src={videoUrl}
                                className="w-full h-full object-cover"
                                loop
                                muted
                                playsInline
                                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
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
                                      {/* Copy Icon */}
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                  </button>
                                  <button 
                                    onClick={(e) => onDeleteVideo(e, entry)}
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
                 });
            })}
          </div>
        </div>
      ))}

      {/* Loader for scroll loading */}
      {hasMore && loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/styles/Logo.gif"
              alt="Generating"
              width={56}
              height={56}
              className="mx-auto"
              unoptimized
            />
            <div className="text-sm text-white/60">
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
