
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

const LiveChatPage = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const currentView = useAppSelector((state: any) => state?.ui?.currentView || 'generation');
  const currentGenerationType = useAppSelector((state: any) => state?.ui?.currentGenerationType || 'text-to-image');
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
        totalImages: session.totalImages,
        imageUrls: session.imageUrls.length,
        messages: session.messages.length,
      });
      
      // Extract all images from session in order (images are already in a single array)
      const allImages = session.images || [];
      
      // Sort by order to maintain sequence (should already be sorted, but ensure it)
      allImages.sort((a, b) => (a.order || 0) - (b.order || 0));
      
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
      <LiveChatInputBox />
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
  const entries = useAppSelector((s:any)=> (s.history?.entries || []).filter((e:any)=> e.generationType === 'live-chat'));
  
  // Group entries by date (like image generation history)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Array<{ img: any; entry: any }>>();
    
    // Flatten all images from all entries
    for (const entry of entries) {
      const images = entry.images || [];
      const entryDate = new Date(entry.timestamp || entry.createdAt).toISOString().split('T')[0];
      
      if (!map.has(entryDate)) {
        map.set(entryDate, []);
      }
      
      // Add all images from this entry
      for (const img of images) {
        map.get(entryDate)!.push({ img, entry });
      }
    }
    
    // Sort entries within each date by timestamp (newest first) so latest image appears at top-left
    const result = Array.from(map.entries()).map(([date, items]) => {
      const sorted = [...items].sort((a, b) => {
        const timeA = new Date(a.entry.timestamp || a.entry.createdAt).getTime();
        const timeB = new Date(b.entry.timestamp || b.entry.createdAt).getTime();
        return timeB - timeA; // Reverse order: newest first
      });
      
      return { date, images: sorted };
    });
    
    // Sort dates DESCENDING (newest first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  return (
    <div className="space-y-8">
      {groupedByDate.map(({ date, images }) => {
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
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

            {/* Images Grid - matching image generation page style */}
            <div className="flex flex-wrap gap-2 md:gap-3 md:ml-9 ml-0 px-3 md:px-0">
              {images.map(({ img, entry }, idx: number) => (
                <div
                  key={`${date}-${entry.id}-${img.id || idx}`}
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
                  className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-full aspect-square rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group"
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
                    <div className="relative w-full h-full group">
                      <Image 
                        src={img.url} 
                        alt={entry.prompt || 'Generated image'} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-200" 
                        sizes="(max-width: 768px) 50vw, 192px"
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
  return (
    <Suspense fallback={<div className="text-white/70 p-6">Loading…</div>}>
      <LiveChatPage />
    </Suspense>
  );
}