"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from 'next/navigation';
import { HistoryEntry } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  setPrompt,
  setSelectedModel,
  setImageCount
 } from '@/store/slices/generationSlice';
import { bflGenerate, falGenerate } from '@/store/slices/generationsApi';
import { 
  toggleDropdown, 
  addNotification 
} from '@/store/slices/uiSlice';
import useHistoryLoader from '@/hooks/useHistoryLoader';
import { useGenerationCredits } from '@/hooks/useCredits';
// Replaced custom loader with Logo.gif
import { 
  loadMoreHistory,
  removeHistoryEntry,
} from "@/store/slices/historySlice";
import axiosInstance from "@/lib/axiosInstance";
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { useBottomScrollPagination } from "@/hooks/useBottomScrollPagination";

const InputBox = () => {
  const dispatch = useAppDispatch();

  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "gemini-25-flash-image"
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
  const pathname = usePathname();
  // Local mount loading to prevent empty flash and ensure render without reload
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  // Safety: avoid getting stuck behind overlay if something goes wrong
  useEffect(() => {
    if (!initialLoading) return;
    const t = setTimeout(() => setInitialLoading(false), 10000);
    return () => clearTimeout(t);
  }, [initialLoading]);

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
  const loadLockRef = useRef(false);
  
  // Track which images have loaded to hide shimmer effect
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  // Track entries that have been added to history to prevent duplicate rendering
  // This ref is updated immediately when entries are added, before React re-renders
  const historyEntryIdsRef = useRef<Set<string>>(new Set());
  
  // Get current entries from Redux (will be updated on each render)
  const existingEntries = useAppSelector((state: any) => state.history?.entries || []);

  // Helpers: clean prompt (remove [Style: ...]) and copy
  const getCleanPrompt = (text: string): string => {
    try { return (text || '').replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim(); } catch { return text; }
  };
  const copyPrompt = async (e: React.MouseEvent, text: string) => {
    try { 
      e.stopPropagation(); 
      e.preventDefault();
      await navigator.clipboard.writeText(text); 
      (await import('react-hot-toast')).default.success('Prompt copied'); 
    } catch { 
      try { 
        (await import('react-hot-toast')).default.error('Failed to copy'); 
      } catch {} 
    }
  };

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteImage = async (e: React.MouseEvent, entry: HistoryEntry) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
      toast.success('Image deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete generation');
    }
  };

  // Auto-clear local preview after it has completed/failed and backend history refresh kicks in
  // Also check if the entry already exists in Redux history to prevent duplicates
  useEffect(() => {
    const entry = localGeneratingEntries[0] as any;
    if (!entry) {
      return;
    }
    
    // Check if this entry already exists in Redux history (by id or firebaseHistoryId)
    const entryId = entry.id;
    const entryFirebaseId = (entry as any)?.firebaseHistoryId;
    
    // FIRST: Check ref (updated immediately when entry is added to history)
    const existsInRef = (entryId && historyEntryIdsRef.current.has(entryId)) ||
                       (entryFirebaseId && historyEntryIdsRef.current.has(entryFirebaseId));
    
    // SECOND: Check Redux state
    const existsInHistory = existingEntries.some((e: HistoryEntry) => {
      const eId = e.id;
      const eFirebaseId = (e as any)?.firebaseHistoryId;
      if (entryId && (eId === entryId || eFirebaseId === entryId)) return true;
      if (entryFirebaseId && (eId === entryFirebaseId || eFirebaseId === entryFirebaseId)) return true;
      return false;
    });
    
    // CRITICAL: If entry exists in ref OR history, immediately clear local entry
    if (existsInRef || existsInHistory) {
      setIsGeneratingLocally(false);
      setLocalGeneratingEntries((prev) => {
        return prev.filter((e) => {
          const eId = e.id || (e as any)?.firebaseHistoryId;
          const entryIdToMatch = entry.id || (entry as any)?.firebaseHistoryId;
          return eId !== entryIdToMatch;
        });
      });
      return;
    }
    
    // If entry completes/fails but not in history yet, reset button state
    if (entry.status === 'completed' || entry.status === 'failed') {
      setIsGeneratingLocally(false);
    }
  }, [localGeneratingEntries, existingEntries]);

  // Unified initial load & refresh via shared hook
  const { refresh: refreshHistoryDebounced, refreshImmediate: refreshHistoryImmediate } = useHistoryLoader({ generationType: 'logo', initialLimit: 10 });
  
  // Function to fetch and add/update a single generation instead of reloading all
  const refreshSingleGeneration = async (historyId: string) => {
    try {
      const client = axiosInstance;
      const res = await client.get(`/api/generations/${historyId}`);
      const item = res.data?.data?.item;
      if (!item) {
        console.warn('[refreshSingleGeneration] Generation not found, falling back to full refresh');
        refreshHistoryDebounced();
        return;
      }
      
      // Normalize the item to match HistoryEntry format
      const created = item?.createdAt || item?.updatedAt || item?.timestamp;
      const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : new Date().toISOString());
      const normalizedEntry: HistoryEntry = {
        ...item,
        id: item.id || historyId,
        timestamp: iso,
        createdAt: iso,
      } as HistoryEntry;
      
      // Check if entry already exists in current Redux state
      const exists = existingEntries.some((e: HistoryEntry) => e.id === historyId);
      
      // CRITICAL: Track this entry ID in ref IMMEDIATELY before adding to Redux
      historyEntryIdsRef.current.add(historyId);
      if (normalizedEntry.id) historyEntryIdsRef.current.add(normalizedEntry.id);
      if ((normalizedEntry as any)?.firebaseHistoryId) {
        historyEntryIdsRef.current.add((normalizedEntry as any).firebaseHistoryId);
      }
      
      // Import Redux actions
      const { addHistoryEntry, updateHistoryEntry } = await import('@/store/slices/historySlice');
      
      if (exists) {
        dispatch(updateHistoryEntry({ 
          id: historyId, 
          updates: {
            status: normalizedEntry.status,
            images: normalizedEntry.images,
            imageCount: normalizedEntry.imageCount,
            timestamp: normalizedEntry.timestamp,
          }
        }));
      } else {
        dispatch(addHistoryEntry(normalizedEntry));
      }
      
      // CRITICAL: Immediately clear local entry when history entry is added/updated
      setLocalGeneratingEntries((prev) => {
        const filtered = prev.filter((e) => {
          const eId = e.id;
          const eFirebaseId = (e as any)?.firebaseHistoryId;
          
          // Check if IDs match
          if (eId === historyId || eFirebaseId === historyId) return false;
          if (normalizedEntry.id && (eId === normalizedEntry.id || eFirebaseId === normalizedEntry.id)) return false;
          const normalizedFirebaseId = (normalizedEntry as any)?.firebaseHistoryId;
          if (normalizedFirebaseId && (eId === normalizedFirebaseId || eFirebaseId === normalizedFirebaseId)) return false;
          
          // If local entry is completed and we just added a completed history entry, clear it
          if (e.status === 'completed' && normalizedEntry.status === 'completed') return false;
          
          return true;
        });
        return filtered;
      });
    } catch (error) {
      console.error('[refreshSingleGeneration] Failed to fetch single generation, falling back to full refresh:', error);
      refreshHistoryDebounced();
    }
  };
  useEffect(() => {
    // Mark initial loading state until first entries arrive or timeout
    if (initialLoading && historyEntries.length > 0) {
      setInitialLoading(false);
      setHasInitiallyLoaded(true);
    }
  }, [initialLoading, historyEntries.length]);

  // Mark user scroll
  useEffect(() => {
    const onScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as any);
  }, []);

  // Bottom scroll pagination (History-style) replaces IntersectionObserver
  useBottomScrollPagination({
    containerRef: undefined,
    hasMore,
    loading,
    requireUserScroll: true,
    bottomOffset: 800,
    throttleMs: 200,
    loadMore: async () => {
      try {
        await (dispatch as any)(loadMoreHistory({
          filters: { generationType: 'logo' },
          paginationParams: { limit: 10 }
        })).unwrap();
      } catch {/* swallow */}
    }
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Check authentication before allowing generation
    const hasSession = document.cookie.includes('app_session');
    const hasToken = localStorage.getItem('authToken') || localStorage.getItem('user');
    
    if (!hasSession && !hasToken) {
      try { const toast = (await import('react-hot-toast')).default; toast.error('Please sign in to generate logos'); } catch {}
      // Redirect to signup page
      window.location.href = '/view/signup?next=/logo-generation';
      return;
    }

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
      try { const toast = (await import('react-hot-toast')).default; toast.error(creditError.message || 'Insufficient credits for generation'); } catch {}
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

      // Read isPublic from backend policy
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();

      if (selectedModel === "gemini-25-flash-image") {
        // Route to FAL (Google Nano Banana)
        result = await dispatch(
          falGenerate({
            prompt: backendPrompt,
            model: selectedModel,
            n: imageCount,
            uploadedImages: [], // Nano Banana is T2I/I2I, but for logo, we assume T2I for now
            output_format: "jpeg",
            isPublic,
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
            isPublic,
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

      // Clear all inputs and reset to defaults
      dispatch(setPrompt(""));
      dispatch(setSelectedModel("gemini-25-flash-image"));
      dispatch(setImageCount(1));

      // Show success notification
      try { const toast = (await import('react-hot-toast')).default; toast.success(`Successfully generated ${imageCount} logo${imageCount > 1 ? 's' : ''}!`); } catch {}

      // Handle credit success
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
      }

      // Refresh only the single completed generation instead of reloading all
      if (result.historyId) {
        await refreshSingleGeneration(result.historyId);
      } else {
        refreshHistoryDebounced();
      }

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
      try { const toast = (await import('react-hot-toast')).default; toast.error(error.message || 'Logo generation failed'); } catch {}

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

  // Slice already enforces generationType; use list as-is
  const logoHistoryEntries = historyEntries as any[];
  
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
      <div className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0 relative">
        <div className="py-6 pl-4 ">
            {/* History Header - Fixed during scroll */}
            <div className="fixed top-0 left-0 right-0 z-30 py-5 ml-18 mr-1  backdrop-blur-lg shadow-xl pl-6 ">
              <h2 className="text-xl font-semibold text-white pl-0 ">
                Logo Generation History
              </h2>
            </div>
            {/* Spacer to keep content below fixed header */}
            <div className="h-0"></div>

            {/* Scoped overlay loader while first page loads */}
          {(initialLoading || (loading && logoHistoryEntries.length === 0)) && (
            <div className="fixed top-[64px] left-0 right-0 bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Image src="/styles/Logo.gif" alt="Generating" width={88} height={88} className="mx-auto" />
                  <div className="text-white text-lg text-center">Loading generations...</div>
                </div>
              </div>
            )}

            {/* History Entries - Grouped by Date */}
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
                          <div className="w-full h-full flex items-center justify-center bg-black/90">
                            <div className="flex flex-col items-center gap-2">
                              <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                              <div className="text-xs text-white/60 text-center">Generating...</div>
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
                          <div className="relative w-full h-full group">
                            <img 
                              src={image.thumbnailUrl || image.avifUrl || image.url || image.originalUrl || '/placeholder-logo.png'} 
                              alt={localGeneratingEntries[0].prompt} 
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-cover" 
                            />
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                            {/* Hover buttons overlay */}
                            <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                              <button aria-label="Copy prompt" className="pointer-events-auto p-1.5 rounded-lg bg-black/40 hover:bg-black/50 text-white/90 backdrop-blur-3xl" onClick={(e)=>copyPrompt(e, getCleanPrompt(localGeneratingEntries[0].prompt))} onMouseDown={(e) => e.stopPropagation()}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                              </button>
                            </div>
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
                    {date === todayKey && localGeneratingEntries.length > 0 && (() => {
                      const localEntry = localGeneratingEntries[0];
                      const localEntryId = localEntry.id;
                      const localFirebaseId = (localEntry as any)?.firebaseHistoryId;
                      
                      // Check if this local entry already exists in history
                      const existsInRef = (localEntryId && historyEntryIdsRef.current.has(localEntryId)) ||
                                        (localFirebaseId && historyEntryIdsRef.current.has(localFirebaseId));
                      const existsInHistory = logoHistoryEntries.some((e: HistoryEntry) => {
                        const eId = e.id;
                        const eFirebaseId = (e as any)?.firebaseHistoryId;
                        if (localEntryId && (eId === localEntryId || eFirebaseId === localEntryId)) return true;
                        if (localFirebaseId && (eId === localFirebaseId || eFirebaseId === localFirebaseId)) return true;
                        return false;
                      });
                      const existsInGrouped = groupedByDate[date]?.some((e: HistoryEntry) => {
                        const eId = e.id;
                        const eFirebaseId = (e as any)?.firebaseHistoryId;
                        if (localEntryId && (eId === localEntryId || eFirebaseId === localEntryId)) return true;
                        if (localFirebaseId && (eId === localFirebaseId || eFirebaseId === localFirebaseId)) return true;
                        return false;
                      });
                      
                      // If entry exists anywhere, don't render local entry
                      if (existsInRef || existsInHistory || existsInGrouped) {
                        return null;
                      }
                      
                      // Safety check: if local entry is completed and history exists, don't show it
                      if (localEntry.status === 'completed' && (logoHistoryEntries.length > 0 || (groupedByDate[date]?.length || 0) > 0)) {
                        return null;
                      }
                      
                      return (
                        <>
                          {localEntry.images.map((image: any, idx: number) => {
                            const uniqueImageKey = image?.id ? `local-${localEntryId}-${image.id}` : `local-${localEntryId}-img-${idx}`;
                            const isImageLoaded = loadedImages.has(uniqueImageKey);
                            
                            return (
                              <div
                                key={uniqueImageKey}
                                className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                              >
                                {localEntry.status === "generating" ? (
                                  <div className="w-full h-full flex items-center justify-center bg-black/90">
                                    <div className="flex flex-col items-center gap-2">
                                      <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                                      <div className="text-xs text-white/60 text-center">
                                        Generating...
                                      </div>
                                    </div>
                                  </div>
                                ) : localEntry.status === "failed" ? (
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
                                  <div className="relative w-full h-full group">
                                    <img
                                      src={
                                        image.thumbnailUrl || image.avifUrl || image.url ||
                                        image.originalUrl ||
                                        "/placeholder-logo.png"
                                      }
                                      alt={localEntry.prompt}
                                      loading="lazy"
                                      decoding="async"
                                      className="absolute inset-0 w-full h-full object-cover"
                                      onLoad={() => {
                                        setLoadedImages(prev => new Set(prev).add(uniqueImageKey));
                                      }}
                                    />
                                    {!isImageLoaded && (
                                      <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                    )}
                                    {/* Hover buttons overlay */}
                                    <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                      <button aria-label="Copy prompt" className="pointer-events-auto p-1.5 rounded-lg bg-black/40 hover:bg-black/50 text-white/90 backdrop-blur-3xl" onClick={(e)=>copyPrompt(e, getCleanPrompt(localEntry.prompt))} onMouseDown={(e) => e.stopPropagation()}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                  Logo
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* Regular history entries - filter out any that match local entries */}
                    {(() => {
                      // Create a set of all local entry IDs for fast lookup
                      const localEntryIds = new Set<string>();
                      if (date === todayKey && localGeneratingEntries.length > 0) {
                        localGeneratingEntries.forEach((localEntry) => {
                          const localEntryId = localEntry.id;
                          const localFirebaseId = (localEntry as any)?.firebaseHistoryId;
                          if (localEntryId) localEntryIds.add(localEntryId);
                          if (localFirebaseId) localEntryIds.add(localFirebaseId);
                        });
                      }
                      
                      // Filter out history entries that match local entries
                      const filteredHistoryEntries = (groupedByDate[date] || []).filter((entry: HistoryEntry) => {
                        if (localEntryIds.size === 0) return true;
                        const entryId = entry.id;
                        const entryFirebaseId = (entry as any)?.firebaseHistoryId;
                        if (entryId && localEntryIds.has(entryId)) return false;
                        if (entryFirebaseId && localEntryIds.has(entryFirebaseId)) return false;
                        return true;
                      });
                      
                      return filteredHistoryEntries.flatMap((entry: any) =>
                        (entry.images || []).map((image: any, imgIdx: number) => {
                          const uniqueImageKey = image?.id ? `${entry.id}-${image.id}` : `${entry.id}-img-${imgIdx}`;
                          const isImageLoaded = loadedImages.has(uniqueImageKey);
                          
                          return (
                            <div
                              key={uniqueImageKey}
                              data-image-id={uniqueImageKey}
                              onClick={() => setPreviewEntry(entry)}
                              className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                            >
                              {entry.status === "generating" ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/90">
                                  <div className="flex flex-col items-center gap-2">
                                    <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                                    <div className="text-xs text-white/60 text-center">
                                      Generating...
                                    </div>
                                  </div>
                                </div>
                              ) : entry.status === "failed" ? (
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
                                <div className="relative w-full h-full group">
                                  <img
                                    src={image.thumbnailUrl || image.avifUrl || image.url || image.originalUrl || '/placeholder-logo.png'}
                                    alt={entry.prompt}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onLoad={() => {
                                      setLoadedImages(prev => new Set(prev).add(uniqueImageKey));
                                    }}
                                  />
                                  {!isImageLoaded && (
                                    <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                  )}
                                  {/* Hover buttons overlay */}
                                  <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                    <button aria-label="Copy prompt" className="pointer-events-auto p-1.5 rounded-lg bg-black/40 hover:bg-black/50 text-white/90 backdrop-blur-3xl" onClick={(e)=>copyPrompt(e, getCleanPrompt(entry.prompt))} onMouseDown={(e) => e.stopPropagation()}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                    </button>
                                    <button
                                      aria-label="Delete image"
                                      className="pointer-events-auto p-1.5 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                      onClick={(e) => handleDeleteImage(e, entry)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      );
                    })()}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Indicator */}
          {hasMore && loading && logoHistoryEntries.length > 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3">
              <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
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
        <div className="rounded-lg bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-0 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-lg pr-4 py-2.5">
              <input
                type="text"
                placeholder="Type your logo prompt..."
                value={prompt}
                onChange={(e) => dispatch(setPrompt(e.target.value))}
                spellCheck={true}
                lang="en"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="on"
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-none"
              />
              {prompt.trim() && (
                <div className="relative group">
                  <button
                    onClick={() => {
                      dispatch(setPrompt(""));
                    }}
                    className="ml-2 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors duration-200 flex items-center gap-1.5"
                    aria-label="Clear prompt"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/80"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Clear Prompt</div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGeneratingLocally}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-lg text-[15px] font-semibold transition-colors"
              >
                {isGeneratingLocally ? "Generating Logo..." : "Generate Logo"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-3 pb-3">
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
