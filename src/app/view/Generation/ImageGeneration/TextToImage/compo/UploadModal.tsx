'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { fetchLibrary, fetchUploads, LibraryItem, UploadItem, saveUpload, getLibraryPage, getUploadsPage } from '@/lib/libraryApi';
import { toMediaProxy, toDirectUrl } from '@/lib/thumb';
import toast from 'react-hot-toast';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (urls: string[]) => void;
  remainingSlots: number; // how many images can still be added (max 4 total)
  initialTab?: 'library' | 'computer' | 'uploads';
  enableCameraCapture?: boolean;
  cameraFacingMode?: 'user' | 'environment';
  onTabChange?: (tab: 'library' | 'computer' | 'uploads') => void; // Callback when tab changes
  // Optional: allow parent to pass pre-fetched history/library entries (shape is flexible)
  historyEntries?: any[];
  // Optional: allow parent to provide loading/hasMore values for the provided history
  // Optional: allow parent to provide loading/hasMore values for the provided history
  hasMore?: boolean;
  loading?: boolean;
  accept?: string;
  persistLocalDeviceUploads?: boolean;
  maxFileSizeBytes?: number;
};

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  remainingSlots,
  initialTab,
  enableCameraCapture = false,
  cameraFacingMode = 'environment',
  onTabChange,
  historyEntries: propHistoryEntries,
  hasMore: propHasMore,
  loading: propLoading,
  accept = 'image/*',
  persistLocalDeviceUploads = true,
  maxFileSizeBytes,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [tab, setTab] = React.useState<'library' | 'computer' | 'uploads'>('uploads');

  // State for library and uploads data
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>([]);
  const [uploadItems, setUploadItems] = React.useState<UploadItem[]>([]);
  const [libraryNextCursor, setLibraryNextCursor] = React.useState<string | number | undefined>();
  const [uploadNextCursor, setUploadNextCursor] = React.useState<string | number | undefined>();
  const [libraryHasMore, setLibraryHasMore] = React.useState(false);
  const [uploadHasMore, setUploadHasMore] = React.useState(false);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const uploadExhaustedRef = React.useRef(false); // stop infinite fetch when backend returns no items
  const onTabChangePrevTabRef = React.useRef<typeof tab | null>(null);
  const onTabChangeCallbackRef = React.useRef(onTabChange);
  const isProcessingTabChangeRef = React.useRef(false);

  // Store the latest callback in a ref to avoid dependency issues
  React.useEffect(() => {
    onTabChangeCallbackRef.current = onTabChange;
  }, [onTabChange]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Call onTabChange when tab changes, but only once per tab change and only when modal is open
  React.useEffect(() => {
    if (!isOpen) {
      // Reset tracking when modal closes
      onTabChangePrevTabRef.current = null;
      isProcessingTabChangeRef.current = false;
      return;
    }

    // Prevent processing if already processing a tab change
    if (isProcessingTabChangeRef.current) {
      return;
    }

    // Only call onTabChange if:
    // 1. Tab actually changed (not initial render)
    // 2. Modal is open
    // 3. We're not already processing a tab change
    if (onTabChangePrevTabRef.current !== null && onTabChangePrevTabRef.current !== tab) {
      const callback = onTabChangeCallbackRef.current;
      if (callback) {
        isProcessingTabChangeRef.current = true;
        // Use requestAnimationFrame to break the update cycle and prevent infinite loops
        requestAnimationFrame(() => {
          try {
            callback(tab);
          } finally {
            // Reset the processing flag after a delay to allow state updates to complete
            setTimeout(() => {
              isProcessingTabChangeRef.current = false;
            }, 100);
          }
        });
      }
    }
    onTabChangePrevTabRef.current = tab;
  }, [tab, isOpen]); // Removed onTabChange from dependencies to prevent re-runs

  // Clear local uploads when entering Your Uploads tab to ensure no stale cross-icon previews
  React.useEffect(() => {
    if (isOpen && tab === 'uploads') {
      setLocalUploads([]);
    }
  }, [isOpen, tab]);
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [localUploads, setLocalUploads] = React.useState<string[]>([]);
  const [isSavingLocalUploads, setIsSavingLocalUploads] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const localUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const imageExtensionRegex = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;
  const makeMediaKey = React.useCallback((item: any) => {
    return `${item?.historyId || ''}|${item?.storagePath || ''}|${item?.url || ''}|${item?.id || ''}`;
  }, []);

  const isSupportedImageFile = React.useCallback((file: File) => {
    if (file.type && file.type.startsWith('image/')) return true;
    return imageExtensionRegex.test(file.name || '');
  }, []);

  const addFilesToLocalUploads = React.useCallback(async (rawFiles: File[]) => {
    console.log('[UploadModal] addFilesToLocalUploads called with:', rawFiles.length, 'files', { tab, persistLocalDeviceUploads, remainingSlots });
    // For Your Uploads, we allow uploading as many as selected to the storage.
    // Selection/Adding to prompt is handled separately in handleAdd.
    const slotsLeft = (tab === 'uploads') ? rawFiles.length : Math.max(0, remainingSlots - localUploads.length);
    if (slotsLeft <= 0) {
      console.log('[UploadModal] No slots left, returning');
      return;
    }

    const files = Array.from(rawFiles).slice(0, slotsLeft);
    const validFiles = files.filter(f => {
      const isImg = f.type.startsWith('image/') || imageExtensionRegex.test(f.name || '');
      const isVid = f.type.startsWith('video/') || f.name?.toLowerCase().endsWith('.mp4') || f.name?.toLowerCase().endsWith('.webm');
      return isImg || isVid;
    });
    const invalidFiles = files.filter(f => !validFiles.includes(f));

    console.log('[UploadModal] validFiles:', validFiles.length, 'invalidFiles:', invalidFiles.length);
    if (invalidFiles.length > 0) {
      toast.error(`Unsupported file types skipped. Please upload images or videos.`);
    }

    const sizeOkFiles = (maxFileSizeBytes
      ? validFiles.filter((file) => {
        if (file.size > maxFileSizeBytes) {
          const mb = Math.round(maxFileSizeBytes / (1024 * 1024));
          toast.error(`"${file.name}" is too large. Max ${mb}MB per image.`);
          return false;
        }
        return true;
      })
      : validFiles);

    console.log('[UploadModal] sizeOkFiles count:', sizeOkFiles.length);
    if (!sizeOkFiles.length) return;

    // In "Your Uploads", persist immediately so refresh keeps items (DB + Zata).
    if (tab === 'uploads' && persistLocalDeviceUploads) {
      console.log('[UploadModal] Starting persistent upload flow');
      setIsSavingLocalUploads(true);

      // Process each file
      for (const file of sizeOkFiles) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const type = file.type.startsWith('video/') ? 'video' : 'image';

        // Create a local preview URL immediately
        const localUrl = URL.createObjectURL(file);

        // 1. Optimistically insert into "Your Uploads" grid immediately with loading=true
        setUploadItems((prev) => [
          {
            id: tempId,
            historyId: '',
            url: localUrl,
            type: type,
            createdAt: new Date().toISOString(),
            loading: true,
          } as any,
          ...prev,
        ]);

        // 2. Start upload in background
        (async () => {
          try {
            const resp = await saveUpload({ file, type });
            if (resp.responseStatus === 'success' && resp.data?.url) {
              const persistedUrl = String(resp.data.url || '').trim();

              // Update placeholder with real data
              setUploadItems((prev) =>
                prev.map((item: any) =>
                  item.id === tempId
                    ? {
                      ...item,
                      id: String(resp.data?.historyId || item.id),
                      historyId: String(resp.data?.historyId || ''),
                      url: persistedUrl,
                      storagePath: resp.data?.storagePath,
                      originalUrl: persistedUrl,
                      loading: false,
                    }
                    : item
                )
              );

              // Auto-select the persisted URL
              setSelection((prev) => new Set(prev).add(persistedUrl));

              // Clean up the local blob URL
              URL.revokeObjectURL(localUrl);
            } else {
              throw new Error(resp.message || 'Failed to upload image');
            }
          } catch (error: any) {
            console.error('[UploadModal] Immediate upload failed:', error);
            toast.error(`Failed to upload ${file.name}: ${error?.message || 'Please try again.'}`);

            // Remove the placeholder on failure
            setUploadItems((prev) => prev.filter((item: any) => item.id !== tempId));
            URL.revokeObjectURL(localUrl);
          } finally {
            // Check if any other items are still loading
            setUploadItems(prev => {
              const stillLoading = prev.some((item: any) => item.loading);
              if (!stillLoading) setIsSavingLocalUploads(false);
              return prev;
            });
          }
        })();
      }
    } else {
      // Just add to local previews if persistence is disabled or on library tab
      const localUrls: string[] = [];
      for (const file of sizeOkFiles) {
        localUrls.push(URL.createObjectURL(file));
      }
      setLocalUploads((prev) => [...prev, ...localUrls].slice(0, remainingSlots));
    }
  }, [isSupportedImageFile, localUploads.length, persistLocalDeviceUploads, remainingSlots, tab, saveUpload]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await addFilesToLocalUploads(files);
    }
  }, [addFilesToLocalUploads]);

  const stopCamera = React.useCallback(() => {
    try {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    streamRef.current = null;
    if (videoRef.current) {
      try {
        (videoRef.current as any).srcObject = null;
      } catch {
        // ignore
      }
    }
    setCameraActive(false);
  }, []);

  const startCamera = React.useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported in this browser');
      }
      // Stop any previous stream
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        (videoRef.current as any).srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e: any) {
      setCameraError(e?.message || 'Failed to access camera');
      stopCamera();
    }
  }, [cameraFacingMode, stopCamera]);

  const captureFromCamera = React.useCallback(async () => {
    // Allow capture if in Your Uploads tab (to save to library) or if slots are left
    const slotsLeft = (tab === 'uploads') ? 1 : remainingSlots;
    if (slotsLeft <= 0) return;
    const v = videoRef.current;
    if (!v) return;
    const w = Math.max(1, v.videoWidth || 0);
    const h = Math.max(1, v.videoHeight || 0);
    if (!w || !h) return;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (dataUrl) {
      if (tab === 'uploads' && persistLocalDeviceUploads) {
        const tempId = `temp-camera-${Date.now()}`;

        // 1. Optimistically insert into "Your Uploads" grid
        setUploadItems((prev) => [
          {
            id: tempId,
            historyId: '',
            url: dataUrl,
            type: 'image',
            createdAt: new Date().toISOString(),
            loading: true,
          } as any,
          ...prev,
        ]);

        // 2. Start upload
        (async () => {
          try {
            const resp = await saveUpload({ url: dataUrl, type: 'image' });
            if (resp.responseStatus === 'success' && resp.data?.url) {
              const persistedUrl = String(resp.data.url || '').trim();
              setUploadItems((prev) =>
                prev.map((item: any) =>
                  item.id === tempId
                    ? {
                      ...item,
                      id: String(resp.data?.historyId || item.id),
                      historyId: String(resp.data?.historyId || ''),
                      url: persistedUrl,
                      storagePath: resp.data?.storagePath,
                      originalUrl: persistedUrl,
                      loading: false,
                    }
                    : item
                )
              );
              setSelection((prev) => new Set(prev).add(persistedUrl));
            } else {
              throw new Error(resp.message || 'Upload failed');
            }
          } catch (err: any) {
            console.error('[UploadModal] Camera capture upload failed:', err);
            toast.error(`Failed to save captured photo: ${err.message || 'Please try again.'}`);
            setUploadItems((prev) => prev.filter((item: any) => item.id !== tempId));
          }
        })();
      } else {
        setLocalUploads((prev) => [...prev, dataUrl].slice(0, remainingSlots));
      }
    }
    stopCamera();
  }, [remainingSlots, tab, persistLocalDeviceUploads, stopCamera, saveUpload]);

  // Persist scroll positions for tabs so when the user switches tabs
  // the scrollbar returns to the same place they left it.
  const scrollPositionsRef = React.useRef<{ [k in 'library' | 'uploads']?: number }>({});
  const STORAGE_KEY = 'wm_upload_modal_scroll_positions';
  const prevTabRef = React.useRef<typeof tab | null>(null);
  const visitedTabsRef = React.useRef<Record<string, boolean>>({});

  // Load persisted scroll positions (if any) from sessionStorage on mount
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        if (parsed && typeof parsed === 'object') {
          scrollPositionsRef.current = parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // If requested, default to initialTab when opening (without forcing it on every re-render)
  const initialTabAppliedRef = React.useRef(false);
  React.useEffect(() => {
    if (!isOpen) {
      initialTabAppliedRef.current = false;
      return;
    }
    if (!initialTab || initialTabAppliedRef.current) return;
    setTab(initialTab === 'computer' ? 'uploads' : initialTab);
    initialTabAppliedRef.current = true;
  }, [isOpen, initialTab]);

  // Stop camera when modal closes/unmounts or leaving computer tab
  React.useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      return;
    }
    if (tab !== 'computer') {
      stopCamera();
      setCameraError(null);
    }
  }, [isOpen, tab, stopCamera]);

  // Save previous tab scroll and restore per-tab scroll when modal opens or tab changes.
  React.useEffect(() => {
    if (!isOpen) return;

    const el = listRef.current;

    // Save previous tab's scrollTop so it can be restored when user navigates back
    const prev = prevTabRef.current;
    if (prev && el) {
      try { scrollPositionsRef.current[prev as 'library' | 'uploads'] = el.scrollTop; } catch { }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scrollPositionsRef.current || {})); } catch { }
    }

    // Only restore for library/uploads list (drop area uses dropRef)
    if (tab !== 'library' && tab !== 'uploads') {
      prevTabRef.current = tab;
      return;
    }

    // Restore the saved position, or if this tab hasn't been visited yet, go to top
    requestAnimationFrame(() => {
      if (!el) return;
      const saved = scrollPositionsRef.current[tab as 'library' | 'uploads'];
      const visited = visitedTabsRef.current[tab];
      if (typeof saved === 'number' && visited) {
        el.scrollTop = saved;
      } else {
        // first time visiting this tab during this modal open -> top
        el.scrollTop = 0;
      }
      visitedTabsRef.current[tab] = true;
    });

    prevTabRef.current = tab;
  }, [tab, isOpen]);

  // Persist scroll positions to sessionStorage when unmounting
  React.useEffect(() => {
    return () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scrollPositionsRef.current || {}));
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Simple scroll preservation: save position before loadMore, restore after
  const scrollPositionBeforeLoadRef = React.useRef<number | null>(null);
  const isLoadingMoreRef = React.useRef(false);

  // Track if we've loaded initial data for each tab
  const hasLoadedLibraryRef = React.useRef(false);
  const hasLoadedUploadsRef = React.useRef(false);

  // If parent provided `historyEntries` (pre-fetched), initialize library state from it
  React.useEffect(() => {
    if (!isOpen) return;
    if (!propHistoryEntries || propHistoryEntries.length === 0) return;
    if (tab !== 'library') return;
    if (hasLoadedLibraryRef.current) return;

    // Use the provided entries as the initial library items. Caller controls `hasMore`/`loading`.
    try {
      setLibraryItems(propHistoryEntries as any[]);
      setLibraryHasMore(Boolean((propHasMore as any) ?? false));
      setLibraryLoading(Boolean((propLoading as any) ?? false));
      hasLoadedLibraryRef.current = true;
    } catch (e) {
      // ignore and fall back to normal loading
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab, propHistoryEntries]);

  // Fetch library items when modal opens or tab changes to library
  React.useEffect(() => {
    if (!isOpen || tab !== 'library') {
      if (!isOpen) {
        hasLoadedLibraryRef.current = false; // Reset when modal closes
        // Reset state when modal closes
        setLibraryItems([]);
        setLibraryNextCursor(undefined);
        setLibraryHasMore(false);
      }
      return;
    }

    const loadLibrary = async () => {
      // Only load initial page if we haven't loaded yet
      // Pagination will be handled by scroll handler
      if (hasLoadedLibraryRef.current) return; // Already loaded initial page
      setLibraryLoading(true);
      try {
        const result = await getLibraryPage(50, undefined, 'image');
        console.log('[UploadModal] Loaded library (initial):', {
          itemsCount: result.items.length,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor
        });
        // Auto-prefetch additional pages when first page is too small to scroll.
        // Some backends return tiny page slices (e.g., 4 images), which blocks onScroll pagination.
        let merged = Array.isArray(result.items) ? [...result.items] : [];
        let nextCursor = result.nextCursor;
        let hasMorePages = Boolean(result.hasMore);
        let prefetchCount = 0;
        while (hasMorePages && merged.length < 20 && prefetchCount < 5) {
          const nextPage = await getLibraryPage(50, nextCursor, 'image');
          const existing = new Set(merged.map(makeMediaKey));
          const uniqueNext = (nextPage.items || []).filter((item: any) => !existing.has(makeMediaKey(item)));
          if (uniqueNext.length === 0 && !nextPage.nextCursor) {
            hasMorePages = false;
            break;
          }
          merged = [...merged, ...uniqueNext];
          nextCursor = nextPage.nextCursor;
          hasMorePages = Boolean(nextPage.hasMore);
          prefetchCount += 1;
        }

        setLibraryItems(merged);
        setLibraryNextCursor(nextCursor);
        setLibraryHasMore(hasMorePages);
        hasLoadedLibraryRef.current = true;
      } catch (error) {
        console.error('[UploadModal] Error loading library:', error);
      } finally {
        setLibraryLoading(false);
      }
    };

    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  // Fetch upload items when modal opens or tab changes to uploads
  React.useEffect(() => {
    if (!isOpen || tab !== 'uploads') {
      if (!isOpen) {
        hasLoadedUploadsRef.current = false; // Reset when modal closes
        // Reset state when modal closes
        setUploadItems([]);
        setUploadNextCursor(undefined);
        setUploadHasMore(false);
      }
      return;
    }

    const loadUploads = async () => {
      // Only load initial page if we haven't loaded yet
      // Pagination will be handled by scroll handler
      if (hasLoadedUploadsRef.current) return; // Already loaded initial page
      setUploadLoading(true);
      try {
        const result = await getUploadsPage(50, undefined, 'image');
        console.log('[UploadModal] Loaded uploads (initial):', {
          itemsCount: result.items.length,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          sampleItem: result.items[0] ? {
            id: result.items[0].id,
            url: result.items[0].url,
            storagePath: result.items[0].storagePath,
            originalUrl: result.items[0].originalUrl,
            convertedUrl: result.items[0].storagePath ? toDirectUrl(result.items[0].storagePath) : result.items[0].url
          } : null
        });
        // Auto-prefetch when the initial response is too small to create scroll.
        let merged = Array.isArray(result.items) ? [...result.items] : [];
        let nextCursor = result.nextCursor;
        let hasMorePages = Boolean(result.hasMore);
        let prefetchCount = 0;
        while (hasMorePages && merged.length < 20 && prefetchCount < 5) {
          const nextPage = await getUploadsPage(50, nextCursor, 'image');
          const existing = new Set(merged.map(makeMediaKey));
          const uniqueNext = (nextPage.items || []).filter((item: any) => !existing.has(makeMediaKey(item)));
          if (uniqueNext.length === 0 && !nextPage.nextCursor) {
            hasMorePages = false;
            break;
          }
          merged = [...merged, ...uniqueNext];
          nextCursor = nextPage.nextCursor;
          hasMorePages = Boolean(nextPage.hasMore);
          prefetchCount += 1;
        }

        setUploadItems(merged);
        setUploadNextCursor(nextCursor);
        // If backend returns 0 items, treat as exhausted regardless of hasMore
        if (!merged || merged.length === 0) {
          setUploadHasMore(false);
          uploadExhaustedRef.current = true;
        } else {
          setUploadHasMore(Boolean(hasMorePages));
          uploadExhaustedRef.current = false;
        }
        console.log('[UploadModal] Set upload state:', {
          itemsCount: result.items.length,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor ? 'present' : 'null',
          nextCursorValue: result.nextCursor
        });
        hasLoadedUploadsRef.current = true;
      } catch (error) {
        console.error('[UploadModal] Error loading uploads:', error);
      } finally {
        setUploadLoading(false);
      }
    };

    loadUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelection(new Set());
      setLocalUploads([]);
      setTab('uploads');
      scrollPositionBeforeLoadRef.current = null;
      isLoadingMoreRef.current = false;
      // Reset library and uploads data when modal closes
      setLibraryItems([]);
      setUploadItems([]);
      setLibraryNextCursor(undefined);
      setUploadNextCursor(undefined);
      setLibraryHasMore(false);
      setUploadHasMore(false);
      // Reset load flags so data reloads when modal opens again
      hasLoadedLibraryRef.current = false;
      hasLoadedUploadsRef.current = false;
      setIsDragging(false);
    }
  }, [isOpen]);

  // Lock background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Save current overflow values
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = (document.documentElement as HTMLElement).style.overflow;
      const prevOverscrollBehavior = (document.documentElement as HTMLElement).style.overscrollBehavior;

      // Lock scrolling
      document.body.style.overflow = 'hidden';
      (document.documentElement as HTMLElement).style.overflow = 'hidden';
      (document.documentElement as HTMLElement).style.overscrollBehavior = 'none';

      // Restore on cleanup
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        (document.documentElement as HTMLElement).style.overflow = prevHtmlOverflow;
        (document.documentElement as HTMLElement).style.overscrollBehavior = prevOverscrollBehavior;
      };
    }
  }, [isOpen]);

  // Get items to display based on selected tab
  const getDisplayItems = () => {
    if (tab === 'library') {
      return libraryItems.map(item => {
        // Convert storagePath to full Zata URL if available
        let displayUrl = item.url;
        if (item.storagePath && !item.url?.startsWith('http')) {
          displayUrl = toDirectUrl(item.storagePath) || item.url;
        }
        return {
          id: item.id,
          url: displayUrl,
          thumbnailUrl: item.thumbnail || displayUrl,
          avifUrl: item.thumbnail || displayUrl,
          originalUrl: item.url || displayUrl,
          storagePath: item.storagePath,
          mediaId: item.mediaId,
        };
      });
    } else if (tab === 'uploads') {
      return uploadItems.map(item => {
        // Convert storagePath to full Zata URL if available (e.g., users/rajdeop/input/... -> https://idr01.zata.ai/devstoragev1/users/rajdeop/input/...)
        // Otherwise use the url or originalUrl
        let displayUrl = item.url || item.originalUrl;
        if (item.storagePath) {
          // Convert storagePath to full Zata public URL
          displayUrl = toDirectUrl(item.storagePath) || item.url || item.originalUrl;
        }

        // Use the displayUrl for thumbnail as well if no thumbnail is provided
        const thumbnailUrl = item.thumbnail || displayUrl;

        return {
          id: item.id,
          url: displayUrl, // Full Zata URL: https://idr01.zata.ai/devstoragev1/users/username/input/historyId/filename.jpg
          thumbnailUrl: thumbnailUrl,
          avifUrl: thumbnailUrl,
          originalUrl: item.originalUrl || displayUrl,
          storagePath: item.storagePath, // Keep original storagePath: users/username/input/historyId/filename.jpg
          mediaId: item.mediaId,
          loading: item.loading,
        };
      });
    }
    return [];
  };

  const displayItems = getDisplayItems();
  const hasMore = tab === 'library' ? libraryHasMore : uploadHasMore;
  const loading = tab === 'library' ? libraryLoading : uploadLoading;

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (tab === 'library') {
      const chosen = Array.from(selection).slice(0, remainingSlots);
      if (chosen.length) onAdd(chosen);
      setSelection(new Set());
      onClose();
      return;
    }

    if (tab === 'uploads') {
      const chosen = Array.from(selection).slice(0, remainingSlots);
      if (chosen.length) {
        onAdd(chosen);
      }
      setLocalUploads([]);
      setSelection(new Set());
      onClose();
      return;
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-lg overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between md:px-4 px-3 gap-2 md:py-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button className={`md:px-3 px-2 md:py-1.5 py-0.5 rounded-lg md:text-sm text-[11px] ${tab === 'library' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('library')}>Your Library</button>
              <button className={`md:px-3 px-2 md:py-1.5 py-0.5 rounded-lg md:text-sm text-[11px] ${tab === 'uploads' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('uploads')}>Your Uploads</button>
            </div>
            <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="p-4">
            {tab === 'library' || tab === 'uploads' ? (
              <div>
                {loading && displayItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-white/60">
                    <img src="https://idr01.zata.ai/devstoragev1/public/styles/Logo.gif" alt="Loading..." className="w-24 h-24 opacity-80 mb-4" />
                    <div className="text-lg">
                      {tab === 'uploads' ? 'Loading uploads...' : 'Loading library...'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-white/70 md:text-sm text-[11px] md:mb-4 mb-2 ">
                      {tab === 'uploads'
                        ? `Select up to ${remainingSlots} image${remainingSlots === 1 ? '' : 's'} from your uploads`
                        : `Select up to ${remainingSlots} image${remainingSlots === 1 ? '' : 's'} from your library`
                      }
                    </div>
                    {tab === 'uploads' && isSavingLocalUploads && (
                      <div className="mb-2 text-[11px] text-white/70">
                        Uploading image to Your Uploads...
                      </div>
                    )}
                    {tab === 'uploads' && (
                      <input
                        ref={localUploadInputRef}
                        type="file"
                        accept={accept}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const selectedFiles = Array.from(e.target.files || []);
                          console.log('[UploadModal] Hidden input onChange triggered:', selectedFiles.length, 'files');
                          addFilesToLocalUploads(selectedFiles);
                          e.target.value = '';
                        }}
                      />
                    )}
                    <div
                      ref={listRef}
                      onScroll={async (e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        // Save current scroll for this tab
                        try {
                          scrollPositionsRef.current[tab as 'library' | 'uploads'] = el.scrollTop;
                        } catch { }

                        // Check if we should load more - use specific state for current tab
                        const currentHasMore = tab === 'library' ? libraryHasMore : uploadHasMore && !uploadExhaustedRef.current;
                        const currentLoading = tab === 'library' ? libraryLoading : uploadLoading;
                        const currentNextCursor = tab === 'library' ? libraryNextCursor : uploadNextCursor;
                        const currentItems = tab === 'library' ? libraryItems : uploadItems;

                        // Don't load if already loading or no more items
                        if (currentLoading || isLoadingMoreRef.current || !currentHasMore) {
                          return;
                        }

                        // Log state for debugging
                        if (tab === 'uploads') {
                          console.log('[UploadModal] Scroll check for uploads:', {
                            hasMore: currentHasMore,
                            loading: currentLoading,
                            nextCursor: currentNextCursor,
                            itemsCount: currentItems.length,
                            isLoadingMore: isLoadingMoreRef.current
                          });
                        }

                        // Check if user scrolled near bottom (200px threshold)
                        const scrollBottom = el.scrollTop + el.clientHeight;
                        const scrollHeight = el.scrollHeight;
                        const nearBottom = scrollBottom >= scrollHeight - 200;

                        if (nearBottom) {
                          // Save current scroll position and scroll height before loading
                          const scrollTopBefore = el.scrollTop;
                          const scrollHeightBefore = el.scrollHeight;
                          isLoadingMoreRef.current = true;

                          try {
                            if (tab === 'library') {
                              console.log('[UploadModal] Loading more library items:', {
                                nextCursor: libraryNextCursor,
                                hasMore: libraryHasMore,
                                currentItems: libraryItems.length
                              });
                              // Set loading state BEFORE async operation
                              setLibraryLoading(true);
                              const result = await getLibraryPage(50, libraryNextCursor, 'image');
                              console.log('[UploadModal] Loaded more library items:', {
                                itemsCount: result.items.length,
                                hasMore: result.hasMore,
                                nextCursor: result.nextCursor
                              });
                              // Deduplicate items using a stable composite key (id + historyId + storagePath + url)
                              setLibraryItems(prev => {
                                const makeKey = (item: any) =>
                                  `${item.historyId || ''}|${item.storagePath || ''}|${item.id || ''}|${item.url || ''}`;
                                const existingKeys = new Set(prev.map(makeKey));
                                const newItems = result.items.filter(item => !existingKeys.has(makeKey(item)));
                                return [...prev, ...newItems];
                              });
                              setLibraryNextCursor(result.nextCursor);
                              setLibraryHasMore(result.hasMore);
                            } else if (tab === 'uploads') {
                              console.log('[UploadModal] Loading more upload items:', {
                                nextCursor: uploadNextCursor,
                                hasMore: uploadHasMore,
                                currentItems: uploadItems.length
                              });
                              // Set loading state BEFORE async operation
                              setUploadLoading(true);
                              const result = await getUploadsPage(50, uploadNextCursor, 'image');
                              console.log('[UploadModal] Loaded more upload items:', {
                                itemsCount: result.items.length,
                                hasMore: result.hasMore,
                                nextCursor: result.nextCursor
                              });
                              // Deduplicate items using a stable composite key (id + historyId + storagePath + url)
                              setUploadItems(prev => {
                                const makeKey = (item: any) =>
                                  `${item.historyId || ''}|${item.storagePath || ''}|${item.id || ''}|${item.url || ''}`;
                                const existingKeys = new Set(prev.map(makeKey));
                                const newItems = result.items.filter(item => !existingKeys.has(makeKey(item)));
                                return [...prev, ...newItems];
                              });
                              setUploadNextCursor(result.nextCursor);
                              // If backend returns no items OR nextCursor is null, stop further fetches
                              if (!result.items || result.items.length === 0 || !result.nextCursor) {
                                setUploadHasMore(false);
                                uploadExhaustedRef.current = true;
                              } else {
                                setUploadHasMore(Boolean(result.hasMore));
                                uploadExhaustedRef.current = !result.hasMore && !result.nextCursor ? true : false;
                              }
                            }

                            // After new items are loaded, maintain scroll position
                            // Keep loading state true until DOM updates complete
                            requestAnimationFrame(() => {
                              requestAnimationFrame(() => {
                                if (el) {
                                  const scrollHeightAfter = el.scrollHeight;
                                  const heightDiff = scrollHeightAfter - scrollHeightBefore;

                                  // Maintain scroll position relative to bottom
                                  if (heightDiff > 0) {
                                    el.scrollTop = scrollTopBefore;
                                  }
                                }
                                // Set loading to false AFTER scroll position is maintained
                                if (tab === 'library') {
                                  setLibraryLoading(false);
                                } else if (tab === 'uploads') {
                                  setUploadLoading(false);
                                }
                                isLoadingMoreRef.current = false;
                              });
                            });
                          } catch (error) {
                            console.error('[UploadModal] Error loading more:', error);
                            isLoadingMoreRef.current = false;
                            if (tab === 'library') setLibraryLoading(false);
                            if (tab === 'uploads') setUploadLoading(false);
                          }
                        }
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`grid grid-cols-3 md:grid-cols-5 md:gap-3 gap-2 md:h-[50vh] h-[40vh] p-1 md:p-2 pt-4 md:pt-4 overflow-y-auto custom-scrollbar pr-1 transition-all duration-200 ${isDragging && tab === 'uploads'
                        ? 'bg-white/10 ring-2 ring-white/20 ring-inset'
                        : ''
                        }`}
                    >
                      {tab === 'uploads' && (
                        <button
                          onClick={() => {
                            console.log('[UploadModal] Upload button clicked');
                            localUploadInputRef.current?.click();
                          }}
                          className="relative w-full md:h-32 h-24 rounded-lg overflow-hidden ring-1 ring-white/20 bg-white/5 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex flex-col items-center gap-1.5 text-white/50 group-hover:text-white/80 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span className="text-[10px] md:text-xs font-medium">Upload</span>
                          </div>
                        </button>
                      )}

                      {displayItems.map((im: any, index: number) => {
                        const selected = selection.has(im.url);
                        const key = `${tab}-${im.id || im.url || index}-${index}`;
                        const imageSrc = im.storagePath || im.thumbnailUrl || im.avifUrl || im.url || im.originalUrl;
                        const proxiedSrc = imageSrc ? (toMediaProxy(imageSrc) || imageSrc) : null;

                        return (
                          <button key={key} onClick={() => {
                            const next = new Set(selection);
                            if (selected) next.delete(im.url); else next.add(im.url);
                            setSelection(next);
                          }} className={`relative w-full md:h-32 h-24 rounded-lg overflow-hidden ring-1 ${selected ? 'ring-white' : 'ring-white/20'} bg-black/50`}>
                            {proxiedSrc ? (
                              <img
                                src={proxiedSrc}
                                alt={tab === 'uploads' ? 'upload' : 'library'}
                                className={`w-full h-full object-cover ${im.loading ? 'opacity-40 blur-[2px]' : ''}`}
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
                                No image
                              </div>
                            )}

                            {im.loading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              </div>
                            )}

                            {selected && !im.loading && <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-lg" />}
                            {!im.loading && <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />}
                          </button>
                        );
                      })}

                      {tab === 'library' && displayItems.length === 0 && (
                        <div className="col-span-full flex items-center justify-center md:h-32 h-24 text-white/60">
                          No items found
                        </div>
                      )}
                    </div>
                    {hasMore && (
                      <div className="flex items-center justify-center pt-3 text-white/60 md:text-sm text-[11px]">
                        {loading ? 'Loading more…' : 'Scroll to load more'}
                      </div>
                    )}
                    {/* Debug info for uploads tab */}
                    {tab === 'uploads' && process.env.NODE_ENV === 'development' && (
                      <div className="flex items-center justify-center pt-1 text-white/30 text-[10px]">

                      </div>
                    )}
                    <div className="flex justify-end mt-0 gap-2">
                      <button className="md:px-4 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                      <button className="md:px-4 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white text-black hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleAdd} disabled={isSavingLocalUploads}>Add</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="text-white/70 md:text-sm text-[11px] mb-3">Choose up to {remainingSlots} image{remainingSlots === 1 ? '' : 's'}</div>
                {enableCameraCapture && (
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="text-white/50 text-[11px]">You can upload files or capture from camera</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="md:px-3 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white/10 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCamera();
                        }}
                      >
                        Use Camera
                      </button>
                      {cameraActive && (
                        <button
                          type="button"
                          className="md:px-3 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white/10 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            stopCamera();
                          }}
                        >
                          Close Camera
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {enableCameraCapture && cameraError && (
                  <div className="mb-3 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {cameraError}
                  </div>
                )}

                {enableCameraCapture && cameraActive && (
                  <div className="mb-3 border border-white/10 rounded-lg overflow-hidden bg-black/40">
                    <div className="relative w-full aspect-video bg-black">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    </div>
                    <div className="flex justify-end gap-2 p-3 border-t border-white/10">
                      <button
                        type="button"
                        className="md:px-4 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white text-black hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          captureFromCamera();
                        }}
                      >
                        Capture Photo
                      </button>
                    </div>
                  </div>
                )}

                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg h-[51.75vh] flex cursor-pointer transition-all duration-200 overflow-y-auto custom-scrollbar ${isDragging
                    ? 'border-white bg-white/10 scale-[0.99] ring-4 ring-white/10'
                    : 'border-white/30 bg-black/20 hover:border-white/60 hover:bg-black/30'
                    } ${localUploads.length > 0 ? 'items-start justify-start p-3' : 'items-center justify-center'}`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = accept;
                    input.multiple = true;
                    input.onchange = async () => {
                      const files = Array.from(input.files || []);
                      await addFilesToLocalUploads(files);
                    };
                    input.click();
                  }}
                >
                  {localUploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-white/60 select-none ">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                      <div className="mt-2 text-sm">Drop images here or click to browse</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3  w-full place-content-start">
                      {localUploads.map((url, idx) => (
                        <div key={`local-upload-${idx}-${url.substring(0, 20)}`} className="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                          {url.startsWith('data:application/pdf') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 text-red-200">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mb-1">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <text x="8" y="18" fontSize="6" fill="currentColor" fontWeight="bold">PDF</text>
                              </svg>
                              <span className="text-[10px] font-medium">PDF Document</span>
                            </div>
                          ) : (
                            <img src={url} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            aria-label="Remove"
                            title="Remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalUploads(prev => prev.filter((u, i) => !(u === url && i === idx)));
                            }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                              <path d="M3 6h18" />
                              <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  <button className="md:px-4 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="md:px-4 px-2 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white text-black hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleAdd} disabled={isSavingLocalUploads}>{isSavingLocalUploads ? 'Uploading...' : 'Add'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={localUploadInputRef}
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={(e) => {
          const selectedFiles = Array.from(e.target.files || []);
          console.log('[UploadModal] Hidden input onChange triggered:', selectedFiles.length, 'files');
          addFilesToLocalUploads(selectedFiles);
          e.target.value = '';
        }}
      />
    </div>
  );

  // Render in a portal so it doesn't get trapped under transformed/sticky parents (some pages render this inside a transformed container).
  if (!mounted) return null;
  return createPortal(modal, document.body);
};

export default UploadModal;
