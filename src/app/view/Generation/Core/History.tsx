'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ImagePreviewModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ImagePreviewModal';
import VideoPreviewModal from '@/app/view/Generation/VideoGeneration/TextToVideo/compo/VideoPreviewModal';
import FilterPopover from '@/components/ui/FilterPopover';
import { HistoryEntry, HistoryFilters } from '@/types/history';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loadHistory, loadMoreHistory, setFilters, clearFilters, clearHistory } from '@/store/slices/historySlice';
import { setCurrentView } from '@/store/slices/uiSlice';

const History = () => {
  const dispatch = useAppDispatch();
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const error = useAppSelector((state: any) => state.history?.error);
  const theme = useAppSelector((state: any) => state.ui?.theme || 'dark');
  const currentGenerationType = useAppSelector((state: any) => state.ui?.currentGenerationType || 'text-to-image');
  const [viewMode, setViewMode] = useState<'global' | 'feature'>('global');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<{ entry: HistoryEntry; image: any } | null>(null);
  const [videoPreview, setVideoPreview] = useState<{ entry: HistoryEntry; video: any } | null>(null);
  const didInitialLoadRef = useRef(false);
  const isFetchingMoreRef = useRef(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setLocalFilters] = useState<HistoryFilters>({});
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  // Debug logs removed for cleaner console

  // Helper: load only the first page; more pages load on scroll
  const loadFirstPage = async (filtersObj: any) => {
    try {
      const result: any = await (dispatch as any)(loadHistory({ filters: filtersObj, paginationParams: { limit: 10 } })).unwrap();
      setHasMore(Boolean(result && result.hasMore));
    } catch { }
  };

  // Auto-fill viewport with a small safety cap to avoid fetching everything
  const autoFillViewport = async (baseFilters: any) => {
    try {
      let attempts = 0;
      while (
        attempts < 3 &&
        hasMore &&
        !loading &&
        (document.documentElement.scrollHeight - window.innerHeight) < 200
      ) {
        const more: any = await (dispatch as any)(loadMoreHistory({ filters: baseFilters, paginationParams: { limit: 10 } })).unwrap();
        setHasMore(Boolean(more && more.hasMore));
        attempts += 1;
      }
    } catch { }
  };

  // Load initial history on mount and when view mode changes
  useEffect(() => {
    const run = async () => {
      // Reset history to ensure a clean initial load on refresh
      dispatch(clearHistory());
      if (viewMode === 'global') {
        dispatch(setFilters({}));
        const base = {};
        await loadFirstPage(base);
        await autoFillViewport(base);
      } else {
        const f = { generationType: currentGenerationType } as any;
        dispatch(setFilters(f));
        await loadFirstPage(f);
        await autoFillViewport(f);
      }
      setPage(1);
      didInitialLoadRef.current = true;
    };
    run();
  }, [dispatch, viewMode, currentGenerationType]); // Run on mount and when view mode changes

  // Fallback: if nothing loaded (e.g., on hard refresh), trigger first page load
  useEffect(() => {
    if (historyEntries.length === 0 && !didInitialLoadRef.current) {
      const base = viewMode === 'global' ? {} : { generationType: currentGenerationType };
      (async () => {
        await loadFirstPage(base);
        await autoFillViewport(base);
        setPage(1);
        didInitialLoadRef.current = true;
      })();
    }
  }, [loading, historyEntries.length, viewMode, currentGenerationType]);

  // Handle sort order changes
  useEffect(() => {
    if (viewMode === 'global' && Object.keys(filters).length > 0) {
      // Re-apply filters with new sort order
      const finalFilters = { ...filters, sortOrder };
      dispatch(setFilters(finalFilters));
      (dispatch as any)(loadHistory({
        filters: finalFilters,
        paginationParams: { limit: 10 }
      })).unwrap().then((result: any) => {
        setHasMore(Boolean(result && result.hasMore));
      });
      setPage(1);
    }
  }, [sortOrder, dispatch, filters, viewMode]);

  // Handle scroll to load more
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading && !isFetchingMoreRef.current) {
          isFetchingMoreRef.current = true;
          const nextPage = page + 1;
          setPage(nextPage);
          const filters = viewMode === 'global' ? {} : { generationType: currentGenerationType };
          dispatch(loadMoreHistory({ filters, paginationParams: { limit: 10 } }))
            .then((result: any) => {
              if (result.payload && result.payload.entries) {
                setHasMore(result.payload.hasMore);
              }
            })
            .finally(() => {
              isFetchingMoreRef.current = false;
            });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, dispatch]);

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

  const handleSortChange = (order: 'desc' | 'asc') => {
    setSortOrder(order);
  };

  const applyFilters = async () => {
    const finalFilters = { ...filters };
    if (dateRange.start && dateRange.end) {
      finalFilters.dateRange = { start: dateRange.start, end: dateRange.end };
    }

    dispatch(setFilters(finalFilters));
    await loadFirstPage(finalFilters);
    await autoFillViewport(finalFilters);
    setPage(1);
  };

  const clearAllFilters = async () => {
    setLocalFilters({});
    setDateRange({ start: null, end: null });
    setSortOrder('desc');
    dispatch(clearFilters());
    const base = {};
    await loadFirstPage(base);
    await autoFillViewport(base);
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

  // Group entries by date to mirror TextToImage UI
  const groupedByDate = historyEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
    const dateKey = new Date(entry.timestamp).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
    return groups;
  }, {} as { [key: string]: HistoryEntry[] });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Header title to mirror TextToImage wording
  const headerTitle = viewMode === 'global'
    ? 'All Generation History'
    : (currentGenerationType === 'text-to-image'
      ? 'Image Generation History'
      : `${getGenerationTypeLabel(currentGenerationType)} History`);

  if (loading && historyEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
          <div className="text-white text-lg">Loading your generation history...</div>
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
    <div className="min-h-screen bg-transparent text-white p-2">
      {/* Fixed Header to match TextToImage style */}
      <div className="fixed top-0 mt-1 left-0 right-0 z-30 py-5 ml-18 mr-1 bg-white/10 backdrop-blur-xl shadow-xl pl-6 border border-white/10 rounded-2xl">
        <h2 className="text-xl font-semibold text-white">{headerTitle}</h2>
      </div>
      {/* Spacer below fixed header */}
      <div className="h-0"></div>

      {/* Controls row (back, count, filters, toggle) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* <button
            onClick={handleBackToGeneration}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Back to generation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z" />
            </svg>
          </button> */}
          <span className="text-md text-white/80">{historyEntries.length} generations</span>
          {hasMore && <span className="text-md text-white/80">• Scroll to load more</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="filter-container relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
              Filters
            </button>
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'global' ? 'feature' : 'global')}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            {viewMode === 'global' ? 'Show Feature History' : 'Show Global History'}
          </button>
        </div>
      </div>

      {/* Filter Popover */}
      <FilterPopover
        isOpen={showFilters}
        filters={filters}
        sortOrder={sortOrder}
        dateRange={dateRange}
        onFilterChange={handleFilterChange}
        onDateRangeChange={handleDateRangeChange}
        onSortChange={handleSortChange}
        onApplyFilters={applyFilters}
        onClearFilters={clearAllFilters}
        onClose={() => setShowFilters(false)}
      />



      {/* Active Filters Summary */}
      {(filters.generationType || filters.model || filters.status || dateRange.start || dateRange.end) && (
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
      )}

      {/* History Entries - TextToImage-like UI: date-grouped tiles */}
      {historyEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-white/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-2">No generations found</h3>
          <p className="text-white/50 mb-4">
            {Object.keys(filters).length > 0
              ? "Try adjusting your filters or clear them to see all generations."
              : "No generation history available yet."
            }
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
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-white/70">
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </h3>
              </div>

              {/* Tiles for this date */}
              <div className="flex flex-wrap gap-3 ml-9">
                {groupedByDate[dateKey].map((entry: HistoryEntry) =>
                  (entry.images || (entry as any).videos || []).map((media: any, mediaIndex: number) => {
                    const mediaUrl = media.firebaseUrl || media.url;
                    const video = isVideoUrl(mediaUrl);
                    return (
                      <div
                        key={`${entry.id}-${video ? 'video' : 'image'}-${mediaIndex}`}
                        data-image-id={`${entry.id}-${media.id || mediaIndex}`}
                        onClick={() => (video ? setVideoPreview({ entry, video: media }) : setPreview({ entry, image: media }))}
                        className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                      >
                        {entry.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
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
                          <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center relative">
                            {mediaUrl ? (
                              <video src={mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Video not available</span>
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                              <span className="text-xs text-white">Video</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full relative">
                            {mediaUrl ? (
                              <Image
                                src={mediaUrl}
                                alt={entry.prompt}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                                sizes="192px"
                                onLoad={() => {
                                  setTimeout(() => {
                                    const shimmer = document.querySelector(`[data-image-id="${entry.id}-${media.id || mediaIndex}"] .shimmer`) as HTMLElement;
                                    if (shimmer) shimmer.style.opacity = '0';
                                  }, 100);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Image not available</span>
                              </div>
                            )}
                            <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {/* Loader for scroll loading */}
          {hasMore && loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <div className="text-sm text-white/60">Loading more generations...</div>
              </div>
            </div>
          )}
        </div>
      )}
      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
      <VideoPreviewModal preview={videoPreview} onClose={() => setVideoPreview(null)} />
    </div>
  );
};

export default History;