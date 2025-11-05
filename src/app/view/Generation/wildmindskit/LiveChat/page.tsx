
'use client';

import React, { useEffect, Suspense } from 'react';
import MainLayout from '@/app/view/Generation/Core/MainLayout';
import LiveChatInputBox from './compo/InputBox';
// import { useAppSelector } from '@/store/hooks';
import Image from 'next/image';
import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentView, setCurrentGenerationType } from '@/store/slices/uiSlice';
import { ViewType, GenerationType } from '@/types/generation';
import { loadHistory } from '@/store/slices/historySlice';
import { useSearchParams } from 'next/navigation';
import { setUploadedImages } from '@/store/slices/generationSlice';
import { ensureSessionReady } from '@/lib/axiosInstance';
import dynamic from 'next/dynamic';

const DynamicLiveChatInputBox = dynamic(() => import('./compo/InputBox'), { ssr: false });

const LiveChatPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
  
  // Log after mount (not during render) to avoid hydration issues
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[LiveChat] 🎬 LiveChatPage component rendered and mounted', { 
        currentView, 
        currentGenerationType,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentView, currentGenerationType]);
  // Controls whether the big centered preview is shown
  const [showCenterView, setShowCenterView] = React.useState(false);
  const [selectedUrl, setSelectedUrl] = React.useState<string | null>(null);
  
  // Get live-chat entries to detect new images
  const liveChatEntries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));
  // Check if we're in an active live chat session (has uploaded images)
  const uploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  const isInLiveSession = uploadedImages.length > 0;
  
  // Track if we've mounted to prevent auto-selection on refresh
  const hasMountedRef = React.useRef(false);
  
  // Automatically show center view and select latest image when new images are generated
  // But only after initial mount (not on page refresh)
  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    
    if (liveChatEntries.length > 0) {
      // Get all images from all entries
      const allImages: any[] = [];
      for (const e of liveChatEntries) {
        const imgs = (e.images || []).map((img:any) => ({ ...img, _entryTimestamp: e.timestamp }));
        allImages.push(...imgs);
      }
      const sortedImages = allImages.sort((a:any,b:any)=> new Date(a._entryTimestamp).getTime() - new Date(b._entryTimestamp).getTime());
      
      if (sortedImages.length > 0) {
        const latest = sortedImages[sortedImages.length - 1];
        const latestUrl = latest?.url;
        if (latestUrl && latestUrl !== selectedUrl) {
          setSelectedUrl(latestUrl);
          // Don't auto-set uploadedImages - only set when user clicks Generate or modifies
          // setShowCenterView(true);
          // try { dispatch(setUploadedImages([latestUrl])); } catch {}
        }
      }
    }
  }, [liveChatEntries, selectedUrl, dispatch]); // Trigger when entries change (new image generated)
  
  const handleSelect = React.useCallback((url: string) => {
    try { setSelectedUrl(url); } catch {}
    try { dispatch(setUploadedImages([url])); } catch {}
    setShowCenterView(true);
  }, [dispatch]);

  // Handle image click to start modifying - opens live chat input
  // Restores all images from the same session so user can continue editing
  const handleImageClick = React.useCallback(async (imageUrl: string) => {
    try {
      // Call backend API to get session by image URL
      const { getSessionByImageUrl } = await import('@/lib/liveChatSessionService');
      const session = await getSessionByImageUrl(imageUrl);
      
      console.log('[LiveChat] Restoring session from backend:', {
        sessionId: session.sessionId,
        sessionDocId: session.id,
        totalImages: session.totalImages,
        imageUrls: session.imageUrls.length,
        imagesCount: session.images.length,
        messages: session.messages.length,
        images: session.images.map(img => ({ url: img.url, order: img.order })),
      });
      
      // Extract all images from session in order (images are already in a single array)
      const allImages = session.images || [];
      
      console.log('[LiveChat] All images from session:', allImages.length, 'images');
      console.log('[LiveChat] Image URLs:', allImages.map(img => img.url));
      
      // Sort by order to maintain sequence (should already be sorted, but ensure it)
      allImages.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('[LiveChat] Sorted images by order:', allImages.map(img => ({ order: img.order, url: img.url })));
      
      // Store session metadata in localStorage for InputBox to restore
      try {
        const sessionMetadata = {
          sessionId: session.sessionId,
          sessionDocId: session.id, // Store backend document ID
          entries: allImages.map((img, idx) => ({
            id: img.id || `img-${idx}-${Date.now()}`,
            prompt: img.prompt || '',
            images: [img], // Each entry has one image
            timestamp: img.timestamp || new Date().toISOString(),
            model: session.model,
          })),
          restoredAt: Date.now(),
        };
        
        localStorage.setItem('livechat-restored-session', JSON.stringify(sessionMetadata));
      } catch (e) {
        console.warn('[LiveChat] Failed to store session metadata:', e);
      }
      
      // Set all images from the session to uploadedImages (in order)
      const imageUrls = allImages.map(img => img.url);
      dispatch(setUploadedImages(imageUrls));
      
    } catch (error: any) {
      console.error('[LiveChat] Failed to restore session from backend:', error);
      
      // Fallback to local history if backend fails
      const sessionMap = new Map<string, any[]>();
      for (const entry of liveChatEntries) {
        const sessionKey = entry.sessionId || `single-${entry.id}`;
        if (!sessionMap.has(sessionKey)) sessionMap.set(sessionKey, []);
        sessionMap.get(sessionKey)!.push(entry);
      }
      
      let foundSession: { sessionId: string; images: string[]; entries: any[] } | null = null;
      for (const [sessionId, entries] of sessionMap.entries()) {
        const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const sessionImages: string[] = [];
        let foundImage = false;
        
        for (const entry of sortedEntries) {
          const images = entry.images || [];
          for (const img of images) {
            if (img.url) {
              sessionImages.push(img.url);
              if (img.url === imageUrl) {
                foundImage = true;
              }
            }
          }
        }
        
        if (foundImage) {
          foundSession = { sessionId, images: sessionImages, entries: sortedEntries };
          break;
        }
      }
      
      const imagesToRestore = foundSession?.images || [imageUrl];
      
      if (foundSession) {
        try {
          const entriesWithImages = foundSession.entries.map(entry => ({
            id: entry.id,
            prompt: entry.prompt || '',
            images: Array.isArray(entry.images) ? entry.images : (entry.images ? [entry.images] : []),
            timestamp: entry.timestamp || entry.createdAt || new Date().toISOString(),
            model: entry.model || 'flux-kontext-pro'
          }));
          
          const sessionMetadata = {
            sessionId: foundSession.sessionId,
            entries: entriesWithImages,
            restoredAt: Date.now()
          };
          
          localStorage.setItem('livechat-restored-session', JSON.stringify(sessionMetadata));
        } catch (e) {
          console.warn('Failed to store session metadata:', e);
        }
      }
      
      dispatch(setUploadedImages(imagesToRestore));
    }
  }, [dispatch, liveChatEntries]);

  const onViewChange = (view: ViewType) => {
    dispatch(setCurrentView(view));
    if (view === 'landing') {
      localStorage.removeItem('wild-mind-visited');
    } else {
      localStorage.setItem('wild-mind-visited', 'true');
    }
  };

  const onGenerationTypeChange = (type: GenerationType) => {
    dispatch(setCurrentGenerationType(type));
    dispatch(setCurrentView('generation'));
  };

  // Ensure generation type is set to live-chat on mount
  useEffect(() => {
    dispatch(setCurrentView('generation'));
    dispatch(setCurrentGenerationType('live-chat'));
    // Load persisted live-chat sessions into Redux history on mount
    dispatch(loadHistory({ filters: { generationType: 'live-chat' }, paginationParams: { limit: 20 } }));
  }, [dispatch]);

  // Handle image parameter from URL
  useEffect(() => {
    const loadImageFromParams = async () => {
      const imageUrl = searchParams.get('image');
      const storagePath = searchParams.get('sp');
      if (imageUrl || storagePath) {
        // Ensure session is ready before loading image
        const sessionReady = await ensureSessionReady();
        if (!sessionReady) {
          console.warn('Session not ready, skipping image load');
          return;
        }

        // Decode the URL-encoded image parameter
        let decodedImageUrl = decodeURIComponent(imageUrl || '');
        console.log('Loading image from URL parameter:', { imageUrl: decodedImageUrl, storagePath });
        
        // Use storagePath if available (like other features), otherwise use imageUrl
        if (storagePath) {
          const proxied = `/api/proxy/resource/${encodeURIComponent(storagePath)}`;
          dispatch(setUploadedImages([proxied]));
        } else if (decodedImageUrl) {
          // Convert relative URL to absolute URL for FAL service compatibility
          const absoluteUrl = decodedImageUrl.startsWith('/api/proxy/resource/') 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${decodedImageUrl}`
            : decodedImageUrl;
          dispatch(setUploadedImages([absoluteUrl]));
        }
      }
    };

    loadImageFromParams();
  }, [searchParams, dispatch]);

  return (
    <div className="relative">
      {/* Remove Nav blue blur only on desktop for LiveChat */}
      <style jsx global>{`
        @media (min-width: 768px){
          .wm-nav-bg{ background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border-bottom-color: transparent !important; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Done button at top-right parallel to header - only show when in active live session */}
      {isInLiveSession && (
        <button
          onClick={() => {
            setShowCenterView(false);
            // Clear uploaded images to exit live session
            dispatch(setUploadedImages([]));
          }}
          className="fixed top-[66px] right-6 z-40 px-4 py-2 rounded-full text-sm font-medium text-white/90 bg-white/10 hover:bg-white/15 ring-1 ring-white/15 backdrop-blur-xl"
          type="button"
        >
          Done
        </button>
      )}
      <MainLayout
        onViewChange={onViewChange}
        onGenerationTypeChange={onGenerationTypeChange}
        currentView={currentView}
        currentGenerationType={currentGenerationType}
      />
      {/* Override input for live chat - only show when overlay is open */}
      <DynamicLiveChatInputBox />
      {/* Live Chat history (interactive, scrollable) - matching image generation page style */}
      {(liveChatEntries.length > 0) && (
        <div className="fixed inset-0 pt-[62px] pl-[68px] pr-6 pb-6 overflow-y-auto no-scrollbar z-0">
          <div className="md:py-6 py-0 md:pl-4 pl-0">
            {/* History Header - Fixed during scroll */}
            <div className="fixed left-0 right-0 z-30 py-2 md:py-5 top-[44px] md:top-0 md:ml-18 px-3 md:px-0 md:pl-6 bg-transparent md:backdrop-blur-lg md:bg-transparent md:shadow-xl">
              <h2 className="md:text-xl text-md font-semibold text-white pl-0">Live Chat History</h2>
            </div>
            {/* Spacer to keep content below fixed header */}
            <div className="h-0"></div>
            
            <LiveChatGrid
              showCenterView={showCenterView}
              selectedUrl={selectedUrl}
              onSelect={handleSelect}
              onImageClick={handleImageClick}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const LiveChatGrid: React.FC<{ showCenterView: boolean; selectedUrl: string | null; onSelect: (url: string) => void; onImageClick?: (url: string) => void; }> = ({ showCenterView, selectedUrl, onSelect, onImageClick }) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [backendSessions, setBackendSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Refs for pagination (same pattern as image generation)
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const hasUserScrolledRef = React.useRef(false);
  const loadingMoreRef = React.useRef(false);
  const nextCursorRef = React.useRef<string | undefined>(undefined);
  
  // Sync ref with state
  React.useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);
  
  // Manual load more (fallback button) - MUST be before early returns
  const manualLoadMore = React.useCallback(async () => {
    if (!hasMore || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      setLoadingMore(true);
      const { listUserSessions } = await import('@/lib/liveChatSessionService');
      const result = await listUserSessions({ limit: 10, cursor: nextCursorRef.current });
      const sorted = [...result.sessions].sort((a, b) => {
        const aT = new Date(a.updatedAt || a.completedAt || a.startedAt || a.createdAt).getTime();
        const bT = new Date(b.updatedAt || b.completedAt || b.startedAt || b.createdAt).getTime();
        return bT - aT;
      });
      setBackendSessions(prev => [...prev, ...sorted]);
      setNextCursor(result.nextCursor);
      nextCursorRef.current = result.nextCursor;
      setHasMore(!!result.nextCursor);
    } catch (err) {
      console.error('[LiveChat] manualLoadMore error', err);
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, loading]);

  // Load all remaining pages - MUST be before early returns
  const loadAllRemaining = React.useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      setLoadingMore(true);
      let cursor = nextCursorRef.current;
      for (let i = 0; i < 50; i++) { // hard cap to avoid infinite loops
        if (!cursor) break;
        const { listUserSessions } = await import('@/lib/liveChatSessionService');
        const result = await listUserSessions({ limit: 10, cursor });
        const sorted = [...result.sessions].sort((a, b) => {
          const aT = new Date(a.updatedAt || a.completedAt || a.startedAt || a.createdAt).getTime();
          const bT = new Date(b.updatedAt || b.completedAt || b.startedAt || b.createdAt).getTime();
          return bT - aT;
        });
        setBackendSessions(prev => [...prev, ...sorted]);
        cursor = result.nextCursor;
        setNextCursor(cursor);
        nextCursorRef.current = cursor;
        setHasMore(!!cursor);
        if (!cursor) break;
      }
    } catch (err) {
      console.error('[LiveChat] loadAllRemaining error', err);
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);
  
  // Load sessions from backend API (initial load)
  const loadSessions = React.useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setBackendSessions([]);
        setNextCursor(undefined);
        nextCursorRef.current = undefined;
        setHasMore(true);
      }
      
      const { listUserSessions } = await import('@/lib/liveChatSessionService');
      const result = await listUserSessions({
        limit: reset ? 50 : 10,
        cursor: reset ? undefined : nextCursorRef.current,
      });
      
      const sortedSessions = [...result.sessions].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.completedAt || a.startedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.completedAt || b.startedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
      
      if (reset) {
        setBackendSessions(sortedSessions);
      } else {
        setBackendSessions(prev => [...prev, ...sortedSessions]);
      }
      
      setNextCursor(result.nextCursor);
      nextCursorRef.current = result.nextCursor;
      setHasMore(!!result.nextCursor);
    } catch (error) {
      console.error('[LiveChat] Failed to load sessions:', error);
      if (reset) {
        setBackendSessions([]);
      }
      setHasMore(false);
    } finally {
      if (reset) {
        setLoading(false);
      }
    }
  }, []);
  
  
  // Mark when the user has actually scrolled (to avoid auto-draining pages on initial mount)
  React.useEffect(() => {
    const onAnyScroll = () => {
      hasUserScrolledRef.current = true;
    };
    const historyContainer = document.querySelector('.overflow-y-auto');
    window.addEventListener('scroll', onAnyScroll, { passive: true });
    if (historyContainer) historyContainer.addEventListener('scroll', onAnyScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onAnyScroll as any);
      if (historyContainer) historyContainer.removeEventListener('scroll', onAnyScroll as any);
    };
  }, []);

  // IntersectionObserver-based infinite scroll (same pattern as image generation)
  React.useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      // Require a user scroll before we begin auto-paginating
      if (!hasUserScrolledRef.current) {
        console.log('[LiveChat] IO: skip loadMore until user scrolls');
        return;
      }
      if (!hasMore || loading || loadingMoreRef.current) {
        console.log('[LiveChat] IO: skip loadMore', { hasMore, loading, busy: loadingMoreRef.current });
        return;
      }
      loadingMoreRef.current = true;
      console.log('[LiveChat] IO: loadMore start', { cursor: nextCursorRef.current });
      try {
        setLoadingMore(true);
        const { listUserSessions } = await import('@/lib/liveChatSessionService');
        const result = await listUserSessions({
          limit: 10,
          cursor: nextCursorRef.current,
        });
        
        const sortedSessions = [...result.sessions].sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.completedAt || a.startedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.completedAt || b.startedAt || b.createdAt).getTime();
          return timeB - timeA;
        });
        
        setBackendSessions(prev => [...prev, ...sortedSessions]);
        setNextCursor(result.nextCursor);
        nextCursorRef.current = result.nextCursor;
        setHasMore(!!result.nextCursor);
      } catch (e) {
        console.error('[LiveChat] IO: loadMore error', e);
        setHasMore(false);
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    observer.observe(el);
    console.log('[LiveChat] IO: observer attached');
    return () => {
      observer.disconnect();
      console.log('[LiveChat] IO: observer disconnected');
    };
  }, [hasMore, loading]);
  
  // Expose loadSessions globally for direct access
  React.useEffect(() => {
    (window as any).__refreshLiveChatHistory = () => {
      loadSessions(true);
    };
    return () => {
      delete (window as any).__refreshLiveChatHistory;
    };
  }, [loadSessions]);

  // Initial load
  React.useEffect(() => {
    loadSessions(true);
  }, [loadSessions]);

  // Trigger refresh when refreshTrigger changes
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      loadSessions(true);
    }
  }, [refreshTrigger, loadSessions]);

  // Listen for session completion events to refresh
  React.useEffect(() => {
    const handleSessionCompleted = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('livechat-session-completed', handleSessionCompleted as EventListener);
    return () => {
      window.removeEventListener('livechat-session-completed', handleSessionCompleted as EventListener);
    };
  }, []);
  
  // Fallback to local history entries if backend sessions are empty
  const entries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));
  
  // Group images by date (flatten all sessions into a single list of images, like image generation history)
  // MUST be before early return to ensure hooks are called consistently
  const groupedByDate = useMemo(() => {
    // Use backend sessions if available
    if (backendSessions.length > 0) {
      // Flatten all sessions into a single list of images
      const allImages: Array<{ img: any; entry: any; timestamp: string }> = [];
      
      for (const session of backendSessions) {
        // Sort images by order
        const sortedImages = [...(session.images || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Add each image with its timestamp
        for (const img of sortedImages) {
          allImages.push({
            img: {
              id: img.id,
              url: img.url,
              originalUrl: img.originalUrl || img.url,
              firebaseUrl: img.firebaseUrl,
            },
            entry: {
              id: session.id,
              prompt: img.prompt || session.messages?.[0]?.prompt || '',
              status: 'completed' as const,
              timestamp: img.timestamp || session.startedAt,
            },
            timestamp: img.timestamp || session.startedAt,
          });
        }
      }
      
      // Sort all images by timestamp (newest first) - latest at top-left
      allImages.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA; // Newest first
      });
      
      // Group by date
      const dateMap = new Map<string, Array<{ img: any; entry: any }>>();
      
      for (const { img, entry, timestamp } of allImages) {
        const imageDate = new Date(timestamp).toISOString().split('T')[0];
        if (!dateMap.has(imageDate)) {
          dateMap.set(imageDate, []);
        }
        dateMap.get(imageDate)!.push({ img, entry });
      }
      
      // Convert to array format
      const result = Array.from(dateMap.entries()).map(([date, images]) => ({
        date,
        images,
      }));
      
      // Sort dates DESCENDING (newest first)
      return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    // Fallback: flatten local history entries into a single list of images
    const allImages: Array<{ img: any; entry: any; timestamp: string }> = [];
    
    for (const entry of entries) {
      const images = entry.images || [];
      for (const img of images) {
        allImages.push({
          img,
          entry,
          timestamp: entry.timestamp || entry.createdAt,
        });
      }
    }
    
    // Sort all images by timestamp (newest first) - latest at top-left
    allImages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Newest first
    });
    
    // Group by date
    const dateMap = new Map<string, Array<{ img: any; entry: any }>>();
    
    for (const { img, entry, timestamp } of allImages) {
      const imageDate = new Date(timestamp).toISOString().split('T')[0];
      if (!dateMap.has(imageDate)) {
        dateMap.set(imageDate, []);
      }
      dateMap.get(imageDate)!.push({ img, entry });
    }
    
    // Convert to array format
    const result = Array.from(dateMap.entries()).map(([date, images]) => ({
      date,
      images,
    }));
    
    // Sort dates DESCENDING (newest first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [backendSessions, entries]);

  // Show loading state (early return AFTER all hooks)
  if (loading && backendSessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
          <div className="text-sm text-white/60">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedByDate.map(({ date, images }) => {
        const dateObj = new Date(date);
        const dateStr = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }).format(dateObj);
        
        return (
          <div key={date} className="space-y-4">
            {/* Date Header - matching image generation page style */}
            <div className="flex items-center gap-3 px-3 md:px-0">
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
                {dateStr}
                {images.length > 0 && (
                  <span className="ml-2 text-white/50 text-xs">
                    • {images.length} {images.length === 1 ? 'image' : 'images'}
                  </span>
                )}
              </h3>
            </div>

            {/* All Images for this Date - Horizontal Layout (like image generation history) */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 md:ml-9 ml-0 px-3 md:px-0">
              {images.map(({ img, entry }, idx: number) => (
                <div
                  key={`${entry.id}-${img.id || idx}`}
                  onClick={(e) => {
                    // On double click or with modifier, open preview modal
                    // On single click, start modifying (open live chat input)
                    if (e.detail === 2 || e.ctrlKey || e.metaKey) {
                      setPreviewUrl(img.url);
                    } else if (onImageClick) {
                      onImageClick(img.url);
                    }
                  }}
                  onDoubleClick={() => setPreviewUrl(img.url)}
                  className="relative md:w-48 md:h-48 w-full aspect-square rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group"
                >
                  {entry.status === 'generating' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="flex flex-col items-center gap-2">
                        <Image src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                        <div className="text-xs text-white/60 text-center">Generating...</div>
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
                  ) : img.url ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={img.url} 
                        alt={entry.prompt || 'Generated image'} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-200" 
                        sizes="192px"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                      <div className="text-xs text-white/60">No image</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Sentinel element for infinite scroll (same as image generation history) */}
      {hasMore && !loading && (
        <div 
          ref={sentinelRef}
          style={{ height: 1, width: '100%' }} 
        />
      )}

      {/* Floating controls just above the input box so they are not hidden */}
      {hasMore && !loading && (
        <div className="fixed bottom-24 right-6 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={manualLoadMore}
            className="px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition shadow-md"
          >
            Load more
          </button>
          <button
            type="button"
            onClick={loadAllRemaining}
            className="px-3 py-1.5 text-xs rounded-full bg-white/90 text-black hover:bg-white transition shadow-md"
          >
            Load all
          </button>
        </div>
      )}

      {/* Fallback controls */}
      {!loading && (
        <div className="flex items-center justify-center gap-3 py-4">
          {hasMore && (
            <button
              type="button"
              onClick={manualLoadMore}
              className="px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition"
            >
              Load more
            </button>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={loadAllRemaining}
              className="px-3 py-1.5 text-xs rounded-full bg-white/90 text-black hover:bg-white transition"
            >
              Load all
            </button>
          )}
        </div>
      )}
      
      {/* Loading indicator for pagination */}
      {hasMore && loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
            <div className="text-xs text-white/60">Loading more sessions...</div>
          </div>
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasMore && backendSessions.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-xs text-white/40">No more sessions to load</div>
        </div>
      )}
      
      {/* Image preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setPreviewUrl(null)}>
          <div className="relative bg-black/90 ring-1 ring-white/20 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[85vh]" onClick={(e)=> e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute top-3 right-3 px-3 py-1.5 text-xs rounded-full bg-white text-black hover:bg-gray-200 transition z-10">Close</button>
            <div className="relative w-full h-[75vh]">
              <Image src={previewUrl} alt="Preview" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  // Log after mount (not during render) to avoid hydration issues
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[LiveChat] 🎯 Page component rendered (export default)', {
        isClient: typeof window !== 'undefined',
        timestamp: new Date().toISOString()
      });
    }
  }, []);
  
  return (
    <Suspense fallback={<div className="text-white/70 p-6">Loading…</div>}>
      <LiveChatPage />
    </Suspense>
  );
}