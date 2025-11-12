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
    if (mountedRef.current) return; // only once per mount
    mountedRef.current = true;
    const norm = (t: string) => t.replace(/[_-]/g, '-').toLowerCase();
    const hasTypeEntries = entries.some((e: any) => norm(e.generationType || '') === norm(generationType));
    const filtersMatch = norm(String(currentFilters?.generationType || '')) === norm(generationType);
    if (!forceInitial && hasTypeEntries && filtersMatch) return; // already loaded
    if (inFlightTypeLocks[generationType]) return; // another component kicked off load
    inFlightTypeLocks[generationType] = true;
    lastLoadTimestamps[generationType] = Date.now();
    dispatch(setFilters({ generationType } as any));
    (dispatch as any)(loadHistory({
      filters: { generationType: generationType as any },
      paginationParams: { limit: initialLimit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:init:${generationType}:${Date.now()}`,
    })).finally(() => {
      inFlightTypeLocks[generationType] = false;
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
      (dispatch as any)(loadHistory({
        filters: { generationType: generationType as any },
        paginationParams: { limit },
        requestOrigin: 'page',
        expectedType: generationType,
        debugTag: `hook:refresh:${generationType}:${Date.now()}`,
      })).finally(() => {
        inFlightTypeLocks[generationType] = false;
        pendingRefreshRef.current = false;
      });
    }, debounceMs);
  }, [generationType, debounceMs, dispatch, loading, initialLimit]);

  // Immediate (non-debounced) refresh - still respects lock to prevent overlap
  const refreshImmediate = useCallback((limit: number = initialLimit) => {
    if (loading || inFlightTypeLocks[generationType]) return;
    inFlightTypeLocks[generationType] = true;
    lastLoadTimestamps[generationType] = Date.now();
    (dispatch as any)(loadHistory({
      filters: { generationType: generationType as any },
      paginationParams: { limit },
      requestOrigin: 'page',
      expectedType: generationType,
      debugTag: `hook:refreshImmediate:${generationType}:${Date.now()}`,
    })).finally(() => {
      inFlightTypeLocks[generationType] = false;
    });
  }, [generationType, dispatch, loading, initialLimit]);

  return {
    refresh,
    refreshImmediate,
    loading,
    entries,
    lastLoadedAt: lastLoadTimestamps[generationType] || 0,
  };
};

export default useHistoryLoader;