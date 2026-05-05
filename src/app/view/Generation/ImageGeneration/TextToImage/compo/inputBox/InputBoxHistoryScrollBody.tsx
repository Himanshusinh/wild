"use client";

import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Trash2, ImageIcon } from "lucide-react";
import type { HistoryEntry } from "@/types/history";
import ImageGenerationGuide from "../ImageGenerationGuide";
import { GifLoader } from "./GifLoader";
import {
  historyEntryContributesGalleryTiles,
  countGalleryCellsForEntries,
  getHistoryImageDisplaySrc,
  toGridAspectRatioCss,
} from "./historyDisplayUtils";

const EditImageInterface = dynamic(
  () => import("@/app/view/EditImage/compo/EditImageInterface"),
  { ssr: false },
);

export type InputBoxHistoryScrollBodyProps = {
  isInlineEditImagePage: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  authLoading: boolean;
  userData: unknown;
  hasAttemptedInitialLoadRef: React.MutableRefObject<boolean>;
  loading: boolean;
  isFiltering: boolean;
  historyEntries: HistoryEntry[];
  sortedDates: string[];
  activeGenerations: unknown[];
  currentFilters: unknown;
  setSearchQuery: (v: string) => void;
  setDateRange: (r: { start: Date | null; end: Date | null }) => void;
  setDateInput: (v: string) => void;
  refreshHistoryFromBackend: (next?: {
    sortOrder?: "asc" | "desc";
    dateRange?: { start: Date | null; end: Date | null };
    search?: string;
  }) => Promise<void>;
  sortOrder: "asc" | "desc";
  sortedDatesWithVisibleTiles: string[];
  groupedByDate: { [key: string]: HistoryEntry[] };
  loadedImages: Set<string>;
  setLoadedImages: React.Dispatch<React.SetStateAction<Set<string>>>;
  previousEntriesRef: React.MutableRefObject<Set<string>>;
  setPreview: (p: { entry: HistoryEntry; image: any } | null) => void;
  handleRecreate: (e: React.MouseEvent, entry: HistoryEntry) => void;
  copyPrompt: (e: React.MouseEvent, text: string) => Promise<void>;
  getCleanPrompt: (promptText: string) => string;
  handleDeleteImage: (
    e: React.MouseEvent,
    entry: HistoryEntry,
    imageId?: string,
  ) => Promise<void>;
  formatDate: (date: string) => string;
};

export function InputBoxHistoryScrollBody(props: InputBoxHistoryScrollBodyProps) {
  const {
    isInlineEditImagePage,
    sentinelRef,
    authLoading,
    userData,
    hasAttemptedInitialLoadRef,
    loading,
    isFiltering,
    historyEntries,
    sortedDates,
    activeGenerations,
    currentFilters,
    setSearchQuery,
    setDateRange,
    setDateInput,
    refreshHistoryFromBackend,
    sortOrder,
    sortedDatesWithVisibleTiles,
    groupedByDate,
    loadedImages,
    setLoadedImages,
    previousEntriesRef,
    setPreview,
    handleRecreate,
    copyPrompt,
    getCleanPrompt,
    handleDeleteImage,
    formatDate,
  } = props;

  return (
    <div>
      {isInlineEditImagePage ? (
        <div className=" px-2">
          <EditImageInterface />
        </div>
      ) : (
        <>
          {/* Show guide when no generations exist - ONLY after initial load attempt AND loading completes */}
          {((!authLoading && !userData) ||
            (userData &&
              hasAttemptedInitialLoadRef.current &&
              !loading &&
              !isFiltering &&
              historyEntries.length === 0 &&
              sortedDates.length === 0 &&
              activeGenerations.length === 0)) &&
            ((currentFilters as any)?.search ||
            (currentFilters as any)?.dateRange ? (
              <div className="flex flex-col items-center justify-center py-24 md:py-40 px-6 text-center w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#60a5fa]/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-[#60a5fa]/20">
                  <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-[#60a5fa]" />
                </div>
                <h3 className="text-xl md:text-2xl font-medium text-white mb-3">
                  No generations found
                </h3>
                <p className="text-slate-400 max-w-sm text-xs md:text-sm">
                  We couldn't find any images matching your{" "}
                  {(currentFilters as any)?.search
                    ? "search"
                    : "date filter"}
                  . Try adjusting your filters or clear them.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDateRange({ start: null, end: null });
                    setDateInput("");
                    refreshHistoryFromBackend({
                      sortOrder,
                      dateRange: { start: null, end: null },
                      search: "",
                    });
                  }}
                  className="mt-8 px-8 py-2.5 bg-[#60a5fa] text-black rounded-xl text-sm font-bold hover:bg-[#60a5fa]/90 transition-all shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                >
                  Clear all filters
                </button>
              </div>
            ) : !authLoading && !userData ? (
              <ImageGenerationGuide />
            ) : (
              !loading &&
              !isFiltering && (
                <ImageGenerationGuide />
              )
            ))}

          {/* Local preview: if no row for today yet, render a dated block so preview shows immediately */}
          {/* REMOVED: This section is now handled in the groupedByDate loop below to prevent duplicates */}

          {/* History Entries - Grouped by Date */}
          {userData && sortedDatesWithVisibleTiles.length > 0 && (
            <div className="mt-18 space-y-4 px-2 md:mt-16 md:px-0">
              {sortedDatesWithVisibleTiles.map((date) => {
                const entriesForDay = (
                  (
                    groupedByDate as {
                      [key: string]: HistoryEntry[];
                    }
                  )[date] || []
                ).filter(historyEntryContributesGalleryTiles);
                if (countGalleryCellsForEntries(entriesForDay) === 0) {
                  return null;
                }

                const cells = entriesForDay.flatMap((entry: HistoryEntry) => {
                  const entryImages: any[] = Array.isArray(
                    (entry as any)?.images,
                  )
                    ? ((entry as any).images as any[])
                    : [];

                  return entryImages.map((image: any, imgIdx: number) => {
                    const uniqueImageKey = image?.id
                      ? `${entry.id}-${image.id}`
                      : `${entry.id}-img-${imgIdx}`;
                    const uniqueImageId =
                      image?.id || `${entry.id}-img-${imgIdx}`;
                    const isImageLoaded =
                      loadedImages.has(uniqueImageKey);

                    const imageDisplaySrc =
                      getHistoryImageDisplaySrc(image);
                    const hasImageUrl = imageDisplaySrc.length > 0;
                    const isGeneratingStatus =
                      (entry.status as string) === "generating" ||
                      (entry.status as string) === "pending";
                    const shouldShowLoading =
                      isGeneratingStatus ||
                      (entry.status === "completed" &&
                        hasImageUrl &&
                        !isImageLoaded) ||
                      (!hasImageUrl && isGeneratingStatus);

                    const isNewEntry =
                      !previousEntriesRef.current.has(entry.id);

                    return (
                      <div
                        key={uniqueImageKey}
                        data-image-id={uniqueImageId}
                        onClick={() => setPreview({ entry, image })}
                        className={`image-item rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 cursor-pointer group ${
                          isNewEntry ? "animate-fade-in-up" : ""
                        }`}
                        style={{
                          aspectRatio: toGridAspectRatioCss(
                            entry.frameSize as string | undefined,
                          ),
                          ...(isNewEntry
                            ? {
                                animation:
                                  "fadeInUp 0.6s ease-out forwards",
                                opacity: 0,
                              }
                            : {}),
                        }}
                        draggable={true}
                        onDragStart={(e) => {
                          const url = imageDisplaySrc;
                          if (url) {
                            e.dataTransfer.setData("text/plain", url);
                            e.dataTransfer.setData("text/uri-list", url);
                            e.dataTransfer.effectAllowed = "copy";
                          }
                        }}
                        onAnimationEnd={(e) => {
                          if (isNewEntry) {
                            e.currentTarget.style.opacity = "1";
                          }
                        }}
                      >
                        {entry.status === "failed" ? (
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-black/90"
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-red-400"
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <div className="text-xs text-red-400">
                                Failed
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {hasImageUrl && (
                              <div className="absolute inset-0 group">
                                <img
                                  src={imageDisplaySrc}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onLoad={() => {
                                    setLoadedImages((prev) =>
                                      new Set(prev).add(uniqueImageKey),
                                    );
                                  }}
                                />
                                {!isImageLoaded && (
                                  <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                )}
                                <div className="pointer-events-none absolute bottom-1.5 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <button
                                    aria-label="Recreate image"
                                    className="pointer-events-auto p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                    onClick={(e) =>
                                      handleRecreate(e, entry)
                                    }
                                    onMouseDown={(e) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <Image
                                      src="/icons/recreate.svg"
                                      alt="Recreate"
                                      width={18}
                                      height={18}
                                      className="w-5 h-5"
                                    />
                                  </button>
                                </div>
                                <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                  <button
                                    aria-label="Copy prompt"
                                    className="pointer-events-auto p-1 px-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyPrompt(
                                        e,
                                        getCleanPrompt(entry.prompt),
                                      );
                                    }}
                                    onMouseDown={(e) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                    </svg>
                                  </button>
                                  <button
                                    aria-label="Delete image"
                                    className="pointer-events-auto p-1.5 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                    onClick={(e) =>
                                      handleDeleteImage(e, entry)
                                    }
                                    onMouseDown={(e) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {!hasImageUrl && isGeneratingStatus && (
                              <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                            )}

                            {shouldShowLoading && (
                              <div
                                className="absolute inset-0 flex items-center justify-center bg-black/90 z-10"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <GifLoader
                                    size={64}
                                    alt="Generating"
                                  />
                                  <div className="text-xs text-white/60 text-center">
                                    {isGeneratingStatus
                                      ? "Generating..."
                                      : "Loading..."}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    );
                  });
                });

                if (cells.length === 0) return null;

                return (
                <div key={date} className="space-y-2  md:mt-0">
                  {/* Date Header */}
                  <div className="flex items-center pt-1 md:pt-0 px-2 md:mx-8  md:gap-2 gap-2">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
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
                    <h3 className="text-xs md:text-sm font-medium text-white/70">
                      {formatDate(date)}
                    </h3>
                  </div>

                  {/* All Images for this Date - Simple Grid with stable layout */}
                  <div
                    className="image-grid md:ml-9 ml-0"
                    key={`grid-${date}`}
                  >
                    {cells}
                  </div>
                </div>
                );
              })}

              {/* Scroll pagination loading indicator */}
              {loading && historyEntries.length > 0 && (
                <div className="flex items-center justify-center pt-8 pb-48 md:pb-48">
                  <div className="flex flex-col items-center md:gap-3 gap-2">
                    <GifLoader size={80} alt="Loading more" />
                    <div className="text-white/70 md:text-lg text-sm">
                      Loading more generations...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/* Infinite scroll sentinel inside scroll container */}
      <div ref={sentinelRef} style={{ height: 24 }} />
    </div>
  );
}
