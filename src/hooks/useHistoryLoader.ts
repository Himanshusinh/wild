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
  sortOrder?: 'asc' | 'desc';
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
  sortOrder,
}: UseHistoryLoaderOptions) => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s: any) => s.history?.entries || []);
  const loading = useAppSelector((s: any) => s.history?.loading || false);
  const currentFilters = useAppSelector((s: any) => s.history?.filters || {});
  // Get current UI generation type to detect feature switches
  const currentUIGenerationType = useAppSelector((s: any) => s.ui?.currentGenerationType || 'text-to-image');

  const debounceRef = useRef<number | null>(null);
  const pendingRefreshRef = useRef(false);
  const mountedRef = useRef(false);
  const lastGenerationTypeRef = useRef<string>(generationType);
  const lastUIGenerationTypeRef = useRef<string>(currentUIGenerationType);

  // Guarded initial load - reload when generationType changes or when switching features
  useEffect(() => {
    const norm = (t: string) => t.replace(/[_-]/g, '-').toLowerCase();
    const entryMatchesMode = (e: any, wantedMode?: string): boolean => {
      if (!wantedMode) return true;
      const m = norm(String(wantedMode));
      const gt = norm(String(e?.generationType || ''));
      const hasImages = Array.isArray(e?.images) && e.images.length > 0;
      const hasVideos = Array.isArray((e as any)?.videos) && (e as any).videos.length > 0;
      const hasAudios = Array.isArray((e as any)?.audios) && (e as any).audios.length > 0;

      if (m === 'video') return gt.includes('video') || hasVideos;
      if (m === 'music') return gt.includes('music') || hasAudios;
      if (m === 'image') {
        // Image mode is "everything that's not video/music" and typically has images.
        // Fall back to generationType exclusion to handle older docs without media arrays.
        return (!gt.includes('video') && !gt.includes('music')) && (hasImages || gt.length > 0);
      }
      return true;
    };
    const normalizedCurrentUI = norm(currentUIGenerationType === 'image-to-image' ? 'text-to-image' : currentUIGenerationType);
    const normalizedHookType = norm(generationType);
    const normalizedLastUI = norm(lastUIGenerationTypeRef.current === 'image-to-image' ? 'text-to-image' : lastUIGenerationTypeRef.current);
    
    // Check if generation type changed (either hook param or UI switch)
    const generationTypeChanged = lastGenerationTypeRef.current !== generationType;
    
    // Check if UI switched to this feature (from a different feature back to this one)
    const switchedToThisFeature = normalizedCurrentUI === normalizedHookType && normalizedLastUI !== normalizedCurrentUI;
    
    // Check if UI switched away from this feature
    const switchedAwayFromThisFeature = normalizedLastUI === normalizedHookType && normalizedCurrentUI !== normalizedHookType && !generationTypes?.some(gt => norm(gt) === normalizedCurrentUI);
    
    // Check filters early to detect mismatches
    const currentFilterVal = currentFilters?.generationType;
    const currentFilterMode = currentFilters?.mode;
    const currentFilterSortOrder = (currentFilters as any)?.sortOrder;
    const wantedTypes = Array.isArray(generationTypes) && generationTypes.length > 0 ? generationTypes : [generationType];
    // If skipBackendGenerationFilter is enabled, generationType is intentionally not used as a filter.
    // In that case, treat "filtersMatch" as satisfied and rely on mode/sort checks.
    const filtersMatch = skipBackendGenerationFilter
      ? true
      : (Array.isArray(currentFilterVal)
      ? wantedTypes.every(w => (currentFilterVal as string[]).some((cv: string) => norm(cv) === norm(String(w))))
        : norm(String(currentFilterVal || '')) === norm(generationType));
    const sortOrderMatches = sortOrder ? currentFilterSortOrder === sortOrder : true;
    const modeMatches = mode ? norm(String(currentFilterMode || '')) === norm(mode) : true;
    
    // Check if filters are for a different type (e.g., video filters when we're on image page)
    // Video uses mode: 'video', image uses mode: 'image' or generationType, so check both
    const filtersAreForDifferentType = (currentFilterVal && !filtersMatch) || 
      (currentFilterMode && mode && norm(String(currentFilterMode)) !== norm(mode)) ||
      (currentFilterMode && !mode && currentFilterMode === 'video') ||
      !sortOrderMatches; // If sort order differs, reload with new ordering
    
    // If generation type changed, UI switched to/from this feature, or filters don't match, reset mounted state
    if (generationTypeChanged || switchedToThisFeature || (switchedAwayFromThisFeature && mountedRef.current) || filtersAreForDifferentType) {
      console.log('[useHistoryLoader] Generation type, UI, or filters changed, resetting mount state', {
        generationTypeChanged,
        switchedToThisFeature,
        switchedAwayFromThisFeature,
        filtersAreForDifferentType,
        oldType: lastGenerationTypeRef.current,
        newType: generationType,
        currentUI: normalizedCurrentUI,
        lastUI: normalizedLastUI,
        hookType: normalizedHookType,
        currentFilterMode,
        expectedMode: mode,
      });
      mountedRef.current = false;
      lastGenerationTypeRef.current = generationType;
    }
    
    // Update last UI type ref
    lastUIGenerationTypeRef.current = currentUIGenerationType;
    
    console.log('[useHistoryLoader] ========== INITIAL LOAD EFFECT ==========');
    
    // Check if date or search filters are active - if so, skip auto-reload (manual refresh is handling it)
    const currentFilterDateRange = (currentFilters as any)?.dateRange;
    const currentFilterSearch = (currentFilters as any)?.search;
    const hasDateFilter = currentFilterDateRange !== undefined && currentFilterDateRange !== null;
    const hasSearchFilter = currentFilterSearch !== undefined && currentFilterSearch !== null && String(currentFilterSearch).trim() !== '';
    const hasActiveFilters = hasDateFilter || hasSearchFilter;
    
    // EARLY RETURN: If date/search filters are active, skip auto-reload to prevent duplicate requests
    // Manual refresh (refreshHistoryFromBackend) is handling the load with correct filters
    if (hasActiveFilters && !forceInitial) {
      console.log('[useHistoryLoader] ⚠️ Date/search filters active, skipping auto-reload (manual refresh handling it)', {
        hasDateFilter,
        hasSearchFilter,
        currentFilterDateRange,
        currentFilterSearch,
      });
      return;
    }
    
    console.log('[useHistoryLoader] State check:', {
      mounted: mountedRef.current,
      entriesCount: entries.length,
      loading,
      forceInitial,
      generationType,
      generationTypes,
      currentUIGenerationType,
      switchedToThisFeature,
      filtersAreForDifferentType,
      inFlightLock: inFlightTypeLocks[generationType],
      hasActiveFilters,
    });
    
    // Check if we need to load (no entries or filters don't match) - if so, always load even if mounted
    const hasTypeEntries = skipBackendGenerationFilter
      ? entries.some((e: any) => entryMatchesMode(e, mode))
      : entries.some((e: any) => wantedTypes.some(w => norm(e.generationType || '') === norm(String(w))));
    const mustLoadDueToNoEntries = !hasTypeEntries;
    
    // If mounted but we have no entries or filters don't match, reset mounted state to force load
    if (mountedRef.current && !generationTypeChanged && !switchedToThisFeature && !filtersAreForDifferentType && !mustLoadDueToNoEntries) {
      console.log('[useHistoryLoader] ⚠️ Already mounted and no type/filter change, skipping initial load');
      return; // only once per mount unless type changed or filters don't match
    }
    
    // If we have no entries, always reset mounted state to ensure we load
    if (mustLoadDueToNoEntries && mountedRef.current) {
      console.log('[useHistoryLoader] ⚠️ No entries found, resetting mounted state to force load');
      mountedRef.current = false;
    }
    mountedRef.current = true;
    lastGenerationTypeRef.current = generationType;
    console.log('[useHistoryLoader] ✅ Mounted, proceeding with initial load check...');
    
    // IMPORTANT: If filters don't match or mode doesn't match, we MUST reload even if entries exist
    // This handles the case where we switch from video (mode: 'video') to image (mode: 'image' or no mode)
    const mustReloadDueToFilters = filtersAreForDifferentType || !filtersMatch || (mode && !modeMatches) || !sortOrderMatches;
    
    // CRITICAL: If we have no entries for this type, we MUST load (don't skip)
    // Also, if filters don't match, we MUST reload
    const mustLoad = !hasTypeEntries || mustReloadDueToFilters;
    
    // If generation type changed, UI switched to this feature, filters don't match, or no entries exist, force reload
    const shouldSkipInitial = !forceInitial && !generationTypeChanged && !switchedToThisFeature && !mustLoad && hasTypeEntries && filtersMatch && modeMatches;
    console.log('[useHistoryLoader] Initial load conditions:', {
      hasTypeEntries,
      filtersMatch,
      filtersAreForDifferentType,
      mustReloadDueToFilters,
      mustLoad,
      currentFilterVal,
      currentFilterMode,
      expectedMode: mode,
      forceInitial,
      modeMatches,
      generationTypeChanged,
      switchedToThisFeature,
      shouldSkip: shouldSkipInitial,
    });
    
    // Define genFilter early so it can be used in early return paths
    const genFilter: any = skipBackendGenerationFilter
      ? {}
      : { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
    if (mode) genFilter.mode = mode;
    if (sortOrder) genFilter.sortOrder = sortOrder;
    const backendFilters: any = skipBackendGenerationFilter ? { ...genFilter } : genFilter;
    
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
      forceRefresh: generationTypeChanged || switchedToThisFeature || mustReloadDueToFilters, // Force refresh when type changes, switching back, or filters/mode don't match
    }));
    
    console.log('[useHistoryLoader] Initial load dispatch promise created');
    
    dispatchPromise.finally(() => {
      console.log('[useHistoryLoader] Initial load dispatch completed, releasing lock');
      inFlightTypeLocks[generationType] = false;
    }).catch((err: any) => {
      console.error('[useHistoryLoader] ❌ Initial load dispatch error:', err);
      inFlightTypeLocks[generationType] = false;
    });
  }, [generationType, generationTypes, currentUIGenerationType, dispatch, initialLimit, mode, skipBackendGenerationFilter, forceInitial, entries, loading, currentFilters, entries.length, sortOrder]);

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
      const genFilter: any = skipBackendGenerationFilter
        ? {}
        : { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
      if (mode) genFilter.mode = mode;
      if (sortOrder) genFilter.sortOrder = sortOrder;
      const backendFilters: any = skipBackendGenerationFilter ? { ...genFilter } : genFilter;
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
  }, [generationType, generationTypes, debounceMs, dispatch, loading, initialLimit, mode, skipBackendGenerationFilter, sortOrder]);

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
      const genFilter: any = skipBackendGenerationFilter
        ? {}
        : { generationType: (generationTypes && generationTypes.length > 0) ? generationTypes : generationType };
    if (mode) genFilter.mode = mode;
    if (sortOrder) genFilter.sortOrder = sortOrder;
    const backendFilters: any = skipBackendGenerationFilter ? { ...genFilter } : genFilter;
    
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
  }, [generationType, generationTypes, dispatch, loading, initialLimit, mode, skipBackendGenerationFilter, sortOrder]);

  return {
    refresh,
    refreshImmediate,
    loading,
    entries,
    lastLoadedAt: lastLoadTimestamps[generationType] || 0,
  };
};

export default useHistoryLoader;