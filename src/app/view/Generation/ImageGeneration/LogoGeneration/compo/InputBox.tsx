"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setPrompt
 } from '@/store/slices/generationSlice';
import { bflGenerate, falGenerate } from '@/store/slices/generationsApi';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import { useGenerationCredits } from '@/hooks/useCredits';
import { 
  loadMoreHistory,
  loadHistory,
  clearHistory,
} from "@/store/slices/historySlice";
// Frontend history writes removed; rely on backend history service
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
// No-op action creators to satisfy existing dispatch calls without affecting store
const updateHistoryEntry = (_: any) => ({ type: "history/noop" } as any);
const addHistoryEntry = (_: any) => ({ type: "history/noop" } as any);

// Import the logo-specific components
import ModelsDropdown from "./ModelsDropdown";
import LogoCountDropdown from "./LogoCountDropdown";
import LogoImagePreview from "./LogoImagePreview";

const InputBox = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "flux-kontext-pro"
  );
  const imageCount = useAppSelector(
    (state: any) => state.generation?.imageCount || 1
  );
  const isGenerating = useAppSelector(
    (state: any) => state.generation?.isGenerating || false
  );
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown
  );
  const historyEntries = useAppSelector(
    (state: any) => state.history?.entries || []
  );
  const loading = useAppSelector(
    (state: any) => state.history?.loading || false
  );
  const hasMore = useAppSelector(
    (state: any) => state.history?.hasMore ?? true
  );
  const theme = useAppSelector((state: any) => state.ui?.theme || "dark");

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits("image", selectedModel, {
    frameSize: "1:1", // Logo generation typically uses square aspect ratio
    count: imageCount,
  });

  // Local state for preview modal
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);

  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<
    HistoryEntry[]
  >([]);

  // Local state to track generation status for button text
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);

  // Auto-clear local preview after it has completed/failed and backend history refresh kicks in
  useEffect(() => {
    const entry = localGeneratingEntries[0] as any;
    if (!entry) return;
    if (entry.status === "completed" || entry.status === "failed") {
      const timer = setTimeout(() => setLocalGeneratingEntries([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [localGeneratingEntries]);

  // Load history on mount
  useEffect(() => {
    console.log('[Logo] useEffect: mount -> clearing and loading logo history');
    (async () => {
      try {
        dispatch(clearHistory());
        console.log('[Logo] dispatched clearHistory');
        const result: any = await (dispatch as any)(loadHistory({ 
          filters: { generationType: 'logo' }, 
          paginationParams: { limit: 50 } 
        })).unwrap();
        console.log('[Logo] initial loadHistory fulfilled', { received: result?.entries?.length, hasMore: result?.hasMore });
      } catch (e) {
        console.error('[Logo] initial loadHistory error', e);
      }
    })();
  }, [dispatch]);

  // Mark user scroll
  useEffect(() => {
    const onScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  // IntersectionObserver-based infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (!hasUserScrolledRef.current) {
        console.log('[Logo] IO: skip until user scrolls');
        return;
      }
      if (!hasMore || loading || loadingMoreRef.current) {
        console.log('[Logo] IO: skip loadMore', { hasMore, loading, busy: loadingMoreRef.current });
        return;
      }
      loadingMoreRef.current = true;
      console.log('[Logo] IO: loadMore start');
      try {
        await (dispatch as any)(loadMoreHistory({ 
          filters: { generationType: 'logo' }, 
          paginationParams: { limit: 10 } 
        })).unwrap();
      } catch (e) {
        console.error('[Logo] IO: loadMore error', e);
      } finally {
        loadingMoreRef.current = false;
      }
    }, { root: null, threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Set local generation state immediately
    setIsGeneratingLocally(true);

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log("✅ Credits reserved for logo generation:", creditResult);
    } catch (creditError: any) {
      console.error("❌ Credit validation failed:", creditError);
      dispatch(
        addNotification({
          type: "error",
          message: creditError.message || "Insufficient credits for generation",
        })
      );
      setIsGeneratingLocally(false);
      return;
    }

    // Create local preview entry immediately
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`,
      prompt: `Logo: ${prompt}`,
      model: selectedModel,
      generationType: "logo",
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: "",
        originalUrl: "",
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: "generating",
    };

    // Set local preview to show loading frames immediately
    setLocalGeneratingEntries([loadingEntry]);

    try {
      let result;

      // Build the same backend prompt regardless of model
      const backendPrompt = `
Create a professional, modern logo for: ${prompt}.  

Style: Clean, minimal, vector-based design. Flat colors or smooth gradients. No clutter, no complex backgrounds.  
Focus: Strong brand identity, clear silhouette, visually balanced composition.  
Usability: Scalable, works on both light and dark backgrounds, suitable for business cards, websites, and apps.  

Art direction: Emphasize simplicity, symmetry, and timeless aesthetics. Use geometric shapes, subtle iconography, and harmonious color schemes. Avoid excessive details.  
Typography: If text is included, keep it minimal, modern sans-serif, and well-balanced with the icon.  

-- Negative Prompt: avoid 3D render, avoid photorealism, avoid cartoonish style, avoid stock icons, avoid pixelation, avoid busy backgrounds, avoid excessive text.  
Output: High-resolution vector-style logo, plain background, sharp edges.
`;

      if (selectedModel === "gemini-25-flash-image") {
        // Route to FAL (Google Nano Banana)
        result = await dispatch(
          falGenerate({
            prompt: backendPrompt,
            model: selectedModel,
            n: imageCount,
            uploadedImages: [], // Nano Banana is T2I/I2I, but for logo, we assume T2I for now
            output_format: "jpeg",
            generationType: "logo",
          })
        ).unwrap();
      } else {
        // Route to BFL (Flux models)
        result = await dispatch(
          bflGenerate({
            prompt: backendPrompt,
            model: selectedModel,
            n: imageCount,
            frameSize: "1:1",
            style: "logo",
            generationType: "logo",
          })
        ).unwrap();
      }

      // Create completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || Date.now().toString(),
        prompt: `Logo: ${prompt}`,
        model: selectedModel,
        generationType: "logo",
        images: result.images,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: imageCount,
        status: "completed",
      };

      // Update local preview to completed
      setLocalGeneratingEntries([completedEntry]);

      // Clear the prompt
      dispatch(setPrompt(""));

      // Show success notification
      dispatch(
        addNotification({
          type: "success",
          message: `Successfully generated ${imageCount} logo${
            imageCount > 1 ? "s" : ""
          }!`,
        })
      );

      // Handle credit success
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
      }

      // Refresh history to show the new logo
      dispatch(
        loadHistory({
          filters: { generationType: "logo" },
          paginationParams: { limit: 10 },
        })
      );

      // Reset local generation state
      setIsGeneratingLocally(false);
    } catch (error: any) {
      console.error("Logo generation failed:", error);

      // Update local preview to failed
      setLocalGeneratingEntries(prev => prev.map(entry => ({
        ...entry,
        status: 'failed' as const,
          error: error.message || 'Generation failed'
      })));

      // Show error notification
      dispatch(
        addNotification({
          type: "error",
          message: error.message || "Logo generation failed",
        })
      );

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }

      // Reset local generation state
      setIsGeneratingLocally(false);
    }
  };

  // Handle image preview
  const handleImageClick = (entry: HistoryEntry) => {
    setPreviewEntry(entry);
  };

  // Close preview modal
  const closePreview = () => setPreviewEntry(null);

  // Filter entries for logo generation
  const logoHistoryEntries = historyEntries.filter((entry: any) => {
    const normalize = (t: string | undefined) => (t ? t.replace(/[_-]/g, '-').toLowerCase() : '');
    const e = normalize(entry.generationType);
    return e === 'logo' || e === 'logo-generation';
  });

  console.log('[Logo] render diagnostics', {
    totalEntries: historyEntries.length,
    logoEntries: logoHistoryEntries.length,
    loading,
    hasMore
  });

  // Debug logging
  console.log("🏷️ Logo Generation - All entries:", historyEntries.length);
  console.log(
    "🏷️ Logo Generation - Filtered logo entries:",
    logoHistoryEntries.length
  );
  console.log(
    "🏷️ Logo Generation - Sample entries:",
    historyEntries.slice(0, 3).map((e: any) => ({
      id: e.id,
      generationType: e.generationType,
      prompt: e.prompt?.substring(0, 50) + "...",
      style: e.style,
    }))
  );

  // Group entries by date
  const groupedByDate = logoHistoryEntries.reduce(
    (groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
      const date = new Date(entry.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    },
    {}
  );

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Today key for local preview
  const todayKey = new Date().toDateString();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as HTMLElement).closest(".dropdown-container")
      ) {
        dispatch(toggleDropdown(""));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <>
      <div className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0">
        <div className="py-6 pl-4 ">
          {/* History Header - Fixed during scroll */}
          <div className="fixed top-0 mt-1 left-0 right-0 z-30 py-5 ml-18 mr-1 bg-white/10 backdrop-blur-xl shadow-xl pl-6 border border-white/10 rounded-2xl ">
            <h2 className="text-xl font-semibold text-white pl-0 ">
              Logo Generation History
            </h2>
          </div>
          {/* Spacer to keep content below fixed header */}
          <div className="h-0"></div>

          {/* Main Loader */}
          {loading && logoHistoryEntries.length === 0 && (
            <div className="flex items-center justify-center ">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <div className="text-white text-lg">
                  Loading your generation history...
                </div>
              </div>
            </div>
          )}

          {/* No History State */}
          {!loading && logoHistoryEntries.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-white/60"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
            </div>
                <div className="text-white text-lg">No logos generated yet</div>
                <div className="text-white/60 text-sm max-w-md">
                  Create your first AI-generated logo using the interface below
          </div>
        </div>
      </div>
          )}

          {/* History Entries - Grouped by Date */}
          {(logoHistoryEntries.length > 0 || (localGeneratingEntries.length > 0 && !groupedByDate[todayKey])) && (
            <div className=" space-y-8  ">
              {/* If there is a local preview but no row for today yet, render today's row so the tile appears immediately */}
              {localGeneratingEntries.length > 0 && !groupedByDate[todayKey] && (
                <div className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">{new Date(todayKey).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h3>
        </div>
                  <div className="flex flex-wrap gap-3 ml-9">
                    {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                      <div key={`local-only-${idx}`} className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                        {localGeneratingEntries[0].status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                              <div className="text-xs text-white/60">Generating...</div>
            </div>
          </div>
                        ) : localGeneratingEntries[0].status === 'failed' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                            <div className="flex flex-col items-center gap-2">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              <div className="text-xs text-red-400">Failed</div>
            </div>
          </div>
        ) : (
                          <div className="relative w-full h-full">
                            <Image src={image.url || image.originalUrl || '/placeholder-logo.png'} alt={localGeneratingEntries[0].prompt} fill loading="lazy" className="object-cover" sizes="192px" />
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Logo</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {sortedDates.map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-white/60"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white/70">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>

                  {/* All Images for this Date - Horizontal Layout */}
                <div className="flex flex-wrap gap-3 ml-9">
                    {/* Prepend local preview tiles at the start of today's row to push images right */}
                    {date === todayKey && localGeneratingEntries.length > 0 && (
                      <>
                        {localGeneratingEntries[0].images.map(
                          (image: any, idx: number) => (
                            <div
                              key={`local-${idx}`}
                              className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                            >
                              {localGeneratingEntries[0].status ===
                              "generating" ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                    <div className="text-xs text-white/60">
                                      Generating...
                                    </div>
                                  </div>
                                </div>
                              ) : localGeneratingEntries[0].status ===
                                "failed" ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
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
                                <div className="relative w-full h-full">
                                  <Image
                                    src={
                                      image.url ||
                                      image.originalUrl ||
                                      "/placeholder-logo.png"
                                    }
                                    alt={localGeneratingEntries[0].prompt}
                                    fill
                                    loading="lazy"
                                    className="object-cover"
                                    sizes="192px"
                                  />
                                  <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                Logo
                              </div>
                            </div>
                          )
                        )}
                      </>
                    )}

                    {/* Regular history entries */}
                    {groupedByDate[date].map((entry: any) =>
                      (entry.images || []).map((image: any) => (
                      <div
                        key={`${entry.id}-${image.id}`}
                        data-image-id={`${entry.id}-${image.id}`}
                          onClick={() => setPreviewEntry(entry)}
                        className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                      >
                          {entry.status === "generating" ? (
                          // Loading frame
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                              <div className="text-xs text-white/60">
                                Generating...
                              </div>
                            </div>
                          </div>
                          ) : entry.status === "failed" ? (
                          // Error frame
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
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
                              <div className="text-xs text-red-400">Failed</div>
                            </div>
                          </div>
                          ) : (
                            // Completed logo
                          <div className="relative w-full h-full">
                            <Image
                                src={image.url || image.originalUrl || '/placeholder-logo.png'}
                                alt={entry.prompt}
                              fill
                                loading="lazy"
                                className="object-cover transition-transform group-hover:scale-105"
                              sizes="192px"
                              onLoad={() => {
                                setTimeout(() => {
                                  const shimmer = document.querySelector(`[data-image-id="${entry.id}-${image.id}"] .shimmer`) as HTMLElement;
                                    if (shimmer) shimmer.style.opacity = '0';
                                }, 100);
                              }}
                            />
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                          </div>
                          )}

                          {/* Logo badge */}
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            Logo
                          </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

          {/* Load More Indicator */}
          {hasMore && loading && logoHistoryEntries.length > 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
              <div className="text-sm text-white/60">Loading more logos...</div>
            </div>
          </div>
        )}
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* Input Section */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <input
                type="text"
                placeholder="Type your logo prompt..."
                value={prompt}
                onChange={(e) => dispatch(setPrompt(e.target.value))}
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGeneratingLocally}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition-colors"
              >
                {isGeneratingLocally ? "Generating Logo..." : "Generate Logo"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            <ModelsDropdown />
            <LogoCountDropdown />
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewEntry && (
        <LogoImagePreview
          isOpen={true}
          onClose={closePreview}
          entry={previewEntry}
        />
      )}
    </>
  );
};

export default InputBox;
