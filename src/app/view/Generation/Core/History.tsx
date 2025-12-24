'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import ImagePreviewModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ImagePreviewModal';
import VideoPreviewModal from '@/app/view/Generation/VideoGeneration/TextToVideo/compo/VideoPreviewModal';
import CustomAudioPlayer from '@/app/view/Generation/MusicGeneration/TextToMusic/compo/CustomAudioPlayer';
import FilterPopover from '@/components/ui/FilterPopover';
import StickerImagePreview from '@/app/view/Generation/ImageGeneration/StickerGeneration/compo/StickerImagePreview';
import LogoImagePreview from '@/app/view/Generation/ImageGeneration/LogoGeneration/compo/LogoImagePreview';
import ProductImagePreview from '@/app/view/Generation/ProductGeneration/compo/ProductImagePreview';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadHistory, loadMoreHistory, setFilters, clearFilters, clearHistory, removeHistoryEntry } from '@/store/slices/historySlice';
import axiosInstance from '@/lib/axiosInstance';
import { setCurrentView } from '@/store/slices/uiSlice';
import { Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import HistoryControls from '@/app/view/Generation/VideoGeneration/TextToVideo/compo/HistoryControls';
// Replaced custom loader with Logo.gif
import { downloadFileWithNaming, getFileType, getExtensionFromUrl } from '@/utils/downloadUtils';
import { getCreditsForModel } from '@/utils/modelCredits';
import { toResourceProxy, toMediaProxy } from '@/lib/thumb';
import JSZip from 'jszip';

// Helper to generate colorful audio tile gradients (mirrors MusicHistory colors)
const getAudioColorTheme = (entry: any, index: number = 0): string => {
  const seed = entry?.id || entry?.model || index || 0;
  const hash = String(seed).split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const themes = [
    'from-sky-500/60 via-blue-600/60 to-indigo-600/60',
    'from-cyan-500/60 via-sky-600/60 to-blue-700/60',
    'from-blue-500/60 via-indigo-600/60 to-purple-600/60',
    'from-indigo-600/60 via-violet-600/60 to-fuchsia-600/60',
    'from-blue-600/60 via-purple-600/60 to-sky-500/60',
    'from-indigo-700/60 via-blue-600/60 to-cyan-600/60',
    'from-purple-700/60 via-indigo-600/60 to-blue-600/60',
    'from-blue-500/60 via-cyan-500/60 to-teal-500/60',
    'from-sky-600/60 via-indigo-600/60 to-purple-700/60',
    'from-cyan-600/60 via-blue-700/60 to-indigo-800/60',
  ];

  return themes[Math.abs(hash) % themes.length];
};

const History = () => {
  const dispatch = useAppDispatch();
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const error = useAppSelector((state: any) => state.history?.error);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');
  const user = useAppSelector((state: any) => state.auth?.user);
  const [viewMode, setViewMode] = useState<'global' | 'feature'>('global');
  const [hasMore, setHasMore] = useState(true);
  const [pillLoading, setPillLoading] = useState(false);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<{ entry: HistoryEntry; image: any } | null>(null);
  const [videoPreview, setVideoPreview] = useState<{ entry: HistoryEntry; video: any } | null>(null);
  const [audioPreview, setAudioPreview] = useState<{ entry: HistoryEntry; audioUrl: string } | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [logoPreviewEntry, setLogoPreviewEntry] = useState<HistoryEntry | null>(null);
  const [stickerPreviewEntry, setStickerPreviewEntry] = useState<HistoryEntry | null>(null);
  const [productPreviewEntry, setProductPreviewEntry] = useState<HistoryEntry | null>(null);
  const didInitialLoadRef = useRef(false);
  const isFetchingMoreRef = useRef(false);
  const autoLoadAttemptsRef = useRef(0);
  const lastLoadMoreTriggerRef = useRef(0);
  const loadLockRef = useRef(false);
  const hasUserScrolledRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setLocalFilters] = useState<HistoryFilters>({});
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | null>('desc');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [quickFilter, setQuickFilter] = useState<'all' | 'images' | 'videos' | 'music' | 'logo' | 'sticker' | 'product' | 'user-uploads'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState<string>("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  // Custom calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const calendarDaysInMonth = useMemo(() => new Date(calendarYear, calendarMonth + 1, 0).getDate(), [calendarYear, calendarMonth]);
  const calendarFirstWeekday = useMemo(() => new Date(calendarYear, calendarMonth, 1).getDay(), [calendarYear, calendarMonth]);

  useEffect(() => {
    if (!showCalendar) return;
    const onDocClick = (e: MouseEvent) => {
      const el = e.target as any;
      // Avoid ref collisions between desktop + mobile calendar popups (both exist in DOM; one is CSS-hidden).
      // If the click happened inside any calendar popup, do nothing.
      if (el && typeof el.closest === 'function' && el.closest('[data-calendar-popup="true"]')) return;
      setShowCalendar(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCalendar(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showCalendar]);

  // Selection states
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDownloadBar, setShowDownloadBar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [dragBox, setDragBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const wasDraggingRef = useRef(false);

  // Helper function to get clean prompt without style
  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, "").trim();
  };

  // Copy prompt to clipboard
  const copyPrompt = async (e: React.MouseEvent, text: string) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      toast.success('Prompt copied');
    } catch {
      try {
        toast.error('Failed to copy');
      } catch { }
    }
  };

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteGeneration = async (e: React.MouseEvent, entry: HistoryEntry) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch { }
      toast.success('Generation deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete generation');
    }
  };

  // Debug logs removed for cleaner console

  // Helper: load only the first page; more pages load on scroll.
  // IMPORTANT: Use forceRefresh so backend ordering is preserved and we don't merge into stale entries.
  const loadFirstPage = async (filtersObj: any) => {
    try {
      if (loadLockRef.current) return; // prevent duplicate initial loads
      loadLockRef.current = true;
      const initialLimit = computeDynamicLimit(0);
      const result: any = await (dispatch as any)(loadHistory({ filters: filtersObj, backendFilters: filtersObj, paginationParams: { limit: initialLimit }, forceRefresh: true })).unwrap();
      const entries = (result && Array.isArray(result.entries)) ? result.entries : [];
      let nextHasMore: boolean;
      if (typeof (result && result.hasMore) !== 'undefined') {
        nextHasMore = Boolean(result.hasMore);
      } else {
        // Fallback heuristic: if we received fewer than requested or zero, assume no more
        nextHasMore = entries.length > 0 && entries.length >= initialLimit;
      }
      if (entries.length === 0) nextHasMore = false;
      setHasMore(nextHasMore);
    } catch (error) {
      // Handle condition aborts gracefully
      // silent
    } finally {
      loadLockRef.current = false;
    }
  };

  // Single, backend-driven date change handler (mirrors Image/Video pages)
  const onDateChange = useCallback(async (start: Date | null, end: Date | null, closeCalendar: boolean = false) => {
    setDateRange({ start, end });
    const nextFilters: any = { ...filters };

    if (start && end) {
      nextFilters.dateRange = { start: start.toISOString(), end: end.toISOString() };
      setDateInput(start.toISOString().slice(0, 10));
    } else {
      delete nextFilters.dateRange;
      setDateInput('');
    }

    if (sortOrder) nextFilters.sortOrder = sortOrder;
    if (searchQuery.trim()) nextFilters.search = searchQuery.trim();

    setLocalFilters(nextFilters);
    dispatch(setFilters(nextFilters));
    // Clear immediately so stale tiles don't linger while backend fetch happens
    dispatch(clearHistory());
    await loadFirstPage(nextFilters);
    setPage(1);
    if (closeCalendar) setShowCalendar(false);
  }, [dispatch, filters, searchQuery, sortOrder]);

  // Backend-only sorting: clear UI and force a fresh backend query when sort changes
  const onSortChange = useCallback(async (order: 'asc' | 'desc') => {
    const newSortOrder = order;
    setSortOrder(newSortOrder);
    // Reset pagination guards so infinite scroll works after a filter/sort switch
    isFetchingMoreRef.current = false;
    hasUserScrolledRef.current = false;
    autoLoadAttemptsRef.current = 0;

    const f: any = { ...filters, sortOrder: newSortOrder };
    if (dateRange.start && dateRange.end) f.dateRange = { start: dateRange.start.toISOString(), end: dateRange.end?.toISOString() };
    if (searchQuery.trim()) f.search = searchQuery.trim();

    setLocalFilters(f);
    dispatch(setFilters(f));
    dispatch(clearHistory());
    await loadFirstPage(f);
    setPage(1);
  }, [filters, dateRange, searchQuery, dispatch]);

  // Auto-fill viewport with a small safety cap to avoid fetching everything
  const computeDynamicLimit = (existingCount: number) => {
    try {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;
      // crude columns estimate matching our tile sizes (w-48 h-48 + gaps)
      const columns = w >= 1536 ? 6 : w >= 1280 ? 6 : w >= 1024 ? 5 : w >= 768 ? 4 : 2;
      const approxRowHeight = 220; // tile size + gap
      const rowsNeeded = Math.ceil(h / approxRowHeight) + 2; // a bit extra to prevent flicker
      const targetItems = columns * rowsNeeded;
      const need = targetItems - existingCount;
      return Math.min(60, Math.max(10, need));
    } catch {
      return 20; // safe default
    }
  };

  // Removed autoFillViewport to avoid multiple rapid requests. We do a single initial request and then on-scroll loads.

  // Load initial history on mount and when view mode changes
  useEffect(() => {
    const run = async () => {
      try {
        // Reset history to ensure a clean initial load on refresh
        dispatch(clearHistory());
        if (viewMode === 'global') {
          const base: any = {};
          if (sortOrder) base.sortOrder = sortOrder;
          if (searchQuery.trim()) base.search = searchQuery.trim();
          dispatch(setFilters(base));
          await loadFirstPage(base);
        } else {
          const f: any = { generationType: currentGenerationType };
          if (sortOrder) f.sortOrder = sortOrder;
          if (searchQuery.trim()) f.search = searchQuery.trim();
          dispatch(setFilters(f));
          await loadFirstPage(f);
        }
        setPage(1);
        didInitialLoadRef.current = true;
      } catch (error) {
        // Handle condition aborts gracefully
        // silent
      }
    };
    run();
  }, [dispatch, viewMode, currentGenerationType, searchQuery]); // Run on mount and when view mode or search changes

  // Removed fallback loader to prevent duplicate initial requests.

  // Sort changes are handled explicitly via onSortChange() to ensure we clear UI and forceRefresh.

  // Handle scroll to load more: attach both container and window listeners so we don't miss
  // pagination events when layout changes. Use guards to avoid duplicate requests.
  const triggerLoadMore = useCallback((source: 'container' | 'window' | 'autofill') => {
    try {
      const now = Date.now();
      // throttle brief bursts
      if (now - lastLoadMoreTriggerRef.current < 250) return;
      lastLoadMoreTriggerRef.current = now;
      if (!hasMore || loading || isFetchingMoreRef.current) return;

      isFetchingMoreRef.current = true;
      const baseFilters = { ...filters } as any;
      if (sortOrder) baseFilters.sortOrder = sortOrder;
      if (searchQuery.trim()) baseFilters.search = searchQuery.trim();
      const limit = sortOrder === 'asc' ? 30 : 10;

      dispatch(loadMoreHistory({ filters: baseFilters, backendFilters: baseFilters, paginationParams: { limit } }))
        .then((action: any) => {
          // Only update paging state on fulfilled requests; rejected conditions should not kill pagination.
          if (action?.meta?.requestStatus !== 'fulfilled') return;
          const payload = action.payload;
          if (payload && typeof payload.hasMore !== 'undefined') setHasMore(Boolean(payload.hasMore));
          setPage((p) => p + 1);
        })
        .finally(() => {
          isFetchingMoreRef.current = false;
        });
    } catch {
      isFetchingMoreRef.current = false;
    }
  }, [dispatch, filters, hasMore, loading, searchQuery, sortOrder]);

  useEffect(() => {
    const el = scrollContainerRef.current;

    const handleContainerScroll = () => {
      if (!el) return;
      if (!hasUserScrolledRef.current && el.scrollTop > 0) hasUserScrolledRef.current = true;
      if (!hasUserScrolledRef.current) return;
      if (el.clientHeight + el.scrollTop >= el.scrollHeight - 800) {
        triggerLoadMore('container');
      }
    };

    const handleWindowScroll = () => {
      if (!hasUserScrolledRef.current && window.scrollY > 0) hasUserScrolledRef.current = true;
      if (!hasUserScrolledRef.current) return;
      const winBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      if (winBottom >= docHeight - 800) {
        triggerLoadMore('window');
      }
    };

    try {
      if (el) el.addEventListener('scroll', handleContainerScroll as any, { passive: true });
    } catch { }
    window.addEventListener('scroll', handleWindowScroll as any, { passive: true });

    return () => {
      try { if (el) el.removeEventListener('scroll', handleContainerScroll as any); } catch { }
      try { window.removeEventListener('scroll', handleWindowScroll as any); } catch { }
    };
  }, [triggerLoadMore]);

  // Autofill: if the first page doesn't create a scrollbar (common for Videos / Oldest),
  // proactively fetch a couple more pages so scrolling can start.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (loading || isFetchingMoreRef.current || !hasMore) return;
    // If the content doesn't overflow, we can't scroll, so trigger loadMore automatically.
    const isScrollable = el.scrollHeight > el.clientHeight + 20;
    if (isScrollable) return;
    if (autoLoadAttemptsRef.current >= 4) return; // safety cap
    autoLoadAttemptsRef.current += 1;
    triggerLoadMore('autofill');
  }, [historyEntries.length, hasMore, loading, triggerLoadMore]);

  // Handle click outside to close filter popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilters && !target.closest('.filter-container')) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  const handleBackToGeneration = () => {
    dispatch(setCurrentView('generation'));
  };

  // Drag selection functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      wasDraggingRef.current = false;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragEnd({ x: e.clientX, y: e.clientY });
      setDragBox({
        left: e.clientX,
        top: e.clientY,
        width: 0,
        height: 0
      });
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Check if clicking on empty space (not on images or other interactive elements)
    const target = e.target as HTMLElement;
    const isClickingOnImage = target.closest('[data-image-id]');
    const isClickingOnButton = target.closest('button');
    const isClickingOnInteractive = target.closest('button, a, input, select, textarea');

    // Only clear selection if not dragging and clicking on empty space (not on images or buttons)
    if (!wasDraggingRef.current &&
      !isClickingOnImage &&
      !isClickingOnInteractive &&
      selectedImages.size > 0) {
      clearSelection();
    }
    // Reset the drag flag for next interaction
    wasDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      wasDraggingRef.current = true;
      setDragEnd({ x: e.clientX, y: e.clientY });
      const newDragBox = {
        left: Math.min(dragStart.x, e.clientX),
        top: Math.min(dragStart.y, e.clientY),
        width: Math.abs(e.clientX - dragStart.x),
        height: Math.abs(e.clientY - dragStart.y)
      };
      setDragBox(newDragBox);

      // Update selection in real-time while dragging - only if we have a significant drag
      if (newDragBox.width > 5 && newDragBox.height > 5) {
        const newSelected = new Set(selectedImages);
        const dragRect = newDragBox;

        // Query all image elements and check intersection
        const imageElements = document.querySelectorAll('[data-image-id]');
        imageElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (
            rect.left < dragRect.left + dragRect.width &&
            rect.right > dragRect.left &&
            rect.top < dragRect.top + dragRect.height &&
            rect.bottom > dragRect.top
          ) {
            const key = element.getAttribute('data-image-id');
            if (key) {
              newSelected.add(key);
            }
          }
        });

        setSelectedImages(newSelected);
        setShowDownloadBar(newSelected.size > 0);
      }
    }
  };

  const handleMouseUp = () => {
    // Selection is already updated in real-time during drag, just clean up
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragBox(null);
  };

  const toggleImageSelection = (entryId: string, mediaId: string) => {
    const key = `${entryId}-${mediaId}`;
    const newSelected = new Set(selectedImages);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedImages(newSelected);
    setShowDownloadBar(newSelected.size > 0);
  };

  const handleImageClick = (e: React.MouseEvent, entry: HistoryEntry, media: any, mediaIndex: number) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }

    const key = `${entry.id}-${media.id || mediaIndex}`;
    const isSelected = selectedImages.has(key);

    // Check if this is a user upload
    const inputImagesArr = (((entry as any).inputImages) || []) as any[];
    const inputVideosArr = (((entry as any).inputVideos) || []) as any[];
    const isUserUpload = inputImagesArr.includes(media) || inputVideosArr.includes(media);

    // If image is selected, unselect it instead of opening preview
    if (isSelected) {
      e.stopPropagation();
      const newSelected = new Set(selectedImages);
      newSelected.delete(key);
      setSelectedImages(newSelected);
      setShowDownloadBar(newSelected.size > 0);
      return;
    }

    // If no images are selected, open preview modal as normal (but not for user uploads)
    if (selectedImages.size === 0) {
      // Don't open preview for user uploads - they're just uploaded files
      if (isUserUpload) {
        e.stopPropagation();
        toggleImageSelection(entry.id, media.id || mediaIndex.toString());
        return;
      }

      const mediaUrl = media.firebaseUrl || media.url;
      const video = isVideoUrl(mediaUrl);
      const audio = isAudioUrl(mediaUrl);
      const typeNorm = String(entry.generationType || '').replace(/[_-]/g, '-').toLowerCase();

      if (video) {
        setVideoPreview({ entry, video: media });
      } else if (audio) {
        setAudioPreview({ entry, audioUrl: mediaUrl });
      } else if (typeNorm === 'logo' || typeNorm === 'logo-generation') {
        setLogoPreviewEntry(entry);
      } else if (typeNorm === 'sticker-generation') {
        setStickerPreviewEntry(entry);
      } else if (typeNorm === 'product-generation') {
        setProductPreviewEntry(entry);
      } else {
        setPreview({ entry, image: media });
      }
      return;
    }

    // If other images are selected, select this one too
    e.stopPropagation();
    toggleImageSelection(entry.id, media.id || mediaIndex.toString());
  };


  const clearSelection = () => {
    setSelectedImages(new Set());
    setShowDownloadBar(false);
  };

  const deleteSelectedImages = async () => {
    try {
      if (!window.confirm(`Delete ${selectedImages.size} selected item${selectedImages.size !== 1 ? 's' : ''} permanently? This cannot be undone.`)) {
        return;
      }

      const deletePromises: Promise<void>[] = [];
      let successCount = 0;
      const failedDeletes: string[] = [];

      historyEntries.forEach((entry: HistoryEntry) => {
        const mediaItems = entry.images || entry.videos || (entry as any).audios || [];
        mediaItems.forEach((media: any, index: number) => {
          const key = `${entry.id}-${media.id || index}`;
          if (selectedImages.has(key)) {
            deletePromises.push(
              axiosInstance.delete(`/api/generations/${entry.id}`)
                .then(() => {
                  dispatch(removeHistoryEntry(entry.id));
                  successCount++;
                })
                .catch(() => {
                  failedDeletes.push(entry.id);
                })
            );
          }
        });
      });
      await Promise.all(deletePromises);

      if (failedDeletes.length > 0) {
        alert(`${failedDeletes.length} items couldn't be deleted. Please try again.`);
      } else {
        // success
      }

      clearSelection();
    } catch (error) {
      alert('Delete failed. Please try again.');
    }
  };

  // Keyboard shortcut: Delete key removes selected items
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when a modal is open or focus is in an input-like element
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (target?.getAttribute('contenteditable') === 'true');
      const anyModalOpen = Boolean(preview || videoPreview || audioPreview || logoPreviewEntry || stickerPreviewEntry || productPreviewEntry);
      if (isTyping || anyModalOpen) return;
      if (e.key === 'Delete' && selectedImages.size > 0) {
        e.preventDefault();
        deleteSelectedImages();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImages.size, preview, videoPreview, audioPreview, logoPreviewEntry, stickerPreviewEntry, productPreviewEntry]);

  // Helper function to get file type from URL or media
  const getFileType = (media: any, url: string) => {
    const u = url.toLowerCase();
    if (u.startsWith('data:video') || /(\.mp4|\.webm|\.mov|\.mkv)(\?|$)/i.test(u)) return 'video';
    if (u.startsWith('data:audio') || /(\.mp3|\.wav|\.m4a|\.ogg|\.aac|\.flac)(\?|$)/i.test(u)) return 'audio';
    if (/(\.png|\.jpg|\.jpeg|\.webp|\.gif)(\?|$)/i.test(u)) return 'image';
    return 'image';
  };

  // Calculate total credits for selected items
  const calculateTotalCredits = () => {
    let totalCredits = 0;

    historyEntries.forEach((entry: HistoryEntry) => {
      const mediaItems = [
        ...((entry.images || []) as any[]),
        ...(((entry as any).videos || []) as any[]),
        ...(((entry as any).audios || []) as any[]),
      ];

      mediaItems.forEach((media: any, index: number) => {
        const key = `${entry.id}-${media.id || index}`;
        if (selectedImages.has(key)) {
          // Get model information from entry - try multiple possible fields
          const model = (entry as any).model ||
            (entry as any).videoModel ||
            (entry as any).audioModel ||
            (entry as any).imageModel ||
            (entry as any).musicModel ||
            (entry as any).generationModel;

          const duration = (entry as any).duration || (entry as any).videoDuration;
          const resolution = (entry as any).resolution || (entry as any).videoResolution;


          if (model) {
            const credits = getCreditsForModel(model, duration, resolution);
            if (credits !== null) {
              totalCredits += credits;
            }
          } else {
            // If no model found, try to estimate based on media type
            const mediaType = getFileType(media, media.url || media.firebaseUrl || '');
            if (mediaType === 'video') {
              // Default video credits (5s duration)
              totalCredits += 620; // Default gen4_turbo 5s
            } else if (mediaType === 'audio') {
              // Default audio credits
              totalCredits += 90; // Default music-1.5
            } else {
              // Default image credits
              totalCredits += 110; // Default flux-pro
            }
            // silent
          }
        }
      });
    });

    // silent
    return totalCredits;
  };

  // Derive original extension from a URL or data URI
  const getExtensionFromUrl = (url: string): string | null => {
    try {
      // Handle data URIs like: data:audio/mpeg;base64,...
      if (url.startsWith('data:')) {
        const match = url.match(/^data:([^;]+);/);
        if (match && match[1]) {
          const mime = match[1];
          const ext = getExtensionFromMime(mime);
          if (ext) return ext;
        }
        return null;
      }

      // Strip query/hash
      const clean = url.split('?')[0].split('#')[0];
      const last = clean.split('/').pop() || '';
      const dotIdx = last.lastIndexOf('.');
      if (dotIdx > 0 && dotIdx < last.length - 1) {
        const rawExt = last.substring(dotIdx + 1).toLowerCase();
        // Whitelist known extensions
        const allowed = new Set(['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac', 'mp4', 'webm', 'mov', 'mkv', 'png', 'jpg', 'jpeg', 'webp', 'gif']);
        if (allowed.has(rawExt)) return rawExt;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getExtensionFromMime = (mime: string): string | null => {
    const map: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mime] || null;
  };

  // Helper functions to convert URLs to proxy URLs (like preview modals)
  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    return toResourceProxy(urlOrPath) || '';
  };

  const toFrontendProxyMediaUrl = (urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    return toMediaProxy(urlOrPath) || '';
  };

  // Helper function to download single file using proxy URLs
  const downloadSingleFile = async (url: string, filename: string) => {
    try {
      // Convert to proxy URL to avoid CORS issues
      const proxyUrl = toProxyDownloadUrl(url);
      if (!proxyUrl) {
        throw new Error('Unable to create proxy URL');
      }

      const response = await fetch(proxyUrl, { credentials: 'include' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(objectUrl);
      return true;
    } catch (_error) {
      try {
        // Fallback: open the original URL in a new tab; browser will handle download if allowed
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.download = filename; // may be ignored cross-origin, but harmless
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      } catch (_e) {
        return false;
      }
    }
  };

  const downloadSelectedImages = async () => {
    try {
      const selectedItems: Array<{
        key: string;
        entryId: string;
        mediaId: string;
        url: string;
        fileType: 'image' | 'video' | 'audio';
      }> = [];

      historyEntries.forEach((entry: HistoryEntry) => {
        const mediaItems = [
          ...((entry.images || []) as any[]),
          ...(((entry as any).videos || []) as any[]),
          ...(((entry as any).audios || []) as any[]),
        ];

        mediaItems.forEach((media: any, index: number) => {
          const mediaId = String(media.id ?? index);
          const key = `${entry.id}-${mediaId}`;
          if (!selectedImages.has(key)) return;

          const url = media.url || media.originalUrl || media.firebaseUrl;
          if (!url) return;

          selectedItems.push({
            key,
            entryId: String(entry.id),
            mediaId,
            url,
            fileType: getFileType(media, url),
          });
        });
      });

      if (selectedItems.length === 0) {
        return;
      }

      // Preserve existing single-item behavior
      if (selectedItems.length === 1) {
        const item = selectedItems[0];
        const ok = await downloadFileWithNaming(item.url, null, item.fileType);
        if (!ok) {
          alert(`1 file couldn't be downloaded. Please try again.`);
        }
        clearSelection();
        return;
      }

      // Multi-select: download as a single ZIP
      const sanitize = (name: string) => name.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');
      const now = new Date();
      const date = now.toISOString().split('T')[0].replace(/-/g, '_');
      const time = now.toTimeString().split(' ')[0].replace(/:/g, '_');
      const zipBaseName = sanitize(`wildmind_history_${date}_${time}`);

      const zip = new JSZip();
      const folder = zip.folder(zipBaseName) ?? zip;

      const failedKeys: string[] = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        try {
          const proxyUrl = toProxyDownloadUrl(item.url) || item.url;
          const response = await fetch(proxyUrl, { credentials: 'include' });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type') || '';
          const blob = await response.blob();

          // Determine extension
          let ext = getExtensionFromMime(contentType) || getExtensionFromUrl(item.url) || null;
          if (!ext) {
            if (item.fileType === 'video') ext = 'mp4';
            else if (item.fileType === 'audio') ext = 'mp3';
            else ext = 'png';
          }

          const innerName = sanitize(`${String(i + 1).padStart(3, '0')}_${item.fileType}_${item.entryId}_${item.mediaId}.${ext}`);
          folder.file(innerName, blob);
        } catch (_e) {
          failedKeys.push(item.key);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const objectUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${zipBaseName}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);

      if (failedKeys.length > 0) {
        alert(`${failedKeys.length} files couldn't be added to the ZIP. You can try downloading those individually.`);
      }

      clearSelection();
    } catch (error) {
      alert('Download failed. Please try again.');
    }
  };

  // Filter functions
  const handleFilterChange = (key: keyof HistoryFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value) {
      (newFilters as any)[key] = value;
    } else {
      delete (newFilters as any)[key];
    }
    setLocalFilters(newFilters);
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
    if (start && end) {
      setLocalFilters(prev => ({
        ...prev,
        dateRange: { start, end }
      }));
    } else {
      setLocalFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters.dateRange;
        return newFilters;
      });
    }
  };

  // NOTE: sort is handled via onSortChange() (backend-only) to preserve pagination correctness.

  const applyFilters = async () => {
    const finalFilters = { ...filters };
    if (dateRange.start && dateRange.end) {
      finalFilters.dateRange = { start: dateRange.start, end: dateRange.end };
    }

    dispatch(setFilters(finalFilters));
    await loadFirstPage(finalFilters);

    setPage(1);
  };

  const clearAllFilters = async () => {
    setLocalFilters({});
    setDateRange({ start: null, end: null });
    setSortOrder('desc');
    dispatch(clearFilters());
    const base = {};
    await loadFirstPage(base);

    setPage(1);
  };



  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getGenerationTypeLabel = (type: string) => {
    switch (type) {
      case 'text-to-image': return 'Text to Image';
      case 'logo-generation': return 'Logo Generation';
      case 'sticker-generation': return 'Sticker Generation';
      case 'text-to-video': return 'Text to Video';
      case 'text-to-music': return 'Text to Music';
      default: return type;
    }
  };

  const isVideoUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|$)/i.test(url);
  };

  const isAudioUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('data:audio') || /\.(mp3|wav|m4a|ogg|aac|flac)(\?|$)/i.test(url);
  };

  // Filter entries by search query
  // Search is now handled server-side, so we can use historyEntries directly
  // But keep this as a safety net for backward compatibility
  const filteredEntries = useMemo(() => {
    // Backend should handle search, so just return entries as-is
    // If backend doesn't filter, we can add client-side fallback here if needed
    return historyEntries;
  }, [historyEntries]);

  // Group entries by date while PRESERVING backend order (do not sort dates or entries in frontend).
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    const dateOrder: string[] = [];
    for (const entry of filteredEntries) {
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
        dateOrder.push(dateKey);
      }
      groups[dateKey].push(entry);
    }
    return { groups, dateOrder };
  }, [filteredEntries]);

  // Calculate total filtered items count
  const getFilteredItemsCount = () => {
    let count = 0;
    (Object.values(groupedByDate.groups) as HistoryEntry[][]).forEach((entries: HistoryEntry[]) => {
      entries.forEach((entry: HistoryEntry) => {
        const inputImagesArr = (((entry as any).inputImages) || []) as any[];
        const inputVideosArr = (((entry as any).inputVideos) || []) as any[];
        const mediaItems = [
          ...inputImagesArr,
          ...inputVideosArr,
          ...((entry.images || []) as any[]),
          ...(((entry as any).videos || []) as any[]),
          ...(((entry as any).audios || []) as any[]),
        ];

        let filteredMediaItems = mediaItems.filter((media: any) => {
          const isUserUpload = inputImagesArr.includes(media) || inputVideosArr.includes(media);
          const url = media.firebaseUrl || media.url;
          const video = isVideoUrl(url);
          const audio = isAudioUrl(url);
          const image = !video && !audio;

          switch (quickFilter) {
            case 'user-uploads':
              return isUserUpload;
            case 'images':
              return !isUserUpload && image;
            case 'videos':
              return !isUserUpload && video;
            case 'music':
              return !isUserUpload && audio;
            default:
              return !isUserUpload;
          }
        });

        // For music filter, deduplicate audio media items that share the same URL/id
        if (quickFilter === 'music') {
          const seen = new Set<string>();
          filteredMediaItems = filteredMediaItems.filter((media: any) => {
            const url = media.firebaseUrl || media.url || media.originalUrl || '';
            const key = url || media.id || '';
            if (!key) return true;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        count += filteredMediaItems.length;
      });
    });
    return count;
  };

  const sortedDates = groupedByDate.dateOrder;

  // Header title to mirror TextToImage wording
  const headerTitle = quickFilter === 'user-uploads'
    ? 'Your Uploads'
    : viewMode === 'global'
      ? 'All Generation History'
      : (currentGenerationType === 'text-to-image'
        ? 'Image Generation History'
        : `${getGenerationTypeLabel(currentGenerationType)} History`);

  // Only show full-screen loader on initial load, not during search
  // If user is searching, don't show full-screen loader even if entries are empty
  if (loading && historyEntries.length === 0 && !overlayLoading && !searchQuery.trim()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Image src="/styles/Logo.gif" alt="Generating" width={72} height={72} className="mx-auto" unoptimized />
          <div className="text-white text-lg text-center">Loading your generation history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#07070B] text-white md:p-2 select-none">
      {/* Fixed Header with title and controls */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#07070B] backdrop-blur-xl shadow-xl px-3">
        <div className="pt-10 md:pt-4  md:px-8">
          <div className="flex  md:items-center gap-4 md:pl-14 pb-2">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-white pb-2 ">{headerTitle}</h2>
              <div className="hidden md:block text-white/80 text-sm mt-0">{getFilteredItemsCount()} {quickFilter === 'user-uploads' ? 'uploads' : 'generations'}</div>
            </div>

            {/* Filter pills (left) - keep visible near title */}
            <div className="flex flex-wrap gap-2 -mt-6">
              {([
                { key: 'all', label: 'All' },
                { key: 'images', label: 'Images' },
                { key: 'videos', label: 'Videos' },
                { key: 'music', label: 'Music' },
                { key: 'user-uploads', label: 'Your Uploads' },
              ] as Array<{ key: any; label: string }>).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={async () => {
                    setQuickFilter(key);
                    setPillLoading(true);
                    setOverlayLoading(true);
                    let f: any = {};
                    switch (key) {
                      case 'images': f = { mode: 'image' }; break;
                      case 'videos': f = { mode: 'video' }; break;
                      case 'music': f = { generationType: 'text-to-music' }; break;
                      case 'user-uploads': f = { isUserUpload: true }; break;
                      default: f = {};
                    }
                    if (sortOrder) (f as any).sortOrder = sortOrder;
                    if (dateRange.start && dateRange.end) (f as any).dateRange = { start: dateRange.start, end: dateRange.end };
                    setLocalFilters(f);
                    dispatch(setFilters(f));
                    dispatch(clearHistory());
                    await loadFirstPage(f);
                    setPage(1);
                    setPillLoading(false);
                    setOverlayLoading(false);
                  }}
                  className={`inline-flex items-center md:gap-1 md:px-3 px-2 md:py-1 py-1 rounded-lg md:text-sm text-[11px] font-medium transition-all border whitespace-nowrap ${quickFilter === key
                    ? 'bg-white border-white/5 text-black shadow-sm'
                    : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Right-side controls for desktop: use shared HistoryControls component */}
            <div className="flex items-center ml-auto gap-3 -mt-3">
              <div className="hidden md:flex items-center justify-end gap-2">
                <HistoryControls
                  mode={currentGenerationType === 'text-to-video' ? 'video' : 'image'}
                  onSearchChange={(s) => {
                    setSearchQuery(String(s || ''));
                    setPage(1);
                  }}
                  onSortChange={(order) => {
                    setSortOrder(order);
                    setPage(1);
                  }}
                  onDateChange={(dr) => {
                    setDateRange({ start: dr.start, end: dr.end });
                    setDateInput(dr.start ? dr.start.toISOString().slice(0, 10) : '');
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only: Search, Sort buttons, and Date Picker below filter buttons */}
        <div className="flex md:hidden flex-col gap-1 mt-0 w-full pb-1 mx-4">
          {/* First row: Search and Date Picker */}
          <div className="flex items-center gap-1 w-full">
            {/* Search Input */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Search is already applied via backend API
                  }
                }}
                placeholder="Search by prompt..."
                className={`w-full px-2 py-1 rounded-lg text-sm bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 text-white placeholder-white/70 placeholder:text-xs ${searchQuery ? 'pr-10' : ''}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSortChange('desc')}
                className={`relative group px-2 py-1.5 rounded-lg text-xs ${sortOrder === 'desc' ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                aria-label="Recent"
              >
                <div className="flex items-center gap-1.5">
                  <img src="/icons/upload-square-2 (1).svg" alt="Recent" className={`${sortOrder === 'desc' ? '' : 'invert'} w-4 h-4`} />
                  <span className="text-xs">Recent</span>
                </div>
              </button>
              <button
                onClick={() => onSortChange('asc')}
                className={`relative group px-2 py-1.5 rounded-lg text-xs ${sortOrder === 'asc' ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                aria-label="Oldest"
              >
                <div className="flex items-center gap-1.5">
                  <img src="/icons/download-square-2.svg" alt="Oldest" className={`${sortOrder === 'asc' ? '' : 'invert'} w-4 h-4`} />
                  <span className="text-xs">Oldest</span>
                </div>
              </button>
            </div>

            {/* Date picker - Mobile only */}
            <div className="relative flex items-center gap-1">
              {/* Hidden native date input used for calendar picker */}
              <input
                ref={dateInputRef}
                type="date"
                value={dateInput}
                onChange={async (e) => {
                  const value = e.target.value;
                  if (!value) {
                    await onDateChange(null, null);
                    return;
                  }
                  const d = new Date(value + 'T00:00:00');
                  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
                  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
                  await onDateChange(start, end);
                }}
                // Keep it in-viewport but invisible for reliable native picker behavior
                style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0 }}
              />
              <button
                onClick={() => {
                  // Initialize calendar to selected date or today
                  const base = dateRange.start ? new Date(dateRange.start) : new Date();
                  setCalendarMonth(base.getMonth());
                  setCalendarYear(base.getFullYear());
                  setShowCalendar((v) => !v);
                }}
                className={`relative group px-1 py-1 rounded-lg text-xs ${(showCalendar || dateRange.start) ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                aria-label="Date"
              >
                <img src="/icons/calendar-days.svg" alt="Date" className={`${(showCalendar || dateRange.start) ? '' : 'invert'} w-5 h-5`} />
              </button>



              {showCalendar && (
                <div
                  ref={calendarRef}
                  data-calendar-popup="true"
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute right-9 top-full mt-1 z-40 w-[200px] select-none bg-white/5 backdrop-blur-3xl rounded-xl ring-1 ring-white/20 shadow-2xl p-0 px-2 pb-2"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-0 text-white">
                    <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => {
                      const prev = new Date(calendarYear, calendarMonth - 1, 1);
                      setCalendarYear(prev.getFullYear());
                      setCalendarMonth(prev.getMonth());
                    }}>‹</button>
                    <div className="text-sm font-semibold">
                      {new Date(calendarYear, calendarMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                    <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => {
                      const next = new Date(calendarYear, calendarMonth + 1, 1);
                      setCalendarYear(next.getFullYear());
                      setCalendarMonth(next.getMonth());
                    }}>›</button>
                  </div>
                  {/* Weekdays */}
                  <div className="grid grid-cols-7 text-[11px] text-white/70 mb-0">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (<div key={d} className="text-center py-1">{d}</div>))}
                  </div>
                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: calendarFirstWeekday }).map((_, i) => (
                      <div key={`pad-${i}`} className="h-6 text-xs" />
                    ))}
                    {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const thisDate = new Date(calendarYear, calendarMonth, day);
                      const isSelected = !!dateRange.start && new Date(dateRange.start).toDateString() === thisDate.toDateString();
                      return (
                        <button
                          key={day}
                          className={`h-6 rounded text-xs text-center text-white hover:bg-white/15 ${isSelected ? 'bg-white/25 ring-1 ring-white/40' : 'bg-white/5'}`}
                          onClick={async () => {
                            const start = new Date(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate(), 0, 0, 0);
                            const end = new Date(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate(), 23, 59, 59, 999);
                            await onDateChange(start, end, true);
                          }}
                        >{day}</button>
                      );
                    })}
                  </div>
                  {/* Footer actions */}
                  <div className="flex items-center justify-between mt-1">
                    <button className="text-white/80 text-xs px-2 py-1 rounded hover:bg-white/10" onClick={async () => {
                      await onDateChange(null, null, true);
                    }}>Clear</button>
                    <button className="text-white/90 text-xs px-2 py-1 rounded hover:bg-white/10" onClick={() => {
                      const now = new Date();
                      setCalendarMonth(now.getMonth());
                      setCalendarYear(now.getFullYear());
                    }}>Today</button>
                  </div>
                </div>
              )}
              <div className="w-8 h-8 flex items-center justify-center">
                {dateRange.start && (
                  <button
                    className="px-1 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-md"
                    onClick={async () => {
                      await onDateChange(null, null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Second row: Sort buttons (Newest/Oldest) - Mobile only */}

          </div>
          {/* End of fixed controls section */}
        </div>
        {/* End of fixed header */}

        {/* Spacer for fixed header */}
        <div className="h-auto"></div>

        {/* Scrollable content area */}
        <div
          ref={scrollContainerRef}
          className="relative mt-0 overflow-y-auto no-scrollbar md:ml-14"
          style={{ maxHeight: 'calc(120vh - 200px)' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >

          {/* Active Filters Summary */}
          {/* {(filters.generationType || filters.model || filters.status || dateRange.start || dateRange.end) && (
          <div className="mb-6 p-4 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
              <span className="text-sm font-medium text-blue-400">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.generationType && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30">
                  Type: {getGenerationTypeLabel(filters.generationType)}
                </span>
              )}
              {filters.model && (
                <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-md border border-green-500/30">
                  Model: {filters.model}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-md border border-yellow-500/30">
                  Status: {filters.status}
                </span>
              )}
              {dateRange.start && dateRange.end && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md border border-purple-500/30">
                  Date: {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                </span>
              )}
              <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-md border border-gray-500/30">
                Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </span>
            </div>
          </div>
        )} */}

          {/* History Entries - TextToImage-like UI: date-grouped tiles */}
          {(getFilteredItemsCount() === 0 && !overlayLoading && !loading) ? (
            <div className="text-center pt-12">
              <div className="w-16 h-16 md:mx-auto mb-4 text-white/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-white/70 mb-2">
                {(() => {
                  if (quickFilter === 'user-uploads') return 'No uploads found';
                  if (quickFilter === 'videos') return 'No video generations found';
                  if (quickFilter === 'music') return 'No audio generations found';
                  if (quickFilter === 'images') return 'No image generations found';
                  return 'No generations found';
                })()}
              </h3>
              <p className="text-white/50 mb-4">
                {(() => {
                  const hasFilters = Object.keys(filters).length > 0 || Boolean((filters as any)?.dateRange);
                  const subject = quickFilter === 'user-uploads' ? 'uploads' : quickFilter === 'videos' ? 'videos' : quickFilter === 'music' ? 'tracks' : quickFilter === 'images' ? 'images' : 'generations';
                  if (hasFilters) return `Try adjusting your filters or clear them to see all ${subject}.`;
                  return quickFilter === 'user-uploads' ? 'No uploads available yet.' : `No ${subject} available yet.`;
                })()}
              </p>
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div
              className="space-y-8 relative min-h-[300px]"
              onClick={handleContainerClick}
            >
              {/* Removed full-screen overlay - use bottom loading indicator instead */}
              {sortedDates.map((dateKey) => {
                // Check if this date has any filtered items for the active category
                const hasFilteredItems = groupedByDate.groups[dateKey].some((entry: HistoryEntry) => {
                  const inputImagesArr = (((entry as any).inputImages) || []) as any[];
                  const inputVideosArr = (((entry as any).inputVideos) || []) as any[];
                  const mediaItems = [
                    ...inputImagesArr,
                    ...inputVideosArr,
                    ...((entry.images || []) as any[]),
                    ...(((entry as any).videos || []) as any[]),
                    ...(((entry as any).audios || []) as any[]),
                  ];

                  return mediaItems.some((media: any) => {
                    const isUserUpload = inputImagesArr.includes(media) || inputVideosArr.includes(media);
                    const url = media.firebaseUrl || media.url;
                    const video = isVideoUrl(url);
                    const audio = isAudioUrl(url);
                    const image = !video && !audio;

                    switch (quickFilter) {
                      case 'user-uploads':
                        return isUserUpload;
                      case 'images':
                        return !isUserUpload && image;
                      case 'videos':
                        return !isUserUpload && video;
                      case 'music':
                        return !isUserUpload && audio;
                      default:
                        return !isUserUpload;
                    }
                  });
                });

                if (!hasFilteredItems) return null;

                return (
                  <div key={dateKey} className="space-y-2 md:mb-6 mb-3">
                    {/* Date Header */}
                    <div className="flex items-center md:gap-3 gap-1 md:mx-9 mx-4 ">
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                      </div>
                      <h3 className="text-xs md:text-sm font-medium text-white/70">
                        {new Date(dateKey).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </h3>
                    </div>

                    {/* Tiles for this date */}
                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-1 mx-4 md:mx-9">
                      {groupedByDate.groups[dateKey].map((entry: HistoryEntry) => {
                        const inputImagesArr = (((entry as any).inputImages) || []) as any[];
                        const inputVideosArr = (((entry as any).inputVideos) || []) as any[];
                        const mediaItems = [
                          ...inputImagesArr,
                          ...inputVideosArr,
                          ...((entry.images || []) as any[]),
                          ...(((entry as any).videos || []) as any[]),
                          ...(((entry as any).audios || []) as any[]),
                        ];

                        // Filter media items based on quickFilter
                        let filteredMediaItems = mediaItems.filter((media: any, mediaIndex: number) => {
                          const isUserUpload = inputImagesArr.includes(media) || inputVideosArr.includes(media);
                          const url = media.firebaseUrl || media.url;
                          const video = isVideoUrl(url);
                          const audio = isAudioUrl(url);
                          const image = !video && !audio;

                          switch (quickFilter) {
                            case 'user-uploads':
                              return isUserUpload;
                            case 'images':
                              return !isUserUpload && image;
                            case 'videos':
                              return !isUserUpload && video;
                            case 'music':
                              return !isUserUpload && audio;
                            default:
                              return !isUserUpload; // Exclude uploads from normal history
                          }
                        });

                        // Deduplicate audio tiles for music filter (avoid duplicate items with same URL)
                        if (quickFilter === 'music') {
                          const seen = new Set<string>();
                          filteredMediaItems = filteredMediaItems.filter((media: any) => {
                            const url = media.firebaseUrl || media.url || media.originalUrl || '';
                            const key = url || media.id || '';
                            if (!key) return true;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                          });
                        }

                        return filteredMediaItems.map((media: any, mediaIndex: number) => {
                          const mediaUrl = media.firebaseUrl || media.url;
                          const video = isVideoUrl(mediaUrl);
                          const audio = isAudioUrl(mediaUrl);
                          const isUserUpload = inputImagesArr.includes(media) || inputVideosArr.includes(media);
                          return (
                            <div
                              key={`${entry.id}-${video ? 'video' : (audio ? 'audio' : 'image')}-${mediaIndex}`}
                              data-image-id={`${entry.id}-${media.id || mediaIndex}`}
                              onClick={(e) => handleImageClick(e, entry, media, mediaIndex)}
                              className={`relative rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 transition-all duration-200 cursor-pointer group aspect-square ${selectedImages.has(`${entry.id}-${media.id || mediaIndex}`)
                                ? 'ring-blue-400 ring-2 scale-98'
                                : 'ring-white/10 hover:ring-white/20'
                                }`}
                            >
                              {/* Selection Indicator */}
                              {selectedImages.has(`${entry.id}-${media.id || mediaIndex}`) && (
                                <div className="absolute top-2 left-2 z-20">
                                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-400 flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              {entry.status === 'generating' ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/90">
                                  <div className="flex flex-col items-center gap-2">
                                    <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" unoptimized />
                                    <div className="text-xs text-white/60">Generating...</div>
                                  </div>
                                </div>
                              ) : entry.status === 'failed' ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                                  <div className="flex flex-col items-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <div className="text-xs text-red-400">Failed</div>
                                  </div>
                                </div>
                              ) : video ? (
                                <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center relative group">
                                  {mediaUrl ? (
                                    (() => {
                                      const proxied = toFrontendProxyMediaUrl(mediaUrl);
                                      const vsrc = proxied || mediaUrl;
                                      return (
                                        <video
                                          src={vsrc}
                                          className="w-full h-full object-cover transition-opacity duration-200"
                                          muted
                                          playsInline
                                          loop
                                          preload="metadata"
                                          poster={(media as any).thumbnailUrl || (media as any).avifUrl || undefined}
                                          onMouseEnter={async (e) => {
                                            try {
                                              await (e.currentTarget as HTMLVideoElement).play();
                                              setPlayingVideos(prev => new Set(prev).add(`${entry.id}-${mediaIndex}`));
                                            } catch { }
                                          }}
                                          onMouseLeave={(e) => {
                                            const v = e.currentTarget as HTMLVideoElement;
                                            try { v.pause(); v.currentTime = 0 } catch { }
                                            setPlayingVideos(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(`${entry.id}-${mediaIndex}`);
                                              return newSet;
                                            });
                                          }}
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const video = e.currentTarget;
                                            const videoId = `${entry.id}-${mediaIndex}`;

                                            if (video.paused) {
                                              try {
                                                await video.play();
                                                setPlayingVideos(prev => new Set(prev).add(videoId));
                                              } catch (error) {
                                                // silent
                                              }
                                            } else {
                                              video.pause();
                                              video.currentTime = 0;
                                              setPlayingVideos(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(videoId);
                                                return newSet;
                                              });
                                            }
                                          }}
                                          onLoadStart={() => { /* silent */ }}
                                          onLoadedData={() => { /* silent */ }}
                                          onCanPlay={() => { /* silent */ }}
                                        />
                                      );
                                    })()
                                  ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">Video not available</span>
                                    </div>
                                  )}
                                  {isUserUpload && (
                                    <div className="absolute top-2 left-2 bg-white/15 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                                      User upload
                                    </div>
                                  )}
                                  <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity ${playingVideos.has(`${entry.id}-${mediaIndex}`) ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                    }`}>
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                      {playingVideos.has(`${entry.id}-${mediaIndex}`) ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                      ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`absolute bottom-2 right-2 transition-opacity ${playingVideos.has(`${entry.id}-${mediaIndex}`) ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                                    <div className="bg-white/5 backdrop-blur-xl rounded-lg px-1 py-1">
                                      <img src="/icons/videoGenerationiconwhite.svg" alt="Video" className="w-5 h-4" />
                                    </div>
                                  </div>
                                  {playingVideos.has(`${entry.id}-${mediaIndex}`) && (
                                    <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-sm rounded px-2 py-1">
                                      <span className="text-xs text-white font-medium">▶ Playing</span>
                                    </div>
                                  )}
                                  {/* Hover prompt overlay */}
                                  <div className="pointer-events-none absolute bottom-1 right-1 rounded-lg   opacity-0 group-hover:opacity-100 transition-opacity p-1.5 shadow-lg flex items-center gap-1  z-20">
                                    {/* <span
                                  title={getCleanPrompt(entry.prompt)}
                                  className="text-xs text-white flex-1 leading-snug"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3 as any,
                                    WebkitBoxOrient: 'vertical' as any,
                                    overflow: 'hidden'
                                  }}
                                >
                                  {getCleanPrompt(entry.prompt)}
                                </span> */}
                                    <button
                                      aria-label="Copy prompt"
                                      className="pointer-events-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                      onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                    </button>
                                    <button
                                      aria-label="Delete generation"
                                      className="pointer-events-auto p-2 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                      onClick={(e) => handleDeleteGeneration(e, entry)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : audio ? (
                                <div className={`w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-br ${getAudioColorTheme(entry, mediaIndex)} ring-1 ring-white/10 group`}>
                                  {/* Soft radial highlights to match Music history tiles */}
                                  <div className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_60%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(0,0,0,0.35),_transparent_65%)]" />
                                  </div>

                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="w-14 h-14 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-[0_18px_30px_rgba(15,23,42,0.85)]">
                                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                        <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
                                      </svg>
                                    </div>
                                  </div>

                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center">
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>

                                  {/* File / track name label (mirrors MusicHistory) */}
                                  {Boolean((entry as any)?.fileName) && (
                                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md ring-1 ring-white/10 max-w-[calc(100%-4rem)] truncate">
                                      {(entry as any).fileName}
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 border border-white/15">
                                    <span className="text-[11px] text-white/90 font-medium">Audio</span>
                                  </div>
                                  {/* Hover prompt overlay */}
                                  <div className="pointer-events-none absolute bottom-1 right-1 rounded-lg   opacity-0 group-hover:opacity-100 transition-opacity p-1.5 shadow-lg flex items-center gap-1  z-20">
                                    {/* <span
                                  title={getCleanPrompt(entry.prompt)}
                                  className="text-xs text-white flex-1 leading-snug"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3 as any,
                                    WebkitBoxOrient: 'vertical' as any,
                                    overflow: 'hidden'
                                  }}
                                >
                                  {getCleanPrompt(entry.prompt)}
                                </span> */}
                                    <button
                                      aria-label="Copy prompt"
                                      className="pointer-events-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                      onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                    </button>
                                    <button
                                      aria-label="Delete generation"
                                      className="pointer-events-auto p-2 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                      onClick={(e) => handleDeleteGeneration(e, entry)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full relative">
                                  {mediaUrl ? (
                                    (() => {
                                      const isBlobOrData = /^data:|^blob:/i.test(mediaUrl || '');
                                      if (isBlobOrData) {
                                        // Avoid rendering base64/blob heavy sources in grid; show lightweight placeholder
                                        return (
                                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">Image pending</span>
                                          </div>
                                        );
                                      }
                                      return (
                                        <img
                                          src={(media as any).thumbnailUrl || (media as any).avifUrl || mediaUrl}
                                          alt={entry.prompt}
                                          loading="lazy"
                                          decoding="async"
                                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          sizes="192px"
                                          onLoad={() => {
                                            try {
                                              setTimeout(() => {
                                                const shimmer = document.querySelector(`[data-image-id=\"${entry.id}-${media.id || mediaIndex}\"] .shimmer`) as HTMLElement;
                                                if (shimmer) shimmer.style.opacity = '0';
                                              }, 100);
                                            } catch { }
                                          }}
                                        />
                                      );
                                    })()
                                  ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                      <span className="text-gray-400 text-xs">Image not available</span>
                                    </div>
                                  )}
                                  {isUserUpload && (
                                    <div className="absolute top-2 left-2 bg-white/15 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                                      User upload
                                    </div>
                                  )}
                                  <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                  {/* Hover prompt overlay */}
                                  <div className="pointer-events-none absolute bottom-1 right-1 rounded-lg   opacity-0 group-hover:opacity-100 transition-opacity p-1.5 shadow-lg flex items-center gap-1  z-20">
                                    <button
                                      aria-label="Copy prompt"
                                      className="pointer-events-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                      onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                    </button>
                                    <button
                                      aria-label="Delete generation"
                                      className="pointer-events-auto p-2 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                      onClick={(e) => handleDeleteGeneration(e, entry)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                );
              })}
              {/* Loader for scroll loading */}
              {hasMore && loading && (
                <div className="flex items-center justify-center py-8 pb-24">
                  <div className="flex flex-col items-center gap-3">
                    <Image src="/styles/Logo.gif" alt="Generating" width={68} height={68} className="mx-auto" />
                    <div className="text-sm md:text-lg text-white/60">Loading more generations...</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Drag Selection Box */}
        {isDragging && dragBox && (
          <div
            className="fixed pointer-events-none z-50 border-2 border-blue-400 bg-blue-400/20"
            style={{
              left: dragBox.left,
              top: dragBox.top,
              width: dragBox.width,
              height: dragBox.height,
            }}
          />
        )}

        {/* Download Bar */}

        {showDownloadBar && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M5 19h14" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium text-sm">
                    {selectedImages.size} item{selectedImages.size !== 1 ? 's' : ''} selected
                    {(() => {
                      const totalCredits = calculateTotalCredits();
                      return totalCredits > 0 ? ` • ${totalCredits} credits` : '';
                    })()}
                  </div>
                  <div className="text-white/60 text-xs">
                    Ready to download
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={downloadSelectedImages}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600/90 text-white text-sm transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {(() => {
                    const count = selectedImages.size;
                    const types = new Set();
                    historyEntries.forEach((entry: HistoryEntry) => {
                      const mediaItems = [
                        ...((entry.images || []) as any[]),
                        ...(((entry as any).videos || []) as any[]),
                        ...(((entry as any).audios || []) as any[]),
                      ];
                      mediaItems.forEach((media: any, index: number) => {
                        const key = `${entry.id}-${media.id || index}`;
                        if (selectedImages.has(key)) {
                          const url = media.url || media.originalUrl || media.firebaseUrl;
                          if (url) {
                            const fileType = getFileType(media, url);
                            types.add(fileType);
                          }
                        }
                      });
                    });

                    const typeText = types.size === 1
                      ? Array.from(types)[0] === 'video' ? 'Videos'
                        : Array.from(types)[0] === 'audio' ? 'Audio Files'
                          : 'Images'
                      : 'Files';

                    return `Download ${count} ${typeText}`;
                  })()}
                </button>
                <button
                  onClick={deleteSelectedImages}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600/80 hover:bg-red-600/90 text-white text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete {selectedImages.size}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* End of scrollable content area */}

      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
      <VideoPreviewModal preview={videoPreview} onClose={() => setVideoPreview(null)} />
      {logoPreviewEntry && (
        <LogoImagePreview isOpen={true} onClose={() => setLogoPreviewEntry(null)} entry={logoPreviewEntry} />
      )}
      {stickerPreviewEntry && (
        <StickerImagePreview isOpen={true} onClose={() => setStickerPreviewEntry(null)} entry={stickerPreviewEntry} />
      )}
      {productPreviewEntry && (
        <ProductImagePreview isOpen={true} onClose={() => setProductPreviewEntry(null)} entry={productPreviewEntry} />
      )}
      {audioPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAudioPreview(null)}>
          <div className="bg-black/80 border border-white/10 rounded-2xl w-full max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/90 text-sm font-medium">Audio Preview</h3>
              <button className="text-white/60 hover:text-white/90" onClick={() => setAudioPreview(null)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <CustomAudioPlayer
              audioUrl={audioPreview.audioUrl}
              prompt={(audioPreview.entry as any).prompt}
              model={audioPreview.entry.model}
              lyrics={(audioPreview.entry as any).lyrics}
              generationType={(audioPreview.entry as any).generationType}
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  );
};


export default History;
