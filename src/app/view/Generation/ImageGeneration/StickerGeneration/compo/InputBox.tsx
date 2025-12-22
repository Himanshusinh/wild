'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from 'next/navigation';
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
import useHistoryLoader from '@/hooks/useHistoryLoader';
import { useGenerationCredits } from '@/hooks/useCredits';
import { 
  loadMoreHistory,
  removeHistoryEntry,
} from "@/store/slices/historySlice";
import axiosInstance from "@/lib/axiosInstance";
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
// Frontend history writes removed; rely on backend history service
const updateFirebaseHistory = async (_id: string, _updates: any) => { };
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
// No-op action creators to satisfy existing dispatch calls without affecting store
const updateHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);
const addHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);

// Import the sticker-specific components
import ModelsDropdown from './ModelsDropdown';
import StickerCountDropdown from './StickerCountDropdown';
import StickerImagePreview from './StickerImagePreview';
import { useBottomScrollPagination } from "@/hooks/useBottomScrollPagination";
// Replaced custom loader with Logo.gif

const InputBox = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-kontext-pro');
  const imageCount = useAppSelector((state: any) => state.generation?.imageCount || 1);
  const isGenerating = useAppSelector((state: any) => state.generation?.isGenerating || false);
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore ?? true);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const pathname = usePathname();
  // Local mount loading to avoid empty flash and ensure first render
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  // Safety: avoid overlay lock-ups if a request is aborted/blocked
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
  } = useGenerationCredits('image', selectedModel, {
    frameSize: '1:1', // Sticker generation typically uses square aspect ratio
    count: imageCount,
  });

  // Local state for preview modal
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
  
  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<HistoryEntry[]>([]);
  
  // Local state to track generation status for button text
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);
  const loadLockRef = useRef(false);

  // Helpers: clean prompt and copy
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
  useEffect(() => {
    const entry = localGeneratingEntries[0] as any;
    if (!entry) return;
    if (entry.status === 'completed' || entry.status === 'failed') {
      const timer = setTimeout(() => setLocalGeneratingEntries([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [localGeneratingEntries]);

  // Unified initial load & refresh via shared hook
  const { refresh: refreshHistoryDebounced } = useHistoryLoader({ generationType: 'sticker-generation', initialLimit: 10 });
  useEffect(() => {
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

  // Bottom scroll pagination replacing IntersectionObserver to mirror History page
  useBottomScrollPagination({
    containerRef: scrollRootRef,
    hasMore,
    loading,
    requireUserScroll: true,
    bottomOffset: 800,
    throttleMs: 200,
    loadMore: async () => {
      try {
        await (dispatch as any)(loadMoreHistory({
          filters: { generationType: 'sticker-generation' },
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
      try { const toast = (await import('react-hot-toast')).default; toast.error('Please sign in to generate stickers'); } catch {}
      // Redirect to signup page
      window.location.href = '/view/signup?next=/sticker-generation';
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
      console.log('✅ Credits reserved for sticker generation:', creditResult);
    } catch (creditError: any) {
      console.error('❌ Credit validation failed:', creditError);
      try { const toast = (await import('react-hot-toast')).default; toast.error(creditError.message || 'Insufficient credits for generation'); } catch {}
      setIsGeneratingLocally(false);
      return;
    }

    // Create local preview entry immediately
    const loadingEntry: HistoryEntry = {
      id: `loading-${Date.now()}`,
      prompt: `Sticker: ${prompt}`,
      model: selectedModel,
      generationType: 'sticker-generation',
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: '',
        originalUrl: ''
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: 'generating'
    };

    // Set local preview to show loading frames immediately
    setLocalGeneratingEntries([loadingEntry]);

    try {
      let result;

      // Build the same backend prompt regardless of model
      const backendPrompt = (p: string) => `
      Create a FUN, BOLD sticker of: ${p}.
      
      Canvas & Background:
      - Square canvas (1:1), PALE PLAIN background strictly for preview ONLY; final output must be TRANSPARENT (no gradients, no textures, no photos).
      - Keep a clean silhouette with a **thick, even outline** around the subject. Leave ~16px visual margin from edges.
      
      Style:
      - Colorful, vector/cartoon style with smooth curves and high contrast.
      - Semi-flat shading (simple highlights + shadows), no photorealism.
      - Add tiny accents (sparkles, motion lines, emoji chips) only if they enhance clarity.
      
      Framing & Readability:
      - Subject must be centered, fill the canvas without touching edges.
      - Silhouette readable at 64–96 px (app sticker size).
      
      Output (VERY IMPORTANT):
      - **Transparent background** (alpha), **no drop shadows baked into background**.
      - Edges should be crisp and anti-aliased (no halo).
      - Provide at least 1024×1024 master PNG with transparency; safe to downscale to **512×512 WEBP** under **100 KB**.
      
      Usability tags:
      - WhatsApp/Telegram/iMessage ready
      - Clear thick outline (~6–12 px @1024 base)
      - Minimal background clutter
      
      Subject constraints (use the prompt literally):
      - Focus ONLY on: ${p}
      - Include visual elements that clearly represent "${p}".
      - Do not introduce unrelated props or scenes that are not in "${p}".
      
      Negative Prompt:
      - No complex backgrounds, no textures, no 3D renders, no photo mashups, no tiny unreadable text, no muted/low-contrast palettes.
      
      Review checklist before export:
      - Alpha background ✅  |  Strong outline ✅  |  Clean silhouette ✅  |  Centered with margin ✅  |  Clearly depicts "${p}" ✅
      `;
      



      // Read isPublic from backend policy
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();

      const builtPrompt = backendPrompt(prompt);

      if (selectedModel === 'gemini-25-flash-image') {
        // Route to FAL (Google Nano Banana)
        result = await dispatch(falGenerate({
          prompt: builtPrompt,
          model: selectedModel,
          n: imageCount,
          uploadedImages: [], // Nano Banana is T2I/I2I, but for sticker, we assume T2I for now
          output_format: 'jpeg',
          isPublic,
          generationType: 'sticker-generation',
        })).unwrap();
      } else {
        // Route to BFL (Flux models)
        result = await dispatch(bflGenerate({
          prompt: builtPrompt,
          model: selectedModel,
          n: imageCount,
          frameSize: '1:1',
          style: 'sticker',
          isPublic,
          generationType: 'sticker-generation'
        })).unwrap();
      }

      // Create completed entry
      const completedEntry: HistoryEntry = {
        id: result.historyId || Date.now().toString(),
        prompt: `Sticker: ${prompt}`,
        model: selectedModel,
        generationType: 'sticker-generation',
        images: result.images,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: imageCount,
        status: 'completed'
      };

      // Update local preview to completed
      setLocalGeneratingEntries([completedEntry]);

      // Clear the prompt
      dispatch(setPrompt(''));

      // Show success notification
      try { const toast = (await import('react-hot-toast')).default; toast.success(`Successfully generated ${imageCount} sticker${imageCount > 1 ? 's' : ''}!`); } catch {}

      // Handle credit success
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
      }

      // Debounced refresh instead of immediate duplicate requests
      refreshHistoryDebounced();

      // Reset local generation state
      setIsGeneratingLocally(false);

    } catch (error: any) {
      console.error('Sticker generation failed:', error);
      
      // Update local preview to failed
      setLocalGeneratingEntries(prev => prev.map(entry => ({
        ...entry,
        status: 'failed' as const,
        error: error.message || 'Generation failed'
      })));

      // Show error notification
      try { const toast = (await import('react-hot-toast')).default; toast.error(error.message || 'Sticker generation failed'); } catch {}

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

  // Filter entries for sticker generation (tolerant to naming)
  const stickerHistoryEntries = historyEntries.filter((entry: any) => {
    const normalize = (t?: string) => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
    const e = normalize(entry?.generationType);
    return e === 'sticker' || e === 'sticker-generation' || e === 'sticker-gen';
  });
  
  // Don't show empty state if we haven't loaded yet
  const shouldShowEmptyState = hasInitiallyLoaded && !initialLoading && !loading && stickerHistoryEntries.length === 0 && localGeneratingEntries.length === 0;

  // Debug logging
  console.log('🎨 Sticker Generation - All entries:', historyEntries.length);
  console.log('🎨 Sticker Generation - Filtered sticker entries:', stickerHistoryEntries.length);
  console.log('🎨 Sticker Generation - Sample entries:', historyEntries.slice(0, 3).map((e: any) => ({ 
    id: e.id, 
    generationType: e.generationType, 
    prompt: e.prompt?.substring(0, 50) + '...',
    style: e.style 
  })));

  // Group entries by date
  const groupedByDate = stickerHistoryEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
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
      <div ref={scrollRootRef} className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0 relative">
        <div className="py-6 pl-4 ">
            {/* History Header - Fixed during scroll */}
            <div className="fixed top-0 left-0 right-0 z-30 py-5 ml-18 mr-1  backdrop-blur-lg shadow-xl pl-6 ">
              <h2 className="text-xl font-semibold text-white pl-0 ">Sticker Generation History</h2>
            </div>
            {/* Spacer to keep content below fixed header */}
            <div className="h-0"></div>

            {/* Scoped overlay loader while first page loads */}
          {(initialLoading || (loading && stickerHistoryEntries.length === 0)) && (
            <div className="fixed top-[64px] left-0 right-0 bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Image src="/styles/Logo.gif" alt="Generating" width={88} height={88} className="mx-auto" unoptimized />
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
                              <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" unoptimized />
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
                              src={image.thumbnailUrl || image.avifUrl || image.url || image.originalUrl || '/placeholder-sticker.png'} 
                              alt={localGeneratingEntries[0].prompt} 
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-cover" 
                            />
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                            {/* Hover buttons overlay */}
                            <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                              <button
                                aria-label="Copy prompt"
                                className="pointer-events-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(localGeneratingEntries[0].prompt)); }}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Sticker</div>
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

                  {/* All Sticker Images for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 ml-9">
                    {/* Prepend local preview tiles at the start of today's row to push images right */}
                    {date === todayKey && localGeneratingEntries.length > 0 && (
                      <>
                        {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                          <div key={`local-${idx}`} className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                            {localGeneratingEntries[0].status === 'generating' ? (
                              <div className="w-full h-full flex items-center justify-center bg-black/90">
                                <div className="flex flex-col items-center gap-2">
                                  <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" unoptimized />
                                  <div className="text-xs text-white/60 text-center">Generating...</div>
                                </div>
                              </div>
                            ) : localGeneratingEntries[0].status === 'failed' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                                <div className="flex flex-col items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                  <div className="text-xs text-red-400">Failed</div>
                                </div>
                              </div>
                            ) : (
                              <Image
                                src={image.url || image.originalUrl || '/placeholder-sticker.png'}
                                alt={localGeneratingEntries[0].prompt}
                                fill
                                className="object-cover"
                                sizes="192px"
                              />
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Sticker</div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Regular history entries */}
                    {groupedByDate[date].map((entry: HistoryEntry) => 
                      (entry.images || []).map((image, imageIndex) => (
                        <div
                          key={`${entry.id}-${image.id}`}
                          data-image-id={`${entry.id}-${image.id}`}
                          onClick={(e) => {
                            // Don't open preview if clicking on copy button
                            if ((e.target as HTMLElement).closest('button[aria-label="Copy prompt"]')) {
                              return;
                            }
                            handleImageClick(entry);
                          }}
                          className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {entry.status === 'generating' ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-black/90">
                              <div className="flex flex-col items-center gap-2">
                                <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" unoptimized />
                                <div className="text-xs text-white/60 text-center">
                                  Generating...
                                </div>
                              </div>
                            </div>
                          ) : entry.status === 'failed' ? (
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
                          ) : image.url ? (
                            // Completed sticker with shimmer loading
                            <div className="relative w-full h-full group">
                              <img
                                src={image.thumbnailUrl || image.avifUrl || image.url}
                                alt={`Generated sticker ${imageIndex + 1}`}
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onLoad={() => {
                                  setTimeout(() => {
                                    const shimmer = document.querySelector(`[data-image-id="${entry.id}-${image.id}"] .shimmer`) as HTMLElement;
                                    if (shimmer) shimmer.style.opacity = '0';
                                  }, 100);
                                }}
                              />
                              {/* Shimmer loading effect */}
                              <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                              {/* Hover buttons overlay */}
                              <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                <button
                                  aria-label="Copy prompt"
                                  className="pointer-events-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                  onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                </button>
                                <button
                                  aria-label="Delete image"
                                  className="pointer-events-auto p-2 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                  onClick={(e) => handleDeleteImage(e, entry)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            // No image available
                            <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                              <div className="text-xs text-white/60">No image</div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Load More Indicator */}
          {hasMore && loading && stickerHistoryEntries.length > 0 && (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                <div className="text-sm text-white/60">Loading more stickers...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[780px] z-[60]">
        <div className="rounded-lg bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-lg pr-4 py-2.5">
              <input
                type="text"
                placeholder="Type your sticker prompt..."
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
                      dispatch(setPrompt(''));
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
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGeneratingLocally}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-lg text-[15px] font-semibold transition-colors"
              >
                {isGeneratingLocally ? 'Generating Sticker...' : 'Generate Sticker'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-3 pb-3">
            <ModelsDropdown />
            <StickerCountDropdown />
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewEntry && (
        <StickerImagePreview
          isOpen={true}
          onClose={closePreview}
          entry={previewEntry}
        />
      )}
    </>
  );
};

export default InputBox;