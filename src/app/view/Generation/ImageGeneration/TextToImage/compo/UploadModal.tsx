'use client';

import React from 'react';
import Image from 'next/image';
import { fetchLibrary, fetchUploads, LibraryItem } from '@/lib/libraryApi';
import { blobToDataUrl, compressImageIfNeeded } from '@/utils/imageCompression';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (urls: string[]) => void;
  remainingSlots: number; // how many images can still be added (max 4 total)
  mode?: 'image' | 'video' | 'music' | 'branding' | 'all'; // Mode for filtering
  onTabChange?: (tab: 'library' | 'computer' | 'uploads') => void; // Callback when tab changes
};

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAdd, remainingSlots, mode = 'image', onTabChange }) => {
  const [tab, setTab] = React.useState<'library' | 'computer' | 'uploads'>('library');
  
  // State for library items (generated media)
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>([]);
  const [libraryNextCursor, setLibraryNextCursor] = React.useState<string | undefined>();
  const [libraryHasMore, setLibraryHasMore] = React.useState(false);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  
  // State for upload items (user uploaded media)
  const [uploadItems, setUploadItems] = React.useState<LibraryItem[]>([]);
  const [uploadNextCursor, setUploadNextCursor] = React.useState<string | undefined>();
  const [uploadHasMore, setUploadHasMore] = React.useState(false);
  const [uploadLoading, setUploadLoading] = React.useState(false);
  const onTabChangePrevTabRef = React.useRef<typeof tab | null>(null);
  const onTabChangeCallbackRef = React.useRef(onTabChange);
  const isProcessingTabChangeRef = React.useRef(false);
  
  // Store the latest callback in a ref to avoid dependency issues
  React.useEffect(() => {
    onTabChangeCallbackRef.current = onTabChange;
  }, [onTabChange]);
  
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
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [localUploads, setLocalUploads] = React.useState<string[]>([]);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

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

  // Save previous tab scroll and restore per-tab scroll when modal opens or tab changes.
  React.useEffect(() => {
    if (!isOpen) return;

    const el = listRef.current;

    // Save previous tab's scrollTop so it can be restored when user navigates back
    const prev = prevTabRef.current;
    if (prev && el) {
      try { scrollPositionsRef.current[prev as 'library' | 'uploads'] = el.scrollTop; } catch {}
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scrollPositionsRef.current || {})); } catch {}
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
  
  React.useEffect(() => {
    if (!isOpen) {
      setSelection(new Set());
      setLocalUploads([]);
      setTab('library');
      scrollPositionBeforeLoadRef.current = null;
      isLoadingMoreRef.current = false;
    }
  }, [isOpen]);

  // Fetch library items when modal opens or tab changes to library
  React.useEffect(() => {
    if (isOpen && tab === 'library' && libraryItems.length === 0 && !libraryLoading) {
      setLibraryLoading(true);
      fetchLibrary({ limit: 50, mode }).then((response) => {
        if (response.responseStatus === 'success' && response.data) {
          setLibraryItems(response.data.items || []);
          setLibraryNextCursor(response.data.nextCursor);
          setLibraryHasMore(response.data.hasMore || false);
        }
        setLibraryLoading(false);
      }).catch(() => {
        setLibraryLoading(false);
      });
    }
  }, [isOpen, tab, mode]);

  // Fetch upload items when modal opens or tab changes to uploads
  React.useEffect(() => {
    if (isOpen && tab === 'uploads' && uploadItems.length === 0 && !uploadLoading) {
      setUploadLoading(true);
      fetchUploads({ limit: 50, mode }).then((response) => {
        if (response.responseStatus === 'success' && response.data) {
          setUploadItems(response.data.items || []);
          setUploadNextCursor(response.data.nextCursor);
          setUploadHasMore(response.data.hasMore || false);
        }
        setUploadLoading(false);
      }).catch(() => {
        setUploadLoading(false);
      });
    }
  }, [isOpen, tab, mode]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setLibraryItems([]);
      setLibraryNextCursor(undefined);
      setLibraryHasMore(false);
      setUploadItems([]);
      setUploadNextCursor(undefined);
      setUploadHasMore(false);
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

  // Get current items based on tab
  const getCurrentItems = (): LibraryItem[] => {
    if (tab === 'library') {
      return libraryItems;
    } else if (tab === 'uploads') {
      return uploadItems;
    }
    return [];
  };

  const currentItems = getCurrentItems();
  const currentLoading = tab === 'library' ? libraryLoading : uploadLoading;
  const currentHasMore = tab === 'library' ? libraryHasMore : uploadHasMore;

  // Load more function
  const handleLoadMore = React.useCallback(async () => {
    if (currentLoading || !currentHasMore || isLoadingMoreRef.current) return;
    
    isLoadingMoreRef.current = true;
    
    if (tab === 'library' && libraryNextCursor) {
      setLibraryLoading(true);
      try {
        const response = await fetchLibrary({ limit: 50, nextCursor: libraryNextCursor, mode });
        if (response.responseStatus === 'success' && response.data) {
          setLibraryItems(prev => [...prev, ...(response.data.items || [])]);
          setLibraryNextCursor(response.data.nextCursor);
          setLibraryHasMore(response.data.hasMore || false);
        }
      } catch (error) {
        console.error('Failed to load more library items:', error);
      } finally {
        setLibraryLoading(false);
        isLoadingMoreRef.current = false;
      }
    } else if (tab === 'uploads' && uploadNextCursor) {
      setUploadLoading(true);
      try {
        const response = await fetchUploads({ limit: 50, nextCursor: uploadNextCursor, mode });
        if (response.responseStatus === 'success' && response.data) {
          setUploadItems(prev => [...prev, ...(response.data.items || [])]);
          setUploadNextCursor(response.data.nextCursor);
          setUploadHasMore(response.data.hasMore || false);
        }
      } catch (error) {
        console.error('Failed to load more upload items:', error);
      } finally {
        setUploadLoading(false);
        isLoadingMoreRef.current = false;
      }
    } else {
      isLoadingMoreRef.current = false;
    }
  }, [tab, libraryNextCursor, uploadNextCursor, currentLoading, currentHasMore, mode]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (tab === 'library' || tab === 'uploads') {
      const chosen = Array.from(selection).slice(0, remainingSlots);
      if (chosen.length) onAdd(chosen);
      setSelection(new Set());
    } else {
      const chosen = localUploads.slice(0, remainingSlots);
      if (chosen.length) onAdd(chosen);
      setLocalUploads([]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-lg overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'library' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('library')}>Upload from your library</button>
              <button className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'uploads' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('uploads')}>Your Uploads</button>
              <button className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'computer' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('computer')}>Upload from your device</button>
            </div>
            <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="p-4">
            {tab === 'library' || tab === 'uploads' ? (
              <div>
                <div className="text-white/70 text-sm mb-3 ">
                  {tab === 'uploads' 
                    ? `Select up to ${remainingSlots} image${remainingSlots === 1 ? '' : 's'} from your uploads`
                    : `Select up to ${remainingSlots} image${remainingSlots === 1 ? '' : 's'} from your previously generated results`
                  }
                </div>
                <div
                  ref={listRef}
                  onScroll={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    // Save current scroll for this tab
                    try {
                      scrollPositionsRef.current[tab as 'library' | 'uploads'] = el.scrollTop;
                    } catch {}
                    
                    if (currentLoading || isLoadingMoreRef.current || !currentHasMore) return;
                    
                    // Check if user scrolled near bottom (200px threshold)
                    const scrollBottom = el.scrollTop + el.clientHeight;
                    const scrollHeight = el.scrollHeight;
                    const nearBottom = scrollBottom >= scrollHeight - 200;
                    
                    if (nearBottom) {
                      // Save current scroll position and scroll height before loading
                      const scrollTopBefore = el.scrollTop;
                      const scrollHeightBefore = el.scrollHeight;
                      
                      // Call handleLoadMore to fetch more items
                      handleLoadMore().then(() => {
                        // After new items are loaded, maintain scroll position
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            if (el) {
                              const scrollHeightAfter = el.scrollHeight;
                              const heightDiff = scrollHeightAfter - scrollHeightBefore;
                              
                              // Maintain scroll position relative to bottom
                              // This prevents jumping when new items are added
                              if (heightDiff > 0) {
                                // New content added - keep same scroll position
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
                  {currentLoading && currentItems.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center h-32 text-white/60">
                      Loading...
                    </div>
                  ) : currentItems.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center h-32 text-white/60">
                      No items found
                    </div>
                  ) : (
                    currentItems.map((item: LibraryItem, index: number) => {
                      const safeUrl = item.url || item.originalUrl || '';
                      if (!safeUrl) return null;
                      const selected = selection.has(safeUrl);
                      const imageSrc = item.thumbnail || safeUrl;
                      const itemKey = `${item.id || item.historyId || 'item'}-${item.mediaId || index}`;

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
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={tab === 'uploads' ? 'upload' : 'library'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
                              No image
                            </div>
                          )}
                          {selected && <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-lg" />}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                        </button>
                      );
                    })
                  )}
                </div>
                {currentHasMore && (
                  <div className="flex items-center justify-center pt-3 text-white/60 text-xs">
                    {currentLoading ? 'Loading more…' : 'Scroll to load more'}
                  </div>
                )}
                <div className="flex justify-end mt-0 gap-2">
                  <button className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-white/70 text-sm mb-3">Choose up to {remainingSlots} image{remainingSlots === 1 ? '' : 's'}</div>
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
                      const processed = await compressImageIfNeeded(file);
                      const asDataUrl = await blobToDataUrl(processed);
                      urls.push(asDataUrl);
                    }
                    if (urls.length) { setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots)); }
                  }}
                  className={`border-2 border-dashed border-white/30 rounded-lg h-[51.75vh] flex cursor-pointer hover:border-white/60 overflow-y-auto custom-scrollbar ${localUploads.length > 0 ? 'items-start justify-start p-3' : 'items-center justify-center'}`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = async () => {
                      const slotsLeft = Math.max(0, remainingSlots - localUploads.length);
                      if (slotsLeft <= 0) return;
                      const files = Array.from(input.files || []).slice(0, slotsLeft);
                      const urls: string[] = [];
                      for (const file of files) {
                        const processed = await compressImageIfNeeded(file);
                        const asDataUrl = await blobToDataUrl(processed);
                        urls.push(asDataUrl);
                      }
                      if (urls.length) { setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots)); }
                    };
                    input.click();
                  }}
                >
                  {localUploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-white/60 select-none ">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      <div className="mt-2 text-sm">Drop images here or click to browse</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3  w-full place-content-start">
                      {localUploads.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                          <Image src={url} alt={`upload-${idx}`} fill className="object-cover" />
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
                  <button className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;


