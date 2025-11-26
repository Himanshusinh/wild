'use client';

import React from 'react';
import Image from 'next/image';
import { toMediaProxy, toThumbUrl } from '@/lib/thumb';

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
  
  const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/';
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

import { fetchLibrary, LibraryItem } from '@/lib/libraryApi';

type VideoUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (urls: string[], entries?: any[]) => void; // Add optional entries parameter
  remainingSlots: number; // how many videos can still be added (max 1 for video-to-video)
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all'; // Mode for filtering
};

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ isOpen, onClose, onAdd, remainingSlots, mode = 'video' }) => {
  const [tab, setTab] = React.useState<'library' | 'computer'>('library');
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [localUploads, setLocalUploads] = React.useState<string[]>([]);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  
  // State for library items (generated videos)
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>([]);
  const [libraryNextCursor, setLibraryNextCursor] = React.useState<string | undefined>();
  const [libraryHasMore, setLibraryHasMore] = React.useState(false);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  const isLoadingMoreRef = React.useRef(false);

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

  // Fetch library items when modal opens
  React.useEffect(() => {
    if (isOpen && tab === 'library' && libraryItems.length === 0 && !libraryLoading) {
      setLibraryLoading(true);
      fetchLibrary({ limit: 50, mode }).then((response) => {
        if (response.responseStatus === 'success' && response.data) {
          // Filter to only videos
          const videos = (response.data.items || []).filter(item => item.type === 'video');
          setLibraryItems(videos);
          setLibraryNextCursor(response.data.nextCursor);
          setLibraryHasMore(response.data.hasMore || false);
        }
        setLibraryLoading(false);
      }).catch(() => {
        setLibraryLoading(false);
      });
    }
  }, [isOpen, tab, mode]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelection(new Set());
      setLocalUploads([]);
      setTab('library');
      setLibraryItems([]);
      setLibraryNextCursor(undefined);
      setLibraryHasMore(false);
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

  if (!isOpen) return null;

  // Load more function
  const handleLoadMore = React.useCallback(async () => {
    if (libraryLoading || !libraryHasMore || isLoadingMoreRef.current || !libraryNextCursor) return;
    
    isLoadingMoreRef.current = true;
    setLibraryLoading(true);
    
    try {
      const response = await fetchLibrary({ limit: 50, nextCursor: libraryNextCursor, mode });
      if (response.responseStatus === 'success' && response.data) {
        // Filter to only videos
        const videos = (response.data.items || []).filter(item => item.type === 'video');
        setLibraryItems(prev => [...prev, ...videos]);
        setLibraryNextCursor(response.data.nextCursor);
        setLibraryHasMore(response.data.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to load more library items:', error);
    } finally {
      setLibraryLoading(false);
      isLoadingMoreRef.current = false;
    }
  }, [libraryNextCursor, libraryLoading, libraryHasMore, mode]);

  const handleAdd = () => {
    if (tab === 'library') {
      const chosen = Array.from(selection).slice(0, remainingSlots);
      if (chosen.length) {
        const selectedItems = libraryItems.filter((item) => {
          const itemUrl = item.url || item.originalUrl || '';
          return itemUrl && chosen.includes(itemUrl);
        });
        onAdd(chosen, selectedItems as any);
      }
      setSelection(new Set());
    } else {
      const chosen = localUploads.slice(0, remainingSlots);
      if (chosen.length) onAdd(chosen, []); // No entries for local uploads
      setLocalUploads([]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-full text-sm ${tab === 'library' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('library')}>Upload from your library</button>
              <button className={`px-3 py-1.5 rounded-full text-sm ${tab === 'computer' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('computer')}>Upload from your device</button>
            </div>
            <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="p-4">
            {tab === 'library' ? (
              <div>
                <div className="text-white/70 text-sm mb-3">Select up to {remainingSlots} video{remainingSlots === 1 ? '' : 's'} from your previously generated results</div>
                <div
                  ref={listRef}
                  onScroll={(e) => {
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
                      handleLoadMore().then(() => {
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            if (el) {
                              const scrollHeightAfter = el.scrollHeight;
                              const heightDiff = scrollHeightAfter - scrollHeightBefore;
                              if (heightDiff > 0) {
                                el.scrollTop = scrollTopBefore;
                              }
                            }
                          });
                        });
                      });
                    }
                  }}
                  className="grid grid-cols-3 md:grid-cols-5 gap-3 h-[50vh] p-2 overflow-y-auto custom-scrollbar pr-1"
                >
                  {libraryLoading && libraryItems.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center h-32 text-white/60">
                      Loading...
                    </div>
                  ) : libraryItems.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center h-32 text-white/60">
                      No videos found
                    </div>
                  ) : (
                    libraryItems.map((item: LibraryItem, index: number) => {
                      const safeUrl = item.url || item.originalUrl || '';
                      if (!safeUrl) return null;
                      const selected = selection.has(safeUrl);
                      const posterUrl = item.thumbnail 
                        ? (toFrontendProxyMediaUrl(item.thumbnail) || item.thumbnail)
                        : (toThumbUrl(safeUrl, { w: 480, q: 60 }) || undefined);
                      
                      const mediaUrl = item.storagePath || safeUrl;
                      const proxied = toFrontendProxyMediaUrl(mediaUrl);
                      const vsrc = proxied || (mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) ? mediaUrl : '');
                      const itemKey = `${item.id || item.historyId || 'video'}-${item.mediaId || index}`;
                      
                      return (
                        <button
                          key={itemKey}
                          onClick={() => {
                            const next = new Set(selection);
                            if (selected) next.delete(safeUrl);
                            else next.add(safeUrl);
                            setSelection(next);
                          }}
                          className={`relative w-full h-32 rounded-lg overflow-hidden ring-1 ${selected ? 'ring-white' : 'ring-white/20'} bg-black/50`}
                        >
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
                    })
                  )}
                </div>
                {libraryHasMore && (
                  <div className="flex items-center justify-center pt-3 text-white/60 text-xs">
                    {libraryLoading ? 'Loading more…' : 'Scroll to load more'}
                  </div>
                )}
                <div className="flex justify-end mt-0 gap-2">
                  <button className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-white/70 text-sm mb-3">Choose up to {remainingSlots} video{remainingSlots === 1 ? '' : 's'}</div>
                <div
                  ref={dropRef}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const slotsLeft = Math.max(0, remainingSlots - localUploads.length);
                    if (slotsLeft <= 0) return;
                    const files = Array.from(e.dataTransfer.files || []).slice(0, slotsLeft);
                    const urls: string[] = [];
                    for (const file of files) {
                      if (file.type.startsWith('video/')) {
                        const reader = new FileReader();
                        const asDataUrl: string = await new Promise((res) => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
                        urls.push(asDataUrl);
                      }
                    }
                    if (urls.length) { setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots)); }
                  }}
                  className={`border-2 border-dashed border-white/30 rounded-xl h-[51.75vh] flex cursor-pointer hover:border-white/60 overflow-y-auto custom-scrollbar ${localUploads.length > 0 ? 'items-start justify-start p-3' : 'items-center justify-center'}`}
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
                      for (const file of files) {
                        if (file.type.startsWith('video/')) {
                          const reader = new FileReader();
                          const asDataUrl: string = await new Promise((res) => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
                          urls.push(asDataUrl);
                        }
                      }
                      if (urls.length) { setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots)); }
                    };
                    input.click();
                  }}
                >
                  {localUploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-white/60 select-none">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      <div className="mt-2 text-sm">Drop videos here or click to browse</div>
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
                <div className="flex justify-end mt-3 gap-2">
                  <button className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
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
