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
        const newHasMore = result.data?.hasMore ?? result.hasMore ?? false;

        if (isRefresh) {
          setItems(newItems);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }
        
        setNextCursor(newNextCursor);
        setHasMore(newHasMore);
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
