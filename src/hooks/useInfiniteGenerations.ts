import { useState, useEffect, useCallback, useRef } from "react";

export interface GenerationItem {
  id: string;
  prompt: string;
  status: "generating" | "completed" | "failed";
  generationType: string;
  createdAt: string;
  images?: Array<{ url: string; isPublic?: boolean }>;
  videos?: Array<{ url: string; isPublic?: boolean }>;
  [key: string]: any;
}

export interface UseInfiniteGenerationsOptions {
  limit?: number;
  status?: "generating" | "completed" | "failed";
  generationType?: string | string[];
  mode?: "video" | "image" | "music" | "all";
  search?: string;
  endpoint?: string; // API endpoint to fetch from
  autoFetch?: boolean; // Auto-fetch on mount
}

export interface UseInfiniteGenerationsReturn {
  items: GenerationItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;
  nextCursor: number | null;
}

/**
 * Hook for infinite scroll pagination of generation items
 * Uses optimized cursor-based pagination with createdAt timestamps
 * 
 * @example
 * ```tsx
 * const { items, loading, hasMore, fetchMore, refresh } = useInfiniteGenerations({
 *   limit: 20,
 *   generationType: 'text-to-image',
 *   endpoint: '/api/history'
 * });
 * 
 * // Use with Intersection Observer for infinite scroll
 * <div ref={observerRef}>{hasMore && !loading && 'Load more...'}</div>
 * ```
 */
export function useInfiniteGenerations(
  options: UseInfiniteGenerationsOptions = {}
): UseInfiniteGenerationsReturn {
  const {
    limit = 20,
    status,
    generationType,
    mode,
    search,
    endpoint = "/api/history",
    autoFetch = true,
  } = options;

  const [items, setItems] = useState<GenerationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if we're on first load
  const isInitialMount = useRef(true);
  
  // Ref to prevent duplicate requests
  const fetchingRef = useRef(false);

  const fetchGenerations = useCallback(
    async (cursor: number | null = null, isRefresh = false) => {
      // Prevent duplicate requests
      if (fetchingRef.current) return;
      
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", limit.toString());
        
        if (cursor) {
          params.set("nextCursor", cursor.toString());
        }
        
        if (status) {
          params.set("status", status);
        }
        
        if (generationType) {
          if (Array.isArray(generationType)) {
            params.set("generationType", generationType.join(","));
          } else {
            params.set("generationType", generationType);
          }
        }
        
        if (mode) {
          params.set("mode", mode);
        }
        
        if (search) {
          params.set("search", search);
        }

        const response = await fetch(`${endpoint}?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Handle different response formats
        const newItems = result.data?.items || result.items || [];
        const newNextCursor = result.data?.nextCursor ?? result.nextCursor ?? null;

        // Determine hasMore robustly:
        // 1. If server provided an explicit boolean flag, trust it.
        // 2. Otherwise, infer: if returned items.length < requested limit => no more pages.
        //    If items.length >= limit then require nextCursor to be present to consider there are more pages.
        const serverHasMore = result.data?.hasMore ?? result.hasMore;
        let inferredHasMore: boolean;
        if (typeof serverHasMore === 'boolean') {
          inferredHasMore = serverHasMore;
        } else {
          const itemsCount = Array.isArray(newItems) ? newItems.length : 0;
          if (itemsCount < limit) {
            inferredHasMore = false;
          } else {
            inferredHasMore = Boolean(newNextCursor);
          }
        }

        if (isRefresh) {
          setItems(newItems);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }

        setNextCursor(newNextCursor);
        setHasMore(inferredHasMore);
      } catch (err) {
        console.error("[useInfiniteGenerations] Error fetching generations:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch generations");
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [limit, status, generationType, mode, search, endpoint]
  );

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchGenerations(nextCursor);
  }, [nextCursor, hasMore, loading, fetchGenerations]);

  const refresh = useCallback(async () => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    await fetchGenerations(null, true);
  }, [fetchGenerations]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        refresh();
      } else {
        // When filters change, refresh the list
        const timer = setTimeout(() => {
          refresh();
        }, 300); // Debounce for search
        return () => clearTimeout(timer);
      }
    }
  }, [autoFetch, status, generationType, mode, search, refresh]);

  return {
    items,
    loading,
    error,
    hasMore,
    fetchMore,
    refresh,
    nextCursor,
  };
}

/**
 * Hook for setting up Intersection Observer for infinite scroll
 * 
 * @example
 * ```tsx
 * const { items, loading, hasMore, fetchMore } = useInfiniteGenerations();
 * const observerRef = useInfiniteScrollObserver(fetchMore, hasMore, loading);
 * 
 * return (
 *   <>
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *     {hasMore && <div ref={observerRef} className="h-10" />}
 *   </>
 * );
 * ```
 */
export function useInfiniteScrollObserver(
  fetchMore: () => Promise<void>,
  hasMore: boolean,
  loading: boolean
) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          fetchMore();
        }
      },
      {
        threshold: 0.5,
        rootMargin: "100px", // Start loading 100px before reaching the trigger
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchMore, hasMore, loading]);

  return observerRef;
}

/**
 * Attach an IntersectionObserver to an existing ref (sentinel) and call loadMore when needed.
 * This is a small utility to standardize the "hasMore-first" + local-busy + optional user-scroll gating
 */
export function useIntersectionObserverForRef(
  sentinelRef: React.RefObject<HTMLElement | null>,
  loadMore: () => Promise<void>,
  hasMore: boolean,
  loading: boolean,
  options?: {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    // If true, skip checking the `hasMore` flag and always attempt to load when intersecting.
    // Use this only when the caller knows the server may return inconsistent `hasMore` values
    // and wants to rely on the thunk's internal guards instead.
    ignoreHasMore?: boolean;
    requireUserScrollRef?: React.RefObject<boolean>;
    // Optional debug event sink to visualize IO behavior without using console
    onEvent?: (evt: {
      type: 'observe' | 'intersect' | 'skip' | 'load-start' | 'load-end' | 'disconnect' | 'scroll-resume';
      detail?: any;
      ts: number;
    }) => void;
  }
) {
  const loadingMoreRef = useRef(false);
  // Keep latest values in refs to avoid recreating the observer too often
  const latestLoadMoreRef = useRef(loadMore);
  const latestHasMoreRef = useRef(hasMore);
  const latestLoadingRef = useRef(loading);
  const latestOnEventRef = useRef(options?.onEvent);
  const latestRequireUserScrollRef = useRef(options?.requireUserScrollRef);
  const lastIntersectingRef = useRef(false);
  const lastLoadAtRef = useRef(0);

  // Update refs each render
  useEffect(() => { latestLoadMoreRef.current = loadMore; }, [loadMore]);
  useEffect(() => { latestHasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { latestLoadingRef.current = loading; }, [loading]);
  useEffect(() => { latestOnEventRef.current = options?.onEvent; }, [options?.onEvent]);
  useEffect(() => { latestRequireUserScrollRef.current = options?.requireUserScrollRef; }, [options?.requireUserScrollRef]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
  const { root = null, rootMargin = '0px 0px 200px 0px', threshold = 0.1 } = options || {};

  try { latestOnEventRef.current && latestOnEventRef.current({ type: 'observe', ts: Date.now(), detail: { rootSet: Boolean(root), rootMargin, threshold } }); } catch {}
  try { console.log('[INF_SCROLL] observe', { rootSet: Boolean(root), rootMargin, threshold }); } catch {}

    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) {
        lastIntersectingRef.current = false;
        return;
      }
      lastIntersectingRef.current = true;
      try { latestOnEventRef.current && latestOnEventRef.current({ type: 'intersect', ts: Date.now(), detail: { isIntersecting: entry.isIntersecting, ratio: entry.intersectionRatio } }); } catch {}
      try { console.log('[INF_SCROLL] intersect', { ratio: entry.intersectionRatio }); } catch {}
      const requireUserScrollRef = latestRequireUserScrollRef.current;
      if (requireUserScrollRef && !requireUserScrollRef.current) {
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'skip', ts: Date.now(), detail: { reason: 'user-not-scrolled' } }); } catch {}
        try { console.log('[INF_SCROLL] skip', { reason: 'user-not-scrolled' }); } catch {}
        return;
      }

  // Check hasMore first to avoid extra requests unless caller opted out
  const hasMoreNow = latestHasMoreRef.current;
  const loadingNow = latestLoadingRef.current;
  const ignoreHasMore = Boolean(options?.ignoreHasMore);
  if (!ignoreHasMore && !hasMoreNow) {
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'skip', ts: Date.now(), detail: { reason: 'no-more' } }); } catch {}
        try { console.log('[INF_SCROLL] skip', { reason: 'no-more' }); } catch {}
        return;
      }

      // Cooldown to avoid bursts (e.g., many wheel events): 700ms
      const now = Date.now();
      if (now - lastLoadAtRef.current < 700) {
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'skip', ts: now, detail: { reason: 'cooldown' } }); } catch {}
        try { console.log('[INF_SCROLL] skip', { reason: 'cooldown' }); } catch {}
        return;
      }

      if (loadingNow || loadingMoreRef.current) {
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'skip', ts: Date.now(), detail: { reason: 'busy', loading: loadingNow, localBusy: loadingMoreRef.current } }); } catch {}
        try { console.log('[INF_SCROLL] skip', { reason: 'busy', loading: loadingNow, localBusy: loadingMoreRef.current }); } catch {}
        return;
      }

      loadingMoreRef.current = true;
      lastLoadAtRef.current = now;
      try { latestOnEventRef.current && latestOnEventRef.current({ type: 'load-start', ts: Date.now() }); } catch {}
      try { console.log('[INF_SCROLL] load-start'); } catch {}
      try {
        await latestLoadMoreRef.current();
      } catch (e) {
        // swallow - caller may log
      } finally {
        loadingMoreRef.current = false;
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'load-end', ts: Date.now() }); } catch {}
        try { console.log('[INF_SCROLL] load-end'); } catch {}
      }
    }, { root, rootMargin, threshold });

    observer.observe(el);

    // If user-scroll gating is enabled, listen to scroll on root/window and
    // retry load if sentinel is already intersecting and user has scrolled.
    const requireUserScrollRef = latestRequireUserScrollRef.current;
    const onScrollResume = async () => {
      try { console.log('[INF_SCROLL] user-scroll'); } catch {}
      const hasUserScrolled = !!requireUserScrollRef?.current;
      const intersectingNow = lastIntersectingRef.current;
      const hasMoreNow = latestHasMoreRef.current;
      const loadingNow = latestLoadingRef.current;
      if (hasUserScrolled && intersectingNow) {
        if (!Boolean(options?.ignoreHasMore) && !hasMoreNow) return;
        // cooldown
        const now = Date.now();
        if (now - lastLoadAtRef.current < 700) return;
        if (loadingNow || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        lastLoadAtRef.current = now;
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'scroll-resume', ts: Date.now() }); } catch {}
        try { console.log('[INF_SCROLL] scroll-resume'); } catch {}
        try { latestOnEventRef.current && latestOnEventRef.current({ type: 'load-start', ts: Date.now() }); } catch {}
        try { console.log('[INF_SCROLL] load-start'); } catch {}
        try {
          await latestLoadMoreRef.current();
        } finally {
          loadingMoreRef.current = false;
          try { latestOnEventRef.current && latestOnEventRef.current({ type: 'load-end', ts: Date.now() }); } catch {}
          try { console.log('[INF_SCROLL] load-end'); } catch {}
        }
      }
    };
    const rootEl = root as Element | null;
    if (requireUserScrollRef) {
      // listen to BOTH window and root, for scroll/wheel/touchmove
      window.addEventListener('scroll', onScrollResume as any, { passive: true } as any);
      window.addEventListener('wheel', onScrollResume as any, { passive: true } as any);
      window.addEventListener('touchmove', onScrollResume as any, { passive: true } as any);
      if (rootEl) {
        rootEl.addEventListener('scroll', onScrollResume as any, { passive: true } as any);
        rootEl.addEventListener('wheel', onScrollResume as any, { passive: true } as any);
        rootEl.addEventListener('touchmove', onScrollResume as any, { passive: true } as any);
      }
    }

    return () => {
      try { observer.disconnect(); } catch { }
      try { latestOnEventRef.current && latestOnEventRef.current({ type: 'disconnect', ts: Date.now() }); } catch {}
      try { console.log('[INF_SCROLL] disconnect'); } catch {}
      if (requireUserScrollRef) {
        window.removeEventListener('scroll', onScrollResume as any);
        window.removeEventListener('wheel', onScrollResume as any);
        window.removeEventListener('touchmove', onScrollResume as any);
        if (rootEl) {
          rootEl.removeEventListener('scroll', onScrollResume as any);
          rootEl.removeEventListener('wheel', onScrollResume as any);
          rootEl.removeEventListener('touchmove', onScrollResume as any);
        }
      }
    };
  // Only recreate when the element or core IO settings change
  }, [sentinelRef, options?.root, options?.rootMargin, options?.threshold]);
}
