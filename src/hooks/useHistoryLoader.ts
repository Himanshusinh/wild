import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadHistory, setFilters } from '@/store/slices/historySlice';

/**
 * Unified history loader / refresher
 * Responsibilities:
 * 1. Perform a single guarded initial load for the given generationType if entries missing.
 * 2. Expose a debounced refresh() that coalesces multiple rapid calls (e.g. after parallel image tasks finish).
 * 3. Prevent parallel duplicate loadHistory dispatches while one is in flight for the same generationType.
 * 4. Optionally allow custom limit override.
 */
interface UseHistoryLoaderOptions {
  generationType: string;
  // Optional expanded set of types to fetch (e.g., TTS synonyms)
  generationTypes?: string[];
  initialLimit?: number;
  debounceMs?: number;
  // If true, always force an initial request even if entries cached (rare, for hard refresh pages)
  forceInitial?: boolean;
}

// Simple in-memory per-type locks so multiple components mounting simultaneously don't double fetch
const inFlightTypeLocks: Record<string, boolean> = {};
const lastLoadTimestamps: Record<string, number> = {};

export const useHistoryLoader = ({
  generationType,
  generationTypes,
  initialLimit = 50,
  debounceMs = 600,
  forceInitial = false,
}: UseHistoryLoaderOptions) => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s: any) => s.history?.entries || []);
  const loading = useAppSelector((s: any) => s.history?.loading || false);
  const currentFilters = useAppSelector((s: any) => s.history?.filters || {});

  const debounceRef = useRef<number | null>(null);
  const pendingRefreshRef = useRef(false);
  const mountedRef = useRef(false);

  // Guarded initial load
  useEffect(() => {
    console.log('[useHistoryLoader] ========== INITIAL LOAD EFFECT ==========');
    console.log('[useHistoryLoader] State check:', {
      mounted: mountedRef.current,
      entriesCount: entries.length,
      loading,
      forceInitial,
      generationType,
      generationTypes,
      inFlightLock: inFlightTypeLocks[generationType],
    });
    
    if (mountedRef.current) {
      console.log('[useHistoryLoader] ⚠️ Already mounted, skipping initial load');
      return; // only once per mount
    }
    mountedRef.current = true;
    console.log('[useHistoryLoader] ✅ Mounted, proceeding with initial load check...');
    
    const norm = (t: string) => t.replace(/[_-]/g, '-').toLowerCase();
    const wantedTypes = Array.isArray(generationTypes) && generationTypes.length > 0 ? generationTypes : [generationType];
    const hasTypeEntries = entries.some((e: any) => wantedTypes.some(w => norm(e.generationType || '') === norm(String(w))));
    const currentFilterVal = currentFilters?.generationType;
    const filtersMatch = Array.isArray(currentFilterVal)
      ? wantedTypes.every(w => (currentFilterVal as string[]).some((cv: string) => norm(cv) === norm(String(w))))
      : norm(String(currentFilterVal || '')) === norm(generationType);
    
    console.log('[useHistoryLoader] Initial load conditions:', {
      hasTypeEntries,
      filtersMatch,
      forceInitial,
      shouldSkip: !forceInitial && hasTypeEntries && filtersMatch,
    });
    
    if (!forceInitial && hasTypeEntries && filtersMatch) {
      console.log('[useHistoryLoader] ⚠️ Already loaded, skipping initial load');
      return; // already loaded
    }
    
    if (inFlightTypeLocks[generationType]) {
      console.log('[useHistoryLoader] ⚠️ Lock active, skipping initial load');
      return; // another component kicked off load
    }
    
    console.log('[useHistoryLoader] ✅ Proceeding with initial load - setting lock and dispatching...');
    inFlightTypeLocks[generationType] = true;
    lastLoadTimestamps[generationType] = Date.now();
    const genFilter: any = { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
    
    console.log('[useHistoryLoader] Dispatching setFilters and loadHistory with:', {
      filters: genFilter,
      paginationParams: { limit: initialLimit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:init:${generationType}:${Date.now()}`,
    });
    
    dispatch(setFilters(genFilter as any));
    const dispatchPromise = (dispatch as any)(loadHistory({
      filters: genFilter,
      paginationParams: { limit: initialLimit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:init:${generationType}:${Date.now()}`,
    }));
    
    console.log('[useHistoryLoader] Initial load dispatch promise created');
    
    dispatchPromise.finally(() => {
      console.log('[useHistoryLoader] Initial load dispatch completed, releasing lock');
      inFlightTypeLocks[generationType] = false;
    }).catch((err: any) => {
      console.error('[useHistoryLoader] ❌ Initial load dispatch error:', err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced refresh
  const refresh = useCallback((limit: number = initialLimit) => {
    pendingRefreshRef.current = true;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      // Skip if a history load for this type is in-flight
      if (loading || inFlightTypeLocks[generationType]) {
        pendingRefreshRef.current = false;
        return;
      }
      inFlightTypeLocks[generationType] = true;
      lastLoadTimestamps[generationType] = Date.now();
      const genFilter: any = { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
      (dispatch as any)(loadHistory({
        filters: genFilter,
        paginationParams: { limit },
        requestOrigin: 'page',
        expectedType: generationType,
        debugTag: `hook:refresh:${generationType}:${Date.now()}`,
      })).finally(() => {
        inFlightTypeLocks[generationType] = false;
        pendingRefreshRef.current = false;
      });
    }, debounceMs);
  }, [generationType, generationTypes, debounceMs, dispatch, loading, initialLimit]);

  // Immediate (non-debounced) refresh - FORCE API CALL (bypass cache/locks for EditImage)
  const refreshImmediate = useCallback((limit: number = initialLimit, forceRefresh: boolean = true) => {
    console.log('[useHistoryLoader] ========== refreshImmediate CALLED ==========');
    console.log('[useHistoryLoader] Parameters:', {
      limit,
      generationType,
      generationTypes,
      loading,
      inFlightLock: inFlightTypeLocks[generationType],
      forceRefresh,
    });
    
    // If forceRefresh is true, clear the lock and proceed anyway (for EditImage)
    if (forceRefresh && inFlightTypeLocks[generationType]) {
      console.log('[useHistoryLoader] ⚠️ Force refresh requested - clearing existing lock');
      inFlightTypeLocks[generationType] = false;
    }
    
    if (!forceRefresh && (loading || inFlightTypeLocks[generationType])) {
      console.log('[useHistoryLoader] ⚠️ refreshImmediate BLOCKED - loading:', loading, 'lock:', inFlightTypeLocks[generationType]);
      return;
    }
    
    console.log('[useHistoryLoader] ✅ refreshImmediate proceeding - FORCING API CALL - setting lock and dispatching...');
    inFlightTypeLocks[generationType] = true;
    lastLoadTimestamps[generationType] = Date.now();
    const genFilter: any = { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
    
    // Update filters first to ensure fresh state
    dispatch(setFilters(genFilter as any));
    
    console.log('[useHistoryLoader] Dispatching loadHistory with FORCE REFRESH:', {
      filters: genFilter,
      paginationParams: { limit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:refreshImmediate:${generationType}:${Date.now()}`,
      forceRefresh,
    });
    
    const dispatchPromise = (dispatch as any)(loadHistory({
      filters: genFilter,
      paginationParams: { limit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:refreshImmediate:${generationType}:${Date.now()}`,
      forceRefresh: forceRefresh, // Pass forceRefresh to thunk
    }));
    
    console.log('[useHistoryLoader] Dispatch promise created, waiting for completion...');
    
    dispatchPromise.finally(() => {
      console.log('[useHistoryLoader] loadHistory dispatch completed, releasing lock');
      inFlightTypeLocks[generationType] = false;
    }).catch((err: any) => {
      console.error('[useHistoryLoader] ❌ loadHistory dispatch error:', err);
      inFlightTypeLocks[generationType] = false;
    });
  }, [generationType, generationTypes, dispatch, loading, initialLimit]);

  return {
    refresh,
    refreshImmediate,
    loading,
    entries,
    lastLoadedAt: lastLoadTimestamps[generationType] || 0,
  };
};

export default useHistoryLoader;