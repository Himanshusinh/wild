'use client';

import React from 'react';
import { toThumbUrl, toDirectUrl } from '@/lib/thumb';

// Helper functions for proxy URLs (same as InputBox.tsx and History.tsx)
const toProxyPath = (urlOrPath: string | undefined) => {
  if (!urlOrPath) return '';
  
  // Decode URL-encoded paths first (e.g., users%2Fvivek%2Fvideo%2F... -> users/vivek/video/...)
  let decoded = urlOrPath;
  try {
    // Always try to decode if it contains encoded characters
    if (urlOrPath.includes('%')) {
      decoded = decodeURIComponent(urlOrPath);
    }
  } catch (e) {
    // If decoding fails, use original
    decoded = urlOrPath;
  }
  
  const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || '';
  if (decoded.startsWith(ZATA_PREFIX)) {
    return decoded.substring(ZATA_PREFIX.length);
  }
  
  // Allow direct storagePath-like values (users/...)
  if (/^users\//.test(decoded)) {
    return decoded;
  }
  
  // Also check if it's already a URL-encoded users path (users%2F...)
  // This handles cases where the API returns already-encoded paths
  if (/^users%2F/i.test(urlOrPath)) {
    try {
      const decodedPath = decodeURIComponent(urlOrPath);
      if (/^users\//.test(decodedPath)) {
        return decodedPath;
      }
    } catch (e) {
      // Decoding failed, continue
    }
  }
  
  // For external URLs (fal.media, etc.), do not proxy
  return '';
};

const toFrontendProxyMediaUrl = (urlOrPath: string | undefined) => {
  if (!urlOrPath) return '';
  
  // If it's already a full HTTP/HTTPS URL, use it directly
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  
  // If it's already a proxy URL, use it directly (don't double-encode)
  if (urlOrPath.startsWith('/api/proxy/media/')) {
    return urlOrPath;
  }
  
  const path = toProxyPath(urlOrPath);
  if (!path) {
    // If toProxyPath returned empty, it might be an external URL - return as-is
    return urlOrPath;
  }
  
  // Path from toProxyPath is always decoded (users/vivek/video/...)
  // Encode it once for the proxy URL
  const encodedPath = encodeURIComponent(path);
  return `/api/proxy/media/${encodedPath}`;
};

import { getLibraryPage, LibraryItem } from '@/lib/libraryApi';
import { toMediaProxy } from '@/lib/thumb';

type VideoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (urls: string[], entries?: any[], filesByUrl?: Record<string, File>) => void;
  remainingSlots: number; // how many videos can still be added (max 1 for video-to-video)
};

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ isOpen, onClose, onAdd, remainingSlots }) => {
  const [tab, setTab] = React.useState<'library' | 'computer'>('library');
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [localUploads, setLocalUploads] = React.useState<string[]>([]);
  const [localUploadFiles, setLocalUploadFiles] = React.useState<Record<string, File>>({});
  const preserveObjectUrlsRef = React.useRef<Set<string>>(new Set());
  const dropRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  
  // State for library items
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>([]);
  const [libraryNextCursor, setLibraryNextCursor] = React.useState<string | number | undefined>();
  const [libraryHasMore, setLibraryHasMore] = React.useState(false);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  const isLoadingMoreRef = React.useRef(false);
  const hasLoadedLibraryRef = React.useRef(false);

  // Remember scroll positions so switching tabs preserves where user was
  const scrollPositionsRef = React.useRef<{ [k in 'library' | 'computer']?: number }>({});
  const STORAGE_KEY = 'wm_video_upload_modal_scroll_positions';
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

  // Save previous tab scroll and restore per-tab scroll when modal opens or tab changes.
  React.useEffect(() => {
    if (!isOpen) return;

    const el = listRef.current;

    // Save previous tab's scrollTop so it can be restored when user navigates back
    const prev = prevTabRef.current;
    if (prev && el) {
      try { scrollPositionsRef.current[prev as 'library' | 'computer'] = el.scrollTop; } catch {}
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scrollPositionsRef.current || {})); } catch {}
    }

    // Only restore for library/computer list (drop area uses dropRef)
    if (tab !== 'library' && tab !== 'computer') {
      prevTabRef.current = tab;
      return;
    }

    // Restore the saved position, or if this tab hasn't been visited yet, go to top
    requestAnimationFrame(() => {
      if (!el) return;
      const saved = scrollPositionsRef.current[tab as 'library' | 'computer'];
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

  // Fetch library items when modal opens or tab changes to library
  React.useEffect(() => {
    if (!isOpen || tab !== 'library') {
      if (!isOpen) hasLoadedLibraryRef.current = false; // Reset when modal closes
      return;
    }
    
    const loadLibrary = async () => {
      // Only load if we haven't loaded yet or if we have a cursor (pagination)
      if (hasLoadedLibraryRef.current && !libraryNextCursor) return; // Already loaded all
      setLibraryLoading(true);
      try {
        const result = await getLibraryPage(50, libraryNextCursor, 'video');
        console.log('[VideoUploadModal] Loaded library:', {
          itemsCount: result.items.length,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          sampleItem: result.items[0]
        });
        // Deduplicate items by id to prevent duplicates
        setLibraryItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = result.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setLibraryNextCursor(result.nextCursor);
        setLibraryHasMore(result.hasMore);
        hasLoadedLibraryRef.current = true;
      } catch (error) {
        console.error('[VideoUploadModal] Error loading library:', error);
      } finally {
        setLibraryLoading(false);
      }
    };
    
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelection(new Set());
      setLocalUploads([]);
      // Cleanup any lingering object URLs
      try {
        const preserve = preserveObjectUrlsRef.current || new Set<string>();
        for (const url of Object.keys(localUploadFiles || {})) {
          if (preserve.has(url)) continue;
          try { URL.revokeObjectURL(url); } catch {}
        }
      } catch {}
      setLocalUploadFiles({});
      preserveObjectUrlsRef.current = new Set();
      setTab('library');
      // Reset library data when modal closes
      setLibraryItems([]);
      setLibraryNextCursor(undefined);
      setLibraryHasMore(false);
      isLoadingMoreRef.current = false;
      // Reset load flag so data reloads when modal opens again
      hasLoadedLibraryRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (tab === 'library') {
      const chosen = Array.from(selection).slice(0, remainingSlots);
      if (chosen.length) {
        // Find the library items corresponding to the selected URLs
        const selectedItems = libraryItems.filter(item => chosen.includes(item.url));
        // Pass selected items as entries (library items have the same structure)
        onAdd(chosen, selectedItems);
      }
      setSelection(new Set());
      onClose();
      return;
    }

    // tab === 'computer' – DO NOT upload here.
    // Only add the local blob URL(s) to the input box.
    // Upload (if needed) should happen later when the user clicks Generate.
    const chosen = localUploads.slice(0, remainingSlots);
    if (!chosen.length) {
      onClose();
      return;
    }

    // Preserve the blob URLs we are passing to the parent so modal cleanup doesn't revoke them.
    preserveObjectUrlsRef.current = new Set(chosen);

    const chosenFiles: Record<string, File> = {};
    for (const url of chosen) {
      const file = localUploadFiles[url];
      if (file) chosenFiles[url] = file;
    }

    onAdd(chosen, [], chosenFiles);

    // Clear modal-local state (do NOT revoke blob URLs here; they are still used in the input).
    setLocalUploads([]);
    setLocalUploadFiles({});
    onClose();
  };

  // Get display items from library
  const displayItems = libraryItems.map(item => {
    // Convert storagePath to full Zata URL if available (e.g., users/rajdeop/input/... -> https://idr01.zata.ai/devstoragev1/users/rajdeop/input/...)
    let displayUrl = item.url;
    if (item.storagePath && !item.url?.startsWith('http')) {
      displayUrl = toDirectUrl(item.storagePath) || item.url;
    }
    return {
      id: item.id,
      url: displayUrl, // Full Zata URL: https://idr01.zata.ai/devstoragev1/users/username/input/historyId/filename.mp4
      thumbnailUrl: item.thumbnail || displayUrl,
      storagePath: item.storagePath, // Keep original storagePath: users/username/input/historyId/filename.mp4
      mediaId: item.mediaId,
    };
  });

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-lg overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between md:px-4 px-3 md:py-3 py-2 border-b border-white/10 gap-2">
            <div className="flex items-center gap-2">
              <button className={`md:px-3 px-2 md:py-1.5 py-0.5 rounded-lg md:text-sm text-[11px] ${tab === 'library' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('library')}>Upload from your library</button>
              <button className={`md:px-3 px-2 md:py-1.5 py-0.5 rounded-lg md:text-sm text-[11px] ${tab === 'computer' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('computer')}>Upload from your device</button>
            </div>
            <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="p-4">
            {tab === 'library' ? (
              <div>
                <div className="text-white/70 md:text-sm text-[11px] md:mb-3 mb-1">Select up to {remainingSlots} video{remainingSlots === 1 ? '' : 's'} from your previously generated results</div>
                <div
                  ref={listRef}
                  onScroll={async (e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    try { 
                      scrollPositionsRef.current[tab] = el.scrollTop; 
                      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scrollPositionsRef.current || {})); } catch {}
                    } catch {}
                    
                    if (libraryLoading || isLoadingMoreRef.current || !libraryHasMore) return;
                    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
                    
                    if (nearBottom) {
                      const scrollTopBefore = el.scrollTop;
                      const scrollHeightBefore = el.scrollHeight;
                      isLoadingMoreRef.current = true;
                      
                      try {
                        setLibraryLoading(true);
                        const result = await getLibraryPage(50, libraryNextCursor, 'video');
                        // Deduplicate items by id
                        setLibraryItems(prev => {
                          const existingIds = new Set(prev.map(item => item.id));
                          const newItems = result.items.filter(item => !existingIds.has(item.id));
                          return [...prev, ...newItems];
                        });
                        setLibraryNextCursor(result.nextCursor);
                        setLibraryHasMore(result.hasMore);
                        setLibraryLoading(false);
                        
                        // Maintain scroll position
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            if (el) {
                              const scrollHeightAfter = el.scrollHeight;
                              const heightDiff = scrollHeightAfter - scrollHeightBefore;
                              if (heightDiff > 0) {
                                el.scrollTop = scrollTopBefore;
                              }
                            }
                            isLoadingMoreRef.current = false;
                          });
                        });
                      } catch (error) {
                        console.error('[VideoUploadModal] Error loading more:', error);
                        isLoadingMoreRef.current = false;
                        setLibraryLoading(false);
                      }
                    }
                  }}
                  className="grid grid-cols-3 md:grid-cols-5 gap-3 md:h-[50vh] h-[40vh] p-2 overflow-y-auto custom-scrollbar pr-1"
                >
                  {displayItems.map((item: any, index: number) => {
                    const videoUrl = item.url;
                    const selected = selection.has(videoUrl);
                    // Create unique key using id, url, and index to prevent duplicates
                    const key = `video-${item.id || videoUrl || index}-${index}`;
                    
                    // Get thumbnail URL with proxy for caching
                    const thumbnailUrl = item.thumbnailUrl;
                    const posterUrl = thumbnailUrl 
                      ? (toMediaProxy(thumbnailUrl) || thumbnailUrl)
                      : (toThumbUrl(videoUrl, { w: 480, q: 60 }) || undefined);
                    
                    // Get video source URL with proxy support for caching
                    const mediaUrl = item.storagePath || item.url;
                    const proxied = toFrontendProxyMediaUrl(mediaUrl);
                    const vsrc = proxied || (mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) ? mediaUrl : '');
                    
                    return (
                      <button key={key} onClick={() => {
                        const next = new Set(selection);
                        if (selected) next.delete(videoUrl); else next.add(videoUrl);
                        setSelection(next);
                      }} className={`relative w-full md:h-32 h-24 rounded-lg overflow-hidden ring-1 ${selected ? 'ring-white' : 'ring-white/20'} bg-black/50`}>
                        {vsrc ? (
                          <video
                            src={vsrc}
                            className="w-full h-full object-cover transition-opacity duration-200"
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            poster={posterUrl}
                            onMouseEnter={async (e) => { 
                              try { 
                                await (e.currentTarget as HTMLVideoElement).play();
                              } catch { } 
                            }}
                            onMouseLeave={(e) => { 
                              const v = e.currentTarget as HTMLVideoElement; 
                              try { v.pause(); v.currentTime = 0 } catch { }
                            }}
                            onError={(e) => {
                              console.error('[VideoUploadModal] Video load error:', {
                                src: vsrc,
                                videoUrl,
                                posterUrl,
                                error: e
                              });
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                        {selected && <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full" />}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                      </button>
                    );
                  })}
                </div>
                {libraryHasMore && (
                  <div className="flex items-center justify-center pt-3 text-white/60 md:text-sm text-[11px]">{libraryLoading ? 'Loading more…' : 'Scroll to load more'}</div>
                )}
                <div className="flex justify-end mt-0 gap-2">
                  <button className="md:px-4 px-3 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="md:px-4 px-3 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-white/70 md:text-sm text-[11px] md:mb-3 mb-1">Choose up to {remainingSlots} video{remainingSlots === 1 ? '' : 's'}</div>
                <div
                  ref={dropRef}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const slotsLeft = Math.max(0, remainingSlots - localUploads.length);
                    if (slotsLeft <= 0) return;
                    const files = Array.from(e.dataTransfer.files || []).slice(0, slotsLeft);
                    const urls: string[] = [];
                    const nextFiles: Record<string, File> = {};
                    for (const file of files) {
                      if (file.type.startsWith('video/')) {
                        const objectUrl = URL.createObjectURL(file);
                        urls.push(objectUrl);
                        nextFiles[objectUrl] = file;
                      }
                    }
                    if (urls.length) {
                      setLocalUploadFiles(prev => ({ ...prev, ...nextFiles }));
                      setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots));
                    }
                  }}
                  className={`border-2 border-dashed border-white/30 rounded-xl md:h-[51.75vh] h-[40vh] flex cursor-pointer hover:border-white/60 overflow-y-auto custom-scrollbar ${localUploads.length > 0 ? 'items-start justify-start p-3' : 'items-center justify-center'}`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.multiple = remainingSlots > 1;
                    input.onchange = async () => {
                      const slotsLeft = Math.max(0, remainingSlots - localUploads.length);
                      if (slotsLeft <= 0) return;
                      const files = Array.from(input.files || []).slice(0, slotsLeft);
                      const urls: string[] = [];
                      const nextFiles: Record<string, File> = {};
                      for (const file of files) {
                        if (file.type.startsWith('video/')) {
                          const objectUrl = URL.createObjectURL(file);
                          urls.push(objectUrl);
                          nextFiles[objectUrl] = file;
                        }
                      }
                      if (urls.length) {
                        setLocalUploadFiles(prev => ({ ...prev, ...nextFiles }));
                        setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots));
                      }
                    };
                    input.click();
                  }}
                >
                  {localUploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-white/60 select-none">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      <div className="mt-2 md:text-sm text-[11px]">Drop videos here or click to browse</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full place-content-start">
                      {localUploads.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                          <video
                            src={url}
                            className="w-full h-full object-cover transition-opacity duration-200"
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            onMouseEnter={async (e) => {
                              const video = e.currentTarget;
                              console.log('🎥 VIDEO HOVER ENTER (LocalUpload):', {
                                videoSrc: video.src,
                                videoReadyState: video.readyState,
                                videoPaused: video.paused
                              });
                              
                              try {
                                // Force video to load if not ready
                                if (video.readyState < 2) {
                                  console.log('⏳ Video not ready, loading...');
                                  video.load();
                                  await new Promise((resolve) => {
                                    video.addEventListener('loadeddata', resolve, { once: true });
                                    video.addEventListener('error', resolve, { once: true });
                                  });
                                }
                                
                                console.log('🎥 Video ready, attempting to play...');
                                video.currentTime = 1; // Start from 1 second for preview
                                await video.play();
                                console.log('✅ Video started playing successfully on hover!');
                              } catch (error: any) {
                                console.error('❌ Video play failed on hover:', error);
                                console.log('Video error details:', {
                                  code: error.code,
                                  message: error.message,
                                  name: error.name,
                                  readyState: video.readyState,
                                  networkState: video.networkState
                                });
                                
                                // Try alternative approach - muted autoplay
                                console.log('🔄 Trying alternative play method...');
                                video.muted = true; // Ensure muted for autoplay
                                try {
                                  await video.play();
                                  console.log('✅ Video started playing with muted autoplay!');
                                } catch (retryError) {
                                  console.error('❌ Retry also failed:', retryError);
                                }
                              }
                            }}
                            onMouseLeave={(e) => {
                              const video = e.currentTarget;
                              console.log('🎥 VIDEO HOVER LEAVE (LocalUpload)');
                              video.pause();
                              video.currentTime = 1; // Reset to 1 second frame
                            }}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const video = e.currentTarget;
                              console.log('🎥 VIDEO CLICKED (LocalUpload)');
                              
                              if (video.paused) {
                                try {
                                  video.currentTime = 1; // Start from 1 second for preview
                                  await video.play();
                                  console.log('✅ Video started playing on click!');
                                } catch (error) {
                                  console.error('❌ Video play failed on click:', error);
                                }
                              } else {
                                video.pause();
                                video.currentTime = 1; // Reset to 1 second frame
                                console.log('🎥 Video paused on click');
                              }
                            }}
                            onLoadedData={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.currentTime = 1; // Show frame at 1 second
                              console.log('🎥 VIDEO DATA LOADED (LocalUpload):', {
                                videoDuration: video.duration,
                                videoReadyState: video.readyState
                              });
                            }}
                          />
                          <button
                            aria-label="Remove"
                            title="Remove"
                            onClick={(e) => {
                              e.stopPropagation();
                                try { URL.revokeObjectURL(url); } catch {}
                                setLocalUploadFiles(prev => {
                                  const next = { ...(prev || {}) };
                                  delete next[url];
                                  return next;
                                });
                              setLocalUploads(prev => prev.filter((u, i) => !(u === url && i === idx)));
                            }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="flex justify-end md:mt-3 mt-2 gap-2">
                  <button className="md:px-4 px-3 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="md:px-4 px-3 md:py-2 py-1 rounded-lg md:text-sm text-[11px] bg-white text-black hover:bg-gray-200 disabled:opacity-60" onClick={handleAdd}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadModal;
