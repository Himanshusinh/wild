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
  mode?: string;
  skipBackendGenerationFilter?: boolean;
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
  mode,
  skipBackendGenerationFilter = false,
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
    const modeMatches = mode ? norm(String(currentFilters?.mode || '')) === norm(mode) : true;
    
    const shouldSkipInitial = !forceInitial && hasTypeEntries && filtersMatch && modeMatches;
    console.log('[useHistoryLoader] Initial load conditions:', {
      hasTypeEntries,
      filtersMatch,
      forceInitial,
      modeMatches,
      shouldSkip: shouldSkipInitial,
    });
    
    // Define genFilter early so it can be used in early return paths
    const genFilter: any = { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
    if (mode) genFilter.mode = mode;
    const backendFilters: any = skipBackendGenerationFilter ? { ...genFilter } : genFilter;
    if (skipBackendGenerationFilter) {
      delete backendFilters.generationType;
    }
    
    if (shouldSkipInitial) {
      console.log('[useHistoryLoader] ⚠️ Already loaded, skipping initial load');
      // Still set filters to ensure UI state is correct, but skip API call
      dispatch(setFilters(genFilter as any));
      return; // already loaded - cached data will show immediately
    }
    
    if (inFlightTypeLocks[generationType]) {
      console.log('[useHistoryLoader] ⚠️ Lock active, skipping initial load');
      return; // another component kicked off load
    }
    
    console.log('[useHistoryLoader] ✅ Proceeding with initial load - setting lock and dispatching...');
    inFlightTypeLocks[generationType] = true;
    lastLoadTimestamps[generationType] = Date.now();
    
    console.log('[useHistoryLoader] Dispatching setFilters and loadHistory with:', {
      filters: genFilter,
      backendFilters,
      paginationParams: { limit: initialLimit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:init:${generationType}:${Date.now()}`,
      skipBackendGenerationFilter,
    });
    
    dispatch(setFilters(genFilter as any));
    const dispatchPromise = (dispatch as any)(loadHistory({
      filters: genFilter,
      backendFilters,
      paginationParams: { limit: initialLimit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:init:${generationType}:${Date.now()}`,
      skipBackendGenerationFilter,
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
      if (mode) genFilter.mode = mode;
      const backendFilters: any = skipBackendGenerationFilter ? { ...genFilter } : genFilter;
      if (skipBackendGenerationFilter) delete backendFilters.generationType;
      (dispatch as any)(loadHistory({
        filters: genFilter,
        backendFilters,
        paginationParams: { limit },
        requestOrigin: 'page',
        expectedType: generationType,
        debugTag: `hook:refresh:${generationType}:${Date.now()}`,
        skipBackendGenerationFilter,
      })).finally(() => {
        inFlightTypeLocks[generationType] = false;
        pendingRefreshRef.current = false;
      });
    }, debounceMs);
  }, [generationType, generationTypes, debounceMs, dispatch, loading, initialLimit, mode, skipBackendGenerationFilter]);

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
    if (mode) genFilter.mode = mode;
    const backendFilters: any = skipBackendGenerationFilter ? { ...genFilter } : genFilter;
    if (skipBackendGenerationFilter) delete backendFilters.generationType;
    
    // Update filters first to ensure fresh state
    dispatch(setFilters(genFilter as any));
    
    console.log('[useHistoryLoader] Dispatching loadHistory with FORCE REFRESH:', {
      filters: genFilter,
      backendFilters,
      paginationParams: { limit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:refreshImmediate:${generationType}:${Date.now()}`,
      forceRefresh,
    });
    
    const dispatchPromise = (dispatch as any)(loadHistory({
      filters: genFilter,
      backendFilters,
      paginationParams: { limit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:refreshImmediate:${generationType}:${Date.now()}`,
      forceRefresh: forceRefresh, // Pass forceRefresh to thunk
      skipBackendGenerationFilter,
    }));
    
    console.log('[useHistoryLoader] Dispatch promise created, waiting for completion...');
    
    dispatchPromise.finally(() => {
      console.log('[useHistoryLoader] loadHistory dispatch completed, releasing lock');
      inFlightTypeLocks[generationType] = false;
    }).catch((err: any) => {
      console.error('[useHistoryLoader] ❌ loadHistory dispatch error:', err);
      inFlightTypeLocks[generationType] = false;
    });
  }, [generationType, generationTypes, dispatch, loading, initialLimit, mode, skipBackendGenerationFilter]);

  return {
    refresh,
    refreshImmediate,
    loading,
    entries,
    lastLoadedAt: lastLoadTimestamps[generationType] || 0,
  };
};

export default useHistoryLoader;